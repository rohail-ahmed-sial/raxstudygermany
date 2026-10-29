/* Pronunciation page: read any German text aloud */
(function () {
  'use strict';
  var R = window.RAX, $ = R.$;
  var go = $('#tts-go'); if (!go) return;
  function voiceInfo() {
    var v = R.voicesFor('de-DE'), el = $('#tts-voice');
    if (!R.canSpeak()) { el.textContent = 'This browser cannot read text aloud. Try Chrome, Edge or Safari.'; go.disabled = true; return; }
    el.textContent = v.length ? 'German voice: ' + v[0].name + (v.length > 1 ? ' (+' + (v.length - 1) + ' more)' : '') + '.' : 'No German voice found on this device. Add one in your system’s language or speech settings; until then you may hear an English accent.';
  }
  setTimeout(voiceInfo, 300);
  if ('speechSynthesis' in window) speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', voiceInfo);
  go.addEventListener('click', function () { R.speak($('#tts-text').value, { lang: 'de-DE', rate: +$('#tts-rate').value }); });
  $('#tts-stop').addEventListener('click', R.stopSpeaking);
})();
