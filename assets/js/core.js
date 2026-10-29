/* RAX Study Germany — shared helpers. No build step, no framework.
   Everything a learner saves stays in this browser (localStorage). */
(function () {
  'use strict';
  var RAX = window.RAX = window.RAX || {};
  var NS = 'rax.v1.';

  /* ---------- storage (safe: private windows can block it) ---------- */
  RAX.store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(NS + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
      catch (e) { RAX.toast('Could not save in this browser (storage is blocked or full).'); return false; }
    },
    remove: function (key) { try { localStorage.removeItem(NS + key); } catch (e) {} },
    keys: function () {
      var out = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(NS) === 0) out.push(k.slice(NS.length)); } }
      catch (e) {}
      return out;
    }
  };

  /* ---------- progress log ---------- */
  RAX.progress = {
    log: function (area, data) {
      var log = RAX.store.get('log', []);
      log.push({ area: area, at: new Date().toISOString(), data: data || {} });
      if (log.length > 2000) log = log.slice(-2000);
      RAX.store.set('log', log);
    },
    all: function () { return RAX.store.get('log', []); },
    count: function (area) { return RAX.progress.all().filter(function (e) { return e.area === area; }).length; },
    markDone: function (id) { var d = RAX.store.get('done', {}); d[id] = new Date().toISOString(); RAX.store.set('done', d); },
    isDone: function (id) { return !!RAX.store.get('done', {})[id]; },
    unmark: function (id) { var d = RAX.store.get('done', {}); delete d[id]; RAX.store.set('done', d); }
  };

  /* ---------- export / import of everything saved ---------- */
  RAX.exportAll = function () {
    var data = { app: 'RAX Study Germany', version: 1, exportedAt: new Date().toISOString(), data: {} };
    RAX.store.keys().forEach(function (k) { data.data[k] = RAX.store.get(k, null); });
    RAX.download('raxstudygermany-progress-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data, null, 2), 'application/json');
  };
  /* Accept files exported under the old name too. */
  function RAX_APP(name) { return name === 'RAX Study Germany' || name === 'RAX German'; }
  RAX.isApp = RAX_APP;
  RAX.importAll = function (file, done) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var obj = JSON.parse(r.result);
        if (!obj || !RAX_APP(obj.app) || typeof obj.data !== 'object') throw new Error('not a RAX Study Germany file');
        Object.keys(obj.data).forEach(function (k) { RAX.store.set(k, obj.data[k]); });
        RAX.toast('Progress imported.');
        if (done) done(true);
      } catch (e) { RAX.toast('This file is not a RAX Study Germany progress file.'); if (done) done(false); }
    };
    r.readAsText(file);
  };
  RAX.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- small DOM helpers ---------- */
  RAX.$ = function (sel, root) { return (root || document).querySelector(sel); };
  RAX.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  RAX.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  RAX.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  RAX.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  RAX.words = function (text) { var m = String(text || '').trim().match(/[^\s]+/g); return m ? m.length : 0; };
  var toastTimer;
  RAX.toast = function (msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  };

  /* ---------- pronunciation markup: CAPITALS = stressed syllable ---------- */
  RAX.say = function (text) {
    return RAX.esc(text).replace(/(^|[^A-Za-zÄÖÜäöüß])([A-ZÄÖÜ]{2,}|[A-ZÄÖÜ](?=[-\s,.?!]|$))/g, '$1<b>$2</b>');
  };

  /* ---------- text-to-speech (browser voices; quality depends on the device) ---------- */
  var voices = [];
  function loadVoices() { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  RAX.canSpeak = function () { return 'speechSynthesis' in window; };
  RAX.voicesFor = function (lang) {
    loadVoices();
    return voices.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(lang.toLowerCase().slice(0, 2)) === 0; });
  };
  RAX.speak = function (text, opts) {
    opts = opts || {};
    if (!RAX.canSpeak()) { RAX.toast('Your browser cannot read text aloud. Try Chrome or Edge.'); return null; }
    var lang = opts.lang || 'de-DE';
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    var list = RAX.voicesFor(lang);
    var exact = list.filter(function (v) { return v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase(); });
    var pool = exact.length ? exact : list;
    if (pool.length) u.voice = pool[(opts.voice || 0) % pool.length];
    u.rate = opts.rate || RAX.store.get('ttsRate', 0.9);
    u.pitch = opts.pitch || 1;
    if (opts.onend) u.onend = opts.onend;
    if (!opts.queue) speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return u;
  };
  /* Speak a script of [speaker, text] lines, alternating voices/pitch so dialogues are easier to follow */
  RAX.speakScript = function (lines, opts) {
    opts = opts || {};
    if (!RAX.canSpeak()) { RAX.toast('Your browser cannot read text aloud. Try Chrome or Edge.'); return; }
    speechSynthesis.cancel();
    var speakers = {}, n = 0;
    lines.forEach(function (l, i) {
      var who = l[0] || 'N';
      if (!(who in speakers)) speakers[who] = n++;
      var idx = speakers[who];
      var u = RAX.speak(l[1], { lang: opts.lang || 'de-DE', voice: idx, pitch: idx % 2 ? 1.18 : 0.92, rate: opts.rate, queue: true,
        onend: i === lines.length - 1 ? opts.onend : null });
    });
  };
  RAX.stopSpeaking = function () { if (RAX.canSpeak()) speechSynthesis.cancel(); };
  RAX.speakerIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  RAX.speakBtn = function (text, lang, label) {
    return '<button type="button" class="speak" data-speak="' + RAX.esc(text) + '" data-lang="' + (lang || 'de-DE') + '" aria-label="' + RAX.esc(label || ('Listen: ' + text)) + '">' + RAX.speakerIcon + '</button>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-speak]');
    if (b) { e.preventDefault(); RAX.speak(b.getAttribute('data-speak'), { lang: b.getAttribute('data-lang') || 'de-DE' }); }
  });

  /* ---------- countdown timer ---------- */
  RAX.timer = function (el, seconds, onEnd) {
    var left = seconds, iv = null;
    function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
    function draw() { el.textContent = fmt(Math.max(0, left)); el.classList.toggle('low', left <= 60); }
    draw();
    return {
      start: function () { if (iv) return; iv = setInterval(function () { left--; draw(); if (left <= 0) { clearInterval(iv); iv = null; if (onEnd) onEnd(); } }, 1000); },
      pause: function () { clearInterval(iv); iv = null; },
      reset: function (s) { clearInterval(iv); iv = null; left = s || seconds; draw(); },
      left: function () { return left; },
      running: function () { return !!iv; }
    };
  };

  /* ---------- microphone recorder (stays on the device) ---------- */
  RAX.recorder = function (onReady) {
    var rec = null, chunks = [], stream = null;
    return {
      supported: !!(navigator.mediaDevices && window.MediaRecorder),
      start: function () {
        return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
          stream = s; chunks = [];
          rec = new MediaRecorder(s);
          rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            stream.getTracks().forEach(function (t) { t.stop(); });
            onReady(URL.createObjectURL(blob));
          };
          rec.start();
        });
      },
      stop: function () { if (rec && rec.state !== 'inactive') rec.stop(); },
      recording: function () { return !!(rec && rec.state === 'recording'); }
    };
  };

  /* ---------- verified figures: <span data-fig="key">fallback</span> ---------- */
  RAX.fillFigures = function () {
    var V = window.RAX_VISA;
    if (!V || !V.figures) return;
    RAX.$$('[data-fig]').forEach(function (el) {
      var f = V.figures[el.getAttribute('data-fig')];
      if (!f) return;
      el.textContent = f.display;
      el.title = (f.applies || '') + ' — last checked ' + f.checked + (f.status ? ' (' + f.status + ')' : '');
    });
    var CLS = { 'Verified': 'verified', 'Needs review': 'review', 'Outdated': 'outdated', 'Archived': 'archived' };
    RAX.$$('[data-fig-badge]').forEach(function (el) {
      var f = V.figures[el.getAttribute('data-fig-badge')];
      if (!f) return;
      el.className = 'badge ' + (CLS[f.status] || 'plain'); el.textContent = f.status; el.hidden = f.status === 'Verified';
    });
    RAX.$$('[data-checked]').forEach(function (el) { if (V.lastReview) el.textContent = V.lastReview; });
  };

  /* ---------- header: grouped menu + theme ---------- */
  function initHeader() {
    document.documentElement.classList.remove('no-js');
    var btn = RAX.$('.nav-toggle'), nav = RAX.$('#site-nav');
    var groups = RAX.$$('.ng-btn');
    function closeAll(except) {
      groups.forEach(function (b) { if (b !== except) { b.setAttribute('aria-expanded', 'false'); b.parentNode.classList.remove('open'); } });
    }
    groups.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = b.getAttribute('aria-expanded') !== 'true';
        closeAll(b);
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.parentNode.classList.toggle('open', open);
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.ng')) closeAll(null); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openBtn = groups.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
      closeAll(null);
      if (openBtn) openBtn.focus();
    });
    if (btn && nav) btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var cur = RAX.$('.ng.is-current .ng-btn'); if (cur && cur.getAttribute('aria-expanded') !== 'true') cur.click(); }
    });
    var tb = RAX.$('.theme-btn');
    var saved = RAX.store.get('theme', null);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    function label() {
      var cur = document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      if (tb) tb.textContent = cur === 'dark' ? 'Light mode' : 'Dark mode';
      return cur;
    }
    if (tb) {
      label();
      tb.addEventListener('click', function () {
        var next = label() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next); RAX.store.set('theme', next); label();
      });
    }
  }

  /* Berlin clock for the departure board */
  function initClock() {
    var el = RAX.$('[data-berlin-clock]');
    if (!el) return;
    function tick() {
      try { el.textContent = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date()); }
      catch (e) { el.textContent = ''; }
    }
    tick(); setInterval(tick, 15000);
  }
  /* Board hints read saved progress */
  function initBoard() {
    RAX.$$('[data-board-hint]').forEach(function (el) {
      var key = el.getAttribute('data-board-hint');
      var n = 0;
      if (key === 'vocab') { var s = RAX.store.get('srs', {}); n = Object.keys(s).length; if (n) { el.textContent = n + ' Wörter geübt'; el.className = ''; } }
      else if (key === 'schreiben') { var d = RAX.store.get('done', {}); n = Object.keys(d).filter(function (k) { return /^(S|E|X)\d+$/.test(k); }).length; if (n) { el.textContent = n + ' / 67 geschrieben'; el.className = ''; } }
      else if (key === 'visa') { var pl = RAX.store.get('plans', {}); if (Object.keys(pl).length || RAX.store.get('finder', null)) { el.textContent = 'Plan gespeichert'; el.className = ''; } }
      else if (key === 'mock') { var h = RAX.store.get('mockHistory', []); if (h.length) { el.textContent = 'Letzter Test: ' + h[h.length - 1].total + ' P.'; el.className = ''; } }
      else if (key === 'ielts') { var b = RAX.store.get('ieltsHistory', []); if (b.length) { el.textContent = 'Band ' + b[b.length - 1].overall; el.className = ''; } }
      else if (key === 'study') { var bp = RAX.store.get('bachelorPath', null); if (bp && bp.label) { el.textContent = 'Weg gewählt'; el.className = ''; } }
      else if (key === 'docs') {
        var ac = RAX.store.get('attest.checklist', null), done = ac && ac.done ? Object.keys(ac.done).length : 0;
        if (done) { el.textContent = done + ' erledigt'; el.className = ''; } else if (ac) { el.textContent = 'Liste begonnen'; el.className = ''; }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader(); initClock(); initBoard(); RAX.fillFigures();
    if (!RAX.canSpeak()) RAX.$$('.speak').forEach(function (b) { b.hidden = true; });
  });
})();
