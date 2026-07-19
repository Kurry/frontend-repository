import { createStore } from "solid-js/store";
import { THEMES, type ThemeName } from "./data/themes";
import { BITMAPS, type IconSet } from "./data/bitmaps";

// Shared application state lives in a Solid store (in-memory reactive source of
// truth) and is mirrored to localStorage so a reload restores the wizard.

export const STEPS = [
  "Upload EuroScope executable",
  "Update theme colours",
  "Update embedded bitmaps",
  "Download new executable",
] as const;

export const STEP_COUNT = STEPS.length;

export type PatcherState = {
  step: number; // 0..3
  fileName: string; // the loaded executable (seeded sample by default)
  baseTheme: ThemeName; // selected base colour set
  swatches: number[]; // six working colours (may be customised off the base)
  iconSet: IconSet; // selected base icon set
  // per-bitmap "reset to keep original" overrides: id -> true means keep old
  keepOriginal: Record<string, boolean>;
  generated: boolean; // patched result has been generated (reached download)
};

const STORAGE_KEY = "custom-euroscope:v1";

function defaultState(): PatcherState {
  return {
    step: 0,
    fileName: "EuroScope.exe",
    baseTheme: "EuroScope",
    swatches: [...THEMES.EuroScope],
    iconSet: "vector",
    keepOriginal: {},
    generated: false,
  };
}

function loadPersisted(): PatcherState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PatcherState>;
    return {
      ...base,
      ...parsed,
      swatches:
        Array.isArray(parsed.swatches) && parsed.swatches.length === 6
          ? parsed.swatches.map((n) => Number(n) & 0xffffff)
          : base.swatches,
      keepOriginal: parsed.keepOriginal ?? {},
      step:
        typeof parsed.step === "number"
          ? Math.max(0, Math.min(STEP_COUNT - 1, parsed.step))
          : 0,
    };
  } catch {
    return base;
  }
}

const [state, setState] = createStore<PatcherState>(loadPersisted());

export { state, setState };

let persistScheduled = false;
function persist() {
  if (persistScheduled) return;
  persistScheduled = true;
  queueMicrotask(() => {
    persistScheduled = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — stay in-memory */
    }
  });
}

// ---- domain commands (the SAME code paths the visible controls call) --------

export function goNext(): boolean {
  if (state.step >= STEP_COUNT - 1) return false;
  const next = state.step + 1;
  setState("step", next);
  if (next === STEP_COUNT - 1) setState("generated", true);
  persist();
  return true;
}

export function goBack(): boolean {
  if (state.step <= 0) return false;
  setState("step", state.step - 1);
  persist();
  return true;
}

export function goToStep(step: number): boolean {
  const clamped = Math.max(0, Math.min(STEP_COUNT - 1, step));
  if (clamped === state.step) return false;
  setState("step", clamped);
  if (clamped === STEP_COUNT - 1) setState("generated", true);
  persist();
  return true;
}

export function selectTheme(name: ThemeName): void {
  setState("baseTheme", name);
  setState("swatches", [...THEMES[name]]);
  // a colour change invalidates a previously generated download
  setState("generated", false);
  persist();
}

export function setSwatch(index: number, value: number): void {
  setState("swatches", index, value & 0xffffff);
  setState("generated", false);
  persist();
}

export function selectIconSet(set: IconSet): void {
  setState("iconSet", set);
  setState("generated", false);
  persist();
}

export function toggleKeepOriginal(id: number): void {
  const key = String(id);
  setState("keepOriginal", key, !state.keepOriginal[key]);
  setState("generated", false);
  persist();
}

export function setFileName(name: string): void {
  setState("fileName", name || "EuroScope.exe");
  persist();
}

export function resetAll(): void {
  const d = defaultState();
  setState(d);
  persist();
}

export function bitmapReplaced(id: number): boolean {
  return state.iconSet === "vector" && !state.keepOriginal[String(id)];
}

export function replacedCount(): number {
  if (state.iconSet !== "vector") return 0;
  return BITMAPS.filter((b) => !state.keepOriginal[String(b.id)]).length;
}
