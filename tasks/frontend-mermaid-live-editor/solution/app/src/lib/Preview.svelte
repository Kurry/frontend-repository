<script>
  import { store } from './state.svelte.js';
  import { render } from './mermaid.js';

  let container = $state();
  let hasError = $state(false);
  let renderToken = 0;

  // Re-render the preview whenever the source, config, or theme changes.
  // The rendered <svg> lands inside #container, mirroring the reference.
  $effect(() => {
    const code = store.code;
    const mermaidTheme = store.theme === 'dark' ? 'dark' : 'default';
    // touch renderCount so identical-string edits still re-run
    void store.renderCount;
    const token = ++renderToken;
    (async () => {
      if (!container) return;
      try {
        const svg = await render(code, mermaidTheme);
        if (token !== renderToken) return; // a newer edit superseded this render
        container.innerHTML = svg;
        hasError = false;
      } catch {
        if (token !== renderToken) return;
        hasError = true;
      }
    })();
  });
</script>

<div class="relative h-full w-full overflow-auto" data-testid="preview-pane">
  <div
    id="container"
    bind:this={container}
    class="grid-bg flex h-full min-h-full w-full items-center justify-center p-6 transition-opacity"
    class:opacity-40={hasError}
    aria-label="Diagram preview"
    role="img">
  </div>
  {#if hasError}
    <div
      class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-slate-900/90 px-3 py-1 text-sm text-white shadow"
      aria-hidden="true">
      Fix the source to update the preview
    </div>
  {/if}
</div>
