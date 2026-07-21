<script>
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { store, setCode, setConfig, setEditorMode } from './state.svelte.js';
  import CodeMirror from './CodeMirror.svelte';

  const onCodeInput = (value) => {
    if (store.editorMode === 'code') setCode(value);
  };

  const onConfigInput = (value) => {
    if (store.editorMode === 'config') setConfig(value);
  };

  const showError = $derived(store.editorMode === 'code' && !!store.error);
  const showConfigError = $derived(store.editorMode === 'config' && !!store.configError);

  const slide = () => ({ y: -8, duration: prefersReducedMotion.current ? 0 : 180, easing: (t) => t });
</script>

<div class="flex h-full min-h-[300px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <div class="flex items-center gap-1 border-b border-slate-200 p-1 dark:border-slate-700" role="tablist" aria-label="Editor mode">
    <button
      type="button"
      role="tab"
      id="tab-code"
      aria-selected={store.editorMode === 'code'}
      aria-controls="editor-panel"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] min-w-[44px] dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'code'}
      class:text-white={store.editorMode === 'code'}
      onclick={() => setEditorMode('code')}>
      Code
    </button>
    <button
      type="button"
      role="tab"
      id="tab-config"
      aria-selected={store.editorMode === 'config'}
      aria-controls="editor-panel"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] min-w-[44px] dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'config'}
      class:text-white={store.editorMode === 'config'}
      onclick={() => setEditorMode('config')}>
      Config
    </button>
  </div>

  <div
    id="editor-panel"
    role="tabpanel"
    aria-labelledby={store.editorMode === 'code' ? 'tab-code' : 'tab-config'}
    class="relative flex-1 min-h-[200px] overflow-hidden"
    data-testid="editor-container"
  >
    {#if store.editorMode === 'code'}
      <CodeMirror
        id="diagram-source-code"
        bind:value={store.code}
        oninput={onCodeInput}
        editorLabel="Mermaid diagram source code"
      />
    {:else}
      <CodeMirror
        id="diagram-source-config"
        bind:value={store.mermaid}
        oninput={onConfigInput}
        editorLabel="Mermaid configuration JSON"
      />
    {/if}
  </div>

  {#if showError}
    <div
      class="flex flex-col text-sm"
      data-testid="error-container"
      role="alert"
      aria-live="assertive"
      transition:fly={slide()}
    >
      <div class="flex items-center gap-2 bg-slate-900 p-2 text-white">
        <svg viewBox="0 0 24 24" class="size-5 text-red-400" aria-hidden="true" fill="currentColor"
          ><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" /></svg>
        <h2 class="font-medium text-sm">Syntax error</h2>
      </div>
      <output class="max-h-32 overflow-auto bg-red-50 p-2 text-red-700 dark:bg-red-950/40 dark:text-red-300" name="mermaid-error" for="diagram-source-code">
        <pre class="whitespace-pre-wrap font-mono text-xs">{store.error}</pre>
      </output>
    </div>
  {/if}

  {#if showConfigError}
    <div
      class="flex flex-col text-sm"
      data-testid="config-error-container"
      role="alert"
      aria-live="assertive"
      transition:fly={slide()}
    >
      <div class="flex items-center gap-2 bg-slate-900 p-2 text-white">
        <svg viewBox="0 0 24 24" class="size-5 text-orange-400" aria-hidden="true" fill="currentColor"
          ><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
        <h2 class="font-medium text-sm">Config validation failed</h2>
      </div>
      <output class="max-h-32 overflow-auto bg-orange-50 p-2 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" name="config-error" for="diagram-source-config">
        <pre class="whitespace-pre-wrap font-mono text-xs">{store.configError}</pre>
      </output>
    </div>
  {/if}
</div>
