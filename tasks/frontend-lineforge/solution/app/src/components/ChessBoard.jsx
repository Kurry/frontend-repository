import { h } from 'preact';
import {
  currentOpening, selectedNodeId, boardFlipped,
  practiceActive, practiceStreak, practiceCorrect, practiceTotal,
  practicePrompt, practiceMessage,
  userLine, activeGame, boardSelection, legalTargets, boardFlash, previewMoves,
  getNodeMoves, nodeIdForPath, recordExploredMove, showToast
} from '../store';
import {
  applyMoves, generateLegalMoves, moveToString, sanEq,
  PIECE_UNICODE, INITIAL_FEN, findKing, isInCheck, squareLabel
} from '../chess';

function ownPiece(piece, turn) {
  if (!piece) return false;
  return turn === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
}

export function ChessBoard() {
  const opening = currentOpening.value;
  if (!opening) return null;

  const game = activeGame.value;
  const preview = previewMoves.value;
  const path = game ? game.moves.slice(0, game.index + 1) : (preview || getNodeMoves());

  const states = applyMoves(INITIAL_FEN, path);
  const currentPos = states[states.length - 1].state;
  const legalMoves = generateLegalMoves(currentPos);

  // Captured-piece tally from the position diff
  const initialCounts = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1, p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const currentCounts = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = currentPos.board[r][c];
      if (p) currentCounts[p] = (currentCounts[p] || 0) + 1;
    }
  }
  const capturedByWhite = [];
  const capturedByBlack = [];
  for (const [piece, count] of Object.entries(initialCounts)) {
    const diff = count - (currentCounts[piece] || 0);
    const isWhitePiece = piece === piece.toUpperCase();
    for (let i = 0; i < diff; i++) {
      if (isWhitePiece) capturedByBlack.push(PIECE_UNICODE[piece]);
      else capturedByWhite.push(PIECE_UNICODE[piece]);
    }
  }

  const select = (r, c) => {
    const targets = legalMoves.filter(m => m.from.r === r && m.from.c === c);
    if (targets.length > 0) {
      boardSelection.value = { r, c };
      legalTargets.value = targets.map(m => m.to);
    }
  };

  const clearSelection = () => {
    boardSelection.value = null;
    legalTargets.value = [];
  };

  const practiceAttempt = (move, notation) => {
    const exp = opening.moves[path.length];
    if (!exp) {
      practicePrompt.value = 'Line complete';
      clearSelection();
      return;
    }
    practiceTotal.value += 1;
    if (sanEq(notation, exp)) {
      practiceCorrect.value += 1;
      practiceStreak.value += 1;
      practiceMessage.value = '';
      boardFlash.value = 'success';
      setTimeout(() => { if (boardFlash.value === 'success') boardFlash.value = null; }, 650);
      showToast('Correct!');
      const nid = nodeIdForPath([...path, exp]);
      if (nid) selectedNodeId.value = nid;
      practicePrompt.value = path.length + 1 >= opening.moves.length ? 'Line complete' : 'Your move';
    } else {
      practiceStreak.value = 0;
      practiceMessage.value = 'Try again';
      boardFlash.value = 'danger';
      showToast('Try again');
      previewMoves.value = [...path, notation];
      setTimeout(() => {
        previewMoves.value = null;
        if (boardFlash.value === 'danger') boardFlash.value = null;
      }, 700);
    }
    clearSelection();
  };

  const executeMove = (move) => {
    const notation = moveToString(currentPos, move);
    if (practiceActive.value) {
      practiceAttempt(move, notation);
      return;
    }
    recordExploredMove(path, notation);
    clearSelection();
  };

  // Unified activation used by mouse-up and keyboard: attempt a move to
  // (r, c) when a piece is picked up, otherwise pick up an own piece.
  const activate = (r, c) => {
    if (game) {
      showToast('Board is replaying a game — use Previous move and Next move, or select Close');
      return;
    }
    if (preview) return;
    const sel = boardSelection.value;
    const piece = currentPos.board[r][c];
    const own = ownPiece(piece, currentPos.turn);
    if (sel && !(sel.r === r && sel.c === c)) {
      const move = legalMoves.find(m => m.from.r === sel.r && m.from.c === sel.c && m.to.r === r && m.to.c === c);
      if (move) {
        executeMove(move);
        return;
      }
      if (own) {
        select(r, c);
        return;
      }
      showToast('Illegal move — choose one of the highlighted squares');
      return;
    }
    if (own) select(r, c);
  };

  const onSquareMouseDown = (r, c) => {
    if (game || preview) return;
    const piece = currentPos.board[r][c];
    if (ownPiece(piece, currentPos.turn)) select(r, c);
  };

  const onSquareMouseUp = (r, c) => {
    const sel = boardSelection.value;
    if (game) {
      showToast('Board is replaying a game — use Previous move and Next move, or select Close');
      return;
    }
    if (preview) return;
    if (sel && !(sel.r === r && sel.c === c)) activate(r, c);
  };

  const onSquareKeyDown = (e, r, c) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(r, c);
    }
  };

  const flipped = boardFlipped.value;
  const isLegalTarget = (r, c) => legalTargets.value.some(t => t.r === r && t.c === c);
  const isSelected = (r, c) => boardSelection.value?.r === r && boardSelection.value?.c === c;

  const inCheck = isInCheck(currentPos);
  const kingPos = inCheck ? findKing(currentPos.board, currentPos.turn) : null;

  const last = states[states.length - 1];
  const lastMove = path.length > 0 && last.move ? last.move : null;

  return (
    <div class="flex flex-col sm:flex-row gap-4 items-start">
      <div class={`board-wrapper w-full sm:w-auto ${boardFlash.value ? `flash-${boardFlash.value}` : ''}`}>
        <div class="grid grid-cols-8 rounded-[10px] overflow-hidden shadow-lg board-frame" style="width: min(368px, 100%); aspect-ratio: 1;">
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const displayR = flipped ? 7 - row : row;
            const displayC = flipped ? 7 - col : col;
            const piece = currentPos.board[displayR][displayC];
            const isLight = (displayR + displayC) % 2 === 0;
            const isTarget = isLegalTarget(displayR, displayC);
            const isSel = isSelected(displayR, displayC);
            const isLastMove = lastMove && (
              (lastMove.from.r === displayR && lastMove.from.c === displayC) ||
              (lastMove.to.r === displayR && lastMove.to.c === displayC)
            );
            const isKingCheck = kingPos && kingPos.r === displayR && kingPos.c === displayC;

            return (
              <div
                key={i}
                class={`relative flex items-center justify-center cursor-pointer select-none
                  ${isLight ? 'board-light' : 'board-dark'}
                  ${isSel ? 'square-selected' : ''}
                  ${isLastMove ? 'square-last-move' : ''}
                  ${isKingCheck ? 'square-check' : ''}
                `}
                style="aspect-ratio: 1;"
                onMouseDown={() => onSquareMouseDown(displayR, displayC)}
                onMouseUp={() => onSquareMouseUp(displayR, displayC)}
                onKeyDown={e => onSquareKeyDown(e, displayR, displayC)}
                role="button"
                tabIndex={0}
                aria-label={squareLabel(displayR, displayC, piece)}
                aria-pressed={isSel}
              >
                {piece && (
                  <span
                    class={`select-none ${isSel ? 'piece-lifted' : ''} ${
                      piece === piece.toUpperCase() ? 'piece-white' : 'piece-black'
                    }`}
                    aria-hidden="true"
                  >
                    {PIECE_UNICODE[piece]}
                  </span>
                )}
                {isTarget && !piece && (
                  <div class="absolute w-3 h-3 bg-black/25 rounded-full pointer-events-none" aria-hidden="true" />
                )}
                {isTarget && piece && (
                  <div class="absolute inset-0 border-4 border-black/35 pointer-events-none" aria-hidden="true" />
                )}
                {col === 0 && (
                  <span class={`absolute top-0.5 left-1 text-[10px] font-bold coord ${isLight ? 'coord-on-light' : 'coord-on-dark'}`} aria-hidden="true">
                    {8 - displayR}
                  </span>
                )}
                {row === 7 && (
                  <span class={`absolute bottom-0.5 right-1 text-[10px] font-bold coord ${isLight ? 'coord-on-light' : 'coord-on-dark'}`} aria-hidden="true">
                    {String.fromCharCode(97 + displayC)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div class="flex flex-col gap-2 self-stretch justify-start min-w-[96px]">
        <h3 class="side-heading">Captured pieces</h3>
        <div class="space-y-2 text-base">
          <div>
            <div class="text-sm text-neutral-600">By white</div>
            <div class="text-xl leading-tight">{capturedByWhite.join(' ') || 'None'}</div>
          </div>
          <div>
            <div class="text-sm text-neutral-600">By black</div>
            <div class="text-xl leading-tight">{capturedByBlack.join(' ') || 'None'}</div>
          </div>
        </div>
        <div class="mt-1 text-base text-neutral-700">
          {currentPos.turn === 'w' ? 'White to move' : 'Black to move'}
          {inCheck ? ' — check' : ''}
        </div>
      </div>
    </div>
  );
}
