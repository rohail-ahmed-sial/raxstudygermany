/* RAX Study Germany: document attestation tools (step ticks, route selector, personal checklist, fee filter, cost estimate).
   Everything is saved in this browser only. Nothing here is, or claims to be, an official application status. */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, esc = R.esc;
  var A = window.RAX_ATTEST || { sources: [], fees: {}, stages: {}, docs: [], countries: [] };
  var SRC = {}; A.sources.forEach(function (s) { SRC[s.id] = s; });
  var DOCS = {}; A.docs.forEach(function (d) { DOCS[d.id] = d; });
  var COUNTRIES = {}; A.countries.forEach(function (c) { COUNTRIES[c.id] = c; });
  var core = document.querySelector('script[src$="assets/js/core.js"]');
  var ROOT = core ? core.getAttribute('src').replace('assets/js/core.js', '') : '../';
  function today() { return new Date().toISOString().slice(0, 10); }
  function pkr(n) { return 'PKR ' + Math.round(n).toLocaleString('en-GB'); }
  function twoStep(btn, label, action) {
    var armed = false, orig = btn.textContent;
    btn.addEventListener('click', function () {
      if (!armed) { armed = true; btn.textContent = label; setTimeout(function () { armed = false; btn.textContent = orig; }, 4000); return; }
      armed = false; btn.textContent = orig; action();
    });
  }

  /* ---------- Step ticks on the procedure timelines ---------- */
  var ticks = $$('[data-attest-step]');
  if (ticks.length) {
    var st = R.store.get('attest.steps', {});
    var prog = $('[data-step-progress]');
    var upd = function () {
      var n = ticks.filter(function (t) { return t.checked; }).length;
      ticks.forEach(function (t) { t.closest('.rail-step').classList.toggle('is-done', t.checked); });
      if (prog) prog.textContent = n + ' of ' + ticks.length + ' steps ticked on this device.';
    };
    ticks.forEach(function (t) {
      t.checked = !!st[t.getAttribute('data-attest-step')];
      t.addEventListener('change', function () {
        var s = R.store.get('attest.steps', {});
        if (t.checked) s[t.getAttribute('data-attest-step')] = true; else delete s[t.getAttribute('data-attest-step')];
        R.store.set('attest.steps', s); if (t.checked) R.progress.log('attest-step', { id: t.getAttribute('data-attest-step') }); upd();
      });
    });
    upd();
  }
  var ex = $('[data-expand-all]');
  if (ex) ex.addEventListener('click', function () {
    var ds = $$('details.rail-more'), open = ds.some(function (d) { return !d.open; });
    ds.forEach(function (d) { d.open = open; }); ex.textContent = open ? 'Collapse all steps' : 'Expand all steps';
  });
  window.addEventListener('beforeprint', function () { $$('details.rail-more').forEach(function (d) { d.open = true; }); });
  if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt && tgt.classList.contains('rail-step')) { var dd = $('details', tgt); if (dd) dd.open = true; } }

  /* ---------- Route logic shared by the selector and the checklist ---------- */
  function route(a) {
    /* a: {doc, country, issuer, verified, abroad, instruction} */
    var doc = DOCS[a.doc] || DOCS.other, stages = doc.stages.slice(), notes = [], warn = [];
    if (a.doc === 'other') {
      stages = ({ board: ['board', 'ibcc'], university: ['hec'], technical: ['technical'], nadra: ['nadra'], foreign: ['mission'], 'ibcc-hec': ['ibcc', 'hec-eq'] })[a.issuer] || ['issuer'];
    }
    if (a.doc === 'equivalence') {
      stages = ['ibcc', 'hec-eq'];
      notes.push('An IBCC equivalence certificate is attested by IBCC; an HEC equivalence letter is attested by HEC. Follow the one that matches your document and ignore the other.');
    }
    if (a.doc === 'foreign') notes.push('Foreign school qualifications such as O/A levels need an IBCC equivalence certificate; IBCC attests them only together with it.');
    if ((a.doc === 'ssc' || a.doc === 'hssc' || a.doc === 'marks') && a.issuer && a.issuer !== 'board' && a.issuer !== 'other')
      warn.push('You chose a board document but a different issuer. Matric and Intermediate documents issued in Pakistan come from a BISE or BTE; check the document again.');
    if ((a.doc === 'degree' || a.doc === 'transcript') && a.issuer === 'foreign')
      notes.push('HEC does not attest foreign degrees directly. Apply for an HEC equivalence letter, which HEC can attest.');
    if (a.verified === 'yes') notes.push('You said the document is already verified. Tick the steps you have already completed.');
    var abroad = a.abroad !== 'no';
    if (!abroad) {
      notes.push('For use inside Pakistan, MOFA attestation is usually not needed. Ask the institution that will receive the document.');
      stages.push('receiver');
    } else if (a.country === 'germany') {
      if (a.instruction === 'apostille') warn.push('Germany objected to Pakistan’s accession to the Apostille Convention. A Pakistani apostille has no effect in Germany. Ask the German institution what it needs instead.');
      if (a.instruction === 'legalisation') warn.push('The German Embassy in Pakistan says it cannot attest or legalise Pakistani documents. Ask the German institution what it accepts instead.');
      if (a.instruction === 'mofa') stages.push('mofa-ga');
      else notes.push('Get MOFA general attestation only if your university, uni-assist or the German mission asks for it.');
      stages.push('germany');
    } else if (a.country === 'objector') {
      if (a.instruction === 'apostille') warn.push('This country objected to Pakistan’s accession. A Pakistani apostille has no effect there. Ask the receiver what it needs instead.');
      if (a.instruction === 'mofa' || a.instruction === 'legalisation') stages.push('mofa-ga');
      if (a.instruction === 'legalisation') notes.push('After MOFA, follow that country’s embassy instructions for legalisation or verification.');
      if (a.instruction === 'none' || a.instruction === 'copies') notes.push('MOFA general attestation only if the receiver asks for it.');
      stages.push('receiver');
    } else {
      if (a.instruction === 'apostille') { stages.push('mofa-ap'); notes.push('Check the HCCH status table that the Apostille Convention applies between Pakistan and the destination.'); }
      else if (a.instruction === 'mofa' || a.instruction === 'legalisation') { stages.push('mofa-ga'); if (a.instruction === 'legalisation') notes.push('After MOFA, follow the destination embassy’s instructions for legalisation.'); }
      else notes.push('Do not assume an apostille is needed just because the document is used abroad. Get MOFA general attestation or an apostille only if the receiver asks for it.');
      stages.push('receiver');
    }
    var seen = {}; stages = stages.filter(function (s) { if (seen[s] || !A.stages[s]) return false; seen[s] = 1; return true; });
    return { stages: stages, notes: notes, warn: warn };
  }
  function stageHTML(id, i, done, editable) {
    var s = A.stages[id];
    return '<li class="rail-step' + (editable && s.items.every(function (x, j) { return done[id + ':' + j]; }) ? ' is-done' : '') + '"><div class="rail-head"><p class="rail-no">Stage ' + (i + 1) + '</p><h3>' + esc(s.title) + '</h3>' +
      '<p class="rail-meta"><span>' + esc(s.authority) + '</span></p></div><ul class="acl-items">' + s.items.map(function (it, j) {
        var k = id + ':' + j;
        return editable ? '<li><label class="rail-check"><input type="checkbox" data-acl="' + esc(k) + '"' + (done[k] ? ' checked' : '') + '><span>' + esc(it) + '</span></label></li>' : '<li>' + esc(it) + '</li>';
      }).join('') + '</ul><p class="small"><a href="' + ROOT + s.page + '">How to do this</a></p></li>';
  }

  /* ---------- Document route selector ---------- */
  var form = $('#attest-finder');
  if (form) {
    var steps = $$('.wizard-step', form), cur = 0, next = $('#af-next'), back = $('#af-back'), out = $('#af-result'), bars = $$('.progress-steps span', form);
    var names = ['doc', 'country', 'issuer', 'verified', 'abroad', 'instruction'];
    var show = function (i) {
      cur = i; steps.forEach(function (s, j) { s.classList.toggle('active', j === i); });
      bars.forEach(function (b, j) { b.classList.toggle('done', j <= i); });
      $('#af-stepno').textContent = 'Question ' + (i + 1) + ' of ' + steps.length;
      back.disabled = i === 0; next.textContent = i === steps.length - 1 ? 'Show my checklist' : 'Next question';
      var lg = $('legend', steps[i]); if (lg && i > 0) { lg.setAttribute('tabindex', '-1'); lg.focus(); }
    };
    var answers = function () { var a = {}; names.forEach(function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); a[n] = c ? c.value : null; }); return a; };
    var autofill = { ssc: 'board', hssc: 'board', marks: 'board', degree: 'university', transcript: 'university', technical: 'technical', foreign: 'foreign', equivalence: 'ibcc-hec', civil: 'nadra' };
    form.addEventListener('change', function (e) {
      if (e.target.name === 'doc' && autofill[e.target.value]) { var c = form.querySelector('input[name="issuer"][value="' + autofill[e.target.value] + '"]'); if (c) c.checked = true; }
    });
    next.addEventListener('click', function () {
      var ok = !!$('input:checked', steps[cur]); $('.f-err', steps[cur]).hidden = ok; if (!ok) return;
      if (cur < steps.length - 1) { show(cur + 1); return; }
      var a = answers(); R.store.set('attest.finder', a); R.progress.log('attest-finder', { doc: a.doc }); render(a);
    });
    back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    var render = function (a) {
      var r = route(a), d = DOCS[a.doc];
      var html = '<h3>Preliminary checklist: ' + esc(d.label) + '</h3><p class="small muted">For ' + esc((COUNTRIES[a.country] || {}).label || '') + '. Information last verified: ' + esc(A.lastReview) + '. This is an information guide, not a government decision.</p>';
      html += r.warn.map(function (w) { return '<div class="stop"><p>' + esc(w) + '</p></div>'; }).join('');
      html += r.notes.length ? '<div class="note"><ul>' + r.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>' : '';
      html += '<ol class="rail">' + r.stages.map(function (s, i) { return stageHTML(s, i, {}, false); }).join('') + '</ol>';
      html += '<div class="btn-row no-print"><button type="button" class="btn" id="af-save">Save as my checklist</button><button type="button" class="btn quiet" id="af-again">Start again</button><button type="button" class="btn quiet" id="af-print">Print</button></div>';
      out.innerHTML = html; out.hidden = false; form.hidden = true; out.focus();
      $('#af-again').addEventListener('click', function () { out.hidden = true; form.hidden = false; show(0); });
      $('#af-print').addEventListener('click', function () { window.print(); });
      $('#af-save').addEventListener('click', function () {
        var prev = R.store.get('attest.checklist', null) || {};
        var service = !( a.abroad !== 'no') ? 'no' : ({ apostille: 'apostille', mofa: 'mofa', legalisation: 'mofa' })[a.instruction] || 'none';
        R.store.set('attest.checklist', { doc: a.doc, docLabel: d.label, country: a.country, countryLabel: (COUNTRIES[a.country] || {}).label, service: service, answers: a,
          stages: r.stages, done: prev.doc === a.doc ? (prev.done || {}) : {}, notes: prev.notes || '', bookmarks: prev.bookmarks || {}, created: prev.created || today(), reviewedAt: prev.reviewedAt || null });
        location.href = 'checklist.html';
      });
    };
    var saved = R.store.get('attest.finder', null);
    if (saved) names.forEach(function (n) { var c = saved[n] && form.querySelector('input[name="' + n + '"][value="' + saved[n] + '"]'); if (c) c.checked = true; });
    show(0);
  }

  /* ---------- Personal checklist ---------- */
  var box = $('#attest-checklist');
  if (box) {
    var KEY = 'attest.checklist';
    var get = function () { return R.store.get(KEY, null); };
    var docSel = $('#ac-doc'), cSel = $('#ac-country'), sSel = $('#ac-service');
    var answersFrom = function () {
      var sv = sSel.value;
      return { doc: docSel.value, country: cSel.value, issuer: null, verified: null, abroad: sv === 'no' ? 'no' : 'yes', instruction: sv === 'mofa' ? 'mofa' : sv === 'apostille' ? 'apostille' : 'none' };
    };
    var draw = function () {
      var c = get(), existed = !!c;
      if (!c) {
        c = { doc: docSel.value, docLabel: DOCS[docSel.value].label, country: cSel.value, countryLabel: COUNTRIES[cSel.value].label, service: sSel.value, done: {}, notes: '', bookmarks: {}, created: today(), reviewedAt: null };
      }
      docSel.value = c.doc; cSel.value = c.country; sSel.value = c.service || 'none';
      var r = route(c.answers && c.answers.doc === c.doc && c.answers.country === c.country && (c.service || 'none') === serviceOf(c.answers) ? c.answers : answersFrom());
      c.stages = r.stages;
      var total = 0, done = 0;
      r.stages.forEach(function (s) { A.stages[s].items.forEach(function (x, j) { total++; if (c.done[s + ':' + j]) done++; }); });
      $('#acl-summary').innerHTML = '<p><b>' + done + ' of ' + total + '</b> items done for <b>' + esc(DOCS[c.doc].label) + '</b> (' + esc(COUNTRIES[c.country].label) + '). Last reviewed: ' +
        (c.reviewedAt ? esc(c.reviewedAt) : 'not yet') + '. Information on this site last verified: ' + esc(A.lastReview) + '.</p>' +
        r.warn.map(function (w) { return '<div class="stop"><p>' + esc(w) + '</p></div>'; }).join('') +
        (r.notes.length ? '<div class="note"><ul>' + r.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>' : '');
      $('#acl-stages').innerHTML = '<ol class="rail">' + r.stages.map(function (s, i) { return stageHTML(s, i, c.done, true); }).join('') + '</ol>';
      $('#acl-notes').value = c.notes || '';
      $('#acl-bookmarks').innerHTML = '<ul class="acl-bm">' + A.sources.map(function (s) {
        return '<li><label class="rail-check"><input type="checkbox" data-bm="' + esc(s.id) + '"' + (c.bookmarks[s.id] ? ' checked' : '') + '><span><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.title) + '</a></span></label></li>';
      }).join('') + '</ul>';
      c.docLabel = DOCS[c.doc].label; c.countryLabel = COUNTRIES[c.country].label;
      if (existed) R.store.set(KEY, c);
      return c;
    };
    var serviceOf = function (a) { if (!a) return 'none'; if (a.abroad === 'no') return 'no'; return ({ apostille: 'apostille', mofa: 'mofa', legalisation: 'mofa' })[a.instruction] || 'none'; };
    var update = function (fn) { var c = get() || draw(); fn(c); R.store.set(KEY, c); };
    [docSel, cSel, sSel].forEach(function (s) {
      s.addEventListener('change', function () {
        update(function (c) { if (c.doc !== docSel.value) c.done = {}; c.doc = docSel.value; c.country = cSel.value; c.service = sSel.value; c.answers = null; });
        draw();
      });
    });
    box.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-acl'), bm = e.target.getAttribute('data-bm');
      if (k) { update(function (c) { if (e.target.checked) c.done[k] = true; else delete c.done[k]; }); if (e.target.checked) R.progress.log('attest-step', { id: k }); draw(); }
      if (bm) update(function (c) { if (e.target.checked) c.bookmarks[bm] = true; else delete c.bookmarks[bm]; });
    });
    var nt; $('#acl-notes').addEventListener('input', function () { clearTimeout(nt); var v = this.value; nt = setTimeout(function () { update(function (c) { c.notes = v; }); }, 400); });
    $('#acl-reviewed').addEventListener('click', function () { update(function (c) { c.reviewedAt = today(); }); draw(); R.toast('Marked as reviewed today.'); });
    $('#acl-print').addEventListener('click', function () { window.print(); });
    $('#acl-export').addEventListener('click', function () {
      var c = draw();
      var outObj = { app: 'RAX Study Germany', type: 'attestation-checklist', exportedAt: new Date().toISOString(), informationLastVerified: A.lastReview,
        note: 'Personal preparation checklist saved in a browser. It is not the status of any official IBCC, HEC or MOFA application.',
        document: c.docLabel, destination: c.countryLabel, mofaService: c.service, reviewedAt: c.reviewedAt, created: c.created,
        stages: c.stages.map(function (s) { var st = A.stages[s]; return { stage: st.title, authority: st.authority, items: st.items.map(function (x, j) { return { item: x, done: !!c.done[s + ':' + j] }; }) }; }),
        notes: c.notes, bookmarks: Object.keys(c.bookmarks).filter(function (k) { return SRC[k]; }).map(function (k) { return { title: SRC[k].title, url: SRC[k].url }; }) };
      R.download('rax-study-germany-attestation-checklist-' + today() + '.json', JSON.stringify(outObj, null, 2), 'application/json');
    });
    twoStep($('#acl-clear'), 'Click again to clear', function () { R.store.remove(KEY); draw(); R.toast('Checklist cleared.'); });
    draw();
  }

  /* ---------- Fee table filter ---------- */
  var ft = $('#afee-table');
  if (ft) {
    var fa = $('#af-auth');
    var runF = function () {
      var rows = $$('tbody tr', ft), n = 0;
      rows.forEach(function (tr) { var ok = !fa.value || tr.getAttribute('data-auth') === fa.value; tr.hidden = !ok; if (ok) n++; });
      $('#afee-count').textContent = 'Showing ' + n + ' of ' + rows.length + ' fees.';
    };
    fa.addEventListener('change', runF); runF();
  }

  /* ---------- Cost estimate ---------- */
  var calc = $('#attest-calc');
  if (calc) {
    var F = A.fees;
    var ids = ['ac-board', 'ac-ibcc', 'ac-mode', 'ac-hec', 'ac-ap', 'ac-other'];
    var sv = R.store.get('attestCalc', null); if (sv) ids.forEach(function (i) { if (sv[i] != null) $('#' + i).value = sv[i]; });
    var runC = function () {
      var n = function (i) { return Math.max(0, Math.round(+$('#' + i).value || 0)); };
      var express = $('#ac-mode').value === 'express';
      var per = express ? F.ibcc_express_original.amount : F.ibcc_original.amount;
      var rows = [['Board verification (your figure)', n('ac-board')], ['IBCC: ' + n('ac-ibcc') + ' × ' + pkr(per) + (express ? ' (Express)' : ''), n('ac-ibcc') * per],
        ['HEC: ' + n('ac-hec') + ' × ' + pkr(F.hec_attestation.amount), n('ac-hec') * F.hec_attestation.amount],
        ['MOFA apostille: ' + n('ac-ap') + ' × ' + pkr(F.mofa_apostille_personal.amount), n('ac-ap') * F.mofa_apostille_personal.amount], ['Other costs (your figure)', n('ac-other')]];
      var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);
      $('#ac-out').innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="num">Estimate</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td class="num">' + pkr(r[1]) + '</td></tr>'; }).join('') +
        '<tr class="total"><td><b>Total estimate</b></td><td class="num"><b>' + pkr(total) + '</b></td></tr></tbody></table></div>' +
        '<p class="small muted">MOFA general attestation has no MOFA fee (revenue stamps only). Photocopy attestation and courier charges are not included because we could not confirm them. Fees last checked ' + esc(A.lastReview) + '.</p>';
      var s = {}; ids.forEach(function (i) { s[i] = $('#' + i).value; }); R.store.set('attestCalc', s);
    };
    ids.forEach(function (i) { $('#' + i).addEventListener('input', runC); $('#' + i).addEventListener('change', runC); });
    runC();
  }
})();
