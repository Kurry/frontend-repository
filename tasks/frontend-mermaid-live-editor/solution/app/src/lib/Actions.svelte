<script>
  import { store } from './state.svelte.js';
  import { downloadSVG, downloadPNG, copySVGMarkup } from './export.js';

  let status = $state('');
  const disabled = $derived(!!store.error);

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
  const onCopy = async () => {
    try {
      await copySVGMarkup();
      announce('Copied SVG markup');
    } catch (error) {
      announce(error.message);
    }
  };
</script>

<section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
  <h2 class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</h2>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      data-testid="download-SVG"
      {disabled}
      class="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
      onclick={onSVG}>
      SVG
    </button>
    <button
      type="button"
      data-testid="download-PNG"
      {disabled}
      class="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
      onclick={onPNG}>
      PNG
    </button>
    <button
      type="button"
      data-testid="copy-image"
      {disabled}
      class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      onclick={onCopy}>
      Copy image
    </button>
  </div>
  <p class="mt-2 min-h-4 text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite">{status}</p>
</section>
