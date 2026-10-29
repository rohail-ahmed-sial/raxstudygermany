/* RAX Study Germany visa tools: route finder, checklists, fee table and cost calculator, source filter, planner, Opportunity Card points.
   Everything is saved in this browser only (localStorage via RAX.store). Nothing is sent anywhere. */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, esc = R.esc;
  var V = window.RAX_VISA || { routes: [], figures: {}, sources: [] };
  var ROUTES = {}; V.routes.forEach(function (r) { ROUTES[r.id] = r; });
  var SRC = {}; V.sources.forEach(function (s) { SRC[s.id] = s; });
  var core = document.querySelector('script[src$="assets/js/core.js"]');
  var ROOT = core ? core.getAttribute('src').replace('assets/js/core.js', '') : '../';
  var STATUS_CLS = { 'Verified': 'verified', 'Needs review': 'review', 'Outdated': 'outdated', 'Archived': 'archived' };
  function badge(s) { return '<span class="badge ' + (STATUS_CLS[s] || 'plain') + '">' + esc(s) + '</span>'; }
  function fig(k) { return V.figures[k] || null; }
  function eur(n) { return '€' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function pkr(n) { return 'PKR ' + Math.round(n).toLocaleString('en-GB'); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function twoStep(btn, label, action) {
    var armed = false, orig = btn.textContent;
    btn.addEventListener('click', function () {
      if (!armed) { armed = true; btn.textContent = label; setTimeout(function () { armed = false; btn.textContent = orig; }, 4000); return; }
      armed = false; btn.textContent = orig; action();
    });
  }
  function readJSON(file, done) {
    var fr = new FileReader();
    fr.onload = function () { try { done(JSON.parse(fr.result)); } catch (e) { R.toast('This file could not be read as JSON.'); } };
    fr.readAsText(file);
  }

  /* =========================================================== Opportunity Card points */
  var oc = $('#oc-points');
  if (oc) {
    var ocRun = function () {
      var base = $('#oc-base').value, rec = $('#oc-rec').value, out = $('#oc-out');
      if (rec === 'full') { out.innerHTML = '<b>No points needed.</b> With full recognition you qualify on that basis. You still need the money, insurance and documents.'; return; }
      if (base === 'no') { out.innerHTML = '<b>Basic requirement not met yet.</b> On the points route you first need a state-recognised qualification and German A1 or English B2. Points only count after that.'; return; }
      var pts = (+rec) + (+$('#oc-exp').value) + (+$('#oc-de').value) + (+$('#oc-age').value);
      ['#oc-short', '#oc-en', '#oc-stay', '#oc-partner'].forEach(function (id) { if ($(id).checked) pts += 1; });
      out.innerHTML = '<b>Estimated points: ' + pts + '</b> (minimum 6). ' + (pts >= 6 ? 'This meets the minimum on paper. The mission checks the evidence for each point.' : 'Below the minimum. More German, partial recognition or more experience can add points.');
    };
    $$('#oc-points select, #oc-points input').forEach(function (el) { el.addEventListener('change', ocRun); });
    ocRun();
  }

  /* =========================================================== Route finder */
  var form = $('#finder');
  if (form) {
    var stepsEl = $$('.wizard-step', form), cur = 0, total = stepsEl.length;
    var next = $('#f-next'), back = $('#f-back'), result = $('#f-result');
    var bars = $$('.progress-steps span', form);
    function show(i) {
      cur = i;
      stepsEl.forEach(function (s, j) { s.classList.toggle('active', j === i); });
      bars.forEach(function (b, j) { b.classList.toggle('done', j <= i); });
      $('#f-stepno').textContent = 'Question ' + (i + 1) + ' of ' + total;
      back.disabled = i === 0;
      next.textContent = i === total - 1 ? 'Show my routes' : 'Next question';
      var lg = $('legend', stepsEl[i]); if (lg) { lg.setAttribute('tabindex', '-1'); if (i > 0 || result.hidden === false) lg.focus(); }
    }
    function answers() {
      var a = { have: [] };
      ['purpose', 'stay', 'qual', 'rec', 'age'].forEach(function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); a[n] = c ? c.value : null; });
      $$('input[name="have"]:checked', form).forEach(function (c) { a.have.push(c.value); });
      a.de = +$('#f-de').value; a.en = +$('#f-en').value;
      return a;
    }
    function valid(i) {
      var s = stepsEl[i], err = $('.f-err', s), ok = true;
      if ($('input[type=radio]', s)) ok = !!$('input[type=radio]:checked', s);
      if ($('input[type=checkbox]', s)) ok = !!$('input[type=checkbox]:checked', s);
      err.hidden = ok; return ok;
    }
    $$('input[name="have"]', form).forEach(function (c) {
      c.addEventListener('change', function () {
        if (!c.checked) return;
        if (c.value === 'none') $$('input[name="have"]', form).forEach(function (o) { if (o !== c) o.checked = false; });
        else form.querySelector('input[name="have"][value="none"]').checked = false;
      });
    });
    $$('input[name="qual"]', form).forEach(function (c) {
      c.addEventListener('change', function () { if (c.value === 'school' || c.value === 'none') form.querySelector('input[name="rec"][value="na"]').checked = true; });
    });
    next.addEventListener('click', function () {
      if (!valid(cur)) return;
      if (cur < total - 1) { show(cur + 1); return; }
      var a = answers(); R.store.set('finder', a); render(a); R.progress.log('visa-finder', { purpose: a.purpose });
    });
    back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });

    function evaluate(a) {
      var res = [], seen = {};
      function add(id, fit, why, gaps) {
        if (seen[id]) { var e = seen[id]; e.why = e.why.concat(why || []); e.gaps = e.gaps.concat(gaps || []); return; }
        var r = { id: id, fit: fit, why: why || [], gaps: gaps || [] }; seen[id] = r; res.push(r);
      }
      var has = function (k) { return a.have.indexOf(k) > -1; };
      var qualified = a.qual === 'degree' || a.qual === 'vocational';
      var under35 = ['u18', '18-27', '28-34'].indexOf(a.age) > -1, over45 = a.age === '45+';
      var short = a.stay === 'short';
      var f45 = fig('age45_salary'), f1091 = fig('means_1091');
      var g45 = over45 ? ['Aged 45 or older: a salary of at least ' + (f45 ? f45.display : '') + ' (2026) or proof of pension provision when applying for the first time.'] : [];
      var noLangOC = a.de < 1 && a.en < 1;
      switch (a.purpose) {
        case 'visit':
          add('schengen', short ? 'match' : 'check', ['You plan a visit, tourism or a business trip.'], short ? [] : ['A Schengen visa covers up to 90 days in any 180 days. A longer stay needs a national visa for a specific purpose.']);
          break;
        case 'study':
          if (has('admission')) add('student', 'match', ['You have an admission or conditional admission.']);
          else {
            add('study-applicant', 'possible', ['You want to study but are not admitted yet. This visa lets you look for a study place in Germany.'], ['You need a school-leaving certificate that qualifies for a university or Studienkolleg, and ' + (f1091 ? f1091.display : '') + ' for the whole stay.']);
            add('student', 'possible', ['Once you have an admission letter, this is the main route.'], ['You need an admission or conditional admission first.']);
          }
          if (a.qual === 'school') add('student', 'possible', [], ['With a Pakistani HSSC (Intermediate) alone you usually need a Studienkolleg first, unless you have studied at a recognised university. Check anabin.']);
          if (a.qual === 'none') add('student', 'check', [], ['You need a school-leaving certificate that gives access to higher education.']);
          if (a.de < 3 && a.en < 1) add('student', 'possible', [], ['Most programmes need German (about C1 for German-taught degrees; often B1 for a Studienkolleg test) or English (often IELTS or TOEFL).']);
          if (short) add('schengen', 'check', ['For a short stay of up to 90 days, such as a summer course or a visit to a university, a Schengen visa may be the right type.']);
          break;
        case 'german':
          add('language-course', has('course') ? 'match' : 'possible', ['You want to learn German in Germany.'], has('course') ? [] : ['Book an intensive course with at least 18 lessons a week.']);
          if (short) add('schengen', 'possible', ['For a course of up to 90 days, a Schengen visa may be enough. Check with the mission.']);
          break;
        case 'training':
          if (has('training')) add('ausbildung', 'match', ['You have a training contract or a school-based training place.'], a.de < 3 ? ['Vocational training normally needs German at B1.'] : []);
          else {
            var tg = [];
            if (!under35) tg.push('You must be under 35.');
            if (a.de < 3) tg.push('You need German at B1.');
            if (a.qual === 'none') tg.push('You need a school-leaving certificate that gives access to higher education.');
            add('training-seeker', tg.length ? 'check' : 'possible', ['You want an Ausbildung but have no training place yet.'], tg);
            add('ausbildung', 'possible', ['Once you have a training contract, this is the main route.'], ['You need a training contract or school place first.']);
          }
          break;
        case 'work':
          var job = has('job');
          if (!qualified) {
            add('ausbildung', 'check', ['Most work routes need a degree or at least two years of vocational training. Vocational training in Germany can be a way in.']);
          }
          if (a.qual === 'degree' && a.rec === 'full') {
            if (job) {
              add('blue-card', 'match', ['You have a comparable degree and a job offer.'], ['Check the salary threshold for 2026 and that the job matches your degree.']);
              add('skilled', 'match', ['You have a recognised or comparable degree and a job offer.'], g45);
            } else {
              add('opportunity', 'match', ['With a fully recognised or comparable qualification you can look for work without points.']);
              add('blue-card', 'possible', ['Once you have a qualifying job offer.'], ['You need a job offer of at least six months.']);
            }
          }
          if (a.qual === 'vocational' && a.rec === 'full') {
            add('skilled', job ? 'match' : 'possible', ['Your vocational qualification is recognised in Germany.'], (job ? [] : ['You need a concrete job offer.']).concat(g45));
            if (!job) add('opportunity', 'match', ['With a fully recognised qualification you can look for work without points.']);
          }
          if (qualified && a.rec !== 'full') {
            var rg = a.rec === 'unchecked' || a.rec === 'na' ? ['Check how your qualification is classified (anabin, ZAB or the Recognition Finder).'] : [];
            if (job) {
              add('experienced', 'possible', ['You have a job offer and a qualification that may be state-recognised at home.'], ['Two years of related experience in the last five years.', 'The job must be in a non-regulated profession.'].concat(g45, rg));
              add('recognition', 'possible', ['Your employer could support your recognition through a recognition partnership.'], (a.de < 2 ? ['German at A2 is required.'] : []).concat(rg));
            } else {
              add('opportunity', noLangOC ? 'check' : 'possible', ['You could look for a job on the points route.'], (noLangOC ? ['You need German A1 or English B2.'] : []).concat(['You need at least 6 points. Use the points estimator on the Opportunity Card page.'], rg));
              if (a.rec === 'partial') add('recognition', 'possible', ['You have a partial recognition and could complete it with a recognition measure in Germany.'], a.de < 2 ? ['Usually German at A2.'] : []);
            }
          }
          add('self-employment', 'check', ['If you plan to run your own business or work freelance rather than take a job.']);
          if (short) add('schengen', 'check', ['Business meetings of up to 90 days use a Schengen visa. Working in Germany normally needs a national visa, even for a short period.']);
          break;
        case 'jobsearch':
          if (qualified) add('opportunity', a.rec === 'full' ? 'match' : (noLangOC ? 'check' : 'possible'), ['You want to look for a job with a degree or vocational qualification.'],
            a.rec === 'full' ? [] : (noLangOC ? ['You need German A1 or English B2.'] : []).concat(['You need at least 6 points on the points route.']));
          else add('opportunity', 'check', ['The Opportunity Card is for people with a degree or at least two years of vocational training.'], ['You do not seem to have a qualifying degree or training yet.']);
          if (a.qual !== 'none') add('study-applicant', 'check', ['If you are looking for a place at a university.']);
          add('training-seeker', under35 && a.de >= 3 ? 'possible' : 'check', ['If you are looking for a training place (Ausbildung).'], (under35 ? [] : ['You must be under 35.']).concat(a.de >= 3 ? [] : ['You need German at B1.']));
          break;
        case 'research':
          add('research', has('hosting') ? 'match' : 'possible', ['You plan to do research.'], (has('hosting') ? [] : ['You need a hosting agreement or contract with a recognised research institution.']).concat(a.qual === 'degree' ? [] : ['You need a degree that gives access to doctoral programmes, or a PhD.']));
          break;
        case 'family':
          var fg = has('family') ? [] : ['The family member must live in Germany with a residence status that allows family reunification.'];
          if (a.age === 'u18') fg.push('Different rules apply to children. Children aged 16–17 may need German at C1 in certain cases.');
          else if (a.de < 1) fg.push('Spouses usually need German at A1 (certificate not older than one year), unless an exception applies.');
          add('family', has('family') ? 'match' : 'possible', ['You want to join a family member in Germany.'], fg);
          if (short) add('schengen', 'possible', ['For a family visit of up to 90 days, use a Schengen visa.']);
          break;
        case 'other':
          var ap = [];
          if (a.age !== '18-27') ap.push('The German Missions in Pakistan list an age of 18 to 27 for au pairs.');
          if (a.de < 1) ap.push('Au pairs need German at A1.');
          add('au-pair', ap.length ? 'check' : 'possible', ['If you want to live with a host family and help with childcare.'], ap);
          add('volunteer', 'possible', ['If you want to do a voluntary service.'], has('agreement') ? [] : ['You need a contract with a recognised voluntary service provider.']);
          add('internship', 'possible', ['If you want an internship related to your studies.'], ['You must be enrolled at a university abroad or have graduated within the last two years.']);
          break;
      }
      if (a.age === 'u18' && a.purpose !== 'family') res.forEach(function (r) { r.gaps.push('Most routes are for adults. Ask the mission about the rules for applicants under 18.'); });
      var order = { match: 0, possible: 1, check: 2 };
      res.sort(function (x, y) { return order[x.fit] - order[y.fit]; });
      return res;
    }
    var FIT = { match: ['Matches your answers', 'match'], possible: ['Possible: conditions to meet', 'possible'], check: ['Worth checking', 'check'] };
    function routeHTML(x) {
      var r = ROUTES[x.id]; if (!r) return '';
      var money = r.finance.map(function (k) { var f = fig(k); return f ? '<li><b>' + esc(f.display) + '</b> ' + esc(f.applies) + (f.status !== 'Verified' ? ' ' + badge(f.status) : '') + '</li>' : ''; }).join('');
      var srcs = r.sources.map(function (id) { var s = SRC[id]; return s ? '<li><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.title) + '</a> ' + badge(s.status) + '</li>' : ''; }).join('');
      return '<article class="result-route"><h3>' + esc(r.name) + ' <span class="fit ' + FIT[x.fit][1] + '">' + FIT[x.fit][0] + '</span></h3><p class="small muted">' + esc(r.basis) + '</p>' +
        '<h4>Why this route appears</h4><ul>' + x.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
        '<h4>Conditions to verify</h4><ul>' + x.gaps.map(function (g) { return '<li class="gap">' + esc(g) + '</li>'; }).join('') + r.verify.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>' +
        (money ? '<h4>Money to check</h4><ul>' + money + '</ul>' : '') +
        '<h4>Language to check</h4><p>' + esc(r.language) + '</p>' +
        '<h4>First checklist</h4><ul>' + r.checklist.slice(0, 7).map(function (c) { return '<li>' + esc(c[0]) + '</li>'; }).join('') + '<li><a href="checklists.html#' + r.id + '">Full checklist with statuses and notes</a></li></ul>' +
        '<h4>Official sources</h4><ul>' + srcs + '</ul>' +
        '<div class="btn-row no-print"><a class="btn" href="' + ROOT + r.page + '">Read the guide</a><a class="btn quiet" href="checklists.html#' + r.id + '">Open the checklist</a><a class="btn quiet" href="planner.html#' + r.id + '">Plan this application</a></div></article>';
    }
    function render(a) {
      var res = evaluate(a);
      var html = '<h2 id="your-routes">Your possible routes</h2><p class="small muted">Based on your answers. Information last verified: ' + esc(V.lastReview || '') + '.</p>' +
        '<div class="caution"><p><b>This is not an eligibility decision.</b> It shows routes worth looking at, based on a few answers. The German mission and the authorities decide, using the full rules and your documents. No visa, appointment, processing time or approval is guaranteed.</p></div>';
      html += res.length ? res.map(routeHTML).join('') : '<p>We could not match a route to these answers. Browse <a href="index.html#routes">all routes</a>.</p>';
      html += '<h3>Next actions</h3><ol><li>Read the guide for the first route above, then the official pages linked in it.</li><li>Open the German Missions in Pakistan page for your category and download its latest checklist. <a href="pakistan.html">Applying from Pakistan</a>.</li>' +
        '<li>Work through your <a href="checklists.html">checklist</a> and mark anything that needs official verification.</li><li>Compare every amount with the official page before you pay into a blocked account. <a href="fees-and-finance.html">Fees and financing</a>.</li>' +
        '<li>Register only through official, free channels. Never pay an agent for an appointment.</li></ol>';
      html += '<div class="btn-row no-print"><button type="button" class="btn quiet" id="f-again">Start again</button><button type="button" class="btn quiet" id="f-print">Print</button><button type="button" class="btn quiet" id="f-txt">Download as text</button></div>';
      result.innerHTML = html; result.hidden = false; form.hidden = true; result.focus();
      $('#f-again').addEventListener('click', function () { result.hidden = true; form.hidden = false; show(0); });
      $('#f-print').addEventListener('click', function () { window.print(); });
      $('#f-txt').addEventListener('click', function () {
        var t = 'RAX Study Germany: possible visa routes\nCreated ' + today() + '. Information last verified: ' + V.lastReview + '.\nThis is not an eligibility decision.\n\n';
        res.forEach(function (x) { var r = ROUTES[x.id]; t += r.name + ' (' + r.basis + ') - ' + FIT[x.fit][0] + '\nWhy: ' + x.why.join(' ') + '\nTo verify:\n' + x.gaps.concat(r.verify).map(function (g) { return '- ' + g; }).join('\n') + '\nLanguage: ' + r.language + '\nSources:\n' + r.sources.map(function (id) { return '- ' + SRC[id].title + ': ' + SRC[id].url + ' [' + SRC[id].status + ']'; }).join('\n') + '\n\n'; });
        t += V.disclaimer + '\n';
        R.download('raxstudygermany-visa-routes-' + today() + '.txt', t, 'text/plain');
      });
    }
    var saved = R.store.get('finder', null);
    if (saved && saved.purpose) {
      ['purpose', 'stay', 'qual', 'rec', 'age'].forEach(function (n) { var c = saved[n] && form.querySelector('input[name="' + n + '"][value="' + saved[n] + '"]'); if (c) c.checked = true; });
      (saved.have || []).forEach(function (v) { var c = form.querySelector('input[name="have"][value="' + v + '"]'); if (c) c.checked = true; });
      $('#f-de').value = saved.de || 0; $('#f-en').value = saved.en || 0;
      var p = document.createElement('p'); p.className = 'small';
      p.innerHTML = 'Your last answers are filled in. <button type="button" class="btn quiet small" id="f-last">Show my last result</button>';
      form.insertBefore(p, form.firstChild.nextSibling);
      $('#f-last').addEventListener('click', function () { render(saved); });
    }
    show(0);
  }

  /* =========================================================== Checklists */
  var clSel = $('#cl-route');
  if (clSel) {
    var STAT = { todo: 'Not started', doing: 'In progress', review: 'Ready for review', done: 'Completed', verify: 'Needs official verification', na: 'Not applicable' };
    var statOpts = Object.keys(STAT).map(function (k) { return '<option value="' + k + '">' + STAT[k] + '</option>'; }).join('');
    var secs = $$('.checklist');
    var key = function (id) { return 'cl.' + id; };
    function state(id) { return R.store.get(key(id), { items: {}, custom: [] }); }
    function save(id, st) { st.updated = new Date().toISOString(); R.store.set(key(id), st); }
    function progress(sec) {
      var rows = $$('.check-item', sec), c = { done: 0, verify: 0, na: 0, doing: 0, review: 0 };
      rows.forEach(function (row) { var v = $('select', row).value; if (c[v] != null) c[v]++; row.setAttribute('data-status', v); });
      var relevant = rows.length - c.na;
      $('.cl-progress', sec).innerHTML = '<b>' + c.done + ' of ' + relevant + '</b> completed' + (c.review ? ', ' + c.review + ' ready for review' : '') + (c.doing ? ', ' + c.doing + ' in progress' : '') + (c.verify ? ', <b>' + c.verify + ' need official verification</b>' : '') + (c.na ? ', ' + c.na + ' not applicable' : '') + '.';
    }
    function customRow(sec, it, idx) {
      var div = document.createElement('div');
      div.className = 'check-item custom'; div.setAttribute('data-custom', idx);
      div.innerHTML = '<div class="ci-text"><label class="vh" for="cu-' + sec.dataset.route + '-' + idx + '">Your item</label><input type="text" id="cu-' + sec.dataset.route + '-' + idx + '" placeholder="Your own item" value="' + esc(it.t || '') + '"></div>' +
        '<select aria-label="Status of your item">' + statOpts + '</select><textarea rows="2" placeholder="Notes" aria-label="Notes for your item">' + esc(it.n || '') + '</textarea>' +
        '<button type="button" class="btn quiet small ci-remove">Remove</button>';
      $('select', div).value = it.s || 'todo';
      return div;
    }
    function collect(sec) {
      var id = sec.dataset.route, st = state(id);
      st.items = {};
      $$('.ci-list .check-item', sec).forEach(function (row) { st.items[row.dataset.key] = { s: $('select', row).value, n: $('textarea', row).value }; });
      st.custom = $$('.ci-custom .check-item', sec).map(function (row) { return { t: $('input', row).value, s: $('select', row).value, n: $('textarea', row).value }; });
      save(id, st); progress(sec);
    }
    function load(sec) {
      var id = sec.dataset.route, st = state(id);
      $$('.ci-list .check-item', sec).forEach(function (row) { var v = st.items[row.dataset.key] || {}; $('select', row).value = v.s || 'todo'; $('textarea', row).value = v.n || ''; });
      var box = $('.ci-custom', sec); box.innerHTML = '';
      (st.custom || []).forEach(function (it, i) { box.appendChild(customRow(sec, it, i)); });
      progress(sec);
    }
    function asList(sec) {
      var out = [];
      $$('.ci-list .check-item', sec).forEach(function (row) { out.push({ item: $('.ci-text b', row).textContent, note: ($('.ci-text small', row) || {}).textContent || '', status: $('select', row).value, statusLabel: STAT[$('select', row).value], notes: $('textarea', row).value }); });
      $$('.ci-custom .check-item', sec).forEach(function (row) { out.push({ item: $('input', row).value, custom: true, status: $('select', row).value, statusLabel: STAT[$('select', row).value], notes: $('textarea', row).value }); });
      return out;
    }
    secs.forEach(function (sec) {
      var id = sec.dataset.route;
      load(sec);
      sec.addEventListener('change', function () { collect(sec); });
      var tmr; sec.addEventListener('input', function (e) { if (e.target.matches('textarea, input[type=text]')) { clearTimeout(tmr); tmr = setTimeout(function () { collect(sec); }, 400); } });
      sec.addEventListener('click', function (e) {
        if (e.target.classList.contains('ci-remove')) { e.target.closest('.check-item').remove(); collect(sec); }
      });
      $('[data-add]', sec).addEventListener('click', function () {
        var box = $('.ci-custom', sec), row = customRow(sec, {}, box.children.length);
        box.appendChild(row); $('input', row).focus(); collect(sec);
      });
      $$('[data-export]', sec).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var r = ROUTES[id], list = asList(sec);
          if (btn.dataset.export === 'json') {
            R.download('raxstudygermany-checklist-' + id + '-' + today() + '.json', JSON.stringify({ app: 'RAX Study Germany', type: 'checklist', route: id, routeName: r.name, exportedAt: new Date().toISOString(), informationLastVerified: V.lastReview, items: list }, null, 2), 'application/json');
          } else {
            var t = 'RAX Study Germany checklist: ' + r.name + ' (' + r.basis + ')\nExported ' + today() + '. Information last verified: ' + V.lastReview + '.\n\n';
            list.forEach(function (it) { t += '[' + it.statusLabel + '] ' + it.item + (it.notes ? '\n    Notes: ' + it.notes : '') + '\n'; });
            t += '\nAlways compare with the latest checklist of the German mission responsible for you.\n' + V.disclaimer + '\n';
            R.download('raxstudygermany-checklist-' + id + '-' + today() + '.txt', t, 'text/plain');
          }
        });
      });
      $('[data-print]', sec).addEventListener('click', function () { window.print(); });
      twoStep($('[data-clear]', sec), 'Click again to clear', function () { R.store.remove(key(id)); load(sec); R.toast('Checklist cleared.'); });
    });
    function showRoute(id) {
      if (!ROUTES[id]) id = V.routes[0].id;
      secs.forEach(function (s) { s.hidden = s.dataset.route !== id; });
      clSel.value = id; R.store.set('clRoute', id);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }
    clSel.addEventListener('change', function () { showRoute(clSel.value); });
    window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (ROUTES[h]) showRoute(h); });
    $('#cl-import').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      readJSON(f, function (obj) {
        if (!obj || !R.isApp(obj.app) || obj.type !== 'checklist' || !ROUTES[obj.route]) { R.toast('This is not a RAX Study Germany checklist file.'); return; }
        var sec = $('#cl-' + obj.route), st = { items: {}, custom: [] };
        var fixed = $$('.ci-list .check-item', sec);
        obj.items.forEach(function (it) {
          if (it.custom) { st.custom.push({ t: it.item, s: it.status, n: it.notes }); return; }
          fixed.forEach(function (row) { if ($('.ci-text b', row).textContent === it.item) st.items[row.dataset.key] = { s: it.status, n: it.notes }; });
        });
        save(obj.route, st); load(sec); showRoute(obj.route); R.toast('Checklist imported.');
      });
      this.value = '';
    });
    var h = location.hash.slice(1);
    showRoute(ROUTES[h] ? h : R.store.get('clRoute', V.routes[0].id));
  }

  /* =========================================================== Fee table filter */
  function filterTable(table, countEl, test, noun) {
    var rows = $$('tbody tr', table), n = 0;
    rows.forEach(function (tr) { var ok = test(tr); tr.hidden = !ok; if (ok) n++; });
    if (countEl) countEl.textContent = 'Showing ' + n + ' of ' + rows.length + ' ' + noun + '.';
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function niceDate(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0] : esc(iso || ''); }
  var feeTable = $('#fee-table');
  if (feeTable) {
    /* Rebuild the table from visa-data.js so that edits to the data file show up everywhere. */
    $('tbody', feeTable).innerHTML = Object.keys(V.figures).map(function (k) {
      var f = V.figures[k], s = SRC[f.source] || {};
      var rids = V.routes.filter(function (r) { return r.finance.indexOf(k) > -1 || r.id === f.route; }).map(function (r) { return r.id; }).join(' ');
      return '<tr data-route="' + rids + '" data-status="' + esc(f.status) + '"><td><b>' + esc(f.display) + '</b></td><td>' + esc(f.applies) + '</td><td>' + esc(f.jurisdiction) + '</td><td>' + badge(f.status) + '</td><td>' + niceDate(f.checked) + '</td><td><a href="' + esc(s.url || '#') + '" rel="noopener">' + esc(s.topic || f.source) + '</a></td></tr>';
    }).join('');
    var fr = $('#fee-route'), fs = $('#fee-status');
    var runFees = function () { filterTable(feeTable, $('#fee-count'), function (tr) { return (!fr.value || (' ' + tr.dataset.route + ' ').indexOf(' ' + fr.value + ' ') > -1) && (!fs.value || tr.dataset.status === fs.value); }, 'figures'); };
    fr.addEventListener('change', runFees); fs.addEventListener('change', runFees); runFees();
  }

  /* =========================================================== Cost calculator */
  var calc = $('#cost-calc');
  if (calc) {
    var CFG = {
      'student': { m: 'blocked_study_month', max: 24, fee: 'visa_fee_national', extra: ['blocked_sig_fee'] },
      'study-applicant': { m: 'means_1091', max: 9, fee: 'visa_fee_national', extra: [] },
      'language-course': { m: 'means_1091', max: 12, fee: 'visa_fee_national', extra: [] },
      'training-seeker': { m: 'means_1091', max: 9, fee: 'visa_fee_national', extra: [] },
      'opportunity': { m: 'means_1091', max: 12, fee: 'visa_fee_national', extra: [] },
      'schengen': { m: null, max: 3, fee: 'visa_fee_schengen', extra: [] },
      'family': { m: null, max: 24, fee: 'visa_fee_national', extra: [] }
    };
    var saved2 = R.store.get('costCalc', null);
    var ids = ['cc-route', 'cc-months', 'cc-rate', 'cc-ins', 'cc-prov', 'cc-flight', 'cc-docs'];
    if (saved2) ids.forEach(function (i) { if (saved2[i] != null && $('#' + i)) $('#' + i).value = saved2[i]; });
    var runCalc = function () {
      var c = CFG[$('#cc-route').value], months = Math.max(1, Math.round(+$('#cc-months').value || 1)), rate = +$('#cc-rate').value || 0;
      var num = function (id) { return Math.max(0, +$('#' + id).value || 0); };
      var rows = [], warn = [], show = 0, pay = 0;
      if (months > c.max) warn.push('This route usually allows up to ' + c.max + ' months; check the rules.');
      if (c.m) { var mf = fig(c.m); show = mf.amount * months; rows.push(['Money to show: ' + months + ' × ' + eur(mf.amount), show, 'show']); }
      else rows.push(['Money to show', null, 'show', c === CFG.schengen ? 'Set by the mission’s checklist for your trip. Verify current requirement.' : 'Depends on the sponsor’s income and situation. Verify current requirement.']);
      var ff = fig(c.fee); rows.push(['Visa fee (paid in PKR)', ff.amount, 'pay']); pay += ff.amount;
      c.extra.forEach(function (k) { var f = fig(k); rows.push([f.applies, f.amount, 'pay']); pay += f.amount; });
      var ins = num('cc-ins') * months; if (ins) { rows.push(['Health insurance: ' + months + ' × ' + eur(num('cc-ins')), ins, 'pay']); pay += ins; }
      [['cc-prov', 'Blocked account provider fees'], ['cc-flight', 'Flight'], ['cc-docs', 'Translations and copies']].forEach(function (p) { var v = num(p[0]); if (v) { rows.push([p[1], v, 'pay']); pay += v; } });
      var conv = function (v) { return rate ? '<span class="muted"> ≈ ' + pkr(v * rate) + '</span>' : ''; };
      var html = '<div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="num">Estimate</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + esc(r[0]) + (r[2] === 'show' ? ' <span class="small muted">(stays your money)</span>' : '') + '</td><td class="num">' + (r[1] == null ? esc(r[3]) : eur(r[1]) + conv(r[1])) + '</td></tr>'; }).join('') +
        '<tr class="total"><td><b>Costs you pay</b></td><td class="num"><b>' + eur(pay) + '</b>' + conv(pay) + '</td></tr>' +
        (show ? '<tr class="total"><td><b>Money to show plus costs</b></td><td class="num"><b>' + eur(show + pay) + '</b>' + conv(show + pay) + '</td></tr>' : '') + '</tbody></table></div>';
      if (!rate) warn.push('Enter today’s exchange rate to see amounts in PKR.');
      html += warn.map(function (w) { return '<p class="small muted">' + esc(w) + '</p>'; }).join('');
      html += '<p class="small muted">Estimate created with figures last checked on ' + esc(V.lastReview) + '. The mission sets its own PKR rate for fees.</p>';
      $('#cc-out').innerHTML = html;
      var st = {}; ids.forEach(function (i) { st[i] = $('#' + i).value; }); R.store.set('costCalc', st);
    };
    $('#cc-route').addEventListener('change', function () {
      var r = $('#cc-route').value; if (r === 'student') $('#cc-months').value = 12; else if (r === 'schengen') $('#cc-months').value = 1; runCalc();
    });
    ids.slice(1).forEach(function (i) { $('#' + i).addEventListener('input', runCalc); });
    runCalc();
  }

  /* =========================================================== Source database filter */
  var srcTable = $('#src-table');
  if (srcTable) {
    $('tbody', srcTable).innerHTML = V.sources.map(function (s) {
      return '<tr data-status="' + esc(s.status) + '" data-route="' + esc(s.route) + '"><td><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.title) + '</a><br><span class="small muted">' + esc(s.summary) + '</span></td><td>' + esc(s.topic) + '</td><td>' + esc(s.jur) + '</td><td>' + badge(s.status) + '</td><td>' + niceDate(s.checked) + '</td></tr>';
    }).join('');
    var q = $('#src-q'), ss = $('#src-status'), sr = $('#src-route');
    var runSrc = function () {
      var term = q.value.trim().toLowerCase();
      filterTable(srcTable, $('#src-count'), function (tr) { return (!term || tr.textContent.toLowerCase().indexOf(term) > -1) && (!ss.value || tr.dataset.status === ss.value) && (!sr.value || tr.dataset.route === sr.value); }, 'sources');
    };
    q.addEventListener('input', runSrc); ss.addEventListener('change', runSrc); sr.addEventListener('change', runSrc); runSrc();
  }

  /* =========================================================== Planner */
  var pl = $('#planner');
  if (pl) {
    var EVID = {
      'student': 'Admission or conditional admission', 'study-applicant': 'Shortlist programmes and prepare applications', 'language-course': 'Book and pay for an intensive course (18+ lessons a week)',
      'ausbildung': 'Training contract (and approval)', 'training-seeker': 'Plan your search for a training place', 'skilled': 'Job offer and declaration of employment',
      'blue-card': 'Job offer of at least six months and declaration of employment', 'experienced': 'Job offer, work certificates for two years of experience', 'opportunity': 'Evidence for each point you claim',
      'recognition': 'Recognition partnership agreement or place in a recognition measure', 'research': 'Hosting agreement and cost commitment', 'self-employment': 'Business plan and proof of capital',
      'au-pair': 'Au pair contract with a host family', 'volunteer': 'Agreement with a voluntary service provider', 'internship': 'Internship agreement and host’s cost commitment'
    };
    var REC = { 'student': 'Check your school certificate in anabin', 'skilled': 'Recognition of your qualification', 'blue-card': 'Check your degree in anabin or get a Statement of Comparability', 'experienced': 'anabin or ZAB evidence that your qualification is state-recognised', 'opportunity': 'Recognition or anabin / ZAB evaluation', 'recognition': 'Deficit notice or evaluation of your qualification' };
    function stepsFor(id) {
      var r = ROUTES[id], s = [];
      s.push({ k: 'route', t: 'Confirm your route', d: 'Read the guide and the German mission’s page for your category. Download its latest checklist.' });
      if (id === 'schengen') {
        s.push({ k: 'wait', t: 'Register on the waiting list', d: 'Free online registration. One appointment per person. Apply up to six months before travel.' });
        s.push({ k: 'videx', t: 'Fill in the Videx form', d: 'Print it with the barcode.' });
        s.push({ k: 'ins', t: 'Travel health insurance', d: 'At least €30,000 cover, valid in all Schengen states for the whole trip.' });
        s.push({ k: 'docs', t: 'Collect documents', d: 'Invitation, bookings, bank statements, proof of ties to Pakistan.' });
      } else if (id === 'family') {
        s.push({ k: 'lang', t: 'German A1 certificate (if required)', d: r.language });
        s.push({ k: 'docs', t: 'NADRA documents, Nikah Nama and translations', d: 'Originals and an English translation of the Nikah Nama.' });
        s.push({ k: 'sponsor', t: 'Sponsor’s documents from Germany', d: 'Residence permit, registration certificate, proof of income and living space if required.' });
        s.push({ k: 'apply', t: 'Apply on the Consular Services Portal', d: 'Islamabad: portal only. Karachi: follow the current instructions.' });
      } else {
        s.push({ k: 'lang', t: 'Language certificate', d: r.language });
        if (REC[id]) s.push({ k: 'rec', t: REC[id], d: 'Recognition can take months. Start early.' });
        s.push({ k: 'evidence', t: EVID[id] || 'Main evidence for your route', d: '' });
        if (r.finance.length) s.push({ k: 'finance', t: 'Financing', d: r.finance.map(function (k) { var f = fig(k); return f ? f.display + ': ' + f.applies : ''; }).join('. ') });
        s.push({ k: 'ins', t: 'Health insurance', d: 'Cover from the day you arrive.' });
        s.push({ k: 'docs', t: 'Documents, translations and certified copies', d: 'Use the checklist for your route.' });
        s.push({ k: 'apply', t: 'Apply online or register for an appointment', d: 'Only through official, free channels.' });
      }
      s.push({ k: 'appt', t: 'Visa appointment', d: 'Bring your passport (signed), originals and the fee in PKR.' });
      s.push({ k: 'decision', t: 'Decision and passport collection', d: 'Processing times vary. Do not book non-refundable travel before you have the visa.' });
      s.push({ k: 'travel', t: 'Travel to Germany', d: 'Uses your planned travel date.' });
      if (r.long) s.push({ k: 'after', t: 'After arrival: register your address and apply for your residence permit', d: 'Register within two weeks. Apply before your visa expires.' });
      return s;
    }
    var plSel = $('#pl-route'), travel = $('#pl-travel'), list = $('#pl-steps'), sum = $('#pl-summary');
    var plans = function () { return R.store.get('plans', {}); };
    function plan(id) { return plans()[id] || { travel: '', steps: {} }; }
    function savePlan(id, p) { var all = plans(); p.updated = new Date().toISOString(); all[id] = p; R.store.set('plans', all); }
    function draw() {
      var id = plSel.value, p = plan(id), s = stepsFor(id);
      travel.value = p.travel || '';
      list.innerHTML = s.map(function (st) {
        var v = p.steps[st.k] || {};
        var date = st.k === 'travel' ? '<span class="small">' + (p.travel ? esc(p.travel) : 'Set the travel date above') + '</span>' : '<input type="date" data-date="' + st.k + '" value="' + esc(v.date || '') + '" aria-label="Target date: ' + esc(st.t) + '">';
        return '<li class="pl-step" data-k="' + st.k + '"><div class="pl-head"><label class="pl-done"><input type="checkbox" data-pdone="' + st.k + '"' + (v.done ? ' checked' : '') + '><span>' + esc(st.t) + '</span></label>' + date + '</div>' +
          (st.d ? '<p class="small muted">' + esc(st.d) + '</p>' : '') + '<p class="pl-warn small" hidden></p>' +
          '<textarea rows="1" data-note="' + st.k + '" placeholder="Notes" aria-label="Notes: ' + esc(st.t) + '">' + esc(v.note || '') + '</textarea></li>';
      }).join('');
      summarise();
    }
    function collectPlan() {
      var id = plSel.value, p = plan(id);
      p.travel = travel.value;
      $$('.pl-step', list).forEach(function (li) {
        var k = li.dataset.k, d = $('[data-date]', li), n = $('[data-note]', li), c = $('[data-pdone]', li);
        p.steps[k] = { date: d ? d.value : '', done: c.checked, note: n.value };
      });
      savePlan(id, p); summarise();
    }
    function summarise() {
      var id = plSel.value, p = plan(id), steps = $$('.pl-step', list), done = 0, t = today(), warns = 0;
      steps.forEach(function (li) {
        var k = li.dataset.k, v = p.steps[k] || {}, w = $('.pl-warn', li), msg = '';
        if (v.done) done++;
        var d = k === 'travel' ? p.travel : v.date;
        if (d && !v.done && d < t) msg = 'This date has passed and the step is not marked done.';
        if (d && p.travel && d > p.travel && k !== 'after' && k !== 'travel') msg = 'This date is after your planned travel date.';
        w.textContent = msg; w.hidden = !msg; if (msg) warns++;
        li.classList.toggle('is-done', !!v.done);
      });
      var days = p.travel ? Math.round((new Date(p.travel) - new Date(t)) / 86400000) : null;
      sum.innerHTML = '<p><b>' + done + ' of ' + steps.length + '</b> steps done.' + (days != null ? ' Planned travel: <b>' + esc(p.travel) + '</b> (' + (days >= 0 ? days + ' days from today' : Math.abs(days) + ' days ago') + ').' : ' Set a planned travel date to check your timeline.') +
        (warns ? ' <b>' + warns + (warns === 1 ? ' date needs' : ' dates need') + ' attention.</b>' : '') + '</p>';
    }
    plSel.addEventListener('change', function () { R.store.set('planRoute', plSel.value); if (history.replaceState) history.replaceState(null, '', '#' + plSel.value); draw(); });
    travel.addEventListener('change', function () { collectPlan(); draw(); });
    list.addEventListener('change', collectPlan);
    var pt; list.addEventListener('input', function (e) { if (e.target.matches('textarea')) { clearTimeout(pt); pt = setTimeout(collectPlan, 400); } });
    $('#pl-export').addEventListener('click', function () {
      var id = plSel.value, p = plan(id), r = ROUTES[id];
      var out = { app: 'RAX Study Germany', type: 'visa-plan', route: id, routeName: r.name, travel: p.travel, exportedAt: new Date().toISOString(), informationLastVerified: V.lastReview,
        note: 'Preparation plan only. Nothing has been submitted to any authority.', steps: stepsFor(id).map(function (s) { var v = p.steps[s.k] || {}; return { key: s.k, step: s.t, date: s.k === 'travel' ? p.travel : (v.date || ''), done: !!v.done, note: v.note || '' }; }) };
      R.download('raxstudygermany-visa-plan-' + id + '-' + today() + '.json', JSON.stringify(out, null, 2), 'application/json');
    });
    $('#pl-import').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      readJSON(f, function (obj) {
        if (!obj || !R.isApp(obj.app) || obj.type !== 'visa-plan' || !ROUTES[obj.route]) { R.toast('This is not a RAX Study Germany plan file.'); return; }
        var p = { travel: obj.travel || '', steps: {} };
        (obj.steps || []).forEach(function (s) { p.steps[s.key] = { date: s.key === 'travel' ? '' : s.date, done: !!s.done, note: s.note || '' }; });
        savePlan(obj.route, p); plSel.value = obj.route; draw(); R.toast('Plan imported.');
      });
      this.value = '';
    });
    $('#pl-print').addEventListener('click', function () { window.print(); });
    twoStep($('#pl-clear'), 'Click again to clear', function () { var all = plans(); delete all[plSel.value]; R.store.set('plans', all); draw(); R.toast('Plan cleared.'); });
    var ph = location.hash.slice(1);
    plSel.value = ROUTES[ph] ? ph : R.store.get('planRoute', V.routes[0].id);
    if (!ROUTES[plSel.value]) plSel.value = V.routes[0].id;
    draw();
  }
})();
