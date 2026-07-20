import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { Difficulty } from '../types';

const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const WINNER_LABELS: Record<'player' | 'rival' | 'draw', string> = {
  player: 'You won',
  rival: 'Rival won',
  draw: 'Draw',
};

export const MatchLogScreen = component$(() => {
  const store = useContext(AppCtx);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📜 Match log</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => {
            if (store.phase === 'match-log') store.phase = 'setup';
          }}
        >
          ← Go back
        </button>
      </div>

      {store.matchLog.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#A8A29E' }}>
          <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
          <h2 style={{ fontSize: '22px', color: '#FAFAF9', marginBottom: '8px' }}>No matches played yet</h2>
          <p style={{ fontSize: '14px', maxWidth: '280px' }}>Finish a best-of-3 match to see it recorded here.</p>
          <button
            class="btn-primary"
            style={{ marginTop: '24px', fontSize: '15px' }}
            onClick$={() => {
              if (store.phase === 'match-log') store.phase = 'setup';
            }}
          >
            ⚔️ Start a match
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...store.matchLog].reverse().map((entry, i) => (
            <div key={`${entry.endedAt}-${i}`} class="panel" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#FAFAF9' }}>{entry.playerName}</span>
                <span style={{ fontSize: '13px', color: entry.winner === 'player' ? '#4ADE80' : entry.winner === 'rival' ? '#EF4444' : '#A8A29E' }}>
                  {WINNER_LABELS[entry.winner]}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#A8A29E' }}>
                <span>{DIFF_LABELS[entry.difficulty]}</span>
                <span style={{ fontFamily: "'Courier New', monospace" }}>{entry.playerRoundWins} – {entry.rivalRoundWins}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#78716C' }}>{new Date(entry.endedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
