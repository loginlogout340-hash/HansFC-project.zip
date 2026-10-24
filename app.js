/* HANS FC 2.0 - screens. Everything is saved on the phone (localStorage). */
(function () {
var H = window.HFC, U = H.util;
var KEY = 'hansfc_save_v2';
var G = null, S = null, tab = 'home', layers = [], matchTimer = null;
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var fm = H.fm;
var ord = function (n) { return n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'); };
function save() { if (G) H.save(G, KEY); }
function toast(t) { var e = $('toast'); e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); }
var cname = function (id) { return id == null || id < 0 ? '-' : S.clubs[id].name; };
var last = function (n) { var p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };
var cr = function (c, sz) { return H.crest(c, sz || 28); };
var kitOf = function (p) { return p.cl != null && S ? S.clubs[p.cl].col : '#556070'; };
var face = function (p, sz) { return H.face(p, sz || 40, kitOf(p)); };
var rar = function (o) { return o >= 88 ? 'legend' : o >= 80 ? 'elite' : o >= 70 ? 'gold' : o >= 60 ? 'silver' : 'bronze'; };
var LV = function (n) { var s = ''; for (var i = 0; i < 10; i++) s += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return '<div class="lvl">' + s + '</div>'; };

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
function closeLayer() { var l = layers.pop(); if (!l) return false; l.el.remove(); if (l.onclose) l.onclose(); return true; }
function closeAll() { while (closeLayer()); }

/* ---------- cards ---------- */
function cardHTML(p, o) {
o = o || {};
if (!p) return '<div class="card empty"><div style="font-size:22px">+</div><div class="pos">' + (o.pos || '') + '</div></div>';
var ovr = o.ovr != null ? o.ovr : p.o, dot = p.inj ? 'inj' : p.sus ? 'sus' : p.ft < 60 ? 'tired' : '';
return '<div class="card r-' + rar(p.o) + '"><div class="ovr">' + ovr + '</div><div class="pos">' + (o.pos || p.pos) + '</div><div class="av">' + face(p, 64) + '</div><div class="nm">' + esc(last(p.n)) + '</div><div class="sub">' + H.flag(p) + ' ' + (p.cl != null ? esc(S.clubs[p.cl].name.slice(0, 11)) : 'Free') + '</div>' + (o.pen ? '<div class="pen"></div>' : '') + (dot ? '<i class="dot ' + dot + '"></i>' : '') + '</div>';
}
function statusPill(p) {
if (p.inj) return '<span class="pill bad">Injured ' + p.inj + 'w</span>';
if (p.sus) return '<span class="pill bad">Banned ' + p.sus + 'w</span>';
if (p.ft < 60) return '<span class="pill warn">Tired</span>';
return '';
}
function playerRow(p, extra, act) {
var c = p.cl != null ? S.clubs[p.cl].name : 'Free agent';
return '<div class="rowp" data-act="' + (act || 'pl') + '" data-id="' + p.id + '"><div class="ov r-' + rar(p.o) + '">' + p.o + '</div><div class="t"><b>' + H.flag(p) + ' ' + esc(p.n) + ' ' + statusPill(p) + '</b><small>' + p.pos + ' · ' + p.a + 'y · pot ' + p.p + ' · ' + esc(c) + '</small></div><div class="c" style="min-width:58px"><b style="color:var(--acc2)">' + (extra || fm(p.v)) + '</b></div></div>';
}

/* ---------- chrome ---------- */
var ICON = {
comp: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C7.6 2 4 5.4 4 9.5c0 5.2 8 12.5 8 12.5s8-7.3 8-12.5C20 5.4 16.4 2 12 2zm0 11a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>',
market: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7V7zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11v2z"/></svg>',
home: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/></svg>',
squad: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 11a3 3 0 100-6 3 3 0 000 6zm7 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM9 13c-2.700 0-8 1.300-8 4v2h16v-2c0-2.700-5.300-4-8-4zm7 0c-.4 0-.8 0-1.200.1 1.200.9 2.200 2.100 2.200 3.900v2h6v-2c0-2.200-4-4-7-4z"/></svg>',
inbox: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
};
function chrome() {
if (!G) { $('top').style.display = 'none'; $('nav').style.display = 'none'; return; }
var uc = H.userClub(G);
$('top').style.display = 'flex'; $('nav').style.display = 'flex';
$('top').innerHTML = '<div class="cashpill"><b class="coin">£</b>' + fm(uc.cash) + ' <span class="hmplus">+</span></div><div class="sp"></div><button class="tbtn hm-music" data-act="music" aria-label="Music">🎵</button><button class="tbtn hm-menu" data-act="menu" aria-label="Menu">☰ Menu</button><button class="tbtn" data-act="achv" aria-label="Achievements">🏆</button><button class="tbtn" data-act="saveb" aria-label="Save">💾</button>';
var rating = H.userEval(G).vector.rating, unread = S.unread || 0;
var T = [['comp', 'Compete', ''], ['market', 'Transfers', ''], ['home', 'Home', ''], ['squad', 'Squad', '<i class="bdg gold">' + rating + '</i>'], ['inbox', 'Inbox', unread ? '<i class="bdg red">' + Math.min(unread, 99) + '</i>' : '']];
$('nav').innerHTML = T.map(function (t) { return '<button data-act="tab" data-v="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"><span class="ic">' + ICON[t[0]] + t[2] + '</span><small>' + t[1] + '</small></button>'; }).join('');
}
function render() {
chrome();
var el = $('screen'), keep = el.scrollTop;
if (!G) { el.innerHTML = viewIntro(); return; }
var v = { home: viewHome, squad: viewSquad, comp: viewComp, market: viewMarket, club: viewClub, inbox: viewInbox }[tab] || viewHome;
el.innerHTML = v();
el.scrollTop = keep;
}

/* ---------- intro: pick a league and a club ---------- */
var intro = { lg: 'epl', name: '', sel: null };
function viewIntro() {
var clubs = S_world().filter(function (c) { return c.lg === intro.lg; }).sort(function (a, b) { return b.rep - a.rep; });
return '<div class="hero"><div style="display:flex;justify-content:center;margin-bottom:8px">' + H.crest({ id: 1, name: 'Hans FC', col: '#1d6fb8' }, 70) + '</div><h2 style="font-size:26px;margin:0">HANS FC 2.0</h2><p class="mut">Pick any club. Run it your way. Seasons, transfers, cups and glory.</p></div>' +
'<div class="panel"><h3 style="margin-top:0">Your name</h3><input id="mn" type="text" maxlength="22" placeholder="e.g. Theophilus Hanson" value="' + esc(intro.name) + '">' +
'<h3>Choose a league</h3><div class="tabs2">' + H.LEAGUES.map(function (l) { return '<button data-act="ilg" data-v="' + l.id + '" class="' + (intro.lg === l.id ? 'on' : '') + '">' + l.flag + ' ' + l.name + '</button>'; }).join('') + '</div>' +
'<h3>Choose your club</h3>' + clubs.map(function (c) {
return '<div class="clubrow ' + (intro.sel === c.id ? 'on' : '') + '" data-act="iclub" data-v="' + c.id + '"><div class="cr2">' + cr(c, 32) + '</div><div class="sp"><b>' + esc(c.name) + '</b><div class="mut" style="font-size:12px">' + H.tierName(c) + ' · stadium ' + c.cap + 'K</div></div><div class="mut" style="font-size:12px">' + (intro.sel === c.id ? '✔' : '') + '</div></div>';
}).join('') +
'<button class="btn full" style="margin-top:10px" data-act="istart">Start my career</button></div>' +
'<p class="mut c" style="font-size:12px">Names are real, ratings are my own estimates. There are no badges or photos. Everything is saved on your phone.</p>';
}
var WORLD_CACHE = null;
function S_world() {
if (!WORLD_CACHE) WORLD_CACHE = H.CLUB_ROWS.map(function (r, i) { var f = r.split('|'); return { id: i, name: f[0], lg: f[1], col: f[2], rep: +f[3], cap: +f[4] }; });
return WORLD_CACHE;
}

/* ---------- home ---------- */
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dateOf(week) { var d = new Date(Date.UTC(S.year, 7, 10) + (Math.max(1, week) - 1) * 7 * 86400000); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
function formOf(cid) {
var out = [], L = S.lg[S.clubs[cid].lg];
for (var w = L.rounds.length - 1; w >= 0 && out.length < 5; w--) {
L.rounds[w].forEach(function (f) {
if (out.length >= 5 || f[2] < 0 || (f[0] !== cid && f[1] !== cid)) return;
var gf = f[0] === cid ? f[2] : f[3], ga = f[0] === cid ? f[3] : f[2];
out.push(gf > ga ? 'W' : gf === ga ? 'D' : 'L');
});
}
return out.reverse();
}
var formHTML = function (cid) { return formOf(cid).map(function (x) { return '<i class="fm ' + x + '">' + x + '</i>'; }).join(''); };
function viewHome() {
var uc = H.userClub(G), lvl = H.mgrLevel(S.mgr.xp), xpA = H.mgrXpFor(lvl), xpB = H.mgrXpFor(lvl + 1), pos = H.position(G, uc.lg, uc.id);
var inc = H.weeklyIncome(G, uc), profit = S.tot.inc.gate + S.tot.inc.tv + S.tot.inc.spons + S.tot.inc.comm + S.tot.inc.prize - S.tot.exp.wages - S.tot.exp.upkeep - S.tot.exp.build;
var open = S.ch && S.ch.items.length ? S.ch.items.filter(function (x) { return x.done; }).length + '/' + S.ch.items.length : '';
var tbl = H.table(G, uc.lg), me = tbl.findIndex(function (r) { return r.user; }), a = Math.max(0, Math.min(me - 2, tbl.length - 5));
var mini = tbl.slice(a, a + 5).map(function (r, i) { return '<div class="mini-r ' + (r.user ? 'me' : '') + '"><span>' + (a + i + 1) + '</span><span class="n">' + esc(r.name) + '</span><span>P' + r.p + '</span><b>' + r.pts + '</b></div>'; }).join('');
var h = '<div class="clubhd"><div class="cr2">' + cr(uc, 34) + '</div><b class="sp">' + esc(uc.name) + '</b><span class="gold sm">' + Math.round(uc.str) + '</span></div>' +
'<div class="mgrbar"><div><b>' + esc(S.mgr.name.toUpperCase()) + '</b><small>Manager</small></div><div class="bars"><div class="rl"><span>Reputation</span><div class="bar2"><i style="width:' + Math.min(100, S.mgr.rep) + '%"></i></div><b class="rd">' + Math.round(S.mgr.rep) + '</b></div><div class="rl"><span>Level</span><div class="bar2"><i style="width:' + Math.round((S.mgr.xp - xpA) / Math.max(1, xpB - xpA) * 100) + '%"></i></div><b class="rd bl">' + lvl + '</b></div></div><span class="gold">' + Math.round(S.mgr.rep) + '</span></div>' +
'<div class="homegrid"><div class="mgrface"><div class="face">' + H.face({ id: 4242, n: 'M', nat: 'England', a: 45 }, 220, '#222a38') + '</div><div class="datepill">' + dateOf(S.stage === 'pre' ? 1 : S.week) + '</div><div class="clubpill" data-act="menu2">' + esc(uc.name.toUpperCase()) + '<span class="gold sm">' + Math.round(uc.rep) + '</span></div></div>' +
'<div class="homeside"><div class="orbar" data-act="cbgo" data-v="chal"><b>★ CHALLENGES</b><i style="width:' + (S.ch ? S.ch.items.filter(function (x) { return x.done; }).length / Math.max(1, S.ch.items.length) * 100 : 0) + '%"></i></div>' +
'<div class="sidecard" data-act="cbgo" data-v="board"><div class="faces"><div>' + H.face({ id: 11, n: 'a', nat: 'Brazil', a: 40 }, 80, '#4b5563') + '</div><div>' + H.face({ id: 12, n: 'b', nat: 'England', a: 60 }, 80, '#d8dde5') + '</div></div><span class="gold sm tr">' + H.mgrLevel(S.mgr.xp) + '</span><div class="cap">BOARD</div></div>' +
'<div class="sidecard"><div class="kit">👕</div><b class="big">' + H.fanbase(G).toLocaleString('en-US') + '</b><div class="cap">FANBASE</div></div>' +
'<div class="sidecard" data-act="cbgo" data-v="board"><div class="faces"><div>' + H.face({ id: 31, n: 'c', nat: 'England', a: 50 }, 80, '#d8dde5') + '</div><div>' + H.face({ id: 32, n: 'd', nat: 'Ghana', a: 40 }, 80, '#4b5563') + '</div></div><span class="rd2">' + Math.round(S.fanC) + '</span><span class="rd2 g">' + Math.round(S.board.conf) + '</span><div class="cap">FAN CONFIDENCE</div></div>' +
'<div class="sidecard" data-act="tab" data-v="comp"><div class="minit">' + mini + '</div><div class="cap">LEAGUE</div></div></div></div>' +
'<div class="two"><div class="whitebox"><b class="gn">' + fm(uc.cash) + '</b><div class="cap">BANK BALANCE</div></div><div class="whitebox" data-act="cbgo" data-v="fin"><b class="' + (profit >= 0 ? 'gn' : 'rd3') + '">' + fm(profit) + '</b><div class="cap">PROFIT/LOSS</div></div></div>';
if (S.stage === 'pre') h += homePre(uc);
else if (S.stage === 'week') h += homeWeek(uc);
else if (S.stage === 'end') h += '<div class="darkbox c"><h2>THE SEASON IS OVER</h2><p class="mut">All ' + H.LAST_WEEK + ' weeks are played.</p><button class="btn full" data-act="endseason">SEE THE SEASON REVIEW</button></div>';
else h += '<div class="darkbox c"><h2>SEASON REVIEW</h2><button class="btn full" data-act="review">OPEN REVIEW</button></div>';
return h + injuredPanel();
}
function homePre(uc) {
var offers = S.sponsorOffers && S.sponsorOffers.length ? '<h3>Choose a shirt sponsor</h3>' + S.sponsorOffers.map(function (o, i) {
return '<div class="mp"><div class="row"><div class="sp"><b>' + esc(o.name) + '</b> <span class="pill">' + o.label + '</span><div class="mut" style="font-size:12px">' + o.desc + '</div><div style="font-size:13px;margin-top:3px">Sponsor income x' + o.mult.toFixed(2) + (o.bonus ? ' · bonus ' + fm(o.bonus) : '') + '</div></div><button class="btn sm" data-act="spons" data-v="' + i + '">Sign</button></div></div>';
}).join('') : (S.sponsor ? '<div class="mut" style="font-size:13px;margin-bottom:8px">Sponsor: <b>' + esc(S.sponsor.name) + '</b> (' + S.sponsor.label.toLowerCase() + ')</div>' : '');
return '<div class="darkbox"><div class="mut" style="font-size:12px">PRE-SEASON · ' + H.yearName(S.year).toUpperCase() + '</div><h2 style="margin:6px 0">WELCOME, ' + esc(S.mgr.name.toUpperCase()) + '</h2>' +
'<div class="kv"><span>League</span><b>' + H.lgOf(uc.lg).name + '</b></div><div class="kv"><span>Board objective</span><b>' + esc(S.obj.text) + '</b></div><div class="kv"><span>Cup</span><b>' + esc(S.obj.cupText) + '</b></div>' + (S.obj.ccText ? '<div class="kv"><span>Champions Cup</span><b>' + esc(S.obj.ccText) + '</b></div>' : '') +
'<div class="kv"><span>Squad rating</span><b>' + H.userEval(G).vector.rating + '</b></div><div class="kv"><span>Transfer window</span><b style="color:var(--acc)">Open</b></div>' + offers +
'<button class="btn full" data-act="startseason" style="margin-top:8px">▶ START THE SEASON</button><p class="mut" style="font-size:12px;margin-top:6px">Prepare in Squad, Transfers and the menu first. The window is open now, in weeks 1-4 and in weeks 20-24.</p></div>';
}
function matchBox(fx, i, show) {
var home = fx.h === S.uid, ch = S.clubs[fx.h], ca = S.clubs[fx.a], uc = H.userClub(G);
var p1 = H.position(G, ch.lg, ch.id), p2 = H.position(G, ca.lg, ca.id);
return '<div class="darkbox c"><h2 style="margin:0">NEXT MATCH</h2><div class="mut" style="font-size:13px">' + dateOf(S.week) + '</div>' +
'<div class="mrow"><div><div class="bigcr">' + cr(ch, 74) + '</div><div class="pp">' + H.ord(p1) + '</div><b>' + esc(ch.name.toUpperCase()) + '</b><div class="forms">' + formHTML(ch.id) + '</div></div><div class="cmp">' + esc(fx.name.split(' · ')[0].toUpperCase()) + '</div><div><div class="bigcr">' + cr(ca, 74) + '</div><div class="pp">' + H.ord(p2) + '</div><b>' + esc(ca.name.toUpperCase()) + '</b><div class="forms">' + formHTML(ca.id) + '</div></div></div>' +
'<div class="mut" style="font-size:12px;margin:8px 0">' + esc(fx.name) + ' · ratings ' + Math.round(ch.str) + ' v ' + Math.round(ca.str) + '</div>' +
'<div class="grid2"><button class="btn" data-act="play" data-v="' + i + '">▶ PLAY</button><button class="btn ghost" data-act="simm" data-v="' + i + '">⏩ SIM</button></div></div>';
}
function homeWeek(uc) {
var pend = H.pending(G), win = H.windowOpen(G), h = '';
h += '<div class="strip"><b>WEEK ' + S.week + ' OF ' + H.LAST_WEEK + '</b><span class="pill ' + (win ? 'ok' : 'bad') + '">' + (win ? 'WINDOW OPEN' : 'WINDOW CLOSED') + '</span></div>';
pend.forEach(function (fx, i) { h += matchBox(fx, i); });
if (!pend.length) {
var nextFx = nextUserFixture();
h += '<div class="darkbox c"><h2 style="margin:0">NO MATCH THIS WEEK</h2>' + (nextFx ? '<div class="mut" style="font-size:13px;margin:6px 0 10px">Next: ' + esc(nextFx) + '</div>' : '') + '<button class="btn full big" data-act="advance">ADVANCE</button></div>';
}
return h;
}
function nextUserFixture() {
var lg = H.userClub(G).lg, L = S.lg[lg];
for (var w = S.week + 1; w <= L.rounds.length; w++) {
var f = L.rounds[w - 1].filter(function (x) { return x[0] === S.uid || x[1] === S.uid; })[0];
if (f) return 'Week ' + w + ' · ' + S.clubs[f[0]].name + ' vs ' + S.clubs[f[1]].name;
}
return '';
}
function injuredPanel() {
var bad = H.userCards(G).filter(function (p) { return p.inj || p.sus; });
if (!bad.length) return '';
return '<div class="darkbox"><b>UNAVAILABLE (' + bad.length + ')</b>' + bad.slice(0, 6).map(function (p) { return '<div class="kv"><span>' + esc(p.n) + ' <span class="mut">' + p.pos + '</span></span><span>' + (p.inj ? '🤕 ' + p.inj + 'w' : '🟥 ' + p.sus + 'w') + '</span></div>'; }).join('') + '</div>';
}

/* ---------- inbox ---------- */
function viewInbox() {
S.unread = 0;
var exp = H.userCards(G).filter(function (p) { return p.ct <= 1; }).map(function (p) { return '<div class="msg off" data-act="pl" data-id="' + p.id + '"><b>⚠ CONTRACT</b> ' + esc(p.n) + ' is out of contract at the end of this season. Renew or lose him.</div>'; }).join('');
var off = S.offers.map(function (o) { var p = G.P[o.pid]; return p ? '<div class="msg off" data-act="pl" data-id="' + p.id + '"><b>📩 OFFER</b> ' + esc(cname(o.from)) + ' bid ' + fm(o.fee) + ' for ' + esc(p.n) + '</div>' : ''; }).join('');
var items = S.news.map(function (n) { return '<div class="msg ' + n.k + '"><small>' + (n.w ? 'Week ' + n.w + ' · ' : '') + H.yearName(n.y) + '</small>' + esc(n.t) + '</div>'; }).join('');
setTimeout(chrome, 0);
return '<h2>INBOX</h2>' + exp + off + (items || '<div class="darkbox mut">No messages yet.</div>');
}

/* ---------- squad ---------- */
var sqMode = 'list', sqSort = 'ovr', sqFilter = 'all';
var POSC = { G: 'pg', D: 'pd', M: 'pm', A: 'pa' };
function viewSquad() {
var e = H.userEval(G);
var btns = '<div class="obtns"><button class="btn" data-act="sqm" data-v="list">SQUAD</button><button class="btn" data-act="sqm" data-v="pitch">LINEUP</button><button class="btn" data-act="sqm" data-v="tac">TACTICS</button><button class="btn" data-act="sqm" data-v="report">REPORT</button></div>';
var hd = '<div class="squadhd"><b>SQUAD</b><small>MAX SQUAD SIZE 38 - ' + H.userCards(G).length + ' UNDER CONTRACT</small></div>';
if (sqMode === 'pitch') return hd + pitchView(e) + btns;
if (sqMode === 'tac') return hd + tacticsView() + btns;
if (sqMode === 'report') return hd + reportView() + btns;
return hd + squadList() + '<div class="tabs3"><button data-act="sqf" data-v="all" class="' + (sqFilter === 'all' ? 'on' : '') + '">ALL</button><button data-act="sqf" data-v="first" class="' + (sqFilter === 'first' ? 'on' : '') + '">1ST TEAM SQUAD</button><button data-act="sqf" data-v="u21" class="' + (sqFilter === 'u21' ? 'on' : '') + '">U21 SQUAD</button><button data-act="srtn">☰</button></div>' + btns;
}
function pitchView(e) {
var f = H.FORMATIONS[S.formation];
var slots = f.map(function (s, i) {
var r = e.rows[i], c = r.card, chem = '';
if (c) chem = '<div class="chem">' + [1, 2, 3].map(function (k) { return '<i class="' + (r.chem >= k ? 'on' : '') + '"></i>'; }).join('') + '</div>';
return '<div class="slot" data-act="slot" data-v="' + i + '" style="left:' + s[1] + '%;top:' + s[2] + '%">' + cardHTML(c, { ovr: c ? r.eff : '', pos: s[0], pen: c && r.pen > 0 }) + chem + (c ? '<i class="suit ' + (r.pen === 0 ? 'g' : r.pen <= 8 ? 'a' : 'r') + '"></i>' : '') + '</div>';
}).join('');
var bench = S.bench.map(function (id, i) { return '<div data-act="bslot" data-v="' + i + '">' + cardHTML(G.P[id]) + '</div>'; }).join('');
for (var k = S.bench.length; k < 9; k++) bench += '<div data-act="bslot" data-v="' + k + '">' + cardHTML(null, { pos: 'SUB' }) + '</div>';
return '<div class="row" style="margin:8px 0"><div class="sp"><b style="font-size:20px">' + e.vector.rating + '</b> <span class="mut">rating</span> &nbsp; <b style="font-size:20px">' + e.chemistry + '%</b> <span class="mut">chemistry</span></div><button class="btn sm ghost" data-act="auto">AUTO PICK</button></div>' +
'<div class="seg" style="overflow-x:auto">' + Object.keys(H.FORMATIONS).map(function (k) { return '<button data-act="form" data-v="' + k + '" class="' + (k === S.formation ? 'on' : '') + '" style="min-width:64px">' + k + '</button>'; }).join('') + '</div>' +
'<div class="pitch">' + slots + '</div><h3>Substitutes (5 can come on)</h3><div class="bench">' + bench + '</div>' +
'<p class="mut" style="font-size:12px">Red border = out of position. Circle on a card: green = natural position, amber = close, red = poor fit. Dots under a card = team spirit from neighbours of the same nation. Red dot = injured, amber = tired, black = banned.</p>';
}
function tacticsView() {
var seg = function (key, arr, label) { return '<div class="mut" style="font-size:12px;margin:8px 0 3px">' + label + '</div><div class="seg">' + arr.map(function (v) { return '<button data-act="tac" data-k="' + key + '" data-v="' + v + '" class="' + (S[key] === v ? 'on' : '') + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '</div>'; };
var tr = ['Light', 'Normal', 'Intense'];
return '<div class="darkbox">' + seg('mentality', H.MENTALITY, 'Mentality') + seg('style', H.STYLE, 'Philosophy / style of play') + seg('press', H.PRESS, 'Pressing (high press tires the team late on)') +
'<div class="mut" style="font-size:12px;margin:8px 0 3px">Training intensity</div><div class="seg">' + tr.map(function (t, i) { return '<button data-act="trn" data-v="' + (i + 1) + '" class="' + (S.train === i + 1 ? 'on' : '') + '">' + t + '</button>'; }).join('') + '</div>' +
'<p class="mut" style="font-size:12px">Possession: pass it around. Counter: sit deep then hit fast. Direct: long balls. Intense training grows young players faster but tires everyone and raises injury risk.</p></div>';
}
function reportView() {
return '<div class="darkbox" style="padding:6px">' + H.squadReport(G).map(function (r) { return '<div class="rep"><i class="dotc ' + r.c + '"></i><span>' + esc(r.t) + '</span></div>'; }).join('') + '</div>';
}
function squadList() {
var nums = H.shirtNumbers(G);
var all = H.userCards(G).slice().sort(function (a, b) { return sqSort === 'ovr' ? b.o - a.o : sqSort === 'age' ? a.a - b.a : sqSort === 'pot' ? b.p - a.p : sqSort === 'val' ? b.v - a.v : (H.GROUP[a.pos] < H.GROUP[b.pos] ? -1 : H.GROUP[a.pos] > H.GROUP[b.pos] ? 1 : 0) || b.o - a.o; });
var first = all.slice().sort(function (a, b) { return b.o - a.o; }).slice(0, 22).map(function (p) { return p.id; });
var list = all.filter(function (p) { return sqFilter === 'all' || (sqFilter === 'u21' ? p.a <= 21 : first.indexOf(p.id) >= 0); });
if (!list.length) return '<div class="darkbox mut">No players here.</div>';
return '<div class="sqlist">' + list.map(function (p) {
var sh = H.sharpness(p), inXI = S.slots.indexOf(p.id) >= 0, avgR = p.rn ? (p.rs / p.rn) : 0, tr = inXI ? 1 : (first.indexOf(p.id) >= 0 || S.bench.indexOf(p.id) >= 0) ? 2 : 3;
return '<div class="sq" data-act="pl" data-id="' + p.id + '"><div class="sq1"><div class="sqn"><b>' + nums[p.id] + '</b><span class="ptag ' + POSC[H.GROUP[p.pos]] + '">' + p.pos + '</span></div><div class="sqf">' + face(p, 72) + '</div>' +
'<div class="sqm"><b class="nmx">' + esc(p.n.split(' ')[0].charAt(0) + '.' + last(p.n).toUpperCase()) + '</b><small>' + p.a + ', ' + esc(p.nat) + '</small><div class="shp"><div class="bar3"><i class="' + sh[1] + '" style="width:' + Math.max(8, p.ft) + '%"></i></div><span>⚡ ' + (p.inj ? 'Injured (' + p.inj + 'w)' : p.sus ? 'Suspended' : sh[0]) + '</span></div></div>' +
'<div class="sqr"><span class="mood">' + H.mood(p) + '</span><span class="gold">' + p.o + '</span></div></div>' +
'<div class="sq2"><span class="phl tier t' + tr + '">' + (tr === 1 ? 'TIER 1 · XI' : tr === 2 ? 'TIER 2 · BACKUP' : p.a <= 21 ? 'TIER 3 · YOUTH' : 'TIER 3 · RESERVE') + '</span><b>P' + p.ap + '</b><span>⚽ ' + p.g + '</span><span>🅰 ' + p.as + '</span><span class="yc">' + (p.yc ? p.yc : 0) + '</span><span class="rc">' + (p.sus ? 1 : 0) + '</span><span class="avr ' + (avgR >= 7 ? 'hi' : avgR >= 6.3 ? 'mid' : avgR ? 'lo' : '') + '">' + (avgR ? avgR.toFixed(2) : '-') + '</span></div></div>';
}).join('') + '</div>';
}
function openPicker(kind, idx) {
var slotPos = kind === 'p' ? H.FORMATIONS[S.formation][idx][0] : null;
var curId = kind === 'p' ? S.slots[idx] : S.bench[idx];
var list = H.userCards(G).filter(function (c) { return c.id !== curId; });
list.sort(function (a, b) {
var ua = H.available(a) ? 0 : 1, ub = H.available(b) ? 0 : 1; if (ua !== ub) return ua - ub;
var va = slotPos ? H.eff(a) - H.penalty(slotPos, a.pos) : H.eff(a), vb = slotPos ? H.eff(b) - H.penalty(slotPos, b.pos) : H.eff(b);
return vb - va;
});
var html = '<h2>' + (kind === 'p' ? 'Choose a ' + slotPos : 'Choose a substitute') + '</h2><div class="list">' + list.map(function (c) {
var pen = slotPos ? H.penalty(slotPos, c.pos) : 0, where = S.slots.indexOf(c.id) >= 0 ? 'Starting XI' : S.bench.indexOf(c.id) >= 0 ? 'Bench' : '';
return '<div class="it" data-act="pick" data-id="' + c.id + '">' + cardHTML(c) + '<div class="t"><b>' + esc(c.n) + '</b><small>' + c.pos + ' · fit ' + c.ft + '% · ' + (where || '') + ' ' + (c.inj ? '🤕 ' + c.inj + 'w' : c.sus ? '🟥' : '') + '</small></div><div class="c"><b style="font-size:17px;color:' + (pen ? 'var(--bad)' : 'var(--acc)') + '">' + (H.eff(c) - pen) + '</b><div class="mut" style="font-size:10px">' + (pen ? '-' + pen + ' off pos.' : 'fits') + '</div></div></div>';
}).join('') + '</div>' + (curId ? '<button class="btn ghost full" data-act="clear">Take out</button>' : '');
var d = openLayer(html, 'sheet');
d.addEventListener('click', function (ev) {
var t = ev.target.closest('[data-act]'); if (!t) return;
if (t.dataset.act === 'pick') { place(kind, idx, +t.dataset.id); closeLayer(); render(); }
if (t.dataset.act === 'clear') { if (kind === 'p') S.slots[idx] = null; else S.bench.splice(idx, 1); save(); closeLayer(); render(); }
});
}
function place(kind, idx, id) {
var curId = kind === 'p' ? S.slots[idx] : S.bench[idx];
var si = S.slots.indexOf(id), bi = S.bench.indexOf(id);
if (si >= 0) S.slots[si] = curId || null;
else if (bi >= 0) { if (curId) S.bench[bi] = curId; else S.bench.splice(bi, 1); }
if (kind === 'p') S.slots[idx] = id;
else { if (idx >= S.bench.length) S.bench.push(id); else S.bench[idx] = id; }
S.bench = S.bench.filter(function (x, i, a) { return a.indexOf(x) === i && S.slots.indexOf(x) < 0; });
save(); toast('Squad updated');
}

/* ---------- player sheet ---------- */
function openPlayer(id) {
var p = G.P[id]; if (!p) return;
var mine = p.cl === S.uid, labels = H.statLabels(p.pos), st = H.statsOf(p);
var offer = S.offers.filter(function (o) { return o.pid === p.id; })[0];
var html = '<div class="row" style="align-items:flex-start;gap:14px"><div class="bigav" data-x="photo">' + face(p, 200) + '</div><div class="sp"><h2 style="margin:0">' + esc(p.n) + '</h2><div class="mut">' + p.pos + ' · ' + H.flag(p) + ' ' + esc(p.nat) + '<br>' + (p.cl != null ? esc(S.clubs[p.cl].name) : 'Free agent') + ' · age ' + p.a + '</div>' + statusPill(p) + (p.lst ? '<span class="pill warn">Transfer listed</span>' : '') + '</div></div>' +
'<div class="grid2" style="margin:12px 0">' + st.map(function (v, i) { return '<div class="stat"><b>' + v + '</b><span>' + labels[i] + '</span></div>'; }).join('') + '</div>' +
'<div class="panel"><div class="kv"><span>Rating / potential</span><b>' + p.o + ' / ' + p.p + '</b></div><div class="kv"><span>Market value</span><b>' + fm(p.v) + '</b></div><div class="kv"><span>Wage</span><b>' + fm(p.w) + ' / week</b></div><div class="kv"><span>Contract</span><b>' + (p.cl == null ? '-' : p.ct + ' season' + (p.ct === 1 ? '' : 's')) + '</b></div>' +
(mine ? '<div class="kv"><span>Fitness · Morale</span><b>' + p.ft + '% · ' + p.mo + '</b></div>' : '') +
'<div class="kv"><span>This season</span><b>' + p.ap + ' apps · ' + p.g + ' goals · ' + p.as + ' assists</b></div>' + (p.rn ? '<div class="kv"><span>Average rating</span><b>' + (p.rs / p.rn).toFixed(1) + '</b></div>' : '') + '</div>';
if (mine) {
html += (offer ? '<div class="warn">' + esc(cname(offer.from)) + ' offer ' + fm(offer.fee) + '.</div><div class="grid2"><button class="btn" data-x="accept">Accept offer</button><button class="btn ghost" data-x="decline">Decline</button></div>' : '') +
'<div class="grid2" style="margin-top:8px"><button class="btn" data-x="renew">Renew contract</button><button class="btn ghost" data-x="list">' + (p.lst ? 'Remove from list' : 'Transfer list') + '</button></div>' +
'<div class="grid2" style="margin-top:8px"><button class="btn ghost" data-x="rename">Rename</button><button class="btn ghost" data-x="photo">Add photo</button></div><button class="btn red full" style="margin-top:8px" data-x="release">Release</button>';
} else {
html += '<button class="btn ghost full" style="margin-bottom:8px" data-x="short">' + ((S.short || []).indexOf(p.id) >= 0 ? '👍 ON SHORTLIST (tap to remove)' : '👍 ADD TO SHORTLIST') + '</button><button class="btn full" data-x="bid">' + (p.cl == null ? 'Sign free agent' : 'Make an offer') + '</button><button class="btn ghost full" style="margin-top:8px" data-x="rename">Rename player</button>';
}
var d = openLayer(html, 'sheet');
d.addEventListener('click', function (e) {
var b = e.target.closest('[data-x]'); if (!b) return; var x = b.dataset.x;
if (x === 'accept') { var er = H.sellPlayer(G, p.id, offer.fee, offer.from); if (er) return toast(er); S.offers = S.offers.filter(function (o) { return o !== offer; }); save(); closeLayer(); render(); toast('Sold for ' + fm(offer.fee)); }
else if (x === 'decline') { S.offers = S.offers.filter(function (o) { return o !== offer; }); save(); closeLayer(); render(); }
else if (x === 'list') { p.lst = !p.lst; save(); closeLayer(); render(); toast(p.lst ? 'Listed for transfer. Offers will come.' : 'Removed from list'); }
else if (x === 'release') confirmBox('Release ' + p.n + '?', 'Pay-off: ' + fm(H.releaseCost(p)) + '. He leaves for free.', function () { var er = H.releasePlayer(G, p.id); if (er) return toast(er); save(); closeAll(); render(); toast('Released'); });
else if (x === 'renew') { closeLayer(); renewSheet(p); }
else if (x === 'bid') { closeLayer(); bidSheet(p); }
else if (x === 'short') { H.toggleShort(G, p.id); save(); closeLayer(); render(); toast('Shortlist updated'); }
else if (x === 'rename') { closeLayer(); renameSheet('player', p); }
else if (x === 'photo') pickPhoto(function (url) { p.img = url; save(); closeLayer(); render(); toast('Photo saved'); });
});
}
/* choose a picture from the phone, shrink it to a small square and keep it with the save */
function pickPhoto(done) {
var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
inp.onchange = function () {
var f = inp.files && inp.files[0]; if (!f) return;
var rd = new FileReader();
rd.onload = function () {
var im = new Image();
im.onload = function () {
var c = document.createElement('canvas'), n = 112; c.width = n; c.height = n;
var sz = Math.min(im.width, im.height), sx = (im.width - sz) / 2, sy = (im.height - sz) / 4;
c.getContext('2d').drawImage(im, sx, Math.max(0, sy), sz, sz, 0, 0, n, n);
done(c.toDataURL('image/jpeg', 0.75));
};
im.onerror = function () { toast('Could not read that picture'); };
im.src = rd.result;
};
rd.readAsDataURL(f);
};
inp.click();
}
function confirmBox(title, text, yes) {
var d = openLayer('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="grid2"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="yes">Yes</button></div>', 'sheet');
d.addEventListener('click', function (e) { var b = e.target.closest('[data-x]'); if (!b) return; closeLayer(); if (b.dataset.x === 'yes') yes(); });
}
function renameSheet(kind, obj) {
var cur = kind === 'player' ? obj.n : obj.name;
var d = openLayer('<h2>Rename</h2><p class="mut" style="font-size:13px">Use this to correct a name or put in any name you like.</p><input id="rn" type="text" maxlength="28" value="' + esc(cur) + '"><div class="grid2" style="margin-top:10px"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="ok">Save</button></div>', 'sheet');
d.addEventListener('click', function (e) {
var b = e.target.closest('[data-x]'); if (!b) return;
if (b.dataset.x === 'ok') { var v = d.querySelector('#rn').value.trim(); if (v.length < 2) return toast('Name is too short'); if (kind === 'player') obj.n = v; else obj.name = v; save(); toast('Renamed'); }
closeLayer(); render();
});
}
function renewSheet(p) {
var a = H.renewAsk(G, p);
var d = openLayer('<h2>Renew ' + esc(p.n) + '</h2>' + (a.refuse ? '<p>' + esc(a.refuse) + '</p><button class="btn full" data-x="no">Close</button>' : '<p class="mut">He asks for ' + fm(a.wage) + ' a week (now ' + fm(p.w) + ').</p><div class="mut" style="font-size:12px">Wage per week (€M)</div><input id="wg" type="number" step="0.001" value="' + a.wage.toFixed(4) + '"><div class="mut" style="font-size:12px;margin-top:8px">Years</div><div class="seg" id="yrs">' + [1, 2, 3, 4, 5].map(function (y) { return '<button data-y="' + y + '" class="' + (y === 3 ? 'on' : '') + '">' + y + '</button>'; }).join('') + '</div><div class="grid2"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="ok">Offer</button></div>'), 'sheet'), yrs = 3;
d.addEventListener('click', function (e) {
var y = e.target.closest('[data-y]'); if (y) { yrs = +y.dataset.y; d.querySelectorAll('[data-y]').forEach(function (b) { b.classList.toggle('on', b === y); }); return; }
var b = e.target.closest('[data-x]'); if (!b) return;
if (b.dataset.x === 'ok') { var er = H.renewPlayer(G, p.id, parseFloat(d.querySelector('#wg').value) || 0, yrs); if (er) return toast(er); save(); closeLayer(); render(); return toast('Contract renewed'); }
closeLayer();
});
}

/* ---------- market ---------- */
var mk = { q: '', pos: 'all', lg: 'all', fa: false, sort: 'ovr', young: false, sec: 'scout', minO: 0 };
function viewMarket() {
var win = H.windowOpen(G);
var head = '<div class="strip"><b>TRANSFERS</b><span class="pill ' + (win ? 'ok' : 'bad') + '">' + (win ? 'WINDOW OPEN' : 'WINDOW CLOSED') + '</span></div>' +
'<div class="tabs2">' + [['scout', 'Scout hub'], ['search', 'Market'], ['short', 'Shortlist'], ['hist', 'History'], ['offers', 'Offers (' + S.offers.length + ')']].map(function (x) { return '<button data-act="msec" data-v="' + x[0] + '" class="' + (mk.sec === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
if (mk.sec === 'scout') {
var sc = [['head', 'HEAD SCOUT', 'Best players in the world', 1, 'Brazil'], ['over', 'OVERSEAS SCOUT', 'Stars from other leagues', 2, 'Argentina'], ['youth', 'YOUTH SCOUT', 'Young talents with huge potential', 3, 'Netherlands']];
return head + sc.map(function (x) { return '<div class="scoutrow" data-act="scout" data-v="' + x[0] + '"><div class="sfc">' + H.face({ id: 500 + x[3], n: 's', nat: x[4], a: 45 + x[3] * 3 }, 110, '#1a2740') + '<small>' + x[1] + '</small></div><div class="sp c"><div class="clip">🔎</div><b>TAP TO START NEW SEARCH</b><div class="mut" style="font-size:12px">' + x[2] + '</div></div></div>'; }).join('') +
'<div class="obtns"><button class="btn" data-act="msec" data-v="search">SEARCH BY NAME</button><button class="btn" data-act="msec" data-v="short">SHORTLISTED PLAYERS</button></div>';
}
if (mk.sec === 'offers') {
if (!S.offers.length) return head + '<div class="darkbox mut">No offers right now. Put a player on the transfer list and clubs will come.</div>';
return head + S.offers.map(function (o) { var p = G.P[o.pid]; return p ? '<div class="darkbox"><div class="mut" style="font-size:12px">' + esc(cname(o.from)) + ' offer ' + fm(o.fee) + '</div>' + playerRow(p, fm(o.fee), 'pl') + '</div>' : ''; }).join('');
}
if (mk.sec === 'short') {
var ids = (S.short || []).filter(function (id) { return G.P[id]; });
return head + (ids.length ? '<div class="sqlist">' + ids.map(function (id) { return mrow(G.P[id]); }).join('') + '</div>' : '<div class="darkbox mut">Your shortlist is empty. Open any player and tap the thumbs-up to add him.</div>');
}
if (mk.sec === 'hist') {
var xf = S.xf || [], tin = 0, tout = 0; xf.forEach(function (x) { if (x.d === 'in') tin += x.fee; else tout += x.fee; });
return head + (xf.length ? '<div class="sqlist">' + xf.map(function (x) {
return '<div class="xfr ' + (x.d === 'in' ? 'in' : 'out') + '"><div class="xo">' + x.o + '</div><span class="ptag ' + POSC[H.GROUP[x.pos]] + '">' + x.pos + '</span><b>' + esc(x.n.split(' ')[0].charAt(0) + '.' + last(x.n).toUpperCase()) + '</b><span class="xs">Week ' + x.w + ' · ' + (x.d === 'in' ? esc(cname(x.other)) + ' ➜ ' + esc(H.userClub(G).name) : esc(H.userClub(G).name) + ' ➜ ' + esc(cname(x.other))) + '</span><b class="xfee">' + (x.fee ? fm(x.fee) : 'FREE') + '</b></div>';
}).join('') + '</div>' : '<div class="darkbox mut">No transfers yet.</div>') + '<div class="three"><div class="whitebox"><b>' + fm(tout) + '</b><div class="cap">Transfers out</div></div><div class="whitebox"><b>' + fm(tin) + '</b><div class="cap">Transfer in</div></div><div class="whitebox"><b class="' + (tout - tin >= 0 ? 'gn' : 'rd3') + '">' + fm(tout - tin) + '</b><div class="cap">Profit/Loss</div></div></div>';
}
var res = H.searchPlayers(G, { q: mk.q, pos: mk.pos, lg: mk.lg, fa: mk.fa, sort: mk.sort, maxA: mk.young ? 21 : null, minO: mk.minO, limit: 40 });
return head + '<input id="mq" type="text" placeholder="Search player or club" value="' + esc(mk.q) + '">' +
'<div class="tabs2" style="margin-top:8px">' + [['all', 'All'], ['G', 'GK'], ['D', 'DEF'], ['M', 'MID'], ['A', 'ATT']].map(function (x) { return '<button data-act="mpos" data-v="' + x[0] + '" class="' + (mk.pos === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
'<div class="tabs2"><button data-act="mlg" data-v="all" class="' + (mk.lg === 'all' ? 'on' : '') + '">All leagues</button>' + H.LEAGUES.map(function (l) { return '<button data-act="mlg" data-v="' + l.id + '" class="' + (mk.lg === l.id ? 'on' : '') + '">' + l.flag + '</button>'; }).join('') + '</div>' +
'<div class="tabs2"><button data-act="mfa" class="' + (mk.fa ? 'on' : '') + '">Free agents</button><button data-act="myoung" class="' + (mk.young ? 'on' : '') + '">Under 22</button>' + [['ovr', 'Rating'], ['pot', 'Potential'], ['val', 'Value']].map(function (x) { return '<button data-act="msort" data-v="' + x[0] + '" class="' + (mk.sort === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
(res.length ? '<div class="sqlist">' + res.map(mrow).join('') + '</div>' : '<div class="darkbox mut">No players match.</div>');
}
/* a player row in the FCM style for the market */
function mrow(p) {
var c = p.cl != null ? S.clubs[p.cl] : null, st = p.cl == null ? '<div class="ok2">FREE AGENT</div>' : (p.cl === S.uid ? '<div class="ok2">YOUR PLAYER</div>' : '<div class="' + (H.askPrice(G, p) > 0 && p.cl != null ? 'ok2' : 'ns') + '">' + (H.windowOpen(G) ? 'Under Contract' : 'Window closed') + '</div>');
return '<div class="mk" data-act="pl" data-id="' + p.id + '"><div class="sqf">' + face(p, 72) + '</div><div class="mkm"><b class="nmx">' + esc(p.n.split(' ')[0].charAt(0) + '.' + last(p.n).toUpperCase()) + '</b><div class="mk2"><span class="ptag ' + POSC[H.GROUP[p.pos]] + '">' + p.pos + '</span><small>' + p.a + ', ' + esc(p.nat) + '</small></div><div class="mk3"><span>🔎 ' + fm(p.v) + '</span><span>🖐 ' + fm(p.w) + '</span><span>📄 ' + (S.year + Math.max(0, p.ct)) + '</span></div></div><div class="mkr"><div class="clubn">' + (c ? crestSmall(c) + esc(c.name.toUpperCase()) : 'FREE AGENT') + '</div><span class="gold">' + p.o + '</span>' + (S.short && S.short.indexOf(p.id) >= 0 ? '<span class="thumb">👍</span>' : '') + '</div>' + st + '</div>';
}
function crestSmall(c) { return '<span class="crestw">' + cr(c, 14) + '</span>'; }
function bidSheet(p) {
var uc = H.userClub(G), ask = H.askPrice(G, p), free = p.cl == null;
var d = openLayer('<h2>' + (free ? 'Sign ' : 'Offer for ') + esc(p.n) + '</h2><div class="mut" style="margin-bottom:8px">' + (free ? 'Free agent' : esc(cname(p.cl)) + ' value ' + fm(p.v)) + ' · your cash ' + fm(uc.cash) + '</div>' +
(free ? '' : '<div class="mut" style="font-size:12px">Transfer fee (€M)</div><input id="fee" type="number" step="0.1" min="0" value="' + (ask).toFixed(2) + '">') +
'<div class="grid2" style="margin-top:10px"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="ok">' + (free ? 'Talk contract' : 'Send offer') + '</button></div><p class="mut" style="font-size:12px">' + (H.windowOpen(G) ? '' : 'The window is closed: only free agents can be signed.') + '</p>', 'sheet');
d.addEventListener('click', function (e) {
var b = e.target.closest('[data-x]'); if (!b) return;
if (b.dataset.x === 'no') return closeLayer();
var fee = free ? 0 : Math.max(0, parseFloat(d.querySelector('#fee').value) || 0);
var r = H.bid(G, p.id, fee);
if (!r.ok) { toast(r.msg); return; }
closeLayer(); contractSheet(p, fee);
});
}
function contractSheet(p, fee) {
var uc = H.userClub(G), a = H.contractAsk(G, p, uc);
var d = openLayer('<h2>Contract for ' + esc(p.n) + '</h2>' + (a.refuse ? '<p>' + esc(a.refuse) + '</p><button class="btn full" data-x="no">Close</button>' : '<p class="mut">Fee ' + (fee ? fm(fee) : 'free') + '. He asks ' + fm(a.wage) + ' a week.</p><div class="mut" style="font-size:12px">Wage per week (€M)</div><input id="wg" type="number" step="0.001" value="' + a.wage.toFixed(4) + '"><div class="mut" style="font-size:12px;margin-top:8px">Years</div><div class="seg">' + [1, 2, 3, 4, 5].map(function (y) { return '<button data-y="' + y + '" class="' + (y === 4 ? 'on' : '') + '">' + y + '</button>'; }).join('') + '</div><div class="grid2"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="ok">Sign him</button></div>'), 'sheet'), yrs = 4;
d.addEventListener('click', function (e) {
var y = e.target.closest('[data-y]'); if (y) { yrs = +y.dataset.y; d.querySelectorAll('[data-y]').forEach(function (bb) { bb.classList.toggle('on', bb === y); }); return; }
var b = e.target.closest('[data-x]'); if (!b) return;
if (b.dataset.x === 'ok') { var er = H.signPlayer(G, p.id, fee, parseFloat(d.querySelector('#wg').value) || 0, yrs); if (er) return toast(er); save(); closeLayer(); render(); toast(p.n + ' has joined ' + uc.name + '!'); return; }
closeLayer();
});
}

/* ---------- compete ---------- */
var cp = { sec: 'league', lg: null, cupLg: null };
function viewComp() {
var uc = H.userClub(G); cp.lg = cp.lg || uc.lg;
var head = '<div class="tabs2">' + [['league', 'League'], ['fix', 'Fixtures'], ['cup', 'Cup'], ['cc', 'Champions Cup'], ['stats', 'Stats'], ['hist', 'History']].map(function (x) { return '<button data-act="csec" data-v="' + x[0] + '" class="' + (cp.sec === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
if (cp.sec === 'league') return head + leagueView();
if (cp.sec === 'fix') return head + fixturesView(uc);
if (cp.sec === 'cup') return head + cupView(uc);
if (cp.sec === 'cc') return head + ccView(uc);
if (cp.sec === 'stats') return head + statsView();
return head + histView();
}
function lgPick() { return '<div class="lg-pick">' + H.LEAGUES.map(function (l) { return '<button class="btn sm ' + (cp.lg === l.id ? '' : 'ghost') + '" data-act="clg" data-v="' + l.id + '">' + l.flag + ' ' + l.name.replace(' Premier League', ' PL') + '</button>'; }).join('') + '</div>'; }
function leagueView() {
var t = H.table(G, cp.lg), n = t.length, lg = H.lgOf(cp.lg);
var rows = t.map(function (r, i) {
var z = i < 4 ? ' style="box-shadow:inset 3px 0 #37d67a"' : i >= n - 3 ? ' style="box-shadow:inset 3px 0 #ff5c5c"' : '';
return '<tr class="' + (r.user ? 'me' : '') + '"' + z + '><td>' + (i + 1) + '</td><td><span class="crestw">' + cr(S.clubs[r.id], 16) + '</span>' + esc(r.name) + '</td><td>' + r.p + '</td><td>' + r.w + '-' + r.d + '-' + r.l + '</td><td>' + (r.gf - r.ga) + '</td><td><b>' + r.pts + '</b></td></tr>';
}).join('');
return lgPick() + '<div class="panel" style="padding:4px 8px"><table><thead><tr><th></th><th>' + lg.name + '</th><th>P</th><th>W-D-L</th><th>GD</th><th>Pts</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="mut" style="font-size:12px">Green edge: Champions Cup places in the top leagues. Red edge: bottom three.</p>';
}
function fixturesView(uc) {
var L = S.lg[uc.lg], out = [];
L.rounds.forEach(function (rd, w) { rd.forEach(function (f) { if (f[0] === S.uid || f[1] === S.uid) out.push({ w: w + 1, f: f }); }); });
return '<div class="panel">' + out.map(function (x) {
var f = x.f, done = f[2] >= 0, cur = x.w === S.week;
return '<div class="tie ' + (cur ? 'me' : '') + '"><span class="mut" style="width:30px">W' + x.w + '</span><span class="tm">' + esc(S.clubs[f[0]].name) + '</span><b>' + (done ? f[2] + ' - ' + f[3] : 'v') + '</b><span class="tm">' + esc(S.clubs[f[1]].name) + '</span></div>';
}).join('') + '</div>';
}
function cupView(uc) {
var cup = S.cup[cp.cupLg || uc.lg], h = '<div class="lg-pick">' + H.LEAGUES.map(function (l) { return '<button class="btn sm ' + ((cp.cupLg || uc.lg) === l.id ? '' : 'ghost') + '" data-act="ccupl" data-v="' + l.id + '">' + l.flag + '</button>'; }).join('') + '</div><h3>' + esc(cup.name) + '</h3>';
if (cup.winner != null) h += '<div class="panel c"><b>🏆 Winner: ' + esc(cname(cup.winner)) + '</b></div>';
var rounds = cup.hist.concat(cup.ties.length && cup.alive.length > 1 ? [cup.ties] : []);
if (!rounds.length) h += '<div class="panel mut">The first round is drawn in week ' + H.CUPW[0] + '.</div>';
rounds.slice().reverse().forEach(function (rd, ri) {
var idx = rounds.length - ri;
h += '<div class="panel"><b>Round ' + idx + '</b>' + rd.map(function (t) {
var me = t.h === S.uid || t.a === S.uid;
return t.a < 0 ? '<div class="tie"><span class="tm">' + esc(cname(t.h)) + '</span><b>bye</b><span class="tm"></span></div>' : '<div class="tie ' + (me ? 'me' : '') + '"><span class="tm">' + esc(cname(t.h)) + '</span><b>' + (t.g ? t.g[0] + ' - ' + t.g[1] : 'v') + '</b><span class="tm">' + esc(cname(t.a)) + '</span></div>' + (t.pen ? '<div class="mut c" style="font-size:11px">pens ' + t.pen[0] + '-' + t.pen[1] + '</div>' : '');
}).join('') + '</div>';
});
return h;
}
function ccView() {
var cc = S.cc, h = '<h3>Champions Cup ' + H.yearName(S.year) + '</h3>';
if (cc.winner != null) h += '<div class="panel c"><b>🏆 Winner: ' + esc(cname(cc.winner)) + '</b></div>';
h += '<div class="panel"><b>Teams</b><div class="mut" style="font-size:13px;margin-top:4px">' + cc.teams.map(function (id) { return id === S.uid ? '<b style="color:var(--acc2)">' + esc(cname(id)) + '</b>' : esc(cname(id)); }).join(' · ') + '</div></div>';
var rounds = cc.hist.concat(!cc.over && cc.ties.length && cc.drawn === cc.round ? [cc.ties] : []);
if (!rounds.length) h += '<div class="panel mut">The round of 16 is drawn in week ' + H.CCW[0][0] + '.</div>';
rounds.slice().reverse().forEach(function (rd, ri) {
var idx = rounds.length - 1 - ri;
h += '<div class="panel"><b>' + H.CCN[idx] + '</b>' + rd.map(function (t) {
var me = t.a === S.uid || t.b === S.uid, g1 = t.g[0], g2 = t.g[1], ga = (g1 ? g1[0] : 0) + (g2 ? g2[0] : 0), gb = (g1 ? g1[1] : 0) + (g2 ? g2[1] : 0);
var txt = (g1 || g2) ? ga + ' - ' + gb : 'v';
return '<div class="tie ' + (me ? 'me' : '') + '"><span class="tm">' + esc(cname(t.a)) + '</span><b>' + txt + '</b><span class="tm">' + esc(cname(t.b)) + '</span></div>' + (t.g[1] && t.g[0] ? '<div class="mut c" style="font-size:11px">leg 1: ' + g1[0] + '-' + g1[1] + ' · leg 2: ' + g2[1] + '-' + g2[0] + (t.pen ? ' · pens ' + t.pen[0] + '-' + t.pen[1] : '') + ' (home team first)</div>' : '');
}).join('') + '</div>';
});
return h;
}
function statsView() {
var ids = {}; H.lgClubs(G, cp.lg).forEach(function (c) { ids[c.id] = 1; });
var pl = S.players.filter(function (p) { return p.cl != null && ids[p.cl]; });
var sc = pl.slice().sort(function (a, b) { return b.g - a.g || b.as - a.as; }).slice(0, 10), as = pl.slice().sort(function (a, b) { return b.as - a.as || b.g - a.g; }).slice(0, 10);
var row = function (p, v) { return '<div class="kv" data-act="pl" data-id="' + p.id + '"><span>' + esc(p.n) + ' <span class="mut">' + esc(S.clubs[p.cl].name) + '</span></span><b>' + v + '</b></div>'; };
return lgPick() + '<div class="panel"><b>Top scorers</b>' + sc.map(function (p) { return row(p, p.g); }).join('') + '</div><div class="panel"><b>Most assists</b>' + as.map(function (p) { return row(p, p.as); }).join('') + '</div>';
}
function histView() {
if (!S.hist.length) return '<div class="panel mut">Your history will appear after your first season.</div>';
return S.hist.map(function (h) { return '<div class="panel"><b>' + H.yearName(h.y) + ' · ' + esc(h.club) + '</b><div class="kv"><span>' + esc(h.lg) + '</span><b>' + ord(h.pos) + ' of ' + h.n + '</b></div><div class="kv"><span>Champions</span><b>' + esc(h.champ) + '</b></div><div class="kv"><span>Cup winner</span><b>' + esc(h.cup || '-') + '</b></div><div class="kv"><span>Champions Cup</span><b>' + esc(h.cc || '-') + '</b></div><div class="kv"><span>Player of the year</span><b>' + esc(h.best || '-') + '</b></div><div class="kv"><span>Golden boot</span><b>' + esc(h.gold || '-') + '</b></div></div>'; }).join('');
}

/* ---------- club (menu pages) ---------- */
var cb = { sec: 'fin' };
var CBT = [['fin', 'Finances'], ['board', 'Board'], ['fac', 'Facilities'], ['events', 'Training events'], ['chal', 'Challenges'], ['ach', 'Achievements'], ['hist', 'History'], ['more', 'Game']];
function viewClub() {
var head = '<div class="tabs2">' + CBT.map(function (x) { return '<button data-act="cbs" data-v="' + x[0] + '" class="' + (cb.sec === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
var uc = H.userClub(G);
var v = { fin: finView, board: boardView, fac: facView, events: eventsView, chal: chalView, ach: achView, hist: histView, more: moreView }[cb.sec] || finView;
return head + v(uc);
}
function arrow(now, prev) { return prev == null ? '' : (now >= prev ? '<i class="ar up">▲</i>' : '<i class="ar dn">▼</i>'); }
function finView(uc) {
var t = S.tot, p = S.prevTot, inc = t.inc.gate + t.inc.tv + t.inc.spons + t.inc.comm + t.inc.prize, exp = t.exp.wages + t.exp.upkeep + t.exp.build;
var pInc = p ? p.inc.gate + p.inc.tv + p.inc.spons + p.inc.comm + p.inc.prize : null, pExp = p ? p.exp.wages + p.exp.upkeep + p.exp.build : null;
var row = function (n, a, b) { return '<div class="frow"><span>' + n + '</span><div class="fr"><b>' + fm(a) + '</b>' + (b != null ? '<small>Previous year ' + fm(b) + '</small>' : '') + '</div>' + arrow(a, b) + '</div>'; };
var cap = Math.round(H.stadiumCap(uc) * 1000), att = Math.round(cap * H.attendance(G, uc));
var pr = H.projection(G), ratio = inc > 0 ? Math.round(t.exp.wages / inc * 100) : 0;
return '<div class="stad"><div class="sthd"><div class="cr2">' + cr(uc, 36) + '</div><div class="sp"><b>' + esc(uc.name.toUpperCase()) + '</b><small>Stadium level ' + uc.fac[0] + '</small></div><div class="ticket">£' + Math.round(H.ticketPrice(uc)) + '</div></div><div class="stg"><div><small>CAPACITY</small><b>' + cap.toLocaleString('en-US') + '</b></div><div><small>AVERAGE ATTENDANCE</small><b>' + att.toLocaleString('en-US') + '</b></div></div></div>' +
'<div class="frows">' + row('Revenues', inc, pInc) + row('Profit/Loss', inc - exp, p ? pInc - pExp : null) + row('Annual sponsorship', t.inc.spons, p ? p.inc.spons : null) + row('Annual TV money', t.inc.tv, p ? p.inc.tv : null) + row('Competition income', t.inc.prize, p ? p.inc.prize : null) + row('Gate receipts', t.inc.gate, p ? p.inc.gate : null) + row('Merchandise and commercial', t.inc.comm, p ? p.inc.comm : null) + row('Player wages', t.exp.wages, p ? p.exp.wages : null) + row('Transfer dealings', t.inc.sales - t.exp.buys, p ? p.inc.sales - p.exp.buys : null) + '</div>' +
'<div class="two"><div class="whitebox"><small>FINANCIAL HEALTH</small><b class="' + (uc.cash > 0 && pr.profit >= 0 ? 'gn' : uc.cash > 0 ? 'or' : 'rd3') + '">' + (uc.cash > 0 && pr.profit >= 0 ? 'VERY GOOD' : uc.cash > 0 ? 'OK' : 'POOR') + '</b></div><div class="whitebox"><small>FINANCIAL FAIR PLAY</small><b>' + ratio + '%</b><small>Wages to income</small></div></div>' +
'<div class="two"><div class="whitebox"><small>AVAILABLE FUNDS</small><b class="gn">' + fm(uc.cash) + '</b></div><div class="whitebox"><small>BANK BALANCE</small><b class="gn">' + fm(uc.cash) + '</b></div></div>' +
'<div class="obtns"><button class="btn" data-act="spsheet">SPONSORSHIP</button><button class="btn" data-act="plsheet">PROFIT/LOSS</button><button class="btn" data-act="budsheet">BUDGETS</button></div>';
}
function boardView(uc) {
var tg = H.targets(G), c = Math.round(S.board.conf), f = Math.round(S.fanC);
return '<div class="clubhd"><div class="cr2">' + cr(uc, 34) + '</div><b class="sp">' + esc(uc.name) + '<small style="display:block;color:#4b5b7a">BOARD OF DIRECTORS</small></b><span class="gold">' + Math.round(uc.rep) + '</span></div>' +
'<div class="reln"><b>RELATIONSHIPS</b><div class="rels"><div><div class="rf">' + H.face({ id: 12, n: 'b', nat: 'England', a: 60 }, 90, '#d8dde5') + '<i class="rd2">' + c + '</i></div><small>BOARD</small></div><div><div class="rf">' + H.face({ id: 31, n: 'c', nat: 'England', a: 50 }, 90, '#d8dde5') + '<i class="rd2">' + f + '</i></div><small>FANS</small></div></div></div>' +
'<div class="tgh"><b>TARGETS AND EXPECTATIONS</b><span>THIS SEASON</span></div>' + tg.map(function (t, i) { return '<div class="tg"><i class="no n' + (i + 1) + '">' + (i + 1) + '</i><div class="tl"><b>' + t.n + '</b></div><div class="tm2"><b>' + esc(t.d.toUpperCase()) + '</b><small>' + esc(t.now) + '</small></div><i class="' + (t.ok ? 'tick' : 'cross') + '">' + (t.ok ? '✔' : '✖') + '</i></div>'; }).join('') +
'<div class="darkbox" style="margin-top:10px"><b>YOU</b><div class="kv"><span>Manager</span><b>' + esc(S.mgr.name) + '</b></div><div class="kv"><span>Reputation</span><b>' + Math.round(S.mgr.rep) + '</b></div><div class="kv"><span>Manager level</span><b>' + H.mgrLevel(S.mgr.xp) + ' (' + S.mgr.xp + ' XP)</b></div><div class="kv"><span>League titles</span><b>' + S.champions.length + '</b></div></div>';
}
function facView(uc) {
var cap = Math.round(H.stadiumCap(uc) * 10) / 10, att = Math.round(H.attendance(G, uc) * 100);
var h = '<div class="darkbox"><b>🏟️ ' + esc(uc.name) + ' STADIUM</b><div class="kv"><span>Capacity</span><b>' + (cap * 1000).toLocaleString('en-US') + '</b></div><div class="kv"><span>Typical attendance</span><b>' + att + '%</b></div><div class="kv"><span>Ticket price</span><b>£' + Math.round(H.ticketPrice(uc)) + '</b></div></div>';
H.FAC.forEach(function (f, i) {
var job = S.build.filter(function (b) { return b.i === i; })[0], cost = H.facCost(uc, i);
h += '<div class="darkbox"><div class="row"><b class="sp">' + f.icon + ' ' + f.name.toUpperCase() + '</b><b>LEVEL ' + uc.fac[i] + '</b></div>' + LV(uc.fac[i]) + '<div class="mut" style="font-size:12px;margin-bottom:8px">' + f.desc + '</div>' +
(job ? '<div class="pill warn">Building… ' + job.wk + ' weeks left</div>' : uc.fac[i] >= 10 ? '<div class="pill ok">Maximum level</div>' : '<button class="btn sm" data-act="upg" data-v="' + i + '"' + (uc.cash < cost ? ' disabled' : '') + '>UPGRADE TO ' + (uc.fac[i] + 1) + ' · ' + fm(cost) + ' · ' + H.facWeeks(uc, i) + ' WEEKS</button>') + '</div>';
});
return h + '<p class="mut" style="font-size:12px">Upgrades raise weekly running costs a little, but pay back through gates, shop sales, better youth and faster recovery.</p>';
}
function eventsView(uc) {
var date = dateOf(S.stage === 'pre' ? 1 : S.week);
return '<div class="evh"><b>' + date.toUpperCase() + '</b></div><div class="redbar">TRAINING</div><p class="mut" style="font-size:12px;text-align:center;margin:4px 0">One event can be booked per week.</p>' + H.EVENTS.map(function (e) {
var c = H.eventCost(G, e), ex = function (v) { return (v > 0 ? '+' : '') + v; };
return '<div class="evt"><div class="evi">' + ({ camp: '🥊', resort: '🏖️', away: '⛳', spa: '🛁', team: '⚙️', staff: '🏝️', night: '🪩' }[e.k]) + '</div><div class="evm"><b>' + e.n.toUpperCase() + '</b><small>Duration ' + e.days + ' Days</small><div class="evs"><span>❤ ' + ex(e.heart) + '</span><span>⚡ ' + ex(e.bolt) + '</span><span>🙂 ' + ex(e.mood) + '</span><span>🧠 ' + ex(e.brain) + '</span></div></div><div class="evr"><b>' + fm(c) + '</b><button class="btn sm" data-act="evt" data-v="' + e.k + '"' + (S.evWeek === S.week ? ' disabled' : '') + '>ADD</button></div></div>';
}).join('');
}
function chalView() {
var ch = S.ch;
if (!ch) return '<div class="darkbox mut">Challenges start in week 1.</div>';
return '<div class="chb"><h2>WEEKLY CHALLENGES</h2><div class="mut c">Refreshes in ' + Math.max(0, 5 - (S.week - ch.start)) + ' weeks</div>' + ch.items.map(function (it) {
return '<div class="chi ' + (it.done ? 'done' : '') + '"><div class="cht"><b>' + esc(it.t.toUpperCase()) + '</b><span class="rew">💰 ' + fm(it.reward) + '</span></div>' + (it.done ? '<div class="awd">AWARDED</div>' : '<div class="prog"><i style="width:' + Math.min(100, it.p / it.n * 100) + '%"></i><span>' + it.p + '/' + it.n + '</span></div>') + '</div>';
}).join('') + '</div>';
}
function achView() {
var done = H.ACH.filter(function (a) { return S.ach[a.id]; }).length;
return '<div class="chb"><h2>ACHIEVEMENTS</h2><div class="mut c">' + done + ' of ' + H.ACH.length + ' completed</div>' + H.ACH.slice().sort(function (a, b) { return (S.ach[a.id] ? 1 : 0) - (S.ach[b.id] ? 1 : 0); }).map(function (a) {
return '<div class="ach"><div class="rib">🏅</div><b>' + esc(a.t) + '</b>' + (S.ach[a.id] ? '<span class="cmp2">COMPLETED</span>' : '<span class="xp">XP ' + a.xp + '</span>') + '</div>';
}).join('') + '</div>';
}
function moreView(uc) {
var sp = S.sponsor ? '<div class="kv"><span>Shirt sponsor</span><b>' + esc(S.sponsor.name) + '</b></div><div class="kv"><span>Deal</span><b>' + esc(S.sponsor.label) + ' x' + S.sponsor.mult.toFixed(2) + '</b></div>' : '<div class="mut">No sponsor this season.</div>';
var yth = H.userCards(G).filter(function (p) { return p.a <= 21; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 8);
return '<div class="darkbox"><b>SPONSOR</b>' + sp + '</div><h3>Young talents</h3>' + (yth.length ? yth.map(function (p) { return playerRow(p, p.o + ' → ' + p.p); }).join('') : '<div class="darkbox mut">No players under 22.</div>') +
'<h3>Game</h3><div class="grid2"><button class="btn" data-act="renclub">RENAME MY CLUB</button><button class="btn" data-act="clubimg">UPGRADE BADGE</button></div><div class="grid2" style="margin-top:8px"><button class="btn ghost" data-act="saveb">SAVE NOW</button><button class="btn ghost" data-act="hints">HINTS AND TIPS</button></div><button class="btn red full" style="margin-top:8px" data-act="reset">RESTART GAME</button>' +
'<p class="mut" style="font-size:12px;margin-top:8px">HANS FC 2.0. Real names, my own estimated ratings (around 2025/26). Badges and faces are original drawings made by the game, no real logos or photos. You can add your own picture for any player or your club. Anything out of date can be fixed with Rename.</p>';
}
function menuSheet() {
var items = [['fin', 'CLUB AND FINANCES'], ['board', 'BOARD AND TARGETS'], ['fac', 'STADIUM AND FACILITIES'], ['events', 'TRAINING EVENTS'], ['chal', 'CHALLENGES'], ['ach', 'ACHIEVEMENTS'], ['hist', 'HISTORY'], ['more', 'SETTINGS AND MORE']];
var d = openLayer('<div class="menul">' + items.map(function (x) { return '<button class="btn full" data-g="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '<button class="btn ghost full" data-g="x">CLOSE</button></div>', 'sheet');
d.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (!b) return; closeLayer(); if (b.dataset.g !== 'x') { tab = 'club'; cb.sec = b.dataset.g; render(); $('screen').scrollTop = 0; } });
}
function infoSheet(title, rows, note) {
openLayer('<h2>' + title + '</h2>' + rows.map(function (r) { return '<div class="kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + (note ? '<p class="mut" style="font-size:12px;margin-top:8px">' + note + '</p>' : '') + '<button class="btn full" style="margin-top:8px" onclick="">CLOSE</button>', 'sheet').addEventListener('click', function (e) { if (e.target.closest('.btn')) closeLayer(); });
}

/* ---------- the live match ---------- */
function playMatch(fx) {
var B = H.buildMatch(G, fx), m = B.m, speed = 1, done = false, talked = false;
var hx = '<div class="sb"><div class="clock" id="mclk">KICK OFF</div><div class="teams"><div class="tm"><div class="cw">' + cr(S.clubs[fx.h], 34) + '</div>' + esc(m.home.name) + '</div><div class="sc" id="msc">0 - 0</div><div class="tm"><div class="cw">' + cr(S.clubs[fx.a], 34) + '</div>' + esc(m.away.name) + '</div></div><div class="scorers"><div id="gh"></div><div id="ga"></div></div></div>' +
'<div class="livepitch" id="lp"><div class="gl l"></div><div class="gl r"></div></div>' +
'<div style="padding:2px 14px" id="mst"></div><div class="log" id="mlog"></div><div class="ctl" id="mctl"></div>';
var L = openLayer(hx, 'full');
var log = L.querySelector('#mlog'), lp = L.querySelector('#lp'), dots = [], ball = document.createElement('div'); ball.className = 'ball'; ball.style.left = '50%'; ball.style.top = '50%';
var F = [H.FORMATIONS[m.home.formation] || H.FORMATIONS['4-3-3'], H.FORMATIONS[m.away.formation] || H.FORMATIONS['4-3-3']];
function mkDots() {
[0, 1].forEach(function (s) {
var t = H.teamOf(m, s), col = s === 0 ? m.home.color : m.away.color;
t.on.forEach(function (p, i) {
var el = dots[s * 11 + i]; if (!el) { el = document.createElement('div'); el.className = 'pd'; lp.appendChild(el); dots[s * 11 + i] = el; }
var fr = F[s][i % F[s].length]; if (!fr) return;
var bx = s === 0 ? (100 - fr[2]) * 0.5 : 100 - (100 - fr[2]) * 0.5, by = s === 0 ? fr[1] : 100 - fr[1];
var pull = m.ball ? (m.ball.sx - 50) * 0.12 : 0;
el.style.left = Math.max(2, Math.min(98, bx + pull)) + '%'; el.style.top = Math.max(4, Math.min(96, by)) + '%';
el.style.background = col; el.className = 'pd' + (p.out ? ' gone' : '');
});
});
}
lp.appendChild(ball); m.ball.sx = 50; mkDots();
function moveBall() {
var a = m.ball.side;
m.ball.sx = a === 0 ? 48 + Math.random() * 42 : 10 + Math.random() * 42;
ball.style.left = m.ball.sx + '%'; ball.style.top = (15 + Math.random() * 70) + '%';
}
function stats() {
var s = m.stats, tot = (s.poss[0] + s.poss[1]) || 1, p = Math.round(s.poss[0] / tot * 100) || 50;
var bar = function (n, a, b) { var t = (a + b) || 1; return '<div class="bar"><span>' + a + '</span><div class="b"><i style="width:' + (a / t * 100) + '%"></i><u></u></div><span>' + b + '</span><small class="mut" style="width:90px">' + n + '</small></div>'; };
L.querySelector('#mst').innerHTML = '<div class="bar"><span>' + p + '%</span><div class="b"><i style="width:' + p + '%"></i><u></u></div><span>' + (100 - p) + '%</span><small class="mut" style="width:90px">Possession</small></div>' + bar('Shots', s.shots[0], s.shots[1]) + bar('On target', s.sot[0], s.sot[1]);
}
function paint(evs) {
L.querySelector('#msc').textContent = m.score[0] + ' - ' + m.score[1];
L.querySelector('#mclk').textContent = m.finished ? 'FULL TIME' : m.paused === 'ht' ? 'HALF TIME' : (m.half === 3 ? 'EXTRA TIME ' : '') + m.min + (m.add ? '+' + m.add : '') + "'";
L.querySelector('#gh').innerHTML = m.goals[0].map(function (g) { return '⚽ ' + esc(last(g.name)) + ' ' + g.t; }).join('<br>');
L.querySelector('#ga').innerHTML = m.goals[1].map(function (g) { return esc(last(g.name)) + ' ' + g.t + ' ⚽'; }).join('<br>');
evs.forEach(function (e) {
var d = document.createElement('div'); d.className = 'ev ' + e.type + (e.type === 'goal' ? ' flash' : '');
d.innerHTML = '<div class="m">' + e.t + '</div><div>' + esc(e.text) + (e.type === 'goal' ? ' (' + e.score[0] + '-' + e.score[1] + ')' : '') + '</div>';
log.insertBefore(d, log.firstChild);
if (e.type === 'goal' && e.side === B.userSide && navigator.vibrate) { try { navigator.vibrate(60); } catch (x) {} }
});
moveBall(); mkDots(); stats();
}
var running = function () { return !!matchTimer; };
function controls() {
var c = L.querySelector('#mctl');
if (m.finished) { c.innerHTML = '<button class="btn full" data-m="result">See result</button>'; return; }
if (m.paused === 'ht') { c.innerHTML = '<button class="btn ghost" data-m="manage">Subs, tactics & talk</button><button class="btn" data-m="half2">Second half ▶</button>'; return; }
if (!running()) { c.innerHTML = '<button class="btn ghost" data-m="manage">Subs & tactics</button><button class="btn" data-m="resume">Resume ▶</button>'; return; }
c.innerHTML = '<button class="btn ghost" data-m="pause">⏸ Pause</button><button class="btn ghost" data-m="speed">Speed ' + speed + 'x</button><button class="btn ghost" data-m="skip">Skip ⏭</button>';
}
function stop() { clearInterval(matchTimer); matchTimer = null; }
function tick() {
var ev = H.stepMatch(m); paint(ev);
if (m.finished || m.paused) { stop(); controls(); if (m.paused === 'ht') toast('Half time'); }
else if (ev.some(function (e) { return e.type === 'goal' || e.type === 'red' || e.type === 'pen'; })) { /* keep going: events are visible in the log */ }
}
function start() { stop(); matchTimer = setInterval(tick, speed === 1 ? 420 : speed === 2 ? 170 : 70); controls(); }
function manage() {
var side = B.userSide, t = side === 0 ? m.home : m.away;
var html = '<h2>Substitutions (' + (5 - t.subs) + ' left)</h2><div class="mut" style="font-size:12px;margin-bottom:6px">Tap a player to take off, then a substitute.</div><div class="list" id="subs"></div>' +
(m.paused === 'ht' && !talked ? '<h3>Team talk</h3><div class="tb"><button class="btn sm ghost" data-tt="praise">Praise</button><button class="btn sm ghost" data-tt="calm">Calm</button><button class="btn sm ghost" data-tt="demand">Demand more</button></div>' : '') +
'<h3>Tactics</h3>' + [['mentality', H.MENTALITY], ['style', H.STYLE], ['press', H.PRESS]].map(function (a) { return '<div class="seg">' + a[1].map(function (v) { return '<button data-tk="' + a[0] + '" data-v="' + v + '" class="' + (t[a[0]] === v ? 'on' : '') + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '</div>'; }).join('') +
'<button class="btn full" data-x="close">Done</button>';
var sh = openLayer(html, 'sheet'), offIdx = null;
function list() {
var h = '';
if (offIdx == null) h = t.on.map(function (p, i) { return p.out ? '' : '<div class="it" data-off="' + i + '"><div class="t"><b>' + esc(p.name) + (p.inj ? ' 🤕' : '') + '</b><small>' + p.slot + ' · rating ' + p.ovr + ' · ' + p.min + ' min · ' + p.perf.g + ' goals</small></div><span class="pill">Off</span></div>'; }).join('');
else h = '<div class="mut" style="margin-bottom:6px">Taking off ' + esc(t.on[offIdx].name) + '. Who comes on?</div>' + t.bench.map(function (p, i) { return '<div class="it" data-in="' + i + '"><div class="t"><b>' + esc(p.name) + '</b><small>' + p.pos + ' · ' + p.ovr + ' (fits ' + Math.max(30, p.ovr - H.penalty(t.on[offIdx].slot, p.pos)) + ')</small></div><span class="pill">On</span></div>'; }).join('') + '<button class="btn ghost sm" data-back="1">Back</button>';
sh.querySelector('#subs').innerHTML = h;
}
list();
sh.addEventListener('click', function (e) {
var x = e.target.closest('[data-off],[data-in],[data-tk],[data-back],[data-x],[data-tt]'); if (!x) return;
if (x.dataset.x) { closeLayer(); return; }
if (x.dataset.tt) { talked = true; toast(H.teamTalk(m, side, x.dataset.tt)); x.parentNode.remove(); return; }
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
var res = H.recordResult(G, fx, m); save();
closeLayer();
var us = B.userSide, gf = m.score[us], ga = m.score[1 - us];
var word = m.pens ? (m.pens.winner === us ? 'VICTORY ON PENALTIES' : 'DEFEAT ON PENALTIES') : gf > ga ? 'VICTORY' : gf === ga ? 'DRAW' : 'DEFEAT';
var col = m.pens ? (m.pens.winner === us ? 'var(--acc)' : 'var(--bad)') : gf > ga ? 'var(--acc)' : gf === ga ? 'var(--acc2)' : 'var(--bad)';
var mine = (us === 0 ? m.home : m.away), top = mine.on.concat(mine.used).sort(function (a, b) { return b.rating - a.rating; }).slice(0, 5);
var rs = openLayer('<div class="hero"><h2 style="font-size:26px;margin:0;color:' + col + '">' + word + '</h2><div style="font-size:42px;font-weight:900;margin:8px 0">' + m.score[0] + ' - ' + m.score[1] + '</div><div class="mut">' + esc(m.home.name) + ' vs ' + esc(m.away.name) + (m.pens ? '<br>Penalties ' + m.pens.score[0] + '-' + m.pens.score[1] : '') + '</div></div>' +
'<div style="padding:0 14px;flex:1;overflow-y:auto">' + (res.note ? '<div class="panel c"><b>' + esc(res.note) + '</b></div>' : '') +
'<div class="panel">' + (m.motm ? '<div class="row"><span class="sp">Man of the match</span><b>' + esc(m.motm.name) + (m.motm.side === us ? ' ⭐' : '') + '</b></div>' : '') + (res.gate ? '<div class="row"><span class="sp">Gate income</span><b style="color:var(--acc2)">+' + fm(res.gate) + '</b></div>' : '') + (res.prize ? '<div class="row"><span class="sp">Prize money</span><b style="color:var(--acc2)">+' + fm(res.prize) + '</b></div>' : '') + '</div>' +
'<div class="panel"><b>Your best</b>' + top.map(function (p) { return '<div class="kv"><span>' + esc(p.name) + ' <span class="mut">' + p.slot + '</span></span><b>' + (p.rating || 6).toFixed(1) + (p.perf.g ? ' ⚽' + p.perf.g : '') + '</b></div>'; }).join('') + '</div>' +
'<div class="panel"><div class="bar"><span>' + m.stats.shots[0] + '</span><div class="b"><i style="width:' + (m.stats.shots[0] / ((m.stats.shots[0] + m.stats.shots[1]) || 1) * 100) + '%"></i><u></u></div><span>' + m.stats.shots[1] + '</span><small class="mut" style="width:80px">Shots</small></div><div class="bar"><span>' + m.stats.possPct[0] + '%</span><div class="b"><i style="width:' + m.stats.possPct[0] + '%"></i><u></u></div><span>' + m.stats.possPct[1] + '%</span><small class="mut" style="width:80px">Possession</small></div><div class="bar"><span>' + m.stats.corners[0] + '</span><div class="b"><i style="width:' + (m.stats.corners[0] / ((m.stats.corners[0] + m.stats.corners[1]) || 1) * 100) + '%"></i><u></u></div><span>' + m.stats.corners[1] + '</span><small class="mut" style="width:80px">Corners</small></div></div></div>' +
'<div class="ctl"><button class="btn full" data-m="close">Continue</button></div>', 'full');
rs.addEventListener('click', function (e) { if (e.target.closest('[data-m=close]')) { closeLayer(); render(); } });
}
L.addEventListener('click', function (e) {
var b = e.target.closest('[data-m]'); if (!b) return;
var a = b.dataset.m;
if (a === 'pause') { stop(); controls(); }
else if (a === 'resume') start();
else if (a === 'speed') { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; start(); }
else if (a === 'skip') { stop(); var g = 0, all = []; while (!m.finished && !m.paused && g++ < 600) all = all.concat(H.stepMatch(m)); paint(all); controls(); if (m.paused === 'ht') toast('Half time'); }
else if (a === 'manage') manage();
else if (a === 'half2') { H.startSecondHalf(m); start(); }
else if (a === 'result') finish();
});
layers[layers.length - 1].onclose = function () { stop(); };
paint([]); controls();
setTimeout(function () { if (!done && layers.length && layers[layers.length - 1].el === L) start(); }, 600);
}
function simMatch(fx) {
H.fixLineup(G);
var m = H.simUserMatch(G, fx), res = H.recordResult(G, fx, m); save();
toast((res.win ? 'Win ' : res.draw ? 'Draw ' : 'Loss ') + res.us + '-' + res.them + ' vs ' + res.opp.name + (res.note ? ' · ' + res.note : ''));
render();
}

/* ---------- advancing time ---------- */
function advance() {
var r = H.finishWeek(G);
if (S.sacked) { toast('The board has lost patience…'); }
save(); render(); $('screen').scrollTop = 0;
if (r === 'end') toast('The season is over!');
}
function endSeason() {
var rv = H.endSeason(G); save(); render(); showReview(rv);
}
function showReview(rv) {
rv = rv || S.review; if (!rv) return;
var uc = H.userClub(G), ob = S.obj;
var tick = function (ok) { return ok ? '✅' : '❌'; };
var h = '<div class="hero"><div style="font-size:13px" class="mut">' + H.yearName(rv.year) + ' · ' + esc(rv.lgName) + '</div><h2 style="font-size:34px;margin:4px 0">' + ord(rv.pos) + ' of ' + rv.n + '</h2><div class="mut">Champions: ' + esc(cname(rv.champ)) + '</div></div><div style="padding:0 14px;flex:1;overflow-y:auto">' +
'<div class="panel"><b>Board verdict</b><div class="kv"><span>' + tick(rv.lgMet) + ' ' + esc(ob.text) + '</span><b></b></div><div class="kv"><span>' + (rv.cupMet != null ? tick(rv.cupMet) : '') + ' ' + esc(ob.cupText) + '</span><b></b></div>' + (ob.ccText ? '<div class="kv"><span>' + tick(rv.ccMet) + ' ' + esc(ob.ccText) + '</span><b></b></div>' : '') + '<div class="kv"><span>Confidence</span><b>' + rv.conf + '% (' + (rv.dconf >= 0 ? '+' : '') + Math.round(rv.dconf) + ')</b></div></div>' +
'<div class="panel"><b>Money</b><div class="kv"><span>League prize money</span><b>' + fm(rv.prize) + '</b></div>' + (rv.sponsorBonus ? '<div class="kv"><span>Sponsor bonus</span><b>' + fm(rv.sponsorBonus) + '</b></div>' : '') + (rv.sponsorPenalty ? '<div class="kv"><span>Sponsor penalty</span><b>-' + fm(rv.sponsorPenalty) + '</b></div>' : '') + '<div class="kv"><span>Bank balance</span><b>' + fm(uc.cash) + '</b></div></div>' +
'<div class="panel"><b>Awards</b><div class="kv"><span>Cup winner</span><b>' + esc(rv.cupWinner || '-') + '</b></div><div class="kv"><span>Champions Cup</span><b>' + esc(rv.cc || '-') + '</b></div><div class="kv"><span>Player of the year</span><b>' + esc(rv.bestPlayer ? rv.bestPlayer.n + ' (' + rv.bestPlayer.club + ')' : '-') + '</b></div></div>' +
'<div class="panel"><b>Top scorers</b>' + rv.scorers.slice(0, 5).map(function (s) { return '<div class="kv"><span>' + esc(s.n) + ' <span class="mut">' + esc(s.club) + '</span></span><b>' + s.g + '</b></div>'; }).join('') + '</div>' +
(rv.changes.length ? '<div class="panel"><b>Player development</b>' + rv.changes.map(function (c) { return '<div class="kv"><span>' + esc(c.n) + '</span><b style="color:' + (c.to >= c.from ? 'var(--acc)' : 'var(--bad)') + '">' + c.from + ' → ' + c.to + '</b></div>'; }).join('') + '</div>' : '') +
(rv.youth.length ? '<div class="panel"><b>New from the academy</b>' + rv.youth.map(function (y) { return '<div class="kv"><span>' + esc(y.n) + ' <span class="mut">' + y.pos + ' · ' + y.a + 'y</span></span><b>' + y.o + ' → ' + y.p + '</b></div>'; }).join('') + '</div>' : '') +
(rv.retired.length || rv.expired.length ? '<div class="panel"><b>Squad changes</b>' + (rv.retired.length ? '<div class="mut" style="font-size:13px">Retired: ' + esc(rv.retired.join(', ')) + '</div>' : '') + (rv.expired.length ? '<div class="mut" style="font-size:13px;margin-top:4px">Contracts ended, left on a free: ' + esc(rv.expired.join(', ')) + '</div>' : '') + '</div>' : '');
if (rv.sacked) h += '<div class="warn bad2"><b>You have been sacked.</b> The board has lost faith in you. ' + (rv.offers.length ? 'Other clubs are willing to give you a chance:' : 'No club wants you right now.') + '</div>';
else if (rv.offers.length) h += '<div class="warn"><b>Job offers!</b> Bigger clubs are interested in you. You can stay or move.</div>';
h += (rv.offers || []).map(function (id) { var c = S.clubs[id]; return '<div class="clubrow" data-m="job" data-id="' + id + '"><div class="cr2">' + cr(c, 32) + '</div><div class="sp"><b>' + esc(c.name) + '</b><div class="mut" style="font-size:12px">' + H.lgOf(c.lg).name + ' · ' + H.tierName(c) + '</div></div><button class="btn sm">Join</button></div>'; }).join('');
h += '</div><div class="ctl"><button class="btn full" data-m="stay">' + (rv.sacked ? (rv.offers.length ? 'Beg for another chance here' : 'Plead with the board for one more season') : 'Continue to next season') + '</button></div>';
var L = openLayer(h, 'full');
L.addEventListener('click', function (e) {
var j = e.target.closest('[data-m=job]'), s = e.target.closest('[data-m=stay]');
if (j) { var id = +j.dataset.id; closeLayer(); H.nextSeason(G, id); save(); tab = 'home'; render(); toast('Welcome to ' + cname(id) + '!'); }
else if (s) { closeLayer(); H.nextSeason(G, null); save(); tab = 'home'; render(); toast('A new season begins'); }
});
}

/* ---------- events ---------- */
document.addEventListener('click', function (e) {
var t = e.target.closest('#screen [data-act], #nav [data-act], #top [data-act]'); if (!t) return;
var a = t.dataset.act, v = t.dataset.v;
if (a === 'tab') { tab = v; render(); $('screen').scrollTop = 0; }
else if (a === 'ilg') { var n0 = $('mn') && $('mn').value; intro.name = n0 || intro.name; intro.lg = v; intro.sel = null; render(); }
else if (a === 'iclub') { intro.name = ($('mn') && $('mn').value) || intro.name; intro.sel = +v; render(); }
else if (a === 'istart') {
var nm = (($('mn') && $('mn').value) || '').trim() || 'The Manager';
if (intro.sel == null) return toast('Pick a club first');
G = H.newCareer(nm, intro.sel); S = G.S; tab = 'home'; save(); render();
}
else if (a === 'spons') { H.chooseSponsor(G, +v); save(); render(); }
else if (a === 'startseason') { if (!S.sponsor) H.chooseSponsor(G, 0); H.fixLineup(G); if (S.slots.filter(Boolean).length < 11) return toast('You need 11 available players'); H.beginSeason(G); save(); render(); }
else if (a === 'play' || a === 'simm') {
var fx = H.pending(G)[+v]; if (!fx) return;
H.fixLineup(G);
if (S.slots.filter(Boolean).length < 11) return toast('You need 11 available players');
if (a === 'play') playMatch(fx); else simMatch(fx);
}
else if (a === 'advance') advance();
else if (a === 'endseason') endSeason();
else if (a === 'review') showReview();
else if (a === 'slot') openPicker('p', +v);
else if (a === 'bslot') openPicker('b', +v);
else if (a === 'form') { H.setFormation(G, v); save(); render(); }
else if (a === 'auto') { H.autoLineup(G); save(); render(); toast('Best XI picked'); }
else if (a === 'tac') { S[t.dataset.k] = v; save(); render(); }
else if (a === 'trn') { S.train = +v; save(); render(); }
else if (a === 'sqm') { sqMode = v; render(); }
else if (a === 'srt') { sqSort = v; render(); }
else if (a === 'pl') openPlayer(+t.dataset.id);
else if (a === 'msec') { mk.sec = v; render(); }
else if (a === 'mpos') { mk.pos = v; render(); }
else if (a === 'mlg') { mk.lg = v; render(); }
else if (a === 'mfa') { mk.fa = !mk.fa; render(); }
else if (a === 'myoung') { mk.young = !mk.young; render(); }
else if (a === 'msort') { mk.sort = v; render(); }
else if (a === 'csec') { cp.sec = v; render(); }
else if (a === 'clg') { cp.lg = v; render(); }
else if (a === 'ccupl') { cp.cupLg = v; render(); }
else if (a === 'cbs') { cb.sec = v; render(); }
else if (a === 'menu' || a === 'menu2') menuSheet();
else if (a === 'cbgo') { tab = 'club'; cb.sec = v; render(); $('screen').scrollTop = 0; }
else if (a === 'achv') { tab = 'club'; cb.sec = 'ach'; render(); $('screen').scrollTop = 0; }
else if (a === 'sqf') { sqFilter = v; render(); }
else if (a === 'srtn') { var ord2 = ['ovr', 'age', 'pos']; sqSort = ord2[(ord2.indexOf(sqSort) + 1) % 3]; render(); toast('Sorted by ' + sqSort); }
else if (a === 'scout') { mk.sec = 'search'; mk.sort = v === 'youth' ? 'pot' : 'ovr'; mk.young = v === 'youth'; mk.minO = v === 'head' ? 80 : v === 'over' ? 74 : 0; mk.lg = v === 'over' ? 'all' : mk.lg; render(); toast('Scout report ready'); }
else if (a === 'evt') { var er2 = H.addEvent(G, v); if (er2) return toast(er2); save(); render(); toast('Event booked'); }
else if (a === 'hints') infoSheet('HINTS AND TIPS', [['Lineup', 'Use the auto button for your best XI'], ['Fitness', 'Rotate tired players, rest recovers them'], ['Money', 'Sell surplus players and upgrade the stadium'], ['Youth', 'Young high potential players grow fast'], ['Events', 'Training events boost mood and sharpness']]);
else if (a === 'spsheet') infoSheet('SPONSORSHIP', [['Shirt sponsor', S.sponsor ? esc(S.sponsor.name) : 'None'], ['Deal', S.sponsor ? esc(S.sponsor.label) : '-'], ['Income so far', fm(S.tot.inc.spons)]]);
else if (a === 'plsheet') { var ti = S.tot.inc, te = S.tot.exp; infoSheet('PROFIT AND LOSS', [['Income', fm(ti.gate + ti.tv + ti.spons + ti.comm + ti.prize)], ['Expenses', fm(te.wages + te.upkeep + te.build)], ['Result', fm(ti.gate + ti.tv + ti.spons + ti.comm + ti.prize - te.wages - te.upkeep - te.build)]]); }
else if (a === 'budsheet') { var u3 = H.userClub(G); infoSheet('BUDGETS', [['Bank balance', fm(u3.cash)], ['Weekly wages', fm(H.userCards(G).reduce(function (m, q) { return m + q.w; }, 0))], ['Transfer spending', fm(S.tot.exp.buys)], ['Transfer income', fm(S.tot.inc.sales)]]); }
else if (a === 'upg') { var er = H.startBuild(G, +v); if (er) return toast(er); save(); render(); toast('Building work has started'); }
else if (a === 'renclub') renameSheet('club', H.userClub(G));
else if (a === 'clubimg') pickPhoto(function (url) { H.userClub(G).img = url; save(); render(); toast('Badge saved'); });
else if (a === 'saveb') { save(); toast('Saved'); }
else if (a === 'reset') confirmBox('Delete your career?', 'This cannot be undone.', function () { try { localStorage.removeItem(KEY); } catch (x) {} G = null; S = null; closeAll(); tab = 'home'; render(); });
});
document.addEventListener('input', function (e) {
if (e.target.id === 'mq') { mk.q = e.target.value; clearTimeout(viewMarket.t); viewMarket.t = setTimeout(function () { var el = $('screen'), pos = e.target.selectionStart; render(); var q = $('mq'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } }, 350); }
});

/* Android back button: the app calls this. true = handled here */
window.__back = function () {
if (matchTimer && layers.length) { toast('Pause the match first'); return true; }
if (layers.length) { var top = layers[layers.length - 1]; if (top.el.className === 'full-l' && (top.el.querySelector('#mlog') || top.el.querySelector('[data-m=stay]'))) { toast(top.el.querySelector('#mlog') ? 'Finish the match first' : 'Pick an option first'); return true; } closeLayer(); return true; }
if (G && tab !== 'home') { tab = 'home'; render(); return true; }
return false;
};

G = H.loadSave(KEY); S = G ? G.S : null;
if (G) { try { H.fixLineup(G); if (S.stage === 'review' && S.review) setTimeout(function () { showReview(); }, 100); } catch (e) { G = null; S = null; } }
render();
window.__hfc = { get G() { return G; } };
})();/* ===== HANS FC 3.0.0 add-on. PASTE AT THE VERY END OF app.js (below the last line  })();  ). Do NOT select all. ===== */
(function(){try{var s=document.createElement('style');s.textContent="/* ===== HANS FC: FCM-style tokens, match prep, newspaper, advancing =====\n   PASTE THIS WHOLE BLOCK AT THE VERY END OF style.css */\n.ft{position:relative;width:58px;height:58px;margin:0 auto}\n.ft.e{border:2px dashed #3556b0;border-radius:10px;opacity:.6}\n.ftf{position:absolute;inset:0;border-radius:10px;overflow:hidden;background:#ffffff14}\n.ftf svg,.ftf img{width:100%;height:100%}\n.fto{position:absolute;left:-7px;top:-3px;font-size:20px;font-weight:900;color:#fff;line-height:1;z-index:2;text-shadow:0 0 3px #000,0 2px 3px #000}\n.ftb{position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:50%;font-style:normal;font-size:11px;display:grid;place-items:center;z-index:2;color:#fff}\n.ftb.g{background:#5cc21a}.ftb.o{background:#f58a1f}.ftb.x{background:#d33}\n.ftp{position:absolute;left:-3px;bottom:-4px;font-size:10px;font-weight:900;padding:0 4px;border-radius:3px;color:#04122b;z-index:2}\n.ftp.pG{background:#7ed34a}.ftp.pD{background:#4fc3f7}.ftp.pM{background:#ffe03a}.ftp.pA{background:#ff9a2e}\n.ftr{position:absolute;right:-5px;bottom:-4px;font-size:10px;font-weight:900;padding:0 4px;border-radius:3px;color:#fff;z-index:2}\n.ftr.g{background:#4aa31a}.ftr.o{background:#e07b10}.ftr.n{background:#555}\n.fey{position:absolute;left:-6px;top:18px;font-style:normal;font-size:12px;z-index:2}\n.ftn{margin-top:7px;font-size:11px;color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}\n.ftl{font-size:11px;font-weight:900;text-align:center;line-height:1.1}\n.ftl.g{color:#2ee66b}.ftl.a{color:#ffc928}.ftl.r{color:#ff5c5c}\n.fcp{background:#0a1a36!important;border:2px solid #2f4fa0!important;aspect-ratio:3/4.3!important}\n.fcp:before,.fcp:after{border-color:#2f4fa0!important}\n.fcp .slot{width:74px}\n.fbn{flex:0 0 66px;text-align:center;padding:6px 0 2px}\n.bench{background:#0d2a52;border-radius:6px;padding:8px 6px}\n/* match prep */\n.fcx{position:fixed;inset:0;z-index:70;background:#0b1d3a;overflow-y:auto;padding-top:env(safe-area-inset-top);color:#fff}\n.fch{display:grid;grid-template-columns:84px 1fr 84px;gap:6px;background:#2a2f36;padding:8px;align-items:center}\n.fcb{border-radius:6px;font-size:38px;font-weight:900;text-align:center;line-height:1.05;padding:2px 0;border:2px solid #fff6}\n.fcb.u{background:linear-gradient(#c9a227,#8a6d12)}.fcb.o{background:linear-gradient(#5cc21a,#2f7a0a)}\n.fcn{text-align:center;font-size:11px;font-weight:900;margin-top:3px;text-transform:uppercase;line-height:1.1}\n.fcm{display:flex;flex-direction:column;gap:5px}\n.fcm div{display:grid;grid-template-columns:34px 1fr 34px;gap:4px;align-items:center;text-align:center;font-size:13px;font-weight:900}\n.fcm i{font-style:normal;border-radius:3px;padding:1px 0}\n.fcm i.a{background:#b8941f}.fcm i.c{background:#4aa31a}\n.fcpit{position:relative;margin:6px;width:auto}\n.fcf{position:absolute;top:6px;right:6px;z-index:5;background:#1d6fe0;border-radius:4px;display:flex;align-items:center;gap:10px;padding:4px 8px;font-size:15px;font-weight:900}\n.fcf button{background:none;border:0;color:#5cc21a;font-size:18px;padding:0}\n.fcv{position:absolute;left:0;bottom:0;z-index:5;background:#1d6fe0;color:#fff;border:0;padding:12px 22px;font-size:16px;font-weight:900;border-radius:0 6px 0 0}\n.fcrw{background:#1d6fe0;margin:6px;border-radius:4px;padding:6px 8px}\n.fcrw>b{display:flex;justify-content:space-between;font-size:14px}.fcrw>b span{font-size:12px}.fcrw>b i{font-style:normal}\n.fcsc{display:flex;gap:6px;overflow-x:auto;padding:4px 0 6px}\n.fcsay{margin:6px;border-radius:4px;overflow:hidden;background:#fff}\n.fctx{color:#222;font-size:16px;text-align:center;padding:12px 10px 8px;min-height:64px}\n.fcmg{display:flex;align-items:center;gap:10px;background:#2a2f36;padding:0 8px 0 0;min-height:56px}\n.fcmg>div:nth-child(2){flex:1}.fcmg small{display:block;color:#9fb9dc}\n.fcfa{width:70px;height:56px;overflow:hidden;background:#e9eef6}.fcfa svg{width:100%;height:auto}\n.fcmg button{background:#1d6fe0;color:#fff;border:0;border-radius:4px;padding:8px 10px;font-weight:900;font-size:13px}\n.fcpv{margin:6px;border:2px solid #fff;background:#1d6fe0;border-radius:4px;text-align:center;padding:8px 4px;font-size:16px;font-weight:900}\n.fcpv em{font-style:normal;background:#d33;border-radius:3px;padding:0 6px}.fcpv small{display:block;font-size:10px}\n.fcg2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px}\n.fcg2>div{background:#1d6fe0;border-radius:4px;text-align:center;padding:8px;font-weight:900;font-size:14px}.fcg2 small{display:block;font-weight:600}\n.fcbt{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));position:sticky;bottom:0;background:#0b1d3a}\n.fcbt button{background:#f58a1f;color:#04122b;border:0;border-radius:6px;padding:14px 4px;font-size:14px;font-weight:900;box-shadow:0 3px 0 #b35d08;text-transform:uppercase}\n.fcbt .go{background:#f5a21f}\n/* advancing */\n.fca{position:fixed;inset:0;z-index:70;background:#000b;display:grid;place-items:center}\n.fcaw{width:92%;background:linear-gradient(#2a6fdc,#1550b8);border:3px solid #fff;border-radius:6px;padding-top:22px;text-align:center;overflow:hidden}\n.fcaw .cal{font-size:88px;line-height:1}.fcaw .mo{font-size:20px;font-weight:900;margin-top:26px}.fcaw .ad{font-size:36px;font-weight:900;margin:44px 0 34px}\n.fcd{display:flex;gap:2px;align-items:flex-end}\n.fcd div{flex:1;background:#fff;color:#0a2e5e;height:120px;font-weight:900;font-size:13px;animation:fcs 1.1s ease-out both}\n.fcd div.on{height:150px}.fcd b{display:block;background:#aaa;color:#000;padding:8px 2px}.fcd span{display:block;padding:36px 4px 0}\n@keyframes fcs{from{transform:translateX(60%)}to{transform:none}}\n/* newspaper */\n.fcw{position:fixed;inset:0;z-index:70;background:#000d;display:grid;place-items:center;overflow-y:auto;padding:16px}\n.fcpap{width:92%;max-width:420px;background:#dfe6ea;padding:10px;transform:rotate(-1.5deg);box-shadow:0 8px 24px #000;color:#000;font-family:Impact,\"Arial Narrow Bold\",\"Arial Narrow\",sans-serif}\n.fcpap .mh{background:linear-gradient(#e8260f,#a81500);color:#fff;font-size:44px;font-style:italic;font-weight:900;padding:8px 10px 4px;line-height:1}\n.fcpap .mh small{display:block;font-size:10px;font-style:normal;text-align:right;font-family:Arial,sans-serif;font-weight:400}\n.fcpap .bn{background:#e8260f;color:#fff;font-size:13px;padding:4px 8px;margin-top:6px}\n.fcpap .hl{border:2px solid #e8260f;font-size:38px;line-height:1.02;padding:6px 8px;margin-top:2px;text-transform:uppercase;word-break:break-word}\n.fcpap .sb2{background:#1a1a1a;color:#fff;font-size:17px;line-height:1.1;padding:10px;margin-top:6px}\n.fcpap .lt{background:#1a1a1a;color:#fff;margin-top:6px;font-size:11px;padding:4px 8px}\n.fcpap .lt div{display:flex;gap:6px;padding:3px 0;border-top:1px solid #fff2}.fcpap .lt span{flex:1}.fcpap .lt i{font-style:normal;width:22px}.fcpap .lt b{width:16px;text-align:right}\n.fcpap .lt .th{border:0;color:#9fb9dc}.fcpap .lt .me{color:#ffc928}\n.fcpap .sh{display:block;width:100%;margin-top:8px;background:#f58a1f;border:0;border-radius:6px;padding:12px;font:600 15px Arial,sans-serif;color:#000}\n\n/* 3.0.0 extras */\n.bigav{position:relative}\n.bigav:after{content:\"\ud83d\udcf7 tap to change\";position:absolute;left:50%;bottom:4px;transform:translateX(-50%);font-size:10px;background:#000b;color:#fff;padding:2px 8px;border-radius:10px;white-space:nowrap}\n.v3bg{position:fixed;inset:0;z-index:80;background:#000c;display:grid;place-items:center;padding:16px}\n.v3box{width:100%;max-width:420px;max-height:86vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px}\n.v3box h3{margin:0 0 8px}.v3box ul{padding-left:18px;margin:6px 0;font-size:14px;line-height:1.4}.v3s{font-size:13px;color:#b9c9e6}\n.v3box textarea{width:100%;height:140px;background:#0a1a36;color:#fff;border:1px solid #2f4fa0;border-radius:6px;font-size:11px;margin:8px 0}\n.v3b{display:block;width:100%;margin-top:8px;background:#f58a1f;color:#04122b;border:0;border-radius:6px;padding:12px;font-weight:900}\n.v3pre{display:flex;align-items:center;gap:6px;margin:6px 0;font-size:12px;flex-wrap:wrap}\n.v3c{display:inline-flex;gap:2px}.v3c button{background:#1d6fe0;color:#fff;border:0;border-radius:4px;padding:6px 8px;font-size:12px;font-weight:900}.v3c button:disabled{opacity:.35}\n.v3tools{margin:10px 0}.v3tools>b{display:block;margin-bottom:6px}\n.fcm .fcw3{display:block;font-size:11px;color:#ffc928;margin-top:2px}\n";document.head.appendChild(s);}catch(e){}})();
/* ===== HANS FC: FCM-style player tokens, match prep, newspaper, advancing =====
PASTE THIS WHOLE BLOCK AT THE VERY END OF app.js (below the last line  })();  ) */
(function () {
try {
var H = window.HFC, KEY = 'hansfc_save_v2', gate = false, ov = null, tm = null;
var $ = function (s) { return document.querySelector(s); };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var G = function () { return window.__hfc && window.__hfc.G; };
var last = function (n) { var p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };
var sn = function (n) { return n.charAt(0) + '.' + last(n); };
var MO = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
var weekDate = function (S, w) { return new Date(Date.UTC(S.year, 7, 10) + (Math.max(1, w) - 1) * 7 * 86400000); };
function close() { clearTimeout(tm); if (ov) { ov.remove(); ov = null; } }
function mount(cls, html) { close(); ov = document.createElement('div'); ov.className = cls; ov.innerHTML = html; document.body.appendChild(ov); return ov; }

/* one player token: rating, position badge, form, energy bolt, name, role label */
function tok(p, o) {
o = o || {};
if (!p) return '<div class="ft e"></div><div class="ftn">&nbsp;</div><div class="ftl">' + (o.pos || '') + '</div>';
var S = G().S, col = p.cl != null && S.clubs[p.cl] ? S.clubs[p.cl].col : '#556070', grp = H.GROUP[p.pos] || 'M';
var ovr = o.ovr != null && o.ovr !== '' ? o.ovr : p.o, fr = p.rn ? p.rs / p.rn : 0, pen = o.pen || 0;
var bolt = p.inj || p.sus ? 'x' : p.ft < 60 ? 'o' : 'g';
return '<div class="ft"><div class="ftf">' + H.face(p, 60, col) + '</div><b class="fto">' + ovr + '</b><i class="ftb ' + bolt + '">⚡</i><span class="ftp p' + grp + '">' + p.pos + '</span><span class="ftr ' + (fr ? (fr >= 6.5 ? 'g' : 'o') : 'n') + '">' + (fr ? fr.toFixed(1) : '-') + '</span>' + (o.yth && p.a <= 21 ? '<i class="fey">👁</i>' : '') + '</div><div class="ftn">' + esc(sn(p.n)) + '</div><div class="ftl ' + (pen === 0 ? 'g' : pen <= 8 ? 'a' : 'r') + '">' + (o.pos || p.pos) + '</div>';
}

/* re-skin the lineup pitch and bench in the Squad tab */
function skin() {
var g = G(); if (!g) return; var S = g.S, pit = $('#screen .pitch');
if (!pit || pit.dataset.fc) return; pit.dataset.fc = 1; pit.classList.add('fcp');
var rows = [], F = H.FORMATIONS[S.formation]; try { rows = H.userEval(g).rows; } catch (e) {}
pit.querySelectorAll('.slot').forEach(function (el) {
var i = +el.dataset.v, r = rows[i] || {}, p = g.P[S.slots[i]];
el.innerHTML = tok(p, { pos: F[i][0], pen: p ? r.pen : 0, ovr: p ? r.eff : '' });
});
document.querySelectorAll('#screen .bench [data-act="bslot"]').forEach(function (el) {
el.className = 'fbn'; el.innerHTML = tok(g.P[S.bench[+el.dataset.v]], { pos: 'SUB', yth: 1 });
});
}

function groups(list) {
var a = { G: [], D: [], M: [], A: [] };
list.forEach(function (p) { if (p && a[H.GROUP[p.pos]]) a[H.GROUP[p.pos]].push(H.eff ? H.eff(p) : p.o); });
var av = function (x) { return x.length ? Math.round(x.reduce(function (s, v) { return s + v; }, 0) / x.length) : 0; };
return { def: av(a.D.concat(a.G)), mid: av(a.M), att: av(a.A) };
}
function predict(cid) {
var S = G().S, F = H.FORMATIONS['4-3-3'], used = {}, xi = [];
var pool = S.players.filter(function (p) { return p.cl === cid && (H.available ? H.available(p) : true); });
F.forEach(function (s, i) {
var best = null, bv = -99;
pool.forEach(function (p) { if (used[p.id]) return; var v = p.o - H.penalty(s[0], p.pos); if (v > bv) { bv = v; best = p; } });
if (best) { used[best.id] = 1; xi[i] = best; }
});
return xi;
}
function lastGame(cid) {
var S = G().S, L = S.lg[S.clubs[cid].lg];
for (var w = L.rounds.length - 1; w >= 0; w--) {
var f = L.rounds[w].filter(function (x) { return x[2] >= 0 && (x[0] === cid || x[1] === cid); })[0];
if (f) return f;
}
return null;
}

/* match preparation screen (shown before every live match) */
function prep(fx, btn) {
var g = G(), S = g.S, view = 'you'; try { H.fixLineup(g); } catch (e) {}
var opp = fx.h === S.uid ? fx.a : fx.h, oc = S.clubs[opp], uc = H.userClub(g);
function draw() {
var ue = H.userEval(g), us = S.slots.map(function (id) { return g.P[id]; }), ug = groups(us), oxi = predict(opp), og = groups(oxi);
var F = view === 'you' ? H.FORMATIONS[S.formation] : H.FORMATIONS['4-3-3'], xs = view === 'you' ? us : oxi;
var slots = F.map(function (s, i) {
var p = xs[i], pen = p ? (view === 'you' ? (ue.rows[i] || {}).pen : H.penalty(s[0], p.pos)) : 0;
return '<div class="slot" style="left:' + s[1] + '%;top:' + s[2] + '%">' + tok(p, { pos: s[0], pen: pen, ovr: p && view === 'you' ? (ue.rows[i] || {}).eff : '' }) + '</div>';
}).join('');
var bar = function (n, a, b) { return '<div><i class="' + (a >= b ? 'a' : 'c') + '">' + a + '</i><b>' + n + '</b><i class="' + (b > a ? 'a' : 'c') + '">' + b + '</i></div>'; };
var head = '<div class="fch"><div><div class="fcb u">' + ue.vector.rating + '</div><div class="fcn">' + esc(uc.name) + '</div></div><div class="fcm">' + bar('DEFENCE', ug.def, og.def) + bar('MIDFIELD', ug.mid, og.mid) + bar('ATTACK', ug.att, og.att) + '<div class="fcw3">WIN CHANCE ~' + Math.round(100 / (1 + Math.exp(-((ue.vector.rating - oc.str + (fx.h === S.uid ? 3 : -1)) / 7)))) + '%</div></div><div><div class="fcb o">' + Math.round(oc.str) + '</div><div class="fcn">' + esc(oc.name) + '</div></div></div>';
var pit = '<div class="pitch fcp fcpit">' + slots + (view === 'you' ? '<div class="fcf"><button data-q="fp">◀</button><b>' + S.formation + '</b><button data-q="fn">▶</button></div><button class="fcv" data-q="opp">OPPONENT</button>' : '<div class="fcf"><b>PREDICTED LINE UP</b></div><button class="fcv" data-q="you">YOUR TEAM</button>') + '</div>';
var low;
if (view === 'you') {
var bn = S.bench.slice(0, 5), rest = H.userCards(g).filter(function (p) { return S.slots.indexOf(p.id) < 0 && S.bench.indexOf(p.id) < 0; });
var row = function (t, ids, y) { return '<div class="fcrw"><b>' + t + (y ? '<span><i>👁</i> = YOUTH PLAYER</span>' : '') + '</b><div class="fcsc">' + ids.map(function (p) { return '<div class="fbn">' + tok(p, { pos: p.pos, yth: y }) + '</div>'; }).join('') + '</div></div>'; };
low = row('SUBSTITUTES', bn.map(function (id) { return g.P[id]; }).filter(Boolean)) + row('REMAINING PLAYERS', rest, 1) +
'<div class="fcsay"><div class="fctx">This is my starting team and squad I have selected for today\'s game. Our starting formation will be ' + S.formation + '.</div><div class="fcmg"><div class="fcfa">' + H.face({ id: 4242, n: 'M', nat: 'England', a: 45 }, 90, '#222a38') + '</div><div><b>' + esc(S.mgr.name.toUpperCase()) + '</b><small>Manager</small></div><button data-q="opp">SCOUT REPORT</button></div></div>';
} else {
var lg = lastGame(opp), txt = 'We believe ' + esc(oc.name) + ' will line up in a 4-3-3 formation. ', ban = '';
if (lg) {
var ho = lg[0] === opp, gf = ho ? lg[2] : lg[3], ga = ho ? lg[3] : lg[2];
txt += 'Recent form – ' + (gf > ga ? 'W' : gf === ga ? 'D' : 'L') + ', with ' + gf + ' scored and ' + ga + ' conceded.';
ban = '<div class="fcpv"><b>' + esc(S.clubs[lg[0]].name.toUpperCase()) + '</b> <em>' + lg[2] + ' - ' + lg[3] + '</em> <b>' + esc(S.clubs[lg[1]].name.toUpperCase()) + '</b><small>PREVIOUS GAME</small></div>';
} else txt += 'It is early in the season, so we have little to go on.';
var ks = [['DEFENCE', og.def], ['MIDFIELD', og.mid], ['ATTACK', og.att]].sort(function (a, b) { return b[1] - a[1]; });
low = '<div class="fcsay"><div class="fctx">' + txt + '</div><div class="fcmg"><div class="fcfa">' + H.face({ id: 777, n: 'S', nat: 'Spain', a: 50 }, 90, '#1a2740') + '</div><div><b>CHIEF SCOUT</b><small>Scout</small></div></div></div>' + ban +
'<div class="fcg2"><div><b>' + ks[0][0] + '</b><small>Strengths · ' + ks[0][1] + '</small></div><div><b>' + ks[2][0] + '</b><small>Weaknesses · ' + ks[2][1] + '</small></div></div>';
}
ov.innerHTML = head + pit + low + '<div class="fcbt"><button data-q="team">TEAM SELECTION</button><button data-q="tac">TACTICS</button><button class="go" data-q="start">START GAME</button></div>';
}
mount('fcx', ''); draw();
ov.addEventListener('click', function (e) {
var b = e.target.closest('[data-q]'); if (!b) return; var q = b.dataset.q;
if (q === 'opp' || q === 'you') { view = q; draw(); ov.scrollTop = 0; }
else if (q === 'fp' || q === 'fn') { var k = Object.keys(H.FORMATIONS), i = k.indexOf(S.formation); H.setFormation(g, k[(i + (q === 'fn' ? 1 : k.length - 1)) % k.length]); H.save(g, KEY); draw(); }
else if (q === 'team' || q === 'tac') { close(); var n = $('#nav [data-v="squad"]'); if (n) n.click(); setTimeout(function () { var m = $('#screen [data-act="sqm"][data-v="' + (q === 'team' ? 'pitch' : 'tac') + '"]'); if (m) m.click(); }, 60); }
else if (q === 'start') { close(); gate = true; btn.click(); gate = false; }
});
}

/* "Advancing" calendar */
function adv(btn) {
var g = G(), S = g.S, d0 = weekDate(S, S.week + 1), DN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], nf = '';
try {
var f = S.lg[H.userClub(g).lg].rounds[S.week].filter(function (x) { return x[0] === S.uid || x[1] === S.uid; })[0];
if (f) nf = (f[0] === S.uid ? '(H) ' : '(A) ') + S.clubs[f[0] === S.uid ? f[1] : f[0]].name.toUpperCase();
} catch (e) {}
var cards = [0, 1, 2, 3].map(function (i) {
var d = new Date(d0.getTime() + i * 86400000);
return '<div class="' + (i === 1 ? 'on' : '') + '"><b>' + DN[d.getUTCDay()] + ' ' + d.getUTCDate() + '</b><span>' + (d.getUTCDay() === 6 ? nf : '') + '</span></div>';
}).join('');
mount('fca', '<div class="fcaw"><div class="cal">🗓️</div><div class="mo">' + MO[d0.getUTCMonth()] + ' ' + d0.getUTCFullYear() + '</div><div class="ad">ADVANCING</div><div class="fcd">' + cards + '</div></div>');
tm = setTimeout(function () { close(); gate = true; btn.click(); gate = false; }, 1200);
}

/* newspaper headline for the user's transfers */
function paper(x) {
var g = G(), S = g.S, uc = H.userClub(g), oc = S.clubs[x.other], on = oc ? oc.name.toUpperCase() : 'A NEW CLUB', un = uc.name.toUpperCase(), ln = last(x.n).toUpperCase();
var d = weekDate(S, S.week), dt = ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear();
var fee = x.fee ? ' FOR ' + H.fm(x.fee).toUpperCase() : ' ON A FREE';
var head = x.d === 'in' ? ln + ' JOINS ' + un + fee : ln + ' SOLD TO ' + on + fee;
var sub = x.d === 'in' ? un + ' SHOWING REAL AMBITION BY BEATING OFF COMPETITION TO SECURE THE SIGNING OF ' + ln + '.' : on + ' HAVE TAKEN ' + ln + ' AFTER A SUCCESSFUL BID.';
var tb = H.table(g, uc.lg).slice(0, 7).map(function (r) { return '<div class="' + (r.user ? 'me' : '') + '"><span>' + esc(r.name.toUpperCase()) + '</span><i>P' + r.p + '</i><b>' + r.pts + '</b></div>'; }).join('');
var can = navigator.share || (navigator.clipboard && navigator.clipboard.writeText);
mount('fcw', '<div class="fcpap"><div class="mh">SPORT DAILY<small>Shoot, Page 42, ' + dt + '</small></div><div class="bn">8 PAGES OF THE LATEST FOOTBALL NEWS</div><div class="hl">' + esc(head) + '</div><div class="sb2">' + esc(sub) + '</div><div class="lt"><div class="th"><span>LEAGUE TABLE</span><b>PTS</b></div>' + tb + '</div>' + (can ? '<button class="sh" data-q="share">Share Headline with Friends</button>' : '') + '</div>');
ov.addEventListener('click', function (e) {
var b = e.target.closest('[data-q="share"]');
if (!b) { close(); return; }
var t = head + ' (Hans FC)';
if (navigator.share) navigator.share({ text: t }).catch(function () {}); else { navigator.clipboard.writeText(t); b.textContent = 'Copied'; }
});
}
var prev = null;
setInterval(function () {
var g = G(); if (!g) { prev = null; return; }
var xf = g.S.xf || [];
if (prev === null || xf.length < prev.length) { prev = xf.slice(); return; }
if (xf.length > prev.length) {
var nw = xf.filter(function (e) { return prev.indexOf(e) < 0; })[0]; prev = xf.slice();
if (nw && !ov) try { paper(nw); } catch (e) {}
}
}, 800);

/* hooks */
document.addEventListener('click', function (e) {
if (gate || ov) return;
var b = e.target.closest('#screen [data-act="play"], #screen [data-act="advance"]'), g = G(); if (!b || !g) return;
try {
if (b.dataset.act === 'play') { var fx = H.pending(g)[+b.dataset.v]; if (!fx) return; prep(fx, b); }
else adv(b);
e.stopPropagation(); e.preventDefault();
} catch (er) { close(); }
}, true);
var ob = window.__back;
window.__back = function () { if (ov) { close(); return true; } return ob ? ob() : false; };
var scr = document.getElementById('screen');
if (scr) { new MutationObserver(function () { requestAnimationFrame(skin); }).observe(scr, { childList: true }); skin(); }
} catch (err) { if (window.console) console.error('FCM add-on failed', err); }
})();

/* ===== HANS FC 3.0.0 extras: player photos, lineup presets, backup, what's new ===== */
(function () {
try {
var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.0.0', PK = 'hansfc_presets_v3', ov3 = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var norm = function (s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
function box(html) {
if (ov3) ov3.remove();
ov3 = document.createElement('div'); ov3.className = 'v3bg';
ov3.innerHTML = '<div class="v3box">' + html + '<button class="v3b" data-v3="x">CLOSE</button></div>';
document.body.appendChild(ov3);
}
function again() { var t = $('#nav .on'); if (t) t.click(); }

/* photos: shrink to a small square and match files to players by file name */
function shrink(f, cb) {
var rd = new FileReader();
rd.onerror = function () { cb(null); };
rd.onload = function () {
var im = new Image();
im.onerror = function () { cb(null); };
im.onload = function () {
var c = document.createElement('canvas'), n = 112, sz = Math.min(im.width, im.height);
c.width = c.height = n;
c.getContext('2d').drawImage(im, (im.width - sz) / 2, Math.max(0, (im.height - sz) / 4), sz, sz, 0, 0, n, n);
cb(c.toDataURL('image/jpeg', 0.75));
};
im.src = rd.result;
};
rd.readAsDataURL(f);
}
function match(base) {
var all = G().S.players, toks = base.split(' ').filter(Boolean), hit = [];
if (!toks.length) return null;
all.forEach(function (p) { if (norm(p.n) === base) hit.push(p); });
if (!hit.length) all.forEach(function (p) { var pt = norm(p.n).split(' '); if (toks.every(function (t) { return pt.indexOf(t) >= 0; })) hit.push(p); });
if (!hit.length || (hit.length > 1 && toks.length < 2)) return null;
return hit.sort(function (a, b) { return b.o - a.o; })[0];
}
function importPhotos() {
var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
inp.onchange = function () {
var files = Array.prototype.slice.call(inp.files || [], 0, 400), g = G(), ok = 0, bad = [], i = 0;
if (!files.length || !g) return;
box('<h3>Adding photos…</h3><p id="v3p">0 / ' + files.length + '</p>');
(function next() {
if (i >= files.length) {
try { H.save(g, KEY); } catch (e) { bad.push('(storage full: some photos were not kept)'); }
box('<h3>Photos added: ' + ok + ' of ' + files.length + '</h3>' + (bad.length ? '<p class="v3s">Not matched. Name each picture after the player, for example <b>erling haaland.jpg</b>:<br>' + bad.slice(0, 25).map(esc).join('<br>') + '</p>' : ''));
again(); return;
}
var f = files[i++], p = match(norm(f.name.replace(/\.[^.]+$/, '')));
if (!p) { bad.push(f.name); return setTimeout(next, 0); }
shrink(f, function (url) {
if (url) { p.img = url; ok++; } else bad.push(f.name);
var e = $('#v3p'); if (e) e.textContent = i + ' / ' + files.length;
setTimeout(next, 0);
});
})();
};
inp.click();
}

/* lineup presets A, B, C (saved per club on this phone) */
var pre = function () { try { return JSON.parse(localStorage.getItem(PK)) || {}; } catch (e) { return {}; } };
function presetRow() {
var g = G(), pit = $('#screen .pitch'); if (!g || !pit || $('#screen .v3pre')) return;
var mine = pre()[g.S.uid] || {}, d = document.createElement('div'); d.className = 'v3pre';
d.innerHTML = '<b>LINEUPS</b>' + ['A', 'B', 'C'].map(function (k) { return '<span class="v3c"><button data-v3="ps" data-k="' + k + '">💾 ' + k + '</button><button data-v3="pl" data-k="' + k + '"' + (mine[k] ? '' : ' disabled') + '>📂 ' + k + '</button></span>'; }).join('');
pit.parentNode.insertBefore(d, pit);
}
function preset(q, k) {
var g = G(), S = g.S, all = pre(), mine = all[S.uid] = all[S.uid] || {};
if (q === 'ps') { mine[k] = { f: S.formation, s: S.slots.slice(), b: S.bench.slice() }; localStorage.setItem(PK, JSON.stringify(all)); var d = $('#screen .v3pre'); if (d) d.remove(); presetRow(); return; }
var p = mine[k]; if (!p) return;
var have = {}; H.userCards(g).forEach(function (c) { have[c.id] = 1; });
H.setFormation(g, p.f);
S.slots = p.s.map(function (id) { return have[id] ? id : null; });
S.bench = p.b.filter(function (id) { return have[id]; });
try { H.fixLineup(g); } catch (e) {}
H.save(g, KEY);
var m = $('#screen [data-act="sqm"][data-v="pitch"]'); if (m) m.click();
}

/* backup and restore the whole career as text */
function backup() {
var raw = ''; try { raw = localStorage.getItem(KEY) || ''; } catch (e) {}
if (!raw) return box('<p>There is no saved career to back up yet.</p>');
box('<h3>Back up your career</h3><p class="v3s">Tap Copy, then paste it somewhere safe (Notes, or an email to yourself). Use Restore after reinstalling the app.</p><textarea id="v3t" readonly>' + esc(raw) + '</textarea><button class="v3b" data-v3="cp">COPY</button>');
}
function restore() {
box('<h3>Restore a backup</h3><p class="v3s">Paste the backup text. It replaces your current career. Your current one is kept as an emergency copy when there is room.</p><textarea id="v3t"></textarea><button class="v3b" data-v3="go">RESTORE</button>');
}
function news() {
box('<h3>HANS FC ' + VER + '</h3><ul><li>New player cards: face, rating, position, form and energy</li><li>Match preparation screen with team ratings, opponent line-up and scout report</li><li>Newspaper headlines for your signings and sales</li><li>Advancing calendar</li><li>Player pictures: tap the big picture on any player to change it, or import many at once from Game</li><li>Lineup presets A, B and C in the Lineup tab</li><li>Back up and restore your career</li><li>Win chance estimate before each match</li></ul>');
try { localStorage.setItem('hansfc_seen_' + VER, '1'); } catch (e) {}
}
function tools() {
var b = $('#screen [data-act="renclub"]'); if (!b || $('#screen .v3tools')) return;
var d = document.createElement('div'); d.className = 'v3tools';
d.innerHTML = '<b>HANS FC ' + VER + '</b><div class="grid2"><button class="btn" data-v3="imp">📷 IMPORT PHOTOS</button><button class="btn ghost" data-v3="bak">💾 BACK UP</button></div><div class="grid2" style="margin-top:8px"><button class="btn ghost" data-v3="res">♻ RESTORE</button><button class="btn ghost" data-v3="new">WHAT\'S NEW</button></div>';
b.parentNode.after(d);
}

document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v3]'); if (!b) return;
var q = b.dataset.v3, g = G();
if (q === 'x') { if (ov3) { ov3.remove(); ov3 = null; } }
else if (q === 'imp') { if (g) importPhotos(); }
else if (q === 'bak') backup();
else if (q === 'res') restore();
else if (q === 'new') news();
else if (q === 'ps' || q === 'pl') { if (g) preset(q, b.dataset.k); }
else if (q === 'cp') { var t = $('#v3t'); t.select(); try { document.execCommand('copy'); b.textContent = 'COPIED'; } catch (x) { b.textContent = 'Press and hold the text to copy'; } }
else if (q === 'go') {
var v = ($('#v3t').value || '').trim();
if (v.length < 200) { b.textContent = 'That does not look like a backup'; return; }
try { var old = localStorage.getItem(KEY); if (old) localStorage.setItem(KEY + '_before_restore', old); } catch (x) {}
try { localStorage.setItem(KEY, v); location.reload(); } catch (x) { b.textContent = 'Could not restore: no space left'; }
}
});

var ob = window.__back;
window.__back = function () { if (ov3) { ov3.remove(); ov3 = null; return true; } return ob ? ob() : false; };
function patch() {
var h = $('#screen .hero h2'); if (h && /2\.0/.test(h.textContent)) h.textContent = 'HANS FC 3.0';
presetRow(); tools();
}
var scr = document.getElementById('screen');
if (scr) { new MutationObserver(function () { requestAnimationFrame(patch); }).observe(scr, { childList: true }); patch(); }
try { if (!localStorage.getItem('hansfc_seen_' + VER)) setTimeout(news, 900); } catch (e) {}
} catch (err) { if (window.console) console.error('HANS FC 3.0 extras failed', err); }
})();/* ===== HANS FC 3.1.0 add-on. PASTE AT THE VERY END of app.js, BELOW the 3.0.0 block. Do NOT select all. ===== */
(function () {
try {
var css = '.v4bg{position:fixed;inset:0;z-index:90;background:#000d;display:grid;place-items:center;padding:12px}.v4box{width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px;font-size:14px}.v4box h3{margin:0 0 8px;font-size:17px}.v4box label{display:block;font-size:12px;color:#9fb9dc;margin:8px 0 3px}.v4box textarea{width:100%;height:60px;border-radius:8px;border:0;padding:8px;font:inherit;background:#fff;color:#0a2e5e}.v4b{display:block;width:100%;margin-top:8px;background:#f58a1f;color:#04122b;border:0;border-radius:6px;padding:11px;font-weight:900;text-transform:uppercase}.v4b.g{background:#1c5aa8;color:#fff}.v4b.s{display:inline-block;width:auto;padding:6px 10px;margin:2px;font-size:12px}.v4r{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #ffffff1c;font-size:13px}.v4r b{text-align:right}.v4s{font-size:12px;color:#b9c9e6}.v4c{background:#0a1f3d;border-radius:8px;padding:8px 10px;margin:6px 0}.v4c.me{border:1px solid #ffc928}.v4pic{width:90px;height:90px;border-radius:50%;overflow:hidden;margin:4px auto;background:#dfe7f2}.v4pic svg,.v4pic img{width:100%;height:100%;object-fit:cover}.v4g{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v4t{font-size:11px;color:#ffc928;text-transform:uppercase;margin:10px 0 2px;font-weight:900}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.1.0', ov = null, gate = false, pend = null;
var snap = null, msnap = null, tsnap = null, lastWk = -1, lastYr = -1, upts = null, curEv = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var last = function (n) { var p = String(n).split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };
var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
var r1 = function (x) { return Math.round(x * 10) / 10; };
var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
var yn = function () { return H.yearName(S().year); };
function V() { var s = S(); if (!s) return null; return (s.v4 = s.v4 || { nat: 'England', age: 45, bio: '', img: '', wc: null, wcHist: [], awards: [], recent: [], deals: [], offers: {}, ret: [], yr: 0, ev: 0 }); }
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function news(t, k) { var s = S(); s.news.unshift({ k: k || 'g', t: t, w: s.week, y: s.year }); if (s.news.length > 150) s.news.length = 150; s.unread = (s.unread || 0) + 1; }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function box(html) { if (ov) ov.remove(); ov = document.createElement('div'); ov.className = 'v4bg'; ov.innerHTML = '<div class="v4box">' + html + '</div>'; document.body.appendChild(ov); }
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c, k) { return '<button class="v4b ' + (c || '') + '" data-v4="' + q + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + '>' + t + '</button>'; };
var row = function (l, r) { return '<div class="v4r"><span>' + l + '</span><b>' + r + '</b></div>'; };
var FN = ['Carlos', 'Marco', 'Hans', 'Antoine', 'Diego', 'Luca', 'Mateo', 'Viktor', 'Sven', 'Ruben', 'Tomas', 'Andre'], LN = ['Alvarez', 'Bianchi', 'Keller', 'Moreau', 'Santos', 'Rossi', 'Novak', 'Larsen', 'Duarte', 'Fischer', 'Costa', 'Petrov'];
var mgrName = function (id) { return FN[id % 12] + ' ' + LN[(id * 7 + 3) % 12]; };
function shrink(f, cb) {
var rd = new FileReader(); rd.onerror = function () { cb(null); };
rd.onload = function () { var im = new Image(); im.onerror = function () { cb(null); }; im.onload = function () { var c = document.createElement('canvas'), sz = Math.min(im.width, im.height); c.width = c.height = 112; c.getContext('2d').drawImage(im, (im.width - sz) / 2, Math.max(0, (im.height - sz) / 4), sz, sz, 0, 0, 112, 112); cb(c.toDataURL('image/jpeg', 0.75)); }; im.src = rd.result; };
rd.readAsDataURL(f);
}
function pick(cb) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { if (i.files && i.files[0]) shrink(i.files[0], cb); }; i.click(); }

/* manager picture everywhere the game shows the manager */
var oldFace = H.face;
H.face = function (p, sz, col) { try { var v = V(); if (p && p.id === 4242 && v && v.img) return '<img src="' + v.img + '" style="width:100%;height:100%;object-fit:cover" alt="">'; } catch (e) {} return oldFace.apply(this, arguments); };

/* ---------- manager profile ---------- */
function mgrBox() {
var s = S(), v = V(), n = {}; s.players.forEach(function (p) { if (p.nat) n[p.nat] = 1; });
box('<h3>Manager profile</h3><div class="v4pic">' + H.face({ id: 4242, n: 'M', nat: v.nat, a: v.age }, 90, '#222a38') + '</div>' + btn('mpic', '📷 Change picture', 'g') +
'<label>Name</label><input id="v4n" type="text" maxlength="22" value="' + esc(s.mgr.name) + '"><label>Nationality (the country that may call you up)</label><select id="v4nat">' + Object.keys(n).sort().map(function (x) { return '<option' + (x === v.nat ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
'<label>Age</label><input id="v4age" type="number" min="30" max="75" value="' + v.age + '"><label>About me</label><textarea id="v4bio" maxlength="160">' + esc(v.bio) + '</textarea>' + btn('msave', 'Save') + btn('x', 'Close', 'g'));
}

/* ---------- train a player in a new position ---------- */
function positions() { var o = {}; Object.keys(H.FORMATIONS).forEach(function (k) { H.FORMATIONS[k].forEach(function (s) { o[s[0]] = 1; }); }); return Object.keys(o); }
function playerByName(n) { var g = G(); return H.userCards(g).filter(function (p) { return p.n === n; })[0]; }
function retBox(p) {
var v = V(), uc = H.userClub(G()), cur = v.ret.filter(function (r) { return r.id === p.id; })[0];
if (cur) return box('<h3>' + esc(p.n) + '</h3><p>Training as <b>' + cur.to + '</b>: ' + cur.wk + ' weeks left.</p>' + btn('x', 'Close', 'g'));
var opts = positions().filter(function (x) { return x !== p.pos; }).map(function (x) { var pen = H.penalty(x, p.pos); if (pen >= 30) return ''; var wk = clamp(4 + Math.round(pen / 2), 4, 16), c = r1(0.05 * wk + 0.002 * p.o); return '<div class="v4c"><div class="v4r"><span><b>' + x + '</b> <span class="v4s">' + (pen <= 6 ? 'easy' : pen <= 14 ? 'medium' : 'hard') + ' · ' + wk + ' weeks · €' + c + 'M</span></span>' + btn('rt', 'Train', 's', x + '|' + wk + '|' + c + '|' + pen) + '</div></div>'; }).join('');
box('<h3>New position for ' + esc(p.n) + '</h3><p class="v4s">Now ' + p.pos + '. After the training he plays the new position naturally, but a harder switch costs a little rating. Cash ' + H.fm(uc.cash) + '.</p><div id="v4rt" data-id="' + p.id + '">' + (opts || '<p>No realistic option.</p>') + '</div>' + btn('x', 'Close', 'g'));
}
function retTick() {
var s = S(), v = V(), g = G(); v.ret = v.ret.filter(function (r) {
var p = g.P[r.id]; if (!p || p.cl !== s.uid) return false;
if (--r.wk > 0) return true;
p.pos = r.to; p.o = Math.max(40, p.o - Math.min(3, Math.round(r.pen / 8))); news('🔄 ' + p.n + ' has finished retraining and now plays as a ' + r.to + '.', 'g'); return false;
});
}

/* ---------- sponsorship hub ---------- */
var SL = [['sleeve', 'Sleeve sponsor', 4, ['Skyline Air', 'Nova Telecom', 'Atlas Bank', 'Orbit Energy', 'Zenith Motors']], ['stadium', 'Stadium naming rights', 9, ['Titan', 'Crown Insurance', 'Pioneer Steel', 'Aurora Group', 'Falcon Capital']], ['kit', 'Kit supplier', 6, ['Forma Sport', 'Velo Athletics', 'Stride Pro', 'Kinetic Wear', 'Apex Gear']], ['training', 'Training ground partner', 2.5, ['Vita Health', 'Peak Nutrition', 'Pulse Fitness', 'Granite Tools']], ['partner', 'Official partner', 3, ['QuickPay', 'Harbour Foods', 'Metro Rail', 'SwiftFreight', 'BrightHome']]];
function offersFor() {
var s = S(), v = V(), uc = H.userClub(G()); if (v.offers.yr === s.year) return v.offers;
var o = { yr: s.year }, f = Math.pow(Math.max(40, uc.rep) / 80, 3);
SL.forEach(function (x) { o[x[0]] = [0, 1, 2].map(function (i) { return { b: x[3][(Math.floor(Math.random() * 9) + i * 2) % x[3].length], y: 1 + i, a: r1(x[2] * f * (0.85 + Math.random() * 0.3) * (1 + i * 0.05)), t: i === 1 ? 'win' : 'safe' }; }); });
return (v.offers = o);
}
function sponBox() {
var s = S(), v = V(), o = offersFor(), tot = 0; v.deals.forEach(function (d) { tot += d.a; });
box('<h3>Sponsors hub</h3><p class="v4s">Extra deals on top of your shirt sponsor. Income is paid weekly. Win deals pay less each week but add a bonus for every win. Total now: €' + r1(tot) + 'M a year.</p>' + SL.map(function (x) {
var d = v.deals.filter(function (q) { return q.s === x[0]; })[0];
return '<div class="v4t">' + x[1] + '</div>' + (d ? '<div class="v4c me">' + row(esc(d.b) + ' (' + (d.t === 'win' ? 'win bonus' : 'fixed') + ')', '€' + d.a + 'M / yr') + '<div class="v4s">Runs until the end of ' + H.yearName(d.u - 1) + '</div></div>' : o[x[0]].map(function (q, i) { return '<div class="v4c"><div class="v4r"><span><b>' + esc(q.b) + '</b><div class="v4s">' + q.y + ' season' + (q.y > 1 ? 's' : '') + ' · ' + (q.t === 'win' ? 'win bonus' : 'fixed') + '</div></span><span>€' + q.a + 'M/yr ' + btn('sg', 'Sign', 's', x[0] + '|' + i) + '</span></div></div>'; }).join(''));
}).join('') + btn('x', 'Close', 'g'));
}
function payDeals() {
var s = S(), v = V(), g = G(), uc = H.userClub(g), w = Math.max(1, H.LAST_WEEK || 38), win = false;
try { var r = H.table(g, uc.lg).filter(function (x) { return x.user; })[0]; if (r) { win = upts != null && r.pts - upts >= 3; upts = r.pts; } } catch (e) {}
v.deals.forEach(function (d) { var p = d.a / w * (d.t === 'win' ? 0.7 : 1) + (d.t === 'win' && win ? d.a / w * 0.9 : 0); uc.cash += p; s.tot.inc.spons += p; });
}

/* ---------- awards ---------- */
function snapNow() { var m = {}; S().players.forEach(function (p) { m[p.id] = [p.g || 0, p.as || 0]; }); return m; }
function tabSnap() { var s = S(), g = G(), m = {}; try { H.table(g, H.userClub(g).lg).forEach(function (r) { m[r.id] = [r.pts, r.gf - r.ga]; }); } catch (e) {} return m; }
function topGain(from) {
var s = S(), lg = H.userClub(G()).lg, best = null, bs = 0;
s.players.forEach(function (p) { if (p.cl == null || !s.clubs[p.cl] || s.clubs[p.cl].lg !== lg) return; var f = from[p.id] || [0, 0], dg = (p.g || 0) - f[0], da = (p.as || 0) - f[1]; if (dg < 0 || da < 0 || dg + da === 0) return; var sc = dg * 3 + da * 1.5 + p.o / 1000; if (sc > bs) { bs = sc; best = { p: p, g: dg, a: da }; } });
return best;
}
function note(t, me) { var v = V(); v.recent.unshift(t); if (v.recent.length > 14) v.recent.length = 14; news((me ? '⭐ ' : '🏅 ') + t, me ? 'g' : 'w'); }
function weekAwards() {
var s = S(), g = G(), uc = H.userClub(g), lgn = H.lgOf(uc.lg).name;
if (snap) { var b = topGain(snap); if (b) note('Player of the Week (' + lgn + '): ' + b.p.n + ' (' + s.clubs[b.p.cl].name + ') · ' + b.g + ' goals, ' + b.a + ' assists', b.p.cl === s.uid); }
snap = snapNow();
if (s.week > 0 && s.week % 4 === 0) {
if (msnap) {
var m = topGain(msnap); if (m) { note('Player of the Month (' + lgn + '): ' + m.p.n + ' (' + s.clubs[m.p.cl].name + ') · ' + m.g + ' goals, ' + m.a + ' assists', m.p.cl === s.uid); if (m.p.cl === s.uid) { s.mgr.xp += 15; } }
var bt = null, bv = -1; try { H.table(g, uc.lg).forEach(function (r) { var f = tsnap && tsnap[r.id] || [0, 0], sc = (r.pts - f[0]) * 100 + (r.gf - r.ga - f[1]); if (sc > bv) { bv = sc; bt = r; } }); } catch (e) {}
if (bt) { var me = bt.id === s.uid; note('Manager of the Month (' + lgn + '): ' + (me ? s.mgr.name + ' (YOU)' : mgrName(bt.id)) + ' at ' + bt.name, me); if (me) { s.mgr.rep = Math.min(100, s.mgr.rep + 1); s.mgr.xp += 25; } }
}
msnap = snapNow(); tsnap = tabSnap();
}
}
var PUS = ['a 40-yard volley', 'a solo run past five defenders', 'a bicycle kick', 'a curling free kick from distance', 'a back-heel flick in the box', 'a first-time strike from the halfway line'];
function seasonAwards() {
var s = S(), g = G(), v = V(), tc = {}, T = function (lg) { return tc[lg] || (tc[lg] = H.table(g, lg)); };
var rk = s.players.filter(function (p) { return p.cl != null && s.clubs[p.cl]; }).map(function (p) { var c = s.clubs[p.cl], t = T(c.lg), b = (p.g || 0) * 2 + (p.as || 0) * 1.2 + (p.o - 70) * 0.5; if (t[0] && t[0].id === c.id) b += 6; if (s.cc && s.cc.winner === c.id) b += 8; return { p: p, s: b }; }).sort(function (a, b) { return b.s - a.s; });
var it = [], add = function (c, p, extra) { it.push({ c: c, n: p.n, club: s.clubs[p.cl].name, me: p.cl === s.uid, x: extra || '' }); };
rk.slice(0, 3).forEach(function (x, i) { add(['Ballon d\'Or', 'Ballon d\'Or runner-up', 'Ballon d\'Or third'][i], x.p, x.p.g + ' goals · ' + x.p.as + ' assists'); });
var gb = rk.filter(function (x) { return x.p.a <= 21; })[0]; if (gb) add('Golden Boy (best under 22)', gb.p, gb.p.g + ' goals');
var gk = rk.filter(function (x) { return H.GROUP[x.p.pos] === 'G'; }).map(function (x) { var t = T(s.clubs[x.p.cl].lg).slice().sort(function (a, b) { return a.ga - b.ga; }), r = t.map(function (q) { return q.id; }).indexOf(x.p.cl); return { p: x.p, s: x.p.o + (20 - Math.max(0, r)) * 0.3 }; }).sort(function (a, b) { return b.s - a.s; })[0]; if (gk) add('Golden Glove (best goalkeeper)', gk.p, '');
var sc = rk.slice().sort(function (a, b) { return (b.p.g || 0) - (a.p.g || 0); }).slice(0, 15).filter(function (x) { return x.p.g > 0; }); if (sc.length) { var q = rnd(sc).p, oc = rnd(H.lgClubs(g, s.clubs[q.cl].lg).filter(function (c) { return c.id !== q.cl; })); add('Puskás Award (goal of the year)', q, rnd(PUS) + (oc ? ' against ' + oc.name : '')); }
var bc = null, bo = -99; H.LEAGUES.forEach(function (l) { var t = T(l.id), ex = H.lgClubs(g, l.id).slice().sort(function (a, b) { return b.str - a.str; }).map(function (c) { return c.id; }); t.forEach(function (r, i) { var o = ex.indexOf(r.id) - i + (i === 0 ? 3 : 0) + Math.random() * 0.5; if (o > bo) { bo = o; bc = r; } }); });
if (bc) { var me = bc.id === s.uid; it.push({ c: 'Coach of the Year', n: me ? s.mgr.name + ' (YOU)' : mgrName(bc.id), club: bc.name, me: me, x: '' }); }
var xi = [], need = { G: 1, D: 4, M: 3, A: 3 }, cnt = { G: 0, D: 0, M: 0, A: 0 }; rk.forEach(function (x) { var k = H.GROUP[x.p.pos]; if (cnt[k] < need[k]) { cnt[k]++; xi.push(x.p); } });
return { it: it, xi: xi };
}
function ceremony() {
var s = S(), v = V(), a = seasonAwards(), tot = 0;
a.it.forEach(function (x) { if (x.me) { var big = /^Ballon d'Or$|^Coach/.test(x.c); s.mgr.rep = Math.min(100, s.mgr.rep + (big ? 3 : 1)); s.mgr.xp += big ? 120 : 30; news('🏆 ' + x.c + ': ' + x.n + ' (' + x.club + ')', 'g'); } });
v.awards.unshift({ y: yn(), it: a.it, xi: a.xi.map(function (p) { return p.n + ' (' + s.clubs[p.cl].name + ')'; }) }); if (v.awards.length > 8) v.awards.length = 8; save();
return '<h3>🏆 Awards night · ' + yn() + '</h3>' + a.it.map(function (x) { return '<div class="v4c ' + (x.me ? 'me' : '') + '"><div class="v4t">' + esc(x.c) + '</div><b>' + esc(x.n) + '</b> <span class="v4s">' + esc(x.club) + '</span>' + (x.x ? '<div class="v4s">' + esc(x.x) + '</div>' : '') + '</div>'; }).join('') + '<div class="v4t">Team of the Year</div><div class="v4s">' + a.xi.map(function (p) { return esc(p.n); }).join(' · ') + '</div>';
}
function awardsBox() {
var v = V(); box('<h3>🏅 Awards</h3>' + (v.recent.length ? '<div class="v4t">Recent winners</div>' + v.recent.slice(0, 8).map(function (t) { return '<div class="v4s" style="margin:3px 0">' + esc(t) + '</div>'; }).join('') : '<p class="v4s">Weekly and monthly awards appear here as the season goes on.</p>') + v.awards.map(function (a) { return '<div class="v4t">' + a.y + '</div>' + a.it.map(function (x) { return '<div class="v4r"><span>' + esc(x.c) + '</span><b' + (x.me ? ' style="color:#ffc928"' : '') + '>' + esc(x.n) + '</b></div>'; }).join(''); }).join('') + btn('x', 'Close', 'g'));
}

/* ---------- season moments ---------- */
function moment() {
var s = S(), v = V(), g = G(), uc = H.userClub(g), cards = H.userCards(g).slice().sort(function (a, b) { return b.o - a.o; }), o = [];
var gain = r1((0.4 + Math.random() * 1.2) * Math.max(0.5, uc.rep / 70)), hurt = cards.filter(function (p) { return p.inj > 0; });
o.push({ t: 'Local business offer', x: 'A local firm wants to sponsor a fan day at the training ground.', a: ['Accept (+€' + gain + 'M)', function () { uc.cash += gain; s.tot.inc.spons += gain; }], b: ['Decline (fans +2)', function () { s.fanC = Math.min(100, s.fanC + 2); }] });
if (cards[0]) o.push({ t: 'Dressing-room row', x: cards[0].n + ' is unhappy with a teammate. How do you handle it?', a: ['Back the star (his morale +8)', function () { cards[0].mo = clamp(cards[0].mo + 8, 1, 100); }], b: ['Back the squad (board +3)', function () { s.board.conf = Math.min(100, s.board.conf + 3); }] });
var fa = s.players.filter(function (p) { return p.cl == null; }).sort(function (a, b) { return b.o - a.o; }).slice(0, 6);
if (fa.length) { var f = rnd(fa); o.push({ t: 'Scout tip', x: 'A scout recommends the free agent ' + f.n + ' (' + f.pos + ', ' + f.a + ', rated ' + f.o + ').', a: ['Add to shortlist', function () { s.short = s.short || []; if (s.short.indexOf(f.id) < 0) s.short.push(f.id); }], b: ['Ignore', function () {}] }); }
if (hurt.length) { var cost = r1(0.8 + hurt.length * 0.4); o.push({ t: 'Medical breakthrough', x: 'A specialist can speed up recovery for your ' + hurt.length + ' injured player(s) for €' + cost + 'M.', a: ['Pay (−2 weeks out)', function () { uc.cash -= cost; hurt.forEach(function (p) { p.inj = Math.max(0, p.inj - 2); }); }], b: ['Not now', function () {}] }); }
curEv = rnd(o); v.ev++;
box('<h3>⚡ ' + curEv.t + '</h3><p>' + esc(curEv.x) + '</p>' + btn('ea', esc(curEv.a[0])) + btn('eb', esc(curEv.b[0]), 'g'));
}

/* ---------- World Cup and national team job ---------- */
function pickXI(l) {
var by = { G: [], D: [], M: [], A: [] }, need = { G: 1, D: 4, M: 3, A: 3 }, xi = [], used = {};
l.forEach(function (p) { (by[H.GROUP[p.pos]] || by.M).push(p); });
['G', 'D', 'M', 'A'].forEach(function (k) { by[k].slice(0, need[k]).forEach(function (p) { xi.push(p); used[p.id] = 1; }); });
l.forEach(function (p) { if (xi.length < 11 && !used[p.id]) { xi.push(p); used[p.id] = 1; } });
return xi;
}
function mkTeam(n, l) {
l = l.slice().sort(function (a, b) { return b.o - a.o; });
var xi = pickXI(l), av = function (a) { return a.length ? a.reduce(function (s, p) { return s + p.o; }, 0) / a.length : 50; }, grp = function (k) { return xi.filter(function (p) { return H.GROUP[p.pos] === k; }); };
return { n: n, att: (av(grp('A')) * 2 + av(grp('M'))) / 3, def: (av(grp('G')) + av(grp('D')) * 2) / 3, ovr: av(xi), xi: xi.map(function (p) { return [p.n, H.GROUP[p.pos], p.o]; }) };
}
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function newWC(pref) {
var s = S(), by = {}; s.players.forEach(function (p) { if (p.nat) (by[p.nat] = by[p.nat] || []).push(p); });
var ts = Object.keys(by).filter(function (n) { return by[n].length >= 12; }).map(function (n) { return mkTeam(n, by[n]); }).sort(function (a, b) { return b.ovr - a.ovr; });
var N = ts.length >= 32 ? 32 : ts.length >= 16 ? 16 : 0; if (!N) return null;
var rep = s.mgr.rep, coach = pref && by[pref] && by[pref].length >= 11 ? pref : (ts[rep >= 75 ? Math.floor(Math.random() * 8) : rep >= 55 ? 8 + Math.floor(Math.random() * 12) : N - 1 - Math.floor(Math.random() * 8)] || ts[0]).n;
ts = ts.slice(0, N); if (!ts.some(function (t) { return t.n === coach; }) && by[coach]) ts[N - 1] = mkTeam(coach, by[coach]); ts.sort(function (a, b) { return b.ovr - a.ovr; });
var gn = N / 4, pots = [0, 1, 2, 3].map(function (i) { return shuffle(ts.slice(i * gn, (i + 1) * gn).map(function (t) { return t.n; })); }), groups = [], teams = {};
ts.forEach(function (t) { teams[t.n] = t; });
for (var i = 0; i < gn; i++) groups.push([pots[0][i], pots[1][i], pots[2][i], pots[3][i]]);
var fx = [], MD = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
for (var md = 0; md < 3; md++) groups.forEach(function (gr, gi) { MD[md].forEach(function (p) { fx.push({ a: gr[p[0]], b: gr[p[1]], gi: gi, ga: -1, gb: -1 }); }); });
return { y: s.year, offer: coach, coach: '', teams: teams, groups: groups, fx: fx, ko: [], ph: 'group', gold: {}, ment: 'balanced', champ: '', runner: '', msg: '' };
}
function pois(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L && k < 12); return k - 1; }
function scorers(wc, T, n) {
var out = [], w = T.xi.map(function (x) { return x[1] === 'A' ? 5 + x[2] / 20 : x[1] === 'M' ? 2 + x[2] / 40 : x[1] === 'D' ? 0.6 : 0; }), tot = w.reduce(function (a, b) { return a + b; }, 0);
for (var i = 0; i < n; i++) { var r = Math.random() * tot, j = 0; while (j < w.length - 1 && r > w[j]) { r -= w[j]; j++; } var nm = T.xi[j][0]; out.push(last(nm)); var k = nm + '|' + T.n; wc.gold[k] = (wc.gold[k] || 0) + 1; }
return out;
}
function playF(wc, f, ko) {
var A = wc.teams[f.a], B = wc.teams[f.b], la = 1.25 * Math.exp((A.att - B.def) / 18), lb = 1.25 * Math.exp((B.att - A.def) / 18);
if (wc.coach === f.a || wc.coach === f.b) { var m = wc.ment === 'attack' ? 1.12 : wc.ment === 'defend' ? 0.88 : 1; la *= m; lb *= m; }
f.ga = pois(la); f.gb = pois(lb); f.sa = scorers(wc, A, f.ga); f.sb = scorers(wc, B, f.gb);
if (ko) {
if (f.ga === f.gb) { var ea = pois(la * 0.33), eb = pois(lb * 0.33); f.ga += ea; f.gb += eb; f.sa = f.sa.concat(scorers(wc, A, ea)); f.sb = f.sb.concat(scorers(wc, B, eb)); f.et = 1; }
if (f.ga === f.gb) { var pa = Math.random() < 0.5 + (A.ovr - B.ovr) / 200; f.pen = pa ? [5, 4] : [4, 5]; f.w = pa ? f.a : f.b; } else f.w = f.ga > f.gb ? f.a : f.b;
}
}
function table(wc, gi) {
var t = {}; wc.groups[gi].forEach(function (n) { t[n] = { n: n, p: 0, gd: 0, gf: 0, pts: 0 }; });
wc.fx.forEach(function (f) { if (f.gi !== gi || f.ga < 0) return; var a = t[f.a], b = t[f.b]; a.p++; b.p++; a.gf += f.ga; b.gf += f.gb; a.gd += f.ga - f.gb; b.gd += f.gb - f.ga; if (f.ga > f.gb) a.pts += 3; else if (f.ga < f.gb) b.pts += 3; else { a.pts++; b.pts++; } });
return Object.keys(t).map(function (k) { return t[k]; }).sort(function (a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || Math.random() - 0.5; });
}
var RN = { 8: 'Round of 16', 4: 'Quarter-finals', 2: 'Semi-finals', 1: 'Final' };
function buildKO(wc) {
var W = [], R = []; wc.groups.forEach(function (g, i) { var t = table(wc, i); W.push(t[0].n); R.push(t[1].n); });
var ties = []; for (var i = 0; i < W.length; i += 2) { ties.push({ a: W[i], b: R[i + 1], ga: -1, gb: -1 }); ties.push({ a: W[i + 1], b: R[i], ga: -1, gb: -1 }); }
wc.ko = [{ name: RN[ties.length], ties: ties }]; wc.ph = 'ko';
}
function nextRound(wc) { var w = wc.ko[wc.ko.length - 1].ties.map(function (t) { return t.w; }), ties = []; for (var i = 0; i < w.length; i += 2) ties.push({ a: w[i], b: w[i + 1], ga: -1, gb: -1 }); wc.ko.push({ name: RN[ties.length], ties: ties }); }
function reached(wc) {
var c = wc.coach; if (!c) return ''; if (wc.champ === c) return 'Champions';
var n = '', last_ = null; wc.ko.forEach(function (r) { r.ties.forEach(function (t) { if (t.a === c || t.b === c) last_ = r.name; }); });
return last_ ? (last_ === 'Final' ? 'Runners-up' : last_) : 'Group stage';
}
function finishWC() {
var s = S(), v = V(), wc = v.wc, fin = wc.ko[wc.ko.length - 1].ties[0]; wc.ph = 'done'; wc.champ = fin.w; wc.runner = fin.w === fin.a ? fin.b : fin.a;
var rch = reached(wc), RW = { 'Group stage': [0.5, 20], 'Round of 16': [1, 40], 'Quarter-finals': [1.5, 80], 'Semi-finals': [2.5, 120], 'Runners-up': [4, 200], 'Champions': [8, 400] };
if (wc.coach) { var rw = RW[rch] || [0, 0]; s.mgr.rep = Math.min(100, s.mgr.rep + rw[0]); s.mgr.xp += rw[1]; news('🌍 World Cup ' + wc.y + ': ' + wc.coach + ' finished as ' + rch.toLowerCase() + ' under ' + s.mgr.name + '.', 'g'); }
news('🌍 World Cup ' + wc.y + ' winners: ' + wc.champ + '. Runners-up: ' + wc.runner + '.', 'w');
v.wcHist.unshift({ y: wc.y, champ: wc.champ, runner: wc.runner, coach: wc.coach, rch: rch }); if (v.wcHist.length > 6) v.wcHist.length = 6;
}
function stepWC(stop) {
var wc = V().wc;
for (var n = 0; n < 500; n++) {
if (wc.ph === 'group') {
var f = wc.fx.filter(function (x) { return x.ga < 0; })[0]; if (!f) { buildKO(wc); continue; }
if (stop && wc.coach && (f.a === wc.coach || f.b === wc.coach)) return 'user'; playF(wc, f, false);
} else if (wc.ph === 'ko') {
var rd = wc.ko[wc.ko.length - 1], t = rd.ties.filter(function (x) { return x.ga < 0; })[0];
if (!t) { if (rd.ties.length === 1) { finishWC(); return 'done'; } nextRound(wc); continue; }
if (stop && wc.coach && (t.a === wc.coach || t.b === wc.coach)) return 'user'; playF(wc, t, true);
} else return 'done';
}
return 'done';
}
function mineList(wc) {
var c = wc.coach, out = []; if (!c) return out;
wc.fx.forEach(function (f) { if (f.ga >= 0 && (f.a === c || f.b === c)) out.push(['Group', f]); });
wc.ko.forEach(function (r) { r.ties.forEach(function (t) { if (t.ga >= 0 && (t.a === c || t.b === c)) out.push([r.name, t]); }); });
return out;
}
var fl = function (f) { return esc(f.a) + ' <b>' + f.ga + ' - ' + f.gb + '</b> ' + esc(f.b) + (f.pen ? ' (pens ' + f.pen[0] + '-' + f.pen[1] + ')' : f.et ? ' (aet)' : ''); };
function wcBox() {
var v = V(), wc = v.wc; if (!wc) return box('<h3>🌍 World Cup</h3><p class="v4s">The next World Cup takes place every fourth summer. Last winners: ' + (v.wcHist[0] ? esc(v.wcHist[0].champ) + ' (' + v.wcHist[0].y + ')' : 'none yet') + '.</p>' + btn('x', 'Close', 'g'));
var h = '<h3>🌍 World Cup ' + wc.y + '</h3>', c = wc.coach;
if (c) { var T = wc.teams[c]; h += '<div class="v4c me"><b>You coach ' + esc(c) + '</b> <span class="v4s">rating ' + Math.round(T.ovr) + '</span><div class="v4s">Mentality</div>' + ['defend', 'balanced', 'attack'].map(function (m) { return btn('ment', m, wc.ment === m ? '' : 'g s', m).replace('v4b ', 'v4b s '); }).join('') + '</div>'; }
if (wc.ph === 'done') h += '<div class="v4c me"><b>🏆 ' + esc(wc.champ) + ' are world champions</b><div class="v4s">Runners-up: ' + esc(wc.runner) + (c ? ' · Your result: ' + reached(wc) : '') + '</div></div>';
else h += (c ? btn('wcnext', '▶ Play my next match') : '') + btn('wcall', '⏩ Simulate the rest', 'g');
if (wc.msg) h += '<div class="v4c">' + wc.msg + '</div>';
var ml = mineList(wc); if (ml.length) h += '<div class="v4t">My matches</div>' + ml.map(function (x) { return '<div class="v4r"><span>' + x[0] + '</span><span>' + fl(x[1]) + '</span></div>'; }).join('');
if (wc.ko.length) h += wc.ko.slice().reverse().map(function (r) { return '<div class="v4t">' + r.name + '</div>' + r.ties.map(function (t) { return '<div class="v4s" style="margin:2px 0">' + (t.ga >= 0 ? fl(t) : esc(t.a) + ' v ' + esc(t.b)) + '</div>'; }).join(''); }).join('');
h += '<div class="v4t">Groups</div>' + wc.groups.map(function (g, i) { return '<div class="v4c"><div class="v4s">Group ' + String.fromCharCode(65 + i) + '</div>' + table(wc, i).map(function (t) { return '<div class="v4r"' + (t.n === c ? ' style="color:#ffc928"' : '') + '><span>' + esc(t.n) + '</span><b>' + t.pts + ' pts · ' + (t.gd > 0 ? '+' : '') + t.gd + '</b></div>'; }).join('') + '</div>'; }).join('');
var gold = Object.keys(wc.gold).map(function (k) { return [k.split('|')[0], k.split('|')[1], wc.gold[k]]; }).sort(function (a, b) { return b[2] - a[2]; }).slice(0, 5);
if (gold.length) h += '<div class="v4t">Golden Boot race</div>' + gold.map(function (x) { return row(esc(x[0]) + ' <span class="v4s">' + esc(x[1]) + '</span>', x[2]); }).join('');
box(h + btn('x', 'Close', 'g'));
}
function wcOffer() {
var s = S(), v = V(), wc = newWC(v.nat); if (!wc) return; v.wc = wc; save();
box('<h3>🌍 The World Cup is here</h3><p>The <b>' + esc(wc.offer) + '</b> football association has been impressed by your work and wants you as national team coach for the World Cup. It runs alongside your club job.</p><div class="v4s">You pick the mentality and play each match. A deep run raises your reputation and manager XP.</div>' + btn('wcyes', 'Accept the job') + btn('wcno', 'Decline and just watch', 'g'));
}

/* ---------- one click handler for everything ---------- */
document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v4]'); if (!b) return;
var q = b.dataset.v4, k = b.dataset.k, s = S(), v = V(), g = G(); if (!s) return;
if (q === 'x') shut();
else if (q === 'mpic') pick(function (u) { v.img = u; save(); mgrBox(); });
else if (q === 'msave') { var nm = $('#v4n').value.trim(); if (nm.length >= 2) s.mgr.name = nm; v.nat = $('#v4nat').value; v.age = clamp(+$('#v4age').value || 45, 30, 75); v.bio = $('#v4bio').value.slice(0, 160); save(); shut(); refresh(); }
else if (q === 'rt') { var a = k.split('|'), id = +$('#v4rt').dataset.id, p = g.P[id], uc = H.userClub(g), c = +a[2]; if (v.ret.length >= 3) { b.textContent = 'Max 3 at once'; return; } if (uc.cash < c) { b.textContent = 'Not enough cash'; return; } uc.cash -= c; v.ret.push({ id: id, to: a[0], wk: +a[1], pen: +a[3] }); save(); retBox(p); }
else if (q === 'sg') { var z = k.split('|'), o = offersFor()[z[0]][+z[1]]; v.deals.push({ s: z[0], b: o.b, a: o.a, t: o.t, u: s.year + o.y }); save(); sponBox(); }
else if (q === 'ea' || q === 'eb') { if (curEv) { (q === 'ea' ? curEv.a : curEv.b)[1](); curEv = null; save(); } shut(); refresh(); }
else if (q === 'ment') { v.wc.ment = k; save(); wcBox(); }
else if (q === 'wcyes') { v.wc.coach = v.wc.offer; save(); wcBox(); }
else if (q === 'wcno') { v.wc.coach = ''; stepWC(false); save(); wcBox(); }
else if (q === 'wcnext') {
var wc = v.wc, r = stepWC(true);
if (r === 'user') { var f = wc.ph === 'group' ? wc.fx.filter(function (x) { return x.ga < 0; })[0] : wc.ko[wc.ko.length - 1].ties.filter(function (x) { return x.ga < 0; })[0]; playF(wc, f, wc.ph === 'ko'); wc.msg = '<b>Full time:</b> ' + fl(f) + (f.sa.length + f.sb.length ? '<div class="v4s">' + esc(f.a) + ': ' + (f.sa.join(', ') || '-') + ' · ' + esc(f.b) + ': ' + (f.sb.join(', ') || '-') + '</div>' : ''); }
save(); wcBox();
}
else if (q === 'wcall') { stepWC(false); v.wc.msg = ''; save(); wcBox(); }
else if (q === 'awgo') { shut(); if (pend) { gate = true; pend.click(); gate = false; pend = null; } }
else if (q === 'tool') { if (k === 'mgr') mgrBox(); else if (k === 'spon') sponBox(); else if (k === 'aw') awardsBox(); else if (k === 'wc') wcBox(); }
});

/* season-end awards before the review */
document.addEventListener('click', function (e) {
if (gate || ov) return; var b = e.target.closest('#screen [data-act="endseason"]'); if (!b || !G()) return;
try { var h = ceremony(); pend = b; box(h + btn('awgo', 'Continue to season review')); e.stopPropagation(); e.preventDefault(); } catch (er) { shut(); pend = null; }
}, true);

/* after every Advance: weekly work */
function weekTick() {
var s = S(), v = V(); if (!s || !v) return;
try {
if (s.year !== lastYr) { v.deals = v.deals.filter(function (d) { return d.u > s.year; }); v.ev = 0; lastYr = s.year; snap = msnap = null; }
retTick(); payDeals(); weekAwards();
if (s.stage === 'week' && v.ev < 5 && Math.random() < 0.18 && !ov) setTimeout(moment, 700);
save(); refresh();
} catch (e) { if (window.console) console.error('weekTick', e); }
}
document.addEventListener('click', function (e) { if (e.target.closest('#screen [data-act="advance"]')) setTimeout(weekTick, 80); });

/* World Cup summer: after a season ending in a World Cup year, at the next pre-season */
setInterval(function () {
var s = S(); if (!s || ov) return; var v = V();
if (snap == null && s.players) { snap = snapNow(); msnap = snapNow(); tsnap = tabSnap(); lastYr = s.year; }
if (s.stage === 'pre' && s.hist && s.hist.length && (s.year - 1) % 4 === 1 && !(v.wc && v.wc.y === s.year) && v.wcDone !== s.year) { v.wcDone = s.year; wcOffer(); }
}, 1500);

/* buttons inside the Game page and the player sheet */
function patch() {
var host = $('#screen .v3tools'); if (!host) { var r = $('#screen [data-act="renclub"]'); if (r && !$('#screen .v4tools')) { host = document.createElement('div'); host.className = 'v3tools v4tools'; r.parentNode.after(host); } }
if (host && !host.querySelector('[data-k="mgr"]')) host.insertAdjacentHTML('beforeend', '<div class="grid2" style="margin-top:8px"><button class="btn" data-v4="tool" data-k="mgr">👔 MANAGER</button><button class="btn" data-v4="tool" data-k="wc">🌍 WORLD CUP</button></div><div class="grid2" style="margin-top:8px"><button class="btn ghost" data-v4="tool" data-k="spon">🤝 SPONSORS</button><button class="btn ghost" data-v4="tool" data-k="aw">🏅 AWARDS</button></div>');
var sh = $('#layer .sheet'); if (sh && sh.querySelector('[data-x="release"]') && !sh.querySelector('.v4rt')) {
var h2 = sh.querySelector('h2'), p = h2 && playerByName(h2.textContent), cur = p && V().ret.filter(function (r) { return r.id === p.id; })[0];
if (p) { var d = document.createElement('div'); d.className = 'v4rt'; d.innerHTML = '<button class="btn ghost full" style="margin-top:8px" data-v4r="1">🔄 ' + (cur ? 'TRAINING AS ' + cur.to + ' (' + cur.wk + 'W)' : 'TRAIN NEW POSITION') + '</button>'; sh.appendChild(d); d.firstChild.onclick = function () { var l = $('#layer .sheetbg'); retBox(p); }; }
}
}
var scr = document.getElementById('screen'), lay = document.getElementById('layer');
if (scr) new MutationObserver(function () { requestAnimationFrame(patch); }).observe(scr, { childList: true });
if (lay) new MutationObserver(function () { requestAnimationFrame(patch); }).observe(lay, { childList: true });
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
try { if (!localStorage.getItem('hansfc_seen_' + VER)) { localStorage.setItem('hansfc_seen_' + VER, '1'); setTimeout(function () { if (!ov) box('<h3>HANS FC ' + VER + '</h3><ul style="padding-left:18px;line-height:1.4"><li>Weekly and monthly awards: Player of the Week and Month, Manager of the Month</li><li>Awards night at season end: Ballon d\'Or, Golden Boy, Golden Glove, Puskás, Coach of the Year, Team of the Year</li><li>World Cup every four years, with a call-up to coach a country</li><li>Train a player in a new position (open a player)</li><li>Manager profile with your own picture and nationality</li><li>More sponsors: sleeve, stadium, kit, training ground, partners</li><li>Random season moments to decide</li></ul><p class="v4s">Find the extras in Menu, Settings and More, under Game.</p>' + btn('x', 'Close')); }, 1500); } } catch (e) {}
window.__hfcV4 = { newWC: newWC, stepWC: stepWC, reached: reached, V: V, f: { ceremony: ceremony, offersFor: offersFor, weekAwards: weekAwards, payDeals: payDeals, retTick: retTick, moment: moment, mgrBox: mgrBox, sponBox: sponBox, awardsBox: awardsBox, wcBox: wcBox, wcOffer: wcOffer, retBox: retBox, weekTick: weekTick } };
} catch (err) { if (window.console) console.error('HANS FC 3.1 add-on failed', err); }
})();/* ===== HANS FC 3.3.0 add-on: MY PLAYING STYLES. PASTE AT THE VERY END of app.js, BELOW the 3.2.0 block. Do NOT select all. ===== */
(function () {
try {
var css = '.v6bg{position:fixed;inset:0;z-index:96;background:#000d;display:grid;place-items:center;padding:12px}.v6box{width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px;font-size:14px}.v6box h3{margin:0 0 8px;font-size:17px}.v6box label{display:block;font-size:12px;color:#9fb9dc;margin:8px 0 3px}.v6box input,.v6box select{width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid #3a5aa8;background:#0b1a38;color:#fff;font-size:15px}.v6b{display:block;width:100%;margin-top:8px;padding:10px;border:0;border-radius:6px;background:#2f6bff;color:#fff;font-weight:700;font-size:14px}.v6b.g{background:#2a3d66}.v6b.r{background:#a02a3a}.v6st{background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:13px;line-height:1.4}.v6c{display:flex;align-items:center;gap:6px;padding:9px 0;border-bottom:1px solid #1d3a73}.v6c .t{flex:1;min-width:0}.v6c small{display:block;color:#9fb9dc;font-size:11px;line-height:1.35}.v6c button{border:0;border-radius:6px;background:#2a3d66;color:#fff;padding:8px 9px;font-size:14px}.v6c button.go{background:#2f6bff}.v6g{color:#5fd68a}.v6o{color:#f0c35a}.v6w{color:#ff8a8a}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.3.0', ov = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var cap = function (v) { v = String(v == null ? '' : v); return v ? v[0].toUpperCase() + v.slice(1) : v; };
function V() { var s = S(); return s ? (s.v6 = s.v6 || { st: [] }) : null; }
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function toast(t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); } }
function box(html) { if (ov) ov.remove(); ov = document.createElement('div'); ov.className = 'v6bg'; ov.innerHTML = '<div class="v6box">' + html + '</div>'; document.body.appendChild(ov); }
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c, k) { return '<button class="v6b ' + (c || '') + '" data-v6="' + q + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + '>' + t + '</button>'; };
var val = function (id) { var e = $('#' + id); return e ? e.value.trim() : ''; };
var opts = function (arr, cur) { return (arr || []).map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(cap(v)) + '</option>'; }).join(''); };
var desc = function (o) { return esc(o.f) + ' · ' + esc(cap(o.m)) + ' · ' + esc(cap(o.s)) + ' · ' + esc(cap(o.p)) + ' pressing'; };

/* ---------- squad fit: how well your players suit a formation and a style (an estimate) ---------- */
function grp(pos) { var x = H.GROUP && H.GROUP[pos]; return x === 'G' || x === 'D' || x === 'M' ? x : 'F'; }
function weights(o) {
var s = String(o.s).toLowerCase(), m = String(o.m).toLowerCase(), w;
if (/poss|short|pass|tiki/.test(s)) w = { G: 0.08, D: 0.25, M: 0.45, F: 0.22 };
else if (/count|break|fast/.test(s)) w = { G: 0.08, D: 0.34, M: 0.2, F: 0.38 };
else if (/direct|long|rout/.test(s)) w = { G: 0.08, D: 0.28, M: 0.16, F: 0.48 };
else w = { G: 0.08, D: 0.3, M: 0.32, F: 0.3 };
if (/attack/.test(m)) { w.F += 0.08; w.D -= 0.08; } else if (/defen|park/.test(m)) { w.D += 0.08; w.F -= 0.08; }
return w;
}
function fit(o) {
var sl = H.FORMATIONS && H.FORMATIONS[o.f]; if (!sl) return null;
var cards = H.userCards(G()).filter(function (p) { return !p.out; }), used = {}, out = [], rest = [];
sl.forEach(function (x, i) { var b = null; cards.forEach(function (p) { if (!used[p.id] && p.pos === x[0] && (!b || p.o > b.o)) b = p; }); if (b) { used[b.id] = 1; out[i] = { e: b.o, nat: true, pos: x[0] }; } else rest.push(i); });
rest.forEach(function (i) { var x = sl[i], b = null, be = -999; cards.forEach(function (p) { if (used[p.id]) return; var e = p.o - (grp(p.pos) === grp(x[0]) ? 6 : 18) - ((grp(x[0]) === 'G') !== (grp(p.pos) === 'G') ? 30 : 0); if (e > be) { be = e; b = p; } }); if (b) { used[b.id] = 1; out[i] = { e: be, nat: false, pos: x[0] }; } else out[i] = { e: 30, nat: false, pos: x[0] }; });
var sum = {}, cnt = {}, tot = 0, miss = [];
out.forEach(function (r) { var g = grp(r.pos); sum[g] = (sum[g] || 0) + r.e; cnt[g] = (cnt[g] || 0) + 1; tot += r.e; if (!r.nat && miss.indexOf(r.pos) < 0) miss.push(r.pos); });
var avg = {}, w = weights(o), score = 0, ws = 0;
['G', 'D', 'M', 'F'].forEach(function (g) { if (cnt[g]) { avg[g] = sum[g] / cnt[g]; score += avg[g] * w[g]; ws += w[g]; } });
score = ws ? score / ws : 0;
return { score: Math.round(score), delta: score - tot / out.length, avg: avg, miss: miss };
}
function fitHtml(o) {
var r; try { r = fit(o); } catch (e) { r = null; } if (!r) return '<small>Fit unavailable</small>';
var lab = r.delta >= 1 ? ['Good fit', 'v6g'] : r.delta >= -1 ? ['OK fit', 'v6o'] : ['Weak fit', 'v6w'], a = r.avg;
return '<span class="' + lab[1] + '"><b>' + lab[0] + ' · ' + r.score + '</b></span> · Def ' + Math.round(a.D || 0) + ' · Mid ' + Math.round(a.M || 0) + ' · Att ' + Math.round(a.F || 0) + (r.miss.length ? '<br>No natural player for: ' + esc(r.miss.slice(0, 4).join(', ')) : '');
}

/* ---------- screens ---------- */
function cur() { var s = S(); return { f: s.formation, m: s.mentality, s: s.style, p: s.press }; }
function stylesBox() {
var v = V(), c = cur();
box('<h3>🎯 My playing styles</h3><div class="v6st"><b>Playing now:</b> ' + desc(c) + '<br>' + fitHtml(c) + '</div>' + (v.st.length < 8 ? btn('new', '➕ Create a new style') : '') + btn('sug', '💡 Suggest a style for my squad', 'g') +
(v.st.length ? v.st.map(function (o) { return '<div class="v6c"><div class="t"><b>' + esc(o.n) + '</b><small>' + desc(o) + '</small>' + (o.d ? '<small><i>' + esc(o.d) + '</i></small>' : '') + '<small>' + fitHtml(o) + '</small></div><button class="go" data-v6="apply" data-k="' + o.id + '">▶</button><button data-v6="edit" data-k="' + o.id + '">✏️</button></div>'; }).join('') : '<p style="font-size:12px;color:#9fb9dc">No saved styles yet. Create one to name your own way of playing and use it with one tap.</p>') + btn('x', 'Close', 'g'));
}
function editBox(o) {
var isNew = !o.id;
box('<h3>' + (isNew ? 'Create a style' : 'Edit style') + '</h3><label>Name</label><input id="v6n" maxlength="24" value="' + esc(o.n || '') + '" placeholder="For example: Fast counter"><label>My idea (optional)</label><input id="v6d" maxlength="70" value="' + esc(o.d || '') + '" placeholder="Win the ball, hit the wingers"><label>Formation</label><select id="v6f">' + opts(Object.keys(H.FORMATIONS), o.f) + '</select><label>Mentality</label><select id="v6m">' + opts(H.MENTALITY, o.m) + '</select><label>Style of play</label><select id="v6s">' + opts(H.STYLE, o.s) + '</select><label>Pressing</label><select id="v6p">' + opts(H.PRESS, o.p) + '</select><div class="v6st" id="v6fit"></div>' +
btn('save', 'Save', '', o.id || '') + btn('saveap', 'Save and play this way', '', o.id || '') + (isNew ? '' : btn('del', 'Delete this style', 'r', o.id)) + btn('list', 'Back', 'g'));
fitLive();
}
function fitLive() { var e = $('#v6fit'); if (e) e.innerHTML = fitHtml({ f: val('v6f'), m: val('v6m'), s: val('v6s'), p: val('v6p') }); }
function read(id) {
var o = { id: id || Date.now().toString(36), n: val('v6n'), d: val('v6d'), f: val('v6f'), m: val('v6m'), s: val('v6s'), p: val('v6p') };
if (o.n.length < 2) o.n = 'My style ' + (V().st.length + 1); return o;
}
function put(o) { var v = V(), i = -1; v.st.forEach(function (x, n) { if (x.id === o.id) i = n; }); if (i >= 0) v.st[i] = o; else v.st.push(o); save(); }
function apply(o) {
var g = G(), s = S(); if (!H.FORMATIONS[o.f]) return toast('That formation is not available');
if (s.formation !== o.f) H.setFormation(g, o.f);
if (H.MENTALITY.indexOf(o.m) >= 0) s.mentality = o.m; if (H.STYLE.indexOf(o.s) >= 0) s.style = o.s; if (H.PRESS.indexOf(o.p) >= 0) s.press = o.p;
save(); shut(); refresh(); toast('Playing: ' + o.n);
}
function suggest() {
var c = cur(), res = [];
Object.keys(H.FORMATIONS).forEach(function (f) { H.STYLE.forEach(function (sy) { var o = { f: f, m: c.m, s: sy, p: c.p }, r = fit(o); if (r) res.push({ o: o, sc: r.score, d: r.delta }); }); });
res.sort(function (a, b) { return b.sc - a.sc; });
box('<h3>💡 Best fits for your squad</h3><p style="font-size:12px;color:#9fb9dc;margin:0">Based on your players’ ratings and positions. This is an estimate, not a promise.</p>' + res.slice(0, 3).map(function (r) { return '<div class="v6c"><div class="t"><b>' + esc(r.o.f) + ' · ' + esc(cap(r.o.s)) + '</b><small>' + fitHtml(r.o) + '</small></div><button class="go" data-v6="use" data-k="' + esc(r.o.f + '|' + r.o.s) + '">Use</button></div>'; }).join('') + btn('list', 'Back', 'g'));
}

document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v6]'); if (!b || !G()) return;
var q = b.dataset.v6, k = b.dataset.k, v = V(), o, a;
var find = function (id) { return v.st.filter(function (x) { return x.id === id; })[0]; };
try {
if (q === 'x') shut();
else if (q === 'styles' || q === 'list') stylesBox();
else if (q === 'new') { o = cur(); o.n = ''; o.d = ''; editBox(o); }
else if (q === 'edit') { o = find(k); if (o) editBox(o); }
else if (q === 'save') { put(read(k || null)); stylesBox(); toast('Style saved'); }
else if (q === 'saveap') { o = read(k || null); put(o); apply(o); }
else if (q === 'del') { v.st = v.st.filter(function (x) { return x.id !== k; }); save(); stylesBox(); toast('Style deleted'); }
else if (q === 'apply') { o = find(k); if (o) apply(o); }
else if (q === 'sug') suggest();
else if (q === 'use') { a = k.split('|'); o = cur(); o.f = a[0]; o.s = a[1]; o.n = 'Suggested ' + a[0]; o.d = ''; editBox(o); }
} catch (er) { if (window.console) console.error('HANS FC 3.3 click', er); }
});
document.addEventListener('change', function (e) { if (e.target && /^v6[fmsp]$/.test(e.target.id || '')) fitLive(); });

/* buttons: Squad > Tactics and the Game page */
function patch() {
try {
if (!S() || !G()) return;
var tb = $('#screen [data-act="tac"][data-k="mentality"]'), d = tb && tb.closest('.darkbox');
if (d && !d.querySelector('[data-v6="styles"]')) d.insertAdjacentHTML('beforeend', '<button class="btn full" style="margin-top:10px" data-v6="styles">🎯 MY PLAYING STYLES</button>');
var host = $('#screen .v3tools'); if (host && !host.querySelector('[data-v6="styles"]')) host.insertAdjacentHTML('beforeend', '<button class="btn full" style="margin-top:8px" data-v6="styles">🎯 MY PLAYING STYLES</button>');
} catch (e) {}
}
var scr = document.getElementById('screen');
if (scr) new MutationObserver(function () { setTimeout(patch, 200); }).observe(scr, { childList: true });
setInterval(patch, 2000);
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
window.__hfcV6 = { fit: fit, ver: VER };
} catch (err) { if (window.console) console.error('HANS FC 3.3 add-on failed', err); }
})();/* ===== HANS FC 3.2.0 add-on. PASTE AT THE VERY END of app.js, BELOW the 3.1.0 block. Do NOT select all. ===== */
(function () {
try {
var css = '.v5bg{position:fixed;inset:0;z-index:95;background:#000d;display:grid;place-items:center;padding:12px}.v5box{width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px;font-size:14px}.v5box h3{margin:0 0 8px;font-size:17px}.v5box label{display:block;font-size:12px;color:#9fb9dc;margin:8px 0 3px}.v5box input,.v5box select{width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid #3a5aa8;background:#0b1a38;color:#fff;font-size:15px}.v5box input[type=color]{height:38px;padding:2px}.v5b{display:block;width:100%;margin-top:8px;padding:10px;border:0;border-radius:6px;background:#2f6bff;color:#fff;font-weight:700;font-size:14px}.v5b.g{background:#2a3d66}.v5b.r{background:#a02a3a}.v5r{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #1d3a73;font-size:13px}.v5c{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1d3a73}.v5f{width:54px;height:54px;border-radius:50%;overflow:hidden;flex:none;background:#c9d3e2;border:2px solid #4a6bc0}.v5c .sp{flex:1;min-width:0}.v5c small{display:block;color:#9fb9dc;font-size:11px}.v5c button{border:0;border-radius:6px;background:#2a3d66;color:#fff;padding:7px 9px;font-size:13px}.v5st{background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:13px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.2.0', ov = null, uid = 0;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
function V() { var s = S(); return s ? (s.v5 = s.v5 || { cp: {}, cn: {}, club: {} }) : null; }
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function toast(t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); } }
function box(html) { if (ov) ov.remove(); ov = document.createElement('div'); ov.className = 'v5bg'; ov.innerHTML = '<div class="v5box">' + html + '</div>'; document.body.appendChild(ov); }
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c, k) { return '<button class="v5b ' + (c || '') + '" data-v5="' + q + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + '>' + t + '</button>'; };
var row = function (l, r, c) { return '<div class="' + (c || 'v5r') + '"><span>' + l + '</span><b>' + r + '</b></div>'; };
var val = function (id) { var e = $('#' + id); return e ? e.value.trim() : ''; };
function shrink(f, cb) {
var rd = new FileReader(); rd.onerror = function () { cb(null); };
rd.onload = function () { var im = new Image(); im.onerror = function () { cb(null); }; im.onload = function () { var c = document.createElement('canvas'), sz = Math.min(im.width, im.height); c.width = c.height = 112; c.getContext('2d').drawImage(im, (im.width - sz) / 2, Math.max(0, (im.height - sz) / 4), sz, sz, 0, 0, 112, 112); cb(c.toDataURL('image/jpeg', 0.75)); }; im.src = rd.result; };
rd.readAsDataURL(f);
}
function pick(cb) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { if (i.files && i.files[0]) shrink(i.files[0], function (u) { if (u) cb(u); else toast('Could not read that picture'); }); }; i.click(); }

/* ---------- real stadiums and training grounds (capacities are approximate) ---------- */
var T = [
'arsenal;Emirates Stadium;60700;London;2006;London Colney', 'aston villa;Villa Park;42700;Birmingham;1897;Bodymoor Heath', 'bournemouth;Vitality Stadium;11300;Bournemouth;1910;', 'brentford;Gtech Community Stadium;17250;London;2020;',
'brighton,brighton and hove albion,brighton hove albion;Amex Stadium;31800;Brighton;2011;Amex Elite Performance Centre', 'burnley;Turf Moor;21900;Burnley;1883;Gawthorpe', 'chelsea;Stamford Bridge;40200;London;1877;Cobham', 'crystal palace;Selhurst Park;25500;London;1924;Beckenham',
'everton;Hill Dickinson Stadium;52800;Liverpool;2025;Finch Farm', 'fulham;Craven Cottage;29600;London;1896;Motspur Park', 'leeds,leeds united;Elland Road;37600;Leeds;1897;Thorp Arch', 'liverpool;Anfield;61300;Liverpool;1884;AXA Training Centre',
'manchester city,man city;Etihad Stadium;53400;Manchester;2003;City Football Academy', 'manchester united,man united,man utd,manchester utd;Old Trafford;74000;Manchester;1910;Carrington', 'newcastle,newcastle united;St James’ Park;52300;Newcastle;1892;Benton', 'nottingham forest,nottm forest;City Ground;30400;Nottingham;1898;',
'sunderland;Stadium of Light;49000;Sunderland;1997;Academy of Light', 'tottenham,tottenham hotspur,spurs;Tottenham Hotspur Stadium;62900;London;2019;Hotspur Way', 'west ham,west ham united;London Stadium;62500;London;2016;Rush Green', 'wolves,wolverhampton,wolverhampton wanderers;Molineux Stadium;31700;Wolverhampton;1889;Compton Park',
'leicester,leicester city;King Power Stadium;32300;Leicester;2002;Seagrave', 'southampton;St Mary’s Stadium;32500;Southampton;2001;Staplewood', 'ipswich,ipswich town;Portman Road;29800;Ipswich;1884;', 'sheffield united;Bramall Lane;32000;Sheffield;1855;',
'real madrid;Santiago Bernabéu;83000;Madrid;1947;Ciudad Real Madrid (Valdebebas)', 'barcelona;Spotify Camp Nou;99000;Barcelona;1957;Ciutat Esportiva Joan Gamper', 'atletico madrid,atletico de madrid;Riyadh Air Metropolitano;70500;Madrid;2017;Cerro del Espino', 'sevilla;Ramón Sánchez-Pizjuán;43900;Seville;1958;Ciudad Deportiva José Ramón Cisneros Palacios',
'real sociedad;Reale Arena (Anoeta);39500;San Sebastián;1993;Zubieta', 'athletic club,athletic bilbao,athletic;San Mamés;53300;Bilbao;2013;Lezama', 'villarreal;Estadio de la Cerámica;23000;Villarreal;1923;Ciudad Deportiva', 'valencia;Mestalla;49000;Valencia;1923;Ciudad Deportiva de Paterna',
'real betis,betis;Benito Villamarín;60700;Seville;1929;Ciudad Deportiva Luis del Sol', 'girona;Montilivi;14000;Girona;1970;', 'celta vigo,celta de vigo,celta;Balaídos;24700;Vigo;1928;A Madroa', 'osasuna;El Sadar;23500;Pamplona;1967;Tajonar', 'getafe;Coliseum;16500;Getafe;1998;', 'mallorca;Son Moix;26000;Palma;1999;', 'rayo vallecano;Estadio de Vallecas;14500;Madrid;1976;', 'espanyol;RCDE Stadium;40000;Cornellà;2009;',
'juventus;Allianz Stadium;41500;Turin;2011;Continassa', 'inter,inter milan,internazionale;San Siro (Giuseppe Meazza);75800;Milan;1926;Appiano Gentile', 'milan;San Siro (Giuseppe Meazza);75800;Milan;1926;Milanello', 'napoli;Stadio Diego Armando Maradona;54700;Naples;1959;Castel Volturno',
'roma;Stadio Olimpico;70600;Rome;1953;Trigoria', 'lazio;Stadio Olimpico;70600;Rome;1953;Formello', 'atalanta;Gewiss Stadium;24950;Bergamo;1928;Zingonia', 'fiorentina;Stadio Artemio Franchi;43000;Florence;1931;Viola Park', 'bologna;Stadio Renato Dall’Ara;36500;Bologna;1927;Casteldebole', 'torino;Stadio Olimpico Grande Torino;28200;Turin;1933;Filadelfia',
'genoa;Stadio Luigi Ferraris;36600;Genoa;1911;', 'udinese;Bluenergy Stadium;25100;Udine;1976;', 'sassuolo;Mapei Stadium;21500;Reggio Emilia;1995;', 'como;Stadio Giuseppe Sinigaglia;13600;Como;1927;',
'bayern munich,bayern,bayern munchen;Allianz Arena;75000;Munich;2005;Säbener Straße', 'borussia dortmund,dortmund;Signal Iduna Park;81400;Dortmund;1974;Brackel', 'rb leipzig,leipzig,rasenballsport leipzig;Red Bull Arena;47800;Leipzig;2004;Cottaweg', 'bayer leverkusen,bayer 04 leverkusen,leverkusen;BayArena;30200;Leverkusen;1958;Kurtekotten',
'eintracht frankfurt,frankfurt;Deutsche Bank Park;58000;Frankfurt;1925;', 'stuttgart,vfb stuttgart;MHPArena;60400;Stuttgart;1933;', 'borussia monchengladbach,monchengladbach,gladbach;Borussia-Park;54000;Mönchengladbach;2004;', 'wolfsburg;Volkswagen Arena;28900;Wolfsburg;2002;', 'werder bremen;Weserstadion;42100;Bremen;1909;',
'freiburg;Europa-Park Stadion;34700;Freiburg;2021;', 'union berlin;Stadion An der Alten Försterei;22000;Berlin;1920;', 'hoffenheim;PreZero Arena;30150;Sinsheim;2009;', 'mainz,mainz 05;Mewa Arena;33300;Mainz;2011;', 'hamburg,hamburger sv;Volksparkstadion;57000;Hamburg;1953;', 'schalke,schalke 04;Veltins-Arena;62000;Gelsenkirchen;2001;', 'augsburg;WWK Arena;30600;Augsburg;2009;',
'paris saint germain,paris sg,psg;Parc des Princes;47900;Paris;1972;Campus PSG (Poissy)', 'marseille,olympique marseille,olympique de marseille;Stade Vélodrome;67400;Marseille;1937;La Commanderie', 'lyon,olympique lyon,olympique lyonnais;Groupama Stadium;59000;Lyon;2016;Groupama OL Academy', 'monaco;Stade Louis II;18500;Monaco;1985;La Turbie',
'lille,losc lille;Decathlon Arena;50100;Lille;2012;Domaine de Luchin', 'nice,ogc nice;Allianz Riviera;36200;Nice;2013;', 'rennes,stade rennais;Roazhon Park;29200;Rennes;1912;La Piverdière', 'lens,rc lens;Stade Bollaert-Delelis;38000;Lens;1933;', 'nantes;Stade de la Beaujoire;35300;Nantes;1984;La Jonelière', 'strasbourg,rc strasbourg;Stade de la Meinau;32000;Strasbourg;1914;', 'toulouse;Stadium de Toulouse;33000;Toulouse;1937;',
'ajax;Johan Cruijff Arena;55000;Amsterdam;1996;De Toekomst', 'psv,psv eindhoven;Philips Stadion;35000;Eindhoven;1913;De Herdgang', 'feyenoord;De Kuip;47000;Rotterdam;1937;Varkenoord', 'az alkmaar,az;AFAS Stadion;19000;Alkmaar;2006;', 'benfica,sl benfica;Estádio da Luz;65000;Lisbon;2003;Benfica Campus (Seixal)', 'porto;Estádio do Dragão;50000;Porto;2003;Olival',
'sporting cp,sporting lisbon,sporting,sporting clube de portugal;Estádio José Alvalade;50000;Lisbon;2003;Academia de Alcochete', 'braga;Estádio Municipal de Braga;30000;Braga;2003;', 'celtic;Celtic Park;60000;Glasgow;1892;Lennoxtown', 'rangers;Ibrox Stadium;50800;Glasgow;1899;Auchenhowie', 'galatasaray;RAMS Park;52000;Istanbul;2011;Florya',
'fenerbahce;Şükrü Saracoğlu Stadium;47400;Istanbul;1908;', 'besiktas;Tüpraş Stadium;42000;Istanbul;2016;', 'club brugge,brugge;Jan Breydel Stadium;29000;Bruges;1975;', 'anderlecht,rsc anderlecht;Lotto Park;22500;Brussels;1917;', 'olympiacos;Karaiskakis Stadium;32000;Piraeus;1896;', 'panathinaikos;OPAP Arena;30000;Athens;2024;',
'red bull salzburg,salzburg;Red Bull Arena;30000;Salzburg;2003;', 'young boys,bsc young boys;Wankdorf Stadium;31000;Bern;1925;', 'copenhagen,fc copenhagen;Parken;38000;Copenhagen;1992;', 'basel,fc basel;St. Jakob-Park;38000;Basel;2001;',
'al hilal;Kingdom Arena;60000;Riyadh;2014;', 'al nassr;Al-Awwal Park;25000;Riyadh;2014;', 'inter miami;Chase Stadium;21500;Fort Lauderdale;2020;', 'la galaxy;Dignity Health Sports Park;27000;Carson;2003;'
].join('|');
var DB = {}, DK = [];
T.split('|').forEach(function (r) { var a = r.split(';'), rec = { s: a[1], c: +a[2], t: a[3], o: +a[4], g: a[5] || '' }; a[0].split(',').forEach(function (k) { DB[k] = rec; if (k.length >= 9 || k.indexOf(' ') > 0) DK.push(k); }); });
function norm(n) { return String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(fc|cf|afc|sc|ac|as|ssc|fk|ud|cd|sv|vfl|vfb|bsc|fsv|tsg|ssv|rcd)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function real(n) { var k = norm(n); if (DB[k]) return DB[k]; var w = ' ' + k + ' '; for (var i = 0; i < DK.length; i++) if (w.indexOf(' ' + DK[i] + ' ') >= 0) return DB[DK[i]]; return null; }
function info(c) { var o = V().club[c.id] || {}, b = real(o.rn || c.name) || {}; return { s: o.s || b.s || '', c: o.c || b.c || 0, t: o.t || b.t || '', o: o.o || b.o || 0, g: o.g || b.g || '', nick: o.nick || '', f: o.f || '' }; }
function stadRows(i, cls) { return (i.t ? row('City', esc(i.t), cls) : '') + (i.c ? row('Real capacity (approx.)', i.c.toLocaleString('en-US'), cls) : '') + (i.o ? row('Opened', i.o, cls) : '') + (i.g ? row('Training ground', esc(i.g), cls) : '') + (i.nick ? row('Nickname', esc(i.nick), cls) : '') + (i.f ? row('Founded', esc(i.f), cls) : ''); }

/* ---------- coaches and staff: every club gets a manager and five staff with portraits ---------- */
var FN = ['Carlos', 'Marco', 'Hans', 'Antoine', 'Diego', 'Luca', 'Mateo', 'Viktor', 'Sven', 'Ruben', 'Tomas', 'Andre'], LN = ['Alvarez', 'Bianchi', 'Keller', 'Moreau', 'Santos', 'Rossi', 'Novak', 'Larsen', 'Duarte', 'Fischer', 'Costa', 'Petrov'];
var NAT = ['England', 'Spain', 'Italy', 'Germany', 'France', 'Portugal', 'Netherlands', 'Brazil', 'Argentina', 'Scotland', 'Croatia', 'Denmark'];
var ROLES = [['mgr', 'Manager'], ['asst', 'Assistant manager'], ['gk', 'Goalkeeping coach'], ['fit', 'Fitness coach'], ['scout', 'Head scout'], ['phys', 'Head physio']];
function rng(seed) { var x = (seed * 2654435761 + 12345) % 4294967296; return function () { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }
function staff(c, ri) {
var key = c.id * 10 + ri, o = V().cn[key] || {}, r = rng(key + 11), uc = H.userClub(G()), mine = uc && c.id === uc.id, v4 = S().v4;
var nm = ri === 0 ? FN[c.id % 12] + ' ' + LN[(c.id * 7 + 3) % 12] : FN[(c.id * 5 + ri * 3 + 1) % 12] + ' ' + LN[(c.id * 3 + ri * 5 + 2) % 12];
var nat = NAT[Math.floor(r() * 12)], a = ri === 0 ? 40 + Math.floor(r() * 25) : 32 + Math.floor(r() * 30);
if (mine && ri === 0) { nm = S().mgr.name; if (v4) { nat = v4.nat || nat; a = v4.age || a; } }
return { key: key, role: ROLES[ri][1], rk: ROLES[ri][0], n: o.n || nm, nat: o.nat || nat, a: o.a || a, mine: mine };
}
function sh(h, d) { var n = parseInt(h.slice(1), 16), f = function (v) { return Math.max(0, Math.min(255, v)); }; return '#' + ((1 << 24) + (f((n >> 16) + d) << 16) + (f(((n >> 8) & 255) + d) << 8) + f((n & 255) + d)).toString(16).slice(1); }
var SK = ['#f2cfb0', '#e6b78f', '#d09c74', '#b07850', '#8a5a38', '#5e3b24'], HR = ['#15110d', '#35261a', '#5d4129', '#8d6a3f', '#8b8b8b', '#cfcfcf'], EY = ['#4a3220', '#3d6a8c', '#4f7a4a', '#2a2018'];
function cface(key, col, rk, nat, age) {
var r = rng(key * 31 + 5), id = 'cf' + (++uid), a = age || 45, old = a > 52 ? 1 : a > 44 ? 0.5 : 0;
var sk = SK[Math.floor(r() * 4) + (nat === 'Brazil' ? 2 : 0)], hr = HR[r() < old ? (r() < 0.5 ? 4 : 5) : Math.floor(r() * 4)], e = EY[Math.floor(r() * 4)];
var gl = r() < 0.3, stub = r() < 0.4, smile = r() < 0.5, hs = old && r() < 0.45 ? (r() < 0.5 ? 0 : 3) : 1 + Math.floor(r() * 2), suit = rk === 'mgr' || rk === 'asst';
col = /^#[0-9a-f]{6}$/i.test(col || '') ? col : '#2f6bff';
var s1 = sh(sk, -12), s2 = sh(sk, -26);
var hair = ['', '<path d="M31 40C28 17 72 17 69 40C66 31 59 27 50 27C41 27 34 31 31 40Z" fill="' + hr + '"/>', '<path d="M31 40C27 16 73 14 69 40C67 30 62 26 54 25C46 24 36 28 31 40Z" fill="' + hr + '"/><path d="M36 28C44 22 58 23 66 29" stroke="' + sh(hr, 25) + '" stroke-width="1.4" fill="none"/>', '<path d="M31 42C29 28 38 23 45 25C39 28 36 33 34 43ZM69 42C71 28 62 23 55 25C61 28 64 33 66 43Z" fill="' + hr + '"/>'][hs];
return '<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + id + 'a" x1="0" x2="1"><stop offset="0" stop-color="' + s1 + '"/><stop offset=".5" stop-color="' + sk + '"/><stop offset="1" stop-color="' + s2 + '"/></linearGradient><radialGradient id="' + id + 'b" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#eef3fb"/><stop offset="1" stop-color="#9fb0c8"/></radialGradient></defs>' +
'<rect width="100" height="100" fill="url(#' + id + 'b)"/><path d="M6 100C8 80 28 73 50 73C72 73 92 80 94 100Z" fill="' + (suit ? '#1b2433' : col) + '"/>' +
(suit ? '<path d="M39 73L50 90L61 73Z" fill="#f4f6fa"/><path d="M48 77h4l1.5 15L50 96l-3.5-4z" fill="#8f1d2c"/>' : '<path d="M38 73L50 84L62 73Z" fill="' + sh(col, 40) + '"/><path d="M50 84V100" stroke="' + sh(col, -40) + '" stroke-width="1.2"/>') +
'<rect x="42" y="58" width="16" height="18" rx="6" fill="url(#' + id + 'a)"/><path d="M42 65Q50 72 58 65V61H42Z" fill="#000" opacity=".16"/><ellipse cx="31" cy="45" rx="3.2" ry="5.5" fill="' + s1 + '"/><ellipse cx="69" cy="45" rx="3.2" ry="5.5" fill="' + s2 + '"/><ellipse cx="50" cy="42" rx="19" ry="23" fill="url(#' + id + 'a)"/>' + hair +
'<path d="M37 36Q42 33 47 35.5M53 35.5Q58 33 63 36" stroke="' + hr + '" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="40" rx="3.4" ry="2.1" fill="#fff"/><ellipse cx="58" cy="40" rx="3.4" ry="2.1" fill="#fff"/><circle cx="42" cy="40" r="1.7" fill="' + e + '"/><circle cx="58" cy="40" r="1.7" fill="' + e + '"/><circle cx="42" cy="40" r=".8" fill="#000"/><circle cx="58" cy="40" r=".8" fill="#000"/>' +
'<path d="M50 41L48.3 50Q50 52 52 50" stroke="' + s2 + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>' + (stub ? '<path d="M33 49Q35 65 50 66Q65 65 67 49Q60 59 50 59Q40 59 33 49Z" fill="' + hr + '" opacity=".25"/>' : '') +
'<path d="' + (smile ? 'M43 56Q50 61 57 56' : 'M44 57Q50 59 56 57') + '" stroke="#8a3a3a" stroke-width="1.7" fill="none" stroke-linecap="round"/>' + (old > 0.4 ? '<path d="M41 31Q50 29 59 31" stroke="' + s2 + '" stroke-width=".8" fill="none" opacity=".5"/>' : '') +
(gl ? '<circle cx="42" cy="40" r="6" fill="none" stroke="#222" stroke-width="1.2"/><circle cx="58" cy="40" r="6" fill="none" stroke="#222" stroke-width="1.2"/><path d="M48 39.5Q50 38 52 39.5" stroke="#222" stroke-width="1.1" fill="none"/>' : '') + '</svg>';
}
var oldFace = H.face;
H.face = function (p, sz, col) {
try {
if (p && p.ck != null) { var im = V().cp[p.ck]; return im ? '<img src="' + im + '" style="width:100%;height:100%;object-fit:cover" alt="">' : cface(p.ck, col, p.rk, p.nat, p.a); }
if (p && p.id === 4242) { var v4 = S().v4; if (!(v4 && v4.img)) return cface(4242, col, 'mgr', v4 && v4.nat, v4 && v4.age); }
} catch (e) {}
return oldFace.apply(this, arguments);
};
var clubs = function () { var c = S().clubs; return Array.isArray(c) ? c : Object.keys(c).map(function (k) { return c[k]; }); };
var natList = function (cur) { var n = {}; S().players.forEach(function (p) { if (p.nat) n[p.nat] = 1; }); if (cur) n[cur] = 1; return Object.keys(n).sort().map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); };

function staffBox(cid) {
var s = S(), uc = H.userClub(G()), c = s.clubs[cid == null ? uc.id : cid], i = info(c), my = c.id === uc.id;
box('<h3>Coaches and staff</h3><label>Club</label><select id="v5cl">' + clubs().filter(function (x) { return x.lg === uc.lg; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>' +
(i.s ? '<div class="v5st"><b>🏟️ ' + esc(i.s) + '</b>' + stadRows(i) + '</div>' : '') +
ROLES.map(function (r, n) { var m = staff(c, n), fp = (n === 0 && my) ? { id: 4242, n: 'M', nat: m.nat, a: m.a } : { ck: m.key, rk: m.rk, nat: m.nat, a: m.a }; return '<div class="v5c"><div class="v5f">' + H.face(fp, 54, c.col) + '</div><div class="sp"><b>' + esc(m.n) + '</b><small>' + m.role + ' · ' + esc(m.nat) + ' · ' + m.a + ' years</small></div><button data-v5="sedit" data-k="' + c.id + '|' + n + '">✏️</button></div>'; }).join('') + btn('cust', 'Back', 'g') + btn('x', 'Close', 'g'));
}
function sedit(cid, ri) {
var c = S().clubs[cid], m = staff(c, ri);
if (ri === 0 && m.mine && window.__hfcV4 && window.__hfcV4.f.mgrBox) return window.__hfcV4.f.mgrBox();
box('<h3>' + m.role + '</h3><div style="width:90px;height:90px;border-radius:50%;overflow:hidden;margin:0 auto">' + H.face({ ck: m.key, rk: m.rk, nat: m.nat, a: m.a }, 90, c.col) + '</div>' + btn('spic', '📷 Change picture', 'g', m.key) + '<label>Name</label><input id="v5n" maxlength="24" value="' + esc(m.n) + '"><label>Nationality</label><input id="v5na" maxlength="20" value="' + esc(m.nat) + '"><label>Age</label><input id="v5ag" type="number" min="25" max="80" value="' + m.a + '">' + btn('ssave', 'Save', '', m.key) + btn('staff', 'Back', 'g', cid));
}

/* ---------- customize: club, stadium, players ---------- */
function custBox() { box('<h3>Customize</h3><p style="font-size:12px;color:#9fb9dc;margin:0">Create your own information. Everything is saved with your game.</p>' + btn('club', '🏟️ My club, stadium and facilities') + btn('staff', '👥 Coaches and staff', 'g') + btn('plist', '🧑 My players: info and photos', 'g') + btn('newp', '🆕 Create my own player', 'g') + btn('x', 'Close', 'g')); }
function clubBox() {
var uc = H.userClub(G()), i = info(uc), col = /^#[0-9a-f]{6}$/i.test(uc.col || '') ? uc.col : '#2f6bff';
box('<h3>My club and stadium</h3><label>Club name</label><input id="v5a" maxlength="28" value="' + esc(uc.name) + '"><label>Stadium name</label><input id="v5b" maxlength="34" value="' + esc(i.s) + '"><label>City</label><input id="v5c" maxlength="24" value="' + esc(i.t) + '"><label>Stadium capacity (shown on screen)</label><input id="v5d" type="number" min="1000" max="150000" value="' + (i.c || '') + '"><label>Opened</label><input id="v5e" type="number" min="1800" max="2100" value="' + (i.o || '') + '"><label>Training ground</label><input id="v5g" maxlength="34" value="' + esc(i.g) + '"><label>Nickname</label><input id="v5h" maxlength="24" value="' + esc(i.nick) + '"><label>Founded</label><input id="v5i" maxlength="4" value="' + esc(i.f) + '"><label>Main kit colour</label><input id="v5k" type="color" data-o="' + col + '" value="' + col + '">' + btn('csave', 'Save') + btn('creset', 'Back to real stadium data', 'g') + btn('cust', 'Back', 'g'));
}
var pl = function (id) { return H.userCards(G()).filter(function (p) { return p.id === id; })[0]; };
function plBox() {
var uc = H.userClub(G()), cards = H.userCards(G()).slice().sort(function (a, b) { return b.o - a.o; }), n = cards.filter(function (p) { return p.img; }).length;
box('<h3>My players</h3><div style="font-size:12px;color:#9fb9dc">' + n + ' of ' + cards.length + ' have a photo. Tap 📷 to add one, or use IMPORT PHOTOS on the Game page to add many at once (file name = player name).</div>' + btn('miss', '📋 Copy names of players without a photo', 'g') +
cards.map(function (p) { return '<div class="v5c"><div class="v5f">' + H.face(p, 54, uc.col) + '</div><div class="sp"><b>' + esc(p.n) + '</b><small>' + p.pos + ' · ' + esc(p.nat || '') + ' · ' + p.a + 'y · ' + p.o + '</small></div><button data-v5="ppic" data-k="' + p.id + '">📷</button><button data-v5="pedit" data-k="' + p.id + '">✏️</button></div>'; }).join('') + btn('cust', 'Back', 'g'));
}
function pedit(p) { box('<h3>' + esc(p.n) + '</h3><label>Name</label><input id="v5n" maxlength="28" value="' + esc(p.n) + '"><label>Nationality</label><select id="v5na">' + natList(p.nat) + '</select><label>Age</label><input id="v5ag" type="number" min="15" max="45" value="' + p.a + '">' + btn('psave', 'Save', '', p.id) + btn('plist', 'Back', 'g')); }
function newBox(msg) {
var o = {}; Object.keys(H.FORMATIONS).forEach(function (k) { H.FORMATIONS[k].forEach(function (s) { o[s[0]] = 1; }); });
box('<h3>Create my own player</h3>' + (msg ? '<div class="v5st">' + esc(msg) + '</div>' : '') + '<label>Name</label><input id="v5n" maxlength="28"><label>Nationality</label><select id="v5na">' + natList('') + '</select><label>Age</label><input id="v5ag" type="number" min="15" max="40" value="19"><label>Position</label><select id="v5ps">' + Object.keys(o).map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select><label>Overall (40 to 95)</label><input id="v5o" type="number" min="40" max="95" value="70"><label>Potential (40 to 99)</label><input id="v5p" type="number" min="40" max="99" value="82">' + btn('pnew', 'Add to my squad') + btn('cust', 'Back', 'g'));
}
function addPlayer() {
var g = G(), s = S(), uc = H.userClub(g), pos = val('v5ps'), cards = H.userCards(g), nm = val('v5n');
if (nm.length < 2) return newBox('Please type a name.');
var base = cards.filter(function (p) { return p.pos === pos; })[0] || cards[0]; if (!base) return newBox('There is no squad to copy from.');
try { localStorage.setItem(KEY + '_bak32', localStorage.getItem(KEY) || ''); } catch (e) {}
var np = JSON.parse(JSON.stringify(base)), mx = 0; s.players.forEach(function (p) { if (p.id > mx) mx = p.id; });
var o = clamp(+val('v5o') || 70, 40, 95), pt = clamp(+val('v5p') || o, o, 99), ratio = Math.pow(o / (base.o || 70), 3);
np.id = mx + 1; np.n = nm; np.nat = val('v5na'); np.a = clamp(+val('v5ag') || 19, 15, 40); np.pos = pos; np.o = o; np.cl = uc.id; np.g = 0; np.as = 0; np.ap = 0; delete np.img;
if (typeof np.p === 'number') np.p = pt; else if (typeof np.pot === 'number') np.pot = pt;
['w', 'v'].forEach(function (k) { if (typeof np[k] === 'number') np[k] = Math.max(0.0001, np[k] * ratio); });
if (typeof np.inj === 'number') np.inj = 0;
np.ct = 4; np.mo = 75; np.ft = 100; np.sus = 0; np.yc = 0; np.rs = 0; np.rn = 0; np.yth = false; np.lst = false;
if (H.userCards(g).length >= 38) return newBox('Your squad is full (38 players). Sell or release someone first.');
H.addPlayer(g, np);
if (typeof H.setNextId === 'function' && typeof H.getNextId === 'function') H.setNextId(Math.max(H.getNextId(), np.id + 1));
Object.keys(s).forEach(function (k) { if (/^(nid|nextid|nextpid|pidn|idn|idc)$/i.test(k) && typeof s[k] === 'number' && s[k] <= np.id) s[k] = np.id + 1; });
if (!H.userCards(g).some(function (p) { return p.id === np.id; })) { s.players.pop(); if (g.P) delete g.P[np.id]; return newBox('Could not add the player, so nothing was changed.'); }
try { H.recalcClub(g, uc); H.fixLineup(g); } catch (e) {}
save(); shut(); refresh(); toast(nm + ' joined ' + uc.name);
}

document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v5]'); if (!b || !G()) return;
var q = b.dataset.v5, k = b.dataset.k, g = G(), s = S(), uc = H.userClub(g), a;
try {
if (q === 'x') shut();
else if (q === 'cust') custBox();
else if (q === 'staff') staffBox(k == null || k === '' ? null : +k);
else if (q === 'sedit') { a = k.split('|'); sedit(+a[0], +a[1]); }
else if (q === 'spic') pick(function (u) { V().cp[+k] = u; save(); sedit(Math.floor(k / 10), k % 10); refresh(); });
else if (q === 'ssave') { var cn = V().cn[+k] = { n: val('v5n') || undefined, nat: val('v5na') || undefined, a: clamp(+val('v5ag') || 45, 25, 80) }; save(); staffBox(Math.floor(k / 10)); }
else if (q === 'club') clubBox();
else if (q === 'csave') {
var prev = V().club[uc.id] || {}, old = uc.name, nm = val('v5a'), kc = $('#v5k');
if (nm.length >= 2) uc.name = nm;
V().club[uc.id] = { rn: prev.rn || old, s: val('v5b'), t: val('v5c'), c: +val('v5d') || 0, o: +val('v5e') || 0, g: val('v5g'), nick: val('v5h'), f: val('v5i') };
if (kc && kc.value !== kc.dataset.o) uc.col = kc.value;
save(); shut(); refresh(); toast('Club saved');
}
else if (q === 'creset') { var pv = V().club[uc.id]; if (pv && pv.rn) V().club[uc.id] = { rn: pv.rn }; else delete V().club[uc.id]; save(); clubBox(); toast('Real data restored'); }
else if (q === 'plist') plBox();
else if (q === 'ppic') { var p1 = pl(+k); if (p1) pick(function (u) { p1.img = u; save(); plBox(); refresh(); toast('Photo saved'); }); }
else if (q === 'pedit') { var p2 = pl(+k); if (p2) pedit(p2); }
else if (q === 'psave') { var p3 = pl(+k); if (p3) { var nn = val('v5n'); if (nn.length >= 2) p3.n = nn; p3.nat = val('v5na') || p3.nat; p3.a = clamp(+val('v5ag') || p3.a, 15, 45); save(); plBox(); refresh(); } }
else if (q === 'miss') { var m = H.userCards(g).filter(function (p) { return !p.img; }).map(function (p) { return p.n; }).join('\n'); if (navigator.clipboard) navigator.clipboard.writeText(m).then(function () { toast('Names copied'); }, function () { toast('Could not copy'); }); else toast('Copy is not available'); }
else if (q === 'newp') newBox();
else if (q === 'pnew') addPlayer();
} catch (er) { if (window.console) console.error('HANS FC 3.2 click', er); }
});
document.addEventListener('change', function (e) { if (e.target && e.target.id === 'v5cl') staffBox(+e.target.value); });

/* real stadium on the finance and facilities screens, buttons on the Game page */
function patch() {
try {
var s = S(); if (!s || !G()) return; var uc = H.userClub(G()); if (!uc) return; var i = info(uc);
var hb = $('#screen .sthd .sp b'); if (hb && i.s && hb.dataset.v5s !== i.s) { hb.dataset.v5s = i.s; hb.textContent = i.s.toUpperCase(); }
var bs = document.querySelectorAll('#screen .darkbox > b');
for (var n = 0; n < bs.length; n++) { var b = bs[n], d = b.parentNode; if (b.textContent.indexOf('🏟') === 0 && !d.querySelector('.v5x')) { var rows = stadRows(i, 'kv'); if (i.s) b.textContent = '🏟️ ' + i.s.toUpperCase(); if (rows) d.insertAdjacentHTML('beforeend', '<div class="v5x">' + rows + '</div>'); else d.insertAdjacentHTML('beforeend', '<span class="v5x"></span>'); } }
var host = $('#screen .v3tools'); if (host && !host.querySelector('[data-v5="cust"]')) host.insertAdjacentHTML('beforeend', '<div class="grid2" style="margin-top:8px"><button class="btn" data-v5="staff">👥 COACHES</button><button class="btn" data-v5="cust">✏️ CUSTOMIZE</button></div>');
} catch (e) {}
}
var scr = document.getElementById('screen');
if (scr) new MutationObserver(function () { setTimeout(patch, 150); }).observe(scr, { childList: true });
setInterval(patch, 2000);
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
window.__hfcV5 = { real: real, norm: norm, info: info, staff: staff, cface: cface, ver: VER };
} catch (err) { if (window.console) console.error('HANS FC 3.2 add-on failed', err); }
})();/* ===== HANS FC 3.4.0 add-on: PLAYER TRAINING, BOOSTERS, PLAYSTYLES, GAME PLANS. PASTE AT THE VERY END of app.js, BELOW the 3.3.0 block. Do NOT select all. ===== */
(function () {
try {
var css = '.v7bg{position:fixed;inset:0;z-index:97;background:#000d;display:grid;place-items:center;padding:12px}.v7box{width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px;font-size:14px}.v7box h3{margin:0 0 8px;font-size:17px}.v7box label{display:block;font-size:12px;color:#9fb9dc;margin:8px 0 3px}.v7box select{width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid #3a5aa8;background:#0b1a38;color:#fff;font-size:14px}.v7b{display:block;width:100%;margin-top:8px;padding:10px;border:0;border-radius:6px;background:#2f6bff;color:#fff;font-weight:700;font-size:14px}.v7b.g{background:#2a3d66}.v7b[disabled]{opacity:.4}.v7st{background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:13px;line-height:1.45}.v7c{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #1d3a73}.v7c .t{flex:1;min-width:0}.v7c small{display:block;color:#9fb9dc;font-size:11px;line-height:1.35}.v7c button{border:0;border-radius:6px;background:#2f6bff;color:#fff;padding:8px 10px;font-size:13px;font-weight:700}.v7c button[disabled]{background:#2a3d66;opacity:.5}.v7f{width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none;background:#c9d3e2;border:2px solid #4a6bc0}.v7g{color:#5fd68a}.v7o{color:#f0c35a}.v7w{color:#ff8a8a}.v7c select{width:auto;max-width:150px;padding:6px;font-size:12px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.4.0', ov = null, sel = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var cap = function (v) { v = String(v == null ? '' : v); return v ? v[0].toUpperCase() + v.slice(1) : v; };
function V() { var s = S(); if (!s) return null; if (!s.v7) s.v7 = { tp: 100, t: {}, ps: {}, bo: { fit: 1, train: 1, pot: 0 }, half: false, ly: s.year, lw: s.week }; return s.v7; }
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function toast(t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); } }
function box(html) { if (ov) ov.remove(); ov = document.createElement('div'); ov.className = 'v7bg'; ov.innerHTML = '<div class="v7box">' + html + '</div>'; document.body.appendChild(ov); }
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c, k, off) { return '<button class="v7b ' + (c || '') + '" data-v7="' + q + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + (off ? ' disabled' : '') + '>' + t + '</button>'; };
function grp(pos) { var x = H.GROUP && H.GROUP[pos]; return x === 'G' || x === 'D' || x === 'M' ? x : 'F'; }
var squad = function () { return H.userCards(G()).filter(function (p) { return !p.out; }).sort(function (a, b) { return b.o - a.o; }); };
var kit = function () { var uc = H.userClub(G()); return uc && uc.col; };

/* ---------- playstyles ---------- */
var PS = { GK: ['Offensive Goalkeeper', 'Defensive Goalkeeper'], CB: ['Build Up', 'Destroyer', 'Extra Frontman'], FB: ['Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher'], DM: ['Anchor Man', 'Destroyer', 'Orchestrator'], CM: ['Box-to-Box', 'Orchestrator', 'Hole Player'], AM: ['Classic No. 10', 'Hole Player', 'Creative Playmaker'], WG: ['Prolific Winger', 'Roaming Flank', 'Cross Specialist'], ST: ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Dummy Runner', 'Deep-lying Forward'] };
function role(pos) {
pos = String(pos).toUpperCase();
if (/GK/.test(pos)) return 'GK'; if (/WB|LB|RB/.test(pos)) return 'FB'; if (/CB|SW/.test(pos)) return 'CB'; if (/DM/.test(pos)) return 'DM'; if (/AM/.test(pos)) return 'AM'; if (/LW|RW|LM|RM|^W/.test(pos)) return 'WG'; if (/CM|MF|^M$/.test(pos)) return 'CM'; if (/ST|CF|FW|SS/.test(pos)) return 'ST';
var g = grp(pos); return g === 'G' ? 'GK' : g === 'D' ? 'CB' : g === 'M' ? 'CM' : 'ST';
}
function pstyle(p) { var o = V().ps[p.id], l = PS[role(p.pos)]; return o && l.indexOf(o) >= 0 ? o : l[(p.id * 7 + 3) % l.length]; }

/* ---------- game plans ---------- */
var PLANS = [
{ n: 'Possession Game', d: 'Keep the ball and build patiently through midfield.', w: { G: 0.08, D: 0.25, M: 0.45, F: 0.22 }, m: /balanc|normal|standard/, s: /poss|short|pass|tiki/, p: /med|mid|normal/, t: ['Orchestrator', 'Build Up', 'Box-to-Box', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Offensive Goalkeeper', 'Deep-lying Forward'] },
{ n: 'Quick Counter', d: 'Win it back high and hit the space behind fast.', w: { G: 0.08, D: 0.3, M: 0.2, F: 0.42 }, m: /balanc|normal|standard/, s: /count|break|fast/, p: /high/, t: ['Prolific Winger', 'Roaming Flank', 'Goal Poacher', 'Fox in the Box', 'Dummy Runner', 'Destroyer', 'Anchor Man'] },
{ n: 'Long Ball Counter', d: 'Sit deep, win it, then go long to the front line.', w: { G: 0.1, D: 0.38, M: 0.14, F: 0.38 }, m: /defen|park/, s: /direct|long|rout/, p: /low/, t: ['Target Man', 'Extra Frontman', 'Destroyer', 'Defensive Goalkeeper', 'Anchor Man', 'Goal Poacher', 'Defensive Full-back'] },
{ n: 'Out Wide', d: 'Stretch the pitch and deliver crosses from both flanks.', w: { G: 0.08, D: 0.26, M: 0.26, F: 0.4 }, m: /attack/, s: /wide|wing|cross|direct/, p: /med|mid|normal/, t: ['Prolific Winger', 'Cross Specialist', 'Roaming Flank', 'Offensive Full-back', 'Full-back Finisher', 'Target Man', 'Fox in the Box'] },
{ n: 'Long Ball', d: 'Go direct. Target the striker and chase knock-downs.', w: { G: 0.08, D: 0.28, M: 0.16, F: 0.48 }, m: /attack|balanc/, s: /direct|long|rout/, p: /low|med|mid/, t: ['Target Man', 'Extra Frontman', 'Dummy Runner', 'Box-to-Box', 'Goal Poacher', 'Fox in the Box', 'Offensive Goalkeeper'] }
];
var pickv = function (arr, re, cur) { var r = (arr || []).filter(function (v) { return re.test(String(v).toLowerCase()); })[0]; return r || cur; };
function xi(f) {
var sl = H.FORMATIONS && H.FORMATIONS[f]; if (!sl) return null;
var cards = squad(), used = {}, out = [], rest = [];
sl.forEach(function (x, i) { var b = null; cards.forEach(function (p) { if (!used[p.id] && p.pos === x[0] && (!b || p.o > b.o)) b = p; }); if (b) { used[b.id] = 1; out[i] = { p: b, e: b.o, nat: true, pos: x[0] }; } else rest.push(i); });
rest.forEach(function (i) { var x = sl[i], b = null, be = -999; cards.forEach(function (p) { if (used[p.id]) return; var e = p.o - (grp(p.pos) === grp(x[0]) ? 6 : 18) - ((grp(x[0]) === 'G') !== (grp(p.pos) === 'G') ? 30 : 0); if (e > be) { be = e; b = p; } }); if (b) used[b.id] = 1; out[i] = { p: b, e: b ? be : 30, nat: false, pos: x[0] }; });
return out;
}
function planFit(pl, f) {
var o = xi(f); if (!o) return null; var sum = {}, cnt = {}, tot = 0, chem = 0;
o.forEach(function (r) { var g = grp(r.pos); sum[g] = (sum[g] || 0) + r.e; cnt[g] = (cnt[g] || 0) + 1; tot += r.e; if (r.p && pl.t.indexOf(pstyle(r.p)) >= 0) chem++; });
var sc = 0, ws = 0; ['G', 'D', 'M', 'F'].forEach(function (g) { if (cnt[g]) { sc += (sum[g] / cnt[g]) * pl.w[g]; ws += pl.w[g]; } });
sc = ws ? sc / ws : 0; return { f: f, score: Math.round(sc), delta: sc - tot / o.length, chem: chem, n: o.length };
}
function bestPlan(pl) { var b = null; Object.keys(H.FORMATIONS).forEach(function (f) { var r = planFit(pl, f); if (r && (!b || r.score + r.chem * 0.6 > b.score + b.chem * 0.6)) b = r; }); return b; }
function applyPlan(i) {
var g = G(), s = S(), pl = PLANS[i], b = bestPlan(pl); if (!b) return toast('Could not apply that plan');
if (s.formation !== b.f) H.setFormation(g, b.f);
s.mentality = pickv(H.MENTALITY, pl.m, s.mentality); s.style = pickv(H.STYLE, pl.s, s.style); s.press = pickv(H.PRESS, pl.p, s.press);
save(); shut(); refresh(); toast(pl.n + ' · ' + b.f);
}
function plansBox() {
box('<h3>🧠 Manager game plans</h3><p style="font-size:12px;color:#9fb9dc;margin:0">Each plan picks the formation that suits your squad best and sets mentality, style and pressing. Playstyle match shows how many of the eleven suit it.</p>' +
PLANS.map(function (pl, i) {
var b = bestPlan(pl), lab = !b ? ['', ''] : b.delta >= 1 ? ['Good fit', 'v7g'] : b.delta >= -1 ? ['OK fit', 'v7o'] : ['Weak fit', 'v7w'];
return '<div class="v7c"><div class="t"><b>' + pl.n + '</b><small>' + pl.d + '</small>' + (b ? '<small>' + esc(b.f) + ' · <span class="' + lab[1] + '"><b>' + lab[0] + ' ' + b.score + '</b></span> · Playstyle match ' + b.chem + '/' + b.n + '</small>' : '') + '</div><button data-v7="plan" data-k="' + i + '">▶</button></div>';
}).join('') + btn('ps', '🎭 Playstyles of my players', 'g') + btn('x', 'Close', 'g'));
}
function psBox() {
var uc = kit();
box('<h3>🎭 Playstyles</h3><p style="font-size:12px;color:#9fb9dc;margin:0">Choose each player’s playstyle. It feeds the playstyle match in the game plans.</p>' + squad().map(function (p) {
var cur = pstyle(p); return '<div class="v7c"><div class="v7f">' + H.face(p, 46, uc) + '</div><div class="t"><b>' + esc(p.n) + '</b><small>' + p.pos + ' · ' + p.o + '</small></div><select data-v7ps="' + p.id + '">' + PS[role(p.pos)].map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>';
}).join('') + btn('plans', 'Back', 'g'));
}

/* ---------- training points and boosters ---------- */
function lv(p) { var t = V().t[p.id], y = S().year; return t && t.y === y ? t.l : 0; }
function cost(p) { return Math.round((30 + 15 * lv(p) + Math.max(0, p.o - 70) * 3) * (V().half ? 0.5 : 1)); }
function maxed(p) { return typeof p.p === 'number' ? p.o >= Math.min(99, p.p) : p.o >= 99; }
function trainBox() {
var v = V(), uc = kit();
box('<h3>🏋️ Player training</h3><div class="v7st"><b>' + v.tp + ' Training Points</b>' + (v.half ? ' · <span class="v7g">Training Boost on: next level half price</span>' : '') + '<br>Earn 25 points every week you play. Up to 5 levels per player each season. A level adds +1 overall.</div>' + btn('boost', '⚡ Boosters and shop', 'g') + squad().map(function (p) {
var c = cost(p), l = lv(p), off = l >= 5 || maxed(p) || v.tp < c;
return '<div class="v7c"><div class="v7f">' + H.face(p, 46, uc) + '</div><div class="t"><b>' + esc(p.n) + '</b><small>' + p.pos + ' · ' + p.o + ' · ' + esc(pstyle(p)) + '</small><small>' + (maxed(p) ? 'At potential' : 'Trained ' + l + '/5 this season') + '</small></div><button data-v7="up" data-k="' + p.id + '"' + (off ? ' disabled' : '') + '>⬆ ' + (l >= 5 || maxed(p) ? '–' : c) + '</button></div>';
}).join('') + btn('x', 'Close', 'g'));
}
function up(p) {
var v = V(), y = S().year, t = v.t[p.id] = v.t[p.id] || { y: y, l: 0 };
if (t.y !== y) { t.y = y; t.l = 0; }
if (t.l >= 5) return toast('Maximum 5 levels this season'); if (maxed(p)) return toast('Already at potential');
var c = cost(p); if (v.tp < c) return toast('Not enough Training Points');
v.tp -= c; v.half = false; p.o += 1; t.l++; save(); trainBox(); refresh();
}
var SHOP = { fit: ['⚡ Fitness Booster', 'Restores a player to full fitness', 40], train: ['⏩ Training Boost', 'Next training level costs half', 60], pot: ['★ Potential Booster', 'Raises a player’s potential by 2', 150] };
function boostBox() {
var v = V(), hasPot = squad().some(function (p) { return typeof p.p === 'number'; });
box('<h3>⚡ Boosters</h3><div class="v7st"><b>' + v.tp + ' Training Points</b></div><label>Player</label><select id="v7pl">' + squad().map(function (p) { return '<option value="' + p.id + '"' + (sel === p.id ? ' selected' : '') + '>' + esc(p.n) + ' (' + p.o + ')</option>'; }).join('') + '</select>' +
Object.keys(SHOP).filter(function (k) { return k !== 'pot' || hasPot; }).map(function (k) {
var s = SHOP[k]; return '<div class="v7c"><div class="t"><b>' + s[0] + ' ×' + v.bo[k] + '</b><small>' + s[1] + '</small></div><button data-v7="use" data-k="' + k + '"' + (v.bo[k] < 1 ? ' disabled' : '') + '>Use</button><button data-v7="buy" data-k="' + k + '"' + (v.tp < s[2] ? ' disabled' : '') + '>' + s[2] + '</button></div>';
}).join('') + btn('train', 'Back', 'g'));
}
function useBoost(k) {
var v = V(), e = $('#v7pl'), id = e ? +e.value : null, p = squad().filter(function (x) { return x.id === id; })[0];
if (v.bo[k] < 1) return toast('None left');
if (k === 'train') { if (v.half) return toast('Already active'); v.half = true; }
else if (!p) return toast('Choose a player');
else if (k === 'fit') { if (typeof p.ft === 'number' && p.ft >= 100) return toast(p.n + ' is already fully fit'); p.ft = 100; }
else if (k === 'pot') { if (typeof p.p !== 'number') return toast('Not available for this player'); p.p = Math.min(99, p.p + 2); }
v.bo[k]--; sel = id; save(); boostBox(); refresh(); toast('Booster used');
}
function buy(k) { var v = V(), c = SHOP[k][2], e = $('#v7pl'); if (e) sel = +e.value; if (v.tp < c) return toast('Not enough Training Points'); v.tp -= c; v.bo[k]++; save(); boostBox(); }

document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v7]'); if (!b || !G()) return;
var q = b.dataset.v7, k = b.dataset.k, p;
try {
if (q === 'x') shut(); else if (q === 'train') trainBox(); else if (q === 'plans') plansBox(); else if (q === 'ps') psBox(); else if (q === 'boost') boostBox();
else if (q === 'plan') applyPlan(+k); else if (q === 'use') useBoost(k); else if (q === 'buy') buy(k);
else if (q === 'up') { p = squad().filter(function (x) { return x.id === +k; })[0]; if (p) up(p); }
} catch (er) { if (window.console) console.error('HANS FC 3.4 click', er); }
});
document.addEventListener('change', function (e) { var id = e.target && e.target.dataset && e.target.dataset.v7ps; if (id && G()) { V().ps[+id] = e.target.value; save(); } });

/* 25 Training Points for every week that passes */
function tick() {
try {
var s = S(); if (!s || !G()) return; var v = V(), n = (s.year - v.ly) * (H.LAST_WEEK || 38) + (s.week - v.lw);
if (n > 0) { n = Math.min(n, 10); v.tp += 25 * n; v.ly = s.year; v.lw = s.week; save(); toast('+' + 25 * n + ' Training Points'); }
else if (n < 0) { v.ly = s.year; v.lw = s.week; }
} catch (e) {}
}
function patch() {
try {
if (!S() || !G()) return;
var tb = $('#screen [data-act="tac"][data-k="mentality"]'), d = tb && tb.closest('.darkbox');
if (d && !d.querySelector('[data-v7="plans"]')) d.insertAdjacentHTML('beforeend', '<button class="btn full" style="margin-top:10px" data-v7="plans">🧠 MANAGER GAME PLANS</button>');
var host = $('#screen .v3tools'); if (host && !host.querySelector('[data-v7="train"]')) host.insertAdjacentHTML('beforeend', '<div class="grid2" style="margin-top:8px"><button class="btn" data-v7="train">🏋️ TRAINING</button><button class="btn" data-v7="plans">🧠 GAME PLANS</button></div>');
} catch (e) {}
}
var scr = document.getElementById('screen');
if (scr) new MutationObserver(function () { setTimeout(patch, 250); }).observe(scr, { childList: true });
setInterval(function () { tick(); patch(); }, 1500);
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
window.__hfcV7 = { role: role, pstyle: pstyle, planFit: planFit, bestPlan: bestPlan, ver: VER };
} catch (err) { if (window.console) console.error('HANS FC 3.4 add-on failed', err); }
})();/* ===== HANS FC 3.5.0 add-on: AUTO PLAYER PHOTOS, SLOWER AGEING FOR 27+, MORE AWARDS. PASTE AT THE VERY END of app.js, BELOW the 3.4.0 block. Do NOT select all. ===== */
(function () {
try {
var css = '.v8bg{position:fixed;inset:0;z-index:98;background:#000d;display:grid;place-items:center;padding:12px}.v8box{width:100%;max-width:440px;max-height:90vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:14px;font-size:14px;line-height:1.4}.v8box h3{margin:0 0 8px;font-size:17px}.v8b{display:block;width:100%;margin-top:8px;padding:10px;border:0;border-radius:6px;background:#2f6bff;color:#fff;font-weight:700;font-size:14px}.v8b.g{background:#2a3d66}.v8b.r{background:#a02a3a}.v8st{background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:13px}.v8bar{height:8px;border-radius:4px;background:#1d3a73;overflow:hidden;margin-top:6px}.v8bar i{display:block;height:100%;background:#2f6bff}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', PREF = 'hansfc_photos_pref', VER = '3.5.0', ov = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
function V() { var s = S(); return s ? (s.v8 = s.v8 || {}) : null; }
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function toast(t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); } }
function box(html) { if (ov) ov.remove(); ov = document.createElement('div'); ov.className = 'v8bg'; ov.innerHTML = '<div class="v8box">' + html + '</div>'; document.body.appendChild(ov); }
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c) { return '<button class="v8b ' + (c || '') + '" data-v8="' + q + '">' + t + '</button>'; };
var pref = function () { try { return localStorage.getItem(PREF); } catch (e) { return null; } };
var setPref = function (v) { try { localStorage.setItem(PREF, v); } catch (e) {} };

/* =====================================================================
1. AUTO PLAYER PHOTOS (Wikipedia). Saved on the phone, outside the save file.
===================================================================== */
var nk = function (n) { return String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
var cache = {}, ready = false, queue = [], running = 0, paused = true, fails = 0, msg = '', lastS = null, lastN = -1, REAL = null, dbp = null, asked = false, started = false;
function idb() { if (!dbp) dbp = new Promise(function (res) { try { var r = indexedDB.open('hansfc_photos', 1); r.onupgradeneeded = function () { r.result.createObjectStore('p'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); return dbp; }
function idbPut(k, v) { idb().then(function (d) { if (d) try { d.transaction('p', 'readwrite').objectStore('p').put(v, k); } catch (e) {} }); }
function idbAll() { return idb().then(function (d) { return new Promise(function (res) { if (!d) return res({}); var o = {}; try { var c = d.transaction('p').objectStore('p').openCursor(); c.onsuccess = function () { var x = c.result; if (x) { o[x.key] = x.value; x.continue(); } else res(o); }; c.onerror = function () { res(o); }; } catch (e) { res(o); } }); }); }
function idbClear() { idb().then(function (d) { if (d) try { d.transaction('p', 'readwrite').objectStore('p').clear(); } catch (e) {} }); }
idbAll().then(function (o) { cache = o || {}; ready = true; });

function realSet() {
if (REAL) return REAL; REAL = {};
try {
Object.keys(H.REAL || {}).forEach(function (c) { H.parseReal(H.REAL[c]).forEach(function (r) { REAL[nk(r.name)] = r.name; }); });
if (H.FREE_STARS) H.parseReal(H.FREE_STARS).forEach(function (r) { REAL[nk(r.name)] = r.name; });
} catch (e) {}
return REAL;
}
function setImg(p, u) { var d = Object.getOwnPropertyDescriptor(p, 'img'); if (d) return; Object.defineProperty(p, 'img', { value: u, writable: true, configurable: true, enumerable: false }); }
/* give every known player his picture; pictures the user added by hand stay in the save file */
function attach() {
var s = S(); if (!s) return;
s.players.forEach(function (p) {
var d = Object.getOwnPropertyDescriptor(p, 'img'), c = cache[nk(p.n)];
if (d) { if (!d.enumerable && d.value !== (c && c.u)) Object.defineProperty(p, 'img', { value: d.value, writable: true, configurable: true, enumerable: true }); return; }
if (c && c.u) setImg(p, c.u);
});
lastS = s; lastN = s.players.length;
}
function build() {
var s = S(); if (!s) return; var R = realSet(), seen = {}, list = [];
s.players.slice().sort(function (a, b) { return ((b.cl === s.uid) - (a.cl === s.uid)) || (b.o - a.o); }).forEach(function (p) {
var k = nk(p.n); if (!R[k] || seen[k]) return; seen[k] = 1; var c = cache[k];
if (c && (c.u || Date.now() - c.t < 14 * 864e5)) return; list.push({ k: k, n: R[k] });
});
queue = list;
}
function counts() {
var s = S(), R = realSet(), seen = {}, have = 0, miss = 0; if (!s) return { total: 0, have: 0, miss: 0 };
s.players.forEach(function (p) { var k = nk(p.n); if (!R[k] || seen[k]) return; seen[k] = 1; var c = cache[k]; if (c && c.u) have++; else if (c) miss++; });
return { total: Object.keys(seen).length, have: have, miss: miss };
}
function find(name) {
var u = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(name + ' footballer') + '&gsrlimit=4&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=240&format=json&formatversion=2&origin=*';
return fetch(u).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (j) {
var pg = ((j.query && j.query.pages) || []).slice().sort(function (a, b) { return a.index - b.index; }), want = nk(name).split(' ').filter(function (t) { return t.length > 2; });
for (var i = 0; i < pg.length; i++) {
var q = pg[i]; if (!/footballer|soccer|goalkeeper|midfielder|defender|striker|winger/i.test(q.description || '')) continue;
var tt = ' ' + nk(q.title) + ' ', hit = want.filter(function (t) { return tt.indexOf(' ' + t + ' ') >= 0; }).length;
if (!want.length || hit < Math.max(1, Math.ceil(want.length * 0.6)) || tt.indexOf(' ' + want[want.length - 1] + ' ') < 0) continue;
return q.thumbnail ? q.thumbnail.source : '';
}
return '';
});
}
function thumb(src) {
return new Promise(function (res) {
var im = new Image(); im.crossOrigin = 'anonymous';
im.onload = function () { try { var c = document.createElement('canvas'), w = im.naturalWidth, h = im.naturalHeight, s = Math.min(w, h); c.width = c.height = 96; c.getContext('2d').drawImage(im, (w - s) / 2, 0, s, s, 0, 0, 96, 96); res(c.toDataURL('image/jpeg', 0.72)); } catch (e) { res(''); } };
im.onerror = function () { res(''); }; im.src = src;
});
}
function put(k, data) {
var rec = { u: data || '', t: Date.now() }; cache[k] = rec; idbPut(k, rec);
if (data) { var s = S(); if (s) s.players.forEach(function (p) { if (nk(p.n) === k) setImg(p, data); }); }
}
function work() {
if (paused || !queue.length) { if (!paused && !queue.length && running === 0) { paused = true; msg = 'All done'; attach(); if (!ov) refresh(); } return; }
var job = queue.shift(); running++;
find(job.n).then(function (u) { return u ? thumb(u) : ''; }).then(function (d) { put(job.k, d); fails = 0; running--; setTimeout(work, 200); },
function () { running--; fails++; if (fails >= 6) { paused = true; msg = 'No internet connection. Try again later.'; } else queue.push(job); setTimeout(work, 1000); });
}
function go() { if (!S()) return; build(); paused = false; fails = 0; msg = ''; for (var i = running; i < 3; i++) work(); }
function photoBox() {
var c = counts(), pct = c.total ? Math.round(c.have * 100 / c.total) : 0;
box('<h3>📷 Player pictures</h3><div class="v8st"><b id="v8t">' + c.have + ' of ' + c.total + ' real players have a picture</b><div class="v8bar"><i id="v8p" style="width:' + pct + '%"></i></div><div id="v8m" style="margin-top:6px;color:#9fb9dc">' + esc(statusText(c)) + '</div></div><p style="font-size:12px;color:#9fb9dc;margin:0">The game looks up each real player on Wikipedia and keeps a small copy on your phone. It needs internet the first time. Players with a picture you added yourself keep it.</p>' +
btn(paused ? 'start' : 'pause', paused ? '▶ Download pictures' : '⏸ Pause') + (c.miss ? btn('retry', '🔁 Try the ' + c.miss + ' missing again', 'g') : '') + btn('clear', '🗑 Remove downloaded pictures', 'r') + btn('x', 'Close', 'g'));
}
function statusText(c) { return msg || (!paused ? 'Downloading… ' + queue.length + ' left' : c.have >= c.total && c.total ? 'Everything is downloaded' : 'Paused'); }
function paintStatus() { if (!ov) return; var c = counts(), t = $('#v8t'), p = $('#v8p'), m = $('#v8m'); if (!t) return; t.textContent = c.have + ' of ' + c.total + ' real players have a picture'; if (p) p.style.width = (c.total ? Math.round(c.have * 100 / c.total) : 0) + '%'; if (m) m.textContent = statusText(c); }
function consentBox() { box('<h3>📷 Add every player’s picture?</h3><p style="margin:0">The game can find each real player’s photo on Wikipedia and save it on your phone, all by itself. It needs internet and takes a few minutes the first time.</p>' + btn('yes', 'Yes, download them') + btn('no', 'Not now', 'g')); }

/* =====================================================================
2. PLAYERS 27+ LOSE RATING MORE SLOWLY, AND NOT AT ALL WHEN THEY PLAY WELL
===================================================================== */
function soften(g, snap, rv) {
var s = g.S, uid = s.uid;
s.players.forEach(function (p) {
var o0 = snap[p.id]; if (o0 == null || p.del || p.a < 27) return;
var drop = o0 - p.o; if (drop <= 0) return;
var good = (p.rn >= 8 && p.rs / p.rn >= 6.6) || ((p.g || 0) + (p.as || 0)) >= 6 || (p.ap || 0) >= 18;
var lim = p.a <= 30 ? (good ? 0 : 1) : p.a <= 33 ? (good ? 1 : 2) : (good ? 2 : 3);
if (drop > lim) { p.o = o0 - lim; if (p.p < p.o) p.p = p.o; if (H.refresh) H.refresh(p); }
});
var ch = []; s.players.forEach(function (p) { if (p.cl === uid && snap[p.id] != null) { var d = p.o - snap[p.id]; if (Math.abs(d) >= 3 || (p.o >= 85 && d !== 0)) ch.push({ n: p.n, from: snap[p.id], to: p.o, id: p.id }); } });
if (rv) rv.changes = ch.sort(function (a, b) { return Math.abs(b.to - b.from) - Math.abs(a.to - a.from); }).slice(0, 8);
}
var oldEnd = H.endSeason;
if (oldEnd) H.endSeason = function (g) {
var snap = {}; g.S.players.forEach(function (p) { snap[p.id] = p.o; });
var rv = oldEnd.apply(this, arguments);
try { soften(g, snap, rv); } catch (e) { if (window.console) console.error('HANS FC 3.5 ageing', e); }
return rv;
};

/* =====================================================================
3. MORE AWARDS on the end-of-season awards night
===================================================================== */
function moreAwards() {
var s = S(), g = G(), uc = H.userClub(g), out = [], tc = {}, rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
var T = function (lg) { return tc[lg] || (tc[lg] = H.table(g, lg)); };
var pl = s.players.filter(function (p) { return p.cl != null && s.clubs[p.cl]; }), lgn = H.lgOf(uc.lg).name;
var perf = function (p) { return (p.g || 0) * 2 + (p.as || 0) * 1.2 + (p.ap || 0) * 0.08 + (p.o - 60) * 0.25 + (p.rn ? (p.rs / p.rn - 6) * 4 : 0); };
var top = function (arr, f) { var b = null, bv = -1e9; arr.forEach(function (p) { var v = f(p); if (v > bv) { bv = v; b = p; } }); return b; };
var add = function (c, p, x) { if (p) out.push({ c: c, n: p.n, club: s.clubs[p.cl].name, me: p.cl === s.uid, x: x || '' }); };
var gaBonus = function (p) { var t = T(s.clubs[p.cl].lg).slice().sort(function (a, b) { return a.ga - b.ga; }), r = 0; t.forEach(function (x, i) { if (x.id === p.cl) r = i; }); return (t.length - r) * 0.25; };
var gb = top(pl, function (p) { return (p.g || 0) * 100 + (p.as || 0); }); if (gb && gb.g > 0) add('Golden Boot (top scorer)', gb, gb.g + ' goals');
var lgp = pl.filter(function (p) { return s.clubs[p.cl].lg === uc.lg; });
var ts = top(lgp, function (p) { return (p.g || 0) * 100 + (p.as || 0); }); if (ts && ts.g > 0 && ts !== gb) add('Top scorer · ' + lgn, ts, ts.g + ' goals');
var pm = top(pl, function (p) { return (p.as || 0) * 100 + (p.g || 0); }); if (pm && pm.as > 0) add('Playmaker of the Year (most assists)', pm, pm.as + ' assists');
add('Player of the Season · ' + lgn, top(lgp.filter(function (p) { return (p.ap || 0) >= 10; }), perf), '');
add('Best Defender of the Year', top(pl.filter(function (p) { return H.GROUP[p.pos] === 'D' && (p.ap || 0) >= 10; }), function (p) { return perf(p) + gaBonus(p); }), '');
add('Best Midfielder of the Year', top(pl.filter(function (p) { return H.GROUP[p.pos] === 'M' && (p.ap || 0) >= 10; }), perf), '');
var base = s.v8 && s.v8.base && s.v8.base.y === s.year ? s.v8.base.o : null;
if (base) { var bt = top(pl.filter(function (p) { return p.a <= 23 && base[p.id] != null && p.o - base[p.id] >= 2; }), function (p) { return (p.o - base[p.id]) * 10 + perf(p) * 0.1; }); if (bt) add('Breakthrough Player (best improver under 24)', bt, '+' + (bt.o - base[bt.id]) + ' overall this season'); }
add('Veteran of the Year (32 and over)', top(pl.filter(function (p) { return p.a >= 32 && (p.ap || 0) >= 8; }), perf), '');
var gk = top(pl.filter(function (p) { return H.GROUP[p.pos] === 'G' && (p.ap || 0) >= 8; }), perf);
if (gk) { var oc = rnd(H.lgClubs(g, s.clubs[gk.cl].lg).filter(function (c) { return c.id !== gk.cl; })); add('Save of the Season', gk, rnd(['a stunning double save', 'a one-handed stop at full stretch', 'a penalty save in injury time', 'a fingertip tip-over from distance']) + (oc ? ' against ' + oc.name : '')); }
var t = T(uc.lg), ba = t.slice().sort(function (a, b) { return b.gf - a.gf; })[0], bd = t.slice().sort(function (a, b) { return a.ga - b.ga; })[0];
if (ba) out.push({ c: 'Best Attack · ' + lgn, n: ba.name, club: lgn, me: ba.id === s.uid, x: ba.gf + ' goals scored' });
if (bd) out.push({ c: 'Best Defence · ' + lgn, n: bd.name, club: lgn, me: bd.id === s.uid, x: bd.ga + ' goals conceded' });
return out;
}
document.addEventListener('click', function (e) {
if (!e.target.closest('#screen [data-act="endseason"]') || !G()) return;
setTimeout(function () {
try {
var b = document.querySelector('.v4bg [data-v4="awgo"]'), s = S(), v = V(); if (!b || b.dataset.v8 || !v || v.awY === s.year) return;
b.dataset.v8 = '1'; v.awY = s.year;
var out = moreAwards(); if (!out.length) return;
b.insertAdjacentHTML('beforebegin', '<div class="v4t" style="margin-top:12px">More awards</div>' + out.map(function (x) { return '<div class="v4c ' + (x.me ? 'me' : '') + '"><div class="v4t">' + esc(x.c) + '</div><b>' + esc(x.n) + '</b> <span class="v4s">' + esc(x.club) + '</span>' + (x.x ? '<div class="v4s">' + esc(x.x) + '</div>' : '') + '</div>'; }).join(''));
out.forEach(function (x) { if (x.me) { s.mgr.xp = (s.mgr.xp || 0) + 30; s.mgr.rep = Math.min(100, s.mgr.rep + 1); try { H.news(G(), '🏆 ' + x.c + ': ' + x.n, 'g'); } catch (er) {} } });
var h = window.__hfcV4 && window.__hfcV4.V && window.__hfcV4.V().awards; if (h && h[0] && h[0].it) out.forEach(function (x) { h[0].it.push(x); });
save();
} catch (er) { if (window.console) console.error('HANS FC 3.5 awards', er); }
}, 0);
}, true);
function baseSnap() {
var s = S(); if (!s || s.week < 1 || s.stage === 'pre') return; var v = V();
if (!v.base || v.base.y !== s.year) { var o = {}; s.players.forEach(function (p) { o[p.id] = p.o; }); v.base = { y: s.year, o: o }; }
}

/* ---------- buttons and clicks ---------- */
document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v8]'); if (!b || !G()) return; var q = b.dataset.v8;
try {
if (q === 'x') shut(); else if (q === 'photos') photoBox();
else if (q === 'yes') { setPref('yes'); shut(); started = true; go(); toast('Downloading pictures…'); }
else if (q === 'no') { setPref('no'); shut(); }
else if (q === 'start') { setPref('yes'); started = true; go(); photoBox(); }
else if (q === 'pause') { paused = true; msg = 'Paused'; photoBox(); }
else if (q === 'retry') { Object.keys(cache).forEach(function (k) { if (!cache[k].u) delete cache[k]; }); go(); photoBox(); }
else if (q === 'clear') { paused = true; queue = []; cache = {}; idbClear(); var s = S(); if (s) s.players.forEach(function (p) { var d = Object.getOwnPropertyDescriptor(p, 'img'); if (d && !d.enumerable) delete p.img; }); setPref('no'); lastN = -1; msg = 'Removed'; photoBox(); refresh(); }
} catch (er) { if (window.console) console.error('HANS FC 3.5 click', er); }
});
function tick() {
try {
var s = S(); if (!s || !G() || !ready) return;
if (s !== lastS || s.players.length !== lastN) attach();
baseSnap();
var p = pref();
if (p === 'yes' && !started && navigator.onLine !== false) { started = true; go(); }
else if (p == null && !asked && !ov) { asked = true; setTimeout(function () { if (!ov && pref() == null) consentBox(); }, 3000); }
paintStatus();
} catch (e) {}
}
function patch() {
try {
if (!S() || !G()) return;
var host = $('#screen .v3tools'); if (host && !host.querySelector('[data-v8="photos"]')) host.insertAdjacentHTML('beforeend', '<button class="btn full" style="margin-top:8px" data-v8="photos">📷 PLAYER PICTURES</button>');
} catch (e) {}
}
var scr = document.getElementById('screen');
if (scr) new MutationObserver(function () { setTimeout(patch, 300); }).observe(scr, { childList: true });
setInterval(function () { tick(); patch(); }, 1500);
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
window.__hfcV8 = { nk: nk, find: find, build: build, counts: counts, attach: attach, soften: soften, moreAwards: moreAwards, ver: VER };
} catch (err) { if (window.console) console.error('HANS FC 3.5 add-on failed', err); }
})();/* ===== HANS FC 3.6.0 add-on: CLUB HUB WITH COACH PICTURES, SELL PLAYERS (CHOOSE HOW MANY), TEAM OF THE WEEK. PASTE AT THE VERY END of app.js, BELOW the 3.5.0 block. Do NOT select all. ===== */
(function () {
try {
var css = [
'.v9bg{position:fixed;inset:0;z-index:98;background:#000d;display:grid;place-items:center;padding:10px}',
'.v9box{width:100%;max-width:460px;max-height:92vh;overflow-y:auto;background:#10244a;color:#fff;border:2px solid #2f4fa0;border-radius:10px;padding:12px;font-size:14px;line-height:1.35}',
'.v9box h3{margin:0 0 6px;font-size:18px}',
'.v9b{display:block;width:100%;margin-top:8px;padding:11px;border:0;border-radius:7px;background:#f58220;color:#1a1200;font-weight:800;font-size:14px}',
'.v9b.g{background:#2a3d66;color:#fff}.v9b.r{background:#a02a3a;color:#fff}.v9b:disabled{opacity:.45}',
'.v9st{background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:8px 10px;margin:6px 0;font-size:13px}',
'.v9warn{background:#3a2a0a;border:1px solid #c98a1a;color:#ffd78a;border-radius:8px;padding:8px 10px;margin:6px 0;font-size:12px}',
'.v9lbl{font-size:12px;color:#9fb9dc;margin:10px 0 4px;font-weight:700;letter-spacing:.4px}',
'.v9step{display:flex;align-items:center;gap:10px}.v9step button{width:48px;height:48px;border:0;border-radius:8px;background:#2f6bff;color:#fff;font-size:26px;font-weight:800}.v9step b{flex:1;text-align:center;font-size:32px}.v9step small{display:block;font-size:11px;color:#9fb9dc;font-weight:400}',
'.v9chips{display:flex;flex-wrap:wrap;gap:6px}.v9chips button{border:1px solid #3d5fb0;background:#0b1a38;color:#cfe0ff;border-radius:16px;padding:7px 11px;font-size:12px;font-weight:700}.v9chips button.on{background:#f58220;border-color:#f58220;color:#1a1200}',
'.v9sr{display:flex;align-items:center;gap:8px;background:#0b1a38;border:1px solid #223a73;border-radius:8px;padding:6px 8px;margin-top:6px}.v9sr.on{border-color:#f58220;background:#2a2412}',
'.v9ck{width:22px;height:22px;border-radius:50%;border:2px solid #4a639f;display:grid;place-items:center;font-style:normal;font-size:13px;color:transparent;flex:none}.v9sr.on .v9ck{background:#f58220;border-color:#f58220;color:#1a1200}',
'.v9f{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#cfd8e8;flex:none}.v9f.sm{width:38px;height:38px}.v9f.md{width:56px;height:56px}.v9f.big{width:72px;height:72px}.v9f svg,.v9f img{width:100%;height:100%;display:block;object-fit:cover}',
'.v9sm{flex:1;min-width:0}.v9sm b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v9sm small{color:#9fb9dc;font-size:11px}',
'.v9sv{text-align:right;min-width:54px}.v9sv b{display:block;color:#ffd24a;font-size:16px}.v9sv small{color:#9fb9dc;font-size:11px}',
'.v9tg{font-size:9px;font-weight:800;background:#2f6bff;color:#fff;border-radius:4px;padding:1px 4px;margin-left:4px}.v9tg.b{background:#6b7a99}.v9tg.i{background:#c23a3a}',
'.v9hd2{display:flex;align-items:center;justify-content:space-between;gap:8px}.v9hd2 h3{margin:0}.v9x{width:36px;height:36px;border:0;border-radius:50%;background:#2a3d66;color:#fff;font-size:16px;flex:none}.v9two{display:grid;grid-template-columns:1fr 1.7fr;gap:8px}.v9two .v9b{margin-top:6px;padding:10px 6px;font-size:13px}.v9warn.s{padding:4px 8px;margin:0 0 4px}.v9foot{position:sticky;bottom:-12px;background:#10244a;margin:10px -12px -12px;padding:6px 12px 10px;border-top:1px solid #2f4fa0}',
'.v9q{display:flex;align-items:center;gap:8px;background:#0b1a38;border:1px solid #223a73;border-radius:8px;padding:7px 8px;margin-top:6px}.v9q.no{opacity:.6}',
'.v9q .v9sv b{color:#6ee08a}.v9q.no .v9sv b{color:#ff8a8a;font-size:12px}',
'#screen.v9on>:not(.tabs2):not(.v9hub){display:none!important}',
'.v9hub{color:#fff;padding-bottom:16px}',
'.v9hd{display:flex;align-items:center;gap:10px;background:#fff;color:#10244a;border-radius:10px;padding:8px 10px;margin:8px 0}.v9hd .sp{flex:1;min-width:0}.v9hd b{display:block;font-size:20px;font-weight:900;text-transform:uppercase;line-height:1.1}.v9hd small{color:#5a6b8c;font-weight:700}',
'.v9cr{width:46px;height:46px;flex:none}.v9ovr{min-width:50px;text-align:center;background:linear-gradient(#ecc95e,#b8902a);color:#fff;font-weight:900;font-size:28px;border-radius:7px;padding:2px 6px;text-shadow:0 1px 2px #0006}',
'.v9rows{display:grid;gap:6px;margin:8px 0}.v9ir{display:flex;align-items:center;gap:10px;background:#1c5fb4;border:1px solid #3d7fd6;border-radius:8px;padding:9px 11px;font-weight:700;font-size:14px}.v9ir i{font-style:normal;width:22px;text-align:center}',
'.v9tiles{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:8px 0}.v9tile{min-width:0;display:flex;align-items:center;gap:8px;background:#1c5fb4;border:1px solid #3d7fd6;border-radius:8px;padding:8px;min-height:58px}.v9tile .t{flex:1;min-width:0}.v9tile small{display:block;font-size:11px;color:#bcd6ff;font-weight:800;letter-spacing:.4px}.v9tile b{display:block;font-size:12px;line-height:1.15;max-height:2.3em;overflow:hidden;word-break:break-word}.v9tile .v9f{width:38px;height:38px}',
'.v9g{font-style:normal;flex:none;background:linear-gradient(#ecc95e,#b8902a);color:#fff;font-weight:900;font-size:17px;border-radius:6px;padding:2px 6px;text-shadow:0 1px 2px #0006}',
'.v9card{background:#123a78;border:1px solid #2f5fb0;border-radius:10px;padding:10px;margin:10px 0}.v9ttl{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.v9ttl b{font-size:16px;font-weight:900;letter-spacing:.3px}.v9ttl em{font-style:normal;font-size:11px;color:#bcd6ff}',
'.v9staff{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v9sc{text-align:center;background:#0e2d60;border-radius:8px;padding:8px 4px}.v9sc .v9f{margin:0 auto 4px;width:60px;height:60px}.v9sc b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v9sc small{font-size:10px;color:#9fb9dc}',
'.v9bar1{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:12px;font-weight:700}.v9bar1 span{flex:0 0 132px;line-height:1.15}.v9seg{flex:1;display:flex;gap:3px}.v9seg i{flex:1;height:14px;border-radius:2px;background:#0b2a55}.v9seg i.on{background:#27d24a}',
'.v9wide{display:block;width:100%;margin-top:8px;padding:10px;border:0;border-radius:7px;background:#2f6bff;color:#fff;font-weight:800;font-size:14px}',
'.v9rels{display:flex;justify-content:space-around;margin-top:4px}.v9rel{text-align:center;position:relative}.v9rel .v9f{width:78px;height:78px;margin:0 auto}.v9rel i{position:absolute;right:-4px;bottom:16px;font-style:normal;background:#c0392b;color:#fff;font-weight:900;font-size:15px;border-radius:4px;padding:1px 6px}.v9rel small{display:block;font-size:11px;font-weight:800;color:#bcd6ff;margin-top:3px}',
'.v9yp{display:flex;align-items:center;gap:8px;background:#0e2d60;border-radius:8px;padding:6px 8px;margin-top:5px}.v9yp .sp{flex:1;min-width:0}.v9yp b{display:block;font-size:13px}.v9yp small{font-size:11px;color:#9fb9dc}.v9yp em{font-style:normal;font-weight:900;color:#ffd24a}',
'.v9grp{font-size:12px;font-weight:900;letter-spacing:.5px;color:#bcd6ff;margin:14px 0 6px}',
'.v9grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v9t{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:64px;border:0;border-radius:8px;background:#f58220;color:#1a1200;font-weight:800;font-size:12px;padding:8px 4px;text-align:center;line-height:1.15}.v9t span{font-size:22px;line-height:1}.v9t.g{background:#1c5fb4;color:#fff}.v9t.r{background:#c0392b;color:#fff}',
'.v9cl button,.v9bar button{display:block;width:100%;margin:8px 0;padding:11px;border:0;border-radius:8px;background:#f58220;color:#1a1200;font-weight:900;font-size:14px}.v9cl button{background:#2a3d66;color:#fff;font-size:12px}',
'.v9th{text-align:center;background:#fff;color:#10244a;border-radius:8px;padding:6px;margin-bottom:8px}.v9th b{display:block;font-size:20px;font-weight:900}.v9th small{font-weight:700;color:#5a6b8c}',
'.v9pitch{position:relative;height:540px;border-radius:8px;overflow:hidden;background:repeating-linear-gradient(#2f7d3a 0 54px,#348a42 54px 108px);border:2px solid #1d5a2a}',
'.v9pitch:before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:#ffffff55}.v9pitch:after{content:"";position:absolute;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border:2px solid #ffffff55;border-radius:50%}',
'.v9pp{position:absolute;transform:translate(-50%,-50%);width:84px;text-align:center}.v9pp .v9f{margin:0 auto;border:2px solid #fff}.v9pn{background:#0c1d3acc;border-radius:5px;padding:1px 3px;margin-top:2px}.v9pn b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v9pn small{display:block;font-size:9px;color:#bcd6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v9pp em{position:absolute;top:-4px;right:6px;font-style:normal;font-size:10px;background:#0c1d3a;border-radius:8px;padding:0 4px}',
'.v9pm{display:flex;align-items:center;gap:10px;background:#0b1a38;border:1px solid #2f4fa0;border-radius:8px;padding:6px 10px;margin-bottom:8px}.v9pm .v9f{border:2px solid #ffd24a;width:46px;height:46px}.v9pm small{display:block;font-size:10px;color:#ffd24a;font-weight:800;letter-spacing:.5px}.v9pm b{display:block;font-size:14px}.v9pm span{font-size:12px;color:#9fb9dc}',
'.v9subs{display:flex;gap:6px;justify-content:space-between;background:#0b1a38;border-radius:8px;padding:8px 4px;margin-top:8px}.v9subs .v9pp{position:static;transform:none;width:20%}'
].join('');
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = window.HFC, KEY = 'hansfc_save_v2', VER = '3.6.0', CLK = 'hansfc_hub_classic', SEEN = 'hansfc_seen_3.6.0', ov = null;
var $ = function (s) { return document.querySelector(s); };
var G = function () { return window.__hfc && window.__hfc.G; };
var S = function () { var g = G(); return g && g.S; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var fm = function (v) { return H.fm(v); };
var ord = function (n) { return n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'); };
var last = function (n) { var p = String(n).split(' '); return p.length > 1 ? p.slice(1).join(' ') : String(n); };
var short = function (n) { n = String(n); return n.charAt(0) + '.' + last(n); };
var rnd = function () { return H.rand ? H.rand() : Math.random(); };
var V = function () { var s = S(); return s ? (s.v9 = s.v9 || {}) : null; };
var V5 = function () { return window.__hfcV5; };
function save() { var g = G(); if (g) try { H.save(g, KEY); } catch (e) {} }
function refresh() { var t = $('#nav .on'); if (t) t.click(); }
function toast(t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2400); } }
function box(html, keepScroll) {
var keep = keepScroll && ov && ov.firstChild ? ov.firstChild.scrollTop : 0;
if (ov) ov.remove();
ov = document.createElement('div'); ov.className = 'v9bg'; ov.innerHTML = '<div class="v9box">' + html + '</div>';
document.body.appendChild(ov);
if (keep) ov.firstChild.scrollTop = keep;
}
function shut() { if (ov) { ov.remove(); ov = null; } }
var btn = function (q, t, c, k, dis) { return '<button class="v9b ' + (c || '') + '" data-v9="' + q + '"' + (k != null ? ' data-k="' + esc(k) + '"' : '') + (dis ? ' disabled' : '') + '>' + t + '</button>'; };
function pface(p, sz) { var s = S(), c = p && p.cl != null && s.clubs[p.cl] ? s.clubs[p.cl].col : '#556070'; try { return H.face(p, sz || 44, c); } catch (e) { return ''; } }
function classic() { try { return localStorage.getItem(CLK) === '1'; } catch (e) { return false; } }
function setClassic(v) { try { if (v) localStorage.setItem(CLK, '1'); else localStorage.removeItem(CLK); } catch (e) {} }

/* =====================================================================
1. COACHES: portraits for the manager and the five staff of any club
===================================================================== */
var ROLE_SHORT = ['Manager', 'Assistant', 'GK coach', 'Fitness', 'Head scout', 'Physio'];
function coach(c, n) {
var v = V5(); if (!v || !v.staff) return null;
try {
var m = v.staff(c, n);
var fp = (n === 0 && m.mine) ? { id: 4242, n: 'M', nat: m.nat, a: m.a } : { ck: m.key, rk: m.rk, nat: m.nat, a: m.a };
return { m: m, fp: fp };
} catch (e) { return null; }
}

/* =====================================================================
2. CLUB HUB (replaces the long button list on the Game page)
===================================================================== */
var lvScore = function (l) { return Math.min(99, Math.round(45 + l * 5.4)); };
function ratings(g) {
var uc = H.userClub(g), s = g.S, sq = H.userEval(g).vector.rating, mg = Math.max(1, Math.min(99, Math.round(s.mgr.rep)));
var stf = lvScore((uc.fac[1] + uc.fac[3]) / 2), ac = lvScore(uc.fac[2]);
return { squad: sq, mgr: mg, staff: stf, acad: ac, all: Math.round((sq * 2 + mg + stf + ac) / 5) };
}
var GROUPS = [
['⚽ MATCHDAY AND COMPETITION', [['🏋️', 'Training', 'data-v7="train"'], ['🧠', 'Game plans', 'data-v7="plans"'], ['🎯', 'Playing styles', 'data-v6="styles"'], ['⭐', 'Team of the week', 'data-v9="totw"'], ['🏅', 'Awards', 'data-v4="tool" data-k="aw"'], ['🌍', 'World Cup', 'data-v4="tool" data-k="wc"']]],
['🏛️ CLUB', [['👔', 'Manager', 'data-v4="tool" data-k="mgr"'], ['👥', 'Coaches', 'data-v5="staff"'], ['🤝', 'Sponsors', 'data-v4="tool" data-k="spon"'], ['✏️', 'Customize', 'data-v5="cust"'], ['✏️', 'Rename club', 'data-act="renclub"'], ['🛡️', 'Upgrade badge', 'data-act="clubimg"']]],
['💷 PLAYERS AND TRANSFERS', [['💷', 'Sell players', 'data-v9="sell"'], ['📷', 'Player pictures', 'data-v8="photos"'], ['🖼️', 'Import photos', 'data-v3="imp"']]],
['⚙️ GAME', [['💾', 'Save now', 'data-act="saveb"'], ['📦', 'Back up', 'data-v3="bak"'], ['♻️', 'Restore', 'data-v3="res"'], ['🆕', 'What’s new', 'data-v3="new"'], ['💡', 'Hints and tips', 'data-act="hints"'], ['🗑️', 'Restart game', 'data-act="reset"', 'r']]]
];
function hubHTML(g) {
var s = g.S, uc = H.userClub(g), r = ratings(g), lg = H.lgOf(uc.lg), pos = s.week >= 2 ? H.position(g, uc.lg, uc.id) : 0;
var v5 = V5(), info = (v5 && v5.info) ? v5.info(uc) : {}, cards = H.userCards(g);
var stad = info.s || (uc.name + ' Stadium'), cap = Math.round(H.stadiumCap(uc) * 1000);
var irow = function (ic, t) { return '<div class="v9ir"><i>' + ic + '</i><span>' + t + '</span></div>'; };
var h = '<div class="v9hub">';
h += '<div class="v9hd"><div class="v9cr">' + H.crest(uc, 46) + '</div><div class="sp"><b>' + esc(uc.name) + '</b><small>' + (pos ? ord(pos) + ' · ' : '') + esc(lg ? lg.name : '') + '</small></div><div class="v9ovr">' + r.all + '</div></div>';
h += '<div class="v9rows">' + irow('🏟️', esc(stad)) + irow('👥', cap.toLocaleString('en-US') + ' seats') + irow('💷', fm(uc.cash) + ' available') + irow('🤝', s.sponsor ? esc(s.sponsor.name) : 'No shirt sponsor yet') + (s.obj ? irow('🎯', esc(s.obj.text)) : '') + '</div>';
var cm = coach(uc, 0), mname = cm ? cm.m.n : s.mgr.name;
h += '<div class="v9tiles">' +
'<div class="v9tile" data-v4="tool" data-k="mgr">' + (cm ? '<div class="v9f">' + H.face(cm.fp, 38, uc.col) + '</div>' : '<i style="font-size:24px;font-style:normal">👔</i>') + '<div class="t"><small>MANAGER</small><b>' + esc(mname) + '</b></div><i class="v9g">' + r.mgr + '</i></div>' +
'<div class="v9tile" data-v5="staff"><i style="font-size:24px;font-style:normal">👥</i><div class="t"><small>STAFF</small><b>Coaches</b></div><i class="v9g">' + r.staff + '</i></div>' +
'<div class="v9tile" data-act="tab" data-v="squad"><i style="font-size:24px;font-style:normal">⚽</i><div class="t"><small>SQUAD</small><b>' + cards.length + ' players</b></div><i class="v9g">' + r.squad + '</i></div>' +
'<div class="v9tile" data-act="cbgo" data-v="fac"><i style="font-size:24px;font-style:normal">🎓</i><div class="t"><small>ACADEMY</small><b>Level ' + uc.fac[2] + '</b></div><i class="v9g">' + r.acad + '</i></div></div>';
if (cm) {
h += '<div class="v9card"><div class="v9ttl"><b>👥 COACHING STAFF</b><em>tap a coach to edit</em></div><div class="v9staff">';
for (var n = 0; n < 6; n++) { var c = coach(uc, n); if (!c) continue; h += '<div class="v9sc" data-v5="sedit" data-k="' + uc.id + '|' + n + '"><div class="v9f">' + H.face(c.fp, 60, uc.col) + '</div><b>' + esc(short(c.m.n)) + '</b><small>' + ROLE_SHORT[n] + '</small></div>'; }
h += '</div></div>';
}
h += '<div class="v9card"><div class="v9ttl"><b>🏟️ FACILITIES</b><em>level out of 10</em></div>';
H.FAC.forEach(function (f, i) { var seg = ''; for (var k = 0; k < 10; k++) seg += '<i class="' + (k < uc.fac[i] ? 'on' : '') + '"></i>'; h += '<div class="v9bar1"><span>' + f.icon + ' ' + esc(f.name) + '</span><div class="v9seg">' + seg + '</div></div>'; });
h += '<button class="v9wide" data-act="cbgo" data-v="fac">VIEW FACILITIES</button></div>';
var board = Math.round(s.board.conf), fans = Math.round(s.fanC == null ? 50 : s.fanC), mood = cards.length ? Math.round(cards.reduce(function (m, p) { return m + (p.mo || 65); }, 0) / cards.length) : 65;
var star = cards.slice().sort(function (a, b) { return b.o - a.o; })[0];
h += '<div class="v9card"><div class="v9ttl"><b>RELATIONSHIPS</b></div><div class="v9rels">' +
'<div class="v9rel" data-act="cbgo" data-v="board"><div class="v9f">' + H.face({ id: 12, n: 'b', nat: 'England', a: 60 }, 78, '#d8dde5') + '</div><i>' + board + '</i><small>BOARD</small></div>' +
'<div class="v9rel" data-act="cbgo" data-v="board"><div class="v9f">' + H.face({ id: 31, n: 'c', nat: 'England', a: 50 }, 78, '#d8dde5') + '</div><i>' + fans + '</i><small>FANS</small></div>' +
'<div class="v9rel" data-act="tab" data-v="squad"><div class="v9f">' + (star ? pface(star, 78) : '') + '</div><i>' + mood + '</i><small>SQUAD MOOD</small></div></div></div>';
var yth = cards.filter(function (p) { return p.a <= 21; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 6);
if (yth.length) {
h += '<div class="v9card"><div class="v9ttl"><b>🌱 YOUNG TALENTS</b><em>rating → potential</em></div>';
yth.forEach(function (p) { h += '<div class="v9yp" data-act="pl" data-id="' + p.id + '"><div class="v9f sm">' + pface(p, 38) + '</div><div class="sp"><b>' + esc(p.n) + '</b><small>' + p.pos + ' · ' + p.a + ' years</small></div><em>' + p.o + ' → ' + p.p + '</em></div>'; });
h += '</div>';
}
GROUPS.forEach(function (gr) {
h += '<div class="v9grp">' + gr[0] + '</div><div class="v9grid">';
gr[1].forEach(function (t) { h += '<button class="v9t' + (gr[0].indexOf('GAME') >= 0 ? ' g' : '') + (t[3] ? ' ' + t[3] : '') + '" ' + t[2] + '><span>' + t[0] + '</span>' + t[1] + '</button>'; });
h += '</div>';
});
h += '<div class="v9cl"><button data-v9="classic">Use the classic menu instead</button></div></div>';
return h;
}
function sig(g) {
var s = g.S, uc = H.userClub(g), v5 = s.v5 || {};
var busy = document.querySelector('.v3bg,.v4bg,.v5bg,.v6bg,.v7bg,.v8bg,.v9bg,#layer .sheetbg,#layer .full-l') ? 1 : 0;
return [uc.name, Math.round(uc.cash * 100), s.week, s.year, uc.fac.join(','), Math.round(s.mgr.rep), Math.round(s.board.conf), s.sponsor ? s.sponsor.name : '', H.userCards(g).length, H.userEval(g).vector.rating, Object.keys(v5.cp || {}).length, Object.keys(v5.cn || {}).length, JSON.stringify(v5.club || {}).length, busy].join('|');
}
function injectHub(scr, g, sg) {
var tmp = document.createElement('div'); tmp.innerHTML = hubHTML(g);
var el = tmp.firstChild; el.dataset.sig = sg;
var old = scr.querySelector('.v9hub');
if (old) old.replaceWith(el); else { var t = scr.querySelector('.tabs2'); if (t) t.after(el); else scr.prepend(el); }
}

/* =====================================================================
3. SELL PLAYERS: choose how many, who, and the price
===================================================================== */
var MODES = [['surplus', 'Surplus'], ['weak', 'Lowest rated'], ['old', 'Oldest'], ['wage', 'Top earners'], ['value', 'Most valuable']];
var MULTS = [[0.8, 'Quick sale · 80%'], [1, 'Market value · 100%'], [1.2, 'Ask more · 120%']];
var sell = { n: 1, mode: 'surplus', mult: 1, picked: {}, step: 1, quotes: [], out: null };
function squad() { return H.userCards(G()); }
function maxSell() { return Math.max(0, squad().length - 18); }
function inSets() {
var s = S(), xi = {}, bn = {};
(s.slots || []).forEach(function (id) { if (id) xi[id] = 1; }); (s.bench || []).forEach(function (id) { bn[id] = 1; });
return { xi: xi, bn: bn };
}
function ordered(mode) {
var q = inSets(), use = function (p) { return p.o + Math.max(0, (p.p || p.o) - p.o) * 0.4; };
var f = {
surplus: function (a, b) { var ra = q.xi[a.id] ? 2 : q.bn[a.id] ? 1 : 0, rb = q.xi[b.id] ? 2 : q.bn[b.id] ? 1 : 0; return (ra - rb) || (use(a) - use(b)); },
weak: function (a, b) { return (a.o - b.o) || (a.v - b.v); },
old: function (a, b) { return (b.a - a.a) || (a.o - b.o); },
wage: function (a, b) { return (b.w - a.w) || (a.o - b.o); },
value: function (a, b) { return b.v - a.v; }
}[mode] || function (a, b) { return a.o - b.o; };
return squad().slice().sort(f);
}
function repick() {
var n = Math.max(0, Math.min(sell.n, maxSell())); sell.n = n; sell.picked = {};
ordered(sell.mode).slice(0, n).forEach(function (p) { sell.picked[p.id] = 1; });
}
function pickedList() { return squad().filter(function (p) { return sell.picked[p.id]; }); }
function sellOpen() { sell = { n: Math.min(3, maxSell()) || 0, mode: 'surplus', mult: 1, picked: {}, step: 1, quotes: [], out: null }; repick(); sellBox(); }
function sellBox(keep) {
var g = G(), s = S(), cards = squad(), mx = maxSell(), open = H.windowOpen(g), pl = pickedList(), est = 0, q = inSets();
if (sell.step === 2) return quoteBox();
if (sell.step === 3) return doneBox();
pl.forEach(function (p) { est += p.v * sell.mult; });
var nXI = pl.filter(function (p) { return q.xi[p.id]; }).length;
var h = '<div class="v9hd2"><h3>💷 Sell players</h3><button class="v9x" data-v9="x">✕</button></div><div class="v9st">Squad: <b>' + cards.length + '</b> players · you can sell up to <b>' + mx + '</b> (the minimum is 18)<br>Transfer window: <b style="color:' + (open ? '#6ee08a' : '#ff8a8a') + '">' + (open ? 'OPEN' : 'CLOSED') + '</b>' + (open ? '' : ' (opens in weeks 1 to 4 and 20 to 24)') + '</div>';
if (!mx) return box(h + '<div class="v9warn">You only have 18 players, which is the minimum. Sign someone first, then you can sell.</div>' + btn('x', 'Close', 'g'));
h += '<div class="v9lbl">HOW MANY PLAYERS?</div><div class="v9step"><button data-v9="nm">−</button><b>' + sell.n + '<small>of ' + mx + ' possible</small></b><button data-v9="np">+</button></div>';
h += '<div class="v9lbl">WHO SHOULD GO? (or tap players yourself)</div><div class="v9chips">' + MODES.map(function (m) { return '<button data-v9="mode" data-k="' + m[0] + '" class="' + (sell.mode === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div>';
h += '<div class="v9lbl">PRICE</div><div class="v9chips">' + MULTS.map(function (m) { return '<button data-v9="mult" data-k="' + m[0] + '" class="' + (sell.mult === m[0] ? 'on' : '') + '">' + m[1] + '</button>'; }).join('') + '</div>';
if (sell.mult > 1.05) h += '<div class="v9st" style="font-size:12px">Asking more means some clubs may not bite. Quick sale almost always finds a buyer.</div>';
h += '<div class="v9lbl">YOUR PLAYERS (tap to select or unselect)</div>';
ordered(sell.mode).forEach(function (p) {
var on = sell.picked[p.id];
h += '<div class="v9sr ' + (on ? 'on' : '') + '" data-v9="tg" data-k="' + p.id + '"><i class="v9ck">✓</i><div class="v9f sm">' + pface(p, 38) + '</div><div class="v9sm"><b>' + esc(p.n) + (q.xi[p.id] ? '<span class="v9tg">XI</span>' : q.bn[p.id] ? '<span class="v9tg b">BENCH</span>' : '') + (p.inj ? '<span class="v9tg i">INJ</span>' : '') + '</b><small>' + p.pos + ' · ' + p.a + ' years · ' + fm(p.w) + '/wk · contract ' + Math.max(0, p.ct) + 'y</small></div><div class="v9sv"><b>' + p.o + '</b><small>' + fm(p.v * sell.mult) + '</small></div></div>';
});
h += '<div class="v9foot">' + (nXI ? '<div class="v9warn s">⚠ ' + nXI + ' of them ' + (nXI === 1 ? 'is' : 'are') + ' in your starting XI.</div>' : '') +
'<div style="font-size:13px">Selling <b>' + pl.length + '</b> · about <b>' + fm(est) + '</b> · squad after: <b>' + (cards.length - pl.length) + '</b></div>' +
'<div class="v9two">' + btn('list', '📋 List them', 'g', null, !pl.length) + btn('quote', open ? '🔎 SEE OFFERS (' + pl.length + ')' : 'WINDOW CLOSED', '', null, !pl.length || !open) + '</div></div>';
box(h, keep);
}
function makeQuotes() {
var g = G(), s = S(), used = {}, out = [];
pickedList().forEach(function (p) {
var chance = sell.mult <= 0.85 ? 1 : sell.mult <= 1.05 ? 0.9 : 0.6;
if (p.a >= 32) chance -= 0.1; if (p.o >= 85) chance += 0.05; chance = Math.max(0.15, Math.min(1, chance));
var fee = p.v * sell.mult * (0.96 + rnd() * 0.08), qt = { pid: p.id, to: null, fee: fee, note: '' };
if (rnd() <= chance) {
var afford = function (b) { return b.id !== s.uid && (b.cash - (used[b.id] || 0)) >= fee; };
var c = s.clubs.filter(function (b) { return afford(b) && g.SQ[b.id].length < 33 && b.rep >= p.o * 0.7 - 10; });
if (!c.length) c = s.clubs.filter(afford);
if (c.length) { var b = c[Math.floor(rnd() * c.length)]; qt.to = b.id; used[b.id] = (used[b.id] || 0) + fee; }
else qt.note = 'no club can afford him';
} else qt.note = 'no club is interested at this price';
out.push(qt);
});
sell.quotes = out;
}
function quoteBox() {
var g = G(), s = S(), ok = sell.quotes.filter(function (x) { return x.to != null; }), tot = 0;
ok.forEach(function (x) { tot += x.fee; });
var h = '<div class="v9hd2"><h3>💷 Offers</h3><button class="v9x" data-v9="x">✕</button></div><div class="v9st">' + ok.length + ' of ' + sell.quotes.length + ' players have a buyer. Nothing is sold until you confirm.</div>';
sell.quotes.forEach(function (x) {
var p = g.P[x.pid]; if (!p) return;
h += '<div class="v9q ' + (x.to == null ? 'no' : '') + '"><div class="v9f sm">' + pface(p, 38) + '</div><div class="v9sm"><b>' + esc(p.n) + '</b><small>' + (x.to != null ? '➜ ' + esc(s.clubs[x.to].name) : esc(x.note)) + '</small></div><div class="v9sv"><b>' + (x.to != null ? fm(x.fee) : 'No offer') + '</b><small>value ' + fm(p.v) + '</small></div></div>';
});
h += '<div class="v9foot"><div style="font-size:13px">Total: <b>' + fm(tot) + '</b> · squad after: <b>' + (squad().length - ok.length) + '</b></div>' +
btn('confirm', '✅ CONFIRM SALE OF ' + ok.length + (ok.length === 1 ? ' PLAYER' : ' PLAYERS'), '', null, !ok.length) + '<div class="v9two" style="grid-template-columns:1fr 1fr">' + btn('requote', '🔁 Ask again', 'g') + btn('back', '← Change', 'g') + '</div></div>';
box(h);
}
function confirmSale() {
var g = G(), s = S(), done = [], fail = [];
if (!H.windowOpen(g)) return toast('The transfer window is closed');
sell.quotes.forEach(function (x) {
if (x.to == null) { fail.push(x); return; }
var b = s.clubs[x.to];
if (!g.P[x.pid] || g.P[x.pid].cl !== s.uid) { x.note = 'no longer your player'; fail.push(x); return; }
if (b.cash < x.fee) { x.note = 'the club ran out of money'; fail.push(x); return; }
var er = H.sellPlayer(g, x.pid, x.fee, x.to);
if (er) { x.note = er; fail.push(x); } else done.push(x);
});
s.offers = (s.offers || []).filter(function (o) { return g.P[o.pid] && g.P[o.pid].cl === s.uid; });
save(); sell.out = { done: done, fail: fail }; sell.step = 3; doneBox(); refresh();
}
function doneBox() {
var g = G(), s = S(), o = sell.out || { done: [], fail: [] }, tot = 0;
o.done.forEach(function (x) { tot += x.fee; });
var h = '<h3>✅ Sale complete</h3><div class="v9st">Sold <b>' + o.done.length + '</b> player' + (o.done.length === 1 ? '' : 's') + ' for <b>' + fm(tot) + '</b>. Your squad now has <b>' + squad().length + '</b> players.</div>';
o.done.forEach(function (x) { var p = g.P[x.pid]; if (p) h += '<div class="v9q"><div class="v9f sm">' + pface(p, 38) + '</div><div class="v9sm"><b>' + esc(p.n) + '</b><small>➜ ' + esc(s.clubs[x.to].name) + '</small></div><div class="v9sv"><b>' + fm(x.fee) + '</b></div></div>'; });
if (o.fail.length) { h += '<div class="v9lbl">NOT SOLD</div>'; o.fail.forEach(function (x) { var p = g.P[x.pid]; if (p) h += '<div class="v9q no"><div class="v9f sm">' + pface(p, 38) + '</div><div class="v9sm"><b>' + esc(p.n) + '</b><small>' + esc(x.note || 'no offer') + '</small></div></div>'; }); }
box(h + btn('x', 'Close') + (o.fail.length ? btn('again', 'Sell more players', 'g') : ''));
}

/* =====================================================================
4. TEAM OF THE WEEK (best XI of the last matchday in your league)
===================================================================== */
var snap = null;
function mkSnap(g, w, partial) {
var d = {}; g.S.players.forEach(function (p) { d[p.id] = [p.g || 0, p.as || 0, p.rs || 0, p.rn || 0, p.ap || 0]; });
return { y: g.S.year, w: w, partial: !!partial, d: d };
}
function arrange(items, want) {
var out = new Array(want.length), left = items.slice();
want.forEach(function (w, i) { for (var j = 0; j < left.length; j++) if (left[j].p.pos === w) { out[i] = left[j]; left.splice(j, 1); break; } });
for (var i = 0; i < out.length; i++) if (!out[i]) out[i] = left.shift();
return out;
}
function computeTotw(g, sn, fw) {
var s = g.S, uc = H.userClub(g), lg = uc.lg, L = s.lg[lg], rd = L && L.rounds[fw - 1]; if (!rd) return null;
var res = {}, bestM = null;
rd.forEach(function (f) {
if (f[2] < 0) return; res[f[0]] = { gf: f[2], ga: f[3] }; res[f[1]] = { gf: f[3], ga: f[2] };
if (f[2] !== f[3]) { var sc = Math.abs(f[2] - f[3]) * 10 + f[2] + f[3]; if (!bestM || sc > bestM.sc) bestM = { cid: f[2] > f[3] ? f[0] : f[1], sc: sc }; }
});
var list = [];
s.players.forEach(function (p) {
if (p.cl == null || p.del) return; var c = s.clubs[p.cl]; if (!c || c.lg !== lg) return;
var o = sn.d[p.id] || [0, 0, 0, 0, 0], dap = (p.ap || 0) - o[4]; if (dap <= 0) return;
var dg = (p.g || 0) - o[0], da = (p.as || 0) - o[1], drs = (p.rs || 0) - o[2], drn = (p.rn || 0) - o[3];
var r = res[p.cl] || { gf: 0, ga: 1 }, grp = H.GROUP[p.pos];
var sc = dg * 4 + da * 2.5 + p.o * 0.06 + (r.gf > r.ga ? 1.2 : r.gf === r.ga ? 0.2 : 0);
if (drn > 0) sc += (drs / drn - 6.2) * 2.2;
if (r.ga === 0) sc += grp === 'G' ? 3 : grp === 'D' ? 2 : grp === 'M' ? 0.6 : 0;
list.push({ p: p, sc: sc, grp: grp, g: dg, a: da });
});
var top = function (grp, n) { return list.filter(function (x) { return x.grp === grp; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, n); };
var gk = top('G', 1), df = top('D', 4), md = top('M', 3), at = top('A', 3);
if (gk.length < 1 || df.length < 4 || md.length < 3 || at.length < 3) return null;
var xi = [].concat(arrange(at, ['LW', 'ST', 'RW']), arrange(md, ['LM', 'CM', 'RM']), arrange(df, ['LB', 'CB', 'CB', 'RB']), gk);
var used = {}; xi.forEach(function (x) { used[x.p.id] = 1; });
var bn = list.filter(function (x) { return !used[x.p.id]; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 5);
var rec = function (x) { return { id: x.p.id, n: x.p.n, pos: x.p.pos, cl: x.p.cl, o: x.p.o, g: x.g, a: x.a }; };
return { w: fw, y: s.year, lg: lg, mgr: bestM ? bestM.cid : null, xi: xi.map(rec), bn: bn.map(rec) };
}
var oldStart = H.afterStart;
H.afterStart = function (g) { var r; if (oldStart) r = oldStart.apply(this, arguments); try { snap = mkSnap(g, 1, false); } catch (e) {} return r; };
var oldWeek = H.afterWeek;
H.afterWeek = function (g) {
var r; if (oldWeek) r = oldWeek.apply(this, arguments);
try {
var s = g.S, fw = s.week - 1;
if (snap && !snap.partial && snap.y === s.year && snap.w === fw && fw >= 1) { var t = computeTotw(g, snap, fw); if (t) { s.v9 = s.v9 || {}; s.v9.totw = t; } }
snap = mkSnap(g, s.week, false);
} catch (e) { if (window.console) console.error('HANS FC 3.6 team of the week', e); }
return r;
};
var SLOTS = [[18, 17], [50, 11], [82, 17], [22, 42], [50, 46], [78, 42], [14, 68], [38, 71], [62, 71], [86, 68], [50, 90]];
function ppHTML(r, x, y) {
var g = G(), s = S(), p = g.P[r.id] || { id: r.id, n: r.n, nat: 'England', a: 25, pos: r.pos, cl: r.cl }, c = s.clubs[r.cl];
var mk = (r.g ? '<em>⚽' + (r.g > 1 ? r.g : '') + '</em>' : '');
return '<div class="v9pp"' + (x != null ? ' style="left:' + x + '%;top:' + y + '%"' : '') + '><div class="v9f md">' + pface(p, 56) + '</div>' + mk + '<div class="v9pn"><b>' + esc(short(r.n)) + '</b><small>' + esc(c ? c.name : '') + '</small></div></div>';
}
function totwBox() {
var g = G(), s = S(), t = V().totw;
if (!t || t.y !== s.year) return box('<h3>⭐ Team of the Week</h3><div class="v9st">The first Team of the Week appears once a matchday has been played and you move on to the next week.</div>' + btn('x', 'Close', 'g'));
var lg = H.lgOf(t.lg), h = '<div class="v9hd2" style="margin-bottom:6px"><div class="v9th" style="flex:1;margin:0"><b>TEAM OF THE WEEK</b><small>' + esc(lg ? lg.name : '') + ' · Matchday ' + t.w + '</small></div><button class="v9x" data-v9="x">✕</button></div>';
var mc = t.mgr != null ? s.clubs[t.mgr] : null, cm = mc ? coach(mc, 0) : null;
if (mc) h += '<div class="v9pm">' + (cm ? '<div class="v9f">' + H.face(cm.fp, 46, mc.col) + '</div>' : '') + '<div><small>MANAGER OF THE WEEK</small><b>' + esc(cm ? cm.m.n : 'Manager') + '</b><span>' + esc(mc.name) + '</span></div></div>';
h += '<div class="v9pitch">';
t.xi.forEach(function (r, i) { h += ppHTML(r, SLOTS[i][0], SLOTS[i][1]); });
h += '</div><div class="v9lbl">SUBSTITUTES</div><div class="v9subs">' + t.bn.map(function (r) { return ppHTML(r); }).join('') + '</div>' + btn('x', 'Close', 'g');
box(h);
}

/* =====================================================================
5. CLICKS, PATCHES AND START-UP
===================================================================== */
document.addEventListener('click', function (e) {
var b = e.target.closest('[data-v9]'); if (!b || !G()) return;
var q = b.dataset.v9, k = b.dataset.k;
try {
if (q === 'x') shut();
else if (q === 'sell') sellOpen();
else if (q === 'again') sellOpen();
else if (q === 'nm') { sell.n = Math.max(1, sell.n - 1); repick(); sellBox(true); }
else if (q === 'np') { sell.n = Math.min(maxSell(), sell.n + 1); repick(); sellBox(true); }
else if (q === 'mode') { sell.mode = k; repick(); sellBox(true); }
else if (q === 'mult') { sell.mult = parseFloat(k); sellBox(true); }
else if (q === 'tg') {
var id = +k;
if (sell.picked[id]) delete sell.picked[id];
else if (Object.keys(sell.picked).length >= maxSell()) return toast('You must keep at least 18 players');
else sell.picked[id] = 1;
sell.n = Object.keys(sell.picked).length; sellBox(true);
}
else if (q === 'quote' || q === 'requote') { makeQuotes(); sell.step = 2; quoteBox(); }
else if (q === 'back') { sell.step = 1; sellBox(); }
else if (q === 'confirm') confirmSale();
else if (q === 'list') { var n = 0; pickedList().forEach(function (p) { p.lst = true; n++; }); save(); toast(n + ' player' + (n === 1 ? '' : 's') + ' listed. Offers will come.'); shut(); refresh(); }
else if (q === 'totw') totwBox();
else if (q === 'classic') { setClassic(true); var sc = $('#screen'); if (sc) { sc.classList.remove('v9on'); var hb = sc.querySelector('.v9hub'); if (hb) hb.remove(); } patch(); }
else if (q === 'newhub') { setClassic(false); patch(); }
} catch (er) { if (window.console) console.error('HANS FC 3.6 click', er); }
});
function patch() {
try {
var g = G(), s = S(); if (!g || !s) return; var scr = $('#screen'); if (!scr) return;
var strip = scr.querySelector('.strip b'), t1 = scr.querySelector('.tabs2');
if (strip && strip.textContent === 'TRANSFERS' && t1 && !scr.querySelector('.v9bar')) t1.insertAdjacentHTML('afterend', '<div class="v9bar"><button data-v9="sell">💷 SELL PLAYERS · choose how many</button></div>');
else if (!strip && t1 && scr.querySelector('[data-act="csec"]') && !scr.querySelector('.v9bar')) t1.insertAdjacentHTML('afterend', '<div class="v9bar"><button data-v9="totw">⭐ TEAM OF THE WEEK</button></div>');
var game = scr.querySelector('[data-act="renclub"]');
if (game) {
if (classic()) {
scr.classList.remove('v9on'); var h0 = scr.querySelector('.v9hub'); if (h0) h0.remove();
if (!scr.querySelector('.v9cl') && t1) t1.insertAdjacentHTML('afterend', '<div class="v9cl"><button data-v9="newhub">✨ Use the new club hub</button></div>');
} else {
var c0 = scr.querySelector('.v9cl'); if (c0 && !scr.querySelector('.v9hub .v9cl')) c0.remove();
var hub = scr.querySelector('.v9hub'), sg = sig(g);
if (!hub || hub.dataset.sig !== sg) injectHub(scr, g, sg);
scr.classList.add('v9on');
}
} else scr.classList.remove('v9on');
} catch (e) { if (window.console) console.error('HANS FC 3.6 patch', e); }
}
var scr0 = document.getElementById('screen');
if (scr0) new MutationObserver(function () { patch(); }).observe(scr0, { childList: true });
setInterval(function () {
try {
patch();
var s = S(); if (s && !snap && s.stage === 'week' && s.week >= 1) snap = mkSnap(G(), s.week, true);
if (s && !localStorage.getItem(SEEN) && !ov && !document.querySelector('.v3bg,.v4bg,.v5bg,.v6bg,.v7bg,.v8bg,#layer .full-l')) {
localStorage.setItem(SEEN, '1');
box('<h3>HANS FC ' + VER + '</h3><ul style="padding-left:18px;margin:0"><li><b>New club hub</b> on Menu, Settings and More: club rating, stadium, coach pictures, facility bars, relationships and tidy button groups</li><li><b>Sell players</b> in Transfers: choose how many, who, and at what price</li><li><b>Team of the Week</b> for your league, with the manager of the week</li></ul><p style="font-size:12px;color:#9fb9dc">You can switch back to the classic menu at the bottom of the hub.</p>' + btn('x', 'Close'));
}
} catch (e) {}
}, 1500);
var ob = window.__back; window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
window.__hfcV9 = { hubHTML: hubHTML, ratings: ratings, coach: coach, ordered: ordered, repick: repick, makeQuotes: makeQuotes, confirmSale: confirmSale, computeTotw: computeTotw, mkSnap: mkSnap, sell: function () { return sell; }, setSell: function (o) { for (var k in o) sell[k] = o[k]; }, ver: VER };
} catch (err) { if (window.console) console.error('HANS FC 3.6 add-on failed', err); }
})();
/* HANS FC 3.7 add-on: easy Menu with search + Music */
(function () {
try {
var H = window.HFC; if (!H) return;
var G = function () { return window.__hfc && window.__hfc.G; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var toast = function (t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2400); } };
var css = [
'.hmbg{position:fixed;inset:0;z-index:100;background:#000c;display:flex;align-items:flex-end;justify-content:center}',
'.hmbox{width:100%;max-width:480px;max-height:92%;overflow-y:auto;background:#0f3f7d;color:#fff;border-radius:18px 18px 0 0;padding:12px 12px calc(16px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}',
'.hmh{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:18px;font-weight:900;text-transform:uppercase}',
'.hmx{background:#f58a1f;color:#fff;border:0;border-radius:8px;width:38px;height:34px;font-size:16px;font-weight:900}',
'.hmsec{margin:12px 0 6px;color:#cfe0f7;font-size:12px;font-weight:900;letter-spacing:.06em}',
'.hmgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
'.hmt{display:flex;align-items:center;gap:8px;background:#1c5aa8;border:2px solid #5d9be0;border-radius:10px;padding:12px 10px;color:#fff;font:inherit;font-weight:800;text-align:left;min-width:0}',
'.hmt span{font-size:22px;flex:none}',
'.hmt.red{background:#c9302c;border-color:#e0746f}',
'.hmcat{width:100%;display:flex;align-items:center;gap:8px;background:#0a2e5e;border:0;border-radius:10px;padding:12px;color:#fff;font:inherit;font-weight:900;text-align:left;margin-bottom:6px;text-transform:uppercase}',
'.hmcat em{margin-left:auto;font-style:normal;color:#9fb9dc}',
'.hmitems{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px}',
'.hmres{width:100%;display:flex;align-items:center;gap:10px;background:#1c5aa8;border:0;border-radius:10px;padding:11px 12px;color:#fff;font:inherit;font-weight:800;text-align:left;margin-bottom:6px}',
'.hmres small{display:block;color:#cfe0f7;font-weight:600;font-size:11px}',
'.hmnote{color:#cfe0f7;font-size:12px;margin:8px 0}',
'.hmnow{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0a2e5e;border-radius:12px;padding:10px 12px;margin-bottom:8px}',
'.hmnow small{display:block;color:#9fb9dc;font-size:11px;font-weight:800}',
'.hmnow b{display:block;font-size:16px}',
'.hmplay{background:#f58a1f;color:#fff;border:0;border-radius:50%;width:48px;height:48px;font-size:20px;flex:none}',
'.hmrow{width:100%;display:flex;align-items:center;gap:10px;background:#1c5aa8;border:2px solid transparent;border-radius:10px;padding:10px;color:#fff;font:inherit;text-align:left;margin-bottom:6px}',
'.hmrow.on{border-color:#ffc928;background:#2a6fc4}',
'.hmrow span{font-size:22px;flex:none;width:30px;text-align:center}.hmrow b{display:block}.hmrow small{display:block;color:#cfe0f7;font-size:11px;font-weight:600}',
'.hmrow .hmdel{margin-left:auto;background:#c9302c;border-radius:8px;padding:6px 10px;font-weight:900;flex:none}',
'.hmadd{width:100%;background:#f58a1f;color:#fff;border:0;border-radius:10px;padding:12px;font:inherit;font-weight:900;margin:4px 0 8px}',
'.hmclose{width:100%;background:#1c5aa8;color:#fff;border:2px solid #5d9be0;border-radius:10px;padding:12px;font:inherit;font-weight:900;margin-top:6px}',
'.hmlab{display:block;color:#cfe0f7;font-size:12px;font-weight:800;margin:6px 0 2px}',
'.hmbox input[type=range]{width:100%;accent-color:#f58a1f;margin:4px 0 6px}',
'.hmbox input[type=text]{box-sizing:border-box;width:100%}',
'.hmchk{display:flex;align-items:center;gap:8px;font-size:14px;margin:8px 0}',
'.hmchk input{width:20px;height:20px;accent-color:#f58a1f}',
'.hmfab{position:fixed;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:60;width:42px;height:42px;border-radius:50%;border:0;background:#f58a1f;color:#fff;font-size:20px;display:none;place-items:center}',
'#top .hm-menu{width:auto;padding:0 10px;font-size:14px;font-weight:900}'
].join('\n');
var stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);
var MK = 'hfc_music_v1';
var st = { on: true, vol: 0.6, track: 'kickoff', auto: true };
try {
var raw = JSON.parse(localStorage.getItem(MK) || 'null');
if (raw) {
if (typeof raw.on === 'boolean') st.on = raw.on;
if (typeof raw.vol === 'number') st.vol = Math.max(0, Math.min(1, raw.vol));
if (typeof raw.track === 'string') st.track = raw.track;
if (typeof raw.auto === 'boolean') st.auto = raw.auto;
}
} catch (e) {}
function saveSt() { try { localStorage.setItem(MK, JSON.stringify(st)); } catch (e) {} }
var AC = window.AudioContext || window.webkitAudioContext;
var ctx = null, master = null, noiseBuf = null, timer = null, nextT = 0, stepNo = 0, cur = null;
var audioEl = null, audioUrl = null, nowName = '', loading = false, tok = 0, matchOn = false, player = null, warned = false;
function ensureCtx() {
if (!AC) return false;
if (!ctx) {
ctx = new AC(); master = ctx.createGain(); master.gain.value = st.vol * st.vol;
var comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) {} }
return true;
}
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function tone(m, t, d, type, g, o) {
o = o || {};
var osc = ctx.createOscillator(), amp = ctx.createGain(), a = Math.min(o.a || 0.006, d * 0.5);
osc.type = type; osc.frequency.value = mtof(m);
amp.gain.setValueAtTime(0.0001, t);
amp.gain.linearRampToValueAtTime(g, t + a);
amp.gain.exponentialRampToValueAtTime(0.0001, t + d);
osc.connect(amp);
if (o.lp) { var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; amp.connect(f); f.connect(master); } else amp.connect(master);
osc.start(t); osc.stop(t + d + 0.03);
}
function noise(t, d, g, hp) {
var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), amp = ctx.createGain();
src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
amp.gain.setValueAtTime(g, t); amp.gain.exponentialRampToValueAtTime(0.0001, t + d);
src.connect(f); f.connect(amp); amp.connect(master); src.start(t); src.stop(t + d + 0.02);
}
function kick(t, g) {
var osc = ctx.createOscillator(), amp = ctx.createGain(); g = g || 0.9;
osc.type = 'sine'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
amp.gain.setValueAtTime(g, t); amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
osc.connect(amp); amp.connect(master); osc.start(t); osc.stop(t + 0.32);
}
function snare(t, g) { g = g || 0.35; noise(t, 0.14, g, 1500); tone(47, t, 0.1, 'triangle', g * 0.5); }
function hat(t, g) { noise(t, 0.04, g || 0.06, 7000); }
var K_CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], K_BS = [36, 43, 45, 41], K_ARP = [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 1];
var K_ML = [[76, 0, 0, 0, 79, 0, 0, 76, 0, 0, 74, 0, 72, 0, 0, 0], [74, 0, 0, 0, 79, 0, 0, 74, 0, 0, 71, 0, 74, 0, 0, 0], [72, 0, 0, 0, 76, 0, 0, 72, 0, 0, 69, 0, 72, 0, 0, 0], [72, 0, 0, 76, 0, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0]];
var C_CH = [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 67]], C_BS = [45, 41, 48, 43];
var C_ML = [[0, 0, 76, 0, 0, 0, 72, 0, 0, 0, 74, 0, 0, 0, 69, 0], [0, 0, 72, 0, 0, 0, 76, 0, 0, 0, 77, 0, 0, 0, 76, 0], [0, 0, 79, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0, 74, 0], [0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 79, 0]];
var B_CH = [[62, 65, 69], [58, 62, 65], [65, 69, 72], [60, 64, 67]], B_BS = [38, 34, 41, 36];
var B_ML = [[74, 0, 0, 0, 0, 0, 77, 0, 76, 0, 0, 0, 74, 0, 0, 0], [74, 0, 0, 0, 0, 0, 77, 0, 79, 0, 0, 0, 77, 0, 0, 0], [77, 0, 0, 0, 0, 0, 81, 0, 79, 0, 0, 0, 77, 0, 0, 0], [76, 0, 0, 0, 74, 0, 72, 0, 71, 0, 0, 0, 69, 0, 0, 0]];
var L_CH = [[55, 59, 62], [60, 64, 67], [55, 59, 62], [62, 66, 69]], L_BS = [43, 48, 43, 38], L_CONG = { 0: 1, 3: 1, 6: 1, 8: 1, 11: 1, 14: 1 }, L_GP = { 2: 0, 3: 1, 5: 2, 7: 0, 9: 1, 10: 2, 12: 0, 13: 1, 15: 2 };
var L_ML = [[0, 0, 0, 79, 0, 0, 76, 0, 0, 74, 0, 0, 76, 0, 0, 0], [0, 0, 0, 79, 0, 0, 81, 0, 0, 79, 0, 0, 76, 0, 0, 0], [0, 0, 0, 79, 0, 0, 76, 0, 0, 74, 0, 0, 71, 0, 0, 0], [0, 0, 0, 78, 0, 0, 74, 0, 0, 76, 0, 0, 78, 0, 0, 0]];
var TRACKS = {
kickoff: {
name: 'Kick-off Anthem', icon: '🏟️', desc: 'Bright and happy stadium energy', bpm: 124,
step: function (i, t, d) {
var b = i >> 4, s = i & 15, c = K_CH[b];
if (s % 4 === 0) kick(t, 0.8);
if (s === 4 || s === 12) snare(t, 0.3);
if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.07 : 0.035);
if (s % 2 === 0) tone(K_BS[b] + (s === 6 || s === 14 ? 12 : 0), t, d * 1.8, 'triangle', 0.32, { lp: 800 });
tone(c[K_ARP[s]] + 12, t, d * 1.4, 'square', 0.035, { lp: 2600 });
var m = K_ML[b][s]; if (m) tone(m, t, d * 3, 'sawtooth', 0.07, { lp: 2400, a: 0.01 });
}
},
chill: {
name: 'Chill Manager', icon: '☕', desc: 'Slow and calm for planning your squad', bpm: 78,
step: function (i, t, d) {
var b = i >> 4, s = i & 15, c = C_CH[b];
if (s === 0) c.forEach(function (n) { tone(n, t, d * 15, 'triangle', 0.035, { a: 0.6, lp: 1100 }); });
if (s === 0 || s === 10) kick(t, 0.5);
if (s === 4 || s === 12) snare(t, 0.12);
if (s % 2 === 0) hat(t, 0.02);
if (s === 0 || s === 7 || s === 10) tone(C_BS[b], t, d * 5, 'sine', 0.35);
var m = C_ML[b][s]; if (m) tone(m, t, d * 4, 'triangle', 0.1, { lp: 1800 });
}
},
bignight: {
name: 'Big Night', icon: '🌙', desc: 'Fast and tense for match day', bpm: 134,
step: function (i, t, d) {
var b = i >> 4, s = i & 15, c = B_CH[b];
if (s % 4 === 0 || s === 10) kick(t, 0.9);
if (s === 4 || s === 12) snare(t, 0.38);
hat(t, s % 2 ? 0.03 : 0.06);
tone(B_BS[b] + (s % 8 === 7 ? 12 : 0), t, d * 0.95, 'sawtooth', 0.16, { lp: 520 });
if (s === 0 || s === 3 || s === 6 || s === 10 || s === 14) c.forEach(function (n) { tone(n + 12, t, d * 2, 'sawtooth', 0.04, { lp: 1700 }); });
var m = B_ML[b][s]; if (m) tone(m, t, d * 3.5, 'square', 0.05, { lp: 2200 });
if (b === 3 && s >= 8) tone(60 + (s - 8) * 2, t, d * 1.2, 'triangle', 0.05);
}
},
highlife: {
name: 'Highlife Groove', icon: '🥁', desc: 'Warm guitar and drum rhythm', bpm: 108,
step: function (i, t, d) {
var b = i >> 4, s = i & 15, c = L_CH[b];
if (L_CONG[s]) { tone(s === 0 || s === 8 ? 52 : 57, t, d * 1.6, 'sine', 0.28); noise(t, 0.03, 0.05, 3000); }
hat(t, s % 2 ? 0.018 : 0.03);
if (s === 0 || s === 8) kick(t, 0.55);
if (s === 4 || s === 12) noise(t, 0.05, 0.12, 2500);
if (L_CONG[s]) tone(L_BS[b] + (s === 6 || s === 14 ? 7 : 0), t, d * 2.2, 'triangle', 0.3, { lp: 700 });
if (L_GP[s] != null) tone(c[L_GP[s]] + 12, t, d * 1.5, 'square', 0.04, { lp: 3200 });
var m = L_ML[b][s]; if (m) tone(m, t, d * 3, 'triangle', 0.11, { lp: 2600 });
}
}
};
function tick() {
if (!ctx || !cur) return;
var d = 60 / cur.bpm / 4;
if (nextT < ctx.currentTime - 0.1) nextT = ctx.currentTime + 0.05;
while (nextT < ctx.currentTime + 0.25) {
try { cur.step(stepNo % 64, nextT, d); } catch (e) {}
nextT += d; stepNo++;
}
}
function stopAll() {
tok++; loading = false;
if (timer) { clearInterval(timer); timer = null; }
cur = null;
if (audioEl) { try { audioEl.onended = null; audioEl.pause(); } catch (e) {} audioEl = null; }
if (audioUrl) { try { URL.revokeObjectURL(audioUrl); } catch (e) {} audioUrl = null; }
nowName = '';
}
function isPlaying() { return !!(cur || (audioEl && !audioEl.paused)); }
function setVol(v) { st.vol = Math.max(0, Math.min(1, v)); if (master) master.gain.value = st.vol * st.vol; if (audioEl) { try { audioEl.volume = st.vol; } catch (e) {} } saveSt(); }
function start(id) {
stopAll();
if (id && String(id).indexOf('my:') === 0) return playMine(String(id).slice(3));
var tr = TRACKS[id] || TRACKS.kickoff;
if (!ensureCtx()) { if (!warned) { warned = true; toast('This phone cannot play the built-in music'); } return; }
cur = tr; stepNo = 0; nextT = ctx.currentTime + 0.1; nowName = tr.name;
timer = setInterval(tick, 40);
}
var dbh = null;
function withDb(cb) {
if (dbh) return cb(dbh);
try {
var rq = indexedDB.open('hfc_music', 1);
rq.onupgradeneeded = function () { try { rq.result.createObjectStore('songs', { keyPath: 'id' }); } catch (e) {} };
rq.onsuccess = function () { dbh = rq.result; cb(dbh); };
rq.onerror = function () { cb(null); };
} catch (e) { cb(null); }
}
function listSongs(cb) {
withDb(function (d) {
if (!d) return cb([]);
var out = [];
try {
var r = d.transaction('songs').objectStore('songs').openCursor();
r.onsuccess = function () { var c = r.result; if (c) { out.push({ id: c.value.id, name: c.value.name }); c.continue(); } else cb(out); };
r.onerror = function () { cb(out); };
} catch (e) { cb([]); }
});
}
function fallback() { st.track = 'kickoff'; saveSt(); start('kickoff'); }
function playMine(id) {
var my = ++tok; loading = true;
withDb(function (d) {
if (my !== tok) return;
if (!d) { loading = false; return fallback(); }
var rq;
try { rq = d.transaction('songs').objectStore('songs').get(id); } catch (e) { loading = false; return fallback(); }
rq.onsuccess = function () {
if (my !== tok) return;
loading = false;
var rec = rq.result; if (!rec || !rec.blob) return fallback();
audioUrl = URL.createObjectURL(rec.blob);
if (!player) player = new Audio(); audioEl = player; audioEl.src = audioUrl; audioEl.volume = st.vol; nowName = rec.name;
audioEl.onended = function () { nextMine(id); };
var p = audioEl.play(); if (p && p.catch) p.catch(function () { toast('Tap the screen to start the music'); });
};
rq.onerror = function () { loading = false; fallback(); };
});
}
function nextMine(id) {
listSongs(function (list) {
if (!list.length || !st.on) return;
var k = 0; list.forEach(function (s, i) { if (s.id === id) k = i; });
var n = list[(k + 1) % list.length]; st.track = 'my:' + n.id; saveSt(); start(st.track);
});
}
function addSongs() {
var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*'; inp.multiple = true;
inp.onchange = function () {
var files = Array.prototype.slice.call(inp.files || [], 0, 20);
if (!files.length) return;
withDb(function (d) {
if (!d) return toast('Your phone could not store songs');
var added = 0, left = files.length;
files.forEach(function (f) {
if (f.size > 60 * 1024 * 1024) { toast(f.name + ' is too big (max 60 MB)'); left--; if (!left) done(); return; }
try {
var tx = d.transaction('songs', 'readwrite');
tx.objectStore('songs').put({ id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), name: String(f.name || 'Song').replace(/\.[^.]+$/, ''), size: f.size, blob: f });
tx.oncomplete = function () { added++; left--; if (!left) done(); };
tx.onerror = function () { left--; if (!left) done(); };
} catch (e) { left--; if (!left) done(); }
});
function done() { toast(added ? added + ' song' + (added > 1 ? 's' : '') + ' added' : 'No songs were added'); openMusic(); }
});
};
inp.click();
}
function delSong(id) {
withDb(function (d) {
if (!d) return;
try { var tx = d.transaction('songs', 'readwrite'); tx.objectStore('songs')['delete'](id); tx.oncomplete = function () { if (st.track === 'my:' + id) { st.track = 'kickoff'; saveSt(); if (st.on) start('kickoff'); } openMusic(); }; } catch (e) {}
});
}
function gesture() {
if (ctx && ctx.state === 'suspended' && st.on && ctx.resume) { try { ctx.resume(); } catch (e) {} }
if (st.on && !cur && !audioEl && !loading) start(st.track);
}
document.addEventListener('click', gesture, true);
document.addEventListener('touchend', gesture, true);
document.addEventListener('visibilitychange', function () {
if (document.hidden) {
if (ctx && ctx.suspend) { try { ctx.suspend(); } catch (e) {} }
if (audioEl) { try { audioEl.pause(); } catch (e) {} }
} else if (st.on) {
if (ctx && ctx.resume) { try { ctx.resume(); } catch (e) {} }
if (audioEl) { try { audioEl.play(); } catch (e) {} }
}
});
setInterval(function () {
try {
var inM = !!document.querySelector('.livepitch');
if (inM !== matchOn) {
matchOn = inM;
if (st.on && st.auto && String(st.track).indexOf('my:') !== 0) start(inM ? 'bignight' : st.track);
}
var mb = document.querySelector('#top .hm-music');
if (mb) { var t = isPlaying() ? '🎵' : '🔇'; if (mb.textContent !== t) mb.textContent = t; }
var fab = document.getElementById('hm-fab');
if (fab) { var show = G() ? 'none' : 'grid'; if (fab.style.display !== show) fab.style.display = show; fab.textContent = isPlaying() ? '🎵' : '🔇'; }
} catch (e) {}
}, 700);
var ov = null, openCat = null;
function shut() { if (ov) { ov.remove(); ov = null; } }
function showBox(html) {
var keep = ov && ov.firstChild ? ov.firstChild.scrollTop : 0;
shut(); ov = document.createElement('div'); ov.className = 'hmbg';
ov.innerHTML = '<div class="hmbox">' + html + '</div>';
document.body.appendChild(ov);
if (keep) ov.firstChild.scrollTop = keep;
}
function nowLabel() { return nowName || (st.on ? 'Starting…' : 'Music is off'); }
function openMusic() {
listSongs(function (songs) {
var h = '<div class="hmh"><span>🎵 Music</span><button class="hmx" data-hm="x">✕</button></div>';
h += '<div class="hmnow"><div><small>NOW PLAYING</small><b>' + esc(nowLabel()) + '</b></div><button class="hmplay" data-hm="toggle">' + (isPlaying() ? '⏸' : '▶') + '</button></div>';
h += '<label class="hmlab" for="hm-vol">Volume</label><input id="hm-vol" type="range" min="0" max="100" value="' + Math.round(st.vol * 100) + '">';
h += '<div class="hmsec">BUILT-IN SONGS</div>';
Object.keys(TRACKS).forEach(function (k) {
var t = TRACKS[k];
h += '<button class="hmrow' + (st.track === k ? ' on' : '') + '" data-hm="track" data-k="' + k + '"><span>' + t.icon + '</span><div><b>' + esc(t.name) + '</b><small>' + esc(t.desc) + '</small></div></button>';
});
h += '<div class="hmsec">MY SONGS</div>';
if (songs.length) songs.forEach(function (s) {
h += '<button class="hmrow' + (st.track === 'my:' + s.id ? ' on' : '') + '" data-hm="track" data-k="my:' + esc(s.id) + '"><span>🎧</span><div><b>' + esc(s.name) + '</b></div><i class="hmdel" data-hm="del" data-k="' + esc(s.id) + '">✕</i></button>';
}); else h += '<p class="hmnote">You have not added any songs yet.</p>';
h += '<button class="hmadd" data-hm="add">➕ Add songs from my phone</button>';
h += '<label class="hmchk"><input type="checkbox" id="hm-auto"' + (st.auto ? ' checked' : '') + '> Play Big Night during matches</label>';
h += '<p class="hmnote">The built-in songs are made inside the game, so nothing is downloaded. Songs you add stay on your phone. Only add songs you own or are allowed to use.</p>';
h += '<button class="hmclose" data-hm="x">Close</button>';
showBox(h);
});
}
var CATS = [
{ id: 'play', i: '⚽', n: 'Match day and tactics', it: [
['🏋️', 'Training', 'train fitness boost drills', { 'data-v7': 'train' }],
['🧠', 'Game plans', 'plan manager strategy', { 'data-v7': 'plans' }],
['🎯', 'Playing styles', 'style tactics custom', { 'data-v6': 'styles' }],
['📋', 'Lineup and formation', 'squad xi formation pick team tactics', { 'data-act': 'tab', 'data-v': 'squad' }],
['⭐', 'Team of the week', 'totw best eleven', { 'data-v9': 'totw' }],
['🏃', 'Training events', 'event camp morale', { 'data-act': 'cbgo', 'data-v': 'events' }]] },
{ id: 'ppl', i: '🧑', n: 'Players', it: [
['🆕', 'Create my own player', 'add new player make custom', { 'data-v5': 'newp' }],
['🧑', 'My players: info and photos', 'edit rename photo', { 'data-v5': 'plist' }],
['📷', 'Player pictures', 'faces photos images', { 'data-v8': 'photos' }],
['🖼️', 'Import photos', 'upload gallery pictures', { 'data-v3': 'imp' }],
['💷', 'Sell players', 'sell transfer list money', { 'data-v9': 'sell' }],
['🔁', 'Transfers', 'buy sign market free agents', { 'data-act': 'tab', 'data-v': 'market' }]] },
{ id: 'club', i: '🏛️', n: 'My club', it: [
['🛒', 'Store and bank', 'store shop coins cash money buy overdraft loan borrow bank', 'store'],
['💰', 'Club and finances', 'money cash income wages', { 'data-act': 'cbgo', 'data-v': 'fin' }],
['🏟️', 'Stadium and facilities', 'upgrade academy training ground', { 'data-act': 'cbgo', 'data-v': 'fac' }],
['📊', 'Board and targets', 'objectives confidence', { 'data-act': 'cbgo', 'data-v': 'board' }],
['👔', 'Manager', 'my manager profile', { 'data-v4': 'tool', 'data-k': 'mgr' }],
['👥', 'Coaches and staff', 'coach assistant scout physio', { 'data-v5': 'staff' }],
['🤝', 'Sponsors', 'shirt sponsor deal', { 'data-v4': 'tool', 'data-k': 'spon' }],
['✏️', 'Customize', 'create own information edit', { 'data-v5': 'cust' }],
['🛡️', 'Rename club', 'name change', { 'data-act': 'renclub' }],
['🎨', 'Upgrade badge', 'logo crest picture', { 'data-act': 'clubimg' }]] },
{ id: 'comp', i: '🏆', n: 'Competitions and awards', it: [
['🏆', 'Competitions and tables', 'league cup champions table fixtures', { 'data-act': 'tab', 'data-v': 'comp' }],
['🏅', 'Awards', 'player of the year prizes', { 'data-v4': 'tool', 'data-k': 'aw' }],
['🌍', 'World Cup', 'national team', { 'data-v4': 'tool', 'data-k': 'wc' }],
['🎯', 'Challenges', 'tasks rewards', { 'data-act': 'cbgo', 'data-v': 'chal' }],
['🥇', 'Achievements', 'trophies goals', { 'data-act': 'cbgo', 'data-v': 'ach' }],
['📜', 'History', 'past seasons', { 'data-act': 'cbgo', 'data-v': 'hist' }]] },
{ id: 'game', i: '⚙️', n: 'Music, saving and settings', it: [
['🎵', 'Music and songs', 'sound audio song volume mute add', 'music'],
['💾', 'Save now', 'save', { 'data-act': 'saveb' }],
['📦', 'Back up', 'backup copy export', { 'data-v3': 'bak' }],
['♻️', 'Restore', 'restore import backup', { 'data-v3': 'res' }],
['🆕', 'What’s new', 'news update version', { 'data-v3': 'new' }],
['💡', 'Hints and tips', 'help how to', { 'data-act': 'hints' }],
['🔧', 'More settings', 'settings options', { 'data-act': 'cbgo', 'data-v': 'more' }],
['🗑️', 'Restart game', 'delete reset new career', { 'data-act': 'reset' }, 'red']] }
];
var QUICK = [['club', 0], ['play', 3], ['play', 0], ['ppl', 4], ['ppl', 0], ['ppl', 2], ['game', 0], ['club', 1]];
function item(c, n) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === c) return CATS[i].it[n]; return null; }
function tile(c, n, it) { return '<button class="hmt' + (it[4] ? ' ' + it[4] : '') + '" data-hm="go" data-c="' + c + '" data-n="' + n + '"><span>' + it[0] + '</span>' + esc(it[1]) + '</button>'; }
function bodyHTML(q) {
q = String(q || '').toLowerCase().trim();
var h = '';
if (q) {
var toks = q.split(/\s+/), n = 0;
CATS.forEach(function (c) {
c.it.forEach(function (it, k) {
var hay = (it[1] + ' ' + it[2] + ' ' + c.n).toLowerCase();
if (toks.every(function (t) { return hay.indexOf(t) >= 0; })) { n++; h += '<button class="hmres" data-hm="go" data-c="' + c.id + '" data-n="' + k + '"><span style="font-size:22px">' + it[0] + '</span><div>' + esc(it[1]) + '<small>' + esc(c.n) + '</small></div></button>'; }
});
});
return n ? h : '<p class="hmnote">Nothing found. Try another word, like photo, sell, money or music.</p>';
}
h += '<div class="hmsec">MOST USED</div><div class="hmgrid">' + QUICK.map(function (x) { return tile(x[0], x[1], item(x[0], x[1])); }).join('') + '</div>';
h += '<div class="hmsec">ALL FEATURES, BY TOPIC</div>';
CATS.forEach(function (c) {
var open = openCat === c.id;
h += '<button class="hmcat" data-hm="cat" data-c="' + c.id + '"><span style="font-size:20px">' + c.i + '</span>' + esc(c.n) + '<em>' + (open ? '▲' : '▼ ' + c.it.length) + '</em></button>';
if (open) h += '<div class="hmitems">' + c.it.map(function (it, k) { return tile(c.id, k, it); }).join('') + '</div>';
});
return h;
}
function openMenu() {
if (!G()) return toast('Start your career first');
openCat = null;
showBox('<div class="hmh"><span>☰ Menu</span><button class="hmx" data-hm="x">✕</button></div><input id="hm-q" type="text" placeholder="🔍 Find anything: photo, sell, money, music" autocomplete="off"><div id="hm-body">' + bodyHTML('') + '</div><button class="hmclose" data-hm="x">Close</button>');
}
function fire(spec) {
var b = document.createElement('button');
Object.keys(spec).forEach(function (k) { b.setAttribute(k, spec[k]); });
b.style.display = 'none';
(document.getElementById('screen') || document.body).appendChild(b);
try { b.click(); } catch (e) {}
setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 0);
}
document.addEventListener('click', function (e) {
var tm = e.target.closest && e.target.closest('#top [data-act="menu"], #top [data-act="music"], #screen [data-act="menu2"]');
if (tm) {
e.stopPropagation(); e.stopImmediatePropagation();
if (tm.dataset.act === 'music') openMusic(); else openMenu();
return;
}
var fb = e.target.closest && e.target.closest('#hm-fab'); if (fb) { openMusic(); return; }
if (ov && e.target === ov) { shut(); return; }
var b = e.target.closest && e.target.closest('[data-hm]'); if (!b) return;
var q = b.dataset.hm, k = b.dataset.k;
if (q === 'x') shut();
else if (q === 'cat') { openCat = openCat === b.dataset.c ? null : b.dataset.c; var bd = document.getElementById('hm-body'); if (bd) bd.innerHTML = bodyHTML(''); }
else if (q === 'go') {
var it = item(b.dataset.c, +b.dataset.n); if (!it) return;
shut();
if (it[3] === 'music') openMusic(); else if (it[3] === 'store') { setTimeout(function () { if (window.HFCStore) window.HFCStore.open(); }, 30); } else setTimeout(function () { fire(it[3]); }, 30);
}
else if (q === 'toggle') { if (isPlaying()) { st.on = false; stopAll(); } else { st.on = true; start(st.track); } saveSt(); setTimeout(openMusic, 120); }
else if (q === 'track') { st.track = k; st.on = true; saveSt(); start(k); setTimeout(openMusic, String(k).indexOf('my:') === 0 ? 500 : 150); }
else if (q === 'add') addSongs();
else if (q === 'del') { e.stopPropagation(); delSong(k); }
}, true);
document.addEventListener('input', function (e) {
var t = e.target;
if (t && t.id === 'hm-q') { var bd = document.getElementById('hm-body'); if (bd) bd.innerHTML = bodyHTML(t.value); }
else if (t && t.id === 'hm-vol') setVol((+t.value || 0) / 100);
});
document.addEventListener('change', function (e) {
if (e.target && e.target.id === 'hm-auto') { st.auto = !!e.target.checked; saveSt(); }
});
var ob = window.__back;
window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
var fab = document.createElement('button'); fab.id = 'hm-fab'; fab.className = 'hmfab'; fab.textContent = '🎵'; fab.setAttribute('aria-label', 'Music');
document.body.appendChild(fab);
window.HFCMusic = { start: start, stop: function () { st.on = false; stopAll(); saveSt(); }, tracks: TRACKS };
} catch (err) { if (window.console) console.error('HANS FC 3.7 add-on failed', err); }
})();
/* HANS FC 3.8 add-on: Store and Bank */
(function () {
try {
var H = window.HFC; if (!H) return;
var KEY = 'hansfc_save_v2';
var G = function () { return window.__hfc && window.__hfc.G; };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var toast = function (t) { var e = document.getElementById('toast'); if (e) { e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2600); } };
var css = [
'.hsbal{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}',
'.hsbal div{background:#0a2e5e;border-radius:12px;padding:10px 12px;min-width:0}',
'.hsbal small{display:block;color:#9fb9dc;font-size:11px;font-weight:800}',
'.hsbal b{display:block;font-size:18px}',
'.hsp{display:flex;align-items:center;gap:10px;background:#1c5aa8;border-radius:10px;padding:10px 12px;margin-bottom:6px}',
'.hsp div{flex:1;min-width:0}.hsp b{display:block}.hsp small{display:block;color:#cfe0f7;font-size:11px;font-weight:600}',
'.hsb{background:#f58a1f;color:#fff;border:0;border-radius:8px;padding:10px 12px;font:inherit;font-weight:900;flex:none}',
'.hsb.dis{background:#4a6a96;color:#cfe0f7}',
'.hsb.gold{background:#ffc928;color:#3a2a00}',
'.hsrow{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}',
'.hsrow .hsb{flex:1;min-width:28%}',
'.hsbar{height:12px;border-radius:99px;background:#0a2e5e;overflow:hidden;margin:6px 0}',
'.hsbar i{display:block;height:100%;background:#f58a1f}',
'.hmplus{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#f58a1f;color:#fff;font-size:14px;font-weight:900;margin-left:6px;vertical-align:middle}',
'#top .cashpill{cursor:pointer}'
].join('\n');
var stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);
var MAXLV = 10, RATE = 0.004;
var PACKS = [[0.05, 10], [0.15, 40], [0.4, 100], [1, 230], [2.5, 500]];   /* [share of one year of club income, coin price] */
function nice(v) { return v >= 100 ? Math.round(v / 5) * 5 : v >= 20 ? Math.round(v) : v >= 2 ? Math.round(v * 2) / 2 : Math.max(0.1, Math.round(v * 10) / 10); }
function r6(v) { return Math.round(v * 1e6) / 1e6; }
function club(g) { return H.userClub(g || G()); }
function annual() { var c = club(); return Math.max(2, H.annualRev ? H.annualRev(c) : c.revW * 40); }
function st(g) {
g = g || G(); if (!g) return null;
var s = g.S; if (!s.store) s.store = { coins: 50, last: '', streak: 0, drawn: 0, level: 0, bankUid: s.uid, earned: 0 };
var t = s.store; if (t.bankUid !== s.uid) { t.bankUid = s.uid; t.drawn = 0; t.level = 0; }
return t;
}
function baseLimit() { return nice(annual() * 0.08); }
function stepLimit() { return nice(annual() * 0.05); }
function limit() { return r6(baseLimit() + st().level * stepLimit()); }
function raiseCost() { return 25 + 15 * st().level; }
function packCash(i) { return nice(annual() * PACKS[i][0]); }
function ds(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function today() { return ds(new Date()); }
function yday() { return ds(new Date(Date.now() - 864e5)); }
function nextStreak(t) { return t.last === yday() ? Math.min(7, (t.streak || 0) + 1) : 1; }
function dailyAmt(t) { return 10 + 2 * (nextStreak(t) - 1); }
function persist() { try { H.save(G(), KEY); } catch (e) {} }
function refreshGame() { try { var t = document.querySelector('#nav .on'); if (t) t.click(); } catch (e) {} }
function award(amt, why) {
var t = st(); if (!t || !amt) return;
t.coins += amt; t.earned = (t.earned || 0) + amt;
setTimeout(function () { toast('🪙 +' + amt + ' coins' + (why ? ' · ' + why : '')); }, 700);
}
var ov = null;
function shut() { if (ov) { ov.remove(); ov = null; } }
function open() {
var g = G(); if (!g) return toast('Start your career first');
var t = st(g), c = club(g), lim = limit(), avail = Math.max(0, r6(lim - t.drawn));
var keep = ov && ov.firstChild ? ov.firstChild.scrollTop : 0;
var h = '<div class="hmh"><span>🛒 Store and bank</span><button class="hmx" data-st="x">✕</button></div>';
h += '<div class="hsbal"><div><small>YOUR COINS</small><b>🪙 ' + Math.round(t.coins).toLocaleString('en-US') + '</b></div><div><small>CLUB BANK</small><b>' + esc(H.fm(c.cash)) + '</b></div></div>';
var can = t.last !== today();
h += '<button class="hsb' + (can ? ' gold' : ' dis') + '" style="width:100%;margin-bottom:6px" data-st="daily">' + (can ? '🎁 Claim daily reward: +' + dailyAmt(t) + ' 🪙' : '🎁 Daily reward claimed. Come back tomorrow') + '</button>';
h += '<div class="hmsec">CASH PACKS: COINS INTO YOUR CLUB BANK</div>';
PACKS.forEach(function (p, i) {
h += '<div class="hsp"><span style="font-size:24px">💷</span><div><b>' + esc(H.fm(packCash(i))) + '</b><small>Goes straight into your club bank</small></div><button class="hsb' + (t.coins >= p[1] ? '' : ' dis') + '" data-st="buy" data-k="' + i + '">🪙 ' + p[1] + '</button></div>';
});
h += '<div class="hmsec">BANK AND OVERDRAFT</div>';
h += '<div class="hmnote" style="margin:0">You owe <b>' + esc(H.fm(t.drawn)) + '</b> of a <b>' + esc(H.fm(lim)) + '</b> overdraft limit. The bank charges ' + (RATE * 100).toFixed(1) + '% interest every week on what you owe.</div>';
h += '<div class="hsbar"><i style="width:' + Math.min(100, Math.round(t.drawn / lim * 100)) + '%"></i></div>';
h += '<label class="hmlab">BORROW FROM THE BANK</label>';
var bo = [0.25, 0.5, 1].map(function (f) {
var a = f === 1 ? avail : Math.min(avail, nice(avail * f));
return a >= 0.1 ? '<button class="hsb" data-st="draw" data-k="' + a + '">' + (f === 1 ? 'Max ' : '') + esc(H.fm(a)) + '</button>' : '';
}).join('');
h += bo ? '<div class="hsrow">' + bo + '</div>' : '<p class="hmnote">No borrowing room left. Repay some, or raise your limit.</p>';
var rep = Math.min(t.drawn, Math.max(0, c.cash));
if (t.drawn > 0.0001) {
h += '<label class="hmlab">REPAY</label>';
var rb = [0.25, 0.5, 1].map(function (f) {
var a = f === 1 ? rep : Math.min(rep, nice(t.drawn * f));
return a >= 0.1 ? '<button class="hsb" data-st="repay" data-k="' + a + '">' + (f === 1 ? (rep >= t.drawn - 0.0001 ? 'Repay all ' : 'Repay ') : 'Repay ') + esc(H.fm(a)) + '</button>' : '';
}).join('');
h += rb ? '<div class="hsrow">' + rb + '</div>' : '<p class="hmnote">Your club bank is empty, so you cannot repay yet.</p>';
}
h += t.level >= MAXLV ? '<p class="hmnote">Your overdraft limit is at its maximum.</p>' :
'<div class="hsp"><span style="font-size:24px">⬆️</span><div><b>Raise limit by ' + esc(H.fm(stepLimit())) + '</b><small>Level ' + t.level + ' of ' + MAXLV + '</small></div><button class="hsb' + (t.coins >= raiseCost() ? '' : ' dis') + '" data-st="raise">🪙 ' + raiseCost() + '</button></div>';
h += '<div class="hmsec">HOW TO EARN COINS</div><p class="hmnote">Win a match +6, draw +2, loss +1. Cup wins +10. Big bonuses at the end of a good season. Claim your daily reward every day. Coins are earned by playing, and cannot be bought with real money.</p>';
h += '<button class="hmclose" data-st="x">Close</button>';
shut(); ov = document.createElement('div'); ov.className = 'hmbg';
ov.innerHTML = '<div class="hmbox">' + h + '</div>';
document.body.appendChild(ov);
if (keep) ov.firstChild.scrollTop = keep;
}
function changed() { persist(); open(); refreshGame(); }
document.addEventListener('click', function (e) {
var pill = e.target.closest && e.target.closest('#top .cashpill');
if (pill) { e.stopPropagation(); e.stopImmediatePropagation(); open(); return; }
if (ov && e.target === ov) { shut(); return; }
var b = e.target.closest && e.target.closest('[data-st]'); if (!b || !G()) return;
var q = b.dataset.st, k = +b.dataset.k, t = st(), c = club();
if (q === 'x') shut();
else if (q === 'daily') {
if (t.last === today()) return toast('Come back tomorrow for the next reward');
var s = nextStreak(t), a = 10 + 2 * (s - 1);
t.streak = s; t.last = today(); t.coins += a; t.earned = (t.earned || 0) + a;
toast('🎁 +' + a + ' coins. Day ' + s + ' in a row!'); changed();
}
else if (q === 'buy') {
var p = PACKS[k]; if (!p) return;
if (t.coins < p[1]) return toast('Not enough coins. Win matches or claim your daily reward.');
var cash = packCash(k);
t.coins -= p[1]; c.cash = r6(c.cash + cash);
toast('💷 ' + H.fm(cash) + ' added to your club bank'); changed();
}
else if (q === 'draw') {
var a2 = Math.min(k, r6(limit() - t.drawn)); if (!(a2 > 0)) return toast('No borrowing room left');
t.drawn = r6(t.drawn + a2); c.cash = r6(c.cash + a2);
toast('🏦 Borrowed ' + H.fm(a2)); changed();
}
else if (q === 'repay') {
var a3 = Math.min(k, t.drawn, Math.max(0, c.cash)); if (!(a3 > 0)) return toast('Your club bank is empty');
t.drawn = r6(t.drawn - a3); if (t.drawn < 0.0001) t.drawn = 0; c.cash = r6(c.cash - a3);
toast('🏦 Repaid ' + H.fm(a3)); changed();
}
else if (q === 'raise') {
if (t.level >= MAXLV) return;
var cost = raiseCost(); if (t.coins < cost) return toast('Not enough coins');
t.coins -= cost; t.level++;
toast('⬆️ Overdraft limit is now ' + H.fm(limit())); changed();
}
}, true);
var ob = window.__back;
window.__back = function () { if (ov) { shut(); return true; } return ob ? ob() : false; };
if (typeof H.recordResult === 'function') {
var rr = H.recordResult;
H.recordResult = function (g, fx) {
var res = rr.apply(this, arguments);
try { if (res) { var a = res.win ? (fx && fx.comp !== 'lg' ? 10 : 6) : res.draw ? 2 : 1; if (res.prize > 0) a += 10; award(a, res.win ? 'win' : res.draw ? 'draw' : 'match played'); } } catch (e) {}
return res;
};
}
if (typeof H.endSeason === 'function') {
var es = H.endSeason;
H.endSeason = function (g) {
var rv = es.apply(this, arguments);
try {
var a = 15, nm = H.userClub(g).name;
if (rv) {
if (rv.pos === 1) a += 100; else if (rv.pos <= 4) a += 50;
if (rv.lgMet) a += 40; if (rv.cupMet) a += 15; if (rv.ccMet) a += 15;
if (rv.cc && rv.cc === nm) a += 100; if (rv.cupWinner && rv.cupWinner === nm) a += 40;
}
award(a, 'season rewards');
} catch (e) {}
return rv;
};
}
if (typeof H.finishWeek === 'function') {
var fw = H.finishWeek;
H.finishWeek = function (g) {
var r = fw.apply(this, arguments);
try {
var t = st(g);
if (t && t.drawn > 0) {
var i = r6(t.drawn * RATE); H.userClub(g).cash = r6(H.userClub(g).cash - i);
if (g.S.week % 4 === 0) H.news(g, 'The bank charged ' + H.fm(i) + ' interest this week on your ' + H.fm(t.drawn) + ' overdraft.', 'b');
}
} catch (e) {}
return r;
};
}
window.HFCStore = { open: open };
} catch (err) { if (window.console) console.error('HANS FC 3.8 add-on failed', err); }
})();
/* END OF app.js v3.8 */
