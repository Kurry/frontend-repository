import React from 'react';
import { useGameStore } from '../store/gameStore';

const Toast: React.FC = () => {
  const toasts = useGameStore(state => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
        width: 'calc(100% - 32px)',
        maxWidth: '360px',
      }}
    >
      {toasts.map((toast, index) => {
        let bgColor = '#1D1D1E';
        let textColor = '#FEFEFE';

        if (toast.type === 'success') {
          bgColor = '#34C759';
        } else if (toast.type === 'error') {
          bgColor = '#FF3B30';
        } else if (toast.type === 'power') {
          bgColor = '#FF9500';
        } else if (toast.type === 'achievement') {
          bgColor = '#AF52DE';
        }

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '10px 20px',
              borderRadius: '1000px',
              fontSize: '14px',
              fontWeight: 600,
              animation: 'fadeInUp 0.3s ease-out',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              textAlign: 'center',
              maxWidth: '100%',
            }}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
