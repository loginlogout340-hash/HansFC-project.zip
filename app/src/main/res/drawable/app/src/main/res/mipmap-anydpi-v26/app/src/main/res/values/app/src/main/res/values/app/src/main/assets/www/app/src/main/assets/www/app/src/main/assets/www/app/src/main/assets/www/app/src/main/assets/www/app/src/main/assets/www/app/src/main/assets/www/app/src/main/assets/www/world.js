/* HANS FC 2.0 - engine part 2: the football world. Clubs, leagues, cups, the Champions Cup, finances, facilities,
   transfers, youth, progression, the board and the weekly calendar. No screen code in here. */
(function () {
  var H = (typeof window !== 'undefined') ? (window.HFC = window.HFC || {}) : (global.HFC = global.HFC || {});
  var U = H.util, ri = U.ri, pick = U.pick, clamp = U.clamp, gauss = U.gauss;
  var R = function () { return H.rand(); };
  var CUPW = [4, 10, 17, 25, 32, 37, 40];                 // weeks of the domestic cup rounds
  var CCW = [[11, 14], [19, 22], [28, 31], [36]];         // weeks of the Champions Cup rounds (two legs, final is one match)
  var CCN = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
  var CC_PRIZE = [4, 7, 11, 20];                          // millions of euros for winning a round
  var BIG5 = ['epl', 'lal', 'sa', 'bun', 'l1'];
  var LAST_WEEK = 40;
  H.CUPW = CUPW; H.CCW = CCW; H.CCN = CCN; H.LAST_WEEK = LAST_WEEK;
  var MINPOS = { GK: 2, CB: 4, LB: 2, RB: 2, CDM: 2, CM: 3, CAM: 1, LM: 1, RM: 1, LW: 2, RW: 2, ST: 3 };
  var MAXSQ = 38;

  /* ---------------- game context ---------------- */
  H.makeGame = function (S) {
    var G = { S: S, P: {}, SQ: {}, LU: {} };
    S.players.forEach(function (p) { G.P[p.id] = p; });
    S.clubs.forEach(function (c) { G.SQ[c.id] = []; });
    S.players.forEach(function (p) { if (p.cl != null && G.SQ[p.cl]) G.SQ[p.cl].push(p); });
    var mx = 0; S.players.forEach(function (p) { if (p.id > mx) mx = p.id; });
    H.setNextId(Math.max(H.getNextId(), mx + 1));
    S.clubs.forEach(function (c) { H.recalcClub(G, c); });
    return G;
  };
  H.club = function (G, id) { return G.S.clubs[id]; };
  H.userClub = function (G) { return G.S.clubs[G.S.uid]; };
  H.lgOf = function (id) { return H.LEAGUES.filter(function (l) { return l.id === id; })[0]; };
  H.lgClubs = function (G, lg) { return G.S.clubs.filter(function (c) { return c.lg === lg; }); };
  var addPlayer = function (G, p) { G.S.players.push(p); G.P[p.id] = p; if (p.cl != null) G.SQ[p.cl].push(p); return p; };
  H.addPlayer = addPlayer;
  var removeFrom = function (G, p) { if (p.cl != null && G.SQ[p.cl]) { var i = G.SQ[p.cl].indexOf(p); if (i >= 0) G.SQ[p.cl].splice(i, 1); } };
  H.moveTo = function (G, p, cid) {
    removeFrom(G, p); p.cl = cid;
    if (cid != null) G.SQ[cid].push(p);
    p.lst = false;
  };
  var news = function (G, text, kind) { G.S.unread = (G.S.unread || 0) + 1; G.S.news.unshift({ w: G.S.week, y: G.S.year, t: text, k: kind || 'n' }); if (G.S.news.length > 70) G.S.news.length = 70; };
  H.news = news;
  H.fm = function (v) { // money
    var s = v < 0 ? '-' : ''; v = Math.abs(v);
    if (v >= 100) return s + '£' + Math.round(v) + 'M';
    if (v >= 10) return s + '£' + v.toFixed(1) + 'M';
    if (v >= 1) return s + '£' + v.toFixed(2) + 'M';
    if (v >= 0.001) return s + '£' + Math.round(v * 1000) + 'K';
    return s + '£' + Math.round(v * 1e6) + '';
  };
  H.yearName = function (y) { return y + '/' + String(y + 1).slice(2); };

  /* ---------------- building the world ---------------- */
  function fillerOvr(c, lg) { return clamp(Math.round(52 + c.rep * 0.24 + lg.fillQ + gauss() * 3.2), 38, 80); }
  function fillerPlayer(G, c, pos, used) {
    var lg = H.lgOf(c.lg), a = R() < 0.4 ? ri(18, 22) : ri(23, 34), o = fillerOvr(c, lg);
    var nat = R() < (0.55) ? lg.nat : pick(Object.keys(H.NAT));
    if (a <= 21) o -= ri(1, 4);
    var p = H.makePlayer({ pos: pos, o: o, a: a, nat: nat, cl: c.id, ct: a >= 31 ? ri(1, 2) : ri(1, 4) }, used);
    return addPlayer(G, p);
  }
  function ensureSquad(G, c, used) {
    var cnt = {}, sq = G.SQ[c.id];
    sq.forEach(function (p) { cnt[p.pos] = (cnt[p.pos] || 0) + 1; });
    Object.keys(MINPOS).forEach(function (pos) { for (var k = (cnt[pos] || 0); k < MINPOS[pos]; k++) fillerPlayer(G, c, pos, used); });
    while (G.SQ[c.id].length < 24) fillerPlayer(G, c, H.randomPos(), used);
  }
  H.ensureSquad = ensureSquad;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  H.shuffle = shuffle;

  function buildWorld() {
    var S = { v: 2, clubs: [], players: [], lg: {}, cup: {}, cc: null, news: [], fin: [], offers: [], hist: [] };
    H.setNextId(1);
    var G = { S: S, P: {}, SQ: {}, LU: {} }, used = {};
    H.CLUB_ROWS.forEach(function (row, i) {
      var f = row.split('|');
      var c = { id: i, name: f[0], lg: f[1], col: f[2], rep: +f[3], cap: +f[4], cash: 0, fac: [], fac0: [], revW: 0, fm: '4-3-3', str: 60, ttl: 0 };
      var L0 = clamp(Math.round(c.rep / 18), 1, 5);
      c.fac = [L0, L0, L0, L0, L0]; c.fac0 = c.fac.slice();
      S.clubs.push(c); G.SQ[i] = [];
    });
    S.clubs.forEach(function (c) {
      var real = H.REAL[c.name];
      if (real) H.parseReal(real).forEach(function (r) {
        var p = H.makePlayer({ name: r.name, pos: r.pos, o: r.o, a: r.a, nat: r.nat, p: r.p, cl: c.id, ct: r.a >= 33 ? ri(1, 2) : ri(1, 5) }, used);
        used[p.n] = 1; addPlayer(G, p);
      });
      ensureSquad(G, c, used);
    });
    H.parseReal(H.FREE_STARS).forEach(function (r) {
      var p = H.makePlayer({ name: r.name, pos: r.pos, o: r.o, a: r.a, nat: r.nat, p: r.p, cl: null, ct: 0 }, used); addPlayer(G, p);
    });
    S.clubs.forEach(function (c) {
      var wk = 0; G.SQ[c.id].forEach(function (p) { wk += p.w; });
      c.revW = wk / 0.62 * (0.92 + R() * 0.2);
      c.cash = c.revW * LAST_WEEK * (0.2 + R() * 0.15);
    });
    S.clubs.forEach(function (c) { H.recalcClub(G, c); });
    S.clubs.forEach(function (c) { c.fm = H.bestFormation(G.SQ[c.id], ['4-3-3', '4-4-2', '4-2-3-1']); H.recalcClub(G, c); });
    return G;
  }
  H.buildWorld = buildWorld;

  /* the best lineup a club could field right now, cached. Also sets the club's strength. */
  H.recalcClub = function (G, c) {
    var cards = G.SQ[c.id] || [], ap = H.autoPick(c.fm || '4-3-3', cards);
    var byId = G.P, on = ap.slots.map(function (id) { return id ? byId[id] : null; });
    var ev = H.evaluate(c.fm || '4-3-3', on);
    c.str = Math.round(ev.vector.rf * 10) / 10;
    G.LU[c.id] = { on: on, bench: ap.bench.map(function (id) { return byId[id]; }), rows: ev.rows };
    return c.str;
  };

  /* ---------------- new career ---------------- */
  H.newCareer = function (mgrName, clubId) {
    var G = buildWorld(), S = G.S, c = S.clubs[clubId];
    S.mgr = { name: mgrName, rep: Math.max(12, c.rep - 8) };
    S.uid = clubId; S.week = 0; S.year = 2026; S.seasonNo = 1; S.stage = 'pre';
    S.formation = c.fm; S.mentality = 'balanced'; S.style = 'possession'; S.press = 'medium'; S.train = 2;
    S.slots = new Array(11).fill(null); S.bench = []; S.board = { conf: 60 }; S.build = []; S.wk = emptyWk(); S.tot = emptyTot();
    S.sponsor = null; S.build = [];
    S.champions = [];
    H.startSeason(G);
    H.autoLineup(G);
    news(G, 'Welcome to ' + c.name + '! The board expects results. Good luck, ' + mgrName + '.', 'b');
    return G;
  };
  function emptyWk() { return { gate: 0, tv: 0, spons: 0, comm: 0, prize: 0, wages: 0, upkeep: 0, build: 0, fees: 0, other: 0 }; }
  function emptyTot() { return { inc: { gate: 0, tv: 0, spons: 0, comm: 0, prize: 0, sales: 0 }, exp: { wages: 0, upkeep: 0, build: 0, buys: 0 } }; }

  /* ---------------- fixtures ---------------- */
  function roundRobin(ids) {
    var arr = shuffle(ids.slice()), rounds = [], r, i;
    if (arr.length % 2) arr.push(-1);
    var m = arr.length;
    for (r = 0; r < m - 1; r++) {
      var pairs = [];
      for (i = 0; i < m / 2; i++) {
        var a = arr[i], b = arr[m - 1 - i];
        if (a < 0 || b < 0) continue;
        pairs.push(r % 2 === 0 ? [a, b, -1, -1] : [b, a, -1, -1]);
      }
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());
    }
    var second = rounds.map(function (p) { return p.map(function (x) { return [x[1], x[0], -1, -1]; }); });
    return shuffle(rounds).concat(shuffle(second));
  }
  H.table = function (G, lgId) {
    var L = G.S.lg[lgId], t = {};
    L.ids.forEach(function (id) { var c = G.S.clubs[id]; t[id] = { id: id, name: c.name, col: c.col, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, user: id === G.S.uid }; });
    L.rounds.forEach(function (rd) {
      rd.forEach(function (f) {
        if (f[2] < 0) return;
        var h = t[f[0]], a = t[f[1]];
        h.p++; a.p++; h.gf += f[2]; h.ga += f[3]; a.gf += f[3]; a.ga += f[2];
        if (f[2] > f[3]) { h.w++; h.pts += 3; a.l++; } else if (f[2] < f[3]) { a.w++; a.pts += 3; h.l++; } else { h.d++; a.d++; h.pts++; a.pts++; }
      });
    });
    return Object.keys(t).map(function (k) { return t[k]; }).sort(function (x, y) {
      return (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (G.S.clubs[y.id].rep - G.S.clubs[x.id].rep);
    });
  };
  H.position = function (G, lgId, cid) { var t = H.table(G, lgId); for (var i = 0; i < t.length; i++) if (t[i].id === cid) return i + 1; return 0; };

  /* ---------------- season set-up ---------------- */
  H.startSeason = function (G) {
    var S = G.S;
    H.LEAGUES.forEach(function (lg) {
      var ids = H.lgClubs(G, lg.id).map(function (c) { return c.id; });
      S.lg[lg.id] = { ids: ids, rounds: roundRobin(ids) };
      S.cup[lg.id] = { alive: ids.slice(), round: 0, ties: [], hist: [], winner: null, drawn: -1, name: lg.name + ' Cup' };
    });
    // Champions Cup: the top 3 of each big league from last season (or by reputation in season 1) plus the best fourth place
    var teams = [];
    BIG5.forEach(function (lgId) {
      var order = S.prevTop && S.prevTop[lgId] ? S.prevTop[lgId] : H.lgClubs(G, lgId).sort(function (a, b) { return b.rep - a.rep; }).map(function (c) { return c.id; });
      teams = teams.concat(order.slice(0, 3));
    });
    var fourth = BIG5.map(function (lgId) { var order = S.prevTop && S.prevTop[lgId] ? S.prevTop[lgId] : H.lgClubs(G, lgId).sort(function (a, b) { return b.rep - a.rep; }).map(function (c) { return c.id; }); return order[3]; });
    fourth.sort(function (a, b) { return S.clubs[b].rep - S.clubs[a].rep; });
    teams.push(fourth[0]);
    S.cc = { teams: teams, alive: teams.slice(), round: 0, ties: [], hist: [], winner: null, over: false, drawn: -1 };
    S.clubs.forEach(function (c) { c.fm = H.bestFormation(G.SQ[c.id], ['4-3-3', '4-4-2', '4-2-3-1']); });
    S.players.forEach(function (p) { p.g = 0; p.as = 0; p.ap = 0; p.yc = 0; p.ft = 100; p.rs = 0; p.rn = 0; });
    S.clubs.forEach(function (c) { H.recalcClub(G, c); });
    S.week = 0; S.stage = 'pre'; S.wk = emptyWk(); S.tot = emptyTot(); S.fin = []; S.offers = []; S.cupRound = 0; S.ccRound = -1; S.pendingDone = [];
    // sponsor offers and board objectives
    var uc = H.userClub(G), annual = uc.revW * LAST_WEEK;
    S.sponsorOffers = [
      { name: pick(H.SPONSORS), mult: 0.95, bonus: 0, need: 99, label: 'Safe deal', desc: 'Steady money, no strings.' },
      { name: pick(H.SPONSORS), mult: 1.12, bonus: annual * 0.02, need: 8, label: 'Balanced deal', desc: 'More money, bonus for a top-8 finish.' },
      { name: pick(H.SPONSORS), mult: 1.3, bonus: annual * 0.06, need: 3, label: 'Ambitious deal', desc: 'Big money, but the bonus needs a top-3 finish. Pays less if you flop.' },
    ];
    S.sponsor = null;
    S.obj = makeObjective(G);
    S.review = null;
    if (H.afterStart) H.afterStart(G);
  };
  function makeObjective(G) {
    var S = G.S, uc = H.userClub(G), lg = uc.lg;
    var order = H.lgClubs(G, lg).slice().sort(function (a, b) { return (b.str + b.rep * 0.12) - (a.str + a.rep * 0.12); });
    var exp = order.map(function (c) { return c.id; }).indexOf(uc.id) + 1, n = order.length;
    var target = Math.max(1, Math.round(exp * 0.85));
    var lgText = target === 1 ? 'Win the league' : target <= 4 ? 'Finish in the top ' + target : target <= Math.ceil(n / 2) ? 'Finish in the top half (top ' + target + ')' : 'Avoid relegation worries: finish in the top ' + target;
    var cupRounds = S.cup[lg].alive.length <= 16 ? 4 : 5;
    var cupT = exp <= 3 ? cupRounds - 1 : exp <= 8 ? 2 : 1;
    var cupText = cupT >= cupRounds - 1 ? 'Reach the cup final' : cupT >= 2 ? 'Win two rounds in the cup' : 'Win at least one cup round';
    var o = { target: target, exp: exp, text: lgText, cup: cupT, cupText: cupText };
    if (S.cc.teams.indexOf(uc.id) >= 0) { o.cc = uc.rep >= 90 ? 3 : uc.rep >= 85 ? 2 : 1; o.ccText = o.cc >= 3 ? 'Reach the Champions Cup semi-finals' : o.cc === 2 ? 'Reach the Champions Cup quarter-finals' : 'Get out of the Champions Cup round of 16'; }
    return o;
  }

  /* ---------------- lineups (the user's team) ---------------- */
  H.userCards = function (G) { return G.SQ[G.S.uid]; };
  H.autoLineup = function (G) {
    var S = G.S, cards = H.userCards(G), ap = H.autoPick(S.formation, cards);
    S.slots = ap.slots; S.bench = ap.bench.slice(0, 9);
  };
  /* replace injured / banned / sold players in the lineup with the best available replacement */
  H.fixLineup = function (G) {
    var S = G.S, f = H.FORMATIONS[S.formation], changed = 0;
    var taken = {}; S.slots.forEach(function (id) { if (id) taken[id] = 1; });
    S.slots = S.slots.map(function (id, i) {
      var p = id ? G.P[id] : null;
      if (p && p.cl === S.uid && H.available(p)) return id;
      var best = null, bv = -999;
      H.userCards(G).forEach(function (c) { if (taken[c.id] || !H.available(c)) return; var v = H.eff(c) - H.penalty(f[i][0], c.pos); if (v > bv) { bv = v; best = c; } });
      if (p) delete taken[id];
      if (best) { taken[best.id] = 1; changed++; return best.id; }
      return null;
    });
    S.bench = S.bench.filter(function (id) { var p = G.P[id]; return p && p.cl === S.uid && H.available(p) && !taken[id]; });
    var have = {}; S.bench.forEach(function (id) { have[id] = 1; });
    H.userCards(G).filter(function (c) { return H.available(c) && !taken[c.id] && !have[c.id]; }).sort(function (a, b) { return H.eff(b) - H.eff(a); }).forEach(function (c) { if (S.bench.length < 9) { S.bench.push(c.id); } });
    return changed;
  };
  H.slotPlayers = function (G) { return G.S.slots.map(function (id) { return id ? G.P[id] || null : null; }); };
  H.userEval = function (G) { return H.evaluate(G.S.formation, H.slotPlayers(G)); };
  H.setFormation = function (G, fm) {
    var S = G.S, cards = S.slots.map(function (id) { return id ? G.P[id] : null; }).filter(Boolean);
    S.formation = fm;
    var fs = H.FORMATIONS[fm], pool = cards.slice(), out = new Array(11).fill(null);
    fs.forEach(function (s, i) { var k = pool.findIndex(function (c) { return c.pos === s[0]; }); if (k >= 0) { out[i] = pool[k].id; pool.splice(k, 1); } });
    fs.forEach(function (s, i) {
      if (out[i]) return;
      var bi = -1, bv = -99; pool.forEach(function (c, k) { var v = H.eff(c) - H.penalty(s[0], c.pos); if (v > bv) { bv = v; bi = k; } });
      if (bi >= 0) { out[i] = pool[bi].id; pool.splice(bi, 1); }
    });
    S.slots = out;
    pool.forEach(function (c) { if (S.bench.length < 9 && S.bench.indexOf(c.id) < 0) S.bench.push(c.id); });
    H.fixLineup(G);
  };

  /* ---------------- building teams for the match ---------------- */
  H.userTeam = function (G) {
    var S = G.S, uc = H.userClub(G), e = H.userEval(G);
    var on = e.rows.map(function (r) { return { id: r.card.id, name: r.card.n, pos: r.slot, ovr: r.eff, stats: H.statsOf(r.card), fit: r.card.ft }; });
    var bench = S.bench.map(function (id) { return G.P[id]; }).filter(Boolean).map(function (c) { return { id: c.id, name: c.n, pos: c.pos, ovr: H.eff(c), stats: H.statsOf(c), fit: c.ft }; });
    return { name: uc.name, color: uc.col, on: on, bench: bench, mentality: S.mentality, style: S.style, press: S.press, formation: S.formation, isUser: true, boost: (S.harm || 0) * 0.0003 };
  };
  H.aiTeam = function (G, cid) {
    var c = G.S.clubs[cid]; H.recalcClub(G, c);
    var lu = G.LU[cid], on = lu.rows.map(function (r) { return r.card ? { id: r.card.id, name: r.card.n, pos: r.slot, ovr: r.eff, stats: H.statsOf(r.card) } : null; }).filter(Boolean);
    var bench = lu.bench.filter(Boolean).slice(0, 7).map(function (p) { return { id: p.id, name: p.n, pos: p.pos, ovr: p.o, stats: H.statsOf(p) }; });
    return { name: c.name, color: c.col, on: on, bench: bench, mentality: pick(H.MENTALITY), style: pick(H.STYLE), press: pick(H.PRESS), formation: c.fm, isUser: false };
  };

  /* ---------------- the calendar ---------------- */
  H.windowOpen = function (G) { var w = G.S.week; return G.S.stage === 'pre' || w <= 4 || (w >= 20 && w <= 24); };
  /* draw the cup rounds that start this week */
  H.beginWeek = function (G) {
    var S = G.S, w = S.week;
    H.LEAGUES.forEach(function (lg) {
      var cup = S.cup[lg.id];
      if (cup.alive.length > 1 && w === CUPW[cup.round] && cup.drawn !== cup.round) {
        var a = shuffle(cup.alive.slice()), ties = [];
        if (a.length % 2) { var bye = a.pop(); ties.push({ h: bye, a: -1, g: null, w: bye, pen: null }); }
        while (a.length) ties.push({ h: a.pop(), a: a.pop(), g: null, w: null, pen: null });
        cup.ties = ties; cup.drawn = cup.round;
      }
    });
    var cc = S.cc;
    if (!cc.over) {
      CCW.forEach(function (ws, r) {
        if (w === ws[0] && cc.round === r && cc.drawn !== r) {
          var a = shuffle(cc.alive.slice()), ties = [];
          while (a.length > 1) ties.push({ a: a.pop(), b: a.pop(), g: [null, null], w: null, pen: null });
          cc.ties = ties; cc.drawn = r;
        }
      });
    }
  };
  /* the user's unplayed matches this week: [{comp,name,h,a,ref,...}] */
  H.pending = function (G) {
    var S = G.S, uid = S.uid, lg = H.userClub(G).lg, w = S.week, out = [];
    var cc = S.cc;
    if (!cc.over) CCW.forEach(function (ws, r) {
      ws.forEach(function (wk, leg) {
        if (wk !== w || cc.round !== r || cc.drawn !== r) return;
        cc.ties.forEach(function (t) {
          if ((t.a === uid || t.b === uid) && t.g[leg] == null && t.w == null) {
            var home = ws.length === 1 ? t.a : (leg === 0 ? t.a : t.b);
            out.push({ comp: 'cc', name: 'Champions Cup · ' + CCN[r] + (ws.length > 1 ? ' · Leg ' + (leg + 1) : ''), h: home, a: home === t.a ? t.b : t.a, tie: t, leg: leg, round: r, two: ws.length > 1, kind: 'ko' });
          }
        });
      });
    });
    var cup = S.cup[lg];
    if (cup.alive.length > 1 && cup.drawn === cup.round && w === CUPW[cup.round]) cup.ties.forEach(function (t) {
      if (t.g == null && t.a >= 0 && (t.h === uid || t.a === uid)) out.push({ comp: 'cup', name: cup.name + ' · Round ' + (cup.round + 1), h: t.h, a: t.a, tie: t, kind: 'ko' });
    });
    var L = S.lg[lg];
    if (w >= 1 && w <= L.rounds.length) L.rounds[w - 1].forEach(function (f, i) { if (f[2] < 0 && (f[0] === uid || f[1] === uid)) out.push({ comp: 'lg', name: H.lgOf(lg).name + ' · Matchday ' + w, h: f[0], a: f[1], f: f, kind: 'lg' }); });
    return out;
  };
  /* what the user plays this week, with the ones already done (for the home screen) */
  H.weekPreview = function (G) { return H.pending(G); };

  /* after a user match: save the result, update players, money, board and news */
  H.recordResult = function (G, fx, m) {
    var S = G.S, uid = S.uid, uc = H.userClub(G), side = fx.h === uid ? 0 : 1;
    var us = m.score[side], them = m.score[1 - side], oppId = side === 0 ? fx.a : fx.h, opp = S.clubs[oppId];
    var res = { fx: fx, us: us, them: them, win: us > them, draw: us === them, side: side, opp: opp, prize: 0, note: '', gate: 0 };
    if (fx.comp === 'lg') { fx.f[2] = m.score[0]; fx.f[3] = m.score[1]; }
    else if (fx.comp === 'cup') {
      fx.tie.g = [m.score[0], m.score[1]]; var wn = H.winnerOf(m);
      fx.tie.pen = m.pens ? m.pens.score : null; fx.tie.w = wn === 0 ? fx.h : fx.a;
    } else {
      var t = fx.tie, ab = fx.h === t.a ? [m.score[0], m.score[1]] : [m.score[1], m.score[0]];
      t.g[fx.two ? fx.leg : 0] = ab;
      if (!fx.two || fx.leg === 1) { var wn2 = H.winnerOf(m); t.w = wn2 === 0 ? fx.h : fx.a; t.pen = m.pens ? m.pens.score : null; }
    }
    applyMatch(G, m, side, fx);
    // gate money
    if (side === 0) {
      var gate = H.gateIncome(G, uc, opp);
      S.wk.gate += gate; res.gate = gate;
    }
    // board and morale
    var exp = (uc.str - opp.str) + (side === 0 ? 1.5 : -1.5);
    var dc = res.win ? (exp < -4 ? 2.4 : exp < 4 ? 1.4 : 0.7) : res.draw ? (exp < -4 ? 0.4 : exp < 4 ? -0.3 : -1.2) : (exp > 4 ? -2.6 : exp > -4 ? -1.6 : -0.7);
    if (fx.comp !== 'lg') dc *= 0.7;
    S.board.conf = clamp(S.board.conf + dc, 0, 100);
    var line = uc.name + ' ' + (side === 0 ? us + '-' + them : them + '-' + us).replace(/(\d+)-(\d+)/, function (s, a, b) { return side === 0 ? a + '-' + b : b + '-' + a; });
    var hn = S.clubs[fx.h].name, an = S.clubs[fx.a].name;
    news(G, (res.win ? 'Win: ' : res.draw ? 'Draw: ' : 'Defeat: ') + hn + ' ' + m.score[0] + '-' + m.score[1] + ' ' + an + (m.pens ? ' (pens ' + m.pens.score[0] + '-' + m.pens.score[1] + ')' : '') + ' · ' + fx.name.split(' · ')[0], res.win ? 'w' : res.draw ? 'd' : 'l');
    void line;
    // knockout bookkeeping for the user
    if (fx.comp === 'cup') {
      if (fx.tie.w === uid) { S.cupRound = Math.max(S.cupRound, S.cup[uc.lg].round + 1); res.note = 'You are through to the next round of the cup!'; }
      else res.note = 'You are out of the cup.';
    } else if (fx.comp === 'cc') {
      var tt = fx.tie;
      if (tt.w != null) {
        if (tt.w === uid) { S.ccRound = Math.max(S.ccRound, fx.round); var pr = CC_PRIZE[fx.round]; S.wk.prize += pr; res.prize = pr; res.note = fx.round === 3 ? 'YOU WON THE CHAMPIONS CUP!' : 'You are through to the ' + CCN[fx.round + 1] + '!'; }
        else res.note = 'You are out of the Champions Cup.';
      } else if (fx.two && fx.leg === 0) res.note = 'First leg done. The return leg is in a few weeks.';
    }
    if (H.afterMatch) H.afterMatch(G, res, m);
    return res;
  };
  /* two-leg tie finished? returns winner id or null */
  function ccTieWinner(G, t, force) {
    var ga = 0, gb = 0;
    t.g.forEach(function (g) { if (g) { ga += g[0]; gb += g[1]; } });
    if (ga !== gb) return ga > gb ? t.a : t.b;
    if (!force) return null;
    var sa = G.S.clubs[t.a].str, sb = G.S.clubs[t.b].str, pa = clamp(0.5 + (sa - sb) * 0.01, 0.3, 0.7);
    t.pen = R() < pa ? [5, 4] : [4, 5];
    return t.pen[0] > t.pen[1] ? t.a : t.b;
  }

  /* quick results for every match the user does not play this week */
  function pickScorers(G, cid, goals, opp) {
    var lu = G.LU[cid]; if (!lu) return;
    var pl = lu.on.filter(Boolean);
    for (var i = 0; i < goals; i++) {
      var tot = 0, ws = pl.map(function (p) { var w = (H.SHOOT_W[p.pos] || 0.5) * Math.pow(p.o / 70, 2); tot += w; return w; });
      var x = R() * tot, sc = pl[0], k;
      for (k = 0; k < pl.length; k++) { x -= ws[k]; if (x < 0) { sc = pl[k]; break; } }
      sc.g++;
      if (R() < 0.7) { var tot2 = 0, w2 = pl.map(function (p) { var w = (H.PASS_W[p.pos] || 0.5) * Math.pow(p.o / 70, 2); tot2 += w; return p === sc ? 0 : w; }); var y = R() * tot2; for (k = 0; k < pl.length; k++) { y -= w2[k]; if (y < 0) { pl[k].as++; break; } } }
    }
  }
  function koSim(G, h, a) { // single match that needs a winner: returns [hg,ag,winnerId,pen]
    var S = G.S, r = H.quickSim(S.clubs[h].str, S.clubs[a].str), w, pen = null;
    if (r[0] === r[1]) { var p = clamp(0.5 + (S.clubs[h].str - S.clubs[a].str) * 0.01, 0.3, 0.7); w = R() < p ? h : a; pen = w === h ? [5, 4] : [4, 5]; }
    else w = r[0] > r[1] ? h : a;
    pickScorers(G, h, r[0]); pickScorers(G, a, r[1]);
    return [r[0], r[1], w, pen];
  }
  function simOthers(G) {
    var S = G.S, uid = S.uid, w = S.week;
    // leagues
    H.LEAGUES.forEach(function (lg) {
      var L = S.lg[lg.id];
      if (w < 1 || w > L.rounds.length) return;
      L.rounds[w - 1].forEach(function (f) {
        if (f[2] >= 0) return;
        var r = H.quickSim(S.clubs[f[0]].str, S.clubs[f[1]].str);
        f[2] = r[0]; f[3] = r[1];
        pickScorers(G, f[0], r[0]); pickScorers(G, f[1], r[1]);
        [f[0], f[1]].forEach(function (cid) { var lu = G.LU[cid]; if (lu) lu.on.forEach(function (p) { if (p) p.ap++; }); });
      });
    });
    // domestic cups
    H.LEAGUES.forEach(function (lg) {
      var cup = S.cup[lg.id];
      if (cup.alive.length <= 1 || cup.drawn !== cup.round || w !== CUPW[cup.round]) return;
      cup.ties.forEach(function (t) {
        if (t.w != null || t.g) return;
        var r = koSim(G, t.h, t.a); t.g = [r[0], r[1]]; t.w = r[2]; t.pen = r[3];
      });
      var winners = cup.ties.map(function (t) { return t.w; });
      cup.hist.push(cup.ties.map(function (t) { return { h: t.h, a: t.a, g: t.g, w: t.w, pen: t.pen }; }));
      cup.alive = winners; cup.round++;
      if (lg.id === S.clubs[uid].lg && winners.indexOf(uid) >= 0) S.cupRound = Math.max(S.cupRound, cup.round);
      if (cup.alive.length === 1) {
        cup.winner = cup.alive[0];
        news(G, S.clubs[cup.winner].name + ' win the ' + cup.name + '!', cup.winner === uid ? 'w' : 'n');
        if (cup.winner === uid) { S.wk.prize += S.clubs[uid].revW * LAST_WEEK * 0.025; S.board.conf = clamp(S.board.conf + 6, 0, 100); }
      }
    });
    // Champions Cup
    var cc = S.cc;
    if (!cc.over) CCW.forEach(function (ws, r) {
      if (cc.round !== r || cc.drawn !== r) return;
      var leg = ws.indexOf(w);
      if (leg < 0) return;
      cc.ties.forEach(function (t) {
        if (t.w != null) return;
        if (t.g[leg] == null) {
          var home = ws.length === 1 ? t.a : (leg === 0 ? t.a : t.b), away = home === t.a ? t.b : t.a;
          var rs = H.quickSim(S.clubs[home].str, S.clubs[away].str);
          t.g[leg] = home === t.a ? [rs[0], rs[1]] : [rs[1], rs[0]];
          pickScorers(G, home, rs[0]); pickScorers(G, away, rs[1]);
        }
        if (leg === ws.length - 1) { t.w = ccTieWinner(G, t, true); }
      });
      if (leg === ws.length - 1) {
        var winners = cc.ties.map(function (t) { return t.w; });
        cc.hist.push(cc.ties.map(function (t) { return { a: t.a, b: t.b, g: t.g, w: t.w, pen: t.pen }; }));
        cc.alive = winners; cc.round++;
        var userIn = cc.ties.some(function (t) { return t.a === uid || t.b === uid; });
        if (cc.alive.length === 1) {
          cc.winner = cc.alive[0]; cc.over = true;
          news(G, S.clubs[cc.winner].name + ' win the Champions Cup!', cc.winner === uid ? 'w' : 'n');
          if (cc.winner === uid) S.board.conf = clamp(S.board.conf + 10, 0, 100);
        } else if (userIn) { /* news about the user's tie came from the match itself */ }
      }
    });
  }

  /* ---------------- money ---------------- */
  H.annualRev = function (c) { return c.revW * LAST_WEEK; };
  H.stadiumCap = function (c) { return c.cap * (1 + 0.1 * (c.fac[0] - c.fac0[0])); };
  H.ticketPrice = function (c) { return (12 + c.rep * 0.7) * (1 + 0.03 * (c.fac[0] - c.fac0[0])); };
  H.attendance = function (G, c) {
    var pos = c.lg ? H.position(G, c.lg, c.id) : 10, n = G.S.lg[c.lg].ids.length;
    var form = 0.12 * (1 - (pos - 1) / Math.max(1, n - 1));
    return clamp(0.72 + form + 0.012 * (c.fac[4] - 1) + (c.rep - 50) / 700, 0.5, 1);
  };
  H.hgames = function (G, c) { return Math.max(1, G.S.lg[c.lg].ids.length - 1); };
  H.gateIncome = function (G, c, opp) {
    var base = c.revW * 0.33 * LAST_WEEK / H.hgames(G, c);
    var capF = H.stadiumCap(c) / c.cap, att = H.attendance(G, c);
    var big = opp ? 1 + (opp.rep - 50) / 400 : 1;
    return base * capF * (att / 0.85) * big * (1 + 0.03 * (c.fac[0] - c.fac0[0]));
  };
  H.weeklyIncome = function (G, c) {
    var S = G.S, mult = S.sponsor ? S.sponsor.mult : 1;
    return { tv: 0.20 * c.revW, spons: 0.30 * c.revW * mult, comm: 0.17 * c.revW * (1 + 0.05 * (c.fac[4] - c.fac0[4])) };
  };
  H.wageBill = function (G, cid) { var t = 0; (G.SQ[cid] || []).forEach(function (p) { t += p.w; }); return t; };
  H.upkeep = function (c) { var up = 0.05 * c.revW; for (var i = 0; i < 5; i++) up += 0.004 * c.revW * Math.max(0, c.fac[i] - c.fac0[i]); return up; };
  H.FAC = [
    { k: 'stad', name: 'Stadium', icon: '🏟️', desc: 'More seats and better tickets: bigger gate income.' },
    { k: 'train', name: 'Training ground', icon: '🏋️', desc: 'Players improve faster and recover quicker.' },
    { k: 'acad', name: 'Youth academy', icon: '🌱', desc: 'Better young players come through every season.' },
    { k: 'med', name: 'Medical centre', icon: '🩺', desc: 'Shorter injuries and fewer long-term knocks.' },
    { k: 'fans', name: 'Fan zone and shop', icon: '🎽', desc: 'Fuller stands and more merchandise money.' },
  ];
  H.facCost = function (c, i) { var L = c.fac[i]; return c.revW * LAST_WEEK * 0.03 * Math.pow(L, 1.25); };
  H.facWeeks = function (c, i) { return (i === 0 ? 5 : 3) + c.fac[i]; };
  H.startBuild = function (G, i) {
    var S = G.S, c = H.userClub(G);
    if (c.fac[i] >= 10) return 'This is already at the maximum level.';
    if (S.build.some(function (b) { return b.i === i; })) return 'Already being upgraded.';
    var cost = H.facCost(c, i);
    if (c.cash < cost) return 'Not enough money.';
    c.cash -= cost; S.wk.build += cost; S.tot.exp.build += cost;
    S.build.push({ i: i, wk: H.facWeeks(c, i) });
    news(G, 'Work starts on the ' + H.FAC[i].name + ' upgrade (' + H.fm(cost) + ').', 'b');
    return null;
  };

  /* ---------------- progression ---------------- */
  function weeklyProgress(G) { // small gains for the user's young players during the season
    var S = G.S, c = H.userClub(G), intens = [0.6, 1, 1.4][S.train - 1] || 1, tf = 0.9 + 0.06 * c.fac[1];
    H.userCards(G).forEach(function (p) {
      if (p.a <= 27 && p.o < p.p) {
        var ch = 0.009 * intens * tf * (p.p - p.o) / 3 * (p.a <= 20 ? 1.4 : 1) * (p.ap > 0 ? 1.15 : 0.7);
        if (R() < ch) { p.o++; p.tr++; H.refresh(p); p.w = Math.max(p.w, H.wageOf(p.v * 0.6, p.o)); if (p.o >= 85) news(G, p.n + ' has improved to ' + p.o + '!', 'g'); }
      }
    });
  }
  function ageStep(p, g, extra) {
    var a = p.a, d;
    if (a <= 18) d = ri(1, 5); else if (a <= 21) d = ri(1, 4); else if (a <= 24) d = ri(0, 3); else if (a <= 27) d = ri(-1, 2);
    else if (a <= 30) d = ri(-2, 1); else if (a <= 33) d = ri(-3, 0); else d = ri(-4, -1);
    if (d > 0) { d += extra; d = Math.min(d, Math.max(0, p.p - p.o)); }
    if (d > 0 && p.a >= 22 && R() < 0.25) d = Math.max(0, d - 1);
    p.o = clamp(p.o + d, 30, 99);
    if (a <= 22 && p.o >= p.p - 1 && R() < 0.35) p.p = clamp(p.p + 1, p.o, 99);
    if (a >= 26) p.p = Math.max(p.o, Math.min(p.p, p.o + (a >= 29 ? 0 : 1)));
    if (p.p < p.o) p.p = p.o;
    return d;
  }

  /* ---------------- weekly processing ---------------- */
  function weeklyProcess(G) {
    var S = G.S, uc = H.userClub(G), uid = S.uid;
    // 1. money
    var inc = H.weeklyIncome(G, uc), wk = S.wk;
    wk.tv += inc.tv; wk.spons += inc.spons; wk.comm += inc.comm;
    var wages = H.wageBill(G, uid), up = H.upkeep(uc);
    wk.wages += wages; wk.upkeep += up;
    var income = wk.gate + wk.tv + wk.spons + wk.comm + wk.prize, exp = wk.wages + wk.upkeep;
    uc.cash += income - exp;
    ['gate', 'tv', 'spons', 'comm', 'prize'].forEach(function (k) { S.tot.inc[k] += wk[k]; });
    S.tot.exp.wages += wk.wages; S.tot.exp.upkeep += wk.upkeep;
    S.fin.unshift({ w: S.week, inc: income, exp: exp + wk.build + wk.fees, gate: wk.gate, prize: wk.prize, wages: wk.wages });
    if (S.fin.length > 12) S.fin.length = 12;
    S.wk = emptyWk();
    if (uc.cash < 0) { S.board.conf = clamp(S.board.conf - 1.5, 0, 100); if (S.week % 4 === 0) news(G, 'The board is worried: the club is in the red (' + H.fm(uc.cash) + ').', 'b'); }
    // build projects
    S.build = S.build.filter(function (b) {
      b.wk--;
      if (b.wk <= 0) { uc.fac[b.i]++; news(G, H.FAC[b.i].name + ' upgrade finished: now level ' + uc.fac[b.i] + '!', 'g'); return false; }
      return true;
    });
    // 2. the user's squad
    var med = uc.fac[3], intens = S.train;
    H.userCards(G).forEach(function (p) {
      var rest = ri(20, 30) + Math.round(med * 0.8) - (intens - 2) * 4;
      p.ft = clamp(p.ft + rest, 0, 100);
      if (p.inj > 0) { p.inj--; if (p.inj === 0) news(G, p.n + ' is fit again.', 'n'); }
      if (p.sus > 0) p.sus--;
      p.mo = clamp(Math.round(p.mo + (65 - p.mo) * 0.12), 10, 100);
    });
    weeklyProgress(G);
    // 3. everybody else
    S.clubs.forEach(function (c) {
      if (c.id === uid) return;
      var sq = G.SQ[c.id];
      sq.forEach(function (p) { if (p.inj > 0) p.inj--; });
      if (R() < 0.14) { var v = sq[ri(0, sq.length - 1)]; if (v && !v.inj) v.inj = R() < 0.1 ? ri(8, 20) : ri(1, 6); }
      c.cash += c.revW * 0.30 + (R() - 0.4) * c.revW * 0.1;
    });
    // 4. transfers in the window
    if (H.windowOpen(G)) { aiTransfers(G); makeOffers(G); }
    S.offers = S.offers.filter(function (o) { return S.week - o.w <= 2 && G.P[o.pid] && G.P[o.pid].cl === uid; });
    S.clubs.forEach(function (c) { H.recalcClub(G, c); });
    H.fixLineup(G);
    if (S.board.conf < 5) S.sacked = true;
  }

  /* ---------------- transfers ---------------- */
  H.askPrice = function (G, p) {
    if (p.cl == null) return 0;
    var c = G.S.clubs[p.cl], sq = G.SQ[p.cl].slice().sort(function (a, b) { return b.o - a.o; });
    var top = sq.indexOf(p) < 3, m = 1 + (H.hash(p.id * 7 + G.S.week) % 21 - 10) / 100;
    if (top) m += 0.2;
    if (p.ct <= 1) m -= 0.2;
    if (p.a >= 32) m -= 0.1;
    if (c.cash < 0) m -= 0.1;
    return Math.max(0.01, p.v * m);
  };
  H.contractAsk = function (G, p, myClub) {
    var from = p.cl == null ? 30 : G.S.clubs[p.cl].rep, my = myClub.rep;
    var w = p.w * (1.0 + Math.max(0, (from - my)) / 120 + (p.cl == null ? 0.1 : 0.15));
    var lead = G.SQ[myClub.id].slice().sort(function (a, b) { return b.o - a.o; }).slice(0, 14);
    var refuse = null;
    if (p.cl != null && from - my > 22 && !(p.a >= 33)) refuse = p.n + ' does not want to leave a bigger club for you.';
    else if (p.o < 70 && lead.length && lead[Math.min(10, lead.length - 1)].o - p.o > 12) refuse = p.n + ' will not join a club where he would not play.';
    return { wage: Math.max(0.0008, w), refuse: refuse };
  };
  H.bid = function (G, pid, fee) {
    var p = G.P[pid]; if (!p) return { ok: false, msg: 'Player not found.' };
    if (p.cl === G.S.uid) return { ok: false, msg: 'He already plays for you.' };
    if (p.cl == null) return { ok: true, status: 'accepted', msg: 'He is a free agent. Agree his contract.' };
    if (!H.windowOpen(G)) return { ok: false, status: 'closed', msg: 'The transfer window is closed. You can only sign free agents.' };
    var ask = H.askPrice(G, p);
    if (fee >= ask) return { ok: true, status: 'accepted', ask: ask, msg: G.S.clubs[p.cl].name + ' accept your offer.' };
    if (fee >= ask * 0.85) return { ok: false, status: 'counter', ask: ask, msg: G.S.clubs[p.cl].name + ' want ' + H.fm(ask) + '.' };
    return { ok: false, status: 'reject', ask: ask, msg: G.S.clubs[p.cl].name + ' reject your offer. It is far too low.' };
  };
  H.signPlayer = function (G, pid, fee, wage, years) {
    var S = G.S, p = G.P[pid], uc = H.userClub(G), from = p.cl;
    if (!p || from === S.uid) return 'Not possible.';
    if (uc.cash < fee) return 'You cannot afford that fee.';
    if (G.SQ[S.uid].length >= MAXSQ) return 'Your squad is full (' + MAXSQ + '). Sell or release someone first.';
    var ask = H.contractAsk(G, p, uc);
    if (ask.refuse) return ask.refuse;
    if (wage < ask.wage * 0.98) return p.n + ' wants at least ' + H.fm(ask.wage) + ' a week.';
    if (from != null) { S.clubs[from].cash += fee; ensureSquadSoon(G, S.clubs[from]); }
    uc.cash -= fee; S.wk.fees += fee; S.tot.exp.buys += fee;
    H.moveTo(G, p, S.uid); p.w = wage; p.ct = years; p.mo = 75; p.yth = false;
    if (H.logXf) H.logXf(G, 'in', p, from, fee);
    news(G, 'Signed ' + p.n + ' (' + p.pos + ', ' + p.o + ') for ' + (fee > 0 ? H.fm(fee) : 'free') + '.', 'g');
    H.fixLineup(G);
    return null;
  };
  function ensureSquadSoon(G, c) { if (G.SQ[c.id].length < 22) ensureSquad(G, c, {}); }
  H.sellPlayer = function (G, pid, fee, toCid) {
    var S = G.S, p = G.P[pid], uc = H.userClub(G);
    if (!p || p.cl !== S.uid) return 'Not your player.';
    if (G.SQ[S.uid].length <= 18) return 'You need at least 18 players in your squad.';
    var buyer = S.clubs[toCid]; buyer.cash -= fee; uc.cash += fee; S.wk.fees -= 0; S.tot.inc.sales += fee;
    H.moveTo(G, p, toCid); p.ct = ri(2, 4); p.w = H.wageOf(p.v, p.o);
    if (H.logXf) H.logXf(G, 'out', p, toCid, fee);
    news(G, 'Sold ' + p.n + ' to ' + buyer.name + ' for ' + H.fm(fee) + '.', 'g');
    H.fixLineup(G); ensureSquadSoon(G, buyer);
    return null;
  };
  H.releasePlayer = function (G, pid) {
    var S = G.S, p = G.P[pid], uc = H.userClub(G);
    if (!p || p.cl !== S.uid) return 'Not your player.';
    if (G.SQ[S.uid].length <= 18) return 'You need at least 18 players in your squad.';
    var cost = p.w * LAST_WEEK * Math.min(2, Math.max(0, p.ct)) * 0.5;
    if (uc.cash < cost) return 'You cannot afford the contract pay-off (' + H.fm(cost) + ').';
    uc.cash -= cost; S.tot.exp.buys += cost;
    H.moveTo(G, p, null); p.ct = 0; news(G, 'Released ' + p.n + ' (pay-off ' + H.fm(cost) + ').', 'n');
    H.fixLineup(G);
    return null;
  };
  H.releaseCost = function (p) { return p.w * LAST_WEEK * Math.min(2, Math.max(0, p.ct)) * 0.5; };
  H.renewAsk = function (G, p) {
    var uc = H.userClub(G), mood = (65 - p.mo) / 200, w = Math.max(p.w * 1.08, H.wageOf(p.v, p.o) * 0.95) * (1 + Math.max(0, mood) + (p.o >= 80 ? 0.05 : 0));
    return { wage: w, refuse: p.mo < 25 ? p.n + ' is too unhappy to talk about a new deal.' : null };
  };
  H.renewPlayer = function (G, pid, wage, years) {
    var p = G.P[pid], a = H.renewAsk(G, p);
    if (a.refuse) return a.refuse;
    if (wage < a.wage * 0.98) return p.n + ' wants at least ' + H.fm(a.wage) + ' a week.';
    p.w = wage; p.ct = years; p.mo = clamp(p.mo + 8, 0, 100);
    news(G, p.n + ' signs a new ' + years + '-year contract.', 'g');
    return null;
  };
  /* AI to AI transfers, so the world moves */
  function aiTransfers(G) {
    var S = G.S, n = ri(3, 7), tries = 0;
    while (n > 0 && tries++ < 60) {
      var sc = S.clubs[ri(0, S.clubs.length - 1)];
      if (sc.id === S.uid) continue;
      var sq = G.SQ[sc.id]; if (sq.length < 23) continue;
      var p = sq[ri(0, sq.length - 1)];
      if (p.o < 62) continue;
      var bc = S.clubs[ri(0, S.clubs.length - 1)];
      if (bc.id === S.uid || bc.id === sc.id) continue;
      var fee = p.v * (0.9 + R() * 0.3);
      if (bc.cash < fee || bc.rep < sc.rep - 14) continue;
      var worst = G.SQ[bc.id].slice().sort(function (a, b) { return b.o - a.o; })[10];
      if (worst && p.o < worst.o - 1) continue;
      bc.cash -= fee; sc.cash += fee;
      H.moveTo(G, p, bc.id); p.ct = ri(2, 5); p.w = H.wageOf(p.v, p.o);
      if (G.SQ[bc.id].length > 30) { var dump = G.SQ[bc.id].slice().sort(function (a, b) { return a.o - b.o; })[0]; H.moveTo(G, dump, null); dump.ct = 0; }
      ensureSquadSoon(G, sc);
      if (p.o >= 80) news(G, p.n + ' (' + p.o + ') moves from ' + sc.name + ' to ' + bc.name + ' for ' + H.fm(fee) + '.', 't');
      n--;
    }
  }
  function makeOffers(G) {
    var S = G.S, uc = H.userClub(G);
    G.SQ[S.uid].forEach(function (p) {
      if (p.v < 0.15) return;
      var prob = 0.025 + (p.lst ? 0.18 : 0) + (p.o >= 82 ? 0.02 : 0);
      if (R() > prob || S.offers.some(function (o) { return o.pid === p.id; })) return;
      var cands = S.clubs.filter(function (c) { return c.id !== S.uid && c.cash > p.v * 1.1 && c.rep >= uc.rep - 18 && c.rep <= uc.rep + 40; });
      if (!cands.length) return;
      var b = pick(cands), fee = p.v * (0.85 + R() * 0.5) * (p.lst ? 1.0 : 1.05);
      S.offers.push({ pid: p.id, from: b.id, fee: fee, w: S.week });
      news(G, b.name + ' offer ' + H.fm(fee) + ' for ' + p.n + '.', 't');
    });
  }
  H.searchPlayers = function (G, f) {
    var S = G.S, out = [], q = (f.q || '').toLowerCase();
    S.players.forEach(function (p) {
      if (p.cl === S.uid) return;
      if (f.fa && p.cl != null) return;
      if (q && p.n.toLowerCase().indexOf(q) < 0 && (p.cl == null || S.clubs[p.cl].name.toLowerCase().indexOf(q) < 0)) return;
      if (f.pos && f.pos !== 'all' && H.GROUP[p.pos] !== f.pos) return;
      if (f.lg && f.lg !== 'all' && (p.cl == null || S.clubs[p.cl].lg !== f.lg)) return;
      if (f.minO && p.o < f.minO) return;
      if (f.maxA && p.a > f.maxA) return;
      if (f.minP && p.p < f.minP) return;
      if (f.maxV != null && p.v > f.maxV) return;
      out.push(p);
    });
    var key = f.sort === 'pot' ? 'p' : f.sort === 'val' ? 'v' : 'o';
    out.sort(function (a, b) { return (b[key] - a[key]) || (b.o - a.o); });
    return out.slice(0, f.limit || 50);
  };

  /* ---------------- youth ---------------- */
  H.makeYouth = function (G, c, n) {
    var lg = H.lgOf(c.lg), L = c.fac[2], out = [], used = {};
    for (var i = 0; i < n; i++) {
      var o = ri(34, 46) + Math.round(L * 1.6) + ri(0, 6);
      var pot = 58 + L * 2.6 + ri(0, 20);
      if (R() < 0.015 + L * 0.004) pot = ri(93, 98);
      else if (R() < 0.06 + L * 0.01) pot += ri(6, 12);
      pot = clamp(Math.round(pot), 50, 98);
      var p = H.makePlayer({ pos: H.randomPos(), o: o, p: pot, a: ri(16, 18), nat: R() < 0.8 ? lg.nat : pick(Object.keys(H.NAT)), cl: c.id, ct: 3, yth: true }, used);
      p.w = H.wageOf(p.v * 0.3, p.o) * 0.5; addPlayer(G, p); out.push(p);
    }
    return out;
  };

  /* ---------------- the end of a season ---------------- */
  H.endSeason = function (G) {
    var S = G.S, uid = S.uid, uc = H.userClub(G), rv = { year: S.year, lgName: H.lgOf(uc.lg).name };
    // tables and champions
    var tables = {}, champs = {};
    H.LEAGUES.forEach(function (lg) { tables[lg.id] = H.table(G, lg.id); champs[lg.id] = tables[lg.id][0].id; S.clubs[champs[lg.id]].ttl++; });
    var table = tables[uc.lg], pos = 0; table.forEach(function (r, i) { if (r.id === uid) pos = i + 1; });
    var n = table.length;
    rv.table = table; rv.pos = pos; rv.n = n; rv.champ = champs[uc.lg];
    // prizes
    var prize = uc.revW * LAST_WEEK * 0.12 * (n - pos + 1) / n;
    uc.cash += prize; S.tot.inc.prize += prize; rv.prize = prize;
    if (S.sponsor && S.sponsor.bonus && pos <= S.sponsor.need) { uc.cash += S.sponsor.bonus; rv.sponsorBonus = S.sponsor.bonus; }
    if (S.sponsor && S.sponsor.need <= 3 && pos > 8) { var pen = uc.revW * LAST_WEEK * 0.03; uc.cash -= pen; rv.sponsorPenalty = pen; }
    // objectives
    var ob = S.obj, d = pos <= ob.target ? (pos < ob.target ? 14 : 9) : (pos <= ob.target + 2 ? -8 : -20);
    rv.lgMet = pos <= ob.target;
    if (ob.cup != null) { if (S.cupRound >= ob.cup) d += 3; else d -= 2; rv.cupMet = S.cupRound >= ob.cup; }
    if (ob.cc != null) { if (S.ccRound + 1 >= ob.cc) d += 3; else d -= 3; rv.ccMet = S.ccRound + 1 >= ob.cc; }
    if (pos === 1) d += 8;
    if (uc.cash < 0) d -= 12;
    S.board.conf = clamp(S.board.conf + d, 0, 100);
    rv.conf = Math.round(S.board.conf); rv.dconf = d;
    if (pos === 1) { S.champions.push(S.year); news(G, 'CHAMPIONS! ' + uc.name + ' win the ' + rv.lgName + '!', 'w'); }
    // manager reputation
    var drep = pos <= ob.target ? (pos === 1 ? 4 : 2) : (pos <= ob.target + 2 ? 0 : -2);
    S.mgr.rep = clamp(S.mgr.rep + drep + (S.cc.winner === uid ? 3 : 0), 5, 99);
    rv.mgrRep = S.mgr.rep;
    // awards
    var best = null, bs = -1, gb = {}, scorers = [];
    S.players.forEach(function (p) {
      if (p.cl == null) return;
      var c = S.clubs[p.cl], sc = p.g * 2.2 + p.as * 1.2 + (p.o - 60) * 0.35 + (champs[c.lg] === c.id ? 3 : 0) + (c.rep > 85 ? 1.5 : 0) + (S.cc.winner === c.id ? 3 : 0);
      if (p.ap > 10 || c.id !== uid) { if (sc > bs && p.g + p.as >= 6) { bs = sc; best = p; } }
      if (c.lg === uc.lg) scorers.push(p);
    });
    scorers.sort(function (a, b) { return (b.g - a.g) || (b.as - a.as); });
    rv.scorers = scorers.slice(0, 8).map(function (p) { return { n: p.n, club: S.clubs[p.cl].name, g: p.g, as: p.as, id: p.id }; });
    rv.bestPlayer = best ? { n: best.n, club: S.clubs[best.cl].name, o: best.o } : null;
    if (best) news(G, 'Player of the Year: ' + best.n + ' (' + S.clubs[best.cl].name + ').', 't');
    rv.cc = S.cc.winner != null ? S.clubs[S.cc.winner].name : null;
    rv.cupWinner = S.cup[uc.lg].winner != null ? S.clubs[S.cup[uc.lg].winner].name : null;
    rv.cupRound = S.cupRound; rv.ccRound = S.ccRound; rv.inCC = S.cc.teams.indexOf(uid) >= 0;
    S.hist.unshift({ y: S.year, pos: pos, n: n, lg: rv.lgName, club: uc.name, champ: S.clubs[champs[uc.lg]].name, cup: rv.cupWinner, cc: rv.cc, best: rv.bestPlayer ? rv.bestPlayer.n : '', gold: rv.scorers[0] ? rv.scorers[0].n + ' (' + rv.scorers[0].g + ')' : '' });
    if (S.hist.length > 20) S.hist.length = 20;
    S.prevTop = {}; BIG5.forEach(function (id) { S.prevTop[id] = tables[id].map(function (r) { return r.id; }); });
    // reputation drift
    S.clubs.forEach(function (c) {
      var t = tables[c.lg], p = 0; t.forEach(function (r, i) { if (r.id === c.id) p = i; });
      var dr = p < 2 ? 1 : p > t.length - 4 ? -1 : 0;
      if (R() < 0.5) c.rep = clamp(c.rep + dr, 8, 99);
      if (c.id === S.cc.winner) c.rep = clamp(c.rep + 1, 8, 99);
    });
    // player progression
    var changes = [], retired = [], expired = [], left = [];
    var trainBonus = uc.fac[1] * 0.04;
    S.players.slice().forEach(function (p) {
      p.a++;
      var extra = 0;
      if (p.cl === uid) { if (p.a <= 25 && p.ap >= 15 && R() < 0.5) extra += 1; if (p.a <= 27 && R() < trainBonus) extra += 1; }
      else if (p.cl != null && S.clubs[p.cl].rep > 70 && p.a <= 22 && R() < 0.2) extra += 1;
      var old = p.o, dlt = ageStep(p, 0, extra);
      p.o = clamp(p.o, 30, 99); H.refresh(p);
      if (p.cl === uid && (Math.abs(p.o - old) >= 3 || (p.o >= 85 && p.o !== old))) changes.push({ n: p.n, from: old, to: p.o, id: p.id });
      p.tr = 0;
      // contracts
      if (p.cl != null) {
        p.ct--;
        if (p.ct <= 0) {
          if (p.cl === uid) { expired.push(p.n); H.moveTo(G, p, null); p.ct = 0; }
          else if (R() < 0.8) { p.ct = ri(2, 5); p.w = H.wageOf(p.v, p.o); }
          else { H.moveTo(G, p, null); p.ct = 0; }
        } else if (p.cl !== uid) p.w = H.wageOf(p.v, p.o);
      }
      if (p.yth && p.a >= 19) { p.yth = false; if (p.cl === uid) p.w = Math.max(p.w, H.wageOf(p.v * 0.6, p.o)); }
      // retirement
      if (p.a >= 35 && (p.a >= 40 || R() < (p.a - 34) * 0.2 + (p.o < 70 ? 0.15 : 0))) {
        if (p.cl === uid) retired.push(p.n + ' (' + p.a + ')');
        else if (p.o >= 82 && p.cl != null) news(G, p.n + ' retires at ' + p.a + '.', 'n');
        H.removeRetired(G, p);
      }
    });
    // free agents pool: remove the worst and the oldest when it gets big
    var fas = S.players.filter(function (p) { return p.cl == null && !p.del; }).sort(function (a, b) { return b.o - a.o; });
    fas.slice(60).forEach(function (p) { H.removeRetired(G, p); });
    S.players = S.players.filter(function (p) { return !p.del; });
    rv.changes = changes.sort(function (a, b) { return Math.abs(b.to - b.from) - Math.abs(a.to - a.from); }).slice(0, 8);
    rv.retired = retired; rv.expired = expired;
    // youth
    var ny = 2 + Math.floor(uc.fac[2] / 3);
    rv.youth = H.makeYouth(G, uc, ny).map(function (p) { return { id: p.id, n: p.n, pos: p.pos, o: p.o, p: p.p, a: p.a }; });
    S.clubs.forEach(function (c) { if (c.id !== uid) { H.makeYouth(G, c, 2).forEach(function (p) { p.w = H.wageOf(p.v * 0.3, p.o) * 0.5; }); } });
    S.clubs.forEach(function (c) {
      var sq = G.SQ[c.id];
      while (sq.length > 32 && c.id !== uid) { var low = sq.slice().sort(function (a, b) { return (a.o + (a.p - a.o) * 0.5) - (b.o + (b.p - b.o) * 0.5); })[0]; H.moveTo(G, low, null); low.ct = 0; }
      if (c.id !== uid) ensureSquad(G, c, {});
      c.cash = Math.max(c.cash, 0);
      c.revW = Math.max(c.revW * (0.98 + R() * 0.07), H.wageBill(G, c.id) / 0.7);
    });
    ensureSquad(G, uc, {});
    // job offers or the sack
    rv.sacked = S.board.conf < 20 || S.sacked;
    var pool = S.clubs.filter(function (c) { return c.id !== uid && c.cash > -1e9; });
    if (rv.sacked) rv.offers = shuffle(pool.filter(function (c) { return c.rep <= S.mgr.rep + 2 && c.rep >= S.mgr.rep - 28; })).slice(0, 4).map(function (c) { return c.id; });
    else if (S.mgr.rep >= uc.rep + 4) rv.offers = shuffle(pool.filter(function (c) { return c.rep > uc.rep + 2 && c.rep <= S.mgr.rep + 9; })).slice(0, 3).map(function (c) { return c.id; });
    else rv.offers = [];
    if (H.afterSeason) H.afterSeason(G, rv);
    S.review = rv;
    S.stage = 'review';
    return rv;
  };
  H.removeRetired = function (G, p) { removeFrom(G, p); p.del = true; p.cl = null; delete G.P[p.id]; };
  /* start the next season after the review */
  H.nextSeason = function (G, moveToClub) {
    var S = G.S, rv = S.review;
    if (moveToClub != null && moveToClub !== S.uid) {
      var old = H.userClub(G), nc = S.clubs[moveToClub];
      S.moved = nc.rep > old.rep ? true : S.moved; S.uid = moveToClub; S.board = { conf: 55 }; S.mgr.rep = clamp(S.mgr.rep, 5, 99);
      S.sacked = false; S.build = []; S.formation = nc.fm; S.slots = new Array(11).fill(null); S.bench = [];
      news(G, 'You are the new manager of ' + nc.name + '.', 'b');
    } else if (rv && rv.sacked) {
      // the board gives one more chance if the user decides to stay (only if no offers existed)
      S.board.conf = 45; S.sacked = false;
    }
    S.year++; S.seasonNo++;
    S.players.forEach(function (p) { if (p.cl === S.uid && p.ct <= 0) p.ct = 1; });
    H.startSeason(G);
    H.setFormation(G, S.formation);
    H.autoLineup(G);
    news(G, 'Season ' + H.yearName(S.year) + ' begins. ' + S.obj.text + '.', 'b');
    return null;
  };
  H.chooseSponsor = function (G, i) {
    var S = G.S, o = S.sponsorOffers[i]; if (!o) return;
    S.sponsor = o; S.sponsorOffers = [];
    news(G, 'Shirt sponsor: ' + o.name + ' (' + o.label.toLowerCase() + ').', 'b');
  };

  /* ---------------- applying a finished match to the players ---------------- */
  function applyMatch(G, m, side, fx) {
    var S = G.S, uc = H.userClub(G), t = H.teamOf(m, side), opp = H.teamOf(m, 1 - side);
    var win = m.score[side] > m.score[1 - side] ? 1 : m.score[side] === m.score[1 - side] ? 0 : -1;
    var all = t.on.concat(t.used);
    all.forEach(function (mp) {
      var p = G.P[mp.id]; if (!p) return;
      p.ap++; p.ft = clamp(Math.round(p.ft - (3 + mp.min * 0.105)), 0, 100);
      p.mo = clamp(p.mo + (win > 0 ? 4 : win < 0 ? -4 : 0) + (mp.perf.g ? 3 : 0), 10, 100);
      p.rs = (p.rs || 0) + (mp.rating || 6); p.rn = (p.rn || 0) + 1;
      if (mp.yc >= 2) { /* second yellow = red, handled below */ } else if (mp.yc === 1) { p.yc++; if (p.yc >= 5) { p.sus = Math.max(p.sus, 1); p.yc = 0; } }
      if (mp.red) p.sus = Math.max(p.sus, mp.yc >= 2 ? 1 : ri(1, 3));
      // injuries: after the game or during it
      var hurt = mp.inj || R() < (0.011 + (p.ft < 50 ? 0.02 : 0) + (S.train === 3 ? 0.004 : 0));
      if (hurt) {
        var wks = R() < 0.07 ? ri(8, 24) : ri(1, 6);
        wks = Math.max(1, Math.round(wks * (1 - 0.045 * (uc.fac[3] - 1))));
        p.inj = wks; news(G, p.n + ' is injured for ' + wks + ' week' + (wks > 1 ? 's' : '') + '.', 'i');
      }
    });
    // unused substitutes lose a little morale; nothing else
    t.bench.forEach(function (mp) { var p = G.P[mp.id]; if (p) p.mo = clamp(p.mo - 1, 10, 100); });
    // goals and assists of both teams
    [0, 1].forEach(function (s) { m.goals[s].forEach(function (g) { var p = g.id ? G.P[g.id] : null; if (p) p.g++; var a = g.aid ? G.P[g.aid] : null; if (a) a.as++; }); });
    // the opponent's players get an appearance too
    opp.on.concat(opp.used).forEach(function (mp) { var p = G.P[mp.id]; if (p) p.ap++; });
    // the user sees a league yellow only for his own side
  }
  H.applyMatch = applyMatch;

  /* ---------------- moving the week forward ---------------- */
  H.canAdvance = function (G) { return G.S.stage === 'week' || G.S.stage === 'pre' ? H.pending(G).length === 0 : false; };
  /* start the season from pre-season: week 1 */
  H.beginSeason = function (G) {
    var S = G.S; if (S.stage !== 'pre') return;
    S.stage = 'week'; S.week = 1; H.beginWeek(G);
  };
  /* all matches of the week are done: simulate the rest, process the week, go to the next one */
  H.finishWeek = function (G) {
    var S = G.S;
    simOthers(G); weeklyProcess(G);
    S.week++;
    if (H.afterWeek) H.afterWeek(G);
    if (S.week > LAST_WEEK) { S.stage = 'end'; return 'end'; }
    H.beginWeek(G); return 'next';
  };
  /* skip the user's matches this week with quick results (used by "sim") */
  H.simUserMatch = function (G, fx) {
    var S = G.S, uc = H.userClub(G);
    var u = H.userTeam(G), ai = H.aiTeam(G, fx.h === S.uid ? fx.a : fx.h);
    var home = fx.h === S.uid ? u : ai, away = fx.h === S.uid ? ai : u;
    var m = H.createMatch(home, away, { needWinner: fx.kind === 'ko', agg: aggFor(fx) });
    H.playFully(m);
    return m;
  };
  function aggFor(fx) {
    if (fx.comp === 'cc' && fx.two && fx.leg === 1) { var t = fx.tie; return fx.h === t.a ? [t.g[0][0], t.g[0][1]] : [t.g[0][1], t.g[0][0]]; }
    return [0, 0];
  }
  H.aggFor = aggFor;
  H.buildMatch = function (G, fx) {
    var S = G.S, oppId = fx.h === S.uid ? fx.a : fx.h;
    H.fixLineup(G);
    var u = H.userTeam(G), ai = H.aiTeam(G, oppId);
    var home = fx.h === S.uid ? u : ai, away = fx.h === S.uid ? ai : u;
    return { m: H.createMatch(home, away, { needWinner: fx.kind === 'ko', agg: aggFor(fx) }), userSide: fx.h === S.uid ? 0 : 1 };
  };

  /* ---------------- helpers for the screens ---------------- */
  H.clubRank = function (G, c) { var lg = H.lgClubs(G, c.lg).slice().sort(function (a, b) { return b.rep - a.rep; }); return lg.indexOf(c) + 1; };
  H.tierName = function (c) { return c.rep >= 88 ? 'Elite' : c.rep >= 76 ? 'Strong' : c.rep >= 64 ? 'Mid-table' : c.rep >= 50 ? 'Underdog' : 'Long shot'; };
  H.save = function (G, key) {
    try { localStorage.setItem(key, JSON.stringify(G.S)); return true; } catch (e) { return false; }
  };
  H.loadSave = function (key) {
    try { var j = localStorage.getItem(key); if (!j) return null; var S = JSON.parse(j); if (!S || S.v !== 2) return null; return H.makeGame(S); } catch (e) { return null; }
  };
})();
