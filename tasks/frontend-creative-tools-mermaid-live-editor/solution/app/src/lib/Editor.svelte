<script>
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
</script>

<div class="flex h-full min-h-[300px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <div class="flex items-center gap-1 border-b border-slate-200 p-1 dark:border-slate-700" role="tablist" aria-label="Editor mode">
    <button
      type="button"
      role="tab"
      aria-selected={store.editorMode === 'code'}
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] min-w-[44px] dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'code'}
      class:text-white={store.editorMode === 'code'}
      onclick={() => setEditorMode('code')}>
      Code
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={store.editorMode === 'config'}
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px] min-w-[44px] dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'config'}
      class:text-white={store.editorMode === 'config'}
      onclick={() => setEditorMode('config')}>
      Config
    </button>
  </div>

  <div class="relative flex-1 min-h-[200px] overflow-hidden" data-testid="editor-container">
    {#if store.editorMode === 'code'}
      <CodeMirror 
        id="diagram-source-code"
        bind:value={store.code}
        oninput={onCodeInput}
      />
    {:else}
      <CodeMirror 
        id="diagram-source-config"
        bind:value={store.mermaid}
        oninput={onConfigInput}
      />
    {/if}
  </div>

  {#if showError}
    <div 
      class="flex flex-col text-sm transition-all motion-safe:duration-200" 
      data-testid="error-container"
      aria-live="assertive"
    >
      <div class="flex items-center gap-2 bg-slate-900 p-2 text-white">
        <svg viewBox="0 0 24 24" class="size-5 text-red-400" aria-hidden="true" fill="currentColor"
          ><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" /></svg>
        <p class="font-medium">Syntax error</p>
      </div>
      <output class="max-h-32 overflow-auto bg-red-50 p-2 text-red-700 dark:bg-red-950/40 dark:text-red-300" name="mermaid-error" for="diagram-source-code">
        <pre class="whitespace-pre-wrap font-mono text-xs">{store.error}</pre>
      </output>
    </div>
  {/if}
  
  {#if showConfigError}
    <div 
      class="flex flex-col text-sm transition-all motion-safe:duration-200" 
      data-testid="config-error-container"
      aria-live="assertive"
    >
      <div class="flex items-center gap-2 bg-slate-900 p-2 text-white">
        <svg viewBox="0 0 24 24" class="size-5 text-orange-400" aria-hidden="true" fill="currentColor"
          ><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
        <p class="font-medium">Config validation failed</p>
      </div>
      <output class="max-h-32 overflow-auto bg-orange-50 p-2 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" name="config-error" for="diagram-source-config">
        <pre class="whitespace-pre-wrap font-mono text-xs">{store.configError}</pre>
      </output>
    </div>
  {/if}
</div>
