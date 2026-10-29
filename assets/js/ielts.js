/* IELTS tools: band conversion, band calculator, writing pad, speaking cards with timers */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$;
  var I = window.RAX_IELTS || {};

  /* Indicative raw-score conversion (official anchor points: 16→5, 23→6, 30→7, 35→8; exact cut-offs vary by test version) */
  var LIST = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  var READ = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  function conv(table, raw) { raw = Math.max(0, Math.min(40, Math.round(raw))); for (var i = 0; i < table.length; i++) if (raw >= table[i][0]) return table[i][1]; return 0; }
  function overall(bands) {
    var avg = bands.reduce(function (a, b) { return a + b; }, 0) / bands.length;
    var fl = Math.floor(avg), fr = avg - fl;
    return fr < 0.25 ? fl : (fr < 0.75 ? fl + 0.5 : fl + 1);
  }
  function halfRound(x) { return Math.round(x * 2) / 2; }
  window.RAXI = { listening: function (r) { return conv(LIST, r); }, reading: function (r) { return conv(READ, r); }, overall: overall, half: halfRound };

  /* ---------- band calculator ---------- */
  var calc = $('#band-calc');
  if (calc) {
    var fields = ['lr', 'rr', 'wb', 'sb'];
    var saved = R.store.get('bandCalc', {});
    fields.forEach(function (f) { if (saved[f] != null) $('#' + f).value = saved[f]; });
    function run() {
      var lr = $('#lr').value, rr = $('#rr').value, wb = +$('#wb').value, sb = +$('#sb').value;
      var lb = lr === '' ? null : conv(LIST, +lr), rb = rr === '' ? null : conv(READ, +rr);
      $('#lb-out').textContent = lb == null ? '–' : lb.toFixed(1);
      $('#rb-out').textContent = rb == null ? '–' : rb.toFixed(1);
      var parts = [lb, rb, wb || null, sb || null];
      var out = $('#ob-out'), expl = $('#ob-expl');
      if (parts.some(function (p) { return p == null; })) { out.textContent = '–'; expl.textContent = 'Enter all four scores to see your overall band.'; return; }
      var avg = parts.reduce(function (a, b) { return a + b; }, 0) / 4, ob = overall(parts);
      out.textContent = ob.toFixed(1);
      expl.textContent = 'Average ' + parts.map(function (p) { return p.toFixed(1); }).join(' + ') + ' ÷ 4 = ' + avg.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + ', which rounds to ' + ob.toFixed(1) + '.';
      R.store.set('bandCalc', { lr: lr, rr: rr, wb: $('#wb').value, sb: $('#sb').value });
    }
    fields.forEach(function (f) { $('#' + f).addEventListener('input', run); $('#' + f).addEventListener('change', run); });
    run();
    var wt1 = $('#wt1'), wt2 = $('#wt2');
    if (wt1) {
      var wrun = function () {
        if (!wt1.value || !wt2.value) { $('#wt-out').textContent = '–'; return; }
        var w = (+wt1.value + 2 * +wt2.value) / 3;
        $('#wt-out').textContent = halfRound(w).toFixed(1) + ' (weighted average ' + w.toFixed(2) + ')';
      };
      wt1.addEventListener('change', wrun); wt2.addEventListener('change', wrun);
    }
  }

  /* ---------- writing pad ---------- */
  var pad = $('#ielts-pad');
  if (pad && I.writing) {
    var cur = null, timer = null;
    var text = $('#ip-text'), wc = $('#ip-wc');
    function prompt(kind) {
      if (kind === 't1') { var t = R.pick(I.writing.task1); return { kind: 't1', min: 150, mins: 20, html: '<p><b>Task 1 (' + R.esc(t.type) + ')</b> ' + R.esc(t.prompt) + '</p>' + (I.charts[t.id] || ''), model: t.model }; }
      var all = I.writing.task2.map(function (x) { return { p: x.prompt, model: x.model }; }).concat(I.writing.prompts.map(function (p) { return { p: p }; }));
      var c = R.pick(all);
      return { kind: 't2', min: 250, mins: 40, html: '<p><b>Task 2</b> ' + R.esc(c.p) + '</p><p class="small muted">Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.</p>', model: c.model };
    }
    $('#ip-new').addEventListener('click', function () {
      cur = prompt($('#ip-kind').value);
      $('#ip-task').innerHTML = cur.html; $('#ip-task').hidden = false;
      [$('#ip-bar'), text, $('#ip-actions')].forEach(function (e) { e.hidden = false; });
      text.value = ''; $('#ip-feedback').innerHTML = '';
      if (timer) timer.pause();
      timer = R.timer($('#ip-timer'), cur.mins * 60, function () { R.toast('Time is up.'); });
      $('#ip-start').textContent = 'Start timer'; update();
    });
    $('#ip-start').addEventListener('click', function () { if (!timer) return; if (timer.running()) { timer.pause(); this.textContent = 'Continue timer'; } else { timer.start(); this.textContent = 'Pause timer'; } });
    function update() { var n = R.words(text.value); wc.textContent = n + ' words' + (cur ? (n < cur.min ? ' (minimum ' + cur.min + ')' : ' ✓') : ''); }
    text.addEventListener('input', update);
    $('#ip-check').addEventListener('click', function () {
      var n = R.words(text.value), paras = text.value.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
      var linkers = (text.value.match(/\b(however|moreover|furthermore|in addition|on the other hand|therefore|as a result|for example|for instance|in conclusion|overall|whereas|while|although)\b/gi) || []);
      var items = [
        [n >= cur.min, n + ' words. ' + (n >= cur.min ? 'Meets the minimum.' : 'Below the minimum of ' + cur.min + ': this lowers your Task ' + (cur.kind === 't1' ? 'Achievement' : 'Response') + ' score.')],
        [paras >= (cur.kind === 't1' ? 3 : 4), paras + ' paragraphs. ' + (cur.kind === 't1' ? 'Aim for introduction, overview and two body paragraphs.' : 'Aim for introduction, two or three body paragraphs and a conclusion.')],
        [linkers.length >= 4, linkers.length + ' linking words found' + (linkers.length ? ' (' + linkers.slice(0, 6).join(', ') + ')' : '') + '. Use a range, but do not overuse them.']
      ];
      if (cur.kind === 't1') items.push([/\boverall\b|\bin general\b|\bit is clear\b/i.test(text.value), 'Overview sentence: ' + (/\boverall\b|\bin general\b|\bit is clear\b/i.test(text.value) ? 'found.' : 'not found. A clear overview of the main trends is essential for band 6+.')]);
      if (cur.kind === 't2') items.push([/\b(in my (opinion|view)|i (believe|think|agree|disagree))\b/i.test(text.value), 'Your position: ' + (/\b(in my (opinion|view)|i (believe|think|agree|disagree))\b/i.test(text.value) ? 'stated.' : 'not clear. State your opinion in the introduction and conclusion.')]);
      $('#ip-feedback').innerHTML = '<div class="panel">' + items.map(function (it) { return '<div class="feedback ' + (it[0] ? 'ok' : 'no') + '">' + R.esc(it[1]) + '</div>'; }).join('') +
        (cur.model ? '<details class="layer"><summary>Model answer</summary><div>' + cur.model.split('\n\n').map(function (p) { return '<p>' + R.esc(p) + '</p>'; }).join('') + '</div></details>' : '') +
        '<p class="small muted" style="margin:10px 0 0">These checks cover length, structure and linking only. Use the band descriptor summary on this page to judge ideas, vocabulary and grammar.</p></div>';
      R.progress.log('ielts-writing', { kind: cur.kind, words: n });
    });
  }

  /* ---------- speaking ---------- */
  var p1 = $('#sp1-new');
  if (p1 && I.speaking) {
    p1.addEventListener('click', function () {
      var topics = R.shuffle(Object.keys(I.speaking.part1)).slice(0, 2);
      $('#sp1-out').innerHTML = topics.map(function (t) { return '<h4>' + R.esc(t) + '</h4><ol>' + I.speaking.part1[t].map(function (q) { return '<li>' + R.esc(q) + ' ' + R.speakBtn(q, 'en-GB', 'Hear the question') + '</li>'; }).join('') + '</ol>'; }).join('');
    });
    var p2 = $('#sp2-new'), stage = null, t2 = null;
    p2.addEventListener('click', function () {
      var c = R.pick(I.speaking.part2);
      $('#sp2-out').innerHTML = '<div class="text-doc" style="max-width:460px"><p><b>' + R.esc(c.card) + '</b></p><p class="small">You should say:</p><ul>' + c.points.map(function (p) { return '<li>' + R.esc(p) + '</li>'; }).join('') + '</ul></div>' +
        '<details class="layer"><summary>Part 3 discussion questions</summary><div><ol>' + c.part3.map(function (q) { return '<li>' + R.esc(q) + '</li>'; }).join('') + '</ol></div></details>';
      $('#sp2-timerbox').hidden = false; $('#sp2-stage').textContent = 'Preparation: 1 minute. Make notes.';
      if (t2) t2.pause();
      t2 = R.timer($('#sp2-timer'), 60, function () {
        $('#sp2-stage').textContent = 'Now speak for up to 2 minutes.';
        t2 = R.timer($('#sp2-timer'), 120, function () { $('#sp2-stage').textContent = 'Time. The examiner may ask one short follow-up question.'; });
        t2.start();
      });
    });
    $('#sp2-start').addEventListener('click', function () { if (t2) t2.start(); });
    var recBtn = $('#isp-rec');
    var rec = R.recorder(function (url) { $('#isp-play').innerHTML = '<audio controls src="' + url + '" style="width:100%;max-width:420px"></audio>'; });
    if (!rec.supported) { recBtn.disabled = true; recBtn.textContent = 'Recording not supported in this browser'; }
    recBtn.addEventListener('click', function () {
      if (rec.recording()) { rec.stop(); recBtn.textContent = 'Record myself'; R.progress.log('ielts-speaking', {}); }
      else rec.start().then(function () { recBtn.textContent = 'Stop recording'; }).catch(function () { R.toast('Microphone access was blocked.'); });
    });
    p1.click(); p2.click();
  }
})();
