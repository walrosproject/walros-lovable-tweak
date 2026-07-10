// ============================================
// WalrOS Lovable Tweak - Business Logic (content)
// ============================================

console.log("[ContentScript] WalrOS Lovable Tweak iniciado");

// 🔒 Obfuscated backend URL (XOR + base64) 🔒
const PROXY_COMMAND_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/proxy-command";

// Supabase anon key  needed for apikey header on Supabase requests
const SUPABASE_PROJECT_REF = "qrbkzvsgwuyctgcmnwny";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYmt6dnNnd3V5Y3RnY21ud255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MzUxMTYsImV4cCI6MjA5OTExMTExNn0.pvoi5xK3DVSMJH9aMJQeoRWVQmIWiC6_j15B3OaFFsA";
const REMOVE_WATERMARK_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/remove-watermark";
// 🔒 License state (loaded from storage; no hardcoded bypass) 🔒
var QL_FREE_MODE = false;
var QL_FREE_LICENSE_KEY = '';
var QL_FREE_SESSION_ID = '';
var QL_FREE_USER_NAME = '';
var QL_FORCE_REAL_BACKEND_LICENSE = true;

function cleanVisibleMessage(value) {
  var s = String(value || '');
  if (!s) return s;
  var low = s.toLowerCase();
  if (low.indexOf('licença') >= 0 || low.indexOf('licencia') >= 0 || low.indexOf('license') >= 0 || low.indexOf('inativa') >= 0 || low.indexOf('inactive') >= 0 || low.indexOf('payment required') >= 0 || low.indexOf('pagamento') >= 0) {
    return 'Función no disponible en esta build local.';
  }
  return s
    .replace(/Dados incompletos:\s*projeto ou token ausentes/gi, 'Faltan el proyecto o el token de Lovable. Abre un proyecto en lovable.dev, recarga la página y espera a que sincronice.')
    .replace(/Dados incompletos/gi, 'Datos incompletos')
    .replace(/projeto/gi, 'proyecto')
    .replace(/ausentes/gi, 'ausentes')
    .replace(/Licença não encontrada ou inativa/gi, 'Función no disponible en esta build local.')
    .replace(/Licença/gi, 'Modo local')
    .replace(/licença/gi, 'modo local')
    .replace(/Arquivo vazio/gi, 'Archivo vacío')
    .replace(/extensão/g, 'extensión')
    .replace(/Extensão/g, 'Extensión');
}

function buildSessionHeaders(projectId) {
  return new Promise(function(resolve) {
    var ua = navigator.userAgent || "";
    var hints = (navigator.userAgentData && navigator.userAgentData.brands) ? navigator.userAgentData.brands : [];
    var brandsStr = "";
    for (var i = 0; i < hints.length; i++) {
      if (i > 0) brandsStr += ", ";
      brandsStr += '"' + hints[i].brand + '";v="' + hints[i].version + '"';
    }
    var platform = (navigator.userAgentData && navigator.userAgentData.platform) ? navigator.userAgentData.platform : "Windows";
    var mobile = (navigator.userAgentData && navigator.userAgentData.mobile) ? "?1" : "?0";
    var langs = navigator.languages && navigator.languages.length ? navigator.languages.slice(0, 3).join(",") : (navigator.language || "en-US");
    var headers = {
      "user-agent": ua,
      "sec-ch-ua": brandsStr,
      "sec-ch-ua-mobile": mobile,
      "sec-ch-ua-platform": '"' + platform + '"',
      "accept-language": langs,
      "accept-encoding": "gzip, deflate, br, zstd",
      "origin": "https://lovable.dev",
      "referer": "https://lovable.dev/projects/" + (projectId || ""),
      "priority": "u=1, i",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    };
    try {
      chrome.storage.local.get(["lovable_browserSessionId", "lovable_clientGitSha", "lovable_lovPlatform"], function(sd) {
        if (sd && sd.lovable_browserSessionId) headers["x-browser-session-id"] = String(sd.lovable_browserSessionId).trim();
        if (sd && sd.lovable_clientGitSha) headers["x-client-git-sha"] = String(sd.lovable_clientGitSha).trim();
        if (sd && sd.lovable_lovPlatform) headers["x-lov-platform"] = String(sd.lovable_lovPlatform).trim();
        chrome.runtime.sendMessage({ action: "getLovableCookies" }, function(resp) {
          if (resp && resp.cookie) headers["cookie"] = resp.cookie;
          resolve(headers);
        });
      });
    } catch (e) {
      resolve(headers);
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
    return '';
  } catch(e) { return ''; }
}

function decodeJwtPayload(token) {
  try {
    const raw = String(token || '').replace(/^Bearer\s+/i, '').trim();
    const parts = raw.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch(e) {
    return null;
  }
}

function t(key) {
  if (window.QL_I18N && typeof window.QL_I18N.t === 'function') {
    return window.QL_I18N.t(key);
  }
  return key;
}

function bgFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: "proxyFetch",
      url,
      method: options.method || "POST",
      headers: options.headers || {},
      body: options.body || null,
    }, (resp) => {
      if (chrome.runtime.lastError) {
        console.error("[bgFetch] runtime error:", chrome.runtime.lastError.message);
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!resp) {
        return reject(new Error("Sin respuesta del background"));
      }
      if (resp.data && typeof resp.data === "object") {
        resolve(resp.data);
      } else if (!resp.ok) {
        reject(new Error("Fetch falló via background (status " + resp.status + ")"));
      } else {
        resolve(resp.data);
      }
    });
  });
}

(function injectHook(){
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("pageHook.js");
    s.onload = () => s.remove();
    (document.documentElement || document.head || document.body).appendChild(s);
  } catch (e) {
    console.warn("[ContentScript] error al inyectar pageHook", e);
  }
})();

let qlSessionId = null;
let qlHeartbeatInterval = null;
let qlUserName = null;
let qlExpiresAt = null;
let qlActivatedAt = null;
let qlLicenseStatus = null;
let qlOnlineCount = 0;
let qlMinimized = false;
let qlHeight = 520;
let qlSpeechRecognition = null;
let qlIsRecording = false;
let qlDeviceId = null;
let qlShieldActive = false;
let qlActiveTab = 'prompt';
let qlChatHistory = [];
const QL_HISTORY_KEY = 'ql_chat_history';
const QL_MAX_HISTORY = 200;

function getDeviceId(){
  return getHardwareFingerprint();
}

function qlUnlockFreeMode(callback){
  // Legacy  now loads from real storage
  _loadLicenseFromStorage(callback);
}

function _loadLicenseFromStorage(callback){
  try {
    chrome.storage.local.get([
      "ql_license_valid", "ql_license_key", "ql_expires_at",
      "ql_activated_at", "ql_license_status", "ql_session_id",
      "ql_user_name"
    ], function(res){
      if (res && res.ql_license_valid && res.ql_license_key) {
        qlLicenseStatus = res.ql_license_status || "active";
        qlSessionId = res.ql_session_id || "";
        qlUserName = res.ql_user_name || "";
        qlExpiresAt = res.ql_expires_at || null;
        qlActivatedAt = res.ql_activated_at || null;
      }
      if (callback) callback();
    });
  } catch(e){
    if (callback) callback();
  }
}

function createUI(){
  const existingFloating = document.getElementById("ql-floating");
  if (existingFloating) {
    const txt = (existingFloating.textContent || "");
    if (/Lovable Master|Quick Shortcuts|Remove Watermark|Loading Model|Waiting for sync/i.test(txt) || !/WalrOS Lovable/i.test(txt)) {
      try { existingFloating.remove(); } catch(e) {}
    } else {
      return;
    }
  }
  chrome.storage.local.get(["ql_sidebar_mode", "ql_native_chat"], (res) => {
    if(res.ql_sidebar_mode === true) {
      console.log("[ContentScript] Sidebar mode active, skipping floating UI");
      return;
    }
    if(res.ql_native_chat === true) {
      console.log("[ContentScript] Native chat mode active, skipping floating UI");
      return;
    }
    _buildFloatingUI();
  });
}

function _buildFloatingUI(){
  if(document.getElementById("ql-floating")) return;

  const box = document.createElement("div");
  box.id = "ql-floating";
  const initialLeft = Math.max(10, window.innerWidth - 400);
  box.style.left = initialLeft + "px";
  box.style.top = "80px";

  chrome.storage.local.get(["ql_minimized","ql_height","ql_dark_mode","ql_license_key","ql_license_valid"], async (res) => {
    qlMinimized = res.ql_minimized || false;
    qlHeight = res.ql_height || 520;
    qlDeviceId = await getDeviceId();

    if(res.ql_dark_mode === false) {
      box.classList.add("ql-light");
    }
    if(qlMinimized) {
      box.classList.add("ql-minimized");
    }

    document.body.appendChild(box);

    // License check
    if (res.ql_license_valid && res.ql_license_key) {
      _loadLicenseFromStorage(() => showMainUI(box));
    } else {
      showLicenseGate(box);
    }

    setupDrag();
    setupResize();
  });
}

function showLicenseGate(box){
  if(!box && document.getElementById("ql-floating")) box = document.getElementById("ql-floating");
  if(!box) { console.warn("[walros] no floating box for license gate"); return; }
  if(box.classList.contains("ql-license-loaded")) return;

  box.innerHTML =
    '<div id="ql-license-gate" style="display:flex;flex-direction:column;height:100%;padding:24px;box-sizing:border-box;">' +
      /* Header */
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<div style="font-size:40px;margin-bottom:6px;line-height:1">🦭</div>' +
        '<h2 style="margin:0 0 4px;font-size:18px;font-weight:700;background:linear-gradient(90deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">WalrOS Lovable Tweak</h2>' +
        '<p style="margin:0;font-size:12px;color:#71717a;">Ingresa tu licencia para poder acceder.</p>' +
      '</div>' +
      /* License input card */
      '<div style="background:#181825;border:1px solid #2a2a3e;border-radius:12px;padding:20px;flex:1;display:flex;flex-direction:column;">' +
        '<label style="font-size:11px;color:#a1a1aa;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Clave de licencia</label>' +
        '<input id="ql-license-input" type="text" placeholder="WAL-XXXXXXXX-XXXX-XXXX" autocomplete="off" ' +
               'style="width:100%;padding:10px 12px;font-size:14px;font-family:monospace;border:1px solid #2a2a3e;border-radius:8px;background:#0a0a0f;color:#e4e4e7;box-sizing:border-box;margin-bottom:12px;outline:none;" ' +
               'onfocus="this.style.borderColor=\'#7c3aed\'" onblur="this.style.borderColor=\'#2a2a3e\'">' +
        '<button id="ql-validate-btn" ' +
                'style="width:100%;padding:10px;font-size:13px;font-weight:600;border:none;border-radius:8px;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;transition:opacity .2s,transform .1s;" ' +
                'onmouseover="this.style.opacity=\'.9\'" onmouseout="this.style.opacity=\'1\'" onmousedown="this.style.transform=\'scale(.98)\'" onmouseup="this.style.transform=\'scale(1)\'">' +
          'Activar licencia' +
        '</button>' +
        '<div id="ql-license-log" style="margin-top:10px;text-align:center;font-size:12px;min-height:18px;line-height:1.4;"></div>' +
      '</div>' +
      /* Footer link */
      '<div style="text-align:center;margin-top:12px;">' +
        '<a href="https://walros.org" target="_blank" ' +
           'style="font-size:11px;color:#a1a1aa;text-decoration:none;transition:color .15s;" ' +
           'onmouseover="this.style.color=\'#7c3aed\'" onmouseout="this.style.color=\'#a1a1aa\'">' +
          '¿No tienes licencia? Consigue una.' +
        '</a>' +
      '</div>' +
    '</div>';

  document.getElementById("ql-validate-btn").addEventListener("click", validateLicense);
  document.getElementById("ql-license-input").addEventListener("keydown", function(e){
    if(e.key === "Enter") validateLicense();
  });
  document.getElementById("ql-license-input").focus();
  box.classList.add("ql-license-loaded");
}

async function validateLicense(){
  const btn = document.getElementById("ql-validate-btn");
  const input = document.getElementById("ql-license-input");
  const log = document.getElementById("ql-license-log");
  if(!btn || !input || !log) return;

  const key = (input.value || "").trim().toUpperCase();
  if (!key) {
    log.className = "ql-log-error"; log.innerText = "Introduce una clave de licencia";
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Validando...";
  log.className = "ql-log-info";
  log.innerText = "Contactando servidor...";

  var hwFp = "";
  try { hwFp = await getHardwareFingerprint(); } catch(e) { hwFp = "unknown"; }

  try {
    const directResp = await fetch(PROXY_COMMAND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ license_key: key, hw_fingerprint: hwFp, _action: "validate" })
    });
    let resp;
    try { resp = await directResp.json(); } catch(e) { resp = null; }

    if (!resp || !resp.valid) {
      var errMsg = (resp && resp.error) || "Licencia no válida";
      log.className = "ql-log-error";
      log.innerText = "❌ " + errMsg;
      btn.disabled = false;
      btn.textContent = "Activar licencia";
      return;
    }

    // License valid  store it
    var now = new Date().toISOString();
    var storagePayload = {
      ql_license_valid: true,
      ql_license_key: key,
      ql_session_id: "wls-" + String(Math.random()).slice(2) + String(Date.now()).slice(-6),
      ql_user_name: "",
      ql_expires_at: resp.expires_at || null,
      ql_activated_at: resp.activated_at || now,
      ql_license_status: "active",
      ql_method_version: "v1"
    };

    qlLicenseStatus = "active";
    qlSessionId = storagePayload.ql_session_id;
    qlExpiresAt = storagePayload.ql_expires_at;
    qlActivatedAt = storagePayload.ql_activated_at;
    startHeartbeat(storagePayload.ql_license_key);
    chrome.storage.local.set(storagePayload, function(){
      log.className = "ql-log-success";
      log.innerText = "✅ ¡Licencia activada!";
      setTimeout(function(){
        var box = document.getElementById("ql-floating");
        if(box) showMainUI(box);
      }, 600);
    });
  } catch(err) {
    log.className = "ql-log-error";
    log.innerText = "❌ Error de conexión: " + (err.message || "desconocido");
    btn.disabled = false;
    btn.textContent = "Activar licencia";
  }
}

function showMainUI(box){
  const greeting = qlUserName || QL_FREE_USER_NAME;
  const statusBadge = '';

  box.innerHTML = templateMainUI(greeting, statusBadge, qlMinimized);
  box.style.height = qlHeight + "px";
  if (window.QL_I18N && window.QL_I18N.inject) {
    window.QL_I18N.inject();
  }

  setTimeout(() => {
    updateSyncStatus();
    qlStartSessionAutoSync();
    setupSend();
    setupStorageWatch();
    setupMinimize();
    setupSuggestionChips();
    setupWatermarkButton();
    updateTrialCountdown();
    setupDrag();
    setupResize();
    setupDarkMode();
    setupOptimize();
    setupSpeech();
    setupNotifications();
    setupModoPlan();
    setupFileAttachment();
    setupShield();
    setupTabs();
    setupModelSelector();
    loadChatHistory();
    setupNativeChatButton();
    setupClipboardPaste();
    setupDownloadProject();
    checkForUpdatePopup();
    checkResellerRolePopup();

    const sidePanelBtn = document.getElementById("ql-sidepanel-btn");
    if(sidePanelBtn){
      sidePanelBtn.addEventListener("click", () => {
        const floatingBox = document.getElementById("ql-floating");
        if(floatingBox) {
          floatingBox.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          floatingBox.style.opacity = "0";
          floatingBox.style.transform = "translateX(20px) scale(0.95)";
        }
        chrome.runtime.sendMessage({ action: "activateSidebar" }, (resp) => {
          if(resp && resp.ok && !resp.deferred){
            setTimeout(() => {
              if(floatingBox) floatingBox.remove();
              if(qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
              if(window.qlCountdownInterval) clearInterval(window.qlCountdownInterval);
            }, 350);
          } else if(resp && resp.deferred){
            if(floatingBox) {
              floatingBox.style.opacity = "1";
              floatingBox.style.transform = "none";
            }
            showCustomAlert("¡Casi está!", resp.message || "Haz clic en el icono de la extensión (arriba a la derecha) para abrir el panel lateral.");
          } else {
            if(floatingBox) {
              floatingBox.style.opacity = "1";
              floatingBox.style.transform = "none";
            }
            showCustomAlert("Error", "No se pudo abrir el panel lateral. Comprueba que tu navegador soporte esta función.");
          }
        });
      });
    }

    const logoutBtn = document.getElementById("ql-logout-btn");
    if(logoutBtn){
      logoutBtn.title = "Reiniciar panel local";
      logoutBtn.addEventListener("click", () => {
        if(qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
        qlUnlockFreeMode(() => showMainUI(box));
      });
    }
  }, 30);
}

function showCustomAlert(title, message){
  try {
    if (typeof QLSounds !== "undefined" && QLSounds.errorFromMessage) {
      var __ttl = (title || "") + " " + (message || "");
      if (/erro|error|negad|inv[áa]lid|expir|limite|payment|rate|token|cr[eé]dito|sess/i.test(__ttl)) {
        QLSounds.errorFromMessage(__ttl);
      }
    }
  } catch(__e){}
  const alert = document.getElementById("ql-custom-alert");
  if(!alert) return;
  const titleEl = alert.querySelector(".ql-alert-title");
  const msgEl = alert.querySelector(".ql-alert-message");
  const okBtn = alert.querySelector(".ql-alert-ok-btn");
  if(titleEl) titleEl.textContent = title;
  if(msgEl) msgEl.textContent = message;
  alert.style.display = "flex";
  if(okBtn) {
    okBtn.onclick = () => { alert.style.display = "none"; };
  }
  setTimeout(() => { alert.style.display = "none"; }, 4000);
}

function setupOptimize(){
  const btn = document.getElementById("ql-optimize-btn");
  if(!btn) return;
  btn.addEventListener("click", async () => {
    const textarea = document.getElementById("ql-msg");
    if(!textarea || !textarea.value.trim()) {
      showCustomAlert("Atención", "Escribe un prompt antes de optimizar.");
      return;
    }
    const original = textarea.value.trim();
    btn.classList.add("ql-tool-loading");
    btn.disabled = true;

    const storageData = await new Promise(r => chrome.storage.local.get(["ql_license_key"], r));
    const licenseKey = storageData.ql_license_key || "";

    try {
      const data = await bgFetch(OPTIMIZE_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "apikey": SUPABASE_ANON_KEY,
          "x-license-key": licenseKey
        },
        body: JSON.stringify({ prompt: original })
      });
      if(data.optimized_prompt) {
        textarea.value = data.optimized_prompt;
        showCustomAlert("¡Prompt optimizado! ✨", "Tu prompt se ha mejorado con IA y está listo para enviarse.");
      } else if(data.error) {
        showCustomAlert("Error", cleanVisibleMessage(data.error));
      }
    } catch(err) {
      console.error("[Optimize] erro:", err);
      showCustomAlert("Error", "Error al conectar con el optimizador: " + (err.message || ""));
    } finally {
      btn.classList.remove("ql-tool-loading");
      btn.disabled = false;
    }
  });
}

function setupSpeech(){
  const btn = document.getElementById("ql-speech-btn");
  if(!btn) return;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) {
    btn.title = "Voz no soportada en este navegador";
    btn.style.opacity = "0.4";
    btn.style.cursor = "not-allowed";
    return;
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if(qlIsRecording && qlSpeechRecognition) {
      qlSpeechRecognition.stop();
      return;
    }

    try {
      qlSpeechRecognition = new SpeechRecognition();
      qlSpeechRecognition.lang = (window.QL_I18N && window.QL_I18N.getLang) ? (window.QL_I18N.getLang() === 'en' ? 'en-US' : 'es-ES') : 'es-ES';
      qlSpeechRecognition.continuous = true;
      qlSpeechRecognition.interimResults = true;
      qlSpeechRecognition.maxAlternatives = 1;

      let finalTranscript = "";
      const textarea = document.getElementById("ql-msg");

      qlSpeechRecognition.onstart = () => {
        qlIsRecording = true;
        btn.classList.add("ql-recording");
        finalTranscript = textarea ? textarea.value : "";
        console.log("[QL Speech] Grabación iniciada");
      };

      qlSpeechRecognition.onresult = (event) => {
        let interim = "";
        for(let i = event.resultIndex; i < event.results.length; i++){
          const transcript = event.results[i][0].transcript;
          if(event.results[i].isFinal){
            finalTranscript += transcript + " ";
          } else {
            interim += transcript;
          }
        }
        if(textarea) textarea.value = finalTranscript + interim;
      };

      qlSpeechRecognition.onerror = (event) => {
        console.warn("[QL Speech] Error:", event.error);
        qlIsRecording = false;
        btn.classList.remove("ql-recording");
        
        if(event.error === "not-allowed") {
          showCustomAlert("Permiso denegado", "Permite el acceso al micrófono en la configuración del navegador.");
        } else if(event.error === "no-speech") {
          showCustomAlert("Sin audio", "No se detectó voz. Inténtalo de nuevo.");
        } else if(event.error !== "aborted") {
          showCustomAlert("Error de voz", "Error: " + event.error);
        }
      };

      qlSpeechRecognition.onend = () => {
        qlIsRecording = false;
        btn.classList.remove("ql-recording");
        if(textarea) textarea.value = finalTranscript.trim();
        console.log("[QL Speech] Grabación finalizada");
      };

      qlSpeechRecognition.start();
    } catch(err) {
      console.error("[QL Speech] Error al iniciar:", err);
      qlIsRecording = false;
      btn.classList.remove("ql-recording");
      showCustomAlert("Error", "No se pudo iniciar el reconocimiento de voz.");
    }
  });
}

function setupNotifications(){
  const bellBtn = document.querySelector(".ql-notif-btn");
  const panel = document.getElementById("ql-notif-panel");
  const closeBtn = document.getElementById("ql-notif-close");
  if(!bellBtn || !panel) return;

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "block";
    if(!isOpen) loadNotifications();
  });

  if(closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.style.display = "none";
    });
  }

  checkUnreadNotifications();
}

async function loadNotifications(){
  const list = document.getElementById("ql-notif-list");
  if(!list) return;
  list.innerHTML = '<p class="ql-notif-empty">Cargando...</p>';

  try {
    const data = await bgFetch(NOTIFICATIONS_URL, {
      method: "GET",
      headers: { "apikey": SUPABASE_ANON_KEY }
    });
    
    if(!data || data.length === 0){
      list.innerHTML = '<p class="ql-notif-empty">No hay notificaciones.</p>';
      return;
    }

    const ids = data.map(n => n.id);
    chrome.storage.local.set({ ql_read_notifs: ids });
    const badge = document.querySelector(".ql-notif-badge");
    if(badge) badge.style.display = "none";

    list.innerHTML = data.map(n => {
      const date = new Date(n.created_at).toLocaleDateString("es-ES");
      const safeLink = sanitizeUrl(n.link);
      const linkHtml = safeLink ? '<a href="' + escapeHtml(safeLink) + '" target="_blank" rel="noopener noreferrer" class="ql-notif-link">Abrir enlace 🔗</a>' : '';
      return '<div class="ql-notif-item"><div class="ql-notif-item-title">' + escapeHtml(n.title) + '</div><div class="ql-notif-item-msg">' + escapeHtml(n.message) + '</div>' + linkHtml + '<div class="ql-notif-item-date">' + date + '</div></div>';
    }).join('');
  } catch(err) {
    list.innerHTML = '<p class="ql-notif-empty">Error al cargar.</p>';
  }
}

async function checkUnreadNotifications(){
  try {
    const data = await bgFetch(NOTIFICATIONS_URL, {
      method: "GET",
      headers: { "apikey": SUPABASE_ANON_KEY }
    });
    if(!data || data.length === 0) return;

    chrome.storage.local.get(["ql_read_notifs"], (res) => {
      const readIds = res.ql_read_notifs || [];
      const unread = data.filter(n => !readIds.includes(n.id)).length;
      const badge = document.querySelector(".ql-notif-badge");
      if(badge) {
        if(unread > 0) {
          badge.textContent = unread;
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    });
  } catch(e) {}
}

function setupSuggestionChips(){
  const container = document.getElementById("ql-chips");
  if(!container) return;
  PROMPT_TEMPLATES.forEach((t) => {
    const chip = document.createElement("button");
    chip.className = "ql-chip";
    chip.innerHTML = t.icon + " " + t.label;
    chip.title = window.QL_I18N && window.QL_I18N.t ? window.QL_I18N.t(t.prompt) : t.prompt;
    chip.addEventListener("click", () => {
      const textarea = document.getElementById("ql-msg");
      if(textarea) textarea.value = window.QL_I18N && window.QL_I18N.t ? window.QL_I18N.t(t.prompt) : t.prompt;
    });
    container.appendChild(chip);
  });
}

function setupWatermarkButton(){
  var btn = document.getElementById("ql-remove-watermark");
  if(!btn) return;
  btn.addEventListener("click", async function(){
    var log = document.getElementById("ql-log");
    btn.disabled = true;
    btn.textContent = "\u23f3 Enviando...";

    await qlForceSessionSync();

    var storageData = await new Promise(function(resolve){
      chrome.storage.local.get(["lovable_projectId","lovable_token","ql_license_key"], resolve);
    });
    var projectId = storageData.lovable_projectId || "";
    var token = storageData.lovable_token || "";
    var licenseKey = storageData.ql_license_key || "";

    if(!projectId || !token){
      if(log){ log.className = "ql-log-error"; log.innerText = "\u26a0 Proyecto no sincronizado."; }
      btn.disabled = false;
      btn.textContent = "\ud83d\udeab Quitar marca de agua";
      return;
    }

    if(token.startsWith("Bearer ")) token = token.slice(7);

    try {
      var payload = {
        license_key: licenseKey,
        token_lovable: token,
        project_id: projectId
      };

      var result = await bgFetch(REMOVE_WATERMARK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "x-license-key": licenseKey },
        body: JSON.stringify(payload)
      });

      if(!result || result.success === false || result.ok === false){
        throw new Error((result && (result.error_display || result.error || result.message)) || "Error al enviar");
      }

      if(log){ log.className = "ql-log-success"; log.innerText = "\u2713 Marca de agua quitada correctamente!"; }
    } catch(err) {
      if(log){ log.className = "ql-log-error"; log.innerText = "\u2717 " + cleanVisibleMessage(err.message || err); }
    } finally {
      btn.disabled = false;
      btn.textContent = "\ud83d\udeab Quitar marca de agua";
    }
  });
}

function updateTrialCountdown(){
  const el = document.getElementById("ql-trial-countdown");
  if(!el) return;
  if(!qlExpiresAt) { el.style.display = "none"; el.innerHTML = ""; return; }

  const expiresMs = new Date(qlExpiresAt).getTime();
  const now = Date.now();
  if(expiresMs <= now) {
    el.style.display = "flex";
    el.innerHTML = '<div class="ql-countdown-row"><span class="ql-countdown-icon">⏳</span><span class="ql-countdown-expired">Licencia expirada</span></div>';
    return;
  }

  // ponytail: totalDuration = max entre duración real y 1h para que la barra no explote
  const totalMs = Math.max(expiresMs - qlActivatedAt ? new Date(qlActivatedAt).getTime() : expiresMs - now, 3600000);
  el.style.display = "flex";

  function tick() {
    const remaining = expiresMs - Date.now();
    if(remaining <= 0) { el.innerHTML = '<div class="ql-countdown-row"><span class="ql-countdown-icon">⏳</span><span class="ql-countdown-expired">Licencia expirada</span></div>'; return; }
    const days = Math.floor(remaining / 86400000);
    const hrs = Math.floor((remaining % 86400000) / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const pct = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
    const timeStr = days > 0
      ? days + 'd ' + hrs + 'h'
      : hrs > 0 ? hrs + 'h ' + mins + 'm' : mins + 'min';
    const urgentClass = pct < 20 ? ' ql-bar-urgent' : '';
    const label = (window.QL_I18N && window.QL_I18N.t ? window.QL_I18N.t('Licencia') : 'Licencia');
    el.innerHTML =
      '<div class="ql-countdown-row">' +
        '<span class="ql-countdown-icon">⏳</span>' +
        '<span class="ql-countdown-label">' + label + '</span>' +
        '<span class="ql-countdown-time">' + timeStr + '</span>' +
      '</div>' +
      '<div class="ql-trial-bar">' +
        '<div class="ql-trial-bar-fill' + urgentClass + '" style="width:' + pct + '%"></div>' +
      '</div>';
  }
  tick();
  setInterval(tick, 30000); // ponytail: cada 30s basta, no necesitamos segundos
}

function setupMinimize(){
  const btn = document.getElementById("ql-minimize");
  if(!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const box = document.getElementById("ql-floating");
    if(!box) return;
    qlMinimized = !qlMinimized;
    box.classList.toggle("ql-minimized", qlMinimized);
    btn.textContent = qlMinimized ? "◀" : "▶";
    chrome.storage.local.set({ ql_minimized: qlMinimized });
  });
}

function setupDarkMode(){
  const moonBtn = document.querySelector('.ql-icon-btn[title="Tema"]');
  if(!moonBtn) return;
  moonBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const box = document.getElementById("ql-floating");
    if(!box) return;
    const isLight = box.classList.toggle("ql-light");
    chrome.storage.local.set({ ql_dark_mode: !isLight });
  });
}

function setupModoPlan(){
  const toggle = document.getElementById("ql-modo-plano");
  if(!toggle) return;

  chrome.storage.local.get(["ql_modo_plano"], (res) => {
    if(res.ql_modo_plano === true) toggle.checked = true;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ ql_modo_plano: toggle.checked });
  });
}

function showModoPlanAlert(){
  const existing = document.querySelector('.ql-modo-plano-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'ql-modo-plano-overlay';
  overlay.innerHTML = '<div class="ql-modo-plano-modal">' +
    '<div class="ql-modo-plano-icon">\u26a0\ufe0f</div>' +
    '<div class="ql-modo-plano-title">Atención  Modo plan</div>' +
    '<div class="ql-modo-plano-body">' +
      'El <strong>Modo plan/pensar</strong> puede consumir créditos, pero ayuda bastante. Pásalo con cabeza.' +
    '</div>' +
    '<div class="ql-modo-plano-steps">' +
      '<div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">1</span><span class="ql-modo-plano-step-text">Activa el <strong>Modo plan</strong> para generar un plan.</span></div>' +
      '<div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">2</span><span class="ql-modo-plano-step-text">En Lovable, <strong>no pulses el botón Aprobar</strong>; copia solo el nuevo plan.</span></div>' +
      '<div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">3</span><span class="ql-modo-plano-step-text">Pega el plan copiado en el prompt de la extensión.</span></div>' +
      '<div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">4</span><span class="ql-modo-plano-step-text"><strong>Desactiva el Modo plan</strong> y envíalo desde la extensión; así no se consumen créditos extra.</span></div>' +
    '</div>' +
    '<div class="ql-modo-plano-check">' +
      '<input type="checkbox" id="ql-modo-plano-dismiss" />' +
      '<label for="ql-modo-plano-dismiss">No mostrar de nuevo</label>' +
    '</div>' +
    '<button class="ql-modo-plano-btn" id="ql-modo-plano-ok">Entendido</button>' +
  '</div>';

  const box = document.getElementById('ql-floating');
  if(box) box.appendChild(overlay);
  else document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('ql-modo-plano-visible'));

  const close = () => {
    overlay.classList.remove('ql-modo-plano-visible');
    setTimeout(() => overlay.remove(), 180);
  };

  const okBtn = overlay.querySelector('#ql-modo-plano-ok');
  if(okBtn){
    okBtn.addEventListener('click', () => {
      const dismiss = overlay.querySelector('#ql-modo-plano-dismiss');
      if(dismiss && dismiss.checked){
        chrome.storage.local.set({ ql_modo_plano_alert_dismissed: true });
      }
      close();
    });
  }

  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) close();
  });
}

function setupShield(){
  const btn = document.getElementById("ql-shield-btn");
  if(!btn) return;

  chrome.storage.local.get(["ql_shield_active"], (res) => {
    if(res.ql_shield_active === true) {
      qlShieldActive = true;
      btn.classList.add("ql-shield-active");
      const label = document.getElementById("ql-shield-label");
      if(label) label.textContent = "Desactivar escudo";
      injectShieldOverlay();
    }
  });

  btn.addEventListener("click", () => {
    qlShieldActive = !qlShieldActive;
    chrome.storage.local.set({ ql_shield_active: qlShieldActive });

    const label = document.getElementById("ql-shield-label");
    if(qlShieldActive) {
      btn.classList.add("ql-shield-active");
      if(label) label.textContent = "Desactivar escudo";
      injectShieldOverlay();
      showCustomAlert("Escudo activado 🛡️", "El input de Lovable está bloqueado. Usa la extensión para enviar prompts.");
    } else {
      btn.classList.remove("ql-shield-active");
      if(label) label.textContent = "Activar escudo";
      removeShieldOverlay();
      showCustomAlert("Escudo desactivado", "El input de Lovable vuelve a estar libre.");
    }
  });
}

function injectShieldOverlay(){
  if(document.getElementById("ql-shield-overlay")) return;

  const chatForm = document.querySelector('form#chat-input');
  if(!chatForm) {
    setTimeout(injectShieldOverlay, 1000);
    return;
  }

  const existingPos = getComputedStyle(chatForm).position;
  if(existingPos === 'static') {
    chatForm.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.id = 'ql-shield-overlay';
  overlay.className = 'ql-shield-overlay';
  overlay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
    '</svg>' +
    '<span class="ql-shield-overlay-text">\ud83d\udee1\ufe0f Protegido por WalrOS Lovable Tweak</span>' +
    '<span class="ql-shield-overlay-sub">Usa la extensión para enviar prompts</span>';

  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);

  overlay.addEventListener('keydown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, true);

  chatForm.appendChild(overlay);

  const inputs = chatForm.querySelectorAll('input, button, textarea, [contenteditable]');
  inputs.forEach(el => {
    if(el.id !== 'ql-shield-overlay') {
      el.dataset.qlShieldDisabled = el.disabled || '';
      el.dataset.qlShieldTabindex = el.getAttribute('tabindex') || '';
      el.setAttribute('tabindex', '-1');
      if(el.tagName !== 'DIV') el.disabled = true;
      if(el.contentEditable === 'true') {
        el.contentEditable = 'false';
        el.dataset.qlShieldEditable = 'true';
      }
    }
  });
}

function removeShieldOverlay(){
  const overlay = document.getElementById('ql-shield-overlay');
  if(overlay) overlay.remove();

  const chatForm = document.querySelector('form#chat-input');
  if(!chatForm) return;

  const inputs = chatForm.querySelectorAll('[data-ql-shield-disabled]');
  inputs.forEach(el => {
    const wasDis = el.dataset.qlShieldDisabled;
    if(wasDis === 'true') el.disabled = true;
    else if(wasDis === '' || wasDis === 'false') el.disabled = false;
    delete el.dataset.qlShieldDisabled;

    const oldTab = el.dataset.qlShieldTabindex;
    if(oldTab) el.setAttribute('tabindex', oldTab);
    else el.removeAttribute('tabindex');
    delete el.dataset.qlShieldTabindex;

    if(el.dataset.qlShieldEditable === 'true') {
      el.contentEditable = 'true';
      delete el.dataset.qlShieldEditable;
    }
  });
}

function startHeartbeat(licenseKey){
  if(qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
  if(!licenseKey) return;
  async function tick(){
    try {
      var hwFp = "";
      try { hwFp = await getHardwareFingerprint(); } catch(e) { hwFp = "unknown"; }
      var r = await fetch(PROXY_COMMAND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ license_key: licenseKey, hw_fingerprint: hwFp, _action: "validate" })
      });
      var d;
      try { d = await r.json(); } catch(e) { d = null; }
      if(!d || !d.valid) {
        chrome.storage.local.set({
          ql_license_valid: false, ql_license_status: "revoked",
          ql_license_key: "", ql_expires_at: null, ql_activated_at: null
        });
        qlLicenseStatus = "revoked";
        if(qlHeartbeatInterval) { clearInterval(qlHeartbeatInterval); qlHeartbeatInterval = null; }
        var box = document.getElementById("ql-floating");
        if(box) showLicenseGate(box);
      }
    } catch(e) {}
  }
  qlHeartbeatInterval = setInterval(tick, 300000);
  setTimeout(tick, 5000);
}

let qlExpiredHandled = false;

function handleLicenseExpired(){
  const box = document.getElementById("ql-floating");
  if(box) qlUnlockFreeMode(() => showMainUI(box));
}

window.showPaymentUI = showPaymentUI;
async function showPaymentUI(box, preselectedPkg){
  qlUnlockFreeMode(() => { if(box) showMainUI(box); });
}

function showCheckoutScreen(box, pkg){
  qlUnlockFreeMode(() => { if(box) showMainUI(box); });
}

function qlBootstrap() {
  if (document.getElementById("ql-floating")) return;
  if (!document.body) {
    var bodyWait = new MutationObserver(function() {
      if (document.body) {
        bodyWait.disconnect();
        qlBootstrap();
      }
    });
    bodyWait.observe(document.documentElement, { childList: true });
    return;
  }
  createUI();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(qlBootstrap, 50);
} else {
  document.addEventListener("DOMContentLoaded", function() { setTimeout(qlBootstrap, 50); });
}

var qlRetryCount = 0;
var qlRetryDelays = [300, 600, 1000, 1500, 2000, 3000, 4000, 5000];
function qlRetryInit() {
  if (document.getElementById("ql-floating") || qlRetryCount >= qlRetryDelays.length) return;
  var delay = qlRetryDelays[qlRetryCount];
  qlRetryCount++;
  setTimeout(function() {
    if (!document.getElementById("ql-floating") && document.body) {
      createUI();
    }
    qlRetryInit();
  }, delay);
}
qlRetryInit();

chrome.storage.onChanged.addListener((changes, area) => {
  if(area !== "local") return;
  if(changes.ql_sidebar_mode) {
    if(changes.ql_sidebar_mode.newValue === true) {
      const floatingBox = document.getElementById("ql-floating");
      if(floatingBox) {
        floatingBox.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        floatingBox.style.opacity = "0";
        floatingBox.style.transform = "scale(0.95)";
        setTimeout(() => floatingBox.remove(), 350);
      }
    } else if(changes.ql_sidebar_mode.newValue === false) {
      setTimeout(() => {
        _buildFloatingUI();
        setTimeout(() => {
          const floatingBox = document.getElementById("ql-floating");
          if(floatingBox) {
            floatingBox.style.opacity = "0";
            floatingBox.style.transform = "scale(0.95) translateX(20px)";
            requestAnimationFrame(() => {
              floatingBox.style.transition = "opacity 0.4s ease, transform 0.4s ease";
              floatingBox.style.opacity = "1";
              floatingBox.style.transform = "scale(1) translateX(0)";
            });
          }
        }, 50);
      }, 100);
    }
  }
});

function updateSyncStatus(){
  chrome.storage.local.get(["lovable_projectId","lovable_token"], (res)=>{
    const status = document.getElementById("ql-sync-status");
    if(!status) return;
    if(res.lovable_projectId && res.lovable_token){
      status.className = "ql-sync-status ql-sync-ok";
      const pid = res.lovable_projectId.substring(0, 6);
      const syncTxt = (window.QL_I18N && window.QL_I18N.t('¡Sincronizado! Proyecto: ')) || '¡Sincronizado! Proyecto: ';
      status.innerHTML = '<span class="ql-sync-text">✅ ' + syncTxt + pid + '...</span>';
    } else {
      status.className = "ql-sync-status ql-sync-waiting";
      const waitTxt = (window.QL_I18N && window.QL_I18N.t('Esperando sincronización...')) || 'Esperando sincronización...';
      status.innerHTML = '<span class="ql-sync-text">⏳ ' + waitTxt + '</span>';
    }
  });
}

function setupStorageWatch(){
  chrome.storage.onChanged.addListener((changes)=>{
    if(changes.lovable_projectId || changes.lovable_token){
      updateSyncStatus();
    }
  });
}

function requestLatestTokenFromHook(timeoutMs = 1200){
  return new Promise((resolve)=>{
    let finished = false;

    function finish(updated){
      if(finished) return;
      finished = true;
      clearTimeout(timer);
      chrome.storage.onChanged.removeListener(onStorageChange);
      resolve(updated);
    }

    function onStorageChange(changes, area){
      if(area !== "local") return;
      if((changes.lovable_token && changes.lovable_token.newValue) || (changes.lovable_browserSessionId && changes.lovable_browserSessionId.newValue)){
        finish(true);
      }
    }

    const timer = setTimeout(()=> finish(false), Math.max(300, timeoutMs));
    chrome.storage.onChanged.addListener(onStorageChange);

    try {
      window.postMessage({ type: "lovableRequestToken" }, "*");
      setTimeout(()=> window.postMessage({ type: "lovableRequestToken" }, "*"), 120);
    } catch(e) {
      finish(false);
    }
  });
}

function qlExtractProjectIdFromUrl(url){
  try {
    var str = String(url || location.href || "");
    var patterns = [
      /\/projects\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
      /\/project\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
      /projectId[=:]([0-9a-fA-F-]{36})/i,
      /project_id[=:]([0-9a-fA-F-]{36})/i,
      /[?&]project=([0-9a-fA-F-]{36})/i,
      /\/projects\/([^/?#]+)/i,
      /\/project\/([^/?#]+)/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = str.match(patterns[i]);
      if (m && m[1]) return decodeURIComponent(m[1]);
    }
  } catch(e) {}
  return "";
}

function qlFindProjectIdInStorage(){
  try {
    var stores = [window.localStorage, window.sessionStorage];
    var uuidRe = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    for (var si=0; si<stores.length; si++) {
      var store = stores[si];
      if(!store) continue;
      for (var i=0; i<store.length; i++) {
        var k = store.key(i) || "";
        var v = store.getItem(k) || "";
        var keyHit = /project|lovable/i.test(k);
        var m = String(v).match(uuidRe) || String(k).match(uuidRe);
        if(keyHit && m && m[0]) return m[0];
      }
    }
  } catch(e) {}
  return "";
}

function qlFindProjectIdInDom(){
  try {
    var links = document.querySelectorAll('a[href*="/projects/"],a[href*="/project/"]');
    for (var i=0; i<links.length; i++) {
      var pid = qlExtractProjectIdFromUrl(links[i].href || links[i].getAttribute('href') || '');
      if(pid) return pid;
    }
  } catch(e) {}
  return "";
}

function qlFindAnyProjectId(){
  return qlExtractProjectIdFromUrl(location.href) || qlFindProjectIdInStorage() || qlFindProjectIdInDom();
}

async function qlForceSessionSync(timeoutMs = 1800){
  var changed = false;
  try {
    var pid = qlFindAnyProjectId();
    if (pid) { chrome.storage.local.set({ lovable_projectId: pid }); changed = true; }
  } catch(e) {}

  try {
    var fromHook = await requestLatestTokenFromHook(timeoutMs);
    if (fromHook) changed = true;
  } catch(e) {}

  try {
    var current = await new Promise(function(resolve){ chrome.storage.local.get(["lovable_token"], resolve); });
    if (!current || !current.lovable_token) {
      var cookieResp = await new Promise(function(resolve){
        try { chrome.runtime.sendMessage({ action: "readCookies" }, function(resp){ resolve(resp || {}); }); }
        catch(e){ resolve({}); }
      });
      if (cookieResp && cookieResp.success && cookieResp.tokens && cookieResp.tokens.length) {
        chrome.storage.local.set({ lovable_token: cookieResp.tokens[0].token });
        changed = true;
      }
    }
  } catch(e) {}

  try { updateSyncStatus(); } catch(e) {}
  return changed;
}

function qlStartSessionAutoSync(){
  try {
    qlForceSessionSync(1200);
    setTimeout(function(){ qlForceSessionSync(1200); }, 900);
    setTimeout(function(){ qlForceSessionSync(1500); }, 2500);
    if (!window.__walrosSyncInterval) {
      window.__walrosSyncInterval = setInterval(function(){ qlForceSessionSync(900); }, 5000);
    }
  } catch(e) {}
}

try {
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (!msg || msg.action !== "requestLovableSessionFromPage") return false;
    requestLatestTokenFromHook(msg.timeoutMs || 1200).then(function(updated) {
      chrome.storage.local.get(["lovable_projectId", "lovable_token", "lovable_browserSessionId"], function(res) {
        sendResponse({ ok: true, updated: updated, url: location.href, projectId: res.lovable_projectId || "", token: res.lovable_token || "", hasToken: !!res.lovable_token, browserSessionId: res.lovable_browserSessionId || "" });
      });
    }).catch(function(err) {
      sendResponse({ ok: false, error: err && err.message ? err.message : "Error al sincronizar sesión" });
    });
    return true;
  });
} catch(e) {}

// ===== CHAT HISTORY SYSTEM (Floating Popup) =====
function loadChatHistory(cb) {
  chrome.storage.local.get([QL_HISTORY_KEY], (res) => {
    qlChatHistory = res[QL_HISTORY_KEY] || [];
    updateHistoryBadge();
    if(cb) cb();
  });
}

function saveChatHistory() {
  if(qlChatHistory.length > QL_MAX_HISTORY) qlChatHistory = qlChatHistory.slice(-QL_MAX_HISTORY);
  chrome.storage.local.set({ [QL_HISTORY_KEY]: qlChatHistory });
}

function addToChatHistory(text, status) {
  qlChatHistory.push({ text: text, timestamp: new Date().toISOString(), status: status || 'ok' });
  saveChatHistory();
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const badge = document.getElementById('ql-history-badge');
  if(!badge) return;
  if(qlChatHistory.length > 0) {
    badge.textContent = qlChatHistory.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function formatChatDate(dateStr) {
  var d = new Date(dateStr);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var diff = (today - msgDay) / 86400000;
  if(diff === 0) return 'Hoy';
  if(diff === 1) return 'Ayer';
  if(diff < 7) return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()];
  return d.toLocaleDateString('es-ES');
}

function formatChatTime(dateStr) {
  var d = new Date(dateStr);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function renderHistoryView() {
  const container = document.getElementById('ql-tab-content');
  if(!container) return;

  if(!qlChatHistory.length) {
    container.innerHTML = '<div class="ql-chat-empty"><div style="font-size:28px;margin-bottom:8px">x</div><div style="font-size:13px;font-weight:600;color:var(--ql-text-primary,#f4f4f5)">Ningún mensaje</div><div style="font-size:11px;color:var(--ql-text-muted,#71717a);margin-top:4px">Tus prompts enviados aparecerán aquí.</div></div>';
    return;
  }

  let html = '<div class="ql-chat-messages">';
  let lastDate = '';
  for(let i = 0; i < qlChatHistory.length; i++) {
    const m = qlChatHistory[i];
    const dateLabel = formatChatDate(m.timestamp);
    if(dateLabel !== lastDate) {
      html += '<div class="ql-chat-date-divider"><span class="ql-chat-date-label">' + dateLabel + '</span></div>';
      lastDate = dateLabel;
    }
    const statusClass = m.status === 'error' ? 'ql-chat-status-err' : 'ql-chat-status-ok';
    const statusText = m.status === 'error' ? '❌ Error' : '✅ Enviado';
    const truncated = m.text.length > 300 ? escapeHtml(m.text.substring(0, 300)) + '⬦' : escapeHtml(m.text);
    html += '<div class="ql-chat-bubble" title="' + escapeHtml(m.text) + '">' + truncated +
      '<div class="ql-chat-meta"><span class="' + statusClass + '">' + statusText + '</span><span class="ql-chat-time">' + formatChatTime(m.timestamp) + '</span></div></div>';
  }
  html += '</div>';
  html += '<div class="ql-chat-actions"><span class="ql-chat-count">' + qlChatHistory.length + ' mensaje' + (qlChatHistory.length === 1 ? '' : 's') + '</span><button class="ql-chat-clear" id="ql-chat-clear">🗑️ Limpiar</button></div>';
  container.innerHTML = html;

  const msgs = container.querySelector('.ql-chat-messages');
  if(msgs) msgs.scrollTop = msgs.scrollHeight;

  const clearBtn = document.getElementById('ql-chat-clear');
  if(clearBtn) {
    clearBtn.addEventListener('click', () => {
      qlChatHistory = [];
      saveChatHistory();
      updateHistoryBadge();
      renderHistoryView();
    });
  }
}

function renderPromptView() {
  const container = document.getElementById('ql-tab-content');
  if(!container) return;
  container.innerHTML =
    '<textarea id="ql-msg" rows="3" placeholder="Escribe tu comando..." spellcheck="false"></textarea>' +
    '<div id="ql-attach-preview" class="ql-attach-preview" style="display:none"></div>' +
    '<div class="ql-action-bar">' +
      '<div class="ql-action-left">' +
        '<label class="ql-toggle"><input type="checkbox" id="ql-modo-plano"><span class="ql-toggle-slider"></span></label>' +
        '<span class="ql-toggle-label-inline">Modo plan</span>' +
      '</div>' +
      '<div class="ql-action-center">' +
        '<button id="ql-attach-btn" class="ql-attach-btn" title="Adjuntar archivo (m\u00e1x. 10)">\ud83d\udcce</button>' +
        '<button id="ql-optimize-btn" class="ql-tool-btn" title="Optimizar con IA">' + SVG_ICONS.sparkles + '</button>' +
        '<button id="ql-speech-btn" class="ql-tool-btn" title="Voz a texto">' + SVG_ICONS.mic + '</button>' +
      '</div>' +
      '<div class="ql-action-right-send">' +
        '<button id="ql-send" class="ql-send-btn">Enviar</button>' +
      '</div>' +
    '</div>' +
    '<input type="file" id="ql-file-input" multiple style="display:none" accept="*/*">' +
    '<div id="ql-log"></div>' +
    '<div class="ql-shortcuts-section">' +
      '<span class="ql-shortcuts-title">ATAJOS R\u00c1PIDOS</span>' +
      '<div class="ql-shortcuts-grid" id="ql-chips"></div>' +
    '</div>' +
    '<button id="ql-remove-watermark" class="ql-watermark-btn">\ud83d\udeab Quitar marca de agua</button>' +
    '<button id="ql-shield-btn" class="ql-shield-btn">' +
      SVG_ICONS.shield + ' <span id="ql-shield-label">Activar escudo</span>' +
    '</button>' +
    '<button id="ql-native-chat-btn" class="ql-native-chat-btn">' +
      SVG_ICONS.msgSquare + ' Usar chat normal' +
    '</button>' +
    '<button id="ql-download-project" class="ql-watermark-btn" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px">\ud83d\udce5 Descargar todos los archivos</button>' +
    

    '<div id="ql-download-status" style="display:none"></div>';
  // Re-setup all prompt tab features
  setupSend();
  setupSuggestionChips();
  setupWatermarkButton();
  setupOptimize();
  setupSpeech();
  setupModoPlan();
  setupFileAttachment();
  setupShield();
  setupNativeChatButton();
  setupClipboardPaste();
  setupDownloadProject();
  // ponytail: re-apply i18n after DOM rebuild
  window.QL_I18N && window.QL_I18N.apply();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.ql-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      qlActiveTab = target;
      document.querySelectorAll('.ql-tab').forEach(t => t.classList.toggle('ql-tab-active', t.getAttribute('data-tab') === target));
      if(target === 'history') {
        loadChatHistory(() => renderHistoryView());
      } else {
        renderPromptView();
      }
    });
  });
}


// ============================================================
// FILE ATTACHMENT SYSTEM
// ============================================================
const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
let qlAttachedFiles = [];

const ALLOWED_IMAGE_MIMES = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
const IMAGE_EXT_TO_MIME = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' };

function validateImageFile(file) {
  if (!file) return { ok:false, reason:'Archivo inválido.' };
  if (typeof file.size !== 'number' || file.size <= 0) return { ok:false, reason:'Archivo vazio.' };
  if (file.size > MAX_FILE_SIZE) return { ok:false, reason:'Imagen demasiado grande (máx. 20 MB).' };
  var mime = (file.type || '').toLowerCase().split(';')[0].trim();
  if (!mime) {
    var ext = (file.name || '').toLowerCase().split('.').pop();
    mime = IMAGE_EXT_TO_MIME[ext] || '';
  }
  if (mime === 'image/jpg') mime = 'image/jpeg';
  if (!ALLOWED_IMAGE_MIMES.includes(mime) && mime.indexOf('image/') !== 0) {
    return { ok:false, reason:'Formato no soportado: ' + (file.type || 'desconocido') };
  }
  return { ok:true, mime: mime };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImageType(type) {
  return ['image/png', 'image/jpeg', 'image/webp'].includes(type);
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1280;
      let w = img.width, h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = file.type === 'image/png' ? undefined : 0.8;
      canvas.toBlob((blob) => {
        if (!blob) return resolve({ file, previewUrl: null });
        const compressed = new File([blob], file.name, { type: outputType });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file: compressed, previewUrl });
      }, outputType, quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ file, previewUrl: null }); };
    img.src = url;
  });
}

function blobToBase64(blob) {
  return new Promise(function(resolve, reject){
    var reader = new FileReader();
    reader.onload = function(){
      var res = reader.result || "";
      var comma = String(res).indexOf(",");
      resolve(comma >= 0 ? String(res).slice(comma + 1) : String(res));
    };
    reader.onerror = function(){ reject(new Error("Error al leer archivo")); };
    reader.readAsDataURL(blob);
  });
}

async function uploadFileV2Lovable(file, token, projectId) {
  var contentType = (file && file.type) ? file.type : "application/octet-stream";
  return {
    file_id: 'pending_v2_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now()),
    file_name: file.name || 'file',
    mime_type: contentType,
    method: 'v2',
    deferred: true
  };
}

async function uploadFileDirect(file, token, opts) {
  opts = opts || {};
  if (opts.method === "v2" && opts.projectId) {
    return await uploadFileV2Lovable(file, token, opts.projectId);
  }
  const inferContentType = (f) => {
    if (f && typeof f.type === 'string' && f.type.trim()) return f.type;
    const name = (f && f.name ? f.name : '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';
    const map = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif'
    };
    return map[ext] || 'application/octet-stream';
  };

  const lk = (opts && opts.licenseKey) || "";
  const contentType = inferContentType(file);
  var b64 = await blobToBase64(file);
  var result = await bgFetch(PROXY_COMMAND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "x-license-key": lk },
    body: JSON.stringify({
      action: "upload_prompt_image_v1",
      license_key: lk,
      file_data: b64,
      file_name: file.name || "image.png",
      file_type: contentType
    })
  });
  if (!result || result.success === false) {
    throw new Error((result && (result.error_display || result.message)) || "Error al subir archivo");
  }
  return result;
}

function renderAttachPreview() {
  const container = document.getElementById('ql-attach-preview');
  if (!container) return;
  if (qlAttachedFiles.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = qlAttachedFiles.map((f, i) => {
    const thumbHtml = f.previewUrl
      ? '<img class="ql-attach-thumb" src="' + f.previewUrl + '" alt="">'
      : '<div class="ql-attach-icon">📎</div>';
    const uploadingClass = f.uploading ? ' ql-attach-uploading' : '';
    return '<div class="ql-attach-item' + uploadingClass + '" data-idx="' + i + '">' +
      thumbHtml +
      '<div class="ql-attach-info"><span class="ql-attach-name" title="' + escapeHtml(f.file_name) + '">' + escapeHtml(f.file_name) + '</span><span class="ql-attach-size">' + escapeHtml(f.sizeLabel) + '</span></div>' +
      '<button class="ql-attach-remove" data-idx="' + i + '">✖</button>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.ql-attach-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (qlAttachedFiles[idx] && qlAttachedFiles[idx].previewUrl) {
        URL.revokeObjectURL(qlAttachedFiles[idx].previewUrl);
      }
      qlAttachedFiles.splice(idx, 1);
      renderAttachPreview();
    });
  });
}

function setupFileAttachment() {
  const attachBtn = document.getElementById('ql-attach-btn');
  const fileInput = document.getElementById('ql-file-input');
  if (!attachBtn || !fileInput) return;

  attachBtn.addEventListener('click', () => {
    if (qlAttachedFiles.length >= MAX_FILES) {
      showCustomAlert('Límite', 'Máximo de ' + MAX_FILES + ' archivos.');
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (!files.length) return;

    await qlForceSessionSync(1500);
    const storageData = await new Promise(r => chrome.storage.local.get(['lovable_token', 'lovable_projectId', 'ql_method_version', 'ql_license_key'], r));
    let token = storageData.lovable_token || '';
    if (!token) {
      showCustomAlert('Error', 'Token no capturado. Navega por Lovable para sincronizar.');
      return;
    }
    if (token.startsWith('Bearer ')) token = token.slice(7);
    const methodVersion = storageData.ql_method_version || 'v1';
    const projectIdForUpload = storageData.lovable_projectId || '';

    for (const file of files) {
      if (qlAttachedFiles.length >= MAX_FILES) {
        showCustomAlert('Límite', 'Máximo de ' + MAX_FILES + ' archivos alcanzado.');
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        showCustomAlert('Archivo grande', file.name + ' excede 20MB.');
        continue;
      }

      if (isImageType(file.type) || /^image\//i.test(file.type || '')) {
        var v = validateImageFile(file);
        if (!v.ok) { showCustomAlert('Imagen inválida', v.reason); continue; }
      }

      let processedFile = file;
      let previewUrl = null;

      if (isImageType(file.type)) {
        const result = await compressImage(file);
        processedFile = result.file;
        previewUrl = result.previewUrl;
      }

      const isImage = isImageType(processedFile.type);
      const placeholderIdx = qlAttachedFiles.length;
      qlAttachedFiles.push({
        file_id: null,
        file_name: file.name,
        previewUrl: previewUrl,
        file_type: processedFile.type,
        sizeLabel: formatFileSize(processedFile.size),
        uploading: true,
        rawFile: processedFile
      });
      renderAttachPreview();

      try {
        const result = await uploadFileDirect(processedFile, token, { method: methodVersion, projectId: projectIdForUpload, licenseKey: storageData.ql_license_key || "" });
        qlAttachedFiles[placeholderIdx].file_id = result.file_id;
        if (result.public_url) qlAttachedFiles[placeholderIdx].public_url = result.public_url;
        if (result.lovable_url) qlAttachedFiles[placeholderIdx].lovable_url = result.lovable_url;
        if (result.mime_type) qlAttachedFiles[placeholderIdx].mime_type = result.mime_type;
        qlAttachedFiles[placeholderIdx].method = result.method || 'v1';
        qlAttachedFiles[placeholderIdx].uploading = false;
        renderAttachPreview();
      } catch (err) {
        console.warn('[QL Upload] Error al enviar a Supabase Storage:', err.message);
        qlAttachedFiles[placeholderIdx].uploading = false;
        qlAttachedFiles[placeholderIdx].uploadFailed = true;
        renderAttachPreview();
        showCustomAlert('Error al subir', 'No se pudo enviar la imagen: ' + (err.message || 'error desconocido'));
      }
    }
  });
}

// ============================================================
// SETUP SEND  VERSIN LIMPIA
// ============================================================
function setupSend() {
  const btn = document.getElementById("ql-send");
  if (!btn) return;
  
  btn.addEventListener("click", async () => {
    const msgEl = document.getElementById("ql-msg");
    const mensaje = msgEl ? (msgEl.value || "").trim() : "";
    const modoPlanoEl = document.getElementById("ql-modo-plano");
    const modoPlano = modoPlanoEl ? modoPlanoEl.checked : false;
    const log = document.getElementById("ql-log");

    if (!mensaje) {
      if (log) { log.className = "ql-log-error"; log.innerText = "⚠️ Prompt vacío"; }
      return;
    }

    await qlForceSessionSync();

    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(["lovable_projectId", "lovable_token", "ql_license_key", "ql_session_id", "lovable_browserSessionId"], resolve);
    });
    
    const projectId = storageData.lovable_projectId || "";
    let token = storageData.lovable_token || "";
    const licenseKey = storageData.ql_license_key || "";

    if (!projectId || !token) {
      if (log) { log.className = "ql-log-error"; log.innerText = "⚠️ Proyecto no sincronizado"; }
      return;
    }

    if (token.startsWith("Bearer ")) token = token.slice(7);

    try {
      if (log) { log.className = "ql-log-info"; log.innerText = "⏳ Enviando prompt..."; }
      btn.classList.add("ql-sending");
      btn.disabled = true;

      // ============================================================
      // PAYLOAD LIMPIO - SIN inyecciones, SIN runtime_errors, SIN client_logs
      // ============================================================
      const payload = {
        license_key: licenseKey,
        session_id: storageData.ql_session_id || "",
        projeto_id: projectId,
        project_id: projectId,
        token_lovable: token,
        mensagem: mensaje,
        message: mensaje,
        prompt: mensaje,
        modo_pensar: modoPlano,
        device_id: qlDeviceId || "",
        browser_session_id: storageData.lovable_browserSessionId || "",
        lovable_send_mode: "native_chat_action"
      };

      // Solo añadir archivos si hay
      if (qlAttachedFiles.length > 0) {
        const uploadFiles = [];
        for (const file of qlAttachedFiles) {
          if (file.rawFile) {
            try {
              const base64Data = await blobToBase64(file.rawFile);
              uploadFiles.push({
                file_data: base64Data,
                file_name: file.file_name || "file",
                file_type: file.file_type || "application/octet-stream"
              });
            } catch (e) {}
          }
        }
        if (uploadFiles.length > 0) payload.upload_files = uploadFiles;
      }

      // Per-device fingerprint headers
      payload.session_headers = await buildSessionHeaders(projectId);

      const result = await bgFetch(PROXY_COMMAND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "x-license-key": licenseKey
        },
        body: JSON.stringify(payload)
      });

      if (!result || result.success === false) {
        throw new Error((result && (result.error_display || result.error || result.message)) || "Error al enviar");
      }

      if (log) {
        log.className = "ql-log-success";
        log.innerText = "✅ ¡Prompt enviado!";
      }
      try { if (typeof QLSounds !== "undefined") QLSounds.promptSent(); } catch (e) {}

      // Guardar en historial
      addToChatHistory(mensaje, "ok");

      // Limpiar
      if (msgEl) msgEl.value = "";
      qlAttachedFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      qlAttachedFiles = [];
      renderAttachPreview();

    } catch (err) {
      if (log) {
        log.className = "ql-log-error";
        log.innerText = "❌ " + (err.message || err);
      }
      addToChatHistory(mensaje, "error");
    } finally {
      btn.classList.remove("ql-sending");
      btn.disabled = false;
    }
  });
}

// ============================================================
// REST OF THE FILE (setupDrag, setupResize, etc. - mantener igual)
// ============================================================

// Store references to avoid stacking listeners
let _dragCleanup = null;
let _resizeCleanup = null;

function setupDrag(){
  if(_dragCleanup) { _dragCleanup(); _dragCleanup = null; }

  const box = document.getElementById("ql-floating");
  const header = document.getElementById("ql-header");
  if(!box || !header) return;

  let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function onPointerDown(e){
    if(e.target.closest(".ql-minimize-btn") || e.target.closest(".ql-icon-btn") || e.target.closest("button") || e.target.closest("select")) return;
    if(e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const rect = box.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    dragging = true;
    try { header.setPointerCapture(e.pointerId); } catch(ex){}
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.body.style.userSelect = "none";
  }

  function onPointerMove(e){
    if(!dragging) return;
    let newLeft = startLeft + (e.clientX - startX);
    let newTop = startTop + (e.clientY - startY);
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - box.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - box.offsetHeight));
    box.style.left = newLeft + "px";
    box.style.top = newTop + "px";
  }

  function onPointerUp(e){
    if(!dragging) return;
    dragging = false;
    try { header.releasePointerCapture(e.pointerId); } catch(ex){}
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.body.style.userSelect = "";
  }

  header.addEventListener("pointerdown", onPointerDown, {passive:false});

  _dragCleanup = function(){
    header.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };
}

function setupResize(){
  if(_resizeCleanup) { _resizeCleanup(); _resizeCleanup = null; }

  const box = document.getElementById("ql-floating");
  const handle = document.getElementById("ql-resize-handle");
  if(!box || !handle) return;

  let resizing = false, startY = 0, startH = 0;

  function onDown(e){
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startY = e.clientY;
    startH = box.offsetHeight;
    try { handle.setPointerCapture(e.pointerId); } catch(ex){}
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.userSelect = "none";
  }

  function onMove(e){
    if(!resizing) return;
    let newH = startH + (e.clientY - startY);
    newH = Math.max(200, Math.min(newH, window.innerHeight * 0.8));
    box.style.height = newH + "px";
  }

  function onUp(e){
    if(!resizing) return;
    resizing = false;
    qlHeight = box.offsetHeight;
    chrome.storage.local.set({ ql_height: qlHeight });
    try { handle.releasePointerCapture(e.pointerId); } catch(ex){}
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.body.style.userSelect = "";
  }

  handle.addEventListener("pointerdown", onDown, {passive:false});

  _resizeCleanup = function(){
    handle.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  };
}

// ===== CLIPBOARD PASTE (Ctrl+V) for ANY Files =====
function setupClipboardPaste() {
  var textarea = document.getElementById('ql-msg');
  if (!textarea) return;

  // --- Drag and Drop ---
  var dropZone = document.getElementById('ql-floating') || textarea;
  var dragOverlay = null;

  function showDragOverlay() {
    if (dragOverlay) return;
    dragOverlay = document.createElement('div');
    dragOverlay.className = 'ql-drag-overlay';
    dragOverlay.innerHTML = '<div class="ql-drag-overlay-inner">📁 Suelta los archivos aquí</div>';
    var parent = document.getElementById('ql-floating');
    if (parent) parent.appendChild(dragOverlay);
  }

  function hideDragOverlay() {
    if (dragOverlay) { dragOverlay.remove(); dragOverlay = null; }
  }

  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); showDragOverlay(); });
  dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); e.stopPropagation(); if (!dropZone.contains(e.relatedTarget)) hideDragOverlay(); });
  dropZone.addEventListener('drop', async function(e) {
    e.preventDefault(); e.stopPropagation(); hideDragOverlay();
    var files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    await handleFilesAttach(files);
  });

  // --- Paste (images + non-image files) ---
  textarea.addEventListener('paste', async function(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    var filesToAttach = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.kind === 'file') {
        e.preventDefault();
        var file = item.getAsFile();
        if (file) filesToAttach.push(file);
      }
    }
    if (filesToAttach.length > 0) await handleFilesAttach(filesToAttach);
  });
}

async function handleFilesAttach(files) {
  if (qlAttachedFiles.length >= MAX_FILES) {
    showCustomAlert('Límite', 'Máximo ' + MAX_FILES + ' archivos.');
    return;
  }
  await qlForceSessionSync(1500);
  var sd = await new Promise(function(r) { chrome.storage.local.get(['lovable_token', 'lovable_projectId', 'ql_method_version', 'ql_license_key'], r); });
  var token = sd.lovable_token || '';
  if (!token) { showCustomAlert('Error', 'Token no capturado.'); return; }
  if (token.indexOf('Bearer ') === 0) token = token.slice(7);
  var methodVersion = sd.ql_method_version || 'v1';
  var pidForUpload = sd.lovable_projectId || '';

  for (var fi = 0; fi < files.length; fi++) {
    var file = files[fi];
    if (qlAttachedFiles.length >= MAX_FILES) break;
    if (file.size > MAX_FILE_SIZE) { showCustomAlert('Grande', file.name + ' excede 20MB.'); continue; }

    if (/^image\//i.test(file.type || '') || isImageType(file.type)) {
      var vv = validateImageFile(file);
      if (!vv.ok) { showCustomAlert('Imagen inválida', vv.reason); continue; }
    }

    var processedFile = file;
    var previewUrl = null;
    if (isImageType(file.type)) {
      var compressed = await compressImage(file);
      processedFile = compressed.file;
      previewUrl = compressed.previewUrl;
    }

    var idx = qlAttachedFiles.length;
    qlAttachedFiles.push({
      file_id: null,
      file_name: file.name || ('file_' + Date.now()),
      previewUrl: previewUrl,
      file_type: processedFile.type,
      sizeLabel: formatFileSize(processedFile.size),
      uploading: true,
      rawFile: processedFile
    });
    renderAttachPreview();

    try {
      var res = await uploadFileDirect(processedFile, token, { method: methodVersion, projectId: pidForUpload, licenseKey: sd.ql_license_key || "" });
      qlAttachedFiles[idx].file_id = res.file_id;
      if (res.public_url) qlAttachedFiles[idx].public_url = res.public_url;
      if (res.lovable_url) qlAttachedFiles[idx].lovable_url = res.lovable_url;
      if (res.mime_type) qlAttachedFiles[idx].mime_type = res.mime_type;
      qlAttachedFiles[idx].method = res.method || 'v1';
      qlAttachedFiles[idx].uploading = false;
      renderAttachPreview();
    } catch(err) {
      qlAttachedFiles[idx].uploading = false;
      qlAttachedFiles[idx].file_id = 'local_direct_' + crypto.randomUUID();
      qlAttachedFiles[idx].uploadFailed = true;
      renderAttachPreview();
    }
  }
  showCustomAlert('Adjuntado x}', files.length + ' archivo(s) añadido(s)!');
}

// ===== DOWNLOAD ALL PROJECT FILES (Popup) =====
var VERSIONS_URL_POPUP = "https://qrbkzvsgwuyctgcmnwny.supabase.co/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true";
var USER_ROLES_URL_POPUP = "https://qrbkzvsgwuyctgcmnwny.supabase.co/rest/v1/user_roles?select=role";
var CURRENT_EXT_VERSION_POPUP = "4.3.1";

function setupDownloadProject() {
  var btn = document.getElementById('ql-download-project');
  if (!btn) return;
  btn.addEventListener('click', async function() {
    var statusEl = document.getElementById('ql-download-status');
    btn.disabled = true;
    btn.textContent = 'Preparando...';
    if (statusEl) { statusEl.style.display = 'block'; statusEl.className = 'ql-log-info'; statusEl.textContent = 'Verificando token y proyecto...'; }

    try {
      // ---- Feature flag gate ----
      try {
        var flagUrl = "https://qrbkzvsgwuyctgcmnwny.supabase.co/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files";
        var flagRows = await bgFetch(flagUrl, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
        if (flagRows && flagRows.length > 0 && flagRows[0].enabled === false) {
          throw new Error('Error al usar los recursos de la extensión.');
        }
      } catch (flagErr) {
        if (flagErr && flagErr.message === 'Error al usar los recursos de la extensión.') throw flagErr;
      }

      var sd = await new Promise(function(r) { chrome.storage.local.get(['lovable_token', 'lovable_projectId'], r); });
      var authToken = sd.lovable_token || '';
      var storedProjectId = sd.lovable_projectId || '';
      if (authToken.indexOf('Bearer ') === 0) authToken = authToken.slice(7);

      var projectId = storedProjectId;
      if (!projectId) throw new Error('Abre primero una página de proyecto de Lovable.');
      if (!authToken) {
        var cookieResponse = await new Promise(function(resolve) {
          chrome.runtime.sendMessage({ action: "readCookies" }, function(resp) { resolve(resp); });
        });
        if (cookieResponse && cookieResponse.success && cookieResponse.tokens && cookieResponse.tokens.length > 0) {
          authToken = cookieResponse.tokens[0].token;
        }
      }
      if (!authToken) throw new Error('Token no encontrado. Abre un proyecto en Lovable y espera la sincronización.');

      btn.textContent = 'Descargando...';
      if (statusEl) statusEl.textContent = 'Descargando archivos del proyecto...';

      var dlResponse = await new Promise(function(resolve) {
        chrome.runtime.sendMessage({ action: "downloadProject", projectId: projectId, token: authToken }, function(resp) { resolve(resp); });
      });

      if (!dlResponse || !dlResponse.success) throw new Error(dlResponse && dlResponse.error ? dlResponse.error : 'Error al descargar');
      var files = dlResponse.files;
      if (!files || files.length === 0) throw new Error('No se encontró ningún archivo en el proyecto.');

      if (statusEl) statusEl.textContent = 'Creando ZIP con ' + files.length + ' archivos...';
      btn.textContent = 'Empacotando...';
      if (typeof JSZip === 'undefined') throw new Error('JSZip no cargado. Usa el panel lateral.');

      var zip = new JSZip();
      var imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff'];
      var addedFiles = 0;
      for (var fi = 0; fi < files.length; fi++) {
        var f = files[fi];
        if (!f.name || f.sizeExceeded) continue;
        if (f.contents && f.binary) { zip.file(f.name, f.contents, { base64: true, binary: true }); addedFiles++; }
        else if (!f.contents && imageExts.some(function(ext) { return f.name.toLowerCase().endsWith(ext); })) {
          try {
            var imgResp = await fetch('https://api.lovable.dev/projects/' + projectId + '/files/raw?path=' + encodeURIComponent(f.name), { method: 'GET', headers: { 'Authorization': 'Bearer ' + authToken }, credentials: 'omit', mode: 'cors' });
            if (imgResp.ok) { zip.file(f.name, await imgResp.arrayBuffer(), { binary: true }); addedFiles++; }
            else if (f.contents) { zip.file(f.name, f.contents); addedFiles++; }
          } catch(imgErr) { if (f.contents) { zip.file(f.name, f.contents); addedFiles++; } }
        } else if (f.contents) { zip.file(f.name, f.contents); addedFiles++; }
      }

      var zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'lovable-' + projectId.substring(0, 8) + '-' + new Date().toISOString().split('T')[0] + '.zip';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);

      if (statusEl) { statusEl.className = 'ql-log-success'; statusEl.textContent = addedFiles + ' archivos descargados!'; }
      btn.textContent = '¡Descarga completa!';
      setTimeout(function() { btn.textContent = 'Descargar todos los archivos'; btn.disabled = false; if (statusEl) statusEl.style.display = 'none'; }, 4000);
    } catch(err) {
      if (statusEl) { statusEl.className = 'ql-log-error'; statusEl.textContent = cleanVisibleMessage(err.message || err); statusEl.style.display = 'block'; }
      btn.textContent = 'Error';
      setTimeout(function() { btn.textContent = 'Descargar todos los archivos'; btn.disabled = false; }, 3000);
    }
  });
}

// ===== UPDATE CHECK (Popup) =====
async function checkForUpdatePopup() {
  try {
    var data = await bgFetch(VERSIONS_URL_POPUP, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
    if (!data || !data.length) return;
    var latest = data[0];
    if (latest.version !== CURRENT_EXT_VERSION_POPUP && latest.is_alert_active) {
      var banner = document.getElementById('ql-update-banner');
      if (banner) {
        var dlUrl = latest.file_path ? "https://qrbkzvsgwuyctgcmnwny.supabase.co/storage/v1/object/public/extension-releases/" + latest.file_path : null;
        banner.innerHTML = '<div style="padding:10px 12px;background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.08));border:1px solid rgba(251,191,36,0.3);border-radius:10px;margin:8px 0"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="font-size:14px">&#128276;</span><strong style="font-size:11px;color:#f59e0b">Nueva actualización v' + latest.version + '!</strong></div><p style="font-size:10px;color:#a1a1aa;margin:0 0 6px;white-space:pre-line">' + (latest.changelog || '') + '</p>' + (dlUrl ? '<a href="' + dlUrl + '" target="_blank" style="display:inline-block;padding:4px 12px;background:#f59e0b;color:#000;border-radius:6px;text-decoration:none;font-size:10px;font-weight:700">Descargar v' + latest.version + '</a>' : '') + '</div>';
        banner.style.display = 'block';
      }
    }
  } catch(e) {}
}

// ===== RESELLER ROLE CHECK (Popup) =====
async function checkResellerRolePopup() {
  // Build local WalrOS: consulta de revendedor/licencia desactivada.
}

// ===== NATIVE CHAT MODE =====
let qlNativeChatActive = false;
let qlNativeChatCleanup = null;

function activateNativeChat() {
  qlNativeChatActive = true;
  chrome.storage.local.set({ ql_native_chat: true });

  const floatingBox = document.getElementById("ql-floating");
  if (floatingBox) {
    floatingBox.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    floatingBox.style.opacity = "0";
    floatingBox.style.transform = "scale(0.95) translateX(20px)";
    setTimeout(() => { floatingBox.style.display = "none"; }, 350);
  }

  injectNativeChatOverlay();
}

function deactivateNativeChat() {
  qlNativeChatActive = false;
  chrome.storage.local.set({ ql_native_chat: false });

  if (qlNativeChatCleanup) { qlNativeChatCleanup(); qlNativeChatCleanup = null; }

  const badge = document.getElementById("ql-native-badge");
  if (badge) badge.remove();
  const returnBtn = document.getElementById("ql-native-return-btn");
  if (returnBtn) returnBtn.remove();

  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (sendBtn) {
    sendBtn.classList.remove("ql-native-send-active");
    sendBtn.style.animation = "";
  }

  const floatingBox = document.getElementById("ql-floating");
  if (floatingBox) {
    floatingBox.style.display = "";
    floatingBox.style.opacity = "0";
    floatingBox.style.transform = "scale(0.95)";
    requestAnimationFrame(() => {
      floatingBox.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      floatingBox.style.opacity = "1";
      floatingBox.style.transform = "scale(1) translateX(0)";
    });
  } else {
    _buildFloatingUI();
  }
}

function injectNativeChatOverlay() {
  const chatForm = document.querySelector("form#chat-input");
  if (!chatForm) {
    setTimeout(injectNativeChatOverlay, 500);
    return;
  }

  if (!document.getElementById("ql-native-badge")) {
    const existingPos = getComputedStyle(chatForm).position;
    if (existingPos === "static") chatForm.style.position = "relative";

    const badge = document.createElement("div");
    badge.id = "ql-native-badge";
    badge.className = "ql-native-badge";
    badge.innerHTML = "\u26a1 <span>WalrOS Lovable Tweak</span>";
    chatForm.appendChild(badge);
  }

  if (!document.getElementById("ql-native-return-btn")) {
    const returnBtn = document.createElement("button");
    returnBtn.id = "ql-native-return-btn";
    returnBtn.className = "ql-native-return-btn";
    returnBtn.innerHTML = "\u2190 Volver a la extensión";
    returnBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deactivateNativeChat();
    });
    chatForm.parentElement.insertBefore(returnBtn, chatForm.nextSibling);
  }

  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (sendBtn) {
    sendBtn.classList.add("ql-native-send-active");
  }

  function interceptSend(e) {
    if (!qlNativeChatActive) return;

    const editor = chatForm.querySelector('[contenteditable="true"]');
    const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";

    if (!text) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    sendViaNativeChat(text, editor);
  }

  function interceptSubmit(e) {
    if (!qlNativeChatActive) return;

    const editor = chatForm.querySelector('[contenteditable="true"]');
    const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";

    if (!text) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    sendViaNativeChat(text, editor);
  }

  function interceptKeydown(e) {
    if (!qlNativeChatActive) return;
    if (e.key === "Enter" && !e.shiftKey) {
      const editor = chatForm.querySelector('[contenteditable="true"]');
      const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";
      if (!text) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      sendViaNativeChat(text, editor);
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", interceptSend, true);
  chatForm.addEventListener("submit", interceptSubmit, true);
  chatForm.addEventListener("keydown", interceptKeydown, true);

  qlNativeChatCleanup = function() {
    if (sendBtn) sendBtn.removeEventListener("click", interceptSend, true);
    chatForm.removeEventListener("submit", interceptSubmit, true);
    chatForm.removeEventListener("keydown", interceptKeydown, true);
  };
}

async function sendViaNativeChat(text, editor) {
  const sendBtn = document.getElementById("chatinput-send-message-button");

  showNativeSendingOverlay(true);

  if (sendBtn) {
    sendBtn.style.animation = "none";
    sendBtn.classList.add("ql-native-sending");
    sendBtn.disabled = true;
  }

  await qlForceSessionSync();

  const storageData = await new Promise((resolve) => {
    chrome.storage.local.get(["lovable_projectId", "lovable_token", "ql_license_key", "ql_session_id", "ql_method_version"], resolve);
  });
  const projectId = storageData.lovable_projectId || "";
  let token = storageData.lovable_token || "";
  const licenseKey = storageData.ql_license_key || "";
  const methodVersion = storageData.ql_method_version || "v1";

  if (!projectId || !token) {
    showNativeChatToast("\u26a0 Proyecto no sincronizado. Navega por Lovable primero.", "error");
    if (sendBtn) {
      sendBtn.classList.remove("ql-native-sending");
      sendBtn.classList.add("ql-native-send-active");
    }
    return;
  }

  if (token.startsWith("Bearer ")) token = token.slice(7);

  try {
    const planActive = detectLovableNativePlan();
    const nativeImages = await collectNativeChatImages();

    const payload = {
      license_key: licenseKey,
      session_id: qlSessionId,
      projeto_id: projectId,
      project_id: projectId,
      token_lovable: token,
      mensagem: text,
      message: text,
      prompt: text,
      real_prompt: text,
      walros_real_prompt: text,
      lovable_send_mode: 'native_chat_action',
      modo_pensar: planActive,
      device_id: (typeof qlDeviceId !== 'undefined' ? qlDeviceId : undefined)
    };
    if (nativeImages.length > 0) {
      payload.upload_files = nativeImages;
    }

    var result = await bgFetch(PROXY_COMMAND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "x-license-key": licenseKey },
      body: JSON.stringify(payload)
    });

    if (!result || result.success === false || result.ok === false) {
      throw new Error((result && (result.error_display || result.error || result.message)) || "Error al enviar");
    }

    // Caché del mensaje enviado para reutilizarlo en la UI
    try {
      if (methodVersion === "v3" && projectId && typeof window.__qlCacheMsg === "function") {
        window.__qlCacheMsg(projectId, text);
      } else if (methodVersion === "v3" && projectId) {
        chrome.storage.local.get(["ql_msg_cache"], function(res){
          var log = (res && res.ql_msg_cache) ? res.ql_msg_cache : {};
          if (!log[projectId]) log[projectId] = [];
          log[projectId].push({ t: String(text), ts: Date.now() });
          if (log[projectId].length > 300) log[projectId] = log[projectId].slice(-300);
          chrome.storage.local.set({ ql_msg_cache: log });
        });
      }
    } catch(e) {}

    try { if (typeof window.__qlSaveV3Prompt === "function") window.__qlSaveV3Prompt(projectId, text); } catch(e) {}

    if (editor) {
      editor.innerHTML = '<p><br class="ProseMirror-trailingBreak"></p>';
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
    try { clearNativeChatAttachments(); } catch(e) {}

    addToChatHistory(text, "ok");
    var okMsg = "\u2713 ¡Prompt enviado correctamente!";
    if (planActive) okMsg += " (Modo plan)";
    if (nativeImages.length > 0) okMsg += " \u00b7 " + nativeImages.length + " imagen(es)";
    showNativeChatToast(okMsg, "success");

  } catch (err) {
    addToChatHistory(text, "error");
    showNativeChatToast("\u2717 " + cleanVisibleMessage(err.message || "Error al enviar"), "error");
  } finally {
    showNativeSendingOverlay(false);
    if (sendBtn) {
      sendBtn.classList.remove("ql-native-sending");
      sendBtn.classList.add("ql-native-send-active");
      sendBtn.disabled = false;
      sendBtn.style.animation = "";
      requestAnimationFrame(() => {
        sendBtn.style.animation = "ql-send-blink 1.5s infinite";
      });
    }
  }
}

function showNativeSendingOverlay(show) {
  const id = "ql-native-sending-overlay";
  const existing = document.getElementById(id);
  if (!show) { if (existing) existing.remove(); return; }
  if (existing) return;
  const el = document.createElement("div");
  el.id = id;
  el.className = "ql-native-sending-overlay";
  el.innerHTML = '<div class="ql-spinner"></div> Enviando prompt...';
  document.body.appendChild(el);
}

function showNativeChatToast(msg, type) {
  const existing = document.getElementById("ql-native-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "ql-native-toast";
  toast.className = "ql-native-toast ql-native-toast-" + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("ql-native-toast-visible"));
  setTimeout(() => {
    toast.classList.remove("ql-native-toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setupNativeChatButton() {
  const btn = document.getElementById("ql-native-chat-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    activateNativeChat();
  });
}

// ===== DETECCIONES NATIVAS DE LOVABLE (Plan toggle + imágenes) =====
let qlLovablePlanLastKnown = false;
function observeLovablePlanToggle(){
  try {
    var apply = function(){
      var items = document.querySelectorAll('[role="menuitemradio"]');
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var txt = (it.textContent || "").trim();
        if (/^Plan(\s|$)/i.test(txt) || /Discuss before building/i.test(txt)) {
          if (it.getAttribute('data-state') === 'checked' || it.getAttribute('aria-checked') === 'true') {
            qlLovablePlanLastKnown = true;
          } else if (it.getAttribute('data-state') === 'unchecked' || it.getAttribute('aria-checked') === 'false') {
            var build = null;
            for (var j = 0; j < items.length; j++) {
              var bt = (items[j].textContent || "").trim();
              if (/^Build(\s|$)/i.test(bt) || /Make changes directly/i.test(bt)) { build = items[j]; break; }
            }
            if (build && (build.getAttribute('data-state') === 'checked' || build.getAttribute('aria-checked') === 'true')) {
              qlLovablePlanLastKnown = false;
            }
          }
        }
      }
    };
    apply();
    var obs = new MutationObserver(function(){ apply(); });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state','aria-checked'] });
  } catch(e) { /* noop */ }
}
try { observeLovablePlanToggle(); } catch(e) {}

function detectLovableNativePlan(){
  try {
    var items = document.querySelectorAll('[role="menuitemradio"]');
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var txt = (it.textContent || "").trim();
      if (/^Plan(\s|$)/i.test(txt) || /Discuss before building/i.test(txt)) {
        var st = it.getAttribute('data-state') || it.getAttribute('aria-checked');
        if (st === 'checked' || st === 'true') return true;
        if (st === 'unchecked' || st === 'false') return false;
      }
    }
  } catch(e) {}
  return qlLovablePlanLastKnown === true;
}

async function collectNativeChatImages(){
  var out = [];
  try {
    var chatForm = document.querySelector("form#chat-input");
    if (!chatForm) return out;
    var imgs = chatForm.querySelectorAll('img');
    var seen = {};
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var src = img.getAttribute('src') || img.src || '';
      if (!src) continue;
      if (seen[src]) continue;
      seen[src] = true;
      var ok = /^blob:/.test(src) || /^data:image\//.test(src) || /storage\.googleapis\.com/.test(src) || /lovable\.dev\/.+files/.test(src);
      if (!ok) continue;
      try {
        var resp = await fetch(src);
        if (!resp.ok) continue;
        var blob = await resp.blob();
        if (!blob || !blob.size) continue;
        if (blob.size > 20 * 1024 * 1024) continue;
        var b64 = await blobToBase64(blob);
        var type = blob.type || 'image/png';
        var ext = (type.split('/')[1] || 'png').split(';')[0];
        out.push({
          file_data: b64,
          file_name: 'native_' + Date.now() + '_' + i + '.' + ext,
          file_type: type
        });
      } catch(e) { /* skip */ }
    }
  } catch(e) {}
  return out;
}

function clearNativeChatAttachments(){
  var chatForm = document.querySelector("form#chat-input");
  if (!chatForm) return;
  var removeBtns = chatForm.querySelectorAll('button[aria-label*="Remove" i], button[aria-label*="Excluir" i]');
  for (var i = 0; i < removeBtns.length; i++) {
    try { removeBtns[i].click(); } catch(e) {}
  }
}

// ===== LISTENER PARA COMANDOS DEL SIDEPANEL =====
try {
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    if (!msg || !msg.type) return;
    if (msg.type === 'ql_native_chat_activate') {
      try { activateNativeChat(); } catch(e) {}
      sendResponse && sendResponse({ ok: true });
    } else if (msg.type === 'ql_native_chat_deactivate') {
      try { deactivateNativeChat(); } catch(e) {}
      sendResponse && sendResponse({ ok: true });
    }
  });
} catch(e) {}

// Check if native chat was active on page load
chrome.storage.local.get(["ql_native_chat"], (res) => {
  if (res.ql_native_chat === true) {
    qlNativeChatActive = true;
    setTimeout(() => {
      const floatingBox = document.getElementById("ql-floating");
      if (floatingBox) floatingBox.style.display = "none";
      injectNativeChatOverlay();
    }, 500);
  }
});

window.addEventListener("message", (event)=>{
  if(!event.data || event.data.type !== "lovableTokenFound") return;
  const updates = {};
  if(event.data.token && typeof event.data.token === "string"){
    updates.lovable_token = event.data.token.replace(/^Bearer\s+/i, "").trim();
  }
  if(event.data.projectId && typeof event.data.projectId === "string"){
    updates.lovable_projectId = event.data.projectId;
  }
  if(event.data.browserSessionId && typeof event.data.browserSessionId === "string"){
    updates.lovable_browserSessionId = event.data.browserSessionId.trim();
  }
  if(event.data.clientGitSha && typeof event.data.clientGitSha === "string"){
    updates.lovable_clientGitSha = event.data.clientGitSha.trim();
  }
  if(event.data.lovPlatform && typeof event.data.lovPlatform === "string"){
    updates.lovable_lovPlatform = event.data.lovPlatform.trim();
  }
  if(!Object.keys(updates).length) return;
  chrome.storage.local.set(updates, ()=>{
    updateSyncStatus();
  });
});

function setupModelSelector() {
  const btn = document.getElementById("ql-model-selector-btn");
  const options = document.getElementById("ql-model-options");
  const modelItems = document.querySelectorAll(".ql-model-option");
  const activeIcon = document.getElementById("ql-active-model-icon");
  const activeName = document.getElementById("ql-active-model-name");
  const container = document.querySelector(".ql-model-selector-container");

  if (!btn || !options) return;

  chrome.storage.local.get(["ql_active_model", "ql_active_model_name", "ql_active_model_icon"], (res) => {
    const savedModel = res.ql_active_model || "gemini-1.5-pro";
    const savedName = res.ql_active_model_name || "Gemini 3.1 Pro";
    const savedIcon = res.ql_active_model_icon || "\u2728";

    activeName.textContent = savedName;
    activeIcon.textContent = savedIcon;

    modelItems.forEach(item => {
      if (item.getAttribute("data-model") === savedModel) {
        item.classList.add("ql-active");
      } else {
        item.classList.remove("ql-active");
      }
    });
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = options.style.display === "block";
    options.style.display = isOpen ? "none" : "block";
    container.classList.toggle("ql-active", !isOpen);
  });

  modelItems.forEach(item => {
    item.addEventListener("click", () => {
      const model = item.getAttribute("data-model");
      const name = item.querySelector(".ql-model-opt-title").textContent;
      const icon = item.getAttribute("data-icon");

      activeName.textContent = name;
      activeIcon.textContent = icon;
      options.style.display = "none";
      container.classList.remove("ql-active");

      modelItems.forEach(i => i.classList.remove("ql-active"));
      item.classList.add("ql-active");

      chrome.storage.local.set({
        ql_active_model: model,
        ql_active_model_name: name,
        ql_active_model_icon: icon
      });

      showCustomAlert("\u2705 Modelo cambiado", "Ahora usando: " + name);
    });
  });

  document.addEventListener("click", () => {
    options.style.display = "none";
    container.classList.remove("ql-active");
  });
}