<script>
  import { store, getSessionJSON, importSessionJSON, importMMD } from './state.svelte.js';
  import { downloadSVG, downloadPNG, copySVGMarkup, downloadMMD, downloadJSON, copyToClipboard } from './export.js';

  let status = $state('');
  let importMode = $state('session-json'); // 'mmd' or 'session-json'
  let importValue = $state('');
  let importError = $state('');

  const disabled = $derived(!!store.error || !store.code.trim());

  const announce = (msg) => {
    status = msg;
    setTimeout(() => (status = ''), 4000);
  };

  const onSVG = () => {
    try {
      const name = downloadSVG();
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message);
    }
  };
  const onPNG = async () => {
    try {
      const name = await downloadPNG();
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message);
    }
  };
  const onMMD = () => {
    try {
      const name = downloadMMD(store.code);
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message);
    }
  };
  const onSessionDownload = () => {
    try {
      const name = downloadJSON(getSessionJSON());
      announce(`Downloaded ${name}`);
    } catch (error) {
      announce(error.message);
    }
  };
  
  const onCopyImage = async () => {
    try {
      await copySVGMarkup();
      announce('Copied SVG markup');
    } catch (error) {
      announce(error.message);
    }
  };
  const onCopySession = async () => {
    try {
      await copyToClipboard(getSessionJSON());
      announce('Copied Session JSON');
    } catch (error) {
      announce(error.message);
    }
  };

  const handleImport = (e) => {
    e.preventDefault();
    importError = '';
    
    if (importMode === 'mmd') {
      const result = importMMD(importValue);
      if (result.ok) {
        importValue = '';
        announce('Imported MMD');
      } else {
        importError = result.error;
      }
    } else {
      const result = importSessionJSON(importValue);
      if (result.ok) {
        importValue = '';
        announce('Imported Session JSON');
      } else {
        importError = `Invalid field '${result.field}': ${result.error}`;
      }
    }
  };
</script>

<section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <h2 class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</h2>
  
  <div class="mb-4">
    <h3 class="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Export</h3>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        data-testid="download-SVG"
        {disabled}
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
        onclick={onSVG}>
        SVG
      </button>
      <button
        type="button"
        data-testid="download-PNG"
        {disabled}
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
        onclick={onPNG}>
        PNG
      </button>
      <button
        type="button"
        data-testid="download-MMD"
        {disabled}
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
        onclick={onMMD}>
        MMD
      </button>
      <button
        type="button"
        data-testid="copy-image"
        {disabled}
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all active:scale-95 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        onclick={onCopyImage}>
        Copy image
      </button>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Session JSON</h3>
    <div class="mb-2 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-xs font-mono text-slate-600 dark:bg-slate-900 dark:text-slate-400">
      <pre>{getSessionJSON()}</pre>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        data-testid="copy-session"
        class="inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all active:scale-95 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        onclick={onCopySession}>
        Copy Session JSON
      </button>
      <button
        type="button"
        data-testid="download-session"
        class="inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
        onclick={onSessionDownload}>
        Download Session JSON
      </button>
    </div>
  </div>

  <div class="pt-2 border-t border-slate-200 dark:border-slate-700">
    <h3 class="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Import</h3>
    <form onsubmit={handleImport} class="flex flex-col gap-2">
      <div class="flex gap-2">
        <label class="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
          <input type="radio" bind:group={importMode} value="session-json" class="text-indigo-600 focus:ring-indigo-500 min-h-[44px] min-w-[44px]" />
          session-json
        </label>
        <label class="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
          <input type="radio" bind:group={importMode} value="mmd" class="text-indigo-600 focus:ring-indigo-500 min-h-[44px] min-w-[44px]" />
          mmd
        </label>
      </div>
      <textarea
        bind:value={importValue}
        class="w-full resize-y rounded-md border border-slate-300 bg-white p-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        rows="3"
        placeholder={importMode === 'session-json' ? 'Paste Session JSON here' : 'Paste MMD code here'}
      ></textarea>
      {#if importError}
        <div class="text-sm text-red-600 dark:text-red-400 motion-safe:transition-all motion-safe:duration-200" aria-live="assertive">
          {importError}
        </div>
      {/if}
      <button
        type="submit"
        data-testid="import"
        class="inline-flex items-center justify-center min-h-[44px] w-fit rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        disabled={!importValue.trim()}>
        Import
      </button>
    </form>
  </div>

  <div class="relative min-h-[24px] mt-2">
    {#if status}
      <p class="absolute left-0 text-xs text-green-600 dark:text-green-400 font-medium transition-all motion-safe:duration-300 motion-reduce:transition-none opacity-100 translate-y-0" role="status" aria-live="polite">
        {status}
      </p>
    {/if}
  </div>
</section>
