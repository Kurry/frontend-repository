<script>
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { store } from './state.svelte.js';
  import { render, DIAGRAM_TYPE_LABELS } from './mermaid.js';

  let container = $state();
  let hasError = $state(false);
  let renderToken = 0;
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  const isEmpty = $derived(!store.code.trim());
  const errorActive = $derived(!!store.error);
  const typeLabel = $derived(DIAGRAM_TYPE_LABELS[store.diagramType] ?? store.diagramType);

  const chipTransition = () => ({ duration: prefersReducedMotion.current ? 0 : 200 });

  $effect(() => {
    if (isEmpty) {
      if (container) container.innerHTML = '';
      hasError = false;
      return;
    }

    const code = store.code;
    // Subscribe to every input of the render so the preview always reflects
    // the latest source, config, and theme.
    void store.lastValidMermaid;
    void store.renderCount;
    const token = ++renderToken;

    (async () => {
      if (!container) return;
      const started = performance.now();
      try {
        const svg = await render(code);
        if (token !== renderToken) return;
        container.innerHTML = svg;
        store.renderMs = Math.max(1, Math.round(performance.now() - started));
        hasError = false;
        // Brief cross-fade for the fresh render (motion-safe via CSS).
        container.classList.remove('preview-enter');
        void container.offsetWidth;
        container.classList.add('preview-enter');
      } catch {
        if (token !== renderToken) return;
        // Keep the last valid render, de-emphasized.
        hasError = true;
      }
    })();
  });
</script>

<div class="relative flex h-full w-full flex-col overflow-hidden" data-testid="preview-pane">
  {#if isEmpty}
    <div class="flex h-full w-full items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">
      <p data-testid="empty-source-message">Start typing to render a diagram, or pick a sample.</p>
    </div>
  {:else}
    <div
      id="container"
      bind:this={container}
      class="grid-bg flex h-full min-h-full w-full items-center justify-center overflow-auto p-6 transition-[opacity,filter] motion-safe:duration-300 duration-300 ease-in-out"
      style="transform: scale({zoom}) translate({panX}px, {panY}px); transform-origin: center;"
      class:opacity-40={errorActive || hasError}
      class:grayscale={errorActive || hasError}
      aria-label="Diagram preview"
      role="img"
    >
    </div>
  {/if}

  {#if !isEmpty && (errorActive || hasError)}
    <div
      class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-slate-900/90 px-3 py-1 text-sm text-white shadow"
      transition:fade={chipTransition()}
      aria-hidden="true"
      data-testid="preview-stale-chip"
    >
      Fix the source to update the preview
    </div>
  {/if}


  <div class="absolute bottom-4 right-4 flex gap-2">
    <button
      type="button"
      data-testid="zoom-in"
      onclick={() => (zoom = Math.min(zoom + 0.25, 3))}
      class="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      Zoom In
    </button>
    <button
      type="button"
      data-testid="zoom-out"
      onclick={() => (zoom = Math.max(zoom - 0.25, 0.25))}
      class="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      Zoom Out
    </button>
    <button
      type="button"
      data-testid="zoom-fit"
      onclick={() => { zoom = 1; panX = 0; panY = 0; }}
      class="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      Fit
    </button>
  </div>

  <p class="sr-only" role="status" aria-live="polite">
    {#if isEmpty}
      Preview is empty.
    {:else if errorActive || hasError}
      Preview dimmed: the source has a syntax error.
    {:else}
      Rendered {typeLabel} diagram in {store.renderMs} milliseconds.
    {/if}
  </p>
</div>
