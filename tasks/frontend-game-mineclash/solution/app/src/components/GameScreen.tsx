import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { Scoreboard } from './Scoreboard';
import { GameBoard } from './GameBoard';
import { HistoryPanel } from './HistoryPanel';
import { MAX_HINTS, HINT_COST } from '../gameLogic';

export const GameScreen = component$(() => {
  const store = useContext(AppCtx);
  const isPlayerTurn = store.currentTurn === 'player' && !store.isRivalThinking && store.phase === 'playing' && !store.paused;
  const hintsLeft = MAX_HINTS - store.hintsUsed;

  return (
    <div class="game-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '12px', maxWidth: '720px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span aria-hidden="true" style={{ fontSize: '20px' }}>⛏️</span>
          <span style={{ fontWeight: '800', color: '#F59E0B', fontSize: '18px' }}>MineClash</span>
          <span style={{ color: '#A8A29E', fontSize: '13px' }}>
            Round {store.roundNumber}/3 · {store.difficulty.charAt(0).toUpperCase() + store.difficulty.slice(1)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Match wins */}
          <span style={{ fontSize: '13px', color: '#A8A29E' }}>
            <span style={{ color: '#38BDF8' }}>{store.playerMatchWins}</span>
            {' – '}
            <span style={{ color: '#FB923C' }}>{store.rivalMatchWins}</span>
          </span>
          {/* Sound */}
          <button
            class="icon-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', fontSize: '18px', padding: '4px' }}
            onClick$={() => { store.soundEnabled = !store.soundEnabled; }}
            title={store.soundEnabled ? 'Mute' : 'Unmute'}
            aria-label={store.soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {store.soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{
        textAlign: 'center', padding: '6px 12px', borderRadius: '8px', marginBottom: '8px',
        background: isPlayerTurn ? 'rgba(56,189,248,0.12)' : 'rgba(251,146,60,0.12)',
        border: `1px solid ${isPlayerTurn ? '#38BDF8' : '#FB923C'}`,
        fontSize: '14px', fontWeight: '700',
        color: isPlayerTurn ? '#38BDF8' : '#FB923C',
        transition: 'all 0.3s',
      }} role="status" aria-live="polite">
        {store.isRivalThinking ? (
          <span class="animate-pulse-glow">🤔 Rival is thinking…</span>
        ) : store.phase === 'playing' ? (
          isPlayerTurn ? '🎯 Your turn — pick a tile' : '⏳ Rival\'s turn'
        ) : null}
      </div>

      {/* Scoreboard */}
      <Scoreboard />

      {/* Controls */}
      {store.phase === 'playing' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {/* Flag Mode */}
          <button
            class={`btn-secondary${store.playerMode === 'flag' ? ' btn-mode-active' : ''}`}
            style={{ flex: 1, minWidth: '100px', fontSize: '13px', padding: '8px' }}
            disabled={!isPlayerTurn}
            aria-pressed={store.playerMode === 'flag'}
            onClick$={() => {
              if (store.phase !== 'playing' || store.currentTurn !== 'player' || store.isRivalThinking) return;
              store.playerMode = store.playerMode === 'flag' ? 'reveal' : 'flag';
            }}
          >
            {store.playerMode === 'flag' ? '🚩 Flag on' : '🚩 Flag mode'}
          </button>

          {/* Hint */}
          <button
            class={`btn-secondary${store.playerMode === 'hint' ? ' btn-mode-active' : ''}`}
            style={{ flex: 1, minWidth: '100px', fontSize: '13px', padding: '8px', opacity: hintsLeft === 0 ? 0.4 : 1 }}
            disabled={!isPlayerTurn || hintsLeft === 0}
            aria-pressed={store.playerMode === 'hint'}
            onClick$={() => {
              if (store.phase !== 'playing' || store.currentTurn !== 'player' || store.isRivalThinking || store.hintsUsed >= MAX_HINTS) return;
              store.playerMode = store.playerMode === 'hint' ? 'reveal' : 'hint';
            }}
          >
            🔍 Hint ({hintsLeft}/{MAX_HINTS})
            {hintsLeft > 0 && <span style={{ fontSize: '10px', color: '#A8A29E', display: 'block' }}>−{HINT_COST} pts</span>}
          </button>

          {/* Save progress */}
          <button
            class="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            onClick$={() => {
              if (store.phase !== 'playing') return;
              store.savedCheckpoint = {
                playerName: store.playerName,
                difficulty: store.difficulty,
                roundNumber: store.roundNumber,
                playerScore: store.player.score,
                rivalScore: store.rival.score,
                playerStrikes: store.player.strikes,
                rivalStrikes: store.rival.strikes,
                sideToMove: store.currentTurn,
                hintsRemaining: 2 - store.hintsUsed,
                playerRoundWins: store.playerMatchWins,
                rivalRoundWins: store.rivalMatchWins,
                board: JSON.parse(JSON.stringify(store.tiles)),
                targetScore: store.targetScore,
                mineCount: store.mineCount
              };
              store.feedback = 'Match saved.';
            }}
          >
            💾 Save Progress
          </button>

          {/* Pause / Resume */}
          <button
            class="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            aria-pressed={store.paused}
            onClick$={() => {
              if (store.phase !== 'playing') return;
              store.paused = !store.paused;
              store.feedback = store.paused
                ? 'Match paused. Resume to continue.'
                : 'Match resumed. Your turn continues.';
            }}
          >
            {store.paused ? '▶ Resume' : '⏸ Pause'}
          </button>

          {/* History toggle */}
          <button
            class="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            onClick$={() => {
              if (store.phase === 'playing') store.showHistoryPanel = !store.showHistoryPanel;
            }}
          >
            {store.showHistoryPanel ? '▲ History' : '▼ History'}
          </button>
        </div>
      )}

      {/* Paused banner */}
      {store.paused && store.phase === 'playing' && (
        <div role="status" aria-live="polite" style={{
          textAlign: 'center', padding: '6px 12px', borderRadius: '8px', marginBottom: '8px',
          background: 'rgba(250,204,21,0.12)', border: '1px solid #FACC15',
          color: '#FACC15', fontSize: '14px', fontWeight: '700',
        }}>
          ⏸ Match paused
        </div>
      )}

      {/* Mode indicator */}
      {store.playerMode !== 'reveal' && isPlayerTurn && (
        <div style={{
          textAlign: 'center', fontSize: '12px', color: '#A8A29E', marginBottom: '6px',
          padding: '4px 8px', background: '#292524', borderRadius: '6px',
          border: `1px dashed ${store.playerMode === 'flag' ? '#38BDF8' : '#4ADE80'}`
        }}>
          {store.playerMode === 'flag' ? '🚩 Click a tile to flag/unflag it. Right-click also works.' : '🔍 Click an unrevealed tile to get a hint.'}
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: '#D6D3D1', fontSize: '12px', marginBottom: '6px',
          padding: '4px 8px', background: '#292524', borderRadius: '6px',
        }}
      >
        {store.feedback}
      </div>

      {/* Game Board */}
      <div style={{ flex: 1 }}>
        <GameBoard />
      </div>

      {/* History Panel */}
      {store.showHistoryPanel && <HistoryPanel />}

      {/* Target score reminder */}
      <div style={{ textAlign: 'center', color: '#A8A29E', fontSize: '12px', marginTop: '8px' }}>
        Target: <span style={{ color: '#F59E0B', fontFamily: "'Courier New', monospace" }}>{store.targetScore}</span> ore · Mines: {store.mineCount}
      </div>
    </div>
  );
});
