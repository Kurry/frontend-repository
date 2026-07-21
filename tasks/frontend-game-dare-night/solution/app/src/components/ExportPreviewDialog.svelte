<script lang="ts">
  import { DownloadSimple, CopySimple, FileText, X } from 'phosphor-svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    payload: {
      schemaVersion: string;
      status: string;
      players: { name: string; points: number; forfeits: number }[];
      categories: string[];
      intensity: string;
      roundTimer: boolean;
      currentTurnIndex: number;
      winTarget: number;
      winner: string | null;
      customCards: unknown[];
      record: { holder: string; points: number } | null;
      turnLog: unknown[];
      exportedAt: string;
    };
    onClose: () => void;
    onDownload: () => void;
    onCopy: () => void;
  }
  let { payload, onClose, onDownload, onCopy }: Props = $props();

  let json = $state(JSON.stringify(payload, null, 2));
  $effect(() => { json = JSON.stringify(payload, null, 2); });
</script>

<Dialog labelId="dlg-export" onClose={onClose}>
  <div class="flex items-start justify-between gap-2.5 mb-2.5">
    <div class="flex items-center gap-2.5">
      <FileText size={22} weight="bold" aria-hidden="true" />
      <h2 id="dlg-export" class="text-xl font-semibold" style="color: var(--color-accent);">Export Session</h2>
    </div>
    <button class="p-2.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors" onclick={onClose} aria-label="Close export preview"><X size={18} weight="bold" /></button>
  </div>

  <p class="text-sm text-gray-700 mb-2.5">Review the <code>dare-night-session-v1</code> document before you take it. This is compiled live from the current session.</p>

  <ul class="grid grid-cols-2 gap-2.5 mb-5 text-xs">
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">schemaVersion</span><span class="font-semibold" data-export-field="schemaVersion">{payload.schemaVersion}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">winTarget</span><span class="font-semibold" data-export-field="winTarget">{payload.winTarget}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">status</span><span class="font-semibold" data-export-field="status">{payload.status}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">currentTurnIndex</span><span class="font-semibold" data-export-field="currentTurnIndex">{payload.currentTurnIndex}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">players</span><span class="font-semibold" data-export-field="players">{payload.players.length} ({payload.players.map(p => `${p.name}:${p.points}/${p.forfeits}`).join(', ') || 'none'})</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">turnLog</span><span class="font-semibold" data-export-field="turnLog">{payload.turnLog.length} entries</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">winner</span><span class="font-semibold" data-export-field="winner">{payload.winner ?? 'none'}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5"><span class="block text-gray-500">record</span><span class="font-semibold" data-export-field="record">{payload.record ? `${payload.record.holder} ${payload.record.points}` : 'none'}</span></li>
    <li class="rounded-[10px] bg-gray-50 px-2.5 py-2.5 col-span-2"><span class="block text-gray-500">categories / intensity / roundTimer / customCards</span><span class="font-semibold">{payload.categories.join(', ') || 'none'} · {payload.intensity} · timer {payload.roundTimer ? 'on' : 'off'} · {payload.customCards.length} custom</span></li>
  </ul>

  <label class="block text-xs font-semibold text-gray-700 mb-1" for="export-json">Full JSON (read-only)</label>
  <textarea
    id="export-json"
    class="w-full bg-gray-50 border-2 border-gray-300 rounded-[10px] p-2.5 text-[12px] font-mono leading-snug"
    style="height: 200px; min-height: 200px;"
    readonly
    bind:value={json}
  ></textarea>

  <div class="flex flex-wrap gap-2.5 mt-5">
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-white transition-colors hover:opacity-90" style="background-color: var(--color-accent);" onclick={onDownload}>
      <DownloadSimple size={18} weight="bold" aria-hidden="true" /> Download JSON
    </button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50" onclick={onCopy}>
      <CopySimple size={18} weight="bold" aria-hidden="true" /> Copy Session JSON
    </button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50 ml-auto" onclick={onClose}>Close</button>
  </div>
</Dialog>
