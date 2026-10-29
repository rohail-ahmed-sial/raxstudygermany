/* Schreiben pages: cover answers, mark tasks as written, search, A1 form check, writing pad */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$;

  /* ---------- cover / uncover model answers ---------- */
  function setCover(on) {
    $$('[data-answer]').forEach(function (a) { a.classList.toggle('covered', on); a.setAttribute('aria-hidden', on ? 'true' : 'false'); });
    $$('[data-uncover]').forEach(function (b) { b.textContent = on ? 'Show answer' : 'Hide answer'; });
  }
  var coverAll = $('#cover-all');
  if (coverAll) {
    var pref = R.store.get('coverAnswers', true);
    coverAll.checked = pref; setCover(pref);
    coverAll.addEventListener('change', function () { R.store.set('coverAnswers', coverAll.checked); setCover(coverAll.checked); });
  } else {
    // pages without the switch (A1 messages on the hub): covered by default
    $$('.task[data-kind="a1"] [data-answer]').forEach(function (a) { a.classList.add('covered'); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-uncover]');
    var a = e.target.closest('[data-answer].covered');
    if (b) {
      var box = b.closest('.task-sec').querySelector('[data-answer]');
      var cov = box.classList.toggle('covered');
      box.setAttribute('aria-hidden', cov ? 'true' : 'false');
      b.textContent = cov ? 'Show answer' : 'Hide answer';
    } else if (a) {
      a.classList.remove('covered'); a.setAttribute('aria-hidden', 'false');
      var ub = a.closest('.task-sec').querySelector('[data-uncover]'); if (ub) ub.textContent = 'Hide answer';
    }
  });

  /* ---------- mark as written ---------- */
  function drawDone() {
    var n = 0;
    $$('[data-done]').forEach(function (b) {
      var id = b.getAttribute('data-done'), d = R.progress.isDone(id);
      if (d) n++;
      b.textContent = d ? 'Written ✓ (undo)' : 'Mark as written';
      b.setAttribute('aria-pressed', d ? 'true' : 'false');
    });
    var dc = $('#done-count');
    if (dc) dc.textContent = n + ' of ' + $$('[data-done]').length + ' written';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-done]');
    if (!b) return;
    var id = b.getAttribute('data-done');
    if (R.progress.isDone(id)) R.progress.unmark(id); else { R.progress.markDone(id); R.progress.log('schreiben', { id: id }); }
    drawDone();
  });
  drawDone();

  /* ---------- search in task banks ---------- */
  var search = $('#bank-search');
  if (search) {
    var cards = $$('#bank .task'), count = $('#bank-count');
    var run = function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      cards.forEach(function (c) {
        var hit = !q || c.getAttribute('data-title').indexOf(q) >= 0 || c.id.toLowerCase() === q;
        c.hidden = !hit; if (hit) shown++;
      });
      count.textContent = shown + ' tasks';
    };
    search.addEventListener('input', run); run();
  }

  /* ---------- A1 form check ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim(); }
  $$('[data-check-form]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.a1-form'), ok = 0, inputs = $$('input[data-answer]', box);
      inputs.forEach(function (inp) {
        var want = norm(inp.getAttribute('data-answer')), got = norm(inp.value);
        var good = got && (got === want || want.split(', ').every(function (p) { return got.indexOf(p) >= 0; }));
        inp.style.borderColor = good ? 'var(--ok)' : 'var(--bad)';
        inp.title = good ? 'Correct' : 'Answer: ' + inp.getAttribute('data-answer');
        if (!good && got === '') inp.placeholder = inp.getAttribute('data-answer');
        if (good) ok++;
      });
      $('.form-result', box).textContent = ok + ' of ' + inputs.length + ' correct. Hover or tap a red field to see the answer.';
      R.progress.log('a1form', { id: box.getAttribute('data-form'), score: ok });
    });
  });

  /* ---------- writing pad ---------- */
  var pad = $('#pad');
  if (!pad || !window.RAX_SCHREIBEN) return;
  var TASKS = window.RAX_SCHREIBEN, current = [], timer = null;
  var kindSel = $('#pad-kind'), taskBox = $('#pad-task'), text = $('#pad-text'), wc = $('#pad-wc'), fb = $('#pad-feedback'), modelBox = $('#pad-modelbox');
  var LIMITS = { sms: [20, 30, 10], email: [30, 40, 15], extra: [30, 40, 15], a1: [25, 35, 10] };
  function pool(kind) { return TASKS.filter(function (t) { return kind === 'email' ? (t.kind === 'email' || t.kind === 'extra') : t.kind === kind; }); }
  function taskHTML(t, label) {
    var pts = t.pts.map(function (p, i) { return '<li><b>' + (i + 1) + '</b><span>' + R.esc(p) + '</span></li>'; }).join('');
    var en = t.sit_en + (t.pts_en.length ? ' ' + t.pts_en.map(function (p, i) { return (i + 1) + '. ' + p; }).join(' ') : '');
    return '<h4 style="margin-top:0">' + (label ? label + ': ' : '') + R.esc(t.id) + ' ' + R.esc(t.title) + '</h4><p>' + R.esc(t.sit) + '</p>' +
      (pts ? '<ol class="points" style="list-style:none;padding:0">' + pts + '</ol>' : '') +
      '<details class="layer"><summary>Meaning in English</summary><div><p class="muted">' + R.esc(en) + '</p></div></details>';
  }
  $('#pad-new').addEventListener('click', function () {
    var k = kindSel.value;
    if (k === 'exam') current = [R.pick(pool('sms')), R.pick(pool('email'))];
    else current = [R.pick(pool(k))];
    taskBox.innerHTML = current.map(function (t, i) { return taskHTML(t, current.length > 1 ? (i ? 'Teil 2' : 'Teil 1') : ''); }).join('<hr>');
    [taskBox, $('#pad-bar'), text, $('#pad-actions')].forEach(function (el) { el.hidden = false; });
    text.value = ''; fb.innerHTML = ''; modelBox.hidden = true; modelBox.innerHTML = '';
    var mins = k === 'exam' ? 30 : (k === 'sms' ? 10 : (k === 'a1' ? 10 : 15));
    if (timer) timer.pause();
    timer = R.timer($('#pad-timer'), mins * 60, function () { R.toast('Time is up. Finish your sentence and check your text.'); });
    $('#pad-start').textContent = 'Start timer';
    $('#pad-form').textContent = current.map(function (t) { return t.id + ': write with ' + (t.form || 'du'); }).join(' · ');
    if (k === 'exam') text.placeholder = 'Write Teil 1 first, then an empty line, then Teil 2 …';
    updateWC(); text.focus();
  });
  $('#pad-start').addEventListener('click', function () {
    if (!timer) return;
    if (timer.running()) { timer.pause(); this.textContent = 'Continue timer'; } else { timer.start(); this.textContent = 'Pause timer'; }
  });
  function parts() {
    if (current.length < 2) return [text.value];
    var p = text.value.split(/\n\s*\n/);
    return [p[0] || '', p.slice(1).join('\n') || ''];
  }
  function updateWC() {
    var ps = parts();
    wc.textContent = ps.map(function (p, i) { return (current.length > 1 ? (i ? 'Teil 2: ' : 'Teil 1: ') : '') + R.words(p) + ' words'; }).join(' · ');
  }
  text.addEventListener('input', updateWC);
  function check(t, txt) {
    var out = [], lim = LIMITS[t.kind] || [20, 40, 10], n = R.words(txt);
    var lines = txt.trim().split(/\n/).filter(function (l) { return l.trim(); });
    if (n < lim[2]) out.push(['no', 'Only ' + n + ' words. Below about ' + lim[2] + ' words the part can get 0 points. Aim for ' + lim[0] + '–' + (lim[1] + 5) + '.']);
    else if (n < lim[0]) out.push(['no', n + ' words: a little short. Aim for ' + lim[0] + '–' + (lim[1] + 5) + ' words.']);
    else out.push(['ok', n + ' words: good length (target ' + lim[0] + '–' + lim[1] + ', a few more is fine).']);
    var duWords = (txt.match(/\b(du|dich|dir|dein|deine|deinen|deinem|deiner|kannst|hast|bist|kommst|willst)\b/g) || []);
    var sieWords = (txt.match(/(?:^|[^.!?\n]\s)(Sie|Ihnen|Ihre?|Ihren|Ihrem|Ihrer)\b/g) || []).map(function (w) { return w.trim(); });
    var form = t.form === 'Sie' ? 'Sie' : (t.form === 'ihr' ? 'ihr' : 'du');
    if (form === 'Sie' && duWords.length) out.push(['no', 'This task needs Sie, but you used du-forms: ' + duWords.slice(0, 5).join(', ') + '.']);
    else if (form === 'du' && sieWords.length) out.push(['no', 'This task needs du, but you used Sie-forms: ' + sieWords.slice(0, 5).join(', ') + '.']);
    else out.push(['ok', 'du / Sie: consistent with the task (' + form + ').']);
    if (form === 'Sie' && /[^.!?\n]\s(ihnen|sie können|ihre einladung)\b/.test(txt)) out.push(['no', 'Formal Sie / Ihnen / Ihr must start with a capital letter.']);
    var first = (lines[0] || '').trim();
    if (!/^(hallo|liebe|lieber|sehr geehrte|hi|guten tag)/i.test(first)) out.push(['no', 'Start with a greeting: Hallo … / Liebe … / Sehr geehrte …']);
    else if (form === 'Sie' && /^(hallo|hi)/i.test(first)) out.push(['no', '“Hallo” is too informal for this task. Use Sehr geehrte Frau … / Sehr geehrter Herr … or Liebe Frau ….']);
    else out.push(['ok', 'Greeting: present.']);
    if (!/(grüße|grüßen|gruß|bis bald|bis gleich|bis später)/i.test(txt)) out.push(['no', 'End with a closing: Liebe Grüße / Viele Grüße / Mit freundlichen Grüßen, then your name.']);
    else if (form === 'du' && /mit freundlichen grüßen/i.test(txt)) out.push(['no', '“Mit freundlichen Grüßen” is too formal for a friend. Use Liebe Grüße.']);
    else out.push(['ok', 'Closing: present.']);
    if (/\b(weil|dass)\b[^.!?]*\b(ich|du|er|sie|wir)\s+(bin|habe|kann|muss|komme|arbeite|möchte)\s+\w+[.!?]/i.test(txt))
      out.push(['no', 'After weil / dass the verb goes to the END: …, weil ich krank bin.']);
    return out;
  }
  $('#pad-check').addEventListener('click', function () {
    var ps = parts(), html = '';
    current.forEach(function (t, i) {
      var res = check(t, ps[i] || '');
      html += (current.length > 1 ? '<h4>' + (i ? 'Teil 2' : 'Teil 1') + '</h4>' : '') +
        res.map(function (r) { return '<div class="feedback ' + r[0] + '">' + R.esc(r[1]) + '</div>'; }).join('') +
        (t.pts.length ? '<p class="small" style="margin-top:10px"><b>Did you answer every point?</b> Tick them yourself:</p>' + t.pts.map(function (p, j) {
          return '<label class="choice"><input type="checkbox"><span>' + (j + 1) + '. ' + R.esc(p) + '</span></label>'; }).join('') : '');
    });
    fb.innerHTML = '<div class="panel" style="margin-top:12px">' + html + '<p class="small muted" style="margin:10px 0 0">The pad checks length, du/Sie, greeting and closing. It cannot judge grammar or content: compare with the model answer.</p></div>';
  });
  $('#pad-model').addEventListener('click', function () {
    modelBox.hidden = false;
    modelBox.innerHTML = '<div class="panel">' + current.map(function (t) {
      return '<h4 style="margin-top:0">Model answer ' + R.esc(t.id) + '</h4><div class="answer"><p>' + R.esc(t.answer).replace(/\n/g, '<br>') + '</p></div><p class="muted small">' + R.esc(t.en) + '</p>' +
        (t.kind !== 'a1' ? '<p class="small"><a href="' + (t.kind === 'sms' ? 'schreiben-sms.html#' : 'schreiben-email.html#') + t.id + '">Open the full task card</a> for word-by-word meanings and pronunciation.</p>' : '');
    }).join('') + '</div>';
  });
  $('#pad-save').addEventListener('click', function () {
    var saved = R.store.get('padTexts', []);
    saved.push({ ids: current.map(function (t) { return t.id; }), text: text.value, words: R.words(text.value), at: new Date().toISOString() });
    R.store.set('padTexts', saved.slice(-100));
    current.forEach(function (t) { R.progress.markDone(t.id); });
    R.progress.log('schreiben-pad', { ids: current.map(function (t) { return t.id; }), words: R.words(text.value) });
    R.toast('Saved on this device. See “My progress”.');
  });
})();
