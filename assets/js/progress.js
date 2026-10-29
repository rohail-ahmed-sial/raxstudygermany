/* Dashboard: reads what other pages saved in this browser and shows it in small panels.
   Nothing here is an official status: checklist ticks are the learner's own notes. */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, esc = R.esc;
  var dash = $('#pg-dash');
  if (!dash) return;
  var V = window.RAX_VISA || { routes: [] }, A = window.RAX_ATTEST || { stages: {}, sources: [] };
  var ROUTES = {}; (V.routes || []).forEach(function (r) { ROUTES[r.id] = r; });

  var LABEL = {
    lesen: ['Lesen practice', 'german/lesen.html'], hoeren: ['Hören practice', 'german/hoeren.html'], grammar: ['Grammar quiz', 'german/grammar.html'],
    practice: ['German practice', 'german/index.html'], schreiben: ['Schreiben task marked as written', 'german/schreiben.html'], 'schreiben-pad': ['Schreiben writing pad', 'german/schreiben.html'],
    sprechen: ['Sprechen recording', 'german/sprechen.html'], flashcard: ['Flashcard review', 'german/flashcards.html'], mock: ['German mock exam finished', 'german/mock-test.html'],
    'mock-start': ['German mock exam started', 'german/mock-test.html'], ielts: ['IELTS Reading or Listening practice', 'ielts/index.html'], 'ielts-writing': ['IELTS essay checked', 'ielts/writing.html'],
    'ielts-speaking': ['IELTS speaking recording', 'ielts/speaking.html'], 'ielts-mock': ['IELTS mock test finished', 'ielts/mock-test.html'], 'ielts-mock-start': ['IELTS mock test started', 'ielts/mock-test.html'],
    'visa-finder': ['Visa route finder used', 'visa/route-finder.html'], 'bachelor-checker': ['Bachelor’s path checker used', 'bachelor/index.html#checker'], 'attest-finder': ['Document route selector used', 'attestation/index.html#selector'], 'attest-step': ['Attestation step ticked', 'attestation/checklist.html']
  };
  function d(iso) { return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function scored(list) {
    var s = 0, t = 0, ids = {};
    list.forEach(function (e) { if (e.data && e.data.total) { s += e.data.score; t += e.data.total; ids[e.data.id] = 1; } });
    return { sets: Object.keys(ids).length, pct: t ? Math.round(100 * s / t) : null };
  }
  function panel(ref, title, href, bodyHtml, cta) {
    return '<section class="dash-panel"><p class="dash-ref">' + esc(ref) + '</p><h2><a href="' + href + '">' + esc(title) + '</a></h2>' + bodyHtml +
      (cta ? '<p class="dash-cta"><a href="' + cta[1] + '">' + esc(cta[0]) + '</a></p>' : '') + '</section>';
  }
  function facts(rows) {
    return '<dl class="dash-facts">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';
  }

  function draw() {
    var log = R.progress.all();
    var by = function (areas) { return log.filter(function (e) { return areas.indexOf(e.area) > -1; }); };
    var last = log.length ? log[log.length - 1] : null;
    var html = '';

    /* Continue */
    if (last && LABEL[last.area]) {
      html += '<section class="dash-continue"><p class="dash-ref">Continue</p><p class="dash-lead">Last activity: <b>' + esc(LABEL[last.area][0]) + '</b>, ' + esc(d(last.at)) + '.</p>' +
        '<a class="btn" href="' + LABEL[last.area][1] + '">Continue where you left off</a></section>';
    } else {
      html += '<section class="dash-continue"><p class="dash-ref">Start here</p><p class="dash-lead">Nothing saved yet. Most people begin with German A1 and the document attestation guide.</p>' +
        '<div class="btn-row"><a class="btn" href="german/a1.html">Start German A1</a><a class="btn quiet" href="attestation/index.html">Attestation guide</a><a class="btn quiet" href="visa/route-finder.html">Find your visa route</a></div></section>';
    }

    var panels = [];
    /* German */
    var lesen = scored(by(['lesen'])), hoeren = scored(by(['hoeren'])), gram = scored(by(['grammar']));
    var srs = R.store.get('srs', {}), sk = Object.keys(srs), now = Date.now(), due = sk.filter(function (k) { return srs[k].due <= now; }).length;
    var doneN = Object.keys(R.store.get('done', {})).length;
    var mh = R.store.get('mockHistory', []);
    var gRows = [
      ['Lesen', lesen.sets ? plural(lesen.sets, 'set', 'sets') + ', average ' + lesen.pct + '%' : 'Not started'],
      ['Hören', hoeren.sets ? plural(hoeren.sets, 'set', 'sets') + ', average ' + hoeren.pct + '%' : 'Not started'],
      ['Grammar', gram.sets ? plural(gram.sets, 'quiz', 'quizzes') + ', average ' + gram.pct + '%' : 'Not started'],
      ['Schreiben', doneN ? plural(doneN, 'task', 'tasks') + ' marked as written' : 'Not started'],
      ['Flashcards', sk.length ? plural(sk.length, 'card', 'cards') + ' studied, ' + due + ' due now' : 'Not started']];
    panels.push(panel('01 German', 'Continue German learning', 'german/index.html', facts(gRows), due ? ['Review ' + plural(due, 'due card', 'due cards'), 'german/flashcards.html'] : ['Open the study plan', 'german/index.html']));
    /* Mock exams */
    var mBody = mh.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Level</th><th class="num">Total</th><th>Result</th></tr></thead><tbody>' +
      mh.slice(-5).reverse().map(function (r) { return '<tr><td>' + esc(d(r.at)) + '</td><td>' + esc(r.level) + '</td><td class="num"><b>' + r.total + '</b></td><td>' + (r.pass ? 'Passed' : 'Not yet') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="small muted">Best: ' + mh.reduce(function (m, r) { return Math.max(m, r.total); }, 0) + ' / 100 from ' + plural(mh.length, 'mock exam', 'mock exams') + '.</p>'
      : '<p class="muted">No mock exams yet. A full A1 or A2 mock takes about two hours.</p>';
    panels.push(panel('02 Mock exams', 'A1 and A2 mock-test activity', 'german/mock-test.html', mBody, ['Take a mock exam', 'german/mock-test.html']));
    /* IELTS */
    var ih = R.store.get('ieltsHistory', []), ip = scored(by(['ielts'])), iw = by(['ielts-writing']).length, isp = by(['ielts-speaking']).length;
    var f1 = function (x) { return x == null ? '–' : Number(x).toFixed(1); };
    var iRows = [['Reading and Listening', ip.sets ? plural(ip.sets, 'set', 'sets') + ', average ' + ip.pct + '%' : 'Not started'], ['Writing', iw ? plural(iw, 'essay', 'essays') + ' checked' : 'Not started'],
      ['Speaking', isp ? plural(isp, 'recording', 'recordings') : 'Not started']];
    if (ih.length) { var li = ih[ih.length - 1]; iRows.push(['Last mock', 'L ' + f1(li.l) + ', R ' + f1(li.r) + ', W ' + f1(li.w) + ', S ' + f1(li.s) + ': <b>overall ' + f1(li.overall) + '</b>']); }
    panels.push(panel('03 IELTS', 'IELTS practice', 'ielts/index.html', facts(iRows), ['Open IELTS practice', 'ielts/index.html']));
    /* Visa */
    var finder = R.store.get('finder', null), cls = R.store.keys().filter(function (k) { return k.indexOf('cl.') === 0; });
    var plans = R.store.get('plans', {}), pk = Object.keys(plans);
    var bp = R.store.get('bachelorPath', null);
    var vRows = [['Bachelor’s path', bp && bp.label ? esc(bp.label) : 'Not checked yet'], ['Route finder', finder ? 'Used' : 'Not used yet']];
    cls.forEach(function (k) {
      var id = k.slice(3), r = ROUTES[id], st = R.store.get(k, {}), items = st.items || {}, keys = Object.keys(items);
      var done = keys.filter(function (i) { return items[i].s === 'done'; }).length, total = r ? r.checklist.length + (st.custom || []).length : keys.length;
      vRows.push([r ? r.name : id, done + ' of ' + total + ' documents completed']);
    });
    pk.forEach(function (k) { var r = ROUTES[k]; vRows.push(['Plan: ' + (r ? r.name : k), plans[k].travel ? 'Travel ' + esc(plans[k].travel) : 'No travel date yet']); });
    panels.push(panel('04 Germany', 'Bachelor’s and visa research', 'visa/index.html', facts(vRows), bp ? [cls.length ? 'Open my checklists' : 'Find your visa route', cls.length ? 'visa/checklists.html' : 'visa/route-finder.html'] : ['Check my bachelor’s path', 'bachelor/index.html#checker']));
    /* Attestation */
    var ac = R.store.get('attest.checklist', null), steps = R.store.get('attest.steps', {}), sTicks = Object.keys(steps).length;
    var aRows = [];
    if (ac && ac.stages) {
      var tot = 0, dn = 0;
      ac.stages.forEach(function (s) { (A.stages[s] ? A.stages[s].items : []).forEach(function (x, j) { tot++; if (ac.done && ac.done[s + ':' + j]) dn++; }); });
      aRows.push(['Document', esc(ac.docLabel || '') + ' for ' + esc(ac.countryLabel || '')]);
      aRows.push(['Checklist', dn + ' of ' + tot + ' items done']);
      aRows.push(['Last reviewed', ac.reviewedAt ? esc(ac.reviewedAt) : 'Not yet']);
    } else aRows.push(['Checklist', 'Not started']);
    aRows.push(['Procedure steps ticked', sTicks ? String(sTicks) : 'None']);
    panels.push(panel('05 Documents', 'Attestation checklist', 'attestation/checklist.html', facts(aRows) + '<p class="small muted">Your own notes. Not an IBCC, HEC or MOFA application status.</p>',
      [ac ? 'Open my attestation checklist' : 'Find my document route', ac ? 'attestation/checklist.html' : 'attestation/index.html#selector']));
    /* Saved resources */
    var bm = ac && ac.bookmarks ? Object.keys(ac.bookmarks) : [], SRC = {}; (A.sources || []).forEach(function (s) { SRC[s.id] = s; });
    var res = bm.filter(function (k) { return SRC[k]; }).map(function (k) { return '<li><a href="' + esc(SRC[k].url) + '" rel="noopener">' + esc(SRC[k].title) + '</a></li>'; });
    panels.push(panel('06 Saved', 'Saved resources', 'attestation/checklist.html', res.length ? '<ul class="dash-list">' + res.join('') + '</ul>' : '<p class="muted">Bookmark official pages in your attestation checklist and they appear here.</p>'));
    html += '<div class="dash-grid">' + panels.join('') + '</div>';

    /* Pending items */
    var pending = [];
    if (ac && ac.stages) ac.stages.forEach(function (s) {
      var st = A.stages[s]; if (!st) return;
      st.items.forEach(function (x, j) { if (!(ac.done && ac.done[s + ':' + j])) pending.push(['Attestation', st.title + ': ' + x, 'attestation/checklist.html']); });
    });
    cls.forEach(function (k) {
      var id = k.slice(3), r = ROUTES[id], st = R.store.get(k, {}), items = st.items || {};
      if (!r) return;
      r.checklist.forEach(function (c, i) { var v = items[i] || {}; if (v.s === 'verify' || v.s === 'doing' || v.s === 'review') pending.push([r.name, c[0] + ' (' + ({ verify: 'needs official verification', doing: 'in progress', review: 'ready for review' })[v.s] + ')', 'visa/checklists.html#' + id]); });
    });
    pk.forEach(function (k) {
      var p = plans[k], r = ROUTES[k]; Object.keys(p.steps || {}).forEach(function (sk2) { var v = p.steps[sk2]; if (v.date && !v.done) pending.push([(r ? r.name : k) + ' plan', 'Step planned for ' + v.date, 'visa/planner.html#' + k]); });
    });
    html += '<section class="dash-section"><h2 id="pending">Pending checklist items</h2>' + (pending.length ?
      '<ul class="dash-pending">' + pending.slice(0, 12).map(function (p) { return '<li><span class="dash-tag">' + esc(p[0]) + '</span><a href="' + p[2] + '">' + esc(p[1]) + '</a></li>'; }).join('') + '</ul>' +
      (pending.length > 12 ? '<p class="small muted">And ' + (pending.length - 12) + ' more.</p>' : '')
      : '<p class="muted">Nothing pending. Items you start in a checklist or planner appear here.</p>') + '</section>';

    /* Recent activity timeline */
    var recent = log.slice(-10).reverse().filter(function (e) { return LABEL[e.area]; });
    html += '<section class="dash-section"><h2 id="recent">Recent activity</h2>' + (recent.length ? '<ol class="rail dash-rail">' + recent.map(function (e) {
      var extra = e.data && e.data.total ? ': ' + e.data.score + ' / ' + e.data.total : (e.data && e.data.overall != null ? ': band ' + Number(e.data.overall).toFixed(1) : (e.data && e.data.total === 0 ? '' : ''));
      return '<li class="rail-step"><p class="rail-no">' + esc(d(e.at)) + '</p><p class="rail-sum"><a href="' + LABEL[e.area][1] + '">' + esc(LABEL[e.area][0]) + '</a>' + esc(extra) + '</p></li>';
    }).join('') + '</ol>' : '<p class="muted">No activity yet.</p>') + '</section>';
    dash.innerHTML = html;
  }
  draw();

  $('#pg-export').addEventListener('click', function () { R.exportAll(); });
  $('#pg-import').addEventListener('change', function () { var f = this.files[0]; if (f) R.importAll(f, function (ok) { if (ok) draw(); }); this.value = ''; });
  var reset = $('#pg-reset'), armed = false;
  reset.addEventListener('click', function () {
    if (!armed) { armed = true; reset.textContent = 'Click again to delete everything'; setTimeout(function () { armed = false; reset.textContent = 'Delete all my progress'; }, 4000); return; }
    R.store.keys().forEach(function (k) { if (k !== 'theme') R.store.remove(k); });
    armed = false; reset.textContent = 'Delete all my progress'; R.toast('All progress deleted from this browser.'); draw();
  });
})();
