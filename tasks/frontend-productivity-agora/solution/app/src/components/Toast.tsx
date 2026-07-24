import { createSignal, For } from "solid-js";

interface ToastItem {
  id: number;
  message: string;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let nextId = 0;

export function showToast(message: string) {
  const id = nextId++;
  setToasts(prev => [...prev, { id, message }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 3000);
}

export function ToastContainer() {
  return (
    <div
      class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      style="max-width: 360px; pointer-events: none;"
    >
      <For each={toasts()}>
        {(t) => (
          <div
            class="toast-enter rounded px-5 py-3 shadow-lg font-medium"
            style="background: var(--color-primary); color: white; font-size: 16px; pointer-events: auto;"
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        )}
      </For>
    </div>
  );
}
