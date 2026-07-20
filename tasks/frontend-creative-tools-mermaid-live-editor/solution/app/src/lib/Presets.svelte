<script>
  import { SAMPLE_DIAGRAMS } from './mermaid.js';
  import { store, loadSample } from './state.svelte.js';

  const isSelected = (sample) => store.code === sample.code;
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
        data-testid={`sample-${sample.id}`}
        aria-pressed={isSelected(sample)}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px hover:bg-indigo-600 hover:text-white hover:shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 active:translate-y-0 active:scale-90 active:shadow-none dark:border-slate-600"
        class:border-indigo-600={isSelected(sample)}
        class:bg-indigo-600={isSelected(sample)}
        class:text-white={isSelected(sample)}
        class:shadow-sm={isSelected(sample)}
        class:border-slate-300={!isSelected(sample)}
        class:bg-slate-50={!isSelected(sample)}
        class:text-slate-700={!isSelected(sample)}
        class:dark:bg-slate-700={!isSelected(sample)}
        class:dark:text-slate-200={!isSelected(sample)}
        class:dark:bg-indigo-600={isSelected(sample)}
        onclick={() => loadSample(sample)}>
        {sample.label}
      </button>
    {/each}
  </div>
</section>
