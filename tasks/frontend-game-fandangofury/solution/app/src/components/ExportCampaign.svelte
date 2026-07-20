<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const campaignJson = $derived(JSON.stringify(game.exportCampaign(), null, 2));
  let copyFeedback = $state('');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(campaignJson);
      copyFeedback = 'Copied to clipboard!';
      setTimeout(() => copyFeedback = '', 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  function handleDownload() {
    const blob = new Blob([campaignJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fandangofury-campaign.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
    role="dialog"
    aria-label="Export Campaign"
  >
    <div class="bg-fury-dark border-b border-purple-500/20 rounded-t-2xl p-4 sm:p-6 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-purple-400">📤 Export Campaign</h2>
        <button
          class="btn-interactive min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
          onclick={onClose}
          aria-label="Close export"
        >
          ✕
        </button>
      </div>
      <p class="text-slate-300 text-xs mt-1">Copy or download your campaign data to play on another device</p>
    </div>

    <div class="p-4 sm:p-6 flex-1 min-h-0 flex flex-col gap-4">
      <div class="flex-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden flex flex-col relative">
        <pre class="flex-1 p-4 text-xs text-emerald-300 font-mono overflow-auto">{campaignJson}</pre>
        {#if copyFeedback}
          <div class="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded font-bold" aria-live="polite">
            {copyFeedback}
          </div>
        {/if}
      </div>

      <div class="flex gap-3 flex-shrink-0">
        <button
          class="btn-interactive flex-1 min-h-12 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg font-bold text-white border border-purple-400/30"
          onclick={handleCopy}
        >
          📋 Copy
        </button>
        <button
          class="btn-interactive flex-1 min-h-12 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white border border-emerald-400/30"
          onclick={handleDownload}
        >
          💾 Download
        </button>
      </div>
    </div>
  </div>
</div>
