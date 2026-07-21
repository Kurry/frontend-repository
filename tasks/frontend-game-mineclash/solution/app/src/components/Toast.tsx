import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';

// Global, self-fading confirmation / rejection toast. Mounted once at the App
// root so it is visible over every screen. The message auto-clears from the
// store (see App.tsx); the key on the wrapper re-triggers the slide/fade-in so
// each new message animates in and out (motion 4.12 / 4.14). It never blocks
// play — it is position:fixed with pointer-events:none.
export const Toast = component$(() => {
  const store = useContext(AppCtx);
  if (!store.toast) return null;

  const accent =
    store.toastKind === 'success' ? '#4ADE80' :
    store.toastKind === 'reject' ? '#EF4444' : '#F59E0B';

  return (
    <div
      role="status"
      aria-live="polite"
      key={store.toast}
      class={`mc-toast mc-toast-${store.toastKind}`}
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        zIndex: 500,
        maxWidth: 'min(92vw, 420px)',
        background: '#292524',
        border: `1px solid ${accent}`,
        color: '#FAFAF9',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        lineHeight: 1.4,
        boxShadow: `0 6px 24px rgba(0,0,0,0.45), 0 0 0 1px ${accent}22`,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true" style={{ color: accent, fontSize: '15px', lineHeight: 1 }}>
        {store.toastKind === 'success' ? '✓' : store.toastKind === 'reject' ? '⛌' : 'ℹ'}
      </span>
      <span>{store.toast}</span>
    </div>
  );
});
