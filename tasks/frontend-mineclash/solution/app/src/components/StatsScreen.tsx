import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { Difficulty } from '../types';

const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export const StatsScreen = component$(() => {
  const store = useContext(AppCtx);

  const totalPlayed = store.stats.easy.matchesPlayed + store.stats.medium.matchesPlayed + store.stats.hard.matchesPlayed;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📊 Stats</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => {
            if (store.phase === 'stats') store.phase = 'setup';
          }}
        >
          ← Go back
        </button>
      </div>

      {/* Empty state */}
      {totalPlayed === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#A8A29E' }}>
          <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '16px' }}>⛏️</div>
          <h2 style={{ fontSize: '22px', color: '#FAFAF9', marginBottom: '8px' }}>No matches played yet</h2>
          <p style={{ fontSize: '14px', maxWidth: '280px' }}>Start a match to begin tracking your progress across all difficulty levels.</p>
          <button
            class="btn-primary"
            style={{ marginTop: '24px', fontSize: '15px' }}
            onClick$={() => {
              if (store.phase === 'stats') store.phase = 'setup';
            }}
          >
            ⚔️ Start first match
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
            const s = store.stats[d];
            if (s.matchesPlayed === 0) return (
              <div key={d} class="panel" style={{ opacity: 0.5 }}>
                <div style={{ fontWeight: '700', color: '#A8A29E', marginBottom: '4px' }}>{DIFF_LABELS[d]}</div>
                <div style={{ color: '#78716C', fontSize: '13px' }}>No matches played</div>
              </div>
            );
            const winRate = s.matchesPlayed > 0 ? Math.round((s.matchesWon / s.matchesPlayed) * 100) : 0;
            return (
              <div key={d} class="panel">
                <div style={{ fontWeight: '700', color: '#F59E0B', marginBottom: '12px', fontSize: '16px' }}>
                  {DIFF_LABELS[d]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <StatRow label="Matches played" value={s.matchesPlayed} />
                  <StatRow label="Matches won" value={`${s.matchesWon} (${winRate}%)`} highlight />
                  <StatRow label="Total ore mined" value={s.totalOreMined} unit="ore" />
                  <StatRow label="Best round" value={s.bestSingleRoundScore} unit="ore" highlight />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

interface SRProps { label: string; value: string | number; unit?: string; highlight?: boolean; }
const StatRow = component$<SRProps>(({ label, value, unit, highlight }) => (
  <div>
    <div style={{ color: '#A8A29E', fontSize: '11px', letterSpacing: '0.2px', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontFamily: "'Courier New', monospace", fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: '20px', fontWeight: '700', color: highlight ? '#F59E0B' : '#FAFAF9' }}>
      {value}
      {unit && <span style={{ fontSize: '12px', color: '#A8A29E', marginLeft: '4px' }}>{unit}</span>}
    </div>
  </div>
));
