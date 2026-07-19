<script>
  import { store, setCode, setConfig, setEditorMode } from './state.svelte.js';

  const onInput = (event) => {
    const value = event.currentTarget.value;
    if (store.editorMode === 'code') setCode(value);
    else setConfig(value);
  };

  const value = $derived(store.editorMode === 'code' ? store.code : store.mermaid);
  const showError = $derived(store.editorMode === 'code' && !!store.error);
</script>

<div class="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <div class="flex items-center gap-1 border-b border-slate-200 p-1 dark:border-slate-700" role="tablist" aria-label="Editor mode">
    <button
      type="button"
      role="tab"
      aria-selected={store.editorMode === 'code'}
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'code'}
      class:text-white={store.editorMode === 'code'}
      onclick={() => setEditorMode('code')}>
      Code
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={store.editorMode === 'config'}
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
      class:bg-indigo-600={store.editorMode === 'config'}
      class:text-white={store.editorMode === 'config'}
      onclick={() => setEditorMode('config')}>
      Config
    </button>
  </div>

  <label class="sr-only" for="diagram-source">
    {store.editorMode === 'code' ? 'Diagram source' : 'Mermaid config'}
  </label>
  <textarea
    id="diagram-source"
    data-testid="editor"
    class="diagram-source min-h-0 flex-1 resize-none bg-transparent p-3 text-sm leading-relaxed text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100"
    spellcheck="false"
    autocomplete="off"
    aria-label={store.editorMode === 'code' ? 'Diagram source' : 'Mermaid config'}
    oninput={onInput}
    value={value}></textarea>

  {#if showError}
    <div class="flex flex-col text-sm" data-testid="error-container">
      <div class="flex items-center gap-2 bg-slate-900 p-2 text-white">
        <svg viewBox="0 0 24 24" class="size-5 text-red-400" aria-hidden="true" fill="currentColor"
          ><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" /></svg>
        <p class="font-medium">Syntax error</p>
      </div>
      <output class="max-h-32 overflow-auto bg-red-50 p-2 text-red-700 dark:bg-red-950/40 dark:text-red-300" name="mermaid-error" for="diagram-source">
        <pre class="whitespace-pre-wrap">{store.error}</pre>
      </output>
    </div>
  {/if}
</div>
