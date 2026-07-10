// ============================================================
// WalrOS Lovable Tweak - Side Panel Logic (Business Logic Only)
// Las plantillas HTML están en sidepanel-templates.js
// ============================================================

(function(){
  const SUPABASE_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co";
  const WALROS_NATIVE_COMPACT_MESSAGE = "Corregir error de compilación";
const WALROS_USER_VISIBLE_BUBBLE_LABEL = "https://walros.org";
  const VALIDATE_URL = ""; // disabled in free/internal build
  const OPTIMIZE_URL = SUPABASE_URL + "/functions/v1/optimize-prompt";
  const NOTIFICATIONS_URL = SUPABASE_URL + "/rest/v1/notifications?select=*&order=created_at.desc&limit=20";
  const VERSIONS_URL = SUPABASE_URL + "/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true";
  const USER_ROLES_URL = SUPABASE_URL + "/rest/v1/user_roles?select=role";
  const PROXY_COMMAND_URL = SUPABASE_URL + "/functions/v1/proxy-command";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYmt6dnNnd3V5Y3RnY21ud255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MzUxMTYsImV4cCI6MjA5OTExMTExNn0.pvoi5xK3DVSMJH9aMJQeoRWVQmIWiC6_j15B3OaFFsA";

  // License key — loaded from chrome.storage after server-side validation
  let spLicenseKey = "";

  let sessionId = null, userName = null, expiresAt = null, licenseStatus = null, heartbeatInterval = null, deviceId = null, isResellerUser = false;
  let spSpeechRecognition = null, spIsRecording = false;
  let spAttachedFiles = [];
  let spActiveTab = 'prompt';
  let spChatHistory = [];
  const SP_MAX_FILES = 15;
  const SP_MAX_FILE_SIZE = 20 * 1024 * 1024;
  const SP_ALLOWED_IMAGE_MIMES = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  const SP_IMAGE_EXT_TO_MIME = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' };
  function spValidateImageFile(file) {
    if (!file) return { ok:false, reason:'Archivo inválido.' };
    if (typeof file.size !== 'number' || file.size <= 0) return { ok:false, reason:'Archivo vacío.' };
    if (file.size > SP_MAX_FILE_SIZE) return { ok:false, reason:'Imagen demasiado grande (máx. 20 MB).' };
    let mime = (file.type || '').toLowerCase().split(';')[0].trim();
    if (!mime) {
      const ext = (file.name || '').toLowerCase().split('.').pop();
      mime = SP_IMAGE_EXT_TO_MIME[ext] || '';
    }
    if (mime === 'image/jpg') mime = 'image/jpeg';
    if (!SP_ALLOWED_IMAGE_MIMES.includes(mime) && mime.indexOf('image/') !== 0) {
      return { ok:false, reason:'Formato no soportado: ' + (file.type || 'desconocido') };
    }
    return { ok:true, mime };
  }
  const SP_HISTORY_KEY = 'ql_chat_history';
  const SP_MAX_HISTORY = 200;
   const CURRENT_EXT_VERSION = "4.2.8";

  function t(key) {
    if (window.QL_I18N && typeof window.QL_I18N.t === 'function') {
      return window.QL_I18N.t(key);
    }
    return key;
  }

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

  // Build per-device session headers (UA + sec-ch-ua + cookies de lovable.dev)
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
        chrome.runtime.sendMessage({ action: "getLovableCookies" }, function(resp) {
          if (resp && resp.cookie) headers["cookie"] = resp.cookie;
          resolve(headers);
        });
      } catch (e) {
        resolve(headers);
      }
    });
  }

  // --- Utilities ---
  function safeSendMessage(msg) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) return reject(new Error("Contexto de extensión invalidado"));
        chrome.runtime.sendMessage(msg, (resp) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(resp);
        });
      } catch(e) { reject(new Error("Contexto de extensión invalidado")); }
    });
  }

  function bgFetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) return reject(new Error("Contexto de extensión invalidado"));
        chrome.runtime.sendMessage({ action: "proxyFetch", url, method: opts.method || "POST", headers: opts.headers || {}, body: opts.body || null }, (resp) => {
          if(chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if(!resp) return reject(new Error("Sin respuesta"));
          if(resp.data && typeof resp.data === "object") resolve(resp.data);
          else if(!resp.ok) reject(new Error("Fetch falló (" + resp.status + ")"));
          else resolve(resp.data);
        });
      } catch(e) { reject(new Error("Contexto de extensión invalidado")); }
    });
  }


  function spExtractProjectIdFromUrl(url) {
    try {
      var str = String(url || '');
      var patterns = [
        /\/projects\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
        /\/project\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
        /projectId[=:]([0-9a-fA-F-]{36})/i,
        /project_id[=:]([0-9a-fA-F-]{36})/i,
        /[?&]project=([0-9a-fA-F-]{36})/i,
        /\/projects\/([^/?#]+)/i,
        /\/project\/([^/?#]+)/i
      ];
      for (var i=0;i<patterns.length;i++) {
        var m = str.match(patterns[i]);
        if (m && m[1]) return decodeURIComponent(m[1]);
      }
    } catch(e) {}
    return '';
  }

  function spRefreshLovableSession(timeoutMs) {
    return new Promise(function(resolve) {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          var tab = tabs && tabs[0];
          if (!tab || !tab.id || !tab.url || tab.url.indexOf('lovable.dev') < 0) return resolve(false);
          var pidFromUrl = spExtractProjectIdFromUrl(tab.url);
          if (pidFromUrl) { try { chrome.storage.local.set({ lovable_projectId: pidFromUrl }); } catch(e) {} }
          chrome.tabs.sendMessage(tab.id, { action: 'requestLovableSessionFromPage', timeoutMs: timeoutMs || 1500 }, function(resp) {
            void chrome.runtime.lastError;
            if (resp && resp.projectId) { try { chrome.storage.local.set({ lovable_projectId: resp.projectId }); } catch(e) {} }
            if (resp && resp.token) { try { chrome.storage.local.set({ lovable_token: resp.token }); } catch(e) {} }
            resolve(!!(resp && resp.ok) || !!pidFromUrl);
          });
        });
      } catch(e) { resolve(false); }
    });
  }

  function spStartSessionAutoSync() {
    try {
      spRefreshLovableSession(1500).then(updateSync);
      setTimeout(function(){ spRefreshLovableSession(1500).then(updateSync); }, 900);
      setTimeout(function(){ spRefreshLovableSession(2000).then(updateSync); }, 2500);
      if (!window.__walrosSpSyncInterval) {
        window.__walrosSpSyncInterval = setInterval(function(){ spRefreshLovableSession(1200).then(updateSync); }, 5000);
      }
    } catch(e) {}
  }

  function getDeviceId() {
    return getHardwareFingerprint();
  }

  async function spLoadLicenseFromStorage() {
    const r = await new Promise(res => chrome.storage.local.get(["ql_license_key","ql_license_valid","ql_license_status","ql_session_id","ql_user_name","ql_expires_at"], res));
    if (r.ql_license_valid && r.ql_license_key) {
      spLicenseKey = r.ql_license_key;
      sessionId = r.ql_session_id || ("wls-" + Date.now());
      userName = r.ql_user_name || "Usuario";
      licenseStatus = r.ql_license_status || "active";
      expiresAt = r.ql_expires_at || null;
      return true;
    }
    return false;
  }

  function showAlert(title, message) {
    const existing = document.querySelector('.sp-alert-overlay');
    if(existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'sp-alert-overlay';
    overlay.innerHTML = spTemplateAlert(cleanVisibleMessage(title), cleanVisibleMessage(message));
    document.body.appendChild(overlay);
    overlay.querySelector('.sp-alert-ok').addEventListener('click', () => overlay.remove());
    setTimeout(() => overlay.remove(), 4000);
  }

  // --- Header Event Listeners ---
  document.getElementById('sp-back-to-popup').addEventListener('click', () => {
    try { chrome.storage.local.set({ ql_sidebar_mode: false }); } catch(e) {}
    try { chrome.runtime.sendMessage({ action: "deactivateSidebar" }); } catch(e) {}
    try { window.close(); } catch(e) {}
  });

  document.querySelector('.sp-theme-btn').addEventListener('click', () => {
    const isLight = document.body.classList.toggle('sp-light');
    chrome.storage.local.set({ ql_dark_mode: !isLight });
  });

  document.querySelector('.sp-logout-btn').addEventListener('click', () => {
    if(heartbeatInterval) clearInterval(heartbeatInterval);
    chrome.storage.local.remove(["ql_license_valid","ql_license_key","ql_license_status","ql_expires_at","ql_activated_at"], () => {
      spLicenseKey = "";
      licenseStatus = "";
      expiresAt = null;
      showLicenseGate();
    });
  });

  // --- Notifications ---  });

  // --- Notifications ---
  const notifPanel = document.getElementById('sp-notif-panel');
  document.querySelector('.sp-notif-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = notifPanel.style.display !== 'none';
    notifPanel.style.display = isOpen ? 'none' : 'block';
    if(!isOpen) loadNotifications();
  });
  document.getElementById('sp-notif-close').addEventListener('click', () => { notifPanel.style.display = 'none'; });

  async function loadNotifications() {
    const list = document.getElementById('sp-notif-list');
    list.innerHTML = '<p class="sp-notif-empty">Cargando...</p>';
    try {
      const data = await bgFetch(NOTIFICATIONS_URL, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
      if(!data || !data.length) { list.innerHTML = '<p class="sp-notif-empty">No hay notificaciones.</p>'; return; }
      const ids = data.map(n => n.id);
      chrome.storage.local.set({ ql_read_notifs: ids });
      const badge = document.querySelector('.sp-notif-badge');
      if(badge) badge.style.display = 'none';
      list.innerHTML = data.map(n => spTemplateNotifItem(n)).join('');
    } catch(e) { list.innerHTML = '<p class="sp-notif-empty">Error al cargar.</p>'; }
  }

  async function checkUnread() {
    try {
      const data = await bgFetch(NOTIFICATIONS_URL, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
      if(!data || !data.length) return;
      chrome.storage.local.get(["ql_read_notifs"], res => {
        const readIds = res.ql_read_notifs || [];
        const unread = data.filter(n => !readIds.includes(n.id)).length;
        const badge = document.querySelector('.sp-notif-badge');
        if(badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
      });
    } catch(e) {}
  }

  // --- Update Check ---
  async function checkForUpdate() {
    try {
      const data = await bgFetch(VERSIONS_URL, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
      if (!data || !data.length) return;
      const latest = data[0];
      if (latest.version !== CURRENT_EXT_VERSION && latest.is_alert_active) {
        const banner = document.getElementById('sp-update-banner');
        if (banner) {
          const dlUrl = latest.file_path ? SUPABASE_URL + "/storage/v1/object/public/extension-releases/" + latest.file_path : null;
          banner.innerHTML = spTemplateUpdateBanner(latest.version, latest.changelog, dlUrl);
          banner.style.display = 'block';
        }
      }
    } catch(e) {}
  }

  // --- Reseller Role Check ---
  async function checkResellerRole() {
    // Build local WalrOS: consulta de revendedor/licencia desactivada.
  }

  async function getUserId() {
    return "";
  }

  // --- License Gate ---  // --- License Gate ---
  function showLicenseGate() {
    const gateHtml = `
      <div id="ql-license-gate" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center;background:var(--sp-bg,#111);color:var(--sp-text,#eee);">
        <h2 style="margin-bottom:8px;">🔑 Licencia requerida</h2>
        <p style="margin-bottom:16px;font-size:14px;opacity:.8;">Ingresa tu clave de licencia para activar WalrOS</p>
        <input id="ql-gate-key" type="text" placeholder="WAL-XXXXXXXX-XXXX-XXXX" style="width:260px;padding:10px;border-radius:6px;border:1px solid #444;background:#222;color:#fff;text-align:center;font-family:monospace;margin-bottom:12px;" />
        <button id="ql-gate-activate" style="padding:10px 32px;border-radius:6px;border:none;background:#2563eb;color:#fff;font-weight:600;cursor:pointer;">Activar</button>
        <p id="ql-gate-error" style="color:#f44;font-size:13px;margin-top:8px;display:none;"></p>
      </div>`;
    document.getElementById('sp-app')?.replaceChildren();
    document.getElementById('sp-app')?.insertAdjacentHTML('beforeend', gateHtml);
    document.getElementById('ql-gate-activate')?.addEventListener('click', async () => {
      const key = document.getElementById('ql-gate-key')?.value.trim().toUpperCase();
      if (!key || !/^WAL-[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
        const err = document.getElementById('ql-gate-error');
        if (err) { err.textContent = 'Formato inválido. Usa WAL-XXXXXXXX-XXXX-XXXX'; err.style.display = 'block'; }
        return;
      }
      await validateLicense(key);
    });
  }

  async function validateLicense(key) {
    const errEl = document.getElementById('ql-gate-error');
    const btn = document.getElementById('ql-gate-activate');
    if (btn) btn.disabled = true;
    try {
      const fp = await getHardwareFingerprint();
      const resp = await chrome.runtime.sendMessage({
        action: "proxyFetch",
        url: "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/proxy-command",
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYmt6dnNnd3V5Y3RnY21ud255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MzUxMTYsImV4cCI6MjA5OTExMTExNn0.pvoi5xK3DVSMJH9aMJQeoRWVQmIWiC6_j15B3OaFFsA" },
        body: JSON.stringify({ _action: "validate", license_key: key, hw_fingerprint: fp })
      });
      if (!resp || !resp.ok || !resp.data) {
        if (errEl) { errEl.textContent = 'Error de conexión con el servidor'; errEl.style.display = 'block'; }
        if (btn) btn.disabled = false;
        return;
      }
      if (!resp.data.valid) {
        if (errEl) { errEl.textContent = resp.data.error || 'Licencia inválida o ya usada'; errEl.style.display = 'block'; }
        if (btn) btn.disabled = false;
        return;
      }
      // Store the validated license
      spLicenseKey = key;
      sessionId = resp.data.session_id || ("wls-" + Date.now());
      userName = resp.data.user_name || "Usuario";
      licenseStatus = resp.data.status || "active";
      expiresAt = resp.data.expires_at || null;
      await new Promise(res => chrome.storage.local.set({
        ql_license_valid: true,
        ql_license_key: spLicenseKey,
        ql_session_id: sessionId,
        ql_user_name: userName,
        ql_license_status: licenseStatus,
        ql_expires_at: expiresAt,
        ql_activated_at: new Date().toISOString()
      }, res));
      if (expiresAt) startCountdown();
      showMainUI();
    } catch(e) {
      if (errEl) { errEl.textContent = 'Error: ' + (e.message || 'desconocido'); errEl.style.display = 'block'; }
      if (btn) btn.disabled = false;
    }
  }

  // --- Chat History ---  // --- Chat History ---
  function loadChatHistory(cb) {
    chrome.storage.local.get([SP_HISTORY_KEY], function(r) {
      spChatHistory = r[SP_HISTORY_KEY] || [];
      if (cb) cb();
    });
  }

  function saveChatHistory() {
    if (spChatHistory.length > SP_MAX_HISTORY) spChatHistory = spChatHistory.slice(-SP_MAX_HISTORY);
    chrome.storage.local.set({ [SP_HISTORY_KEY]: spChatHistory });
  }

  function addToHistory(text, status) {
    spChatHistory.push({ text: text, timestamp: new Date().toISOString(), status: status || 'ok' });
    saveChatHistory();
    updateHistoryBadge();
  }

  function updateHistoryBadge() {
    var badge = document.querySelector('.sp-tab[data-tab="history"] .sp-tab-badge');
    if (badge) badge.textContent = spChatHistory.length;
  }

  function renderHistoryTab() {
    var container = document.getElementById('sp-tab-content');
    if (!container) return;
    container.innerHTML = spTemplateChatHistory(spChatHistory);
    // Scroll to bottom
    var msgs = container.querySelector('.sp-chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
    // Clear button
    var clearBtn = document.getElementById('sp-chat-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        spChatHistory = [];
        saveChatHistory();
        renderHistoryTab();
      });
    }
  }

  function renderPromptTab() {
    var container = document.getElementById('sp-tab-content');
    if (!container) return;
    container.innerHTML = spTemplatePromptContent();
  }

  function switchTab(tab) {
    spActiveTab = tab;
    document.querySelectorAll('.sp-tab').forEach(function(t) {
      t.classList.toggle('sp-tab-active', t.getAttribute('data-tab') === tab);
    });
    if (tab === 'history') {
      loadChatHistory(function() { renderHistoryTab(); });
    } else {
      showMainUIContent();
    }
  }

  // --- Main UI ---
  function showMainUI() {
    const greeting = spEscapeHtml(userName || 'User');
    const statusBadge = spTemplateStatusBadge(licenseStatus);
    const body = document.getElementById('sp-body');
    loadChatHistory(function() {
      body.innerHTML = '<div id="sp-update-banner" style="display:none"></div>' +
        '<div class="sp-profile-card">' +
          '<div class="sp-profile-top"><span class="sp-profile-name" id="sp-name">' + greeting + '</span>' + statusBadge + '</div>' +
          '<div class="sp-sync-status" id="sp-sync">⏳ Esperando sincronización...</div>' +
          '<div class="sp-trial-countdown" id="sp-countdown" style="display:none"></div>' +
        '</div>' +
        '<div id="sp-reseller-btn" style="display:none;margin-bottom:14px">' +
          '<a href="https://walros.org" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:1px solid rgba(56,189,248,0.3);background:rgba(56,189,248,0.06);color:var(--ql-accent);text-decoration:none;font-size:12px;font-weight:700;transition:all 0.2s">' +
            '💼 Panel de revendedor<span style="margin-left:auto;font-size:10px;opacity:0.6">→</span>' +
          '</a>' +
        '</div>' +
        spTemplateTabs(spActiveTab, spChatHistory.length) +
        '<div id="sp-tab-content"></div>';

      // Tab click handlers
      document.querySelectorAll('.sp-tab').forEach(function(t) {
        t.addEventListener('click', function() { switchTab(t.getAttribute('data-tab')); });
      });

      // Show active content
      if (spActiveTab === 'history') {
        renderHistoryTab();
      } else {
        showMainUIContent();
      }

      // Sync status
      updateSync();
      spStartSessionAutoSync();
      chrome.storage.onChanged.addListener((ch) => { if(ch.lovable_projectId || ch.lovable_token) updateSync(); });

      // Countdown
      updateCountdown();

      // Build local: sin heartbeat ni validación de licencia.

      checkUnread();
      checkForUpdate();
      checkResellerRole();
    });
  }

  function showMainUIContent() {
    var container = document.getElementById('sp-tab-content');
    if (!container) return;
    container.innerHTML =
      '<textarea class="sp-textarea" id="sp-msg" rows="3" placeholder="Escribe tu comando..." spellcheck="false"></textarea>' +
      '<div id="sp-attach-preview" class="sp-attach-preview" style="display:none"></div>' +
      '<div class="sp-action-bar">' +
        '<div class="sp-action-left"><label class="sp-toggle"><input type="checkbox" id="sp-modo-plano"><span class="sp-toggle-slider"></span></label><span class="sp-toggle-label">Modo plan</span></div>' +
        '<div class="sp-action-center">' +
          '<button class="sp-attach-btn" id="sp-attach-btn" title="Adjuntar archivo">📎</button>' +
          '<button class="sp-tool-btn" id="sp-optimize" title="Optimizar con IA">' + SP_SVG.sparkles + '</button>' +
          '<button class="sp-tool-btn" id="sp-speech" title="Voz">' + SP_SVG.mic + '</button>' +
        '</div>' +
        '<button class="sp-send-btn" id="sp-send">Enviar</button>' +
      '</div>' +
      '<input type="file" id="sp-file-input" multiple style="display:none" accept="*/*">' +
      '<div class="sp-log" id="sp-log"></div>' +
      '<span class="sp-shortcuts-title">ATAJOS RÁPIDOS</span>' +
      '<div class="sp-shortcuts-grid" id="sp-chips"></div>' +
      '<button id="sp-remove-watermark" class="sp-watermark-btn">🚫 Quitar marca de agua</button>' +
      '<button id="sp-shield-btn" class="sp-shield-btn">' + SP_SVG.shield + ' <span id="sp-shield-label">Activar escudo</span></button>' +
      '<button id="sp-native-chat-btn" class="sp-shield-btn" style="background:linear-gradient(135deg,rgba(124,90,255,0.12),rgba(168,85,247,0.08));border-color:rgba(56,189,248,0.3);color:var(--ql-accent,#a78bfa);margin-top:6px">' + SP_SVG.msgSq + ' <span id="sp-native-chat-label">Usar chat normal</span></button>' +
      '<button id="sp-download-project" class="sp-watermark-btn" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px">📥 Descargar todos los archivos</button>' +
      '<button id="sp-create-project" class="sp-watermark-btn" style="background:linear-gradient(135deg,rgba(34,197,94,0.14),rgba(16,185,129,0.08));border-color:rgba(34,197,94,0.35);color:#4ade80;margin-top:6px">🚀 Crear proyecto en Lovable</button>' +
      '<button id="sp-publish-project" class="sp-watermark-btn" style="background:linear-gradient(135deg,rgba(245,158,11,0.14),rgba(217,119,6,0.08));border-color:rgba(245,158,11,0.35);color:#fbbf24;margin-top:6px">🌐 Publicar proyecto</button>' +
      '<button id="sp-enable-cloud" class="sp-watermark-btn" style="background:linear-gradient(135deg,rgba(56,189,248,0.14),rgba(14,165,233,0.08));border-color:rgba(56,189,248,0.35);color:#38bdf8;margin-top:6px">☁️ Activar Lovable Cloud</button>' +
      '<div id="sp-download-status" class="sp-log" style="display:none"></div>';

    // Setup chips
    const chips = document.getElementById('sp-chips');
    SP_TEMPLATES.forEach(t => {
      const chip = document.createElement('button');
      chip.className = 'sp-chip';
      chip.innerHTML = t.icon + ' ' + t.label;
      chip.title = window.QL_I18N && window.QL_I18N.t ? window.QL_I18N.t(t.prompt) : t.prompt;
      chip.addEventListener('click', () => {
        document.getElementById('sp-msg').value = window.QL_I18N && window.QL_I18N.t ? window.QL_I18N.t(t.prompt) : t.prompt;
      });
      chips.appendChild(chip);
    });

    // Modo plan
    chrome.storage.local.get(["ql_modo_plano"], r => { if(r.ql_modo_plano) document.getElementById('sp-modo-plano').checked = true; });
    document.getElementById('sp-modo-plano').addEventListener('change', function() {
      const checkbox = this;
      chrome.storage.local.set({ ql_modo_plano: checkbox.checked });
    });

    // File attachment
    setupSpFileAttachment();

    // Clipboard paste (Ctrl+V) for images
    setupSpClipboardPaste();

    // Event listeners
    document.getElementById('sp-send').addEventListener('click', handleSend);
    document.getElementById('sp-optimize').addEventListener('click', handleOptimize);
    setupSpSpeech();
    setupSpWatermarkButton();
    setupSpShield();
    setupSpNativeChat();
    setupSpDownloadProject();
    setupSpCreateProject();
    setupSpPublishProject();
    setupSpEnableCloud();
  }

  // --- Speech Recognition (Web Speech API) ---
  function setupSpSpeech() {
    var btn = document.getElementById('sp-speech');
    if (!btn) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btn.title = "Voz no soportada en este navegador";
      btn.style.opacity = "0.4";
      btn.style.cursor = "not-allowed";
      return;
    }

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (spIsRecording && spSpeechRecognition) {
        spSpeechRecognition.stop();
        return;
      }

      try {
        spSpeechRecognition = new SpeechRecognition();
        spSpeechRecognition.lang = (window.QL_I18N && window.QL_I18N.getLang) ? (window.QL_I18N.getLang() === 'en' ? 'en-US' : 'es-ES') : 'es-ES';
        spSpeechRecognition.continuous = true;
        spSpeechRecognition.interimResults = true;
        spSpeechRecognition.maxAlternatives = 1;

        var finalTranscript = "";
        var textarea = document.getElementById('sp-msg');

        spSpeechRecognition.onstart = function() {
          spIsRecording = true;
          btn.classList.add('sp-recording');
          btn.style.color = '#ef4444';
          btn.style.animation = 'pulse 1s infinite';
          finalTranscript = textarea ? textarea.value : "";
          console.log("[SP Speech] Grabación iniciada");
        };

        spSpeechRecognition.onresult = function(event) {
          var interim = "";
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interim += transcript;
            }
          }
          if (textarea) textarea.value = finalTranscript + interim;
        };

        spSpeechRecognition.onerror = function(event) {
          console.warn("[SP Speech] Error:", event.error);
          spIsRecording = false;
          btn.classList.remove('sp-recording');
          btn.style.color = '';
          btn.style.animation = '';

          if (event.error === "not-allowed") {
            spAlert("Permiso denegado", "Permite el acceso al micrófono en la configuración del navegador.");
          } else if (event.error === "no-speech") {
            spAlert("Sin audio", "No se detectó voz. Inténtalo de nuevo.");
          } else if (event.error !== "aborted") {
            spAlert("Error de voz", "Error: " + event.error);
          }
        };

        spSpeechRecognition.onend = function() {
          spIsRecording = false;
          btn.classList.remove('sp-recording');
          btn.style.color = '';
          btn.style.animation = '';
          if (textarea) textarea.value = finalTranscript.trim();
          console.log("[SP Speech] Grabación finalizada");
        };

        spSpeechRecognition.start();
      } catch(err) {
        console.error("[SP Speech] Error al iniciar:", err);
        spIsRecording = false;
        btn.classList.remove('sp-recording');
        btn.style.color = '';
        btn.style.animation = '';
        spAlert("Error", "No se pudo iniciar el reconocimiento de voz.");
      }
    });
  }

  function updateSync() {
    chrome.storage.local.get(["lovable_projectId","lovable_token"], r => {
      const el = document.getElementById('sp-sync');
      if(!el) return;
      if(r.lovable_projectId && r.lovable_token) {
        el.className = 'sp-sync-status sp-sync-ok';
        el.textContent = '✅ ¡Sincronizado! Proyecto: ' + String(r.lovable_projectId).substring(0,12) + '...';
      } else if (r.lovable_projectId && !r.lovable_token) {
        el.className = 'sp-sync-status sp-sync-waiting';
        el.textContent = '⚠️ Proyecto detectado, falta token. Recarga Lovable o inicia sesión.';
      } else if (!r.lovable_projectId && r.lovable_token) {
        el.className = 'sp-sync-status sp-sync-waiting';
        el.textContent = '⚠️ Token detectado, falta proyecto. Abre un proyecto de Lovable.';
      } else {
        el.className = 'sp-sync-status sp-sync-waiting';
        el.textContent = '⏳ Esperando sincronización...';
      }
    });
  }

  // --- Countdown ---
  function updateCountdown() {
    if (!expiresAt) { var localCountdown = document.getElementById('sp-countdown'); if (localCountdown) localCountdown.style.display = 'none'; return; }
    if(!expiresAt) return;
    const el = document.getElementById('sp-countdown');
    if(!el) return;
    el.style.display = 'flex';
    const expiresMs = new Date(expiresAt).getTime();
    const totalDuration = Math.max(expiresMs - Date.now(), 3600000);
    function tick() {
      const remaining = expiresMs - Date.now();
      if(remaining <= 0) { el.style.display = 'none'; return; }
      const days = Math.floor(remaining / 86400000);
      const hrs = Math.floor((remaining % 86400000) / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const pct = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
      let timeStr = days > 0 ? days + 'd ' + hrs + 'h ' + mins + 'm' : hrs > 0 ? hrs + 'h ' + mins + 'm ' + String(secs).padStart(2,'0') + 's' : mins + ':' + String(secs).padStart(2,'0');
      const label = t('Modo local');
      const urgentClass = pct < 20 ? ' sp-bar-urgent' : '';
      el.innerHTML = spTemplateCountdown(label, timeStr, pct, urgentClass);
    }
    tick();
    setInterval(tick, 1000);
  }

  // --- JWT Decode ---
  function spDecodeJwtUserId(token) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return payload.sub || payload.user_id || null;
    } catch(e) { return null; }
  }

  // --- Image Compression ---
  async function spCompressImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1280;
        let w = img.width, h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob) return resolve({ file, previewUrl: null });
          resolve({ file: new File([blob], file.name, { type: outputType }), previewUrl: URL.createObjectURL(blob) });
        }, outputType, file.type === 'image/png' ? undefined : 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ file, previewUrl: null }); };
      img.src = url;
    });
  }

  // --- File Upload ---
  function spInferContentType(file) {
    if (file && typeof file.type === 'string' && file.type.trim()) return file.type;
    const name = (file && file.name ? file.name : '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';
    const map = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      zip: 'application/zip',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      mp4: 'video/mp4',
      webm: 'video/webm'
    };
    return map[ext] || 'application/octet-stream';
  }

  function spBuildUploadFileName(fileId, file) {
    const rawName = file && file.name ? String(file.name) : '';
    const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : '';
    const safeExt = ext && /^[a-z0-9]{1,10}$/.test(ext) ? ext : 'bin';
    return fileId + '.' + safeExt;
  }

  function spBlobToBase64(blob) {
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

  async function spUploadFileV2(file, token, projectId) {
    // V2 agora é 100% server-side via proxy-command. No fazemos upload aqui;
    // solo marcamos el archivo como "pendiente" e enviamos el base64 al enviar.
    return {
      file_id: "pending_v2_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now()),
      file_name: file.name || "file",
      mime_type: (file && file.type) ? file.type : spInferContentType(file),
      method: "v2",
      deferred: true
    };
  }

  async function spUploadFileDirect(file, token, opts) {
    opts = opts || {};
    if (opts.method === "v2" && opts.projectId) {
      return await spUploadFileV2(file, token, opts.projectId);
    }
    const contentType = spInferContentType(file);
    const b64 = await spBlobToBase64(file);
    const result = await bgFetch(PROXY_COMMAND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey },
      body: JSON.stringify({
        action: "upload_prompt_image_v1",
        license_key: spLicenseKey,
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

  // --- Attachment Preview ---
  function spRenderAttachPreview() {
    const container = document.getElementById('sp-attach-preview');
    if (!container) return;
    if (spAttachedFiles.length === 0) { container.style.display = 'none'; container.innerHTML = ''; return; }
    container.style.display = 'flex';
    container.innerHTML = spAttachedFiles.map((f, i) => spTemplateAttachItem(f, i)).join('');
    container.querySelectorAll('.sp-attach-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (spAttachedFiles[idx] && spAttachedFiles[idx].previewUrl) URL.revokeObjectURL(spAttachedFiles[idx].previewUrl);
        spAttachedFiles.splice(idx, 1);
        spRenderAttachPreview();
      });
    });
  }

  // --- File Attachment Setup ---
  function setupSpFileAttachment() {
    const attachBtn = document.getElementById('sp-attach-btn');
    const fileInput = document.getElementById('sp-file-input');
    if (!attachBtn || !fileInput) return;
    attachBtn.addEventListener('click', () => {
      if (spAttachedFiles.length >= SP_MAX_FILES) { showAlert('Límite', 'Máximo ' + SP_MAX_FILES + ' archivos.'); return; }
      fileInput.click();
    });
    fileInput.addEventListener('change', async () => {
      const files = Array.from(fileInput.files || []);
      fileInput.value = '';
      if (!files.length) return;
      await spRefreshLovableSession(1500);
      const sd = await new Promise(r => chrome.storage.local.get(['lovable_token','lovable_projectId','ql_method_version','ql_license_key'], r));
      let token = sd.lovable_token || '';
      if (!token) { showAlert('Error', 'Token no capturado.'); return; }
      if (token.startsWith('Bearer ')) token = token.slice(7);
      const methodVersion = sd.ql_method_version || 'v1';
      const pidForUpload = sd.lovable_projectId || '';
      for (const file of files) {
        if (spAttachedFiles.length >= SP_MAX_FILES) break;
        if (file.size > SP_MAX_FILE_SIZE) { showAlert('Grande', file.name + ' excede 20MB.'); continue; }
        if (/^image\//i.test(file.type || '')) {
          const vv = spValidateImageFile(file);
          if (!vv.ok) { showAlert('Imagen inválida', vv.reason); continue; }
        }
        let processedFile = file, previewUrl = null;
        if (['image/png','image/jpeg','image/webp'].includes(file.type)) {
          const r = await spCompressImage(file);
          processedFile = r.file; previewUrl = r.previewUrl;
        }
        const isImage = ['image/png','image/jpeg','image/webp'].includes(processedFile.type);
        const idx = spAttachedFiles.length;
        spAttachedFiles.push({ file_id: null, file_name: file.name, previewUrl, file_type: processedFile.type, sizeLabel: spFormatFileSize(processedFile.size), uploading: true, rawFile: processedFile });
        spRenderAttachPreview();
        try {
          const res = await spUploadFileDirect(processedFile, token, { method: methodVersion, projectId: pidForUpload, licenseKey: spLicenseKey });
          spAttachedFiles[idx].file_id = res.file_id;
          if (res.public_url) spAttachedFiles[idx].public_url = res.public_url;
          if (res.lovable_url) spAttachedFiles[idx].lovable_url = res.lovable_url;
          if (res.mime_type) spAttachedFiles[idx].mime_type = res.mime_type;
          spAttachedFiles[idx].method = res.method || 'v1';
          spAttachedFiles[idx].uploading = false;
          spRenderAttachPreview();
        } catch(err) {
          console.warn('[QL] Supabase Storage upload failed:', err.message);
          spAttachedFiles[idx].uploading = false;
          spAttachedFiles[idx].uploadFailed = true;
          spRenderAttachPreview();
          showAlert('Error al subir', 'No se pudo enviar la imagen: ' + cleanVisibleMessage(err.message || 'error desconocido'));
        }
      }
    });
  }

  // --- Modo plan Alert ---
  function showModoPlanAlert() {
    const overlay = document.createElement('div');
    overlay.className = 'sp-modal-overlay';
    overlay.innerHTML = '<div class="sp-modal">' +
      '<div class="sp-modal-icon">\u26a0\ufe0f</div>' +
      '<div class="sp-modal-title">Atención — Modo plan</div>' +
      '<div class="sp-modal-body">' +
        'El <strong>Modo plan/pensar</strong> puede consumir créditos, pero ayuda bastante. Úsalo con cabeza.' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<div class="sp-modal-step"><span class="sp-modal-step-num">1</span><span class="sp-modal-step-text">Activa el <strong>Modo plan</strong> y envía tu prompt desde la extensión.</span></div>' +
        '<div class="sp-modal-step"><span class="sp-modal-step-num">2</span><span class="sp-modal-step-text">Lovable generará un plan. <strong>NO pulses el botón "Aprobar"</strong> dentro de Lovable.</span></div>' +
        '<div class="sp-modal-step"><span class="sp-modal-step-num">3</span><span class="sp-modal-step-text"><strong>Copia el plan generado</strong> y pégalo en el campo de prompt de la extensión.</span></div>' +
        '<div class="sp-modal-step"><span class="sp-modal-step-num">4</span><span class="sp-modal-step-text"><strong>Desactiva el Modo plan</strong> y envía el prompt desde la extensión. ¡No se consumirán créditos extra!</span></div>' +
      '</div>' +
      '<div class="sp-modal-check">' +
        '<input type="checkbox" id="sp-modal-dismiss" />' +
        '<label for="sp-modal-dismiss">No mostrar de nuevo</label>' +
      '</div>' +
      '<button class="sp-modal-btn" id="sp-modal-ok">Entendido</button>' +
    '</div>';
    document.body.appendChild(overlay);
    document.getElementById('sp-modal-ok').addEventListener('click', function() {
      var dismiss = document.getElementById('sp-modal-dismiss').checked;
      if (dismiss) chrome.storage.local.set({ ql_modo_plano_alert_dismissed: true });
      overlay.remove();
    });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  }

  var REMOVE_WATERMARK_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/remove-watermark";
  var PUBLISH_PROJECT_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/publish-project";
  var ENABLE_CLOUD_URL = "https://qrbkzvsgwuyctgcmnwny.supabase.co/functions/v1/enable-cloud";

  function showSpPublishedUrlModal(url){
    var existing = document.getElementById("sp-publish-modal");
    if(existing) existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "sp-publish-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)";
    overlay.innerHTML =
      '<div style="background:#111113;border:1px solid rgba(245,158,11,0.35);border-radius:16px;padding:20px;max-width:340px;width:90%;box-shadow:0 24px 80px -12px rgba(0,0,0,0.8)">' +
        '<div style="font-size:28px;text-align:center;margin-bottom:6px">\ud83c\udf89</div>' +
        '<h3 style="margin:0 0 6px;color:#fbbf24;font-size:16px;font-weight:700;text-align:center">¡Proyecto publicado!</h3>' +
        '<p style="margin:0 0 14px;color:#a1a1aa;font-size:12px;text-align:center">Accede a tu proyecto desde el enlace de abajo:</p>' +
        '<div style="background:#0a0a0b;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px;margin-bottom:14px;word-break:break-all"><a href="' + url + '" target="_blank" style="color:#60a5fa;text-decoration:none;font-size:12px">' + url + '</a></div>' +
        '<div style="display:flex;gap:6px">' +
          '<button id="sp-publish-copy" style="flex:1;padding:8px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#f4f4f5;border-radius:10px;cursor:pointer;font-size:12px;font-weight:600">\ud83d\udccb Copiar</button>' +
          '<button id="sp-publish-open" style="flex:1;padding:8px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:10px;cursor:pointer;font-size:12px;font-weight:700">\ud83d\udd17 Abrir</button>' +
        '</div>' +
        '<button id="sp-publish-close" style="width:100%;margin-top:6px;padding:6px;border:none;background:transparent;color:#71717a;cursor:pointer;font-size:11px">Cerrar</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById("sp-publish-copy").addEventListener("click", function(){
      navigator.clipboard.writeText(url);
      this.textContent = "\u2713 ¡Copiado!";
    });
    document.getElementById("sp-publish-open").addEventListener("click", function(){ window.open(url, "_blank"); });
    document.getElementById("sp-publish-close").addEventListener("click", function(){ overlay.remove(); });
    overlay.addEventListener("click", function(e){ if(e.target === overlay) overlay.remove(); });
  }

  function setupSpPublishProject(){
    var btn = document.getElementById("sp-publish-project");
    if(!btn) return;
    btn.addEventListener("click", async function(){
      var log = document.getElementById("sp-log");
      btn.disabled = true;
      btn.textContent = "\u23f3 Publicando...";

      try {
        var sd = await new Promise(function(r){ chrome.storage.local.get(["lovable_projectId","lovable_token","ql_license_key"], r); });
        var token = sd.lovable_token || "";
        var pid = sd.lovable_projectId || "";
        var licKey = spLicenseKey;

        if(!pid || !token){
          log.className = "sp-log sp-log-error";
          log.textContent = "\u26a0 Proyecto no sincronizado.";
          btn.disabled = false;
          btn.textContent = "\ud83c\udf10 Publicar proyecto";
          return;
        }

        if(token.startsWith("Bearer ")) token = token.slice(7);

        var result = await bgFetch(PUBLISH_PROJECT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey },
          body: JSON.stringify({ license_key: licKey, token_lovable: token, project_id: pid })
        });

        if(result && result.success === false){
          throw new Error(result.error_display || result.message || "Error al publicar");
        }

        log.className = "sp-log sp-log-success";
        log.textContent = "\u2713 ¡Proyecto publicado!";
        if(result && result.url) showSpPublishedUrlModal(result.url);
      } catch(err) {
        log.className = "sp-log sp-log-error";
        log.textContent = "\u2717 " + cleanVisibleMessage(err.message || err);
      } finally {
        btn.disabled = false;
        btn.textContent = "\ud83c\udf10 Publicar proyecto";
      }
    });
  }

  function setupSpEnableCloud(){
    var btn = document.getElementById("sp-enable-cloud");
    if(!btn) return;
    btn.addEventListener("click", async function(){
      var log = document.getElementById("sp-log");
      btn.disabled = true;
      btn.textContent = "\u23f3 Activando Cloud...";

      try {
        var sd = await new Promise(function(r){ chrome.storage.local.get(["lovable_projectId","lovable_token","ql_license_key"], r); });
        var token = sd.lovable_token || "";
        var pid = sd.lovable_projectId || "";
        var licKey = spLicenseKey;

        if(!pid || !token){
          log.className = "sp-log sp-log-error";
          log.textContent = "\u26a0 Proyecto no sincronizado.";
          btn.disabled = false;
          btn.textContent = "\u2601\ufe0f Activar Lovable Cloud";
          return;
        }

        if(token.startsWith("Bearer ")) token = token.slice(7);

        var result = await bgFetch(ENABLE_CLOUD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey },
          body: JSON.stringify({ license_key: licKey, token_lovable: token, project_id: pid, region: "america" })
        });

        if(result && result.success === false){
          throw new Error(result.error_display || result.message || "Error al activar Cloud");
        }

        log.className = "sp-log sp-log-success";
        log.textContent = "\u2713 " + (result && cleanVisibleMessage(result.message) ? cleanVisibleMessage(result.message) : "¡Lovable Cloud activado!");
      } catch(err) {
        log.className = "sp-log sp-log-error";
        log.textContent = "\u2717 " + cleanVisibleMessage(err.message || err);
      } finally {
        btn.disabled = false;
        btn.textContent = "\u2601\ufe0f Activar Lovable Cloud";
      }
    });
  }

  function setupSpWatermarkButton(){
    var btn = document.getElementById("sp-remove-watermark");
    if(!btn) return;
    btn.addEventListener("click", async function(){
      var log = document.getElementById("sp-log");
      btn.disabled = true;
      btn.textContent = "\u23f3 Enviando...";

      try {
        var sd = await new Promise(function(r){ chrome.storage.local.get(["lovable_projectId","lovable_token","ql_license_key"], r); });
        var token = sd.lovable_token || "";
        var pid = sd.lovable_projectId || "";
        var licKey = spLicenseKey;

        if(!pid || !token){
          log.className = "sp-log sp-log-error";
          log.textContent = "\u26a0 Proyecto no sincronizado.";
          btn.disabled = false;
          btn.textContent = "\ud83d\udeab Quitar marca de agua";
          return;
        }

        if(token.startsWith("Bearer ")) token = token.slice(7);

        var payload = {
          license_key: licKey,
          token_lovable: token,
          project_id: pid
        };

        var result = await bgFetch(REMOVE_WATERMARK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey },
          body: JSON.stringify(payload)
        });

        if(result && result.success === false){
          throw new Error(result.error_display || result.message || "Error al enviar");
        }

        log.className = "sp-log sp-log-success";
        log.textContent = "\u2713 Marca de agua quitada correctamente!";
      } catch(err) {
        log.className = "sp-log sp-log-error";
        log.textContent = "\u2717 " + cleanVisibleMessage(err.message || err);
      } finally {
        btn.disabled = false;
        btn.textContent = "\ud83d\udeab Quitar marca de agua";
      }
    });
  }

  // --- Send Message ---
  async function handleSend() {
    const msg = document.getElementById('sp-msg').value.trim();
    const modoPlan = document.getElementById('sp-modo-plano').checked;
    const log = document.getElementById('sp-log');
    const btn = document.getElementById('sp-send');
    if(!msg) { log.className = 'sp-log sp-log-error'; log.textContent = '⚠ Prompt vacío'; return; }
    btn.disabled = true; btn.textContent = '⏳';

    const v1UploadedSp = spAttachedFiles.filter(function(f) { return f.public_url && !f.uploading && !f.uploadFailed && (f.method || 'v1') === 'v1'; });
    const v2PendingSp = spAttachedFiles.filter(function(f) { return f.method === 'v2' && !f.uploading && !f.uploadFailed && f.rawFile; });
    const hasImage = v1UploadedSp.length > 0 || v2PendingSp.length > 0;
    var finalMsg = msg;
    if (v1UploadedSp.length > 0) {
      var linkLines = v1UploadedSp.map(function(f) { return f.public_url; }).join('\n');
      var sep = v1UploadedSp.length > 1 ? 'Analiza los archivos en los enlaces:\n' : 'Analiza el archivo en este enlace: ';
      finalMsg = msg + '\n\n' + sep + linkLines;
    }

    if (hasImage) {
      log.className = 'sp-log sp-log-info'; log.textContent = '📎 Adjuntando enlace de imagen...';
    } else {
      log.className = 'sp-log sp-log-info'; log.textContent = '⏳ Enviando...';
    }

    try {
      const sd = await new Promise(r => chrome.storage.local.get(["lovable_projectId","lovable_token","ql_license_key","ql_session_id","lovable_browserSessionId"], r));
      let token = sd.lovable_token || ''; const pid = sd.lovable_projectId || ''; const licKey = spLicenseKey;
      const bsess = sd.lovable_browserSessionId || '';
      if(!pid || !token) { log.className = 'sp-log sp-log-error'; log.textContent = '⚠ Proyecto no sincronizado'; btn.disabled = false; btn.textContent = 'Enviar'; return; }
      if(token.startsWith('Bearer ')) token = token.slice(7);

      // Build payload for proxy-command (handles everything server-side)
      const payload = {
        license_key: licKey,
        session_id: sessionId,
        projeto_id: pid,
        project_id: pid,
        token_lovable: token,
        mensagem: finalMsg,
        message: finalMsg,
        prompt: finalMsg,
        display_message: WALROS_NATIVE_COMPACT_MESSAGE,
        visible_message: WALROS_NATIVE_COMPACT_MESSAGE,
        native_display_message: WALROS_NATIVE_COMPACT_MESSAGE,
        lovable_send_mode: 'v3_apply_request',
        walros_visual_label: WALROS_USER_VISIBLE_BUBBLE_LABEL,
        modo_pensar: modoPlan,
        device_id: deviceId,
        browser_session_id: bsess
      };

      if (v2PendingSp.length > 0) {
        // Enviamos los bytes en base64: proxy-command hace toda la subida V2.
        const ufs = [];
        for (let i = 0; i < v2PendingSp.length; i++) {
          const f = v2PendingSp[i];
          try {
            const b64 = await spBlobToBase64(f.rawFile);
            ufs.push({
              file_data: b64,
              file_name: f.file_name || ('file_' + i),
              file_type: f.mime_type || f.file_type || 'application/octet-stream'
            });
          } catch(e) { console.warn('[QL] base64 falló:', e); }
        }
        if (ufs.length > 0) payload.upload_files = ufs;
      }

      // Per-device fingerprint headers (UA + sec-ch-ua + cookies)
      payload.session_headers = await buildSessionHeaders(pid);

      const result = await bgFetch(PROXY_COMMAND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey },
        body: JSON.stringify(payload)
      });

      if (result && result.success === false) {
        throw new Error(result.error_display || result.message || "Error al enviar");
      }

      const apiData = result.data || result;
      const msgId = apiData.ai_message_id_usado || '';
      log.className = 'sp-log sp-log-success';
      if (hasImage) {
        log.textContent = '✓ ¡Prompt enviado! imagen válida 😁';
      } else {
        log.textContent = '✓ ¡Prompt enviado!';
      }
      if (msgId) console.log('[QL] API message ID:', msgId);

      // Compact visual bubble in Lovable chat when the page renders the sent prompt
      try {
        chrome.storage.local.get(["ql_msg_compact_cache"], function(res){
          var cache = (res && res.ql_msg_compact_cache) ? res.ql_msg_compact_cache : {};
          if (!cache[pid]) cache[pid] = [];
          cache[pid].push({ t: String(finalMsg), label: WALROS_USER_VISIBLE_BUBBLE_LABEL, ts: Date.now() });
          if (cache[pid].length > 300) cache[pid] = cache[pid].slice(-300);
          chrome.storage.local.set({ ql_msg_compact_cache: cache });
        });
      } catch(e) {}

      // Save to chat history
      addToHistory(msg, 'ok');

      // Caché del mensaje enviado (consistencia de UI)
      //
      //
      try {
        const mv = await new Promise(r => chrome.storage.local.get(["ql_method_version"], r));
        if ((mv.ql_method_version || 'v1') === 'v3') {
          chrome.storage.local.get(["ql_msg_cache"], function(res){
            var log = (res && res.ql_msg_cache) ? res.ql_msg_cache : {};
            if (!log[pid]) log[pid] = [];
            log[pid].push({ t: String(msg), ts: Date.now() });
            if (log[pid].length > 300) log[pid] = log[pid].slice(-300);
            chrome.storage.local.set({ ql_msg_cache: log });
          });
        }
      } catch(e) {}

      document.getElementById('sp-msg').value = '';
      spAttachedFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      spAttachedFiles = [];
      spRenderAttachPreview();
    } catch(err) { log.className = 'sp-log sp-log-error'; log.textContent = '✗ ' + cleanVisibleMessage(err.message || err); addToHistory(msg, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Enviar'; }
  }

  // --- Optimize Prompt ---
  async function handleOptimize() {
    const textarea = document.getElementById('sp-msg');
    const btn = document.getElementById('sp-optimize');
    if(!textarea || !textarea.value.trim()) { showAlert('Atención', 'Escribe un prompt antes de optimizar.'); return; }
    btn.classList.add('sp-tool-loading'); btn.disabled = true;
    try {
      const sd = await new Promise(r => chrome.storage.local.get(["ql_license_key"], r));
      const data = await bgFetch(OPTIMIZE_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, "x-license-key": spLicenseKey }, body: JSON.stringify({ prompt: textarea.value.trim() }) });
      if(data.optimized_prompt) { textarea.value = data.optimized_prompt; showAlert('¡Prompt optimizado! ✨', 'Tu prompt se ha mejorado con IA.'); }
      else if(cleanVisibleMessage(data.error)) showAlert('Error', cleanVisibleMessage(cleanVisibleMessage(data.error)));
    } catch(err) { showAlert('Error', 'Error al optimizar: ' + cleanVisibleMessage(err.message || '')); }
    finally { btn.classList.remove('sp-tool-loading'); btn.disabled = false; }
  }

  // --- Heartbeat ---
  function startHeartbeat(key) {
    if(heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  function setupSpClipboardPaste() {
    var textarea = document.getElementById('sp-msg');
    if (!textarea) return;

    // --- Drag and Drop ---
    var dropZone = document.getElementById('sp-body') || textarea;
    var dragOverlay = null;

    function showDragOverlay() {
      if (dragOverlay) return;
      dragOverlay = document.createElement('div');
      dragOverlay.className = 'sp-drag-overlay';
      dragOverlay.innerHTML = '<div class="sp-drag-overlay-inner">📂 Suelta los archivos aquí</div>';
      document.body.appendChild(dragOverlay);
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
      await spHandleFilesAttach(files);
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
      if (filesToAttach.length > 0) await spHandleFilesAttach(filesToAttach);
    });
  }

  async function spHandleFilesAttach(files) {
    if (spAttachedFiles.length >= SP_MAX_FILES) {
      showAlert('Límite', 'Máximo ' + SP_MAX_FILES + ' archivos.');
      return;
    }
    await spRefreshLovableSession(1500);
    var sd = await new Promise(function(r) { chrome.storage.local.get(['lovable_token','lovable_projectId','ql_method_version','ql_license_key'], r); });
    var token = sd.lovable_token || '';
    if (!token) { showAlert('Error', 'Token no capturado.'); return; }
    if (token.indexOf('Bearer ') === 0) token = token.slice(7);
    var methodVersion = sd.ql_method_version || 'v1';
    var pidForUpload = sd.lovable_projectId || '';

    for (var fi = 0; fi < files.length; fi++) {
      var file = files[fi];
      if (spAttachedFiles.length >= SP_MAX_FILES) break;
      if (file.size > SP_MAX_FILE_SIZE) { showAlert('Grande', file.name + ' excede 20MB.'); continue; }

      if (/^image\//i.test(file.type || '')) {
        var vv2 = spValidateImageFile(file);
        if (!vv2.ok) { showAlert('Imagen inválida', vv2.reason); continue; }
      }

      var processedFile = file;
      var previewUrl = null;
      if (['image/png','image/jpeg','image/webp'].indexOf(file.type) >= 0) {
        var compressed = await spCompressImage(file);
        processedFile = compressed.file;
        previewUrl = compressed.previewUrl;
      }

      var idx = spAttachedFiles.length;
      spAttachedFiles.push({
        file_id: null,
        file_name: file.name || ('file_' + Date.now()),
        previewUrl: previewUrl,
        file_type: processedFile.type,
        sizeLabel: spFormatFileSize(processedFile.size),
        uploading: true,
        rawFile: processedFile
      });
      spRenderAttachPreview();

      try {
        var res = await spUploadFileDirect(processedFile, token, { method: methodVersion, projectId: pidForUpload, licenseKey: spLicenseKey });
        spAttachedFiles[idx].file_id = res.file_id;
        if (res.public_url) spAttachedFiles[idx].public_url = res.public_url;
        if (res.lovable_url) spAttachedFiles[idx].lovable_url = res.lovable_url;
        if (res.mime_type) spAttachedFiles[idx].mime_type = res.mime_type;
        spAttachedFiles[idx].method = res.method || 'v1';
        spAttachedFiles[idx].uploading = false;
        spRenderAttachPreview();
      } catch(err) {
        spAttachedFiles[idx].uploading = false;
        spAttachedFiles[idx].uploadFailed = true;
        spRenderAttachPreview();
          showAlert('Error al subir', 'No se pudo enviar la imagen: ' + cleanVisibleMessage(err.message || 'error desconocido'));
      }
    }
    showAlert('Adjuntado 📎', files.length + ' archivo(s) añadido(s)!');
  }

  // --- Download All Project Files ---
  function setupSpDownloadProject() {
    var btn = document.getElementById('sp-download-project');
    if (!btn) return;
    btn.addEventListener('click', async function() {
      var statusEl = document.getElementById('sp-download-status');
      btn.disabled = true;
      btn.textContent = '🔄 Preparando...';
      if (statusEl) { statusEl.style.display = 'block'; statusEl.className = 'sp-log sp-log-info'; statusEl.textContent = '🔍 Verificando token y proyecto...'; }

      try {
        // ---- Feature flag gate ----
        try {
          var flagUrl = SUPABASE_URL + "/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files";
          var flagResp = await fetch(flagUrl, { method: "GET", headers: { apikey: SUPABASE_ANON_KEY } });
          if (flagResp.ok) {
            var flagRows = await flagResp.json();
            if (flagRows && flagRows.length > 0 && flagRows[0].enabled === false) {
              throw new Error('Error al usar los recursos de la extensión.');
            }
          }
        } catch (flagErr) {
          if (flagErr && flagErr.message === 'Error al usar los recursos de la extensión.') throw flagErr;
        }

        // Get synced token and project ID from storage (already captured by content script)
        var sd = await new Promise(function(r) { chrome.storage.local.get(['lovable_token', 'lovable_projectId'], r); });
        var authToken = sd.lovable_token || '';
        var storedProjectId = sd.lovable_projectId || '';

        if (authToken.indexOf('Bearer ') === 0) authToken = authToken.slice(7);

        // Get current tab to extract project ID
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        var currentTab = tabs[0];
        var projectId = storedProjectId;

        if (!projectId && currentTab && currentTab.url) {
          var urlMatch = currentTab.url.match(/\/projects\/([a-f0-9-]+)/);
          if (urlMatch) projectId = urlMatch[1];
        }

        if (!projectId) {
          throw new Error('Abre primero una página de proyecto de Lovable.');
        }

        if (!authToken) {
          // Fallback: try cookies
          if (statusEl) statusEl.textContent = '🔄 Tentando via cookies...';
          var cookieResponse = await new Promise(function(resolve) {
            chrome.runtime.sendMessage({ action: "readCookies" }, function(resp) { resolve(resp); });
          });
          if (cookieResponse && cookieResponse.success && cookieResponse.tokens && cookieResponse.tokens.length > 0) {
            authToken = cookieResponse.tokens[0].token;
          }
        }

        if (!authToken) {
          throw new Error('Token no encontrado. Abre un proyecto en Lovable y espera la sincronización.');
        }

        // Download project
        if (statusEl) { statusEl.textContent = '📡 Descargando archivos del proyecto...'; }
        btn.textContent = '📡 Descargando...';

        var dlResponse = await new Promise(function(resolve) {
          chrome.runtime.sendMessage({ action: "downloadProject", projectId: projectId, token: authToken }, function(resp) { resolve(resp); });
        });

        if (!dlResponse || !dlResponse.success) {
          throw new Error(dlResponse && dlResponse.error ? dlResponse.error : 'Error al descargar');
        }

        var files = dlResponse.files;
        if (!files || files.length === 0) throw new Error('No se encontró ningún archivo en el proyecto.');

        // Create ZIP
        if (statusEl) statusEl.textContent = '📦 Creando ZIP con ' + files.length + ' archivos...';
        btn.textContent = '📦 Empacotando...';

        if (typeof JSZip === 'undefined') throw new Error('Biblioteca JSZip no cargada.');
        var zip = new JSZip();
        var imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff'];
        var addedFiles = 0;

        for (var fi = 0; fi < files.length; fi++) {
          var f = files[fi];
          if (!f.name) continue;
          if (f.sizeExceeded) continue;

          if (f.contents && f.binary) {
            zip.file(f.name, f.contents, { base64: true, binary: true });
            addedFiles++;
          } else if (!f.contents && imageExts.some(function(ext) { return f.name.toLowerCase().indexOf(ext, f.name.length - ext.length) !== -1; })) {
            try {
              var encodedPath = encodeURIComponent(f.name);
              var imgUrl = 'https://api.lovable.dev/projects/' + projectId + '/files/raw?path=' + encodedPath;
              var imgResp = await fetch(imgUrl, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + authToken, 'Accept': '*/*' },
                credentials: 'omit',
                mode: 'cors'
              });
              if (imgResp.ok) {
                var ab = await imgResp.arrayBuffer();
                zip.file(f.name, ab, { binary: true });
                addedFiles++;
              } else if (f.contents) {
                zip.file(f.name, f.contents);
                addedFiles++;
              }
            } catch(imgErr) {
              if (f.contents) { zip.file(f.name, f.contents); addedFiles++; }
            }
          } else if (f.contents) {
            zip.file(f.name, f.contents);
            addedFiles++;
          }
        }

        if (statusEl) statusEl.textContent = '🗜️ Comprimiendo ' + addedFiles + ' archivos...';
        var zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
        var timestamp = new Date().toISOString().split('T')[0];
        var zipName = 'lovable-' + projectId.substring(0, 8) + '-' + timestamp + '.zip';

        var url = URL.createObjectURL(zipBlob);
        var a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (statusEl) { statusEl.className = 'sp-log sp-log-success'; statusEl.textContent = '✅ ' + addedFiles + ' archivos descargados correctamente!'; }
        btn.textContent = '✅ ¡Descarga completa!';
        setTimeout(function() {
          btn.textContent = '📥 Descargar todos los archivos';
          btn.disabled = false;
          if (statusEl) statusEl.style.display = 'none';
        }, 4000);
      } catch(err) {
        if (statusEl) { statusEl.className = 'sp-log sp-log-error'; statusEl.textContent = '❌ ' + cleanVisibleMessage(err.message || err); statusEl.style.display = 'block'; }
        btn.textContent = '❌ Falhou';
        setTimeout(function() {
          btn.textContent = '📥 Descargar todos los archivos';
          btn.disabled = false;
        }, 3000);
      }
    });
  }

  // --- Initialize ---
  (async function init() {
    deviceId = await getDeviceId();
    const r = await new Promise(res => chrome.storage.local.get(["ql_dark_mode","ql_license_valid","ql_license_key","ql_session_id","ql_user_name","ql_license_status","ql_expires_at"], res));
    if(r.ql_dark_mode === false) document.body.classList.add('sp-light');
    const valid = r.ql_license_valid && r.ql_license_key;
    if (valid) {
      spLicenseKey = r.ql_license_key;
      sessionId = r.ql_session_id || "wls-" + Date.now();
      userName = r.ql_user_name || "Usuario";
      licenseStatus = r.ql_license_status || "active";
      expiresAt = r.ql_expires_at || null;
      if (expiresAt) startCountdown();
      showMainUI();
    } else {
      sessionId = "wls-" + Date.now();
      userName = "Usuario";
      showLicenseGate();
    }
  })();

  // ===== SHIELD SYSTEM (Sidebar) =====
  let spShieldActive = false;

  function setupSpShield() {
    const btn = document.getElementById('sp-shield-btn');
    if (!btn) return;

    chrome.storage.local.get(['ql_shield_active'], (res) => {
      if (res.ql_shield_active === true) {
        spShieldActive = true;
        btn.classList.add('sp-shield-active');
        const label = document.getElementById('sp-shield-label');
        if (label) label.textContent = 'Desactivar escudo';
        injectSpShieldOverlay();
      }
    });

    btn.addEventListener('click', () => {
      spShieldActive = !spShieldActive;
      chrome.storage.local.set({ ql_shield_active: spShieldActive });

      const label = document.getElementById('sp-shield-label');
      if (spShieldActive) {
        btn.classList.add('sp-shield-active');
        if (label) label.textContent = 'Desactivar escudo';
        injectSpShieldOverlay();
        showAlert('Escudo activado 🛡️', 'El input de Lovable está bloqueado.');
      } else {
        btn.classList.remove('sp-shield-active');
        if (label) label.textContent = 'Activar escudo';
        removeSpShieldOverlay();
        showAlert('Escudo desactivado', 'El input de Lovable está libre.');
      }
    });
  }

  function injectSpShieldOverlay() {
    // Send message to content script to inject shield
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function() {
            if (document.getElementById('ql-shield-overlay')) return;
            const chatForm = document.querySelector('form#chat-input');
            if (!chatForm) return;
            const existingPos = getComputedStyle(chatForm).position;
            if (existingPos === 'static') chatForm.style.position = 'relative';
            const overlay = document.createElement('div');
            overlay.id = 'ql-shield-overlay';
            overlay.style.cssText = 'position:absolute;inset:0;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-radius:24px;background:rgba(10,10,11,0.88);backdrop-filter:blur(8px);border:1.5px solid rgba(56,189,248,0.3);box-shadow:0 0 40px -8px rgba(124,90,255,0.25);cursor:not-allowed;pointer-events:all;';
            overlay.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#7c5aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 12px rgba(124,90,255,0.5))"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="color:#a78bfa;font-size:13px;font-weight:600;font-family:Inter,sans-serif">🛡️ Protegido por WalrOS Lovable Tweak</span><span style="color:#71717a;font-size:10px;font-family:Inter,sans-serif">Usa la extensión para enviar prompts</span>';
            ['click','mousedown','keydown'].forEach(ev => overlay.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }, true));
            chatForm.appendChild(overlay);
            chatForm.querySelectorAll('input,button,textarea,[contenteditable]').forEach(el => {
              if (el.id === 'ql-shield-overlay') return;
              el.dataset.qlShieldDisabled = el.disabled || '';
              el.setAttribute('tabindex', '-1');
              if (el.tagName !== 'DIV') el.disabled = true;
              if (el.contentEditable === 'true') { el.contentEditable = 'false'; el.dataset.qlShieldEditable = 'true'; }
            });
          }
        }).catch(() => {});
      }
    });
  }

  function removeSpShieldOverlay() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function() {
            const overlay = document.getElementById('ql-shield-overlay');
            if (overlay) overlay.remove();
            const chatForm = document.querySelector('form#chat-input');
            if (!chatForm) return;
            chatForm.querySelectorAll('[data-ql-shield-disabled]').forEach(el => {
              const wasDis = el.dataset.qlShieldDisabled;
              if (wasDis === 'true') el.disabled = true;
              else el.disabled = false;
              delete el.dataset.qlShieldDisabled;
              el.removeAttribute('tabindex');
              if (el.dataset.qlShieldEditable === 'true') { el.contentEditable = 'true'; delete el.dataset.qlShieldEditable; }
            });
          }
        }).catch(() => {});
      }
    });
  }

  // ===== NATIVE CHAT MODE (Sidebar) =====
  var spNativeChatActive = false;

  function setupSpNativeChat() {
    var btn = document.getElementById('sp-native-chat-btn');
    if (!btn) return;

    chrome.storage.local.get(['ql_native_chat'], function(res) {
      if (res.ql_native_chat === true) {
        spNativeChatActive = true;
        btn.style.background = 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.1))';
        btn.style.borderColor = 'rgba(34,197,94,0.4)';
        btn.style.color = '#4ade80';
        var label = document.getElementById('sp-native-chat-label');
        if (label) label.textContent = 'Volver a la extensión';
      }
    });

    btn.addEventListener('click', function() {
      spNativeChatActive = !spNativeChatActive;
      chrome.storage.local.set({ ql_native_chat: spNativeChatActive });

      var label = document.getElementById('sp-native-chat-label');
      if (spNativeChatActive) {
        btn.style.background = 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.1))';
        btn.style.borderColor = 'rgba(34,197,94,0.4)';
        btn.style.color = '#4ade80';
        if (label) label.textContent = 'Volver a la extensión';
        sendNativeChatCommand('activate');
        showAlert('Chat normal activado \ud83d\udcac', 'Usa el input nativo de Lovable con los recursos de la extensión.');
      } else {
        btn.style.background = 'linear-gradient(135deg,rgba(124,90,255,0.12),rgba(168,85,247,0.08))';
        btn.style.borderColor = 'rgba(56,189,248,0.3)';
        btn.style.color = 'var(--ql-accent,#a78bfa)';
        if (label) label.textContent = 'Usar chat normal';
        sendNativeChatCommand('deactivate');
        showAlert('Chat normal desactivado', 'Has vuelto al modo extensión.');
      }
    });
  }

  // Envía el comando al content-script real (paridad total con el popup).
  function sendNativeChatCommand(cmd) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      try {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'ql_native_chat_' + cmd }, function() {
          // Ignora errores (ej.: pestaña sin content-script)
          void chrome.runtime.lastError;
        });
      } catch (e) { /* noop */ }
    });
  }

  function setupSpCreateProject() {
    var btn = document.getElementById('sp-create-project');
    if (!btn) return;
    btn.addEventListener('click', async function() {
      var statusEl = document.getElementById('sp-download-status');
      var originalLabel = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Creando proyecto...';
      if (statusEl) { statusEl.style.display = 'block'; statusEl.className = 'sp-log'; statusEl.textContent = 'Preparando creación...'; }
      try {
        var sd = await new Promise(function(r) { chrome.storage.local.get(['lovable_token', 'ql_license_key'], r); });
        var authToken = sd.lovable_token || '';
        var licenseKey = spLicenseKey;
        if (authToken.indexOf('Bearer ') === 0) authToken = authToken.slice(7);
        // Build local WalrOS: clave de licencia opcional.
        if (!authToken) {
          var cookieResponse = await new Promise(function(resolve) {
            chrome.runtime.sendMessage({ action: 'readCookies' }, function(resp) { resolve(resp); });
          });
          if (cookieResponse && cookieResponse.success && cookieResponse.tokens && cookieResponse.tokens.length > 0) {
            authToken = cookieResponse.tokens[0].token;
          }
        }
        if (!authToken) throw new Error('Abre lovable.dev en otra pestaña y espera la sincronización.');

        if (statusEl) statusEl.textContent = 'Solicitando creación al servidor...';
        var sd2 = await new Promise(function(r) { chrome.storage.local.get(['lovable_browserSessionId'], r); });
        var resp = await fetch(SUPABASE_URL + '/functions/v1/create-lovable-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({
            license_key: licenseKey,
            token_lovable: authToken,
            browser_session_id: sd2.lovable_browserSessionId || '',
            user_agent: (navigator && navigator.userAgent) ? navigator.userAgent : ''
          })
        });
        var data = await resp.json();
        if (!data || !data.success || !data.link) {
          throw new Error((data && data.error_display) || 'Error al crear el proyecto');
        }
        if (statusEl) statusEl.textContent = '✅ ¡Proyecto creado! Abriendo...';
        btn.textContent = '✅ ¡Éxito!';
        setTimeout(function(){
          try { chrome.tabs.create({ url: data.link, active: true }); }
          catch(e) { window.open(data.link, '_blank'); }
          btn.disabled = false;
          btn.innerHTML = originalLabel;
        }, 500);
      } catch(err) {
        console.error('[SpCreateProject]', err);
        if (statusEl) statusEl.textContent = '❌ ' + cleanVisibleMessage(err.message || 'Error');
        btn.disabled = false;
        btn.innerHTML = originalLabel;
      }
    });
  }

})();
