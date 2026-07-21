<script>
  import { tick } from 'svelte';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { Button } from 'flowbite-svelte';
  import { Check, Clipboard, DownloadSimple, FileArrowUp, FileCode, TextAlignLeft, X } from 'phosphor-svelte';
  import { importFileSchema } from '../lib/schemas.js';
  import { trapFocus } from '../lib/actions.js';

  let { state: appState, copyExport, exportTrigger } = $props();
  let selectedFileName = $state('');
  let readingFile = $state(false);
  let dialogEl = $state(null);
  let closeButtonEl = $state(null);

  const { form: importForm, errors: importErrors, reset: resetImport } = createForm({
    initialValues: { documentFile: undefined, documentText: '' },
    extend: validator({ schema: importFileSchema }),
    onSubmit: async (values) => {
      appState.importError = '';
      readingFile = true;
      try {
        const file = typeof File !== 'undefined' && values.documentFile instanceof File ? values.documentFile : values.documentFile?.[0];
        let rawText = '';
        if (file) {
          rawText = await file.text();
        } else if (values.documentText && values.documentText.trim().length > 0) {
          rawText = values.documentText;
        } else {
          appState.importError = 'payload: Select one Review report JSON file or paste JSON.';
          return;
        }
        const result = appState.importReport(rawText);
        if (result.ok) {
          selectedFileName = '';
          resetImport();
        }
      } catch {
        appState.importError = 'payload: The selected import payload could not be read.';
      } finally {
        readingFile = false;
      }
    }
  });

  $effect(() => {
    if (!appState.exportOpen) return;
    tick().then(() => closeButtonEl?.focus());
  });

  function closeDialog() {
    appState.closeExport();
    tick().then(() => exportTrigger?.focus());
  }

  function onDialogKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    trapFocus(event, dialogEl);
  }

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

{#if appState.exportOpen}
  <div class="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-3 sm:p-6" role="presentation">
    <button type="button" class="fixed inset-0 bg-ink-950/55" aria-label="Close export dialog" onclick={closeDialog}></button>
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      tabindex="-1"
      class="relative z-[71] mt-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-paper-50 shadow-2xl"
      onkeydown={onDialogKeydown}
    >
      <div class="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-5">
        <h2 id="export-dialog-title" class="text-sm font-extrabold text-ink-900">Export review artifact</h2>
        <button bind:this={closeButtonEl} type="button" class="interactive grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700" onclick={closeDialog} aria-label="Close">
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      <div class="grid min-h-[35rem] lg:grid-cols-[17rem_1fr]">
        <aside class="border-b border-line bg-ink-950 p-4 text-white lg:border-b-0 lg:border-r lg:p-5">
          <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-300">Artifact format</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1" role="radiogroup" aria-label="Export format">
            <button
              class={`interactive flex min-h-11 items-start gap-3 rounded-xl border p-3 text-left ${appState.exportFormat === 'review-report-json' ? 'border-signal-500 bg-signal-500/15 text-white' : 'border-white/10 text-slate-200 hover:bg-white/5'}`}
              onclick={() => appState.exportFormat = 'review-report-json'}
              role="radio"
              aria-checked={appState.exportFormat === 'review-report-json'}
            >
              <FileCode aria-hidden="true" size={20} class="mt-0.5 shrink-0" />
              <span><span class="block text-xs font-extrabold">Review report JSON</span><span class="mt-1 block text-[10px] leading-4 text-slate-300">API-shaped, validated and round-trippable</span></span>
            </button>
            <button
              class={`interactive flex min-h-11 items-start gap-3 rounded-xl border p-3 text-left ${appState.exportFormat === 'summary-text' ? 'border-signal-500 bg-signal-500/15 text-white' : 'border-white/10 text-slate-200 hover:bg-white/5'}`}
              onclick={() => appState.exportFormat = 'summary-text'}
              role="radio"
              aria-checked={appState.exportFormat === 'summary-text'}
            >
              <TextAlignLeft aria-hidden="true" size={20} class="mt-0.5 shrink-0" />
              <span><span class="block text-xs font-extrabold">Summary text</span><span class="mt-1 block text-[10px] leading-4 text-slate-300">Live counts and per-task decisions</span></span>
            </button>
          </div>

          <div class="mt-5 border-t border-white/10 pt-5">
            <p class="text-[10px] font-bold uppercase tracking-[.15em] text-slate-300">Round-trip import</p>
            <form use:importForm class="mt-3 space-y-2" aria-label="Import Review report JSON">
              <label for="report-import" class="interactive flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-100 hover:border-signal-500 hover:bg-white/10">
                <FileArrowUp aria-hidden="true" size={17} />
                <span class="truncate">{selectedFileName || 'Choose .json file'}</span>
              </label>
              <input
                id="report-import"
                name="documentFile"
                type="file"
                accept="application/json,.json"
                class="sr-only"
                onchange={(event) => selectedFileName = event.currentTarget.files?.[0]?.name || ''}
              />
              <textarea
                name="documentText"
                rows="2"
                placeholder="Or paste JSON payload here..."
                class="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-[10px] text-slate-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              ></textarea>
              <Button type="submit" size="sm" color="alternative" class="interactive w-full !min-h-11 !rounded-lg !border-white/15 !bg-white/10 !text-white hover:!bg-white/20" disabled={readingFile}>
                {readingFile ? 'Validating…' : 'Import report'}
              </Button>
              {#if $importErrors.documentFile}<p class="text-[10px] font-bold leading-4 text-rose-200" aria-live="polite">{$importErrors.documentFile}</p>{/if}
              {#if appState.importError}<p class="rounded-md border border-rose-400/40 bg-rose-500/15 p-2 text-[10px] font-bold leading-4 text-rose-100" role="alert">{appState.importError}</p>{/if}
            </form>
          </div>
        </aside>

        <section class="flex min-w-0 flex-col bg-[#f7f5ef]">
          <div class="flex flex-col gap-3 border-b border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-extrabold text-ink-900">Live preview</p>
              <p class="text-[10px] text-slate-600">Updates with threshold, decisions, and include toggles.</p>
            </div>
            <div class="flex items-center gap-2">
              <Button color="alternative" size="sm" class="interactive !min-h-11 !rounded-lg" onclick={copyExport}><Clipboard aria-hidden="true" size={15} class="mr-1.5" />Copy</Button>
              {#if appState.exportFormat === 'review-report-json'}
                <Button size="sm" class="interactive !min-h-11 !rounded-lg !bg-signal-600 hover:!bg-signal-500" onclick={downloadJson}><DownloadSimple aria-hidden="true" size={15} class="mr-1.5" />Download .json</Button>
              {/if}
            </div>
          </div>
          <div class="relative min-h-0 flex-1 p-3 sm:p-4">
            <div class="absolute right-6 top-6 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[9px] font-extrabold uppercase text-emerald-900 shadow-sm"><Check aria-hidden="true" size={11} weight="bold" />Live</div>
            <pre data-testid="export-preview" class="h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-700 bg-ink-950 p-4 pr-16 font-mono text-[11px] leading-5 text-slate-200 shadow-inner sm:text-xs">{appState.activeExportText}</pre>
          </div>
        </section>
      </div>
    </div>
  </div>
{/if}
