<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { Button, Modal } from 'flowbite-svelte';
  import { Check, Clipboard, DownloadSimple, FileArrowUp, FileCode, TextAlignLeft, X } from 'phosphor-svelte';
  import { importFileSchema } from '../lib/schemas.js';

  let { state: appState, copyExport } = $props();
  let selectedFileName = $state('');
  let readingFile = $state(false);

  const { form: importForm, errors: importErrors, reset: resetImport } = createForm({
    initialValues: { document: undefined },
    extend: validator({ schema: importFileSchema }),
    onSubmit: async (values) => {
      appState.importError = '';
      readingFile = true;
      try {
        const file = typeof File !== 'undefined' && values.document instanceof File ? values.document : values.document?.[0];
        if (!file) {
          appState.importError = 'payload: Select one Review report JSON file.';
          return;
        }
        const rawText = await file.text();
        const result = appState.importReport(rawText);
        if (result.ok) {
          selectedFileName = '';
          resetImport();
        }
      } catch {
        appState.importError = 'payload: The selected import file could not be read.';
      } finally {
        readingFile = false;
      }
    }
  });

  function downloadJson() {
    const previewText = appState.activeExportText;
    const blob = new Blob([previewText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `signal-trace-review-${appState.exportTimestamp.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<Modal bind:open={appState.exportOpen} size="5xl" title="Export review artifact" class="!bg-paper-50" classes={{ body: '!p-0' }}>
  <div class="grid min-h-[35rem] lg:grid-cols-[17rem_1fr]">
    <aside class="border-b border-line bg-ink-950 p-4 text-white lg:border-b-0 lg:border-r lg:p-5">
      <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Artifact format</p>
      <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1" role="radiogroup" aria-label="Export format">
        <button
          class={`interactive flex items-start gap-3 rounded-xl border p-3 text-left ${appState.exportFormat === 'review-report-json' ? 'border-signal-500 bg-signal-500/15 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
          onclick={() => appState.exportFormat = 'review-report-json'}
          role="radio"
          aria-checked={appState.exportFormat === 'review-report-json'}
        >
          <FileCode size={20} class="mt-0.5 shrink-0" />
          <span><span class="block text-xs font-extrabold">Review report JSON</span><span class="mt-1 block text-[10px] leading-4 text-slate-400">API-shaped, validated and round-trippable</span></span>
        </button>
        <button
          class={`interactive flex items-start gap-3 rounded-xl border p-3 text-left ${appState.exportFormat === 'summary-text' ? 'border-signal-500 bg-signal-500/15 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
          onclick={() => appState.exportFormat = 'summary-text'}
          role="radio"
          aria-checked={appState.exportFormat === 'summary-text'}
        >
          <TextAlignLeft size={20} class="mt-0.5 shrink-0" />
          <span><span class="block text-xs font-extrabold">Summary text</span><span class="mt-1 block text-[10px] leading-4 text-slate-400">Live counts and per-task decisions</span></span>
        </button>
      </div>

      <div class="mt-5 border-t border-white/10 pt-5">
        <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Round-trip import</p>
        <form use:importForm class="mt-3 space-y-2" aria-label="Import Review report JSON">
          <label for="report-import" class="interactive flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-signal-500 hover:bg-white/10">
            <FileArrowUp size={17} />
            <span class="truncate">{selectedFileName || 'Choose .json file'}</span>
          </label>
          <input
            id="report-import"
            name="document"
            type="file"
            accept="application/json,.json"
            class="sr-only"
            onchange={(event) => selectedFileName = event.currentTarget.files?.[0]?.name || ''}
          />
          <Button type="submit" size="sm" color="alternative" class="interactive w-full !rounded-lg !border-white/15 !bg-white/10 !text-white hover:!bg-white/20" disabled={!selectedFileName || readingFile}>
            {readingFile ? 'Validating…' : 'Import report'}
          </Button>
          {#if selectedFileName && $importErrors.document}<p class="text-[10px] font-bold leading-4 text-rose-300">{$importErrors.document}</p>{/if}
          {#if appState.importError}<p class="rounded-md border border-rose-400/40 bg-rose-500/15 p-2 text-[10px] font-bold leading-4 text-rose-100" role="alert">{appState.importError}</p>{/if}
        </form>
      </div>
    </aside>

    <section class="flex min-w-0 flex-col bg-[#f7f5ef]">
      <div class="flex flex-col gap-3 border-b border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-extrabold text-ink-900">Live preview</p>
          <p class="text-[10px] text-slate-500">Updates with threshold, decisions, and include toggles.</p>
        </div>
        <div class="flex items-center gap-2">
          <Button color="alternative" size="sm" class="interactive !rounded-lg" onclick={copyExport}><Clipboard size={15} class="mr-1.5" />Copy</Button>
          {#if appState.exportFormat === 'review-report-json'}
            <Button size="sm" class="interactive !rounded-lg !bg-signal-600 hover:!bg-signal-500" onclick={downloadJson}><DownloadSimple size={15} class="mr-1.5" />Download .json</Button>
          {/if}
        </div>
      </div>
      <div class="relative min-h-0 flex-1 p-3 sm:p-4">
        <div class="absolute right-6 top-6 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[9px] font-extrabold uppercase text-emerald-800 shadow-sm"><Check size={11} weight="bold" />Live</div>
        <pre data-testid="export-preview" class="h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-700 bg-ink-950 p-4 pr-16 font-mono text-[11px] leading-5 text-slate-200 shadow-inner sm:text-xs">{appState.activeExportText}</pre>
      </div>
    </section>
  </div>
</Modal>
