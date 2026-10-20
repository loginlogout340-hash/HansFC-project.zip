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
    return '<div class="card r-' + rar(p.o) + '"><div class="ovr">' + ovr + '</div><div class="pos">' + (o.pos || p.pos) + '</div><div class="fl">' + H.flag(p) + '</div><div class="nm">' + esc(last(p.n)) + '</div><div class="sub">' + (p.cl != null ? esc(S.clubs[p.cl].name.slice(0, 14)) : 'Free agent') + '</div>' + (o.pen ? '<div class="pen"></div>' : '') + (dot ? '<i class="dot ' + dot + '"></i>' : '') + '</div>';
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
  function chrome() {
    if (!G) { $('top').style.display = 'none'; $('nav').style.display = 'none'; return; }
    var uc = H.userClub(G);
    $('top').style.display = 'flex'; $('nav').style.display = 'flex';
    $('top').innerHTML = '<div class="crest" style="background:' + uc.col + '">' + esc(uc.name.charAt(0)) + '</div><div class="nm">' + esc(uc.name) + '<small>' + H.yearName(S.year) + ' · ' + (S.stage === 'pre' ? 'Pre-season' : S.stage === 'week' ? 'Week ' + S.week + ' of ' + H.LAST_WEEK : S.stage === 'end' ? 'Season over' : 'Review') + '</small></div><div class="coins">' + fm(uc.cash) + '</div>';
    var T = [['home', '🏠', 'Home'], ['squad', '🧩', 'Squad'], ['comp', '🏆', 'Compete'], ['market', '🔄', 'Market'], ['club', '🏛️', 'Club']];
    $('nav').innerHTML = T.map(function (t) { return '<button data-act="tab" data-v="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"><b>' + t[1] + '</b>' + t[2] + '</button>'; }).join('');
  }
  function render() {
    chrome();
    var el = $('screen'), keep = el.scrollTop;
    if (!G) { el.innerHTML = viewIntro(); return; }
    var v = { home: viewHome, squad: viewSquad, comp: viewComp, market: viewMarket, club: viewClub }[tab];
    el.innerHTML = v();
    el.scrollTop = keep;
  }

  /* ---------- intro: pick a league and a club ---------- */
  var intro = { lg: 'epl', name: '', sel: null };
  function viewIntro() {
    var clubs = S_world().filter(function (c) { return c.lg === intro.lg; }).sort(function (a, b) { return b.rep - a.rep; });
    return '<div class="hero"><div class="crest" style="background:#1d6fb8">H</div><h2 style="font-size:26px;margin:0">HANS FC 2.0</h2><p class="mut">Pick any club. Run it your way. Seasons, transfers, cups and glory.</p></div>' +
      '<div class="panel"><h3 style="margin-top:0">Your name</h3><input id="mn" type="text" maxlength="22" placeholder="e.g. Theophilus Hanson" value="' + esc(intro.name) + '">' +
      '<h3>Choose a league</h3><div class="tabs2">' + H.LEAGUES.map(function (l) { return '<button data-act="ilg" data-v="' + l.id + '" class="' + (intro.lg === l.id ? 'on' : '') + '">' + l.flag + ' ' + l.name + '</button>'; }).join('') + '</div>' +
      '<h3>Choose your club</h3>' + clubs.map(function (c) {
        return '<div class="clubrow ' + (intro.sel === c.id ? 'on' : '') + '" data-act="iclub" data-v="' + c.id + '"><div class="cr" style="background:' + c.col + ';color:' + (c.col === '#f2f2f2' || c.col === '#d9d9d9' || c.col === '#e6e6e6' || c.col === '#e8e8e8' ? '#222' : '#fff') + '">' + esc(c.name.charAt(0)) + '</div><div class="sp"><b>' + esc(c.name) + '</b><div class="mut" style="font-size:12px">' + H.tierName(c) + ' · stadium ' + c.cap + 'K</div></div><div class="mut" style="font-size:12px">' + (intro.sel === c.id ? '✔' : '') + '</div></div>';
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
  function viewHome() {
    var uc = H.userClub(G), h = '';
    if (S.stage === 'pre') h += homePre(uc);
    else if (S.stage === 'week') h += homeWeek(uc);
    else if (S.stage === 'end') h += '<div class="panel c"><h2>The season is over</h2><p class="mut">All 40 weeks are played.</p><button class="btn full" data-act="endseason">See the season review</button></div>';
    else h += '<div class="panel c"><h2>Season review</h2><button class="btn full" data-act="review">Open review</button></div>';
    h += boardPanel(uc) + injuredPanel();
    var nw = S.news.slice(0, 8).map(function (n) { return '<div class="news ' + n.k + '">' + (n.w ? '<b>W' + n.w + '</b> ' : '') + esc(n.t) + '</div>'; }).join('');
    h += '<h3>News</h3><div class="panel" style="padding:4px 12px">' + (nw || '<div class="mut">No news yet.</div>') + '</div>';
    return h;
  }
  function homePre(uc) {
    var offers = S.sponsorOffers && S.sponsorOffers.length ? '<h3>Choose a shirt sponsor</h3>' + S.sponsorOffers.map(function (o, i) {
      return '<div class="mp"><div class="row"><div class="sp"><b>' + esc(o.name) + '</b> <span class="pill">' + o.label + '</span><div class="mut" style="font-size:12px">' + o.desc + '</div><div style="font-size:13px;margin-top:3px">Sponsor income x' + o.mult.toFixed(2) + (o.bonus ? ' · bonus ' + fm(o.bonus) : '') + '</div></div><button class="btn sm" data-act="spons" data-v="' + i + '">Sign</button></div></div>';
    }).join('') : (S.sponsor ? '<div class="mut" style="font-size:13px">Sponsor: <b>' + esc(S.sponsor.name) + '</b> (' + S.sponsor.label.toLowerCase() + ')</div>' : '');
    return '<div class="panel"><div class="mut" style="font-size:12px">PRE-SEASON · ' + H.yearName(S.year).toUpperCase() + '</div><h2 style="margin:6px 0">Welcome, ' + esc(S.mgr.name) + '</h2>' +
      '<div class="kv"><span>League</span><b>' + H.lgOf(uc.lg).name + '</b></div><div class="kv"><span>Board objective</span><b>' + esc(S.obj.text) + '</b></div><div class="kv"><span>Cup</span><b>' + esc(S.obj.cupText) + '</b></div>' + (S.obj.ccText ? '<div class="kv"><span>Champions Cup</span><b>' + esc(S.obj.ccText) + '</b></div>' : '') +
      '<div class="kv"><span>Squad rating</span><b>' + H.userEval(G).vector.rating + '</b></div><div class="kv"><span>Transfer window</span><b style="color:var(--acc)">Open</b></div></div>' + offers +
      '<button class="btn full" data-act="startseason">▶ Start the season</button><p class="mut" style="font-size:12px;margin-top:6px">Use Squad, Market and Club to prepare first. The transfer window is open now, in weeks 1-4 and in weeks 20-24.</p>';
  }
  function homeWeek(uc) {
    var pend = H.pending(G), win = H.windowOpen(G);
    var h = '<div class="panel"><div class="row"><div class="sp"><div class="mut" style="font-size:12px">WEEK ' + S.week + ' OF ' + H.LAST_WEEK + '</div><b style="font-size:17px">' + (pend.length ? 'Match day' : 'No match this week') + '</b></div><span class="pill ' + (win ? 'ok' : '') + '">' + (win ? 'Window open' : 'Window closed') + '</span></div></div>';
    pend.forEach(function (fx, i) {
      var home = fx.h === S.uid, opp = S.clubs[home ? fx.a : fx.h];
      h += '<div class="panel"><div class="mut" style="font-size:12px">' + esc(fx.name.toUpperCase()) + '</div><div class="row" style="margin:10px 0"><div class="sp c"><b>' + esc(S.clubs[fx.h].name) + '</b><div class="mut">' + (home ? 'Home' : '') + '</div></div><div class="mut">vs</div><div class="sp c"><b>' + esc(S.clubs[fx.a].name) + '</b><div class="mut">' + (!home ? 'Home' : '') + '</div></div></div>' +
        '<div class="mut c" style="font-size:12px;margin-bottom:8px">Your rating ' + Math.round(uc.str) + ' · ' + esc(opp.name) + ' ' + Math.round(opp.str) + '</div>' +
        '<div class="grid2"><button class="btn" data-act="play" data-v="' + i + '">▶ Play match</button><button class="btn ghost" data-act="simm" data-v="' + i + '">⏩ Sim result</button></div></div>';
    });
    if (!pend.length) {
      var nextFx = nextUserFixture();
      h += '<div class="panel c">' + (nextFx ? '<div class="mut" style="font-size:13px;margin-bottom:8px">Next: ' + esc(nextFx) + '</div>' : '') + '<button class="btn full" data-act="advance">Advance to next week ⏭</button></div>';
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
  function boardPanel(uc) {
    var c = Math.round(S.board.conf);
    var pos = H.position(G, uc.lg, uc.id);
    return '<div class="panel"><div class="row"><b class="sp">Board confidence</b><b>' + c + '%</b></div><div class="bigbar" style="margin:6px 0"><i style="width:' + c + '%"></i></div><div class="mut" style="font-size:12px">' + esc(S.obj.text) + ' · you are ' + ord(pos) + '</div>' + (c < 25 ? '<div class="warn bad2" style="margin-top:8px">The board is close to sacking you. Win some games!</div>' : '') + '</div>';
  }
  function injuredPanel() {
    var bad = H.userCards(G).filter(function (p) { return p.inj || p.sus; });
    if (!bad.length) return '';
    return '<div class="panel"><b>Unavailable (' + bad.length + ')</b>' + bad.slice(0, 6).map(function (p) { return '<div class="kv"><span>' + esc(p.n) + ' <span class="mut">' + p.pos + '</span></span><span>' + (p.inj ? '🤕 ' + p.inj + 'w' : '🟥 ' + p.sus + 'w') + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------- squad ---------- */
  var sqMode = 'pitch', sqSort = 'ovr';
  function viewSquad() {
    var e = H.userEval(G), uc = H.userClub(G);
    var head = '<div class="row" style="margin-bottom:10px"><div class="sp"><b style="font-size:20px">' + e.vector.rating + '</b> <span class="mut">rating</span> &nbsp; <b style="font-size:20px">' + e.chemistry + '%</b> <span class="mut">chemistry</span></div><button class="btn sm ghost" data-act="auto">Auto pick</button></div>' +
      '<div class="tabs2"><button data-act="sqm" data-v="pitch" class="' + (sqMode === 'pitch' ? 'on' : '') + '">Lineup</button><button data-act="sqm" data-v="list" class="' + (sqMode === 'list' ? 'on' : '') + '">Players (' + H.userCards(G).length + ')</button><button data-act="sqm" data-v="tac" class="' + (sqMode === 'tac' ? 'on' : '') + '">Tactics</button></div>';
    if (sqMode === 'list') return head + squadList();
    if (sqMode === 'tac') return head + tacticsView();
    var f = H.FORMATIONS[S.formation];
    var slots = f.map(function (s, i) {
      var r = e.rows[i], c = r.card, chem = '';
      if (c) chem = '<div class="chem">' + [1, 2, 3].map(function (k) { return '<i class="' + (r.chem >= k ? 'on' : '') + '"></i>'; }).join('') + '</div>';
      return '<div class="slot" data-act="slot" data-v="' + i + '" style="left:' + s[1] + '%;top:' + s[2] + '%">' + cardHTML(c, { ovr: c ? r.eff : '', pos: s[0], pen: c && r.pen > 0 }) + chem + '</div>';
    }).join('');
    var bench = S.bench.map(function (id, i) { return '<div data-act="bslot" data-v="' + i + '">' + cardHTML(G.P[id]) + '</div>'; }).join('');
    for (var k = S.bench.length; k < 9; k++) bench += '<div data-act="bslot" data-v="' + k + '">' + cardHTML(null, { pos: 'SUB' }) + '</div>';
    return head + '<div class="seg" style="overflow-x:auto">' + Object.keys(H.FORMATIONS).map(function (k) { return '<button data-act="form" data-v="' + k + '" class="' + (k === S.formation ? 'on' : '') + '" style="min-width:64px">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="pitch">' + slots + '</div><h3>Substitutes (5 can come on)</h3><div class="bench">' + bench + '</div>' +
      '<p class="mut" style="font-size:12px">Red border = out of position. Dots under a card = team spirit from neighbours of the same nation. Red dot = injured, amber = tired, black = banned. Rating counts fitness and morale.</p>';
  }
  function tacticsView() {
    var seg = function (key, arr, label) { return '<div class="mut" style="font-size:12px;margin:8px 0 3px">' + label + '</div><div class="seg">' + arr.map(function (v) { return '<button data-act="tac" data-k="' + key + '" data-v="' + v + '" class="' + (S[key] === v ? 'on' : '') + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '</div>'; };
    var tr = ['Light', 'Normal', 'Intense'];
    return '<div class="panel">' + seg('mentality', H.MENTALITY, 'Mentality') + seg('style', H.STYLE, 'Style of play') + seg('press', H.PRESS, 'Pressing (high press tires the team late on)') +
      '<div class="mut" style="font-size:12px;margin:8px 0 3px">Training intensity</div><div class="seg">' + tr.map(function (t, i) { return '<button data-act="trn" data-v="' + (i + 1) + '" class="' + (S.train === i + 1 ? 'on' : '') + '">' + t + '</button>'; }).join('') + '</div>' +
      '<p class="mut" style="font-size:12px">Intense training grows young players faster but tires everyone and raises injury risk. Light training keeps the squad fresh.</p></div>';
  }
  function squadList() {
    var list = H.userCards(G).slice().sort(function (a, b) { return sqSort === 'ovr' ? b.o - a.o : sqSort === 'age' ? a.a - b.a : sqSort === 'pot' ? b.p - a.p : sqSort === 'val' ? b.v - a.v : (H.GROUP[a.pos] < H.GROUP[b.pos] ? -1 : 1) || b.o - a.o; });
    return '<div class="tabs2">' + [['ovr', 'Rating'], ['pos', 'Position'], ['age', 'Age'], ['pot', 'Potential'], ['val', 'Value']].map(function (x) { return '<button data-act="srt" data-v="' + x[0] + '" class="' + (sqSort === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      list.map(function (p) { var inXI = S.slots.indexOf(p.id) >= 0; return playerRow(p, inXI ? 'XI' : (S.bench.indexOf(p.id) >= 0 ? 'Sub' : '-')); }).join('');
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
    var html = '<div class="row" style="align-items:flex-start;gap:14px">' + cardHTML(p) + '<div class="sp"><h2 style="margin:0">' + esc(p.n) + '</h2><div class="mut">' + p.pos + ' · ' + H.flag(p) + ' ' + esc(p.nat) + '<br>' + (p.cl != null ? esc(S.clubs[p.cl].name) : 'Free agent') + ' · age ' + p.a + '</div>' + statusPill(p) + (p.lst ? '<span class="pill warn">Transfer listed</span>' : '') + '</div></div>' +
      '<div class="grid2" style="margin:12px 0">' + st.map(function (v, i) { return '<div class="stat"><b>' + v + '</b><span>' + labels[i] + '</span></div>'; }).join('') + '</div>' +
      '<div class="panel"><div class="kv"><span>Rating / potential</span><b>' + p.o + ' / ' + p.p + '</b></div><div class="kv"><span>Market value</span><b>' + fm(p.v) + '</b></div><div class="kv"><span>Wage</span><b>' + fm(p.w) + ' / week</b></div><div class="kv"><span>Contract</span><b>' + (p.cl == null ? '-' : p.ct + ' season' + (p.ct === 1 ? '' : 's')) + '</b></div>' +
      (mine ? '<div class="kv"><span>Fitness · Morale</span><b>' + p.ft + '% · ' + p.mo + '</b></div>' : '') +
      '<div class="kv"><span>This season</span><b>' + p.ap + ' apps · ' + p.g + ' goals · ' + p.as + ' assists</b></div>' + (p.rn ? '<div class="kv"><span>Average rating</span><b>' + (p.rs / p.rn).toFixed(1) + '</b></div>' : '') + '</div>';
    if (mine) {
      html += (offer ? '<div class="warn">' + esc(cname(offer.from)) + ' offer ' + fm(offer.fee) + '.</div><div class="grid2"><button class="btn" data-x="accept">Accept offer</button><button class="btn ghost" data-x="decline">Decline</button></div>' : '') +
        '<div class="grid2" style="margin-top:8px"><button class="btn" data-x="renew">Renew contract</button><button class="btn ghost" data-x="list">' + (p.lst ? 'Remove from list' : 'Transfer list') + '</button></div>' +
        '<div class="grid2" style="margin-top:8px"><button class="btn ghost" data-x="rename">Rename</button><button class="btn red" data-x="release">Release</button></div>';
    } else {
      html += '<button class="btn full" data-x="bid">' + (p.cl == null ? 'Sign free agent' : 'Make an offer') + '</button><button class="btn ghost full" style="margin-top:8px" data-x="rename">Rename player</button>';
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
      else if (x === 'rename') { closeLayer(); renameSheet('player', p); }
    });
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
  var mk = { q: '', pos: 'all', lg: 'all', fa: false, sort: 'ovr', young: false, sec: 'search' };
  function viewMarket() {
    var win = H.windowOpen(G);
    var head = '<div class="row"><h2 class="sp">Transfers</h2><span class="pill ' + (win ? 'ok' : 'bad') + '">' + (win ? 'Window open' : 'Window closed') + '</span></div>' +
      '<div class="tabs2"><button data-act="msec" data-v="search" class="' + (mk.sec === 'search' ? 'on' : '') + '">Search</button><button data-act="msec" data-v="offers" class="' + (mk.sec === 'offers' ? 'on' : '') + '">Offers (' + S.offers.length + ')</button></div>';
    if (mk.sec === 'offers') {
      if (!S.offers.length) return head + '<div class="panel mut">No offers right now. Put a player on the transfer list and clubs will come.</div>';
      return head + S.offers.map(function (o) { var p = G.P[o.pid]; return p ? '<div class="panel"><div class="mut" style="font-size:12px">' + esc(cname(o.from)) + ' offer ' + fm(o.fee) + '</div>' + playerRow(p, fm(o.fee), 'pl') + '</div>' : ''; }).join('');
    }
    var res = H.searchPlayers(G, { q: mk.q, pos: mk.pos, lg: mk.lg, fa: mk.fa, sort: mk.sort, maxA: mk.young ? 21 : null, limit: 40 });
    return head + '<input id="mq" type="text" placeholder="Search player or club" value="' + esc(mk.q) + '">' +
      '<div class="tabs2" style="margin-top:8px">' + [['all', 'All'], ['G', 'GK'], ['D', 'DEF'], ['M', 'MID'], ['A', 'ATT']].map(function (x) { return '<button data-act="mpos" data-v="' + x[0] + '" class="' + (mk.pos === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tabs2"><button data-act="mlg" data-v="all" class="' + (mk.lg === 'all' ? 'on' : '') + '">All leagues</button>' + H.LEAGUES.map(function (l) { return '<button data-act="mlg" data-v="' + l.id + '" class="' + (mk.lg === l.id ? 'on' : '') + '">' + l.flag + '</button>'; }).join('') + '</div>' +
      '<div class="tabs2"><button data-act="mfa" class="' + (mk.fa ? 'on' : '') + '">Free agents</button><button data-act="myoung" class="' + (mk.young ? 'on' : '') + '">Under 22</button>' + [['ovr', 'Rating'], ['pot', 'Potential'], ['val', 'Value']].map(function (x) { return '<button data-act="msort" data-v="' + x[0] + '" class="' + (mk.sort === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (res.length ? res.map(function (p) { return playerRow(p); }).join('') : '<div class="panel mut">No players match.</div>');
  }
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
      var z = i < 4 && cp.lg !== 'gpl' ? ' style="box-shadow:inset 3px 0 #37d67a"' : i >= n - 3 ? ' style="box-shadow:inset 3px 0 #ff5c5c"' : '';
      return '<tr class="' + (r.user ? 'me' : '') + '"' + z + '><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + r.p + '</td><td>' + r.w + '-' + r.d + '-' + r.l + '</td><td>' + (r.gf - r.ga) + '</td><td><b>' + r.pts + '</b></td></tr>';
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

  /* ---------- club ---------- */
  var cb = { sec: 'fin' };
  function viewClub() {
    var head = '<div class="tabs2">' + [['fin', 'Finances'], ['fac', 'Stadium & facilities'], ['board', 'Board'], ['youth', 'Staff & more']].map(function (x) { return '<button data-act="cbs" data-v="' + x[0] + '" class="' + (cb.sec === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var uc = H.userClub(G);
    if (cb.sec === 'fac') return head + facView(uc);
    if (cb.sec === 'board') return head + boardView(uc);
    if (cb.sec === 'youth') return head + moreView(uc);
    var inc = H.weeklyIncome(G, uc), wages = H.wageBill(G, uc.id), up = H.upkeep(uc), t = S.tot;
    var fin = S.fin.slice(0, 6).map(function (f) { return '<div class="kv"><span>Week ' + f.w + '</span><b style="color:' + (f.inc - f.exp >= 0 ? 'var(--acc)' : 'var(--bad)') + '">' + fm(f.inc - f.exp) + '</b></div>'; }).join('');
    return head + '<div class="panel"><div class="row"><b class="sp">Bank balance</b><b style="font-size:22px;color:' + (uc.cash >= 0 ? 'var(--acc2)' : 'var(--bad)') + '">' + fm(uc.cash) + '</b></div></div>' +
      '<div class="panel"><b>Every week</b><div class="kv"><span>TV money</span><b>+' + fm(inc.tv) + '</b></div><div class="kv"><span>Sponsors</span><b>+' + fm(inc.spons) + '</b></div><div class="kv"><span>Merchandise</span><b>+' + fm(inc.comm) + '</b></div><div class="kv"><span>Gate income</span><b>on home match days</b></div><div class="kv"><span>Player wages</span><b>-' + fm(wages) + '</b></div><div class="kv"><span>Running costs</span><b>-' + fm(up) + '</b></div></div>' +
      '<div class="panel"><b>This season so far</b><div class="kv"><span>Gate</span><b>' + fm(t.inc.gate) + '</b></div><div class="kv"><span>TV, sponsors, shop</span><b>' + fm(t.inc.tv + t.inc.spons + t.inc.comm) + '</b></div><div class="kv"><span>Prizes</span><b>' + fm(t.inc.prize) + '</b></div><div class="kv"><span>Player sales</span><b>' + fm(t.inc.sales) + '</b></div><div class="kv"><span>Wages paid</span><b>-' + fm(t.exp.wages) + '</b></div><div class="kv"><span>Signings</span><b>-' + fm(t.exp.buys) + '</b></div><div class="kv"><span>Building work</span><b>-' + fm(t.exp.build) + '</b></div></div>' +
      '<div class="panel"><b>Recent weeks</b>' + (fin || '<div class="mut">No data yet.</div>') + '</div>';
  }
  function facView(uc) {
    var cap = Math.round(H.stadiumCap(uc) * 10) / 10, att = Math.round(H.attendance(G, uc) * 100);
    var h = '<div class="panel"><b>🏟️ ' + esc(uc.name) + ' stadium</b><div class="kv"><span>Capacity</span><b>' + (cap * 1000).toLocaleString('en-US') + '</b></div><div class="kv"><span>Typical attendance</span><b>' + att + '%</b></div><div class="kv"><span>Ticket price</span><b>€' + Math.round(H.ticketPrice(uc)) + '</b></div></div>';
    H.FAC.forEach(function (f, i) {
      var job = S.build.filter(function (b) { return b.i === i; })[0], cost = H.facCost(uc, i);
      h += '<div class="panel"><div class="row"><b class="sp">' + f.icon + ' ' + f.name + '</b><b>Level ' + uc.fac[i] + '</b></div>' + LV(uc.fac[i]) + '<div class="mut" style="font-size:12px;margin-bottom:8px">' + f.desc + '</div>' +
        (job ? '<div class="pill warn">Building… ' + job.wk + ' weeks left</div>' : uc.fac[i] >= 10 ? '<div class="pill ok">Maximum level</div>' : '<button class="btn sm" data-act="upg" data-v="' + i + '"' + (uc.cash < cost ? ' disabled' : '') + '>Upgrade to ' + (uc.fac[i] + 1) + ' · ' + fm(cost) + ' · ' + H.facWeeks(uc, i) + ' weeks</button>') + '</div>';
    });
    return h + '<p class="mut" style="font-size:12px">Upgrades raise weekly running costs a little, but pay back through gates, shop sales, better youth and faster recovery.</p>';
  }
  function boardView(uc) {
    var c = Math.round(S.board.conf), pos = H.position(G, uc.lg, uc.id);
    return '<div class="panel"><div class="row"><b class="sp">Board confidence</b><b>' + c + '%</b></div><div class="bigbar" style="margin:6px 0"><i style="width:' + c + '%"></i></div></div>' +
      '<div class="panel"><b>Objectives for ' + H.yearName(S.year) + '</b><div class="kv"><span>League</span><b>' + esc(S.obj.text) + '</b></div><div class="kv"><span>Cup</span><b>' + esc(S.obj.cupText) + '</b></div>' + (S.obj.ccText ? '<div class="kv"><span>Champions Cup</span><b>' + esc(S.obj.ccText) + '</b></div>' : '') + '<div class="kv"><span>Now</span><b>' + ord(pos) + ' in the league</b></div></div>' +
      '<div class="panel"><b>You</b><div class="kv"><span>Manager</span><b>' + esc(S.mgr.name) + '</b></div><div class="kv"><span>Reputation</span><b>' + Math.round(S.mgr.rep) + '</b></div><div class="kv"><span>Titles won</span><b>' + S.champions.length + '</b></div><div class="kv"><span>Club</span><b>' + esc(uc.name) + ' (' + H.tierName(uc) + ')</b></div></div>';
  }
  function moreView(uc) {
    var sp = S.sponsor ? '<div class="kv"><span>Shirt sponsor</span><b>' + esc(S.sponsor.name) + '</b></div><div class="kv"><span>Deal</span><b>' + esc(S.sponsor.label) + ' x' + S.sponsor.mult.toFixed(2) + '</b></div>' : '<div class="mut">No sponsor this season.</div>';
    var yth = H.userCards(G).filter(function (p) { return p.a <= 21; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 8);
    return '<div class="panel"><b>Sponsor</b>' + sp + '</div><h3>Young talents</h3>' + (yth.length ? yth.map(function (p) { return playerRow(p, p.o + ' → ' + p.p); }).join('') : '<div class="panel mut">No players under 22.</div>') +
      '<h3>Game</h3><div class="grid2"><button class="btn ghost" data-act="renclub">Rename my club</button><button class="btn ghost" data-act="saveb">Save now</button></div><button class="btn red full" style="margin-top:8px" data-act="reset">Delete career and start over</button>' +
      '<p class="mut" style="font-size:12px;margin-top:8px">HANS FC 2.0. Real names, my own estimated ratings (around the 2025/26 season). No badges or photos. Anything out of date can be fixed with Rename.</p>';
  }

  /* ---------- the live match ---------- */
  function playMatch(fx) {
    var B = H.buildMatch(G, fx), m = B.m, speed = 1, done = false, talked = false;
    var hx = '<div class="sb"><div class="clock" id="mclk">KICK OFF</div><div class="teams"><div class="tm"><i style="background:' + m.home.color + '"></i>' + esc(m.home.name) + '</div><div class="sc" id="msc">0 - 0</div><div class="tm"><i style="background:' + m.away.color + '"></i>' + esc(m.away.name) + '</div></div><div class="scorers"><div id="gh"></div><div id="ga"></div></div></div>' +
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
    h += (rv.offers || []).map(function (id) { var c = S.clubs[id]; return '<div class="clubrow" data-m="job" data-id="' + id + '"><div class="cr" style="background:' + c.col + '">' + esc(c.name.charAt(0)) + '</div><div class="sp"><b>' + esc(c.name) + '</b><div class="mut" style="font-size:12px">' + H.lgOf(c.lg).name + ' · ' + H.tierName(c) + '</div></div><button class="btn sm">Join</button></div>'; }).join('');
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
    var t = e.target.closest('#screen [data-act], #nav [data-act]'); if (!t) return;
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
    else if (a === 'upg') { var er = H.startBuild(G, +v); if (er) return toast(er); save(); render(); toast('Building work has started'); }
    else if (a === 'renclub') renameSheet('club', H.userClub(G));
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
})();
