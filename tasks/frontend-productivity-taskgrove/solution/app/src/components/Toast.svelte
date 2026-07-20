<script>
  import { store } from '../lib/store.svelte.js';
  import { createToaster } from '@melt-ui/svelte';
  import { fade, fly } from 'svelte/transition';

  // Melt UI toaster logic
  const toaster = createToaster({
    type: 'foreground',
    duration: 3000,
    closeDelay: 0,
  });

  const { elements, helpers, states } = toaster;
  const { toasts } = states;
  const { content, title, description, close } = elements;

  $effect(() => {
    if (store.toasts.length > 0) {
      const pending = store.toasts[store.toasts.length - 1];
      helpers.addToast({
        data: { title: pending.message },
      });
      // Clear the store queue so it doesn't get added twice
      store.toasts = [];
    }
  });
</script>

{#if $toasts.length > 0}
  <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none m-0 p-0" aria-live="polite">
    {#each $toasts as toast (toast.id)}
      <div
        class="bg-[var(--color-text-primary)] text-[var(--color-background)] px-3 py-2 rounded shadow-lg pointer-events-auto flex items-center justify-between"
        style="font-size: 10px; max-width: 240px; min-width: 150px;"
        in:fly={{ y: 20, duration: 200 }}
        out:fade={{ duration: 150 }}
        {...$content(toast.id)}
      >
        <span class="m-0 font-medium" {...$title(toast.id)}>
          {toast.data.title}
        </span>
      </div>
    {/each}
  </div>
{/if}
