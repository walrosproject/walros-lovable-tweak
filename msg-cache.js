// WalrOS Lovable Tweak — compact visual prompt bubbles
// Mantiene el prompt real intacto para el backend, pero compacta la burbuja visual
// que Lovable renderiza en la página para que el chat quede limpio.
(function(){
  "use strict";
  if (window.__qlMsgCompactLoaded) return;
  window.__qlMsgCompactLoaded = true;

  var STORAGE_KEY = "ql_msg_compact_cache";
  var MAX_PER_PROJECT = 300;
  var DEFAULT_LABEL = "https://walros.org";
  var MAX_AGE_MS = 60 * 60 * 1000; // 1 hora: evita tocar mensajes antiguos sin querer.

  function normalize(s){
    return String(s || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getProjectId(){
    var path = String(location.pathname || "");
    var patterns = [
      /\/projects\/([0-9a-fA-F-]{8,})/,
      /\/project\/([0-9a-fA-F-]{8,})/,
      /\/projects\/([^\/?#]+)/,
      /\/project\/([^\/?#]+)/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = path.match(patterns[i]);
      if (m && m[1]) return decodeURIComponent(m[1]);
    }
    try {
      var u = new URL(location.href);
      return u.searchParams.get("projectId") || u.searchParams.get("project_id") || "";
    } catch(e) { return ""; }
  }

  var cache = {};
  var rewriting = false;
  var pending = false;

  function loadCache(cb){
    try {
      chrome.storage.local.get([STORAGE_KEY], function(res){
        cache = (res && res[STORAGE_KEY]) ? res[STORAGE_KEY] : {};
        if (cb) cb();
      });
    } catch(e){ cache = {}; if (cb) cb(); }
  }

  function saveCache(){
    try { chrome.storage.local.set({ ql_msg_compact_cache: cache }); } catch(e){}
  }

  function cacheMsg(projectId, text, label){
    if (!projectId || !text) return;
    if (!cache[projectId]) cache[projectId] = [];
    cache[projectId].push({
      t: String(text),
      label: String(label || DEFAULT_LABEL),
      ts: Date.now()
    });
    if (cache[projectId].length > MAX_PER_PROJECT) cache[projectId] = cache[projectId].slice(-MAX_PER_PROJECT);
    saveCache();
    scheduleRewrite();
  }

  window.__qlCompactMsg = cacheMsg;
  // Compatibilidad con builds anteriores: si algo llama a __qlCacheMsg, compactamos también.
  window.__qlCacheMsg = function(projectId, text){ cacheMsg(projectId, text, DEFAULT_LABEL); };

  try {
    chrome.storage.onChanged.addListener(function(changes, area){
      if (area === "local" && changes[STORAGE_KEY]) {
        cache = changes[STORAGE_KEY].newValue || {};
        scheduleRewrite();
      }
    });
  } catch(e){}

  function isSkippable(el){
    if (!el || el.nodeType !== 1) return true;
    if (el.isContentEditable) return true;
    var tag = (el.tagName || "").toLowerCase();
    if (/^(input|textarea|button|script|style|select|option|svg|path)$/i.test(tag)) return true;
    if (el.closest && el.closest('[contenteditable="true"], textarea, input, button, form#chat-input, #ql-floating, #ql-native-badge, #ql-native-return-btn, #ql-native-toast, .ql-native-toast, .ql-native-sending-overlay, [id^="ql-"], [class^="ql-"]')) return true;
    if (el.getAttribute && el.getAttribute("data-ql-compact-rewritten") === "1") return true;
    return false;
  }

  function isLikelyChatTextElement(el){
    if (!el || !el.matches) return false;
    // Prioriza elementos de texto de mensajes, pero deja fallback para cambios de clases de Lovable.
    if (el.matches('[data-selectable="true"], .prose-chat, .special-message')) return true;
    var tag = (el.tagName || "").toLowerCase();
    if (tag === "p" || tag === "span") return true;
    if (tag === "div") {
      // Evita contenedores grandes con muchos hijos.
      var childEls = 0;
      for (var i = 0; i < el.children.length; i++) childEls++;
      return childEls <= 3;
    }
    return false;
  }

  function matchEntry(visibleText, entries){
    var v = normalize(visibleText).replace(/\s*Mostrar más\s*$/i, "").trim();
    if (!v || v.length < 3) return null;
    var now = Date.now();
    for (var i = entries.length - 1; i >= 0; i--) {
      var e = entries[i];
      if (!e || !e.t) continue;
      if (e.ts && now - e.ts > MAX_AGE_MS) continue;
      var t = normalize(e.t);
      if (!t) continue;
      if (v === t) return e;
      // Lovable puede renderizar la acción V3 como: "Corregir error" + prompt + "Mostrar más".
      // En ese caso el prompt real está dentro del texto visible, no necesariamente al principio.
      if (t.length > 12 && v.length > t.length && v.indexOf(t) !== -1) return e;
      // Si se acaba de enviar un prompt desde WalrOS y Lovable pinta una burbuja tipo fix_error,
      // compactamos esa burbuja completa al branding visible, sin cambiar lo que recibió Lovable.
      if (e.ts && now - e.ts < 2 * 60 * 1000 && /(?:Corregir\s+error|Fix\s+build\s+error|Fix\s+error|Build\s+error)/i.test(v)) return e;
      // Lovable a veces colapsa prompts largos y añade "Mostrar más". En ese caso
      // el texto visible es solo el comienzo del prompt real.
      if (t.length > 80 && v.length >= 40 && t.indexOf(v) === 0) return e;
      // Si Lovable conserva saltos o markdown raro, permite coincidencia de prefijo
      // sin ser demasiado agresivos.
      if (v.length > 80 && t.length > 80 && (v.indexOf(t.slice(0, 80)) === 0 || t.indexOf(v.slice(0, 80)) === 0)) return e;
    }
    return null;
  }

  function replaceElement(el, label){
    try {
      el.setAttribute("data-ql-compact-rewritten", "1");
      // Si es un bloque prose, conservar estructura básica para no romper estilos.
      if (el.matches && (el.matches('[data-selectable="true"]') || el.matches('.prose-chat'))) {
        el.innerHTML = '<p>' + escapeHtml(label) + '</p>';
      } else {
        el.textContent = label;
      }
    } catch(e) {}
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function hasRecentEntry(entries){
    var now = Date.now();
    for (var i = entries.length - 1; i >= 0; i--) {
      if (entries[i] && entries[i].ts && now - entries[i].ts < MAX_AGE_MS) return entries[i];
    }
    return entries[entries.length - 1] || null;
  }

  function looksLikeWalrosV3Bubble(text){
    var v = normalize(text);
    if (!v) return false;
    // Payload real del backend 0.3.0: no tocar la llamada a Lovable, solo ocultar esta burbuja al usuario.
    if (/WalrOS\s+validation\s+failed/i.test(v)) return true;
    if (/Implement\s+the\s+required\s+fix\s+now/i.test(v)) return true;
    if (/Do\s+not\s+ask\s+the\s+user\s+for\s+confirmation/i.test(v)) return true;
    if (/Required\s+fix\s*:/i.test(v)) return true;
    // Burbujas V3 que Lovable renderiza como fix_error con prompt interno.
    if (/(?:Corregir\s+error|Fix\s+build\s+error|Fix\s+error)/i.test(v) && /Mostrar\s+(?:más|menos)/i.test(v)) return true;
    return false;
  }

  function isSafeV3BubbleContainer(el){
    if (!el || el.nodeType !== 1 || isSkippable(el)) return false;
    var txt = el.textContent || "";
    if (!looksLikeWalrosV3Bubble(txt)) return false;
    // Evita cargarse el panel entero o la columna de chat completa. Buscamos una burbuja relativamente pequeña.
    try {
      var r = el.getBoundingClientRect();
      if (r && r.width && r.height) {
        if (r.width > Math.min(window.innerWidth * 0.75, 900)) return false;
        if (r.height > Math.min(window.innerHeight * 0.75, 650)) return false;
      }
    } catch(e) {}
    return true;
  }

  function findBestV3BubbleNode(){
    var candidates = Array.prototype.slice.call(document.querySelectorAll('div, article, section, p, span'));
    var best = null;
    var bestLen = Infinity;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (!isSafeV3BubbleContainer(el)) continue;
      var txt = normalize(el.textContent || "");
      var len = txt.length;
      // Preferimos el contenedor más pequeño que aún contiene el texto largo del V3.
      if (len > 20 && len < bestLen) {
        best = el;
        bestLen = len;
      }
    }
    return best;
  }

  function rewriteWalrosV3Bubble(entries){
    var entry = hasRecentEntry(entries);
    if (!entry) return;
    var node = findBestV3BubbleNode();
    if (!node) return;
    replaceElement(node, entry.label || DEFAULT_LABEL);
  }

  function rewriteAll(){
    if (rewriting) { pending = true; return; }
    rewriting = true;
    try {
      var pid = getProjectId();
      var entries = (pid && cache[pid]) ? cache[pid] : [];
      if (!entries || entries.length === 0) { rewriting = false; return; }
      var nodes = document.querySelectorAll('[data-selectable="true"], .prose-chat, .special-message, p, span, div');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (isSkippable(el) || !isLikelyChatTextElement(el)) continue;
        var txt = el.textContent || "";
        var entry = matchEntry(txt, entries);
        if (entry) replaceElement(el, entry.label || DEFAULT_LABEL);
      }
      // Fallback más agresivo para el contrato V3 0.3.0: la burbuja tiene varios nodos
      // y por eso el rewriter fino no siempre la pillaba. Esto SOLO toca la UI local.
      rewriteWalrosV3Bubble(entries);
    } catch(e) {}
    rewriting = false;
    if (pending) { pending = false; setTimeout(rewriteAll, 50); }
  }

  var rewriteTimer = null;
  function scheduleRewrite(){
    if (rewriteTimer) return;
    rewriteTimer = setTimeout(function(){
      rewriteTimer = null;
      rewriteAll();
    }, 80);
  }

  function start(){
    loadCache(function(){
      scheduleRewrite();
      try {
        var obs = new MutationObserver(function(){ scheduleRewrite(); });
        obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      } catch(e){}
      var lastHref = location.href;
      setInterval(function(){
        if (location.href !== lastHref) {
          lastHref = location.href;
          scheduleRewrite();
        }
      }, 700);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
