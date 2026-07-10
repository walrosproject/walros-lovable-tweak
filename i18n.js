// WalrOS Lovable Tweak — i18n ES/EN
// Español por defecto. Inglés opcional desde el selector integrado.
(function(){
  "use strict";
  if (window.__qlI18nLoaded) return;
  window.__qlI18nLoaded = true;

  var DEFAULT_LANG = "es";
  var currentLang = DEFAULT_LANG;
  var applying = false;

  var PT_TO_ES = [
    ["Licença não encontrada ou inativa", "Función no disponible en esta build local."],
    ["Licença não encontrada", "Función no disponible en esta build local."],
    ["licença não encontrada ou inativa", "Función no disponible en esta build local."],
    ["licença não encontrada", "Función no disponible en esta build local."],
    ["Licença Expirada!", "Modo local activo"],
    ["Licença expirada", "Modo local activo"],
    ["licença expirada", "Modo local activo"],
    ["Licença", "Modo local"],
    ["licença", "modo local"],
    ["inativa", "no disponible"],
    ["pagamento", "pago"],
    ["Pagamento", "Pago"],
    ["Arquivo vazio", "Archivo vacío"],
    ["arquivo vazio", "archivo vacío"],
    ["ATALHOS RÁPIDOS", "ATAJOS RÁPIDOS"],
    ["Atalhos rápidos", "Atajos rápidos"],
    ["atalhos rápidos", "atajos rápidos"],
    ["Chat Padrão Desativado", "Chat normal desactivado"],
    ["Voltou ao modo extensión.", "Has vuelto al modo extensión."],
    ["Imagem inválida", "Imagen inválida"],
    ["Imagem muito grande (máx 20MB).", "Imagen demasiado grande (máx. 20 MB)."],
    ["Anexando link da imagem", "Adjuntando enlace de imagen"],
    ["Abrir link", "Abrir enlace"],
    ["Hoje", "Hoy"],
    ["Ontem", "Ayer"],
    ["Segunda", "Lunes"],
    ["Terça", "Martes"],
    ["Quarta", "Miércoles"],
    ["Quinta", "Jueves"],
    ["Sexta", "Viernes"],
    ["Limpar Historial", "Limpiar historial"],
    ["Limpar", "Limpiar"],
    ["mensagen", "mensaje"],
    ["mensagens", "mensajes"],
    ["arquivos baixados", "archivos descargados"],
    ["arquivos", "archivos"],
    ["arquivo", "archivo"],
    ["Agora usando", "Ahora usando"],
    ["Modelo Alterado", "Modelo cambiado"],
    ["extensão", "extensión"],
    ["Extensão", "Extensión"]
  ];

  var ES_TO_EN = [
    ["WalrOS Lovable Tweak", "WalrOS Lovable Tweak"],
    ["Hecho por Alexander Calle", "Made by Alexander Calle"],
    ["Panel lateral", "Side panel"],
    ["Volver al modo flotante", "Back to floating mode"],
    ["Notificaciones", "Notifications"],
    ["Cargando...", "Loading..."],
    ["Cargando", "Loading"],
    ["Soporte", "Support"],
    ["Tema", "Theme"],
    ["Salir", "Exit"],
    ["Reiniciar panel local", "Restart local panel"],
    ["Activar modo local", "Activate local mode"],
    ["Versión local lista para usar.", "Local version ready to use."],
    ["Entrar", "Enter"],
    ["Esperando sincronización...", "Waiting for sync..."],
    ["Panel de revendedor", "Reseller panel"],
    ["Prompt", "Prompt"],
    ["Historial", "History"],
    ["Ningún mensaje", "No messages"],
    ["Tus prompts enviados aparecerán aquí como historial.", "Your sent prompts will appear here as history."],
    ["No hay notificaciones.", "No notifications."],
    ["Ningún mensaje", "No messages"],
    ["Tus prompts enviados aparecerán aquí.", "Your sent prompts will appear here."],
    ["mensaje", "message"],
    ["mensajes", "messages"],
    ["Limpiar historial", "Clear history"],
    ["Limpiar", "Clear"],
    ["Hoy", "Today"],
    ["Ayer", "Yesterday"],
    ["Domingo", "Sunday"],
    ["Lunes", "Monday"],
    ["Martes", "Tuesday"],
    ["Miércoles", "Wednesday"],
    ["Jueves", "Thursday"],
    ["Viernes", "Friday"],
    ["Sábado", "Saturday"],
    ["Escribe tu comando...", "Write your command..."],
    ["Modo plan", "Plan mode"],
    ["Atención — Modo plan", "Warning — Plan mode"],
    ["Atención", "Warning"],
    ["Enviar", "Send"],
    ["ATAJOS RÁPIDOS", "QUICK SHORTCUTS"],
    ["Quitar marca de agua", "Remove watermark"],
    ["Activar escudo", "Enable shield"],
    ["Desactivar escudo", "Disable shield"],
    ["Escudo activado", "Shield enabled"],
    ["Escudo desactivado", "Shield disabled"],
    ["El input de Lovable está bloqueado.", "Lovable's input is blocked."],
    ["El input de Lovable vuelve a estar libre.", "Lovable's input is free again."],
    ["¡Sincronizado! Proyecto:", "Synced! Project:"],
    ["Usar chat normal", "Use normal chat"],
    ["Chat normal activado", "Normal chat enabled"],
    ["Chat normal desactivado", "Normal chat disabled"],
    ["Has vuelto al modo extensión.", "Back to extension mode."],
    ["Usa el input nativo de Lovable con los recursos de la extensión.", "Use Lovable's native input with the extension resources."],
    ["Usa la extensión para enviar prompts", "Use the extension to send prompts"],
    ["Protegido por WalrOS Lovable Tweak", "Protected by WalrOS Lovable Tweak"],
    ["Descargar todos los archivos", "Download all files"],
    ["Adjuntar archivo", "Attach file"],
    ["Adjuntar archivo (máx. 10)", "Attach file (max. 10)"],
    ["Optimizar con IA", "Optimize with AI"],
    ["Voz", "Voice"],
    ["Voz a texto", "Speech to text"],
    ["No mostrar de nuevo", "Do not show again"],
    ["Entendido", "Got it"],
    ["Abrir enlace", "Open link"],
    ["Descargar", "Download"],
    ["Nueva actualización", "New update"],
    ["¡Prompt optimizado! ✨", "Prompt optimized! ✨"],
    ["Tu prompt se ha mejorado con IA y está listo para enviarse.", "Your prompt has been improved with AI and is ready to send."],
    ["Tu prompt se ha mejorado con IA.", "Your prompt has been improved with AI."],
    ["Error", "Error"],
    ["Error de voz", "Voice error"],
    ["No se pudo iniciar el reconocimiento de voz.", "Could not start speech recognition."],
    ["Error al subir", "Upload error"],
    ["No se pudo enviar la imagen", "Could not send the image"],
    ["error desconocido", "unknown error"],
    ["Imagen inválida", "Invalid image"],
    ["Imagen demasiado grande (máx. 20 MB).", "Image too large (max. 20 MB)."],
    ["Adjuntando enlace de imagen...", "Attaching image link..."],
    ["Imagen", "Image"],
    ["imagen(es)", "image(s)"],
    ["Archivo", "File"],
    ["archivo", "file"],
    ["archivos", "files"],
    ["Sin respuesta del background", "No response from background"],
    ["Error al enviar", "Send error"],
    ["Error al publicar", "Publish error"],
    ["Error al activar Cloud", "Cloud activation error"],
    ["Error al descargar", "Download error"],
    ["Proyecto no sincronizado", "Project not synced"],
    ["Token no capturado.", "Token not captured."],
    ["Abre primero una página de proyecto de Lovable.", "Open a Lovable project page first."],
    ["Token no encontrado. Abre un proyecto en Lovable y espera la sincronización.", "Token not found. Open a Lovable project and wait for sync."],
    ["Abre lovable.dev y espera la sincronización.", "Open lovable.dev and wait for sync."],
    ["Abre lovable.dev en otra pestaña y espera la sincronización.", "Open lovable.dev in another tab and wait for sync."],
    ["No se encontró ningún archivo en el proyecto.", "No files were found in the project."],
    ["Biblioteca JSZip no cargada.", "JSZip library not loaded."],
    ["Modelo cambiado", "Model changed"],
    ["Ahora usando", "Now using"],
    ["Bugs", "Bugs"],
    ["Refactor", "Refactor"],
    ["Errores", "Errors"],
    ["Optimizar", "Optimize"],
    ["Comentarios", "Comments"],
    ["Componentes", "Components"],
    ["Revisión", "Review"],
    ["Analiza el código e identifica todos los bugs, errores y fallos. Corrige cada uno explicando el problema y la solución aplicada.", "Analyze the code and identify all bugs, errors and issues. Fix each one while explaining the problem and the applied solution."],
    ["Elabora un plan completo de refactorización y optimización del sistema por etapas.", "Create a complete staged plan to refactor and optimize the system."],
    ["Implementa un manejo de errores robusto en todo el código, incluyendo try/catch, validaciones y mensajes de error claros para el usuario.", "Implement robust error handling across the codebase, including try/catch, validations and clear user-facing error messages."],
    ["Implementa un manejo de errores robusto en todo el código.", "Implement robust error handling across the codebase."],
    ["Analiza y optimiza el rendimiento del sistema.", "Analyze and optimize the system performance."],
    ["Analiza y optimiza el rendimiento del sistema, identificando cuellos de botella, mejorando queries, reduciendo re-renders y aplicando buenas prácticas.", "Analyze and optimize the system performance, identifying bottlenecks, improving queries, reducing re-renders and applying best practices."],
    ["Añade comentarios claros y documentación en todo el código.", "Add clear comments and documentation across the codebase."],
    ["Añade comentarios claros y documentación en todo el código, explicando la lógica, parámetros y retornos de cada función.", "Add clear comments and documentation across the codebase, explaining each function's logic, parameters and return values."],
    ["Monta un plan completo de creación y optimización SEO para este sitio.", "Build a complete SEO creation and optimization plan for this site."],
    ["Mejora la interfaz de usuario haciéndola más moderna, responsive y accesible.", "Improve the user interface, making it more modern, responsive and accessible."],
    ["Mejora la interfaz de usuario haciéndola más moderna, responsive y accesible, siguiendo buenas prácticas de UX/UI.", "Improve the user interface, making it more modern, responsive and accessible while following UX/UI best practices."],
    ["Reorganiza el código separándolo en componentes reutilizables.", "Reorganize the code by splitting it into reusable components."],
    ["Reorganiza el código separándolo en componentes reutilizables, bien estructurados y con responsabilidades únicas.", "Reorganize the code into reusable, well-structured components with single responsibilities."],
    ["Haz una revisión completa del código identificando problemas de calidad, seguridad y rendimiento.", "Perform a full code review identifying quality, security and performance issues."],
    ["Haz una revisión completa del código identificando problemas de calidad, seguridad, rendimiento y posibles mejoras.", "Perform a full code review identifying quality, security, performance issues and possible improvements."],
    // License gate
    ["Ingresa tu licencia para poder acceder.", "Enter your license to access."],
    ["Clave de licencia", "License key"],
    ["Activar licencia", "Activate license"],
    ["¿No tienes licencia? Consigue una.", "Don't have a license? Get one."],
    ["Introduce una clave de licencia", "Enter a license key"],
    ["Licencia expirada", "License expired"],
    ["Licencia", "License"],
    ["¡Licencia activada!", "License activated!"],
    ["Modo local activo", "Local mode active"],
    // Language selector
    ["Idioma / Language", "Language / Idioma"]
  ];

  var EN_TO_ES = ES_TO_EN.map(function(pair){ return [pair[1], pair[0]]; });

  function replaceAllPairs(text, pairs) {
    if (typeof text !== "string" || !text) return text;
    var out = text;
    pairs.forEach(function(pair){ out = out.split(pair[0]).join(pair[1]); });
    return out;
  }

  function replaceExactPair(text, pairs) {
    if (typeof text !== "string" || !text) return text;
    var leading = (text.match(/^\s*/) || [""])[0];
    var trailing = (text.match(/\s*$/) || [""])[0];
    var core = text.trim();
    for (var i = 0; i < pairs.length; i++) {
      if (core === pairs[i][0]) return leading + pairs[i][1] + trailing;
    }
    // ponytail: strip leading emoji+space and retry for icon-prefixed buttons
    var noPrefix = core.replace(/^[^\w\sáéíóúüñÁÉÍÓÚÜÑ]+\s*/, '');
    if (noPrefix !== core) {
      var emojiPrefix = core.slice(0, core.length - noPrefix.length);
      // ponytail: also try stripping trailing emoji+space (🛡️, ⚠️, etc.)
      var noSuffix = noPrefix.replace(/\s*[^\w\sáéíóúüñÁÉÍÓÚÜÑ.,!?¡¿:;…\-]+$/g, '');
      var emojiSuffix = noSuffix !== noPrefix ? noPrefix.slice(noSuffix.length) : '';
      for (var j = 0; j < pairs.length; j++) {
        if (noSuffix === pairs[j][0]) return leading + emojiPrefix + pairs[j][1] + emojiSuffix + trailing;
      }
    }
    return text;
  }

  function normalizeSpanish(text) {
    return replaceAllPairs(text, PT_TO_ES);
  }

  function translateText(text) {
    if (typeof text !== "string") return text;
    var out = normalizeSpanish(text);
    if (currentLang === "en") out = replaceAllPairs(out, ES_TO_EN);
    else out = replaceExactPair(out, EN_TO_ES);
    return out;
  }

  function t(s) { return translateText(s); }

  function getStorageLang(cb) {
    try {
      chrome.storage.local.get(["ql_lang", "ql_lang_default_es_v419"], function(res){
        // Al instalar/actualizar esta build, arrancamos en español aunque una versión vieja
        // hubiera dejado guardado EN/GB. Luego el usuario puede cambiar manualmente a EN.
        if (!res || res.ql_lang_default_es_v419 !== true) {
          try { chrome.storage.local.set({ ql_lang: "es", ql_lang_default_es_v419: true }); } catch(e) {}
          cb("es");
          return;
        }
        var value = res && res.ql_lang;
        cb(value === "en" ? "en" : "es");
      });
    } catch(e) { cb(DEFAULT_LANG); }
  }

  function setLang(lang, options) {
    currentLang = lang === "en" ? "en" : "es";
    try { chrome.storage.local.set({ ql_lang: currentLang }); } catch(e) {}
    applyAll(document);
    syncSelectors();
    if (options && options.reload) {
      try { location.reload(); } catch(e) {}
    }
  }

  function makeSelector(id) {
    var select = document.createElement("select");
    select.id = id;
    select.className = "ql-lang-select";
    select.title = "Idioma / Language";
    select.innerHTML = '<option value="es">ES</option><option value="en">EN</option>';
    select.value = currentLang;
    select.addEventListener("change", function(){ setLang(select.value); });
    return select;
  }

  function ensureSelectors() {
    var spActions = document.querySelector(".sp-header-actions");
    if (spActions && !document.getElementById("sp-lang-select")) {
      spActions.insertBefore(makeSelector("sp-lang-select"), spActions.firstChild);
    }
    var qlActions = document.querySelector("#ql-header .ql-header-right");
    if (qlActions && !document.getElementById("ql-lang-select")) {
      qlActions.insertBefore(makeSelector("ql-lang-select"), qlActions.firstChild);
    }
    injectStyle();
    syncSelectors();
  }

  function syncSelectors() {
    ["sp-lang-select", "ql-lang-select"].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.value = currentLang;
    });
  }

  function injectStyle() {
    if (document.getElementById("ql-lang-select-style")) return;
    var style = document.createElement("style");
    style.id = "ql-lang-select-style";
    style.textContent = '.ql-lang-select{height:26px;min-width:45px;padding:0 5px;border-radius:8px;border:1px solid rgba(124,90,255,.35);background:rgba(24,24,27,.82);color:#f4f4f5;font:700 11px Inter,system-ui,sans-serif;outline:none;cursor:pointer}.ql-lang-select:hover{border-color:rgba(168,85,247,.75)}';
    (document.head || document.documentElement).appendChild(style);
  }

  function translateNodeText(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node){
        var parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.nodeName;
        if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var next = translateText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function translateAttributes(root) {
    var elements = [];
    if (root.nodeType === 1) elements.push(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('[title],[placeholder],[aria-label],input[value],button[value]').forEach(function(el){ elements.push(el); });
    }
    elements.forEach(function(el){
      ["title", "placeholder", "aria-label", "value"].forEach(function(attr){
        if (!el.hasAttribute || !el.hasAttribute(attr)) return;
        if (attr === "value" && !/^(button|submit|reset)$/i.test(el.type || el.tagName)) return;
        var val = el.getAttribute(attr);
        var next = translateText(val);
        if (next !== val) el.setAttribute(attr, next);
      });
    });
  }

  function getTranslationTargets(root) {
    // En el sidepanel podemos traducir todo el documento.
    if (document.querySelector(".sp-header") || location.protocol === "chrome-extension:") {
      return [root || document.body || document];
    }
    // En lovable.dev no tocamos la página: solo la UI inyectada por la extensión.
    if (root && root.nodeType === 1 && (root.id === "ql-floating" || root.closest && root.closest("#ql-floating,.ql-modo-plan-overlay,.ql-modo-plano-overlay,.ql-notif-panel,.ql-custom-alert"))) {
      return [root];
    }
    var selectors = ["#ql-floating", ".ql-modo-plan-overlay", ".ql-modo-plano-overlay", "#ql-notif-panel", ".ql-custom-alert"];
    var targets = [];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ targets.push(el); });
    });
    return targets;
  }

  function applyAll(root) {
    if (applying) return;
    applying = true;
    try {
      ensureSelectors();
      getTranslationTargets(root).forEach(function(target){
        translateNodeText(target);
        translateAttributes(target);
      });
      syncSelectors();
    } finally {
      applying = false;
    }
  }

  function startObserver() {
    try {
      var mo = new MutationObserver(function(mutations){
        if (applying) return;
        clearTimeout(startObserver._timer);
        startObserver._timer = setTimeout(function(){ applyAll(document.body || document); }, 60);
      });
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true, characterData: true });
    } catch(e) {}
  }

  window.QL_I18N = {
    t: t,
    setLang: setLang,
    getLang: function(){ return currentLang; },
    apply: applyAll,
    inject: applyAll,
    SUPPORTED: ["es", "en"],
    LABELS: { es: "🇪🇸 ES", en: "🇬🇧 EN" }
  };

  getStorageLang(function(lang){
    currentLang = lang;
    if (!lang) currentLang = DEFAULT_LANG;
    try { chrome.storage.local.set({ ql_lang: currentLang, ql_lang_migrated_v411: true }); } catch(e) {}
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function(){ applyAll(document.body || document); startObserver(); });
    } else {
      applyAll(document.body || document); startObserver();
    }
  });
})();
