/* Sprechen: random exam cards, model answers, self-introduction builder, timer and recorder */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$, $$ = R.$$, S = window.RAX_SPRECHEN;
  if (!S) return;

  function modelBlock(de, en, say) {
    return '<div class="answer" style="margin-top:8px"><p>' + R.esc(de) + '</p></div><div class="btn-row">' + R.speakBtn(de, 'de-DE', 'Listen to the model answer') + '</div>' +
      (say ? '<details class="layer"><summary>Say it: pronunciation</summary><div><p class="say">' + R.say(say) + '</p></div></details>' : '') +
      (en ? '<details class="layer"><summary>English</summary><div><p>' + R.esc(en) + '</p></div></details>' : '');
  }
  function card(text, sub) { return '<div class="text-doc sign" style="display:inline-block;min-width:180px;margin:6px 8px 6px 0">' + R.esc(text) + (sub ? '<div class="small muted" style="font-weight:500">' + R.esc(sub) + '</div>' : '') + '</div>'; }

  /* A1 Teil 1: self-introduction builder */
  var intro = $('#a1t1-build');
  if (intro) {
    $('#a1t1-model').innerHTML = modelBlock(S.a1t1.model.de, S.a1t1.model.en, S.a1t1.model.say);
    var saved = R.store.get('introFields', {});
    $$('#a1t1-form input').forEach(function (i) { if (saved[i.name]) i.value = saved[i.name]; });
    intro.addEventListener('click', function () {
      var f = {}; $$('#a1t1-form input').forEach(function (i) { f[i.name] = i.value.trim(); });
      R.store.set('introFields', f);
      var parts = ['Guten Tag!'];
      if (f.name) parts.push('Ich heiße ' + f.name + '.');
      if (f.age) parts.push('Ich bin ' + f.age + ' Jahre alt.');
      if (f.country) parts.push('Ich komme aus ' + f.country + (f.city ? ' und wohne in ' + f.city + '.' : '.'));
      else if (f.city) parts.push('Ich wohne in ' + f.city + '.');
      if (f.langs) parts.push('Ich spreche ' + f.langs + '.');
      if (f.job) parts.push('Ich bin ' + f.job + '.');
      if (f.hobby) parts.push('Mein Hobby ist ' + f.hobby + '.');
      var txt = parts.join(' ');
      $('#a1t1-out').innerHTML = '<div class="answer"><p>' + R.esc(txt) + '</p></div><div class="btn-row">' + R.speakBtn(txt, 'de-DE', 'Listen to your introduction') +
        '<span class="small muted">Check nouns and endings: for a job use the right form, e.g. Student / Studentin, Ingenieur / Ingenieurin. Countries: aus Pakistan, aus <b>der</b> Türkei, aus <b>dem</b> Iran.</span></div>';
    });
  }

  /* A1 Teil 2: theme + word card */
  var a1t2 = $('#a1t2-new');
  if (a1t2) a1t2.addEventListener('click', function () {
    var themes = Object.keys(S.a1t2), th = R.pick(themes), picks = R.shuffle(S.a1t2[th]).slice(0, 2);
    $('#a1t2-out').innerHTML = '<p><b>Thema: ' + R.esc(th) + '</b>. Ask a question with each word, then answer your partner.</p>' +
      picks.map(function (p) { return card(p[0], 'Thema: ' + th); }).join('') +
      '<details class="layer"><summary>Model questions and answers</summary><div>' + picks.map(function (p) {
        return '<p style="margin:0 0 4px"><b>' + R.esc(p[0]) + ':</b> ' + R.esc(p[1]) + ' ' + R.speakBtn(p[1]) + '<br><span class="muted">Answer:</span> ' + R.esc(p[2]) + ' ' + R.speakBtn(p[2]) + '</p>';
      }).join('') + '</div></details>';
  });

  /* A1 Teil 3: request cards */
  var a1t3 = $('#a1t3-new');
  if (a1t3) a1t3.addEventListener('click', function () {
    var picks = R.shuffle(S.a1t3).slice(0, 2);
    $('#a1t3-out').innerHTML = '<p>Make a polite request with each card, then react to your partner’s request.</p>' + picks.map(function (p) { return card(p[0]); }).join('') +
      '<details class="layer"><summary>Model requests and reactions</summary><div>' + picks.map(function (p) {
        return '<p style="margin:0 0 4px"><b>' + R.esc(p[0]) + ':</b> ' + R.esc(p[1]) + ' ' + R.speakBtn(p[1]) + '<br><span class="muted">Reaction:</span> ' + R.esc(p[2]) + ' ' + R.speakBtn(p[2]) + '</p>';
      }).join('') + '</div></details>';
  });

  /* A2 Teil 1: four word cards */
  var a2t1 = $('#a2t1-new');
  if (a2t1) a2t1.addEventListener('click', function () {
    var picks = R.shuffle(S.a2t1).slice(0, 4);
    $('#a2t1-out').innerHTML = '<p>Ask your partner a question with each card. Answer their questions in full sentences.</p>' + picks.map(function (p) { return card(p[0], 'Fragen zur Person'); }).join('') +
      '<details class="layer"><summary>Model questions and answers</summary><div>' + picks.map(function (p) {
        return '<p style="margin:0 0 4px"><b>' + R.esc(p[0]) + '</b> ' + R.esc(p[1]) + ' ' + R.speakBtn(p[1]) + '<br><span class="muted">Answer:</span> ' + R.esc(p[2]) + ' ' + R.speakBtn(p[2]) + '</p>';
      }).join('') + '</div></details>';
  });

  /* A2 Teil 2: topic card with 4 prompts */
  var a2t2 = $('#a2t2-new');
  if (a2t2) a2t2.addEventListener('click', function () {
    var c = R.pick(S.a2t2);
    $('#a2t2-out').innerHTML = '<div class="text-doc" style="max-width:420px"><h4 style="margin-top:0;text-align:center">' + R.esc(c.card) + '</h4>' +
      '<div class="cols-2" style="gap:8px;text-align:center">' + c.points.map(function (p) { return '<div class="text-doc" style="margin:0">' + R.esc(p) + '</div>'; }).join('') + '</div></div>' +
      '<p class="small muted">Talk for about one minute and cover all four prompts. Then the examiner asks one or two questions.</p>' +
      '<details class="layer"><summary>Model answer</summary><div>' + modelBlock(c.model, c.en) + '</div></details>';
  });

  /* A2 Teil 3: plan together with two diaries */
  var a2t3 = $('#a2t3-new');
  if (a2t3) a2t3.addEventListener('click', function () {
    var c = R.pick(S.a2t3);
    function diary(name, rows) {
      return '<div class="text-doc"><h4 style="margin-top:0">' + name + '</h4><table class="tbl"><tbody>' + rows.map(function (r) {
        return '<tr><td style="width:4.5rem"><b>' + R.esc(r[0]) + '</b></td><td>' + (r[1] ? R.esc(r[1]) : '<span class="muted">frei</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }
    $('#a2t3-out').innerHTML = '<p><b>' + R.esc(c.task) + '</b><br><span class="muted">' + R.esc(c.task_en) + '</span></p><div class="cols-2">' + diary('Kalender A (you)', c.a) + diary('Kalender B (partner)', c.b) + '</div>' +
      '<details class="layer"><summary>Model conversation</summary><div>' + c.model.map(function (l) { return '<p style="margin:0 0 4px"><b>' + l[0] + ':</b> ' + R.esc(l[1]) + '</p>'; }).join('') +
      '<div class="btn-row"><button type="button" class="btn small quiet" data-dialog>Listen to the conversation</button></div></div></details>';
    $('#a2t3-out [data-dialog]').addEventListener('click', function () { R.speakScript(c.model, { lang: 'de-DE' }); });
  });

  /* Shared timer + recorder */
  var tEl = $('#sp-timer');
  if (tEl) {
    var timer = R.timer(tEl, 60);
    $$('[data-secs]').forEach(function (b) { b.addEventListener('click', function () { timer.reset(+b.getAttribute('data-secs')); timer.start(); }); });
    $('#sp-tstop').addEventListener('click', function () { timer.pause(); });
  }
  var recBtn = $('#sp-rec');
  if (recBtn) {
    var rec = R.recorder(function (url) {
      $('#sp-play').innerHTML = '<audio controls src="' + url + '" style="width:100%;max-width:420px"></audio><p class="small muted">Your recording stays on this device. Listen for: verb in position 2, clear endings, and the stressed syllables.</p>';
    });
    if (!rec.supported) { recBtn.disabled = true; recBtn.textContent = 'Recording not supported in this browser'; }
    recBtn.addEventListener('click', function () {
      if (rec.recording()) { rec.stop(); recBtn.textContent = 'Record myself'; R.progress.log('sprechen', {}); }
      else rec.start().then(function () { recBtn.textContent = 'Stop recording'; }).catch(function () { R.toast('Microphone access was blocked. Allow it in your browser settings to record.'); });
    });
  }
  // fill first cards so the page is never empty
  ['#a1t2-new', '#a1t3-new', '#a2t1-new', '#a2t2-new', '#a2t3-new'].forEach(function (s) { var b = $(s); if (b) b.click(); });
})();
