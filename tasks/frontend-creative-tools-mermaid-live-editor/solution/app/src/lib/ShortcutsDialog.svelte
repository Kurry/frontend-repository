<script>
  import { tick } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';

  let { open = $bindable(false) } = $props();

  let closeButton;

  const SHORTCUTS = [
    { keys: 'Ctrl / ⌘ + Z', action: 'Undo the last edit in the editor' },
    { keys: 'Ctrl / ⌘ + Shift + Z', action: 'Redo the undone edit' },
    { keys: 'Ctrl / ⌘ + F', action: 'Find in the current editor document' },
    { keys: 'Ctrl / ⌘ + Shift + [', action: 'Fold the region at the cursor' },
    { keys: 'Ctrl / ⌘ + Shift + ]', action: 'Unfold the region at the cursor' },
    { keys: 'Esc', action: 'Close this dialog' }
  ];

  const close = () => {
    open = false;
  };

  const onKeydown = (event) => {
    if (open && event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  $effect(() => {
    if (open) {
      tick().then(() => closeButton?.focus());
    }
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/45"
      aria-label="Close keyboard shortcuts"
      tabindex="-1"
      onclick={close}
      transition:fade={{ duration: prefersReducedMotion.current ? 0 : 160 }}
    ></button>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      data-testid="shortcuts-dialog"
      class="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800"
      in:scale={{ start: 0.96, duration: prefersReducedMotion.current ? 0 : 180 }}
      out:fade={{ duration: prefersReducedMotion.current ? 0 : 140 }}
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 id="shortcuts-title" class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Keyboard shortcuts
        </h2>
        <button
          type="button"
          bind:this={closeButton}
          onclick={close}
          aria-label="Close keyboard shortcuts"
          class="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          ✕
        </button>
      </div>
      <ul class="flex flex-col gap-2 text-sm">
        {#each SHORTCUTS as item (item.keys)}
          <li class="flex items-center justify-between gap-3">
            <span class="text-slate-600 dark:text-slate-300">{item.action}</span>
            <kbd
              class="whitespace-nowrap rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >{item.keys}</kbd>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}
