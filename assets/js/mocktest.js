/* Goethe A1 / A2 mock-test generator: random sets per part, timed modules, scoring with the official pass rules */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$;
  var SETS = window.RAX_SETS || {}, TASKS = window.RAX_SCHREIBEN || [], FORMS = window.RAX_A1FORMS || [], SP = window.RAX_SPRECHEN || {};
  var setup = $('#mt-setup'), area = $('#mt-area'), resBox = $('#mt-results');
  var state = null, timer = null;

  var CONF = {
    A1: { lesen: { min: 25, parts: [1, 2, 3], factor: 25 / 15 }, hoeren: { min: 20, parts: [1, 2, 3], factor: 25 / 15 }, schreiben: { min: 20 }, sprechen: {} },
    A2: { lesen: { min: 30, parts: [1, 2, 3, 4], factor: 1.25 }, hoeren: { min: 30, parts: [1, 2, 3, 4], factor: 1.25 }, schreiben: { min: 30 }, sprechen: {} }
  };
  var NAMES = { lesen: 'Lesen (reading)', hoeren: 'Hören (listening)', schreiben: 'Schreiben (writing)', sprechen: 'Sprechen (speaking)' };
  function pickSet(level, module, part) {
    var c = Object.keys(SETS).map(function (k) { return SETS[k]; }).filter(function (s) { return s.level === level && s.module === module && s.part === part; });
    return c.length ? JSON.parse(JSON.stringify(R.pick(c))) : null;
  }
  function generate(level) {
    var g = { level: level, practice: $('#mt-practice').checked, modules: ['lesen', 'hoeren', 'schreiben', 'sprechen'], idx: 0, scores: {}, sets: {} };
    ['lesen', 'hoeren'].forEach(function (m) {
      var n = 1;
      g.sets[m] = CONF[level][m].parts.map(function (p) { var s = pickSet(level, m, p); if (s) { s.startAt = n; n += s.items.length; } return s; }).filter(Boolean);
    });
    if (level === 'A2') g.sets.schreiben = [R.pick(TASKS.filter(function (t) { return t.kind === 'sms'; })), R.pick(TASKS.filter(function (t) { return t.kind === 'email' || t.kind === 'extra'; }))];
    else g.sets.schreiben = [R.pick(FORMS), R.pick(TASKS.filter(function (t) { return t.kind === 'a1'; }))];
    return g;
  }

  function header(m) {
    var conf = CONF[state.level][m];
    return '<div class="sticky-bar"><b>' + state.level + ' mock test: ' + NAMES[m] + '</b><span class="small muted">Module ' + (state.idx + 1) + ' of 4</span>' +
      (conf.min && !state.practice ? '<span class="timer" id="mt-timer"></span>' : '') +
      '<button type="button" class="btn small" id="mt-finish" style="margin-left:auto">Finish this module</button></div>';
  }
  function startTimer(min) {
    if (timer) timer.pause();
    var el = $('#mt-timer'); if (!el) return;
    timer = R.timer(el, min * 60, function () { R.toast('Time is up for this module.'); finishModule(); });
    timer.start();
  }

  function renderModule() {
    var m = state.modules[state.idx], conf = CONF[state.level][m];
    area.hidden = false; setup.hidden = true; resBox.hidden = true;
    var html = header(m);
    if (m === 'lesen' || m === 'hoeren') {
      html += '<p class="muted" style="margin-top:12px">' + (m === 'hoeren' ? 'Recordings are read by your browser’s German voice. In exam mode each recording plays as often as in the real exam (once or twice).' : 'Answer every question; wrong answers cost nothing.') + '</p>';
      html += state.sets[m].map(function (s, i) { return '<section class="panel" id="mt-' + m + '-' + i + '"></section>'; }).join('');
      area.innerHTML = html;
      state.ctrl = state.sets[m].map(function (s, i) { return RAXP.render($('#mt-' + m + '-' + i), s, { mode: state.practice ? 'practice' : 'exam', noButton: true, area: 'mock' }); });
    } else if (m === 'schreiben') {
      area.innerHTML = html + schreibenHTML();
      $$('textarea[data-wc]', area).forEach(function (ta) {
        var out = $('#' + ta.getAttribute('data-wc'));
        ta.addEventListener('input', function () { out.textContent = R.words(ta.value) + ' words'; });
      });
    } else {
      area.innerHTML = html + sprechenHTML();
      var rec = R.recorder(function (url) { $('#mt-recplay').innerHTML = '<audio controls src="' + url + '" style="width:100%;max-width:420px"></audio>'; });
      var rb = $('#mt-rec');
      if (!rec.supported) { rb.disabled = true; rb.textContent = 'Recording not supported here'; }
      rb.addEventListener('click', function () {
        if (rec.recording()) { rec.stop(); rb.textContent = 'Record myself'; }
        else rec.start().then(function () { rb.textContent = 'Stop recording'; }).catch(function () { R.toast('Microphone access was blocked.'); });
      });
    }
    $('#mt-finish').addEventListener('click', finishModule);
    if (conf.min && !state.practice) startTimer(conf.min);
    window.scrollTo(0, area.offsetTop - 70);
  }

  function taskBlock(t, label, idx) {
    var pts = t.pts.map(function (p, i) { return '<li><b>' + (i + 1) + '</b><span>' + R.esc(p) + '</span></li>'; }).join('');
    return '<section class="panel"><h3 style="margin-top:0">' + label + '</h3><div class="text-doc"><p>' + R.esc(t.sit) + '</p>' + (pts ? '<ol class="points" style="list-style:none;padding:0">' + pts + '</ol>' : '') + '</div>' +
      '<details class="layer"><summary>Meaning in English</summary><div><p class="muted">' + R.esc(t.sit_en + ' ' + t.pts_en.map(function (p, i) { return (i + 1) + '. ' + p; }).join(' ')) + '</p></div></details>' +
      '<label for="mt-w' + idx + '" class="vh">Your text</label><textarea id="mt-w' + idx + '" data-wc="mt-wc' + idx + '" placeholder="Write here …" spellcheck="false"></textarea><p class="small"><span class="wc" id="mt-wc' + idx + '">0 words</span></p></section>';
  }
  function schreibenHTML() {
    var s = state.sets.schreiben, h = '';
    if (state.level === 'A2') {
      h += taskBlock(s[0], 'Teil 1: SMS to a friend (du, 20–30 words)', 0) + taskBlock(s[1], 'Teil 2: e-mail (Sie, 30–40 words)', 1);
    } else {
      var f = s[0];
      h += '<section class="panel"><h3 style="margin-top:0">Teil 1: fill in the form</h3><div class="text-doc"><p>' + R.esc(f.text) + '</p></div><div class="cols-2">' +
        f.fields.map(function (fl, i) { return '<div class="field"><label for="mt-f' + i + '">' + R.esc(fl[0]) + ' <small>(' + R.esc(fl[2]) + ')</small></label><input type="text" id="mt-f' + i + '" data-answer="' + R.esc(fl[1]) + '" autocomplete="off"></div>'; }).join('') + '</div></section>';
      h += taskBlock(s[1], 'Teil 2: short message (about 30 words)', 1);
    }
    return h;
  }
  function sprechenHTML() {
    var h = '<p class="muted" style="margin-top:12px">Speak your answers aloud (record yourself if you like), then rate yourself honestly. In the real exam you speak with a partner and two examiners.</p>';
    h += '<div class="btn-row"><button type="button" class="btn quiet" id="mt-rec">Record myself</button><span id="mt-recplay"></span></div>';
    if (state.level === 'A1') {
      var th = R.pick(Object.keys(SP.a1t2)), w = R.shuffle(SP.a1t2[th]).slice(0, 2), rq = R.shuffle(SP.a1t3).slice(0, 2);
      h += part('Teil 1: introduce yourself', 'Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby. Then spell your name and say your phone number.', 3);
      h += part('Teil 2: ask and answer (Thema: ' + th + ')', 'Ask a question with each word: ' + w.map(function (x) { return x[0]; }).join(', ') + '. Example: ' + w[0][1], 6);
      h += part('Teil 3: requests', 'Make a request with each card: ' + rq.map(function (x) { return x[0]; }).join(', ') + '. Example: ' + rq[0][1], 6);
    } else {
      var c1 = R.shuffle(SP.a2t1).slice(0, 4), c2 = R.pick(SP.a2t2), c3 = R.pick(SP.a2t3);
      h += part('Teil 1: questions about the person', 'Ask a question with each card: ' + c1.map(function (x) { return x[0]; }).join(', ') + ' and answer your partner.', 5);
      h += part('Teil 2: talk about yourself', '„' + c2.card + '“: ' + c2.points.join(', ') + '. Speak for about one minute.', 10);
      h += part('Teil 3: plan something together', c3.task + ' Your diary: ' + c3.a.map(function (r) { return r[0] + ' ' + (r[1] || 'frei'); }).join('; ') + '.', 10);
    }
    return h;
  }
  var partN = 0;
  function part(title, task, max) {
    partN++;
    var opts = [[1, 'Fully done, easy to understand'], [0.7, 'Mostly done, a few problems'], [0.4, 'Partly done, often hard to understand'], [0, 'Not done']];
    return '<section class="panel sp-part" data-max="' + max + '"><h3 style="margin-top:0">' + R.esc(title) + '</h3><p>' + R.esc(task) + '</p><fieldset><legend>How did it go?</legend>' +
      opts.map(function (o, i) { return '<label class="choice"><input type="radio" name="sp-' + partN + '" value="' + o[0] + '"><span>' + o[1] + '</span></label>'; }).join('') + '</fieldset></section>';
  }

  function rubric(idx, kind) {
    var t = state.sets.schreiben[idx];
    var lv = [['5', 'A: complete and clear'], ['3.5', 'B: mostly'], ['2', 'C: partly'], ['0.5', 'D: hardly'], ['0', 'E: not at all']];
    function sel(name, label) { return '<div class="field"><label for="' + name + '">' + label + '</label><select id="' + name + '">' + lv.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>'; }
    return '<div class="panel"><h4 style="margin-top:0">' + (idx ? 'Teil 2' : 'Teil 1') + ': compare with the model answer, then rate yourself</h4><div class="answer"><p>' + R.esc(t.answer).replace(/\n/g, '<br>') + '</p></div>' +
      '<div class="controls">' + sel('rb-a' + idx, 'Task completion (all 3 points, right tone)') + sel('rb-s' + idx, 'Language (understandable, varied)') + '</div></div>';
  }

  function finishModule() {
    if (timer) timer.pause();
    var m = state.modules[state.idx], conf = CONF[state.level][m];
    if (m === 'lesen' || m === 'hoeren') {
      var raw = 0, max = 0;
      state.ctrl.forEach(function (c) { raw += c.check(true); max += c.total; });
      state.scores[m] = { raw: raw, max: max, points: Math.round(raw * conf.factor * 10) / 10 };
      R.stopSpeaking();
      afterModule('You scored ' + raw + ' of ' + max + ' (' + state.scores[m].points + ' of 25 points). Check the green answers below, then continue.');
    } else if (m === 'schreiben') {
      state.texts = $$('textarea', area).map(function (t) { return t.value; });
      $$('textarea', area).forEach(function (t) { t.readOnly = true; });
      var h = '';
      if (state.level === 'A2') { h = rubric(0) + rubric(1); }
      else {
        var ok = 0;
        $$('input[data-answer]', area).forEach(function (inp) {
          var want = inp.getAttribute('data-answer').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim(), got = inp.value.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
          var good = got && (got === want || want.split(' ').every(function (p) { return got.indexOf(p) >= 0; }));
          inp.style.borderColor = good ? 'var(--ok)' : 'var(--bad)'; if (!good) inp.title = 'Answer: ' + inp.getAttribute('data-answer'); if (good) ok++;
        });
        state.formScore = ok;
        var t = state.sets.schreiben[1];
        h = '<div class="panel"><p><b>Form: ' + ok + ' of 5 correct.</b></p><h4>Teil 2: compare with the model answer, then rate each point</h4><div class="answer"><p>' + R.esc(t.answer).replace(/\n/g, '<br>') + '</p></div>' +
          [1, 2, 3].map(function (n) { return '<div class="field"><label for="rb-p' + n + '">Point ' + n + '</label><select id="rb-p' + n + '"><option value="3">Answered clearly (3)</option><option value="1.5">Partly (1.5)</option><option value="0">Missing (0)</option></select></div>'; }).join('') +
          '<div class="field"><label for="rb-f">Greeting and closing fit the person</label><select id="rb-f"><option value="1">Yes (1)</option><option value="0">No (0)</option></select></div></div>';
      }
      var box = document.createElement('div'); box.innerHTML = h + '<div class="btn-row"><button type="button" class="btn" id="mt-rate">Save my rating and continue</button></div>';
      area.appendChild(box);
      $('#mt-finish').disabled = true;
      $('#mt-rate').addEventListener('click', function () {
        var pts;
        if (state.level === 'A2') { pts = (+$('#rb-a0').value + +$('#rb-s0').value + +$('#rb-a1').value + +$('#rb-s1').value) * 1.25; state.scores.schreiben = { raw: pts / 1.25, max: 20, points: Math.round(pts * 10) / 10 }; }
        else { var raw = state.formScore + (+$('#rb-p1').value) + (+$('#rb-p2').value) + (+$('#rb-p3').value) + (+$('#rb-f').value); state.scores.schreiben = { raw: raw, max: 15, points: Math.round(raw * 25 / 15 * 10) / 10 }; }
        next();
      });
      box.scrollIntoView({ behavior: 'smooth' });
      return;
    } else {
      var sum = 0, maxs = 0, missing = false;
      $$('.sp-part', area).forEach(function (p) {
        var mx = +p.getAttribute('data-max'), r = $('input:checked', p); maxs += mx;
        if (!r) missing = true; else sum += mx * (+r.value);
      });
      if (missing) { R.toast('Rate every part first.'); return; }
      var pts2 = state.level === 'A1' ? sum * 25 / 15 : sum;
      state.scores.sprechen = { raw: sum, max: maxs, points: Math.round(pts2 * 10) / 10 };
      return next();
    }
  }
  function afterModule(msg) {
    var fin = $('#mt-finish'); fin.disabled = true;
    var box = document.createElement('div'); box.className = 'note'; box.innerHTML = '<p>' + R.esc(msg) + '</p><button type="button" class="btn" id="mt-next">Continue</button>';
    area.insertBefore(box, area.children[1]);
    $('#mt-next').addEventListener('click', next);
    window.scrollTo(0, area.offsetTop - 70);
  }
  function next() { state.idx++; if (state.idx < state.modules.length) renderModule(); else results(); }

  function grade(total) { return total >= 90 ? 'sehr gut' : total >= 80 ? 'gut' : total >= 70 ? 'befriedigend' : total >= 60 ? 'ausreichend' : 'nicht bestanden'; }
  function results() {
    area.hidden = true; resBox.hidden = false;
    var S = state.scores, written = S.lesen.points + S.hoeren.points + S.schreiben.points, oral = S.sprechen.points;
    var total = Math.round(written + oral);
    var rules = state.level === 'A2'
      ? [['At least 60 of 100 points', total >= 60], ['At least 45 of 75 in the written exam', written >= 45], ['At least 15 of 25 in Sprechen', oral >= 15]]
      : [['At least 60 of 100 points', total >= 60]];
    var pass = rules.every(function (r) { return r[1]; });
    var rows = ['lesen', 'hoeren', 'schreiben', 'sprechen'].map(function (m) {
      return '<tr><td>' + NAMES[m] + '</td><td class="num">' + (Math.round(S[m].raw * 10) / 10) + ' / ' + S[m].max + '</td><td class="num">' + S[m].points + ' / 25</td><td>' + (m === 'schreiben' || m === 'sprechen' ? 'your own rating' : 'marked automatically') + '</td></tr>';
    }).join('');
    resBox.innerHTML = '<h2 style="margin-top:0">Your ' + state.level + ' mock result</h2>' +
      '<div class="cols-2"><div class="panel"><div class="score">' + total + '<small> / 100</small></div><p style="margin:8px 0 0"><span class="badge ' + (pass ? 'verified' : 'outdated') + '">' + (pass ? 'Passed' : 'Not passed yet') + '</span> Grade: <b>' + grade(pass ? total : 0) + '</b></p></div>' +
      '<div class="panel"><ul style="margin:0;list-style:none;padding:0">' + rules.map(function (r) { return '<li>' + (r[1] ? '✓ ' : '✗ ') + r[0] + '</li>'; }).join('') + '<li class="small muted">Written: ' + Math.round(written * 10) / 10 + ' / 75, oral: ' + oral + ' / 25</li></ul></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Module</th><th class="num">Raw</th><th class="num">Points</th><th>How</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="small muted">Lesen and Hören are marked automatically. Schreiben and Sprechen are your own estimate; real examiners may be stricter or kinder. Use the result to find your weakest module.</p>' +
      '<div class="btn-row"><button type="button" class="btn" id="mt-again">Generate a new mock test</button><a class="btn quiet" href="../progress.html">See all my results</a></div>';
    var hist = R.store.get('mockHistory', []);
    hist.push({ at: new Date().toISOString(), level: state.level, lesen: S.lesen.points, hoeren: S.hoeren.points, schreiben: S.schreiben.points, sprechen: S.sprechen.points, total: total, pass: pass });
    R.store.set('mockHistory', hist.slice(-50));
    R.progress.log('mock', { level: state.level, total: total, pass: pass });
    $('#mt-again').addEventListener('click', function () { resBox.hidden = true; setup.hidden = false; window.scrollTo(0, 0); });
    drawHistory();
  }
  function drawHistory() {
    var h = R.store.get('mockHistory', []), el = $('#mt-history');
    if (!el) return;
    if (!h.length) { el.innerHTML = '<p class="muted">No mock tests yet. Your results will appear here.</p>'; return; }
    el.innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Level</th><th class="num">Lesen</th><th class="num">Hören</th><th class="num">Schreiben</th><th class="num">Sprechen</th><th class="num">Total</th><th>Result</th></tr></thead><tbody>' +
      h.slice().reverse().map(function (r) { return '<tr><td>' + new Date(r.at).toLocaleDateString() + '</td><td>' + r.level + '</td><td class="num">' + r.lesen + '</td><td class="num">' + r.hoeren + '</td><td class="num">' + r.schreiben + '</td><td class="num">' + r.sprechen + '</td><td class="num"><b>' + r.total + '</b></td><td>' + (r.pass ? 'passed' : 'not yet') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  $('#mt-start').addEventListener('click', function () {
    var level = $('input[name="mt-level"]:checked').value;
    state = generate(level);
    R.progress.log('mock-start', { level: level });
    renderModule();
  });
  drawHistory();
})();
