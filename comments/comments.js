/*! Komentarze v1.1 — vanilla embed dla makiet HTML / PHP / Next.js
 *
 *  v1.1 (2026-07):
 *  - FIX: tryb dodawania — klik w tło overlay tworzy szkic komentarza
 *    (wcześniej isUI() odrzucał klik, bo .mk-c-overlay był na liście UI_SEL)
 *  - FIX mobile: popover/kompozytor jako bottom-sheet działa poprawnie
 *    (usunięty transform z .mk-c-pin-wrap, który łamał position:fixed)
 *  - Obsługa dotyku: dodawanie pinów i przeciąganie przez Pointer Events
 *  - Tap poza popoverem w trybie podglądu zamyka aktywny wątek
 *
 *  Użycie:
 *    <script src="komentarze/comments.js" data-project-id="moj-projekt" defer></script>
 *
 *  Wymagane: ES2017+ (fetch, async/await, Map, ResizeObserver).
 *  Wszystkie style i ikony są wbudowane — żadnych zależności zewnętrznych.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__komentarzeInitialized) {
    console.warn('[Komentarze] Skrypt załadowany wielokrotnie — pomijam.');
    return;
  }
  window.__komentarzeInitialized = true;

  // ───────────────────────────────────────────────────────────────────
  // CONFIG
  // ───────────────────────────────────────────────────────────────────
  const cs = document.currentScript || (function () {
    const tags = document.getElementsByTagName('script');
    return tags[tags.length - 1];
  })();
  const ds = (cs && cs.dataset) || {};
  const winCfg = (typeof window !== 'undefined' && window.komentarzeConfig) || {};

  const PROJECT_ID = ds.projectId || winCfg.projectId || '';
  const API_URL = ds.apiUrl || winCfg.apiUrl || 'https://ux.dev-jaaqob.pl/comments.php';
  const API_TOKEN = ds.apiToken || winCfg.apiToken || '';
  const POLL_INTERVAL = parseInt(ds.pollInterval || winCfg.pollInterval || '10000', 10);
  const SAVE_DEBOUNCE = parseInt(ds.saveDebounce || winCfg.saveDebounce || '800', 10);

  if (!PROJECT_ID) {
    console.error('[Komentarze] data-project-id jest wymagany.\n' +
      'Przykład: <script src="komentarze/comments.js" data-project-id="moj-projekt"></script>');
    return;
  }

  const LS_KEY = 'comments-' + PROJECT_ID;
  const LS_TEAM_KEY = 'comments-team-mode';
  const SOFT_DELETE_RETENTION_MS = 1000 * 60 * 60 * 24 * 30;
  const USE_SERVER = !!API_URL;
  const B = '#232080';
  const BL = '#2e29a3';
  const BF = 'rgba(35,32,128,0.08)';

  // ───────────────────────────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────────────────────────
  const state = {
    comments: [],
    mode: 'off',
    activeId: null,
    panelOpen: false,
    showResolved: false,
    isTeamMode: false,
    draft: null,
    draftMenuOpen: false,
    replyMenuOpenId: null,
    draggingId: null,
    pathname: window.location.pathname,
  };

  function setState(patch) {
    Object.assign(state, patch);
    scheduleRender();
  }

  // ───────────────────────────────────────────────────────────────────
  // UTILS
  // ───────────────────────────────────────────────────────────────────
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function nowISO() { return new Date().toISOString(); }
  function toMs(v) { if (!v) return 0; const t = new Date(v).getTime(); return Number.isFinite(t) ? t : 0; }
  function clamp01(v) { return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)); }
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function timeAgo(iso) {
    const t = toMs(iso);
    if (!t) return 'teraz';
    const diff = (Date.now() - t) / 1000;
    if (diff < 60) return 'teraz';
    if (diff < 3600) return Math.floor(diff / 60) + ' min temu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' godz. temu';
    if (diff < 604800) return Math.floor(diff / 86400) + ' dn. temu';
    return new Date(t).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  }
  function authorLabel(a) { return a === 'jaaqob' ? 'JAAQOB' : 'Klient'; }

  function readLS() {
    try {
      const r = localStorage.getItem(LS_KEY);
      const p = r ? JSON.parse(r) : [];
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }
  function writeLS(c) { try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch {} }

  // ───────────────────────────────────────────────────────────────────
  // SYNC z serwerem
  // ───────────────────────────────────────────────────────────────────
  async function apiFetch() {
    if (!USE_SERVER) return null;
    try {
      const req = (withToken) => {
        const h = {};
        if (withToken && API_TOKEN) h['Authorization'] = 'Bearer ' + API_TOKEN;
        return fetch(API_URL + '?project=' + encodeURIComponent(PROJECT_ID), { headers: h, cache: 'no-store' });
      };
      let r = await req(true);
      if (!r.ok && API_TOKEN) r = await req(false);
      if (!r.ok) return null;
      const d = await r.json();
      return Array.isArray(d) ? d : null;
    } catch { return null; }
  }
  async function apiSave(arr) {
    if (!USE_SERVER) return false;
    try {
      const req = (withToken) => {
        const h = { 'Content-Type': 'application/json' };
        if (withToken && API_TOKEN) h['Authorization'] = 'Bearer ' + API_TOKEN;
        return fetch(API_URL + '?project=' + encodeURIComponent(PROJECT_ID), {
          method: 'POST', headers: h, body: JSON.stringify(arr),
        });
      };
      let r = await req(true);
      if (!r.ok && API_TOKEN) r = await req(false);
      return r.ok;
    } catch { return false; }
  }

  function normalize(arr) {
    if (!Array.isArray(arr)) return [];
    const now = nowISO();
    return arr.filter((c) => c && typeof c === 'object' && typeof c.id === 'string').map((c) => {
      const createdAt = toMs(c.createdAt) > 0 ? c.createdAt : now;
      let updatedAt = toMs(c.updatedAt) > 0 ? c.updatedAt : createdAt;
      if (toMs(updatedAt) < toMs(createdAt)) updatedAt = createdAt;
      return {
        id: c.id,
        xPct: typeof c.xPct === 'number' ? c.xPct : 0,
        yPx: typeof c.yPx === 'number' ? c.yPx : 0,
        pathname: typeof c.pathname === 'string' ? c.pathname : '/',
        text: typeof c.text === 'string' ? c.text : '',
        author: c.author === 'jaaqob' ? 'jaaqob' : 'client',
        replies: Array.isArray(c.replies) ? c.replies.map((r) => ({
          id: r.id || uid(),
          text: typeof r.text === 'string' ? r.text : '',
          author: r.author === 'jaaqob' ? 'jaaqob' : 'client',
          createdAt: toMs(r.createdAt) > 0 ? r.createdAt : createdAt,
        })) : [],
        resolved: !!c.resolved,
        createdAt, updatedAt,
        deletedAt: c.deletedAt || null,
        anchor: c.anchor && typeof c.anchor.selector === 'string' ? {
          selector: c.anchor.selector,
          relX: clamp01(c.anchor.relX),
          relY: clamp01(c.anchor.relY),
        } : null,
      };
    });
  }
  function merge(local, remote) {
    const map = new Map();
    for (const c of normalize(remote)) map.set(c.id, c);
    for (const c of normalize(local)) {
      const ex = map.get(c.id);
      if (!ex) map.set(c.id, c);
      else if (toMs(c.updatedAt) > toMs(ex.updatedAt)) map.set(c.id, c);
    }
    const now = Date.now();
    return Array.from(map.values()).filter((c) => {
      if (!c.deletedAt) return true;
      return toMs(c.deletedAt) >= now - SOFT_DELETE_RETENTION_MS;
    });
  }

  let saveTimer = null;
  function persistAndSync() {
    writeLS(state.comments);
    if (!USE_SERVER) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { apiSave(state.comments); }, SAVE_DEBOUNCE);
  }

  // ───────────────────────────────────────────────────────────────────
  // ANCHOR (kotwiczenie do DOM)
  // ───────────────────────────────────────────────────────────────────
  const UI_SEL = '[data-mk-ui], .mk-c-overlay, .mk-c-pins-layer, .mk-c-pin-wrap, .mk-c-fab-group, .mk-c-panel, .mk-c-hint-bar';
  function isUI(el) { return !!(el && el.closest && el.closest(UI_SEL)); }

  function buildCssPath(target) {
    const parts = [];
    let cur = target;
    let safety = 0;
    while (cur && cur.nodeType === 1 && cur !== document.body && cur !== document.documentElement && safety < 12) {
      safety++;
      const tag = cur.tagName.toLowerCase();
      let part = tag;
      if (cur.id && /^[A-Za-z][\w-]*$/.test(cur.id)) {
        parts.unshift(tag + '#' + cur.id);
        return parts.join(' > ');
      }
      const parent = cur.parentElement;
      if (parent) {
        const sameTag = Array.prototype.filter.call(parent.children, (s) => s.tagName === cur.tagName);
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(cur) + 1) + ')';
      }
      parts.unshift(part);
      cur = parent;
    }
    return parts.join(' > ');
  }
  function pickElementAtPoint(x, y) {
    const stack = document.elementsFromPoint(x, y);
    for (const el of stack) {
      if (!isUI(el) && el !== document.body && el !== document.documentElement) return el;
    }
    return null;
  }
  function anchorFromClientPoint(x, y) {
    const el = pickElementAtPoint(x, y);
    if (!el) return null;
    const sel = buildCssPath(el);
    if (!sel) return null;
    const r = el.getBoundingClientRect();
    return {
      selector: sel,
      relX: clamp01((x - r.left) / Math.max(1, r.width)),
      relY: clamp01((y - r.top) / Math.max(1, r.height)),
    };
  }
  function resolveAnchorPagePosition(anchor) {
    try {
      const el = document.querySelector(anchor.selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: r.left + window.scrollX + r.width * anchor.relX,
        top: r.top + window.scrollY + r.height * anchor.relY,
        el,
      };
    } catch { return null; }
  }

  // ───────────────────────────────────────────────────────────────────
  // ACTIONS
  // ───────────────────────────────────────────────────────────────────
  function currentAuthor() { return state.isTeamMode ? 'jaaqob' : 'client'; }

  function addComment(input) {
    const now = nowISO();
    const c = {
      id: uid(),
      xPct: input.xPct, yPx: input.yPx,
      pathname: input.pathname || state.pathname,
      text: input.text,
      author: input.author || currentAuthor(),
      replies: [], resolved: false,
      createdAt: now, updatedAt: now,
      anchor: input.anchor || null,
      deletedAt: null,
    };
    state.comments = state.comments.concat([c]);
    persistAndSync();
    scheduleRender();
    return c;
  }
  function addReply(commentId, text) {
    const a = currentAuthor();
    state.comments = state.comments.map((c) => c.id === commentId
      ? Object.assign({}, c, { updatedAt: nowISO(), replies: c.replies.concat([{ id: uid(), text, author: a, createdAt: nowISO() }]) })
      : c);
    persistAndSync();
    scheduleRender();
  }
  function updateCommentPosition(commentId, xPct, yPx, anchor) {
    const cx = Math.max(0, Math.min(100, xPct));
    const cy = Math.max(0, yPx);
    state.comments = state.comments.map((c) => {
      if (c.id !== commentId) return c;
      const next = Object.assign({}, c, { xPct: cx, yPx: cy, updatedAt: nowISO() });
      if (anchor !== undefined) next.anchor = anchor;
      return next;
    });
    persistAndSync();
    scheduleRender();
  }
  function toggleResolved(id) {
    state.comments = state.comments.map((c) => c.id === id ? Object.assign({}, c, { resolved: !c.resolved, updatedAt: nowISO() }) : c);
    persistAndSync();
    scheduleRender();
  }
  function deleteComment(id) {
    const deletedAt = nowISO();
    state.comments = state.comments.map((c) => c.id === id ? Object.assign({}, c, { deletedAt, updatedAt: deletedAt }) : c);
    if (state.activeId === id) state.activeId = null;
    persistAndSync();
    scheduleRender();
  }
  function deleteReply(cid, rid) {
    state.comments = state.comments.map((c) => c.id === cid
      ? Object.assign({}, c, { replies: c.replies.filter((r) => r.id !== rid), updatedAt: nowISO() })
      : c);
    persistAndSync();
    scheduleRender();
  }
  function clearAll() {
    const now = nowISO();
    state.comments = state.comments.map((c) => c.deletedAt ? c : Object.assign({}, c, { deletedAt: now, updatedAt: now }));
    state.activeId = null;
    persistAndSync();
    scheduleRender();
  }
  function setMode(mode) {
    state.mode = mode;
    if (mode !== 'add') { state.draft = null; state.draftMenuOpen = false; }
    scheduleRender();
  }
  function setActiveId(id) { state.activeId = id; scheduleRender(); }
  function setPanelOpen(v) { state.panelOpen = v; scheduleRender(); }
  function setShowResolved(v) { state.showResolved = v; scheduleRender(); }
  function setIsTeamMode(v) {
    state.isTeamMode = v;
    try { localStorage.setItem(LS_TEAM_KEY, String(v)); } catch {}
    scheduleRender();
  }
  function cycleMode() {
    if (state.mode === 'off') setMode('view');
    else if (state.mode === 'view') setMode('add');
    else { state.activeId = null; setMode('off'); }
  }

  // ───────────────────────────────────────────────────────────────────
  // ICONS (lucide-style)
  // ───────────────────────────────────────────────────────────────────
  const SVG = (paths, size) => '<svg width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  const ICO = {
    check: (s) => SVG('<polyline points="20 6 9 17 4 12"/>', s),
    eye: (s) => SVG('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', s),
    eyeOff: (s) => SVG('<path d="m9.88 9.88-.97.97a3 3 0 0 0 4.24 4.24l.97-.97"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>', s),
    msg: (s) => SVG('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', s),
    msgPlus: (s) => SVG('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>', s),
    msgCircle: (s) => SVG('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>', s),
    moreVertical: (s) => SVG('<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>', s),
    shieldCheck: (s) => SVG('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', s),
    panelRightClose: (s) => SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><path d="m8 9 3 3-3 3"/>', s),
    panelRightOpen: (s) => SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><path d="m10 15-3-3 3-3"/>', s),
    trash: (s) => SVG('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', s),
    x: (s) => SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', s),
  };

  // ───────────────────────────────────────────────────────────────────
  // STYLES (jeden tag <style>, te same nazwy klas co w wersji React)
  // ───────────────────────────────────────────────────────────────────
  const STYLES = '' +
    '.mk-c-pins-layer{pointer-events:none;z-index:9000}.mk-c-pins-layer>*{pointer-events:auto}' +
    '.mk-c-overlay{z-index:9000;cursor:crosshair;background:rgba(35,32,128,0.03)}' +
    '.mk-c-overlay .mk-c-pin-wrap{pointer-events:auto}' +
    '.mk-c-overlay::after{content:"";position:fixed;inset:0;box-shadow:inset 0 0 0 3px ' + B + ';opacity:.15;pointer-events:none}' +
    '.mk-c-pin-wrap{position:absolute;width:0;height:0;z-index:2}' +
    '.mk-c-pin-wrap:has(.mk-c-popover){z-index:6}' +
    '.mk-c-pin{position:absolute;left:-15px;top:-30px;touch-action:none;-webkit-tap-highlight-color:transparent;width:30px;height:30px;border-radius:15px 15px 15px 2px;background:' + B + ';color:#fff;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(35,32,128,.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;padding:0;line-height:1;transition:transform 150ms ease,box-shadow 150ms ease}' +
    '.mk-c-pin:hover{transform:scale(1.12);box-shadow:0 6px 18px rgba(35,32,128,.4)}' +
    '.mk-c-pin--active{background:' + BL + ';transform:scale(1.12)}' +
    '.mk-c-pin--resolved{background:#9896c8;opacity:.7}' +
    '.mk-c-pin--dragging{cursor:grabbing;transform:none!important;box-shadow:0 8px 20px rgba(35,32,128,.45)}' +
    '.mk-c-pin--draft{background:#fff;color:' + B + ';border-color:' + B + ';animation:mk-c-pulse 1.5s ease-in-out infinite}' +
    '@keyframes mk-c-pulse{0%,100%{box-shadow:0 0 0 0 rgba(35,32,128,.4)}50%{box-shadow:0 0 0 10px rgba(35,32,128,0)}}' +
    '.mk-c-popover{position:absolute;top:10px;left:-15px;width:420px;max-width:calc(100vw - 20px);background:#fff;border:1px solid #e4e4e7;border-radius:14px;box-shadow:0 16px 40px -8px rgba(0,0,0,.18),0 6px 14px -4px rgba(0,0,0,.08);overflow:hidden;z-index:10;font-family:var(--font-dm-sans,"DM Sans"),system-ui,-apple-system,sans-serif;font-size:14px;color:#18181b;display:flex;flex-direction:column;max-height:520px}' +
    '.mk-c-popover--flip{left:auto;right:15px}' +
    '.mk-c-composer .mk-c-composer-body{padding:16px;display:flex;flex-direction:column;gap:12px}' +
    '.mk-c-popover-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px 12px;border-bottom:1px solid #f4f4f5}' +
    '.mk-c-popover-title{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:' + B + ';text-transform:uppercase;letter-spacing:.05em}' +
    '.mk-c-popover-actions{display:flex;align-items:center;gap:2px;position:relative}' +
    '.mk-c-thread{flex:1;overflow-y:auto;padding:8px 0;display:flex;flex-direction:column;gap:2px;min-height:0}' +
    '.mk-c-entry{display:flex;flex-direction:column;gap:3px;padding:6px 16px;background:transparent;position:relative;width:100%;box-sizing:border-box}' +
    '.mk-c-entry--jaaqob{background:rgba(35,32,128,0.06)}' +
    '.mk-c-entry-head{display:flex;align-items:center;gap:6px;font-size:11px}' +
    '.mk-c-entry-author{font-weight:700}' +
    '.mk-c-entry-when{color:#a1a1aa;margin-left:auto}' +
    '.mk-c-entry--jaaqob .mk-c-entry-when{color:#a1a1aa}' +
    '.mk-c-entry-text{font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-word}' +
    '.mk-c-entry-del{display:none!important}' +
    '.mk-c-entry-del:hover{opacity:1;background:rgba(0,0,0,.05);color:#dc2626}' +
    '.mk-c-entry--jaaqob .mk-c-entry-del:hover{background:rgba(35,32,128,.1);color:#dc2626}' +
    '.mk-c-reply{padding:10px 14px 14px;border-top:1px solid #e4e4e7;display:flex;flex-direction:column;gap:8px;flex-shrink:0;background:#fff}' +
    '.mk-c-reply-row{display:flex;align-items:center;gap:6px;min-width:0}' +
    '.mk-c-textarea--inline{min-height:34px;max-height:34px;resize:none;padding:7px 10px;flex:1;min-width:0;overflow:hidden}' +
    '.mk-c-reply-mode{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:' + B + ';background:' + BF + ';padding:6px 12px;border-radius:6px;white-space:nowrap;width:100%;box-sizing:border-box}' +
    '.mk-c-reply-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;white-space:nowrap}' +
    '.mk-c-reply-btns{display:flex;gap:6px}' +
    '.mk-c-hint{font-size:10px;color:#a1a1aa}' +
    '.mk-c-textarea{width:100%;font-family:inherit;font-size:13px;line-height:1.55;color:#18181b;background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:10px 12px;resize:vertical;min-height:64px;transition:border-color 150ms,box-shadow 150ms;box-sizing:border-box}' +
    '.mk-c-textarea:hover{border-color:#d4d4d8}' +
    '.mk-c-textarea:focus{outline:none;border-color:' + B + ';box-shadow:0 0 0 3px ' + BF + '}' +
    '.mk-c-btn{display:inline-flex;align-items:center;gap:5px;font-family:inherit;font-size:12px;font-weight:500;line-height:1;padding:7px 12px;border-radius:8px;border:1px solid transparent;background:transparent;color:#18181b;cursor:pointer;transition:background 120ms,border-color 120ms,color 120ms,opacity 120ms;white-space:nowrap}' +
    '.mk-c-btn:disabled{opacity:.35;cursor:not-allowed}' +
    '.mk-c-btn--primary{background:' + B + ';color:#fff;border-color:' + B + '}' +
    '.mk-c-btn--primary:hover:not(:disabled){background:' + BL + '}' +
    '.mk-c-btn--ghost{border-color:#e4e4e7}' +
    '.mk-c-btn--ghost:hover:not(:disabled){background:#f4f4f5;border-color:#d4d4d8}' +
    '.mk-c-btn--icon{padding:7px;gap:0}' +
    '.mk-c-btn--icon:hover:not(:disabled){background:#f4f4f5}' +
    '.mk-c-btn--xs{padding:4px}' +
    '.mk-c-btn--danger:hover:not(:disabled){background:#fef2f2;color:#dc2626}' +
    '.mk-c-menu-wrap{position:relative}' +
    '.mk-c-menu-dropdown{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e4e4e7;border-radius:10px;box-shadow:0 6px 16px -4px rgba(0,0,0,.12);padding:4px;min-width:250px;z-index:20}' +
    '.mk-c-menu-item{width:100%;display:flex;align-items:center;gap:8px;padding:8px 10px;font-family:inherit;font-size:13px;color:#18181b;background:transparent;border:none;border-radius:6px;cursor:pointer;text-align:left;transition:background 100ms}' +
    '.mk-c-menu-item:hover{background:#f4f4f5}' +
    '.mk-c-menu-item--active{background:' + BF + ';color:' + B + ';font-weight:600}' +
    '.mk-c-menu-item--active:hover{background:' + BF + '}' +
    '.mk-c-menu-item--danger{color:#52525b}' +
    '.mk-c-menu-item--danger:hover{background:#fef2f2;color:#dc2626}' +
    '.mk-c-fab-group{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:row-reverse;align-items:center;gap:10px;z-index:9500;font-family:var(--font-dm-sans,"DM Sans"),system-ui,-apple-system,sans-serif}' +
    '.mk-c-fab{position:relative;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;border:none;font-family:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;transition:transform 150ms ease,box-shadow 150ms}' +
    '.mk-c-fab:hover{transform:translateY(-1px)}' +
    '.mk-c-fab--main{background:' + B + ';color:#fff;box-shadow:0 12px 28px -8px rgba(35,32,128,.4),0 4px 10px -2px rgba(35,32,128,.2)}' +
    '.mk-c-fab--main:hover{box-shadow:0 16px 36px -8px rgba(35,32,128,.5),0 8px 16px -4px rgba(35,32,128,.25)}' +
    '.mk-c-fab--main.mk-c-fab--add{background:' + BL + '}' +
    '.mk-c-fab--secondary{padding:11px;background:#fff;color:#18181b;border:1px solid #e4e4e7;box-shadow:0 4px 12px -4px rgba(0,0,0,.1)}' +
    '.mk-c-fab--secondary:hover{background:#fafafa}' +
    '.mk-c-fab-label{letter-spacing:-.01em}' +
    '.mk-c-fab-badge{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#dc2626;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff}' +
    '.mk-c-hint-bar{position:fixed;bottom:88px;right:24px;display:flex;align-items:center;gap:8px;padding:10px 16px;background:' + B + ';color:#fff;border-radius:10px;font-family:var(--font-dm-sans,"DM Sans"),system-ui,sans-serif;font-size:12px;font-weight:500;box-shadow:0 8px 20px -4px rgba(35,32,128,.35);z-index:9400;animation:mk-c-slide-up 200ms ease-out}' +
    '@keyframes mk-c-slide-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
    '.mk-c-panel{position:fixed;top:0;right:0;width:400px;max-width:100vw;height:100vh;height:100dvh;background:#fff;border-left:1px solid #e4e4e7;box-shadow:-12px 0 36px -8px rgba(0,0,0,.12);display:flex;flex-direction:column;z-index:9400;font-family:var(--font-dm-sans,"DM Sans"),system-ui,sans-serif;animation:mk-c-slide-left 250ms ease-out}' +
    '@keyframes mk-c-slide-left{from{transform:translateX(100%)}to{transform:translateX(0)}}' +
    '.mk-c-panel-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #f4f4f5}' +
    '.mk-c-panel-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:' + B + '}' +
    '.mk-c-panel-toolbar{display:flex;align-items:center;gap:4px;padding:10px 16px;border-bottom:1px solid #f4f4f5;background:#fafafa}' +
    '.mk-c-panel-list{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px}' +
    '.mk-c-panel-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 24px;text-align:center;color:#71717a;font-size:13px}' +
    '.mk-c-panel-empty-sub{font-size:12px;color:#a1a1aa;max-width:240px}' +
    '.mk-c-panel-item{display:flex;flex-direction:column;gap:6px;padding:12px 14px;background:transparent;border:1px solid transparent;border-radius:10px;font-family:inherit;text-align:left;cursor:pointer;transition:background 120ms,border-color 120ms;width:100%}' +
    '.mk-c-panel-item:hover{background:' + BF + ';border-color:#e4e4e7}' +
    '.mk-c-panel-item--active{background:' + BF + ';border-color:' + B + '}' +
    '.mk-c-panel-item--resolved{opacity:.55}' +
    '.mk-c-panel-item--resolved .mk-c-panel-item-text{text-decoration:line-through}' +
    '.mk-c-panel-item-head{display:flex;align-items:center;gap:6px;font-size:11px;color:#71717a}' +
    '.mk-c-panel-item-count{margin-left:auto;font-size:11px}' +
    '.mk-c-panel-item-text{font-size:13px;color:#18181b;line-height:1.45;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
    '.mk-c-panel-item-acts{display:flex;gap:8px;padding-top:4px}' +
    '.mk-c-panel-act{font-size:11px;color:#52525b;cursor:pointer;padding:3px 6px;border-radius:4px}' +
    '.mk-c-panel-act:hover{background:#e4e4e7;color:#18181b}' +
    '.mk-c-panel-act--danger:hover{background:#fef2f2;color:#dc2626}' +
    '.mk-c-pin-mini{width:20px;height:20px;border-radius:10px 10px 10px 2px;background:' + B + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}' +
    '.mk-c-pin-mini--resolved{background:#9896c8}' +
    '@media(max-width:768px){' +
      /* Otwarty popover/kompozytor (bottom-sheet) chowa FAB - inaczej FAB
         przechwytywałby tapnięcia nad arkuszem (wyższy stacking context). */
      '#komentarze-root:has(.mk-c-popover) .mk-c-fab-group{opacity:0;pointer-events:none}' +
      '.mk-c-popover{position:fixed;left:12px;right:12px;top:auto;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:none;width:auto;max-width:none;max-height:70vh;max-height:70dvh;z-index:9600}' +
      '.mk-c-panel{width:100vw}' +
      '.mk-c-fab-group{bottom:calc(16px + env(safe-area-inset-bottom,0px));right:16px}' +
      '.mk-c-fab-label{display:none}.mk-c-fab--main{padding:12px}' +
      '.mk-c-hint-bar{left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));justify-content:center;text-align:center}' +
    '}' +
    '@media(prefers-reduced-motion:reduce){.mk-c-pin,.mk-c-fab,.mk-c-panel-item,.mk-c-textarea,.mk-c-btn{transition:none!important}.mk-c-pin--draft,.mk-c-hint-bar,.mk-c-panel{animation:none!important}}';

  // ───────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────
  let root = null;
  let layerEl = null;
  let fabEl = null;
  let panelEl = null;
  let hintEl = null;
  let renderQueued = false;

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }

  function ensureRoot() {
    if (root) return;
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-mk-ui', 'styles');
    styleTag.textContent = STYLES;
    document.head.appendChild(styleTag);

    root = document.createElement('div');
    root.id = 'komentarze-root';
    root.setAttribute('data-mk-ui', 'root');
    document.body.appendChild(root);
  }

  function getDocHeight() {
    return Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
    );
  }

  function visibleNumberedPageComments() {
    const all = state.comments.filter((c) => !c.deletedAt);
    const onPage = all.filter((c) => c.pathname === state.pathname);
    const visible = onPage.filter((c) => !c.resolved || state.showResolved);
    visible.sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    return visible;
  }
  function indexOfPin(id, list) { return list.findIndex((x) => x.id === id) + 1; }

  function shouldFlipPopover(xPct) {
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const bw = document.body.scrollWidth || document.documentElement.scrollWidth || vw;
    const pinX = (xPct / 100) * bw;
    return pinX + 360 + 20 > vw;
  }

  // ─── pin html ───
  function renderPinHTML(c, idx) {
    const isActive = state.activeId === c.id;
    const cls = 'mk-c-pin' + (c.resolved ? ' mk-c-pin--resolved' : '') + (isActive ? ' mk-c-pin--active' : '') + (state.draggingId === c.id ? ' mk-c-pin--dragging' : '');
    const inner = c.resolved ? ICO.check(10) : String(idx);
    return '<button type="button" class="' + cls + '" data-mk-action="pin" data-mk-id="' + c.id + '" aria-label="Komentarz ' + idx + '">' + inner + '</button>';
  }

  function renderEntryHTML(entry, isFirst, commentId) {
    const isJ = entry.author === 'jaaqob';
    return '<div class="mk-c-entry' + (isJ ? ' mk-c-entry--jaaqob' : '') + '">' +
      '<div class="mk-c-entry-head">' +
        '<span class="mk-c-entry-author">' + escHtml(authorLabel(entry.author)) + '</span>' +
        '<span class="mk-c-entry-when">' + escHtml(timeAgo(entry.createdAt)) + '</span>' +
      '</div>' +
      '<div class="mk-c-entry-text">' + escHtml(entry.text) + '</div>' +
      ''
    '</div>';
  }

  function renderPopoverHTML(c, idx, flip) {
    const replyMode = state.isTeamMode ? '<div class="mk-c-reply-mode"><span>Komentujesz jako JAAQOB</span></div>' : '';
    const replies = c.replies.map((r) => renderEntryHTML(r, false, c.id)).join('');
    const replyMenu = state.replyMenuOpenId === c.id
      ? '<div class="mk-c-menu-dropdown">' +
          '<button type="button" class="mk-c-menu-item ' + (state.isTeamMode ? 'mk-c-menu-item--active' : '') + '" data-mk-action="set-team" data-mk-val="1">' + ICO.shieldCheck(14) + '<span>' + (state.isTeamMode ? 'Komentujesz jako JAAQOB ✓' : 'Skomentuj jako JAAQOB') + '</span></button>' +
          '<button type="button" class="mk-c-menu-item ' + (!state.isTeamMode ? 'mk-c-menu-item--active' : '') + '" data-mk-action="set-team" data-mk-val="0">' + ICO.msgCircle(14) + '<span>' + (!state.isTeamMode ? 'Komentujesz jako Klient ✓' : 'Skomentuj jako Klient') + '</span></button>' +
          '<div style="height:1px;background:#f0f0f0;margin:4px 0"></div>' +
          '<button type="button" class="mk-c-menu-item mk-c-menu-item--danger" data-mk-action="delete-from-menu" data-mk-id="' + c.id + '">' + ICO.trash(14) + '<span>Usuń wątek</span></button>' +
        '</div>'
      : '';
    return '<div class="mk-c-popover' + (flip ? ' mk-c-popover--flip' : '') + '" data-mk-popover="' + c.id + '">' +
      '<div class="mk-c-popover-head">' +
        '<div class="mk-c-popover-title"><span class="mk-c-pin-mini' + (c.resolved ? ' mk-c-pin-mini--resolved' : '') + '">' + (c.resolved ? ICO.check(10) : idx) + '</span><span>' + (c.resolved ? 'Zakończony' : 'Komentarz') + '</span></div>' +
        '<div class="mk-c-popover-actions">' +
          '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="toggle-resolved" data-mk-id="' + c.id + '" title="' + (c.resolved ? 'Wznów' : 'Zakończ') + '">' + (c.resolved ? ICO.eye(14) : ICO.check(14)) + '</button>' +
          '<div class="mk-c-menu-wrap">' +
            '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="toggle-team-menu" data-mk-id="' + c.id + '" title="Zmień tryb">' + ICO.moreVertical(14) + '</button>' +
            replyMenu +
          '</div>' +
          '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="close-popover" title="Zamknij">' + ICO.x(14) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="mk-c-thread">' +
        renderEntryHTML({ author: c.author, text: c.text, createdAt: c.createdAt }, true, c.id) +
        replies +
      '</div>' +
      '<div class="mk-c-reply">' +
        replyMode +
        '<textarea class="mk-c-textarea" data-mk-reply="' + c.id + '" rows="2" placeholder="Odpowiedz..."></textarea>' +
        '<div class="mk-c-reply-footer">' +
          '<span class="mk-c-hint">Enter aby wysłać · Shift+Enter nowa linia</span>' +
          '<button type="button" class="mk-c-btn mk-c-btn--primary" data-mk-action="submit-reply" data-mk-id="' + c.id + '">Odpowiedz</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderDraftHTML() {
    const d = state.draft;
    if (!d) return '';
    const resolved = d.anchor ? resolveAnchorPagePosition(d.anchor) : null;
    const style = resolved
      ? ('left:' + resolved.left + 'px;top:' + resolved.top + 'px')
      : ('left:' + d.xPct + '%;top:' + d.yPx + 'px');
    const flip = shouldFlipPopover(d.xPct);
    const menu = state.draftMenuOpen
      ? '<div class="mk-c-menu-dropdown">' +
          '<button type="button" class="mk-c-menu-item ' + (state.isTeamMode ? 'mk-c-menu-item--active' : '') + '" data-mk-action="set-team" data-mk-val="1">' + ICO.shieldCheck(14) + '<span>' + (state.isTeamMode ? 'Komentujesz jako JAAQOB ✓' : 'Skomentuj jako JAAQOB') + '</span></button>' +
          '<button type="button" class="mk-c-menu-item ' + (!state.isTeamMode ? 'mk-c-menu-item--active' : '') + '" data-mk-action="set-team" data-mk-val="0">' + ICO.msgCircle(14) + '<span>' + (!state.isTeamMode ? 'Komentujesz jako Klient ✓' : 'Skomentuj jako Klient') + '</span></button>' +
        '</div>'
      : '';
    return '<div data-mk-ui="draft" class="mk-c-pin-wrap" style="' + style + '">' +
      '<div class="mk-c-pin mk-c-pin--draft">' + ICO.msgPlus(13) + '</div>' +
      '<div class="mk-c-popover mk-c-composer' + (flip ? ' mk-c-popover--flip' : '') + '">' +
        '<div class="mk-c-popover-head">' +
          '<div class="mk-c-popover-title">' + ICO.msgPlus(14) + '<span>Nowy komentarz</span></div>' +
          '<div class="mk-c-popover-actions">' +
            '<div class="mk-c-menu-wrap">' +
              '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="toggle-draft-menu">' + ICO.moreVertical(14) + '</button>' +
              menu +
            '</div>' +
            '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="cancel-draft">' + ICO.x(14) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mk-c-composer-body">' +
          (state.isTeamMode ? '<div class="mk-c-reply-mode"><span>Komentujesz jako JAAQOB</span></div>' : '') +
          '<textarea class="mk-c-textarea" data-mk-draft="1" rows="3" placeholder="Napisz komentarz..."></textarea>' +
          '<div class="mk-c-reply-footer">' +
            '<span class="mk-c-hint">Enter aby wysłać · Shift+Enter nowa linia</span>' +
            '<div class="mk-c-reply-btns">' +
              '<button type="button" class="mk-c-btn mk-c-btn--primary" data-mk-action="submit-draft">Wyślij</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderFabHTML(unresolved) {
    const main = (() => {
      if (state.mode === 'off') return '<button type="button" class="mk-c-fab mk-c-fab--main mk-c-fab--off" data-mk-action="cycle" title="Włącz komentarze">' + ICO.msg(18) + '<span class="mk-c-fab-label">Komentarze</span></button>';
      if (state.mode === 'view') return '<button type="button" class="mk-c-fab mk-c-fab--main mk-c-fab--view" data-mk-action="cycle" title="Tryb dodawania">' + ICO.msgPlus(18) + '<span class="mk-c-fab-label">Dodaj</span></button>';
      return '<button type="button" class="mk-c-fab mk-c-fab--main mk-c-fab--add" data-mk-action="cycle" title="Wyłącz komentarze">' + ICO.x(18) + '<span class="mk-c-fab-label">Zamknij</span></button>';
    })();
    const panelBtn = state.mode !== 'off'
      ? '<button type="button" class="mk-c-fab mk-c-fab--secondary" data-mk-action="toggle-panel" title="' + (state.panelOpen ? 'Zamknij panel' : 'Otwórz panel') + '">' +
        (state.panelOpen ? ICO.panelRightClose(18) : ICO.panelRightOpen(18)) +
        (unresolved > 0 ? '<span class="mk-c-fab-badge">' + unresolved + '</span>' : '') +
        '</button>'
      : '';
    return panelBtn + main;
  }

  function renderPanelHTML() {
    if (!state.panelOpen || state.mode === 'off') return '';
    const list = state.comments.filter((c) => !c.deletedAt && (state.showResolved || !c.resolved));
    const visible = visibleNumberedPageComments();
    const items = list.length === 0
      ? '<div class="mk-c-panel-empty">' + ICO.msg(24) + '<p>Brak komentarzy.</p><p class="mk-c-panel-empty-sub">Włącz tryb dodawania i kliknij w makietę.</p></div>'
      : list.map((c) => {
          const isCurrent = c.pathname === state.pathname;
          const idx = isCurrent ? indexOfPin(c.id, visible) : null;
          const cls = 'mk-c-panel-item' + (c.resolved ? ' mk-c-panel-item--resolved' : '') + (state.activeId === c.id ? ' mk-c-panel-item--active' : '');
          return '<button type="button" class="' + cls + '" data-mk-action="panel-item" data-mk-id="' + c.id + '" data-mk-path="' + escHtml(c.pathname) + '">' +
            '<div class="mk-c-panel-item-head">' +
              '<span class="mk-c-pin-mini' + (c.resolved ? ' mk-c-pin-mini--resolved' : '') + '">' + (c.resolved ? ICO.check(10) : (idx || '•')) + '</span>' +
              (c.replies.length > 0 ? '<span class="mk-c-panel-item-count">' + c.replies.length + ' odp.</span>' : '') +
            '</div>' +
            '<div class="mk-c-panel-item-text">' + escHtml(c.text) + '</div>' +
            '<div class="mk-c-panel-item-acts">' +
              '<span class="mk-c-panel-act" data-mk-action="panel-toggle-resolved" data-mk-id="' + c.id + '">' + (c.resolved ? 'Wznów' : 'Zakończ') + '</span>' +
              '<span class="mk-c-panel-act mk-c-panel-act--danger" data-mk-action="panel-delete" data-mk-id="' + c.id + '">Usuń</span>' +
            '</div>' +
          '</button>';
        }).join('');
    return '<div data-mk-ui="panel" class="mk-c-panel">' +
      '<div class="mk-c-panel-head">' +
        '<div class="mk-c-panel-title">' + ICO.msg(16) + '<span>Komentarze (' + list.length + ')</span></div>' +
        '<button type="button" class="mk-c-btn mk-c-btn--icon" data-mk-action="close-panel">' + ICO.x(16) + '</button>' +
      '</div>' +
      '<div class="mk-c-panel-toolbar">' +
        '<button type="button" class="mk-c-btn mk-c-btn--ghost" data-mk-action="toggle-show-resolved">' +
          (state.showResolved ? ICO.eye(14) : ICO.eyeOff(14)) +
          '<span>' + (state.showResolved ? 'Zakończone: widoczne' : 'Zakończone: ukryte') + '</span>' +
        '</button>' +
        '<div style="flex:1"></div>' +
        '<button type="button" class="mk-c-btn mk-c-btn--icon mk-c-btn--danger" data-mk-action="clear-all" title="Wyczyść">' + ICO.trash(14) + '</button>' +
      '</div>' +
      '<div class="mk-c-panel-list">' + items + '</div>' +
    '</div>';
  }

  // Zachowanie wartości textarea i pozycji kursora przy re-renderze.
  function snapshotTextareas() {
    if (!layerEl) return null;
    const snap = { draft: null, replies: {} };
    const focused = document.activeElement;
    const d = layerEl.querySelector('[data-mk-draft="1"]');
    if (d) snap.draft = { value: d.value, focused: focused === d, selStart: d.selectionStart, selEnd: d.selectionEnd };
    layerEl.querySelectorAll('textarea[data-mk-reply]').forEach((t) => {
      snap.replies[t.dataset.mkReply] = { value: t.value, focused: focused === t, selStart: t.selectionStart, selEnd: t.selectionEnd };
    });
    return snap;
  }
  function restoreTextareas(snap) {
    if (!snap || !layerEl) return;
    if (snap.draft) {
      const d = layerEl.querySelector('[data-mk-draft="1"]');
      if (d) {
        d.value = snap.draft.value;
        if (snap.draft.focused) {
          d.focus();
          try { d.setSelectionRange(snap.draft.selStart, snap.draft.selEnd); } catch {}
        }
      }
    }
    Object.keys(snap.replies).forEach((rid) => {
      const t = layerEl.querySelector('textarea[data-mk-reply="' + rid + '"]');
      if (!t) return;
      const s = snap.replies[rid];
      t.value = s.value;
      if (s.focused) {
        t.focus();
        try { t.setSelectionRange(s.selStart, s.selEnd); } catch {}
      }
    });
  }

  function render() {
    ensureRoot();

    const visible = visibleNumberedPageComments();
    const onPage = state.comments.filter((c) => !c.deletedAt && c.pathname === state.pathname);
    const unresolved = onPage.filter((c) => !c.resolved).length;

    // Layer (pins + overlay)
    if (state.mode === 'off') {
      if (layerEl) { layerEl.remove(); layerEl = null; }
    } else {
      const snap = snapshotTextareas();
      if (!layerEl) {
        layerEl = document.createElement('div');
        root.appendChild(layerEl);
      }
      const isAdd = state.mode === 'add';
      layerEl.className = isAdd ? 'mk-c-overlay' : 'mk-c-pins-layer';
      const docH = getDocHeight();
      layerEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:' + docH + 'px;min-height:100vh';

      let html = '';
      for (const c of visible) {
        const idx = indexOfPin(c.id, visible);
        const pos = c.anchor ? resolveAnchorPagePosition(c.anchor) : null;
        const style = pos
          ? 'left:' + pos.left + 'px;top:' + pos.top + 'px'
          : 'left:' + c.xPct + '%;top:' + c.yPx + 'px';
        html += '<div class="mk-c-pin-wrap" style="' + style + '" data-mk-pin-wrap="' + c.id + '">';
        html += renderPinHTML(c, idx);
        if (state.activeId === c.id) {
          html += renderPopoverHTML(c, idx, shouldFlipPopover(c.xPct));
        }
        html += '</div>';
      }
      if (isAdd && state.draft) {
        html += renderDraftHTML();
      }
      layerEl.innerHTML = html;
      restoreTextareas(snap);
    }

    // FAB
    if (!fabEl) {
      fabEl = document.createElement('div');
      fabEl.className = 'mk-c-fab-group';
      fabEl.setAttribute('data-mk-ui', 'fab');
      root.appendChild(fabEl);
    }
    fabEl.innerHTML = renderFabHTML(unresolved);

    // Hint
    if (state.mode === 'add' && !state.draft) {
      if (!hintEl) {
        hintEl = document.createElement('div');
        hintEl.setAttribute('data-mk-ui', 'hint');
        hintEl.className = 'mk-c-hint-bar';
        root.appendChild(hintEl);
      }
      hintEl.innerHTML = ICO.msgPlus(14) + '<span>Kliknij w dowolne miejsce, aby dodać komentarz</span>';
    } else if (hintEl) {
      hintEl.remove(); hintEl = null;
    }

    // Panel
    const panelHtml = renderPanelHTML();
    if (!panelHtml) {
      if (panelEl) { panelEl.remove(); panelEl = null; }
    } else {
      if (!panelEl) {
        panelEl = document.createElement('div');
        root.appendChild(panelEl);
      }
      panelEl.innerHTML = panelHtml;
    }

    // Pierwszy autofocus drafta (po świeżym kliknięciu w overlay).
    if (state.draft) {
      const t = layerEl && layerEl.querySelector('[data-mk-draft="1"]');
      if (t && document.activeElement !== t && !t.value) {
        setTimeout(() => { try { t.focus(); } catch {} }, 20);
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // EVENTS (delegacja)
  // ───────────────────────────────────────────────────────────────────
  function getActionTarget(e) {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.mkAction) return el;
      el = el.parentElement;
    }
    return null;
  }

  function onClick(e) {
    const t = getActionTarget(e);
    if (!t) return;
    const a = t.dataset.mkAction;
    const id = t.dataset.mkId || null;

    if (a === 'cycle') { e.preventDefault(); cycleMode(); return; }
    if (a === 'toggle-panel') { e.preventDefault(); setPanelOpen(!state.panelOpen); return; }
    if (a === 'close-panel') { e.preventDefault(); setPanelOpen(false); return; }
    if (a === 'toggle-show-resolved') { e.preventDefault(); setShowResolved(!state.showResolved); return; }
    if (a === 'clear-all') {
      e.preventDefault();
      if (confirm('Usunąć WSZYSTKIE komentarze?')) clearAll();
      return;
    }
    if (a === 'pin') {
      e.preventDefault(); e.stopPropagation();
      setActiveId(state.activeId === id ? null : id);
      return;
    }
    if (a === 'close-popover') { e.preventDefault(); setActiveId(null); return; }
    if (a === 'toggle-resolved') { e.preventDefault(); toggleResolved(id); return; }
    if (a === 'delete') {
      e.preventDefault();
      if (confirm('Usunąć komentarz?')) deleteComment(id);
      return;
    }
    if (a === 'del-reply') {
      e.preventDefault();
      const cid = t.dataset.mkCid; const rid = t.dataset.mkRid;
      if (confirm('Usunąć odpowiedź?')) deleteReply(cid, rid);
      return;
    }
    if (a === 'toggle-team') { e.preventDefault(); setIsTeamMode(!state.isTeamMode); return; }
    if (a === 'submit-reply') {
      e.preventDefault();
      const ta = layerEl && layerEl.querySelector('textarea[data-mk-reply="' + id + '"]');
      if (!ta) return;
      const text = ta.value.trim();
      if (!text) return;
      ta.value = '';
      addReply(id, text);
      return;
    }
    if (a === 'toggle-team-menu') {
      e.preventDefault();
      const newId = state.replyMenuOpenId === id ? null : id;
      setState({ replyMenuOpenId: newId });
      return;
    }
    if (a === 'delete-from-menu') {
      e.preventDefault();
      setState({ replyMenuOpenId: null });
      if (confirm('Usunąć cały wątek?')) deleteComment(id);
      return;
    }
    if (a === 'toggle-draft-menu') {
      e.preventDefault();
      setState({ draftMenuOpen: !state.draftMenuOpen });
      return;
    }
    if (a === 'set-team') {
      e.preventDefault();
      setIsTeamMode(t.dataset.mkVal === '1');
      setState({ draftMenuOpen: false, replyMenuOpenId: null });
      return;
    }
    if (a === 'cancel-draft') {
      e.preventDefault();
      setState({ draft: null, draftMenuOpen: false });
      return;
    }
    if (a === 'submit-draft') {
      e.preventDefault();
      submitDraft();
      return;
    }
    if (a === 'panel-item') {
      e.preventDefault();
      const c = state.comments.find((x) => x.id === id);
      if (!c) return;
      if (c.pathname !== state.pathname) {
        window.location.href = c.pathname;
        return;
      }
      setActiveId(id);
      // Scroll po renderze — żeby resolveAnchorPagePosition miało aktualny DOM
      requestAnimationFrame(() => {
        const pos = c.anchor ? resolveAnchorPagePosition(c.anchor) : null;
        const targetY = pos ? pos.top : c.yPx;
        window.scrollTo({ top: Math.max(0, targetY - window.innerHeight / 2), behavior: 'smooth' });
      });
      return;
    }
    if (a === 'panel-toggle-resolved') {
      e.stopPropagation(); e.preventDefault();
      toggleResolved(id);
      return;
    }
    if (a === 'panel-delete') {
      e.stopPropagation(); e.preventDefault();
      if (confirm('Usunąć komentarz?')) deleteComment(id);
      return;
    }
  }

  // ─── Dodawanie pinu — tap/klik w tło overlay (mysz + dotyk) ───
  // UWAGA: e.target w trybie 'add' to zwykle sam layerEl (.mk-c-overlay),
  // który celowo NIE jest traktowany jako "UI" — klik w tło ma tworzyć szkic.
  // isUI() odrzuca tylko interaktywne elementy (piny, popovery, FAB, panel).
  let addTapStart = null;

  function isInteractiveUI(el) {
    if (!el || el === layerEl) return false;
    return isUI(el);
  }

  function onLayerPointerDown(e) {
    if (state.mode !== 'add' || !layerEl) { addTapStart = null; return; }
    const t = e.target;
    if (isInteractiveUI(t)) { addTapStart = null; return; }
    if (t !== layerEl && !layerEl.contains(t)) { addTapStart = null; return; }
    addTapStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    // Mysz: blokuj zaznaczanie tekstu pod overlayem. Dotyk: nie blokuj scrolla.
    if (e.pointerType === 'mouse') e.preventDefault();
  }

  function onLayerPointerUp(e) {
    const start = addTapStart;
    addTapStart = null;
    if (!start || start.id !== e.pointerId) return;
    if (state.mode !== 'add' || !layerEl) return;
    // Przesunięcie > 8px = scroll / drag, nie tap.
    if (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8) return;
    if (isInteractiveUI(e.target)) return;
    e.preventDefault();
    const bw = document.body.scrollWidth || document.documentElement.scrollWidth;
    const pageX = e.clientX + window.scrollX;
    const pageY = e.clientY + window.scrollY;
    const anchor = anchorFromClientPoint(e.clientX, e.clientY);
    setState({
      draft: { xPct: (pageX / bw) * 100, yPx: pageY, anchor },
      activeId: null,
      draftMenuOpen: false,
    });
  }

  // Tap poza popoverem w trybie podglądu zamyka aktywny wątek (istotne na mobile,
  // gdzie nie ma klawisza Escape).
  function onDocClickCloseActive(e) {
    if (state.mode !== 'view' || !state.activeId) return;
    if (isUI(e.target)) return;
    setActiveId(null);
  }

  function submitDraft() {
    const d = state.draft;
    if (!d) return;
    const ta = layerEl && layerEl.querySelector('[data-mk-draft="1"]');
    const text = ta ? ta.value.trim() : '';
    if (!text) return;
    const created = addComment({ xPct: d.xPct, yPx: d.yPx, anchor: d.anchor, pathname: state.pathname, text });
    setState({ draft: null, activeId: created.id, draftMenuOpen: false });
  }

  function onKeyDown(e) {
    // Draft / reply textarea: Enter = submit, Shift+Enter = newline
    const t = e.target;
    if (t && t.dataset) {
      if (t.dataset.mkDraft === '1') {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDraft(); return; }
        if (e.key === 'Escape') { e.preventDefault(); setState({ draft: null, draftMenuOpen: false }); return; }
        return;
      }
      if (t.dataset.mkReply) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = t.value.trim();
          if (text) { t.value = ''; addReply(t.dataset.mkReply, text); }
          return;
        }
      }
    }
    const isEscape = e.key === 'Escape';
    const isMacEquivalent = e.metaKey && e.key === '.';
    if (!isEscape && !isMacEquivalent) return;
    if (state.activeId) { setActiveId(null); return; }
    if (state.mode === 'add') { setMode('view'); return; }
    if (state.mode === 'view') { setMode('off'); setPanelOpen(false); return; }
  }

  // ─── Drag pinów (Pointer Events — mysz i dotyk) ───
  function onPinPointerDownCapture(e) {
    if (state.mode !== 'view' && state.mode !== 'add') return;
    const t = e.target.closest && e.target.closest('[data-mk-action="pin"]');
    if (!t) return;
    const id = t.dataset.mkId;
    const wrap = t.closest('[data-mk-pin-wrap="' + id + '"]');
    if (!wrap) return;

    const pid = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    function move(ev) {
      if (ev.pointerId !== pid) return;
      if (!moved) {
        if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return;
        moved = true;
        addTapStart = null;
        state.draggingId = id;
        wrap.style.transition = 'none';
        document.body.style.cursor = 'grabbing';
      }
      ev.preventDefault();
      wrap.style.left = (ev.clientX + window.scrollX) + 'px';
      wrap.style.top = (ev.clientY + window.scrollY) + 'px';
    }
    function up(ev) {
      if (ev.pointerId !== pid) return;
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
      document.body.style.cursor = '';
      state.draggingId = null;
      if (moved && ev.type !== 'pointercancel') {
        const bw = document.body.scrollWidth || document.documentElement.scrollWidth;
        const xPct = ((ev.clientX + window.scrollX) / bw) * 100;
        const yPx = ev.clientY + window.scrollY;
        const anchor = anchorFromClientPoint(ev.clientX, ev.clientY);
        updateCommentPosition(id, xPct, yPx, anchor);
      }
      // Kliknięcie (bez ruchu) obsługuje onClick — nie rób setActiveId tutaj
    }
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    e.preventDefault();
  }

  // ───────────────────────────────────────────────────────────────────
  // ROUTING (Next.js SPA)
  // ───────────────────────────────────────────────────────────────────
  function patchHistory() {
    const fire = () => {
      const next = window.location.pathname;
      if (next !== state.pathname) setState({ pathname: next, activeId: null });
    };
    ['pushState', 'replaceState'].forEach((m) => {
      const orig = history[m];
      if (typeof orig !== 'function') return;
      history[m] = function () {
        const r = orig.apply(this, arguments);
        setTimeout(fire, 0);
        return r;
      };
    });
    window.addEventListener('popstate', fire);
    window.addEventListener('hashchange', fire);
  }

  // ───────────────────────────────────────────────────────────────────
  // INIT
  // ───────────────────────────────────────────────────────────────────
  function init() {
    state.comments = normalize(readLS());
    try { state.isTeamMode = localStorage.getItem(LS_TEAM_KEY) === 'true'; } catch {}

    // Initial server fetch
    if (USE_SERVER) {
      apiFetch().then((remote) => {
        if (!remote) return;
        const merged = merge(state.comments, remote);
        state.comments = merged;
        writeLS(merged);
        scheduleRender();
        // Push back any local-only changes
        if (JSON.stringify(merged) !== JSON.stringify(remote)) apiSave(merged);
      });
      setInterval(async () => {
        const remote = await apiFetch();
        if (!remote) return;
        const merged = merge(state.comments, remote);
        if (JSON.stringify(merged) !== JSON.stringify(state.comments)) {
          state.comments = merged;
          writeLS(merged);
          scheduleRender();
        }
      }, POLL_INTERVAL);
    }

    document.addEventListener('click', onClick, false);
    document.addEventListener('click', onDocClickCloseActive, false);
    document.addEventListener('pointerdown', onLayerPointerDown, false);
    document.addEventListener('pointerup', onLayerPointerUp, false);
    document.addEventListener('pointerdown', onPinPointerDownCapture, true);
    document.addEventListener('keydown', onKeyDown, false);

    // Re-render on resize so anchors / docHeight stay fresh.
    let resizeTimer = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(scheduleRender, 80);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', () => {
      // W trybie ADD piny muszą przeliczać kotwice przy scrollu
      if (state.mode === 'add') scheduleRender();
    });

    // Observe layout changes (body resize → reposition anchors).
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => scheduleRender());
      ro.observe(document.body);
    }

    patchHistory();
    scheduleRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Expose minimal API on window (for debugging / power users)
  window.Komentarze = {
    getState: () => ({ ...state }),
    setMode, setPanelOpen, cycleMode,
    refresh: scheduleRender,
  };
})();
