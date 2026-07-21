import { createStore, reconcile } from "solid-js/store";
import { createMemo, createSignal } from "solid-js";
import {
  SEED_EVENTS,
  CATEGORIES,
  CATEGORY_IDS,
  TYPES,
  DEFAULT_FROM,
  DEFAULT_TO,
  YEAR_MIN,
  YEAR_MAX,
} from "./data";
import {
  cataloguedEvents,
  inViewEvents,
  sortByYear,
  densityCounts,
  eraAtMidpoint,
  buildTimelineJSON,
  buildEventsCSV,
  buildWindowMarkdown,
  EXPORT_FORMATS,
} from "./format";
import { validateImportDocument } from "./schema";

const clone = (o) => JSON.parse(JSON.stringify(o));

const initialState = () => ({
  events: clone(SEED_EVENTS),
  window: { from: DEFAULT_FROM, to: DEFAULT_TO },
  enabledCategories: CATEGORY_IDS.slice(),
  search: "",
  sort: "desc",
  activeMode: "scrub",
  selectedId: null,
  detailOpen: false,
  exportOpen: false,
  exportTab: "timeline-json",
  aboutOpen: false,
  importOpen: false,
  batchConfirmOpen: false,
  selection: [],
  leaving: [],
  toasts: [],
  importError: "",
  lastMutation: "",
});

const [state, setState] = createStore(initialState());

const [undoStack, setUndoStack] = createSignal([]);
const [redoStack, setRedoStack] = createSignal([]);
let toastSeq = 0;

function snapshotUndoable() {
  return {
    events: clone(state.events),
    enabledCategories: state.enabledCategories.slice(),
    window: { ...state.window },
    search: state.search,
    sort: state.sort,
    selection: state.selection.slice(),
  };
}

function pushUndo() {
  let next = [...undoStack(), snapshotUndoable()];
  if (next.length > 100) next = next.slice(-100);
  setUndoStack(next);
  setRedoStack([]);
}

function applyUndoable(snap) {
  setState("events", reconcile(clone(snap.events), { key: "id" }));
  setState("enabledCategories", snap.enabledCategories.slice());
  setState("window", { ...snap.window });
  setState("search", snap.search);
  setState("sort", snap.sort);
  setState("selection", snap.selection.slice());
}

function cloneEvent(ev) {
  return { ...ev, mediaRefs: ev.mediaRefs.slice(), categories: ev.categories.slice() };
}

let idSeq = 1000;
function newId() {
  idSeq += 1;
  return `u${idSeq}`;
}

function isUserEvent(ev) {
  return ev && ev.source !== "corpus";
}

// ---- toasts + aria-live ----
let liveMessage = "";
export function liveRegionText() {
  return liveMessage;
}

export function pushToast(message, kind = "info") {
  const id = `t${++toastSeq}`;
  liveMessage = message;
  setState("toasts", (t) => [...t, { id, message, kind }]);
  setTimeout(() => {
    setState("toasts", (t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setState("toasts", (t) => t.filter((x) => x.id !== id)), 320);
  }, 2600);
}

function scheduleLeave(id) {
  setState("leaving", (l) => (l.includes(id) ? l : [...l, id]));
  setTimeout(() => {
    setState("events", (evs) => evs.filter((e) => e.id !== id));
    setState("leaving", (l) => l.filter((x) => x !== id));
  }, 240);
}

// ---- mutations (undoable) ----
export function addEvent(record) {
  pushUndo();
  const ev = { ...cloneEvent(record), id: record.id || newId(), source: record.source || "user" };
  setState("events", (evs) => [...evs, ev]);
  setState("lastMutation", `Created event`);
  pushToast(`Created “${ev.title}”`);
  return ev;
}

export function updateEvent(id, record) {
  const idx = state.events.findIndex((e) => e.id === id);
  if (idx < 0 || !isUserEvent(state.events[idx])) return null;
  pushUndo();
  const next = { ...cloneEvent(record), id, source: state.events[idx].source };
  setState("events", idx, reconcile(next));
  setState("lastMutation", `Edited event`);
  pushToast(`Updated “${next.title}”`);
  return next;
}

export function deleteEvent(id) {
  const ev = state.events.find((e) => e.id === id);
  if (!ev || !isUserEvent(ev)) return false;
  pushUndo();
  scheduleLeave(id);
  setState("selection", (s) => s.filter((x) => x !== id));
  if (state.selectedId === id) {
    setState("selectedId", null);
    setState("detailOpen", false);
  }
  setState("lastMutation", `Deleted event`);
  pushToast(`Deleted “${ev.title}”`);
  return true;
}

export function batchCategorize(category) {
  const ids = state.selection.filter((id) => {
    const ev = state.events.find((e) => e.id === id);
    return ev && isUserEvent(ev);
  });
  if (!ids.length || !CATEGORY_IDS.includes(category)) return 0;
  pushUndo();
  setState("events", (evs) =>
    evs.map((e) => (ids.includes(e.id) ? { ...e, categories: [category] } : e)),
  );
  setState("lastMutation", `Batch categorize`);
  pushToast(`Categorized ${ids.length} event${ids.length === 1 ? "" : "s"} as ${category}`);
  return ids.length;
}

export function batchDelete() {
  const ids = state.selection.filter((id) => {
    const ev = state.events.find((e) => e.id === id);
    return ev && isUserEvent(ev);
  });
  if (!ids.length) return 0;
  pushUndo();
  ids.forEach((id) => scheduleLeave(id));
  setState("selection", []);
  if (ids.includes(state.selectedId)) {
    setState("selectedId", null);
    setState("detailOpen", false);
  }
  setState("lastMutation", `Batch delete`);
  pushToast(`Deleted ${ids.length} event${ids.length === 1 ? "" : "s"}`);
  return ids.length;
}

export function importTimeline(text) {
  const res = validateImportDocument(text);
  if (!res.ok) {
    setState("importError", res.message);
    pushToast(`Import failed: ${res.message}`, "error");
    return { ok: false, message: res.message };
  }
  pushUndo();
  const doc = res.doc;
  const events = doc.events.map((ev, i) => ({ ...cloneEvent(ev), id: ev.id || `i${++idSeq}-${i}` }));
  setState("events", reconcile(events, { key: "id" }));
  setState("window", { from: doc.window.fromYear, to: doc.window.toYear });
  const enabled = doc.enabledCategories.filter((c) => CATEGORY_IDS.includes(c));
  setState("enabledCategories", enabled.length ? enabled : CATEGORY_IDS.slice());
  setState("selection", []);
  setState("importError", "");
  setState("lastMutation", `Imported timeline`);
  pushToast(`Imported ${events.length} event${events.length === 1 ? "" : "s"}`);
  return { ok: true, count: events.length };
}

export function undo() {
  const stack = undoStack();
  if (!stack.length) return false;
  const prev = stack[stack.length - 1];
  setRedoStack([...redoStack(), snapshotUndoable()]);
  setUndoStack(stack.slice(0, -1));
  applyUndoable(prev);
  setState("lastMutation", `Undo`);
  return true;
}

export function redo() {
  const stack = redoStack();
  if (!stack.length) return false;
  const next = stack[stack.length - 1];
  setUndoStack([...undoStack(), snapshotUndoable()]);
  setRedoStack(stack.slice(0, -1));
  applyUndoable(next);
  setState("lastMutation", `Redo`);
  return true;
}

export function canUndo() {
  return undoStack().length > 0;
}
export function canRedo() {
  return redoStack().length > 0;
}

// ---- non-undoable UI state ----
export function setMode(mode) {
  setState("activeMode", mode);
}
export function setSearch(q) {
  setState("search", q);
}
export function setSort(s) {
  setState("sort", s);
}
export function toggleCategory(cat) {
  setState("enabledCategories", (cur) =>
    cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat],
  );
}
export function setCategoryEnabled(cat, on) {
  setState("enabledCategories", (cur) => {
    const has = cur.includes(cat);
    if (on && !has) return [...cur, cat];
    if (!on && has) return cur.filter((c) => c !== cat);
    return cur;
  });
}
export function clearFilters() {
  setState("enabledCategories", CATEGORY_IDS.slice());
  setState("search", "");
  setState("window", { from: DEFAULT_FROM, to: DEFAULT_TO });
}
export function fitAll() {
  setState("window", { from: YEAR_MIN, to: YEAR_MAX });
}

function clampWindow(from, to) {
  let f = Math.round(Math.max(YEAR_MIN, Math.min(YEAR_MAX, from)));
  let t = Math.round(Math.max(YEAR_MIN, Math.min(YEAR_MAX, to)));
  if (f > t) [f, t] = [t, f];
  if (f === t) t = Math.min(YEAR_MAX, f + 1);
  return { from: f, to: t };
}

export function setWindow(from, to) {
  setState("window", clampWindow(from, to));
}
export function setFromYear(y) {
  setState("window", (w) => clampWindow(y, w.to));
}
export function setToYear(y) {
  setState("window", (w) => clampWindow(w.from, y));
}

// wheel zoom around the window midpoint; factor<1 zooms in
export function zoomAroundMidpoint(factor) {
  setState("window", (w) => {
    const mid = (w.from + w.to) / 2;
    const half = ((w.to - w.from) / 2) * factor;
    const minHalf = 2;
    const h = Math.max(minHalf, half);
    return clampWindow(mid - h, mid + h);
  });
}
// translate window by delta years (pan / shift-wheel)
export function panBy(deltaYears) {
  setState("window", (w) => {
    const span = w.to - w.from;
    let from = w.from + deltaYears;
    let to = w.to + deltaYears;
    if (from < YEAR_MIN) {
      from = YEAR_MIN;
      to = YEAR_MIN + span;
    }
    if (to > YEAR_MAX) {
      to = YEAR_MAX;
      from = YEAR_MAX - span;
    }
    return clampWindow(from, to);
  });
}

export function selectEvent(id) {
  setState("selectedId", id);
}
export function openDetail(id) {
  setState("selectedId", id);
  setState("detailOpen", true);
}
export function closeDetail() {
  setState("detailOpen", false);
  setState("selectedId", null);
}
export function openExport(tab) {
  setState("exportOpen", true);
  if (tab) setState("exportTab", tab);
}
export function closeExport() {
  setState("exportOpen", false);
}
export function setExportTab(tab) {
  setState("exportTab", tab);
}
export function openAbout() {
  setState("aboutOpen", true);
}
export function closeAbout() {
  setState("aboutOpen", false);
}
export function openImport() {
  setState("importError", "");
  setState("importOpen", true);
}
export function closeImport() {
  setState("importOpen", false);
  setState("importError", "");
}
export function openBatchConfirm() {
  setState("batchConfirmOpen", true);
}
export function closeBatchConfirm() {
  setState("batchConfirmOpen", false);
}

export function toggleSelection(id) {
  const ev = state.events.find((e) => e.id === id);
  if (!ev || !isUserEvent(ev)) return;
  setState("selection", (s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
}
export function clearSelection() {
  setState("selection", []);
}

// ---- derived views ----
const leavingSet = createMemo(() => new Set(state.leaving));

export const catalogued = createMemo(() =>
  cataloguedEvents(state.events, state.enabledCategories, state.search, leavingSet()),
);
export const inView = createMemo(() =>
  inViewEvents(state.events, state.enabledCategories, state.search, state.window, leavingSet()),
);
export const libraryRows = createMemo(() => sortByYear(catalogued(), state.sort));
// rows shown in the virtualized list include leaving rows so the exit animation can play
export const libraryRowsWithLeaving = createMemo(() => {
  const base = catalogued();
  const ids = new Set(base.map((e) => e.id));
  const leavingRows = state.events.filter((e) => state.leaving.includes(e.id) && !ids.has(e.id));
  return sortByYear([...base, ...leavingRows], state.sort);
});
export const density = createMemo(() => densityCounts(inView()));
export const currentEra = createMemo(() => eraAtMidpoint(state.window.from, state.window.to));
export const cataloguedCount = createMemo(() => catalogued().length);
export const inViewCount = createMemo(() => inView().length);

// detail stepping follows the filtered (in-view) order
export const steppingList = createMemo(() => sortByYear(inView(), "asc"));
export function stepDetail(dir) {
  const list = steppingList();
  if (!list.length) return;
  const cur = state.selectedId;
  let idx = list.findIndex((e) => e.id === cur);
  if (idx < 0) idx = 0;
  else idx = (idx + dir + list.length) % list.length;
  setState("selectedId", list[idx].id);
}

// ---- export preview text compiled live from shared state ----
export function previewTextFor(formatId) {
  const fmt = EXPORT_FORMATS.find((f) => f.id === formatId) || EXPORT_FORMATS[0];
  if (fmt.id === "timeline-json") return JSON.stringify(buildTimelineJSON(state), null, 2);
  if (fmt.id === "events-csv") return buildEventsCSV(state.events);
  return buildWindowMarkdown(state, inView());
}

export async function copyActivePreview() {
  const fmt = EXPORT_FORMATS.find((f) => f.id === state.exportTab) || EXPORT_FORMATS[0];
  const text = previewTextFor(fmt.id);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    pushToast(`Copied ${fmt.label} to clipboard (${text.length} chars)`);
    return { ok: true, format: fmt.id, length: text.length };
  } catch (err) {
    pushToast(`Copy failed: ${err.message}`, "error");
    return { ok: false, message: err.message };
  }
}

export function downloadActivePreview() {
  const fmt = EXPORT_FORMATS.find((f) => f.id === state.exportTab) || EXPORT_FORMATS[0];
  const text = previewTextFor(fmt.id);
  const blob = new Blob([text], { type: fmt.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fmt.file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  pushToast(`Downloaded ${fmt.file}`);
  return { ok: true, file: fmt.file };
}

export function resetAll() {
  const fresh = initialState();
  setState(reconcile(fresh));
  setUndoStack([]);
  setRedoStack([]);
}

export { state, setState, CATEGORIES, CATEGORY_IDS, TYPES, EXPORT_FORMATS };
