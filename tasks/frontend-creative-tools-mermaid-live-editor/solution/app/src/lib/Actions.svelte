<script>
  import { fly, fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { store, getSessionJSON, importSessionJSON, importMMD } from './state.svelte.js';
  import { downloadSVG, downloadPNG, copyImage, downloadMMD, downloadJSON, copyToClipboard } from './export.js';

  let importMode = $state('session-json'); // 'mmd' or 'session-json'
  let importValue = $state('');
  let importError = $state('');
  let toast = $state(null); // { text, tone }
  let copiedKey = $state(''); // 'image' | 'session' | 'mmd'
  let toastTimer;
  let copiedTimer;

  const disabled = $derived(!!store.error || !store.code.trim());

  const motion = (base) => (prefersReducedMotion.current ? 0 : base);

  const announce = (text, tone = 'success') => {
    clearTimeout(toastTimer);
    toast = { text, tone };
    toastTimer = setTimeout(() => {
      toast = null;
    }, 3600);
  };

  const flashCopied = (key) => {
    clearTimeout(copiedTimer);
    copiedKey = key;
    copiedTimer = setTimeout(() => {
      copiedKey = '';
    }, 1800);
  };

  const onSVG = () => {
    try {
      const name = downloadSVG();
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message, 'error');
    }
  };
  const onPNG = async () => {
    try {
      const name = await downloadPNG();
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message, 'error');
    }
  };
  const onMMD = () => {
    try {
      const name = downloadMMD(store.code);
      announce(`Downloaded ${name} — matches the current Code document`);
    } catch (error) {
      announce(error.message, 'error');
    }
  };
  const onSessionDownload = () => {
    try {
      const name = downloadJSON(getSessionJSON());
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message, 'error');
    }
  };

  const onCopyImage = async () => {
    try {
      const what = await copyImage();
      flashCopied('image');
      announce(what === 'image' ? 'Copied the diagram image to the clipboard' : 'Copied the diagram SVG markup to the clipboard');
    } catch (error) {
      announce(error.message, 'error');
    }
  };
  const onCopySession = async () => {
    await copyToClipboard(getSessionJSON());
    flashCopied('session');
    announce('Copied Session JSON to the clipboard');
  };
  const onCopyMmd = async () => {
    await copyToClipboard(store.code);
    flashCopied('mmd');
    announce('Copied MMD source to the clipboard');
  };

  const handleImport = (e) => {
    e.preventDefault();
    importError = '';

    if (importMode === 'mmd') {
      const result = importMMD(importValue);
      if (result.ok) {
        importValue = '';
        announce('Imported MMD — the Code document was replaced');
      } else {
        importError = result.message;
      }
    } else {
      const result = importSessionJSON(importValue);
      if (result.ok) {
        importValue = '';
        announce('Imported Session JSON — code, config, themes, tab, and badge restored');
      } else {
        importError = `Invalid field '${result.field}': ${result.message}`;
      }
    }
  };
</script>

<section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <h2 class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</h2>

  <div class="mb-4">
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Export</h3>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        data-testid="download-SVG"
        {disabled}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        onclick={onSVG}>
        SVG
      </button>
      <button
        type="button"
        data-testid="download-PNG"
        {disabled}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        onclick={onPNG}>
        PNG
      </button>
      <button
        type="button"
        data-testid="download-MMD"
        {disabled}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        onclick={onMMD}>
        MMD
      </button>
      <button
        type="button"
        data-testid="copy-image"
        {disabled}
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        onclick={onCopyImage}>
        {copiedKey === 'image' ? 'Copied ✓' : 'Copy image'}
      </button>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Session JSON</h3>
    <div class="mb-2 max-h-32 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      <pre data-testid="session-json-preview">{getSessionJSON()}</pre>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        data-testid="copy-session"
        class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        onclick={onCopySession}>
        {copiedKey === 'session' ? 'Copied ✓' : 'Copy Session JSON'}
      </button>
      <button
        type="button"
        data-testid="download-session"
        class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95"
        onclick={onSessionDownload}>
        Download Session JSON
      </button>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">MMD</h3>
    <div class="mb-2 max-h-24 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      <pre data-testid="mmd-preview">{store.code.trim() ? store.code : '(empty source — MMD mirrors the Code document)'}</pre>
    </div>
    <button
      type="button"
      data-testid="copy-mmd"
      class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      onclick={onCopyMmd}>
      {copiedKey === 'mmd' ? 'Copied ✓' : 'Copy MMD'}
    </button>
  </div>

  <div class="border-t border-slate-200 pt-2 dark:border-slate-700">
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Import</h3>
    <form onsubmit={handleImport} class="flex flex-col gap-2">
      <fieldset class="flex min-h-[44px] items-center gap-4">
        <legend class="sr-only">Import mode</legend>
        <label class="flex min-h-[44px] items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input type="radio" bind:group={importMode} value="session-json" class="size-4 accent-indigo-600" />
          session-json
        </label>
        <label class="flex min-h-[44px] items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <input type="radio" bind:group={importMode} value="mmd" class="size-4 accent-indigo-600" />
          mmd
        </label>
      </fieldset>
      <label class="sr-only" for="import-payload">
        {importMode === 'session-json' ? 'Session JSON payload to import' : 'MMD source payload to import'}
      </label>
      <textarea
        id="import-payload"
        data-testid="import-payload"
        bind:value={importValue}
        class="w-full resize-y rounded-md border border-slate-300 bg-white p-2 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        rows="3"
        placeholder={importMode === 'session-json' ? 'Paste a MermaidSession JSON document' : 'Paste Mermaid source (.mmd) text'}
        aria-describedby="import-error"
      ></textarea>
      {#if importError}
        <div
          id="import-error"
          data-testid="import-error"
          class="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          aria-live="assertive"
          transition:fade={{ duration: motion(160) }}
        >
          {importError}
        </div>
      {/if}
      <button
        type="submit"
        data-testid="import"
        class="inline-flex min-h-[44px] w-fit items-center justify-center rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
      >
        Import
      </button>
    </form>
  </div>
</section>

{#if toast}
  <div
    data-testid="export-status"
    role="status"
    aria-live="polite"
    class="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border px-3.5 py-2.5 text-sm font-medium shadow-lg"
    class:bg-emerald-50={toast.tone === 'success'}
    class:text-emerald-800={toast.tone === 'success'}
    class:border-emerald-200={toast.tone === 'success'}
    class:bg-red-50={toast.tone === 'error'}
    class:text-red-800={toast.tone === 'error'}
    class:border-red-200={toast.tone === 'error'}
    class:dark:bg-emerald-950={toast.tone === 'success'}
    class:dark:text-emerald-200={toast.tone === 'success'}
    class:dark:border-emerald-800={toast.tone === 'success'}
    class:dark:bg-red-950={toast.tone === 'error'}
    class:dark:text-red-200={toast.tone === 'error'}
    class:dark:border-red-800={toast.tone === 'error'}
    in:fly={{ y: 14, duration: motion(220) }}
    out:fade={{ duration: motion(260) }}
  >
    {toast.text}
  </div>
{/if}
