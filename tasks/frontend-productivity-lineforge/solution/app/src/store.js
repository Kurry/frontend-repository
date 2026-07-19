import { signal, computed, effect } from '@preact/signals';
import { OPENINGS } from './openings';
import { sanEq } from './chess';

// Guarded localStorage helpers
function safeGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// Persistent state
export const currentOpeningId = signal(safeGet('lineforge_opening', null));
export const favorites = signal(safeGet('lineforge_favorites', []));
export const savedLines = signal(safeGet('lineforge_saved', []));
export const boardTheme = signal(safeGet('lineforge_theme', 'classic'));

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

// Board interaction state
export const boardSelection = signal(null); // { r, c } of the picked-up piece
export const legalTargets = signal([]);     // squares the picked-up piece can reach
export const boardFlash = signal(null);     // 'success' | 'danger'
export const previewMoves = signal(null);   // transient wrong-move display in practice

// Notable-game replay: { title, moves, index } — index -1 means start position
export const activeGame = signal(null);

// Session deviation branch: { base: [...sans], moves: [...sans] }
export const userLine = signal(null);

// Save-line form
export const saveFormOpen = signal(false);
export const saveName = signal('');
export const saveError = signal('');

// Persistence effects
effect(() => safeSet('lineforge_opening', currentOpeningId.value));
effect(() => safeSet('lineforge_favorites', favorites.value));
effect(() => safeSet('lineforge_saved', savedLines.value));
effect(() => safeSet('lineforge_theme', boardTheme.value));

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

export function resetPractice() {
  practiceActive.value = false;
  practiceStreak.value = 0;
  practiceCorrect.value = 0;
  practiceTotal.value = 0;
  practicePrompt.value = '';
  practiceMessage.value = '';
}

export function loadOpening(id) {
  currentOpeningId.value = id;
  selectedNodeId.value = 'root';
  userLine.value = null;
  activeGame.value = null;
  resetPractice();
  clearBoardInteraction();
  saveFormOpen.value = false;
  saveError.value = '';
}

export function toggleFavorite(openingId) {
  const isFav = favorites.value.includes(openingId);
  favorites.value = isFav
    ? favorites.value.filter(id => id !== openingId)
    : [...favorites.value, openingId];
  const name = OPENINGS.find(o => o.id === openingId)?.name || 'Opening';
  showToast(isFav ? `${name} removed from favorites` : `${name} added to favorites`);
}

export function toggleAllFavorites() {
  if (favorites.value.length === OPENINGS.length) {
    favorites.value = [];
    showToast('All favorites cleared');
    return;
  }
  favorites.value = OPENINGS.map(o => o.id);
  showToast('All openings added to favorites');
}

export function setBoardTheme(theme) {
  boardTheme.value = theme;
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
  practiceStreak.value = 0;
  practiceCorrect.value = 0;
  practiceTotal.value = 0;
  practicePrompt.value = 'Your move';
  practiceMessage.value = '';
}

export function exitPractice() {
  practiceActive.value = false;
  practicePrompt.value = '';
  practiceMessage.value = '';
  clearBoardInteraction();
}

// --- Saved lines --------------------------------------------------------------

export function addSavedLine(name, openingId, moves, userLineSnapshot) {
  const id = 'line-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  savedLines.value = [...savedLines.value, { id, name, openingId, moves, userLine: userLineSnapshot || null }];
  return id;
}

export function deleteSavedLine(id) {
  savedLines.value = savedLines.value.filter(l => l.id !== id);
  showToast('Line deleted');
}

export function renameSavedLine(id, newName) {
  savedLines.value = savedLines.value.map(l =>
    l.id === id ? { ...l, name: newName } : l
  );
  showToast('Line renamed');
}

export function loadSavedLine(line) {
  loadOpening(line.openingId);
  if (line.userLine && line.userLine.moves?.length) {
    userLine.value = { base: line.userLine.base, moves: line.userLine.moves };
    selectedNodeId.value = `user-${line.userLine.moves.length - 1}`;
  } else {
    selectedNodeId.value = nodeIdForPath(line.moves) || 'root';
  }
  showSavedPanel.value = false;
  showToast('Line loaded');
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
