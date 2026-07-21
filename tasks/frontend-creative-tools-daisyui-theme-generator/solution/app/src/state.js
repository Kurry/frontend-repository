// Shared in-memory state (no browser storage APIs). Every mutation goes
// through these actions — the visible UI and the WebMCP handlers call the
// exact same functions.
import { BUILTINS, COLOR_KEYS, RADIUS_VALUES, SIZE_VALUES, BORDER_VALUES, FONT_FAMILIES } from './data.js';
import { encodeThemeHash, decodeThemeHash, slugOf, NAME_RE, validateDeclaredTheme } from './format.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export const state = {
  customs: [],          // user-created theme records
  activeId: 'builtin-light',
  previewTab: 'demo',   // demo | variants | palette
  siteTheme: 'light',   // chrome preference
  language: 'EN',
  version: '5.6.18',
  colorBlind: 'none',
  compareOn: false,
  snapshots: [],
  artifactTab: 'css',
  artifactOpen: false,
  past: [],
  future: [],
};

let listeners = [];
export function subscribe(fn) { listeners.push(fn); }
export function notify(event) { for (const fn of listeners) fn(event); }

export function byId(id) {
  return BUILTINS.find((t) => t.id === id) || state.customs.find((t) => t.id === id) || null;
}

export function activeTheme() {
  return byId(state.activeId) || BUILTINS[0];
}

export function findByName(name) {
  const s = slugOf(name);
  return state.customs.find((t) => slugOf(t.name) === s)
    || BUILTINS.find((t) => slugOf(t.name) === s) || null;
}

function pushHistory() {
  state.past.push({ customs: clone(state.customs), activeId: state.activeId });
  if (state.past.length > 100) state.past.shift();
  state.future.length = 0;
}

// Push a caller-captured "before" snapshot (used around color-picker gestures
// and one-shot control changes). Skips no-op pushes.
export function pushExternalHistory(before) {
  const same = JSON.stringify(before.customs) === JSON.stringify(state.customs)
    && before.activeId === state.activeId;
  if (same) return;
  state.past.push(before);
  if (state.past.length > 100) state.past.shift();
  state.future.length = 0;
}

export function undo() {
  if (!state.past.length) return false;
  state.future.push({ customs: clone(state.customs), activeId: state.activeId });
  const snap = state.past.pop();
  state.customs = snap.customs;
  state.activeId = snap.activeId;
  if (!byId(state.activeId)) state.activeId = 'builtin-light';
  syncHash();
  notify('structure');
  return true;
}

export function redo() {
  if (!state.future.length) return false;
  state.past.push({ customs: clone(state.customs), activeId: state.activeId });
  const snap = state.future.pop();
  state.customs = snap.customs;
  state.activeId = snap.activeId;
  syncHash();
  notify('structure');
  return true;
}

let lastWrittenHash = null;

export function syncHash() {
  try {
    const enc = encodeThemeHash(activeTheme());
    lastWrittenHash = `#theme=${enc}`;
    history.replaceState(null, '', lastWrittenHash);
  } catch { /* hash is best-effort */ }
}

// React to same-document hash edits the way a fresh load would: a decodable
// payload is applied; a malformed/undecodable one falls back to the seeded
// default theme without errors.
export function watchHash() {
  window.addEventListener('hashchange', () => {
    if (location.hash === lastWrittenHash) return;
    const m = /#theme=([^&]+)/.exec(location.hash);
    if (!m) {
      state.customs = [];
      state.snapshots = [];
      state.past = [];
      state.future = [];
      state.activeId = 'builtin-light';
      state.previewTab = 'demo';
      state.colorBlind = 'none';
      try { history.replaceState(null, '', location.pathname + location.search); lastWrittenHash = null; } catch { /* noop */ }
      notify('structure');
      return;
    }
    const decoded = decodeThemeHash(m[1]);
    if (!decoded) {
      state.customs = [];
      state.snapshots = [];
      state.past = [];
      state.future = [];
      state.activeId = 'builtin-light';
      state.previewTab = 'demo';
      state.colorBlind = 'none';
      try {
        history.replaceState(null, '', location.pathname + location.search);
        lastWrittenHash = null;
      } catch { /* noop */ }
      notify('structure');
      return;
    }
    const slug = slugOf(decoded.name);
    let rec = state.customs.find((c) => slugOf(c.name) === slug);
    if (!rec) {
      rec = {
        id: `custom-${slug}-${Date.now().toString(36)}`,
        builtin: false,
        name: decoded.name,
        ...clone(decoded),
      };
      state.customs.push(rec);
    } else {
      Object.assign(rec, clone(decoded), { name: rec.name });
    }
    state.activeId = rec.id;
    notify('structure');
  });
}

export function selectTheme(id) {
  if (!byId(id)) return false;
  state.activeId = id;
  syncHash();
  notify('structure');
  return true;
}

export function selectByName(name) {
  const t = findByName(name);
  if (!t) return false;
  return selectTheme(t.id);
}

// Editing a built-in forks an editable custom copy; customs edit in place.
// Callers own the history push (see pushExternalHistory / discrete actions).
export function ensureEditable() {
  const t = activeTheme();
  if (!t.builtin) return t;
  const base = `${t.name}-edit`;
  let name = base;
  let n = 2;
  while (findByName(name)) name = `${base}-${n++}`;
  const copy = clone(t);
  copy.id = `custom-${name}-${Date.now().toString(36)}`;
  copy.builtin = false;
  copy.name = name;
  copy.generatedAt = new Date().toISOString();
  state.customs.push(copy);
  state.activeId = copy.id;
  return copy;
}

// Live token mutation WITHOUT history push (used while dragging a color
// picker; pushHistoryFor() bookends the gesture).
export function setToken(mutate) {
  const forked = activeTheme().builtin;
  const t = ensureEditable();
  mutate(t);
  syncHash();
  // A built-in edit creates a list row and changes the active selection. Do
  // the structural render only after the mutation so controls never repaint
  // from the pristine fork and become stale while state contains the edit.
  notify(forked ? 'structure' : 'tokens');
  return t;
}

export function snapshotState() {
  return clone({ customs: state.customs, activeId: state.activeId });
}

export function restoreSnapshot(snap) {
  pushHistory();
  state.customs = clone(snap.customs);
  state.activeId = snap.activeId;
  if (!byId(state.activeId)) state.activeId = 'builtin-light';
  syncHash();
  notify('structure');
}

export function setColor(key, hex) {
  if (!COLOR_KEYS.includes(key) || !/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  setToken((t) => { t.colors[key] = hex.toLowerCase(); });
  return true;
}

export function setRadius(group, value) {
  if (!RADIUS_VALUES.includes(value)) return false;
  setToken((t) => { t.radius[group] = value; });
  return true;
}

export function setSize(kind, value) {
  if (!SIZE_VALUES.includes(value)) return false;
  setToken((t) => { t.size[kind] = value; });
  return true;
}

export function setBorder(value) {
  if (!BORDER_VALUES.includes(value)) return false;
  setToken((t) => { t.border = value; });
  return true;
}

export function setEffect(kind, on) {
  setToken((t) => { t[kind] = on ? 1 : 0; });
  return true;
}

export function setFontFamily(id) {
  if (!FONT_FAMILIES.some((f) => f.id === id)) return false;
  setToken((t) => { t.fontFamily = id; });
  return true;
}

export function setOption(key, value) {
  setToken((t) => { t.options[key] = !!value; });
  return true;
}

export function resetActive() {
  const t = activeTheme();
  if (t.builtin) return false; // built-ins are already pristine
  const pristine = BUILTINS[0];
  pushHistory();
  t.colors = clone(pristine.colors);
  t.radius = { box: '0.5rem', field: '0.25rem', selector: '0.25rem' };
  t.size = { field: 'md', selector: 'md' };
  t.border = '1px';
  t.depth = 1;
  t.noise = 0;
  t.fontFamily = 'outfit';
  syncHash();
  notify('structure');
  return true;
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function randomize() {
  pushHistory();
  const t = ensureEditable();
  const hue = Math.floor(Math.random() * 360);
  const scheme = t.options.darkColorScheme;
  const rand = (min, max) => min + Math.random() * (max - min);
  t.colors['--color-primary'] = hslToHex(hue, rand(0.55, 0.8), scheme ? 0.62 : 0.48);
  t.colors['--color-primary-content'] = hslToHex(hue, 0.5, scheme ? 0.08 : 0.97);
  t.colors['--color-secondary'] = hslToHex((hue + rand(90, 150)) % 360, rand(0.5, 0.75), scheme ? 0.6 : 0.5);
  t.colors['--color-secondary-content'] = hslToHex(hue, 0.4, scheme ? 0.08 : 0.97);
  t.colors['--color-accent'] = hslToHex((hue + rand(180, 240)) % 360, rand(0.6, 0.85), scheme ? 0.65 : 0.52);
  t.colors['--color-accent-content'] = hslToHex(hue, 0.4, scheme ? 0.08 : 0.97);
  t.radius.box = RADIUS_VALUES[Math.floor(Math.random() * RADIUS_VALUES.length)];
  t.radius.field = RADIUS_VALUES[Math.floor(Math.random() * RADIUS_VALUES.length)];
  t.radius.selector = RADIUS_VALUES[Math.floor(Math.random() * 3)];
  syncHash();
  notify('structure');
  return t;
}

export function uniqueName(base) {
  let name = base;
  let n = 2;
  while (findByName(name)) name = `${base}-${n++}`;
  return name;
}

// Hold-to-add / entity create path. Returns { ok, theme?, error? }.
export function createTheme(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return { ok: false, error: 'Name is required — give the theme a name before adding it' };
  if (trimmed.length < 2 || trimmed.length > 30) return { ok: false, error: 'Name must be 2–30 characters long' };
  if (!NAME_RE.test(trimmed)) return { ok: false, error: 'Name may only use letters, numbers, spaces, hyphens, and underscores' };
  if (findByName(trimmed)) return { ok: false, error: `A theme named “${trimmed}” already exists — pick a unique name` };
  pushHistory();
  const seed = BUILTINS[0];
  const rec = {
    id: `custom-${slugOf(trimmed)}-${Date.now().toString(36)}`,
    builtin: false,
    name: trimmed,
    colors: clone(seed.colors),
    radius: { ...seed.radius },
    size: { ...seed.size },
    border: seed.border,
    depth: seed.depth,
    noise: seed.noise,
    fontFamily: seed.fontFamily,
    options: { ...seed.options, defaultTheme: false },
    generatedAt: new Date().toISOString(),
  };
  state.customs.push(rec);
  state.activeId = rec.id;
  syncHash();
  notify('structure');
  return { ok: true, theme: rec };
}

// Rename validation result: { ok, error?, value? } — does not mutate.
export function validateRename(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { ok: false, error: 'Name is required — the theme keeps its current name' };
  if (trimmed.length < 2 || trimmed.length > 30) return { ok: false, error: 'Name must be 2–30 characters long' };
  if (!NAME_RE.test(trimmed)) return { ok: false, error: 'Name may only use letters, numbers, spaces, hyphens, and underscores' };
  const clash = state.customs.find((t) => t.id !== state.activeId && slugOf(t.name) === slugOf(trimmed));
  if (clash) return { ok: false, error: `A theme named “${trimmed}” already exists in My Themes` };
  return { ok: true, value: trimmed };
}

export function renameActive(raw) {
  const check = validateRename(raw);
  if (!check.ok) return check;
  const t = activeTheme();
  if (t.builtin) {
    pushHistory();
    const forked = ensureEditable();
    forked.name = check.value;
  } else {
    if (t.name === check.value) return check;
    pushHistory();
    t.name = check.value;
  }
  syncHash();
  notify('structure');
  return check;
}

// Rows animating out (removed from state immediately — counts are truthful —
// but kept as ghosts so the exit motion is visible).
export const leavingRows = new Map();

// Remove with a re-entrancy guard so rapid double activation deletes exactly one.
const removing = new Set();
export function removeTheme(id, animate = true) {
  if (removing.has(id)) return { ok: false, error: 'already removing' };
  const idx = state.customs.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: false, error: 'not found' };
  const t = state.customs[idx];
  if (t.builtin) return { ok: false, error: `${t.name} is a built-in theme and can’t be removed` };
  removing.add(id);
  pushHistory();
  state.customs.splice(idx, 1);
  if (state.activeId === id) {
    state.activeId = state.customs[0]?.id || 'builtin-light';
  }
  state.snapshots = state.snapshots.filter((s) => s.themeId !== id);
  if (animate) {
    leavingRows.set(id, t);
    setTimeout(() => { leavingRows.delete(id); removing.delete(id); notify('structure'); }, 260);
  } else {
    removing.delete(id);
  }
  syncHash();
  notify('structure');
  return { ok: true, theme: t };
}

export function importFromText(text) {
  const res = validateDeclaredTheme(text);
  if (!res.ok) return res;
  pushHistory();
  const name = uniqueName(res.theme.name);
  const rec = {
    id: `custom-${slugOf(name)}-${Date.now().toString(36)}`,
    builtin: false,
    name,
    ...clone(res.theme),
    generatedAt: new Date().toISOString(),
  };
  state.customs.push(rec);
  state.activeId = rec.id;
  syncHash();
  notify('structure');
  return { ok: true, theme: rec };
}

export function saveSnapshot() {
  const t = activeTheme();
  const snap = {
    id: `snap-${Date.now().toString(36)}`,
    themeId: t.id,
    name: uniqueName(`snapshot-${t.name}`),
    tokens: clone({
      colors: t.colors, radius: t.radius, size: t.size, border: t.border,
      depth: t.depth, noise: t.noise, fontFamily: t.fontFamily, options: t.options,
    }),
    createdAt: new Date().toISOString(),
  };
  state.snapshots.push(snap);
  notify('structure');
  return snap;
}

export function restoreSnapshotTokens(snapId) {
  const snap = state.snapshots.find((s) => s.id === snapId);
  if (!snap) return false;
  pushHistory();
  setToken((t) => {
    t.colors = clone(snap.tokens.colors);
    t.radius = clone(snap.tokens.radius);
    t.size = clone(snap.tokens.size);
    t.border = snap.tokens.border;
    t.depth = snap.tokens.depth;
    t.noise = snap.tokens.noise;
    t.fontFamily = snap.tokens.fontFamily;
    t.options = clone(snap.tokens.options);
  });
  return true;
}

export function diffAgainstSnapshot() {
  if (!state.snapshots.length) return [];
  const snap = state.snapshots[state.snapshots.length - 1];
  const t = activeTheme();
  const diffs = [];
  for (const key of COLOR_KEYS) {
    if (snap.tokens.colors[key] !== t.colors[key]) diffs.push({ token: key.replace('--color-', ''), from: snap.tokens.colors[key], to: t.colors[key] });
  }
  for (const g of ['box', 'field', 'selector']) {
    if (snap.tokens.radius[g] !== t.radius[g]) diffs.push({ token: `radius.${g}`, from: snap.tokens.radius[g], to: t.radius[g] });
  }
  if (snap.tokens.fontFamily !== t.fontFamily) diffs.push({ token: 'fontFamily', from: snap.tokens.fontFamily, to: t.fontFamily });
  return diffs;
}

// Fresh-load: apply the #theme= hash or fall back to the seeded defaults.
export function loadFromHash() {
  const m = /#theme=([^&]+)/.exec(location.hash);
  if (!m) {
    state.customs = [];
    state.snapshots = [];
    state.past = [];
    state.future = [];
    state.activeId = 'builtin-light';
    state.previewTab = 'demo';
    state.colorBlind = 'none';
    notify('structure');
    return false;
  }
  const decoded = decodeThemeHash(m[1]);
  if (!decoded) {
    // Malformed / undecodable payload: fall back to seeded defaults, no errors.
    state.customs = [];
    state.snapshots = [];
    state.past = [];
    state.future = [];
    state.activeId = 'builtin-light';
    state.previewTab = 'demo';
    state.colorBlind = 'none';
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* noop */ }
    notify('structure');
    return false;
  }
  const name = uniqueName(decoded.name);
  const rec = {
    id: `custom-${slugOf(name)}-${Date.now().toString(36)}`,
    builtin: false,
    name,
    ...clone(decoded),
  };
  state.customs.push(rec);
  state.activeId = rec.id;
  return true;
}
