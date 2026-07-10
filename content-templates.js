// ============================================
// WalrOS Lovable Tweak – HTML Templates (content)
// Separado de la lógica de negocio (content.js)
// ============================================

const SVG_ICONS = {
  wrench: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  msgSquare: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  trendUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  headphones: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  sparkles: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  sidePanel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
};

const PROMPT_TEMPLATES = [
  { icon: SVG_ICONS.wrench, label: "Bugs", prompt: "Analiza el código e identifica todos los bugs, errores y fallos. Corrige cada uno explicando el problema y la solución aplicada." },
  { icon: SVG_ICONS.edit, label: "Refactor", prompt: "Elabora un plan completo de refactorización y optimización del sistema por etapas." },
  { icon: SVG_ICONS.shield, label: "Errores", prompt: "Implementa un manejo de errores robusto en todo el código, incluyendo try/catch, validaciones y mensajes de error claros para el usuario." },
  { icon: SVG_ICONS.zap, label: "Optimizar", prompt: "Analiza y optimiza el rendimiento del sistema, identificando cuellos de botella, mejorando queries, reduciendo re-renders y aplicando buenas prácticas." },
  { icon: SVG_ICONS.msgSquare, label: "Comentarios", prompt: "Añade comentarios claros y documentación en todo el código, explicando la lógica, parámetros y retornos de cada función." },
  { icon: SVG_ICONS.trendUp, label: "SEO", prompt: "Monta un plan completo de creación y optimización SEO para este sitio. Incluye: análisis de meta tags (title, description, og:image), estructura de headings (H1-H6), sitemap.xml, robots.txt, datos estructurados (JSON-LD), rendimiento (Core Web Vitals), accesibilidad, URLs amigables, canonical tags, alt text en imágenes, lazy loading y estrategias de enlazado interno. Implementa todas las mejoras identificadas." },
  { icon: SVG_ICONS.palette, label: "UI", prompt: "Mejora la interfaz de usuario haciéndola más moderna, responsive y accesible, siguiendo buenas prácticas de UX/UI." },
  { icon: SVG_ICONS.box, label: "Componentes", prompt: "Reorganiza el código separándolo en componentes reutilizables, bien estructurados y con responsabilidades únicas." },
  { icon: SVG_ICONS.search, label: "Revisión", prompt: "Haz una revisión completa del código identificando problemas de calidad, seguridad, rendimiento y posibles mejoras." },
];

// ---- Template: License Gate ----
function templateLicenseGate(minimized) {
  return '<div id="ql-header">' +
    '<div class="ql-header-left">' +
      '<span class="ql-brand"><img src="' + chrome.runtime.getURL("logo.png") + '" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;border-radius:4px;display:inline-block"><span class="ql-brand-text"><span>WalrOS Lovable</span><span>Tweak</span></span></span>' +
    '</div>' +
    '<div class="ql-header-right">' +
      '<button id="ql-minimize" class="ql-icon-btn">' + (minimized ? '\u25a1' : '\u2212') + '</button>' +
    '</div>' +
  '</div>' +
  '<div id="ql-body"><div class="ql-local-gate"><p class="ql-gate-title">Modo local activo</p><p class="ql-gate-desc">WalrOS Lovable Tweak está listo para usar.</p></div></div>' +
  '<div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

// ---- Template: Main UI ----
function templateMainUI(greeting, statusBadge, minimized) {
  return '<div id="ql-header">' +
    '<div class="ql-header-left">' +
      '<span class="ql-brand"><img src="' + chrome.runtime.getURL("logo.png") + '" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;border-radius:4px;display:inline-block"><span class="ql-brand-text"><span>WalrOS Lovable</span><span>Tweak</span></span></span>' +
    '</div>' +
    '<div class="ql-header-right">' +
      '<button class="ql-icon-btn ql-notif-btn" title="Notificaciones">' + SVG_ICONS.bell + '<span class="ql-notif-badge" style="display:none">0</span></button>' +
      '<button id="ql-sidepanel-btn" class="ql-icon-btn" title="Abrir en panel lateral">' + SVG_ICONS.sidePanel + '</button>' +
      '<button class="ql-icon-btn" title="Tema">' + SVG_ICONS.moon + '</button>' +
      '<button id="ql-logout-btn" class="ql-icon-btn" title="Salir">\ud83d\udeaa</button>' +
      '<button id="ql-minimize" class="ql-icon-btn">' + (minimized ? '\u25a1' : '\u2212') + '</button>' +
    '</div>' +
  '</div>' +
   '<div id="ql-body">' +
    '<div id="ql-update-banner" style="display:none"></div>' +
    '<div class="ql-profile-card">' +
      '<div class="ql-profile-top">' +
        '<div class="ql-profile-info">' +
          '<span class="ql-profile-name">' + escapeHtml(greeting) + '</span>' +
          statusBadge +
        '</div>' +
      '</div>' +
      '<div id="ql-sync-status" class="ql-sync-status ql-sync-waiting">' +
        '<span class="ql-sync-text">\u23f3 Esperando sincronización...</span>' +
      '</div>' +
      '<div id="ql-trial-countdown" class="ql-trial-countdown" style="display:none"></div>' +
    '</div>' +
    '<div id="ql-reseller-btn" style="display:none;margin-bottom:14px">' +
      '<a href="https://walros.org" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:1px solid rgba(56,189,248,0.3);background:rgba(56,189,248,0.06);color:var(--ql-accent,#38bdf8);text-decoration:none;font-size:12px;font-weight:700;transition:all 0.2s">' +
        '\ud83d\udcbc Panel de revendedor<span style="margin-left:auto;font-size:10px;opacity:0.6">\u2192</span>' +
      '</a>' +
    '</div>' +
    '<!-- Tabs -->' +
    '<div class="ql-tabs" id="ql-tabs">' +
      '<button class="ql-tab ql-tab-active" data-tab="prompt">\u26a1 Prompt</button>' +
      '<button class="ql-tab" data-tab="history">\ud83d\udcac Historial <span class="ql-tab-badge" id="ql-history-badge" style="display:none">0</span></button>' +
    '</div>' +
    '<div id="ql-tab-content">' +
    '<div class="ql-model-selector-container">' +
      '<div class="ql-model-selector-header" id="ql-model-selector-btn">' +
        '<span id="ql-active-model-icon">\ud83e\udde0</span>' +
        '<span id="ql-active-model-name">Gemini 3.1 Pro</span>' +
        '<span class="ql-model-selector-arrow">\u25be</span>' +
      '</div>' +
      '<div class="ql-model-options" id="ql-model-options" style="display:none">' +
        '<div class="ql-model-option" data-model="gpt-4o" data-icon="\ud83e\uddbe">' +
          '<span class="ql-model-opt-icon">\ud83e\uddbe</span>' +
          '<div class="ql-model-opt-text">' +
            '<span class="ql-model-opt-title">GPT5-CODEX</span>' +
            '<span class="ql-model-opt-desc">Mejor para lógica y código</span>' +
          '</div>' +
        '</div>' +
        '<div class="ql-model-option" data-model="gemini-1.5-pro" data-icon="\u2728">' +
          '<span class="ql-model-opt-icon">\u2728</span>' +
          '<div class="ql-model-opt-text">' +
            '<span class="ql-model-opt-title">Gemini 3.1 Pro</span>' +
            '<span class="ql-model-opt-desc">Razonamiento potente y contexto largo</span>' +
          '</div>' +
        '</div>' +
        '<div class="ql-model-option" data-model="claude-3-opus" data-icon="\ud83d\udca1">' +
          '<span class="ql-model-opt-icon">\ud83d\udca1</span>' +
          '<div class="ql-model-opt-text">' +
            '<span class="ql-model-opt-title">Claude Opus 4.7</span>' +
            '<span class="ql-model-opt-desc">Creatividad y escritura natural</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<textarea id="ql-msg" rows="3" placeholder="Escribe tu comando..." spellcheck="false"></textarea>' +
    '<div id="ql-attach-preview" class="ql-attach-preview" style="display:none"></div>' +
    '<div class="ql-action-bar">' +
      '<div class="ql-action-left">' +
        '<label class="ql-toggle">' +
          '<input type="checkbox" id="ql-modo-plano">' +
          '<span class="ql-toggle-slider"></span>' +
        '</label>' +
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
    '<div id="ql-download-status" style="display:none"></div>' +
    '</div>' +
  '<div id="ql-footer" class="ql-footer">' +
    '<div class="ql-footer-row">' +
      '<a href="https://linkedin.com/in/alexandercalle" target="_blank" rel="noopener noreferrer" class="ql-support-link">' + SVG_ICONS.headphones + ' Soporte</a>' +
       '<span class="ql-footer-credit">Hecho por Alexander Calle</span><span class="ql-footer-version">v4.2.2</span>' +
    '</div>' +
  '</div>' +
  '<div id="ql-resize-handle" class="ql-resize-handle"></div>' +
  '<!-- Notifications Panel -->' +
  '<div id="ql-notif-panel" class="ql-notif-panel" style="display:none">' +
    '<div class="ql-notif-header">' +
      '<span>Notificaciones</span>' +
      '<button id="ql-notif-close" class="ql-notif-close-btn">\u2715</button>' +
    '</div>' +
    '<div id="ql-notif-list" class="ql-notif-list">' +
      '<p class="ql-notif-empty">Cargando...</p>' +
    '</div>' +
  '</div>' +
  '<!-- Custom Alert -->' +
  '<div id="ql-custom-alert" class="ql-custom-alert" style="display:none">' +
    '<div class="ql-alert-content">' +
      '<div class="ql-alert-icon">\u2705</div>' +
      '<div class="ql-alert-title">¡Éxito!</div>' +
      '<div class="ql-alert-message"></div>' +
      '<button class="ql-alert-ok-btn">OK</button>' +
    '</div>' +
  '</div>';
}

// ---- Template: Local Mode Overlay ----
function templateExpiredOverlay() {
  return '<div class="ql-sweetalert-box">' +
    '<div class="ql-sweetalert-icon">✅</div>' +
    '<h2 class="ql-sweetalert-title">Modo local activo</h2>' +
    '<p class="ql-sweetalert-text">WalrOS Lovable Tweak está listo para usar.</p>' +
    '<div class="ql-sweetalert-actions">' +
      '<button class="ql-sweetalert-btn ql-sweetalert-btn-secondary" id="ql-sweetalert-close">Cerrar</button>' +
    '</div>' +
  '</div>';
}

// ---- Template: Payment UI (packages list) ----
var BRL_TO_MZN = 12.6;
var QL_WHATSAPP_ADMIN = "258835118424";
var QL_BRL_PLANS = [
  { name: "Semanal",  price: "49,90",  period: "por semana",      popular: false, badge: "7d",  icon: "\u26a1",
    features: ["Acceso completo a la extensión", "Modo plan activo", "Soporte por WhatsApp"] },
  { name: "Ilimitado",   price: "97,90",  period: "ilimitado",    popular: true,  badge: "Ilimitado", icon: "\ud83d\udc51",
    features: ["Todo lo del plan semanal", "Mejor relación calidad/precio", "Prioridad en soporte"] },
  { name: "Vitalicio", price: "149,90", period: "pago único", popular: false, badge: "\u221e", icon: "\u267e\ufe0f",
    features: ["Acceso permanente", "Actualizaciones vitalicias", "Soporte VIP prioritario"] }
];
function qlFmtMzn(brl) {
  var n = parseFloat(String(brl).replace(",", ".")) * BRL_TO_MZN;
  if (!isFinite(n)) return "0";
  return Math.round(n).toLocaleString("pt-MZ");
}
function templateBrlCard(plan, idx) {
  var features = plan.features.map(function(f){ return '<li>' + escapeHtml(f) + '</li>'; }).join('');
  var popular = plan.popular ? '<span class="ql-pkg-popular">\u2b50 POPULAR</span>' : '';
  return '<div class="ql-pkg-card ql-pkg-brl' + (plan.popular ? ' ql-pkg-highlight' : '') + '" data-brl-idx="' + idx + '">' +
    popular +
    '<div class="ql-pkg-name">' + escapeHtml(plan.icon) + ' ' + escapeHtml(plan.name) + '</div>' +
    '<div class="ql-pkg-price">R$ ' + escapeHtml(plan.price) + '</div>' +
    '<div class="ql-pkg-mzn">\u2248 ' + qlFmtMzn(plan.price) + ' MZN <span>(cambio aprox.)</span></div>' +
    '<div class="ql-pkg-duration">' + escapeHtml(plan.period) + '</div>' +
    '<ul class="ql-pkg-features">' + features + '</ul>' +
    '<button class="ql-pkg-select-btn ql-brl-buy">\ud83d\udcac Comprar por WhatsApp</button>' +
  '</div>';
}
function templateBrlSection() {
  var cards = QL_BRL_PLANS.map(function(p, i){ return templateBrlCard(p, i); }).join('');
  return '<div class="ql-pay-divider"><span>\ud83d\udcb3 Precios en reales (R$)</span></div>' +
    '<div class="ql-packages-list ql-brl-list">' + cards + '</div>';
}
function templatePaymentUI(minimized) {
  return '<div id="ql-header">' +
    '<div class="ql-header-left">' +
      '<span class="ql-brand"><img src="' + chrome.runtime.getURL("logo.png") + '" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;border-radius:4px;display:inline-block"><span class="ql-brand-text"><span>WalrOS Lovable</span><span>Tweak</span></span></span>' +
    '</div>' +
    '<div class="ql-header-right">' +
      '<button id="ql-pay-back" class="ql-icon-btn" title="Volver">\u2190</button>' +
      '<button id="ql-minimize" class="ql-icon-btn">' + (minimized ? '\u25a1' : '\u2212') + '</button>' +
    '</div>' +
  '</div>' +
  '<div id="ql-body">' +
    '<div class="ql-pay-section">' +
      '<div class="ql-pay-title">Elige tu plan</div>' +
      templateBrlSection() +
      '<div class="ql-pay-divider"><span>\ud83c\uddf2\ud83c\uddff Precios en meticales (MZN)</span></div>' +
      '<div id="ql-packages-list" class="ql-packages-list">' +
        '<div class="ql-pay-loading">\u23f3 Cargando planes...</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

// ---- Template: Package Card ----
function templatePackageCard(pkg) {
  const popular = pkg.is_popular ? '<span class="ql-pkg-popular">⭐ POPULAR</span>' : '';
  const duration = pkg.duration_days ? escapeHtml(String(pkg.duration_days)) + ' días' : 'Permanente';
  const features = (pkg.features || []).map(function(f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('');
  return '<div class="ql-pkg-card' + (pkg.is_popular ? ' ql-pkg-highlight' : '') + '" data-pkg-id="' + escapeHtml(pkg.id) + '" data-pkg-name="' + escapeHtml(pkg.name) + '" data-pkg-price="' + escapeHtml(String(pkg.price)) + '">' +
    popular +
    '<div class="ql-pkg-name">' + escapeHtml(pkg.name) + '</div>' +
    '<div class="ql-pkg-price">' + escapeHtml(String(pkg.price)) + ' <span>MZN</span></div>' +
    '<div class="ql-pkg-duration">' + duration + '</div>' +
    '<ul class="ql-pkg-features">' + features + '</ul>' +
    '<button class="ql-pkg-select-btn">Seleccionar</button>' +
  '</div>';
}

// ---- Template: Checkout Screen ----
function templateCheckoutScreen(pkg, minimized) {
  return '<div id="ql-header">' +
    '<div class="ql-header-left">' +
      '<span class="ql-brand"><img src="' + chrome.runtime.getURL("logo.png") + '" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;margin-right:6px;border-radius:4px;display:inline-block">Pago</span>' +
    '</div>' +
    '<div class="ql-header-right">' +
      '<button id="ql-checkout-back" class="ql-icon-btn" title="Volver">\u2190</button>' +
      '<button id="ql-minimize" class="ql-icon-btn">' + (minimized ? '\u25a1' : '\u2212') + '</button>' +
    '</div>' +
  '</div>' +
  '<div id="ql-body">' +
    '<div class="ql-pay-section">' +
      '<div class="ql-selected-pkg">\ud83d\udce6 <strong>' + escapeHtml(pkg.name) + '</strong> \u2014 ' + escapeHtml(String(pkg.price)) + ' MZN</div>' +
      '<div class="ql-pay-field">' +
        '<label>Método de pago</label>' +
        '<div class="ql-pay-methods">' +
          '<button class="ql-method-btn ql-method-active" data-method="mpesa">' +
            '<span class="ql-method-icon">\ud83d\udcf1</span> Pago móvil 1' +
          '</button>' +
          '<button class="ql-method-btn" data-method="emola">' +
            '<span class="ql-method-icon">\ud83d\udcb3</span> Pago móvil 2' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ql-pay-field">' +
        '<label>Número de teléfono</label>' +
        '<input type="tel" id="ql-pay-phone" placeholder="84/85/86/87XXXXXXX" maxlength="9" spellcheck="false">' +
        '<span class="ql-pay-hint" id="ql-phone-hint">Método móvil: 84/85/86/87</span>' +
      '</div>' +
      '<button id="ql-confirm-pay" class="ql-confirm-pay-btn">\ud83d\udcb0 Pagar ' + escapeHtml(String(pkg.price)) + ' MZN</button>' +
      '<div id="ql-pay-log" class="ql-pay-log"></div>' +
    '</div>' +
  '</div>' +
  '<div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

// ---- Template: Payment Success ----
function templatePaymentSuccess(licenseKey) {
  return '<div class="ql-pay-section" style="text-align:center;padding:24px 16px">' +
    '<div style="font-size:48px;margin-bottom:12px">🎉</div>' +
    '<div class="ql-pay-title">Pago Confirmado!</div>' +
    '<p style="color:var(--ql-muted);font-size:12px;margin:8px 0 16px">Tu modo local se activó correctamente.</p>' +
    '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;margin-bottom:12px">' +
      '<p style="font-size:10px;color:var(--ql-muted);margin-bottom:4px">Clave local</p>' +
      '<p id="ql-new-key" style="font-family:monospace;font-size:13px;color:var(--ql-accent);font-weight:600;word-break:break-all">' + escapeHtml(licenseKey) + '</p>' +
    '</div>' +
    '<button id="ql-copy-key" class="ql-confirm-pay-btn" style="margin-bottom:8px">📋 Copiar clave</button>' +
    '<p style="font-size:10px;color:var(--ql-muted);margin-bottom:12px">Pega la clave anterior para activar la extensión.</p>' +
    '<button id="ql-activate-key" class="ql-buy-btn" style="font-size:12px">🔑 Activar ahora</button>' +
  '</div>';
}
