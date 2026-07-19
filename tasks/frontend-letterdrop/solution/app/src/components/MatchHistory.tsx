import React from 'react';
import { useGameStore } from '../store/gameStore';

const MatchHistory: React.FC = () => {
  const matchHistory = useGameStore(state => state.matchHistory);

  if (matchHistory.length === 0) {
    return (
      <div
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          color: '#86868B',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1D1D1E', marginBottom: '4px' }}>
          No games yet
        </h2>
        <div style={{ fontSize: '15px', color: '#4F4F55' }}>
          Complete a game to see your match history here
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <h2
        style={{
          fontSize: '17px',
          fontWeight: 600,
          color: '#1D1D1E',
          marginBottom: '12px',
        }}
      >
        Match history
      </h2>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
        {matchHistory.map((record, index) => {
          const minutes = Math.floor(record.duration / 60);
          const seconds = record.duration % 60;
          const date = new Date(record.date);
          const dateStr = date.toLocaleDateString();

          return (
            <li
              key={index}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#007AFF' }}>
                  {record.score}
                </div>
                <div style={{ fontSize: '13px', color: '#4F4F55' }}>
                  {record.tilesCleared} tiles
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#4F4F55' }}>
                  {minutes}m {seconds}s
                </div>
                <div style={{ fontSize: '11px', color: '#5F5F65' }}>
                  {dateStr}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MatchHistory;
