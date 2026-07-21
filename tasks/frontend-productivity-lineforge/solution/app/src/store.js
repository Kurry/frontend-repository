import { signal, computed } from '@preact/signals';
import { OPENINGS } from './openings';
import { sanEq } from './chess';

// In-memory session state only — no localStorage/sessionStorage. A page reload
// returns the app to its seeded baseline (empty favorites and saved lines,
// Classic theme). This is a hard requirement of the good-app genre. The undo /
// redo history below is likewise an in-memory signal and never touches any
// browser storage API.

export const currentOpeningId = signal(null);
export const favorites = signal([]);
export const savedLines = signal([]);
export const boardTheme = signal('classic');

// Session state
export const boardFlipped = signal(false);
export const selectedNodeId = signal('root');
export const searchQuery = signal('');
export const showFavoritesOnly = signal(false);
export const showSavedPanel = signal(false);
export const toastMessage = signal(null);

// Practice state
export const practiceActive = signal(false);
export const practiceStreak = signal(0);
export const practiceCorrect = signal(0);
export const practiceTotal = signal(0);
export const practicePrompt = signal('');
export const practiceMessage = signal('');
// Illustrative, offline practice metrics (beyond-spec polish — explicitly NOT a
// live engine). An eval figure per attempt plus a fixed "depth" readout.
export const practiceEval = signal([]);
export const PRACTICE_ILLUSTRATIVE_DEPTH = 12;

// Board interaction state
export const boardSelection = signal(null); // { r, c } of the picked-up piece
export const legalTargets = signal([]);     // squares the picked-up piece can reach
export const boardFlash = signal(null);     // 'success' | 'danger'
export const previewMoves = signal(null);   // transient wrong-move display in practice

// Notable-game replay: { title, moves, index } — index -1 means start position
export const activeGame = signal(null);

// Session deviation branch: { base: [...sans], moves: [...sans] }
export const userLine = signal(null);

// Save-line form (inline, modeless — the explorer stays interactive while open)
export const saveFormOpen = signal(false);
export const saveName = signal('');
export const saveTags = signal([]);
export const saveNotes = signal('');
export const saveError = signal('');
export const savingInProgress = signal(false); // double-activation guard

// Saved-lines multi-selection + keyboard move entry state
export const selectedLineIds = signal([]);
export const moveEntryError = signal('');

// Coachmark tour (first visit per session, in-memory only)
export const coachStep = signal(0); // 0 idle, 1..n active, -1 dismissed
export const COACH_STEPS = 3;

// Blindfold training mode (beyond-spec polish)
export const blindfoldActive = signal(false);
export const blindfoldPeek = signal(false);

// Export center / study artifacts (in-memory, live-compiled)
export const showExportCenter = signal(false);
export const importError = signal('');

// Overlay coordination (z-order: palette > confirmations > export > drawer)
export const paletteOpen = signal(false);
export const paletteQuery = signal('');
export const importConfirmOpen = signal(false);
export const importPendingText = signal('');
export const bulkConfirmOpen = signal(false);
export const compareOpen = signal(false);

// Derived state
export const currentOpening = computed(() =>
  OPENINGS.find(o => o.id === currentOpeningId.value) || null
);

export const openingFamilies = computed(() => {
  const favsOnly = showFavoritesOnly.value;
  const q = searchQuery.value.trim().toLowerCase();
  const families = {};
  for (const o of OPENINGS) {
    if (favsOnly && !favorites.value.includes(o.id)) continue;
    if (q && !o.name.toLowerCase().includes(q) && !o.code.toLowerCase().includes(q) && !o.family.toLowerCase().includes(q)) continue;
    if (!families[o.family]) families[o.family] = [];
    families[o.family].push(o);
  }
  return families;
});

export const filteredOpenings = computed(() =>
  Object.values(openingFamilies.value).flat()
);

export const practiceAccuracy = computed(() => {
  if (practiceTotal.value === 0) return null;
  return Math.round((practiceCorrect.value / practiceTotal.value) * 100);
});

let toastTimer = null;
export function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
    toastTimer = null;
  }, 2400);
}

export function clearBoardInteraction() {
  boardSelection.value = null;
  legalTargets.value = [];
  previewMoves.value = null;
}

// Reset only the practice counters/prompts, leaving the mode active so the
// readouts visibly return to their starting values instead of disappearing.
function resetPracticeCounters() {
  practiceStreak.value = 0;
  practiceCorrect.value = 0;
  practiceTotal.value = 0;
  practiceEval.value = [];
  practicePrompt.value = practiceActive.value ? 'Your move' : '';
  practiceMessage.value = '';
}

export function loadOpening(id) {
  currentOpeningId.value = id;
  selectedNodeId.value = 'root';
  userLine.value = null;
  activeGame.value = null;
  clearBoardInteraction();
  saveFormOpen.value = false;
  saveTags.value = [];
  saveNotes.value = '';
  saveError.value = '';
  savingInProgress.value = false;
  moveEntryError.value = '';
  // Choosing a different opening is a mode boundary: return to explore so a
  // practice prompt from the previous line cannot carry into the new one.
  if (practiceActive.value) exitPractice();
}

// --- Undo / redo -------------------------------------------------------------
// The undoable surface is favorites, My Saved Lines, and board theme — the
// mutations the PRD enumerates (save, rename, delete, bulk tag/delete, favorite
// toggle, board-theme change). Session-only state (board position, practice,
// relay, search, palette) is intentionally NOT undoable.

const undoStack = signal([]);
const redoStack = signal([]);
const UNDO_LIMIT = 120;

export const canUndo = computed(() => undoStack.value.length > 0);
export const canRedo = computed(() => redoStack.value.length > 0);

function snapshotUndoable() {
  return JSON.stringify({
    f: favorites.value,
    s: savedLines.value,
    t: boardTheme.value
  });
}

function applySnapshot(str) {
  const snap = JSON.parse(str);
  favorites.value = snap.f;
  savedLines.value = snap.s;
  boardTheme.value = snap.t;
}

// Run a mutation that changes undoable state. Records the prior state for undo
// and clears the redo stack (a new mutation after undo discards the future).
// Mutations that touch undoable state MUST route through here so the undo/redo
// controls and the visible UI stay on the same shared state.
export function commit(mutator) {
  const stack = [...undoStack.value, snapshotUndoable()];
  if (stack.length > UNDO_LIMIT) stack.shift();
  undoStack.value = stack;
  redoStack.value = [];
  mutator();
}

export function undo() {
  if (!canUndo.value) return;
  const stack = [...undoStack.value];
  const prev = stack.pop();
  undoStack.value = stack;
  redoStack.value = [...redoStack.value, snapshotUndoable()];
  applySnapshot(prev);
  selectedLineIds.value = selectedLineIds.value.filter(id => savedLines.value.some(l => l.id === id));
  showToast('Undid last change');
}

export function redo() {
  if (!canRedo.value) return;
  const stack = [...redoStack.value];
  const next = stack.pop();
  redoStack.value = stack;
  const past = [...undoStack.value, snapshotUndoable()];
  if (past.length > UNDO_LIMIT) past.shift();
  undoStack.value = past;
  applySnapshot(next);
  selectedLineIds.value = selectedLineIds.value.filter(id => savedLines.value.some(l => l.id === id));
  showToast('Redid change');
}

export function toggleFavorite(openingId) {
  commit(() => {
    const isFav = favorites.value.includes(openingId);
    favorites.value = isFav
      ? favorites.value.filter(id => id !== openingId)
      : [...favorites.value, openingId];
  });
  const isFav = favorites.value.includes(openingId);
  const name = OPENINGS.find(o => o.id === openingId)?.name || 'Opening';
  showToast(isFav ? `${name} added to favorites` : `${name} removed from favorites`);
}

export function toggleAllFavorites() {
  commit(() => {
    if (favorites.value.length === OPENINGS.length) favorites.value = [];
    else favorites.value = OPENINGS.map(o => o.id);
  });
  showToast(favorites.value.length === OPENINGS.length
    ? 'All openings added to favorites'
    : 'All favorites cleared');
}

export function setBoardTheme(theme) {
  if (boardTheme.value === theme) return;
  commit(() => { boardTheme.value = theme; });
}

// --- Move-tree path helpers -------------------------------------------------

function pathEquals(a, b) {
  return a.length === b.length && a.every((m, i) => sanEq(m, b[i]));
}

function isPrefixOf(prefix, seq) {
  return prefix.length <= seq.length && prefix.every((m, i) => sanEq(m, seq[i]));
}

// The move sequence for the currently selected tree node.
export function getNodeMoves() {
  const open = currentOpening.value;
  if (!open) return [];
  const nid = selectedNodeId.value;
  if (nid === 'root') return [];
  if (nid.startsWith('main-')) {
    const idx = parseInt(nid.split('-')[1], 10);
    return open.moves.slice(0, idx + 1);
  }
  if (nid.startsWith('branch-')) {
    const parts = nid.split('-');
    const bIdx = parseInt(parts[1], 10);
    const mIdx = parseInt(parts[2], 10);
    const branch = open.branches?.[bIdx];
    if (!branch) return [];
    return branch.moves.slice(0, mIdx + 1);
  }
  if (nid.startsWith('user-')) {
    const ul = userLine.value;
    if (!ul) return [];
    const idx = parseInt(nid.split('-')[1], 10);
    return [...ul.base, ...ul.moves.slice(0, idx + 1)];
  }
  return [];
}

// Map a move path back to a tree node id, or null when the path is not in
// the tree. Bundled nodes win over user-line nodes.
export function nodeIdForPath(path) {
  const open = currentOpening.value;
  if (!open) return null;
  if (path.length === 0) return 'root';
  if (isPrefixOf(path, open.moves)) return `main-${path.length - 1}`;
  if (open.branches) {
    for (let b = 0; b < open.branches.length; b++) {
      if (isPrefixOf(path, open.branches[b].moves)) return `branch-${b}-${path.length - 1}`;
    }
  }
  const ul = userLine.value;
  if (ul && path.length > ul.base.length && isPrefixOf(ul.base, path)) {
    const rest = path.slice(ul.base.length);
    if (isPrefixOf(rest, ul.moves)) return `user-${rest.length - 1}`;
  }
  return null;
}

export function selectNode(id) {
  activeGame.value = null;
  selectedNodeId.value = id;
  clearBoardInteraction();
}

export function resetToStart() {
  activeGame.value = null;
  selectedNodeId.value = 'root';
  clearBoardInteraction();
  if (practiceActive.value) {
    practicePrompt.value = 'Your move';
    practiceMessage.value = '';
  }
}

// The sequence the Previous/Next scrubber walks for the current context.
export function scrubberSequence() {
  const open = currentOpening.value;
  if (!open) return [];
  const nid = selectedNodeId.value;
  const ul = userLine.value;
  if (nid.startsWith('branch-')) {
    const bIdx = parseInt(nid.split('-')[1], 10);
    return open.branches?.[bIdx]?.moves || open.moves;
  }
  if (nid.startsWith('user-') && ul) {
    return [...ul.base, ...ul.moves];
  }
  if (ul && pathEquals(ul.base, open.moves)) {
    return [...open.moves, ...ul.moves];
  }
  return open.moves;
}

export function stepPrev() {
  const game = activeGame.value;
  if (game) {
    if (game.index > -1) activeGame.value = { ...game, index: game.index - 1 };
    return;
  }
  const path = getNodeMoves();
  if (path.length === 0) return;
  const nid = nodeIdForPath(path.slice(0, -1));
  selectedNodeId.value = nid || 'root';
  clearBoardInteraction();
}

export function stepNext() {
  const game = activeGame.value;
  if (game) {
    if (game.index < game.moves.length - 1) activeGame.value = { ...game, index: game.index + 1 };
    return;
  }
  const path = getNodeMoves();
  const seq = scrubberSequence();
  if (path.length >= seq.length || !isPrefixOf(path, seq)) return;
  const nid = nodeIdForPath(seq.slice(0, path.length + 1));
  if (nid) {
    selectedNodeId.value = nid;
    clearBoardInteraction();
  }
}

// Record an explored move: jump to the matching bundled node when one
// exists, otherwise grow the session "Your Line" branch.
export function recordExploredMove(path, notation) {
  const bundled = nodeIdForPath([...path, notation]);
  if (bundled && !bundled.startsWith('user-')) {
    selectedNodeId.value = bundled;
    return false;
  }
  const ul = userLine.value;
  if (ul && pathEquals(path, [...ul.base, ...ul.moves])) {
    userLine.value = { base: ul.base, moves: [...ul.moves, notation] };
  } else if (ul && bundled) {
    // Extending inside the existing user line
    selectedNodeId.value = bundled;
    return false;
  } else {
    userLine.value = { base: path, moves: [notation] };
  }
  selectedNodeId.value = `user-${userLine.value.moves.length - 1}`;
  return true;
}

// --- Practice mode -----------------------------------------------------------

export function startPractice() {
  activeGame.value = null;
  userLine.value = null;
  selectedNodeId.value = 'root';
  clearBoardInteraction();
  practiceActive.value = true;
  resetPracticeCounters();
}

export function exitPractice() {
  practiceActive.value = false;
  resetPracticeCounters();
  clearBoardInteraction();
}

export function recordPracticeAttempt(correct) {
  practiceTotal.value += 1;
  if (correct) {
    practiceCorrect.value += 1;
    practiceStreak.value += 1;
  } else {
    practiceStreak.value = 0;
  }
  // Illustrative eval swing — purely offline sample numbers, never presented as
  // a live engine. Bounded so the sparkline stays readable.
  const prev = practiceEval.value[practiceEval.value.length - 1] ?? 0;
  const swing = correct ? 0.3 + Math.random() * 0.5 : -(0.3 + Math.random() * 0.6);
  let next = prev + swing;
  if (next > 2) next = 2;
  if (next < -2) next = -2;
  practiceEval.value = [...practiceEval.value, Math.round(next * 10) / 10];
}

// --- Saved lines --------------------------------------------------------------

export function addSavedLine(name, openingId, moves, userLineSnapshot, opts) {
  const id = 'line-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const o = opts || {};
  commit(() => {
    savedLines.value = [...savedLines.value, {
      id, name, openingId, moves,
      ply: typeof o.ply === 'number' ? o.ply : moves.length,
      tags: Array.isArray(o.tags) ? o.tags.slice() : [],
      notes: typeof o.notes === 'string' ? o.notes : '',
      userLine: userLineSnapshot || null
    }];
  });
  return id;
}

export function deleteSavedLine(id) {
  commit(() => {
    savedLines.value = savedLines.value.filter(l => l.id !== id);
  });
  selectedLineIds.value = selectedLineIds.value.filter(x => x !== id);
  showToast('Line deleted — undo to restore it');
}

// Update a saved line's name/tags/notes. Only the provided (defined) fields
// are patched — undefined fields leave the existing value untouched. Callers
// (rename UI, WebMCP entity_update) must validate with validateTagsNotes first.
export function updateSavedLine(id, patch) {
  const p = patch || {};
  commit(() => {
    savedLines.value = savedLines.value.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        name: typeof p.name === 'string' ? p.name : l.name,
        tags: Array.isArray(p.tags) ? p.tags.slice() : l.tags,
        notes: typeof p.notes === 'string' ? p.notes : l.notes
      };
    });
  });
  showToast('Line updated');
}

export function loadSavedLine(line) {
  loadOpening(line.openingId);
  if (line.userLine && line.userLine.moves?.length) {
    userLine.value = { base: line.userLine.base, moves: line.userLine.moves };
    selectedNodeId.value = `user-${line.userLine.moves.length - 1}`;
  } else {
    const ply = typeof line.ply === 'number' ? line.ply : line.moves.length;
    selectedNodeId.value = nodeIdForPath(line.moves.slice(0, ply)) || 'root';
  }
  showSavedPanel.value = false;
  showToast(`Loaded ${line.name}`);
}

// --- Multi-selection / bulk operations ---------------------------------------

export function isLineSelected(id) { return selectedLineIds.value.includes(id); }

export function toggleLineSelection(id) {
  const sel = selectedLineIds.value;
  selectedLineIds.value = sel.includes(id)
    ? sel.filter(x => x !== id)
    : [...sel, id];
}

export function clearLineSelection() { selectedLineIds.value = []; }

export function bulkAddTag(tag) {
  const ids = selectedLineIds.value;
  if (ids.length === 0) return;
  if (!TAG_SET.includes(tag)) return;
  commit(() => {
    savedLines.value = savedLines.value.map(l => {
      if (!ids.includes(l.id)) return l;
      const tags = (l.tags || []).includes(tag) ? l.tags : [...(l.tags || []), tag];
      return { ...l, tags };
    });
  });
  const n = ids.length;
  selectedLineIds.value = [];
  showToast(`Tag "${tag}" added to ${n} line${n === 1 ? '' : 's'}`);
}

export function bulkRemoveTag(tag) {
  const ids = selectedLineIds.value;
  if (ids.length === 0) return;
  commit(() => {
    savedLines.value = savedLines.value.map(l => {
      if (!ids.includes(l.id)) return l;
      return { ...l, tags: (l.tags || []).filter(t => t !== tag) };
    });
  });
  const n = ids.length;
  selectedLineIds.value = [];
  showToast(`Tag "${tag}" removed from ${n} line${n === 1 ? '' : 's'}`);
}

export function bulkDeleteSelected() {
  const ids = selectedLineIds.value;
  if (ids.length === 0) return;
  commit(() => {
    savedLines.value = savedLines.value.filter(l => !ids.includes(l.id));
  });
  const n = ids.length;
  selectedLineIds.value = [];
  showToast(`Deleted ${n} line${n === 1 ? '' : 's'} — undo to restore them`);
}

// --- Live relay: deterministic local event stream ------------------------------
// A scripted broadcast of one demonstration game. Events carry stable ids and
// logical timestamps; application is idempotent (dedup by id) and ordered
// (sort by ts), so duplicates and out-of-order delivery resolve
// deterministically.

export const RELAY_SCRIPT = [
  { id: 'evt-01', ts: 1, san: 'e4', side: 'White' },
  { id: 'evt-02', ts: 2, san: 'e5', side: 'Black' },
  { id: 'evt-03', ts: 3, san: 'Nf3', side: 'White' },
  { id: 'evt-04', ts: 4, san: 'Nc6', side: 'Black' },
  { id: 'evt-05', ts: 5, san: 'Bc4', side: 'White' },
  { id: 'evt-06', ts: 6, san: 'Bc5', side: 'Black' },
  { id: 'evt-07', ts: 7, san: 'c3', side: 'White' },
  { id: 'evt-08', ts: 8, san: 'Nf6', side: 'Black' },
  { id: 'evt-09', ts: 9, san: 'd3', side: 'White' },
  { id: 'evt-10', ts: 10, san: 'd6', side: 'Black' },
  { id: 'evt-11', ts: 11, san: 'O-O', side: 'White' },
  { id: 'evt-12', ts: 12, san: 'O-O', side: 'Black' }
];

// status: 'idle' | 'live' | 'paused' | 'disconnected' | 'replaying' |
// 'caught-up' | 'complete'
export const relay = signal({ status: 'idle', applied: [], buffer: [], cursor: 0 });

let relayTimer = null;
let relayGen = 0;

function relayApply(state, incoming) {
  const ids = new Set(state.applied.map(e => e.id));
  const applied = [...state.applied];
  for (const e of incoming) {
    if (ids.has(e.id)) continue;
    ids.add(e.id);
    applied.push(e);
  }
  applied.sort((a, b) => a.ts - b.ts);
  return applied;
}

function relayStopTimer() {
  if (relayTimer) {
    clearInterval(relayTimer);
    relayTimer = null;
  }
}

function relayTick() {
  const s = relay.value;
  if (s.status !== 'live') return;
  if (s.cursor >= RELAY_SCRIPT.length) {
    relayStopTimer();
    relay.value = { ...s, status: 'complete' };
    return;
  }
  const e = RELAY_SCRIPT[s.cursor];
  relay.value = { ...s, applied: relayApply(s, [e]), cursor: s.cursor + 1 };
}

export function relayStart() {
  relayGen += 1;
  relayStopTimer();
  relay.value = { status: 'live', applied: [], buffer: [], cursor: 0 };
  relayTimer = setInterval(relayTick, 1500);
}

export function relayPause() {
  const s = relay.value;
  if (s.status === 'idle') {
    showToast('Stream is not connected — select Start first');
    return;
  }
  if (s.status === 'complete') return;
  relayStopTimer();
  relay.value = { ...s, status: 'paused' };
}

export function relayDisconnect() {
  const s = relay.value;
  if (s.status === 'idle') {
    showToast('Stream is not connected — select Start first');
    return;
  }
  if (s.status === 'complete') return;
  relayStopTimer();
  relay.value = { ...s, status: 'disconnected' };
}

export function relayDeliverOutOfOrder() {
  const s = relay.value;
  if (s.status === 'idle') {
    showToast('Stream is not connected — select Start first');
    return;
  }
  if (s.cursor >= RELAY_SCRIPT.length) {
    showToast('No pending events — the broadcast is fully delivered');
    return;
  }
  // Deliver the next two script events in reverse timestamp order, plus a
  // duplicate of the most recent applied event.
  const batch = [];
  const second = RELAY_SCRIPT[s.cursor + 1];
  const first = RELAY_SCRIPT[s.cursor];
  if (second) batch.push(second);
  batch.push(first);
  if (s.applied.length > 0) batch.push(s.applied[s.applied.length - 1]);
  const cursor = Math.min(s.cursor + (second ? 2 : 1), RELAY_SCRIPT.length);

  if (s.status === 'paused' || s.status === 'disconnected') {
    // Buffer while processing is stopped; applied values do not change until
    // reconnect performs one idempotent catch-up.
    relay.value = { ...s, buffer: [...s.buffer, ...batch], cursor };
    showToast('Events queued until reconnect');
    return;
  }
  const applied = relayApply(s, batch);
  const complete = applied.length >= RELAY_SCRIPT.length && cursor >= RELAY_SCRIPT.length;
  if (complete) relayStopTimer();
  relay.value = { ...s, applied, cursor, status: complete ? 'complete' : s.status };
}

export function relayReconnect() {
  const s = relay.value;
  if (s.status === 'idle') {
    showToast('Stream is not connected — select Start first');
    return;
  }
  if (s.status === 'complete') return;
  relayGen += 1;
  const gen = relayGen;
  relayStopTimer();
  const applied = relayApply(s, s.buffer);
  relay.value = { ...s, status: 'replaying', applied, buffer: [] };
  setTimeout(() => {
    if (gen !== relayGen) return;
    const cur = relay.value;
    if (cur.status !== 'replaying') return;
    const complete = cur.applied.length >= RELAY_SCRIPT.length && cur.cursor >= RELAY_SCRIPT.length;
    relay.value = { ...cur, status: complete ? 'complete' : 'caught-up' };
    if (!complete) {
      setTimeout(() => {
        if (gen !== relayGen) return;
        const next = relay.value;
        if (next.status !== 'caught-up') return;
        relay.value = { ...next, status: 'live' };
        relayStopTimer();
        relayTimer = setInterval(relayTick, 1500);
      }, 900);
    }
  }, 700);
}

// --- Export center / study artifacts (in-memory, live-compiled) --------------

const CODE_BY_ID = {};
const ID_BY_CODE = {};
for (const o of OPENINGS) { CODE_BY_ID[o.id] = o.code; ID_BY_CODE[o.code] = o.id; }

const THEMES_SET = ['classic', 'forest', 'slate'];
export const TAG_SET = ['study', 'sharp', 'solid', 'trap', 'endgame'];

function sideForPly(ply) { return ply % 2 === 0 ? 'white' : 'black'; }

// Shared SavedLine.tags / SavedLine.notes bounds check, used by the save form,
// WebMCP entity_create/entity_update, and Study pack import validation.
export function validateTagsNotes(tags, notes) {
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 8) return 'tags: at most 8 tags — deselect a tag and try again';
    for (const t of tags) {
      if (typeof t !== 'string' || t.length > 24 || !TAG_SET.includes(t)) {
        return `tags: "${t}" is outside the allowed set (study, sharp, solid, trap, endgame) — use a chip shown above`;
      }
    }
  }
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 280)) {
    return 'notes: use 280 characters or fewer';
  }
  return null;
}

// Map an internal saved line to the API-shaped SavedLine payload.
export function toSavedLinePayload(line) {
  const moves = Array.isArray(line.moves) ? line.moves.slice() : [];
  const ply = typeof line.ply === 'number' ? line.ply : moves.length;
  return {
    name: line.name,
    openingCode: CODE_BY_ID[line.openingId] || '',
    moves,
    ply,
    tags: Array.isArray(line.tags) ? line.tags.slice() : [],
    notes: typeof line.notes === 'string' ? line.notes : '',
    sideToMove: sideForPly(ply)
  };
}

// Live StudyPackDocument compiled from current session state.
export function buildStudyPack() {
  return {
    formatVersion: '1',
    boardTheme: boardTheme.value,
    favorites: favorites.value.map(id => CODE_BY_ID[id]).filter(Boolean),
    savedLines: savedLines.value.map(toSavedLinePayload),
    generatedAt: new Date().toISOString()
  };
}

export function buildStudyPackText() {
  return JSON.stringify(buildStudyPack(), null, 2);
}

// Standard PGN for the currently displayed move sequence.
export function buildCurrentPGN() {
  const open = currentOpening.value;
  const moves = getNodeMoves();
  const name = open ? open.name : 'Study line';
  const code = open ? open.code : '?';
  let body = '';
  moves.forEach((san, i) => {
    if (i % 2 === 0) body += `${Math.floor(i / 2) + 1}. `;
    body += san + ' ';
  });
  body = (body.trim() || '') + ' *';
  const tags = [
    '[Event "LineForge study"]',
    '[Site "LineForge"]',
    '[White "Study"]',
    '[Black "Study"]',
    `[Opening "${name}"]`,
    `[ECO "${code}"]`,
    '[Result "*"]'
  ].join('\n');
  return `${tags}\n\n${body.trim()}`;
}

// Validate a parsed StudyPackDocument; returns a field-naming error string or null.
export function validateStudyPack(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'payload: not a JSON object — paste the full exported study pack';
  if (doc.formatVersion !== '1') return 'formatVersion: must be exactly the string "1" — re-export from a current LineForge session';
  if (!THEMES_SET.includes(doc.boardTheme)) return 'boardTheme: must be one of classic, forest, slate';
  if (typeof doc.generatedAt !== 'string' || Number.isNaN(Date.parse(doc.generatedAt))) {
    return 'generatedAt: required ISO-8601 timestamp string';
  }
  if (!Array.isArray(doc.favorites)) return 'favorites: must be an array of bundled opening codes';
  for (const c of doc.favorites) {
    if (!ID_BY_CODE[c]) return `favorites: "${c}" is not a bundled opening code — remove it or correct the code`;
  }
  if (!Array.isArray(doc.savedLines)) return 'savedLines: must be an array';
  for (let i = 0; i < doc.savedLines.length; i++) {
    const s = doc.savedLines[i];
    const p = `savedLines[${i}]`;
    if (!s || typeof s !== 'object') return `${p}: must be an object`;
    const nm = typeof s.name === 'string' ? s.name.trim() : '';
    if (nm.length < 1 || nm.length > 80) return `${p}.name: required string of length 1 to 80`;
    if (!ID_BY_CODE[s.openingCode]) return `${p}.openingCode: "${s.openingCode}" is not a bundled opening code`;
    if (!Array.isArray(s.moves) || s.moves.length < 1 || !s.moves.every(m => typeof m === 'string')) {
      return `${p}.moves: required array of one or more SAN strings`;
    }
    if (!Number.isInteger(s.ply) || s.ply < 0 || s.ply > s.moves.length) {
      return `${p}.ply: required integer from 0 through moves length`;
    }
    if (s.tags !== undefined) {
      if (!Array.isArray(s.tags) || s.tags.length > 8) return `${p}.tags: at most 8 tags`;
      for (const t of s.tags) {
        if (typeof t !== 'string' || t.length > 24 || !TAG_SET.includes(t)) {
          return `${p}.tags: "${t}" is outside the allowed tag set`;
        }
      }
    }
    if (s.notes !== undefined && (typeof s.notes !== 'string' || s.notes.length > 280)) {
      return `${p}.notes: string of length 0 to 280`;
    }
    if (s.sideToMove !== 'white' && s.sideToMove !== 'black') {
      return `${p}.sideToMove: required, must be exactly white or black`;
    }
    if (s.sideToMove !== sideForPly(s.ply)) {
      return `${p}.sideToMove: must match ply (even ply is white, odd ply is black)`;
    }
  }
  return null;
}

// The StudyPack wire format only carries a flat SAN `moves` list, not the
// { base, moves } "Your Line" snapshot loadSavedLine() prefers — reconstruct
// that snapshot from the bundled tree so an off-book saved line still lands
// on its saved ply after import instead of falling back to nodeIdForPath
// (which only resolves paths against the *current* session's userLine).
function reconstructUserLine(openingId, path) {
  const open = OPENINGS.find(o => o.id === openingId);
  if (!open || path.length === 0) return null;
  if (isPrefixOf(path, open.moves)) return null;
  if (open.branches) {
    for (const b of open.branches) {
      if (isPrefixOf(path, b.moves)) return null;
    }
  }
  let bestLen = 0;
  const bookLines = [open.moves, ...(open.branches ? open.branches.map(b => b.moves) : [])];
  for (const book of bookLines) {
    let n = 0;
    while (n < path.length && n < book.length && sanEq(path[n], book[n])) n++;
    if (n > bestLen) bestLen = n;
  }
  const moves = path.slice(bestLen);
  if (moves.length === 0) return null;
  return { base: path.slice(0, bestLen), moves };
}

// Parse without committing (used by the import confirmation to preview counts).
export function parseStudyPackText(text) {
  let doc;
  try { doc = JSON.parse(text); }
  catch { return { ok: false, error: 'payload: the JSON could not be parsed — paste the complete exported study pack' }; }
  const err = validateStudyPack(doc);
  if (err) return { ok: false, error: err };
  return {
    ok: true,
    favorites: doc.favorites.length,
    savedLines: doc.savedLines.length,
    boardTheme: doc.boardTheme
  };
}

// Import a StudyPack from raw text; replaces favorites, boardTheme, savedLines.
export function importStudyPackText(text) {
  const parsed = parseStudyPackText(text);
  if (!parsed.ok) { importError.value = parsed.error; return { ok: false, error: parsed.error }; }
  let doc;
  try { doc = JSON.parse(text); } catch { return parsed; }
  commit(() => {
    importError.value = '';
    boardTheme.value = doc.boardTheme;
    favorites.value = doc.favorites.map(c => ID_BY_CODE[c]);
    savedLines.value = doc.savedLines.map(s => {
      const openingId = ID_BY_CODE[s.openingCode];
      return {
        id: 'line-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        name: s.name.trim(),
        openingId,
        moves: s.moves.slice(),
        ply: s.ply,
        tags: Array.isArray(s.tags) ? s.tags.slice() : [],
        notes: typeof s.notes === 'string' ? s.notes : '',
        userLine: reconstructUserLine(openingId, s.moves.slice(0, s.ply))
      };
    });
  });
  selectedLineIds.value = [];
  showToast(`Study pack imported — ${favorites.value.length} favorite${favorites.value.length === 1 ? '' : 's'}, ${savedLines.value.length} saved line${savedLines.value.length === 1 ? '' : 's'}`);
  return { ok: true, favorites: favorites.value.length, savedLines: savedLines.value.length };
}

// --- Share link (beyond-spec): encodes the current line into the URL hash -----
export function buildSharePayload() {
  const open = currentOpening.value;
  if (!open) return null;
  const moves = getNodeMoves();
  return {
    o: open.id,
    m: moves.join(','),
    t: boardTheme.value
  };
}

export function encodeShareHash(payload) {
  if (!payload) return '';
  const parts = [];
  if (payload.o) parts.push('o=' + encodeURIComponent(payload.o));
  if (payload.m) parts.push('m=' + encodeURIComponent(payload.m));
  if (payload.t) parts.push('t=' + encodeURIComponent(payload.t));
  return '#lineforge=' + parts.join(';');
}

export function parseShareHash(hash) {
  if (!hash || !hash.includes('#lineforge=')) return null;
  const body = hash.slice(hash.indexOf('#lineforge=') + '#lineforge='.length);
  const out = {};
  for (const part of body.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1));
  }
  if (!out.o || !OPENINGS.some(o => o.id === out.o)) return null;
  return out;
}

export function applySharePayload(p) {
  if (!p) return;
  loadOpening(p.o);
  if (p.t && THEMES_SET.includes(p.t)) setBoardTheme(p.t);
  if (p.m) {
    const moves = p.m.split(',').filter(Boolean);
    // Replay by selecting the node that matches the prefix in the bundled tree,
    // otherwise grow a session Your Line branch as we walk.
    for (const san of moves) {
      const path = getNodeMoves();
      const bundled = nodeIdForPath([...path, san]);
      if (bundled && !bundled.startsWith('user-')) selectedNodeId.value = bundled;
      else recordExploredMove(path, san);
    }
  }
}
