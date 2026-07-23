<script>
  import { store, toggleTheme, dismissCoachmark } from './lib/state.svelte.js';
  import { DIAGRAM_TYPE_LABELS } from './lib/mermaid.js';
  import Editor from './lib/Editor.svelte';
  import Preview from './lib/Preview.svelte';
  import PreviewStatusBar from './lib/PreviewStatusBar.svelte';
  import Presets from './lib/Presets.svelte';
  import Actions from './lib/Actions.svelte';
  import ShortcutsDialog from './lib/ShortcutsDialog.svelte';

  let shortcutsOpen = $state(false);
  let shortcutsButton;
  let shortcutsWasOpened = false;

  $effect(() => {
    if (shortcutsOpen) {
      shortcutsWasOpened = true;
    } else if (shortcutsWasOpened) {
      shortcutsWasOpened = false;
      shortcutsButton?.focus();
    }
  });

  const badgeLabel = $derived(DIAGRAM_TYPE_LABELS[store.diagramType] ?? store.diagramType);
</script>

<div class="flex h-full flex-col bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 h-screen w-screen overflow-hidden">
  <header class="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5 transition-colors motion-safe:duration-300 dark:border-slate-800 dark:bg-slate-900">
    <div class="flex items-center gap-2">
      <svg viewBox="0 0 24 24" class="size-6 text-indigo-500" aria-hidden="true" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      <h1 class="text-base font-semibold">Mermaid Live Editor</h1>
      {#if badgeLabel}
        {#key store.diagramType}
          <span
            class="badge-pop rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200"
            data-testid="diagram-type"
          >
            {badgeLabel}
          </span>
        {/key}
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        data-testid="shortcuts-button"
        bind:this={shortcutsButton}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:border-slate-600 dark:hover:bg-slate-800"
        aria-haspopup="dialog"
        aria-expanded={shortcutsOpen}
        onclick={() => (shortcutsOpen = true)}>
        Shortcuts
      </button>
      <button
        type="button"
        data-testid="theme-toggle-button"
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:border-slate-600 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
        onclick={toggleTheme}>
        {store.theme === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </div>
  </header>

  {#if store.firstRun}
    <div
      class="flex items-center justify-between gap-3 bg-indigo-100 px-4 py-2.5 text-sm text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100"
      role="note"
      aria-label="Quick tour"
      data-testid="coachmark"
    >
      <p>
        <strong>Quick tour:</strong> edit Mermaid source in the <strong>Code</strong> tab and the
        diagram config in the <strong>Config</strong> tab, load a diagram from
        <strong>Sample diagrams</strong>, and export from <strong>Actions</strong> — the preview
        updates live.
      </p>
      <button
        type="button"
        onclick={dismissCoachmark}
        data-testid="coachmark-dismiss"
        class="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md px-3 py-1 font-medium transition-colors hover:bg-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-indigo-800"
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
    <div class="flex min-h-0 flex-col gap-3">
      <div class="min-h-[300px] flex-1 overflow-hidden rounded-lg border border-slate-200 transition-colors motion-safe:duration-300 md:min-h-0 dark:border-slate-800">
        <Preview />
      </div>
      <div class="flex-none">
        <PreviewStatusBar />
      </div>
    </div>
  </main>

  <ShortcutsDialog bind:open={shortcutsOpen} />
</div>
