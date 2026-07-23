<script lang="ts">
  import { Download, Upload, Copy, FileText, FileCsv, CheckCircle, Warning } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  let importInput: HTMLInputElement;
  let feedback = $state('');
  let feedbackTone = $state<'ok' | 'err'>('ok');
  let previewTab = $state<'json' | 'csv'>('json');

  // Live, recompiled preview of exactly what the export controls produce —
  // updated reactively as sets are logged, so the downloadable artifact is
  // inspectable in the page itself (no need to open the downloaded file).
  const jsonPreview = $derived(JSON.stringify(quest.exportQuestLog(), null, 2));
  const csvPreview = $derived(quest.exportCsv());

  function download(contents: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportJson() {
    const contents = JSON.stringify(quest.exportQuestLog(), null, 2);
    download(contents, `repquest-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    feedback = 'Quest Log exported';
    feedbackTone = 'ok';
    quest.announce(feedback);
  }

  function exportCsv() {
    download(quest.exportCsv(), `repquest-workout-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    feedback = 'Workout CSV exported';
    feedbackTone = 'ok';
    quest.announce(feedback);
  }

  async function copyJson() {
    feedback = '';
    const contents = JSON.stringify(quest.exportQuestLog(), null, 2);
    try {
      await navigator.clipboard.writeText(contents);
      feedback = 'Copied Quest Log JSON';
      feedbackTone = 'ok';
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = contents;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      feedback = copied ? 'Copied Quest Log JSON' : 'Clipboard unavailable — use Export Quest Log to download';
      feedbackTone = copied ? 'ok' : 'err';
    }
    quest.announce(feedback);
  }

  async function importFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const ok = quest.importQuestLog(JSON.parse(await file.text()));
      feedback = ok ? 'Quest Log imported — state restored' : 'Invalid Quest Log file — nothing was changed';
      feedbackTone = ok ? 'ok' : 'err';
    } catch {
      feedback = 'Invalid Quest Log file — nothing was changed';
      feedbackTone = 'err';
    }
    quest.announce(feedback);
    importInput.value = '';
  }
</script>

<section class="bg-slate-800 rounded-xl p-4 border border-slate-700" aria-label="Quest Log export and import">
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--accent-strong)">
    <FileText size={18} weight="fill" /> Quest Log
  </h2>

  <div class="grid grid-cols-2 gap-2">
    <button onclick={exportJson} data-action="export-json" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2.5 text-sm transition-colors"><Download size={16} weight="bold" /> Export Quest Log</button>
    <button onclick={copyJson} data-action="copy-json" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 text-sm transition-colors"><Copy size={16} /> Copy JSON</button>
    <button onclick={exportCsv} data-action="export-csv" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 text-sm transition-colors"><FileCsv size={16} /> Export workout CSV</button>
    <button onclick={() => importInput.click()} data-action="import-json" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 text-sm transition-colors"><Upload size={16} weight="bold" /> Import Quest Log</button>
    <input bind:this={importInput} onchange={importFile} type="file" accept="application/json,.json" class="sr-only" aria-label="Choose Quest Log JSON file" />
  </div>

  {#if feedback}
    <p class="text-sm mt-3 flex items-center gap-1.5 {feedbackTone === 'ok' ? 'text-emerald-300' : 'text-red-300'}" role="status" aria-live="polite" data-artifact-feedback data-feedback-tone={feedbackTone}>
      {#if feedbackTone === 'ok'}<CheckCircle size={15} />{:else}<Warning size={15} />{/if} {feedback}
    </p>
  {/if}

  <!-- Live preview pane -->
  <div class="mt-4">
    <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
      <span class="text-xs font-semibold text-slate-400">Live export preview (updates as you log)</span>
      <div class="flex gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-700" role="tablist" aria-label="Preview format">
        <button onclick={() => previewTab = 'json'} role="tab" aria-selected={previewTab === 'json'} class="text-xs px-2.5 py-1 rounded-md transition-colors {previewTab === 'json' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}">JSON</button>
        <button onclick={() => previewTab = 'csv'} role="tab" aria-selected={previewTab === 'csv'} class="text-xs px-2.5 py-1 rounded-md transition-colors {previewTab === 'csv' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}">CSV</button>
      </div>
    </div>
    <pre class="text-[11px] leading-relaxed text-slate-300 bg-slate-950 border border-slate-700 rounded-lg p-3 max-h-56 overflow-auto whitespace-pre-wrap break-words" data-export-preview={previewTab}>{previewTab === 'json' ? jsonPreview : csvPreview}</pre>
  </div>
</section>
