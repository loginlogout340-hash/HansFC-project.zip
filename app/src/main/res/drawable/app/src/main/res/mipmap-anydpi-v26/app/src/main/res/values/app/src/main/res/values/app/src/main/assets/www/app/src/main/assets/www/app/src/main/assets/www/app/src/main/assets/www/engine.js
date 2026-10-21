/* HANS FC 2.0 - engine part 1: random numbers, players, values and wages, squad ratings, and the live match. No screen code in here. */
(function () {
  var H = (typeof window !== 'undefined') ? (window.HFC = window.HFC || {}) : (global.HFC = global.HFC || {});
  var R = function () { return H.rand(); };
  var ri = function (a, b) { return a + Math.floor(R() * (b - a + 1)); };
  var pick = function (a) { return a[Math.floor(R() * a.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var gauss = function () { return (R() + R() + R() + R() - 2) * 1.2; }; // roughly -2.4 .. 2.4, centred on 0
  H.util = { ri: ri, pick: pick, clamp: clamp, gauss: gauss };

  /* seeded random numbers for tests */
  H.seed = function (s) {
    var a = s >>> 0;
    H.rand = function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  H.weighted = function (pairs) {
    var t = 0, i;
    for (i = 0; i < pairs.length; i++) t += pairs[i][1];
    var x = R() * t;
    for (i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x < 0) return pairs[i][0]; }
    return pairs[pairs.length - 1][0];
  };
  var weighted = H.weighted;

  /* ---------------- player value and wage ---------------- */
  var VAL = [[40, 0.02], [50, 0.08], [55, 0.2], [60, 0.55], [65, 1.6], [70, 4.2], [75, 12], [80, 32], [85, 80], [90, 150], [95, 230], [99, 300]];
  function interp(o) {
    o = clamp(o, 40, 99);
    for (var i = 1; i < VAL.length; i++) if (o <= VAL[i][0]) { var a = VAL[i - 1], b = VAL[i]; return a[1] + (b[1] - a[1]) * (o - a[0]) / (b[0] - a[0]); }
    return 300;
  }
  /* value in millions of euros */
  H.valueOf = function (o, age, pot) {
    var v = interp(o);
    var af = age <= 19 ? 1.4 : age <= 21 ? 1.3 : age <= 23 ? 1.15 : age <= 27 ? 1 : age <= 29 ? 0.85 : age <= 31 ? 0.6 : age <= 33 ? 0.35 : 0.15;
    var pb = age <= 24 && pot > o ? 1 + (pot - o) * 0.045 : 1;
    return Math.max(0.01, v * af * pb);
  };
  /* wage in millions of euros per week */
  H.wageOf = function (value, o) { return Math.max(0.0008, 0.0036 * Math.pow(value, 0.85) + (o >= 80 ? 0.004 : 0)); };
  H.refresh = function (p) { p.v = H.valueOf(p.o, p.a, p.p); return p; };

  /* ---------------- players ---------------- */
  var POS_W = [['GK', 8], ['CB', 13], ['LB', 6], ['RB', 6], ['CDM', 8], ['CM', 14], ['CAM', 8], ['LM', 4], ['RM', 4], ['LW', 7], ['RW', 7], ['ST', 13]];
  H.randomPos = function () { return weighted(POS_W); };
  var BIAS = { A: [3, 6, -4, 3, -18, -2], M: [0, -4, 4, 4, -6, 0], D: [-2, -16, -6, -8, 7, 6] };
  var TWEAK = { ST: [0, 4, 0, 0, 0, 2], LW: [4, 1, 1, 3, 0, -3], RW: [4, 1, 1, 3, 0, -3], CAM: [0, 1, 3, 3, 0, -2], CDM: [-2, 0, 1, -2, 6, 3], CB: [0, 0, 0, 0, 4, 3], LB: [3, 0, 1, 1, 0, 0], RB: [3, 0, 1, 1, 0, 0], LM: [3, 0, 2, 2, -2, -2], RM: [3, 0, 2, 2, -2, -2], CM: [0, 0, 2, 1, 0, 1] };
  H.statLabels = function (pos) { return pos === 'GK' ? ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']; };
  function hash(n) { n = (n | 0) + 0x7f4a7c15; n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); return (n ^ (n >>> 15)) >>> 0; }
  H.hash = hash;
  /* six stats for a player; stable for the same player (noise comes from the id, not from chance) */
  H.statsOf = function (p) {
    var g = H.GROUP[p.pos], out = [], i, ovr = p.o;
    var no = function (k) { return (hash((p.id || 1) * 31 + k) % 9) - 4; };
    if (g === 'G') { for (i = 0; i < 6; i++) out.push(clamp(Math.round(ovr + (no(i) >> 1)), 25, 99)); return out; }
    var b = BIAS[g], t = TWEAK[p.pos] || [0, 0, 0, 0, 0, 0];
    for (i = 0; i < 6; i++) out.push(clamp(Math.round(ovr + b[i] + t[i] + no(i)), 20, 99));
    if (p.a >= 31) out[0] = clamp(out[0] - (p.a - 30), 20, 99);
    return out;
  };
  H.statsFor = function (pos, ovr) { return H.statsOf({ id: ri(1, 99999), pos: pos, o: ovr, a: 25 }); };

  var nextId = 1;
  H.setNextId = function (n) { nextId = n; };
  H.getNextId = function () { return nextId; };
  H.newPlayerId = function () { return nextId++; };

  function makeName(nat, used) {
    var reg = (H.NAT[nat] || [0, 'eu'])[1], r = H.REGIONS[reg];
    for (var i = 0; i < 40; i++) {
      var n = pick(r.first) + ' ' + pick(r.last);
      if (!used || !used[n]) { if (used) used[n] = 1; return n; }
    }
    var n2 = pick(r.first) + ' ' + pick(r.last) + ' Jr';
    if (used) used[n2] = 1;
    return n2;
  }
  H.makeName = makeName;
  /* o: { name,pos,o,p,a,nat,cl,ct } */
  H.makePlayer = function (o, used) {
    var nat = o.nat || 'England';
    var a = o.a != null ? o.a : ri(18, 34);
    var pot = o.p != null ? o.p : (a <= 20 ? o.o + ri(2, 10) : a <= 23 ? o.o + ri(0, 7) : a <= 26 ? o.o + ri(0, 3) : o.o);
    pot = clamp(Math.max(pot, o.o), 30, 99);
    var p = {
      id: H.newPlayerId(), n: o.name || makeName(nat, used), pos: o.pos || H.randomPos(), o: clamp(Math.round(o.o), 30, 99), p: pot, a: a, nat: nat, cl: o.cl == null ? null : o.cl,
      ct: o.ct != null ? o.ct : ri(1, 5), ft: 100, mo: 65, inj: 0, sus: 0, yc: 0, g: 0, as: 0, ap: 0, yth: !!o.yth, tr: 0,
    };
    p.v = H.valueOf(p.o, p.a, p.p); p.w = H.wageOf(p.v, p.o);
    return p;
  };
  H.parseReal = function (str) {
    return str.split(';').map(function (s) {
      var f = s.split('|');
      return { name: f[0], pos: f[1], o: +f[2], a: +f[3], nat: f[4], p: f[5] ? +f[5] : null };
    });
  };
  H.flag = function (p) { return H.flagOf(p.nat); };

  /* ---------------- fitness, form, effective rating ---------------- */
  H.available = function (p) { return p.cl != null && !p.inj && !p.sus; };
  H.fitPenalty = function (p) { return Math.round(Math.max(0, 85 - p.ft) / 7); };
  H.moraleBonus = function (p) { return p.mo >= 80 ? 1 : p.mo <= 30 ? -2 : p.mo <= 45 ? -1 : 0; };
  H.eff = function (p) { return p.o - H.fitPenalty(p) + H.moraleBonus(p); };

  /* ---------------- squad ratings, positions and chemistry ---------------- */
  H.penalty = function (slotPos, cardPos) {
    if (slotPos === cardPos) return 0;
    if (slotPos === 'GK' || cardPos === 'GK') return 40;
    var near = H.NEAR[slotPos] && H.NEAR[slotPos][cardPos];
    if (near != null) return near;
    return H.GROUP[slotPos] === H.GROUP[cardPos] ? 8 : 16;
  };
  H.neighbors = function (formation) {
    var f = H.FORMATIONS[formation];
    return f.map(function (a, i) {
      var out = [];
      f.forEach(function (b, j) {
        if (i === j) return;
        var d = Math.sqrt(Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
        if (d < 31) out.push(j);
      });
      return out;
    });
  };
  /* team spirit from neighbours who play for the same nation (club chemistry no longer matters: everyone is at your club) */
  H.chemBonus = function (c) { return c >= 3 ? 2 : c === 2 ? 1 : 0; };
  /* slots = array of players (or null) in formation order */
  H.evaluate = function (formation, slots) {
    var nb = H.neighbors(formation), f = H.FORMATIONS[formation], total = 0, filled = 0;
    var rows = f.map(function (s, i) {
      var c = slots[i];
      if (!c) return { slot: s[0], card: null, eff: 0, chem: 0, pen: 0 };
      var pts = 0;
      nb[i].forEach(function (j) { var o = slots[j]; if (o && o.nat === c.nat) pts += 1; });
      var chem = pts >= 3 ? 3 : pts >= 2 ? 2 : pts >= 1 ? 1 : 0;
      var pen = H.penalty(s[0], c.pos);
      var eff = Math.max(30, H.eff(c) - pen + H.chemBonus(chem));
      return { slot: s[0], card: c, eff: eff, chem: chem, pen: pen };
    });
    rows.forEach(function (r) { if (r.card) { total += r.chem; filled++; } });
    return { rows: rows, chemistry: Math.round((total / 33) * 100), filled: filled, vector: H.vector(rows.map(function (r) { return r.card ? { pos: r.slot, ovr: r.eff } : null; }).filter(Boolean)) };
  };
  /* players: [{pos (slot position), ovr (effective)}] -> team strength numbers */
  H.vector = function (players) {
    var g = { G: [], D: [], M: [], A: [] };
    players.forEach(function (p) { g[H.GROUP[p.pos]].push(p.ovr); });
    var avg = function (a, d) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : d; };
    var gk = avg(g.G, 40), D = avg(g.D, 55), M = avg(g.M, 55), A = avg(g.A, 55);
    var all = players.length ? players.reduce(function (x, p) { return x + p.ovr; }, 0) / players.length : 0;
    var rf = 0.1 * gk + 0.3 * D + 0.35 * M + 0.25 * A;
    return { gk: gk, def: D * 0.65 + M * 0.35, mid: M, att: A * 0.65 + M * 0.35, rating: Math.round(rf), rf: rf, avg: all };
  };
  /* best lineup from a list of players for a formation. ids of the starters and the bench (injured / banned players are left out). */
  H.autoPick = function (formation, cards, opts) {
    opts = opts || {};
    var f = H.FORMATIONS[formation], taken = {}, slots = new Array(11).fill(null);
    var list = cards.filter(function (c) { return opts.all || H.available(c); });
    var order = f.map(function (s, i) { return i; }).sort(function (a, b) { return (f[a][0] === 'GK' ? -1 : 0) - (f[b][0] === 'GK' ? -1 : 0); });
    order.forEach(function (i) {
      var best = null, bv = -999;
      list.forEach(function (c) {
        if (taken[c.id]) return;
        var v = (opts.raw ? c.o : H.eff(c)) - H.penalty(f[i][0], c.pos);
        if (v > bv) { bv = v; best = c; }
      });
      if (best) { slots[i] = best; taken[best.id] = 1; }
    });
    var rest = list.filter(function (c) { return !taken[c.id]; }).sort(function (a, b) { return H.eff(b) - H.eff(a); });
    var bench = [];
    var gk = rest.filter(function (c) { return c.pos === 'GK'; })[0];
    if (gk) bench.push(gk);
    rest.forEach(function (c) { if (bench.length < 9 && bench.indexOf(c) < 0) bench.push(c); });
    return { slots: slots.map(function (c) { return c ? c.id : null; }), bench: bench.map(function (c) { return c.id; }) };
  };
  H.bestFormation = function (cards, choices) {
    var best = null, bv = -1;
    (choices || ['4-3-3', '4-4-2', '4-2-3-1']).forEach(function (fm) {
      var ap = H.autoPick(fm, cards), sl = ap.slots.map(function (id) { return id ? cards.filter(function (c) { return c.id === id; })[0] : null; });
      var r = H.evaluate(fm, sl).vector.rating;
      if (r > bv) { bv = r; best = fm; }
    });
    return best;
  };

  /* ---------------- the match ---------------- */
  var COMMENT = {
    kickoff: ['We are underway!', 'The referee blows the whistle. Here we go.', 'Kick off! The crowd is on its feet.'],
    off: ['{p} fires well over the bar.', '{p} drags it wide of the post.', '{p} tries his luck from distance, but it is off target.', '{p} snatches at it and sends it wide.', '{p} hits the side netting. So close!'],
    blocked: ['{p} shoots but the defender gets in the way.', '{p} is blocked on the edge of the box.', 'A last-ditch block stops {p}.'],
    save: ['{k} dives low and keeps out {p}\'s effort!', 'What a save from {k}! {p} cannot believe it.', '{k} pushes {p}\'s shot around the post.', '{k} tips {p}\'s strike over the bar.'],
    post: ['{p} hits the post! Inches away!', '{p} rattles the crossbar!'],
    goal: ['GOAL! {p} puts it away for {t}!', 'GOAL! {p} finds the corner. {t} score!', 'GOAL! A clinical finish from {p}!', 'GOAL! {p} makes no mistake. {t} lead the way.', 'GOAL! What a strike from {p}!', 'GOAL! {p} slots it home calmly.'],
    goalA: ['Assisted by {a}.', '{a} with the pass.', 'Lovely ball from {a}.', 'Great play from {a} to set it up.'],
    pen: ['PENALTY to {t}! The referee points to the spot.', 'The referee gives a penalty to {t}!'],
    penGoal: ['GOAL! {p} sends the keeper the wrong way from the spot!', 'GOAL! {p} drills the penalty into the corner!'],
    penMiss: ['MISSED! {p}\'s penalty is saved!', 'MISSED! {p} blazes the penalty over the bar!'],
    yellow: ['Yellow card for {p} after a late challenge.', '{p} goes into the book.', '{p} is cautioned by the referee.'],
    red: ['RED CARD! {p} is sent off!', 'The referee shows {p} a straight red. {t} are down to {n}.'],
    inj: ['{p} goes down injured and cannot continue.', '{p} is hurt. That looks serious.'],
    filler: ['{t} keep the ball well in midfield.', 'A spell of pressure from {t}.', 'The tempo drops for a moment.', '{t} work the ball out wide.', 'End to end stuff now.', 'A promising move from {t} breaks down.', 'The crowd gets behind {t}.'],
    sub: ['{t} make a change: {i} replaces {o}.'],
    ht: ['Half time.'], et: ['Extra time. 30 more minutes to find a winner.'], ft: ['Full time.'],
  };
  function say(kind, vars) {
    var s = pick(COMMENT[kind]);
    Object.keys(vars || {}).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  var SHOOT_W = { ST: 6, LW: 4, RW: 4, CAM: 3.5, LM: 2.5, RM: 2.5, CM: 1.5, CDM: 0.7, CB: 0.4, LB: 0.5, RB: 0.5, GK: 0 };
  var PASS_W = { CAM: 4, CM: 3.5, LW: 3, RW: 3, LM: 3, RM: 3, CDM: 2.5, ST: 2, LB: 1.5, RB: 1.5, CB: 1, GK: 0.2 };
  H.SHOOT_W = SHOOT_W; H.PASS_W = PASS_W;

  /* team: { name, color, on: [{id,name,pos,ovr,stats}], bench: [...], mentality, style, press, home } */
  function mkp(p) { return { id: p.id || null, name: p.name, pos: p.pos, slot: p.slot || p.pos, ovr: p.ovr, stats: p.stats || H.statsFor(p.pos, p.ovr), perf: { g: 0, a: 0, s: 0 }, yc: 0, out: false, min: 0, inj: false, fit: p.fit == null ? 100 : p.fit }; }
  function prep(t, home) {
    return { name: t.name, color: t.color, on: t.on.map(mkp), bench: t.bench.map(mkp), used: [], subs: 0, mentality: t.mentality || 'balanced', style: t.style || 'possession', press: t.press || 'medium', home: !!home, reds: 0, boost: t.boost || 0, isUser: !!t.isUser, formation: t.formation || '4-3-3', taker: null };
  }
  H.createMatch = function (home, away, opt) {
    opt = opt || {};
    return {
      home: prep(home, true), away: prep(away, false), min: 0, add: 0, half: 1, addTotal: [ri(1, 3), ri(2, 5)], score: [0, 0], finished: false, paused: null,
      stats: { shots: [0, 0], sot: [0, 0], poss: [0, 0], corners: [0, 0], fouls: [0, 0], yc: [0, 0], rc: [0, 0] }, log: [], goals: [[], []], started: false,
      needWinner: !!opt.needWinner, agg: opt.agg || [0, 0], pens: null, ball: { x: 50, y: 50, side: 0 }, injuries: [],
    };
  };
  var teamOf = function (m, i) { return i === 0 ? m.home : m.away; };
  H.teamOf = teamOf;
  function active(t) { return t.on.filter(function (p) { return !p.out; }); }
  H.matchVector = function (m, i) {
    var t = teamOf(m, i), v = H.vector(active(t).map(function (p) { return { pos: p.slot, ovr: p.ovr }; }));
    var f = 1 - clamp((m.min - 60) / 40, 0, 1) * 0.05 * (t.press === 'high' ? 1.5 : t.press === 'low' ? 0.6 : 1) + t.boost - t.reds * 0.05;
    var att = v.att, mid = v.mid, def = v.def;
    if (t.mentality === 'attacking') { att *= 1.04; def *= 0.96; } else if (t.mentality === 'defensive') { att *= 0.96; def *= 1.04; }
    if (t.style === 'possession') mid *= 1.03; else if (t.style === 'counter') { att *= 1.02; def *= 1.01; mid *= 0.97; } else { att *= 1.03; def *= 0.98; }
    if (t.press === 'high') { mid *= 1.02; def *= 0.99; } else if (t.press === 'low') { mid *= 0.985; def *= 1.01; }
    if (t.home) { att += 1.5; mid += 1.5; }
    return { att: att * f, mid: mid * f, def: def * f, gk: v.gk * f };
  };
  function label(m) { return m.half === 3 ? m.min + "'" : m.min + (m.add ? '+' + m.add : '') + "'"; }
  function ev(m, type, text, side) { var e = { t: label(m), min: m.min, type: type, text: text, side: side }; m.log.push(e); return e; }
  function chooseBy(players, table, extra, skip) {
    var t = 0, ws = players.map(function (p) {
      if (p === skip) return 0;
      var w = (table[p.slot] || 0.5) * Math.pow(((extra ? p.stats[extra] : p.ovr) || 60) / 70, 2);
      t += w; return w;
    });
    if (t <= 0) return players[0];
    var x = R() * t;
    for (var i = 0; i < players.length; i++) { x -= ws[i]; if (x < 0) return players[i]; }
    return players[players.length - 1];
  }
  H.shootout = function (m) {
    /* returns {score:[h,a], winner:0|1, log:[]} */
    var sc = [0, 0], log = [], round = 0, done = false, order = [0, 1];
    function take(side) {
      var t = teamOf(m, side), pl = active(t).filter(function (p) { return p.slot !== 'GK'; });
      var sh = pl.length ? pl[(round + (side ? 3 : 0)) % pl.length] : { name: 'A player', stats: [70, 70, 70, 70, 70, 70] };
      var gk = active(teamOf(m, 1 - side)).filter(function (p) { return p.slot === 'GK'; })[0];
      var p = clamp(0.77 + (sh.stats[1] - 70) * 0.004 - ((gk ? gk.stats[0] : 70) - 70) * 0.003, 0.55, 0.92);
      var sc1 = R() < p;
      if (sc1) sc[side]++;
      log.push({ side: side, name: sh.name, ok: sc1 });
    }
    var i;
    for (i = 0; i < 5 && !done; i++) {
      round = i; order.forEach(function (s) { take(s); });
      var left0 = 5 - 1 - i;
      if (sc[0] > sc[1] + left0 || sc[1] > sc[0] + left0) done = true;
      // check early finish after each full pair
    }
    var g = 0;
    while (sc[0] === sc[1] && g++ < 30) { round++; take(0); take(1); }
    if (sc[0] === sc[1]) sc[R() < 0.5 ? 0 : 1]++;
    return { score: sc, winner: sc[0] > sc[1] ? 0 : 1, log: log };
  };
  H.stepMatch = function (m) {
    var events = [];
    if (m.finished || m.paused) return events;
    if (!m.started) { m.started = true; events.push(ev(m, 'ko', say('kickoff'))); }
    if (m.half === 1) {
      if (m.min < 45) m.min++;
      else if (m.add < m.addTotal[0]) m.add++;
      else { m.paused = 'ht'; events.push(ev(m, 'ht', say('ht'))); return events; }
    } else if (m.half === 2) {
      if (m.min < 90) m.min++;
      else if (m.add < m.addTotal[1]) m.add++;
      else {
        var tied = (m.score[0] + m.agg[0]) === (m.score[1] + m.agg[1]);
        if (m.needWinner && tied) { m.half = 3; m.add = 0; events.push(ev(m, 'et', say('et'))); return events; }
        m.finished = true; m.paused = null; events.push(ev(m, 'ft', say('ft'))); H.finishMatch(m); return events;
      }
    } else {
      if (m.min < 120) m.min++;
      else {
        var tied2 = (m.score[0] + m.agg[0]) === (m.score[1] + m.agg[1]);
        if (tied2) { var so = H.shootout(m); m.pens = so; events.push(ev(m, 'ft', 'Penalty shootout! ' + (so.winner === 0 ? m.home.name : m.away.name) + ' win ' + so.score[0] + '-' + so.score[1] + ' on penalties.')); }
        else events.push(ev(m, 'ft', say('ft')));
        m.finished = true; H.finishMatch(m); return events;
      }
    }
    // everyone on the pitch gets another minute played
    [m.home, m.away].forEach(function (t) { active(t).forEach(function (p) { p.min++; }); });
    // the computer team makes its own changes late in the game
    [m.home, m.away].forEach(function (t) {
      if (!t.isUser && t.subs < 5 && m.half >= 2 && m.min >= 58 && !m.add && R() < 0.06) { var e = H.aiSub(m, t); if (e) events.push(e); }
    });
    var v = [H.matchVector(m, 0), H.matchVector(m, 1)];
    var pH = Math.pow(v[0].mid, 3) / (Math.pow(v[0].mid, 3) + Math.pow(v[1].mid, 3));
    var a = R() < pH ? 0 : 1, d = 1 - a;
    m.stats.poss[a]++;
    m.ball.side = a;
    var at = teamOf(m, a), df = teamOf(m, d);
    var ratio = Math.pow(v[a].att / v[d].def, 1.5);
    var chance = clamp(0.285 * ratio, 0.1, 0.6);
    m.ball.x = 20 + R() * 60;
    m.ball.y = a === 0 ? 20 + R() * 40 : 40 + R() * 40;
    if (R() < 0.0065) { // penalty
      var taker = chooseBy(active(at), SHOOT_W, 1), gk0 = active(df).filter(function (p) { return p.slot === 'GK'; })[0] || { name: 'the keeper', stats: [70, 70, 70, 70, 70, 70] };
      events.push(ev(m, 'pen', say('pen', { t: at.name }), a));
      m.stats.shots[a]++; taker.perf.s++;
      var pp = clamp(0.77 + (taker.stats[1] - 70) * 0.004 - (gk0.stats[0] - 70) * 0.003, 0.55, 0.92);
      if (R() < pp) {
        m.score[a]++; taker.perf.g++; m.stats.sot[a]++;
        m.goals[a].push({ name: taker.name, t: label(m), min: m.min, pen: true, id: taker.id });
        var ee = ev(m, 'goal', say('penGoal', { p: taker.name }), a); ee.score = m.score.slice(); events.push(ee);
      } else events.push(ev(m, 'save', say('penMiss', { p: taker.name }), a));
      return events;
    }
    if (R() < chance) {
      var shooter = chooseBy(active(at), SHOOT_W, 1);
      var gk = active(df).filter(function (p) { return p.slot === 'GK'; })[0] || { name: 'the keeper' };
      if (R() < 0.78) {
        m.stats.shots[a]++; shooter.perf.s++;
        var pOT = clamp(0.38 + (shooter.stats[1] - 70) * 0.005, 0.2, 0.62);
        if (R() < pOT) {
          m.stats.sot[a]++;
          var q = (0.6 * shooter.stats[1] + 0.4 * v[a].att) / v[d].gk;
          var pG = clamp(0.27 * Math.pow(q, 1.6), 0.1, 0.5);
          if (R() < pG) {
            m.score[a]++; shooter.perf.g++;
            var ass = R() < 0.72 ? chooseBy(active(at), PASS_W, 2, shooter) : null;
            if (ass && ass !== shooter) ass.perf.a++; else ass = null;
            m.goals[a].push({ name: shooter.name, t: label(m), min: m.min, id: shooter.id, aid: ass ? ass.id : null });
            var txt = say('goal', { p: shooter.name, t: at.name }) + (ass ? ' ' + say('goalA', { a: ass.name }) : '');
            var e = ev(m, 'goal', txt, a); e.score = m.score.slice(); events.push(e);
          } else {
            gk.perf && (gk.perf.s++);
            events.push(ev(m, 'save', say('save', { k: gk.name, p: shooter.name }), a));
            if (R() < 0.3) m.stats.corners[a]++;
          }
        } else if (R() < 0.45) {
          events.push(ev(m, 'blocked', say('blocked', { p: shooter.name }), a)); if (R() < 0.35) m.stats.corners[a]++;
        } else if (R() < 0.12) events.push(ev(m, 'off', say('post', { p: shooter.name }), a));
        else if (R() < 0.6) events.push(ev(m, 'off', say('off', { p: shooter.name }), a));
      }
    } else if (R() < 0.05) events.push(ev(m, 'filler', say('filler', { t: at.name }), a));
    // fouls and cards
    if (R() < 0.032) {
      var fi = R() < 0.5 ? 0 : 1, ft = teamOf(m, fi);
      m.stats.fouls[fi]++;
      var culprit = chooseBy(active(ft), { CB: 3, CDM: 3, CM: 2, LB: 2, RB: 2, CAM: 1, LM: 1, RM: 1, ST: 1, LW: 1, RW: 1, GK: 0.1 });
      var r = R();
      if (r < 0.022) { H.redCard(m, fi, culprit, events); }
      else if (r < 0.3) {
        culprit.yc++; m.stats.yc[fi]++;
        if (culprit.yc >= 2) { events.push(ev(m, 'yellow', say('yellow', { p: culprit.name }), fi)); H.redCard(m, fi, culprit, events); }
        else events.push(ev(m, 'yellow', say('yellow', { p: culprit.name }), fi));
      }
    }
    // an injury during the game
    if (R() < 0.0035) {
      var ii = R() < 0.5 ? 0 : 1, it = teamOf(m, ii), vic = active(it)[ri(0, active(it).length - 1)];
      if (vic && vic.slot !== 'GK' && it.subs < 5 && it.bench.length) {
        vic.inj = true; m.injuries.push({ side: ii, id: vic.id });
        events.push(ev(m, 'inj', say('inj', { p: vic.name }), ii));
        if (!it.isUser) { var ix = it.on.indexOf(vic), bi = H.bestSub(it, vic); if (bi >= 0) { var rr = H.substitute(m, ii, ix, bi); if (typeof rr !== 'string') events.push(rr); } }
      }
    }
    return events;
  };
  H.redCard = function (m, side, p, events) {
    var t = teamOf(m, side);
    if (p.out) return;
    p.out = true; p.red = true; t.reds++; m.stats.rc[side]++;
    events.push(ev(m, 'red', say('red', { p: p.name, t: t.name, n: active(t).length }), side));
  };
  H.startSecondHalf = function (m) { if (m.paused === 'ht') { m.paused = null; m.half = 2; m.min = 45; m.add = 0; } };
  /* half-time team talk: 'praise' | 'demand' | 'calm'. Returns a line of text. */
  H.teamTalk = function (m, side, kind) {
    var t = teamOf(m, side), us = m.score[side], them = m.score[1 - side], txt;
    if (kind === 'demand') { t.boost += us <= them ? 0.012 : -0.004; txt = us <= them ? 'The players respond to your fire.' : 'Some players look nervous after that.'; }
    else if (kind === 'praise') { t.boost += us >= them ? 0.008 : -0.004; txt = us >= them ? 'The team feels good and plays with confidence.' : 'Praise after a poor half? The team looks confused.'; }
    else { t.boost += 0.004; txt = 'You calm everyone down. The team settles.'; }
    return txt;
  };
  H.bestSub = function (t, outP) {
    var bi = -1, bv = -99;
    t.bench.forEach(function (b, i) { var v = b.ovr - H.penalty(outP.slot, b.pos); if ((outP.slot === 'GK') === (b.pos === 'GK') && v > bv) { bv = v; bi = i; } });
    return bi;
  };
  /* substitution: side index, index in team.on, index in team.bench. Returns an error text or the event */
  H.substitute = function (m, side, outIdx, inIdx) {
    var t = teamOf(m, side);
    if (t.subs >= 5) return 'No substitutions left.';
    var o = t.on[outIdx], i = t.bench[inIdx];
    if (!o || !i || o.out) return 'Pick a player on the pitch.';
    var slot = o.slot;
    var inc = { id: i.id, name: i.name, pos: i.pos, slot: slot, ovr: Math.max(30, i.ovr - H.penalty(slot, i.pos)), stats: i.stats, perf: { g: 0, a: 0, s: 0 }, yc: 0, out: false, min: 0, inj: false, fit: i.fit, sub: true };
    t.on[outIdx] = inc;
    t.bench.splice(inIdx, 1);
    t.used.push(o);
    t.subs++;
    t.boost += m.min >= 55 ? 0.01 : 0.004;
    return ev(m, 'sub', say('sub', { t: t.name, i: inc.name, o: o.name }), side);
  };
  H.aiSub = function (m, t) {
    var side = t === m.home ? 0 : 1;
    var cand = t.on.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return !x.p.out && x.p.slot !== 'GK'; }).sort(function (a, b) { return a.p.ovr - b.p.ovr; })[0];
    if (!cand) return null;
    var bi = H.bestSub(t, cand.p);
    if (bi < 0) return null;
    var r = H.substitute(m, side, cand.i, bi);
    return typeof r === 'string' ? null : r;
  };
  H.finishMatch = function (m) {
    var tot = m.stats.poss[0] + m.stats.poss[1] || 1;
    m.stats.possPct = [Math.round(m.stats.poss[0] / tot * 100), 100 - Math.round(m.stats.poss[0] / tot * 100)];
    var best = null, bs = -1;
    [0, 1].forEach(function (i) {
      var t = teamOf(m, i), win = m.score[i] > m.score[1 - i] ? 1 : m.score[i] === m.score[1 - i] ? 0.4 : 0;
      t.on.concat(t.used).forEach(function (p) {
        var s = p.perf.g * 3 + p.perf.a * 1.8 + (p.slot === 'GK' ? p.perf.s * 0.5 : 0) + p.perf.s * 0.1 + win + p.ovr / 100 + R() * 0.4 - (p.out ? 1 : 0);
        p.score = s;
        p.rating = clamp(Math.round((5.6 + win * 0.9 + p.perf.g * 1.1 + p.perf.a * 0.6 + (R() - 0.5) * 1.2 + (p.red ? -1.5 : 0)) * 10) / 10, 3.5, 10);
        if (s > bs) { bs = s; best = { name: p.name, team: t.name, side: i, g: p.perf.g, a: p.perf.a, id: p.id }; }
      });
    });
    m.motm = best;
  };
  H.playFully = function (m) { var g = 0; while (!m.finished && g++ < 600) { if (m.paused === 'ht') H.startSecondHalf(m); H.stepMatch(m); } return m; };
  /* the winner of a knockout tie after this match: 0 home, 1 away, or -1 if it is only the first leg of two */
  H.winnerOf = function (m) {
    var a = m.score[0] + m.agg[0], b = m.score[1] + m.agg[1];
    if (m.pens) return m.pens.winner;
    return a > b ? 0 : b > a ? 1 : -1;
  };

  /* quick simulation for matches the player does not see */
  var poisson = function (l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L && k < 12); return k - 1; };
  H.quickSim = function (sa, sb) {
    var d = sa - sb + 1.5;
    return [poisson(1.35 * Math.exp(d * 0.045)), poisson(1.15 * Math.exp(-d * 0.045))];
  };
  H.poisson = poisson;
})();
