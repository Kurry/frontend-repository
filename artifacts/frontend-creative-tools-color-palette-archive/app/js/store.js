// In-memory shared store. Single source of truth for every surface:
// Browse layouts, Detail/Editor, contrast matrix, comparison, catalog sheet,
// and export previews all derive from `state.palettes`. No browser storage —
// a page reload returns the seeded baseline.
import { SEED_PALETTES } from './data.js';
import { hueSortKey, fmtHex } from './lib.js';

export const state = {
  palettes: structuredClone(SEED_PALETTES),
  view: 'nomenclature',          // nomenclature | palette | swatch
  periodFilter: '',              // '' = all periods
  nameSort: 'name-asc',          // name-asc | name-desc
  vision: 'none',                // none | protanopia | deuteranopia | tritanopia
  search: '',
  tagFacet: null,
  archivedFacet: false,
  multiSelect: [],               // palette ids
};

// Transient UI state (overlays, feedback) — also in-memory only.
export const ui = {
  editor: null,                  // null | { id: 'new' } | { id }
  exportOpen: false,
  exportTab: 'json',             // css | utility-theme | scss | json | catalog
  compareOpen: false,
  compareA: null,
  compareB: null,
  popupDismissed: false,
  popupOpen: false,
  menuOpen: false,
  cartOpen: false,
  lastCreatedId: null,           // for card enter animation
  exitingIds: [],                // ids animating out before removal
};

let undoStack = [];
let redoStack = [];

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); }
function emit() { for (const fn of listeners) fn(); }

const clonePalettes = () => structuredClone(state.palettes);

// ---------- undo / redo (snapshot based) -------------------------------------

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }

function pushHistory() {
  undoStack.push(clonePalettes());
  if (undoStack.length > 120) undoStack.shift();
  redoStack = [];
}

export function undo() {
  if (!canUndo()) return false;
  redoStack.push(clonePalettes());
  state.palettes = undoStack.pop();
  reconcileSelection();
  emit();
  return true;
}

export function redo() {
  if (!canRedo()) return false;
  undoStack.push(clonePalettes());
  state.palettes = redoStack.pop();
  reconcileSelection();
  emit();
  return true;
}

function reconcileSelection() {
  state.multiSelect = state.multiSelect.filter((id) => state.palettes.some((p) => p.id === id));
  if (ui.editor && ui.editor.id !== 'new' && !state.palettes.some((p) => p.id === ui.editor.id)) {
    ui.editor = null;
  }
}

// ---------- derived collections ----------------------------------------------

export function visiblePalettes() {
  let list = state.palettes.filter((p) => (state.archivedFacet ? p.archived : !p.archived));
  if (state.periodFilter) list = list.filter((p) => p.period === state.periodFilter);
  if (state.tagFacet) list = list.filter((p) => p.tags.includes(state.tagFacet));
  const q = state.search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.artist.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }
  const dir = state.nameSort === 'name-desc' ? -1 : 1;
  return [...list].sort((a, b) => dir * a.name.localeCompare(b.name));
}

export function tagCounts() {
  // Archived palettes never count toward tag facets.
  const m = new Map();
  for (const p of state.palettes) {
    if (p.archived) continue;
    for (const t of p.tags) m.set(t, (m.get(t) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]) || (a[1] === b[1] ? 0 : b[1] - a[1]));
}

// Nomenclature rows: one row per unique hex, ordered by hue with
// low-saturation / near-black colours bucketed to the end. Deterministic.
export function nomenclatureRows(list) {
  const rows = [];
  const seen = new Set();
  for (const p of list) {
    for (const hex of p.swatches) {
      const k = fmtHex(hex);
      if (seen.has(k)) continue;
      seen.add(k);
      rows.push({ hex: k, period: p.period, title: p.name, artist: p.artist });
    }
  }
  rows.sort((a, b) => {
    const ka = hueSortKey(a.hex), kb = hueSortKey(b.hex);
    return ka - kb || (a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0);
  });
  return rows;
}

// Every swatch tile across visible palettes (including duplicates across
// palettes), grouped by palette sort order.
export function swatchTiles(list) {
  const tiles = [];
  for (const p of list) {
    for (const hex of p.swatches) {
      tiles.push({ hex: fmtHex(hex), palette: p.name, id: p.id });
    }
  }
  return tiles;
}

export function paletteById(id) {
  return state.palettes.find((p) => p.id === id) || null;
}

export function uniqueId() {
  return `p-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}
let idCounter = 1;

// ---------- mutating commands (all undoable, all shared with WebMCP) ---------

export function createPalette(record) {
  pushHistory();
  const palette = {
    id: uniqueId(),
    name: record.name.trim(),
    artist: record.artist.trim(),
    period: record.period,
    swatches: record.swatches.map(fmtHex),
    favorite: record.favorite === true,
    tags: (record.tags || []).map((t) => t.trim().toLowerCase()),
    notes: record.notes || '',
    archived: record.archived === true,
  };
  state.palettes = [...state.palettes, palette];
  ui.lastCreatedId = palette.id;
  emit();
  return palette;
}

export function updatePalette(id, patch) {
  const existing = paletteById(id);
  if (!existing) return false;
  pushHistory();
  state.palettes = state.palettes.map((p) => {
    if (p.id !== id) return p;
    const next = { ...p, ...patch, id: p.id };
    if (patch.swatches) next.swatches = patch.swatches.map(fmtHex);
    if (patch.tags) next.tags = patch.tags.map((t) => String(t).trim().toLowerCase());
    if (patch.name !== undefined) next.name = patch.name.trim();
    if (patch.artist !== undefined) next.artist = patch.artist.trim();
    return next;
  });
  emit();
  return true;
}

export function deletePalettes(ids) {
  const doomed = new Set(ids.filter((id) => paletteById(id)));
  if (doomed.size === 0) return false;
  pushHistory();
  state.palettes = state.palettes.filter((p) => !doomed.has(p.id));
  state.multiSelect = state.multiSelect.filter((id) => !doomed.has(id));
  if (ui.editor && doomed.has(ui.editor.id)) ui.editor = null;
  emit();
  return true;
}

export function duplicatePalette(id) {
  const src = paletteById(id);
  if (!src) return null;
  pushHistory();
  const copy = {
    ...structuredClone(src),
    id: uniqueId(),
    name: `${src.name} (copy)`,
  };
  const idx = state.palettes.findIndex((p) => p.id === id);
  const next = [...state.palettes];
  next.splice(idx + 1, 0, copy);
  state.palettes = next;
  ui.lastCreatedId = copy.id;
  emit();
  return copy;
}

export function toggleFavorite(ids) {
  const targets = new Set(ids.filter((id) => paletteById(id)));
  if (targets.size === 0) return false;
  pushHistory();
  state.palettes = state.palettes.map((p) =>
    targets.has(p.id) ? { ...p, favorite: !p.favorite } : p
  );
  emit();
  return true;
}

export function batchTag(ids, tag) {
  const clean = String(tag || '').trim().toLowerCase();
  const targets = new Set(ids.filter((id) => paletteById(id)));
  if (!clean || targets.size === 0) return false;
  pushHistory();
  state.palettes = state.palettes.map((p) => {
    if (!targets.has(p.id)) return p;
    if (p.tags.includes(clean)) return p; // never duplicate an existing tag
    return { ...p, tags: [...p.tags, clean] };
  });
  emit();
  return true;
}

export function batchArchive(ids) {
  const targets = new Set(ids.filter((id) => paletteById(id)));
  if (targets.size === 0) return false;
  pushHistory();
  state.palettes = state.palettes.map((p) =>
    targets.has(p.id) ? { ...p, archived: true } : p
  );
  state.multiSelect = state.multiSelect.filter((id) => !targets.has(id));
  if (ui.editor && targets.has(ui.editor.id)) ui.editor = null;
  emit();
  return true;
}

export function restorePalettes(ids) {
  const targets = new Set(ids.filter((id) => paletteById(id)));
  if (targets.size === 0) return false;
  pushHistory();
  state.palettes = state.palettes.map((p) =>
    targets.has(p.id) ? { ...p, archived: false } : p
  );
  emit();
  return true;
}

export function reorderSwatches(id, from, to) {
  const p = paletteById(id);
  if (!p) return false;
  const len = p.swatches.length;
  if (from < 0 || from >= len || to < 0 || to >= len || from === to) return false;
  pushHistory();
  state.palettes = state.palettes.map((pal) => {
    if (pal.id !== id) return pal;
    const sw = [...pal.swatches];
    const [moved] = sw.splice(from, 1);
    sw.splice(to, 0, moved);
    return { ...pal, swatches: sw };
  });
  emit();
  return true;
}

// Import replaces the whole collection (undoable), already validated upstream.
export function importArchive(doc) {
  pushHistory();
  state.palettes = structuredClone(doc.palettes).map((p) => ({
    id: p.id,
    name: p.name,
    artist: p.artist,
    period: p.period,
    swatches: p.swatches.map(fmtHex),
    favorite: p.favorite === true,
    tags: [...(p.tags || [])],
    notes: p.notes || '',
    archived: p.archived === true,
  }));
  state.multiSelect = [];
  ui.editor = null;
  ui.compareOpen = false;
  emit();
  return true;
}

// ---------- non-mutating UI state --------------------------------------------

export function setViewState(patch) {
  Object.assign(state, patch);
  emit();
}

export function toggleSelect(id) {
  if (!paletteById(id)) return;
  state.multiSelect = state.multiSelect.includes(id)
    ? state.multiSelect.filter((x) => x !== id)
    : [...state.multiSelect, id];
  emit();
}

export function clearSelection() {
  if (state.multiSelect.length === 0) return;
  state.multiSelect = [];
  emit();
}

export function notify() {
  emit();
}
