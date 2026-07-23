import {
  currentOpening, practiceActive, practicePrompt, practiceMessage,
  boardFlash, previewMoves, boardSelection, legalTargets, activeGame,
  selectedNodeId, getNodeMoves, nodeIdForPath, recordExploredMove,
  recordPracticeAttempt, showToast
} from './store';
import {
  applyMoves, generateLegalMoves, moveToString, parseSAN, sanEq, INITIAL_FEN
} from './chess';
import { play } from './sound';

export function clearInteraction() {
  boardSelection.value = null;
  legalTargets.value = [];
}

export function currentPath() {
  const game = activeGame.value;
  if (game) return game.moves.slice(0, game.index + 1);
  const preview = previewMoves.value;
  return preview || getNodeMoves();
}

export function positionForPath(path) {
  const states = applyMoves(INITIAL_FEN, path);
  return states[states.length - 1].state;
}

// Execute a resolved legal move object, routing through practice or exploration.
// Single source of truth for both mouse clicks and keyboard entry so the two
// inputs never diverge.
export function playMoveObject(move, notation, state) {
  const opening = currentOpening.value;
  const path = getNodeMoves();
  const capture = !!(move.capture || move.enpassant);

  if (practiceActive.value) {
    const exp = opening.moves[path.length];
    if (!exp) {
      practicePrompt.value = 'Line complete';
      clearInteraction();
      return;
    }
    if (sanEq(notation, exp)) {
      recordPracticeAttempt(true);
      practiceMessage.value = '';
      boardFlash.value = 'success';
      setTimeout(() => { if (boardFlash.value === 'success') boardFlash.value = null; }, 650);
      showToast('Correct!');
      play('correct');
      const nid = nodeIdForPath([...path, exp]);
      if (nid) selectedNodeId.value = nid;
      practicePrompt.value = path.length + 1 >= opening.moves.length ? 'Line complete' : 'Your move';
    } else {
      recordPracticeAttempt(false);
      practiceMessage.value = 'Try again';
      boardFlash.value = 'danger';
      showToast('Try again');
      play('incorrect');
      previewMoves.value = [...path, notation];
      setTimeout(() => {
        previewMoves.value = null;
        if (boardFlash.value === 'danger') boardFlash.value = null;
      }, 700);
    }
    clearInteraction();
    return;
  }

  recordExploredMove(path, notation);
  play(capture ? 'capture' : 'move');
  clearInteraction();
}

const FILES = 'abcdefgh';

// Parse a free-form move string against the current position. Accepts SAN
// ("Nf3", "exd5", "O-O"), 4/5-char UCI ("e2e4", "e7e8q"), or a bare target
// square ("e4") resolved to the unique legal move landing there.
export function parseMoveInput(input, state, legalMoves) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // UCI e.g. e2e4 / e7e8q
  const uci = lower.match(/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/);
  if (uci) {
    const fc = FILES.indexOf(uci[1]);
    const fr = 8 - parseInt(uci[2], 10);
    const tc = FILES.indexOf(uci[3]);
    const tr = 8 - parseInt(uci[4], 10);
    const promo = uci[5] || undefined;
    return legalMoves.find(m =>
      m.from.r === fr && m.from.c === fc && m.to.r === tr && m.to.c === tc &&
      (!promo || (m.promotion || '').toLowerCase() === promo)
    ) || null;
  }

  // Bare target square e.g. "e4" -> unique legal move to that square
  const sq = lower.match(/^([a-h])([1-8])$/);
  if (sq) {
    const tc = FILES.indexOf(sq[1]);
    const tr = 8 - parseInt(sq[2], 10);
    const candidates = legalMoves.filter(m => m.to.r === tr && m.to.c === tc);
    if (candidates.length === 1) return candidates[0];
    return null; // none or ambiguous — caller reports an error
  }

  return parseSAN(state, raw);
}

// Returns { ok: true } or { ok: false, error: '...' }.
export function tryNotation(input) {
  if (activeGame.value) {
    return { ok: false, error: 'The board is replaying a game — use Previous move and Next move, or close the replay first.' };
  }
  if (previewMoves.value) {
    return { ok: false, error: 'Resolve the current practice attempt before entering another move.' };
  }
  const opening = currentOpening.value;
  if (!opening) return { ok: false, error: 'Load an opening before entering moves.' };
  const path = getNodeMoves();
  const state = positionForPath(path);
  const legalMoves = generateLegalMoves(state);
  const move = parseMoveInput(input, state, legalMoves);
  if (!move) {
    return { ok: false, error: `"${input}" is not a legal move here — type SAN like Nf3, UCI like e2e4, or a target square.` };
  }
  const notation = moveToString(state, move);
  playMoveObject(move, notation, state);
  return { ok: true };
}
