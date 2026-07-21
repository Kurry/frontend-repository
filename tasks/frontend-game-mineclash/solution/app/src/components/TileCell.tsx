import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { playerRevealTile, playerToggleFlag, playerUseHint, MAX_HINTS, showToast } from '../gameLogic';
import { playMineHit, playOreReveal } from '../audio';

interface Props { row: number; col: number; }

const ADJ_COLORS = ['', '#38BDF8', '#4ADE80', '#FACC15', '#F59E0B', '#FB923C', '#EF4444', '#F87171', '#FAFAF9'];

export const TileCell = component$<Props>(({ row, col }) => {
  const store = useContext(AppCtx);
  const tile = store.tiles[row]?.[col];

  if (!tile) return <div />;

  const isPlayerTurn = store.currentTurn === 'player' && !store.isRivalThinking && store.phase === 'playing' && !store.paused;
  const canAct = isPlayerTurn && !tile.revealed;

  // Determine cursor class
  let cursorStyle = 'default';
  if (canAct) {
    if (store.playerMode === 'flag') cursorStyle = 'crosshair';
    else if (store.playerMode === 'hint') cursorStyle = 'help';
    else cursorStyle = 'pointer';
  }

  // Background color
  let bg = '#292524';
  let borderColor = '#44403C';
  if (tile.revealed) {
    if (tile.isMine) { bg = '#3B1515'; borderColor = '#EF4444'; }
    else { bg = '#1C1917'; borderColor = '#3C3735'; }
  } else if (tile.flagged) { bg = '#1E3A4A'; borderColor = '#38BDF8'; }
  else if (tile.hintStatus === 'safe') { bg = '#1A3B28'; borderColor = '#4ADE80'; }
  else if (tile.hintStatus === 'mine') { bg = '#3B2E10'; borderColor = '#FACC15'; }

  const tileClass = [
    'tile-btn',
    tile.revealed ? 'tile-revealed' : '',
    tile.revealed && tile.isMine ? 'tile-mine-hit' : '',
    tile.flagged ? 'tile-flagged' : '',
    tile.hintStatus === 'safe' ? 'tile-hinted-safe' : '',
    tile.hintStatus === 'mine' ? 'tile-hinted-mine' : '',
    store.playerMode === 'flag' && canAct ? 'flag-cursor' : '',
    store.playerMode === 'hint' && canAct ? 'hint-cursor' : '',
  ].filter(Boolean).join(' ');

  const tileLabel = tile.revealed
    ? tile.isMine
      ? `Tile ${row + 1}, ${col + 1}: revealed mine`
      : `Tile ${row + 1}, ${col + 1}: revealed safe tile, ${tile.oreValue} ore, ${tile.adjacentMines} adjacent mines`
    : tile.flagged
      ? `Tile ${row + 1}, ${col + 1}: flagged`
      : tile.hintStatus !== 'none'
        ? `Tile ${row + 1}, ${col + 1}: covered, hint says ${tile.hintStatus}`
        : `Tile ${row + 1}, ${col + 1}: covered`;

  return (
    <button
      class={tileClass}
      style={{
        width: '100%', aspectRatio: '1/1', background: bg, border: `1px solid ${borderColor}`,
        borderRadius: '4px', cursor: cursorStyle, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 0, flexDirection: 'column', gap: '1px',
        transition: 'background 0.1s, border-color 0.1s', userSelect: 'none',
        fontFamily: "'Courier New', monospace",
      }}
      onClick$={() => {
        if (store.paused) {
          showToast(store, 'Match is paused — resume before acting on a tile.', 'reject');
          return;
        }
        if (store.currentTurn !== 'player' || store.isRivalThinking || store.phase !== 'playing') {
          showToast(store, 'Not your turn — wait for the Rival to finish.', 'reject');
          return;
        }
        const t = store.tiles[row]?.[col];
        if (!t) return;
        if (t.revealed) {
          showToast(store, 'That tile is already revealed — pick a covered tile.', 'reject');
          return;
        }
        if (store.playerMode === 'hint') {
          if (store.hintsUsed < MAX_HINTS) playerUseHint(store, row, col);
          else store.feedback = 'No hints remain this round.';
          return;
        }
        if (store.playerMode === 'flag') {
          playerToggleFlag(store, row, col);
          return;
        }
        if (t.flagged) {
          showToast(store, 'That tile is flagged — unflag it before revealing.', 'reject');
          return;
        }
        const wasMine = t.isMine;
        playerRevealTile(store, row, col);
        if (wasMine) playMineHit(store.soundEnabled);
        else playOreReveal(store.soundEnabled);
      }}
      onContextMenu$={(e) => {
        e.preventDefault();
        if (store.paused) {
          showToast(store, 'Match is paused — resume before flagging a tile.', 'reject');
          return;
        }
        if (store.currentTurn !== 'player' || store.isRivalThinking || store.phase !== 'playing') {
          showToast(store, 'Not your turn — wait for the Rival before flagging.', 'reject');
          return;
        }
        const t = store.tiles[row]?.[col];
        if (!t || t.revealed) return;
        playerToggleFlag(store, row, col);
      }}
      aria-label={tileLabel}
      title={
        tile.revealed ? undefined :
        tile.flagged ? 'Flagged — right-click or use Flag mode to unflag' :
        tile.hintStatus === 'mine' ? '⚠️ Hint: this is a mine' :
        tile.hintStatus === 'safe' ? '✅ Hint: safe to reveal' :
        undefined
      }
    >
      {tile.revealed ? (
        tile.isMine ? (
          <span aria-hidden="true" style={{ fontSize: '14px' }}>💥</span>
        ) : (
          <>
            <span aria-hidden="true" style={{ fontSize: '11px', lineHeight: 1 }}>⛏</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', lineHeight: 1 }}>{tile.oreValue}</span>
            {tile.adjacentMines > 0 && (
              <span style={{ fontSize: '9px', color: ADJ_COLORS[Math.min(tile.adjacentMines, 8)] || '#FAFAF9', lineHeight: 1 }}>
                {tile.adjacentMines}
              </span>
            )}
          </>
        )
      ) : tile.flagged ? (
        <span aria-hidden="true" style={{ fontSize: '12px' }}>🚩</span>
      ) : tile.hintStatus === 'safe' ? (
        <span style={{ fontSize: '12px', color: '#4ADE80' }}>✓</span>
      ) : tile.hintStatus === 'mine' ? (
        <span style={{ fontSize: '12px', color: '#FACC15' }}>!</span>
      ) : null}
    </button>
  );
});
