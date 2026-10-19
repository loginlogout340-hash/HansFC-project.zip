/* HANS FC - screens. Everything is saved on the phone (localStorage). */
(function () {
  var H = window.HFC, U = H.util;
  var KEY = 'hansfc_save_v1';
  var S = null, tab = 'home', layers = [], matchTimer = null;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var COLORS = ['#1d6fb8', '#c0392b', '#2e8b57', '#f2a900', '#7d3c98', '#d35400', '#16a085', '#273746'];

  /* ---------- save ---------- */
  function load() { try { var j = localStorage.getItem(KEY); if (j) return JSON.parse(j); } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function toast(t) { var e = $('toast'); e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 1900); }
  var today = function () { return new Date().toISOString().slice(0, 10); };

  function newGame(name, color) {
    var cards = {}, list = H.starterSquad();
    list.forEach(function (c) { cards[c.id] = c; });
    var ap = H.autoPick('4-3-3', list);
    S = { v: 1, club: { name: name, color: color }, coins: 2000, xp: 0, cards: cards, formation: '4-3-3', slots: ap.slots, bench: ap.bench,
      mentality: 'balanced', style: 'possession', seasonNo: 1, div: 3, season: null, lastDaily: '', rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, trophies: 0 };
    startSeason();
    save();
  }
  function startSeason() { S.season = H.newSeason(S.seasonNo, S.div, S.club, teamRating()); }

  /* ---------- squad helpers ---------- */
  function slotCards() { return S.slots.map(function (id) { return id ? S.cards[id] || null : null; }); }
  function benchCards() { return S.bench.map(function (id) { return S.cards[id]; }).filter(Boolean); }
  function evalSquad() { return H.evaluate(S.formation, slotCards()); }
  function teamRating() { return evalSquad().vector.rating; }
  function cleanSquad() {
    S.slots = S.slots.map(function (id) { return id && S.cards[id] ? id : null; });
    S.bench = S.bench.filter(function (id) { return S.cards[id]; });
    while (S.slots.length < 11) S.slots.push(null);
  }
  function inSquad(id) { return S.slots.indexOf(id) >= 0 || S.bench.indexOf(id) >= 0; }
  function addCards(list) { list.forEach(function (c) { S.cards[c.id] = c; }); }
  function setFormation(f) {
    var cards = S.slots.map(function (id) { return S.cards[id]; }).filter(Boolean);
    var old = S.slots.slice();
    S.formation = f;
    var fs = H.FORMATIONS[f], pool = cards.slice(), out = new Array(11).fill(null);
    fs.forEach(function (s, i) { // keep exact position matches first
      var k = pool.findIndex(function (c) { return c.pos === s[0]; });
      if (k >= 0) { out[i] = pool[k].id; pool.splice(k, 1); }
    });
    fs.forEach(function (s, i) {
      if (out[i]) return;
      var bi = -1, bv = -99; pool.forEach(function (c, k) { var v = c.ovr - H.penalty(s[0], c.pos); if (v > bv) { bv = v; bi = k; } });
      if (bi >= 0) { out[i] = pool[bi].id; pool.splice(bi, 1); }
    });
    S.slots = out; void old;
    pool.forEach(function (c) { if (S.bench.length < 7) S.bench.push(c.id); });
    save();
  }

  /* ---------- card html ---------- */
  function cardHTML(c, o) {
    o = o || {};
    if (!c) return '<div class="card empty' + (o.big ? ' big' : '') + '"><div style="font-size:22px">+</div><div class="pos">' + (o.pos || '') + '</div></div>';
    var ovr = o.ovr != null ? o.ovr : c.ovr;
    var last = c.name.split(' ').slice(-1)[0];
    return '<div class="card r-' + c.rarity + (o.big ? ' big' : '') + '"><div class="ovr">' + ovr + '</div><div class="pos">' + (o.pos || c.pos) + '</div><div class="fl">' + c.flag + '</div><div class="nm">' + esc(o.full ? c.name : last) + '</div><div class="sub">' + esc(c.club) + '</div>' + (o.pen ? '<div class="pen"></div>' : '') + '</div>';
  }
  var plus = function (c) { return c.trained ? ' <span class="pill">+' + c.trained + '</span>' : ''; };

  /* ---------- layers (sheets, full screens) ---------- */
  function openLayer(html, kind, onclose) {
    var d = document.createElement('div');
    d.className = kind === 'sheet' ? 'sheetbg' : 'full-l';
    d.innerHTML = kind === 'sheet' ? '<div class="sheet">' + html + '</div>' : html;
    if (kind === 'sheet') d.addEventListener('click', function (e) { if (e.target === d) closeLayer(); });
    $('layer').appendChild(d);
    layers.push({ el: d, onclose: onclose });
    return d;
  }
  function closeLayer() {
    var l = layers.pop(); if (!l) return false;
    l.el.remove(); if (l.onclose) l.onclose();
    return true;
  }
  function closeAll() { while (closeLayer()); }

  /* ---------- chrome ---------- */
  function chrome() {
    if (!S) { $('top').style.display = 'none'; $('nav').style.display = 'none'; return; }
    $('top').style.display = 'flex'; $('nav').style.display = 'flex';
    $('top').innerHTML = '<div class="crest" style="background:' + S.club.color + '">' + esc(S.club.name.charAt(0).toUpperCase()) + '</div><div class="nm">' + esc(S.club.name) + '<small>Level ' + H.levelOf(S.xp) + ' · Division ' + S.div + '</small></div><div class="coins">🪙 ' + fmt(S.coins) + '</div>';
    var T = [['home', '🏠', 'Home'], ['squad', '🧩', 'Squad'], ['play', '⚽', 'Play'], ['packs', '🎁', 'Packs'], ['club', '🗂️', 'Club']];
    $('nav').innerHTML = T.map(function (t) { return '<button data-act="tab" data-v="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"><b>' + t[1] + '</b>' + t[2] + '</button>'; }).join('');
  }
  function render() {
    chrome();
    var el = $('screen'), keep = el.scrollTop;
    if (!S) { el.innerHTML = viewIntro(); return; }
    var v = { home: viewHome, squad: viewSquad, play: viewPlay, packs: viewPacks, club: viewClub }[tab];
    el.innerHTML = v();
    el.scrollTop = keep;
  }

  /* ---------- intro ---------- */
  var introColor = COLORS[0];
  function viewIntro() {
    return '<div class="hero"><div class="crest" style="background:' + introColor + '">H</div><h2 style="font-size:26px;margin:0">HANS FC</h2><p class="mut">Build a squad. Pick the tactics. Win the league.</p></div>' +
      '<div class="panel"><h3 style="margin-top:0">Name your club</h3><input id="cn" type="text" maxlength="20" placeholder="e.g. Takoradi Stars" value="">' +
      '<h3>Club colour</h3><div class="sw">' + COLORS.map(function (c) { return '<i data-act="color" data-v="' + c + '" class="' + (c === introColor ? 'on' : '') + '" style="background:' + c + '"></i>'; }).join('') + '</div>' +
      '<button class="btn full" data-act="start">Start my club</button></div>' +
      '<p class="mut c" style="font-size:12px">All players, clubs and badges in this game are made up.</p>';
  }

  /* ---------- home ---------- */
  function viewHome() {
    var e = evalSquad(), f = H.userFixture(S.season), sn = S.season;
    var tbl = H.table(sn), pos = tbl.findIndex(function (r) { return r.isUser; }) + 1;
    var next = '';
    if (sn.done) next = '<div class="panel c"><b>Season ' + sn.no + ' is over</b><p class="mut">You finished ' + ord(pos) + '.</p><button class="btn full" data-act="endseason">Collect prize and continue</button></div>';
    else {
      var home = f.home === 0, opp = sn.teams[home ? f.away : f.home];
      next = '<div class="panel"><div class="mut" style="font-size:12px">NEXT MATCH · MATCHDAY ' + (sn.md + 1) + ' OF 14</div><div class="row" style="margin:10px 0"><div class="sp c"><b>' + esc(S.club.name) + '</b><div class="mut">' + (home ? 'Home' : 'Away') + '</div></div><div class="mut">vs</div><div class="sp c"><b>' + esc(opp.name) + '</b><div class="mut">Rated ' + Math.round(opp.strength) + '</div></div></div><button class="btn full" data-act="tab" data-v="play">Go to match</button></div>';
    }
    var d = S.lastDaily !== today();
    return next +
      '<div class="grid2"><div class="stat"><b>' + e.vector.rating + '</b><span>Team rating</span></div><div class="stat"><b>' + e.chemistry + '%</b><span>Chemistry</span></div>' +
      '<div class="stat"><b>' + ord(pos) + '</b><span>League position</span></div><div class="stat"><b>' + S.rec.w + '-' + S.rec.d + '-' + S.rec.l + '</b><span>W-D-L all time</span></div></div>' +
      '<div class="panel" style="margin-top:12px"><div class="row"><div class="sp"><b>🎁 Daily free pack</b><div class="mut" style="font-size:12px">' + (d ? 'Ready to open!' : 'Come back tomorrow') + '</div></div><button class="btn sm' + (d ? '' : ' ghost') + '" ' + (d ? '' : 'disabled') + ' data-act="pack" data-v="daily">Open</button></div></div>' +
      '<div class="panel"><div class="row"><div class="sp"><b>Level ' + H.levelOf(S.xp) + '</b><div class="mut" style="font-size:12px">' + (S.xp - H.xpForLevel(H.levelOf(S.xp))) + ' / ' + (H.xpForLevel(H.levelOf(S.xp) + 1) - H.xpForLevel(H.levelOf(S.xp))) + ' XP to next</div></div><div>🏆 ' + S.trophies + '</div></div></div>' +
      '<div class="row" style="justify-content:center;gap:14px"><button class="btn ghost sm" data-act="settings">Settings</button></div>';
  }
  var ord = function (n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); };

  /* ---------- squad ---------- */
  function viewSquad() {
    var e = evalSquad(), f = H.FORMATIONS[S.formation];
    var slots = f.map(function (s, i) {
      var r = e.rows[i], c = r.card, chem = '';
      if (c) chem = '<div class="chem">' + [1, 2, 3].map(function (k) { return '<i class="' + (r.chem >= k ? 'on' : '') + '"></i>'; }).join('') + '</div>';
      return '<div class="slot" data-act="slot" data-v="' + i + '" style="left:' + s[1] + '%;top:' + s[2] + '%">' + cardHTML(c, { ovr: c ? r.eff : '', pos: s[0], pen: c && r.pen > 0 }) + chem + '</div>';
    }).join('');
    var bench = S.bench.map(function (id, i) { return '<div data-act="bslot" data-v="' + i + '">' + cardHTML(S.cards[id]) + '</div>'; }).join('');
    for (var k = S.bench.length; k < 7; k++) bench += '<div data-act="bslot" data-v="' + k + '">' + cardHTML(null, { pos: 'SUB' }) + '</div>';
    return '<div class="row" style="margin-bottom:10px"><div class="sp"><b style="font-size:20px">' + e.vector.rating + '</b> <span class="mut">rating</span> &nbsp; <b style="font-size:20px">' + e.chemistry + '%</b> <span class="mut">chemistry</span></div><button class="btn sm ghost" data-act="auto">Auto pick</button></div>' +
      '<div class="seg">' + Object.keys(H.FORMATIONS).map(function (k) { return '<button data-act="form" data-v="' + k + '" class="' + (k === S.formation ? 'on' : '') + '">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="pitch">' + slots + '</div>' +
      '<h3>Substitutes</h3><div class="bench">' + bench + '</div>' +
      '<h3>Tactics</h3>' + tacticsHTML() +
      '<p class="mut" style="font-size:12px">Red border = playing out of position. Dots = chemistry from neighbours who share a club or country.</p>';
  }
  function tacticsHTML() {
    var seg = function (key, arr, label) { return '<div class="mut" style="font-size:12px;margin:6px 0 3px">' + label + '</div><div class="seg">' + arr.map(function (v) { return '<button data-act="tac" data-k="' + key + '" data-v="' + v + '" class="' + (S[key] === v ? 'on' : '') + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '</div>'; };
    return seg('mentality', H.MENTALITY, 'Mentality') + seg('style', H.STYLE, 'Style of play');
  }
  /* pick a card for a pitch slot (kind 'p') or a bench place (kind 'b') */
  function openPicker(kind, idx) {
    var slotPos = kind === 'p' ? H.FORMATIONS[S.formation][idx][0] : null;
    var curId = kind === 'p' ? S.slots[idx] : S.bench[idx];
    var list = Object.keys(S.cards).map(function (k) { return S.cards[k]; }).filter(function (c) { return c.id !== curId; });
    list.sort(function (a, b) {
      var va = slotPos ? a.ovr - H.penalty(slotPos, a.pos) : a.ovr, vb = slotPos ? b.ovr - H.penalty(slotPos, b.pos) : b.ovr;
      return vb - va;
    });
    var html = '<h2>' + (kind === 'p' ? 'Choose a ' + slotPos : 'Choose a substitute') + '</h2><div class="list">' + list.map(function (c) {
      var pen = slotPos ? H.penalty(slotPos, c.pos) : 0;
      var where = S.slots.indexOf(c.id) >= 0 ? 'Starting XI' : S.bench.indexOf(c.id) >= 0 ? 'Bench' : '';
      return '<div class="it" data-act="pick" data-id="' + c.id + '">' + cardHTML(c) + '<div class="t"><b>' + esc(c.name) + plus(c) + '</b><small>' + c.pos + ' · ' + esc(c.club) + ' · ' + c.flag + (where ? ' · ' + where : '') + '</small></div><div class="c"><b style="font-size:17px;color:' + (pen ? 'var(--bad)' : 'var(--acc)') + '">' + (c.ovr - pen) + '</b><div class="mut" style="font-size:10px">' + (pen ? '-' + pen + ' off pos.' : 'fits') + '</div></div></div>';
    }).join('') + '</div>' + (curId ? '<button class="btn ghost full" data-act="clear">Take out of squad</button>' : '');
    var d = openLayer(html, 'sheet');
    d.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act]'); if (!t) return;
      if (t.dataset.act === 'pick') { place(kind, idx, t.dataset.id); closeLayer(); render(); }
      if (t.dataset.act === 'clear') { if (kind === 'p') S.slots[idx] = null; else S.bench.splice(idx, 1); save(); closeLayer(); render(); }
    });
  }
  function place(kind, idx, id) {
    var curId = kind === 'p' ? S.slots[idx] : S.bench[idx];
    var si = S.slots.indexOf(id), bi = S.bench.indexOf(id);
    if (si >= 0) S.slots[si] = curId || null;       // swap with another starter
    else if (bi >= 0) { if (curId) S.bench[bi] = curId; else S.bench.splice(bi, 1); }
    if (kind === 'p') S.slots[idx] = id;
    else { if (idx >= S.bench.length) S.bench.push(id); else S.bench[idx] = id; }
    // never keep the same card twice on the bench
    S.bench = S.bench.filter(function (x, i, a) { return a.indexOf(x) === i; });
    save(); toast('Squad updated');
  }

  /* ---------- play ---------- */
  function viewPlay() {
    var sn = S.season, tbl = H.table(sn), f = H.userFixture(sn);
    var rows = tbl.map(function (r, i) { return '<tr class="' + (r.isUser ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + r.p + '</td><td>' + (r.gf - r.ga) + '</td><td><b>' + r.pts + '</b></td></tr>'; }).join('');
    var go;
    if (sn.done) go = '<button class="btn full" data-act="endseason">Season over - collect prize</button>';
    else {
      var home = f.home === 0, opp = sn.teams[home ? f.away : f.home], filled = S.slots.filter(Boolean).length;
      go = '<div class="panel"><div class="mut" style="font-size:12px">MATCHDAY ' + (sn.md + 1) + ' · SEASON ' + sn.no + ' · DIVISION ' + sn.div + '</div><h2 style="margin:8px 0">' + (home ? esc(S.club.name) + ' vs ' + esc(opp.name) : esc(opp.name) + ' vs ' + esc(S.club.name)) + '</h2>' +
        '<div class="mut" style="font-size:13px;margin-bottom:10px">Your rating ' + teamRating() + ' · Their rating ' + Math.round(opp.strength) + '</div>' +
        (filled < 11 ? '<div class="pill" style="background:var(--bad)">Your squad needs 11 players</div>' : '') +
        '<div class="grid2"><button class="btn" data-act="play" ' + (filled < 11 ? 'disabled' : '') + '>▶ Play match</button><button class="btn ghost" data-act="simfast" ' + (filled < 11 ? 'disabled' : '') + '>⏩ Sim result</button></div></div>';
    }
    var results = sn.fixtures.filter(function (x) { return x.played && (x.home === 0 || x.away === 0); }).slice(-5).reverse().map(function (x) {
      var h = sn.teams[x.home], a = sn.teams[x.away];
      return '<div class="row" style="padding:6px 0;border-top:1px solid var(--line);font-size:13px"><span class="sp">' + esc(h.name) + '</span><b>' + x.hg + ' - ' + x.ag + '</b><span class="sp" style="text-align:right">' + esc(a.name) + '</span></div>';
    }).join('');
    return go + '<h3>League table</h3><div class="panel" style="padding:4px 8px"><table><thead><tr><th></th><th>Club</th><th>P</th><th>GD</th><th>Pts</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="mut" style="font-size:12px">Top 2 go up a division. Bottom 2 go down. Higher divisions pay more coins.</p>' + (results ? '<h3>Your recent games</h3><div class="panel">' + results + '</div>' : '');
  }

  function userTeam() {
    var e = evalSquad();
    var on = e.rows.map(function (r) { return { id: r.card.id, name: r.card.name, pos: r.slot, ovr: r.eff, stats: r.card.stats }; });
    return { name: S.club.name, color: S.club.color, on: on, bench: benchCards().map(function (c) { return { id: c.id, name: c.name, pos: c.pos, ovr: c.ovr, stats: c.stats }; }), mentality: S.mentality, style: S.style, isUser: true };
  }
  function buildMatch() {
    var sn = S.season, f = H.userFixture(sn), home = f.home === 0, opp = sn.teams[home ? f.away : f.home];
    var o = H.aiTeam(opp.name, opp.strength, opp.color);
    var u = userTeam(), ai = { name: o.name, color: o.color, on: o.on, bench: o.bench, mentality: U.pick(H.MENTALITY), style: U.pick(H.STYLE), isUser: false };
    return { m: H.createMatch(home ? u : ai, home ? ai : u), home: home, userSide: home ? 0 : 1 };
  }
  function playMatch() {
    var B = buildMatch(), m = B.m, speed = 1, done = false;
    var hx = '<div class="sb"><div class="clock" id="mclk">KICK OFF</div><div class="teams"><div class="tm"><i style="background:' + m.home.color + '"></i>' + esc(m.home.name) + '</div><div class="sc" id="msc">0 - 0</div><div class="tm"><i style="background:' + m.away.color + '"></i>' + esc(m.away.name) + '</div></div><div class="scorers"><div id="gh"></div><div id="ga"></div></div></div>' +
      '<div style="padding:6px 14px" id="mst"></div><div class="log" id="mlog"></div><div class="ctl" id="mctl"></div>';
    var L = openLayer(hx, 'full');
    var log = L.querySelector('#mlog');
    function stats() {
      var s = m.stats, tot = (s.poss[0] + s.poss[1]) || 1, p = Math.round(s.poss[0] / tot * 100) || 50;
      var bar = function (n, a, b) { var t = (a + b) || 1; return '<div class="bar"><span>' + a + '</span><div class="b"><i style="width:' + (a / t * 100) + '%"></i><u></u></div><span>' + b + '</span><small class="mut" style="width:90px">' + n + '</small></div>'; };
      L.querySelector('#mst').innerHTML = '<div class="bar"><span>' + p + '%</span><div class="b"><i style="width:' + p + '%"></i><u></u></div><span>' + (100 - p) + '%</span><small class="mut" style="width:90px">Possession</small></div>' + bar('Shots', s.shots[0], s.shots[1]) + bar('On target', s.sot[0], s.sot[1]);
    }
    function paint(evs) {
      L.querySelector('#msc').textContent = m.score[0] + ' - ' + m.score[1];
      L.querySelector('#mclk').textContent = m.finished ? 'FULL TIME' : m.paused === 'ht' ? 'HALF TIME' : m.min + (m.add ? '+' + m.add : '') + "'";
      L.querySelector('#gh').innerHTML = m.goals[0].map(function (g) { return '⚽ ' + esc(g.name.split(' ').slice(-1)[0]) + ' ' + g.t; }).join('<br>');
      L.querySelector('#ga').innerHTML = m.goals[1].map(function (g) { return esc(g.name.split(' ').slice(-1)[0]) + ' ' + g.t + ' ⚽'; }).join('<br>');
      evs.forEach(function (e) {
        var d = document.createElement('div'); d.className = 'ev ' + e.type + (e.type === 'goal' ? ' flash' : '');
        d.innerHTML = '<div class="m">' + e.t + '</div><div>' + esc(e.text) + (e.type === 'goal' ? ' (' + e.score[0] + '-' + e.score[1] + ')' : '') + '</div>';
        log.insertBefore(d, log.firstChild);
        if (e.type === 'goal' && e.side === B.userSide && navigator.vibrate) { try { navigator.vibrate(60); } catch (x) {} }
      });
      stats();
    }
    function controls() {
      var c = L.querySelector('#mctl');
      if (m.finished) { c.innerHTML = '<button class="btn full" data-m="result">See result</button>'; return; }
      if (m.paused === 'ht') { c.innerHTML = '<button class="btn ghost" data-m="manage">Subs & tactics</button><button class="btn" data-m="half2">Second half ▶</button>'; return; }
      if (!running()) { c.innerHTML = '<button class="btn ghost" data-m="manage">Subs & tactics</button><button class="btn" data-m="resume">Resume ▶</button>'; return; }
      c.innerHTML = '<button class="btn ghost" data-m="pause">⏸ Pause</button><button class="btn ghost" data-m="speed">Speed ' + speed + 'x</button><button class="btn ghost" data-m="skip">Skip ⏭</button>';
    }
    var running = function () { return !!matchTimer; };
    function stop() { clearInterval(matchTimer); matchTimer = null; }
    function tick() {
      var ev = H.stepMatch(m); paint(ev);
      if (m.finished || m.paused) { stop(); controls(); if (m.paused === 'ht') toast('Half time'); }
    }
    function start() { stop(); matchTimer = setInterval(tick, speed === 1 ? 260 : 90); controls(); }
    function manage() {
      var side = B.userSide, t = side === 0 ? m.home : m.away;
      var html = '<h2>Substitutions (' + (3 - t.subs) + ' left)</h2><div class="mut" style="font-size:12px;margin-bottom:6px">Tap a player to take off, then a substitute.</div><div class="list" id="subs"></div><h3>Tactics</h3>' +
        ['mentality', 'style'].map(function (key) { var arr = key === 'mentality' ? H.MENTALITY : H.STYLE; return '<div class="seg">' + arr.map(function (v) { return '<button data-tk="' + key + '" data-v="' + v + '" class="' + (t[key] === v ? 'on' : '') + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '</div>'; }).join('') +
        '<button class="btn full" data-x="close">Done</button>';
      var sh = openLayer(html, 'sheet'), offIdx = null;
      function list() {
        var h = '';
        if (offIdx == null) h = t.on.map(function (p, i) { return p.out ? '' : '<div class="it" data-off="' + i + '"><div class="t"><b>' + esc(p.name) + '</b><small>' + p.slot + ' · rating ' + p.ovr + ' · ' + p.perf.g + ' goals</small></div><span class="pill">Off</span></div>'; }).join('');
        else h = '<div class="mut" style="margin-bottom:6px">Taking off ' + esc(t.on[offIdx].name) + '. Who comes on?</div>' + t.bench.map(function (p, i) { return '<div class="it" data-in="' + i + '"><div class="t"><b>' + esc(p.name) + '</b><small>' + p.pos + ' · ' + p.ovr + ' (fits ' + Math.max(30, p.ovr - H.penalty(t.on[offIdx].slot, p.pos)) + ')</small></div><span class="pill">On</span></div>'; }).join('') + '<button class="btn ghost sm" data-back="1">Back</button>';
        sh.querySelector('#subs').innerHTML = h;
      }
      list();
      sh.addEventListener('click', function (e) {
        var x = e.target.closest('[data-off],[data-in],[data-tk],[data-back],[data-x]'); if (!x) return;
        if (x.dataset.x) { closeLayer(); return; }
        if (x.dataset.back) { offIdx = null; list(); return; }
        if (x.dataset.off != null) { offIdx = +x.dataset.off; list(); return; }
        if (x.dataset.in != null) {
          var r = H.substitute(m, side, offIdx, +x.dataset.in);
          if (typeof r === 'string') toast(r); else { paint([r]); toast('Substitution made'); }
          closeLayer(); controls(); return;
        }
        if (x.dataset.tk) { t[x.dataset.tk] = x.dataset.v; x.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === x); }); }
      });
    }
    function finish() {
      stop(); done = true;
      var us = B.userSide, gf = m.score[us], ga = m.score[1 - us], r = H.matchReward(gf, ga, S.div), xp = 40 + gf * 10 + (gf > ga ? 40 : gf === ga ? 15 : 0);
      var motmMine = m.motm && m.motm.side === us;
      if (motmMine) r += 150;
      apply(gf, ga, r, xp, m.score);
      closeLayer();
      var res = gf > ga ? 'VICTORY' : gf === ga ? 'DRAW' : 'DEFEAT';
      var rs = openLayer('<div class="hero"><h2 style="font-size:30px;margin:0;color:' + (gf > ga ? 'var(--acc)' : gf === ga ? 'var(--acc2)' : 'var(--bad)') + '">' + res + '</h2><div style="font-size:42px;font-weight:900;margin:8px 0">' + m.score[0] + ' - ' + m.score[1] + '</div><div class="mut">' + esc(m.home.name) + ' vs ' + esc(m.away.name) + '</div></div>' +
        '<div style="padding:0 14px;flex:1;overflow-y:auto"><div class="panel"><div class="row"><span class="sp">Coins earned</span><b style="color:var(--acc2)">+' + fmt(r) + '</b></div><div class="row"><span class="sp">XP</span><b>+' + xp + '</b></div>' + (m.motm ? '<div class="row"><span class="sp">Man of the match</span><b>' + esc(m.motm.name) + (motmMine ? ' ⭐' : '') + '</b></div>' : '') + '</div>' +
        '<div class="panel"><div class="bar"><span>' + m.stats.shots[0] + '</span><div class="b"><i style="width:' + (m.stats.shots[0] / ((m.stats.shots[0] + m.stats.shots[1]) || 1) * 100) + '%"></i><u></u></div><span>' + m.stats.shots[1] + '</span><small class="mut" style="width:80px">Shots</small></div><div class="bar"><span>' + m.stats.possPct[0] + '%</span><div class="b"><i style="width:' + m.stats.possPct[0] + '%"></i><u></u></div><span>' + m.stats.possPct[1] + '%</span><small class="mut" style="width:80px">Possession</small></div><div class="bar"><span>' + m.stats.corners[0] + '</span><div class="b"><i style="width:' + (m.stats.corners[0] / ((m.stats.corners[0] + m.stats.corners[1]) || 1) * 100) + '%"></i><u></u></div><span>' + m.stats.corners[1] + '</span><small class="mut" style="width:80px">Corners</small></div></div></div>' +
        '<div class="ctl"><button class="btn full" data-m="close">Continue</button></div>', 'full');
      rs.addEventListener('click', function (e) { if (e.target.closest('[data-m=close]')) { closeLayer(); render(); } });
    }
    L.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      var a = b.dataset.m;
      if (a === 'pause') { stop(); controls(); }
      else if (a === 'resume') start();
      else if (a === 'speed') { speed = speed === 1 ? 3 : 1; start(); }
      else if (a === 'skip') { stop(); var g = 0, all = []; while (!m.finished && !m.paused && g++ < 400) all = all.concat(H.stepMatch(m)); paint(all); controls(); if (m.paused === 'ht') toast('Half time'); }
      else if (a === 'manage') manage();
      else if (a === 'half2') { H.startSecondHalf(m); start(); }
      else if (a === 'result') finish();
    });
    L._abort = function () { stop(); };
    layers[layers.length - 1].onclose = function () { stop(); };
    paint([]); controls();
    setTimeout(function () { if (!done && layers.length && layers[layers.length - 1].el === L) start(); }, 500);
  }
  function apply(gf, ga, coins, xp, score) {
    S.coins += coins; S.xp += xp;
    S.rec.gf += gf; S.rec.ga += ga; if (gf > ga) S.rec.w++; else if (gf === ga) S.rec.d++; else S.rec.l++;
    var f = H.userFixture(S.season);
    H.completeMatchday(S.season, score);
    void f; save();
  }
  function simFast() {
    var B = buildMatch(); H.playFully(B.m); var m = B.m, us = B.userSide, gf = m.score[us], ga = m.score[1 - us];
    var r = H.matchReward(gf, ga, S.div), xp = 40 + gf * 10 + (gf > ga ? 40 : gf === ga ? 15 : 0);
    apply(gf, ga, r, xp, m.score);
    toast((gf > ga ? 'Win ' : gf === ga ? 'Draw ' : 'Loss ') + gf + '-' + ga + ' · +' + fmt(r) + ' coins');
    render();
  }
  function endSeason() {
    var sn = S.season, tbl = H.table(sn), pos = tbl.findIndex(function (r) { return r.isUser; }) + 1;
    var prize = Math.round(H.SEASON_PRIZE[pos - 1] * H.divMult(S.div)), msg = '';
    var oldDiv = S.div;
    if (pos <= 2 && S.div > 1) { S.div--; msg = 'Promoted to Division ' + S.div + '!'; }
    else if (pos >= 7 && S.div < 3) { S.div++; msg = 'Relegated to Division ' + S.div + '.'; }
    else msg = 'You stay in Division ' + S.div + '.';
    if (pos === 1) { S.trophies++; msg = (oldDiv === 1 ? 'CHAMPIONS! ' : 'Division winners! ') + msg; }
    S.coins += prize; S.seasonNo++;
    var pk = pos <= 3 ? H.openPack('gold', S.cards) : null; if (pk) addCards(pk);
    startSeason(); save();
    var html = '<h2>Season ' + sn.no + ' finished</h2><div class="panel c"><div style="font-size:34px;font-weight:900">' + ord(pos) + '</div><p>' + msg + '</p><p>Prize: <b style="color:var(--acc2)">🪙 ' + fmt(prize) + '</b></p>' + (pk ? '<p>Top 3 bonus: a Gold Pack with ' + pk.length + ' players was added to your club!</p>' : '') + '</div><button class="btn full" data-x="1">Start season ' + S.seasonNo + '</button>';
    var d = openLayer(html, 'sheet', render);
    d.querySelector('[data-x]').onclick = function () { closeLayer(); };
    if (pk) { var best = pk[pk.length - 1]; d.querySelector('.panel').insertAdjacentHTML('beforeend', '<div style="display:flex;justify-content:center;margin-top:8px">' + cardHTML(best, { big: true, full: true }) + '</div>'); }
    render();
  }

  /* ---------- packs ---------- */
  var EMO = { bronze: '🥉', silver: '🥈', gold: '🥇', premium: '💎', daily: '🎁' };
  function viewPacks() {
    var d = S.lastDaily !== today();
    return '<h2>Pack store</h2><div class="packs">' + ['bronze', 'silver', 'gold', 'premium', 'daily'].map(function (k) {
      var p = H.PACKS[k], free = k === 'daily', can = free ? d : S.coins >= p.price;
      return '<div class="pack pk-' + k + '"><div class="em">' + EMO[k] + '</div><b>' + p.name + '</b><small>' + p.cards + ' players · ' + p.note + '</small><button class="btn sm ' + (free ? '' : 'gold') + '" ' + (can ? '' : 'disabled') + ' data-act="pack" data-v="' + k + '">' + (free ? (d ? 'Open free' : 'Tomorrow') : '🪙 ' + fmt(p.price)) + '</button></div>';
    }).join('') + '</div><p class="mut" style="font-size:12px;margin-top:12px">Earn coins by playing matches, winning seasons and selling players you do not need. There is nothing to buy with real money.</p>';
  }
  function openPackNow(kind) {
    var p = H.PACKS[kind];
    if (kind === 'daily') { if (S.lastDaily === today()) return toast('Already opened today'); S.lastDaily = today(); }
    else { if (S.coins < p.price) return toast('Not enough coins'); S.coins -= p.price; }
    var cards = H.openPack(kind, S.cards); addCards(cards); save();
    var flipped = 0, hx = '<div class="c" style="padding:16px 10px 0"><h2>' + p.name + '</h2><div class="mut">Tap each card to reveal</div></div><div class="reveal">' + cards.map(function (c, i) { return '<div class="flip' + (i === cards.length - 1 ? ' best' : '') + '" data-i="' + i + '"><div class="in"><div class="bk">H</div><div class="f">' + cardHTML(c, { big: true, full: true }) + '</div></div></div>'; }).join('') + '</div><div class="ctl"><button class="btn ghost" data-r="all">Reveal all</button><button class="btn" data-r="done" disabled>Done</button></div>';
    var L = openLayer(hx, 'full', render);
    function chk() { if (L.querySelectorAll('.flip.on').length === cards.length) { L.querySelector('[data-r=done]').disabled = false; var best = cards[cards.length - 1]; if (best.ovr >= 85) toast('🔥 ' + best.name + ' · ' + best.ovr); } }
    L.addEventListener('click', function (e) {
      var f = e.target.closest('.flip'), r = e.target.closest('[data-r]');
      if (f) { f.classList.add('on'); flipped++; chk(); }
      if (r && r.dataset.r === 'all') { L.querySelectorAll('.flip').forEach(function (x) { x.classList.add('on'); }); chk(); }
      if (r && r.dataset.r === 'done' && !r.disabled) closeLayer();
    });
  }

  /* ---------- club (collection) ---------- */
  var sortBy = 'ovr', filt = 'all';
  function viewClub() {
    var all = Object.keys(S.cards).map(function (k) { return S.cards[k]; });
    var list = all.filter(function (c) { return filt === 'all' || H.GROUP[c.pos] === filt; });
    list.sort(function (a, b) { return sortBy === 'ovr' ? b.ovr - a.ovr : sortBy === 'new' ? 0 : a.name < b.name ? -1 : 1; });
    var worth = all.filter(function (c) { return !inSquad(c.id); }).reduce(function (s, c) { return s + H.sellValue(c); }, 0);
    return '<div class="row"><h2 class="sp">My club (' + all.length + ')</h2><button class="btn sm ghost" data-act="sellrest">Sell spares 🪙' + fmt(worth) + '</button></div>' +
      '<div class="seg">' + [['all', 'All'], ['G', 'GK'], ['D', 'DEF'], ['M', 'MID'], ['A', 'ATT']].map(function (x) { return '<button data-act="filt" data-v="' + x[0] + '" class="' + (filt === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;justify-items:center">' + list.map(function (c) { return '<div data-act="view" data-id="' + c.id + '" style="position:relative">' + cardHTML(c) + (inSquad(c.id) ? '<span class="pill" style="position:absolute;top:2px;left:2px;background:#000a;color:#fff;font-size:9px;padding:0 4px">XI</span>' : '') + '</div>'; }).join('') + '</div>';
  }
  function viewCard(id) {
    var c = S.cards[id]; if (!c) return;
    var labels = H.statLabels(c.pos), tc = H.trainCost(c), maxed = c.trained >= H.MAX_TRAIN;
    var html = '<div class="row" style="align-items:flex-start;gap:14px">' + cardHTML(c, { big: true, full: true }) + '<div class="sp"><h2 style="margin:0">' + esc(c.name) + '</h2><div class="mut">' + c.pos + ' · ' + c.flag + ' ' + esc(c.nat) + '<br>' + esc(c.club) + ' · age ' + c.age + '</div>' + (c.icon ? '<span class="pill" style="background:#7d3cff">LEGEND</span>' : '') + plus(c) + '</div></div>' +
      '<div class="grid2" style="margin:12px 0">' + c.stats.map(function (v, i) { return '<div class="stat"><b>' + v + '</b><span>' + labels[i] + '</span></div>'; }).join('') + '</div>' +
      '<div class="grid2"><button class="btn" data-x="train" ' + (maxed || S.coins < tc ? 'disabled' : '') + '>' + (maxed ? 'Fully trained' : 'Train +1 · 🪙' + fmt(tc)) + '</button><button class="btn ghost" data-x="sell" ' + (inSquad(c.id) ? 'disabled' : '') + '>' + (inSquad(c.id) ? 'In squad' : 'Sell · 🪙' + fmt(H.sellValue(c))) + '</button></div>';
    var d = openLayer(html, 'sheet');
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-x]'); if (!b || b.disabled) return;
      if (b.dataset.x === 'train') { S.coins -= tc; c.ovr++; c.trained++; c.stats = c.stats.map(function (v) { return Math.min(99, v + 1); }); c.rarity = H.rarityOf(c.ovr); save(); closeLayer(); render(); toast(c.name + ' is now ' + c.ovr); }
      if (b.dataset.x === 'sell') { S.coins += H.sellValue(c); delete S.cards[c.id]; save(); closeLayer(); render(); toast('Sold for ' + fmt(H.sellValue(c))); }
    });
  }
  function sellSpares() {
    var spare = Object.keys(S.cards).map(function (k) { return S.cards[k]; }).filter(function (c) { return !inSquad(c.id) && !c.icon; });
    if (!spare.length) return toast('No spare players to sell');
    var total = spare.reduce(function (s, c) { return s + H.sellValue(c); }, 0);
    var d = openLayer('<h2>Sell ' + spare.length + ' spare players?</h2><p>You get <b style="color:var(--acc2)">🪙 ' + fmt(total) + '</b>. Players in your squad and legends are kept.</p><div class="grid2"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="yes">Sell</button></div>', 'sheet');
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'yes') { spare.forEach(function (c) { delete S.cards[c.id]; }); S.coins += total; save(); toast('Sold for ' + fmt(total)); } closeLayer(); render(); });
  }
  function settings() {
    var d = openLayer('<h2>Settings</h2><div class="panel mut" style="font-size:13px">HANS FC v1.0 · saves automatically on this phone. Every player, club and badge is invented, so any resemblance to real people is by chance.</div><button class="btn red full" data-x="reset">Reset game and start over</button><button class="btn ghost full" style="margin-top:8px" data-x="close">Close</button>', 'sheet');
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'close') return closeLayer();
      if (b.dataset.x === 'reset') { if (b.dataset.sure) { try { localStorage.removeItem(KEY); } catch (x) {} S = null; closeAll(); tab = 'home'; render(); } else { b.dataset.sure = 1; b.textContent = 'Tap again to delete everything'; } }
    });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('#screen [data-act], #nav [data-act]'); if (!t) return;
    var a = t.dataset.act, v = t.dataset.v;
    if (a === 'tab') { tab = v; render(); $('screen').scrollTop = 0; }
    else if (a === 'color') { introColor = v; var n = $('cn') && $('cn').value; render(); if (n) $('cn').value = n; }
    else if (a === 'start') { var nm = ($('cn').value || '').trim(); if (nm.length < 2) return toast('Give your club a name'); newGame(nm, introColor); tab = 'home'; render(); }
    else if (a === 'slot') openPicker('p', +v);
    else if (a === 'bslot') openPicker('b', +v);
    else if (a === 'form') { setFormation(v); render(); }
    else if (a === 'auto') { var ap = H.autoPick(S.formation, Object.keys(S.cards).map(function (k) { return S.cards[k]; })); S.slots = ap.slots; S.bench = ap.bench; save(); render(); toast('Best XI picked'); }
    else if (a === 'tac') { S[t.dataset.k] = v; save(); render(); }
    else if (a === 'play') { cleanSquad(); playMatch(); }
    else if (a === 'simfast') simFast();
    else if (a === 'endseason') endSeason();
    else if (a === 'pack') openPackNow(v);
    else if (a === 'filt') { filt = v; render(); }
    else if (a === 'view') viewCard(t.dataset.id);
    else if (a === 'sellrest') sellSpares();
    else if (a === 'settings') settings();
  });

  /* Android back button: the app calls this. true = handled here */
  window.__back = function () {
    if (matchTimer && layers.length) { toast('Pause the match first'); return true; }
    if (layers.length) { var top = layers[layers.length - 1]; if (top.el.className === 'full-l' && top.el.querySelector('#mlog')) { toast('Finish the match first'); return true; } closeLayer(); return true; }
    if (S && tab !== 'home') { tab = 'home'; render(); return true; }
    return false;
  };

  S = load();
  if (S) { try { cleanSquad(); if (!S.season) startSeason(); } catch (e) { S = null; } }
  render();
  window.__hfc = { get S() { return S; } };
})();
