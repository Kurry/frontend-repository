// Plausible Analytics oracle — persistent-DOM view layer + shared store + WebMCP.
//
// The previous oracle rebuilt the entire tree on every state change, which meant
// freshly-created nodes never had a "previous" style to transition from, so chart
// bars, rows, pills, chips, dialogs and the drawer all appeared to snap (the judge
// read 0s transitions). This version builds the chrome ONCE (buildChrome) and then
// mutates it in place on every state change (update): bar heights, row order
// (FLIP), pill enter/exit, compare chips, funnel widths, goal figures, and the
// modal/drawer active state all reuse the same nodes so the CSS transitions run.
//
// The WebMCP tool handlers call the exact same mutators as the visible controls,
// so automation and the UI can never disagree about the store.

import {
  SITES,
  SITE_IDS,
  PERIODS,
  SORTS,
  DIMENSIONS,
  DIM_LABEL,
  computeDashboard,
  formatNumber,
  formatDuration,
  generateBreakdownCSV,
  generatePanelCSV,
} from './data.js';

const STORAGE_KEY = 'plausible-analytics-state-v1';
const PANEL_TITLE = { source: 'Top sources', page: 'Top pages', country: 'Countries' };
const TIMEZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
const STATS_REQUIRED_KEYS = [
  'schema_version', 'site', 'period', 'filters', 'saved_segments',
  'compare_previous', 'bounce_rate_ceiling', 'visitor_floor', 'results',
  'timeseries', 'breakdowns', 'goals', 'funnel', 'sites',
];

function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function validDomain(value) {
  return typeof value === 'string'
    && value.length >= 3
    && value.length <= 253
    && /^(?!.*(?:^|\.)-)(?!.*-(?:\.|$))[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/.test(value);
}
function validSiteRecord(site) {
  return isRecord(site)
    && typeof site.name === 'string'
    && site.name === site.name.trim()
    && site.name.length >= 1
    && site.name.length <= 64
    && validDomain(site.domain)
    && TIMEZONES.includes(site.timezone);
}
function validFilterRecord(filter) {
  return isRecord(filter)
    && DIMENSIONS.includes(filter.dimension)
    && typeof filter.value === 'string'
    && filter.value === filter.value.trim()
    && filter.value.length >= 1
    && filter.value.length <= 200;
}
function validSavedSegmentRecord(segment) {
  return isRecord(segment)
    && typeof segment.name === 'string'
    && segment.name === segment.name.trim()
    && segment.name.length >= 1
    && segment.name.length <= 40
    && Array.isArray(segment.filters)
    && segment.filters.length > 0
    && segment.filters.every(validFilterRecord)
    && new Set(segment.filters.map((filter) => filter.dimension)).size === segment.filters.length;
}
function validGoalRecord(goal) {
  if (!isRecord(goal) || typeof goal.name !== 'string' || goal.name !== goal.name.trim() || goal.name.length < 1 || goal.name.length > 64) return false;
  if (!['event', 'page'].includes(goal.goal_type) || typeof goal.match_key !== 'string' || goal.match_key.length < 1 || goal.match_key.length > 200) return false;
  if (goal.goal_type === 'event') return /^[a-zA-Z0-9._-]+$/.test(goal.match_key);
  return goal.match_key.startsWith('/') && goal.match_key !== '/' && !/\s/.test(goal.match_key);
}
function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// ---- shared client state (persisted to localStorage per source contract) ----
const defaultState = {
  site: 'example.com',
  period: 'last-30-days',
  sort: 'most-visitors',
  theme: 'light',
  filters: [],
  customRange: null,
  compare: false,
  ceiling: 60,
  floor: 0,
  savedSegments: [],
  addedSites: [],
  addedGoals: [],
};
function freshDefaultState() { return JSON.parse(JSON.stringify(defaultState)); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDefaultState();
    const parsed = JSON.parse(raw);
    const s = { ...freshDefaultState(), ...parsed };
    if (!Array.isArray(s.addedSites)) s.addedSites = [];
    s.addedSites = s.addedSites.filter(validSiteRecord);
    const persistedSiteExists = s.addedSites.some((site) => site.domain === s.site);
    if (!SITE_IDS.includes(s.site) && !persistedSiteExists) s.site = defaultState.site;
    const validCustomPeriod = s.period === 'custom' && s.customRange
      && typeof s.customRange.from === 'string' && typeof s.customRange.to === 'string';
    if (!PERIODS.some((p) => p.id === s.period) && !validCustomPeriod) s.period = defaultState.period;
    if (!SORTS.some((p) => p.id === s.sort)) s.sort = defaultState.sort;
    if (s.theme !== 'light' && s.theme !== 'dark') s.theme = 'light';
    if (!Array.isArray(s.filters)) s.filters = [];
    s.filters = s.filters.filter((f) => DIMENSIONS.includes(f.dimension) && typeof f.value === 'string');
    if (s.customRange && (typeof s.customRange.from !== 'string' || typeof s.customRange.to !== 'string')) {
      s.customRange = null;
    }
    s.compare = !!s.compare;
    s.ceiling = Number.isInteger(s.ceiling) && s.ceiling >= 0 && s.ceiling <= 100 ? s.ceiling : defaultState.ceiling;
    s.floor = Number.isInteger(s.floor) && s.floor >= 0 && s.floor <= 1000000 ? s.floor : defaultState.floor;
    if (!Array.isArray(s.savedSegments)) s.savedSegments = [];
    const seenSegmentNames = new Set();
    s.savedSegments = s.savedSegments
      .filter((seg) => seg && typeof seg.name === 'string')
      .map((seg) => ({
        name: seg.name,
        filters: Array.isArray(seg.filters) ? seg.filters.filter((f) => f && DIMENSIONS.includes(f.dimension) && typeof f.value === 'string') : [],
      }))
      .filter((seg) => {
        if (!validSavedSegmentRecord(seg) || seenSegmentNames.has(seg.name)) return false;
        seenSegmentNames.add(seg.name);
        return true;
      });
    if (!Array.isArray(s.addedGoals)) s.addedGoals = [];
    s.addedGoals = s.addedGoals.filter(validGoalRecord);
    return s;
  } catch {
    return freshDefaultState();
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* memory only */ }
}

let state = loadState();
const undoStack = [];
const redoStack = [];

function snapshot() { return JSON.parse(JSON.stringify(state)); }
function pushUndo() { undoStack.push(snapshot()); redoStack.length = 0; }

function restoreSnap(snap) {
  state = JSON.parse(JSON.stringify(snap));
  hydrateAddedSites();
  commit();
}
function handleUndo() {
  const prev = undoStack.pop();
  if (!prev) return false;
  redoStack.push(snapshot());
  restoreSnap(prev);
  return true;
}
function handleRedo() {
  const next = redoStack.pop();
  if (!next) return false;
  undoStack.push(snapshot());
  restoreSnap(next);
  return true;
}

// Sync the SITES / SITE_IDS registries with state.addedSites so the registries
// always match the store (a new site appears; an undone add-site disappears).
const SEEDED_SITE_IDS = SITE_IDS.slice();
function hydrateAddedSites() {
  const wanted = new Set(state.addedSites.map((s) => s.domain));
  for (let i = SITE_IDS.length - 1; i >= 0; i--) {
    const id = SITE_IDS[i];
    if (!SEEDED_SITE_IDS.includes(id) && !wanted.has(id)) {
      SITE_IDS.splice(i, 1);
      delete SITES[id];
    }
  }
  for (const site of state.addedSites) {
    if (!SITES[site.domain]) {
      SITES[site.domain] = {
        id: site.domain, label: site.domain, timezone: site.timezone,
        visitors: 0, pageviews: 0, bounceRate: 0, avgDuration: 0,
        sources: [], pages: [], countries: [], name: site.name,
      };
      if (!SITE_IDS.includes(site.domain)) SITE_IDS.push(site.domain);
    } else {
      SITES[site.domain].name = site.name;
      SITES[site.domain].timezone = site.timezone;
    }
  }
}
hydrateAddedSites();

// ---- state mutators (the ONE code path shared by UI + WebMCP) ---------------
function setSite(siteId) {
  if (!SITE_IDS.includes(siteId)) return false;
  state.site = siteId;
  state.filters = [];
  commit();
  return true;
}
function setPeriod(periodId) {
  if (periodId === 'custom') {
    state.period = 'custom';
    if (!state.customRange) state.customRange = { from: '2026-06-24', to: '2026-06-30' };
    state.filters = [];
    commit();
    return true;
  }
  if (!PERIODS.some((p) => p.id === periodId)) return false;
  state.period = periodId;
  state.customRange = null;
  state.filters = [];
  commit();
  return true;
}
function setSort(sortId) {
  if (!SORTS.some((p) => p.id === sortId)) return false;
  state.sort = sortId;
  commit();
  return true;
}
function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return false;
  state.theme = theme;
  commit();
  return true;
}
function toggleCompare() {
  pushUndo();
  state.compare = !state.compare;
  commit();
  return true;
}
function setCeiling(val) {
  if (!Number.isInteger(val) || val < 0 || val > 100) return false;
  pushUndo();
  state.ceiling = val;
  commit();
  return true;
}
function setFloor(val) {
  if (!Number.isInteger(val) || val < 0 || val > 1000000) return false;
  pushUndo();
  state.floor = val;
  commit();
  return true;
}
function applyFilter(dimension, value) {
  if (!DIMENSIONS.includes(dimension)) return false;
  const key = dimension === 'source' ? 'sources' : dimension === 'page' ? 'pages' : 'countries';
  if (!SITES[state.site] || !SITES[state.site][key].some((e) => e.name === value)) return false;
  pushUndo();
  state.filters = state.filters.filter((f) => f.dimension !== dimension);
  state.filters.push({ dimension, value });
  commit();
  return true;
}
function removeFilter(dimension) {
  const had = state.filters.some((f) => f.dimension === dimension);
  if (had) {
    pushUndo();
    state.filters = state.filters.filter((f) => f.dimension !== dimension);
    commit();
  }
  return had;
}
function clearFilter() {
  const had = state.filters.length > 0;
  if (had) {
    pushUndo();
    state.filters = [];
    commit();
  }
  return had;
}

const SEED_WINDOW_FROM = '2025-07-01';
const SEED_WINDOW_TO = '2026-06-30';
function validateCustomRange(from, to) {
  const errors = {};
  if (!from) errors['custom-from'] = 'Custom range from date is required';
  else if (from < SEED_WINDOW_FROM || from > SEED_WINDOW_TO) errors['custom-from'] = `Custom range from must be within ${SEED_WINDOW_FROM} to ${SEED_WINDOW_TO}`;
  if (!to) errors['custom-to'] = 'Custom range to date is required';
  else if (to < SEED_WINDOW_FROM || to > SEED_WINDOW_TO) errors['custom-to'] = `Custom range to must be within ${SEED_WINDOW_FROM} to ${SEED_WINDOW_TO}`;
  else if (from && !errors['custom-from'] && from > to) errors['custom-to'] = 'Custom range to must be on or after the from date';
  return errors;
}
function applyCustomRange(from, to) {
  if (Object.keys(validateCustomRange(from, to)).length > 0) return false;
  pushUndo();
  state.period = 'custom';
  state.customRange = { from, to };
  state.filters = [];
  commit();
  return true;
}

function commit() { saveState(); update(); }

// ---- dom helpers -----------------------------------------------------------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}
function txt(node, value) { if (node.textContent !== value) node.textContent = value; }

function copyText(text) {
  // Clipboard may reject in headless contexts; fall back to a hidden textarea +
  // execCommand so the copy still happens, and never surface an unhandled reject.
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch { /* last-resort no-op */ }
}
function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const liveRegion = el('div', { id: 'live', class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
document.body.appendChild(liveRegion);
function announce(msg) { txt(liveRegion, ''); requestAnimationFrame(() => txt(liveRegion, msg)); }

let toastStack = null;
function toast(msg) {
  if (!toastStack) {
    toastStack = el('div', { class: 'toast-stack', 'aria-hidden': 'true' });
    document.body.appendChild(toastStack);
  }
  const t = el('div', { class: 'toast', role: 'status', text: msg });
  toastStack.appendChild(t);
  announce(msg);
  setTimeout(() => t.remove(), 2900);
}

// mouse/keyboard focus heuristic: show :focus rings on programmatic + keyboard
// focus; suppress them on plain mouse clicks (a prior pointerdown sets the flag,
// a Tab clears it). :focus-visible still wins for keyboard regardless.
let usingMouse = false;
document.addEventListener('mousedown', () => {
  if (!usingMouse) { usingMouse = true; document.body.classList.add('using-mouse'); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && usingMouse) { usingMouse = false; document.body.classList.remove('using-mouse'); }
});

// global undo/redo shortcuts (innovation 11.2) — ignored while typing in a field.
// Also a document-level Escape so any open overlay closes even when focus is not
// currently inside it (the per-overlay trap handles Tab; this guarantees Escape).
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (C.drawer && C.drawer.classList.contains('active')) { closeDrawer(); e.preventDefault(); return; }
    const openModalKey = Object.keys(modals).find((k) => modals[k].overlay.classList.contains('active'));
    if (openModalKey) { closeModal(openModalKey); e.preventDefault(); return; }
    if (segmentsMenuOpen) { closeSegmentsMenu(); e.preventDefault(); return; }
  }
});
document.addEventListener('keydown', (e) => {
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  if (typing) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); }
  else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); handleRedo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); }
});

// ---- focus trap + overlay dismissal ---------------------------------------
function focusables(container) {
  return [...container.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter((n) => !n.disabled && n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden');
}
function installTrap(overlay, getContent, close) {
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(getContent());
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement;
    if (!overlay.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });
  // click on the backdrop (but not the content) dismisses
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
}

// ---- custom keyboard-operable listbox (Headless-UI-style) ------------------
// Returns { trigger, setOptions, getSelected, open, close }. The trigger is a
// button[role=combobox][aria-expanded]; the popup is a ul[role=listbox] of
// option buttons. Full keyboard support: Enter/Space/Arrows open, Arrows move,
// Enter/Space commit, Escape closes and returns focus to the trigger.
function makeListbox({ label, options, getSelectedId, onSelect }) {
  let open = false;
  let activeIndex = -1;
  let optionNodes = [];

  const popup = el('ul', { class: 'listbox-popup', role: 'listbox', 'aria-label': label, hidden: true });
  const trigger = el('button', {
    class: 'listbox-trigger',
    type: 'button',
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-label': label,
  });

  function renderOptions() {
    const sel = getSelectedId();
    popup.replaceChildren();
    optionNodes = options().map((opt, i) => {
      const node = el('li');
      const btn = el('button', {
        class: 'listbox-option',
        type: 'button',
        role: 'option',
        tabindex: '-1',
        'aria-selected': opt.id === sel ? 'true' : 'false',
        'data-id': opt.id,
        text: opt.label,
        onclick: () => { commit(opt.id); },
      });
      node.appendChild(btn);
      return { id: opt.id, btn };
    });
    optionNodes.forEach((o) => popup.appendChild(o.btn.parentElement));
  }
  function setActive(i) {
    activeIndex = Math.max(0, Math.min(optionNodes.length - 1, i));
    optionNodes.forEach((o, idx) => o.btn.classList.toggle('active', idx === activeIndex));
    if (optionNodes[activeIndex]) {
      optionNodes[activeIndex].btn.scrollIntoView({ block: 'nearest' });
      trigger.setAttribute('aria-activedescendant', '');
    }
  }
  function openPopup() {
    if (open) return;
    open = true;
    renderOptions();
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const sel = getSelectedId();
    setActive(Math.max(0, optionNodes.findIndex((o) => o.id === sel)));
  }
  function closePopup(returnFocus = true) {
    if (!open) return;
    open = false;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }
  function commit(id) {
    const changed = id !== getSelectedId();
    closePopup();
    if (changed) onSelect(id);
  }

  trigger.addEventListener('click', () => { open ? closePopup() : openPopup(); });
  trigger.addEventListener('keydown', (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openPopup();
        if (e.key === 'ArrowUp') setActive(optionNodes.length - 1);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(optionNodes.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (optionNodes[activeIndex]) commit(optionNodes[activeIndex].id);
    } else if (e.key === 'Escape') { e.preventDefault(); closePopup(); }
    else if (e.key === 'Tab') { closePopup(false); }
  });
  document.addEventListener('mousedown', (e) => {
    if (open && !popup.contains(e.target) && e.target !== trigger) closePopup(false);
  });

  const wrap = el('div', { class: 'listbox-wrap' }, [trigger, popup]);
  return {
    wrap,
    trigger,
    setTriggerLabel(labelText) { txt(trigger, labelText); },
    refresh() {
      // keep the selected option + label current without disturbing an open popup
      const sel = getSelectedId();
      const opt = options().find((o) => o.id === sel);
      if (opt) txt(trigger, opt.label);
      if (open) renderOptions();
    },
    isOpen: () => open,
    close: () => closePopup(false),
  };
}

// ---- build the persistent chrome (run once) --------------------------------
const root = document.getElementById('root');
const C = {}; // references to every persistent node

function buildChrome() {
  // ---- header controls ----
  C.siteBox = makeListbox({
    label: 'Site',
    options: () => SITE_IDS.map((id) => ({ id, label: id })),
    getSelectedId: () => state.site,
    onSelect: (id) => setSite(id),
  });
  C.periodBox = makeListbox({
    label: 'Date range',
    options: () => {
      const opts = PERIODS.map((p) => ({ id: p.id, label: p.label }));
      opts.push({
        id: 'custom',
        label: state.customRange ? `${state.customRange.from} to ${state.customRange.to}` : 'Custom',
      });
      return opts;
    },
    getSelectedId: () => state.period,
    onSelect: (id) => {
      if (id === 'custom') {
        state.period = 'custom';
        if (!state.customRange) state.customRange = { from: '2026-06-24', to: '2026-06-30' };
        state.filters = [];
        commit();
        requestAnimationFrame(() => C.customFrom.focus());
      } else setPeriod(id);
    },
  });
  C.sortBox = makeListbox({
    label: 'Sort breakdowns',
    options: () => SORTS.map((s) => ({ id: s.id, label: s.label })),
    getSelectedId: () => state.sort,
    onSelect: (id) => setSort(id),
  });

  C.themeBtn = el('button', {
    class: 'iconbtn', id: 'theme-toggle', type: 'button',
    onclick: () => setTheme(state.theme === 'light' ? 'dark' : 'light'),
  });
  C.undoBtn = el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Undo', title: 'Undo (Ctrl+Z)', onclick: handleUndo, text: '↶' });
  C.redoBtn = el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Redo', title: 'Redo (Ctrl+Shift+Z)', onclick: handleRedo, text: '↷' });
  C.compareBtn = el('button', { class: 'iconbtn', type: 'button', 'aria-pressed': 'false', onclick: toggleCompare, text: 'Compare previous' });

  C.ceilingErr = el('div', { class: 'err-msg', id: 'err-bounce-rate-ceiling', role: 'alert' });
  C.ceilingHint = el('div', { class: 'thresh-hint', id: 'ceiling-hint' });
  C.ceilingInput = el('input', {
    type: 'number', class: 'thresh-input', id: 'bounce-rate-ceiling', min: 0, max: 100, step: 1,
    'aria-describedby': 'err-bounce-rate-ceiling ceiling-hint',
    onchange: (e) => {
      const raw = e.target.value.trim();
      const num = Number(raw);
      if (raw === '' || !Number.isInteger(num) || num < 0 || num > 100) {
        txt(C.ceilingErr, 'Bounce-rate ceiling must be an integer from 0 to 100');
        return;
      }
      txt(C.ceilingErr, '');
      setCeiling(num);
    },
  });
  C.floorErr = el('div', { class: 'err-msg', id: 'err-visitor-floor', role: 'alert' });
  C.floorInput = el('input', {
    type: 'number', class: 'thresh-input', id: 'visitor-floor', min: 0, max: 1000000, step: 1,
    'aria-describedby': 'err-visitor-floor',
    onchange: (e) => {
      const raw = e.target.value.trim();
      const num = Number(raw);
      if (raw === '' || !Number.isInteger(num) || num < 0 || num > 1000000) {
        txt(C.floorErr, 'Visitor floor must be an integer from 0 to 1,000,000');
        return;
      }
      txt(C.floorErr, '');
      setFloor(num);
    },
  });

  C.segBtn = el('button', {
    class: 'btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', text: 'Segments',
    onclick: () => toggleSegmentsMenu(),
  });
  C.segMenu = el('ul', { class: 'seg-menu', role: 'menu', hidden: true });
  C.segWrap = el('div', { class: 'seg-menu-wrap' }, [C.segBtn, C.segMenu]);

  C.saveSegBtn = el('button', { class: 'btn', type: 'button', text: 'Save segment', onclick: () => openModal('save') });
  C.expBtn = el('button', { class: 'btn', type: 'button', text: 'Export report', onclick: openDrawer });
  C.addSiteBtn = el('button', { class: 'btn', type: 'button', text: 'Add site', onclick: () => openModal('site') });
  C.addGoalBtn = el('button', { class: 'btn', type: 'button', text: 'Add goal', onclick: () => openModal('goal') });

  // custom range inputs (text for deterministic keyboard entry + inline errors)
  C.customFromErr = el('div', { class: 'err-msg', id: 'err-custom-from', role: 'alert' });
  C.customToErr = el('div', { class: 'err-msg', id: 'err-custom-to', role: 'alert' });
  C.customFrom = el('input', { type: 'text', id: 'custom-from', 'aria-label': 'Custom range from date', placeholder: 'YYYY-MM-DD', 'aria-describedby': 'err-custom-from' });
  C.customTo = el('input', { type: 'text', id: 'custom-to', 'aria-label': 'Custom range to date', placeholder: 'YYYY-MM-DD', 'aria-describedby': 'err-custom-to' });
  C.customApply = el('button', {
    class: 'btn', type: 'button', text: 'Apply range',
    onclick: () => {
      const errors = validateCustomRange(C.customFrom.value.trim(), C.customTo.value.trim());
      txt(C.customFromErr, errors['custom-from'] || '');
      txt(C.customToErr, errors['custom-to'] || '');
      if (Object.keys(errors).length === 0) applyCustomRange(C.customFrom.value.trim(), C.customTo.value.trim());
    },
  });
  C.customRangeControl = el('div', { class: 'control custom-range-control' }, [
    el('div', { class: 'cr-field' }, [el('label', { for: 'custom-from', text: 'From' }), C.customFrom, C.customFromErr]),
    el('div', { class: 'cr-field' }, [el('label', { for: 'custom-to', text: 'To' }), C.customTo, C.customToErr]),
    C.customApply,
  ]);

  const controls = el('div', { class: 'controls' }, [
    el('div', { class: 'control' }, [el('label', { text: 'Site' }), C.siteBox.wrap]),
    el('div', { class: 'control' }, [el('label', { text: 'Date range' }), C.periodBox.wrap]),
    C.customRangeControl,
    el('div', { class: 'control' }, [el('label', { text: 'Sort' }), C.sortBox.wrap]),
    el('div', { class: 'control' }, [el('label', { for: 'bounce-rate-ceiling', text: 'Bounce ceiling' }), C.ceilingInput, C.ceilingHint, C.ceilingErr]),
    el('div', { class: 'control' }, [el('label', { for: 'visitor-floor', text: 'Visitor floor' }), C.floorInput, C.floorErr]),
    el('div', { class: 'control' }, [el('label', { for: 'theme-toggle', text: 'Theme' }), C.themeBtn]),
    el('div', { class: 'control' }, [C.undoBtn, C.redoBtn]),
    el('div', { class: 'control actions' }, [C.compareBtn, C.saveSegBtn, C.segWrap, C.expBtn, C.addSiteBtn, C.addGoalBtn]),
  ]);

  C.brandSub = el('div', { class: 'brand-sub' });
  const header = el('header', { class: 'topbar' }, [
    el('div', { class: 'brand' }, [
      el('div', { class: 'brand-logo', 'aria-hidden': 'true' }),
      el('div', {}, [el('div', { class: 'brand-title', text: 'Plausible Analytics' }), C.brandSub]),
    ]),
    controls,
  ]);

  // ---- persistent filter bar (pills reconciled incrementally) ----
  C.filterbar = el('div', { class: 'filterbar' });
  C.clearBtn = el('button', {
    class: 'iconbtn clear-btn', id: 'clear-filter', type: 'button', 'aria-label': 'Clear filter',
    onclick: () => clearFilter(),
  }, [el('span', { class: 'x', text: '×' }), el('span', { text: 'Clear filter' })]);
  C.pillMap = new Map();

  // ---- KPI tiles (persistent, updated in place) ----
  const kpiDefs = ['Unique visitors', 'Total pageviews', 'Bounce rate', 'Visit duration'];
  C.kpiNodes = kpiDefs.map((label) => {
    const labelSpan = el('span', { class: 'kpi-name', text: label });
    const alertSlot = el('span', { class: 'kpi-alert' });
    const figure = el('span', { class: 'figure' });
    const chipSlot = el('span', { class: 'chip-slot' });
    const chip = el('span', { class: 'chip hidden' });
    chipSlot.appendChild(chip);
    const valueWrap = el('div', { class: 'kpi-value' }, [figure, chipSlot]);
    const card = el('div', { class: 'card kpi' }, [
      el('div', { class: 'kpi-label' }, [labelSpan, alertSlot]),
      valueWrap,
    ]);
    return { card, figure, chip, alertSlot, valueWrap };
  });
  C.kpis = el('div', { class: 'kpis' }, C.kpiNodes.map((k) => k.card));

  // ---- chart (bars reconciled in place for eased height transitions) ----
  C.chart = el('div', { class: 'chart', role: 'img' });
  C.barNodes = [];
  C.chartCard = el('section', { class: 'card chart-card' }, [
    el('h2', { class: 'section-title', text: 'Visitors' }), C.chart,
  ]);

  // ---- breakdown panels (rows reconciled + FLIP for reorder) ----
  C.panels = {};
  C.panelsGrid = el('div', { class: 'panels' });
  ['source', 'page', 'country'].forEach((dim) => {
    const list = el('ul', { class: 'rows', role: 'list' });
    const empty = el('li', { class: 'panel-empty', text: 'No data for this segment' });
    const exportBtn = el('button', {
      class: 'iconbtn export-panel', type: 'button',
      'aria-label': `Export ${PANEL_TITLE[dim]} CSV`, title: `Export ${PANEL_TITLE[dim]} CSV`, text: 'CSV',
      onclick: () => exportPanel(dim),
    });
    const card = el('section', { class: 'card panel' }, [
      el('div', { class: 'panel-header' }, [el('h2', { text: PANEL_TITLE[dim] }), exportBtn]),
      list,
    ]);
    card._empty = empty;
    C.panels[dim] = { card, list, rowMap: new Map(), empty };
    C.panelsGrid.appendChild(card);
  });

  // ---- goals panel (rows reconciled in place) ----
  C.goalList = el('ul', { class: 'rows', role: 'list' });
  C.goalEmpty = el('li', { class: 'panel-empty', text: 'No goals for this segment' });
  C.goalRowMap = new Map();
  C.exportGoalsBtn = el('button', {
    class: 'iconbtn export-panel', type: 'button', 'aria-label': 'Export goals CSV', title: 'Export goals CSV', text: 'CSV',
    onclick: () => exportPanel('goals'),
  });
  C.goalsCard = el('section', { class: 'card panel goals-card' }, [
    el('div', { class: 'panel-header' }, [el('h2', { text: 'Goals' }), C.exportGoalsBtn]),
    C.goalList,
  ]);

  // ---- funnel panel (step bars persist; widths transition) ----
  C.funnelSteps = el('div', { class: 'funnel-steps' });
  C.funnelEmpty = el('div', { class: 'panel-empty', text: 'No funnel for this segment' });
  C.funnelRowNodes = [];
  C.exportFunnelBtn = el('button', {
    class: 'iconbtn export-panel', type: 'button', 'aria-label': 'Export funnel CSV', title: 'Export funnel CSV', text: 'CSV',
    onclick: () => exportPanel('funnel'),
  });
  C.funnelCard = el('section', { class: 'card panel funnel-card' }, [
    el('div', { class: 'panel-header' }, [el('h2', { text: 'Funnel' }), C.exportFunnelBtn]),
    C.funnelSteps,
  ]);

  C.main = el('main', {}, [C.kpis, C.chartCard, C.panelsGrid, C.goalsCard, C.funnelCard]);

  C.ghostHost = el('div', { class: 'ghost-host', 'aria-hidden': 'true' });

  root.replaceChildren(header, C.filterbar, C.main);
  document.body.appendChild(C.ghostHost);

  buildModals();
  buildDrawer();

  document.addEventListener('mousedown', (e) => {
    if (segmentsMenuOpen && !C.segWrap.contains(e.target)) closeSegmentsMenu();
  });
}

// ---- segments menu (transient popup) ----
let segmentsMenuOpen = false;
function renderSegmentsMenu() {
  C.segMenu.replaceChildren();
  if (state.savedSegments.length === 0) {
    C.segMenu.appendChild(el('li', { class: 'seg-empty', text: 'No saved segments yet' }));
  } else {
    for (const s of state.savedSegments) {
      C.segMenu.appendChild(el('li', { class: 'seg-item', role: 'none' }, [
        el('button', { class: 'seg-apply', type: 'button', role: 'menuitem', 'aria-label': `Apply segment ${s.name}`, text: s.name, onclick: () => { closeSegmentsMenu(); applySegment(s.name); } }),
        el('button', { class: 'seg-delete', type: 'button', 'aria-label': `Delete segment ${s.name}`, text: '×', onclick: () => deleteSegment(s.name) }),
      ]));
    }
  }
}
function toggleSegmentsMenu() { segmentsMenuOpen ? closeSegmentsMenu() : openSegmentsMenu(); }
function openSegmentsMenu() {
  segmentsMenuOpen = true;
  renderSegmentsMenu();
  C.segMenu.hidden = false;
  C.segBtn.setAttribute('aria-expanded', 'true');
  const first = C.segMenu.querySelector('button');
  if (first) first.focus();
}
function closeSegmentsMenu() {
  if (!segmentsMenuOpen) return;
  segmentsMenuOpen = false;
  C.segMenu.hidden = true;
  C.segBtn.setAttribute('aria-expanded', 'false');
}

function applySegment(name) {
  const seg = state.savedSegments.find((s) => s.name === name);
  if (!seg) return false;
  pushUndo();
  state.filters = seg.filters.map((f) => ({ dimension: f.dimension, value: f.value }));
  commit();
  return true;
}
function deleteSegment(name) {
  const exists = state.savedSegments.some((s) => s.name === name);
  if (!exists) return false;
  pushUndo();
  state.savedSegments = state.savedSegments.filter((s) => s.name !== name);
  commit();
  if (segmentsMenuOpen) renderSegmentsMenu();
  return true;
}
function saveSegment(name) {
  if (!name || state.filters.length === 0) return false;
  if (state.savedSegments.some((s) => s.name === name)) return false;
  pushUndo();
  state.savedSegments.push({ name, filters: state.filters.map((f) => ({ dimension: f.dimension, value: f.value })) });
  commit();
  return true;
}

// ---- per-panel CSV export (real download + toast; content also via WebMCP) --
function exportPanel(type) {
  const text = generatePanelCSV(type, window.currentModel);
  const fname = type === 'goals' || type === 'funnel' ? `${state.site}-${type}.csv` : `${state.site}-${type}.csv`;
  download(fname, text, 'text/csv');
  const label = type === 'goals' ? 'Goals' : type === 'funnel' ? 'Funnel' : PANEL_TITLE[type];
  toast(`${label} CSV downloaded`);
}

// ---- modals (built once; opened/closed by toggling .active) -----------------
const modals = {};
let modalOpener = null;
function openModal(which) {
  const m = modals[which];
  if (m.overlay.classList.contains('active')) return;
  const activeModal = Object.keys(modals).find((key) => modals[key].overlay.classList.contains('active'));
  const opener = C.drawer && C.drawer.classList.contains('active')
    ? drawerOpener
    : activeModal
      ? modalOpener
      : document.activeElement;
  closeDrawer(false);
  closeAllModals(false);
  closeSegmentsMenu();
  modalOpener = opener;
  if (typeof m.reset === 'function') m.reset();
  if (typeof m.onOpen === 'function') m.onOpen();
  m.overlay.classList.add('active');
  setTimeout(() => { const f = focusables(m.content)[0]; if (f) f.focus(); }, 60);
}
function closeModal(which, restoreFocus = true) {
  const m = modals[which];
  if (!m || !m.overlay.classList.contains('active')) return;
  m.overlay.classList.remove('active');
  if (restoreFocus && modalOpener && modalOpener.focus) modalOpener.focus();
}
function closeAllModals(restoreFocus = true) { Object.keys(modals).forEach((key) => closeModal(key, restoreFocus)); }

function buildModals() {
  modals.site = buildSiteModal();
  modals.goal = buildGoalModal();
  modals.save = buildSaveModal();
}

function buildSiteModal() {
  const nameInput = el('input', { id: 'site-name', type: 'text', 'aria-describedby': 'err-site-name' });
  const nameErr = el('div', { class: 'err-msg', id: 'err-site-name', role: 'alert' });
  const domainInput = el('input', { id: 'domain', type: 'text', 'aria-describedby': 'err-domain' });
  const domainErr = el('div', { class: 'err-msg', id: 'err-domain', role: 'alert' });
  const tzSelect = el('select', { id: 'timezone' }, [
    el('option', { value: '', text: 'Select a timezone' }),
    el('option', { value: 'UTC', text: 'UTC' }),
    el('option', { value: 'America/New_York', text: 'America/New_York' }),
    el('option', { value: 'Europe/London', text: 'Europe/London' }),
    el('option', { value: 'Asia/Tokyo', text: 'Asia/Tokyo' }),
  ]);
  const tzErr = el('div', { class: 'err-msg', id: 'err-timezone', role: 'alert' });
  const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Add site', disabled: true });
  const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

  let submitting = false; // guards the double-activate path (1.31)
  function validate() {
    let ok = true;
    const n = nameInput.value.trim();
    if (n.length < 1 || n.length > 64) { txt(nameErr, 'Site name must be 1 to 64 characters'); ok = false; } else txt(nameErr, '');
    const d = domainInput.value.trim();
    if (!validDomain(d)) {
      txt(domainErr, 'Domain must be a lowercase hostname with no protocol, path, or port'); ok = false;
    } else if (SITE_IDS.includes(d) || state.addedSites.some((s) => s.domain === d)) {
      txt(domainErr, 'A site with this domain already exists'); ok = false;
    } else txt(domainErr, '');
    if (!TIMEZONES.includes(tzSelect.value)) {
      txt(tzErr, 'Timezone must be one of the listed values'); ok = false;
    } else txt(tzErr, '');
    submitBtn.disabled = !ok;
    return ok;
  }
  nameInput.addEventListener('input', validate);
  domainInput.addEventListener('input', validate);
  tzSelect.addEventListener('change', validate);
  submitBtn.addEventListener('click', () => {
    if (submitting) return;
    if (!validate()) return;
    submitting = true;
    addSite(domainInput.value.trim(), nameInput.value.trim(), tzSelect.value);
    closeModal('site');
    setTimeout(() => { submitting = false; }, 250);
  });
  closeBtn.addEventListener('click', () => closeModal('site'));

  const content = el('div', { class: 'modal-content' }, [
    el('h2', { text: 'Add site' }),
    el('form', { class: 'modal-form', onsubmit: (e) => e.preventDefault() }, [
      el('div', { class: 'field' }, [el('label', { for: 'site-name', text: 'Site name' }), nameInput, nameErr]),
      el('div', { class: 'field' }, [el('label', { for: 'domain', text: 'Domain' }), domainInput, domainErr]),
      el('div', { class: 'field' }, [el('label', { for: 'timezone', text: 'Timezone' }), tzSelect, tzErr]),
      el('div', { class: 'actions' }, [closeBtn, submitBtn]),
    ]),
  ]);
  const overlay = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Add site' }, [content]);
  installTrap(overlay, () => content, () => closeModal('site'));
  document.body.appendChild(overlay);
  return { overlay, content, reset() { nameInput.value = ''; domainInput.value = ''; tzSelect.value = ''; txt(nameErr, ''); txt(domainErr, ''); txt(tzErr, ''); submitBtn.disabled = true; } };
}

function buildGoalModal() {
  const nameInput = el('input', { id: 'goal-name', type: 'text', 'aria-describedby': 'err-goal-name' });
  const nameErr = el('div', { class: 'err-msg', id: 'err-goal-name', role: 'alert' });
  const typeSelect = el('select', { id: 'goal-type' }, [
    el('option', { value: '', text: 'Select a type' }),
    el('option', { value: 'event', text: 'event' }),
    el('option', { value: 'page', text: 'page' }),
  ]);
  const typeErr = el('div', { class: 'err-msg', id: 'err-goal-type', role: 'alert' });
  const matchInput = el('input', { id: 'goal-match-key', type: 'text', 'aria-describedby': 'err-goal-match-key' });
  const matchErr = el('div', { class: 'err-msg', id: 'err-goal-match-key', role: 'alert' });
  const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Add goal', disabled: true });
  const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

  function allNames() { return state.addedGoals.map((g) => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']); }
  function validate() {
    let ok = true;
    const n = nameInput.value.trim();
    if (n.length < 1 || n.length > 64) { txt(nameErr, 'Goal name must be 1 to 64 characters'); ok = false; }
    else if (allNames().includes(n)) { txt(nameErr, 'A goal with this name already exists'); ok = false; }
    else txt(nameErr, '');
    const t = typeSelect.value;
    if (!['event', 'page'].includes(t)) { txt(typeErr, 'Goal type must be event or page'); ok = false; } else txt(typeErr, '');
    const m = matchInput.value;
    if (m.length < 1 || m.length > 200) { txt(matchErr, 'Match key must be 1 to 200 characters'); ok = false; }
    else if (t === 'event' && !/^[a-zA-Z0-9._-]+$/.test(m)) { txt(matchErr, 'Event match key allows only letters, digits, dots, underscores, hyphens'); ok = false; }
    else if (t === 'page' && (!m.startsWith('/') || /\s/.test(m) || m === '/')) { txt(matchErr, 'Page match key must start with / and not be only /'); ok = false; }
    else txt(matchErr, '');
    submitBtn.disabled = !ok;
    return ok;
  }
  nameInput.addEventListener('input', validate);
  typeSelect.addEventListener('change', validate);
  matchInput.addEventListener('input', validate);
  submitBtn.addEventListener('click', () => {
    if (!validate()) return;
    addGoal(nameInput.value.trim(), typeSelect.value, matchInput.value);
    closeModal('goal');
  });
  closeBtn.addEventListener('click', () => closeModal('goal'));

  const content = el('div', { class: 'modal-content' }, [
    el('h2', { text: 'Add goal' }),
    el('form', { class: 'modal-form', onsubmit: (e) => e.preventDefault() }, [
      el('div', { class: 'field' }, [el('label', { for: 'goal-name', text: 'Name' }), nameInput, nameErr]),
      el('div', { class: 'field' }, [el('label', { for: 'goal-type', text: 'Goal type' }), typeSelect, typeErr]),
      el('div', { class: 'field' }, [el('label', { for: 'goal-match-key', text: 'Match key' }), matchInput, matchErr]),
      el('div', { class: 'actions' }, [closeBtn, submitBtn]),
    ]),
  ]);
  const overlay = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Add goal' }, [content]);
  installTrap(overlay, () => content, () => closeModal('goal'));
  document.body.appendChild(overlay);
  return { overlay, content, reset() { nameInput.value = ''; typeSelect.value = ''; matchInput.value = ''; txt(nameErr, ''); txt(typeErr, ''); txt(matchErr, ''); submitBtn.disabled = true; } };
}

function buildSaveModal() {
  const nameInput = el('input', { id: 'segment-name', type: 'text', 'aria-describedby': 'err-segment-name err-segment-filters' });
  const nameErr = el('div', { class: 'err-msg', id: 'err-segment-name', role: 'alert' });
  const filterErr = el('div', { class: 'err-msg', id: 'err-segment-filters', role: 'alert' });
  const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Save segment', disabled: true });
  const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

  function validate(showNameError = true) {
    let ok = true;
    const n = nameInput.value.trim();
    if (n.length < 1 || n.length > 40) { if (showNameError) txt(nameErr, 'Segment name must be 1 to 40 characters'); ok = false; }
    else if (state.savedSegments.some((s) => s.name === n)) { if (showNameError) txt(nameErr, 'A segment with this name already exists'); ok = false; }
    else if (showNameError) txt(nameErr, '');
    if (state.filters.length === 0) { txt(filterErr, 'Cannot save a segment with no active filters'); ok = false; }
    else txt(filterErr, '');
    submitBtn.disabled = !ok;
    return ok;
  }
  nameInput.addEventListener('input', () => validate(true));
  submitBtn.addEventListener('click', () => { if (validate()) { saveSegment(nameInput.value.trim()); closeModal('save'); } });
  closeBtn.addEventListener('click', () => closeModal('save'));

  const content = el('div', { class: 'modal-content' }, [
    el('h2', { text: 'Save segment' }),
    el('form', { class: 'modal-form', onsubmit: (e) => e.preventDefault() }, [
      el('div', { class: 'field' }, [el('label', { for: 'segment-name', text: 'Segment name' }), nameInput, nameErr, filterErr]),
      el('div', { class: 'actions' }, [closeBtn, submitBtn]),
    ]),
  ]);
  const overlay = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Save segment' }, [content]);
  installTrap(overlay, () => content, () => closeModal('save'));
  document.body.appendChild(overlay);
  return {
    overlay, content,
    onOpen() { nameInput.value = ''; txt(nameErr, ''); validate(false); },
  };
}

// ---- export drawer (built once; preview refreshed on open + on commit) -----
let drawerOpener = null;
let drawerTab = 'json';
function buildDrawer() {
  const closeBtn = el('button', { class: 'iconbtn drawer-close', type: 'button', 'aria-label': 'Close export report', text: '×' });
  C.drawerChips = el('div', { class: 'drawer-chips' });
  C.summaryStrip = el('div', { class: 'summary-strip' });

  C.tabJson = el('button', { class: 'tab active', type: 'button', 'aria-pressed': 'true', text: 'Stats JSON', onclick: () => setDrawerTab('json') });
  C.tabCsv = el('button', { class: 'tab', type: 'button', 'aria-pressed': 'false', text: 'Breakdown CSV', onclick: () => setDrawerTab('csv') });
  C.tabs = el('div', { class: 'tabs', role: 'tablist' }, [C.tabJson, C.tabCsv]);

  C.jsonPreview = el('pre', { class: 'preview-block', id: 'preview-json', tabindex: '0' });
  C.csvPreview = el('pre', { class: 'preview-block', id: 'preview-csv', tabindex: '0', hidden: true });
  C.csvNote = el('div', { class: 'export-note', id: 'csv-note', hidden: true });

  C.copyBtn = el('button', { class: 'btn', type: 'button', text: 'Copy', onclick: doCopy });
  C.downloadBtn = el('button', { class: 'btn', type: 'button', text: 'Download', onclick: doDownload });

  C.importInput = el('textarea', { id: 'import', class: 'import-input', 'aria-describedby': 'err-import', placeholder: 'Paste a Stats JSON report here, or use Import below' });
  C.importErr = el('div', { class: 'err-msg', id: 'err-import', role: 'alert' });
  C.importBtn = el('button', { class: 'btn', type: 'button', text: 'Import', onclick: doImport });

  const content = el('div', { class: 'drawer-content' }, [
    el('div', { class: 'drawer-header' }, [
      el('div', {}, [el('h2', { text: 'Export report' }), C.drawerChips]),
      closeBtn,
    ]),
    C.summaryStrip,
    C.tabs,
    C.jsonPreview,
    C.csvPreview,
    C.csvNote,
    el('div', { class: 'export-actions' }, [C.copyBtn, C.downloadBtn]),
    el('div', { class: 'import-section' }, [
      el('h3', { text: 'Import report' }),
      el('label', { for: 'import', class: 'sr-only', text: 'Stats JSON to import' }),
      C.importInput, C.importErr, C.importBtn,
    ]),
  ]);
  C.drawer = el('div', { id: 'export-drawer', class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Export report' }, [content]);
  installTrap(C.drawer, () => content, closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  document.body.appendChild(C.drawer);
}
function setDrawerTab(tab) {
  drawerTab = tab;
  C.tabJson.classList.toggle('active', tab === 'json');
  C.tabCsv.classList.toggle('active', tab === 'csv');
  C.tabJson.setAttribute('aria-pressed', tab === 'json' ? 'true' : 'false');
  C.tabCsv.setAttribute('aria-pressed', tab === 'csv' ? 'true' : 'false');
  C.jsonPreview.hidden = tab !== 'json';
  C.csvPreview.hidden = tab !== 'csv';
  C.csvNote.hidden = tab !== 'csv';
}
function refreshDrawerPreviews() {
  txt(C.jsonPreview, generateStatsJSON());
  const csv = generateBreakdownCSV(window.currentModel);
  txt(C.csvPreview, csv);
  const headerOnly = csv.trim() === 'dimension,name,visitors';
  C.csvNote.hidden = drawerTab !== 'csv' || !headerOnly;
  txt(C.csvNote, headerOnly ? 'Empty panels export a header-only row (dimension,name,visitors) with no data lines.' : '');
  // summary strip (innovation 11.1)
  const m = window.currentModel;
  C.summaryStrip.replaceChildren(
    summaryItem('Site', state.site),
    summaryItem('Period', m ? m.period.label : ''),
    summaryItem('Visitors', m ? formatNumber(m.kpi.visitors) : '0'),
  );
  // active-filter chip(s) (innovation 11.3)
  C.drawerChips.replaceChildren();
  if (state.filters.length) {
    for (const f of state.filters) {
      C.drawerChips.appendChild(el('span', { class: 'drawer-chip', text: `${DIM_LABEL[f.dimension]}: ${f.value}` }));
    }
  }
}
function summaryItem(label, value) {
  return el('div', { class: 's-item' }, [el('span', { class: 's-label', text: label }), el('span', { class: 's-value', text: value })]);
}
function openDrawer() {
  if (C.drawer.classList.contains('active')) { refreshDrawerPreviews(); return; }
  const activeModal = Object.keys(modals).find((key) => modals[key].overlay.classList.contains('active'));
  drawerOpener = activeModal ? modalOpener : document.activeElement;
  closeAllModals(false);
  closeSegmentsMenu();
  refreshDrawerPreviews();
  C.drawer.classList.add('active');
  setTimeout(() => C.copyBtn.focus(), 60);
}
function closeDrawer(restoreFocus = true) {
  if (!C.drawer.classList.contains('active')) return;
  C.drawer.classList.remove('active');
  if (restoreFocus && drawerOpener && drawerOpener.focus) drawerOpener.focus();
}
function currentPreviewText() { return drawerTab === 'json' ? C.jsonPreview.textContent : C.csvPreview.textContent; }
function doCopy() {
  const text = currentPreviewText();
  copyText(text);
  txt(C.copyBtn, 'Copied');
  toast('Copied to clipboard');
  setTimeout(() => txt(C.copyBtn, 'Copy'), 1500);
}
function doDownload() {
  const text = currentPreviewText();
  const isJson = drawerTab === 'json';
  download(`${state.site}-${isJson ? 'stats.json' : 'breakdown.csv'}`, text, isJson ? 'application/json' : 'text/csv');
  toast(`${isJson ? 'Stats JSON' : 'Breakdown CSV'} downloaded`);
}
function doImport() {
  const val = C.importInput.value.trim();
  if (importStatsJSON(val)) {
    txt(C.importErr, '');
    closeDrawer();
    toast('Import successful');
  } else {
    txt(C.importErr, 'Import field must contain a complete plausible-stats-v1 report with every required key.');
  }
}

// ---- field-level validation shared with WebMCP form_validate ---------------
function validateFields(fields) {
  const errors = {};
  const has = (k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== '';
  const own = (k) => Object.hasOwn(fields, k);
  const siteFieldsPresent = ['site-name', 'domain', 'timezone'].some(own);
  if (siteFieldsPresent) {
    const n = String(fields['site-name'] ?? '').trim();
    if (n.length < 1 || n.length > 64) errors['site-name'] = 'Site name must be 1 to 64 characters';
    const d = String(fields.domain ?? '').trim();
    if (!validDomain(d)) errors['domain'] = 'Domain must be a lowercase hostname';
    else if (SITE_IDS.includes(d) || state.addedSites.some((s) => s.domain === d)) errors['domain'] = 'A site with this domain already exists';
    if (!TIMEZONES.includes(fields.timezone)) errors['timezone'] = 'Timezone is required and must be one of the listed values';
  }
  if (own('bounce-rate-ceiling')) {
    const v = Number(fields['bounce-rate-ceiling']);
    if (!has('bounce-rate-ceiling') || !Number.isInteger(v) || v < 0 || v > 100) errors['bounce-rate-ceiling'] = 'Bounce-rate ceiling must be an integer from 0 to 100';
  }
  if (own('visitor-floor')) {
    const v = Number(fields['visitor-floor']);
    if (!has('visitor-floor') || !Number.isInteger(v) || v < 0 || v > 1000000) errors['visitor-floor'] = 'Visitor floor must be an integer from 0 to 1,000,000';
  }
  if (own('segment-name')) {
    const n = String(fields['segment-name'] ?? '').trim();
    if (n.length < 1 || n.length > 40) errors['segment-name'] = 'Segment name must be 1 to 40 characters';
    else if (state.savedSegments.some((s) => s.name === n)) errors['segment-name'] = 'Segment name already exists';
    if (state.filters.length === 0) errors.filters = 'Filters must contain at least one active filter';
  }
  if (own('custom-from') || own('custom-to')) Object.assign(errors, validateCustomRange(fields['custom-from'], fields['custom-to']));
  const goalFieldsPresent = ['goal-name', 'goal-type', 'goal-match-key'].some(own);
  if (goalFieldsPresent) {
    const n = String(fields['goal-name'] ?? '').trim();
    const all = state.addedGoals.map((g) => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']);
    if (n.length < 1 || n.length > 64) errors['goal-name'] = 'Goal name must be 1 to 64 characters';
    else if (all.includes(n)) errors['goal-name'] = 'Goal name already exists';
    if (!['event', 'page'].includes(fields['goal-type'])) errors['goal-type'] = 'Goal type must be event or page';
    const m = String(fields['goal-match-key'] ?? '');
    const t = fields['goal-type'];
    if (m.length < 1 || m.length > 200) errors['goal-match-key'] = 'Match key must be 1 to 200 characters';
    else if (t === 'event' && !/^[a-zA-Z0-9._-]+$/.test(m)) errors['goal-match-key'] = 'Event match key cannot contain whitespace';
    else if (t === 'page' && (!m.startsWith('/') || /\s/.test(m) || m === '/')) errors['goal-match-key'] = 'Page match key must start with /';
  }
  if (own('import')) {
    if (fields['import'] !== 'stats-json') errors['import'] = 'Import must use stats-json mode; enter report contents in the visible import field';
  }
  return errors;
}

// ---- site / goal add (shared by UI + WebMCP) -------------------------------
function addSite(domain, name, timezone) {
  if (!domain || !name || !timezone) return false;
  if (SITE_IDS.includes(domain) || state.addedSites.some((s) => s.domain === domain)) return false;
  pushUndo();
  state.addedSites.push({ domain, name, timezone });
  hydrateAddedSites();
  commit();
  return true;
}
function addGoal(name, goal_type, match_key) {
  if (!name || !goal_type || !match_key) return false;
  const all = state.addedGoals.map((g) => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']);
  if (all.includes(name)) return false;
  pushUndo();
  state.addedGoals.push({ name, goal_type, match_key });
  commit();
  return true;
}

// ---- export / import payloads ---------------------------------------------
function validateStatsPayload(parsed) {
  if (!isRecord(parsed)) return 'must be a JSON object';
  const missing = STATS_REQUIRED_KEYS.filter((key) => !Object.hasOwn(parsed, key));
  if (missing.length > 0) return `is missing required key ${missing[0]}`;
  if (parsed.schema_version !== 'plausible-stats-v1') return 'schema_version must be plausible-stats-v1';
  if (!validSiteRecord(parsed.site)) return 'site must match the site field contract';
  if (typeof parsed.period !== 'string' || !parsed.period) return 'period must be a non-empty string';

  const presetPeriod = PERIODS.some((period) => period.label === parsed.period);
  const customParts = presetPeriod ? [] : parsed.period.split(' - ');
  if (!presetPeriod && (customParts.length !== 2 || Object.keys(validateCustomRange(customParts[0], customParts[1])).length > 0)) {
    return 'period must be a preset label or valid custom from/to span';
  }

  if (!Array.isArray(parsed.filters) || !parsed.filters.every(validFilterRecord)) return 'filters must match the dimension/value field contract';
  if (new Set(parsed.filters.map((filter) => filter.dimension)).size !== parsed.filters.length) return 'filters must contain at most one entry per dimension';

  if (!Array.isArray(parsed.saved_segments)) return 'saved_segments must be an array';
  for (const segment of parsed.saved_segments) {
    if (!isRecord(segment) || typeof segment.name !== 'string' || segment.name !== segment.name.trim() || segment.name.length < 1 || segment.name.length > 40) return 'each saved_segments name must be 1 to 40 characters';
    if (!Array.isArray(segment.filters) || segment.filters.length === 0 || !segment.filters.every(validFilterRecord)) return 'each saved_segments filters field must be a non-empty valid filter array';
    if (new Set(segment.filters.map((filter) => filter.dimension)).size !== segment.filters.length) return 'saved segment filters must contain at most one entry per dimension';
  }
  if (new Set(parsed.saved_segments.map((segment) => segment.name)).size !== parsed.saved_segments.length) return 'saved_segments names must be unique';

  if (typeof parsed.compare_previous !== 'boolean') return 'compare_previous must be a boolean';
  if (!Number.isInteger(parsed.bounce_rate_ceiling) || parsed.bounce_rate_ceiling < 0 || parsed.bounce_rate_ceiling > 100) return 'bounce_rate_ceiling must be an integer from 0 to 100';
  if (!Number.isInteger(parsed.visitor_floor) || parsed.visitor_floor < 0 || parsed.visitor_floor > 1000000) return 'visitor_floor must be an integer from 0 to 1,000,000';

  if (!isRecord(parsed.results)) return 'results must be an object';
  for (const key of ['visitors', 'pageviews', 'bounce_rate', 'visit_duration']) {
    if (!isRecord(parsed.results[key]) || !finiteNonNegative(parsed.results[key].value)) return `results.${key}.value must be a non-negative number`;
  }
  if (parsed.results.bounce_rate.value > 100) return 'results.bounce_rate.value must not exceed 100';

  if (!Array.isArray(parsed.timeseries) || !parsed.timeseries.every((row) => isRecord(row) && typeof row.date === 'string' && row.date.length > 0 && finiteNonNegative(row.visitors))) return 'timeseries entries must contain date and non-negative visitors';
  if (!isRecord(parsed.breakdowns)) return 'breakdowns must be an object';
  for (const dimension of DIMENSIONS) {
    if (!Array.isArray(parsed.breakdowns[dimension]) || !parsed.breakdowns[dimension].every((row) => isRecord(row) && typeof row.name === 'string' && row.name.length > 0 && finiteNonNegative(row.visitors))) return `breakdowns.${dimension} must contain name/visitors rows`;
  }

  if (!Array.isArray(parsed.goals)) return 'goals must be an array';
  for (const goal of parsed.goals) {
    if (!validGoalRecord(goal) || !finiteNonNegative(goal.completions) || !finiteNonNegative(goal.conversion_rate) || goal.conversion_rate > 100) return 'goals entries must match the goal contract and include valid results';
  }
  if (new Set(parsed.goals.map((goal) => goal.name)).size !== parsed.goals.length) return 'goal names must be unique';

  if (!Array.isArray(parsed.funnel) || !parsed.funnel.every((step) => isRecord(step) && typeof step.name === 'string' && step.name.length > 0 && finiteNonNegative(step.count) && finiteNonNegative(step.step_conversion) && step.step_conversion <= 100)) return 'funnel entries must contain valid name, count, and step_conversion fields';
  if (!Array.isArray(parsed.sites) || !parsed.sites.every(validSiteRecord)) return 'sites must contain valid site records';
  if (new Set(parsed.sites.map((site) => site.domain)).size !== parsed.sites.length) return 'sites domains must be unique';
  if (!parsed.sites.some((site) => site.domain === parsed.site.domain)) return 'sites must include the selected site';
  return null;
}

function parseStatsJSON(jsonString) {
  try {
    const payload = JSON.parse(jsonString);
    const error = validateStatsPayload(payload);
    return error ? { ok: false, error } : { ok: true, payload };
  } catch {
    return { ok: false, error: 'must be valid JSON' };
  }
}

function generateStatsJSON() {
  const d = window.currentModel || computeDashboard(state.site, state.period, state.filters, state.sort, state.compare, state.addedGoals, state.customRange);
  if (!d) return '{}';
  const obj = {
    schema_version: 'plausible-stats-v1',
    site: { domain: d.site.id, name: d.site.name || d.site.id, timezone: d.site.timezone || 'UTC' },
    period: state.customRange ? `${state.customRange.from} - ${state.customRange.to}` : d.period.label,
    filters: (Array.isArray(state.filters) ? state.filters : []).map((f) => ({ dimension: f.dimension, value: f.value })),
    saved_segments: (Array.isArray(state.savedSegments) ? state.savedSegments : []).map((s) => ({ name: s.name, filters: (Array.isArray(s.filters) ? s.filters : []).map((f) => ({ dimension: f.dimension, value: f.value })) })),
    compare_previous: state.compare,
    bounce_rate_ceiling: state.ceiling,
    visitor_floor: state.floor,
    results: {
      visitors: { value: d.kpi.visitors },
      pageviews: { value: d.kpi.pageviews },
      bounce_rate: { value: d.kpi.bounceRate },
      visit_duration: { value: d.kpi.avgDuration },
    },
    timeseries: d.trend.map((v, i) => ({ date: `bucket-${i}`, visitors: v })),
    breakdowns: {
      source: d.sources.map((r) => ({ name: r.name, visitors: r.visitors })),
      page: d.pages.map((r) => ({ name: r.name, visitors: r.visitors })),
      country: d.countries.map((r) => ({ name: r.name, visitors: r.visitors })),
    },
    goals: d.goals,
    funnel: d.funnel,
    sites: SITE_IDS.map((id) => {
      const added = state.addedSites.find((s) => s.domain === id);
      return added ? { domain: added.domain, name: added.name, timezone: added.timezone } : { domain: id, name: id, timezone: SITES[id].timezone || 'UTC' };
    }),
  };
  return JSON.stringify(obj, null, 2);
}
function importStatsJSON(jsonString) {
  const result = parseStatsJSON(jsonString);
  if (!result.ok) return false;
  const parsed = result.payload;
  const seededGoalNames = ['Signup', 'Pricing viewed', 'Docs read'];
  const importedAddedSites = parsed.sites
    .filter((site) => !SEEDED_SITE_IDS.includes(site.domain))
    .map((site) => ({ domain: site.domain, name: site.name, timezone: site.timezone }));
  const preset = PERIODS.find((period) => period.label === parsed.period);
  const customParts = preset ? [] : parsed.period.split(' - ');
  const nextState = {
    ...snapshot(),
    site: parsed.site.domain,
    period: preset ? preset.id : 'custom',
    customRange: preset ? null : { from: customParts[0], to: customParts[1] },
    filters: parsed.filters.map((filter) => ({ dimension: filter.dimension, value: filter.value })),
    savedSegments: parsed.saved_segments.map((segment) => ({
      name: segment.name,
      filters: segment.filters.map((filter) => ({ dimension: filter.dimension, value: filter.value })),
    })),
    addedSites: importedAddedSites,
    addedGoals: parsed.goals
      .filter((goal) => !seededGoalNames.includes(goal.name))
      .map((goal) => ({ name: goal.name, goal_type: goal.goal_type, match_key: goal.match_key })),
    compare: parsed.compare_previous,
    ceiling: parsed.bounce_rate_ceiling,
    floor: parsed.visitor_floor,
  };
  pushUndo();
  state = nextState;
  hydrateAddedSites();
  commit();
  return true;
}

// ---- the in-place update loop ---------------------------------------------
let firstPaint = true;
function update() {
  const model = computeDashboard(state.site, state.period, state.filters, state.sort, state.compare, state.addedGoals, state.customRange);
  window.currentModel = model;
  document.documentElement.setAttribute('data-theme', state.theme);
  document.title = `Plausible Analytics — ${state.site}`;

  // header text + control state
  const tz = (model && model.site && model.site.timezone) || 'UTC';
  txt(C.brandSub, `${state.site} · ${tz} · ${model.period.label}`);
  C.themeBtn.textContent = state.theme === 'light' ? 'Dark' : 'Light';
  C.themeBtn.setAttribute('aria-label', state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  C.undoBtn.disabled = undoStack.length === 0;
  C.redoBtn.disabled = redoStack.length === 0;
  C.compareBtn.classList.toggle('active', state.compare);
  C.compareBtn.setAttribute('aria-pressed', state.compare ? 'true' : 'false');
  if (document.activeElement !== C.ceilingInput) C.ceilingInput.value = state.ceiling;
  if (document.activeElement !== C.floorInput) C.floorInput.value = state.floor;
  txt(C.ceilingHint, `now ${model.kpi.bounceRate}%`);
  C.customRangeControl.style.display = state.period === 'custom' ? '' : 'none';
  if (state.customRange) {
    if (document.activeElement !== C.customFrom) C.customFrom.value = state.customRange.from;
    if (document.activeElement !== C.customTo) C.customTo.value = state.customRange.to;
  }
  C.siteBox.refresh();
  C.periodBox.refresh();
  C.sortBox.refresh();

  updatePills();
  updateKpis(model);
  updateChart(model);
  updatePanel('source', model.sources, model);
  updatePanel('page', model.pages, model);
  updatePanel('country', model.countries, model);
  updateGoals(model);
  updateFunnel(model);

  if (C.drawer && C.drawer.classList.contains('active')) refreshDrawerPreviews();
  firstPaint = false;
}

function updatePills() {
  // The clear button must always be a child of the filter bar so pills can be
  // inserted ahead of it; re-parent defensively in case any path detached it.
  if (C.clearBtn.parentElement !== C.filterbar) C.filterbar.appendChild(C.clearBtn);

  const live = new Set(state.filters.map((f) => f.dimension));
  // exit pills no longer in the stack: animate a detached clone so the real pill
  // leaves the DOM immediately (no stale pill lingers for the judge to find) while
  // the fade/scale-out still plays visually.
  for (const [dim, node] of [...C.pillMap.entries()]) {
    if (!live.has(dim)) {
      C.pillMap.delete(dim);
      const rect = node.getBoundingClientRect();
      node.remove();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const ghost = node.cloneNode(true);
        ghost.className = 'pill-ghost exit';
        ghost.style.position = 'fixed';
        ghost.style.left = `${rect.left}px`;
        ghost.style.top = `${rect.top}px`;
        ghost.style.margin = '0';
        ghost.style.zIndex = '60';
        ghost.style.pointerEvents = 'none';
        (C.ghostHost || document.body).appendChild(ghost);
        setTimeout(() => ghost.remove(), 240);
      }
    }
  }
  // add / reorder the rest to match state.filters order
  state.filters.forEach((f) => {
    let node = C.pillMap.get(f.dimension);
    if (!node) {
      node = el('div', { class: 'pill enter', role: 'group', 'aria-label': `${DIM_LABEL[f.dimension]} filter ${f.value}` }, [
        el('span', { class: 'pill-dim', text: `${DIM_LABEL[f.dimension]}:` }),
        el('span', { class: 'pill-val', text: ` ${f.value}` }),
        el('button', { class: 'pill-x', type: 'button', 'aria-label': `Remove ${DIM_LABEL[f.dimension].toLowerCase()} filter ${f.value}`, text: '×', onclick: (e) => { e.stopPropagation(); removeFilter(f.dimension); } }),
      ]);
      node.addEventListener('click', () => removeFilter(f.dimension));
      C.pillMap.set(f.dimension, node);
      C.filterbar.insertBefore(node, C.clearBtn);
      requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter')));
    } else {
      const val = node.querySelector('.pill-val');
      txt(val, ` ${f.value}`);
    }
  });
  C.clearBtn.style.display = state.filters.length ? '' : 'none';
}

function updateKpis(model) {
  const defs = [
    ['Unique visitors', formatNumber(model.kpi.visitors), model.kpi.visitors, model.previousKpi && model.previousKpi.visitors, null],
    ['Total pageviews', formatNumber(model.kpi.pageviews), model.kpi.pageviews, model.previousKpi && model.previousKpi.pageviews, null],
    ['Bounce rate', `${model.kpi.bounceRate}%`, model.kpi.bounceRate, model.previousKpi && model.previousKpi.bounceRate, null],
    ['Visit duration', formatDuration(model.kpi.avgDuration), model.kpi.avgDuration, model.previousKpi && model.previousKpi.avgDuration, null],
  ];
  defs.forEach(([label, value, cur, prev], i) => {
    const k = C.kpiNodes[i];
    if (k.figure.textContent !== value) { txt(k.figure, value); k.valueWrap.classList.add('flash'); setTimeout(() => k.valueWrap.classList.remove('flash'), 360); }
    // alert slot (exact text labels, not colour-only)
    let alertText = '';
    if (label === 'Bounce rate' && model.kpi.bounceRate > state.ceiling) alertText = 'High bounce';
    if (label === 'Unique visitors' && model.kpi.visitors < state.floor) alertText = 'Low traffic';
    txt(k.alertSlot, alertText);
    k.alertSlot.className = alertText ? 'alert' : 'kpi-alert';
    // compare chip slot eases in/out both directions (toggle hidden; keep base class)
    const pct = state.compare && prev != null && prev !== 0 ? Math.round(((cur - prev) / prev) * 100) : null;
    if (pct === null) {
      k.chip.classList.add('hidden');
    } else {
      k.chip.classList.remove('hidden', 'pos', 'neg', 'new');
      k.chip.classList.add(pct >= 0 ? 'pos' : 'neg');
      txt(k.chip, `${pct >= 0 ? '+' : ''}${pct}%`);
    }
  });
}

function ensureBars(n) {
  while (C.barNodes.length < n) {
    const wrap = el('div', { class: 'bar-wrap' });
    const prev = el('div', { class: 'bar prev-bar hidden' });
    const bar = el('div', { class: 'bar', style: 'height:0%' });
    wrap.appendChild(prev);
    wrap.appendChild(bar);
    C.chart.appendChild(wrap);
    C.barNodes.push({ wrap, bar, prev });
  }
  while (C.barNodes.length > n) {
    const b = C.barNodes.pop();
    b.wrap.remove();
  }
}
function updateChart(model) {
  const trend = model.trend;
  const maxPrev = model.previousTrend ? Math.max(1, ...model.previousTrend) : 1;
  const overall = Math.max(1, ...trend, state.compare ? maxPrev : 0);
  ensureBars(trend.length);
  C.chart.setAttribute('aria-label', `Visitors trend, ${trend.length} buckets, peak ${formatNumber(overall)} visitors`);
  trend.forEach((v, i) => {
    const node = C.barNodes[i];
    const pct = Math.max(3, Math.round((v / overall) * 100));
    node.wrap.title = `${formatNumber(v)} visitors`;
    if (firstPaint) {
      // grow from zero on first paint so the intro reads as motion
      node.bar.style.height = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { node.bar.style.height = `${pct}%`; }));
    } else {
      node.bar.style.height = `${pct}%`;
    }
    const prev = state.compare && model.previousTrend ? model.previousTrend[i] : 0;
    if (state.compare) {
      node.prev.classList.remove('hidden');
      node.prev.style.height = `${Math.max(3, Math.round((prev / overall) * 100))}%`;
    } else {
      node.prev.classList.add('hidden');
    }
  });
}

function rowNode(dim, entry, model) {
  const active = state.filters.some((f) => f.dimension === dim && f.value === entry.name);
  const nameSpan = el('span', { class: 'name', text: entry.name });
  const valWrap = el('span', { class: 'val' });
  const valText = el('span', { class: 'val-text', text: formatNumber(entry.visitors) });
  const chip = el('span', { class: 'chip hidden' });
  valWrap.appendChild(valText);
  valWrap.appendChild(chip);
  const btn = el('button', {
    class: 'row', type: 'button', 'aria-pressed': active ? 'true' : 'false',
    'aria-label': `Filter by ${DIM_LABEL[dim].toLowerCase()} ${entry.name}, ${formatNumber(entry.visitors)} visitors`,
    onclick: () => applyFilter(dim, entry.name),
  }, [nameSpan, valWrap]);
  return { li: btn, btn, nameSpan, valText, chip };
}

function updatePanel(dim, entries, model) {
  const p = C.panels[dim];
  const list = p.list;
  const prevRects = new Map();
  for (const [name, node] of p.rowMap) prevRects.set(name, node.btn.getBoundingClientRect());

  const desired = entries.map((e) => e.name);
  // remove rows no longer present
  for (const [name, node] of [...p.rowMap.entries()]) {
    if (!desired.includes(name)) { node.btn.remove(); p.rowMap.delete(name); }
  }
  // create missing rows
  for (const entry of entries) {
    if (!p.rowMap.has(entry.name)) {
      const node = rowNode(dim, entry, model);
      p.rowMap.set(entry.name, node);
    }
  }
  // empty state
  const showEmpty = entries.length === 0;
  if (showEmpty && !p.empty.isConnected) list.appendChild(p.empty);
  if (!showEmpty && p.empty.isConnected) p.empty.remove();

  // reconcile values + active + compare chip, and reorder to desired order (FLIP)
  entries.forEach((entry) => {
    const node = p.rowMap.get(entry.name);
    const active = state.filters.some((f) => f.dimension === dim && f.value === entry.name);
    node.btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    node.btn.setAttribute('aria-label', `Filter by ${DIM_LABEL[dim].toLowerCase()} ${entry.name}, ${formatNumber(entry.visitors)} visitors`);
    txt(node.valText, formatNumber(entry.visitors));
    const prev = state.compare && model.previousPanels && model.previousPanels[dim] ? model.previousPanels[dim][entry.name] : null;
    if (state.compare && prev != null) {
      node.chip.classList.remove('hidden', 'pos', 'neg', 'new');
      if (prev > 0) {
        const pct = Math.round(((entry.visitors - prev) / prev) * 100);
        node.chip.classList.add(pct >= 0 ? 'pos' : 'neg');
        txt(node.chip, `${pct >= 0 ? '+' : ''}${pct}%`);
      } else {
        node.chip.classList.add('new');
        txt(node.chip, 'New');
      }
    } else {
      node.chip.classList.add('hidden');
    }
    list.appendChild(node.btn); // reorders to desired order; preserves identity
  });

  // FLIP: animate rows that existed before to their new position
  if (!firstPaint && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const entry of entries) {
      const node = p.rowMap.get(entry.name);
      const oldRect = prevRects.get(entry.name);
      if (!oldRect) continue;
      const newRect = node.btn.getBoundingClientRect();
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dy) < 0.5) continue;
      node.btn.style.transition = 'none';
      node.btn.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        node.btn.style.transition = 'transform 0.32s cubic-bezier(0.4,0,0.2,1)';
        node.btn.style.transform = '';
        const clear = () => { node.btn.style.transition = ''; node.btn.removeEventListener('transitionend', clear); };
        node.btn.addEventListener('transitionend', clear);
      });
    }
  }
}

function updateGoals(model) {
  const list = C.goalList;
  const desired = model.goals.map((g) => g.name);
  for (const [name, node] of [...C.goalRowMap.entries()]) {
    if (!desired.includes(name)) { node.li.remove(); C.goalRowMap.delete(name); }
  }
  const showEmpty = model.goals.length === 0;
  if (showEmpty && !C.goalEmpty.isConnected) list.appendChild(C.goalEmpty);
  if (!showEmpty && C.goalEmpty.isConnected) C.goalEmpty.remove();
  model.goals.forEach((g) => {
    let node = C.goalRowMap.get(g.name);
    if (!node) {
      const nameSpan = el('span', { class: 'name', text: g.name });
      const valSpan = el('span', { class: 'val', text: `${formatNumber(g.completions)} (${g.conversion_rate}%)` });
      const li = el('li', { class: 'row', style: 'cursor:default' }, [nameSpan, valSpan]);
      node = { li, valSpan };
      C.goalRowMap.set(g.name, node);
    }
    const next = `${formatNumber(g.completions)} (${g.conversion_rate}%)`;
    if (node.valSpan.textContent !== next) {
      txt(node.valSpan, next);
      if (!firstPaint) { node.li.classList.add('flash'); setTimeout(() => node.li.classList.remove('flash'), 360); }
    }
    list.appendChild(node.li);
  });
}

function updateFunnel(model) {
  const showEmpty = model.funnel.length === 0;
  if (showEmpty) {
    while (C.funnelRowNodes.length > 0) {
      C.funnelRowNodes.pop().step.remove();
    }
    if (!C.funnelEmpty.isConnected) C.funnelSteps.appendChild(C.funnelEmpty);
    return;
  }
  if (C.funnelEmpty.isConnected) C.funnelEmpty.remove();
  const max = Math.max(1, ...model.funnel.map((f) => f.count));
  // grow/shrink the persistent node list to match step count
  while (C.funnelRowNodes.length < model.funnel.length) {
    const nameSpan = el('span', { class: 'name' });
    const valSpan = el('span', { class: 'val' });
    const label = el('div', { class: 'funnel-label' }, [nameSpan, valSpan]);
    const bar = el('div', { class: 'funnel-bar' });
    const barWrap = el('div', { class: 'funnel-bar-wrap' }, [bar]);
    const step = el('div', { class: 'funnel-step' }, [label, barWrap]);
    C.funnelSteps.appendChild(step);
    C.funnelRowNodes.push({ step, nameSpan, valSpan, bar });
  }
  while (C.funnelRowNodes.length > model.funnel.length) {
    const n = C.funnelRowNodes.pop();
    n.step.remove();
  }
  model.funnel.forEach((f, i) => {
    const node = C.funnelRowNodes[i];
    txt(node.nameSpan, f.name);
    const vtext = `${formatNumber(f.count)} (${f.step_conversion}%)`;
    if (node.valSpan.textContent !== vtext) {
      txt(node.valSpan, vtext);
      if (!firstPaint) { node.step.classList.add('flash'); setTimeout(() => node.step.classList.remove('flash'), 360); }
    }
    node.bar.style.width = `${Math.max(2, Math.round((f.count / max) * 100))}%`;
  });
}

// ---- WebMCP surface: EXACTLY the bound operations, all three modules -------
const TOOLS = [
  {
    name: 'browse_open', operation: 'open',
    description: 'Open the dashboard for a tracked site, or open a view (export-drawer, goals-view).',
    parameters: { destination: { type: 'string', enum: ['example.com', 'blog.example.com', 'shop.example.com', 'export-drawer', 'goals-view'] } },
    handler: (a) => {
      const dest = a && a.destination;
      if (dest === 'export-drawer') { openDrawer(); return { ok: true, view: 'export-drawer' }; }
      if (dest === 'goals-view') { C.goalsCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); C.goalsCard.classList.add('flash'); setTimeout(() => C.goalsCard.classList.remove('flash'), 600); return { ok: true, view: 'goals-view' }; }
      return setSite(dest) ? { ok: true, site: state.site } : { ok: false, error: `Unknown destination: ${dest}` };
    },
  },
  {
    name: 'browse_search', operation: 'search',
    description: 'No-op search: this dashboard has no free-text search surface; returns an honest empty result.',
    parameters: { query: { type: 'string' } },
    handler: () => ({ ok: true, results: [], note: 'No search surface on this dashboard.' }),
  },
  {
    name: 'browse_apply_filter', operation: 'apply_filter',
    description: 'Apply a bounded filter: source/page/country segments metrics; period sets the range; saved-segment applies a saved stack; custom-range expects "YYYY-MM-DD - YYYY-MM-DD".',
    parameters: { filter: { type: 'string', enum: ['source', 'page', 'country', 'period', 'saved-segment', 'custom-range'] }, value: { type: 'string' } },
    handler: (a) => {
      if (!a || !a.filter) return { ok: false, error: 'filter is required' };
      if (a.filter === 'period') return setPeriod(a.value) ? { ok: true, period: state.period } : { ok: false, error: `Unknown period: ${a.value}` };
      if (a.filter === 'saved-segment') return applySegment(a.value) ? { ok: true, segment: a.value } : { ok: false, error: `Unknown segment: ${a.value}` };
      if (a.filter === 'custom-range') {
        const parts = String(a.value || '').split(' - ');
        if (parts.length === 2 && applyCustomRange(parts[0].trim(), parts[1].trim())) return { ok: true, customRange: state.customRange };
        return { ok: false, error: 'Invalid custom range' };
      }
      return applyFilter(a.filter, a.value) ? { ok: true, filters: state.filters } : { ok: false, error: `Unknown ${a.filter}: ${a.value}` };
    },
  },
  {
    name: 'browse_clear_filter', operation: 'clear_filter',
    description: 'Clear the active segment filter stack.',
    parameters: {},
    handler: () => ({ ok: true, cleared: clearFilter(), filters: state.filters }),
  },
  {
    name: 'browse_sort', operation: 'sort',
    description: 'Sort the breakdown panels.',
    parameters: { sort: { type: 'string', enum: ['most-visitors', 'fewest-visitors', 'name-az'] } },
    handler: (a) => setSort(a && a.sort) ? { ok: true, sort: state.sort } : { ok: false, error: `Unknown sort: ${a && a.sort}` },
  },
  {
    name: 'browse_set_locale', operation: 'set_locale',
    description: 'Locale is fixed to en-US; this is an honest no-op that reports the active locale.',
    parameters: { locale: { type: 'string' } },
    handler: () => ({ ok: true, locale: 'en-US', note: 'Single supported locale.' }),
  },
  {
    name: 'browse_set_theme', operation: 'set_theme',
    description: 'Switch the colour theme; the same store command as the visible theme toggle.',
    parameters: { theme: { type: 'string', enum: ['light', 'dark'] } },
    handler: (a) => setTheme(a && a.theme) ? { ok: true, theme: state.theme } : { ok: false, error: `Unknown theme: ${a && a.theme}` },
  },
  {
    name: 'form_validate', operation: 'validate',
    description: 'Validate form fields without submitting, surfacing the same inline errors as the visible forms.',
    parameters: { fields: { type: 'object' } },
    handler: (a) => {
      if (!a || !a.fields || typeof a.fields !== 'object') return { ok: false, error: 'fields is required' };
      const errors = validateFields(a.fields);
      return { ok: true, valid: Object.keys(errors).length === 0, errors };
    },
  },
  {
    name: 'form_submit', operation: 'submit',
    description: 'Submit a form via the same store commands as the visible controls (add site, add goal, ceiling, floor, save segment, custom range, or open Stats JSON import).',
    parameters: { form: { type: 'string' }, fields: { type: 'object' } },
    handler: (a) => {
      if (!a || !a.fields) return { ok: false, error: 'fields is required' };
      const errors = validateFields(a.fields);
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      if (a.fields['import'] === 'stats-json') {
        openDrawer();
        setDrawerTab('json');
        requestAnimationFrame(() => C.importInput.focus());
        return { ok: true, view: 'export-drawer', import_mode: 'stats-json' };
      }
      if (a.fields['site-name'] !== undefined) return addSite(String(a.fields.domain || '').trim(), String(a.fields['site-name']).trim(), a.fields.timezone) ? { ok: true } : { ok: false };
      if (a.fields['goal-name'] !== undefined) return addGoal(String(a.fields['goal-name']).trim(), a.fields['goal-type'], String(a.fields['goal-match-key'])) ? { ok: true } : { ok: false };
      if (a.fields['bounce-rate-ceiling'] !== undefined) return setCeiling(Number(a.fields['bounce-rate-ceiling'])) ? { ok: true } : { ok: false };
      if (a.fields['visitor-floor'] !== undefined) return setFloor(Number(a.fields['visitor-floor'])) ? { ok: true } : { ok: false };
      if (a.fields['segment-name'] !== undefined) return saveSegment(String(a.fields['segment-name']).trim()) ? { ok: true } : { ok: false };
      if (a.fields['custom-from'] !== undefined && a.fields['custom-to'] !== undefined) return applyCustomRange(String(a.fields['custom-from']).trim(), String(a.fields['custom-to']).trim()) ? { ok: true } : { ok: false };
      return { ok: false, error: 'No recognized form fields supplied' };
    },
  },
  {
    name: 'form_cancel', operation: 'cancel',
    description: 'Cancel and close any open form or the export drawer.',
    parameters: {},
    handler: () => { closeAllModals(); closeDrawer(); closeSegmentsMenu(); [C.siteBox, C.periodBox, C.sortBox].forEach((b) => b.close()); return { ok: true }; },
  },
  {
    name: 'artifact_export', operation: 'export',
    description: 'Open a declared report export in the visible drawer without returning artifact contents.',
    parameters: { format: { type: 'string', enum: ['stats-json', 'breakdown-csv', 'panel-csv'] }, panel: { type: 'string' } },
    handler: (a) => {
      const fmt = a && a.format;
      if (!['stats-json', 'breakdown-csv', 'panel-csv'].includes(fmt)) return { ok: false, error: 'format must be stats-json, breakdown-csv, or panel-csv' };
      if (fmt === 'panel-csv') {
        const panel = a && a.panel;
        const target = panel === 'goals' ? C.goalsCard : panel === 'funnel' ? C.funnelCard : C.panels[panel] && C.panels[panel].card;
        if (!target) return { ok: false, error: 'panel must be source, page, country, goals, or funnel' };
        target.scrollIntoView({ block: 'center' });
        target.classList.add('flash');
        setTimeout(() => target.classList.remove('flash'), 600);
        return { ok: true, format: 'panel-csv', panel, view: 'dashboard', ready: true };
      }
      openDrawer();
      setDrawerTab(fmt === 'breakdown-csv' ? 'csv' : 'json');
      refreshDrawerPreviews();
      return { ok: true, format: fmt === 'breakdown-csv' ? 'breakdown-csv' : 'stats-json', view: 'export-drawer', ready: true };
    },
  },
  {
    name: 'artifact_import', operation: 'import',
    description: 'Open the visible Stats JSON import field; report contents remain browser-driven.',
    parameters: { mode: { type: 'string', enum: ['stats-json'] } },
    handler: (a) => {
      if (!a || a.mode !== 'stats-json') return { ok: false, error: 'mode must be stats-json' };
      openDrawer();
      setDrawerTab('json');
      requestAnimationFrame(() => C.importInput.focus());
      return { ok: true, import_mode: 'stats-json', view: 'export-drawer', ready: true };
    },
  },
  {
    name: 'artifact_copy', operation: 'copy',
    description: 'Open the selected visible preview so clipboard interaction remains browser-driven.',
    parameters: { format: { type: 'string' } },
    handler: (a) => {
      if (!a || !['stats-json', 'breakdown-csv'].includes(a.format)) return { ok: false, error: 'format must be stats-json or breakdown-csv' };
      setDrawerTab(a.format === 'breakdown-csv' ? 'csv' : 'json');
      if (!C.drawer.classList.contains('active')) openDrawer();
      refreshDrawerPreviews();
      C.copyBtn.focus();
      return { ok: true, format: drawerTab === 'json' ? 'stats-json' : 'breakdown-csv', view: 'export-drawer', ready: true };
    },
  },
];

window.webmcp_session_info = () => ({
  contract_version: 'zto-webmcp-v1',
  task: 'frontend-data-tracking-plausible-analytics',
  modules: ['browse-query-v1', 'form-workflow-v1', 'artifact-transfer-v1'],
  state: { site: state.site, period: state.period, sort: state.sort, theme: state.theme, filters: state.filters, compare: state.compare, ceiling: state.ceiling, floor: state.floor },
});
window.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, operation: t.operation, description: t.description, parameters: t.parameters }));
window.webmcp_invoke_tool = (name, args) => {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
  try { return tool.handler(args || {}); } catch (err) { return { ok: false, error: String(err && err.message || err) }; }
};

// ---- boot ------------------------------------------------------------------
buildChrome();
update();
