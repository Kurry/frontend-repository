import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";

// Bounds and ENUMS
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

export const INITIAL_PRESETS = [
  { id: "1", name: "Default", aperture: 16, shutter: 60, iso: 100, lookTag: "Base", favorite: false },
  { id: "2", name: "Portrait", aperture: 2.8, shutter: 125, iso: 200, lookTag: "People", favorite: true },
  { id: "3", name: "Action", aperture: 5.6, shutter: 1000, iso: 800, lookTag: "Sports", favorite: false },
  { id: "4", name: "Landscape", aperture: 11, shutter: 125, iso: 100, lookTag: "Nature", favorite: true },
  { id: "5", name: "Low Light", aperture: 1.8, shutter: 60, iso: 1600, lookTag: "Night", favorite: false },
  { id: "6", name: "Studio", aperture: 8, shutter: 250, iso: 100, lookTag: "Professional", favorite: false },
];

export const DEFAULT_STATE = {
  aperture: 16,
  shutter: 60,
  iso: 100,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  lookPack: null,
  scene: "Daylight Courtyard",
  zebraToggles: false,
};

const [store, setStore] = createStore({
  // Exposure settings
  aperture: DEFAULT_STATE.aperture,
  shutter: DEFAULT_STATE.shutter,
  iso: DEFAULT_STATE.iso,

  // Light sliders
  contrast: DEFAULT_STATE.contrast,
  highlights: DEFAULT_STATE.highlights,
  shadows: DEFAULT_STATE.shadows,

  // Scene & looks
  lookPack: DEFAULT_STATE.lookPack,
  scene: DEFAULT_STATE.scene,
  zebraToggles: DEFAULT_STATE.zebraToggles,

  // Bracket config
  bracketConfig: {
    count: 3,
    step: 1,
    baseName: "Bracket",
  },

  // Presets & Snapshots
  presets: [...INITIAL_PRESETS],
  snapshots: [],

  // UI State
  mode: "Meter/Lab", // "Meter/Lab" or "Presets/Compare"
  helpOpen: false,
  beforeHold: false,

  // A/B Compare
  abSlots: { A: null, B: null },
  wipePosition: 50,
});

export { store, setStore };

// Derived state
export const calcEV = (aperture, shutter, iso) => {
  const av = Math.log2(aperture ** 2);
  const tv = Math.log2(shutter);
  const sv = Math.log2(iso / 100);
  return av + tv - sv;
};

export const getBaseEV = (scene) => {
  switch (scene) {
    case "Daylight Courtyard": return 15;
    case "Alpine Midday": return 16;
    case "Stadium Floodlights": return 11;
    case "Candlelit Study": return 4;
    case "Neon Alley Night": return 7;
    default: return 15;
  }
};

export const getNetEV = () => {
  const baseEV = getBaseEV(store.scene);
  const currentEV = calcEV(store.aperture, store.shutter, store.iso);
  return baseEV - currentEV;
};

// Undo/Redo Stacks (Separate from store to avoid tracking overhead)
export const [undoStack, setUndoStack] = createSignal([]);
export const [redoStack, setRedoStack] = createSignal([]);

export const pushHistory = (state) => {
  setUndoStack([...undoStack(), state]);
  setRedoStack([]);
};

export const undo = () => {
  if (undoStack().length > 0) {
    const currentState = {
      aperture: store.aperture, shutter: store.shutter, iso: store.iso,
      contrast: store.contrast, highlights: store.highlights, shadows: store.shadows,
      lookPack: store.lookPack, scene: store.scene, zebraToggles: store.zebraToggles
    };
    const newUndo = [...undoStack()];
    const prevState = newUndo.pop();
    setUndoStack(newUndo);
    setRedoStack([...redoStack(), currentState]);
    setStore(prevState);
  }
};

export const redo = () => {
  if (redoStack().length > 0) {
    const currentState = {
      aperture: store.aperture, shutter: store.shutter, iso: store.iso,
      contrast: store.contrast, highlights: store.highlights, shadows: store.shadows,
      lookPack: store.lookPack, scene: store.scene, zebraToggles: store.zebraToggles
    };
    const newRedo = [...redoStack()];
    const nextState = newRedo.pop();
    setRedoStack(newRedo);
    setUndoStack([...undoStack(), currentState]);
    setStore(nextState);
  }
};

export const resetState = () => {
  setStore({ ...DEFAULT_STATE, abSlots: { A: null, B: null }, bracketConfig: { count: 3, step: 1, baseName: "Bracket" }});
  setUndoStack([]);
  setRedoStack([]);
};
