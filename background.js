console.log("[Background] WalrOS Lovable Tweak service worker iniciado");

// Initialize sidebar mode preference
chrome.storage.local.get(["ql_sidebar_mode"], (res) => {
  const sidebarMode = res.ql_sidebar_mode || false;
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: sidebarMode }).catch(() => {});
  console.log("[Background] Sidebar mode:", sidebarMode);
});

// Listen for storage changes to update panel behavior
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.ql_sidebar_mode) {
    const sidebarMode = changes.ql_sidebar_mode.newValue || false;
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: sidebarMode }).catch(() => {});
    console.log("[Background] Sidebar mode updated:", sidebarMode);
  }
});

// Handle action click (icon click) — this IS a user gesture, so sidePanel.open() works here
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const res = await chrome.storage.local.get(["ql_sidebar_mode"]);
    if (res.ql_sidebar_mode) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch(err) {
    console.error("[Background] action.onClicked sidePanel error:", err);
  }
});

function qlDecodeJwtPayload(token) {
  try {
    var raw = String(token || "").replace(/^Bearer\s+/i, "").trim();
    var parts = raw.split(".");
    if (parts.length !== 3) return null;
    var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64));
  } catch(e) { return null; }
}

function qlIsUsableLovableToken(token) {
  var payload = qlDecodeJwtPayload(token);
  if (!payload || !payload.sub) return false;
  var exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp && exp * 1000 < Date.now() + 30000) return false;
  var role = String(payload.role || "").toLowerCase();
  if (role === "anon" || role === "service_role") return false;
  // Aceptamos tokens de usuario aunque vengan emitidos por Supabase/Lovable.
  return true;
}

function qlFindJwtCandidates(value) {
  var out = [];
  try {
    var str = String(value || "");
    try { str = decodeURIComponent(str); } catch(e) {}
    var re = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
    var m;
    while ((m = re.exec(str))) {
      if (m[0] && out.indexOf(m[0]) === -1) out.push(m[0]);
    }
  } catch(e) {}
  return out;
}


function qlChooseBestToken(primary, fallback) {
  var a = String(primary || "").replace(/^Bearer\s+/i, "").trim();
  var b = String(fallback || "").replace(/^Bearer\s+/i, "").trim();
  if (qlIsUsableLovableToken(b)) {
    var pa = qlDecodeJwtPayload(a) || {};
    var pb = qlDecodeJwtPayload(b) || {};
    if (!qlIsUsableLovableToken(a)) return b;
    if ((pb.exp || 0) > (pa.exp || 0)) return b;
  }
  return a;
}

function qlGetStorage(keys) {
  return new Promise(function(resolve) { chrome.storage.local.get(keys, function(res) { resolve(res || {}); }); });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "lovableSync") {
    const updates = {};
    if (msg.token) updates.lovable_token = String(msg.token).replace(/^Bearer\s+/i, "").trim();
    if (msg.projectId) updates.lovable_projectId = msg.projectId;
    if (msg.browserSessionId) updates.lovable_browserSessionId = String(msg.browserSessionId).trim();
    if (Object.keys(updates).length) {
      chrome.storage.local.set(updates, () => {
        console.log("[Background] saved:", Object.keys(updates).join(", "));
      });
    }
  }

  if (msg && msg.action === "activateSidebar") {
    // Only set the preference and behavior — cannot open side panel without user gesture
    chrome.storage.local.set({ ql_sidebar_mode: true });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
    // Try to open if sender is a tab (content script click IS a user gesture propagated)
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
        sendResponse({ ok: true });
      }).catch((err) => {
        console.warn("[Background] sidePanel.open deferred — user must click extension icon:", err.message);
        sendResponse({ ok: true, deferred: true, message: "Haz clic en el icono de la extensión para abrir el panel lateral." });
      });
    } else {
      sendResponse({ ok: true, deferred: true, message: "Haz clic en el icono de la extensión para abrir el panel lateral." });
    }
    return true;
  }

  if (msg && msg.action === "deactivateSidebar") {
    chrome.storage.local.set({ ql_sidebar_mode: false });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (msg && msg.action === "openSidePanel") {
    // This can only work if triggered from a user gesture context
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
        sendResponse({ ok: true });
      }).catch((err) => {
        console.warn("[Background] openSidePanel deferred:", err.message);
        sendResponse({ ok: false, error: err.message });
      });
    } else {
      sendResponse({ ok: false, error: "No tab context" });
    }
    return true;
  }

  if (msg && msg.action === "proxyFetch") {
    (async () => {
      try {
        console.log("[Background] proxyFetch ->", msg.url);
        var opts = {
          method: msg.method || "POST",
          headers: msg.headers || {},
        };
        if (msg.body) opts.body = msg.body;
        var resp = await fetch(msg.url, opts);
        var text = await resp.text();
        var data;
        try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
        sendResponse({ ok: resp.ok, status: resp.status, data: data });
      } catch(err) {
        console.error("[Background] proxyFetch error:", err);
        sendResponse({ ok: false, status: 0, data: { error: err.message || "Fetch falló in background" } });
      }
    })();
    return true;
  }

  // --- LOVABLE_V2_UPLOAD: deprecated ---
  // V2 uploads are handled inside one proxy-command request now.
  if (msg && msg.action === "lovableV2Upload") {
    sendResponse({ ok: false, error: "Flujo antiguo de subida V2 eliminado. Reinstala la extensión v4.2.2." });
    return false;
  }

  // --- READ_COOKIES: lee todas las cookies de Lovable y extrae JWTs de usuario ---
  if (msg && msg.action === "readCookies") {
    chrome.cookies.getAll({ domain: "lovable.dev" }, function(cookies) {
      var foundTokens = [];
      var seen = {};
      function addToken(token, cookieName, httpOnly) {
        token = String(token || "").replace(/^Bearer\s+/i, "").trim();
        if (!token || seen[token] || !qlIsUsableLovableToken(token)) return;
        seen[token] = true;
        foundTokens.push({ token: token, cookieName: cookieName || "cookie", httpOnly: !!httpOnly });
      }
      if (cookies && cookies.length) {
        for (var i = 0; i < cookies.length; i++) {
          var c = cookies[i];
          if (!c || typeof c.value !== "string") continue;
          var candidates = qlFindJwtCandidates(c.value);
          for (var j = 0; j < candidates.length; j++) addToken(candidates[j], c.name, c.httpOnly);
        }
      }
      sendResponse({ success: foundTokens.length > 0, tokens: foundTokens });
    });
    return true;
  }

  // --- GET_LOVABLE_COOKIES: returns all lovable.dev cookies as Cookie header string ---
  if (msg && msg.action === "getLovableCookies") {
    chrome.cookies.getAll({ domain: "lovable.dev" }, function(cookies) {
      var parts = [];
      if (cookies && cookies.length) {
        for (var i = 0; i < cookies.length; i++) {
          var c = cookies[i];
          if (c && c.name && typeof c.value === "string") {
            parts.push(c.name + "=" + c.value);
          }
        }
      }
      sendResponse({ ok: true, cookie: parts.join("; ") });
    });
    return true;
  }

  // --- DOWNLOAD_PROJECT: fetch project source code from Lovable API ---
  if (msg && msg.action === "downloadProject") {
    (async function() {
      try {
        var apiUrl = "https://lovable-api.com/projects/" + msg.projectId + "/source-code";
        var resp = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + msg.token,
            "Accept": "application/json"
          }
        });
        if (!resp.ok) {
          sendResponse({ success: false, error: "La API devolvió " + resp.status });
          return;
        }
        var data = await resp.json();
        sendResponse({ success: true, files: data.files || [] });
      } catch(err) {
        sendResponse({ success: false, error: err.message || "Error al descargar" });
      }
    })();
    return true;
  }

});


// License is now managed via Supabase backend + real activation flow
// (see content.js: showLicenseGate / validateLicense)
// chrome.runtime.onInstalled block removed intentionally.
