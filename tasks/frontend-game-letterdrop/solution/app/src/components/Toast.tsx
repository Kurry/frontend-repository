import React from 'react';
import { useGameStore } from '../store/gameStore';

// The toast region is a single polite live region that never takes focus and
// never blocks interaction (pointer-events: none). Every transient confirmation
// — valid-word score, Bomb/Slow, Board Cleared!, achievement unlock, Saved,
// Copied, and the settings inline save message — flows through here so assistive
// tech announces them, and each one fades out on its own.
const Toast: React.FC = () => {
  const toasts = useGameStore((s) => s.toasts);

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
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
        width: 'calc(100% - 32px)',
        maxWidth: '360px',
      }}
    >
      {toasts.map((toast) => {
        let bgColor = '#1D1D1E';
        if (toast.type === 'success') bgColor = '#248A3D';
        else if (toast.type === 'error') bgColor = '#C81E1E';
        else if (toast.type === 'power') bgColor = '#B25000';
        else if (toast.type === 'achievement') bgColor = '#7A2FA8';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: bgColor,
              color: '#FEFEFE',
              padding: '10px 20px',
              borderRadius: '1000px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
              textAlign: 'center',
              maxWidth: '100%',
              animation: toast.leaving ? 'ld-fade-out 0.32s ease-in forwards' : 'ld-fade-in 0.28s ease-out',
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
