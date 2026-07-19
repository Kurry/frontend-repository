import React from 'react';
import { useGameStore } from '../store/gameStore';

const Achievements: React.FC = () => {
  const achievements = useGameStore(state => state.achievements);

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
        Achievements
      </h2>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
        {achievements.map((ach) => (
          <li
            key={ach.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '6px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              opacity: ach.unlocked ? 1 : 0.5,
              filter: ach.unlocked ? 'none' : 'grayscale(1)',
              transition: 'opacity 0.3s, filter 0.3s',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: ach.unlocked ? '#007AFF' : '#E6EEF7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '18px', color: ach.unlocked ? '#FEFEFE' : '#AEAEB2' }}>
                {ach.unlocked ? '🏆' : '🔒'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 600, fontSize: '15px', color: '#1D1D1E' }}>
                {ach.name}
              </h3>
              <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#4F4F55', marginTop: '2px' }}>
                {ach.description}
              </div>
            </div>
            {/* Always render a visible status label so the locked/unlocked
                state carries a text alternative — the lock/trophy glyph
                above is aria-hidden, so this is the only accessible name
                for that state (WCAG 1.1.1). */}
            <div
              style={{
                fontSize: '11px',
                color: ach.unlocked ? '#34C759' : '#4F4F55',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {ach.unlocked ? 'Unlocked' : 'Locked'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Achievements;
