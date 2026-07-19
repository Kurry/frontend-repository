import { component$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface ToastProps {
  message: Signal<string>;
}

export const Toast = component$<ToastProps>(({ message }) => {
  if (!message.value) return null;

  return (
    <div class="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-bounce">
      <div class="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-sm font-medium text-white shadow-lg">
        {message.value}
      </div>
    </div>
  );
});
