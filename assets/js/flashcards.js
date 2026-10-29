/* Flashcards with spaced repetition (SM-2 style intervals). State lives in localStorage under rax.v1.srs */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, V = window.RAX_VOCAB, DK = window.RAX_DECKS || {};
  var DAY = 86400000, MIN = 60000;
  var deckSel = $('#fc-deck'), dirSel = $('#fc-dir'), newSel = $('#fc-new'), stats = $('#fc-stats');
  var card = $('#fc-card'), front = $('#fc-front'), sayEl = $('#fc-say'), back = $('#fc-back'), corner = $('#fc-corner');
  var grades = $('#fc-grades'), flipBtn = $('#fc-flip');
  var srs = R.store.get('srs', {});
  var deck = [], queue = [], cur = null, flipped = false;

  function vocabCard(w) { return { id: 'w' + w.i, de: w.de, pr: w.pr, en: w.en, a: w.a }; }
  function buildDeck(name) {
    if (name === 'phrases') return (DK.phrases || []).map(function (p, i) { return { id: 'p' + i, de: p.de, pr: p.pr, en: p.en }; });
    if (name === 'verbs') return (DK.verbs || []).map(function (p, i) { return { id: 'v' + i, de: p.de, pr: p.pr, en: p.en, extra: p.pres + ' · ' + p.perf }; });
    if (!V) return [];
    var ws = V.words;
    if (name === 'core') ws = ws.filter(function (w) { return w.k; });
    else if (name === 'a1') ws = ws.filter(function (w) { return w.lv === 'A1'; });
    else if (name === 'a2') ws = ws.filter(function (w) { return w.lv === 'A2'; });
    else if (/^topic-\d+$/.test(name)) { var t = +name.split('-')[1]; ws = ws.filter(function (w) { return w.t === t; }); }
    return ws.map(vocabCard);
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function newToday() { var n = R.store.get('srsNew', {}); return n.day === today() ? n.count : 0; }
  function bumpNew() { var c = newToday() + 1; R.store.set('srsNew', { day: today(), count: c }); }
  function buildQueue() {
    var now = Date.now();
    var due = deck.filter(function (c) { return srs[c.id] && srs[c.id].due <= now; }).sort(function (a, b) { return srs[a.id].due - srs[b.id].due; });
    var limit = Math.max(0, (+newSel.value) - newToday());
    var fresh = deck.filter(function (c) { return !srs[c.id]; }).slice(0, limit);
    queue = due.concat(fresh);
  }
  function drawStats() {
    var now = Date.now(), seen = deck.filter(function (c) { return srs[c.id]; }).length;
    var due = deck.filter(function (c) { return srs[c.id] && srs[c.id].due <= now; }).length;
    var learned = deck.filter(function (c) { return srs[c.id] && srs[c.id].ivl >= 21; }).length;
    stats.textContent = deck.length + ' cards in this deck: ' + seen + ' started, ' + learned + ' well known (3+ weeks), ' + due + ' due now. New cards today: ' + newToday() + '.';
  }
  function fmt(ms) {
    if (ms < 60 * MIN) return Math.round(ms / MIN) + ' min';
    if (ms < DAY) return Math.round(ms / (60 * MIN)) + ' h';
    var d = Math.round(ms / DAY); return d < 31 ? d + ' d' : Math.round(d / 30) + ' mo';
  }
  function next(c, g) {
    var s = srs[c.id] ? JSON.parse(JSON.stringify(srs[c.id])) : { ivl: 0, ease: 2.5, reps: 0, lapses: 0 };
    if (g === 1) { s.reps = 0; s.lapses++; s.ease = Math.max(1.3, s.ease - 0.2); s.ivl = 0; s.due = Date.now() + MIN; return s; }
    if (s.reps === 0) s.ivl = g === 2 ? 0.5 : (g === 3 ? 1 : 3);
    else if (s.reps === 1 && s.ivl < 3) s.ivl = g === 2 ? 2 : (g === 3 ? 3 : 6);
    else s.ivl = s.ivl * (g === 2 ? 1.2 : (g === 3 ? s.ease : s.ease * 1.3));
    if (g === 2) s.ease = Math.max(1.3, s.ease - 0.15);
    if (g === 4) s.ease += 0.15;
    s.reps++; s.due = Date.now() + s.ivl * DAY;
    return s;
  }
  function artHTML(de, a) { return a ? '<span class="art-' + a + '">' + R.esc(de.slice(0, a.length)) + '</span>' + R.esc(de.slice(a.length)) : R.esc(de); }
  function show() {
    flipped = false; card.classList.remove('flipped'); grades.hidden = true; flipBtn.hidden = false;
    if (!queue.length) {
      cur = null;
      front.innerHTML = deck.length ? 'Done for now' : 'This deck is empty';
      sayEl.innerHTML = ''; back.innerHTML = ''; corner.textContent = '';
      var nextDue = deck.filter(function (c) { return srs[c.id]; }).map(function (c) { return srs[c.id].due; }).sort()[0];
      sayEl.innerHTML = '<span class="muted" style="font-size:1rem">' + (nextDue ? 'Next card is due in ' + fmt(Math.max(0, nextDue - Date.now())) + '. ' : '') + 'Raise “New cards per day” or pick another deck to keep going.</span>';
      flipBtn.hidden = true; drawStats(); return;
    }
    cur = queue[0];
    var dirDE = dirSel.value === 'de';
    corner.textContent = (srs[cur.id] ? 'Review' : 'New') + ', ' + queue.length + ' left';
    if (dirDE) { front.innerHTML = artHTML(cur.de, cur.a); sayEl.innerHTML = R.say(cur.pr); }
    else { front.innerHTML = '<span style="font-size:0.7em">' + R.esc(cur.en) + '</span>'; sayEl.innerHTML = ''; }
    back.innerHTML = dirDE ? '<div style="font-size:1.25rem;font-weight:600">' + R.esc(cur.en) + '</div>' + (cur.extra ? '<div class="small muted">' + R.esc(cur.extra) + '</div>' : '')
      : '<div style="font-size:1.6rem;font-weight:600">' + artHTML(cur.de, cur.a) + '</div><div class="say">' + R.say(cur.pr) + '</div>' + (cur.extra ? '<div class="small muted">' + R.esc(cur.extra) + '</div>' : '');
    ['2', '3', '4'].forEach(function (g) { var s = next(cur, +g); $('#g' + g).textContent = fmt(s.due - Date.now()); });
    drawStats();
  }
  function flip() {
    if (!cur || flipped) return;
    flipped = true; card.classList.add('flipped'); grades.hidden = false; flipBtn.hidden = true;
    if (dirSel.value === 'en') speak();
  }
  function grade(g) {
    if (!cur || !flipped) return;
    var isNew = !srs[cur.id];
    srs[cur.id] = next(cur, g);
    R.store.set('srs', srs);
    if (isNew) bumpNew();
    R.progress.log('flashcard', { id: cur.id, g: g });
    queue.shift();
    if (g === 1) queue.splice(Math.min(queue.length, 4), 0, cur);   // see it again soon in this session
    show();
  }
  function speak() { if (cur) R.speak(cur.de.replace(/\s*\(.*?\)/g, '').replace(/·/g, ','), { lang: 'de-DE' }); }
  function load() {
    deck = buildDeck(deckSel.value);
    R.store.set('fcPrefs', { deck: deckSel.value, dir: dirSel.value, nw: newSel.value });
    try { history.replaceState(null, '', '#deck=' + deckSel.value); } catch (e) {}
    buildQueue(); show();
  }
  var prefs = R.store.get('fcPrefs', {});
  var hash = (location.hash.match(/deck=([\w-]+)/) || [])[1];
  if (hash && deckSel.querySelector('option[value="' + hash + '"]')) deckSel.value = hash; else if (prefs.deck) deckSel.value = prefs.deck;
  if (prefs.dir) dirSel.value = prefs.dir; if (prefs.nw) newSel.value = prefs.nw;
  [deckSel, dirSel, newSel].forEach(function (el) { el.addEventListener('change', load); });
  card.addEventListener('click', flip); flipBtn.addEventListener('click', flip);
  $('#fc-listen').addEventListener('click', function (e) { e.stopPropagation(); speak(); });
  R.$$('[data-g]', grades).forEach(function (b) { b.addEventListener('click', function () { grade(+b.getAttribute('data-g')); }); });
  document.addEventListener('keydown', function (e) {
    if (/input|select|textarea/i.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!flipped) flip(); }
    else if (/^[1-4]$/.test(e.key)) grade(+e.key);
    else if (e.key === 'l' || e.key === 'L') speak();
  });
  load();
})();
