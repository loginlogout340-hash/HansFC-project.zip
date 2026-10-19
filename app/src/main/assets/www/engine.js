/* HANS FC - game engine: players, packs, squad ratings, match simulation, seasons. No screen code in here. */
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

  /* ---------------- players ---------------- */
  var POS_W = [['GK', 8], ['CB', 13], ['LB', 6], ['RB', 6], ['CDM', 8], ['CM', 14], ['CAM', 8], ['LM', 5], ['RM', 5], ['LW', 7], ['RW', 7], ['ST', 13]];
  function weighted(pairs) {
    var t = 0, i;
    for (i = 0; i < pairs.length; i++) t += pairs[i][1];
    var x = R() * t;
    for (i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x < 0) return pairs[i][0]; }
    return pairs[pairs.length - 1][0];
  }
  var BIAS = { A: [3, 6, -4, 3, -18, -2], M: [0, -4, 4, 4, -6, 0], D: [-2, -16, -6, -8, 7, 6] };
  var TWEAK = { ST: [0, 4, 0, 0, 0, 2], LW: [4, 1, 1, 3, 0, -3], RW: [4, 1, 1, 3, 0, -3], CAM: [0, 1, 3, 3, 0, -2], CDM: [-2, 0, 1, -2, 6, 3], CB: [0, 0, 0, 0, 4, 3], LB: [3, 0, 1, 1, 0, 0], RB: [3, 0, 1, 1, 0, 0], LM: [3, 0, 2, 2, -2, -2], RM: [3, 0, 2, 2, -2, -2], CM: [0, 0, 2, 1, 0, 1] };
  H.statLabels = function (pos) { return pos === 'GK' ? ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']; };
  H.statsFor = function (pos, ovr) {
    var g = H.GROUP[pos], out = [], i;
    if (g === 'G') { for (i = 0; i < 6; i++) out.push(clamp(Math.round(ovr + ri(-4, 3)), 25, 99)); out[1] = out[1]; return out; }
    var b = BIAS[g], t = TWEAK[pos] || [0, 0, 0, 0, 0, 0];
    for (i = 0; i < 6; i++) out.push(clamp(Math.round(ovr + b[i] + t[i] + ri(-4, 4)), 20, 99));
    return out;
  };
  var uid = 0;
  H.newId = function () { uid++; return 'c' + Date.now().toString(36) + uid.toString(36) + ri(0, 999).toString(36); };

  function makeName(region, used) {
    var r = H.REGIONS[region];
    for (var i = 0; i < 40; i++) {
      var n = pick(r.first) + ' ' + pick(r.last);
      if (!used || !used[n]) { if (used) used[n] = 1; return n; }
    }
    var n2 = pick(r.first) + ' ' + pick(r.last) + ' Jr';
    if (used) used[n2] = 1;
    return n2;
  }
  H.makePlayer = function (o, used) {
    o = o || {};
    var pos = o.pos || weighted(POS_W);
    var rarity = o.rarity || H.rarityOf(o.ovr || 60);
    var span = H.RARITY[rarity];
    var ovr = o.ovr;
    if (ovr == null) ovr = span.min + Math.floor(Math.pow(R(), 1.35) * (span.max - span.min + 1));
    var nat = o.nat ? H.NATIONS.filter(function (n) { return n[0] === o.nat; })[0] : pick(H.NATIONS);
    var club = o.club || pick(H.CLUBS)[0];
    return {
      id: H.newId(), name: o.name || makeName(nat[2], used), pos: pos, nat: nat[0], flag: nat[1], club: club,
      ovr: ovr, rarity: H.rarityOf(ovr), trained: 0, stats: o.stats || H.statsFor(pos, ovr), age: ri(18, 35), icon: !!o.icon,
    };
  };
  function usedNames(cards) { var u = {}; Object.keys(cards).forEach(function (k) { u[cards[k].name] = 1; }); return u; }

  /* ---------------- packs ---------------- */
  var RANK = { bronze: 0, silver: 1, gold: 2, elite: 3, legend: 4 };
  function rollRarity(w) {
    var pairs = Object.keys(w).map(function (k) { return [k, w[k]]; });
    return weighted(pairs);
  }
  H.openPack = function (kind, cards) {
    var p = H.PACKS[kind], out = [], used = usedNames(cards || {}), i;
    var ownedLegends = {};
    Object.keys(cards || {}).forEach(function (k) { if (cards[k].icon) ownedLegends[cards[k].name] = 1; });
    var rolls = [];
    for (i = 0; i < p.cards; i++) rolls.push(rollRarity(p.w));
    if (p.guarantee) {
      var best = rolls.reduce(function (a, b) { return RANK[b] > RANK[a] ? b : a; }, rolls[0]);
      if (RANK[best] < RANK[p.guarantee]) rolls[ri(0, rolls.length - 1)] = p.guarantee;
    }
    rolls.forEach(function (rar) {
      var c;
      if (rar === 'legend') {
        var free = H.LEGENDS.filter(function (l) { return !ownedLegends[l[0]] && !out.some(function (o) { return o.name === l[0]; }); });
        if (free.length) {
          var l = pick(free);
          c = H.makePlayer({ name: l[0], pos: l[1], ovr: l[2], nat: l[3], club: 'Icons', icon: true }, used);
        } else c = H.makePlayer({ rarity: 'elite', ovr: 90 }, used);
      } else c = H.makePlayer({ rarity: rar }, used);
      out.push(c);
    });
    return out.sort(function (a, b) { return a.ovr - b.ovr; }); // best card is revealed last
  };

  /* the squad you start with: 11 starters + 7 bench, mostly 62-70 */
  H.starterSquad = function () {
    var used = {}, list = [];
    var need = [['GK', 66], ['LB', 64], ['CB', 67], ['CB', 65], ['RB', 63], ['CM', 68], ['CDM', 66], ['CM', 64], ['LW', 66], ['ST', 69], ['RW', 65],
      ['GK', 58], ['CB', 61], ['LB', 59], ['CM', 62], ['CAM', 63], ['ST', 61], ['RM', 60]];
    need.forEach(function (n) { list.push(H.makePlayer({ pos: n[0], ovr: n[1] + ri(-1, 2) }, used)); });
    return list;
  };

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
  H.chemBonus = function (c) { return c >= 3 ? 2 : c === 2 ? 1 : c === 1 ? 0 : -1; };
  /* slots = array of cards (or null) in formation order -> detailed list used by the screens and the match */
  H.evaluate = function (formation, slots) {
    var nb = H.neighbors(formation), f = H.FORMATIONS[formation], total = 0, filled = 0;
    var rows = f.map(function (s, i) {
      var c = slots[i];
      if (!c) return { slot: s[0], card: null, eff: 0, chem: 0 };
      var pts = 0;
      nb[i].forEach(function (j) {
        var o = slots[j];
        if (!o) return;
        if (o.club === c.club) pts += 2;
        if (o.nat === c.nat) pts += 1;
      });
      var chem = pts >= 4 ? 3 : pts >= 2 ? 2 : pts >= 1 ? 1 : 0;
      var eff = Math.max(30, c.ovr - H.penalty(s[0], c.pos) + H.chemBonus(chem));
      return { slot: s[0], card: c, eff: eff, chem: chem, pen: H.penalty(s[0], c.pos) };
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
    return { gk: gk, def: D * 0.65 + M * 0.35, mid: M, att: A * 0.65 + M * 0.35, rating: Math.round(0.1 * gk + 0.3 * D + 0.35 * M + 0.25 * A), avg: all };
  };
  /* best lineup from a list of cards for a formation (greedy, then bench = best of the rest) */
  H.autoPick = function (formation, cards) {
    var f = H.FORMATIONS[formation], taken = {}, slots = new Array(11).fill(null);
    var order = f.map(function (s, i) { return i; }).sort(function (a, b) { return (f[a][0] === 'GK' ? -1 : 0) - (f[b][0] === 'GK' ? -1 : 0); });
    var list = cards.slice();
    order.forEach(function (i) {
      var best = null, bv = -999;
      list.forEach(function (c) {
        if (taken[c.id]) return;
        var v = c.ovr - H.penalty(f[i][0], c.pos);
        if (v > bv) { bv = v; best = c; }
      });
      if (best) { slots[i] = best; taken[best.id] = 1; }
    });
    var rest = list.filter(function (c) { return !taken[c.id]; }).sort(function (a, b) { return b.ovr - a.ovr; });
    var bench = [];
    var gk = rest.filter(function (c) { return c.pos === 'GK'; })[0];
    if (gk) { bench.push(gk); }
    rest.forEach(function (c) { if (bench.length < 7 && bench.indexOf(c) < 0) bench.push(c); });
    return { slots: slots.map(function (c) { return c ? c.id : null; }), bench: bench.map(function (c) { return c.id; }) };
  };

  /* ---------------- economy ---------------- */
  H.sellValue = function (c) { return Math.round((20 + Math.pow(1.6, (c.ovr - 50) / 5) * 40) * 0.5); };
  H.trainCost = function (c) { return Math.round(120 + Math.pow(Math.max(0, c.ovr - 55), 1.7) * 8); };
  H.MAX_TRAIN = 4;
  H.divMult = function (div) { return div === 1 ? 1.6 : div === 2 ? 1.25 : 1; };
  H.matchReward = function (gf, ga, div) {
    var base = gf > ga ? 450 : gf === ga ? 200 : 90;
    return Math.round((base + gf * 40) * H.divMult(div));
  };
  H.SEASON_PRIZE = [15000, 9000, 6000, 4000, 2500, 1500, 1000, 500];
  H.levelOf = function (xp) { return Math.floor(Math.sqrt(xp / 120)) + 1; };
  H.xpForLevel = function (lv) { return Math.pow(lv - 1, 2) * 120; };

  /* ---------------- teams for the computer ---------------- */
  H.aiTeam = function (name, strength, color) {
    var formation = pick(['4-4-2', '4-3-3', '4-2-3-1']), f = H.FORMATIONS[formation], used = {};
    var mk = function (pos, base) {
      var nat = pick(H.NATIONS), ovr = clamp(Math.round(base + gauss() * 2.2), 40, 97);
      var stats = H.statsFor(pos, ovr);
      return { name: makeName(nat[2], used), pos: pos, ovr: ovr, stats: stats, nat: nat[0], flag: nat[1] };
    };
    var on = f.map(function (s) { return mk(s[0], strength + (s[0] === 'GK' ? 0.5 : 0)); });
    var bench = [mk('GK', strength - 5), mk('CB', strength - 4), mk('CM', strength - 4), mk('ST', strength - 3), mk('LM', strength - 4)];
    return { name: name, color: color, formation: formation, on: on, bench: bench, strength: strength };
  };

  /* ---------------- the match ---------------- */
  var COMMENT = {
    kickoff: ['We are underway!', 'The referee blows the whistle. Here we go.'],
    off: ['{p} fires well over the bar.', '{p} drags it wide of the post.', '{p} tries his luck from distance, but it is off target.', '{p} snatches at it and sends it wide.'],
    blocked: ['{p} shoots but the defender gets in the way.', '{p} is blocked on the edge of the box.'],
    save: ['{k} dives low and keeps out {p}\'s effort!', 'What a save from {k}! {p} cannot believe it.', '{k} pushes {p}\'s shot around the post.'],
    goal: ['GOAL! {p} puts it away for {t}!', 'GOAL! {p} finds the corner. {t} score!', 'GOAL! A clinical finish from {p}!', 'GOAL! {p} makes no mistake. {t} lead the way.'],
    goalA: ['Assisted by {a}.', '{a} with the pass.', 'Lovely ball from {a}.'],
    yellow: ['Yellow card for {p} after a late challenge.', '{p} goes into the book.', '{p} is cautioned by the referee.'],
    red: ['RED CARD! {p} is sent off!', 'The referee shows {p} a straight red. {t} are down to {n}.'],
    filler: ['{t} keep the ball well in midfield.', 'A spell of pressure from {t}.', 'The tempo drops for a moment.', '{t} work the ball out wide.', 'End to end stuff now.', 'A promising move from {t} breaks down.'],
    sub: ['{t} make a change: {i} replaces {o}.'],
    ht: ['Half time.'],
    ft: ['Full time.'],
  };
  function say(kind, vars) {
    var s = pick(COMMENT[kind]);
    Object.keys(vars || {}).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  var SHOOT_W = { ST: 6, LW: 4, RW: 4, CAM: 3.5, LM: 2.5, RM: 2.5, CM: 1.5, CDM: 0.7, CB: 0.4, LB: 0.5, RB: 0.5, GK: 0 };
  var PASS_W = { CAM: 4, CM: 3.5, LW: 3, RW: 3, LM: 3, RM: 3, CDM: 2.5, ST: 2, LB: 1.5, RB: 1.5, CB: 1, GK: 0.2 };

  /* team: { name, color, on: [{name,pos,ovr,stats}], bench: [...], mentality, style, home } */
  function prep(t, home) {
    var on = t.on.map(function (p) { return { name: p.name, pos: p.pos, slot: p.pos, ovr: p.ovr, stats: p.stats || H.statsFor(p.pos, p.ovr), perf: { g: 0, a: 0, s: 0 }, yc: 0, out: false, id: p.id || null }; });
    var bench = t.bench.map(function (p) { return { name: p.name, pos: p.pos, slot: p.pos, ovr: p.ovr, stats: p.stats || H.statsFor(p.pos, p.ovr), perf: { g: 0, a: 0, s: 0 }, yc: 0, out: false, id: p.id || null }; });
    return { name: t.name, color: t.color, on: on, bench: bench, used: [], subs: 0, mentality: t.mentality || 'balanced', style: t.style || 'possession', home: !!home, reds: 0, boost: 0, isUser: !!t.isUser };
  }
  H.createMatch = function (home, away) {
    return {
      home: prep(home, true), away: prep(away, false), min: 0, add: 0, half: 1, addTotal: [ri(1, 3), ri(2, 5)], score: [0, 0], finished: false, paused: null,
      stats: { shots: [0, 0], sot: [0, 0], poss: [0, 0], corners: [0, 0], fouls: [0, 0], yc: [0, 0], rc: [0, 0] }, log: [], goals: [[], []], started: false,
    };
  };
  var teamOf = function (m, i) { return i === 0 ? m.home : m.away; };
  function active(t) { return t.on.filter(function (p) { return !p.out; }); }
  H.matchVector = function (m, i) {
    var t = teamOf(m, i), v = H.vector(active(t).map(function (p) { return { pos: p.slot, ovr: p.ovr }; }));
    var f = 1 - clamp((m.min - 60) / 30, 0, 1) * 0.045 + t.boost - t.reds * 0.05;
    var att = v.att, mid = v.mid, def = v.def;
    if (t.mentality === 'attacking') { att *= 1.04; def *= 0.96; } else if (t.mentality === 'defensive') { att *= 0.96; def *= 1.04; }
    if (t.style === 'possession') mid *= 1.03; else if (t.style === 'counter') { att *= 1.02; def *= 1.01; mid *= 0.97; } else { att *= 1.03; def *= 0.98; }
    if (t.home) { att += 1.5; mid += 1.5; }
    return { att: att * f, mid: mid * f, def: def * f, gk: v.gk * f };
  };
  function label(m) { return m.min + (m.add ? '+' + m.add : '') + "'"; }
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
  H.stepMatch = function (m) {
    var events = [];
    if (m.finished || m.paused) return events;
    if (!m.started) { m.started = true; events.push(ev(m, 'ko', say('kickoff'))); }
    if (m.half === 1) {
      if (m.min < 45) m.min++;
      else if (m.add < m.addTotal[0]) m.add++;
      else { m.paused = 'ht'; events.push(ev(m, 'ht', say('ht'))); return events; }
    } else {
      if (m.min < 90) m.min++;
      else if (m.add < m.addTotal[1]) m.add++;
      else { m.finished = true; m.paused = null; events.push(ev(m, 'ft', say('ft'))); H.finishMatch(m); return events; }
    }
    // the computer team makes its own changes late in the game
    [m.home, m.away].forEach(function (t) {
      if (!t.isUser && t.subs < 3 && m.half === 2 && m.min >= 58 && !m.add && R() < 0.07) { var e = H.aiSub(m, t); if (e) events.push(e); }
    });
    var v = [H.matchVector(m, 0), H.matchVector(m, 1)];
    var pH = Math.pow(v[0].mid, 3) / (Math.pow(v[0].mid, 3) + Math.pow(v[1].mid, 3));
    var a = R() < pH ? 0 : 1, d = 1 - a;
    m.stats.poss[a]++;
    var at = teamOf(m, a), df = teamOf(m, d);
    var ratio = Math.pow(v[a].att / v[d].def, 1.5);
    var chance = clamp(0.285 * ratio, 0.1, 0.6);
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
            m.goals[a].push({ name: shooter.name, t: label(m), min: m.min });
            var txt = say('goal', { p: shooter.name, t: at.name }) + (ass ? ' ' + say('goalA', { a: ass.name }) : '');
            var e = ev(m, 'goal', txt, a); e.score = m.score.slice(); events.push(e);
          } else {
            gk.perf && (gk.perf.s++);
            events.push(ev(m, 'save', say('save', { k: gk.name, p: shooter.name }), a));
            if (R() < 0.3) m.stats.corners[a]++;
          }
        } else if (R() < 0.45) {
          events.push(ev(m, 'blocked', say('blocked', { p: shooter.name }), a)); if (R() < 0.35) m.stats.corners[a]++;
        } else if (R() < 0.6) events.push(ev(m, 'off', say('off', { p: shooter.name }), a));
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
    return events;
  };
  H.redCard = function (m, side, p, events) {
    var t = teamOf(m, side);
    if (p.out) return;
    p.out = true; t.reds++; m.stats.rc[side]++;
    events.push(ev(m, 'red', say('red', { p: p.name, t: t.name, n: active(t).length }), side));
  };
  H.startSecondHalf = function (m) { if (m.paused === 'ht') { m.paused = null; m.half = 2; m.min = 45; m.add = 0; } };
  /* substitution: side index, index in team.on, index in team.bench. Returns an error text or null */
  H.substitute = function (m, side, outIdx, inIdx) {
    var t = teamOf(m, side);
    if (t.subs >= 3) return 'No substitutions left.';
    var o = t.on[outIdx], i = t.bench[inIdx];
    if (!o || !i || o.out) return 'Pick a player on the pitch.';
    var slot = o.slot;
    var inc = { name: i.name, pos: i.pos, slot: slot, ovr: Math.max(30, i.ovr - H.penalty(slot, i.pos)), stats: i.stats, perf: { g: 0, a: 0, s: 0 }, yc: 0, out: false, id: i.id };
    t.on[outIdx] = inc;
    t.bench.splice(inIdx, 1);
    t.used.push(o);
    t.subs++;
    t.boost += m.min >= 55 ? 0.012 : 0.004;
    var e = ev(m, 'sub', say('sub', { t: t.name, i: inc.name, o: o.name }), side);
    return e;
  };
  H.aiSub = function (m, t) {
    var side = t === m.home ? 0 : 1;
    var cand = t.on.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return !x.p.out && x.p.slot !== 'GK'; }).sort(function (a, b) { return a.p.ovr - b.p.ovr; })[0];
    if (!cand) return null;
    var bi = -1, bv = -99;
    t.bench.forEach(function (b, i) { var v = b.ovr - H.penalty(cand.p.slot, b.pos); if (b.pos !== 'GK' && v > bv) { bv = v; bi = i; } });
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
        if (s > bs) { bs = s; best = { name: p.name, team: t.name, side: i, g: p.perf.g, a: p.perf.a, id: p.id }; }
      });
    });
    m.motm = best;
  };
  H.playFully = function (m) { var g = 0; while (!m.finished && g++ < 400) { if (m.paused === 'ht') H.startSecondHalf(m); H.stepMatch(m); } return m; };

  /* ---------------- seasons ---------------- */
  var poisson = function (l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L && k < 12); return k - 1; };
  H.quickSim = function (sa, sb) {
    var d = sa - sb + 1.5;
    return [poisson(1.35 * Math.exp(d * 0.045)), poisson(1.15 * Math.exp(-d * 0.045))];
  };
  H.divBase = function (div) { return div === 1 ? 80 : div === 2 ? 72 : 64; };
  H.newSeason = function (no, div, club, userStrength) {
    var names = H.CLUBS.filter(function (c) { return c[0] !== club.name; }).sort(function () { return R() - 0.5; }).slice(0, 7);
    var base = H.divBase(div) + Math.min(6, (no - 1) * 1.0);
    var teams = [{ id: 0, name: club.name, color: club.color, isUser: true, strength: userStrength }];
    names.forEach(function (c, i) { teams.push({ id: i + 1, name: c[0], color: c[1], isUser: false, strength: Math.round((base + ri(-5, 6)) * 10) / 10 }); });
    // double round robin (circle method)
    var n = 8, ids = teams.map(function (t) { return t.id; }), rounds = [], r, i;
    var arr = ids.slice();
    for (r = 0; r < n - 1; r++) {
      var pairs = [];
      for (i = 0; i < n / 2; i++) {
        var a = arr[i], b = arr[n - 1 - i];
        pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());
    }
    var second = rounds.map(function (p) { return p.map(function (x) { return [x[1], x[0]]; }); });
    var all = rounds.concat(second);
    var fixtures = [];
    all.forEach(function (p, md) { p.forEach(function (x) { fixtures.push({ md: md, home: x[0], away: x[1], played: false, hg: 0, ag: 0 }); }); });
    return { no: no, div: div, teams: teams, fixtures: fixtures, md: 0, done: false };
  };
  H.table = function (season) {
    var t = {};
    season.teams.forEach(function (x) { t[x.id] = { id: x.id, name: x.name, color: x.color, isUser: x.isUser, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    season.fixtures.forEach(function (f) {
      if (!f.played) return;
      var h = t[f.home], a = t[f.away];
      h.p++; a.p++; h.gf += f.hg; h.ga += f.ag; a.gf += f.ag; a.ga += f.hg;
      if (f.hg > f.ag) { h.w++; h.pts += 3; a.l++; } else if (f.hg < f.ag) { a.w++; a.pts += 3; h.l++; } else { h.d++; a.d++; h.pts++; a.pts++; }
    });
    return Object.keys(t).map(function (k) { return t[k]; }).sort(function (x, y) { return (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (x.name < y.name ? -1 : 1); });
  };
  H.userFixture = function (season) {
    return season.fixtures.filter(function (f) { return f.md === season.md && (f.home === 0 || f.away === 0); })[0] || null;
  };
  /* the user's match of this matchday has a result: store it, play the other games, move on */
  H.completeMatchday = function (season, userResult) {
    var uf = H.userFixture(season);
    if (!uf) return;
    uf.played = true; uf.hg = userResult[0]; uf.ag = userResult[1];
    var st = {};
    season.teams.forEach(function (t) { st[t.id] = t.strength; });
    season.fixtures.forEach(function (f) {
      if (f.md !== season.md || f.played) return;
      var r = H.quickSim(st[f.home], st[f.away]);
      f.played = true; f.hg = r[0]; f.ag = r[1];
    });
    season.md++;
    if (season.md >= 14) season.done = true;
  };
})();
