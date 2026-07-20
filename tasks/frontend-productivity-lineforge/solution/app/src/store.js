import { signal, computed } from '@preact/signals';
import { OPENINGS } from './openings';
import { sanEq } from './chess';

// In-memory session state only — no localStorage/sessionStorage. A page reload
// returns the app to its seeded baseline (empty favorites and saved lines,
// Classic theme). This is a hard requirement of the good-app genre.
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
export const saveTags = signal([]);
export const saveNotes = signal('');
export const saveError = signal('');

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
  saveTags.value = [];
  saveNotes.value = '';
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

export function addSavedLine(name, openingId, moves, userLineSnapshot, opts) {
  const id = 'line-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const o = opts || {};
  savedLines.value = [...savedLines.value, {
    id, name, openingId, moves,
    ply: typeof o.ply === 'number' ? o.ply : moves.length,
    tags: Array.isArray(o.tags) ? o.tags.slice() : [],
    notes: typeof o.notes === 'string' ? o.notes : '',
    userLine: userLineSnapshot || null
  }];
  return id;
}

export function deleteSavedLine(id) {
  savedLines.value = savedLines.value.filter(l => l.id !== id);
  showToast('Line deleted');
}

// Update a saved line's name/tags/notes. Only the provided (defined) fields
// are patched — undefined fields leave the existing value untouched. Callers
// (rename UI, WebMCP entity_update) must validate with validateTagsNotes first.
export function updateSavedLine(id, patch) {
  const p = patch || {};
  savedLines.value = savedLines.value.map(l => {
    if (l.id !== id) return l;
    return {
      ...l,
      name: typeof p.name === 'string' ? p.name : l.name,
      tags: Array.isArray(p.tags) ? p.tags.slice() : l.tags,
      notes: typeof p.notes === 'string' ? p.notes : l.notes
    };
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

// --- Export center / study artifacts (in-memory, live-compiled) --------------

export const showExportCenter = signal(false);
export const importError = signal('');

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
    if (!Array.isArray(tags) || tags.length > 8) return 'tags: at most 8 tags';
    for (const t of tags) {
      if (typeof t !== 'string' || t.length > 24 || !TAG_SET.includes(t)) {
        return `tags: "${t}" is outside the allowed tag set`;
      }
    }
  }
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 280)) {
    return 'notes: string of length 0 to 280';
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
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'payload: not a JSON object';
  if (doc.formatVersion !== '1') return 'formatVersion: must be exactly the string "1"';
  if (!THEMES_SET.includes(doc.boardTheme)) return 'boardTheme: must be one of classic, forest, slate';
  if (typeof doc.generatedAt !== 'string' || Number.isNaN(Date.parse(doc.generatedAt))) {
    return 'generatedAt: required ISO-8601 timestamp string';
  }
  if (!Array.isArray(doc.favorites)) return 'favorites: must be an array';
  for (const c of doc.favorites) {
    if (!ID_BY_CODE[c]) return `favorites: "${c}" is not a bundled opening code`;
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

// Import a StudyPack from raw text; replaces favorites, boardTheme, savedLines.
export function importStudyPackText(text) {
  let doc;
  try { doc = JSON.parse(text); }
  catch { importError.value = 'payload: the JSON could not be parsed'; return { ok: false, error: importError.value }; }
  const err = validateStudyPack(doc);
  if (err) { importError.value = err; return { ok: false, error: err }; }
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
  showToast('Study pack imported');
  return { ok: true, favorites: favorites.value.length, savedLines: savedLines.value.length };
}
