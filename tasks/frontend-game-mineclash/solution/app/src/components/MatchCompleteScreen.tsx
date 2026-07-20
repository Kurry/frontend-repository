import { component$, useContext, useVisibleTask$, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { resetMatch } from '../gameLogic';
import confetti from 'canvas-confetti';

export const MatchCompleteScreen = component$(() => {
  const store = useContext(AppCtx);
  const playerWon = store.playerMatchWins >= 2;
  const copiedState = useSignal(false);

  useVisibleTask$(() => {
    if (playerWon) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Focus management
    const activeElement = document.activeElement;
    const dialog = document.getElementById('match-complete-dialog');
    if (dialog) dialog.focus();

    return () => {
      if (activeElement && activeElement instanceof HTMLElement) {
        activeElement.focus();
      }
    };
  });

  return (
    <div id="match-complete-dialog" role="dialog" aria-modal="true" aria-labelledby="match-complete-title" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', outline: 'none' }}>
      {/* Trophy */}
      <div aria-hidden="true" style={{ fontSize: '64px', marginBottom: '16px' }}>{playerWon ? '🏆' : '🤖'}</div>

      <h1 id="match-complete-title" style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 8px', textAlign: 'center', color: playerWon ? '#4ADE80' : '#EF4444' }}>
        {playerWon ? 'Victory!' : 'Defeated!'}
      </h1>
      <p style={{ color: '#A8A29E', margin: '0 0 24px', fontSize: '16px' }}>
        Match complete — {playerWon ? 'You won the match!' : 'Rival won the match.'}
      </p>

      {/* Match score overview */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <ScoreBadge label="You" wins={store.playerMatchWins} color="#38BDF8" />
        <div style={{ display: 'flex', alignItems: 'center', color: '#A8A29E', fontWeight: '700' }}>–</div>
        <ScoreBadge label="Rival" wins={store.rivalMatchWins} color="#FB923C" />
      </div>

      {/* Round-by-round table */}
      <div class="panel" style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#A8A29E', letterSpacing: '0.4px' }}>
          Round results
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {store.matchRounds.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#1C1917', borderRadius: '8px' }}>
              <span style={{ color: '#A8A29E', fontSize: '13px' }}>Round {r.roundNumber || (i + 1)}</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '14px' }}>
                <span style={{ color: '#38BDF8' }}>{r.playerScore}</span>
                {' vs '}
                <span style={{ color: '#FB923C' }}>{r.rivalScore}</span>
              </span>
              <span style={{
                fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                background: r.winner === 'player' ? 'rgba(74,222,128,0.2)' : r.winner === 'rival' ? 'rgba(239,68,68,0.2)' : 'rgba(250,204,21,0.2)',
                color: r.winner === 'player' ? '#4ADE80' : r.winner === 'rival' ? '#EF4444' : '#FACC15',
              }}>
                {r.winner === 'player' ? 'You' : r.winner === 'rival' ? 'Rival' : 'Draw'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {copiedState.value && (
         <div role="status" style={{ textAlign: 'center', marginBottom: '16px', color: '#4ADE80', fontWeight: 'bold' }}>
            Copied
         </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          autoFocus
          class="btn-primary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
          onClick$={() => { resetMatch(store); }}
        >
          🔄 Rematch
        </button>
        <button
          class="btn-secondary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
          onClick$={() => {
            if (store.phase === 'match-complete') {
              store.paused = false;
              store.phase = 'setup';
            }
          }}
        >
          🏠 New match
        </button>
        <button
          class="btn-secondary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
          onClick$={() => {
            if (store.phase === 'match-complete') store.phase = 'stats';
          }}
        >
          📊 Stats
        </button>
        <button
          class="btn-secondary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
          onClick$={() => {
            if (store.phase === 'match-complete') {
              store.phase = 'match-log';
            }
          }}
        >
          📜 Match log
        </button>
        <button
          class="btn-secondary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
          onClick$={() => {
            const latestMatch = store.matchLog[0];
            if (latestMatch) {
              const jsonStr = JSON.stringify(latestMatch, null, 2);
              navigator.clipboard.writeText(jsonStr).then(() => {
                copiedState.value = true;
                setTimeout(() => copiedState.value = false, 2000);
              });
            }
          }}
        >
          📤 Export Match
        </button>
      </div>
    </div>
  );
});

interface SBProps { label: string; wins: number; color: string; }
const ScoreBadge = component$<SBProps>(({ label, wins, color }) => (
  <div style={{ textAlign: 'center', background: '#292524', borderRadius: '12px', padding: '12px 20px', border: `2px solid ${color}` }}>
    <div style={{ color, fontSize: '12px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '36px', fontWeight: '700', color: '#FAFAF9' }}>{wins}</div>
  </div>
));
