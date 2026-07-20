import React from 'react';
import { useGameStore } from '../store/gameStore';

interface GameOverProps {
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart }) => {
  const score = useGameStore(state => state.score);
  const bestScore = useGameStore(state => state.bestScore);
  const tilesCleared = useGameStore(state => state.tilesCleared);
  const elapsedTime = useGameStore(state => state.elapsedTime);

  const duration = Math.round(elapsedTime);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const isNewBest = score > 0 && score >= bestScore;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245,245,247,0.95)',
        borderRadius: '6px',
        padding: '24px',
        gap: '16px',
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: '34px', fontWeight: 700, color: '#1D1D1E', margin: 0 }}>
        Game over
      </h1>

      {isNewBest && (
        <div
          style={{
            backgroundColor: '#FFD60A',
            color: '#1D1D1E',
            padding: '6px 16px',
            borderRadius: '1000px',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          🎉 New best!
        </div>
      )}

      <div
        style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#007AFF',
          lineHeight: 1,
        }}
      >
        {score}
      </div>
      <div style={{ fontSize: '15px', color: '#4F4F55' }}>
        {minutes}m {seconds}s • {tilesCleared} tiles cleared
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={onRestart}
          className="ld-btn-primary"
          style={{
            color: '#FEFEFE',
            border: 'none',
            borderRadius: '1000px',
            padding: '12px 32px',
            fontSize: '17px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '48px',
          }}
        >
          Play again
        </button>
        <button
          onClick={() => {
            useGameStore.getState().setView('history');
            // We can handle the specific open-preview logic within MatchHistory 
            // since it's the top entry that represents the last match.
          }}
          aria-label="Export Run"
          className="ld-btn-secondary"
          style={{
            color: '#007AFF',
            border: '1px solid #66798B',
            borderRadius: '1000px',
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '48px',
          }}
        >
          Export Run
        </button>
      </div>
    </div>
  );
};

export default GameOver;
