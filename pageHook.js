(function () {
console.log("[WalrOSHook] Iniciando");

let capturedToken = null;
let capturedProjectId = null;
let capturedBrowserSessionId = null;
let capturedClientGitSha = null;
let capturedLovPlatform = null;

function decodePayload(token){
  try{
    var parts = String(token || "").replace(/^Bearer\s+/i, "").trim().split(".");
    if(parts.length !== 3) return null;
    var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64));
  }catch(e){ return null; }
}

function isLikelyLovableToken(token){
  var payload = decodePayload(token);
  if(!payload || !payload.sub) return false;
  var role = String(payload.role || "").toLowerCase();
  // Aceptamos tokens de usuario aunque el issuer sea Supabase/Lovable.
  // Antes se descartaban algunos tokens válidos y por eso la UI se quedaba
  // eternamente en "Esperando sincronización".
  if(role === "anon" || role === "service_role") return false;
  return true;
}

function getHeaderValue(headers, name){
  try{
    if(!headers) return null;
    var lower = String(name).toLowerCase();
    if(typeof headers.get === "function") return headers.get(name) || headers.get(lower);
    if(Array.isArray(headers)){
      for(var i = 0; i < headers.length; i++){
        var row = headers[i];
        if(row && String(row[0]).toLowerCase() === lower) return row[1];
      }
      return null;
    }
    if(typeof headers === "object"){
      for(var k in headers){
        if(Object.prototype.hasOwnProperty.call(headers, k) && String(k).toLowerCase() === lower) return headers[k];
      }
    }
  }catch(e){}
  return null;
}

function extractProjectIdFromUrl(url){
  try{
    var str = String(url || "");
    var patterns = [
      /\/projects\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
      /\/project\/([0-9a-fA-F-]{36})(?:[/?#]|$)/i,
      /projectId[=:]([0-9a-fA-F-]{36})/i,
      /project_id[=:]([0-9a-fA-F-]{36})/i,
      /[?&]project=([0-9a-fA-F-]{36})/i,
      /\/projects\/([^/?#]+)/i,
      /\/project\/([^/?#]+)/i
    ];
    for(var i=0;i<patterns.length;i++){
      var m = str.match(patterns[i]);
      if(m && m[1]) return decodeURIComponent(m[1]);
    }
  }catch(e){}
  return null;
}

function findProjectIdInStorage(){
  try{
    var stores = [window.localStorage, window.sessionStorage];
    var uuidRe = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    for(var si=0; si<stores.length; si++){
      var store = stores[si];
      if(!store) continue;
      for(var i=0; i<store.length; i++){
        var k = store.key(i) || "";
        var v = store.getItem(k) || "";
        var keyHit = /project|lovable/i.test(k);
        var m = String(v).match(uuidRe) || String(k).match(uuidRe);
        if(keyHit && m && m[0]) return m[0];
      }
    }
  }catch(e){}
  return null;
}

function findProjectIdInDom(){
  try{
    var links = document.querySelectorAll('a[href*="/projects/"],a[href*="/project/"]');
    for(var i=0; i<links.length; i++){
      var pid = extractProjectIdFromUrl(links[i].href || links[i].getAttribute('href') || '');
      if(pid) return pid;
    }
  }catch(e){}
  return null;
}

function getProjectFromPage(){
  try{
    return extractProjectIdFromUrl(window.location.href) || findProjectIdInStorage() || findProjectIdInDom();
  }catch(e){ return null; }
}

function notifyFound(token, projectId, browserSessionId, force = false, clientGitSha = null, lovPlatform = null){
  const newProject = projectId || getProjectFromPage();
  const normalizedToken = typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : null;
  const normalizedSession = typeof browserSessionId === "string" ? browserSessionId.trim() : null;
  let changed = false;
  if(normalizedToken && isLikelyLovableToken(normalizedToken) && normalizedToken !== capturedToken){ capturedToken = normalizedToken; changed = true; }
  if(newProject && newProject !== capturedProjectId){ capturedProjectId = newProject; changed = true; }
  if(normalizedSession && normalizedSession !== capturedBrowserSessionId){ capturedBrowserSessionId = normalizedSession; changed = true; }
  if(!changed && !force) return;
  console.log("[WalrOSHook] ✅ Sesión Lovable sincronizada", capturedToken ? "token" : "sin token", capturedBrowserSessionId ? "bsess" : "sin bsess");
  console.log("[WalrOSHook] ProjectId:", capturedProjectId);
  window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:capturedProjectId, browserSessionId:capturedBrowserSessionId },"*");
}

window.addEventListener("message", (event)=>{
  if(event.source !== window) return;
  if(!event.data || event.data.type !== "lovableRequestToken") return;
  scanStorageForSession();
  notifyFound(capturedToken, getProjectFromPage() || capturedProjectId, capturedBrowserSessionId, true);
});

(function wrapFetch(){
  try{
    const originalFetch = window.fetch;
    window.fetch = async function(...args){
      try{
        let reqUrl = typeof args[0] === "string" ? args[0] : ((args[0] && args[0].url) || "");
        let opts = args[1] || {};
        let auth = null;
        let bsess = null;
        let gitSha = null;
        let lovPlatform = null;
        if(args[0] instanceof Request){
          reqUrl = args[0].url || reqUrl;
          auth = getHeaderValue(args[0].headers, "Authorization");
          bsess = getHeaderValue(args[0].headers, "X-Browser-Session-ID");
          gitSha = getHeaderValue(args[0].headers, "X-Client-Git-Sha");
          lovPlatform = getHeaderValue(args[0].headers, "X-Lov-Platform");
        }
        if(opts.headers){
          auth = getHeaderValue(opts.headers, "Authorization") || auth;
          bsess = getHeaderValue(opts.headers, "X-Browser-Session-ID") || bsess;
          gitSha = getHeaderValue(opts.headers, "X-Client-Git-Sha") || gitSha;
          lovPlatform = getHeaderValue(opts.headers, "X-Lov-Platform") || lovPlatform;
        }
        const pid = extractProjectIdFromUrl(reqUrl);
        if(auth && auth.startsWith("Bearer ")){
          const rawToken = auth.slice(7);
          notifyFound(rawToken, pid, bsess, false, gitSha, lovPlatform);
        } else if(bsess || gitSha || lovPlatform) {
          notifyFound(null, pid, bsess, false, gitSha, lovPlatform);
        }
      }catch(e){}
      return originalFetch.apply(this,args);
    };
  }catch(e){ console.warn("[WalrOSHook] erro fetch",e); }
try { scanStorageForSession(); setTimeout(scanStorageForSession, 800); setTimeout(scanStorageForSession, 2500); } catch(e) {}
})();

(function wrapXHR(){
  try{
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function(method,url){
      this._lovable_url = url;
      return origOpen.apply(this,arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function(name,value){
      if(name && name.toLowerCase()==="x-browser-session-id" && value){
        this._lovable_bsess = value;
        notifyFound(null, extractProjectIdFromUrl(this._lovable_url), value);
      }
      if(name && name.toLowerCase()==="authorization" && value && value.startsWith("Bearer ")){
        const rawToken = value.slice(7);
        notifyFound(rawToken, extractProjectIdFromUrl(this._lovable_url), this._lovable_bsess);
      }
      return origSetHeader.apply(this,arguments);
    };
  }catch(e){ console.warn("[WalrOSHook] erro xhr",e); }
try { scanStorageForSession(); setTimeout(scanStorageForSession, 800); setTimeout(scanStorageForSession, 2500); } catch(e) {}
})();


function findJwtCandidates(value){
  var out = [];
  try{
    var str = String(value || "");
    try { str = decodeURIComponent(str); } catch(e) {}
    var re = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
    var m;
    while((m = re.exec(str))){
      if(m[0] && out.indexOf(m[0]) === -1) out.push(m[0]);
    }
  }catch(e){}
  return out;
}

function scanStorageForSession(){
  try{
    var projectId = getProjectFromPage() || capturedProjectId;
    var stores = [window.localStorage, window.sessionStorage];
    for(var si=0; si<stores.length; si++){
      var store = stores[si];
      if(!store) continue;
      for(var i=0; i<store.length; i++){
        var k = store.key(i);
        var v = store.getItem(k);
        var candidates = findJwtCandidates(v);
        for(var c=0; c<candidates.length; c++){
          if(isLikelyLovableToken(candidates[c])) { notifyFound(candidates[c], projectId, capturedBrowserSessionId, true); return true; }
        }
      }
    }
    var cookieCandidates = findJwtCandidates(document.cookie || "");
    for(var j=0; j<cookieCandidates.length; j++){
      if(isLikelyLovableToken(cookieCandidates[j])) { notifyFound(cookieCandidates[j], projectId, capturedBrowserSessionId, true); return true; }
    }
    notifyFound(capturedToken, projectId, capturedBrowserSessionId, true);
  }catch(e){}
  return false;
}

setInterval(()=>{
  try { scanStorageForSession(); } catch(e) {}
  const p = getProjectFromPage();
  if(p && p !== capturedProjectId){
    capturedProjectId = p;
    window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:p, browserSessionId:capturedBrowserSessionId },"*");
  }
  scanStorageForSession();
},1500);

try { scanStorageForSession(); setTimeout(scanStorageForSession, 800); setTimeout(scanStorageForSession, 2500); } catch(e) {}
})();