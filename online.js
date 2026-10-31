/* HANS FC Online: add-on for the app. Adds an "Online League" screen (menu entry + 🌐 button).
   One shared football world with other managers. Your matches are played by the server at each matchday
   using the lineup and tactics you saved, so you do not need to be online when they are played.
   Needs: the HANS FC Online server (hansfc-server.js) running somewhere, and its address.        */
(function () {
'use strict';
try {
var H = window.HFC; if (!H) return;
var DEFAULT_SERVER = '';          /* optional: put your server address here, e.g. 'https://hansfc-online.up.railway.app' */
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var ls = function (k, v) { try { if (v === undefined) return window.localStorage.getItem(k); if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } return null; };
var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
var fm = function (v) { return H.fm(v); };
var O = { open: false, server: '', token: '', me: null, st: null, byId: {}, L: null, dirty: false, tab: 'home', sub: { team: 'lineup', market: 'search', league: 'table' }, more: 'menu', skew: 0, busy: false, offline: false, err: '', sheet: null, clubs: null, pick: false, pickLg: 'epl', league: null, lgSel: null, mk: { q: '', pos: 'all', lg: 'all', maxA: '', minO: '', sort: 'ovr', fa: '0', page: 0 }, mkRes: null, mkt: null, chat: null, chatCh: 'global', chatLast: 0, hall: null, arm: '', info: null, clockT: null, chatT: null, polled: 0 };
var GN = { G: 'GK', D: 'DEF', M: 'MID', A: 'ATT' };
var lgName = function (id) { var l = H.lgOf(id); return l ? l.name : id; };
var rc = function (o) { return o >= 85 ? 'r1' : o >= 78 ? 'r2' : o >= 70 ? 'r3' : o >= 60 ? 'r4' : 'r5'; };

/* ------------------------------------------------ network ------------------------------------------------ */
function api(method, path, body) {
  var base = String(O.server || '').replace(/\/+$/, ''), tries = 0;
  function go() {
    tries++;
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 30000);
    var hd = {}; if (body) hd['Content-Type'] = 'application/json'; if (O.token) hd.Authorization = 'Bearer ' + O.token;
    return fetch(base + path, { method: method, headers: hd, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined }).then(function (r) {
      clearTimeout(to);
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || ('Error ' + r.status)); e.status = r.status; throw e; } return j; });
    }, function () {
      clearTimeout(to);
      if (tries < 3) return new Promise(function (res) { setTimeout(res, 1500 * tries); }).then(go);
      var e = new Error('No connection. Try again when your network is better.'); e.net = true; throw e;
    });
  }
  return go();
}
function toast(m, bad) {
  var t = $('ol-toast'); if (!t) return;
  t.textContent = m; t.className = 'ol-toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'ol-toast'; }, 3200);
}
function fail(e) { if (e && e.status === 401) { logout(true); return; } if (e && e.net) O.offline = true; toast(e && e.message ? e.message : 'Something went wrong', true); }

/* ------------------------------------------------ session ------------------------------------------------ */
function loadSession() {
  O.server = ls('hfc_ol_server') || DEFAULT_SERVER; O.token = ls('hfc_ol_token') || '';
  var c = ls('hfc_ol_cache'); if (c) { try { O.st = JSON.parse(c); prep(); } catch (e) { O.st = null; } }
}
function prep() {
  if (!O.st || !O.st.squad) return;
  O.byId = {}; O.st.squad.forEach(function (p) { p.cl = O.st.club.id; O.byId[p.id] = p; });
  if (!O.dirty || !O.L) { O.L = clone(O.st.st); O.dirty = false; }
}
function logout(silent) {
  ls('hfc_ol_token', null); ls('hfc_ol_cache', null); O.token = ''; O.st = null; O.me = null; O.pick = false; O.L = null; O.dirty = false;
  if (!silent) toast('Logged out'); render();
}
function flushQueue() {
  var q = ls('hfc_ol_q'); if (!q || !O.token) return Promise.resolve();
  var body; try { body = JSON.parse(q); } catch (e) { ls('hfc_ol_q', null); return Promise.resolve(); }
  return api('POST', '/api/lineup', body).then(function () { ls('hfc_ol_q', null); O.dirty = false; toast('Your saved lineup was sent'); }, function (e) { if (!e.net) ls('hfc_ol_q', null); });
}
function refresh(quiet) {
  if (!O.token || !O.server) { render(); return Promise.resolve(); }
  O.busy = true; if (!quiet) render();
  return flushQueue().then(function () { return api('GET', '/api/me'); }).then(function (j) {
    O.offline = false; if (j.world) O.skew = j.world.now - Date.now();
    O.me = j.me;
    if (j.me.cid == null) { O.st = null; O.pick = true; ls('hfc_ol_cache', null); return loadClubs(); }
    O.pick = false; O.st = j; ls('hfc_ol_cache', JSON.stringify(j)); prep();
  }).catch(fail).then(function () { O.busy = false; render(); });
}
function loadClubs() { return api('GET', '/api/clubs').then(function (j) { O.clubs = j; }); }

/* ------------------------------------------------ helpers for the screens ------------------------------------------------ */
function btn(label, act, k, cls, v) { return '<button class="ol-btn ' + (cls || '') + '" data-a="' + act + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + (v != null ? ' data-v="' + esc(v) + '"' : '') + '>' + label + '</button>'; }
function pill(label, act, k, on, v) { return '<button class="ol-pill' + (on ? ' on' : '') + '" data-a="' + act + '" data-k="' + esc(k) + '"' + (v != null ? ' data-v="' + esc(v) + '"' : '') + '>' + label + '</button>'; }
function badge(p) {
  var b = ''; if (p.inj > 0) b += '<i class="ol-b red">🩹 ' + p.inj + 'w</i>'; if (p.sus > 0) b += '<i class="ol-b red">🟥 ' + p.sus + '</i>';
  if (p.ft < 60) b += '<i class="ol-b amb">⚡ ' + p.ft + '</i>'; if (p.yth) b += '<i class="ol-b">U21</i>'; if (p.lst) b += '<i class="ol-b">📢</i>'; return b;
}
function prow(p, act, extra) {
  return '<button class="ol-prow" data-a="' + act + '" data-k="' + p.id + '"><span class="ol-pos">' + p.pos + '</span><span class="ol-ovr ' + rc(p.o) + '">' + p.o + '</span><span class="ol-pn"><b>' + H.flagOf(p.nat) + ' ' + esc(p.n) + '</b><small>' + p.a + 'y · pot ' + p.p + ' · ' + fm(p.v) + (p.ct != null ? ' · ' + (p.ct <= 0 ? 'no contract' : p.ct + 'y') : '') + '</small></span><span class="ol-pe">' + badge(p) + (extra || '') + '</span></button>';
}
function bar(v, max, cls) { return '<div class="ol-bar"><i class="' + (cls || '') + '" style="width:' + Math.max(0, Math.min(100, v / max * 100)) + '%"></i></div>'; }
function nowMs() { return Date.now() + O.skew; }
function cdText(ms) { if (ms <= 0) return 'now'; var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (d ? d + 'd ' : '') + (h || d ? h + 'h ' : '') + m + 'm ' + (d ? '' : x + 's'); }
function when(w) { return w.stage === 'pre' ? 'Pre-season' : 'Week ' + w.week + ' of ' + w.last; }
function startClock() {
  clearInterval(O.clockT);
  O.clockT = setInterval(function () {
    var el = $('ol-cd'); if (!el || !O.st) return;
    var left = O.st.world.tickAt - nowMs();
    el.textContent = left > 0 ? cdText(left) : 'playing…';
    if (left <= -8000 && !O.busy && Date.now() - O.polled > 15000) { O.polled = Date.now(); refresh(true); }
  }, 1000);
}

/* ------------------------------------------------ screens ------------------------------------------------ */
function authView() {
  return '<div class="ol-auth"><h2>🌐 HANS FC Online</h2><p>One shared football world with other managers. Pick a real club and play the same league, cups and transfer market. Your matches are played for you at each matchday with the lineup you saved, so you do not need to be online.</p>' +
    '<label>Server address</label><input id="ol-srv" value="' + esc(O.server) + '" placeholder="https://your-server.up.railway.app" autocapitalize="off" autocomplete="off">' +
    '<label>Manager name</label><input id="ol-nm" placeholder="3 to 18 characters" autocomplete="off"><label>Password</label><input id="ol-pw" type="password" placeholder="at least 4 characters">' +
    '<div class="ol-two">' + btn('Log in', 'login', null, 'pri') + btn('Create account', 'register') + '</div><p class="ol-dim">Use a password you do not use anywhere else.</p></div>';
}
function pickView() {
  if (!O.clubs) return '<div class="ol-pad">Loading clubs…</div>';
  var lg = O.pickLg, h = '<div class="ol-pad"><h3>Choose your club</h3><p class="ol-dim">Pick any club that has no manager. The computer runs every other club.</p><div class="ol-pills">';
  O.clubs.leagues.forEach(function (l) { h += pill(l.flag + ' ' + esc(l.name), 'picklg', l.id, l.id === lg); });
  h += '</div>';
  O.clubs.clubs.filter(function (c) { return c.lg === lg; }).sort(function (a, b) { return b.rep - a.rep; }).forEach(function (c) {
    h += '<button class="ol-prow" data-a="pickclub" data-k="' + c.id + '"' + (c.mgr ? ' disabled' : '') + '><span class="ol-dot" style="background:' + esc(c.col) + '"></span><span class="ol-pn"><b>' + esc(c.name) + '</b><small>' + c.tier + ' · strength ' + c.str + ' · capacity ' + c.cap + 'k</small></span><span class="ol-pe">' + (c.mgr ? '<i class="ol-b">👤 ' + esc(c.mgr) + '</i>' : '<i class="ol-b grn">Free</i>') + '</span></button>';
  });
  return h + '<div class="ol-gap"></div>' + btn('Log out', 'logout') + '</div>';
}
function homeView() {
  var s = O.st, c = s.club, w = s.world, h = '';
  h += '<div class="ol-banner" style="border-left:6px solid ' + esc(c.col) + '"><div><b>' + esc(c.name) + '</b><small>' + esc(lgName(c.lg)) + ' · ' + c.tier + ' · strength ' + c.str + '</small></div><div class="ol-cash">' + fm(s.fin.cash) + '</div></div>';
  h += '<div class="ol-card"><div class="ol-h">' + H.yearName(w.year) + ' · ' + when(w) + '</div><div>Next matchday in <b id="ol-cd">' + cdText(w.tickAt - nowMs()) + '</b></div><small class="ol-dim">' + (w.window ? '🟢 Transfer window open' : '🔴 Window closed: free agents only') + '</small>' +
    (w.stage === 'pre' ? '<p class="ol-note">Pre-season: renew contracts, sign players and set your lineup. The season starts at the next matchday.</p>' : '') + '</div>';
  var warn = [], L = O.L || s.st, starters = L.slots.map(function (id) { return id != null ? O.byId[id] : null; });
  starters.forEach(function (p) { if (p && p.inj > 0) warn.push(esc(p.n) + ' is injured'); else if (p && p.sus > 0) warn.push(esc(p.n) + ' is suspended'); else if (p && p.ft < 60) warn.push(esc(p.n) + ' is tired (' + p.ft + ')'); });
  var gone = s.squad.filter(function (p) { return p.ct <= 0; }).length; if (gone) warn.push(gone + ' player' + (gone > 1 ? 's have' : ' has') + ' no contract. Renew them in More, Contracts.');
  if (s.offers.length) warn.push(s.offers.length + ' transfer offer' + (s.offers.length > 1 ? 's' : '') + ' waiting in Market, Offers.');
  if (O.dirty) warn.push('You have unsaved lineup changes.');
  if (warn.length) h += '<div class="ol-card warn">' + warn.map(function (x) { return '<div>⚠️ ' + x + '</div>'; }).join('') + '</div>';
  h += '<div class="ol-card"><div class="ol-h">This matchday</div>';
  if (!s.fixtures.length) h += '<div class="ol-dim">' + (w.stage === 'pre' ? 'No matches yet.' : 'No match for your club this week.') + '</div>';
  s.fixtures.forEach(function (f) { var home = f.h === c.id; h += '<div class="ol-fx"><b>' + esc(f.name) + '</b><div>' + (home ? 'Home vs ' + esc(f.an) : 'Away at ' + esc(f.hn)) + '</div><small class="ol-dim">Strength ' + (home ? f.hs : f.as) + ' vs ' + (home ? f.as : f.hs) + '</small></div>'; });
  h += '<div class="ol-two">' + btn('📋 Lineup', 'tab', 'team', 'pri') + btn('🔄 Refresh', 'refresh') + '</div></div>';
  var r = s.reports[0];
  if (r) h += '<button class="ol-card ol-res" data-a="report" data-k="0"><div class="ol-h">Last match · ' + esc(r.comp) + '</div><div class="ol-score">' + esc(r.home) + ' <b>' + r.score[0] + ' - ' + r.score[1] + '</b> ' + esc(r.away) + '</div><small class="ol-dim">Tap for the match report</small></button>';
  h += '<div class="ol-card"><div class="ol-h">Board</div><div>🎯 ' + esc(s.objective ? s.objective.text : '') + '</div>' + (s.objective && s.objective.cupText ? '<div>🏆 ' + esc(s.objective.cupText) + '</div>' : '') + (s.objective && s.objective.ccText ? '<div>⭐ ' + esc(s.objective.ccText) + '</div>' : '') + '<div class="ol-dim">Confidence ' + s.board + '%</div>' + bar(s.board, 100, s.board < 30 ? 'red' : '') + '</div>';
  if (s.news.length) h += '<div class="ol-card"><div class="ol-h">Your news</div>' + s.news.slice(0, 6).map(function (n) { return '<div class="ol-news">' + esc(n.t) + '</div>'; }).join('') + '</div>';
  return h;
}
/* ---- lineup ---- */
function curCards() { return O.L.slots.map(function (id) { return id != null ? O.byId[id] || null : null; }); }
function teamView() {
  var s = O.st, L = O.L, h = '<div class="ol-pills">' + pill('Lineup', 'sub', 'team:lineup', O.sub.team === 'lineup') + pill('Squad (' + s.squad.length + ')', 'sub', 'team:squad', O.sub.team === 'squad') + '</div>';
  if (O.sub.team === 'squad') {
    ['G', 'D', 'M', 'A'].forEach(function (g) {
      var ps = s.squad.filter(function (p) { return H.GROUP[p.pos] === g; }).sort(function (a, b) { return b.o - a.o; });
      h += '<div class="ol-sec">' + GN[g] + ' (' + ps.length + ')</div>' + ps.map(function (p) { return prow(p, 'player'); }).join('');
    });
    return h;
  }
  var ev = H.evaluate(L.formation, curCards()), f = H.FORMATIONS[L.formation];
  h += '<div class="ol-card"><div class="ol-row"><label>Formation</label><select data-ch="fm">' + Object.keys(H.FORMATIONS).map(function (k) { return '<option' + (k === L.formation ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' +
    '<div class="ol-row"><span>Team rating <b>' + ev.vector.rating + '</b></span><span>Chemistry <b>' + ev.chemistry + '%</b></span><span>ATT ' + Math.round(ev.vector.att) + ' · MID ' + Math.round(ev.vector.mid) + ' · DEF ' + Math.round(ev.vector.def) + '</span></div></div>';
  h += '<div class="ol-pitch"><div class="ol-pin">';
  f.forEach(function (sl, i) {
    var p = O.byId[L.slots[i]], bad = p && (p.inj > 0 || p.sus > 0);
    h += '<button class="ol-slot" data-a="slot" data-k="' + i + '" style="left:' + sl[1] + '%;top:' + sl[2] + '%"><span class="ol-chip ' + (p ? rc(p.o) : 'rx') + (bad ? ' bad' : '') + '">' + (p ? p.o : '+') + '</span><small>' + (p ? esc(p.n.split(' ').slice(-1)[0]) : sl[0]) + '</small><em>' + sl[0] + '</em></button>';
  });
  h += '</div></div><div class="ol-sec">Bench</div><div class="ol-bench">';
  for (var b = 0; b < 9; b++) { var q = O.byId[L.bench[b]]; h += '<button class="ol-bchip" data-a="bench" data-k="' + b + '">' + (q ? '<span class="ol-chip sm ' + rc(q.o) + '">' + q.o + '</span><small>' + esc(q.n.split(' ').slice(-1)[0]) + '</small>' : '<span class="ol-chip sm rx">+</span><small>empty</small>') + '</button>'; }
  h += '</div><div class="ol-card"><div class="ol-h">Tactics</div>' + tacRow('Mentality', 'mentality', H.MENTALITY) + tacRow('Style', 'style', H.STYLE) + tacRow('Pressing', 'press', H.PRESS) +
    '<div class="ol-tr"><label>Training</label>' + [1, 2, 3].map(function (n) { return pill(['Light', 'Normal', 'Hard'][n - 1], 'tac', 'train', L.train === n, n); }).join('') + '</div></div>';
  h += '<div class="ol-two">' + btn('✨ Auto-pick', 'auto') + btn(O.dirty ? '💾 Save lineup' : '✔ Saved', 'savel', null, O.dirty ? 'pri' : '') + '</div><p class="ol-dim">Your saved lineup is used when the server plays your match. Injured or suspended players are swapped automatically.</p>';
  return h;
}
function tacRow(label, key, opts) { return '<div class="ol-tr"><label>' + label + '</label>' + opts.map(function (o) { return pill(o, 'tac', key, O.L[key] === o, o); }).join('') + '</div>'; }
/* ---- league ---- */
function leagueView() {
  var h = '', lg = O.lgSel || O.st.club.lg;
  h += '<div class="ol-pills">' + H.LEAGUES.map(function (l) { return pill(l.flag + ' ' + esc(l.name), 'lg', l.id, l.id === lg); }).join('') + '</div>';
  h += '<div class="ol-pills">' + [['table', 'Table'], ['fix', 'Fixtures'], ['cup', 'Cup'], ['cc', 'Champions Cup'], ['top', 'Scorers']].map(function (x) { return pill(x[1], 'sub', 'league:' + x[0], O.sub.league === x[0]); }).join('') + '</div>';
  var d = O.league; if (!d || d.lg !== lg) { if (!O.league || O.league.lg !== lg) loadLeague(lg); return h + '<div class="ol-pad">Loading…</div>'; }
  var sub = O.sub.league;
  if (sub === 'table') {
    h += '<div class="ol-table"><div class="ol-tr0"><span>#</span><span>Club</span><span>P</span><span>GD</span><span>Pts</span></div>' + d.table.map(function (r) { return '<div class="ol-tr0' + (r.me ? ' me' : '') + (r.pos <= 4 ? ' top' : '') + (r.pos > d.table.length - 3 ? ' bot' : '') + '"><span>' + r.pos + '</span><span>' + esc(r.name) + (r.mgr ? ' <i class="ol-b">👤 ' + esc(r.mgr) + '</i>' : '') + '</span><span>' + r.p + '</span><span>' + (r.gf - r.ga) + '</span><span><b>' + r.pts + '</b></span></div>'; }).join('') + '</div>';
  } else if (sub === 'fix') {
    var fx = function (t, arr) { return '<div class="ol-sec">' + t + '</div>' + (arr.length ? arr.map(function (f) { return '<div class="ol-fxr"><span>' + esc(f.hn) + (f.hm ? ' 👤' : '') + '</span><b>' + (f.hg == null ? 'v' : f.hg + ' - ' + f.ag) + '</b><span>' + esc(f.an) + (f.am ? ' 👤' : '') + '</span></div>'; }).join('') : '<div class="ol-dim">None.</div>'); };
    h += fx('Last matchday', d.last) + fx('Next matchday', d.next);
  } else if (sub === 'cup') {
    h += '<div class="ol-card"><div class="ol-h">' + esc(d.cup.name) + '</div><div>' + (d.cup.winner ? '🏆 Winner: ' + esc(d.cup.winner) : 'Round ' + (d.cup.round + 1) + ' · ' + d.cup.alive + ' clubs left') + '</div></div>' + d.cup.ties.map(function (t) { return '<div class="ol-fxr"><span>' + esc(t.hn) + (t.hm ? ' 👤' : '') + '</span><b>' + (t.g ? t.g[0] + ' - ' + t.g[1] : 'v') + '</b><span>' + esc(t.an) + (t.am ? ' 👤' : '') + '</span></div>'; }).join('');
  } else if (sub === 'cc') {
    h += '<div class="ol-card"><div class="ol-h">Champions Cup</div><div>' + (d.cc.winner ? '🏆 Winner: ' + esc(d.cc.winner) : d.cc.over ? 'Finished' : esc(d.cc.name)) + '</div></div>' + d.cc.ties.map(function (t) { var g = t.g ? t.g.map(function (x) { return x ? x[0] + '-' + x[1] : '?'; }).join(' | ') : ''; return '<div class="ol-fxr"><span>' + esc(t.an) + (t.am ? ' 👤' : '') + '</span><b>' + (g || 'v') + '</b><span>' + esc(t.bn) + (t.bm ? ' 👤' : '') + '</span></div>'; }).join('') +
      '<div class="ol-sec">Qualified clubs</div>' + d.cc.teams.map(function (t) { return '<div class="ol-news' + (t.alive ? '' : ' ol-dim') + '">' + esc(t.name) + (t.mgr ? ' 👤 ' + esc(t.mgr) : '') + (t.alive ? '' : ' (out)') + '</div>'; }).join('');
  } else {
    h += d.scorers.length ? d.scorers.map(function (p, i) { return '<div class="ol-fxr"><span>' + (i + 1) + '. ' + esc(p.n) + '</span><b>' + p.g + ' ⚽ ' + p.as + ' 🅰️</b><span>' + esc(p.club) + '</span></div>'; }).join('') : '<div class="ol-dim">No goals yet.</div>';
  }
  return h;
}
function loadLeague(lg) {
  if (O.loadingLg === lg) return; O.loadingLg = lg;
  api('GET', '/api/league?lg=' + encodeURIComponent(lg)).then(function (j) { O.league = j; }).catch(fail).then(function () { O.loadingLg = null; if (O.open && O.tab === 'league') renderBody(); });
}
/* ---- market ---- */
function marketView() {
  var s = O.st, sub = O.sub.market, h = '<div class="ol-pills">' + [['search', 'Search'], ['free', 'Free agents'], ['hm', 'Managers market'], ['offers', 'Offers' + (s.offers.length ? ' (' + s.offers.length + ')' : '')]].map(function (x) { return pill(x[1], 'sub', 'market:' + x[0], sub === x[0]); }).join('') + '</div>';
  h += '<div class="ol-dim ol-pad0">' + (s.world.window ? '🟢 Transfer window open' : '🔴 Window closed: only free agents') + ' · Cash ' + fm(s.fin.cash) + '</div>';
  if (sub === 'search' || sub === 'free') {
    var m = O.mk; if (sub === 'free') m.fa = '1'; else if (m.fa === '1') m.fa = '0';
    h += '<div class="ol-card"><input id="mk-q" data-ch="mkq" value="' + esc(m.q) + '" placeholder="Name or club" autocomplete="off"><div class="ol-row">' +
      sel('mk-pos', 'mkpos', [['all', 'All positions'], ['G', 'Goalkeepers'], ['D', 'Defenders'], ['M', 'Midfielders'], ['A', 'Attackers']], m.pos) +
      (sub === 'search' ? sel('mk-lg', 'mklg', [['all', 'All leagues']].concat(H.LEAGUES.map(function (l) { return [l.id, l.name]; })), m.lg) : '') + '</div><div class="ol-row">' +
      '<input id="mk-age" data-ch="mkage" type="number" inputmode="numeric" placeholder="Max age" value="' + esc(m.maxA) + '"><input id="mk-ovr" data-ch="mkovr" type="number" inputmode="numeric" placeholder="Min rating" value="' + esc(m.minO) + '">' +
      sel('mk-sort', 'mksort', [['ovr', 'Best rating'], ['pot', 'Best potential'], ['val', 'Highest value']], m.sort) + '</div>' + btn('🔍 Search', 'mksearch', null, 'pri') + '</div><div id="ol-results">' + resultsHTML() + '</div>';
    if (!O.mkRes) setTimeout(function () { doSearch(0); }, 0);
  } else if (sub === 'hm') {
    h += '<div id="ol-hm">' + (O.mkt ? mktHTML() : 'Loading…') + '</div>'; if (!O.mkt) loadMkt();
  } else {
    h += s.offers.length ? s.offers.map(function (o) { return '<div class="ol-card"><b>' + esc(o.fromName) + '</b> offer <b>' + fm(o.fee) + '</b> for <b>' + esc(o.n) + '</b><div class="ol-two">' + btn('Accept', 'offeryes', o.pid, 'pri') + btn('Reject', 'offerno', o.pid) + '</div></div>'; }).join('') : '<div class="ol-dim ol-pad">No offers right now. Putting a player on the transfer list brings more offers.</div>';
  }
  return h;
}
function sel(id, ch, opts, val) { return '<select id="' + id + '" data-ch="' + ch + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
function resultsHTML() {
  var r = O.mkRes; if (!r) return '<div class="ol-dim ol-pad">Searching…</div>';
  var h = '<div class="ol-dim ol-pad0">' + r.total + ' players</div>' + r.list.map(function (p) { return prow(p, 'xplayer', '<i class="ol-b">' + (p.cn ? esc(p.cn) : 'Free') + '</i>' + (p.mgr ? '<i class="ol-b">👤</i>' : '')); }).join('');
  if (r.total > (r.page + 1) * r.per) h += btn('More…', 'mkmore');
  if (r.page > 0) h += btn('Back', 'mkprev');
  return h;
}
function doSearch(page) {
  var m = O.mk; m.page = page || 0;
  var q = '?page=' + m.page + '&sort=' + m.sort + (m.q ? '&q=' + encodeURIComponent(m.q) : '') + (m.pos !== 'all' ? '&pos=' + m.pos : '') + (m.lg !== 'all' && O.sub.market === 'search' ? '&lg=' + m.lg : '') + (m.maxA ? '&maxA=' + m.maxA : '') + (m.minO ? '&minO=' + m.minO : '') + (O.sub.market === 'free' ? '&fa=1' : '');
  O.mkRes = null; var el = $('ol-results'); if (el) el.innerHTML = resultsHTML();
  api('GET', '/api/players' + q).then(function (j) { O.mkRes = j; }).catch(fail).then(function () { var e2 = $('ol-results'); if (e2) e2.innerHTML = resultsHTML(); });
}
function loadMkt() { api('GET', '/api/market').then(function (j) { O.mkt = j; }).catch(fail).then(function () { var e = $('ol-hm'); if (e && O.mkt) e.innerHTML = mktHTML(); }); }
function mktHTML() {
  return O.mkt.list.length ? O.mkt.list.map(function (p) { return prow(p, 'mplayer', '<i class="ol-b grn">' + fm(p.price) + '</i><i class="ol-b">' + esc(p.seller) + '</i>'); }).join('') : '<div class="ol-dim ol-pad">No manager has listed a player right now. List your own from the squad screen.</div>';
}
/* ---- more ---- */
function moreView() {
  var s = O.st, m = O.more, back = m === 'menu' ? '' : '<div class="ol-pills">' + pill('← Back', 'more', 'menu') + '</div>';
  if (m === 'menu') {
    var items = [['fin', '💰', 'Club and money'], ['fac', '🏟️', 'Facilities'], ['con', '📝', 'Contracts'], ['spo', '🤝', 'Sponsors'], ['rep', '📰', 'Match reports'], ['news', '📣', 'League news'], ['chat', '💬', 'Chat'], ['hall', '👔', 'Managers'], ['hist', '📜', 'History and trophies'], ['set', '⚙️', 'Settings']];
    return '<div class="ol-grid">' + items.map(function (x) { return '<button class="ol-tile" data-a="more" data-k="' + x[0] + '"><span>' + x[1] + '</span>' + x[2] + '</button>'; }).join('') + '</div>';
  }
  var h = back;
  if (m === 'fin') {
    var f = s.fin; h += '<div class="ol-card"><div class="ol-h">Cash ' + fm(f.cash) + '</div><div>Wages per week ' + fm(f.wages) + '</div><div>Upkeep per week ' + fm(f.upkeep) + '</div><div>TV ' + fm(f.income.tv) + ' · Sponsor ' + fm(f.income.spons) + ' · Commercial ' + fm(f.income.comm) + ' per week</div></div>' +
      '<div class="ol-sec">Last weeks</div>' + f.fin.map(function (x) { return '<div class="ol-fxr"><span>Week ' + x.w + '</span><b>' + fm(x.inc - x.exp) + '</b><span>in ' + fm(x.inc) + '</span></div>'; }).join('') + (s.sponsor ? '<div class="ol-card">Shirt sponsor: <b>' + esc(s.sponsor.name) + '</b> (' + esc(s.sponsor.label) + ')</div>' : '');
  } else if (m === 'fac') {
    h += s.facilities.map(function (x) { return '<div class="ol-card"><div class="ol-h">' + x.icon + ' ' + esc(x.name) + ' · level ' + x.level + '</div><small class="ol-dim">' + esc(x.desc) + '</small>' + (x.busy ? '<div>🔨 Building: ' + x.busy + ' weeks left</div>' : '<div class="ol-row"><span>' + (x.level >= 10 ? 'Maximum level' : fm(x.cost) + ' · ' + x.weeks + ' weeks') + '</span>' + (x.level >= 10 ? '' : btn('Upgrade', 'build', x.i)) + '</div>') + '</div>'; }).join('');
  } else if (m === 'con') {
    var ps = s.squad.filter(function (p) { return p.ct <= 1; }).sort(function (a, b) { return a.ct - b.ct; });
    h += ps.length ? ps.map(function (p) { var r = s.renew.filter(function (x) { return x.id === p.id; })[0]; return '<div class="ol-card"><b>' + esc(p.n) + '</b> · ' + p.pos + ' ' + p.o + ' · ' + (p.ct <= 0 ? 'no contract' : p.ct + ' year left') + '<div class="ol-row"><span>' + (r && r.refuse ? esc(r.refuse) : 'Asks ' + fm(r ? r.wage : p.w) + ' a week') + '</span>' + (r && !r.refuse ? btn('Renew 3y', 'renew', p.id, '', r.wage) : '') + '</div></div>'; }).join('') : '<div class="ol-dim ol-pad">No contracts are running out.</div>';
  } else if (m === 'spo') {
    h += s.sponsor ? '<div class="ol-card">Current deal: <b>' + esc(s.sponsor.name) + '</b> (' + esc(s.sponsor.label) + ')</div>' : '';
    h += s.sponsorOffers.length ? s.sponsorOffers.map(function (o, i) { return '<div class="ol-card"><div class="ol-h">' + esc(o.name) + ' · ' + esc(o.label) + '</div><div>' + esc(o.desc) + '</div><div class="ol-row"><span>Income x' + o.mult + (o.bonus ? ' · bonus ' + fm(o.bonus) : '') + '</span>' + btn('Choose', 'spon', i) + '</div></div>'; }).join('') : '<div class="ol-dim ol-pad">No sponsor offers right now. New ones come every season.</div>';
  } else if (m === 'rep') {
    h += s.reports.length ? s.reports.map(function (r) { return '<button class="ol-card ol-res" data-a="report" data-k="' + r.i + '"><small class="ol-dim">' + esc(r.comp) + '</small><div class="ol-score">' + esc(r.home) + ' <b>' + r.score[0] + ' - ' + r.score[1] + '</b> ' + esc(r.away) + '</div></button>'; }).join('') : '<div class="ol-dim ol-pad">No matches played yet.</div>';
  } else if (m === 'news') {
    h += '<div id="ol-feed">' + (O.info ? feedHTML() : 'Loading…') + '</div>'; if (!O.info) loadInfo();
  } else if (m === 'chat') {
    h += '<div class="ol-pills">' + pill('🌍 Everyone', 'chch', 'global', O.chatCh === 'global') + pill(esc(lgName(s.club.lg)), 'chch', s.club.lg, O.chatCh === s.club.lg) + '</div><div id="ol-chat" class="ol-chat">' + chatHTML() + '</div><div class="ol-row"><input id="ol-msg" placeholder="Say something…" maxlength="180" autocomplete="off">' + btn('Send', 'send', null, 'pri') + '</div>';
    openChat();
  } else if (m === 'hall') {
    h += '<div id="ol-hall">' + (O.hall ? hallHTML() : 'Loading…') + '</div>'; if (!O.hall) loadHall();
  } else if (m === 'hist') {
    h += '<div class="ol-card"><div class="ol-h">🏆 Trophies (' + s.trophies.length + ')</div>' + (s.trophies.length ? s.trophies.map(function (t) { return '<div>' + H.yearName(t.y) + ' · ' + esc(t.t) + '</div>'; }).join('') : '<div class="ol-dim">None yet.</div>') + '</div>' +
      (s.hist.length ? s.hist.map(function (x) { return '<div class="ol-card"><b>' + H.yearName(x.y) + '</b> · ' + esc(x.club) + '<div>Finished ' + x.pos + ' of ' + x.n + ' in the ' + esc(x.lg) + '. Champions: ' + esc(x.champ) + '</div><small class="ol-dim">Prize ' + fm(x.prize) + '</small></div>'; }).join('') : '<div class="ol-dim ol-pad">Your first season is still being played.</div>');
  } else if (m === 'set') {
    h += '<div class="ol-card"><div class="ol-h">Server</div><div class="ol-break">' + esc(O.server) + '</div><div>Manager: <b>' + esc(O.me ? O.me.name : '') + '</b></div></div><div class="ol-two">' + btn('Log out', 'logout') + btn(O.arm === 'leave' ? 'Tap again to leave the club' : 'Leave my club', 'leave', null, 'red') + '</div><p class="ol-dim">Leaving gives the club back to the computer. You can pick another one.</p>';
  }
  return h;
}
function feedHTML() { return O.info.news.length ? O.info.news.map(function (n) { return '<div class="ol-news">' + esc(n.t) + '<small class="ol-dim"> · ' + H.yearName(n.y) + ' wk ' + n.w + '</small></div>'; }).join('') : '<div class="ol-dim ol-pad">Nothing yet.</div>'; }
function loadInfo() { api('GET', '/api/info').then(function (j) { O.info = j; }).catch(fail).then(function () { var e = $('ol-feed'); if (e && O.info) e.innerHTML = feedHTML(); }); }
function hallHTML() { return O.hall.list.map(function (x, i) { return '<div class="ol-card"><b>' + (i + 1) + '. ' + esc(x.name) + '</b> · ' + esc(x.club) + '<div class="ol-dim">' + esc(lgName(x.lg)) + ': ' + x.pos + (x.pos === 1 ? 'st' : x.pos === 2 ? 'nd' : x.pos === 3 ? 'rd' : 'th') + ' · ' + x.pts + ' pts · 🏆 ' + x.trophies + '</div></div>'; }).join('') || '<div class="ol-dim ol-pad">No managers yet.</div>'; }
function loadHall() { api('GET', '/api/hall').then(function (j) { O.hall = j; }).catch(fail).then(function () { var e = $('ol-hall'); if (e && O.hall) e.innerHTML = hallHTML(); }); }
function chatHTML() { if (!O.chat) return '<div class="ol-dim">Loading…</div>'; return O.chat.length ? O.chat.map(function (m) { return '<div class="ol-msg"><b>' + esc(m.n) + '</b>' + (m.c ? ' <small class="ol-dim">' + esc(m.c) + '</small>' : '') + '<div>' + esc(m.m) + '</div></div>'; }).join('') : '<div class="ol-dim">No messages yet. Say hello!</div>'; }
function pollChat() {
  if (!O.open || O.tab !== 'more' || O.more !== 'chat') return;
  api('GET', '/api/chat?ch=' + encodeURIComponent(O.chatCh) + '&after=' + (O.chat && O.chat.length ? O.chat[O.chat.length - 1].id : 0)).then(function (j) {
    if (j.ch !== O.chatCh) return; var had = O.chat; O.chat = (had || []).concat(j.list).slice(-80);
    var el = $('ol-chat'); if (el) { el.innerHTML = chatHTML(); el.scrollTop = el.scrollHeight; }
  }).catch(function () { /* quiet */ });
}
function openChat() { clearInterval(O.chatT); if (!O.chat) setTimeout(pollChat, 0); O.chatT = setInterval(pollChat, 20000); }

function mainView() {
  var s = O.st, h = '<div class="ol-body" id="ol-body">' + bodyHTML() + '</div>';
  return '<div class="ol-top"><b>🌐 ' + esc(O.info ? O.info.name : 'Online League') + '</b><span class="ol-sp"></span>' + (O.busy ? '<small>…</small>' : '') + btn('✕', 'close', null, 'ol-x') + '</div>' + (O.offline ? '<div class="ol-off">Offline: showing the last saved information.</div>' : '') + h +
    '<div class="ol-nav">' + [['home', '🏠', 'Home'], ['team', '📋', 'Team'], ['league', '🏆', 'League'], ['market', '💷', 'Market'], ['more', '☰', 'More']].map(function (t) { return '<button class="' + (O.tab === t[0] ? 'on' : '') + '" data-a="tab" data-k="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</div>';
}
function bodyHTML() { return O.tab === 'home' ? homeView() : O.tab === 'team' ? teamView() : O.tab === 'league' ? leagueView() : O.tab === 'market' ? marketView() : moreView(); }
function renderBody() { var b = $('ol-body'); if (!b) return render(); var top = b.scrollTop; b.innerHTML = bodyHTML(); b.scrollTop = top; }

/* ------------------------------------------------ sheets (pop-ups) ------------------------------------------------ */
function sheetBox(inner) { return '<div class="ol-sbg" data-a="sheetx"></div><div class="ol-sbox"><div class="ol-sh"><span></span>' + btn('✕', 'sheetx', null, 'ol-x') + '</div>' + inner + '</div>'; }
function renderSheet() {
  var el = $('ol-sheet'); if (!el) return;
  if (!O.sheet) { el.style.display = 'none'; el.innerHTML = ''; return; }
  var x = O.sheet, h = '';
  if (x.type === 'pick') h = pickSheet(x); else if (x.type === 'own') h = ownSheet(x); else if (x.type === 'xp') h = xpSheet(x); else if (x.type === 'report') h = reportSheet(x); else if (x.type === 'claim') h = claimSheet(x);
  el.innerHTML = sheetBox(h); el.style.display = 'block';
}
function pickSheet(x) {
  var L = O.L, f = H.FORMATIONS[L.formation], slotPos = x.bench ? null : f[x.i][0];
  var list = O.st.squad.slice().sort(function (a, b) { return (slotPos ? (H.eff(b) - H.penalty(slotPos, b.pos)) - (H.eff(a) - H.penalty(slotPos, a.pos)) : H.eff(b) - H.eff(a)); });
  var h = '<div class="ol-h">' + (x.bench ? 'Bench spot ' + (x.i + 1) : 'Pick the ' + slotPos) + '</div><div class="ol-sl">';
  if (x.bench ? L.bench[x.i] != null : L.slots[x.i] != null) h += btn('Remove current player', 'pickclear', null, 'red');
  list.forEach(function (p) {
    var where = L.slots.indexOf(p.id) >= 0 ? 'XI' : L.bench.indexOf(p.id) >= 0 ? 'bench' : '', fit = slotPos ? H.eff(p) - H.penalty(slotPos, p.pos) : H.eff(p);
    h += prow(p, 'pickp', '<i class="ol-b">' + (slotPos ? 'fit ' + Math.max(30, fit) : '') + '</i>' + (where ? '<i class="ol-b grn">' + where + '</i>' : ''));
  });
  return h + '</div>';
}
function statsHTML(p) { var st = H.statsOf(p), lb = H.statLabels(p.pos); return '<div class="ol-stats">' + st.map(function (v, i) { return '<div><small>' + lb[i] + '</small><b class="' + rc(v) + '">' + v + '</b></div>'; }).join('') + '</div>'; }
function ownSheet(x) {
  var p = O.byId[x.id]; if (!p) return '';
  var listed = (O.st.listed || []).filter(function (l) { return l.pid === p.id; })[0];
  return '<div class="ol-h">' + H.flagOf(p.nat) + ' ' + esc(p.n) + '</div><div class="ol-dim">' + p.pos + ' · ' + p.a + ' years · rating ' + p.o + ' (potential ' + p.p + ')</div>' + statsHTML(p) +
    '<div class="ol-row"><span>Value ' + fm(p.v) + '</span><span>Wage ' + fm(p.w) + '/wk</span><span>' + (p.ct <= 0 ? 'No contract' : p.ct + ' yr left') + '</span></div><div class="ol-row"><span>Fitness ' + p.ft + '</span><span>Morale ' + p.mo + '</span><span>' + p.g + ' goals · ' + p.as + ' assists · ' + p.ap + ' apps</span></div>' + badge(p) +
    '<div class="ol-gap"></div>' + btn(p.lst ? '📢 Remove from transfer list' : '📢 Put on transfer list (brings offers)', 'tlist', p.id) +
    (listed ? '<div class="ol-row"><span>Listed for ' + fm(listed.price) + '</span>' + btn('Take off market', 'unmk', p.id) + '</div>' : '<div class="ol-row"><input id="ol-price" type="number" inputmode="decimal" step="0.1" placeholder="Price in £M for other managers">' + btn('List', 'mklist', p.id) + '</div>') +
    btn(O.arm === 'rel' + p.id ? 'Tap again to release him (pay-off ' + fm(H.releaseCost(p)) + ')' : '🚪 Release player', 'release', p.id, 'red');
}
function xpSheet(x) {
  var p = x.p; if (!p) return '<div class="ol-pad">Loading…</div>';
  var h = '<div class="ol-h">' + H.flagOf(p.nat) + ' ' + esc(p.n) + '</div><div class="ol-dim">' + p.pos + ' · ' + p.a + ' years · rating ' + p.o + ' (potential ' + p.p + ') · ' + (p.cn ? esc(p.cn) : 'Free agent') + '</div>' + statsHTML(p) +
    '<div class="ol-row"><span>Value ' + fm(p.v) + '</span><span>Wage ' + fm(p.w) + '/wk</span><span>' + p.ct + ' yr left</span></div>';
  if (p.mgr && !x.market) return h + '<div class="ol-card warn">Managed by ' + esc(p.mgr) + '. You can only buy him if he is on the Managers market.</div>';
  if (x.market) return h + '<div class="ol-row"><b>Price ' + fm(x.price) + '</b>' + btn('Buy now', 'mbuy', p.id, 'pri') + '</div><small class="ol-dim">His wage and contract stay as they are.</small>';
  var free = p.cn == null;
  h += '<div class="ol-card">' + (free ? '' : '<div>Their asking price: <b>' + fm(p.ask) + '</b></div>') + '<div>He wants at least <b>' + fm(p.wage) + '</b> a week</div>' + (p.refuse ? '<div class="ol-dim">⚠️ ' + esc(p.refuse) + '</div>' : '') + (!free && !p.window ? '<div class="ol-dim">🔴 Transfer window closed</div>' : '') + '</div>';
  if (!free) h += '<label>Fee (£M)</label><input id="ol-fee" type="number" inputmode="decimal" step="0.1" value="' + (Math.round(p.ask * 100) / 100) + '">';
  h += '<label>Weekly wage (£M)</label><input id="ol-wage" type="number" inputmode="decimal" step="0.001" value="' + (Math.round(p.wage * 1.03 * 10000) / 10000) + '"><label>Contract</label><select id="ol-yrs"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select>' + btn(free ? 'Sign free agent' : 'Make offer', 'bid', p.id, 'pri');
  return h;
}
function reportSheet(x) {
  var r = x.r; if (!r) return '<div class="ol-pad">Loading…</div>';
  var st = r.stats, row = function (n, a, b) { var t = (a + b) || 1; return '<div class="ol-stat"><span>' + a + '</span><div><small>' + n + '</small><div class="ol-sbar"><i style="width:' + (a / t * 100) + '%"></i></div></div><span>' + b + '</span></div>'; };
  var h = '<small class="ol-dim">' + esc(r.comp) + ' · ' + H.yearName(r.y) + ' wk ' + r.w + '</small><div class="ol-bigscore"><span>' + esc(r.home) + '</span><b>' + r.score[0] + ' - ' + r.score[1] + '</b><span>' + esc(r.away) + '</span></div>' + (r.pens ? '<div class="ol-dim">Penalties ' + r.pens[0] + '-' + r.pens[1] + '</div>' : '');
  h += '<div class="ol-goals"><div>' + r.goals[0].map(function (g) { return esc(g[0]) + ' ' + g[1] + "'" + (g[2] ? ' (p)' : ''); }).join('<br>') + '</div><div>' + r.goals[1].map(function (g) { return esc(g[0]) + ' ' + g[1] + "'" + (g[2] ? ' (p)' : ''); }).join('<br>') + '</div></div>';
  h += row('Shots', st.shots[0], st.shots[1]) + row('On target', st.sot[0], st.sot[1]) + row('Possession %', st.poss[0], st.poss[1]) + row('Corners', st.corners[0], st.corners[1]) + row('Fouls', st.fouls[0], st.fouls[1]) + row('Yellow cards', st.yc[0], st.yc[1]);
  if (r.motm) h += '<div class="ol-card">⭐ Man of the match: <b>' + esc(r.motm.n) + '</b> (' + esc(r.motm.t) + ')</div>';
  h += '<div class="ol-sec">Match events</div>' + r.log.map(function (e) { return '<div class="ol-ev ' + e[1] + '"><b>' + esc(e[0]) + '</b> ' + esc(e[2]) + '</div>'; }).join('');
  h += '<div class="ol-sec">Your players</div>' + r.ratings.slice().sort(function (a, b) { return b.r - a.r; }).map(function (p) { return '<div class="ol-fxr"><span>' + esc(p.n) + '</span><b>' + p.r + '</b><span>' + (p.g ? p.g + '⚽ ' : '') + (p.a ? p.a + '🅰️' : '') + '</span></div>'; }).join('');
  return h;
}
function claimSheet(x) {
  var c = x.c; return '<div class="ol-h">Take charge of ' + esc(c.name) + '?</div><div class="ol-dim">' + esc(lgName(c.lg)) + ' · ' + c.tier + ' · strength ' + c.str + '</div><p>You can leave later and pick another club. Bigger clubs have more money and better players but the board expects more.</p>' + btn('Yes, I am the manager', 'claimgo', c.id, 'pri');
}

/* ------------------------------------------------ actions ------------------------------------------------ */
function setFormationLocal(fm2) {
  var L = O.L, cards = L.slots.map(function (id) { return id != null ? O.byId[id] : null; }).filter(Boolean), fs = H.FORMATIONS[fm2], pool = cards.slice(), out = new Array(11).fill(null);
  fs.forEach(function (sl, i) { var k = pool.findIndex(function (c) { return c.pos === sl[0]; }); if (k >= 0) { out[i] = pool[k].id; pool.splice(k, 1); } });
  fs.forEach(function (sl, i) { if (out[i] != null) return; var bi = -1, bv = -99; pool.forEach(function (c, k) { var v = H.eff(c) - H.penalty(sl[0], c.pos); if (v > bv) { bv = v; bi = k; } }); if (bi >= 0) { out[i] = pool[bi].id; pool.splice(bi, 1); } });
  L.formation = fm2; L.slots = out; pool.forEach(function (c) { if (L.bench.length < 9 && L.bench.indexOf(c.id) < 0) L.bench.push(c.id); });
  L.bench = L.bench.filter(function (id) { return out.indexOf(id) < 0; });
}
function putSlot(i, pid) {
  var L = O.L, cur = L.slots[i], j = L.slots.indexOf(pid);
  if (j >= 0) { L.slots[j] = cur; L.slots[i] = pid; }
  else { var b = L.bench.indexOf(pid); L.slots[i] = pid; if (b >= 0) { if (cur != null) L.bench[b] = cur; else L.bench.splice(b, 1); } else if (cur != null && L.bench.length < 9) L.bench.push(cur); }
}
function putBench(i, pid) {
  var L = O.L, j = L.slots.indexOf(pid), b = L.bench.indexOf(pid), cur = L.bench[i];
  if (j >= 0) { L.slots[j] = cur != null ? cur : null; if (cur == null) { /* an empty bench spot cannot go in the XI */ L.slots[j] = pid; return; } L.bench[i] = pid; }
  else if (b >= 0) { L.bench[b] = cur; L.bench[i] = pid; L.bench = L.bench.filter(function (x) { return x != null; }); }
  else { if (i < L.bench.length) L.bench[i] = pid; else L.bench.push(pid); }
}
function saveLineup() {
  var body = clone(O.L); O.busy = true;
  return api('POST', '/api/lineup', body).then(function (j) { O.L = clone(j.st); O.dirty = false; O.st.st = clone(j.st); ls('hfc_ol_cache', JSON.stringify(O.st)); toast('Lineup saved'); O.offline = false; })
    .catch(function (e) { if (e.net) { O.offline = true; ls('hfc_ol_q', JSON.stringify(body)); toast('No network. Saved on your phone, it will be sent when you are back online.', true); } else fail(e); })
    .then(function () { O.busy = false; renderBody(); });
}
function post(path, body, ok, after) {
  O.busy = true;
  return api('POST', path, body).then(function (j) { if (j && (j.ok === false || (j.status && j.status !== 'signed' && path === '/api/bid'))) { toast(j.msg || 'Not possible', true); return j; } if (ok) toast(typeof ok === 'string' ? ok : (j.msg || 'Done')); return refresh(true).then(function () { return j; }); })
    .catch(fail).then(function (r) { O.busy = false; if (after) after(r); renderBody(); renderSheet(); return r; });
}
function openSheet(x) { O.sheet = x; renderSheet(); }
function closeSheet() { O.sheet = null; renderSheet(); }
function val(id) { var e = $(id); return e ? e.value : ''; }

function act(a, el) {
  var k = el.getAttribute('data-k'), v = el.getAttribute('data-v');
  if (a !== 'leave' && a.indexOf('release') !== 0) O.arm = '';
  switch (a) {
    case 'close': close(); break;
    case 'sheetx': closeSheet(); break;
    case 'refresh': O.info = null; refresh(); break;
    case 'logout': logout(); break;
    case 'login': case 'register': doAuth(a); break;
    case 'picklg': O.pickLg = k; render(); break;
    case 'pickclub': { var c = O.clubs.clubs.filter(function (x) { return x.id === +k; })[0]; if (c && !c.mgr) openSheet({ type: 'claim', c: c }); break; }
    case 'claimgo': O.busy = true; api('POST', '/api/claim', { cid: +k }).then(function (j) { closeSheet(); O.pick = false; O.st = j; O.me = j.me; O.skew = j.world.now - Date.now(); ls('hfc_ol_cache', JSON.stringify(j)); prep(); O.tab = 'home'; toast('Welcome to ' + j.club.name + '!'); }).catch(function (e) { fail(e); loadClubs().then(render); }).then(function () { O.busy = false; render(); }); break;
    case 'tab': O.tab = k; if (k === 'more') O.more = 'menu'; clearInterval(O.chatT); render(); break;
    case 'sub': { var p = k.split(':'); O.sub[p[0]] = p[1]; if (p[0] === 'market') { O.mkRes = null; O.mkt = null; } renderBody(); break; }
    case 'more': O.more = k; if (k === 'chat') O.chat = null; if (k === 'news') O.info = null; if (k === 'hall') O.hall = null; clearInterval(O.chatT); renderBody(); break;
    case 'lg': O.lgSel = k; O.league = null; renderBody(); break;
    case 'slot': openSheet({ type: 'pick', i: +k }); break;
    case 'bench': openSheet({ type: 'pick', i: +k, bench: true }); break;
    case 'pickp': { var x = O.sheet; if (!x) break; if (x.bench) putBench(x.i, +k); else putSlot(x.i, +k); O.dirty = true; closeSheet(); renderBody(); break; }
    case 'pickclear': { var y = O.sheet; if (y.bench) { O.L.bench.splice(y.i, 1); } else O.L.slots[y.i] = null; O.dirty = true; closeSheet(); renderBody(); break; }
    case 'tac': O.L[k] = k === 'train' ? +v : v; O.dirty = true; renderBody(); break;
    case 'auto': { var ap = H.autoPick(O.L.formation, O.st.squad); O.L.slots = ap.slots; O.L.bench = ap.bench.slice(0, 9); O.dirty = true; renderBody(); break; }
    case 'savel': if (O.dirty) saveLineup(); break;
    case 'player': openSheet({ type: 'own', id: +k }); break;
    case 'xplayer': case 'mplayer': {
      var mk = a === 'mplayer', listed = mk ? O.mkt.list.filter(function (q) { return q.id === +k; })[0] : null; openSheet({ type: 'xp', p: null, market: mk, price: listed ? listed.price : 0 });
      api('GET', '/api/player?id=' + k).then(function (pp) { if (O.sheet && O.sheet.type === 'xp') { O.sheet.p = pp; renderSheet(); } }).catch(function (e) { closeSheet(); fail(e); }); break;
    }
    case 'mksearch': O.mk.q = val('mk-q'); O.mk.pos = val('mk-pos') || O.mk.pos; if ($('mk-lg')) O.mk.lg = val('mk-lg'); O.mk.maxA = val('mk-age'); O.mk.minO = val('mk-ovr'); O.mk.sort = val('mk-sort') || O.mk.sort; doSearch(0); break;
    case 'mkmore': doSearch(O.mk.page + 1); break;
    case 'mkprev': doSearch(Math.max(0, O.mk.page - 1)); break;
    case 'bid': post('/api/bid', { pid: +k, fee: parseFloat(val('ol-fee')) || 0, wage: parseFloat(val('ol-wage')) || 0, years: +val('ol-yrs') || 3 }, true, function (r) { if (r && r.status === 'signed') closeSheet(); }); break;
    case 'mbuy': post('/api/market/buy', { pid: +k }, true, function (r) { if (r && r.ok) { O.mkt = null; closeSheet(); } }); break;
    case 'mklist': post('/api/market/list', { pid: +k, price: parseFloat(val('ol-price')) || 0 }, 'Listed on the managers market', closeSheet); break;
    case 'unmk': post('/api/market/list', { pid: +k, price: null }, 'Taken off the market', closeSheet); break;
    case 'tlist': post('/api/translist', { pid: +k, on: !O.byId[+k].lst }, 'Done', closeSheet); break;
    case 'release': if (O.arm === 'rel' + k) { O.arm = ''; post('/api/release', { pid: +k }, 'Player released', closeSheet); } else { O.arm = 'rel' + k; renderSheet(); } break;
    case 'offeryes': post('/api/offer', { pid: +k, accept: true }, true); break;
    case 'offerno': post('/api/offer', { pid: +k, accept: false }, 'Offer rejected'); break;
    case 'renew': post('/api/renew', { pid: +k, wage: parseFloat(v) * 1.03, years: 3 }, 'Contract renewed'); break;
    case 'build': post('/api/build', { i: +k }, 'Work has started'); break;
    case 'spon': post('/api/sponsor', { i: +k }, 'Sponsor signed'); break;
    case 'report': openSheet({ type: 'report', r: null }); api('GET', '/api/report?i=' + k).then(function (r) { if (O.sheet && O.sheet.type === 'report') { O.sheet.r = r; renderSheet(); } }).catch(function (e) { closeSheet(); fail(e); }); break;
    case 'chch': O.chatCh = k; O.chat = null; renderBody(); break;
    case 'send': { var t = val('ol-msg').trim(); if (!t) break; api('POST', '/api/chat', { ch: O.chatCh, text: t }).then(function () { var m = $('ol-msg'); if (m) m.value = ''; pollChat(); }).catch(fail); break; }
    case 'leave': if (O.arm === 'leave') { O.arm = ''; api('POST', '/api/leave', {}).then(function () { O.st = null; ls('hfc_ol_cache', null); O.L = null; O.dirty = false; return refresh(); }).catch(fail); } else { O.arm = 'leave'; renderBody(); } break;
  }
}
function doAuth(mode) {
  var srv = val('ol-srv').trim(); if (srv && !/^https?:\/\//i.test(srv)) srv = 'https://' + srv;
  var nm = val('ol-nm').trim(), pw = val('ol-pw');
  if (!srv) return toast('Type the server address first', true);
  if (!nm || !pw) return toast('Type your name and password', true);
  O.server = srv.replace(/\/+$/, ''); ls('hfc_ol_server', O.server); O.busy = true;
  api('POST', mode === 'login' ? '/api/login' : '/api/register', { name: nm, pass: pw }).then(function (j) { O.token = j.token; ls('hfc_ol_token', j.token); O.me = j.me; return refresh(); }).catch(fail).then(function () { O.busy = false; render(); });
}
function onChange(e) {
  var t = e.target, c = t && t.getAttribute && t.getAttribute('data-ch'); if (!c) return;
  if (c === 'fm') { setFormationLocal(t.value); O.dirty = true; renderBody(); }
  else if (c === 'mkq') O.mk.q = t.value; else if (c === 'mkpos') O.mk.pos = t.value; else if (c === 'mklg') O.mk.lg = t.value; else if (c === 'mkage') O.mk.maxA = t.value; else if (c === 'mkovr') O.mk.minO = t.value; else if (c === 'mksort') O.mk.sort = t.value;
}

/* ------------------------------------------------ open / close ------------------------------------------------ */
function render() {
  var root = $('ol-root'); if (!root) return;
  if (!O.open) { root.style.display = 'none'; return; }
  root.style.display = 'flex';
  var html;
  if (!O.server || !O.token) html = '<div class="ol-top"><b>🌐 Online League</b><span class="ol-sp"></span>' + btn('✕', 'close', null, 'ol-x') + '</div><div class="ol-body">' + authView() + '</div>';
  else if (O.pick) html = '<div class="ol-top"><b>🌐 Online League</b><span class="ol-sp"></span>' + btn('✕', 'close', null, 'ol-x') + '</div><div class="ol-body">' + pickView() + '</div>';
  else if (!O.st) html = '<div class="ol-top"><b>🌐 Online League</b><span class="ol-sp"></span>' + btn('✕', 'close', null, 'ol-x') + '</div><div class="ol-body"><div class="ol-pad">' + (O.busy ? 'Connecting…' : 'Could not load. ' + btn('Try again', 'refresh')) + '</div></div>';
  else html = mainView();
  root.innerHTML = html; renderSheet(); startClock();
}
function open() { hookBack(); O.open = true; render(); if (O.token) refresh(true); if (!O.info && O.server) loadInfo(); }
function close() { O.open = false; O.sheet = null; clearInterval(O.clockT); clearInterval(O.chatT); render(); }
window.HFCOnline = { open: open, close: close, _t: { O: O, render: render, bodyHTML: bodyHTML, homeView: homeView, teamView: teamView, leagueView: leagueView, marketView: marketView, moreView: moreView, reportSheet: reportSheet, ownSheet: ownSheet, xpSheet: xpSheet, pickSheet: pickSheet, authView: authView, pickView: pickView, act: act, prep: prep, setFormationLocal: setFormationLocal, putSlot: putSlot, putBench: putBench } };

/* ------------------------------------------------ set up the page ------------------------------------------------ */
var css = '#ol-root{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;display:none;flex-direction:column;background:#0b1d12;color:#e8f5e9;font:14px/1.35 system-ui,sans-serif;padding-top:env(safe-area-inset-top)}' +
  '#ol-root *{box-sizing:border-box}#ol-root input,#ol-root select{width:100%;padding:10px;border-radius:8px;border:1px solid #1f4a2f;background:#0f2a19;color:#e8f5e9;font-size:15px;margin:4px 0}' +
  '.ol-top{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#12301d;border-bottom:1px solid #1f4a2f}.ol-sp{flex:1}.ol-x{width:auto!important;padding:6px 12px!important}' +
  '.ol-body{flex:1;overflow-y:auto;padding:10px 10px 18px;-webkit-overflow-scrolling:touch}.ol-pad{padding:14px}.ol-pad0{padding:2px 4px}.ol-gap{height:10px}.ol-dim{color:#8fb59b}.ol-break{word-break:break-all}.ol-note{background:#1d3a26;padding:8px;border-radius:8px}' +
  '.ol-nav{display:flex;background:#12301d;border-top:1px solid #1f4a2f;padding-bottom:env(safe-area-inset-bottom)}.ol-nav button{flex:1;background:none;border:0;color:#8fb59b;padding:8px 2px;font-size:11px}.ol-nav button span{display:block;font-size:20px}.ol-nav button.on{color:#3ddc84}' +
  '.ol-card{background:#12301d;border:1px solid #1f4a2f;border-radius:12px;padding:12px;margin:8px 0;display:block;width:100%;text-align:left;color:inherit}.ol-card.warn{border-color:#a8801f;background:#2a2410}.ol-res{cursor:pointer}' +
  '.ol-h{font-weight:700;font-size:15px;margin-bottom:4px}.ol-sec{margin:14px 4px 4px;color:#3ddc84;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase}' +
  '.ol-banner{display:flex;justify-content:space-between;align-items:center;background:#12301d;border-radius:12px;padding:12px;margin:2px 0 8px}.ol-banner small{display:block;color:#8fb59b}.ol-cash{font-weight:800;font-size:18px;color:#f5c542}' +
  '.ol-btn{background:#1b4a2c;color:#e8f5e9;border:1px solid #2d6b43;border-radius:10px;padding:10px 12px;font-size:14px;margin:4px 0;width:100%}.ol-btn.pri{background:#2bbf6a;color:#06210f;border-color:#2bbf6a;font-weight:700}.ol-btn.red{background:#4a1b1b;border-color:#7a2d2d}' +
  '.ol-two{display:flex;gap:8px}.ol-two .ol-btn{flex:1}.ol-row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:4px 0}.ol-row input,.ol-row select{flex:1;min-width:90px}' +
  '.ol-pills{display:flex;gap:6px;overflow-x:auto;padding:4px 0 6px}.ol-pill{flex:none;background:#12301d;color:#cfe8d6;border:1px solid #1f4a2f;border-radius:999px;padding:7px 12px;font-size:13px}.ol-pill.on{background:#2bbf6a;color:#06210f;border-color:#2bbf6a;font-weight:700}' +
  '.ol-prow{display:flex;gap:8px;align-items:center;width:100%;text-align:left;background:#12301d;color:inherit;border:0;border-bottom:1px solid #1b3d28;padding:9px 6px}.ol-prow[disabled]{opacity:.55}.ol-pn{flex:1;min-width:0}.ol-pn b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ol-pn small{color:#8fb59b}.ol-pe{display:flex;flex-direction:column;align-items:flex-end;gap:2px}' +
  '.ol-pos{width:34px;text-align:center;font-size:11px;font-weight:700;color:#8fb59b}.ol-ovr{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#06210f}.ol-dot{width:14px;height:14px;border-radius:50%;flex:none;border:1px solid #fff4}' +
  '.r1{background:#f5c542;color:#2a2000}.r2{background:#3ddc84;color:#06210f}.r3{background:#a5e05a;color:#102000}.r4{background:#e8c04a;color:#2a2000}.r5{background:#e8844a;color:#2a1000}.rx{background:#0f2a19;color:#8fb59b;border:2px dashed #2d6b43}' +
  '.ol-b{font-style:normal;font-size:11px;background:#1d3a26;border-radius:6px;padding:2px 6px;color:#cfe8d6;white-space:nowrap}.ol-b.red{background:#5a1f1f}.ol-b.amb{background:#5a4a16}.ol-b.grn{background:#1f5a34;color:#9bf0be}' +
  '.ol-pitch{position:relative;width:100%;padding-top:128%;background:repeating-linear-gradient(#1c6b3a 0 10%,#1a6236 10% 20%);border:2px solid #2d8a4e;border-radius:12px;overflow:hidden}.ol-pin{position:absolute;top:0;right:0;bottom:0;left:0}' +
  '.ol-slot{position:absolute;transform:translate(-50%,-50%);width:70px;background:none;border:0;color:#fff;text-align:center;padding:0}.ol-slot small{display:block;font-size:11px;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ol-slot em{display:block;font-size:9px;font-style:normal;opacity:.7}' +
  '.ol-chip{width:40px;height:40px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;border:2px solid #fff}.ol-chip.sm{width:34px;height:34px;font-size:13px}.ol-chip.bad{box-shadow:0 0 0 3px #ff5d5d}' +
  '.ol-bench{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}.ol-bchip{background:#12301d;border:1px solid #1f4a2f;border-radius:10px;color:#e8f5e9;padding:6px 2px;text-align:center}.ol-bchip small{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.ol-tr{display:flex;align-items:center;gap:6px;margin:6px 0;flex-wrap:wrap}.ol-tr label{width:84px;color:#8fb59b}.ol-bar{height:8px;background:#0f2a19;border-radius:6px;overflow:hidden;margin:4px 0}.ol-bar i{display:block;height:100%;background:#3ddc84}.ol-bar i.red{background:#ff5d5d}' +
  '.ol-table{background:#12301d;border-radius:12px;overflow:hidden}.ol-tr0{display:grid;grid-template-columns:28px 1fr 30px 34px 36px;gap:4px;padding:7px 8px;border-bottom:1px solid #1b3d28;font-size:13px;align-items:center}.ol-tr0.me{background:#1f5a34}.ol-tr0.top{border-left:3px solid #3ddc84}.ol-tr0.bot{border-left:3px solid #ff5d5d}' +
  '.ol-fxr{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;padding:8px 4px;border-bottom:1px solid #1b3d28;align-items:center}.ol-fxr span:last-child{text-align:right}.ol-fxr b{text-align:center;min-width:44px}.ol-fx{padding:4px 0}.ol-news{padding:6px 0;border-bottom:1px solid #1b3d28}' +
  '.ol-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ol-tile{background:#12301d;border:1px solid #1f4a2f;border-radius:12px;color:#e8f5e9;padding:16px 8px;font-size:14px}.ol-tile span{display:block;font-size:26px}' +
  '.ol-score{font-size:15px;margin:4px 0}.ol-score b{color:#f5c542;font-size:18px;padding:0 4px}.ol-bigscore{display:flex;justify-content:space-around;align-items:center;gap:6px;text-align:center;margin:8px 0}.ol-bigscore b{font-size:28px;color:#f5c542}.ol-bigscore span{flex:1;font-weight:700}' +
  '.ol-goals{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#cfe8d6;margin-bottom:8px}.ol-goals div:last-child{text-align:right}.ol-stat{display:grid;grid-template-columns:30px 1fr 30px;gap:6px;align-items:center;text-align:center}.ol-stat small{color:#8fb59b}.ol-sbar{height:6px;background:#3a5a46;border-radius:4px;overflow:hidden}.ol-sbar i{display:block;height:100%;background:#3ddc84}' +
  '.ol-ev{padding:4px 0;border-bottom:1px solid #1b3d28;font-size:13px}.ol-ev.goal{color:#f5c542;font-weight:700}.ol-ev.red{color:#ff8a8a}.ol-ev b{color:#8fb59b;margin-right:4px}' +
  '.ol-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:8px 0}.ol-stats div{text-align:center;background:#0f2a19;border-radius:8px;padding:4px 0}.ol-stats small{display:block;font-size:10px;color:#8fb59b}.ol-stats b{padding:1px 5px;border-radius:5px}' +
  '.ol-chat{height:46vh;overflow-y:auto;background:#0f2a19;border-radius:10px;padding:8px}.ol-msg{margin-bottom:8px}.ol-auth{padding:16px}.ol-auth label{display:block;margin-top:10px;color:#8fb59b}' +
  '#ol-sheet{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10001;display:none;color:#e8f5e9;font:14px/1.35 system-ui,sans-serif}#ol-sheet *{box-sizing:border-box}.ol-sbg{position:absolute;top:0;right:0;bottom:0;left:0;background:#000a}.ol-sbox{position:absolute;left:0;right:0;bottom:0;max-height:88%;overflow-y:auto;background:#12301d;border-radius:16px 16px 0 0;padding:12px 14px calc(16px + env(safe-area-inset-bottom));border-top:2px solid #2d8a4e}.ol-sh{display:flex;justify-content:space-between;margin-bottom:4px}' +
  '#ol-sheet input,#ol-sheet select{width:100%;padding:10px;border-radius:8px;border:1px solid #1f4a2f;background:#0f2a19;color:#e8f5e9;font-size:15px;margin:4px 0}#ol-sheet label{display:block;margin-top:8px;color:#8fb59b}.ol-off{background:#5a4a16;padding:6px 12px;text-align:center;font-size:12px}' +
  '.ol-toast{position:fixed;left:12px;right:12px;bottom:84px;z-index:10002;background:#2bbf6a;color:#06210f;padding:12px;border-radius:12px;font-weight:700;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s}.ol-toast.show{opacity:1}.ol-toast.bad{background:#ff7b7b}' +
  '.ol-fab{position:fixed;left:10px;bottom:84px;z-index:9998;width:46px;height:46px;border-radius:50%;border:2px solid #3ddc84;background:#12301d;color:#fff;font-size:22px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var root = document.createElement('div'); root.id = 'ol-root'; document.body.appendChild(root);
var sheet = document.createElement('div'); sheet.id = 'ol-sheet'; document.body.appendChild(sheet);
var tt = document.createElement('div'); tt.id = 'ol-toast'; tt.className = 'ol-toast'; document.body.appendChild(tt);
var fab = document.createElement('button'); fab.className = 'ol-fab'; fab.setAttribute('aria-label', 'Online League'); fab.setAttribute('data-ol', '1'); fab.textContent = '🌐'; document.body.appendChild(fab);
loadSession();

document.addEventListener('click', function (e) {
  var o = e.target.closest ? e.target.closest('[data-ol]') : null;
  if (o) { var x = document.querySelector('.hmh [data-hm="x"]'); if (x && o.className.indexOf('ol-fab') < 0) { try { x.click(); } catch (er) { /* ignore */ } } setTimeout(open, 30); return; }
  var t = e.target.closest ? e.target.closest('[data-a]') : null; if (!t) return;
  if (!(root.contains(t) || sheet.contains(t))) return;
  e.preventDefault(); act(t.getAttribute('data-a'), t);
});
document.addEventListener('change', onChange);
/* put an "Online League" row at the top of the app's Menu */
new MutationObserver(function () {
  var bd = $('hm-body'); if (!bd || bd.querySelector('[data-ol]')) return;
  var q = $('hm-q'); if (q && q.value) return;
  var b = document.createElement('button'); b.className = 'hmres'; b.setAttribute('data-ol', '1'); b.innerHTML = '<span style="font-size:22px">🌐</span><div>Online League<small>Play with other managers</small></div>';
  bd.insertBefore(b, bd.firstChild);
}).observe(document.body, { childList: true, subtree: true });
function hookBack() {
  if (window.__back && window.__back.__ol) return;
  var prev = window.__back;
  var f = function () {
    if (O.open) { if (O.sheet) { closeSheet(); return true; } if (O.tab !== 'home' && O.st) { O.tab = 'home'; render(); return true; } close(); return true; }
    return prev ? prev() : false;
  };
  f.__ol = 1; window.__back = f;
}
hookBack();
} catch (err) { if (window.console) console.error('HANS FC Online add-on failed', err); }
})();
