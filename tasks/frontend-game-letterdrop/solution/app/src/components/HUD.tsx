import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTY_TIERS } from '../game/types';
import { formatClock } from '../game/io';

const FILL = '#0066CC'; // white text on this passes WCAG AA (>=5.5:1)
const INK = '#0052A3';

const STREAK_THRESHOLDS = [3, 5, 8];

function nextThreshold(streak: number): number {
  for (const t of STREAK_THRESHOLDS) if (streak < t) return t;
  return 8;
}

const HUD: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const bestScore = useGameStore((s) => s.bestScore);
  const streak = useGameStore((s) => s.streak);
  const multiplier = useGameStore((s) => s.multiplier);
  const difficulty = useGameStore((s) => s.difficulty);
  const elapsedSeconds = useGameStore((s) => Math.floor(s.elapsedTime));
  const gameStarted = useGameStore((s) => s.gameStarted);

  const tier = DIFFICULTY_TIERS[difficulty] || DIFFICULTY_TIERS[0];
  const meterPct = Math.min(100, (Math.min(streak, 8) / 8) * 100);
  const active = gameStarted;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'start',
        gap: '8px 12px',
        padding: '8px 4px',
      }}
    >
      {/* Score + timer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>Score</div>
        <div aria-live="polite" style={{ fontSize: '30px', fontWeight: 800, color: '#1D1D1E', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
          {score}
        </div>
        {active && (
          <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>
            Time {formatClock(elapsedSeconds)}
          </div>
        )}
      </div>

      {/* Tier + best */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        {active && (
          <div
            style={{
              backgroundColor: FILL,
              color: '#FEFEFE',
              padding: '4px 12px',
              borderRadius: '1000px',
              fontSize: '13px',
              fontWeight: 700,
            }}
            aria-label={`Current difficulty ${tier.name}`}
          >
            {tier.name}
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>
          Best: <span style={{ color: INK, fontWeight: 700 }}>{bestScore}</span>
        </div>
      </div>

      {/* Streak meter + multiplier badge — spans both columns */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>
            Streak <span style={{ color: '#1D1D1E', fontWeight: 700 }}>{streak}</span>
          </span>
          {streak >= 3 && (
            <span
              style={{
                backgroundColor: FILL,
                color: '#FEFEFE',
                padding: '3px 10px',
                borderRadius: '1000px',
                fontSize: '12px',
                fontWeight: 700,
                animation: 'ld-pulse 1.6s ease-in-out infinite',
              }}
            >
              {multiplier}x combo
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#6B6B70' }}>
            {streak >= 8 ? 'Max bonus active' : `next bonus at ${nextThreshold(streak)}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Combo streak toward next multiplier"
          aria-valuemin={0}
          aria-valuemax={8}
          aria-valuenow={Math.min(streak, 8)}
          style={{
            position: 'relative',
            height: '10px',
            borderRadius: '1000px',
            backgroundColor: '#D8DEE6',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${meterPct}%`,
              borderRadius: '1000px',
              background: streak >= 8 ? 'linear-gradient(90deg,#0066CC,#34C759)' : FILL,
              transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), background 0.3s',
            }}
          />
          {/* threshold ticks at 3/5/8 */}
          {STREAK_THRESHOLDS.map((t) => (
            <span
              key={t}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${(t / 8) * 100}%`,
                width: '2px',
                backgroundColor: 'rgba(255,255,255,0.7)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HUD;
