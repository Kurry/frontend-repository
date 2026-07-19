<script>
  import { store, toggleTheme } from './lib/state.svelte.js';
  import Editor from './lib/Editor.svelte';
  import Preview from './lib/Preview.svelte';
  import Presets from './lib/Presets.svelte';
  import Actions from './lib/Actions.svelte';
</script>

<div class="flex h-full flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
  <header class="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
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
      class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
      onclick={toggleTheme}>
      {store.theme === 'dark' ? 'Light' : 'Dark'} mode
    </button>
  </header>

  <main class="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[minmax(280px,34%)_1fr]">
    <div class="flex min-h-0 flex-col gap-3">
      <div class="min-h-[220px] flex-1">
        <Editor />
      </div>
      <Presets />
      <Actions />
    </div>
    <div class="min-h-[300px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <Preview />
    </div>
  </main>
</div>
