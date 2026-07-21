import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface ToastProps {
  message: Signal<string>;
}

export const Toast = component$<ToastProps>(({ message }) => {
  const visible = useSignal(false);
  const exiting = useSignal(false);
  const displayText = useSignal('');

  useVisibleTask$(({ track }) => {
    track(() => message.value);
    if (message.value) {
      displayText.value = message.value;
      exiting.value = false;
      visible.value = true;
      const timer = setTimeout(() => {
        exiting.value = true;
        setTimeout(() => {
          visible.value = false;
          message.value = '';
        }, 250);
      }, 2500);
      return () => clearTimeout(timer);
    }
  });

  if (!visible.value) return null;

  return (
    <div
      class={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 ${exiting.value ? 'toast-exit' : 'toast-enter'}`}
      role="status"
      aria-live="polite"
    >
      <div class="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-sm font-medium text-white shadow-lg">
        {displayText.value}
      </div>
    </div>
  );
});
