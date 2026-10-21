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
        var head = '<div class="fch"><div><div class="fcb u">' + ue.vector.rating + '</div><div class="fcn">' + esc(uc.name) + '</div></div><div class="fcm">' + bar('DEFENCE', ug.def, og.def) + bar('MIDFIELD', ug.mid, og.mid) + bar('ATTACK', ug.att, og.att) + '</div><div><div class="fcb o">' + Math.round(oc.str) + '</div><div class="fcn">' + esc(oc.name) + '</div></div></div>';
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
