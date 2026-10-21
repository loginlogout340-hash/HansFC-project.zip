/* HANS FC 2.0 - extras: achievements, weekly challenges, training events, shortlist, transfer history, board targets, squad report. */
(function () {
  var H = window.HFC, U = H.util, clamp = U.clamp;
  var LW = function () { return H.LAST_WEEK; };

  /* ---------- state that older saves may not have ---------- */
  function ensure(G) {
    var S = G.S;
    S.short = S.short || []; S.xf = S.xf || []; S.ach = S.ach || {}; S.unread = S.unread || 0;
    S.mgr.xp = S.mgr.xp || 0; S.fanC = S.fanC == null ? 60 : S.fanC; S.streak = S.streak || 0; S.harm = S.harm || 0;
    S.rec = S.rec || { w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0 }; S.cupWins = S.cupWins || 0; S.evWeek = S.evWeek == null ? -1 : S.evWeek; S.chDone = S.chDone || 0;
  }
  H.ensureExtras = ensure;
  H.afterStart = function (G) {
    ensure(G);
    var S = G.S, uc = H.userClub(G);
    S.gateBase = H.gateIncome(G, uc, null) * H.hgames(G, uc);
    S.ch = null; S.streak = S.streak || 0;
  };

  /* ---------- manager level ---------- */
  H.mgrLevel = function (xp) { return Math.floor(Math.sqrt((xp || 0) / 120)) + 1; };
  H.mgrXpFor = function (lv) { return Math.pow(lv - 1, 2) * 120; };
  function addXp(G, n, why) {
    var S = G.S, a = H.mgrLevel(S.mgr.xp); S.mgr.xp += n;
    var b = H.mgrLevel(S.mgr.xp);
    if (b > a) H.news(G, 'Level up! You are now manager level ' + b + '.', 'g');
  }

  /* ---------- shirt numbers for the user's squad ---------- */
  var PREF = { GK: [1, 12, 13, 31], RB: [2, 22, 20], LB: [3, 23, 21], CB: [4, 5, 15, 16, 26], CDM: [6, 14, 24], CM: [8, 18, 14], CAM: [10, 21, 28], RW: [7, 17], RM: [7, 17], LM: [11, 19], LW: [11, 19], ST: [9, 19, 29, 25] };
  H.shirtNumbers = function (G) {
    var out = {}, used = {}, sq = H.userCards(G).slice().sort(function (a, b) { return b.o - a.o; });
    sq.forEach(function (p) {
      var list = PREF[p.pos] || [], n = 0, i;
      for (i = 0; i < list.length; i++) if (!used[list[i]]) { n = list[i]; break; }
      if (!n) { for (i = 14; i < 99; i++) if (!used[i]) { n = i; break; } }
      used[n] = 1; out[p.id] = n;
    });
    return out;
  };
  H.sharpness = function (p) {
    var f = p.ft;
    return f >= 90 ? ['Peak Sharpness', 'g'] : f >= 75 ? ['Good Sharpness', 'g'] : f >= 60 ? ['Lacks Sharpness', 'y'] : ['Not Match Sharp', 'r'];
  };
  H.mood = function (p) { return p.mo >= 75 ? '😄' : p.mo >= 55 ? '🙂' : p.mo >= 40 ? '😐' : '😠'; };

  /* ---------- transfer log and shortlist ---------- */
  H.logXf = function (G, dir, p, other, fee) {
    var S = G.S;
    ensure(G);
    S.xf.unshift({ d: dir, n: p.n, pos: p.pos, o: p.o, fee: fee, w: S.week, y: S.year, other: other == null ? -1 : other, id: p.id });
    if (S.xf.length > 60) S.xf.length = 60;
  };
  H.toggleShort = function (G, id) {
    ensure(G); var S = G.S, i = S.short.indexOf(id);
    if (i >= 0) { S.short.splice(i, 1); return false; }
    S.short.push(id); return true;
  };

  /* ---------- training events ---------- */
  H.EVENTS = [
    { k: 'camp', n: 'Squad morale camp', days: 2, f: 0.0012, heart: -5, bolt: -5, mood: 50, brain: 5 },
    { k: 'resort', n: 'Squad recovery resort', days: 2, f: 0.0012, heart: 40, bolt: -5, mood: 5, brain: 0 },
    { k: 'away', n: 'Manager away trip', days: 1, f: 0.0006, heart: 0, bolt: 0, mood: 30, brain: 0 },
    { k: 'spa', n: 'Spa day', days: 1, f: 0.0003, heart: 10, bolt: -1, mood: 10, brain: 0 },
    { k: 'team', n: 'Team building break', days: 2, f: 0.0007, heart: -5, bolt: -5, mood: 40, brain: 15 },
    { k: 'staff', n: 'Staff break', days: 2, f: 0.0004, heart: 0, bolt: 0, mood: 25, brain: 0 },
    { k: 'night', n: 'Team night out', days: 1, f: 0.0004, heart: -5, bolt: -2, mood: 25, brain: 10 },
  ];
  H.eventCost = function (G, e) { return Math.max(0.002, H.userClub(G).revW * e.f); };
  H.addEvent = function (G, k) {
    var S = G.S, uc = H.userClub(G), e = H.EVENTS.filter(function (x) { return x.k === k; })[0];
    if (!e) return 'Unknown event.';
    ensure(G);
    if (S.stage !== 'week' && S.stage !== 'pre') return 'Not available now.';
    if (S.evWeek === S.week) return 'You already booked an event this week.';
    var c = H.eventCost(G, e); if (uc.cash < c) return 'You cannot afford that.';
    uc.cash -= c; S.wk.other += c; S.evWeek = S.week;
    H.userCards(G).forEach(function (p) {
      p.mo = clamp(p.mo + e.mood * 0.6, 0, 100);
      p.ft = clamp(p.ft + e.bolt * 1.2 + (e.heart > 0 ? 4 : 0), 0, 100);
      if (e.heart >= 40 && p.inj > 0) p.inj = Math.max(0, p.inj - 2);
      else if (e.heart >= 10 && p.inj > 0 && U.ri(0, 1)) p.inj--;
    });
    S.harm = clamp(S.harm + e.brain, 0, 40);
    H.news(G, e.n + ' done (' + H.fm(c) + ').', 'g');
    return null;
  };

  /* ---------- achievements ---------- */
  H.ACH = [
    { id: 'win1', t: 'Win your first match', xp: 100, ok: function (G) { return G.S.rec.w >= 1; } },
    { id: 'cs', t: 'Keep a clean sheet', xp: 100, ok: function (G) { return G.S.rec.cs >= 1; } },
    { id: 'unb5', t: 'Go 5 games unbeaten', xp: 150, ok: function (G) { return G.S.streak >= 5; } },
    { id: 'unb10', t: 'Go 10 games unbeaten', xp: 300, ok: function (G) { return G.S.streak >= 10; } },
    { id: 'goals5', t: 'Score 5 goals in a match', xp: 200, ok: function (G) { return G.S.bestGoals >= 5; } },
    { id: 'beat', t: 'Beat a team rated 8+ higher than you', xp: 300, ok: function (G) { return !!G.S.giant; } },
    { id: 'sign', t: 'Sign your first player', xp: 100, ok: function (G) { return G.S.xf.some(function (x) { return x.d === 'in'; }); } },
    { id: 'sell', t: 'Sell your first player', xp: 100, ok: function (G) { return G.S.xf.some(function (x) { return x.d === 'out'; }); } },
    { id: 'star', t: 'Sign a player rated 85 or higher', xp: 250, ok: function (G) { return G.S.xf.some(function (x) { return x.d === 'in' && x.o >= 85; }); } },
    { id: 'prod', t: 'Have a youth player with 85+ potential', xp: 250, ok: function (G) { return H.userCards(G).some(function (p) { return p.a <= 21 && p.p >= 85; }); } },
    { id: 'fac5', t: 'Take any facility to level 5', xp: 300, ok: function (G) { return H.userClub(G).fac.some(function (v) { return v >= 5; }); } },
    { id: 'fac10', t: 'Take any facility to level 10', xp: 800, ok: function (G) { return H.userClub(G).fac.some(function (v) { return v >= 10; }); } },
    { id: 'season', t: 'Complete a full season', xp: 300, ok: function (G) { return G.S.hist.length >= 1; } },
    { id: 'seasons3', t: 'Complete three seasons', xp: 600, ok: function (G) { return G.S.hist.length >= 3; } },
    { id: 'title', t: 'Win a league title', xp: 1000, ok: function (G) { return G.S.champions.length >= 1; } },
    { id: 'titles3', t: 'Win three league titles', xp: 2000, ok: function (G) { return G.S.champions.length >= 3; } },
    { id: 'cup', t: 'Win a domestic cup', xp: 600, ok: function (G) { return G.S.cupWins >= 1; } },
    { id: 'cc', t: 'Win the Champions Cup', xp: 1500, ok: function (G) { return G.S.ccWins >= 1; } },
    { id: 'treble', t: 'Win the league, cup and Champions Cup in one season', xp: 3000, ok: function (G) { return !!G.S.treble; } },
    { id: 'rich', t: 'Hold a bank balance bigger than a full year of income', xp: 400, ok: function (G) { var c = H.userClub(G); return c.cash > H.annualRev(c); } },
    { id: 'job', t: 'Move to a bigger club', xp: 500, ok: function (G) { return !!G.S.moved; } },
  ];
  H.checkAch = function (G) {
    ensure(G); var S = G.S, got = [];
    H.ACH.forEach(function (a) {
      if (S.ach[a.id]) return;
      var ok = false; try { ok = a.ok(G); } catch (e) {}
      if (ok) { S.ach[a.id] = S.year; addXp(G, a.xp); H.news(G, 'Achievement unlocked: ' + a.t + ' (+' + a.xp + ' XP)', 'g'); got.push(a); }
    });
    return got;
  };

  /* ---------- weekly challenges ---------- */
  var CH = [
    { id: 'win2', t: 'Win 2 matches', n: 2, f: 0.15 }, { id: 'win3', t: 'Win 3 matches', n: 3, f: 0.25 },
    { id: 'cs', t: 'Keep a clean sheet', n: 1, f: 0.1 }, { id: 'cs2', t: 'Keep 2 clean sheets', n: 2, f: 0.2 },
    { id: 'gl6', t: 'Score 6 goals', n: 6, f: 0.2 }, { id: 'unb', t: 'Stay unbeaten for 3 matches', n: 3, f: 0.15 },
    { id: 'big', t: 'Win by 2 or more goals', n: 1, f: 0.12 },
  ];
  function genChallenges(G) {
    var S = G.S, uc = H.userClub(G), pool = CH.slice(), items = [];
    while (items.length < 3 && pool.length) { var c = pool.splice(U.ri(0, pool.length - 1), 1)[0]; items.push({ id: c.id, t: c.t, n: c.n, p: 0, reward: uc.revW * c.f, done: false }); }
    S.ch = { start: S.week, items: items, run: 0 };
  }
  H.genChallenges = genChallenges;
  function chProgress(G, res) {
    var S = G.S; if (!S.ch) return;
    S.ch.items.forEach(function (it) {
      if (it.done) return;
      if (it.id === 'win2' || it.id === 'win3') { if (res.win) it.p++; }
      else if (it.id === 'cs' || it.id === 'cs2') { if (res.them === 0) it.p++; }
      else if (it.id === 'gl6') it.p += res.us;
      else if (it.id === 'unb') { if (!res.win && res.us < res.them) it.p = 0; else it.p++; }
      else if (it.id === 'big') { if (res.us - res.them >= 2) it.p++; }
      if (it.p >= it.n) { it.done = true; var uc = H.userClub(G); uc.cash += it.reward; S.tot.inc.prize += it.reward; S.chDone++; H.news(G, 'Challenge complete: ' + it.t + ' (+' + H.fm(it.reward) + ')', 'g'); }
    });
  }

  /* ---------- after a user match / week / season ---------- */
  H.afterMatch = function (G, res, m) {
    ensure(G); var S = G.S, uc = H.userClub(G);
    S.rec.gf += res.us; S.rec.ga += res.them;
    var won = res.win || (m.pens && m.pens.winner === res.side);
    if (res.win) S.rec.w++; else if (res.draw && !(m.pens && m.pens.winner === res.side)) S.rec.d++; else if (!res.win && !res.draw) S.rec.l++;
    if (res.them === 0) S.rec.cs++;
    if (res.us > (S.bestGoals || 0)) S.bestGoals = res.us;
    if (res.us >= res.them) S.streak++; else S.streak = 0;
    if (res.win && res.opp.str - uc.str >= 8) S.giant = true;
    S.fanC = clamp(S.fanC + (res.win ? 1.8 : res.draw ? -0.2 : -2.2), 0, 100);
    chProgress(G, res);
    var fx = res.fx;
    if (fx.comp === 'cc' && fx.round === 3 && fx.tie.w === S.uid) S.ccWins = (S.ccWins || 0) + 1;
    if (fx.comp === 'cup' && fx.tie.w === S.uid && S.cup[uc.lg].alive.length <= 2) { /* final won: counted when the cup is decided */ }
    H.checkAch(G);
  };
  H.afterWeek = function (G) {
    ensure(G); var S = G.S;
    if (S.harm > 0) S.harm = Math.max(0, S.harm - 3);
    if (!S.ch || S.week - S.ch.start >= 5) genChallenges(G);
    S.fanC = clamp(S.fanC + (S.fanC > 60 ? -0.15 : 0.15), 0, 100);
    H.checkAch(G);
  };
  H.afterSeason = function (G, rv) {
    ensure(G); var S = G.S, uc = H.userClub(G), lg = uc.lg;
    S.prevTot = JSON.parse(JSON.stringify(S.tot)); S.prevGate = S.tot.inc.gate;
    var cup = S.cup[lg], gotCup = cup.winner === S.uid, gotCC = S.cc.winner === S.uid, gotLg = rv.pos === 1;
    if (gotCup) S.cupWins++;
    if (gotCup && gotCC && gotLg) S.treble = true;
    addXp(G, 150 + Math.max(0, (rv.n - rv.pos)) * 25);
    rv.xp = S.mgr.xp; rv.level = H.mgrLevel(S.mgr.xp);
    H.checkAch(G);
  };

  /* ---------- finances ---------- */
  H.projection = function (G) {
    var S = G.S, uc = H.userClub(G), t = S.tot, w = Math.max(1, S.week - 1), k = LW() / w;
    var inc = t.inc.gate + t.inc.tv + t.inc.spons + t.inc.comm + t.inc.prize, exp = t.exp.wages + t.exp.upkeep + t.exp.build;
    var profit = (inc - exp) * (S.stage === 'week' ? k : 1);
    return { profit: profit, bank: uc.cash + (inc - exp) * (S.stage === 'week' ? (k - 1) : 0) };
  };

  /* ---------- board targets with live status ---------- */
  H.targets = function (G) {
    var S = G.S, uc = H.userClub(G), t = S.tot, ob = S.obj, out = [];
    var pos = H.position(G, uc.lg, uc.id), n = S.lg[uc.lg].ids.length;
    out.push({ n: 'LEAGUE TARGET', d: ob.text, now: ord(pos), ok: pos <= ob.target });
    var income = t.inc.gate + t.inc.tv + t.inc.spons + t.inc.comm + t.inc.prize, ratio = income > 0 ? t.exp.wages / income : H.wageBill(G, uc.id) / (uc.revW || 1);
    out.push({ n: 'FINANCIAL FAIR PLAY', d: 'Wages lower than 75% of income', now: Math.round(ratio * 100) + '%', ok: ratio <= 0.75 });
    var spTarget = uc.revW * 0.30 * LW() * 1.05, mult = S.sponsor ? S.sponsor.mult : 1, spNow = uc.revW * 0.30 * LW() * mult;
    out.push({ n: 'SPONSORSHIP TARGET', d: H.fm(spTarget) + ' sponsorship revenue', now: H.fm(spNow), ok: spNow >= spTarget });
    var home = 0; S.lg[uc.lg].rounds.forEach(function (rd) { rd.forEach(function (f) { if (f[0] === S.uid && f[2] >= 0) home++; }); });
    var hg = H.hgames(G, uc), last = S.prevGate || S.gateBase, proj = home > 0 ? t.inc.gate / home * hg : last;
    out.push({ n: 'GATE RECEIPTS', d: 'Improve gate receipts by 10% on last year', now: H.fm(proj), ok: proj >= last * 1.1 });
    out.push({ n: 'CUP TARGET', d: ob.cupText, now: 'Rounds won: ' + S.cupRound, ok: S.cupRound >= ob.cup });
    if (ob.ccText) out.push({ n: 'CHAMPIONS CUP', d: ob.ccText, now: S.ccRound >= 0 ? 'Round ' + (S.ccRound + 1) + ' won' : '-', ok: S.ccRound + 1 >= ob.cc });
    return out;
  };
  var ord = function (n) { return n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'); };
  H.ord = ord;
  H.fanbase = function (G) { var uc = H.userClub(G), S = G.S; return Math.round((Math.pow(uc.rep, 2.4) * 55 + uc.cap * 900) * (1 + 0.03 * S.champions.length) * (0.9 + S.fanC / 500)); };

  /* ---------- squad report (traffic lights) ---------- */
  H.squadReport = function (G) {
    var S = G.S, uc = H.userClub(G), sq = H.userCards(G), out = [];
    var add = function (c, t) { out.push({ c: c, t: t }); };
    var avg = function (f) { return sq.reduce(function (a, p) { return a + f(p); }, 0) / Math.max(1, sq.length); };
    var rank = H.lgClubs(G, uc.lg).slice().sort(function (a, b) { return b.str - a.str; }).indexOf(uc) + 1, n = S.lg[uc.lg].ids.length;
    add(rank <= 3 ? 'g' : rank <= n / 2 ? 'y' : 'r', rank <= 3 ? 'Your squad rating is among the best in the league, but keep strengthening where possible.' : rank <= n / 2 ? 'Your squad rating is okay compared with the league, but try to improve it if you can.' : 'Your squad rating is poor compared with the league. Strengthen the team.');
    var mo = avg(function (p) { return p.mo; }); add(mo >= 70 ? 'g' : mo >= 50 ? 'y' : 'r', mo >= 70 ? 'The squad morale is good.' : mo >= 50 ? 'The squad morale is okay, be careful this does not get too low.' : 'The squad morale is low. Book a morale camp or win some games.');
    var ft = avg(function (p) { return p.ft; }); add(ft >= 80 ? 'g' : ft >= 65 ? 'y' : 'r', ft >= 80 ? "The squad's fitness is good, keep an eye on the older players." : ft >= 65 ? 'The squad is a little tired. Rotate players or use lighter training.' : 'The squad is exhausted. Rest key players and book a recovery resort.');
    var inj = sq.filter(function (p) { return p.inj; }).length; add(inj <= 1 ? 'g' : inj <= 3 ? 'y' : 'r', inj <= 1 ? 'Few injuries. Good work by the medical team.' : 'Injured players will impact performances. Consider a better medical centre or rehab.');
    var age = avg(function (p) { return p.a; }), old = sq.filter(function (p) { return p.a >= 31; }).length; add(age <= 26.5 ? 'g' : age <= 28.5 ? 'y' : 'r', "Your squad's average age is " + age.toFixed(1) + (old ? ', with ' + old + ' players over 30.' : '.'));
    var ex = sq.filter(function (p) { return p.ct <= 1 && p.o >= 72; }).length; add(ex === 0 ? 'g' : ex <= 2 ? 'y' : 'r', ex === 0 ? 'No important contracts are about to run out.' : ex + ' important player' + (ex > 1 ? 's have' : ' has') + ' a contract ending this season. Renew them or lose them for free.');
    var pr = H.projection(G).profit; add(pr >= 0 ? 'g' : 'r', pr >= 0 ? 'Your projected profit for the year is positive.' : 'You are on course to lose money this year.');
    var wr = H.wageBill(G, uc.id) / ((uc.revW || 1) * 0.62 + 0.0001); add(wr <= 1 ? 'g' : wr <= 1.15 ? 'y' : 'r', wr <= 1 ? 'The wage bill is healthy.' : 'The wage bill is high compared with club income.');
    var fav = uc.fac.reduce(function (a, b) { return a + b; }, 0) / 5; add(fav >= 6 ? 'g' : fav >= 3.5 ? 'y' : 'r', fav >= 6 ? 'Your club facilities are attractive to players.' : fav >= 3.5 ? 'Your facilities are okay, but upgrades would attract better players.' : "Your club's attractiveness is poor, upgrade your facilities to improve it.");
    var gk = sq.filter(function (p) { return p.pos === 'GK' && H.available(p); }).length; add(gk >= 2 ? 'g' : 'r', gk >= 2 ? 'You have enough goalkeepers.' : 'You need a second available goalkeeper.');
    return out;
  };
})();
