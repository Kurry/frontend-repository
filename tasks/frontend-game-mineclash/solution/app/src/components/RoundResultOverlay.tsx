import { component$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { startNextRound } from '../gameLogic';
import { playRoundEnd } from '../audio';

export const RoundResultOverlay = component$(() => {
  const store = useContext(AppCtx);
  const result = store.lastRoundResult;
  if (!result) return null;

  const playerWon = result.winner === 'player';
  const isDraw = result.winner === 'draw';
  const matchOver = store.playerMatchWins >= 2 || store.rivalMatchWins >= 2;

  useVisibleTask$(() => {
    playRoundEnd(store.soundEnabled, playerWon);

    // Focus management
    const activeElement = document.activeElement;
    const dialog = document.getElementById('round-result-dialog');
    if (dialog) dialog.focus();

    return () => {
      if (activeElement && activeElement instanceof HTMLElement) {
        activeElement.focus();
      }
    };
  });

  return (
    <div class="overlay" style={{ zIndex: 200 }}>
      <div
        id="round-result-dialog"
        tabIndex={-1}
        class="panel animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-result-title"
        style={{ maxWidth: '380px', width: '90%', textAlign: 'center', outline: 'none' }}
      >
        {/* Winner announcement */}
        <div aria-hidden="true" style={{ fontSize: '40px', marginBottom: '8px' }}>
          {isDraw ? '🤝' : playerWon ? '🏆' : '😤'}
        </div>
        <h2 id="round-result-title" style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: isDraw ? '#FACC15' : playerWon ? '#4ADE80' : '#EF4444' }}>
          {isDraw ? 'It\'s a draw!' : playerWon ? 'You win!' : 'Rival wins!'}
        </h2>
        <p style={{ color: '#A8A29E', margin: '0 0 16px', fontSize: '14px' }}>{result.reason}</p>

        {/* Scores */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#A8A29E', fontSize: '12px' }}>You</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '28px', fontWeight: '700', color: playerWon ? '#4ADE80' : '#FAFAF9' }}>
              {result.playerScore}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#A8A29E', fontSize: '18px' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#A8A29E', fontSize: '12px' }}>Rival</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '28px', fontWeight: '700', color: !playerWon && !isDraw ? '#4ADE80' : '#FAFAF9' }}>
              {result.rivalScore}
            </div>
          </div>
        </div>

        {/* Match wins */}
        <div style={{ marginBottom: '20px', color: '#A8A29E', fontSize: '14px' }}>
          Round {store.roundNumber} of 3 · Match:{' '}
          <span style={{ color: '#38BDF8', fontWeight: '700' }}>{store.playerMatchWins}</span>
          {' – '}
          <span style={{ color: '#FB923C', fontWeight: '700' }}>{store.rivalMatchWins}</span>
        </div>

        {/* Buttons */}
        <button
          autoFocus
          class="btn-primary"
          style={{ width: '100%', fontSize: '16px', padding: '12px' }}
          onClick$={() => { startNextRound(store); }}
        >
          {matchOver ? '🏁 See match results' : '▶ Next round'}
        </button>
      </div>
    </div>
  );
});
