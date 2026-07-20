<script>
  import { store, toggleTheme, dismissCoachmark } from './lib/state.svelte.js';
  import Editor from './lib/Editor.svelte';
  import Preview from './lib/Preview.svelte';
  import Presets from './lib/Presets.svelte';
  import Actions from './lib/Actions.svelte';
</script>

<div class="flex h-full flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans h-screen w-screen overflow-hidden">
  <header class="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900 transition-colors motion-safe:duration-300">
    <div class="flex items-center gap-2">
      <span class="text-lg" aria-hidden="true">🧜‍♀️</span>
      <h1 class="text-base font-semibold">Mermaid Live Editor</h1>
      {#if store.diagramType}
        <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200" data-testid="diagram-type">
          {store.diagramType}
        </span>
      {/if}
    </div>
    <button
      type="button"
      data-testid="theme-toggle-button"
      class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium transition-all active:scale-95 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
      onclick={toggleTheme}>
      {store.theme === 'dark' ? 'Light' : 'Dark'} mode
    </button>
  </header>

  {#if store.firstRun}
    <div class="bg-indigo-100 text-indigo-900 px-4 py-3 flex justify-between items-center text-sm dark:bg-indigo-900 dark:text-indigo-100">
      <p><strong>Welcome!</strong> Type Mermaid syntax in the Code tab, change theme in Config, or explore the samples below to see the live preview.</p>
      <button 
        onclick={dismissCoachmark}
        class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 px-3 py-1 font-medium transition-colors"
      >
        Got it
      </button>
    </div>
  {/if}

  <main class="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[minmax(280px,34%)_1fr]">
    <div class="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div class="min-h-[220px] flex-none">
        <Editor />
      </div>
      <div class="flex-none">
        <Presets />
      </div>
      <div class="flex-none pb-2">
        <Actions />
      </div>
    </div>
    <div class="min-h-[300px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 transition-colors motion-safe:duration-300">
      <Preview />
    </div>
  </main>
</div>
