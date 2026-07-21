<script lang="ts">
  import { UploadSimple, FileText, X } from 'phosphor-svelte';
  import type { ToolResult } from '../lib/webmcp';
  import Dialog from './Dialog.svelte';

  interface Props {
    onClose: () => void;
    onImportText: (text: string) => ToolResult;
    onImportFile?: (e: Event) => void;
  }
  let { onClose, onImportText }: Props = $props();

  let pasteText = $state('');
  let error = $state('');

  function runImport(text: string) {
    error = '';
    if (!text.trim()) { error = 'Paste or choose a dare-night-session-v1 JSON document first.'; return; }
    const res = onImportText(text);
    if (!res.ok) error = res.message;
  }

  function onFile(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => runImport(String(ev.target?.result ?? ''));
    reader.onerror = () => { error = 'Invalid session file: could not read the file.'; };
    reader.readAsText(file);
  }
</script>

<Dialog labelId="dlg-import" onClose={onClose}>
  <div class="flex items-start justify-between gap-2.5 mb-2.5">
    <div class="flex items-center gap-2.5">
      <UploadSimple size={22} weight="bold" aria-hidden="true" />
      <h2 id="dlg-import" class="text-xl font-semibold" style="color: var(--color-accent);">Import Session</h2>
    </div>
    <button class="p-2.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors" onclick={onClose} aria-label="Close import dialog"><X size={18} weight="bold" /></button>
  </div>

  <p class="text-sm text-gray-700 mb-2.5">Paste a <code>dare-night-session-v1</code> export below, or choose its <code>.json</code> file. Invalid files are rejected and leave your current session untouched.</p>

  <label class="block text-xs font-semibold text-gray-700 mb-1" for="import-paste">Session JSON</label>
  <textarea
    id="import-paste"
    class="w-full bg-gray-50 border-2 border-gray-300 rounded-[10px] p-2.5 text-[12px] font-mono leading-snug"
    style="height: 160px; min-height: 160px;"
    placeholder="Paste a dare-night-session-v1 JSON document here"
    bind:value={pasteText}
  ></textarea>

  {#if error}
    <p class="mt-2.5 text-sm text-red-600 font-medium rounded-[10px] bg-red-50 px-2.5 py-2.5" role="alert">{error}</p>
  {/if}

  <div class="flex flex-wrap items-center gap-2.5 mt-5">
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-white transition-colors hover:opacity-90" style="background-color: var(--color-accent);" onclick={() => runImport(pasteText)}>
      <FileText size={18} weight="bold" aria-hidden="true" /> Import pasted JSON
    </button>
    <label class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50 cursor-pointer">
      <UploadSimple size={18} weight="bold" aria-hidden="true" /> Choose file…
      <input type="file" accept=".json,application/json" class="hidden" onchange={onFile} />
    </label>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50 ml-auto" onclick={onClose}>Close</button>
  </div>
</Dialog>
