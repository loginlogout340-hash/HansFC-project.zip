'use strict';
/* ============================================================================================
   HANS FC ONLINE: one shared football world for everybody.
   - Uses the SAME game files as the Android app (data.js, engine.js, world.js), so results are identical.
   - Every player (a "manager") picks a real club. All the other clubs are run by the computer.
   - The world moves on one "week" every TICK_MINUTES. At each tick every manager's matches are played with
     the lineup and tactics they saved, money is paid, players recover, and the AI clubs play too.
   - Players can be online or offline: nothing needs to be open when the week is played.
   No npm packages needed. Node 18 or newer.
   ============================================================================================ */
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib'), crypto = require('crypto');

const CFG = {
  port: +process.env.PORT || 3000,
  dataDir: process.env.DATA_DIR || path.join(__dirname, 'data'),
  gameDir: process.env.GAME_DIR || __dirname,
  tickMs: process.env.TICK_SECONDS ? Math.max(1, +process.env.TICK_SECONDS) * 1000 : Math.max(1, +(process.env.TICK_MINUTES || 360)) * 60000,
  adminKey: process.env.ADMIN_KEY || '',
  maxUsers: +process.env.MAX_USERS || 60,
  idleDays: +process.env.IDLE_DAYS || 30,
  pauseIfEmpty: process.env.PAUSE_IF_EMPTY !== 'off',
  name: process.env.LEAGUE_NAME || 'HANS FC Online League',
};

let H = null;            // the game engine (window.HFC in the app, global.HFC here)
let guard = null;        // set of club ids whose players must not be moved by the AI while the world is simulated

function loadEngine(dir) {
  ['data.js', 'engine.js', 'world.js'].forEach(function (f) { require(path.join(dir, f)); });
  H = global.HFC;
  if (!H.__mpGuard) {
    const orig = H.moveTo;
    H.moveTo = function (G, p, cid) {
      if (guard && ((p.cl != null && guard.has(p.cl)) || (cid != null && guard.has(cid)))) return;
      return orig.apply(this, arguments);
    };
    H.__mpGuard = true;
  }
  return H;
}

class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status || 400; } }
const bad = (m, s) => { throw new ApiError(m, s); };
const num = (v, lo, hi, def) => { v = Number(v); if (!isFinite(v)) return def; return Math.max(lo, Math.min(hi, v)); };
const int = (v, lo, hi, def) => Math.round(num(v, lo, hi, def));
const r1 = (v, d) => { const k = Math.pow(10, d || 0); return Math.round(v * k) / k; };
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 60);
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const emptyWk = () => ({ gate: 0, tv: 0, spons: 0, comm: 0, prize: 0, wages: 0, upkeep: 0, build: 0, fees: 0, other: 0 });
const emptyTot = () => ({ inc: { gate: 0, tv: 0, spons: 0, comm: 0, prize: 0, sales: 0 }, exp: { wages: 0, upkeep: 0, build: 0, buys: 0 } });
/* the parts of the game state that belong to ONE manager. They are swapped in and out around every action. */
const PER = ['formation', 'mentality', 'style', 'press', 'train', 'slots', 'bench', 'wk', 'tot', 'board', 'sponsor', 'sponsorOffers', 'build', 'offers', 'news', 'fin', 'harm', 'cupRound', 'ccRound', 'obj'];
const MAXSQ = 38;

class World {
  constructor(cfg) {
    this.cfg = cfg; this.M = null; this.G = null; this.tokens = new Map(); this.saveT = null; this.lastTickError = null;
  }

  /* ------------------------------- creating, saving, loading ------------------------------- */
  file(n) { return path.join(this.cfg.dataDir, n); }
  create() {
    const G = H.newCareer('League', 0);
    this.G = G;
    this.M = { v: 1, rev: 1, tickAt: Date.now() + this.cfg.tickMs, nextH: 1, nextMsg: 1, nextMkt: 1, S: G.S, humans: {}, mkt: [], chat: { global: [] }, feed: [], banned: [], created: Date.now() };
    this.feedAdd('The league is open. Pick a club and join!', 'b');
    this.indexTokens();
  }
  serialize() { return JSON.stringify(this.M); }
  save() {
    try {
      fs.mkdirSync(this.cfg.dataDir, { recursive: true });
      const tmp = this.file('world.tmp'), cur = this.file('world.json');
      fs.writeFileSync(tmp, this.serialize());
      if (fs.existsSync(cur)) { try { fs.copyFileSync(cur, this.file('world.prev.json')); } catch (e) { /* ignore */ } }
      fs.renameSync(tmp, cur);
      return true;
    } catch (e) { console.error('save failed:', e.message); return false; }
  }
  dirty() { if (this.saveT) return; this.saveT = setTimeout(() => { this.saveT = null; this.save(); }, 3000); if (this.saveT.unref) this.saveT.unref(); }
  loadFrom(text) {
    const M = JSON.parse(text);
    if (!M || M.v !== 1 || !M.S || M.S.v !== 2) throw new Error('bad save file');
    this.M = M; this.G = H.makeGame(M.S); this.indexTokens();
  }
  load() {
    for (const n of ['world.json', 'world.prev.json']) {
      try { if (fs.existsSync(this.file(n))) { this.loadFrom(fs.readFileSync(this.file(n), 'utf8')); console.log('loaded', n, 'season', this.G.S.year, 'week', this.G.S.week); return true; } } catch (e) { console.error('could not load', n, e.message); }
    }
    return false;
  }
  boot() { if (!this.load()) { this.create(); this.save(); console.log('created a new world'); } }
  indexTokens() {
    this.tokens = new Map();
    Object.keys(this.M.humans).forEach((id) => { const h = this.M.humans[id]; (h.tokens || []).forEach((t) => this.tokens.set(t, id)); });
  }

  /* ------------------------------- small helpers ------------------------------- */
  get S() { return this.G.S; }
  humans() { return Object.keys(this.M.humans).map((k) => this.M.humans[k]); }
  active() { return this.humans().filter((h) => h.cid != null); }
  humanOfClub(cid) { const a = this.active(); for (let i = 0; i < a.length; i++) if (a[i].cid === cid) return a[i]; return null; }
  claimedSet() { return new Set(this.active().map((h) => h.cid)); }
  pickDummy() { const c = this.claimedSet(); for (let i = 0; i < this.S.clubs.length; i++) if (!c.has(i)) return i; return 0; }
  feedAdd(text, k) {
    const S = this.G ? this.G.S : { week: 0, year: 2026 };
    this.M.feed.unshift({ id: this.M.rev * 1000 + this.M.feed.length, ts: Date.now(), w: S.week, y: S.year, t: text, k: k || 'n' });
    if (this.M.feed.length > 80) this.M.feed.length = 80;
  }
  withHuman(h, fn) {
    const S = this.G.S, saved = { uid: S.uid };
    PER.forEach((k) => { saved[k] = S[k]; });
    S.uid = h.cid; PER.forEach((k) => { S[k] = h.st[k]; });
    try { return fn(S, this.G, S.clubs[h.cid]); }
    finally { PER.forEach((k) => { h.st[k] = S[k]; }); PER.forEach((k) => { S[k] = saved[k]; }); S.uid = saved.uid; }
  }
  pl(p) {
    return { id: p.id, n: p.n, pos: p.pos, o: p.o, p: p.p, a: p.a, nat: p.nat, ft: p.ft, mo: p.mo, inj: p.inj, sus: p.sus, v: r1(p.v, 3), w: r1(p.w, 5), ct: p.ct, g: p.g, as: p.as, ap: p.ap, yth: p.yth ? 1 : 0, lst: p.lst ? 1 : 0, rt: p.rn ? r1(p.rs / p.rn, 1) : 0 };
  }
  makeObj(cid) {
    const G = this.G, S = G.S, uc = S.clubs[cid], lg = uc.lg;
    const order = H.lgClubs(G, lg).slice().sort((a, b) => (b.str + b.rep * 0.12) - (a.str + a.rep * 0.12));
    const exp = order.map((c) => c.id).indexOf(uc.id) + 1, n = order.length;
    const target = Math.max(1, Math.round(exp * 0.85));
    const lgText = target === 1 ? 'Win the league' : target <= 4 ? 'Finish in the top ' + target : target <= Math.ceil(n / 2) ? 'Finish in the top half (top ' + target + ')' : 'Finish in the top ' + target;
    const cupRounds = S.cup[lg].alive.length <= 16 ? 4 : 5;
    const cupT = exp <= 3 ? cupRounds - 1 : exp <= 8 ? 2 : 1;
    const cupText = cupT >= cupRounds - 1 ? 'Reach the cup final' : cupT >= 2 ? 'Win two rounds in the cup' : 'Win at least one cup round';
    const o = { target, exp, text: lgText, cup: cupT, cupText };
    if (S.cc.teams.indexOf(uc.id) >= 0) { o.cc = uc.rep >= 90 ? 3 : uc.rep >= 85 ? 2 : 1; o.ccText = o.cc >= 3 ? 'Reach the Champions Cup semi-finals' : o.cc === 2 ? 'Reach the Champions Cup quarter-finals' : 'Get out of the Champions Cup round of 16'; }
    return o;
  }
  makeSponsorOffers(cid) {
    const uc = this.S.clubs[cid], annual = uc.revW * H.LAST_WEEK, pick = H.util.pick;
    return [
      { name: pick(H.SPONSORS), mult: 0.95, bonus: 0, need: 99, label: 'Safe deal', desc: 'Steady money, no strings.' },
      { name: pick(H.SPONSORS), mult: 1.12, bonus: annual * 0.02, need: 8, label: 'Balanced deal', desc: 'More money, bonus for a top-8 finish.' },
      { name: pick(H.SPONSORS), mult: 1.3, bonus: annual * 0.06, need: 3, label: 'Ambitious deal', desc: 'Big money, but the bonus needs a top-3 finish.' },
    ];
  }
  freshState(club) {
    return { formation: club.fm, mentality: 'balanced', style: 'possession', press: 'medium', train: 2, slots: new Array(11).fill(null), bench: [], wk: emptyWk(), tot: emptyTot(), board: { conf: 60 }, sponsor: null, sponsorOffers: [], build: [], offers: [], news: [], fin: [], harm: 0, cupRound: 0, ccRound: -1, obj: null };
  }

  /* ------------------------------- accounts ------------------------------- */
  newToken(h) {
    const t = crypto.randomBytes(24).toString('hex');
    h.tokens = (h.tokens || []).slice(-4); h.tokens.push(sha(t)); this.tokens.set(sha(t), h.id);
    return t;
  }
  hashPass(pass, salt) { return crypto.scryptSync(String(pass), salt, 32).toString('hex'); }
  register(name, pass, ip) {
    name = clean(name, 18); pass = String(pass || '');
    if (name.length < 3) bad('Pick a name with at least 3 letters.');
    if (!/^[\p{L}\p{N} _.\-]+$/u.test(name)) bad('Use only letters, numbers, spaces, dots, dashes and underscores in your name.');
    if (pass.length < 4) bad('Pick a password with at least 4 characters.');
    const key = name.toLowerCase();
    if (this.M.banned.indexOf(key) >= 0) bad('That name is not allowed.', 403);
    if (this.humans().some((h) => h.key === key)) bad('That name is taken. Try another one.', 409);
    if (this.humans().length >= this.cfg.maxUsers) bad('The league is full for now.', 503);
    const salt = crypto.randomBytes(12).toString('hex');
    const h = { id: 'h' + (this.M.nextH++), name, key, salt, hash: this.hashPass(pass, salt), tokens: [], cid: null, created: Date.now(), seen: Date.now(), st: null, reports: [], trophies: [], hist: [], muted: 0, lastMsg: 0 };
    this.M.humans[h.id] = h;
    const token = this.newToken(h);
    this.dirty();
    return { token, me: this.brief(h) };
  }
  login(name, pass) {
    const key = clean(name, 18).toLowerCase();
    const h = this.humans().filter((x) => x.key === key)[0];
    if (!h) bad('Wrong name or password.', 401);
    const a = Buffer.from(this.hashPass(pass, h.salt)), b = Buffer.from(h.hash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) bad('Wrong name or password.', 401);
    h.seen = Date.now();
    const token = this.newToken(h); this.dirty();
    return { token, me: this.brief(h) };
  }
  auth(token) {
    const id = this.tokens.get(sha(token || ''));
    const h = id && this.M.humans[id];
    if (!h) bad('Please log in again.', 401);
    h.seen = Date.now();
    return h;
  }
  brief(h) { return { id: h.id, name: h.name, cid: h.cid, club: h.cid != null ? this.S.clubs[h.cid].name : null }; }
  needClub(h) { if (h.cid == null) bad('Pick a club first.', 409); }

  /* ------------------------------- clubs ------------------------------- */
  info() {
    const S = this.S, M = this.M;
    return { name: this.cfg.name, year: S.year, season: S.seasonNo, week: S.week, last: H.LAST_WEEK, stage: S.stage, tickAt: M.tickAt, tickMs: this.cfg.tickMs, now: Date.now(), window: H.windowOpen(this.G), users: this.humans().length, managers: this.active().length, maxUsers: this.cfg.maxUsers, news: M.feed.slice(0, 25), champions: this.champsList() };
  }
  champsList() {
    const out = []; this.humans().forEach((h) => (h.trophies || []).forEach((t) => out.push({ n: h.name, y: t.y, t: t.t, c: t.c })));
    return out.sort((a, b) => b.y - a.y).slice(0, 12);
  }
  clubs() {
    const S = this.S, own = {};
    this.active().forEach((h) => { own[h.cid] = h.name; });
    return { leagues: H.LEAGUES.map((l) => ({ id: l.id, name: l.name, flag: l.flag })), clubs: S.clubs.map((c) => ({ id: c.id, name: c.name, lg: c.lg, col: c.col, rep: c.rep, cap: c.cap, str: c.str, tier: H.tierName(c), mgr: own[c.id] || null })) };
  }
  claim(h, cid) {
    if (h.cid != null) bad('You already manage a club. Leave it first.', 409);
    cid = int(cid, 0, 1e6, -1);
    const club = this.S.clubs[cid]; if (!club) bad('Club not found.', 404);
    if (this.humanOfClub(cid)) bad('Another manager already has that club.', 409);
    if (this.active().length >= this.S.clubs.length - 1) bad('No free clubs left.', 503);
    h.cid = cid; h.st = this.freshState(club); h.reports = [];
    this.withHuman(h, (S, G, uc) => {
      H.autoLineup(G);
      S.sponsorOffers = this.makeSponsorOffers(cid);
      S.obj = this.makeObj(cid);
      H.news(G, 'Welcome to ' + uc.name + ', ' + h.name + '! The board expects: ' + S.obj.text + '.', 'b');
    });
    this.feedAdd(h.name + ' takes charge of ' + club.name + '.', 'b');
    this.M.rev++; this.dirty();
    return this.me(h);
  }
  leave(h) {
    this.needClub(h);
    const name = this.S.clubs[h.cid].name;
    this.M.mkt = this.M.mkt.filter((l) => l.seller !== h.id);
    h.cid = null; h.st = null; h.reports = [];
    this.feedAdd(h.name + ' has left ' + name + '.', 'n');
    this.M.rev++; this.dirty();
    return { ok: true };
  }

  /* ------------------------------- what the app shows ------------------------------- */
  worldBrief() {
    const S = this.S, M = this.M;
    return { year: S.year, season: S.seasonNo, week: S.week, last: H.LAST_WEEK, stage: S.stage, tickAt: M.tickAt, tickMs: this.cfg.tickMs, now: Date.now(), window: H.windowOpen(this.G) };
  }
  clubBrief(c) {
    return { id: c.id, name: c.name, lg: c.lg, col: c.col, rep: c.rep, cap: c.cap, str: c.str, tier: H.tierName(c), cash: r1(c.cash, 3), fm: c.fm, fac: c.fac, fac0: c.fac0, revW: r1(c.revW, 4), ttl: c.ttl || 0 };
  }
  me(h) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const squad = G.SQ[uc.id].map((p) => this.pl(p));
      const fx = H.pending(G).map((f) => ({ name: f.name, kind: f.kind, h: f.h, a: f.a, hn: S.clubs[f.h].name, an: S.clubs[f.a].name, hs: S.clubs[f.h].str, as: S.clubs[f.a].str }));
      const inc = H.weeklyIncome(G, uc);
      const facs = H.FAC.map((f, i) => ({ i, name: f.name, icon: f.icon, desc: f.desc, level: uc.fac[i], base: uc.fac0[i], cost: r1(H.facCost(uc, i), 3), weeks: H.facWeeks(uc, i), busy: (S.build.filter((b) => b.i === i)[0] || {}).wk || 0 }));
      const renew = squad.filter((p) => p.ct <= 1).map((p) => { const a = H.renewAsk(G, G.P[p.id]); return { id: p.id, wage: r1(a.wage, 5), refuse: a.refuse }; });
      return {
        me: this.brief(h), world: this.worldBrief(), club: this.clubBrief(uc), squad,
        st: { formation: S.formation, mentality: S.mentality, style: S.style, press: S.press, train: S.train, slots: S.slots.slice(), bench: S.bench.slice() },
        fixtures: fx, objective: S.obj, board: Math.round(S.board.conf), sponsor: S.sponsor, sponsorOffers: S.sponsorOffers,
        fin: { cash: r1(uc.cash, 3), fin: S.fin, tot: S.tot, wages: r1(H.wageBill(G, uc.id), 5), upkeep: r1(H.upkeep(uc), 5), income: { tv: r1(inc.tv, 5), spons: r1(inc.spons, 5), comm: r1(inc.comm, 5) } },
        facilities: facs, renew,
        offers: S.offers.filter((o) => G.P[o.pid]).map((o) => ({ pid: o.pid, n: G.P[o.pid].n, from: o.from, fromName: S.clubs[o.from].name, fee: r1(o.fee, 3), w: o.w })),
        news: S.news.slice(0, 30), reports: h.reports.map((r, i) => ({ i, w: r.w, y: r.y, comp: r.comp, home: r.home, away: r.away, score: r.score, pens: r.pens })),
        trophies: h.trophies, hist: h.hist, listed: this.M.mkt.filter((l) => l.seller === h.id).map((l) => ({ pid: l.pid, price: l.price })),
      };
    });
  }
  report(h, i) { this.needClub(h); const r = h.reports[int(i, 0, 99, 0)]; if (!r) bad('No such match.', 404); return r; }
  leagueView(lgId, h) {
    const G = this.G, S = G.S;
    if (!lgId && h && h.cid != null) lgId = S.clubs[h.cid].lg;
    if (!S.lg[lgId]) bad('League not found.', 404);
    const own = {}; this.active().forEach((x) => { own[x.cid] = x.name; });
    const table = H.table(G, lgId).map((r, i) => ({ pos: i + 1, id: r.id, name: r.name, col: r.col, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts, mgr: own[r.id] || null, me: !!(h && h.cid === r.id) }));
    const L = S.lg[lgId], nm = (id) => S.clubs[id].name;
    const map = (rd) => (rd || []).map((f) => ({ h: f[0], a: f[1], hn: nm(f[0]), an: nm(f[1]), hg: f[2] >= 0 ? f[2] : null, ag: f[3] >= 0 ? f[3] : null, hm: own[f[0]] || null, am: own[f[1]] || null }));
    const cup = S.cup[lgId], cc = S.cc;
    const scorers = S.players.filter((p) => p.cl != null && S.clubs[p.cl].lg === lgId && p.g > 0).sort((a, b) => (b.g - a.g) || (b.as - a.as)).slice(0, 8).map((p) => ({ n: p.n, club: nm(p.cl), g: p.g, as: p.as }));
    return {
      lg: lgId, name: H.lgOf(lgId).name, week: S.week, table,
      last: map(L.rounds[S.week - 2]), next: map(L.rounds[S.week - 1]),
      cup: { name: cup.name, round: cup.round, alive: cup.alive.length, winner: cup.winner != null ? nm(cup.winner) : null, ties: (cup.ties || []).filter((t) => t.a >= 0).map((t) => ({ hn: nm(t.h), an: nm(t.a), g: t.g, w: t.w != null ? nm(t.w) : null, pen: t.pen, hm: own[t.h] || null, am: own[t.a] || null })) },
      cc: { round: cc.round, name: H.CCN[Math.min(cc.round, 3)], over: cc.over, winner: cc.winner != null ? nm(cc.winner) : null, teams: cc.teams.map((id) => ({ id, name: nm(id), mgr: own[id] || null, alive: cc.alive.indexOf(id) >= 0 })), ties: (cc.ties || []).map((t) => ({ an: nm(t.a), bn: nm(t.b), g: t.g, w: t.w != null ? nm(t.w) : null, am: own[t.a] || null, bm: own[t.b] || null })) },
      scorers,
    };
  }
  hall() {
    const G = this.G, S = G.S, tabs = {};
    return this.active().map((h) => {
      const c = S.clubs[h.cid]; if (!tabs[c.lg]) tabs[c.lg] = H.table(G, c.lg);
      const t = tabs[c.lg]; let pos = 0, row = null; t.forEach((r, i) => { if (r.id === c.id) { pos = i + 1; row = r; } });
      return { name: h.name, club: c.name, lg: c.lg, pos, pts: row ? row.pts : 0, p: row ? row.p : 0, trophies: (h.trophies || []).length, rep: c.rep, str: c.str, seen: h.seen };
    }).sort((a, b) => (b.trophies - a.trophies) || (a.pos - b.pos) || (b.pts - a.pts));
  }

  /* ------------------------------- lineup and tactics ------------------------------- */
  setLineup(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const fm = String(b.formation || S.formation);
      if (!H.FORMATIONS[fm]) bad('Unknown formation.');
      const ment = String(b.mentality || S.mentality), sty = String(b.style || S.style), pr = String(b.press || S.press);
      if (H.MENTALITY.indexOf(ment) < 0 || H.STYLE.indexOf(sty) < 0 || H.PRESS.indexOf(pr) < 0) bad('Unknown tactic.');
      const tr = int(b.train == null ? S.train : b.train, 1, 3, 2);
      let slots = Array.isArray(b.slots) ? b.slots.slice(0, 11) : S.slots.slice();
      while (slots.length < 11) slots.push(null);
      const bench = Array.isArray(b.bench) ? b.bench.slice(0, 9) : S.bench.slice();
      const seen = {};
      const okId = (id) => { if (id == null) return null; id = int(id, 0, 1e9, -1); const p = G.P[id]; if (!p || p.cl !== uc.id) bad('A player in your lineup is not at your club.'); if (seen[id]) bad('A player is picked twice.'); seen[id] = 1; return id; };
      slots = slots.map(okId);
      const bn = bench.map(okId).filter((x) => x != null);
      S.formation = fm; S.mentality = ment; S.style = sty; S.press = pr; S.train = tr; S.slots = slots; S.bench = bn;
      H.fixLineup(G);
      this.dirty();
      return { ok: true, st: { formation: S.formation, mentality: S.mentality, style: S.style, press: S.press, train: S.train, slots: S.slots.slice(), bench: S.bench.slice() } };
    });
  }

  /* ------------------------------- transfers ------------------------------- */
  players(h, q) {
    this.needClub(h);
    const S = this.S, G = this.G, own = {}, listed = {};
    this.active().forEach((x) => { own[x.cid] = x.name; });
    this.M.mkt.forEach((l) => { listed[l.pid] = l; });
    const text = clean(q.q, 30).toLowerCase(), pos = String(q.pos || 'all'), lg = String(q.lg || 'all');
    const minO = int(q.minO, 0, 99, 0), maxA = int(q.maxA, 0, 60, 0), maxV = q.maxV == null || q.maxV === '' ? null : num(q.maxV, 0, 1e4, null);
    const fa = q.fa === '1' || q.fa === 1 || q.fa === true, sort = q.sort === 'pot' ? 'p' : q.sort === 'val' ? 'v' : 'o';
    const page = int(q.page, 0, 200, 0), per = 25, out = [];
    S.players.forEach((p) => {
      if (p.cl === h.cid || p.del) return;
      if (fa && p.cl != null) return;
      if (text && p.n.toLowerCase().indexOf(text) < 0 && (p.cl == null || S.clubs[p.cl].name.toLowerCase().indexOf(text) < 0)) return;
      if (pos !== 'all' && H.GROUP[p.pos] !== pos && p.pos !== pos) return;
      if (lg !== 'all' && (p.cl == null || S.clubs[p.cl].lg !== lg)) return;
      if (minO && p.o < minO) return;
      if (maxA && p.a > maxA) return;
      if (maxV != null && p.v > maxV) return;
      out.push(p);
    });
    out.sort((a, b) => (b[sort] - a[sort]) || (b.o - a.o));
    const slice = out.slice(page * per, page * per + per).map((p) => {
      const x = this.pl(p); x.cl = p.cl; x.cn = p.cl != null ? S.clubs[p.cl].name : null;
      x.mgr = p.cl != null ? own[p.cl] || null : null;
      x.ask = p.cl != null ? r1(H.askPrice(G, p), 3) : 0;
      const l = listed[p.id]; x.price = l ? r1(l.price, 3) : null;
      return x;
    });
    return { total: out.length, page, per, list: slice };
  }
  playerAsk(h, pid) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const p = G.P[int(pid, 0, 1e9, -1)]; if (!p) bad('Player not found.', 404);
      const a = H.contractAsk(G, p, uc), x = this.pl(p);
      x.cl = p.cl; x.cn = p.cl != null ? S.clubs[p.cl].name : null; x.ask = p.cl != null ? r1(H.askPrice(G, p), 3) : 0;
      x.wage = r1(a.wage, 5); x.refuse = a.refuse; x.window = H.windowOpen(G); x.mgr = p.cl != null && this.humanOfClub(p.cl) ? this.humanOfClub(p.cl).name : null;
      return x;
    });
  }
  bid(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const p = G.P[int(b.pid, 0, 1e9, -1)]; if (!p) bad('Player not found.', 404);
      if (p.cl === uc.id) bad('He already plays for you.');
      const other = p.cl != null ? this.humanOfClub(p.cl) : null;
      if (other) bad('He plays for ' + other.name + '. Check the Market for players they have listed.');
      const fee = p.cl == null ? 0 : num(b.fee, 0, 1e4, 0), wage = num(b.wage, 0, 100, 0), years = int(b.years, 1, 5, 3);
      const r = H.bid(G, p.id, fee);
      if (!r.ok) return { status: r.status || 'no', msg: r.msg, ask: r.ask != null ? r1(r.ask, 3) : null };
      const err = H.signPlayer(G, p.id, fee, wage, years);
      if (err) return { status: 'refused', msg: err };
      this.M.rev++; this.dirty();
      return { status: 'signed', msg: 'Signed ' + p.n + '!' };
    });
  }
  offerAnswer(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G) => {
      const i = S.offers.findIndex((o) => o.pid === int(b.pid, 0, 1e9, -1)); if (i < 0) bad('That offer is gone.', 404);
      const o = S.offers[i];
      if (b.accept) {
        const err = H.sellPlayer(G, o.pid, o.fee, o.from);
        if (err) return { ok: false, msg: err };
        S.offers.splice(i, 1); this.M.mkt = this.M.mkt.filter((l) => l.pid !== o.pid);
        this.M.rev++; this.dirty(); return { ok: true, msg: 'Sold.' };
      }
      S.offers.splice(i, 1); this.dirty(); return { ok: true, msg: 'Offer rejected.' };
    });
  }
  transferList(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const p = G.P[int(b.pid, 0, 1e9, -1)]; if (!p || p.cl !== uc.id) bad('Not your player.');
      p.lst = !!b.on; this.dirty(); return { ok: true, lst: p.lst ? 1 : 0 };
    });
  }
  release(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const err = H.releasePlayer(G, int(b.pid, 0, 1e9, -1));
      if (err) return { ok: false, msg: err };
      this.M.mkt = this.M.mkt.filter((l) => !(l.seller === h.id && !G.P[l.pid]));
      this.M.rev++; this.dirty(); return { ok: true };
    });
  }
  renew(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G, uc) => {
      const p = G.P[int(b.pid, 0, 1e9, -1)]; if (!p || p.cl !== uc.id) bad('Not your player.');
      const err = H.renewPlayer(G, p.id, num(b.wage, 0, 100, 0), int(b.years, 1, 5, 3));
      if (err) return { ok: false, msg: err };
      this.dirty(); return { ok: true };
    });
  }
  market() {
    const S = this.S, G = this.G, out = [];
    this.M.mkt.forEach((l) => {
      const p = G.P[l.pid], s = this.M.humans[l.seller]; if (!p || !s || s.cid == null || p.cl !== s.cid) return;
      const x = this.pl(p); x.price = r1(l.price, 3); x.seller = s.name; x.sellerClub = S.clubs[s.cid].name; x.w0 = l.w; out.push(x);
    });
    return { list: out.sort((a, b) => b.o - a.o) };
  }
  marketList(h, b) {
    this.needClub(h);
    const G = this.G, p = G.P[int(b.pid, 0, 1e9, -1)];
    if (!p || p.cl !== h.cid) bad('Not your player.');
    this.M.mkt = this.M.mkt.filter((l) => l.pid !== p.id);
    if (b.price != null && b.price !== '') {
      const price = num(b.price, 0.001, 1e4, 0);
      if (!price) bad('Set a price.');
      if (this.M.mkt.filter((l) => l.seller === h.id).length >= 6) bad('You can list at most 6 players.');
      this.M.mkt.push({ id: this.M.nextMkt++, pid: p.id, seller: h.id, price, w: this.S.week });
    }
    this.dirty(); return { ok: true };
  }
  marketBuy(h, b) {
    this.needClub(h);
    const G = this.G, S = G.S, pid = int(b.pid, 0, 1e9, -1);
    const l = this.M.mkt.filter((x) => x.pid === pid)[0], p = G.P[pid];
    if (!l || !p) bad('That listing is gone.', 404);
    const seller = this.M.humans[l.seller];
    if (!seller || seller.cid == null || p.cl !== seller.cid) { this.M.mkt = this.M.mkt.filter((x) => x !== l); bad('That listing is gone.', 404); }
    if (seller.id === h.id) bad('That is your own player.');
    if (!H.windowOpen(G)) bad('The transfer window is closed.');
    const bc = S.clubs[h.cid], sc = S.clubs[seller.cid];
    if (bc.cash < l.price) bad('You cannot afford that.');
    if (G.SQ[h.cid].length >= MAXSQ) bad('Your squad is full.');
    if (G.SQ[seller.cid].length <= 18) bad('That club cannot sell: it has too few players.');
    bc.cash -= l.price; sc.cash += l.price;
    H.moveTo(G, p, h.cid); p.mo = 75;
    this.withHuman(h, (SS, GG) => { SS.wk.fees += l.price; SS.tot.exp.buys += l.price; H.news(GG, 'Signed ' + p.n + ' (' + p.pos + ', ' + p.o + ') from ' + sc.name + ' for ' + H.fm(l.price) + '.', 'g'); H.fixLineup(GG); });
    this.withHuman(seller, (SS, GG) => { SS.tot.inc.sales += l.price; H.news(GG, h.name + ' bought ' + p.n + ' for ' + H.fm(l.price) + '.', 'g'); H.fixLineup(GG); });
    this.M.mkt = this.M.mkt.filter((x) => x.pid !== pid);
    this.feedAdd(h.name + ' bought ' + p.n + ' (' + p.o + ') from ' + seller.name + ' for ' + H.fm(l.price) + '.', 't');
    this.M.rev++; this.dirty();
    return { ok: true, msg: 'Signed ' + p.n + '!' };
  }

  /* ------------------------------- club business ------------------------------- */
  build(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G) => { const err = H.startBuild(G, int(b.i, 0, 4, 0)); this.dirty(); return err ? { ok: false, msg: err } : { ok: true }; });
  }
  sponsor(h, b) {
    this.needClub(h);
    return this.withHuman(h, (S, G) => {
      if (!S.sponsorOffers || !S.sponsorOffers.length) bad('No sponsor offers right now.');
      H.chooseSponsor(G, int(b.i, 0, 2, 0)); this.dirty(); return { ok: true };
    });
  }

  /* ------------------------------- chat ------------------------------- */
  chatGet(ch, after) {
    ch = this.chanOk(ch);
    const arr = this.M.chat[ch] || [];
    after = int(after, 0, 1e12, 0);
    return { ch, list: arr.filter((m) => m.id > after).slice(-60) };
  }
  chanOk(ch) { ch = String(ch || 'global'); if (ch !== 'global' && !H.LEAGUES.some((l) => l.id === ch)) bad('No such chat.'); return ch; }
  chatPost(h, b) {
    const ch = this.chanOk(b.ch), text = clean(b.text, 180);
    if (!text) bad('Write something first.');
    if (h.muted && h.muted > Date.now()) bad('You are muted for now.', 403);
    if (Date.now() - (h.lastMsg || 0) < 2000) bad('Slow down a little.', 429);
    h.lastMsg = Date.now();
    const arr = this.M.chat[ch] = this.M.chat[ch] || [];
    const m = { id: this.M.nextMsg++, ts: Date.now(), n: h.name, c: h.cid != null ? this.S.clubs[h.cid].name : '', m: text };
    arr.push(m); if (arr.length > 150) arr.splice(0, arr.length - 150);
    this.dirty(); return { ok: true, id: m.id };
  }

  /* ------------------------------- the weekly tick ------------------------------- */
  tickDue() { return Date.now() >= this.M.tickAt; }
  maybeTick() {
    if (!this.tickDue()) return false;
    if (this.cfg.pauseIfEmpty && this.active().length === 0) { this.M.tickAt = Date.now() + this.cfg.tickMs; return false; }
    this.tickSafe(); return true;
  }
  tickSafe() {
    const before = this.serialize();
    try { this.tick(); this.save(); this.lastTickError = null; return true; }
    catch (e) {
      console.error('TICK FAILED, rolling back:', e && e.stack || e);
      this.lastTickError = String(e && e.message || e);
      try { this.loadFrom(before); this.M.tickAt = Date.now() + 60000; } catch (e2) { console.error('rollback failed', e2); }
      return false;
    }
  }
  tick() {
    const S = this.S;
    this.M.rev++;
    this.expireInactive();
    if (S.stage === 'pre') this.beginSeasonTick();
    else if (S.stage === 'week') this.playWeek();
    else if (S.stage === 'end') this.rollSeason();
    else bad('World in a strange state: ' + S.stage, 500);
    this.M.tickAt = Date.now() + this.cfg.tickMs;
    this.flushNews();
  }
  flushNews() {
    const S = this.S;
    /* only league-wide stories go to the public feed (the computer's own club business stays out of it) */
    S.news.splice(0).reverse().forEach((n) => { if (/moves from|win the|Player of the Year|retires/.test(n.t)) this.feedAdd(n.t, n.k); });
    S.unread = 0;
  }
  expireInactive() {
    const cut = Date.now() - this.cfg.idleDays * 86400000;
    this.active().forEach((h) => { if (h.seen < cut) { this.feedAdd(h.name + ' was away too long and left ' + this.S.clubs[h.cid].name + '.', 'n'); this.M.mkt = this.M.mkt.filter((l) => l.seller !== h.id); h.cid = null; h.st = null; } });
  }
  setDummy() {
    const S = this.S, d = this.pickDummy();
    S.uid = d; S.formation = S.clubs[d].fm; S.slots = new Array(11).fill(null); S.bench = [];
    H.autoLineup(this.G);
    return d;
  }
  beginSeasonTick() {
    const G = this.G, S = G.S;
    this.active().forEach((h) => this.withHuman(h, (SS, GG, uc) => {
      GG.SQ[uc.id].filter((p) => p.ct <= 0).forEach((p) => { H.news(GG, p.n + ' left the club (contract ended).', 'n'); H.moveTo(GG, p, null); p.ct = 0; });
      H.ensureSquad(GG, uc, {});
      H.fixLineup(GG);
    }));
    this.setDummy();
    H.beginSeason(G);
    this.feedAdd('Season ' + H.yearName(S.year) + ' kicks off!', 'b');
  }
  teamFor(cid) {
    const G = this.G, hh = this.humanOfClub(cid);
    if (hh) return this.withHuman(hh, (S, GG) => { H.fixLineup(GG); return H.userTeam(GG); });
    return H.aiTeam(G, cid);
  }
  makeReport(m, h, fx) {
    const S = this.S, side = fx.h === h.cid ? 0 : 1, t = H.teamOf(m, side);
    const keep = { ko: 1, goal: 1, red: 1, yellow: 1, inj: 1, sub: 1, pen: 1, ht: 1, et: 1, ft: 1, save: 1, post: 1 };
    return {
      w: S.week, y: S.year, comp: fx.name, home: S.clubs[fx.h].name, away: S.clubs[fx.a].name, hc: S.clubs[fx.h].col, ac: S.clubs[fx.a].col, side,
      score: m.score.slice(), pens: m.pens ? m.pens.score.slice() : null,
      goals: [m.goals[0].map((g) => [g.name, g.min, g.pen ? 1 : 0]), m.goals[1].map((g) => [g.name, g.min, g.pen ? 1 : 0])],
      stats: { shots: m.stats.shots, sot: m.stats.sot, poss: m.stats.possPct, corners: m.stats.corners, fouls: m.stats.fouls, yc: m.stats.yc, rc: m.stats.rc },
      motm: m.motm ? { n: m.motm.name, t: m.motm.team } : null,
      log: m.log.filter((e) => keep[e.type] && !(e.type === 'save' && Math.random() < 0.6)).slice(0, 70).map((e) => [e.t, e.type, e.text, e.side]),
      ratings: t.on.concat(t.used).map((p) => ({ n: p.name, pos: p.slot, r: p.rating, g: p.perf.g, a: p.perf.a })),
    };
  }
  playWeek() {
    const G = this.G, S = G.S, humans = this.active();
    const hc = new Set(humans.map((h) => h.cid));
    this.setDummy();
    /* 1. every manager's matches this week */
    const entries = [];
    humans.forEach((h) => this.withHuman(h, () => { H.fixLineup(G); H.pending(G).forEach((fx) => entries.push({ h, fx })); }));
    const groups = new Map();
    entries.forEach((e) => { const k = [e.fx.comp, e.fx.h, e.fx.a, e.fx.leg || 0, e.fx.round == null ? '' : e.fx.round].join(':'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); });
    groups.forEach((list) => {
      const fx = list[0].fx, home = this.teamFor(fx.h), away = this.teamFor(fx.a);
      const m = H.createMatch(home, away, { needWinner: fx.kind === 'ko', agg: H.aggFor(fx) });
      H.playFully(m);
      list.forEach((e, idx) => {
        let mm = m;
        if (list.length > 1) { /* two managers in the same match: count each player and goal only once */
          const side = e.h.cid === fx.h ? 0 : 1, oppKey = side === 0 ? 'away' : 'home';
          mm = Object.assign({}, m); mm[oppKey] = Object.assign({}, m[oppKey], { on: [], used: [] });
          if (idx > 0) mm.goals = [[], []];
        }
        this.withHuman(e.h, () => { H.recordResult(G, e.fx, mm); });
        e.h.reports.unshift(this.makeReport(m, e.h, e.fx)); if (e.h.reports.length > 12) e.h.reports.length = 12;
      });
    });
    /* 2. money, fitness, builders, offers for every manager */
    humans.forEach((h) => this.humanWeekly(h));
    /* 3. the rest of the world. Managers' clubs are protected from the computer's own dealings. */
    const snap = humans.map((h) => { const c = S.clubs[h.cid]; return { c, cash: c.cash, pl: G.SQ[h.cid].map((p) => ({ p, ct: p.ct, w: p.w, inj: p.inj })) }; });
    guard = hc;
    try { H.finishWeek(G); } finally { guard = null; }
    snap.forEach((s) => { s.c.cash = s.cash; s.pl.forEach((x) => { x.p.ct = x.ct; x.p.w = x.w; x.p.inj = x.inj; }); });
    /* 4. cups and finishing touches */
    humans.forEach((h) => this.withHuman(h, (SS, GG, uc) => {
      const cup = SS.cup[uc.lg];
      if (cup.alive.indexOf(uc.id) >= 0) SS.cupRound = Math.max(SS.cupRound, cup.round);
      if (cup.winner === uc.id && h.cupPaid !== SS.year) {
        h.cupPaid = SS.year; const pr = uc.revW * H.LAST_WEEK * 0.025; uc.cash += pr; SS.tot.inc.prize += pr; SS.board.conf = Math.min(100, SS.board.conf + 6);
        H.news(GG, 'You won the ' + cup.name + '! Prize money ' + H.fm(pr) + '.', 'w'); this.feedAdd(h.name + ' (' + uc.name + ') won the ' + cup.name + '!', 'w');
        h.trophies.push({ y: SS.year, t: cup.name, c: uc.name });
      }
      if (SS.cc.winner === uc.id && h.ccPaid !== SS.year) { h.ccPaid = SS.year; this.feedAdd(h.name + ' (' + uc.name + ') won the Champions Cup!', 'w'); h.trophies.push({ y: SS.year, t: 'Champions Cup', c: uc.name }); SS.board.conf = Math.min(100, SS.board.conf + 10); }
    }));
    S.clubs.forEach((c) => H.recalcClub(G, c));
    humans.forEach((h) => this.withHuman(h, (SS, GG) => { H.fixLineup(GG); }));
    this.M.mkt = this.M.mkt.filter((l) => S.week - l.w <= 8);
  }
  humanWeekly(h) {
    const R = H.util.ri, clamp = H.util.clamp, rnd = () => H.rand();
    this.withHuman(h, (S, G, uc) => {
      const uid = uc.id, wk = S.wk, inc = H.weeklyIncome(G, uc);
      wk.tv += inc.tv; wk.spons += inc.spons; wk.comm += inc.comm;
      const wages = H.wageBill(G, uid), up = H.upkeep(uc);
      wk.wages += wages; wk.upkeep += up;
      const income = wk.gate + wk.tv + wk.spons + wk.comm + wk.prize, exp = wk.wages + wk.upkeep;
      uc.cash += income - exp;
      ['gate', 'tv', 'spons', 'comm', 'prize'].forEach((k) => { S.tot.inc[k] += wk[k]; });
      S.tot.exp.wages += wk.wages; S.tot.exp.upkeep += wk.upkeep;
      S.fin.unshift({ w: S.week, inc: r1(income, 4), exp: r1(exp + wk.build + wk.fees, 4), gate: r1(wk.gate, 4), prize: r1(wk.prize, 4), wages: r1(wk.wages, 4) });
      if (S.fin.length > 12) S.fin.length = 12;
      S.wk = emptyWk();
      if (uc.cash < 0) { S.board.conf = clamp(S.board.conf - 1.5, 0, 100); if (S.week % 4 === 0) H.news(G, 'The board is worried: the club is in the red (' + H.fm(uc.cash) + ').', 'b'); }
      S.build = S.build.filter((b) => { b.wk--; if (b.wk <= 0) { uc.fac[b.i]++; H.news(G, H.FAC[b.i].name + ' upgrade finished: now level ' + uc.fac[b.i] + '!', 'g'); return false; } return true; });
      const med = uc.fac[3], intens = S.train, tf = 0.9 + 0.06 * uc.fac[1], im = [0.6, 1, 1.4][intens - 1] || 1;
      G.SQ[uid].forEach((p) => {
        p.ft = clamp(p.ft + R(20, 30) + Math.round(med * 0.8) - (intens - 2) * 4, 0, 100);
        if (p.inj > 0) { p.inj--; if (p.inj === 0) H.news(G, p.n + ' is fit again.', 'n'); }
        if (p.sus > 0) p.sus--;
        p.mo = clamp(Math.round(p.mo + (65 - p.mo) * 0.12), 10, 100);
        if (p.a <= 27 && p.o < p.p) {
          const ch = 0.009 * im * tf * (p.p - p.o) / 3 * (p.a <= 20 ? 1.4 : 1) * (p.ap > 0 ? 1.15 : 0.7);
          if (rnd() < ch) { p.o++; p.tr++; H.refresh(p); p.w = Math.max(p.w, H.wageOf(p.v * 0.6, p.o)); if (p.o >= 85) H.news(G, p.n + ' has improved to ' + p.o + '!', 'g'); }
        }
      });
      if (H.windowOpen(G)) {
        const taken = this.claimedSet();
        G.SQ[uid].slice().forEach((p) => {
          if (p.v < 0.15) return;
          const prob = 0.025 + (p.lst ? 0.18 : 0) + (p.o >= 82 ? 0.02 : 0);
          if (rnd() > prob || S.offers.some((o) => o.pid === p.id)) return;
          const cands = S.clubs.filter((c) => !taken.has(c.id) && c.cash > p.v * 1.1 && c.rep >= uc.rep - 18 && c.rep <= uc.rep + 40);
          if (!cands.length) return;
          const b = H.util.pick(cands), fee = p.v * (0.85 + rnd() * 0.5) * (p.lst ? 1.0 : 1.05);
          S.offers.push({ pid: p.id, from: b.id, fee, w: S.week });
          H.news(G, b.name + ' offer ' + H.fm(fee) + ' for ' + p.n + '.', 't');
        });
      }
      S.offers = S.offers.filter((o) => S.week - o.w <= 2 && G.P[o.pid] && G.P[o.pid].cl === uid);
    });
  }
  humanSeasonEnd(h) {
    const clamp = H.util.clamp, rnd = () => H.rand();
    this.withHuman(h, (S, G, uc) => {
      const table = H.table(G, uc.lg), n = table.length; let pos = 0;
      table.forEach((r, i) => { if (r.id === uc.id) pos = i + 1; });
      const prize = uc.revW * H.LAST_WEEK * 0.12 * (n - pos + 1) / n; uc.cash += prize; S.tot.inc.prize += prize;
      let extra = '';
      if (S.sponsor && S.sponsor.bonus && pos <= S.sponsor.need) { uc.cash += S.sponsor.bonus; extra += ' Sponsor bonus ' + H.fm(S.sponsor.bonus) + '.'; }
      if (S.sponsor && S.sponsor.need <= 3 && pos > 8) { const pen = uc.revW * H.LAST_WEEK * 0.03; uc.cash -= pen; extra += ' Sponsor penalty ' + H.fm(pen) + '.'; }
      const ob = S.obj || { target: 10, cup: 1 };
      let d = pos <= ob.target ? (pos < ob.target ? 14 : 9) : (pos <= ob.target + 2 ? -8 : -20);
      if (ob.cup != null) d += S.cupRound >= ob.cup ? 3 : -2;
      if (ob.cc != null) d += S.ccRound + 1 >= ob.cc ? 3 : -3;
      if (pos === 1) d += 8;
      if (uc.cash < 0) d -= 12;
      S.board.conf = clamp(S.board.conf + d, 0, 100);
      if (pos === 1) { h.trophies.push({ y: S.year, t: H.lgOf(uc.lg).name, c: uc.name }); this.feedAdd(h.name + ' (' + uc.name + ') are CHAMPIONS of the ' + H.lgOf(uc.lg).name + '!', 'w'); }
      H.news(G, 'Season over: you finished ' + pos + ' of ' + n + '. Prize money ' + H.fm(prize) + '.' + extra + ' The board is ' + (d >= 0 ? 'pleased' : 'unhappy') + '.', pos <= ob.target ? 'w' : 'b');
      G.SQ[uc.id].forEach((p) => {
        if (p.a <= 26 && p.ap >= 15 && p.o < p.p && rnd() < 0.5) { p.o++; }
        if (p.a <= 27 && p.o < p.p && rnd() < uc.fac[1] * 0.04) { p.o++; }
        H.refresh(p);
      });
      const more = Math.floor(uc.fac[2] / 3);
      if (more > 0) H.makeYouth(G, uc, more);
      h.hist.unshift({ y: S.year, pos, n, lg: H.lgOf(uc.lg).name, club: uc.name, prize: r1(prize, 2), champ: table[0].name, cup: S.cup[uc.lg].winner != null ? S.clubs[S.cup[uc.lg].winner].name : null, cc: S.cc.winner != null ? S.clubs[S.cc.winner].name : null });
      if (h.hist.length > 20) h.hist.length = 20;
    });
  }
  rollSeason() {
    const G = this.G, S = G.S, humans = this.active();
    this.setDummy();
    /* The engine trims big squads and lets some contracts run out. Managers decide that for themselves, so we note
       who was where, let the engine do its yearly work, then put back anyone it removed from a manager's club. */
    const own = new Map();
    humans.forEach((h) => G.SQ[h.cid].forEach((p) => own.set(p.id, { cid: h.cid, ct: p.ct, w: p.w })));
    H.endSeason(G);
    own.forEach((o, id) => {
      const p = G.P[id]; if (!p) return;                       /* retired */
      if (p.cl !== o.cid) H.moveTo(G, p, o.cid);
      p.w = o.w; p.ct = o.ct <= 1 ? 0 : o.ct - 1;
    });
    humans.forEach((h) => this.humanSeasonEnd(h));
    this.setDummy();
    H.nextSeason(G, null);
    humans.forEach((h) => this.withHuman(h, (SS, GG, uc) => {
      SS.wk = emptyWk(); SS.tot = emptyTot(); SS.fin = []; SS.offers = []; SS.cupRound = 0; SS.ccRound = -1; SS.sponsor = null;
      SS.sponsorOffers = this.makeSponsorOffers(uc.id); SS.obj = this.makeObj(uc.id);
      const ex = GG.SQ[uc.id].filter((p) => p.ct <= 0).length;
      H.news(GG, 'New season ' + H.yearName(SS.year) + '. Target: ' + SS.obj.text + '.' + (ex ? ' ' + ex + ' contract' + (ex > 1 ? 's' : '') + ' ended: renew them before the season starts.' : ''), 'b');
      H.fixLineup(GG);
    }));
    S.clubs.forEach((c) => H.recalcClub(G, c));
    this.feedAdd('Season ' + H.yearName(S.year - 1) + ' is finished. Contracts and transfers are open until the next week.', 'b');
  }

  /* ------------------------------- admin ------------------------------- */
  adminKick(name) {
    const key = clean(name, 18).toLowerCase(), h = this.humans().filter((x) => x.key === key)[0];
    if (!h) bad('No such manager.', 404);
    if (h.cid != null) { this.M.mkt = this.M.mkt.filter((l) => l.seller !== h.id); h.cid = null; h.st = null; }
    this.M.rev++; this.dirty(); return { ok: true };
  }
  adminBan(name) {
    const key = clean(name, 18).toLowerCase(), h = this.humans().filter((x) => x.key === key)[0];
    this.M.banned.push(key);
    if (h) { this.adminKick(name); (h.tokens || []).forEach((t) => this.tokens.delete(t)); delete this.M.humans[h.id]; }
    this.dirty(); return { ok: true };
  }
  adminMute(name, minutes) {
    const key = clean(name, 18).toLowerCase(), h = this.humans().filter((x) => x.key === key)[0];
    if (!h) bad('No such manager.', 404);
    h.muted = Date.now() + int(minutes, 1, 100000, 60) * 60000; this.dirty(); return { ok: true };
  }
}

/* ============================================ HTTP ============================================ */
function createServer(world, cfg) {
  const hits = new Map();
  const limit = (key, max, ms) => {
    const n = Date.now(); let b = hits.get(key);
    if (!b || b.t < n) { b = { t: n + ms, c: 0 }; hits.set(key, b); }
    b.c++; if (b.c > max) bad('Too many requests. Wait a moment.', 429);
  };
  setInterval(() => { const n = Date.now(); hits.forEach((b, k) => { if (b.t < n) hits.delete(k); }); }, 60000).unref();

  const R = {
    'GET /api/info': { fn: (w) => w.info() },
    'GET /api/clubs': { fn: (w) => w.clubs() },
    'POST /api/register': { strict: 1, fn: (w, h, q, b, ip) => w.register(b.name, b.pass, ip) },
    'POST /api/login': { strict: 1, fn: (w, h, q, b) => w.login(b.name, b.pass) },
    'GET /api/me': { auth: 1, fn: (w, h) => (h.cid == null ? { me: w.brief(h), world: w.worldBrief() } : w.me(h)) },
    'POST /api/claim': { auth: 1, fn: (w, h, q, b) => w.claim(h, b.cid) },
    'POST /api/leave': { auth: 1, fn: (w, h) => w.leave(h) },
    'POST /api/lineup': { auth: 1, fn: (w, h, q, b) => w.setLineup(h, b) },
    'GET /api/league': { auth: 1, fn: (w, h, q) => w.leagueView(q.lg, h) },
    'GET /api/report': { auth: 1, fn: (w, h, q) => w.report(h, q.i) },
    'GET /api/players': { auth: 1, fn: (w, h, q) => w.players(h, q) },
    'GET /api/player': { auth: 1, fn: (w, h, q) => w.playerAsk(h, q.id) },
    'POST /api/bid': { auth: 1, fn: (w, h, q, b) => w.bid(h, b) },
    'POST /api/offer': { auth: 1, fn: (w, h, q, b) => w.offerAnswer(h, b) },
    'POST /api/translist': { auth: 1, fn: (w, h, q, b) => w.transferList(h, b) },
    'POST /api/release': { auth: 1, fn: (w, h, q, b) => w.release(h, b) },
    'POST /api/renew': { auth: 1, fn: (w, h, q, b) => w.renew(h, b) },
    'GET /api/market': { auth: 1, fn: (w) => w.market() },
    'POST /api/market/list': { auth: 1, fn: (w, h, q, b) => w.marketList(h, b) },
    'POST /api/market/buy': { auth: 1, fn: (w, h, q, b) => w.marketBuy(h, b) },
    'POST /api/build': { auth: 1, fn: (w, h, q, b) => w.build(h, b) },
    'POST /api/sponsor': { auth: 1, fn: (w, h, q, b) => w.sponsor(h, b) },
    'GET /api/chat': { auth: 1, fn: (w, h, q) => w.chatGet(q.ch, q.after) },
    'POST /api/chat': { auth: 1, fn: (w, h, q, b) => w.chatPost(h, b) },
    'GET /api/hall': { auth: 1, fn: (w) => ({ list: w.hall() }) },
    'POST /api/admin/tick': { admin: 1, fn: (w) => { const ok = w.tickSafe(); return { ok, err: w.lastTickError, week: w.S.week, stage: w.S.stage }; } },
    'POST /api/admin/kick': { admin: 1, fn: (w, h, q, b) => w.adminKick(b.name) },
    'POST /api/admin/ban': { admin: 1, fn: (w, h, q, b) => w.adminBan(b.name) },
    'POST /api/admin/mute': { admin: 1, fn: (w, h, q, b) => w.adminMute(b.name, b.minutes) },
    'POST /api/admin/say': { admin: 1, fn: (w, h, q, b) => { w.feedAdd(clean(b.text, 200), 'b'); w.dirty(); return { ok: true }; } },
  };

  function send(req, res, status, obj) {
    const body = Buffer.from(JSON.stringify(obj));
    const h = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
    if (body.length > 700 && /gzip/.test(req.headers['accept-encoding'] || '')) { const z = zlib.gzipSync(body); h['Content-Encoding'] = 'gzip'; h['Content-Length'] = z.length; res.writeHead(status, h); res.end(z); }
    else { h['Content-Length'] = body.length; res.writeHead(status, h); res.end(body); }
  }
  function readBody(req) {
    return new Promise((resolve, reject) => {
      const parts = []; let n = 0;
      req.on('data', (c) => { n += c.length; if (n > 40000) { reject(new ApiError('Request too big.', 413)); req.destroy(); } else parts.push(c); });
      req.on('end', () => { if (!parts.length) return resolve({}); try { const j = JSON.parse(Buffer.concat(parts).toString('utf8')); resolve(j && typeof j === 'object' ? j : {}); } catch (e) { reject(new ApiError('Bad request.', 400)); } });
      req.on('error', reject);
    });
  }
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://x'), ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, authorization, x-admin-key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400' }); return res.end(); }
      if (u.pathname === '/health') return send(req, res, 200, { ok: true, week: world.S.week, stage: world.S.stage });
      if (u.pathname === '/' || u.pathname === '/index.html') { const b = '<!doctype html><meta name=viewport content="width=device-width"><body style="font-family:sans-serif;background:#0b1d12;color:#e8f5e9;padding:24px"><h2>⚽ ' + cfg.name + '</h2><p>This is the HANS FC Online server. Open the HANS FC app, tap Menu, then Online League, and enter this address.</p><p>Season ' + world.S.year + ', week ' + world.S.week + '</p>'; res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(b); }
      const key = req.method + ' ' + u.pathname, route = R[key];
      if (!route) bad('Not found.', 404);
      limit('ip:' + ip, 240, 60000);
      if (route.strict) limit('auth:' + ip, 12, 60000);
      let h = null;
      if (route.admin) { if (!cfg.adminKey || req.headers['x-admin-key'] !== cfg.adminKey) bad('No.', 403); }
      if (route.auth) { const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); h = world.auth(m && m[1]); }
      const q = Object.fromEntries(u.searchParams.entries());
      const body = req.method === 'POST' ? await readBody(req) : {};
      const out = route.fn(world, h, q, body, ip);
      send(req, res, 200, out);
    } catch (e) {
      if (e instanceof ApiError) send(req, res, e.status, { error: e.message });
      else { console.error(e); send(req, res, 500, { error: 'Server error. Try again.' }); }
    }
  });
  return server;
}

function start() {
  loadEngine(CFG.gameDir);
  const world = new World(CFG);
  world.boot();
  const server = createServer(world, CFG);
  server.listen(CFG.port, () => console.log('HANS FC Online on port ' + CFG.port + ', one week every ' + Math.round(CFG.tickMs / 60000 * 10) / 10 + ' min'));
  setInterval(() => { try { world.maybeTick(); } catch (e) { console.error(e); } }, 5000);
  const bye = () => { try { world.save(); } catch (e) { /* ignore */ } process.exit(0); };
  process.on('SIGTERM', bye); process.on('SIGINT', bye);
  return { world, server };
}

module.exports = { World, ApiError, CFG, createServer, loadEngine, start };
if (require.main === module) start();
