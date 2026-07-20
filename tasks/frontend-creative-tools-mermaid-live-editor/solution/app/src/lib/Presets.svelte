<script>
  import { SAMPLE_DIAGRAMS } from './mermaid.js';
  import { store, loadSample } from './state.svelte.js';
</script>

<section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <h2 class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
    Sample diagrams
  </h2>
  <div class="flex flex-wrap gap-2">
    {#each SAMPLE_DIAGRAMS as sample (sample.id)}
      <button
        type="button"
        data-sample={sample.id}
        aria-pressed={store.code === sample.code}
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all active:scale-95 hover:bg-indigo-600 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        onclick={() => loadSample(sample)}>
        {sample.label}
      </button>
    {/each}
  </div>
</section>
