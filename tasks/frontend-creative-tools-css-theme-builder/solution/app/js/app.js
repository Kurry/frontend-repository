/* CSS Theme Builder — oracle app.
 * In-memory state only (no localStorage/sessionStorage/IndexedDB by design);
 * the shareable payload lives in the same-document #theme= hash. */
import "@fontsource-variable/outfit";
import builtinThemes from "./builtin-themes.js";
import {
  readThemeHash,
  hashHasThemePayload,
  writeThemeHash,
  clearThemeHash,
  serializeTheme,
  themeToCss,
  themeToExtension,
  validateThemeDocument,
  validateThemeName,
  fileSlug,
} from "./theme-codec.js";
import { registerWebMCP } from "./webmcp.js";

/* ------------------------------ color math ------------------------------ */

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function oklchToRgb(L, C, H) {
  const h = ((H % 360) + 360) % 360 * (Math.PI / 180);
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const gamma = (x) => {
    x = clamp(x, 0, 1);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  return [Math.round(gamma(r) * 255), Math.round(gamma(g) * 255), Math.round(gamma(bl) * 255)];
}

function rgbToHex(r, g, b) {
  return (
    "#" + [r, g, b].map((n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")).join("")
  );
}

function oklchToHex(L, C, H) {
  const [r, g, b] = oklchToRgb(L, C, H);
  return rgbToHex(r, g, b);
}

function parseOklch(str) {
  const m = String(str).match(/oklch\(\s*([\d.]+)\s*(%)?\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)/i);
  if (!m) return null;
  // L is 0–100 with an explicit %, otherwise 0–1 (CSS allows both forms);
  // a unit-less value above 1 is treated as a bare percentage.
  const rawL = parseFloat(m[1]);
  const l = m[2] === "%" || rawL > 1 ? rawL / 100 : rawL;
  return { l, c: parseFloat(m[3]), h: parseFloat(m[4]) };
}

function hexToRgb(hex) {
  const m = String(hex).match(/^#?([0-9a-f]{6})$/i);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToOklch(hex) {
  const [sr, sg, sb] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const l = 0.4122214708 * sr + 0.5363325363 * sg + 0.0514459929 * sb;
  const m = 0.2119034982 * sr + 0.6806995451 * sg + 0.1073969566 * sb;
  const s = 0.0883024619 * sr + 0.2817188376 * sg + 0.6299787005 * sb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 0.002 ? 0 : H };
}

function anyColorToHex(value) {
  const v = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const ok = parseOklch(v);
  if (ok) return oklchToHex(ok.l, ok.c, ok.h);
  return null;
}

function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const hexA = anyColorToHex(a) || "#000000";
  const hexB = anyColorToHex(b) || "#ffffff";
  const la = relLuminance(hexA);
  const lb = relLuminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function nudgeHex(hex, dL, dH) {
  const { l, c, h } = hexToOklch(hex);
  return oklchToHex(clamp(l + dL, 0.03, 0.98), clamp(c, 0, 0.37), (h + dH + 360) % 360);
}

/* ------------------------------ constants ------------------------------ */

const COLOR_PAIRS = [
  ["--color-base-100", "--color-base-content"],
  ["--color-base-200", "--color-base-content"],
  ["--color-base-300", "--color-base-content"],
  ["--color-primary", "--color-primary-content"],
  ["--color-secondary", "--color-secondary-content"],
  ["--color-accent", "--color-accent-content"],
  ["--color-neutral", "--color-neutral-content"],
  ["--color-info", "--color-info-content"],
  ["--color-success", "--color-success-content"],
  ["--color-warning", "--color-warning-content"],
  ["--color-error", "--color-error-content"],
];

const RADIUS = [
  ["--radius-box", "Boxes", "card, modal, alert", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
  ["--radius-field", "Fields", "button, input, select, tab", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
  ["--radius-selector", "Selectors", "checkbox, toggle, badge", ["0rem", "0.25rem", "0.5rem", "1rem", "2rem"]],
];

const SIZES = [
  ["--size-field", "Fields", "button, input, select, tab",
    ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"], ["xs", "sm", "md", "lg", "xl"]],
  ["--size-selector", "Selectors", "checkbox, toggle, badge",
    ["0.1875rem", "0.21875rem", "0.25rem", "0.28125rem", "0.3125rem"], ["xs", "sm", "md", "lg", "xl"]],
];

const BORDERS = ["0.5px", "1px", "1.5px", "2px"];
const EFFECTS = [
  ["--depth", "Depth effect", "3D depth on fields & selectors"],
  ["--noise", "Noise effect", "Noise pattern on fields & selectors"],
];

const COLOR_LABELS = {
  "--color-base-100": "base-100",
  "--color-base-200": "base-200",
  "--color-base-300": "base-300",
  "--color-primary": "primary",
  "--color-secondary": "secondary",
  "--color-accent": "accent",
  "--color-neutral": "neutral",
  "--color-info": "info",
  "--color-success": "success",
  "--color-warning": "warning",
  "--color-error": "error",
};

const THEME_VAR_KEYS = [
  "--color-base-100", "--color-base-200", "--color-base-300", "--color-base-content",
  "--color-primary", "--color-primary-content", "--color-secondary", "--color-secondary-content",
  "--color-accent", "--color-accent-content", "--color-neutral", "--color-neutral-content",
  "--color-info", "--color-info-content", "--color-success", "--color-success-content",
  "--color-warning", "--color-warning-content", "--color-error", "--color-error-content",
  "--radius-selector", "--radius-field", "--radius-box",
  "--size-selector", "--size-field", "--border", "--depth", "--noise",
];

/* ------------------------------ state ------------------------------ */

function cloneTheme(t) {
  return { ...t };
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTheme(t) {
  const out = cloneTheme(t);
  for (const key of THEME_VAR_KEYS) {
    if (!key.startsWith("--color-")) continue;
    const hex = anyColorToHex(out[key]);
    if (hex) out[key] = hex;
  }
  if (!out.baseline) out.baseline = serializeTheme(out);
  return out;
}

const state = {
  builtins: builtinThemes.map(normalizeTheme),
  customs: [], // in-memory only by design — a plain reload always returns to seed
  active: null,
  tab: "demo",
  vision: "none",
  snapshots: [],
  lastSnapshot: null,
  snapshotView: "after",
  chrome: "dark",
  exportFormat: "css",
};

const history = { undo: [], redo: [], _lastKey: null, _lastTime: 0 };

function snapshotState() {
  return {
    customs: state.customs.map(cloneTheme),
    active: state.active ? cloneTheme(state.active) : null,
    activeId: state.active?.id ?? null,
  };
}

function restoreState(snap) {
  state.customs = snap.customs.map(cloneTheme);
  if (snap.active) {
    const inCustoms = snap.active.type === "custom"
      ? state.customs.find((t) => t.id === snap.activeId)
      : null;
    state.active = inCustoms || cloneTheme(snap.active);
  } else {
    state.active = cloneTheme(defaultBuiltin());
  }
  state.snapshotView = "after";
}

function pushHistory(key) {
  const now = Date.now();
  if (key && history._lastKey === key && now - history._lastTime < 450) {
    history._lastTime = now; // coalesce rapid edits of the same token into one undo step
    return;
  }
  history._lastKey = key;
  history._lastTime = now;
  history.undo.push(snapshotState());
  if (history.undo.length > 120) history.undo.shift();
  history.redo.length = 0;
  updateUndoRedoButtons();
}

/* Deferred removal timers (row exit animation) keyed by theme id. Undo/Redo
 * restores a snapshot that may resurrect a theme whose removal is still
 * pending — the timer must be cancelled or it would delete the restored
 * theme and toast a removal the user just undid. */
const pendingRemovals = new Map();

function cancelPendingRemovals() {
  for (const timer of pendingRemovals.values()) clearTimeout(timer);
  pendingRemovals.clear();
}

function undo() {
  if (!history.undo.length) return;
  cancelPendingRemovals();
  history.redo.push(snapshotState());
  restoreState(history.undo.pop());
  history._lastKey = null;
  afterStructuralChange("Undo");
}

function redo() {
  if (!history.redo.length) return;
  cancelPendingRemovals();
  history.undo.push(snapshotState());
  restoreState(history.redo.pop());
  history._lastKey = null;
  afterStructuralChange("Redo");
}

function updateUndoRedoButtons() {
  const u = document.getElementById("btn-undo");
  const r = document.getElementById("btn-redo");
  if (u) {
    u.disabled = !history.undo.length;
    u.setAttribute("aria-disabled", String(!history.undo.length));
  }
  if (r) {
    r.disabled = !history.redo.length;
    r.setAttribute("aria-disabled", String(!history.redo.length));
  }
}

function defaultBuiltin() {
  return state.builtins.find((t) => t.default) || state.builtins.find((t) => t.name === "light") || state.builtins[0];
}

function allThemes() {
  return [...state.customs, ...state.builtins];
}

function findThemeById(id) {
  return allThemes().find((t) => t.id === id) || null;
}

function uniqueName(base) {
  const trimmed = String(base || "mytheme").trim().slice(0, 56) || "mytheme";
  const names = new Set(allThemes().map((t) => t.name));
  if (!names.has(trimmed)) return trimmed;
  for (let i = 2; i < 999; i++) {
    const candidate = `${trimmed} ${i}`;
    if (!names.has(candidate)) return candidate;
  }
  return `${trimmed} ${Date.now().toString(36)}`;
}

function syncCustomsEntry() {
  if (!state.active || state.active.type !== "custom") return;
  const idx = state.customs.findIndex((t) => t.id === state.active.id);
  if (idx < 0) state.customs.unshift(state.active);
  else state.customs[idx] = state.active;
}

function previewTokens() {
  if (state.snapshotView === "before" && state.lastSnapshot) {
    return { ...state.active, ...state.lastSnapshot.theme, name: state.active?.name };
  }
  return state.active;
}

function applyThemeVars(theme) {
  const preview = document.getElementById("preview-frame");
  if (!preview || !theme) return;
  preview.setAttribute("data-theme", String(theme.name || "mytheme").trim() || "mytheme");
  preview.style.colorScheme = theme["color-scheme"] === "dark" ? "dark" : "light";
  for (const key of THEME_VAR_KEYS) {
    if (theme[key] != null) preview.style.setProperty(key, String(theme[key]));
    else preview.style.removeProperty(key);
  }
}

/* ------------------------------ core mutations ------------------------------ */

function selectTheme(theme, { syncHash = true } = {}) {
  if (!theme) return;
  if (theme.type === "custom") {
    let obj = state.customs.find((t) => t.id === theme.id);
    if (!obj) {
      obj = theme;
      state.customs.unshift(obj);
    }
    state.active = obj;
  } else {
    state.active = cloneTheme(theme);
  }
  state.snapshotView = "after";
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  if (syncHash) writeThemeHash(state.active);
  renderAll();
}

function forkActive() {
  const src = state.active;
  const fork = cloneTheme(src);
  fork.id = uid();
  fork.type = "custom";
  fork.name = uniqueName(`${src.name} copy`);
  fork.default = false;
  fork.prefersdark = false;
  fork.baseline = serializeTheme(src);
  state.customs.unshift(fork);
  state.active = fork;
  return fork;
}

/** Token-level mutation: same handler behind every visible editor control and WebMCP. */
function mutateActive(patch, { historyKey = "edit" } = {}) {
  if (!state.active) return;
  pushHistory(historyKey);
  if (state.active.type === "builtin") forkActive();
  for (const [key, value] of Object.entries(patch)) {
    if (key === "name") {
      state.active[key] = String(value).trim();
      continue;
    }
    if (key.startsWith("--color-")) {
      // Keep the all-#RRGGBB storage contract: normalize oklch (or any other
      // valid color form) to hex exactly like normalizeTheme does on load and
      // import, so editor swatches, palette, contrast, and hash export agree.
      state.active[key] = anyColorToHex(value) ?? value;
      continue;
    }
    state.active[key] = value;
  }
  syncCustomsEntry();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  syncEditorControls();
  renderThemeLists();
  renderPalette();
  renderContrast();
  renderHarmony();
  if (exportOpen()) renderExportOutput();
}

function createTheme(rawName) {
  let name;
  if (rawName == null || String(rawName).trim() === "") {
    name = uniqueName(`mytheme-${state.customs.length + 1}`);
  } else {
    const nameError = validateThemeName(rawName);
    if (nameError) throw new Error(nameError);
    name = String(rawName).trim();
  }
  const source = state.active || defaultBuiltin();
  const theme = normalizeTheme({
    ...cloneTheme(source),
    id: uid(),
    type: "custom",
    name,
    default: false,
    prefersdark: false,
  });
  theme.baseline = serializeTheme(theme);
  state.customs.unshift(theme);
  state.active = theme;
  state.snapshotView = "after";
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll(theme.id);
  toast(`Theme "${name}" added`);
  return theme;
}

function removeThemeById(id, { animate = true } = {}) {
  const target = state.customs.find((t) => t.id === id);
  if (!target) {
    toast("Built-in themes can't be removed — duplicate one to customize it.");
    return;
  }
  pushHistory("remove");
  const finish = () => {
    if (pendingRemovals.has(id)) {
      clearTimeout(pendingRemovals.get(id));
      pendingRemovals.delete(id);
    }
    if (!state.customs.some((t) => t.id === id)) return; // already removed — never toast twice
    state.customs = state.customs.filter((t) => t.id !== id);
    if (state.active?.id === id) {
      state.active = state.customs[0] || cloneTheme(defaultBuiltin());
      state.snapshotView = "after";
      applyEditorFromActive();
    }
    applyThemeVars(previewTokens());
    writeThemeHash(state.active);
    renderAll();
    toast(`Theme "${target.name}" removed`);
  };
  if (animate) {
    const row = document.querySelector(`#my-themes .theme-row[data-id="${cssEscape(id)}"]`);
    if (row) {
      animateRowOut(row);
      if (pendingRemovals.has(id)) clearTimeout(pendingRemovals.get(id));
      pendingRemovals.set(id, setTimeout(finish, 230));
      return;
    }
  }
  finish();
}

function removeActiveTheme() {
  if (!state.active || state.active.type !== "custom") {
    toast("Built-in themes can't be removed — duplicate one to customize it.");
    return;
  }
  removeThemeById(state.active.id);
}

function duplicateActive() {
  if (!state.active) return;
  pushHistory("duplicate");
  const source = state.active;
  const copy = normalizeTheme({
    ...cloneTheme(source),
    id: uid(),
    type: "custom",
    name: uniqueName(`${source.name} copy`),
    default: false,
    prefersdark: false,
  });
  copy.baseline = serializeTheme(source);
  state.customs.unshift(copy);
  state.active = copy;
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll(copy.id);
  toast(`Duplicated as "${copy.name}"`);
  return copy;
}

function resetActive() {
  if (!state.active) return;
  pushHistory("reset");
  if (state.active.type === "builtin") {
    const pristine = state.builtins.find((t) => t.id === state.active.id) || defaultBuiltin();
    state.active = cloneTheme(pristine);
  } else {
    const { name: _ignored, ...tokens } = state.active.baseline || serializeTheme(state.active);
    Object.assign(state.active, tokens);
  }
  syncCustomsEntry();
  state.snapshotView = "after";
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll();
  toast("Theme reset to its default tokens");
}

function afterStructuralChange(message) {
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll();
  if (message) toast(message);
}

/* ------------------------------ random ------------------------------ */

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randHex(lMin, lMax, cMin, cMax) {
  return oklchToHex(rand(lMin, lMax) / 100, rand(cMin, cMax), Math.floor(Math.random() * 360));
}

function contentFor(faceHex, scheme) {
  const { l } = hexToOklch(faceHex);
  return l > 0.58
    ? randHex(scheme === "dark" ? 12 : 15, scheme === "dark" ? 20 : 28, 0, 0.05)
    : randHex(92, 99, 0, 0.04);
}

function randomizeTheme() {
  if (!state.active) return;
  pushHistory("random");
  if (state.active.type === "builtin") forkActive();
  const scheme = Math.random() > 0.5 ? "light" : "dark";
  const p = { "color-scheme": scheme };
  if (scheme === "light") {
    p["--color-base-100"] = randHex(96, 100, 0, 0.02);
    p["--color-base-200"] = randHex(91, 96, 0, 0.03);
    p["--color-base-300"] = randHex(85, 91, 0, 0.04);
    p["--color-base-content"] = randHex(16, 28, 0, 0.05);
  } else {
    p["--color-base-100"] = randHex(14, 22, 0, 0.03);
    p["--color-base-200"] = randHex(19, 27, 0, 0.04);
    p["--color-base-300"] = randHex(25, 33, 0, 0.05);
    p["--color-base-content"] = randHex(88, 97, 0, 0.03);
  }
  for (const face of ["--color-primary", "--color-secondary", "--color-accent"]) {
    const hex = randHex(38, 82, 0.08, 0.26);
    p[face] = hex;
    p[`${face}-content`] = contentFor(hex, scheme);
  }
  const neutral = randHex(scheme === "light" ? 18 : 30, scheme === "light" ? 30 : 42, 0, 0.07);
  p["--color-neutral"] = neutral;
  p["--color-neutral-content"] = contentFor(neutral, scheme);
  for (const [face, lRange, cRange] of [
    ["--color-info", [58, 80], [0.09, 0.2]],
    ["--color-success", [58, 80], [0.1, 0.22]],
    ["--color-warning", [70, 88], [0.11, 0.21]],
    ["--color-error", [52, 72], [0.14, 0.25]],
  ]) {
    const hex = randHex(lRange[0], lRange[1], cRange[0], cRange[1]);
    p[face] = hex;
    p[`${face}-content`] = contentFor(hex, scheme);
  }
  Object.assign(state.active, p);
  syncCustomsEntry();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  applyEditorFromActive();
  renderThemeLists();
  renderPalette();
  renderContrast();
  renderHarmony();
  if (exportOpen()) renderExportOutput();
  toast(`Randomized — fresh ${scheme} scheme applied`);
}

/* ------------------------------ snapshots ------------------------------ */

function saveSnapshot(rawName) {
  const nameError = validateThemeName(rawName);
  if (nameError) return nameError;
  const snap = {
    id: uid(),
    name: String(rawName).trim(),
    theme: serializeTheme(state.active),
  };
  state.snapshots.unshift(snap);
  state.lastSnapshot = snap;
  state.snapshotView = "after";
  renderSnapshots();
  toast(`Snapshot "${snap.name}" saved`);
  return null;
}

function restoreSnapshot(id) {
  const snap = state.snapshots.find((s) => s.id === id);
  if (!snap || !state.active) return;
  pushHistory("snapshot");
  if (state.active.type === "builtin") forkActive();
  const { name: _ignored, ...tokens } = snap.theme;
  Object.assign(state.active, tokens);
  syncCustomsEntry();
  state.lastSnapshot = snap;
  state.snapshotView = "after";
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll();
  toast(`Snapshot "${snap.name}" restored`);
}

function setSnapshotView(view) {
  state.snapshotView = view === "before" && state.lastSnapshot ? "before" : "after";
  applyThemeVars(previewTokens());
  renderSnapshots();
}

/* ------------------------------ vision mode ------------------------------ */

const VISION_MODES = ["none", "deuteranopia", "protanopia", "tritanopia"];

function setVision(mode) {
  state.vision = VISION_MODES.includes(mode) ? mode : "none";
  const frame = document.getElementById("preview-frame");
  if (frame) {
    frame.style.filter = state.vision === "none" ? "none" : `url(#vision-${state.vision})`;
  }
  const select = document.getElementById("vision-mode");
  if (select) select.value = state.vision;
}

/* ------------------------------ import / export ------------------------------ */

function importThemeDocument(input) {
  const data = validateThemeDocument(input);
  pushHistory("import");
  const activeCustom = state.active?.type === "custom" ? state.active : null;
  const theme = normalizeTheme({
    ...data,
    id: activeCustom?.id ?? uid(),
    type: "custom",
    default: activeCustom?.default ?? false,
    prefersdark: activeCustom?.prefersdark ?? false,
  });
  theme.baseline = activeCustom?.baseline || serializeTheme(theme);
  const idx = state.customs.findIndex((t) => t.id === theme.id);
  if (idx >= 0) state.customs[idx] = theme;
  else state.customs.unshift(theme);
  state.active = theme;
  state.snapshotView = "after";
  applyEditorFromActive();
  applyThemeVars(previewTokens());
  writeThemeHash(state.active);
  renderAll();
  return theme;
}

let modalLastFocus = null;

function exportOpen() {
  return document.getElementById("css-modal")?.classList.contains("open") || false;
}

function formatLabel(format) {
  return format === "css" ? "CSS" : format === "json" ? "Theme JSON" : "theme-extension";
}

function renderExportOutput() {
  const out = document.getElementById("css-output");
  if (!out) return;
  const raw = serializeTheme(state.active);
  if (state.exportFormat === "css") out.textContent = themeToCss(raw);
  else if (state.exportFormat === "json") out.textContent = JSON.stringify(raw, null, 2);
  else out.textContent = themeToExtension(raw);
  document.querySelectorAll("#export-tabs [role=tab]").forEach((t) => {
    const on = t.dataset.format === state.exportFormat;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
}

function selectExportFormat(format) {
  if (!["css", "json", "theme-extension"].includes(format)) return;
  state.exportFormat = format;
  renderExportOutput();
}

function openArtifact(format) {
  selectExportFormat(format);
  if (!exportOpen()) openCssModal();
}

function openCssModal() {
  const importModal = document.getElementById("import-modal");
  if (importModal.classList.contains("open")) closeModal(importModal);
  modalLastFocus = document.activeElement;
  renderExportOutput();
  const modal = document.getElementById("css-modal");
  modal.classList.add("open");
  modal.querySelector("#css-close")?.focus();
}

function closeModal(modal) {
  modal.classList.remove("open");
  if (modalLastFocus && typeof modalLastFocus.focus === "function") {
    modalLastFocus.focus();
  }
  modalLastFocus = null;
}

function closeCssModal() {
  closeModal(document.getElementById("css-modal"));
}

function trapFocus(e) {
  const modal = e.currentTarget;
  if (!modal.classList.contains("open")) return;
  if (e.key === "Tab") {
    const focusable = [
      ...modal.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
}

async function copyCss() {
  const text = document.getElementById("css-output").textContent;
  const btn = document.getElementById("css-copy");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    if (!ok) {
      toast("Copy failed — select the text manually");
      return false;
    }
  }
  if (btn) {
    btn.textContent = "Copied ✓";
    btn.classList.add("btn-confirm");
    clearTimeout(copyCss._t);
    copyCss._t = setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("btn-confirm");
    }, 1200);
  }
  toast(`Copied ${formatLabel(state.exportFormat)} to clipboard`);
  return true;
}

function copyArtifact(format) {
  selectExportFormat(format);
  return copyCss();
}

function downloadExport() {
  const text = document.getElementById("css-output").textContent;
  const ext =
    state.exportFormat === "json"
      ? "json"
      : state.exportFormat === "theme-extension"
        ? "theme.css"
        : "css";
  const blob = new Blob([text], {
    type: state.exportFormat === "json" ? "application/json" : "text/css",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileSlug(state.active?.name)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Downloaded ${fileSlug(state.active?.name)}.${ext}`);
}

function openImportModal() {
  const cssModal = document.getElementById("css-modal");
  if (cssModal.classList.contains("open")) closeModal(cssModal);
  modalLastFocus = document.activeElement;
  const input = document.getElementById("import-input");
  input.value = "";
  input.setAttribute("aria-invalid", "false");
  const err = document.getElementById("import-error");
  err.textContent = "";
  const modal = document.getElementById("import-modal");
  modal.classList.add("open");
  input.focus();
}

function closeImportModal() {
  closeModal(document.getElementById("import-modal"));
}

function submitImport() {
  const inputElement = document.getElementById("import-input");
  const err = document.getElementById("import-error");
  const raw = inputElement.value;
  err.textContent = "";
  err.hidden = true;
  inputElement.setAttribute("aria-invalid", "false");
  if (!raw.trim()) {
    err.textContent = "Import: paste a Theme JSON document first — nothing was changed.";
    err.hidden = false;
    inputElement.setAttribute("aria-invalid", "true");
    return;
  }
  try {
    const imported = importThemeDocument(raw);
    closeImportModal();
    toast(`Theme "${imported.name}" imported`);
  } catch (e) {
    err.textContent = `Import: ${e instanceof Error ? e.message : "invalid theme document"}`;
    err.hidden = false;
    inputElement.setAttribute("aria-invalid", "true");
  }
}

/* ------------------------------ hash payload ------------------------------ */

function seedFromPayload(decoded) {
  const valid = validateThemeDocument(decoded);
  const match = allThemes().find((t) => t.name === valid.name);
  if (match && match.type === "builtin") {
    return { ...cloneTheme(match), ...valid };
  }
  if (match) {
    Object.assign(match, normalizeTheme({ ...match, ...valid }));
    return match;
  }
  const base = serializeTheme(defaultBuiltin());
  const theme = normalizeTheme({
    ...base,
    ...valid,
    id: uid(),
    type: "custom",
    default: false,
    prefersdark: false,
  });
  theme.baseline = { ...valid };
  state.customs.unshift(theme);
  return theme;
}

function resetToSeed() {
  state.customs = [];
  state.snapshots = [];
  state.lastSnapshot = null;
  state.snapshotView = "after";
  history.undo.length = 0;
  history.redo.length = 0;
  setVision("none");
  updateUndoRedoButtons();
  renderSnapshots();
}

function onHashChange() {
  const hasPayload = hashHasThemePayload();
  const decoded = readThemeHash();
  if (hasPayload && !decoded) {
    resetToSeed();
    selectTheme(cloneTheme(defaultBuiltin()), { syncHash: false });
    clearThemeHash();
    return;
  }
  if (!decoded) return;
  try {
    const theme = seedFromPayload(decoded);
    selectTheme(theme, { syncHash: false });
    writeThemeHash(state.active);
  } catch {
    resetToSeed();
    selectTheme(cloneTheme(defaultBuiltin()), { syncHash: false });
    clearThemeHash();
  }
}

/* ------------------------------ rendering ------------------------------ */

function cssEscape(value) {
  return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
}

function sanitizeCssValue(value) {
  return String(value ?? "").replace(/[;<>{}]/g, "").slice(0, 120);
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1800);
}

function animateRowOut(el) {
  el.style.height = `${el.offsetHeight}px`;
  void el.offsetHeight;
  el.classList.add("row-exit");
  el.style.height = "0px";
}

function makeRow(theme, enterId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-row";
  btn.dataset.id = theme.id;
  const isActive = state.active?.id === theme.id;
  if (isActive) {
    btn.classList.add("active");
    btn.setAttribute("aria-current", "true");
  }
  if (theme.id === enterId) btn.classList.add("row-enter");

  const swatches = document.createElement("span");
  swatches.className = "swatches";
  swatches.setAttribute("aria-hidden", "true");
  for (const token of ["--color-primary", "--color-secondary", "--color-accent", "--color-neutral"]) {
    const i = document.createElement("i");
    i.style.background = sanitizeCssValue(theme[token]);
    swatches.appendChild(i);
  }

  const name = document.createElement("span");
  name.className = "theme-name";
  name.textContent = theme.name;
  name.title = theme.name;

  btn.append(swatches, name);
  return btn;
}

function renderThemeLists(enterId = null) {
  const mine = document.getElementById("my-themes");
  const built = document.getElementById("builtin-themes");
  if (!mine || !built) return;
  mine.replaceChildren();
  built.replaceChildren();

  if (!state.customs.length) {
    const hint = document.createElement("p");
    hint.className = "hint empty-hint";
    hint.textContent = "No custom themes yet. Hold “Hold to add theme” for a moment to create your first one.";
    mine.appendChild(hint);
  } else {
    for (const t of state.customs) mine.appendChild(makeRow(t, enterId));
  }
  for (const t of state.builtins) built.appendChild(makeRow(t, enterId));

  const counter = document.getElementById("my-themes-count");
  if (counter) counter.textContent = String(state.customs.length);
}

function applyEditorFromActive() {
  const theme = state.active;
  if (!theme) return;
  const nameInput = document.getElementById("theme-name");
  if (nameInput && document.activeElement !== nameInput) nameInput.value = theme.name;
  clearThemeNameError();
  renderEditor();
}

function clearThemeNameError() {
  const input = document.getElementById("theme-name");
  const errorElement = document.getElementById("theme-name-error");
  if (input) input.setAttribute("aria-invalid", "false");
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.hidden = true;
  }
}

function renderEditor() {
  const theme = state.active;
  if (!theme) return;

  document.getElementById("opt-default").checked = !!theme.default;
  document.getElementById("opt-prefersdark").checked = !!theme.prefersdark;
  document.getElementById("opt-darkscheme").checked = theme["color-scheme"] === "dark";

  const colors = document.getElementById("color-controls");
  colors.replaceChildren();
  for (const [face, content] of COLOR_PAIRS) {
    const row = document.createElement("div");
    row.className = "color-row";

    const label = document.createElement("label");
    label.textContent = COLOR_LABELS[face] || face;
    const faceId = `face-${face.replace(/[^a-z0-9-]/gi, "")}`;

    const swatchLabel = document.createElement("label");
    swatchLabel.className = "swatch-input";
    swatchLabel.htmlFor = faceId;
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = faceId;
    colorInput.dataset.token = face;
    colorInput.value = anyColorToHex(theme[face]) || "#000000";
    colorInput.setAttribute("aria-label", `${COLOR_LABELS[face]} face color`);
    swatchLabel.appendChild(colorInput);

    const contentBtn = document.createElement("button");
    contentBtn.type = "button";
    contentBtn.className = "content-badge";
    contentBtn.dataset.token = content;
    contentBtn.dataset.face = face;
    contentBtn.textContent = "A";
    contentBtn.setAttribute(
      "aria-label",
      `${(COLOR_LABELS[face] || face)} content color — open picker`
    );

    row.append(label, swatchLabel, contentBtn);
    colors.appendChild(row);
  }

  const radiusHost = document.getElementById("radius-controls");
  radiusHost.replaceChildren();
  for (const [token, title, hint, values] of RADIUS) {
    radiusHost.appendChild(buildChoiceGroup(token, title, hint, values, values));
  }

  const effectHost = document.getElementById("effect-controls");
  effectHost.replaceChildren();
  for (const [token, title, hint] of EFFECTS) {
    effectHost.appendChild(buildChoiceGroup(token, title, hint, ["0", "1"], ["Off", "On"]));
  }

  const sizeHost = document.getElementById("size-controls");
  sizeHost.replaceChildren();
  for (const [token, title, hint, values, labels] of SIZES) {
    sizeHost.appendChild(buildChoiceGroup(token, title, hint, values, labels));
  }
  sizeHost.appendChild(buildChoiceGroup("--border", "Border width", "All components", BORDERS, BORDERS));

  syncEditorControls();
  renderContrast();
  renderHarmony();
  renderSnapshots();
}

function buildChoiceGroup(token, title, hint, values, labels) {
  const group = document.createElement("div");
  group.className = "choice-group";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", title);
  const head = document.createElement("p");
  head.className = "choice-title";
  head.textContent = title;
  const sub = document.createElement("p");
  sub.className = "hint";
  sub.textContent = hint;
  const row = document.createElement("div");
  row.className = "choice-row";
  values.forEach((v, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.dataset.choiceToken = token;
    b.dataset.choiceValue = v;
    b.title = v;
    b.setAttribute("aria-label", `${title}: ${labels[i]} (${v})`);
    b.setAttribute("aria-pressed", "false");
    if (token.startsWith("--radius")) {
      const box = document.createElement("span");
      box.className = "preview-box";
      box.style.borderRadius = v;
      b.appendChild(box);
    } else {
      b.textContent = labels[i];
    }
    row.appendChild(b);
  });
  group.append(head, sub, row);
  return group;
}

function syncEditorControls() {
  const theme = state.active;
  if (!theme) return;

  document.querySelectorAll("#color-controls input[type=color]").forEach((inp) => {
    if (document.activeElement !== inp) inp.value = anyColorToHex(theme[inp.dataset.token]) || "#000000";
  });
  document.querySelectorAll("#color-controls .content-badge").forEach((btn) => {
    btn.style.background = sanitizeCssValue(theme[btn.dataset.token]);
    btn.style.color = sanitizeCssValue(theme[btn.dataset.face]);
  });
  document.querySelectorAll(".choice[data-choice-token]").forEach((btn) => {
    const on = String(theme[btn.dataset.choiceToken]) === btn.dataset.choiceValue;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  document.getElementById("opt-default").checked = !!theme.default;
  document.getElementById("opt-prefersdark").checked = !!theme.prefersdark;
  document.getElementById("opt-darkscheme").checked = theme["color-scheme"] === "dark";

  const nameInput = document.getElementById("theme-name");
  if (nameInput && document.activeElement !== nameInput) nameInput.value = theme.name;
}

function renderPalette() {
  const theme = state.active;
  const host = document.getElementById("palette-grid");
  if (!host || !theme) return;
  const keys = [
    "--color-base-100", "--color-base-200", "--color-base-300", "--color-base-content",
    "--color-primary", "--color-primary-content", "--color-secondary", "--color-secondary-content",
    "--color-accent", "--color-accent-content", "--color-neutral", "--color-neutral-content",
    "--color-info", "--color-success", "--color-warning", "--color-error",
  ];
  host.replaceChildren();
  for (const k of keys) {
    const swatch = document.createElement("div");
    swatch.className = "palette-swatch";
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.background = sanitizeCssValue(theme[k]);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.append(document.createTextNode(k.replace("--color-", "")));
    meta.append(document.createElement("br"));
    const code = document.createElement("code");
    code.textContent = String(theme[k] ?? "");
    meta.append(code);
    swatch.append(chip, meta);
    host.appendChild(swatch);
  }
}

function renderContrast() {
  const host = document.getElementById("contrast-rows");
  const theme = state.active;
  if (!host || !theme) return;
  host.replaceChildren();
  for (const [face, content] of COLOR_PAIRS) {
    const ratio = contrastRatio(theme[face], theme[content]);
    const row = document.createElement("div");
    row.className = "contrast-row" + (ratio < 4.5 ? " contrast-fail" : "");

    const name = document.createElement("span");
    name.className = "contrast-name";
    name.textContent = `${COLOR_LABELS[face]} / ${content.replace("--color-", "")}`;

    const value = document.createElement("span");
    value.className = "contrast-ratio";
    value.textContent = `${ratio.toFixed(2)}:1`;

    const badges = document.createElement("span");
    badges.className = "contrast-badges";
    for (const [level, threshold] of [["AA", 4.5], ["AAA", 7]]) {
      const badge = document.createElement("span");
      const pass = ratio >= threshold;
      badge.className = `cbadge ${pass ? "pass" : "fail"}`;
      badge.textContent = `${level} ${pass ? "pass" : "fail"}`;
      badges.appendChild(badge);
    }
    row.append(name, value, badges);
    host.appendChild(row);
  }
}

function renderHarmony() {
  const host = document.getElementById("harmony-controls");
  const theme = state.active;
  if (!host || !theme) return;
  const primary = anyColorToHex(theme["--color-primary"]) || "#4f46e5";
  const { l, c, h } = hexToOklch(primary);
  const useC = Math.max(c, 0.11);
  const suggestions = [
    { label: "Complement", hue: (h + 180) % 360 },
    { label: "Analogous", hue: (h + 30) % 360 },
    { label: "Triadic", hue: (h + 120) % 360 },
  ];
  host.replaceChildren();

  const wheel = document.createElement("div");
  wheel.className = "hue-wheel";
  wheel.setAttribute("aria-hidden", "true");
  const marker = document.createElement("span");
  marker.className = "hue-marker";
  marker.style.transform = `rotate(${h}deg)`;
  wheel.appendChild(marker);
  host.appendChild(wheel);

  const chips = document.createElement("div");
  chips.className = "harmony-chips";
  for (const s of suggestions) {
    const hex = oklchToHex(clamp(l, 0.3, 0.75), useC, s.hue);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "harmony-chip";
    btn.dataset.harmonyHex = hex;
    btn.dataset.harmonyLabel = s.label;
    const dot = document.createElement("i");
    dot.style.background = hex;
    const text = document.createElement("span");
    text.textContent = s.label;
    btn.append(dot, text);
    btn.title = `Set primary to ${hex}`;
    chips.appendChild(btn);
  }
  host.appendChild(chips);
}

function renderSnapshots() {
  const host = document.getElementById("snapshot-list");
  if (!host) return;
  host.replaceChildren();
  if (!state.snapshots.length) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "No snapshots yet — save one to compare edits with Before / After.";
    host.appendChild(hint);
  } else {
    for (const snap of state.snapshots) {
      const row = document.createElement("div");
      row.className = "snapshot-row";
      const name = document.createElement("span");
      name.className = "snapshot-name";
      name.textContent = snap.name;
      name.title = snap.name;
      const restore = document.createElement("button");
      restore.type = "button";
      restore.className = "btn btn-sm";
      restore.dataset.snapshotId = snap.id;
      restore.textContent = "Restore";
      row.append(name, restore);
      host.appendChild(row);
    }
  }
  const before = document.getElementById("ba-before");
  const after = document.getElementById("ba-after");
  if (before && after) {
    const canBefore = !!state.lastSnapshot;
    before.disabled = !canBefore;
    before.setAttribute("aria-pressed", String(state.snapshotView === "before" && canBefore));
    after.setAttribute("aria-pressed", String(!(state.snapshotView === "before" && canBefore)));
  }
}

function renderAll(enterId = null) {
  renderThemeLists(enterId);
  renderEditor();
  renderPalette();
  updateUndoRedoButtons();
  if (exportOpen()) renderExportOutput();
}

/* ------------------------------ wiring ------------------------------ */

function wireHoldToAdd() {
  const btn = document.getElementById("hold-add");
  if (!btn) return;
  const HOLD_MS = 700;
  let raf = null;
  let start = 0;
  let holding = false;

  const tick = () => {
    if (!holding) return;
    const p = Math.min(1, (performance.now() - start) / HOLD_MS);
    btn.style.setProperty("--hold-progress", `${(p * 100).toFixed(1)}%`);
    if (p >= 1) {
      holding = false;
      btn.classList.remove("holding");
      btn.classList.add("hold-done");
      setTimeout(() => btn.classList.remove("hold-done"), 500);
      btn.style.setProperty("--hold-progress", "0%");
      try {
        pushHistory("create");
        createTheme(null);
      } catch {
        /* create cannot fail with an auto name */
      }
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const begin = (e) => {
    if (e.type === "keydown") {
      if (e.repeat || (e.key !== " " && e.key !== "Enter")) return;
      e.preventDefault();
    } else if (e.button !== undefined && e.button !== 0) {
      return;
    } else {
      e.preventDefault();
    }
    if (holding) return;
    holding = true;
    start = performance.now();
    btn.classList.add("holding");
    btn.style.setProperty("--hold-progress", "0%");
    raf = requestAnimationFrame(tick);
  };

  const end = () => {
    if (!holding) return;
    holding = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    btn.classList.remove("holding");
    btn.style.setProperty("--hold-progress", "0%");
  };

  btn.addEventListener("mousedown", begin);
  btn.addEventListener("touchstart", begin, { passive: false });
  btn.addEventListener("keydown", begin);
  for (const ev of ["mouseup", "mouseleave", "touchend", "touchcancel", "blur"]) {
    btn.addEventListener(ev, end);
  }
  btn.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") end();
  });
}

function wirePreviewTabs() {
  const tabs = [...document.querySelectorAll("#preview-tabs [role=tab]")];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
    tab.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j != null) {
        e.preventDefault();
        tabs[j].focus();
        setTab(tabs[j].dataset.tab);
      }
    });
  });
}

function setTab(name) {
  state.tab = name;
  document.querySelectorAll("#preview-tabs [role=tab]").forEach((t) => {
    const on = t.dataset.tab === name;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll(".preview-pane").forEach((p) => {
    p.classList.toggle("active", p.id === `pane-${name}`);
  });
}

function wireExportTabs() {
  const tabs = [...document.querySelectorAll("#export-tabs [role=tab]")];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectExportFormat(tab.dataset.format));
    tab.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (j != null) {
        e.preventDefault();
        tabs[j].focus();
        selectExportFormat(tabs[j].dataset.format);
      }
    });
  });
}

function wireChrome() {
  document.querySelectorAll("[data-dropdown]").forEach((wrap) => {
    const trigger = wrap.querySelector("[data-dropdown-trigger]");
    const panel = wrap.querySelector(".dropdown-panel");
    const items = () => [...panel.querySelectorAll("button")];

    const setOpen = (open) => {
      wrap.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };

    trigger.addEventListener("click", () => {
      const willOpen = !wrap.classList.contains("open");
      document.querySelectorAll(".dropdown.open").forEach((d) => {
        if (d !== wrap) {
          d.classList.remove("open");
          d.querySelector("[data-dropdown-trigger]")?.setAttribute("aria-expanded", "false");
        }
      });
      setOpen(willOpen);
      if (willOpen) items()[0]?.focus();
    });
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        items()[0]?.focus();
      }
    });
    panel.addEventListener("keydown", (e) => {
      const list = items();
      const idx = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        list[(idx + 1) % list.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        list[(idx - 1 + list.length) % list.length]?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        trigger.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    });
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const group = btn.closest(".dropdown-panel");
      group.querySelectorAll("button").forEach((b) => {
        b.classList.remove("active");
        b.removeAttribute("aria-current");
      });
      btn.classList.add("active");
      if (btn.dataset.chromeTheme) {
        btn.setAttribute("aria-current", "true");
        applyChromeTheme(btn.dataset.chromeTheme);
      } else {
        btn.setAttribute("aria-current", "true");
        trigger.textContent = btn.textContent.trim();
      }
      setOpen(false);
      trigger.focus();
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((d) => {
        d.classList.remove("open");
        d.querySelector("[data-dropdown-trigger]")?.setAttribute("aria-expanded", "false");
      });
    }
  });
}

function applyChromeTheme(name) {
  const allowed = new Set(["light", "dark", "cupcake", "synthwave"]);
  const theme = allowed.has(name) ? name : "dark";
  state.chrome = theme;
  document.documentElement.setAttribute("data-chrome", theme);
  document.documentElement.style.colorScheme =
    theme === "dark" || theme === "synthwave" ? "dark" : "light";
  document.querySelectorAll("[data-chrome-theme]").forEach((b) => {
    const on = b.dataset.chromeTheme === theme;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "true");
    else b.removeAttribute("aria-current");
  });
}

function wireEditor() {
  const panel = document.getElementById("editor-panel");

  panel.addEventListener("click", (e) => {
    const choice = e.target.closest(".choice[data-choice-token]");
    if (choice) {
      mutateActive(
        { [choice.dataset.choiceToken]: choice.dataset.choiceValue },
        { historyKey: choice.dataset.choiceToken }
      );
      return;
    }
    const badge = e.target.closest(".content-badge");
    if (badge) {
      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = anyColorToHex(state.active[badge.dataset.token]) || "#000000";
      picker.setAttribute("aria-label", badge.getAttribute("aria-label") || "content color");
      picker.style.position = "fixed";
      picker.style.opacity = "0";
      picker.style.pointerEvents = "none";
      const apply = () => {
        mutateActive({ [badge.dataset.token]: picker.value }, { historyKey: badge.dataset.token });
      };
      picker.addEventListener("input", apply);
      picker.addEventListener("change", () => setTimeout(() => picker.remove(), 0));
      document.body.appendChild(picker);
      picker.focus();
      picker.click();
      return;
    }
    const harmony = e.target.closest(".harmony-chip");
    if (harmony) {
      mutateActive({ "--color-primary": harmony.dataset.harmonyHex }, { historyKey: "harmony" });
      toast(`${harmony.dataset.harmonyLabel} primary applied`);
    }
  });

  const colorHost = document.getElementById("color-controls");
  colorHost.addEventListener("input", (e) => {
    const input = e.target.closest('input[type="color"]');
    if (!input) return;
    mutateActive({ [input.dataset.token]: input.value }, { historyKey: `color:${input.dataset.token}` });
  });

  /* Keyboard nudging: arrows tune the focused color (bonus alternate token input). */
  colorHost.addEventListener("keydown", (e) => {
    const input = e.target.closest('input[type="color"]');
    if (!input) return;
    const deltas = {
      ArrowUp: [0.04, 0],
      ArrowDown: [-0.04, 0],
      ArrowRight: [0, 10],
      ArrowLeft: [0, -10],
    };
    if (!(e.key in deltas)) return;
    e.preventDefault();
    const mult = e.shiftKey ? 2.5 : 1;
    const [dL, dH] = deltas[e.key];
    const next = nudgeHex(input.value, dL * mult, dH * mult);
    input.value = next;
    mutateActive({ [input.dataset.token]: next }, { historyKey: `nudge:${input.dataset.token}` });
  });

  const nameInput = document.getElementById("theme-name");
  nameInput.addEventListener("input", () => {
    const error = validateThemeName(nameInput.value);
    const errorElement = document.getElementById("theme-name-error");
    nameInput.setAttribute("aria-invalid", error ? "true" : "false");
    errorElement.textContent = error || "";
    errorElement.hidden = !error;
    if (error) return;
    mutateActive({ name: nameInput.value }, { historyKey: "rename" });
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const error = validateThemeName(nameInput.value);
      if (!error) toast(`Renamed to "${nameInput.value.trim()}"`);
    }
  });

  document.getElementById("btn-undo").addEventListener("click", undo);
  document.getElementById("btn-redo").addEventListener("click", redo);
  document.getElementById("btn-random").addEventListener("click", randomizeTheme);
  document.getElementById("btn-export").addEventListener("click", () => openCssModal());
  document.getElementById("btn-import").addEventListener("click", openImportModal);
  document.getElementById("btn-duplicate").addEventListener("click", duplicateActive);
  document.getElementById("btn-reset").addEventListener("click", resetActive);
  document.getElementById("btn-remove").addEventListener("click", removeActiveTheme);

  document.getElementById("css-close").addEventListener("click", closeCssModal);
  document.getElementById("css-copy").addEventListener("click", copyCss);
  document.getElementById("css-download").addEventListener("click", downloadExport);
  document.getElementById("css-modal").addEventListener("click", (e) => {
    if (e.target.id === "css-modal") closeCssModal();
  });
  document.getElementById("css-modal").addEventListener("keydown", trapFocus);

  document.getElementById("import-close").addEventListener("click", closeImportModal);
  document.getElementById("import-submit").addEventListener("click", submitImport);
  document.getElementById("import-modal").addEventListener("click", (e) => {
    if (e.target.id === "import-modal") closeImportModal();
  });
  document.getElementById("import-modal").addEventListener("keydown", trapFocus);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("import-modal").classList.contains("open")) closeImportModal();
    else if (document.getElementById("css-modal").classList.contains("open")) closeCssModal();
  });

  document.getElementById("opt-default").addEventListener("change", (e) => {
    mutateActive({ default: e.target.checked }, { historyKey: "option" });
  });
  document.getElementById("opt-prefersdark").addEventListener("change", (e) => {
    mutateActive({ prefersdark: e.target.checked }, { historyKey: "option" });
  });
  document.getElementById("opt-darkscheme").addEventListener("change", (e) => {
    mutateActive({ "color-scheme": e.target.checked ? "dark" : "light" }, { historyKey: "option" });
  });

  document.getElementById("save-snapshot").addEventListener("click", () => {
    const input = document.getElementById("snapshot-name");
    const errEl = document.getElementById("snapshot-name-error");
    const error = saveSnapshot(input.value);
    if (error) {
      errEl.textContent = error;
      errEl.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      errEl.textContent = "";
      errEl.hidden = true;
      input.setAttribute("aria-invalid", "false");
      input.value = "";
    }
  });

  document.getElementById("snapshot-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-snapshot-id]");
    if (btn) restoreSnapshot(btn.dataset.snapshotId);
  });

  document.getElementById("ba-before").addEventListener("click", () => setSnapshotView("before"));
  document.getElementById("ba-after").addEventListener("click", () => setSnapshotView("after"));

  document.getElementById("vision-mode").addEventListener("change", (e) => {
    setVision(e.target.value);
  });

  const themesPanel = document.getElementById("themes-panel");
  themesPanel.addEventListener("click", (e) => {
    const row = e.target.closest(".theme-row");
    if (!row) return;
    const theme = findThemeById(row.dataset.id);
    if (theme) selectTheme(theme);
  });
}

function wireNavBlockers() {
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
}

/* ------------------------------ coachmark tour ------------------------------ */

function maybeStartTour() {
  const tour = document.getElementById("coachmark");
  if (!tour) return;
  const steps = [
    {
      sel: "#hold-add",
      title: "Hold to add a theme",
      body: "Press and hold this button for about a second — the progress sweep creates a custom theme you can fully edit.",
    },
    {
      sel: "#color-controls",
      title: "Tune every token",
      body: "Colors, radius, effects, and sizes retheme the live preview instantly. Tip: focus a color swatch and use the arrow keys to nudge its value.",
    },
    {
      sel: "#preview-tabs",
      title: "Preview, compare, export",
      body: "Switch demo tabs, simulate color vision, flip Before / After on snapshots, then Export CSS, Theme JSON, or a theme-extension.",
    },
  ];
  let i = 0;
  const card = tour.querySelector(".coach-card");
  const spot = tour.querySelector(".coach-spotlight");
  const titleEl = tour.querySelector(".coach-title");
  const bodyEl = tour.querySelector(".coach-body");
  const dotsEl = tour.querySelector(".coach-dots");
  const backBtn = tour.querySelector(".coach-back");
  const nextBtn = tour.querySelector(".coach-next");
  const skipBtn = tour.querySelector(".coach-skip");

  function position() {
    const step = steps[i];
    const target = document.querySelector(step.sel);
    if (!target) return;
    const r = target.getBoundingClientRect();
    spot.style.top = `${r.top - 6}px`;
    spot.style.left = `${r.left - 6}px`;
    spot.style.width = `${r.width + 12}px`;
    spot.style.height = `${r.height + 12}px`;
    titleEl.textContent = step.title;
    bodyEl.textContent = step.body;
    dotsEl.replaceChildren();
    steps.forEach((_, d) => {
      const dot = document.createElement("i");
      if (d === i) dot.className = "on";
      dotsEl.appendChild(dot);
    });
    const below = r.bottom + 12;
    const cardTop = below + 300 < window.innerHeight ? below : Math.max(12, r.top - 190);
    card.style.top = `${cardTop}px`;
    card.style.left = `${clamp(r.left, 12, window.innerWidth - 320)}px`;
    backBtn.style.visibility = i === 0 ? "hidden" : "visible";
    nextBtn.textContent = i === steps.length - 1 ? "Done" : "Next";
  }

  function close() {
    tour.hidden = true;
    window.removeEventListener("resize", position);
  }

  nextBtn.addEventListener("click", () => {
    if (i >= steps.length - 1) close();
    else {
      i += 1;
      position();
    }
  });
  backBtn.addEventListener("click", () => {
    if (i > 0) {
      i -= 1;
      position();
    }
  });
  skipBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !tour.hidden) close();
  });
  window.addEventListener("resize", position);

  setTimeout(() => {
    tour.hidden = false;
    position();
  }, 700);
}

/* ------------------------------ boot ------------------------------ */

function boot() {
  try {
    wireNavBlockers();
    wireChrome();
    wireHoldToAdd();
    wirePreviewTabs();
    wireExportTabs();
    wireEditor();

    applyChromeTheme("dark");

    const hasPayload = hashHasThemePayload();
    const decoded = readThemeHash();
    if (hasPayload && !decoded) {
      resetToSeed();
      selectTheme(cloneTheme(defaultBuiltin()), { syncHash: false });
      clearThemeHash();
    } else if (decoded) {
      try {
        const theme = seedFromPayload(decoded);
        selectTheme(theme, { syncHash: false });
        writeThemeHash(state.active);
      } catch {
        resetToSeed();
        selectTheme(cloneTheme(defaultBuiltin()), { syncHash: false });
        clearThemeHash();
      }
    } else {
      selectTheme(cloneTheme(defaultBuiltin()));
    }

    window.addEventListener("hashchange", onHashChange);
  } catch {
    /* never let a startup hiccup take down the session or the WebMCP surface */
  } finally {
    registerWebMCP({
      state,
      mutateActive,
      selectTheme,
      createTheme,
      removeThemeById,
      importThemeDocument,
      openArtifact,
      copyArtifact,
      validateThemeName,
      validateThemeDocument,
      serializeTheme,
    });
    window.__themeBuilderReady = true;
    maybeStartTour();
  }
}

boot();
