/* HANS FC 2.0 - generated club crests and player faces. All drawn by code, so they are original artwork: no real badges or photos.
   A club or player can also get a custom picture from the phone gallery (stored in c.img / p.img). */
(function () {
  var H = window.HFC, uid = 0;
  var hx = function (c) { return parseInt(c.slice(1), 16); };
  function lum(c) { var n = hx(c), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
  function mix(a, b, t) { var x = hx(a), y = hx(b), f = function (s) { return Math.round(((x >> s & 255) * (1 - t) + (y >> s & 255) * t)); }; return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1); }
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function initials(n) {
    var w = n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
    if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
    var skip = { FC: 1, SC: 1, CF: 1, AC: 1, UNITED: 0 };
    var w2 = w.filter(function (x) { return !skip[x.toUpperCase()]; });
    if (!w2.length) w2 = w;
    return (w2[0][0] + (w2[1] ? w2[1][0] : w2[0][1] || '')).toUpperCase();
  }
  /* c: {id, name, col, img?} */
  H.crest = function (c, size) {
    size = size || 34;
    if (c.img) return '<img src="' + c.img + '" width="' + size + '" height="' + size + '" style="border-radius:50%;object-fit:cover;display:block" alt="">';
    var h = H.hash((c.id | 0) * 977 + 13), shape = h % 3, pat = (h >> 3) % 6, col = c.col || '#1d6fb8';
    var sec = lum(col) > 0.62 ? '#17233a' : '#ffffff', acc = lum(col) > 0.62 ? mix(col, '#17233a', 0.45) : mix(col, '#ffffff', 0.5);
    var id = 'cr' + (++uid), body;
    if (shape === 0) body = 'M8 6H92V56C92 82 68 97 50 104C32 97 8 82 8 56Z';
    else if (shape === 1) body = 'M50 4C74 4 94 18 94 48C94 78 74 98 50 106C26 98 6 78 6 48C6 18 26 4 50 4Z';
    else body = 'M10 4H90L90 60C90 80 70 94 50 106C30 94 10 80 10 60Z';
    var p = '';
    if (pat === 1) p = '<rect x="30" y="0" width="14" height="120" fill="' + sec + '" opacity=".9"/><rect x="56" y="0" width="14" height="120" fill="' + sec + '" opacity=".9"/>';
    else if (pat === 2) p = '<rect x="0" y="40" width="100" height="26" fill="' + sec + '" opacity=".9"/>';
    else if (pat === 3) p = '<rect x="50" y="0" width="60" height="120" fill="' + acc + '"/>';
    else if (pat === 4) p = '<path d="M0 0L100 80V120H0Z" fill="' + acc + '"/>';
    else if (pat === 5) p = '<rect x="0" y="0" width="100" height="30" fill="' + acc + '"/>';
    var txt = lum(col) > 0.62 ? '#17233a' : '#fff', bgInit = pat === 2 ? sec : 'none';
    var ty = pat === 5 ? 76 : 70;
    var ini = esc(initials(c.name || '?'));
    var star = '<path d="M50 14l3 8h8l-6.5 5 2.5 8L50 31l-7 4 2.5-8L39 22h8z" fill="' + sec + '" transform="translate(0,-3) scale(1)" opacity=".95"/>';
    return '<svg width="' + size + '" height="' + (size * 1.08).toFixed(0) + '" viewBox="0 0 100 110" style="display:block;flex:none"><defs><clipPath id="' + id + '"><path d="' + body + '"/></clipPath></defs><g clip-path="url(#' + id + ')"><rect width="100" height="120" fill="' + col + '"/>' + p + '</g><path d="' + body + '" fill="none" stroke="' + sec + '" stroke-width="5"/>' + (pat === 2 ? '<rect x="22" y="42" width="56" height="22" rx="4" fill="' + col + '"/>' : '') + '<text x="50" y="' + (pat === 2 ? 59 : ty) + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="' + (ini.length > 1 ? 34 : 40) + '" fill="' + (pat === 2 ? (lum(col) > 0.62 ? '#17233a' : '#fff') : txt) + '" stroke="' + (pat === 2 ? 'none' : (lum(col) > 0.62 ? '#fff6' : '#0006')) + '" stroke-width="2" paint-order="stroke">' + ini + '</text>' + (pat === 2 ? '' : star.replace('translate(0,-3)', 'translate(0,2)')) + '</svg>';
  };
  var SKIN = { wa: ['#5a3825', '#6b4423', '#7a4a2b', '#4a2f1d'], af: ['#5a3825', '#6b4423', '#8d5524', '#4a2f1d'], na: ['#c68642', '#a9713a', '#d9a066', '#b87a45'], la: ['#c68642', '#e0ac69', '#8d5524', '#f1c27d', '#a9713a'], eu: ['#f1c27d', '#ffdbac', '#e0ac69', '#f5d0b0'], uk: ['#f1c27d', '#ffdbac', '#e8b88a', '#f5d0b0', '#8d5524'], as: ['#f1c27d', '#e8c39e', '#f0cfa5'] };
  var HAIR_L = ['#161616', '#2b1a10', '#4a2e1a', '#8a5a2b', '#c9a24b', '#a14a22'];
  /* p: {id, n, nat, a, o, cl, img?}; kit: club colour */
  H.face = function (p, size, kit) {
    size = size || 40;
    if (p.img) return '<img src="' + p.img + '" width="' + size + '" height="' + size + '" style="border-radius:50%;object-fit:cover;display:block" alt="">';
    var h = H.hash((p.id | 0) * 7919 + 5), reg = (H.NAT[p.nat] || [0, 'eu'])[1], sk = SKIN[reg] || SKIN.eu;
    var skin = sk[h % sk.length], dark = lum(skin) < 0.42, hair = dark ? (h % 7 === 0 ? '#2b1a10' : '#141414') : HAIR_L[(h >> 4) % HAIR_L.length];
    var style = (h >> 8) % 6, beard = (h >> 12) % 5 === 0 && p.a >= 22, k = kit || '#556070';
    var kit2 = lum(k) > 0.7 ? '#17233a' : '#fff';
    var o = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" style="display:block;flex:none"><rect width="100" height="100" fill="#0000"/>';
    o += '<path d="M8 100C8 76 28 68 50 68C72 68 92 76 92 100Z" fill="' + k + '"/><path d="M38 68L50 82L62 68Z" fill="' + kit2 + '" opacity=".9"/>';
    o += '<rect x="42" y="56" width="16" height="16" rx="6" fill="' + mix(skin, '#000000', 0.18) + '"/>';
    if (style === 4 && lum(hair) > 0) o += '<ellipse cx="50" cy="26" rx="25" ry="16" fill="' + hair + '"/>'; // afro or big hair behind
    o += '<ellipse cx="50" cy="42" rx="23" ry="27" fill="' + skin + '"/>';
    if (style === 0) o += '<path d="M27 38C27 18 40 12 50 12C62 12 73 20 73 38C68 28 60 24 50 24C40 24 32 28 27 38Z" fill="' + hair + '"/>';
    else if (style === 1) o += '<path d="M26 40C24 20 38 10 50 10C64 10 76 20 74 40C70 30 64 20 50 20C38 20 30 30 26 40Z" fill="' + hair + '"/>';
    else if (style === 2) o += '<path d="M28 34C30 20 40 16 50 16C60 16 70 20 72 34C66 28 58 27 50 27C42 27 34 28 28 34Z" fill="' + hair + '" opacity=".95"/>';
    else if (style === 3) o += '<path d="M26 42C22 20 36 8 50 8C66 8 78 20 74 42C72 30 66 24 50 24C36 24 28 30 26 42Z" fill="' + hair + '"/><circle cx="50" cy="8" r="6" fill="' + hair + '"/>';
    else if (style === 4) o += '<path d="M27 36C28 22 38 16 50 16C62 16 72 22 73 36C66 26 58 24 50 24C42 24 34 26 27 36Z" fill="' + hair + '"/>';
    else o += '<path d="M31 30C34 22 42 20 50 20C58 20 66 22 69 30C62 25 38 25 31 30Z" fill="' + mix(skin, '#000000', 0.45) + '" opacity=".6"/>';
    if (beard) o += '<path d="M29 46C30 66 40 72 50 72C60 72 70 66 71 46C66 58 58 58 50 58C42 58 34 58 29 46Z" fill="' + hair + '" opacity=".9"/>';
    o += '<circle cx="41" cy="42" r="2.6" fill="#1b1b1b"/><circle cx="59" cy="42" r="2.6" fill="#1b1b1b"/><path d="M43 55Q50 60 57 55" stroke="' + mix(skin, '#000000', 0.45) + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
    return o;
  };
})();
