/* Home page: fills the preparation file with real progress saved in this browser. */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, esc = R.esc;
  var log = R.progress.all();
  function set(key, text) {
    var li = $('[data-pf="' + key + '"]'); if (!li || !text) return;
    $('.pf-status', li).textContent = text; li.classList.add('has-progress');
  }
  /* German */
  var mh = R.store.get('mockHistory', []), srs = Object.keys(R.store.get('srs', {})).length;
  var practised = log.filter(function (e) { return ['lesen', 'hoeren', 'grammar', 'practice', 'schreiben', 'sprechen'].indexOf(e.area) > -1; }).length;
  var g = [];
  if (mh.length) g.push(mh.length + (mh.length === 1 ? ' mock exam' : ' mock exams') + ', best ' + mh.reduce(function (m, r) { return Math.max(m, r.total); }, 0) + '/100');
  if (srs) g.push(srs + (srs === 1 ? ' flashcard' : ' flashcards') + ' studied');
  if (!g.length && practised) g.push(practised + (practised === 1 ? ' practice activity' : ' practice activities'));
  set('german', g.join(', '));
  /* IELTS */
  var ih = R.store.get('ieltsHistory', []), ip = log.filter(function (e) { return e.area.indexOf('ielts') === 0; }).length;
  if (ih.length) set('ielts', 'Last mock: overall band ' + Number(ih[ih.length - 1].overall).toFixed(1));
  else if (ip) set('ielts', ip + (ip === 1 ? ' practice activity' : ' practice activities'));
  /* Attestation */
  var ac = R.store.get('attest.checklist', null), as = R.store.get('attest.steps', {});
  var aDone = ac && ac.done ? Object.keys(ac.done).filter(function (k) { return ac.done[k]; }).length : 0;
  var sDone = Object.keys(as).filter(function (k) { return as[k]; }).length;
  if (aDone || sDone) set('attest', (aDone + sDone) + ((aDone + sDone) === 1 ? ' item' : ' items') + ' ticked' + (ac && ac.docLabel ? ', checklist for ' + ac.docLabel : ''));
  else if (ac) set('attest', 'Checklist started' + (ac.docLabel ? ' for ' + ac.docLabel : ''));
  /* Visa */
  var cls = R.store.keys().filter(function (k) { return k.indexOf('cl.') === 0; }).length, plans = Object.keys(R.store.get('plans', {})).length, finder = R.store.get('finder', null);
  var v = [];
  if (finder) v.push('route finder used');
  if (cls) v.push(cls + (cls === 1 ? ' checklist' : ' checklists'));
  if (plans) v.push(plans + (plans === 1 ? ' plan' : ' plans'));
  if (v.length) set('visa', v.join(', ').replace(/^./, function (c) { return c.toUpperCase(); }));
  /* Next step for returning learners */
  var PAGES = { lesen: ['german/lesen.html', 'Lesen practice'], hoeren: ['german/hoeren.html', 'Hören practice'], grammar: ['german/grammar.html', 'grammar'],
    flashcard: ['german/flashcards.html', 'flashcards'], mock: ['german/mock-test.html', 'German mock exams'], 'mock-start': ['german/mock-test.html', 'German mock exams'],
    schreiben: ['german/schreiben.html', 'Schreiben practice'], 'schreiben-pad': ['german/schreiben.html', 'Schreiben practice'], sprechen: ['german/sprechen.html', 'Sprechen practice'],
    ielts: ['ielts/index.html', 'IELTS practice'], 'ielts-writing': ['ielts/writing.html', 'IELTS Writing'], 'ielts-speaking': ['ielts/speaking.html', 'IELTS Speaking'],
    'ielts-mock': ['ielts/mock-test.html', 'IELTS mock tests'], 'ielts-mock-start': ['ielts/mock-test.html', 'IELTS mock tests'], 'visa-finder': ['visa/route-finder.html', 'the visa route finder'],
    'attest-finder': ['attestation/checklist.html', 'your attestation checklist'], 'attest-step': ['attestation/checklist.html', 'your attestation checklist'], practice: ['german/index.html', 'German practice'] };
  var last = log.length ? log[log.length - 1] : null, nx = $('#hero-next');
  if (last && PAGES[last.area] && nx) {
    nx.innerHTML = 'Welcome back. Continue with <a href="' + PAGES[last.area][0] + '">' + esc(PAGES[last.area][1]) + '</a>, or open <a href="progress.html">your dashboard</a>.';
  }
})();
