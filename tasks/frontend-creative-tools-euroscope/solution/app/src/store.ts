import { createStore } from "solid-js/store";
import { BITMAPS, type IconSet } from "./data/bitmaps";
import { type ColourBlindness, hexToInt } from "./data/colour";
import {
  COLOUR_KEYS,
  buildRecipe,
  recipeText,
  summaryText,
  themeCssText,
  validateRecipe,
  type PatchRecipe,
} from "./data/recipe";
import { THEMES, type ThemeName } from "./data/themes";

// Shared application state lives in one Solid store — the single reactive
// source of truth. Every view (swatches, Preview, contrast matrix, tile grid,
// Export center previews) derives from it, and the WebMCP tool handlers call
// the very same commands as the visible controls.

export const STEPS = [
  "Upload EuroScope executable",
  "Update theme colours",
  "Update embedded bitmaps",
  "Download new executable",
] as const;

export const STEP_COUNT = STEPS.length;

export interface PaletteSnapshot {
  id: string;
  name: string;
  colours: number[]; // six working colours
}

type HistoryEntry = {
  baseTheme: ThemeName;
  swatches: number[];
  iconSet: IconSet;
  keepOriginal: Record<string, boolean>;
};

export type PatcherState = {
  step: number; // 0..3
  fileName: string; // the loaded executable (seeded sample by default)
  baseTheme: ThemeName; // selected base colour set
  swatches: number[]; // six working colours (may be customised off the base)
  iconSet: IconSet; // selected base icon set
  keepOriginal: Record<string, boolean>; // per-bitmap overrides: true = keep old
  selection: Record<string, boolean>; // multi-selected bitmap tiles
  snapshots: PaletteSnapshot[]; // saved palettes
  compare: { id: string; view: "before" | "after" } | null; // before/after compare
  colourBlindness: ColourBlindness; // preview simulation mode
  generated: boolean; // patched result has been generated (reached download)
  downloaded: boolean; // the EuroScope.exe download has been triggered
  activeExportTab: "recipe" | "css" | "summary";
  undoDepth: number; // exposed for the disabled state of the chrome buttons
  redoDepth: number;
};

const STORAGE_KEY = "custom-euroscope:v2";

const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];

function defaultState(): PatcherState {
  return {
    step: 0,
    fileName: "EuroScope.exe",
    baseTheme: "EuroScope",
    swatches: [...THEMES.EuroScope],
    iconSet: "vector",
    keepOriginal: {},
    selection: {},
    snapshots: [],
    compare: null,
    colourBlindness: "none",
    generated: false,
    downloaded: false,
    activeExportTab: "recipe",
    undoDepth: 0,
    redoDepth: 0,
  };
}

function sanitiseKeepOriginal(raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (raw && typeof raw === "object") {
    for (const bm of BITMAPS) {
      const v = (raw as Record<string, unknown>)[String(bm.id)];
      if (v === true) out[String(bm.id)] = true;
    }
  }
  return out;
}

function loadPersisted(): PatcherState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const swatches =
      Array.isArray(parsed.swatches) && parsed.swatches.length === 6
        ? parsed.swatches.map((n) => Number(n) & 0xffffff)
        : base.swatches;
    const snapshots: PaletteSnapshot[] = Array.isArray(parsed.snapshots)
      ? (parsed.snapshots as Array<Record<string, unknown>>)
          .filter(
            (s) =>
              typeof s.name === "string" &&
              s.name.trim().length > 0 &&
              Array.isArray(s.colours) &&
              s.colours.length === 6,
          )
          .map((s, i) => ({
            id: typeof s.id === "string" ? s.id : `snap-${i}`,
            name: s.name as string,
            colours: (s.colours as unknown[]).map((n) => Number(n) & 0xffffff),
          }))
      : [];
    return {
      ...base,
      ...parsed,
      step:
        typeof parsed.step === "number"
          ? Math.max(0, Math.min(STEP_COUNT - 1, parsed.step))
          : 0,
      fileName:
        typeof parsed.fileName === "string" && parsed.fileName
          ? parsed.fileName
          : base.fileName,
      baseTheme: THEMES[parsed.baseTheme as ThemeName]
        ? (parsed.baseTheme as ThemeName)
        : base.baseTheme,
      swatches,
      iconSet: parsed.iconSet === "none" ? "none" : "vector",
      keepOriginal: sanitiseKeepOriginal(parsed.keepOriginal),
      snapshots,
      selection: {},
      compare: null,
      colourBlindness: "none",
      generated: parsed.generated === true,
      downloaded: false,
      activeExportTab: "recipe",
      undoDepth: 0,
      redoDepth: 0,
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
      const { step, fileName, baseTheme, swatches, iconSet, keepOriginal, snapshots, generated } =
        state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, fileName, baseTheme, swatches, iconSet, keepOriginal, snapshots, generated }),
      );
    } catch {
      /* storage unavailable — stay in-memory */
    }
  });
}

// ---- undo / redo -------------------------------------------------------------

function historySnapshot(): HistoryEntry {
  return {
    baseTheme: state.baseTheme,
    swatches: [...state.swatches],
    iconSet: state.iconSet,
    keepOriginal: { ...state.keepOriginal },
  };
}

/** Record the pre-mutation state; every mutating command calls this first. */
function pushUndo() {
  undoStack.push(historySnapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  syncDepths();
}

function syncDepths() {
  setState("undoDepth", undoStack.length);
  setState("redoDepth", redoStack.length);
}

function applyHistory(entry: HistoryEntry) {
  setState("baseTheme", entry.baseTheme);
  setState("swatches", [...entry.swatches]);
  setState("iconSet", entry.iconSet);
  setState("keepOriginal", { ...entry.keepOriginal });
  setState("generated", false);
  persist();
}

export function undo(): void {
  const entry = undoStack.pop();
  if (!entry) return;
  redoStack.push(historySnapshot());
  applyHistory(entry);
  syncDepths();
}

export function redo(): void {
  const entry = redoStack.pop();
  if (!entry) return;
  undoStack.push(historySnapshot());
  applyHistory(entry);
  syncDepths();
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
  pushUndo();
  setState("baseTheme", name);
  setState("swatches", [...THEMES[name]]);
  setState("generated", false);
  persist();
}

export function setSwatch(index: number, value: number): void {
  if (index < 0 || index > 5) return;
  pushUndo();
  setState("swatches", index, value & 0xffffff);
  setState("generated", false);
  persist();
}

export function selectIconSet(set: IconSet): void {
  pushUndo();
  setState("iconSet", set);
  setState("generated", false);
  persist();
}

export function toggleKeepOriginal(id: number): void {
  pushUndo();
  const key = String(id);
  setState("keepOriginal", key, !state.keepOriginal[key]);
  setState("generated", false);
  persist();
}

export function setKeepOriginal(id: number, value: boolean): void {
  const key = String(id);
  if (Boolean(state.keepOriginal[key]) === value) return;
  pushUndo();
  setState("keepOriginal", key, value);
  setState("generated", false);
  persist();
}

/** Batch keep-original / use-vector on the multi-selection. */
export function batchKeepOriginal(value: boolean): number {
  const ids = BITMAPS.filter((b) => state.selection[String(b.id)]).map((b) => b.id);
  if (ids.length === 0) return 0;
  pushUndo();
  for (const id of ids) setState("keepOriginal", String(id), value);
  setState("selection", {});
  setState("generated", false);
  persist();
  return ids.length;
}

export function toggleTileSelected(id: number): void {
  const key = String(id);
  setState("selection", key, !state.selection[key]);
}

export function clearSelection(): void {
  setState("selection", {});
}

export function setFileName(name: string): void {
  setState("fileName", name || "EuroScope.exe");
  persist();
}

/** Reset to base: restore all six working swatches to the selected base theme. */
export function resetToBase(): void {
  pushUndo();
  setState("swatches", [...THEMES[state.baseTheme]]);
  setState("generated", false);
  persist();
}

export function setColourBlindness(mode: ColourBlindness): void {
  setState("colourBlindness", mode);
}

export function setActiveExportTab(tab: PatcherState["activeExportTab"]): void {
  setState("activeExportTab", tab);
}

// ---- palette snapshots -------------------------------------------------------

let snapCounter = 0;

export function saveSnapshot(name: string): { ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Snapshot name must not be empty." };
  }
  const snap: PaletteSnapshot = {
    id: `snap-${Date.now().toString(36)}-${snapCounter++}`,
    name: trimmed,
    colours: [...state.swatches],
  };
  setState("snapshots", (list) => [...list, snap]);
  persist();
  return { ok: true };
}

export function restoreSnapshot(id: string): boolean {
  const snap = state.snapshots.find((s) => s.id === id);
  if (!snap) return false;
  pushUndo();
  setState("swatches", [...snap.colours]);
  setState("generated", false);
  persist();
  return true;
}

export function deleteSnapshot(id: string): boolean {
  const snap = state.snapshots.find((s) => s.id === id);
  if (!snap) return false;
  setState("snapshots", (list) => list.filter((s) => s.id !== id));
  if (state.compare?.id === id) setState("compare", null);
  persist();
  return true;
}

/** Before / After compare: Before = snapshot colours, After = current edit. */
export function toggleCompare(id: string): void {
  if (state.compare?.id === id) {
    setState("compare", null);
    return;
  }
  setState("compare", { id, view: "before" });
}

/** Virtual compare reference used when no snapshot has been saved yet. */
export const BASE_COMPARE_ID = "__base__";

export function setCompareView(view: "before" | "after" | "off"): { ok: boolean; error?: string } {
  if (view === "off") {
    setState("compare", null);
    return { ok: true };
  }
  let id = state.compare?.id;
  if (!id) id = state.snapshots[state.snapshots.length - 1]?.id;
  if (!id) id = BASE_COMPARE_ID; // fall back to the base theme palette
  setState("compare", { id, view });
  return { ok: true };
}

/** The six colours the Preview panels should render (compare-aware). */
export function previewColours(): number[] {
  if (state.compare && state.compare.view === "before") {
    if (state.compare.id === BASE_COMPARE_ID) return [...THEMES[state.baseTheme]];
    const snap = state.snapshots.find((s) => s.id === state.compare!.id);
    if (snap) return snap.colours;
  }
  return state.swatches;
}

// ---- export / import ---------------------------------------------------------

function recipeInput() {
  return {
    step: state.step,
    fileName: state.fileName,
    baseTheme: state.baseTheme,
    swatches: state.swatches,
    iconSet: state.iconSet,
    keepOriginal: state.keepOriginal,
  };
}

export function currentRecipeText(): string {
  return recipeText(recipeInput());
}

export function currentThemeCssText(): string {
  return themeCssText(recipeInput());
}

export function currentSummaryText(): string {
  return summaryText(recipeInput());
}

export function exportTabText(tab: PatcherState["activeExportTab"]): string {
  if (tab === "css") return currentThemeCssText();
  if (tab === "summary") return currentSummaryText();
  return currentRecipeText();
}

export function replacedCount(): number {
  if (state.iconSet !== "vector") return 0;
  return BITMAPS.filter((b) => !state.keepOriginal[String(b.id)]).length;
}

export function bitmapReplaced(id: number): boolean {
  return state.iconSet === "vector" && !state.keepOriginal[String(id)];
}

export function selectedTileCount(): number {
  return BITMAPS.filter((b) => state.selection[String(b.id)]).length;
}

function triggerDownload(text: string, name: string, mime: string): void {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* download is a best-effort browser affordance */
  }
}

/** Same generate/download path for the visible button and WebMCP export. */
export function downloadPatched(): void {
  setState("step", STEP_COUNT - 1);
  setState("generated", true);
  const recipe = buildRecipe(recipeInput());
  const payload =
    `Custom EuroScope patched build\n` +
    `source: ${state.fileName}\n` +
    `base theme: ${recipe.baseTheme}\n` +
    `colours: ${COLOUR_KEYS.map((k) => recipe.colours[k]).join(" ")}\n` +
    `icon set: ${recipe.iconSet} (${replacedCount()}/${BITMAPS.length} replaced)\n` +
    `recipe: ${JSON.stringify(recipe)}\n`;
  triggerDownload(payload, "EuroScope.exe", "application/octet-stream");
  setState("downloaded", true);
  persist();
}

export function downloadRecipe(): void {
  triggerDownload(currentRecipeText(), "patch-recipe.json", "application/json");
}

export type ImportResult = { ok: boolean; message: string };

/**
 * Apply a parseable JSON value through the Patch recipe field contract.
 * Shared verbatim by the Import recipe file control and the WebMCP
 * artifact import operation: invalid payloads change nothing and the
 * returned message names the offending field.
 */
export function importRecipeParsed(parsed: unknown): ImportResult {
  const result = validateRecipe(parsed);
  if (!result.ok) {
    return { ok: false, message: `Import failed: ${result.error}` };
  }
  applyRecipe(result.recipe);
  const recipe = result.recipe;
  const overrides = Object.values(recipe.bitmaps).filter((b) => b.keepOriginal).length;
  return {
    ok: true,
    message: `Imported patch recipe — restored Base theme ${recipe.baseTheme}, all six colours, icon set ${
      recipe.iconSet === "vector" ? "Vector" : "None (keep as-is)"
    }, and ${overrides} keep-original override${overrides === 1 ? "" : "s"}.`,
  };
}

export function importRecipeText(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, message: `Import failed: not valid JSON (${(err as Error).message})` };
  }
  return importRecipeParsed(parsed);
}

function applyRecipe(recipe: PatchRecipe): void {
  pushUndo();
  setState("baseTheme", recipe.baseTheme);
  setState(
    "swatches",
    COLOUR_KEYS.map((key) => hexToInt(recipe.colours[key])),
  );
  setState("iconSet", recipe.iconSet);
  const keep: Record<string, boolean> = {};
  for (const bm of BITMAPS) {
    const entry = recipe.bitmaps[String(bm.id)];
    if (entry?.keepOriginal) keep[String(bm.id)] = true;
  }
  setState("keepOriginal", keep);
  setState("generated", false);
  persist();
}

/** Copy the active Export center preview to the clipboard (best effort). */
export async function copyExport(): Promise<boolean> {
  const text = exportTabText(state.activeExportTab);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
