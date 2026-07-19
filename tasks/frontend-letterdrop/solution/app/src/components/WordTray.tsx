import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Tile } from '../game/types';

interface WordTrayProps {
  shake: boolean;
}

const TileDisplay: React.FC<{ tile: Tile }> = ({ tile }) => {
  let bg = '#FFFFFF';
  let color = '#1D1D1E';
  let shape: React.CSSProperties = { borderRadius: '8px' };

  if (tile.type === 'bomb') {
    bg = '#FF6B35';
    color = '#FEFEFE';
    shape = { borderRadius: '50%', transform: 'rotate(45deg)' };
  } else if (tile.type === 'slow') {
    bg = '#34C759';
    color = '#FEFEFE';
    shape = { borderRadius: '50%' };
  }

  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        fontSize: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        ...shape,
        userSelect: 'none',
      }}
    >
      <span style={tile.type === 'bomb' ? { transform: 'rotate(-45deg)' } : undefined}>
        {tile.letter.toUpperCase()}
      </span>
    </div>
  );
};

const WordTray: React.FC<WordTrayProps> = ({ shake }) => {
  const selectedWord = useGameStore(state => state.selectedWord);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
      }}
    >
      {/* Current word display */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '12px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          minHeight: '56px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          minWidth: '200px',
          maxWidth: '100%',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
          animation: shake ? 'shake 0.4s ease-in-out' : undefined,
          transition: 'box-shadow 0.2s',
        }}
      >
        {selectedWord.length === 0 ? (
          <span style={{ color: '#5F5F65', fontSize: '15px', fontStyle: 'italic' }}>
            Tap tiles to build a word
          </span>
        ) : (
          selectedWord.map(tile => <TileDisplay key={tile.id} tile={tile} />)
        )}
      </div>

      {/* Current word text */}
      {selectedWord.length > 0 && (
        <>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1D1D1E',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {selectedWord.map(t => t.letter).join('')}
          </div>
          <div aria-live="polite" style={{ fontSize: '13px', color: '#4F4F55' }}>
            {selectedWord.length} {selectedWord.length === 1 ? 'letter' : 'letters'} selected
          </div>
        </>
      )}
      {shake && (
        <div role="alert" style={{ color: '#B42318', fontSize: '14px', fontWeight: 600 }}>
          Not a word — try a different letter combination
        </div>
      )}
    </div>
  );
};

export default WordTray;
