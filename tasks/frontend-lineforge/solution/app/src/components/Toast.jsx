import { h } from 'preact';
import { toastMessage } from '../store';

// Always mounted so the live region exists before the first status message.
export function Toast() {
  const message = toastMessage.value;
  return (
    <div
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {message && (
        <div class="toast bg-[var(--color-primary)] text-white px-5 py-3 rounded-[10px] shadow-lg text-base font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
