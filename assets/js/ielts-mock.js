/* IELTS Academic mock-test generator */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, I = window.RAX_IELTS, X = window.RAXI;
  if (!I || !X) return;
  var setup = $('#im-setup'), area = $('#im-area'), res = $('#im-results'), st = null, timer = null;
  var MODS = ['listening', 'reading', 'writing', 'speaking'];
  var NAMES = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
  var MINS = { listening: 32, reading: 60, writing: 60, speaking: 14 };
  function pickBy(obj, key, val) { var c = Object.keys(obj).map(function (k) { return obj[k]; }).filter(function (s) { return s[key] === val; }); return JSON.parse(JSON.stringify(R.pick(c))); }

  function gen() {
    return { idx: 0, practice: $('#im-practice').checked, bands: {},
      listening: [1, 2, 3, 4].map(function (p) { return pickBy(I.listening, 'part', p); }),
      reading: [1, 2, 3].map(function (s) { return pickBy(I.reading, 'slot', s); }),
      t1: R.pick(I.writing.task1), t2: R.pick(I.writing.task2.map(function (x) { return x.prompt; }).concat(I.writing.prompts)),
      p1: R.shuffle(Object.keys(I.speaking.part1)).slice(0, 2), p2: R.pick(I.speaking.part2) };
  }
  function bar(m) {
    return '<div class="sticky-bar"><b>IELTS Academic mock: ' + NAMES[m] + '</b><span class="small muted">Section ' + (st.idx + 1) + ' of 4</span>' +
      (!st.practice ? '<span class="timer" id="im-timer"></span>' : '') + '<button type="button" class="btn small" id="im-finish" style="margin-left:auto">Finish this section</button></div>';
  }
  var CRIT_W = [['Task Achievement / Response', 'Did you cover all parts of the task with relevant, developed ideas?'], ['Coherence and Cohesion', 'Logical paragraphs, clear progression, good linking.'], ['Lexical Resource', 'Range and accuracy of vocabulary.'], ['Grammatical Range and Accuracy', 'Variety of structures with few errors.']];
  var CRIT_S = [['Fluency and Coherence', 'Speaking at length without long pauses, logically.'], ['Lexical Resource', 'Range of words, paraphrasing.'], ['Grammatical Range and Accuracy', 'Mix of simple and complex sentences.'], ['Pronunciation', 'Easy to understand, natural stress and intonation.']];
  function bandSel(id) { var o = ''; for (var b = 9; b >= 3; b -= 0.5) o += '<option value="' + b + '"' + (b === 6 ? ' selected' : '') + '>' + b.toFixed(1) + '</option>'; return '<select id="' + id + '">' + o + '</select>'; }
  function crit(prefix, list) { return '<div class="cols-2">' + list.map(function (c, i) { return '<div class="field"><label for="' + prefix + i + '">' + c[0] + ' <small>' + c[1] + '</small></label>' + bandSel(prefix + i) + '</div>'; }).join('') + '</div>'; }

  function render() {
    var m = MODS[st.idx];
    setup.hidden = true; res.hidden = true; area.hidden = false;
    var h = bar(m);
    if (m === 'listening' || m === 'reading') {
      h += '<p class="muted" style="margin-top:12px">' + (m === 'listening' ? 'Each recording plays once, as in the real test. Read the questions for each part before you press play.' : 'Three passages, 40 questions. Spend about 20 minutes on each passage.') + '</p>';
      h += st[m].map(function (s, i) { return '<section class="panel" id="im-' + m + i + '"></section>'; }).join('');
      area.innerHTML = h;
      st.ctrl = st[m].map(function (s, i) { return RAXP.render($('#im-' + m + i), s, { mode: st.practice ? 'practice' : 'exam', noButton: true, area: 'ielts-mock' }); });
    } else if (m === 'writing') {
      h += '<section class="panel"><h3 style="margin-top:0">Task 1 (spend about 20 minutes, at least 150 words)</h3><p>' + R.esc(st.t1.prompt) + '</p>' + (I.charts[st.t1.id] || '') +
        '<textarea id="im-w1" spellcheck="false"></textarea><p class="small wc" id="im-wc1">0 words</p></section>' +
        '<section class="panel"><h3 style="margin-top:0">Task 2 (spend about 40 minutes, at least 250 words)</h3><p>' + R.esc(st.t2) + '</p><p class="small muted">Give reasons for your answer and include any relevant examples from your own knowledge or experience.</p>' +
        '<textarea id="im-w2" spellcheck="false" style="min-height:320px"></textarea><p class="small wc" id="im-wc2">0 words</p></section>';
      area.innerHTML = h;
      [1, 2].forEach(function (n) { $('#im-w' + n).addEventListener('input', function () { $('#im-wc' + n).textContent = R.words(this.value) + ' words'; }); });
    } else {
      h += '<p class="muted" style="margin-top:12px">Answer aloud. Record yourself, listen back, then rate yourself against the four criteria.</p><div class="btn-row"><button type="button" class="btn quiet" id="im-rec">Record myself</button><span id="im-recplay"></span></div>';
      h += '<section class="panel"><h3 style="margin-top:0">Part 1 (4–5 minutes)</h3>' + st.p1.map(function (t) { return '<h4>' + R.esc(t) + '</h4><ol>' + I.speaking.part1[t].map(function (q) { return '<li>' + R.esc(q) + ' ' + R.speakBtn(q, 'en-GB') + '</li>'; }).join('') + '</ol>'; }).join('') + '</section>';
      h += '<section class="panel"><h3 style="margin-top:0">Part 2 (1 minute to prepare, up to 2 minutes to speak)</h3><div class="text-doc"><p><b>' + R.esc(st.p2.card) + '</b></p><ul>' + st.p2.points.map(function (p) { return '<li>' + R.esc(p) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="btn-row"><span class="timer" id="im-sp-timer">01:00</span><button type="button" class="btn small" id="im-sp-go">Start preparation</button><span class="small muted" id="im-sp-stage"></span></div></section>';
      h += '<section class="panel"><h3 style="margin-top:0">Part 3 (4–5 minutes)</h3><ol>' + st.p2.part3.map(function (q) { return '<li>' + R.esc(q) + ' ' + R.speakBtn(q, 'en-GB') + '</li>'; }).join('') + '</ol></section>';
      area.innerHTML = h;
      var rec = R.recorder(function (url) { $('#im-recplay').innerHTML = '<audio controls src="' + url + '"></audio>'; }), rb = $('#im-rec');
      if (!rec.supported) { rb.disabled = true; rb.textContent = 'Recording not supported here'; }
      rb.addEventListener('click', function () { if (rec.recording()) { rec.stop(); rb.textContent = 'Record myself'; } else rec.start().then(function () { rb.textContent = 'Stop recording'; }).catch(function () { R.toast('Microphone access was blocked.'); }); });
      $('#im-sp-go').addEventListener('click', function () {
        var t = R.timer($('#im-sp-timer'), 60, function () { $('#im-sp-stage').textContent = 'Speak now (2 minutes).'; var t2 = R.timer($('#im-sp-timer'), 120, function () { $('#im-sp-stage').textContent = 'Time.'; }); t2.start(); });
        $('#im-sp-stage').textContent = 'Prepare: make notes.'; t.start();
      });
    }
    $('#im-finish').addEventListener('click', finish);
    if (!st.practice) { if (timer) timer.pause(); timer = R.timer($('#im-timer'), MINS[m] * 60, function () { R.toast('Time is up.'); finish(); }); timer.start(); }
    window.scrollTo(0, area.offsetTop - 70);
  }

  function finish() {
    if (timer) timer.pause();
    var m = MODS[st.idx];
    if (m === 'listening' || m === 'reading') {
      R.stopSpeaking();
      var raw = 0; st.ctrl.forEach(function (c) { raw += c.check(true); });
      var band = m === 'listening' ? X.listening(raw) : X.reading(raw);
      st.bands[m] = { raw: raw, band: band };
      $('#im-finish').disabled = true;
      var note = document.createElement('div'); note.className = 'note';
      note.innerHTML = '<p><b>' + raw + ' / 40 correct: band ' + band.toFixed(1) + '</b> (indicative conversion). Review the answers below, then continue.</p><button type="button" class="btn" id="im-next">Continue</button>';
      area.insertBefore(note, area.children[1]); $('#im-next').addEventListener('click', next); window.scrollTo(0, area.offsetTop - 70);
    } else if (m === 'writing') {
      $$('textarea', area).forEach(function (t) { t.readOnly = true; });
      var w1 = R.words($('#im-w1').value), w2 = R.words($('#im-w2').value);
      var box = document.createElement('div');
      box.innerHTML = '<div class="panel"><h3 style="margin-top:0">Rate your writing</h3><p class="small muted">Task 1: ' + w1 + ' words' + (w1 < 150 ? ' (under 150: lower Task Achievement)' : '') + '. Task 2: ' + w2 + ' words' + (w2 < 250 ? ' (under 250: lower Task Response)' : '') + '. Task 2 counts twice as much as Task 1.</p>' +
        (st.t1.model ? '<details class="layer"><summary>Task 1 model answer</summary><div>' + st.t1.model.split('\n\n').map(function (p) { return '<p>' + R.esc(p) + '</p>'; }).join('') + '</div></details>' : '') +
        '<h4>Task 1</h4>' + crit('ic1-', CRIT_W) + '<h4>Task 2</h4>' + crit('ic2-', CRIT_W) + '<div class="btn-row"><button type="button" class="btn" id="im-wsave">Save rating and continue</button></div></div>';
      area.appendChild(box); $('#im-finish').disabled = true; box.scrollIntoView({ behavior: 'smooth' });
      $('#im-wsave').addEventListener('click', function () {
        var a = 0, b = 0; for (var i = 0; i < 4; i++) { a += +$('#ic1-' + i).value; b += +$('#ic2-' + i).value; }
        var band = X.half((a / 4 + 2 * (b / 4)) / 3);
        st.bands.writing = { band: band }; next();
      });
    } else {
      if (!$('#im-sprate')) {
        var b2 = document.createElement('div'); b2.id = 'im-sprate';
        b2.innerHTML = '<div class="panel"><h3 style="margin-top:0">Rate your speaking</h3>' + crit('isc-', CRIT_S) + '<div class="btn-row"><button type="button" class="btn" id="im-ssave">Save rating and see results</button></div></div>';
        area.appendChild(b2); b2.scrollIntoView({ behavior: 'smooth' });
        $('#im-ssave').addEventListener('click', function () { var s = 0; for (var i = 0; i < 4; i++) s += +$('#isc-' + i).value; st.bands.speaking = { band: X.half(s / 4) }; next(); });
      }
    }
  }
  function next() { st.idx++; if (st.idx < 4) render(); else results(); }
  function results() {
    area.hidden = true; res.hidden = false;
    var B = st.bands, all = [B.listening.band, B.reading.band, B.writing.band, B.speaking.band], ob = X.overall(all);
    res.innerHTML = '<h2 style="margin-top:0">Your IELTS mock result</h2><div class="panel"><div class="score">' + ob.toFixed(1) + '<small> overall band</small></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Section</th><th class="num">Score</th><th class="num">Band</th><th>How</th></tr></thead><tbody>' +
      '<tr><td>Listening</td><td class="num">' + B.listening.raw + ' / 40</td><td class="num">' + B.listening.band.toFixed(1) + '</td><td>marked automatically</td></tr>' +
      '<tr><td>Reading</td><td class="num">' + B.reading.raw + ' / 40</td><td class="num">' + B.reading.band.toFixed(1) + '</td><td>marked automatically</td></tr>' +
      '<tr><td>Writing</td><td class="num"></td><td class="num">' + B.writing.band.toFixed(1) + '</td><td>your own rating</td></tr>' +
      '<tr><td>Speaking</td><td class="num"></td><td class="num">' + B.speaking.band.toFixed(1) + '</td><td>your own rating</td></tr></tbody></table></div>' +
      '<p class="small muted">Raw scores are converted with an indicative table; real cut-offs vary slightly between test versions. Writing and Speaking are self-estimates.</p>' +
      '<div class="btn-row"><button type="button" class="btn" id="im-again">Generate a new mock test</button><a class="btn quiet" href="../progress.html">See all my results</a></div>';
    var h = R.store.get('ieltsHistory', []); h.push({ at: new Date().toISOString(), l: B.listening.band, r: B.reading.band, w: B.writing.band, s: B.speaking.band, overall: ob });
    R.store.set('ieltsHistory', h.slice(-50)); R.progress.log('ielts-mock', { overall: ob });
    $('#im-again').addEventListener('click', function () { res.hidden = true; setup.hidden = false; window.scrollTo(0, 0); });
    hist();
  }
  function hist() {
    var h = R.store.get('ieltsHistory', []), el = $('#im-history'); if (!el) return;
    el.innerHTML = h.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th class="num">L</th><th class="num">R</th><th class="num">W</th><th class="num">S</th><th class="num">Overall</th></tr></thead><tbody>' +
      h.slice().reverse().map(function (r) { return '<tr><td>' + new Date(r.at).toLocaleDateString() + '</td><td class="num">' + r.l + '</td><td class="num">' + r.r + '</td><td class="num">' + r.w + '</td><td class="num">' + r.s + '</td><td class="num"><b>' + r.overall + '</b></td></tr>'; }).join('') + '</tbody></table></div>'
      : '<p class="muted">No mock tests yet. Your results will appear here.</p>';
  }
  $('#im-start').addEventListener('click', function () { st = gen(); R.progress.log('ielts-mock-start', {}); render(); });
  hist();
})();
