<script>
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { store } from './state.svelte.js';
  import { render, DIAGRAM_TYPE_LABELS } from './mermaid.js';

  let container = $state();
  let hasError = $state(false);
  let renderToken = 0;

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
      class="grid-bg flex h-full min-h-full w-full items-center justify-center overflow-auto p-6 transition-[opacity,filter] motion-safe:duration-300"
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
