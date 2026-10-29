/* Bachelor's path checker: an orientation based on DAAD Pakistan's published rules. Not an admission decision. */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, esc = R.esc;
  var form = $('#bach-finder');
  if (!form) return;
  var steps = $$('.wizard-step', form), cur = 0, next = $('#bf-next'), back = $('#bf-back'), out = $('#bf-result'), bars = $$('.progress-steps span', form);
  var NAMES = ['edu', 'year', 'field', 'lang', 'de'];
  var noUni = { matric: 1, hssc: 1, dae: 1, alevel: 1 };
  function show(i) {
    cur = i;
    steps.forEach(function (s, j) { s.classList.toggle('active', j === i); });
    bars.forEach(function (b, j) { b.classList.toggle('done', j <= i); });
    $('#bf-stepno').textContent = 'Question ' + (i + 1) + ' of ' + steps.length;
    back.disabled = i === 0; next.textContent = i === steps.length - 1 ? 'Show my path' : 'Next question';
    var lg = $('legend', steps[i]); if (lg && i > 0) { lg.setAttribute('tabindex', '-1'); lg.focus(); }
  }
  function answers() { var a = {}; NAMES.forEach(function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); a[n] = c ? c.value : null; }); return a; }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'edu' && noUni[e.target.value]) {
      ['year', 'field'].forEach(function (n) { var c = form.querySelector('input[name="' + n + '"][value="na"]'); if (c) c.checked = true; });
    }
  });
  next.addEventListener('click', function () {
    var ok = !!$('input:checked', steps[cur]); $('.f-err', steps[cur]).hidden = ok; if (!ok) return;
    if (cur === 0 && noUni[answers().edu]) { show(3); return; }
    if (cur < steps.length - 1) { show(cur + 1); return; }
    render(answers());
  });
  back.addEventListener('click', function () { if (cur === 3 && noUni[answers().edu]) { show(0); return; } if (cur > 0) show(cur - 1); });

  function evaluate(a) {
    var r = { title: '', fit: 'possible', why: [], check: [], next: [], links: [] };
    var de = +a.de;
    var studienkolleg = function () {
      r.links.push(['Studienkolleg guide', 'studienkolleg.html']);
      r.check.push('Studienkollegs teach in German and usually ask for about B1 for the entrance test; some ask for B2 or more.' + (de < 3 ? ' Your German is below B1 now, so plan for a German course first.' : ''));
    };
    switch (a.edu) {
      case 'matric':
        r.title = 'Complete your HSSC first'; r.fit = 'check';
        r.why.push('Matric alone is not a university entrance qualification for Germany.');
        r.next.push('Finish your HSSC (Intermediate), then choose the Studienkolleg or the 13-year route.');
        break;
      case 'hssc':
        r.title = 'Studienkolleg, or one year at university in Pakistan first'; r.fit = 'match';
        r.why.push('DAAD Pakistan: the HSSC is not equivalent to the German Abitur. You either attend a Studienkolleg in Germany and pass the Feststellungsprüfung, or complete one year of undergraduate study in Pakistan.');
        studienkolleg();
        r.next.push('Compare both options: a Studienkolleg year in Germany, or a first year at an HEC-recognised university in Pakistan in the subject you want to study.');
        r.links.push(['The 13-year route', '13-years.html']);
        break;
      case 'hssc1':
      case 'hssc2':
      case 'bachelor':
        if (a.year === 'partly') {
          r.title = 'Finish your university year first'; r.fit = 'check';
          r.why.push('The route needs one full year with every exam passed, shown on your transcript.');
          r.next.push('Pass the remaining exams and get the official transcript. Until then, the Studienkolleg is the alternative.');
          studienkolleg();
          break;
        }
        if (a.field === 'different') {
          r.title = 'Direct admission only in a related subject'; r.fit = 'check';
          r.why.push('Admission on the 13-year route is subject-restricted: it covers programmes related to what you studied in Pakistan.');
          r.next.push('Either choose a German programme related to your studies, take the Studienkolleg course for the new subject, or study a year of the new subject in Pakistan.');
          studienkolleg();
          break;
        }
        r.title = a.edu === 'bachelor' ? 'Direct application with your degree' : 'Direct application in a related subject (13-year route)';
        r.fit = a.year === 'unsure' || a.field === 'unsure' ? 'possible' : 'match';
        r.why.push('DAAD Pakistan: after one completed year of undergraduate study at a university in Pakistan you can apply for a bachelor’s in the same field, without a Studienkolleg.');
        if (a.year === 'unsure') r.check.push('Check that your university is recognised: HEC’s list and the institution’s status in anabin (H+).');
        if (a.field === 'unsure') r.check.push('Ask the university or uni-assist whether your first-year subjects count as related to the programme you want.');
        if (a.edu === 'hssc2') r.check.push('With a two-year degree or two years of study, more subjects may open. Run the DAAD admission database for your exact qualification.');
        if (a.edu === 'bachelor') r.check.push('With a completed bachelor’s you can usually also apply for a master’s. Check what you want to study.');
        r.next.push('Get your transcript attested by HEC, prepare your language certificate and apply by the deadline.');
        r.links.push(['The 13-year guide', '13-years.html']);
        break;
      case 'dae':
        r.title = 'Check your DAE individually'; r.fit = 'check';
        r.why.push('The three-year DAE diploma is a different qualification from the HSSC. We could not confirm a general rule for it on an official page.');
        r.check.push('Run the DAAD admission database for the DAE, and ask the university or uni-assist.');
        r.next.push('If the DAE is not enough on its own, the Studienkolleg or a year at university may be options.');
        break;
      case 'alevel':
        r.title = 'Check your A-levels'; r.fit = 'possible';
        r.why.push('DAAD Pakistan names A-levels as a qualification that can avoid the Studienkolleg. Whether yours do depends on your subjects and grades.');
        r.check.push('Check uni-assist’s country information and the DAAD admission database for British A-levels with your subjects.');
        r.check.push('You may need an IBCC equivalence certificate for documents used in Pakistan; German universities set their own rules.');
        break;
    }
    if (a.lang === 'de' || a.lang === 'either') r.check.push('German-taught bachelor’s programmes usually ask for German at about C1 before enrolment (for example TestDaF or DSH).' + (de >= 5 ? ' You already report C1 or higher.' : ''));
    if (a.lang === 'en' || a.lang === 'either') r.check.push('English-taught programmes ask for English proof such as IELTS or TOEFL; each sets its own minimum.');
    r.next.push('Read the programme page of every university you apply to: it has the final rules and deadline.');
    return r;
  }
  var FIT = { match: ['Matches your answers', 'match'], possible: ['Possible: check the points below', 'possible'], check: ['Not yet: see what to do', 'check'] };
  function render(a) {
    var r = evaluate(a);
    R.store.set('bachelorPath', { label: r.title, answers: a, at: new Date().toISOString() });
    R.progress.log('bachelor-checker', { edu: a.edu });
    out.innerHTML = '<article class="result-route"><h3>' + esc(r.title) + ' <span class="fit ' + FIT[r.fit][1] + '">' + FIT[r.fit][0] + '</span></h3>' +
      '<h4>Why</h4><ul>' + r.why.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (r.check.length ? '<h4>Check</h4><ul>' + r.check.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<h4>Next steps</h4><ul>' + r.next.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="small muted">An orientation based on DAAD Pakistan’s published rules, last checked ' + esc((window.RAX_BACHELOR || {}).lastReview || '') + '. The university decides.</p>' +
      '<div class="btn-row no-print">' + r.links.map(function (l, i) { return '<a class="btn' + (i ? ' quiet' : '') + '" href="' + l[1] + '">' + esc(l[0]) + '</a>'; }).join('') +
      '<a class="btn quiet" href="apply.html">How to apply</a><button type="button" class="btn quiet" id="bf-again">Start again</button></div></article>';
    out.hidden = false; form.hidden = true; out.focus();
    $('#bf-again').addEventListener('click', function () { out.hidden = true; form.hidden = false; show(0); });
  }
  var saved = R.store.get('bachelorPath', null);
  if (saved && saved.answers) NAMES.forEach(function (n) { var c = saved.answers[n] && form.querySelector('input[name="' + n + '"][value="' + saved.answers[n] + '"]'); if (c) c.checked = true; });
  show(0);
})();
