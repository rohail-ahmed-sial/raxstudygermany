/* RAX Study Germany practice engine: renders reading/listening/grammar sets and marks them.
   Set format:
   { id, title, intro, lang, docs:[{kind:'sign'|'ad'|'mail'|'article'|'note'|'plain', title, html}],
     audio:{lines:[[speaker,text],...], plays:2, lang:'de-DE'}, matchOptions:['a','b','X'],
     items:[{type:'mc'|'tf'|'yn'|'tfng'|'ynng'|'match'|'fill', q, options, answer, why}] } */
(function () {
  'use strict';
  var R = window.RAX;
  var LABELS = {
    tf: ['Richtig', 'Falsch'], yn: ['Ja', 'Nein'], tfng: ['True', 'False', 'Not given'], ynng: ['Yes', 'No', 'Not given'], tfen: ['True', 'False']
  };
  var uid = 0;
  function norm(s) { return String(s || '').toLowerCase().replace(/[‘’´`]/g, "'").replace(/[.,;:!?"]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function docHTML(d) {
    var cls = { sign: 'text-doc sign', ad: 'text-doc ad', mail: 'text-doc', article: 'text-doc', note: 'text-doc', plain: 'text-doc' }[d.kind || 'plain'];
    return '<div class="' + cls + '">' + (d.title ? '<h4>' + R.esc(d.title) + '</h4>' : '') + d.html + '</div>';
  }

  function itemHTML(it, i, set, name) {
    var n = (set.startAt || 1) + i;
    var q = '<div class="q">' + n + '. ' + (it.qhtml || R.esc(it.q || '')) + '</div>';
    if (it.audio) q = '<div class="btn-row" style="margin:0 0 6px"><button type="button" class="btn small" data-iplay="' + i + '">' + R.speakerIcon.replace('<svg', '<svg width="16" height="16"') +
      ' Play ' + n + '</button><span class="small muted" data-iplays="' + i + '"></span></div>' + q;
    var body = '';
    var opts = it.options || LABELS[it.type];
    if (it.type === 'match') {
      body = '<label class="vh" for="' + name + '-' + i + '">Answer for ' + n + '</label><select id="' + name + '-' + i + '" data-i="' + i + '"><option value="">Choose …</option>' +
        (it.options || set.matchOptions).map(function (o) { var v = /^[A-Za-z0-9]{1,4}\s/.test(o) ? o.split(' ')[0] : o; return '<option value="' + R.esc(v) + '">' + R.esc(o) + '</option>'; }).join('') + '</select>';
    } else if (it.type === 'fill') {
      body = '<label class="vh" for="' + name + '-' + i + '">Answer for ' + n + '</label><input type="text" id="' + name + '-' + i + '" data-i="' + i + '" autocomplete="off" spellcheck="false" style="width:min(320px,100%)">';
    } else {
      body = '<div role="radiogroup" aria-label="Question ' + n + '">' + opts.map(function (o, j) {
        return '<label class="choice"><input type="radio" name="' + name + '-' + i + '" value="' + j + '" data-i="' + i + '"><span>' +
          (it.type === 'mc' && opts.length > 2 ? '<b>' + 'abcdefgh'[j] + '</b>&nbsp; ' : '') + R.esc(o) + '</span></label>';
      }).join('') + '</div>';
    }
    return '<div class="item" data-item="' + i + '">' + q + body + '<div class="fb" aria-live="polite"></div></div>';
  }

  function render(container, set, opts) {
    opts = opts || {};
    var name = 'p' + (++uid);
    var plays = 0, maxPlays = set.audio ? (set.audio.plays || 2) : 0;
    var html = '';
    if (set.title && !opts.noTitle) html += '<h3 style="margin-top:0">' + R.esc(set.title) + '</h3>';
    if (set.intro) html += '<p class="muted">' + set.intro + '</p>';
    if (set.audio) {
      html += '<div class="btn-row audio-row"><button type="button" class="btn" data-play>' + R.speakerIcon.replace('<svg', '<svg width="18" height="18"') + ' Play the recording</button>' +
        '<button type="button" class="btn quiet small" data-stop>Stop</button><span class="small muted" data-plays>' +
        (opts.mode === 'exam' ? 'You can play it ' + maxPlays + (maxPlays === 1 ? ' time.' : ' times.') : 'Played 0 times.') + '</span></div>' +
        '<p class="small muted" data-tts-note>The recording is read by your browser’s text-to-speech voice. If you hear English instead of German, install a German voice in your phone or computer settings.</p>';
    }
    if (!set.audio && set.items.some(function (it) { return it.audio; })) html += '<p class="small muted">Each question has its own short recording, read by your browser’s German text-to-speech voice.' + (opts.mode === 'exam' ? '' : ' In practice mode you can replay as often as you like.') + '</p>';
    (set.docs || []).forEach(function (d) { html += docHTML(d); });
    html += '<div class="items">' + set.items.map(function (it, i) { return itemHTML(it, i, set, name); }).join('') + '</div>';
    if (!opts.noButton) html += '<div class="btn-row"><button type="button" class="btn" data-check>Check answers</button><button type="button" class="btn quiet" data-reset>Try again</button><span class="score-out" aria-live="polite"></span></div>';
    var itemAudio = set.items.filter(function (it) { return it.audio; });
    if (itemAudio.length) html += '<details class="layer transcript" hidden><summary>Transcripts</summary><div>' + set.items.map(function (it, i) {
      return it.audio ? '<p style="margin:0 0 4px"><b>' + ((set.startAt || 1) + i) + '.</b></p>' + it.audio.lines.map(function (l) { return '<p style="margin:0 0 4px">' + (l[0] && l[0] !== 'N' ? '<b>' + R.esc(l[0]) + ':</b> ' : '') + R.esc(l[1]) + '</p>'; }).join('') : '';
    }).join('') + '</div></details>';
    if (set.audio) html += '<details class="layer transcript" hidden><summary>Transcript</summary><div>' +
      set.audio.lines.map(function (l) { return '<p style="margin:0 0 6px">' + (l[0] && l[0] !== 'N' ? '<b>' + R.esc(l[0]) + ':</b> ' : '') + R.esc(l[1]) + '</p>'; }).join('') + '</div></details>';
    container.innerHTML = html;

    var playBtn = container.querySelector('[data-play]');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (opts.mode === 'exam' && plays >= maxPlays) { R.toast('You have used all plays for this part.'); return; }
        plays++;
        container.querySelector('[data-plays]').textContent = opts.mode === 'exam' ? 'Play ' + plays + ' of ' + maxPlays + '.' : 'Played ' + plays + (plays === 1 ? ' time.' : ' times.');
        if (opts.mode === 'exam' && plays >= maxPlays) playBtn.disabled = true;
        R.speakScript(set.audio.lines, { lang: set.audio.lang || set.lang || 'de-DE', rate: set.audio.rate });
      });
      container.querySelector('[data-stop]').addEventListener('click', R.stopSpeaking);
    }

    var iplays = {};
    container.querySelectorAll('[data-iplay]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-iplay'), it = set.items[i], max = it.audio.plays || 2;
        iplays[i] = (iplays[i] || 0) + 1;
        if (opts.mode === 'exam' && iplays[i] > max) { R.toast('You have used all plays for this question.'); return; }
        var lab = container.querySelector('[data-iplays="' + i + '"]');
        lab.textContent = opts.mode === 'exam' ? 'Play ' + iplays[i] + ' of ' + max : 'Played ' + iplays[i] + 'x';
        if (opts.mode === 'exam' && iplays[i] >= max) b.disabled = true;
        R.speakScript(it.audio.lines, { lang: it.audio.lang || set.lang || 'de-DE' });
      });
    });
    function answers() {
      return set.items.map(function (it, i) {
        if (it.type === 'match') { var s = container.querySelector('select[data-i="' + i + '"]'); return s ? s.value : ''; }
        if (it.type === 'fill') { var t = container.querySelector('input[data-i="' + i + '"]'); return t ? t.value : ''; }
        var r = container.querySelector('input[name="' + name + '-' + i + '"]:checked'); return r ? +r.value : null;
      });
    }
    function isRight(it, a) {
      if (it.type === 'fill') {
        var acc = Array.isArray(it.answer) ? it.answer : [it.answer];
        return acc.some(function (x) { return norm(x) === norm(a); });
      }
      if (it.type === 'match') return String(a) === String(it.answer);
      return a === it.answer;
    }
    function rightText(it) {
      var opts2 = it.options || LABELS[it.type];
      if (it.type === 'fill') return Array.isArray(it.answer) ? it.answer[0] : it.answer;
      if (it.type === 'match') return it.answer;
      return (it.type === 'mc' && opts2.length > 2 ? 'abcdefgh'[it.answer] + ') ' : '') + opts2[it.answer];
    }
    function check(silent) {
      var as = answers(), score = 0;
      set.items.forEach(function (it, i) {
        var ok = isRight(it, as[i]);
        if (ok) score++;
        var box = container.querySelector('[data-item="' + i + '"]');
        box.querySelectorAll('.choice').forEach(function (c) { c.classList.remove('correct', 'wrong'); });
        if (it.type !== 'fill' && it.type !== 'match') {
          var labels = box.querySelectorAll('.choice');
          if (labels[it.answer]) labels[it.answer].classList.add('correct');
          if (!ok && as[i] !== null && labels[as[i]]) labels[as[i]].classList.add('wrong');
        }
        box.querySelector('.fb').innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Correct.' : 'Answer: ' + R.esc(rightText(it)) + '.') +
          (it.why ? ' ' + R.esc(it.why) : '') + '</div>';
      });
      var out = container.querySelector('.score-out');
      if (out) out.innerHTML = '<span class="score">' + score + '<small> / ' + set.items.length + '</small></span>';
      container.querySelectorAll('.transcript').forEach(function (tr) { tr.hidden = false; });
      if (!silent && set.id) R.progress.log(opts.area || 'practice', { id: set.id, score: score, total: set.items.length });
      if (opts.onCheck) opts.onCheck(score, set.items.length);
      return score;
    }
    var cb = container.querySelector('[data-check]');
    if (cb) cb.addEventListener('click', function () { check(false); });
    var rb = container.querySelector('[data-reset]');
    if (rb) rb.addEventListener('click', function () { render(container, set, opts); });
    return { check: check, total: set.items.length, answered: function () { return answers().filter(function (a) { return a !== null && a !== ''; }).length; } };
  }

  window.RAXP = { render: render };

  /* Auto-render any [data-practice] blocks whose set id exists in a page data object */
  document.addEventListener('DOMContentLoaded', function () {
    R.$$('[data-practice]').forEach(function (el) {
      var src = (el.getAttribute('data-source') || 'RAX_SETS').split('.').reduce(function (o, k) { return o ? o[k] : null; }, window);
      if (!src) return;
      var set = src[el.getAttribute('data-practice')];
      if (set) render(el, set, { area: el.getAttribute('data-area') || 'practice', noTitle: el.hasAttribute('data-notitle') });
    });
  });
})();
