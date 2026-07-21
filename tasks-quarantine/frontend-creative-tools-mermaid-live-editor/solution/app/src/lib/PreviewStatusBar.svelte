<script>
  import { store } from './state.svelte.js';
  import { DIAGRAM_TYPE_LABELS } from './mermaid.js';

  const typeLabel = $derived(DIAGRAM_TYPE_LABELS[store.diagramType] ?? '—');
  const lines = $derived(store.code ? store.code.split(/\r?\n/).length : 0);
  const chars = $derived(store.code ? store.code.length : 0);
  const state = $derived(store.error ? 'syntax error' : !store.code.trim() ? 'empty source' : 'valid');
</script>

<div
  data-testid="preview-status"
  class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
>
  <span><span class="font-semibold text-slate-700 dark:text-slate-200">{typeLabel}</span> diagram</span>
  <span aria-hidden="true">·</span>
  <span>{lines} lines / {chars} chars</span>
  <span aria-hidden="true">·</span>
  <span>rendered in {store.renderMs || '—'} ms</span>
  <span aria-hidden="true">·</span>
  <span
    class:font-semibold={state !== 'valid'}
    class:text-red-600={state === 'syntax error'}
    class:dark:text-red-400={state === 'syntax error'}
    class:text-amber-600={state === 'empty source'}
    class:dark:text-amber-400={state === 'empty source'}
  >{state}</span>
</div>
