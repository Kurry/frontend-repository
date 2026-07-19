// Chess rules engine: board state, legal move generation and algebraic notation

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FILES = 'abcdefgh';
const RANKS = '87654321';

export function parseFEN(fen) {
  const [position, turn, castling, enpassant, halfmove, fullmove] = fen.split(' ');
  const board = [];
  const rows = position.split('/');
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    let col = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        for (let i = 0; i < parseInt(ch, 10); i++) {
          board[r][col++] = null;
        }
      } else {
        board[r][col++] = ch;
      }
    }
  }
  return {
    board,
    turn: turn || 'w',
    castling: castling || '-',
    enpassant: enpassant || '-',
    halfmove: parseInt(halfmove, 10) || 0,
    fullmove: parseInt(fullmove, 10) || 1
  };
}

export function toAlg(file, rank) {
  return FILES[file] + RANKS[rank];
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

function isWhitePiece(piece) { return piece && piece === piece.toUpperCase(); }
function colorOf(piece) { return piece ? (isWhitePiece(piece) ? 'w' : 'b') : null; }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTHO_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// True when the square (r, c) is attacked by any piece of `color`.
// Direct piece scan — castling is intentionally not an attack, so this
// never recurses.
export function squareAttackedBy(board, r, c, color) {
  // Pawn attacks: a white pawn on (r + 1, c ± 1) attacks (r, c); black mirrors.
  const pawnRow = color === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    const pc = c + dc;
    if (inBounds(pawnRow, pc)) {
      const p = board[pawnRow][pc];
      if (p && colorOf(p) === color && p.toUpperCase() === 'P') return true;
    }
  }
  for (const [dr, dc] of KNIGHT_STEPS) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[nr][nc];
    if (p && colorOf(p) === color && p.toUpperCase() === 'N') return true;
  }
  for (const [dr, dc] of KING_STEPS) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[nr][nc];
    if (p && colorOf(p) === color && p.toUpperCase() === 'K') return true;
  }
  for (const [dr, dc] of DIAG_DIRS) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (colorOf(p) === color) {
          const t = p.toUpperCase();
          if (t === 'B' || t === 'Q') return true;
        }
        break;
      }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of ORTHO_DIRS) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (colorOf(p) === color) {
          const t = p.toUpperCase();
          if (t === 'R' || t === 'Q') return true;
        }
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function generatePseudoMoves(state) {
  const { board, turn, enpassant, castling } = state;
  const moves = [];
  const dir = turn === 'w' ? -1 : 1;
  const startRank = turn === 'w' ? 6 : 1;
  const promoRank = turn === 'w' ? 0 : 7;
  const opp = turn === 'w' ? 'b' : 'w';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || colorOf(piece) !== turn) continue;
      const type = piece.toUpperCase();

      if (type === 'P') {
        const nr = r + dir;
        if (inBounds(nr, c) && !board[nr][c]) {
          if (nr === promoRank) {
            for (const promo of ['Q', 'R', 'B', 'N']) {
              moves.push({ from: { r, c }, to: { r: nr, c }, promotion: turn === 'w' ? promo : promo.toLowerCase() });
            }
          } else {
            moves.push({ from: { r, c }, to: { r: nr, c } });
          }
          if (r === startRank) {
            const nr2 = r + 2 * dir;
            if (!board[nr2][c]) {
              moves.push({ from: { r, c }, to: { r: nr2, c } });
            }
          }
        }
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (target && colorOf(target) !== turn) {
            if (nr === promoRank) {
              for (const promo of ['Q', 'R', 'B', 'N']) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, promotion: turn === 'w' ? promo : promo.toLowerCase(), capture: target });
              }
            } else {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
            }
          }
          if (enpassant !== '-') {
            const epFile = FILES.indexOf(enpassant[0]);
            const epRank = RANKS.indexOf(enpassant[1]);
            if (nr === epRank && nc === epFile) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, enpassant: true, capture: turn === 'w' ? 'p' : 'P' });
            }
          }
        }
      } else if (type === 'N') {
        for (const [dr, dc] of KNIGHT_STEPS) {
          const nr = r + dr, nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (!target || colorOf(target) !== turn) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target || undefined });
          }
        }
      } else if (type === 'B' || type === 'R' || type === 'Q') {
        const dirs = [];
        if (type === 'B' || type === 'Q') dirs.push(...DIAG_DIRS);
        if (type === 'R' || type === 'Q') dirs.push(...ORTHO_DIRS);
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (inBounds(nr, nc)) {
            const target = board[nr][nc];
            if (!target) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } else {
              if (colorOf(target) !== turn) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
              }
              break;
            }
            nr += dr; nc += dc;
          }
        }
      } else if (type === 'K') {
        for (const [dr, dc] of KING_STEPS) {
          const nr = r + dr, nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (!target || colorOf(target) !== turn) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target || undefined });
          }
        }
        const rank = turn === 'w' ? 7 : 0;
        if (r === rank && c === 4) {
          const ksKey = turn === 'w' ? 'K' : 'k';
          if (castling.includes(ksKey) && !board[rank][5] && !board[rank][6] && board[rank][7]?.toUpperCase() === 'R') {
            if (!squareAttackedBy(board, rank, 4, opp) && !squareAttackedBy(board, rank, 5, opp) && !squareAttackedBy(board, rank, 6, opp)) {
              moves.push({ from: { r: rank, c: 4 }, to: { r: rank, c: 6 }, castle: 'k' });
            }
          }
          const qsKey = turn === 'w' ? 'Q' : 'q';
          if (castling.includes(qsKey) && !board[rank][3] && !board[rank][2] && !board[rank][1] && board[rank][0]?.toUpperCase() === 'R') {
            if (!squareAttackedBy(board, rank, 4, opp) && !squareAttackedBy(board, rank, 3, opp) && !squareAttackedBy(board, rank, 2, opp)) {
              moves.push({ from: { r: rank, c: 4 }, to: { r: rank, c: 2 }, castle: 'q' });
            }
          }
        }
      }
    }
  }
  return moves;
}

export function makeMove(state, move) {
  const board = cloneBoard(state.board);
  const { from, to, promotion, enpassant, castle } = move;
  const piece = board[from.r][from.c];

  board[to.r][to.c] = promotion || piece;
  board[from.r][from.c] = null;

  if (enpassant) {
    board[from.r][to.c] = null;
  }

  if (castle) {
    const rank = from.r;
    if (castle === 'k') {
      board[rank][5] = board[rank][7];
      board[rank][7] = null;
    } else {
      board[rank][3] = board[rank][0];
      board[rank][0] = null;
    }
  }

  let castling = state.castling;
  if (piece?.toUpperCase() === 'K') {
    castling = castling.replace(state.turn === 'w' ? /[KQ]/g : /[kq]/g, '');
  }
  if (piece?.toUpperCase() === 'R') {
    if (from.r === 7 && from.c === 7) castling = castling.replace('K', '');
    if (from.r === 7 && from.c === 0) castling = castling.replace('Q', '');
    if (from.r === 0 && from.c === 7) castling = castling.replace('k', '');
    if (from.r === 0 && from.c === 0) castling = castling.replace('q', '');
  }
  // A rook captured on its home square also removes that right.
  if (to.r === 7 && to.c === 7) castling = castling.replace('K', '');
  if (to.r === 7 && to.c === 0) castling = castling.replace('Q', '');
  if (to.r === 0 && to.c === 7) castling = castling.replace('k', '');
  if (to.r === 0 && to.c === 0) castling = castling.replace('q', '');
  if (castling === '') castling = '-';

  let ep = '-';
  if (piece?.toUpperCase() === 'P' && Math.abs(to.r - from.r) === 2) {
    ep = toAlg(from.c, (from.r + to.r) / 2);
  }

  const newTurn = state.turn === 'w' ? 'b' : 'w';
  const halfmove = (piece?.toUpperCase() === 'P' || move.capture) ? 0 : state.halfmove + 1;
  const fullmove = state.turn === 'b' ? state.fullmove + 1 : state.fullmove;

  return { board, turn: newTurn, castling, enpassant: ep, halfmove, fullmove };
}

export function findKing(board, color) {
  const king = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { r, c };
    }
  }
  return null;
}

export function isInCheck(state) {
  const king = findKing(state.board, state.turn);
  if (!king) return false;
  const opp = state.turn === 'w' ? 'b' : 'w';
  return squareAttackedBy(state.board, king.r, king.c, opp);
}

export function generateLegalMoves(state) {
  const pseudoMoves = generatePseudoMoves(state);
  const legalMoves = [];
  const opp = state.turn === 'w' ? 'b' : 'w';

  for (const move of pseudoMoves) {
    const newState = makeMove(state, move);
    const king = findKing(newState.board, state.turn);
    if (king && !squareAttackedBy(newState.board, king.r, king.c, opp)) {
      legalMoves.push(move);
    }
  }
  return legalMoves;
}

export function moveToString(state, move) {
  const { from, to, promotion, castle, capture } = move;
  const piece = state.board[from.r][from.c];

  if (castle === 'k') return 'O-O';
  if (castle === 'q') return 'O-O-O';

  let str = '';
  const type = piece.toUpperCase();

  if (type !== 'P') {
    str += type;
    // Disambiguation: another piece of the same type, from a different
    // origin square, that can also reach the target square.
    const legalMoves = generateLegalMoves(state);
    const ambiguous = legalMoves.filter(m =>
      (m.from.r !== from.r || m.from.c !== from.c) &&
      state.board[m.from.r][m.from.c]?.toUpperCase() === type &&
      m.to.r === to.r && m.to.c === to.c
    );
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some(m => m.from.c === from.c);
      const sameRank = ambiguous.some(m => m.from.r === from.r);
      if (!sameFile) {
        str += FILES[from.c];
      } else if (!sameRank) {
        str += RANKS[from.r];
      } else {
        str += FILES[from.c] + RANKS[from.r];
      }
    }
  }

  if (capture || (type === 'P' && from.c !== to.c)) {
    if (type === 'P') str += FILES[from.c];
    str += 'x';
  }

  str += toAlg(to.c, to.r);

  if (promotion) {
    str += '=' + promotion.toUpperCase();
  }

  const newState = makeMove(state, move);
  if (isInCheck(newState)) {
    const oppMoves = generateLegalMoves(newState);
    str += oppMoves.length === 0 ? '#' : '+';
  }

  return str;
}

// Compare two SAN strings ignoring check/mate/annotation suffixes.
export function sanEq(a, b) {
  const strip = s => String(s).replace(/[+#!?]/g, '');
  return strip(a) === strip(b);
}

export function parseSAN(state, san) {
  const clean = san.replace(/[+#!?]/g, '');
  const moves = generateLegalMoves(state);

  if (clean === 'O-O' || clean === '0-0') {
    return moves.find(m => m.castle === 'k') || null;
  }
  if (clean === 'O-O-O' || clean === '0-0-0') {
    return moves.find(m => m.castle === 'q') || null;
  }

  let type = 'P';
  let rest = clean;
  if ('KQRBN'.includes(clean[0])) {
    type = clean[0];
    rest = clean.slice(1);
  }

  rest = rest.replace('x', '');

  let promotion = null;
  const promoMatch = rest.match(/=([QRBN])/);
  if (promoMatch) {
    promotion = promoMatch[1];
    rest = rest.replace(/=[QRBN]/, '');
  }

  const targetFile = FILES.indexOf(rest.slice(-2, -1));
  const targetRank = RANKS.indexOf(rest.slice(-1));
  if (targetFile === -1 || targetRank < 0 || targetRank > 7) return null;

  let srcFile = -1, srcRank = -1;
  const prefix = rest.slice(0, -2);
  for (const ch of prefix) {
    if (ch >= 'a' && ch <= 'h') srcFile = FILES.indexOf(ch);
    if (ch >= '1' && ch <= '8') srcRank = RANKS.indexOf(ch);
  }

  for (const move of moves) {
    const piece = state.board[move.from.r][move.from.c];
    if (piece.toUpperCase() !== type) continue;
    if (move.to.c !== targetFile || move.to.r !== targetRank) continue;
    if (srcFile !== -1 && move.from.c !== srcFile) continue;
    if (srcRank !== -1 && move.from.r !== srcRank) continue;
    if (promotion && move.promotion?.toUpperCase() !== promotion) continue;
    return move;
  }
  return null;
}

export function applyMoves(fen, moves) {
  let state = parseFEN(fen || INITIAL_FEN);
  const result = [{ state, notation: null }];

  for (const san of moves) {
    const move = parseSAN(state, san);
    if (!move) break;
    const notation = moveToString(state, move);
    state = makeMove(state, move);
    result.push({ state, notation, move });
  }
  return result;
}

export function createInitialState() {
  return parseFEN(INITIAL_FEN);
}

export const PIECE_UNICODE = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

export const PIECE_NAMES = {
  K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn'
};

export function squareLabel(r, c, piece) {
  const square = toAlg(c, r);
  if (!piece) return `${square}, empty`;
  const color = piece === piece.toUpperCase() ? 'white' : 'black';
  return `${square}, ${color} ${PIECE_NAMES[piece.toUpperCase()]}`;
}
