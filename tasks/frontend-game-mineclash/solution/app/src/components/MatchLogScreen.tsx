import { component$, useContext, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { Difficulty, MatchLogEntry } from '../types';
import { exportMatch, goBack } from '../gameLogic';
import { ExportArtifactView } from './ExportArtifactView';

const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const WINNER_LABELS: Record<'player' | 'rival' | 'draw', string> = {
  player: 'You won',
  rival: 'Rival won',
  draw: 'Draw',
};

export const MatchLogScreen = component$(() => {
  const store = useContext(AppCtx);
  const showArtifact = useSignal(false);
  const ordered = [...store.matchLog].reverse();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', maxWidth: '520px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📜 Match log</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => goBack(store)}
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
            onClick$={() => goBack(store)}
          >
            ⚔️ Start a match
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ordered.map((entry, idx) => (
            <div key={`${entry.endedAt}-${idx}`} class="panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#FAFAF9' }}>{entry.playerName}</span>
                <span style={{ fontSize: '13px', color: entry.winner === 'player' ? '#4ADE80' : entry.winner === 'rival' ? '#EF4444' : '#FACC15' }}>
                  {WINNER_LABELS[entry.winner]}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#A8A29E' }}>
                <span>{DIFF_LABELS[entry.difficulty]}</span>
                <span style={{ fontFamily: "'Courier New', monospace" }}>{entry.playerRoundWins} – {entry.rivalRoundWins}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#78716C', fontFamily: "'Courier New', monospace" }}>{new Date(entry.endedAt).toLocaleString()}</span>
                <button
                  type="button"
                  class="btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick$={() => { exportMatch(store, entry); showArtifact.value = true; }}
                  aria-label={`Export match for ${entry.playerName}`}
                >
                  📥 Export Match
                </button>
              </div>
            </div>
          ))}
          {showArtifact.value && <ExportArtifactView />}
        </div>
      )}
    </div>
  );
});
