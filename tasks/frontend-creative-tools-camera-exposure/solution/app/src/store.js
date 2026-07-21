import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";

// ---- Discrete stop lists (exact spec values) ----
export const APERTURE_STOPS = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8];
export const SHUTTER_STOPS = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000];
export const ISO_STOPS = [50, 100, 200, 400, 800, 1600, 3200];
export const LOOK_PACKS = ["Warm", "Subtle", "Strong", "B&W"];
export const SCENES = [
  "Daylight Courtyard",
  "Alpine Midday",
  "Stadium Floodlights",
  "Candlelit Study",
  "Neon Alley Night",
];
export const SCENE_OFFSET = {
  "Daylight Courtyard": 0,
  "Alpine Midday": 2,
  "Stadium Floodlights": 1,
  "Candlelit Study": -2,
  "Neon Alley Night": -3,
};

export const DEFAULTS = Object.freeze({
  aperture: 16, shutter: 60, iso: 100,
  contrast: 0, highlights: 0, shadows: 0,
  lookPack: null, scene: "Daylight Courtyard",
});

// Look packs apply a multi-control edit state in one press.
export const LOOK_PACK_STATE = {
  Warm: { contrast: 12, highlights: -8, shadows: 6 },
  Subtle: { contrast: -10, highlights: 4, shadows: 14 },
  Strong: { contrast: 34, highlights: 22, shadows: -24 },
  "B&W": { contrast: 16, highlights: 6, shadows: -8 },
};

export const INITIAL_PRESETS = [
  { id: "p1", name: "Golden Hour Soft", aperture: 4, shutter: 125, iso: 200, lookTag: "Warm", favorite: false },
  { id: "p2", name: "Portrait", aperture: 2.8, shutter: 125, iso: 200, lookTag: "People", favorite: true },
  { id: "p3", name: "Action Freeze", aperture: 5.6, shutter: 1000, iso: 800, lookTag: "Sports", favorite: false },
  { id: "p4", name: "Landscape Deep", aperture: 11, shutter: 125, iso: 100, lookTag: "Nature", favorite: true },
  { id: "p5", name: "Night Street Grain", aperture: 1.8, shutter: 60, iso: 1600, lookTag: "Night", favorite: false },
  { id: "p6", name: "Studio Clean", aperture: 8, shutter: 250, iso: 100, lookTag: "Studio", favorite: false },
];

let _idc = 0;
export const genId = (p = "id") => `${p}-${Date.now().toString(36)}-${(++_idc).toString(36)}`;

const EDIT_KEYS = ["aperture", "shutter", "iso", "contrast", "highlights", "shadows", "lookPack", "scene"];
const snapEdit = (s) => { const o = {}; for (const k of EDIT_KEYS) o[k] = s[k]; return o; };

const [store, setStore] = createStore({
  aperture: 16, shutter: 60, iso: 100,
  contrast: 0, highlights: 0, shadows: 0,
  lookPack: null,
  scene: "Daylight Courtyard",
  highlightZebra: false,
  shadowZebra: false,
  bracket: { count: 3, step: 1, baseName: "" },
  bracketGenerated: [],
  abSlots: { A: null, B: null },
  wipe: 50,
  compareActive: false,
  snapshots: [],
  presets: INITIAL_PRESETS.map((p) => ({ ...p })),
  mode: "Meter/Lab",
  helpOpen: false,
  coachOpen: true,
  rgbHistogram: false,
  focusPeaking: false,
  beforeHold: false,
  activeDrawer: null,
  filterFav: false,
  filterTag: "",
});

export { store, setStore };

// ---- Undo / redo over edit-state mutations ----
const [undoStack, setUndoStack] = createSignal([]);
const [redoStack, setRedoStack] = createSignal([]);
export { undoStack, redoStack, setUndoStack, setRedoStack };

export const pushHistory = () => {
  setUndoStack((u) => [...u.slice(-49), snapEdit(store)]);
  setRedoStack([]);
};
export const undo = () => {
  const u = undoStack();
  if (!u.length) return;
  const prev = u[u.length - 1];
  setUndoStack(u.slice(0, -1));
  setRedoStack((r) => [...r, snapEdit(store)]);
  setStore(prev);
};
export const redo = () => {
  const r = redoStack();
  if (!r.length) return;
  const next = r[r.length - 1];
  setRedoStack(r.slice(0, -1));
  setUndoStack((u) => [...u, snapEdit(store)]);
  setStore(next);
};
// mut = () => setStore(...); records undo first, clears redo, mirrors visible UI.
export const mutate = (fn) => { pushHistory(); fn(); };

// ---- Derived exposure maths ----
export const calcEV = (a, s, i) => Math.log2(a * a) + Math.log2(s) - Math.log2(i / 100);
const DEFAULT_EV = calcEV(16, 60, 100);
export const netEV = (s = store) => (DEFAULT_EV + (SCENE_OFFSET[s.scene] || 0)) - calcEV(s.aperture, s.shutter, s.iso);
export const fmtEV = (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} EV`;
export const fmtAperture = (v) => `f/${v}`;
export const fmtShutter = (v) => `1/${v}`;

// Preview-stack mappings (continuous, monotonic with stops).
export const brightnessPct = (ev) => Math.max(8, Math.min(260, 100 * Math.pow(2, ev * 0.5)));
export const blurPx = (a) => Math.max(0, 22 / Math.pow(a, 0.92));
export const motionIndex = (s) => Math.max(0, Math.min(9, SHUTTER_STOPS.indexOf(s)));
// Grain is invisible at the ISO 100 baseline and only becomes clearly visible
// toward ISO 3200, while the photo always stays discernible (cap < 0.4).
export const noiseAlpha = (i) => Math.max(0, Math.min(0.4, Math.log2(Math.max(50, i) / 100) * 0.11));

// Clipping estimates drive zebras + histogram edge indicators.
export const clipEstimate = (s = store) => {
  const ev = netEV(s);
  const hl = Math.max(0, Math.min(1, (ev - 1.1) / 3.2 + s.highlights / 220));
  const sh = Math.max(0, Math.min(1, (-ev - 1.1) / 3.2 - s.shadows / 220));
  return { hl, sh };
};

// ---- Edit-state commands (shared by UI + WebMCP) ----
export const stepStop = (key, dir) => {
  const list = key === "aperture" ? APERTURE_STOPS : key === "shutter" ? SHUTTER_STOPS : ISO_STOPS;
  const idx = list.indexOf(store[key]);
  const next = idx + dir;
  if (next < 0 || next >= list.length) return false;
  mutate(() => setStore(key, list[next]));
  return true;
};
export const setStop = (key, value) => {
  const list = key === "aperture" ? APERTURE_STOPS : key === "shutter" ? SHUTTER_STOPS : ISO_STOPS;
  if (!list.includes(value)) return false;
  if (store[key] === value) return true;
  mutate(() => setStore(key, value));
  return true;
};
export const setSlider = (key, value) => {
  const v = Math.max(-100, Math.min(100, Math.round(Number(value) || 0)));
  if (store[key] === v) return true;
  mutate(() => setStore(key, v));
  return true;
};
export const setScene = (scene) => {
  if (!SCENES.includes(scene) || store.scene === scene) return false;
  mutate(() => setStore("scene", scene));
  return true;
};
export const applyLookPack = (pack) => {
  if (!LOOK_PACKS.includes(pack)) return false;
  mutate(() => {
    if (store.lookPack === pack) {
      setStore({ lookPack: null, contrast: 0, highlights: 0, shadows: 0 });
    } else {
      const l = LOOK_PACK_STATE[pack];
      setStore({ lookPack: pack, contrast: l.contrast, highlights: l.highlights, shadows: l.shadows });
    }
  });
  return true;
};
export const setZebra = (which, value) => setStore(which, !!value);

export const captureSlot = (slot) => {
  setStore("abSlots", slot, { ...snapEdit(store), label: slot });
};
export const setWipe = (v) => setStore("wipe", Math.max(0, Math.min(100, Number(v) || 0)));

export const saveSnapshot = (rawName) => {
  const name = (rawName || "").trim();
  if (!name) return { ok: false, error: "Enter a snapshot name to save this edit state." };
  if (name.length > 64) return { ok: false, error: "Snapshot name must be 64 characters or fewer." };
  setStore("snapshots", (s) => [...s, { id: genId("snap"), name, ...snapEdit(store) }]);
  return { ok: true };
};
export const applySnapshot = (id) => {
  const snap = store.snapshots.find((s) => s.id === id);
  if (!snap) return false;
  mutate(() => setStore(snapEdit(snap)));
  return true;
};
export const deleteSnapshot = (id) => setStore("snapshots", (s) => s.filter((x) => x.id !== id));

export const generateBracket = () => {
  const baseName = (store.bracket.baseName || "").trim();
  if (!baseName) return { ok: false, error: "Enter a bracket base name to generate the series." };
  if (baseName.length > 40) return { ok: false, error: "Bracket base name must be 40 characters or fewer." };
  const count = store.bracket.count === 5 ? 5 : 3;
  const step = store.bracket.step === 2 ? 2 : 1;
  const half = Math.floor(count / 2);
  const baseIdx = SHUTTER_STOPS.indexOf(store.shutter);
  const made = [];
  for (let i = -half; i <= half; i++) {
    const delta = i * step;
    const req = baseIdx - delta; // +EV -> faster shutter (smaller exposure)
    const idx = Math.max(0, Math.min(SHUTTER_STOPS.length - 1, req));
    const clamped = idx !== req;
    made.push({
      id: genId("brk"),
      name: `${baseName} ${delta > 0 ? "+" : ""}${delta} EV`,
      aperture: store.aperture,
      shutter: SHUTTER_STOPS[idx],
      iso: store.iso,
      lookTag: "Bracket",
      favorite: false,
      delta,
      clamped,
    });
  }
  mutate(() => {
    setStore("presets", (p) => [...p, ...made.map(({ delta, clamped, ...rest }) => rest)]);
    setStore("bracketGenerated", made);
  });
  return { ok: true, count: made.length };
};

// ---- Preset CRUD (shared) ----
export const createPreset = (data) => {
  const rec = {
    id: genId("preset"),
    name: String(data.name).slice(0, 64),
    aperture: Number(data.aperture),
    shutter: Number(data.shutter),
    iso: Number(data.iso),
    lookTag: String(data.lookTag || "Custom").slice(0, 32),
    favorite: !!data.favorite,
  };
  setStore("presets", (p) => [...p, rec]);
  return rec;
};
export const updatePreset = (id, data) => {
  if (!store.presets.some((p) => p.id === id)) return false;
  setStore("presets", (p) => p.id === id, (p) => ({
    ...p,
    name: data.name != null ? String(data.name).slice(0, 64) : p.name,
    aperture: data.aperture != null ? Number(data.aperture) : p.aperture,
    shutter: data.shutter != null ? Number(data.shutter) : p.shutter,
    iso: data.iso != null ? Number(data.iso) : p.iso,
    lookTag: data.lookTag != null ? String(data.lookTag).slice(0, 32) : p.lookTag,
    favorite: data.favorite != null ? !!data.favorite : p.favorite,
  }));
  return true;
};
export const deletePreset = (id, confirm = true) => {
  if (!confirm) return false;
  setStore("presets", (p) => p.filter((x) => x.id !== id));
  return true;
};
export const toggleFavorite = (id) => {
  if (!store.presets.some((p) => p.id === id)) return false;
  setStore("presets", (p) => p.id === id, "favorite", (f) => !f);
  return true;
};
export const applyPreset = (id) => {
  const pr = store.presets.find((p) => p.id === id);
  if (!pr) return false;
  mutate(() => {
    setStore("aperture", pr.aperture);
    setStore("shutter", pr.shutter);
    setStore("iso", pr.iso);
    setStore("lookPack", LOOK_PACKS.includes(pr.lookTag) ? pr.lookTag : store.lookPack);
  });
  return true;
};

// ---- Reset / mode / drawers ----
export const resetAll = () => {
  setStore({
    aperture: 16, shutter: 60, iso: 100,
    contrast: 0, highlights: 0, shadows: 0,
    lookPack: null, scene: "Daylight Courtyard",
    highlightZebra: false, shadowZebra: false,
    bracket: { count: 3, step: 1, baseName: "" },
    bracketGenerated: [],
    abSlots: { A: null, B: null }, wipe: 50, compareActive: false,
    snapshots: [], mode: "Meter/Lab", beforeHold: false,
    activeDrawer: null, filterFav: false, filterTag: "",
  });
  setUndoStack([]);
  setRedoStack([]);
};
export const setMode = (m) => setStore("mode", m);
export const openDrawer = (d) => setStore("activeDrawer", (cur) => (cur === d ? null : d));
export const closeDrawer = () => setStore("activeDrawer", null);
