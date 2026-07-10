// WalrOS Lovable Tweak - Sound System v4.0
// Plays categorized audio cues for success/error events.
(function(global){
  var _ctx = null;
  function ctx(){
    if(_ctx) return _ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if(!AC) return null;
    try { _ctx = new AC(); } catch(e) { return null; }
    return _ctx;
  }

  // Synthesize a soft pleasant tone via Web Audio (no asset, super lightweight).
  function tone(freq, start, duration, gain){
    var c = ctx(); if(!c) return;
    var t0 = c.currentTime + start;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  function playActivationSuccess(){
    // Light major-triad arpeggio C5 - E5 - G5 (≈ 0.6s total)
    tone(523.25, 0,    0.25, 0.10);
    tone(659.25, 0.12, 0.25, 0.10);
    tone(783.99, 0.24, 0.35, 0.12);
  }

  function playPromptSent(){
    // Calm 2s natural — soft A4 -> E5 wash
    tone(440.00, 0,    0.55, 0.06);
    tone(659.25, 0.25, 0.85, 0.05);
    tone(880.00, 0.55, 1.20, 0.04);
  }

  function playFile(name){
    try {
      var url = chrome.runtime.getURL("sounds/" + name);
      var a = new Audio(url);
      a.volume = 0.55;
      a.play().catch(function(){});
    } catch(e){}
  }

  // Categorize a free-form error message and play the matching cue.
  function playErrorFromMessage(msg){
    if(!msg) return;
    var m = (msg + "").toLowerCase();
    if(m.indexOf("payment required") !== -1 || m.indexOf("pagamento") !== -1 ||
       m.indexOf("crédito") !== -1 || m.indexOf("credito") !== -1 ||
       m.indexOf("insufici") !== -1 || m.indexOf(" 402") !== -1){
      playFile("error-payment.mp3"); return;
    }
    if(m.indexOf("rate limit") !== -1 || m.indexOf("rate-limit") !== -1 ||
       m.indexOf("muitas tentativas") !== -1 || m.indexOf("too many") !== -1 ||
       m.indexOf(" 429") !== -1){
      playFile("error-ratelimit.mp3"); return;
    }
    if(m.indexOf("token") !== -1 || m.indexOf("sess") !== -1 ||
       m.indexOf("auth") !== -1 || m.indexOf(" 401") !== -1 || m.indexOf(" 403") !== -1){
      playFile("error-token.mp3"); return;
    }
  }

  global.QLSounds = {
    activation: playActivationSuccess,
    promptSent: playPromptSent,
    errorFromMessage: playErrorFromMessage,
    payment: function(){ playFile("error-payment.mp3"); },
    rateLimit: function(){ playFile("error-ratelimit.mp3"); },
    token: function(){ playFile("error-token.mp3"); }
  };
})(typeof window !== "undefined" ? window : self);