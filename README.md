# 🦭🪙 WalrOS Lovable Tweak — Usa Lovable sin gastar créditos.

**Extensión para navegador que inyecta un panel flotante con herramientas avanzadas en [lovable.dev](https://lovable.dev).**

---

## ⚡ La función principal: **AHORRO DE CRÉDITOS**

**WalrOS Lovable Tweak** te permite usar Lovable **sin consumir créditos**.

- ✅ **0 créditos** por cada prompt
- ✅ **Todas las funciones** de Lovable disponibles
- ✅ **Archivos adjuntos** incluidos (PDF, imágenes, código, etc.)
- ✅ **Congela tu saldo** — gastas 0, siempre

> ⚠️ **Requisito:** Necesitas tener **al menos 1 crédito** en tu cuenta de Lovable para que la API acepte la petición. No se consumirá, solo es necesario para que el sistema funcione.

---

## 🔧 ¿Cómo funciona?

El sistema envía a Lovable un payload con `intent: 'fix_error'`, que activa la burbuja de "Corregir error" (gratuita). Luego, la extensión reemplaza esa burbuja por tu prompt real.

**Lovable no detecta el cambio.**

---

## Qué hace (además de ahorrar créditos)

Al entrar a cualquier proyecto de lovable.dev, la extensión añade un panel flotante en la esquina inferior derecha con:

| Botón | Función |
|---|---|
| **Enviar prompt** | Envía comandos a Lovable **sin gastar créditos** |
| Quitar marca de agua | Elimina la marca de agua "Made with Lovable" del proyecto |
| Activar/Desactivar escudo | Bloquea/desbloquea el input de Lovable |
| Usar chat normal | Alterna entre chat nativo y modo extensión **RECOMENDABLE USAR ESTE MODO SIEMPRE POR MERA COMODIDAD.++ |
| Descargar todos los archivos | Descarga el proyecto completo en un ZIP |
| Optimizar con IA | Mejora el prompt actual antes de enviarlo |
| Voz | Dictado por voz (speech-to-text) |
| Adjuntar archivo | Adjunta archivos al prompt (máx. 10) |
| Chips de atajos | 9 plantillas de prompt predefinidas (bugs, refactor, SEO, UI, etc.) |

Funciones adicionales:
- Selector de idioma (español / inglés) con traducción completa de la UI
- Panel de notificaciones
- Sistema de licencias con modo gratuito

---

## 💰 Licencias

La extensión funciona en modo gratuito con funciones limitadas. Para acceso completo:

| Plan | Precio | Duración |
|------|--------|----------|
| **PRO** | 10€ | 30 días |

### **Compra tu licencia [AQUÍ](https://www.g2g.com/categories/lovable-gift-cards/offer/G1783642017130CT?region_id=0f76ac42-3267-4d77-9fba-f9d9d719dac9&seller=m0rs1)** ⬅️

---

## 📦 Instalación

1. Descarga o clona este repositorio
2. Abre tu navegador (por ej. Chrome) y ve a `chrome://extensions`
3. Activa el **Modo desarrollador** (toggle arriba a la derecha)
4. Haz clic en **Cargar descomprimida**
5. Selecciona la carpeta WalrOS_Lovable_Tweaker, que está dentro de la carpeta principal. ⚠️ No selecciones la carpeta walros-lovable-tweak-main; de lo contrario, te dará un error y la extensión no se cargará.
6. 6. Entra a cualquier proyecto en [lovable.dev](https://lovable.dev) — el panel aparece solo

---


