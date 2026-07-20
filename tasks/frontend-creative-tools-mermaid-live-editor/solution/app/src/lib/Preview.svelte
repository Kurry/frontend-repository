<script>
  import { store } from './state.svelte.js';
  import { render } from './mermaid.js';

  let container = $state();
  let hasError = $state(false);
  let renderToken = 0;

  const isEmpty = $derived(!store.code.trim());
  const errorActive = $derived(!!store.error);

  $effect(() => {
    if (isEmpty) {
      if (container) container.innerHTML = '';
      hasError = false;
      return;
    }

    const code = store.code;
    const mermaidTheme = store.theme === 'dark' ? 'dark' : 'default';
    
    // Subscribe to store.lastValidMermaid to re-render when valid config changes
    void store.lastValidMermaid;

    void store.renderCount;
    const token = ++renderToken;
    
    (async () => {
      if (!container) return;
      try {
        const svg = await render(code, mermaidTheme);
        if (token !== renderToken) return;
        container.innerHTML = svg;
        hasError = false;
      } catch {
        if (token !== renderToken) return;
        hasError = true;
      }
    })();
  });
</script>

<div class="relative h-full w-full overflow-hidden flex flex-col" data-testid="preview-pane">
  {#if isEmpty}
    <div class="flex h-full w-full items-center justify-center p-6 text-slate-500 dark:text-slate-400 text-sm">
      <p>Start typing to render a diagram, or pick a sample.</p>
    </div>
  {:else}
    <div
      id="container"
      bind:this={container}
      class="grid-bg flex h-full min-h-full w-full items-center justify-center p-6 transition-opacity motion-safe:duration-300 overflow-auto"
      class:opacity-40={errorActive || hasError}
      aria-label="Diagram preview"
      role="img">
    </div>
  {/if}
  {#if errorActive || hasError}
    <div
      class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-slate-900/90 px-3 py-1 text-sm text-white shadow transition-all motion-safe:duration-300"
      aria-hidden="true">
      Fix the source to update the preview
    </div>
  {/if}
</div>
