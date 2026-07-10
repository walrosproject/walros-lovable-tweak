// WalrOS Lovable Tweak — V3 prompt rewriter (versión limpia)
(function(){
  "use strict";
  if (window.__qlV3RewriterLoaded) return;
  window.__qlV3RewriterLoaded = true;

  var STORAGE_KEY = "ql_v3_prompt_log";
  var MAX_PER_PROJECT = 300;
  var REPLACE_LABEL = "Fix build error";

  function getProjectId(){
    var m = String(location.pathname || "").match(/\/projects\/([0-9a-fA-F-]{8,})/);
    return m ? m[1] : "";
  }

  var promptLog = {};
  var rewriting = false;
  var pending = false;

  function loadLog(cb){
    try {
      chrome.storage.local.get([STORAGE_KEY], function(res){
        promptLog = (res && res[STORAGE_KEY]) ? res[STORAGE_KEY] : {};
        if (cb) cb();
      });
    } catch(e){ promptLog = {}; if (cb) cb(); }
  }

  function saveLog(){
    try { chrome.storage.local.set({ ql_v3_prompt_log: promptLog }); } catch(e){}
  }

  function pushPrompt(projectId, text){
    if (!projectId || !text) return;
    if (!promptLog[projectId]) promptLog[projectId] = [];
    promptLog[projectId].push({ t: String(text), ts: Date.now() });
    if (promptLog[projectId].length > MAX_PER_PROJECT) {
      promptLog[projectId] = promptLog[projectId].slice(-MAX_PER_PROJECT);
    }
    saveLog();
    scheduleRewrite();
  }

  window.__qlSaveV3Prompt = pushPrompt;

  try {
    chrome.storage.onChanged.addListener(function(changes, area){
      if (area === "local" && changes[STORAGE_KEY]) {
        promptLog = changes[STORAGE_KEY].newValue || {};
        scheduleRewrite();
      }
    });
  } catch(e){}

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildProseHtml(text){
    var paragraphs = String(text).split(/\n{2,}/);
    var html = "";
    for (var i = 0; i < paragraphs.length; i++){
      var p = paragraphs[i];
      if (!p) continue;
      html += "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>";
    }
    if (!html) html = "<p></p>";
    var proseCls = "prose prose-pulse prose-markdown-mobile dark:prose-invert md:prose-markdown "
      + "prose-h1:mb-2 prose-h1:text-xl prose-h1:font-medium "
      + "prose-h2:text-lg prose-h2:font-medium "
      + "prose-h3:text-base prose-h3:font-medium "
      + "prose-pre:my-2 prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:bg-background "
      + "prose-ol:my-2 prose-ul:my-2 prose-li:my-0 prose-hr:my-4 "
      + "max-w-full whitespace-normal prose-chat";
    return '<div class="flex flex-col gap-2" data-ql-rewritten="1">'
      + '<div dir="auto" data-selectable="true" class="' + proseCls + '">'
      + html
      + '</div></div>';
  }

  function rewriteAll(){
    if (rewriting) { pending = true; return; }
    rewriting = true;
    try {
      var pid = getProjectId();
      var list = (pid && promptLog[pid]) ? promptLog[pid] : null;
      if (!list || list.length === 0) { rewriting = false; return; }

      var nodes = document.querySelectorAll("div.special-message");
      var targets = [];
      for (var i = 0; i < nodes.length; i++){
        var n = nodes[i];
        var txt = (n.textContent || "").trim();
        if (txt === REPLACE_LABEL) targets.push(n);
      }
      var startIdx = Math.max(0, list.length - targets.length);
      for (var j = 0; j < targets.length; j++){
        var special = targets[j];
        var wrapper = special.parentElement;
        if (!wrapper) continue;
        var entry = list[startIdx + j];
        if (!entry) break;
        var newHtml = buildProseHtml(entry.t);
        try {
          wrapper.outerHTML = newHtml;
        } catch(e){}
      }
    } catch(e){}
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
    loadLog(function(){
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();