/* Vocabulary browser: filter 1,506 words by level, topic, type and search */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, V = window.RAX_VOCAB;
  if (!V) return;
  var list = $('#v-list'), more = $('#v-more'), count = $('#v-count');
  var q = $('#v-q'), lv = $('#v-lv'), topic = $('#v-topic'), cat = $('#v-cat'), core = $('#v-core'), hideLook = $('#v-hidelook'), study = $('#v-study');
  var PAGE = 80, shown = 0, current = [];
  var saved = R.store.get('vocabFilters', null);
  if (saved) { lv.value = saved.lv || ''; topic.value = saved.topic || ''; cat.value = saved.cat || ''; core.checked = !!saved.core; hideLook.checked = !!saved.hideLook; }
  function norm(s) { return String(s).toLowerCase().normalize('NFC'); }
  function artHTML(de, a) {
    if (!a) return R.esc(de);
    return '<span class="art-' + a + '">' + R.esc(de.slice(0, a.length)) + '</span>' + R.esc(de.slice(a.length));
  }
  function row(w) {
    var tags = [w.lv, V.cats[w.c]];
    if (w.t >= 0) tags.push(V.topics[w.t].split(' · ')[1] || V.topics[w.t]);
    if (w.k) tags.push('core');
    if (w.l) tags.push('look-alike');
    var en = R.esc(w.en).replace(/\((NOT [^)]*)\)/g, '<span style="color:var(--mk)">($1)</span>');
    return '<li>' + R.speakBtn(w.de.replace(/\s*\(.*?\)/g, ''), 'de-DE', 'Listen: ' + w.de) +
      '<div class="w">' + artHTML(w.de, w.a) + '<small>' + R.say(w.pr) + '</small></div>' +
      '<div class="e">' + en + '</div>' +
      '<div class="tags">' + tags.map(R.esc).join(', ') + '</div></li>';
  }
  function filter() {
    var s = norm(q.value.trim());
    current = V.words.filter(function (w) {
      if (lv.value && w.lv !== lv.value) return false;
      if (topic.value !== '' && String(w.t) !== topic.value) return false;
      if (cat.value !== '' && String(w.c) !== cat.value) return false;
      if (core.checked && !w.k) return false;
      if (hideLook.checked && w.l) return false;
      if (s && norm(w.de).indexOf(s) < 0 && norm(w.en).indexOf(s) < 0) return false;
      return true;
    });
    shown = 0; list.innerHTML = ''; draw();
    count.textContent = current.length + ' words' + (current.length ? '' : '. Try a shorter search or clear a filter.');
    var deck = topic.value !== '' ? 'topic-' + topic.value : (core.checked ? 'core' : (lv.value === 'A2' ? 'a2' : (lv.value === 'A1' ? 'a1' : 'core')));
    study.href = 'flashcards.html#deck=' + deck;
    R.store.set('vocabFilters', { lv: lv.value, topic: topic.value, cat: cat.value, core: core.checked, hideLook: hideLook.checked });
  }
  function draw() {
    var chunk = current.slice(shown, shown + PAGE);
    list.insertAdjacentHTML('beforeend', chunk.map(row).join(''));
    shown += chunk.length;
    more.hidden = shown >= current.length;
    if (!more.hidden) more.textContent = 'Show more words (' + (current.length - shown) + ' left)';
  }
  more.addEventListener('click', draw);
  var t;
  q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(filter, 150); });
  [lv, topic, cat, core, hideLook].forEach(function (el) { el.addEventListener('change', filter); });
  filter();
})();
