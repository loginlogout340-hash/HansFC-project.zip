/* HANS FC Plus: add-on for the app (load after app.js).
   1. Real-date calendar            (Menu, Calendar)
   2. U20 team matches              (you choose: watch live or pass)
   3. Watch live mode               (U20 matches and your World Cup matches, minute by minute)
   4. Video clips                   (your own videos: matchday scene before kick-off, awards ceremony, World Cup scene)
   Everything is saved with your career or on your phone. Nothing here needs the internet. */
(function () {
'use strict';
try {
var H = window.HFC; if (!H) return;
var KEY = 'hansfc_save_v2', CK = 'hfc_plus_cfg', MK = 'hfc_plus_clips';
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var ls = function (k, v) { try { if (v === undefined) return window.localStorage.getItem(k); if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } return null; };
var ri = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
var G = function () { return window.__hfc ? window.__hfc.G : null; };
var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function cfg() { var c = {}; try { c = JSON.parse(ls(CK) || '{}'); } catch (e) { c = {}; } return { scene: c.scene || 'ask', cer: c.cer || 'ask', u20: c.u20 || 'ask', speed: c.speed || 'normal' }; }
function setCfg(k, v) { var c = cfg(); c[k] = v; ls(CK, JSON.stringify(c)); }
function clips() { try { return JSON.parse(ls(MK) || '{}'); } catch (e) { return {}; } }
function saveGame() { var g = G(); if (g && H.save) { try { H.save(g, KEY); } catch (e) { /* ignore */ } } }
function toast(m) { var t = $('hp-toast'); if (!t) return; t.textContent = m; t.className = 'hp-toast on'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'hp-toast'; }, 2600); }
function busyUI() { return !!document.querySelector('.v4bg,.v5bg,.v6bg,.v7bg,.v8bg,.fcx,.fca,.fcw,.hp-bg,#ol-root[style*="flex"]'); }

/* ---------------------------------------- dates ---------------------------------------- */
function weekDate(S, w) { return new Date(Date.UTC(S.year, 7, 10) + (Math.max(1, w) - 1) * 7 * 86400000); }
function matchDay(S, w) { var d = weekDate(S, w); return new Date(d.getTime() + ((6 - d.getUTCDay() + 7) % 7) * 86400000); }
function dkey(d) { return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate(); }
function dlabel(d) { return DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONS[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCFullYear(); }
function calEvents() {
  var g = G(); if (!g) return null;
  var S = g.S, uc = H.userClub(g), ev = {}, list = [], add = function (d, ic, t, w, past) { var o = { d: d, ic: ic, t: t, w: w, past: !!past }; (ev[dkey(d)] = ev[dkey(d)] || []).push(o); list.push(o); };
  var lgr = S.lg[uc.lg], last = H.LAST_WEEK;
  for (var w = 1; w <= last; w++) {
    var rd = lgr.rounds[w - 1], f = rd && rd.filter(function (x) { return x[0] === S.uid || x[1] === S.uid; })[0];
    if (f) { var home = f[0] === S.uid, opp = S.clubs[home ? f[1] : f[0]].name, done = f[2] >= 0; add(matchDay(S, w), '⚽', (home ? 'vs ' : 'at ') + opp + (done ? ' (' + f[2] + '-' + f[3] + ')' : ''), w, done); }
    var cr = H.CUPW.indexOf(w), cup = S.cup[uc.lg];
    if (cr >= 0 && (cup.alive.indexOf(S.uid) >= 0 || cr < cup.round)) add(new Date(matchDay(S, w).getTime() - 3 * 86400000), '🏆', cup.name + ', round ' + (cr + 1), w, cr < cup.round);
    H.CCW.forEach(function (ws, r) { if (ws.indexOf(w) >= 0 && S.cc.teams.indexOf(S.uid) >= 0 && (S.cc.alive.indexOf(S.uid) >= 0 || r < S.cc.round)) add(new Date(matchDay(S, w).getTime() - 3 * 86400000), '⭐', 'Champions Cup, ' + H.CCN[r] + (ws.length > 1 ? ', leg ' + (ws.indexOf(w) + 1) : ''), w, r < S.cc.round); });
    if (w % 2 === 0 && w < last) add(new Date(matchDay(S, w).getTime() - 86400000), '🎓', 'U20 match day', w, w < S.week);
  }
  add(new Date(matchDay(S, last).getTime() + 3 * 86400000), '🏅', 'Awards night', last, S.week > last);
  var win = [[new Date(weekDate(S, 1).getTime() - 7 * 86400000), new Date(weekDate(S, 4).getTime() + 6 * 86400000)], [weekDate(S, 20), new Date(weekDate(S, 24).getTime() + 6 * 86400000)]];
  list.sort(function (a, b) { return a.d - b.d; });
  var now = S.stage === 'pre' ? new Date(weekDate(S, 1).getTime() - 7 * 86400000) : weekDate(S, Math.min(S.week, last));
  return { ev: ev, list: list, win: win, now: now, S: S };
}
var cal = null;
function calHTML() {
  var c = calEvents(); if (!c) return '<h3>📅 Calendar</h3><p class="hp-s">Start a career first.</p>';
  if (!cal) cal = { y: c.now.getUTCFullYear(), m: c.now.getUTCMonth() };
  var first = new Date(Date.UTC(cal.y, cal.m, 1)), lead = (first.getUTCDay() + 6) % 7, dim = new Date(Date.UTC(cal.y, cal.m + 1, 0)).getUTCDate(), real = new Date();
  var h = '<h3>📅 Calendar</h3><div class="hp-s">Game date: <b>' + dlabel(c.now) + '</b> · ' + (c.S.stage === 'pre' ? 'pre-season' : 'week ' + c.S.week + ' of ' + H.LAST_WEEK) + '<br>Phone date: ' + DAYS[real.getDay()] + ' ' + real.getDate() + ' ' + MONS[real.getMonth()].slice(0, 3) + ' ' + real.getFullYear() + '</div>';
  h += '<div class="hp-two"><button class="hp-b g" data-hp="calp">◀</button><div class="hp-mo">' + MONS[cal.m] + ' ' + cal.y + '</div><button class="hp-b g" data-hp="caln">▶</button></div><div class="hp-cal">';
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d) { h += '<div class="hp-dn">' + d + '</div>'; });
  for (var i = 0; i < lead; i++) h += '<div class="hp-d dim"></div>';
  for (var d = 1; d <= dim; d++) {
    var dt = new Date(Date.UTC(cal.y, cal.m, d)), es = c.ev[dkey(dt)] || [], isNow = dkey(dt) === dkey(c.now), inWin = c.win.some(function (r) { return dt >= r[0] && dt <= r[1]; });
    h += '<div class="hp-d' + (isNow ? ' me' : '') + (inWin ? ' win' : '') + '"><i>' + d + '</i>' + es.map(function (e) { return '<span class="' + (e.past ? 'past' : '') + '">' + e.ic + '</span>'; }).join('') + '</div>';
  }
  h += '</div><div class="hp-s" style="margin-top:6px">⚽ league · 🏆 cup · ⭐ Champions Cup · 🎓 U20 · 🏅 awards · blue = transfer window · yellow frame = today in the game</div>';
  var up = c.list.filter(function (e) { return !e.past; }).slice(0, 8);
  h += '<h4>Coming up</h4>' + (up.length ? up.map(function (e) { return '<div class="hp-r"><span>' + dlabel(e.d) + '</span><b>' + e.ic + ' ' + esc(e.t) + '</b></div>'; }).join('') : '<p class="hp-s">Nothing left this season.</p>');
  var w0 = c.win[0], w1 = c.win[1];
  h += '<h4>Transfer windows</h4><div class="hp-r"><span>Summer</span><b>' + dlabel(w0[0]) + ' to ' + dlabel(w0[1]) + '</b></div><div class="hp-r"><span>Winter</span><b>' + dlabel(w1[0]) + ' to ' + dlabel(w1[1]) + '</b></div>';
  return h + '<button class="hp-b g" data-hp="hub">Back</button>';
}

/* ---------------------------------------- live match viewer ---------------------------------------- */
var LV = null;
function lvClose() { if (LV) { clearInterval(LV.t); if (LV.el && LV.el.parentNode) LV.el.parentNode.removeChild(LV.el); LV = null; } }
function live(o) {
  lvClose();
  var m = H.createMatch(o.home, o.away, { needWinner: !!o.needWinner }), el = document.createElement('div');
  el.className = 'hp-bg'; el.id = 'hp-live';
  el.innerHTML = '<div class="hp-box"><div class="hp-s" id="hp-lt">' + esc(o.title) + '</div><div class="hp-score"><span>' + esc(o.home.name) + '</span><b id="hp-sc">0 - 0</b><span>' + esc(o.away.name) + '</span></div><div class="hp-mn" id="hp-mn">0\'</div><div class="hp-feed" id="hp-fd"></div>' +
    '<div class="hp-two" id="hp-lb"><button class="hp-b g" data-hp="lvs">🐢 / ▶ / ⏩ speed: <span id="hp-sp">' + cfg().speed + '</span></button><button class="hp-b" data-hp="lvk">⏭ Skip to end</button></div></div>';
  document.body.appendChild(el);
  LV = { m: m, o: o, el: el, wait: 0, over: false, t: null };
  var ms = function () { return { slow: 700, normal: 300, fast: 70 }[cfg().speed] || 300; };
  LV.start = function () { clearInterval(LV.t); LV.t = setInterval(lvTick, ms()); };
  lvLine({ t: '', type: 'ko', text: 'Welcome to ' + o.title + '. Kick-off!' });
  LV.start();
}
function lvLine(e) {
  var fd = $('hp-fd'); if (!fd) return;
  var d = document.createElement('div'); d.className = 'hp-ev ' + e.type; d.textContent = (e.t ? e.t + '  ' : '') + e.text; fd.insertBefore(d, fd.firstChild);
  while (fd.childNodes.length > 60) fd.removeChild(fd.lastChild);
}
function lvUpd() { var m = LV.m, sc = $('hp-sc'), mn = $('hp-mn'); if (sc) sc.textContent = m.score[0] + ' - ' + m.score[1]; if (mn) mn.textContent = (m.finished ? 'Full time' : m.min + "'" + (m.add ? ' +' + m.add : '')); }
function lvTick() {
  if (!LV) return; var m = LV.m;
  if (m.finished) return lvEnd();
  if (m.paused === 'ht') { if (!LV.wait) { LV.wait = 1; setTimeout(function () { if (LV) { H.startSecondHalf(LV.m); LV.wait = 0; } }, 1000); } return; }
  H.stepMatch(m).forEach(lvLine); lvUpd(); if (m.finished) lvEnd();
}
function lvEnd() {
  if (!LV || LV.over) return; LV.over = true; clearInterval(LV.t); lvUpd();
  var lb = $('hp-lb'); if (lb) lb.innerHTML = '<button class="hp-b" data-hp="lvd">Continue</button>';
}
function lvSkip() {
  if (!LV) return; var m = LV.m, g = 0;
  while (!m.finished && g++ < 800) { if (m.paused === 'ht') H.startSecondHalf(m); H.stepMatch(m).forEach(function (e) { if (e.type === 'goal' || e.type === 'red' || e.type === 'pen' || e.type === 'ft' || e.type === 'ht') lvLine(e); }); }
  lvEnd();
}
function lvDone() { if (!LV) return; var m = LV.m, cb = LV.o.onEnd; lvClose(); if (cb) cb(m); }

/* ---------------------------------------- U20 team ---------------------------------------- */
function u(g) { var S = g.S; S.hp = S.hp || {}; S.hp.u20 = S.hp.u20 || { w: 0, d: 0, l: 0, gf: 0, ga: 0, log: [], pend: null }; return S.hp.u20; }
function kid(pos, o, nat) { return H.makePlayer({ pos: pos, o: o, a: ri(16, 19), nat: nat, cl: 0, ct: 3 }, null); }
function u20Cards(g, cid, base) {
  var S = g.S, c = S.clubs[cid], real = g.SQ[cid].filter(function (p) { return p.a <= 20 && !p.inj; }).sort(function (a, b) { return b.o - a.o; }).slice(0, 14);
  var nat = H.lgOf(c.lg).nat, cards = real.slice();
  ['GK', 'GK', 'CB', 'CB', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CM', 'CDM', 'LW', 'RW', 'ST', 'ST'].forEach(function (pos) { cards.push(kid(pos, Math.max(28, Math.round(base + ri(-2, 5))), nat)); });
  return { cards: cards, real: real };
}
function engTeam(name, col, cards, fmn) {
  var ap = H.autoPick(fmn, cards, { all: true }), by = {}, f = H.FORMATIONS[fmn]; cards.forEach(function (c) { by[c.id] = c; });
  var on = ap.slots.map(function (id, i) { var c = by[id]; return c ? { id: c.id, name: c.n, pos: f[i][0], ovr: Math.max(30, H.eff(c) - H.penalty(f[i][0], c.pos)), stats: H.statsOf(c), fit: 100 } : null; }).filter(Boolean);
  var bench = ap.bench.slice(0, 7).map(function (id) { var c = by[id]; return { id: c.id, name: c.n, pos: c.pos, ovr: H.eff(c), stats: H.statsOf(c), fit: 100 }; });
  return { name: name, color: col, on: on, bench: bench, mentality: 'balanced', style: 'possession', press: 'medium', formation: fmn, isUser: false };
}
function u20Match(g, pend) {
  var S = g.S, uc = H.userClub(g), oc = S.clubs[pend.opp];
  var mine = u20Cards(g, S.uid, 30 + uc.rep * 0.28 + uc.fac[2] * 2.2), theirs = u20Cards(g, pend.opp, 30 + oc.rep * 0.28 + oc.fac[2] * 1.5);
  var a = engTeam(uc.name + ' U20', uc.col, mine.cards, '4-3-3'), b = engTeam(oc.name + ' U20', oc.col, theirs.cards, '4-3-3');
  return { home: pend.home ? a : b, away: pend.home ? b : a, userSide: pend.home ? 0 : 1, mine: mine, oc: oc, uc: uc };
}
function u20Finish(g, pend, built, m) {
  var S = g.S, st = u(g), us = m.score[built.userSide], them = m.score[1 - built.userSide], res = us > them ? 'W' : us === them ? 'D' : 'L';
  st[res === 'W' ? 'w' : res === 'D' ? 'd' : 'l']++; st.gf += us; st.ga += them;
  st.log.unshift({ y: S.year, w: pend.w, opp: built.oc.name, h: pend.home ? 1 : 0, us: us, them: them, r: res }); if (st.log.length > 12) st.log.length = 12; st.pend = null;
  var team = H.teamOf(m, built.userSide), gain = [], gl = {};
  m.goals[built.userSide].forEach(function (x) { if (x.id) gl[x.id] = 1; });
  team.on.concat(team.used).forEach(function (mp) {
    var p = g.P[mp.id]; if (!p || p.cl !== S.uid) return;
    p.mo = Math.max(10, Math.min(100, p.mo + (res === 'W' ? 3 : res === 'L' ? -2 : 1)));
    if (p.o < p.p && Math.random() < 0.05 + (res === 'W' ? 0.04 : 0) + (gl[p.id] ? 0.04 : 0)) { p.o++; H.refresh(p); gain.push(p.n + ' (' + p.o + ')'); }
  });
  H.news(g, '🎓 U20: ' + built.uc.name + ' ' + (pend.home ? us + '-' + them : them + '-' + us) + ' ' + built.oc.name + (pend.home ? '' : ' (away)') + (gain.length ? '. Improved: ' + gain.join(', ') : ''), res === 'W' ? 'w' : res === 'D' ? 'd' : 'l');
  saveGame();
  return { res: res, us: us, them: them, gain: gain };
}
function u20Play(watch) {
  var g = G(); if (!g) return; var st = u(g), pend = st.pend; if (!pend) return toast('No U20 match waiting.');
  var built = u20Match(g, pend), fromHub = hubOpen;
  var done = function (m) { var r = u20Finish(g, pend, built, m); closeBox(); toast('U20 ' + (r.res === 'W' ? 'win' : r.res === 'D' ? 'draw' : 'defeat') + ' ' + r.us + '-' + r.them + (r.gain.length ? ' · ' + r.gain.length + ' improved' : '')); if (fromHub) { hubOpen = true; openBox(u20HTML()); } };
  closeBox();
  if (watch) live({ title: 'U20 · ' + H.lgOf(built.uc.lg).name, home: built.home, away: built.away, needWinner: false, onEnd: done });
  else { var m = H.createMatch(built.home, built.away, {}); H.playFully(m); done(m); }
}
function u20Prompt() {
  var g = G(); if (!g) return; var st = u(g); if (!st.pend) return;
  var c = cfg().u20; if (c === 'watch') return u20Play(true); if (c === 'skip') return u20Play(false);
  if (busyUI()) return setTimeout(u20Prompt, 2500);
  var oc = g.S.clubs[st.pend.opp];
  openBox('<h3>🎓 U20 match day</h3><p>Your U20s ' + (st.pend.home ? 'host' : 'visit') + ' <b>' + esc(oc.name) + '</b> U20.</p><div class="hp-two"><button class="hp-b" data-hp="u20w">👁 Watch</button><button class="hp-b g" data-hp="u20s">⏭ Pass</button></div><button class="hp-b g" data-hp="close">Decide later</button>');
}
function u20HTML() {
  var g = G(); if (!g) return '<h3>🎓 U20 team</h3><p class="hp-s">Start a career first.</p>';
  var st = u(g), S = g.S, ys = g.SQ[S.uid].filter(function (p) { return p.a <= 20; }).sort(function (a, b) { return b.o - a.o; });
  var h = '<h3>🎓 U20 team</h3><div class="hp-r"><span>Record</span><b>' + st.w + 'W ' + st.d + 'D ' + st.l + 'L · goals ' + st.gf + '-' + st.ga + '</b></div>';
  if (st.pend) h += '<div class="hp-card">Waiting: vs <b>' + esc(S.clubs[st.pend.opp].name) + '</b> U20 (' + (st.pend.home ? 'home' : 'away') + ')<div class="hp-two"><button class="hp-b" data-hp="u20w">👁 Watch</button><button class="hp-b g" data-hp="u20s">⏭ Pass</button></div></div>';
  else h += '<p class="hp-s">A U20 match is played every two weeks of the season. When one is ready you choose to watch it live or pass.</p>';
  h += '<h4>When a match is ready</h4><div class="hp-two">' + [['ask', 'Ask me'], ['watch', 'Always watch'], ['skip', 'Always pass']].map(function (x) { return '<button class="hp-b ' + (cfg().u20 === x[0] ? '' : 'g') + '" data-hp="u20c" data-k="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += '<h4>Results</h4>' + (st.log.length ? st.log.map(function (x) { return '<div class="hp-r"><span>' + H.yearName(x.y) + ' wk ' + x.w + ' · ' + (x.h ? 'vs ' : 'at ') + esc(x.opp) + '</span><b>' + x.us + '-' + x.them + ' ' + x.r + '</b></div>'; }).join('') : '<p class="hp-s">No U20 matches yet.</p>');
  h += '<h4>Your players aged 20 or under</h4>' + (ys.length ? ys.map(function (p) { return '<div class="hp-r"><span>' + esc(p.n) + ' · ' + p.pos + ' · ' + p.a + 'y</span><b>' + p.o + ' → ' + p.p + '</b></div>'; }).join('') : '<p class="hp-s">None right now. Kids from your academy appear at the end of each season. Until then the U20s are made up of academy prospects.</p>');
  return h + '<button class="hp-b g" data-hp="hub">Back</button>';
}
function afterWeekHook(g) {
  try {
    var S = g.S; if (S.stage !== 'week') return; var st = u(g);
    if (st.pend && S.week - st.pend.w >= 2) { var b = u20Match(g, st.pend), m = H.createMatch(b.home, b.away, {}); H.playFully(m); u20Finish(g, st.pend, b, m); }
    if (S.week % 2 === 0 && S.week < H.LAST_WEEK && !st.pend) {
      var uc = H.userClub(g), others = H.lgClubs(g, uc.lg).filter(function (c) { return c.id !== S.uid; });
      st.pend = { w: S.week, opp: others[ri(0, others.length - 1)].id, home: Math.random() < 0.5 };
      setTimeout(u20Prompt, 1400);
    }
  } catch (e) { if (window.console) console.error('HANS FC Plus U20', e); }
}
var oldWeek = H.afterWeek;
H.afterWeek = function (g) { var r; if (oldWeek) r = oldWeek.apply(this, arguments); afterWeekHook(g); return r; };

/* ---------------------------------------- video clips ---------------------------------------- */
var SLOTS = [['matchday', '🏟️ Matchday scene', 'Plays before your match when you tap START GAME on the match preparation screen.'], ['awards', '🏆 Awards ceremony', 'Plays on awards night (Ballon d\'Or and the other awards).'], ['worldcup', '🌍 World Cup scene', 'Plays before your World Cup match.']];
function idb() { return new Promise(function (res, rej) { if (!window.indexedDB) return rej(new Error('no storage')); var r = indexedDB.open('hfc_plus', 1); r.onupgradeneeded = function () { r.result.createObjectStore('clips'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
function clipPut(k, blob) { return idb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('clips', 'readwrite'); t.objectStore('clips').put(blob, k); t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); }; }); }); }
function clipGet(k) { return idb().then(function (db) { return new Promise(function (res, rej) { var r = db.transaction('clips').objectStore('clips').get(k); r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }); }
function clipDel(k) { return idb().then(function (db) { return new Promise(function (res) { var t = db.transaction('clips', 'readwrite'); t.objectStore('clips').delete(k); t.oncomplete = function () { res(); }; }); }).catch(function () { /* ignore */ }); }
function ytId(u) { var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/.exec(u); return m ? m[1] : null; }
function clipsHTML() {
  var c = clips(), q = cfg();
  var h = '<h3>🎬 Video clips</h3><p class="hp-s">Add your own videos, from your phone or from a link. The game cannot include TV footage itself, so you bring the clip and it plays at the right moment.</p>';
  SLOTS.forEach(function (s) {
    var m = c[s[0]];
    h += '<div class="hp-card"><b>' + s[1] + '</b><div class="hp-s">' + s[2] + '</div><div class="hp-s">' + (m ? '✅ ' + esc(m.name) + (m.size ? ' · ' + Math.round(m.size / 1048576 * 10) / 10 + ' MB' : '') : 'No clip yet') + '</div>' +
      '<div class="hp-two"><button class="hp-b g" data-hp="cimp" data-k="' + s[0] + '">📁 From phone</button><button class="hp-b g" data-hp="curl" data-k="' + s[0] + '">🔗 From link</button></div>' + (m ? '<div class="hp-two"><button class="hp-b" data-hp="cplay" data-k="' + s[0] + '">▶ Play</button><button class="hp-b g" data-hp="cdel" data-k="' + s[0] + '">Remove</button></div>' : '') + '</div>';
  });
  h += '<h4>Matchday scene</h4><div class="hp-two">' + [['ask', 'Ask me'], ['always', 'Always play'], ['never', 'Never']].map(function (x) { return '<button class="hp-b ' + (q.scene === x[0] ? '' : 'g') + '" data-hp="cfg" data-k="scene:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += '<h4>Awards ceremony</h4><div class="hp-two">' + [['ask', 'Ask me'], ['always', 'Always play'], ['never', 'Never']].map(function (x) { return '<button class="hp-b ' + (q.cer === x[0] ? '' : 'g') + '" data-hp="cfg" data-k="cer:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += '<h4>Watch speed</h4><div class="hp-two">' + [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']].map(function (x) { return '<button class="hp-b ' + (q.speed === x[0] ? '' : 'g') + '" data-hp="cfg" data-k="speed:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  return h + '<button class="hp-b g" data-hp="hub">Back</button>';
}
function pickFile(slot) {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'video/*'; inp.style.display = 'none'; document.body.appendChild(inp);
  inp.onchange = function () {
    var f = inp.files && inp.files[0]; if (inp.parentNode) inp.parentNode.removeChild(inp); if (!f) return;
    toast('Saving video…');
    clipPut(slot, f).then(function () { var c = clips(); c[slot] = { type: 'file', name: f.name, size: f.size }; ls(MK, JSON.stringify(c)); toast('Video saved'); openBox(clipsHTML()); }).catch(function () { toast('Could not save that video. It may be too big for your phone storage.'); });
  };
  inp.click();
}
function setUrl(slot) {
  var cur = clips()[slot]; openBox('<h3>🔗 Video link</h3><p class="hp-s">Paste a direct video link (ends in .mp4) or a YouTube link. YouTube needs internet and you tap Skip yourself when it ends.</p><input id="hp-url" class="hp-in" placeholder="https://..." value="' + esc(cur && cur.url ? cur.url : '') + '"><button class="hp-b" data-hp="curls" data-k="' + slot + '">Save link</button><button class="hp-b g" data-hp="clips">Cancel</button>');
}
function playClip(slot, then) {
  var m = clips()[slot]; if (!m) return then && then();
  var wrap = document.createElement('div'); wrap.className = 'hp-vid'; wrap.id = 'hp-vid';
  var finish = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); if (wrap.__u) { try { URL.revokeObjectURL(wrap.__u); } catch (e) { /* ignore */ } } if (then) then(); };
  wrap.innerHTML = '<button class="hp-skip" data-hp="vskip">⏭ Skip</button>'; wrap.__fin = finish;
  var mount = function (el) { wrap.appendChild(el); document.body.appendChild(wrap); };
  if (m.type === 'url') {
    var y = ytId(m.url);
    if (y) { var fr = document.createElement('iframe'); fr.src = 'https://www.youtube.com/embed/' + y + '?autoplay=1&playsinline=1&rel=0'; fr.setAttribute('allow', 'autoplay; fullscreen'); fr.setAttribute('allowfullscreen', ''); mount(fr); }
    else { var v = document.createElement('video'); v.src = m.url; v.controls = true; v.autoplay = true; v.setAttribute('playsinline', ''); v.onended = finish; v.onerror = function () { toast('This link would not play'); finish(); }; mount(v); }
  } else {
    clipGet(slot).then(function (blob) {
      if (!blob) { toast('Clip not found. Add it again.'); return finish(); }
      var v2 = document.createElement('video'); wrap.__u = URL.createObjectURL(blob); v2.src = wrap.__u; v2.controls = true; v2.autoplay = true; v2.setAttribute('playsinline', ''); v2.onended = finish; v2.onerror = function () { toast('This video would not play on your phone'); finish(); }; mount(v2);
    }).catch(function () { toast('Could not open the clip'); finish(); });
  }
}

/* ---------------------------------------- hooks into the game ---------------------------------------- */
var bypass = null;
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  /* matchday scene before the match starts */
  var go = t.closest('.fcx [data-q="start"]');
  if (go && go !== bypass) {
    var c = cfg(), has = clips().matchday;
    if (has && c.scene !== 'never') {
      e.stopPropagation(); e.preventDefault();
      var run = function () { playClip('matchday', function () { bypass = go; go.click(); bypass = null; }); };
      if (c.scene === 'always') run(); else openBox('<h3>🏟️ Matchday scene</h3><p>Watch the matchday video before kick-off?</p><div class="hp-two"><button class="hp-b" id="hp-sceney">▶ Watch</button><button class="hp-b g" id="hp-scenen">Skip</button></div>', function () { var y = $('hp-sceney'), n = $('hp-scenen'); if (y) y.onclick = function () { closeBox(); run(); }; if (n) n.onclick = function () { closeBox(); bypass = go; go.click(); bypass = null; }; });
      return;
    }
  }
  /* your World Cup match: watch it live or play it quickly */
  var wn = t.closest('[data-v4="wcnext"]');
  if (wn && wn !== bypass && window.__hfcV4 && window.__hfcV4.V) {
    e.stopPropagation(); e.preventDefault();
    var next = function (watch) { closeBox(); if (watch) wcLive(function () { /* done */ }); else { bypass = wn; wn.click(); bypass = null; } };
    var after = function (watch) { var d = function () { next(watch); }; if (clips().worldcup && cfg().scene !== 'never') { closeBox(); playClip('worldcup', d); } else d(); };
    openBox('<h3>🌍 Your World Cup match</h3><p>Watch it minute by minute, or play it straight away?</p><div class="hp-two"><button class="hp-b" id="hp-wcw">👁 Watch live</button><button class="hp-b g" id="hp-wcq">⏩ Play now</button></div>', function () { $('hp-wcw').onclick = function () { after(true); }; $('hp-wcq').onclick = function () { after(false); }; });
  }
}, true);
function wcTeam(wc, name, side) {
  var T = wc.teams[name], pos = { G: ['GK'], D: ['LB', 'CB', 'CB', 'RB'], M: ['CM', 'CDM', 'CM'], A: ['LW', 'ST', 'RW'] }, used = { G: 0, D: 0, M: 0, A: 0 }, on = [];
  T.xi.forEach(function (x) { var gp = x[1], i = used[gp]++, slot = (pos[gp] || ['CM'])[i] || (gp === 'D' ? 'CB' : gp === 'A' ? 'ST' : 'CM'); on.push({ id: null, name: x[0], pos: slot, ovr: x[2], stats: H.statsFor(slot, x[2]), fit: 100 }); });
  var ment = wc.coach === name ? (wc.ment === 'attack' ? 'attacking' : wc.ment === 'defend' ? 'defensive' : 'balanced') : 'balanced';
  return { name: name, color: '#' + ((Math.abs(name.split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0); }, 7)) % 0xffffff).toString(16) + '000000').slice(0, 6), on: on, bench: [], mentality: ment, style: 'possession', press: 'medium', formation: '4-3-3', isUser: false };
}
function wcLive(cb) {
  var A = window.__hfcV4, v = A.V(), wc = v.wc; if (!wc) return;
  var r = A.stepWC(true), f = r === 'user' ? (wc.ph === 'group' ? wc.fx.filter(function (x) { return x.ga < 0; })[0] : wc.ko[wc.ko.length - 1].ties.filter(function (x) { return x.ga < 0; })[0]) : null;
  if (!f) { saveGame(); return A.f.wcBox(); }
  var ko = wc.ph === 'ko';
  live({ title: '🌍 World Cup ' + wc.y + (ko ? ' · knockout' : ' · group stage'), home: wcTeam(wc, f.a), away: wcTeam(wc, f.b), needWinner: ko, onEnd: function (m) {
    var last = function (n) { var p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };
    f.ga = m.score[0]; f.gb = m.score[1]; f.sa = m.goals[0].map(function (x) { return last(x.name); }); f.sb = m.goals[1].map(function (x) { return last(x.name); });
    [[0, f.a], [1, f.b]].forEach(function (z) { m.goals[z[0]].forEach(function (x) { var k = x.name + '|' + z[1]; wc.gold[k] = (wc.gold[k] || 0) + 1; }); });
    if (ko) { f.et = (m.half === 3 || m.min > 90) ? 1 : 0; if (m.pens) { f.pen = m.pens.score.slice(); f.w = m.pens.winner === 0 ? f.a : f.b; } else f.w = f.ga > f.gb ? f.a : f.b; }
    wc.msg = '<b>Full time:</b> ' + esc(f.a) + ' <b>' + f.ga + ' - ' + f.gb + '</b> ' + esc(f.b) + (f.pen ? ' (pens ' + f.pen[0] + '-' + f.pen[1] + ')' : f.et ? ' (aet)' : '') + (f.sa.length + f.sb.length ? '<div class="v4s">' + esc(f.a) + ': ' + (f.sa.join(', ') || '-') + ' · ' + esc(f.b) + ': ' + (f.sb.join(', ') || '-') + '</div>' : '');
    saveGame(); A.f.wcBox(); if (cb) cb();
  } });
}
/* awards ceremony video: button inside the awards night pop-up */
new MutationObserver(function () {
  var b = document.querySelector('.v4box'); if (!b || b.getAttribute('data-hp') || b.textContent.indexOf('Awards night') < 0) return;
  b.setAttribute('data-hp', '1');
  try { bdIntegrate(b); } catch (er) { if (window.console) console.error('HANS FC Plus awards', er); }
  var c = cfg(), has = clips().awards;
  if (has && c.cer !== 'never') {
    var el = document.createElement('button'); el.className = 'hp-b'; el.setAttribute('data-hp', 'cer'); el.textContent = '▶ Watch the ceremony video'; b.insertBefore(el, b.firstChild);
    if (c.cer === 'always') setTimeout(function () { playClip('awards'); }, 400);
  } else if (!has) {
    var h2 = document.createElement('button'); h2.className = 'hp-b g'; h2.setAttribute('data-hp', 'clips'); h2.textContent = '🎬 Add a ceremony video'; b.appendChild(h2);
  }
}).observe(document.body, { childList: true });

/* ---------------------------------------- renewable sponsor deals ---------------------------------------- */
function hpS(g) { var S = g.S; S.hp = S.hp || {}; return S.hp; }
function dealOffers(g, d) {
  var S = g.S, uc = H.userClub(g), m = Math.max(0.9, Math.min(1.4, 0.92 + (uc.rep - 60) / 260 + (S.board ? (S.board.conf - 50) / 500 : 0)));
  return [1, 2, 3].map(function (y) { return { y: y, a: Math.round(d.a * m * (1 + (y - 1) * 0.04) * 10) / 10 }; });
}
function renewHTML() {
  var g = G(), A = window.__hfcV4; if (!g || !A) return '';
  var S = g.S, v = A.V(), p = hpS(g), h = '<div class="hp-card" id="hp-ren"><b>🔄 Renew your deals</b><div class="hp-s">A deal can be renewed in its last season. The sponsor stays and the money is set again for how your club is doing.</div>';
  if (!v.deals.length) h += '<div class="hp-s" style="margin-top:6px">You have no extra deals yet. Sign one below, then renew it later.</div>';
  v.deals.forEach(function (d) {
    var left = d.u - S.year;
    h += '<div class="hp-r"><span>' + esc(d.b) + ' · €' + d.a + 'M a year</span><b>until ' + H.yearName(d.u - 1) + '</b></div>';
    if (left <= 1) h += '<div class="hp-two">' + dealOffers(g, d).map(function (o) { return '<button class="hp-b" data-hp="renew" data-k="' + esc(d.s) + '|' + o.y + '">' + o.y + ' yr · €' + o.a + 'M</button>'; }).join('') + '</div>';
    else h += '<div class="hp-s">Can be renewed in its last season.</div>';
  });
  return h + '<button class="hp-b ' + (p.autoRen ? '' : 'g') + '" data-hp="autoren">' + (p.autoRen ? '✅ Auto-renew is ON (1 year, new money)' : 'Auto-renew when a deal ends: OFF') + '</button></div>';
}
function doRenew(k) {
  var g = G(), A = window.__hfcV4; if (!g || !A) return; var z = k.split('|'), d = A.V().deals.filter(function (q) { return q.s === z[0]; })[0]; if (!d) return;
  var o = dealOffers(g, d)[+z[1] - 1]; if (!o) return;
  d.u += +z[1]; d.a = o.a; H.news(g, '🤝 Renewed ' + d.b + ' for ' + z[1] + ' more season' + (+z[1] > 1 ? 's' : '') + ' at €' + o.a + 'M a year.', 'g'); saveGame(); toast('Deal renewed');
  var bg = document.querySelector('.v4bg'); if (bg && bg.parentNode) bg.parentNode.removeChild(bg); if (A.f && A.f.sponBox) A.f.sponBox();
}
function toggleAuto() { var g = G(), A = window.__hfcV4; if (!g) return; var p = hpS(g); p.autoRen = !p.autoRen; saveGame(); var bg = document.querySelector('.v4bg'); if (bg && bg.parentNode) bg.parentNode.removeChild(bg); if (A && A.f && A.f.sponBox) A.f.sponBox(); }
var oldSeasonHook = H.afterSeason;
H.afterSeason = function (g, rv) { var r; if (oldSeasonHook) r = oldSeasonHook.apply(this, arguments); try { if (g.S.sponsor) { var p = hpS(g); p.lastSpon = JSON.parse(JSON.stringify(g.S.sponsor)); p.lastPos = rv && rv.pos; } } catch (e) { /* ignore */ } return r; };
var oldStartHook = H.afterStart;
H.afterStart = function (g) {
  var r; if (oldStartHook) r = oldStartHook.apply(this, arguments);
  try {
    var S = g.S, p = hpS(g), A = window.__hfcV4;
    if (p.lastSpon && S.sponsorOffers && S.sponsorOffers.length) {
      var l = p.lastSpon, adj = p.lastPos && p.lastPos <= (l.need < 99 ? l.need : 8) ? 1.05 : 0.97;
      S.sponsorOffers.unshift({ name: l.name, mult: Math.round(l.mult * adj * 100) / 100, bonus: l.bonus || 0, need: l.need, label: '🔄 Renew', desc: 'Renew with ' + l.name + '. New terms for how last season went.' });
    }
    p.lastSpon = null;
    var v = A && A.V && A.V(); if (v && v.deals) v.deals.forEach(function (d) {
      if (p.autoRen && d.u <= S.year) { var o = dealOffers(g, d)[0]; d.u = S.year + 1; d.a = o.a; H.news(g, '🤝 ' + d.b + ' deal renewed automatically (€' + o.a + 'M).', 'g'); }
      else if (d.u === S.year + 1) H.news(g, '🤝 Last season of your ' + d.b + ' deal. Renew it in the Sponsors hub.', 'b');
    });
  } catch (e) { if (window.console) console.error('HANS FC Plus sponsors', e); }
  return r;
};

/* ---------------------------------------- coach pictures (from Wikipedia) ---------------------------------------- */
var cp = { cache: {}, run: false, queue: [], fails: 0, msg: '', ready: false, db: null };
function cdb() { if (!cp.db) cp.db = new Promise(function (res) { try { var r = indexedDB.open('hfc_plus_coaches', 1); r.onupgradeneeded = function () { r.result.createObjectStore('c'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); return cp.db; }
function cPut(k, v) { cdb().then(function (d) { if (d) try { d.transaction('c', 'readwrite').objectStore('c').put(v, k); } catch (e) { /* ignore */ } }); }
function cAll() { return cdb().then(function (d) { return new Promise(function (res) { if (!d) return res({}); var o = {}; try { var c = d.transaction('c').objectStore('c').openCursor(); c.onsuccess = function () { var x = c.result; if (x) { o[x.key] = x.value; x.continue(); } else res(o); }; c.onerror = function () { res(o); }; } catch (e) { res(o); } }); }); }
function cClear() { cdb().then(function (d) { if (d) try { d.transaction('c', 'readwrite').objectStore('c').clear(); } catch (e) { /* ignore */ } }); }
cAll().then(function (o) { cp.cache = o || {}; cp.ready = true; applyCoaches(); });
function mgrFromWikitext(t) {
  var m = /^\s*\|\s*(?:manager|head[ _]?coach|coach)\s*=\s*(.*)$/im.exec(t || ''); if (!m) return null;
  var re = /\[\[([^\]\|#]+)(?:\|[^\]]*)?\]\]/g, x; while ((x = re.exec(m[1]))) { if (!/^(File|Image|Category):/i.test(x[1])) return x[1].trim(); }
  return null;
}
function wjson(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }); }
function findCoach(club) {
  var base = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*';
  return wjson(base + '&action=query&generator=search&gsrsearch=' + encodeURIComponent(club + ' football club') + '&gsrlimit=3&prop=description').then(function (j) {
    var pg = ((j.query && j.query.pages) || []).slice().sort(function (a, b) { return a.index - b.index; }).filter(function (q) { return /football|soccer/i.test(q.description || ''); });
    if (!pg.length) return null;
    return wjson(base + '&action=parse&prop=wikitext&section=0&page=' + encodeURIComponent(pg[0].title)).then(function (w) { return mgrFromWikitext(w.parse && w.parse.wikitext); });
  }).then(function (title) {
    if (!title) return { n: '', u: '' };
    return wjson(base + '&action=query&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=240&titles=' + encodeURIComponent(title)).then(function (j) {
      var q = (j.query && j.query.pages || [])[0], src = q && q.thumbnail ? q.thumbnail.source : '', name = (q && q.title) || title;
      if (!src) return { n: name, u: '' };
      return new Promise(function (res) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { try { var c = document.createElement('canvas'), w = im.naturalWidth, h = im.naturalHeight, s = Math.min(w, h); c.width = c.height = 96; c.getContext('2d').drawImage(im, (w - s) / 2, 0, s, s, 0, 0, 96, 96); res({ n: name, u: c.toDataURL('image/jpeg', 0.8) }); } catch (e) { res({ n: name, u: '' }); } }; im.onerror = function () { res({ n: name, u: '' }); }; im.src = src; });
    });
  });
}
function cpBuild() {
  var g = G(); if (!g) return; var S = g.S, uc = H.userClub(g);
  cp.queue = S.clubs.filter(function (c) { return c.id !== S.uid && !(cp.cache[c.name] && (cp.cache[c.name].u || Date.now() - cp.cache[c.name].t < 14 * 864e5)); }).sort(function (a, b) { return ((b.lg === uc.lg) - (a.lg === uc.lg)) || (b.rep - a.rep); }).map(function (c) { return c.name; });
}
function cpCounts() { var g = G(), t = 0, have = 0, miss = 0; if (!g) return { t: 0, have: 0, miss: 0 }; g.S.clubs.forEach(function (c) { if (c.id === g.S.uid) return; t++; var r = cp.cache[c.name]; if (r && r.u) have++; else if (r) miss++; }); return { t: t, have: have, miss: miss }; }
function cpWork() {
  if (!cp.run) return; if (!cp.queue.length) { cp.run = false; cp.msg = 'All done'; applyCoaches(); cpPaint(); return; }
  var club = cp.queue.shift();
  findCoach(club).then(function (r) { r.t = Date.now(); cp.cache[club] = r; cPut(club, r); cp.fails = 0; applyCoaches(); cpPaint(); setTimeout(cpWork, 250); }, function () { cp.fails++; if (cp.fails >= 5) { cp.run = false; cp.msg = 'No internet connection. Try again later.'; cpPaint(); } else { cp.queue.push(club); setTimeout(cpWork, 1500); } });
}
function cpStart() { cpBuild(); cp.run = true; cp.fails = 0; cp.msg = ''; cpPaint(); cpWork(); cpWork(); }
function applyCoaches() {
  var g = G(); if (!g || !cp.ready) return; var S = g.S; S.v5 = S.v5 || { cp: {}, cn: {}, club: {} }; S.v5.cn = S.v5.cn || {};
  S.clubs.forEach(function (c) { var r = cp.cache[c.name]; if (!r || !r.n || c.id === S.uid) return; var k = c.id * 10, o = S.v5.cn[k]; if (!o || !o.n || o.hpn) S.v5.cn[k] = Object.assign({}, o || {}, { n: r.n, hpn: 1 }); });
}
function coachName(cid) { var g = G(), c = g && g.S.clubs[cid], r = c && cp.cache[c.name]; return r && r.n ? r.n : (c ? 'The ' + c.name + ' manager' : 'A manager'); }
var oldFace = H.face;
H.face = function (p, sz, col) {
  try { if (p && p.ck != null && p.rk === 'mgr') { var g = G(), c = g && g.S.clubs[Math.floor(p.ck / 10)], r = c && cp.cache[c.name]; if (r && r.u) return '<img src="' + r.u + '" style="width:100%;height:100%;object-fit:cover" alt="">'; } } catch (e) { /* ignore */ }
  return oldFace.apply(this, arguments);
};
function cpHTML() {
  var c = cpCounts(), pct = c.t ? Math.round(c.have * 100 / c.t) : 0;
  return '<div class="hp-card" id="hp-cp"><b>👔 Coach pictures</b><div class="hp-s">Finds the real manager of every club on Wikipedia, saves his picture and name on your phone, and shows them in the Coaches screen. Needs internet.</div><div id="hp-cpt" style="margin-top:6px">' + c.have + ' of ' + c.t + ' managers have a picture</div><div class="hp-sbar"><i id="hp-cpb" style="width:' + pct + '%"></i></div><div class="hp-s" id="hp-cpm">' + esc(cp.msg || (cp.run ? 'Downloading… ' + cp.queue.length + ' clubs left' : '')) + '</div>' +
    '<button class="hp-b" data-hp="' + (cp.run ? 'cppause' : 'cpgo') + '">' + (cp.run ? '⏸ Pause' : '▶ Download coach pictures') + '</button>' + (c.miss ? '<button class="hp-b g" data-hp="cpgo">🔁 Try the ' + c.miss + ' missing again</button>' : '') + '<button class="hp-b g" data-hp="cpclr">🗑 Remove downloaded coach pictures</button></div>';
}
function cpPaint() { var c = cpCounts(), t = $('hp-cpt'), b = $('hp-cpb'), m = $('hp-cpm'); if (t) t.textContent = c.have + ' of ' + c.t + ' managers have a picture'; if (b) b.style.width = (c.t ? Math.round(c.have * 100 / c.t) : 0) + '%'; if (m) m.textContent = cp.msg || (cp.run ? 'Downloading… ' + cp.queue.length + ' clubs left' : ''); }

/* ---------------------------------------- Ballon d'Or vote and awards night ---------------------------------------- */
var VOTE_PTS = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1], BDN = ["Ballon d'Or", "Ballon d'Or runner-up", "Ballon d'Or third"];
var gauss = function () { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.2; };
function bdScores(g) {
  var S = g.S, A = window.__hfcV4, v = A && A.V ? A.V() : null, tabs = {}, T = function (lg) { return tabs[lg] || (tabs[lg] = H.table(g, lg)); };
  var wcWin = v && v.wcHist && v.wcHist[0] && v.wcHist[0].y === S.year ? v.wcHist[0].champ : null, fin = {};
  try { var lastR = S.cc.hist[S.cc.hist.length - 1]; if (lastR && lastR.length === 1) { fin[lastR[0].a] = 1; fin[lastR[0].b] = 1; } } catch (e) { /* ignore */ }
  var out = [];
  S.players.forEach(function (p) {
    if (p.cl == null || !S.clubs[p.cl] || p.del) return; var ap = p.ap || 0; if (ap < 8) return;
    var c = S.clubs[p.cl], t = T(c.lg), grp = H.GROUP[p.pos], gl = p.g || 0, as = p.as || 0, r = p.rn >= 8 ? p.rs / p.rn : 6.2 + (p.o - 70) * 0.03;
    var s = (grp === 'A' ? 1.7 : grp === 'M' ? 2.2 : grp === 'D' ? 3.4 : 3.0) * gl + as * 1.1 + (r - 6.4) * 9 + (p.o - 72) * 0.9 + Math.min(ap, 40) * 0.05; if (grp === 'G') s -= 7;
    var team = 0; if (t[0] && t[0].id === c.id) team += 6; else if (t[1] && t[1].id === c.id) team += 2;
    if (S.cc && S.cc.winner === c.id) team += 9; else if (fin[c.id]) team += 4; if (S.cup[c.lg] && S.cup[c.lg].winner === c.id) team += 2;
    out.push({ p: p, base: s, team: team + (wcWin && p.nat === wcWin ? 7 : 0) });
  });
  return out;
}
function bdVote(g) {
  var pool = bdScores(g).sort(function (a, b) { return (b.base + b.team) - (a.base + a.team); }).slice(0, 40); if (pool.length < 5) return null;
  var nats = Object.keys(H.NAT), pts = {}, first = {}, story = {}; pool.forEach(function (x) { pts[x.p.id] = 0; first[x.p.id] = 0; story[x.p.id] = gauss() * 7; });  /* story = this year's media narrative, shared by all voters */
  for (var i = 0; i < 100; i++) {
    var nat = nats[ri(0, nats.length - 1)], wt = 0.6 + Math.random(), wb = 0.7 + Math.random() * 0.8;
    var sc = pool.map(function (x) { return { x: x, s: x.base * wb + x.team * wt + (x.p.nat === nat ? 5 : 0) + story[x.p.id] + gauss() * 9 }; }).sort(function (a, b) { return b.s - a.s; });
    for (var k = 0; k < 10 && k < sc.length; k++) { pts[sc[k].x.p.id] += VOTE_PTS[k]; if (k === 0) first[sc[k].x.p.id]++; }
  }
  var S = g.S, list = pool.map(function (x) { var p = x.p; return { id: p.id, n: p.n, club: S.clubs[p.cl].name, nat: p.nat, pos: p.pos, g: p.g || 0, as: p.as || 0, ap: p.ap || 0, o: p.o, pts: pts[p.id], first: first[p.id], me: p.cl === S.uid }; }).sort(function (a, b) { return (b.pts - a.pts) || (b.first - a.first); }).slice(0, 30);
  return { y: S.year, yn: H.yearName(S.year), list: list };
}
function bdIntegrate(b) {
  var g = G(), A = window.__hfcV4; if (!g || !A || !A.V) return; var S = g.S, rec = A.V().awards[0]; if (!rec || rec.hp) return;
  var sim = bdVote(g); if (!sim) return; var hs = hpS(g); hs.bd = hs.bd || [];
  var idx = []; rec.it.forEach(function (x, i) { if (BDN.indexOf(x.c) >= 0) idx.push(i); });
  idx.forEach(function (i) { var x = rec.it[i]; if (x.me) { var big = x.c === BDN[0]; S.mgr.rep = Math.max(0, S.mgr.rep - (big ? 3 : 1)); S.mgr.xp = Math.max(0, S.mgr.xp - (big ? 120 : 30)); var k = S.news.findIndex(function (n) { return n.t.indexOf('🏆 ' + x.c + ':') === 0; }); if (k >= 0) S.news.splice(k, 1); } });
  var top = sim.list.slice(0, 3);
  idx.forEach(function (i, j) { var t = top[j]; if (t) rec.it[i] = { c: BDN[j], n: t.n, club: t.club, me: t.me, x: t.pts + ' points · ' + t.g + ' goals · ' + t.as + ' assists' }; });
  top.forEach(function (t, j) { if (t.me) { var big = j === 0; S.mgr.rep = Math.min(100, S.mgr.rep + (big ? 3 : 1)); S.mgr.xp += big ? 120 : 30; H.news(g, '🏆 ' + BDN[j] + ': ' + t.n + ' (' + t.club + ')', 'g'); } });
  rec.hp = 1; hs.bd.unshift(sim); if (hs.bd.length > 8) hs.bd.length = 8; hs.awRec = rec; saveGame();
  var cards = b.querySelectorAll ? b.querySelectorAll('.v4c') : [];
  idx.forEach(function (i, j) { var el = cards[i], x = rec.it[i]; if (el) { el.className = 'v4c ' + (x.me ? 'me' : ''); el.innerHTML = '<div class="v4t">' + esc(x.c) + '</div><b>' + esc(x.n) + '</b> <span class="v4s">' + esc(x.club) + '</span><div class="v4s">' + esc(x.x) + '</div>'; } });
  var h3 = b.querySelector ? b.querySelector('h3') : null;
  if (h3) h3.insertAdjacentHTML('afterend', '<button class="hp-b" data-hp="awshow">🎬 Watch the awards night</button><button class="hp-b g" data-hp="bdshow">🏆 Ballon d\'Or vote (top 30)</button>');
}
var bdUI = null;
function bdHTML() {
  var u = bdUI, sim = u.sim, n = u.shown, h = '<h3>🏆 Ballon d\'Or ' + esc(sim.yn) + '</h3><div class="hp-s">100 journalists voted. Each picked a top 10 (15, 12, 10, 8, 6, 5, 4, 3, 2, 1 points).</div>';
  h += '<div class="hp-bd">' + sim.list.map(function (x, i) { var rank = i + 1, shown = rank >= 31 - n; if (!shown) return ''; return '<div class="hp-r' + (rank === 1 ? ' w' : '') + (x.me ? ' me' : '') + '"><span><b>' + rank + '.</b> ' + H.flagOf(x.nat) + ' ' + esc(x.n) + '<small class="hp-s"> ' + esc(x.club) + '</small></span><b>' + (x.pts || '·') + '</b></div>'; }).reverse().join('') + '</div>';
  if (n >= 30) { var w = sim.list[0]; h += '<div class="hp-card w">⭐ <b>' + esc(w.n) + '</b> wins the Ballon d\'Or!<div class="hp-s">' + esc(w.club) + ' · ' + w.g + ' goals · ' + w.as + ' assists · ' + w.ap + ' games · ' + w.first + ' first-place votes · ' + w.pts + ' points</div></div>' + (u.next ? '<button class="hp-b" data-hp="' + u.next + '">Continue</button>' : '<button class="hp-b g" data-hp="close">Close</button>'); }
  else { var step = n < 25 ? 5 : 1, nextRank = 30 - n; h += '<button class="hp-b" data-hp="bdnext">🥁 Reveal ' + (step > 1 ? (nextRank) + ' to ' + (nextRank - step + 1) : '#' + nextRank) + '</button><button class="hp-b g" data-hp="bdall">Skip to the winner</button>'; }
  return h;
}
function bdShow(sim, next) { bdUI = { sim: sim, shown: 0, next: next || null }; openBox(bdHTML()); }
function bdNext() { var u = bdUI; if (!u) return; u.shown = Math.min(30, u.shown + (u.shown < 25 ? 5 : 1)); openBox(bdHTML()); }
function latestBd() { var g = G(); return g && hpS(g).bd && hpS(g).bd[0]; }
function nominees(g, c, win) {
  var S = g.S, pls = S.players.filter(function (p) { return p.cl != null && S.clubs[p.cl] && !p.del && p.n !== win.n && (p.ap || 0) >= 8; }), pick;
  if (/Golden Boy|Kopa|under 2/i.test(c)) pick = pls.filter(function (p) { return p.a <= 21; }).sort(function (a, b) { return ((b.g || 0) * 2 + (b.as || 0) * 1.2 + b.o * 0.3) - ((a.g || 0) * 2 + (a.as || 0) * 1.2 + a.o * 0.3); });
  else if (/Glove|Yashin|goalkeeper/i.test(c)) pick = pls.filter(function (p) { return H.GROUP[p.pos] === 'G'; }).sort(function (a, b) { return b.o - a.o; });
  else if (/Boot|scorer|Gerd|Muller/i.test(c)) pick = pls.sort(function (a, b) { return (b.g || 0) - (a.g || 0); });
  else if (/Coach|Cruyff/i.test(c)) { var out = []; H.LEAGUES.forEach(function (l) { var t = H.table(g, l.id)[0]; if (t && S.clubs[t.id].name !== win.club) out.push({ n: coachName(t.id), club: S.clubs[t.id].name }); }); return out.slice(0, 2); }
  else return [];
  return pick.slice(0, 2).map(function (p) { return { n: p.n, club: S.clubs[p.cl].name }; });
}
var awUI = null;
function awHTML() {
  var u = awUI, it = u.cats[u.i]; if (!it) return '';
  var names = u.opts.slice(); var h = '<div class="hp-s">Award ' + (u.i + 1) + ' of ' + u.cats.length + '</div><h3>🏅 ' + esc(it.c) + '</h3>';
  h += '<div class="hp-s">The nominees are…</div>' + names.map(function (x) { var isW = u.rev && x.n === it.n; return '<div class="hp-r' + (isW ? ' w' : '') + (isW && it.me ? ' me' : '') + '"><span>' + (isW ? '⭐ ' : '') + '<b>' + esc(x.n) + '</b> <small class="hp-s">' + esc(x.club) + '</small></span></div>'; }).join('');
  if (!u.rev) return h + '<button class="hp-b" data-hp="awrev">🥁 And the winner is…</button><button class="hp-b g" data-hp="awskip">Skip the rest</button>';
  if (it.x) h += '<div class="hp-s">' + esc(it.x) + '</div>';
  return h + '<button class="hp-b" data-hp="awnext">' + (u.i + 1 < u.cats.length ? 'Next award' : 'Finish with the Ballon d\'Or') + '</button>';
}
function awStart(rec) {
  var g = G(); if (!g) return; rec = rec || hpS(g).awRec || (window.__hfcV4 && window.__hfcV4.V().awards[0]); var sim = latestBd();
  if (!rec) return toast('No awards night yet. It comes at the end of a season.');
  var cats = rec.it.filter(function (x) { return BDN.indexOf(x.c) < 0; });
  awUI = { rec: rec, cats: cats, i: 0, rev: false, opts: [], sim: sim };
  if (!cats.length) return sim ? bdShow(sim) : toast('Nothing to show yet.');
  awOpts(g); openBox(awHTML());
}
function awOpts(g) { var u = awUI, it = u.cats[u.i]; if (!it) return; var o = nominees(g, it.c, it).concat([{ n: it.n, club: it.club }]); u.opts = o.sort(function () { return Math.random() - 0.5; }); u.rev = false; }
function awNext() { var g = G(), u = awUI; if (!u) return; u.i++; if (u.i >= u.cats.length) { awUI = null; return u.sim ? bdShow(u.sim) : closeBox(); } awOpts(g); openBox(awHTML()); }
function bdHubHTML() {
  var g = G(); if (!g) return '<h3>🏆 Ballon d\'Or</h3><p class="hp-s">Start a career first.</p>'; var hs = hpS(g), last = hs.bd && hs.bd[0], h = '<h3>🏆 Ballon d\'Or</h3><p class="hp-s">At the end of every season 100 journalists vote for the best player in the world. Goals, assists, form, trophies and the World Cup all count, and each voter has his own taste.</p>';
  if (last) h += '<div class="hp-card"><b>' + esc(last.yn) + ' winner</b><div>' + H.flagOf(last.list[0].nat) + ' ' + esc(last.list[0].n) + ' · ' + esc(last.list[0].club) + '</div><div class="hp-s">' + last.list[0].pts + ' points</div></div><button class="hp-b" data-hp="bdlast">▶ Watch the last vote again</button><button class="hp-b g" data-hp="awlast">🏅 Watch the last awards night</button>';
  else h += '<p class="hp-s">No vote yet. The first one comes at the end of this season.</p>';
  h += '<button class="hp-b g" data-hp="bdrace">📈 Ballon d\'Or race (vote with this season so far)</button>';
  if (hs.bd && hs.bd.length > 1) h += '<h4>Past winners</h4>' + hs.bd.map(function (x) { return '<div class="hp-r"><span>' + esc(x.yn) + '</span><b>' + esc(x.list[0].n) + '</b></div>'; }).join('');
  return h + '<button class="hp-b g" data-hp="hub">Back</button>';
}

new MutationObserver(function () {
  var b = document.querySelector('.v4box');
  if (b && !b.getAttribute('data-hps') && b.textContent.indexOf('Sponsors hub') >= 0) { b.setAttribute('data-hps', '1'); var pp = b.querySelector('p.v4s'), html = renewHTML(); if (pp) pp.insertAdjacentHTML('afterend', html); else b.insertAdjacentHTML('beforeend', html); }
  var pb = document.querySelector('.v8box');
  if (pb && !pb.getAttribute('data-hpc') && pb.textContent.indexOf('Player pictures') >= 0) { pb.setAttribute('data-hpc', '1'); pb.insertAdjacentHTML('beforeend', cpHTML()); }
}).observe(document.body, { childList: true });

/* ---------------------------------------- pop-ups and menu ---------------------------------------- */
var boxEl = null, hubOpen = false;
function closeBox() { if (boxEl && boxEl.parentNode) boxEl.parentNode.removeChild(boxEl); boxEl = null; hubOpen = false; }
function openBox(html, after) {
  if (boxEl && boxEl.parentNode) boxEl.parentNode.removeChild(boxEl);
  boxEl = document.createElement('div'); boxEl.className = 'hp-bg'; boxEl.id = 'hp-box'; boxEl.innerHTML = '<div class="hp-box"><button class="hp-x" data-hp="close">✕</button>' + html + '</div>';
  document.body.appendChild(boxEl); if (after) after();
}
function hubHTML() {
  return '<h3>✨ HANS FC Plus</h3><div class="hp-grid"><button class="hp-t" data-hp="cal"><span>📅</span>Calendar</button><button class="hp-t" data-hp="u20"><span>🎓</span>U20 team</button><button class="hp-t" data-hp="clips"><span>🎬</span>Video clips</button><button class="hp-t" data-hp="bd"><span>🏆</span>Ballon d\'Or</button><button class="hp-t" data-hp="cph"><span>👔</span>Coach pictures</button><button class="hp-t" data-hp="spon"><span>🤝</span>Sponsors (renew)</button><button class="hp-t" data-hp="onl"><span>🌐</span>Online League</button></div>' +
    '<p class="hp-s">Watch live is offered for U20 matches and your World Cup matches. Tap START GAME and the World Cup play button as usual.</p>';
}
function openHub() { hubOpen = true; openBox(hubHTML()); hubOpen = true; }
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  var o = t.closest('[data-hpo]'); if (o) { var x = document.querySelector('.hmh [data-hm="x"]'); if (x && o.className.indexOf('hp-fab') < 0) { try { x.click(); } catch (er) { /* ignore */ } } setTimeout(openHub, 30); return; }
  var b = t.closest('[data-hp]'); if (!b) return;
  var a = b.getAttribute('data-hp'), k = b.getAttribute('data-k'); e.preventDefault();
  switch (a) {
    case 'close': closeBox(); break;
    case 'hub': openHub(); break;
    case 'cal': cal = null; hubOpen = true; openBox(calHTML()); break;
    case 'calp': cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } hubOpen = true; openBox(calHTML()); break;
    case 'caln': cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } hubOpen = true; openBox(calHTML()); break;
    case 'u20': hubOpen = true; openBox(u20HTML()); break;
    case 'u20w': u20Play(true); break;
    case 'u20s': u20Play(false); break;
    case 'u20c': setCfg('u20', k); hubOpen = true; openBox(u20HTML()); break;
    case 'clips': hubOpen = true; openBox(clipsHTML()); break;
    case 'cfg': var p = k.split(':'); setCfg(p[0], p[1]); openBox(clipsHTML()); break;
    case 'cimp': pickFile(k); break;
    case 'curl': setUrl(k); break;
    case 'curls': { var u1 = ($('hp-url') || {}).value || ''; u1 = u1.trim(); if (!/^https?:\/\//i.test(u1)) { toast('Paste a link that starts with http'); break; } var c1 = clips(); c1[k] = { type: 'url', name: ytId(u1) ? 'YouTube video' : u1.split('/').pop().slice(0, 40), url: u1 }; ls(MK, JSON.stringify(c1)); clipDel(k); toast('Link saved'); openBox(clipsHTML()); break; }
    case 'cplay': closeBox(); playClip(k, function () { openBox(clipsHTML()); }); break;
    case 'cdel': { var c2 = clips(); delete c2[k]; ls(MK, JSON.stringify(c2)); clipDel(k); openBox(clipsHTML()); break; }
    case 'cer': playClip('awards'); break;
    case 'vskip': { var w = $('hp-vid'); if (w && w.__fin) w.__fin(); break; }
    case 'lvs': { var q = cfg().speed, n = q === 'slow' ? 'normal' : q === 'normal' ? 'fast' : 'slow'; setCfg('speed', n); var sp = $('hp-sp'); if (sp) sp.textContent = n; if (LV && !LV.over) LV.start(); break; }
    case 'lvk': lvSkip(); break;
    case 'lvd': lvDone(); break;
    case 'renew': doRenew(k); break;
    case 'autoren': toggleAuto(); break;
    case 'cpgo': cpStart(); break;
    case 'cppause': cp.run = false; cp.msg = 'Paused'; cpPaint(); break;
    case 'cpclr': { cp.run = false; cp.queue = []; cp.cache = {}; cClear(); var g1 = G(); if (g1 && g1.S.v5 && g1.S.v5.cn) { Object.keys(g1.S.v5.cn).forEach(function (kk) { if (g1.S.v5.cn[kk].hpn) delete g1.S.v5.cn[kk]; }); saveGame(); } cpPaint(); toast('Coach pictures removed'); break; }
    case 'bdshow': case 'bdlast': { var sm = latestBd(); if (sm) bdShow(sm); else toast('No vote yet. It comes at the end of a season.'); break; }
    case 'bdnext': bdNext(); break;
    case 'bdall': if (bdUI) { bdUI.shown = 30; openBox(bdHTML()); } break;
    case 'bdrace': { var g2 = G(), sm2 = g2 && bdVote(g2); if (!sm2) { toast('Not enough games played yet'); break; } sm2.yn = sm2.yn + ' (race so far)'; bdShow(sm2); break; }
    case 'awshow': case 'awlast': awStart(); break;
    case 'awrev': if (awUI) { awUI.rev = true; openBox(awHTML()); } break;
    case 'awnext': awNext(); break;
    case 'awskip': { var ss = awUI && awUI.sim; awUI = null; if (ss) bdShow(ss); else closeBox(); break; }
    case 'bd': hubOpen = true; openBox(bdHubHTML()); break;
    case 'cph': hubOpen = true; openBox('<h3>👔 Coach pictures</h3>' + cpHTML() + '<button class="hp-b g" data-hp="hub">Back</button>'); break;
    case 'spon': { var A2 = window.__hfcV4; closeBox(); if (A2 && A2.f && A2.f.sponBox) A2.f.sponBox(); else toast('Open Menu, Sponsors'); break; }
    case 'onl': closeBox(); if (window.HFCOnline) window.HFCOnline.open(); else toast('Online League is not installed in this version'); break;
  }
});
function hookBack() {
  if (window.__back && window.__back.__hp) return;
  var prev = window.__back, f = function () {
    if (document.getElementById('hp-vid')) { var w = $('hp-vid'); if (w.__fin) w.__fin(); return true; }
    if (LV) { lvSkip(); lvDone(); return true; }
    if (boxEl) { closeBox(); return true; }
    return prev ? prev() : false;
  };
  f.__hp = 1; window.__back = f;
}
var css = '.hp-bg{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9500;background:#000c;display:flex;align-items:flex-end;justify-content:center}' +
  '.hp-box{position:relative;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:14px 14px 0 0;padding:14px 14px calc(16px + env(safe-area-inset-bottom));font:14px/1.4 system-ui,sans-serif}' +
  '.hp-box *{box-sizing:border-box}.hp-box h3{margin:0 28px 8px 0}.hp-box h4{margin:14px 0 4px;color:#ffc928}.hp-x{position:absolute;right:10px;top:8px;background:none;border:0;color:#fff;font-size:20px}' +
  '.hp-b{display:block;width:100%;background:#f58a1f;color:#04122b;border:0;border-radius:8px;padding:12px;font-weight:900;margin-top:8px;font-size:14px}.hp-b.g{background:#1d3a70;color:#fff}.hp-two{display:flex;gap:8px;align-items:center}.hp-two .hp-b{flex:1}' +
  '.hp-s{color:#b9c9e6;font-size:12px}.hp-r{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #1c3466;font-size:13px}.hp-card{background:#0a1a36;border:1px solid #2f4fa0;border-radius:10px;padding:10px;margin-top:8px}' +
  '.hp-in{width:100%;padding:10px;border-radius:8px;border:1px solid #2f4fa0;background:#0a1a36;color:#fff;font-size:15px;margin-top:8px}.hp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hp-t{background:#0a1a36;border:1px solid #2f4fa0;border-radius:12px;color:#fff;padding:16px 6px;font-weight:700}.hp-t span{display:block;font-size:28px}' +
  '.hp-mo{flex:2;text-align:center;font-weight:900;margin-top:8px}.hp-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:6px}.hp-dn{text-align:center;font-size:10px;color:#b9c9e6}.hp-d{min-height:46px;background:#0a1a36;border-radius:6px;padding:2px 3px;font-size:10px;overflow:hidden}.hp-d i{font-style:normal;display:block;color:#b9c9e6}.hp-d.dim{opacity:.25}.hp-d.win{background:#12315f}.hp-d.me{outline:2px solid #ffc928}.hp-d span{font-size:13px}.hp-d span.past{opacity:.4}' +
  '.hp-score{display:flex;justify-content:space-between;align-items:center;text-align:center;gap:6px;margin-top:4px}.hp-score span{flex:1;font-weight:700}.hp-score b{font-size:34px;color:#ffc928}.hp-mn{text-align:center;color:#b9c9e6;margin-bottom:6px}.hp-feed{height:36vh;overflow-y:auto;background:#0a1a36;border-radius:8px;padding:8px;font-size:13px}.hp-ev{padding:4px 0;border-bottom:1px solid #1c3466}.hp-ev.goal{color:#ffc928;font-weight:700}.hp-ev.red{color:#ff8a8a}.hp-ev.ht,.hp-ev.ft,.hp-ev.ko{color:#8fd0ff}' +
  '.hp-vid{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9700;background:#000;display:flex;flex-direction:column}.hp-vid video,.hp-vid iframe{flex:1;width:100%;min-height:0;border:0;background:#000}.hp-skip{position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top));z-index:2;background:#000a;color:#fff;border:1px solid #fff6;border-radius:20px;padding:8px 14px;font-weight:900}' +
  '.hp-toast{position:fixed;left:12px;right:12px;bottom:110px;z-index:9800;background:#f58a1f;color:#04122b;padding:12px;border-radius:10px;font-weight:900;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s}.hp-toast.on{opacity:1}' +
  '.hp-r.w{color:#ffc928;font-weight:700}.hp-r.me{background:#12315f}.hp-card.w{border-color:#ffc928;margin-top:8px}.hp-bd{max-height:38vh;overflow-y:auto;margin-top:6px}.hp-sbar{height:8px;background:#0a1a36;border-radius:6px;overflow:hidden;margin:6px 0}.hp-sbar i{display:block;height:100%;background:#f58a1f}' +
  '.hp-fab{position:fixed;left:10px;bottom:138px;z-index:9400;width:46px;height:46px;border-radius:50%;border:2px solid #f58a1f;background:#10244a;color:#fff;font-size:22px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var tt = document.createElement('div'); tt.id = 'hp-toast'; tt.className = 'hp-toast'; document.body.appendChild(tt);
var fab = document.createElement('button'); fab.className = 'hp-fab'; fab.setAttribute('data-hpo', '1'); fab.setAttribute('aria-label', 'HANS FC Plus'); fab.textContent = '✨'; document.body.appendChild(fab);
hookBack();
new MutationObserver(function () {
  var bd = $('hm-body'); if (!bd || bd.querySelector('[data-hpo]')) return; var q = $('hm-q'); if (q && q.value) return;
  var b = document.createElement('button'); b.className = 'hmres'; b.setAttribute('data-hpo', '1'); b.innerHTML = '<span style="font-size:22px">📅</span><div>Calendar, U20 and Videos<small>Real dates, U20 matches, clips</small></div>';
  bd.insertBefore(b, bd.firstChild);
}).observe(document.body, { childList: true, subtree: true });
window.HFCPlus = { open: openHub, _t: { bdVote: bdVote, bdIntegrate: bdIntegrate, bdHTML: bdHTML, bdShow: bdShow, bdNext: bdNext, awStart: awStart, awHTML: awHTML, awNext: awNext, nominees: nominees, bdHubHTML: bdHubHTML, dealOffers: dealOffers, renewHTML: renewHTML, doRenew: doRenew, mgrFromWikitext: mgrFromWikitext, applyCoaches: applyCoaches, coachName: coachName, cp: cp, cpHTML: cpHTML, hpS: hpS, calEvents: calEvents, calHTML: calHTML, u20HTML: u20HTML, clipsHTML: clipsHTML, u20Match: u20Match, u20Finish: u20Finish, u20Play: u20Play, afterWeekHook: afterWeekHook, wcLive: wcLive, wcTeam: wcTeam, live: live, lvSkip: lvSkip, lvDone: lvDone, engTeam: engTeam, matchDay: matchDay, hubHTML: hubHTML, u: u } };
} catch (err) { if (window.console) console.error('HANS FC Plus add-on failed', err); }
})();
