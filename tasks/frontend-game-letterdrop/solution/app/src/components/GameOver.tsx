import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatDuration } from '../game/io';

const INK = '#0052A3';

interface GameOverProps {
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart }) => {
  const lastRun = useGameStore((s) => s.lastRun);
  const score = useGameStore((s) => s.score);
  const bestScore = useGameStore((s) => s.bestScore);
  const tilesCleared = useGameStore((s) => s.tilesCleared);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const maxTierReached = useGameStore((s) => s.maxTierReached);
  const currentRunWords = useGameStore((s) => s.currentRunWords);
  const openExportRun = useGameStore((s) => s.openExportRun);

  const finalScore = lastRun ? lastRun.score : score;
  const finalTiles = lastRun ? lastRun.tilesCleared : tilesCleared;
  const finalDuration = lastRun ? lastRun.durationSec : Math.round(elapsedTime);
  const finalTier = lastRun ? lastRun.tierReached : maxTierReached;
  const finalWords = lastRun ? lastRun.words.length : currentRunWords.length;
  const isNewBest = finalScore > 0 && finalScore >= bestScore;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="gameover-title"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245,245,247,0.96)',
        borderRadius: '6px',
        padding: '20px',
        gap: '12px',
        zIndex: 10,
        animation: 'ld-fade-in 0.3s ease-out',
      }}
    >
      <h1 id="gameover-title" style={{ fontSize: '30px', fontWeight: 800, color: '#1D1D1E', margin: 0 }}>
        Game Over
      </h1>

      {isNewBest && (
        <div style={{ backgroundColor: '#FFD60A', color: '#1D1D1E', padding: '5px 14px', borderRadius: '1000px', fontWeight: 700, fontSize: '13px' }}>
          New best score!
        </div>
      )}

      <div style={{ fontSize: '52px', fontWeight: 800, color: INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {finalScore}
      </div>

      <div style={{ display: 'flex', gap: '14px', fontSize: '14px', color: '#4F4F55', fontWeight: 600, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>{finalTiles} tiles cleared</span>
        <span aria-hidden="true">•</span>
        <span>Tier {finalTier}</span>
        <span aria-hidden="true">•</span>
        <span>{formatDuration(finalDuration)}</span>
        <span aria-hidden="true">•</span>
        <span>{finalWords} {finalWords === 1 ? 'word' : 'words'}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onRestart}
          className="ld-btn-primary"
          aria-label="Play again"
          style={{ color: '#FEFEFE', border: 'none', borderRadius: '1000px', padding: '12px 28px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', minHeight: '48px' }}
        >
          Play again
        </button>
        <button
          onClick={() => openExportRun()}
          aria-label="Export Run"
          className="ld-btn-secondary"
          style={{ color: INK, border: 'none', borderRadius: '1000px', padding: '12px 22px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '48px' }}
        >
          Export Run
        </button>
      </div>
    </div>
  );
};

export default GameOver;
