<script>
  import { store } from '../lib/store.svelte.js';

  const toasts = $derived(store.toasts);
</script>

{#if toasts.length > 0}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 items-end pointer-events-none" role="status" aria-live="polite" aria-atomic="false">
    {#each toasts as toast (toast.id)}
      <div
        class="toast-enter bg-[var(--color-text-primary)] text-[var(--color-background)] px-3 py-2 rounded shadow-lg pointer-events-auto"
        style="font-size: 10px; max-width: 240px;"
      >
        {toast.message}
      </div>
    {/each}
  </div>
{/if}
