import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTY_TIERS } from '../game/types';

const HUD: React.FC = () => {
  const score = useGameStore(state => state.score);
  const bestScore = useGameStore(state => state.bestScore);
  const streak = useGameStore(state => state.streak);
  const multiplier = useGameStore(state => state.multiplier);
  const difficulty = useGameStore(state => state.difficulty);
  const elapsedSeconds = useGameStore(state => Math.floor(state.elapsedTime));
  const gameStarted = useGameStore(state => state.gameStarted);
  const isGameOver = useGameStore(state => state.isGameOver);

  const tier = DIFFICULTY_TIERS[difficulty] || DIFFICULTY_TIERS[0];
  const timer = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 4px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {/* Score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>Score</div>
        <div aria-live="polite" style={{ fontSize: '28px', fontWeight: 700, color: '#1D1D1E', lineHeight: 1.1 }}>
          {score}
        </div>
        {gameStarted && (
          <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>
            Timer {timer}
          </div>
        )}
      </div>

      {/* Streak & Multiplier */}
      {(gameStarted || isGameOver) && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Streak badge */}
          {streak >= 3 && (
            <div
              style={{
                backgroundColor: '#007AFF',
                color: '#FEFEFE',
                padding: '4px 12px',
                borderRadius: '1000px',
                fontSize: '13px',
                fontWeight: 700,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              🔥 {streak}x streak
            </div>
          )}

          {/* Multiplier */}
          {multiplier > 1 && (
            <div
              style={{
                backgroundColor: '#FFD60A',
                color: '#1D1D1E',
                padding: '4px 10px',
                borderRadius: '1000px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {multiplier}x
            </div>
          )}
        </div>
      )}

      {/* Difficulty & Best */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        {gameStarted && (
          <div
            style={{
              backgroundColor: '#007AFF',
              color: '#FEFEFE',
              padding: '3px 10px',
              borderRadius: '1000px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {tier.name}
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#4F4F55', fontWeight: 600 }}>
          Best: {bestScore}
        </div>
      </div>
    </div>
  );
};

export default HUD;
