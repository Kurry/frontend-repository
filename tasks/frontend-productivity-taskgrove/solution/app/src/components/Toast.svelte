<script>
  import { store } from '../lib/store.svelte.js';

  let leaving = $state(new Set());

  function dismiss(id) {
    leaving = new Set([...leaving, id]);
    setTimeout(() => {
      store.toasts = store.toasts.filter(t => t.id !== id);
      const next = new Set(leaving);
      next.delete(id);
      leaving = next;
    }, 200);
  }

  $effect(() => {
    for (const toast of store.toasts) {
      setTimeout(() => dismiss(toast.id), 3000);
    }
  });
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite" aria-atomic="true">
  {#each store.toasts as toast (toast.id)}
    <div
      class="toast-item bg-[var(--color-text-primary)] text-[var(--color-background)] px-4 py-2 rounded-[16px] shadow-lg pointer-events-auto"
      class:toast-leaving={leaving.has(toast.id)}
      style="font-size: 10px; max-width: 280px; min-width: 160px;"
      role="status"
    >
      <span class="font-medium">{toast.message}</span>
    </div>
  {/each}
</div>

<div class="sr-only" aria-live="polite" aria-atomic="true">{store.liveMessage}</div>
