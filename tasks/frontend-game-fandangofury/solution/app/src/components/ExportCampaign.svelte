<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const campaignJson = $derived(JSON.stringify(game.exportCampaign(), null, 2));
  let copyFeedback = $state('');
  let copySucceeded = $state(false);
  let downloadFeedback = $state('');

  async function handleCopy() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(campaignJson);
      copied = true;
    } catch {
      let ta: HTMLTextAreaElement | null = null;
      try {
        ta = document.createElement('textarea');
        ta.value = campaignJson;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      } finally {
        ta?.remove();
      }
    }
    copySucceeded = copied;
    copyFeedback = copied ? 'Copied to clipboard!' : 'Copy failed — select the preview and copy manually.';
    game.showToast(
      copied ? 'Campaign JSON copied to clipboard' : 'Campaign JSON copy failed — copy the visible preview manually',
      copied ? 'success' : 'warn',
    );
    setTimeout(() => (copyFeedback = ''), 2000);
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
    downloadFeedback = 'Download started!';
    game.showToast('Campaign JSON downloaded', 'success');
    setTimeout(() => (downloadFeedback = ''), 2000);
  }
</script>

<OverlayShell
  title="Export Campaign"
  emoji="📤"
  accent="#a855f7"
  maxWidth="max-w-2xl"
  subtitle="Copy or download your portable campaign"
  {onClose}
>
  <div class="flex flex-col gap-4 h-full">
    <div class="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden relative min-h-[180px]">
      <pre class="p-4 text-xs text-emerald-300 font-mono overflow-auto max-h-[42vh] whitespace-pre-wrap break-words">{campaignJson}</pre>
    </div>

    <div class="flex items-center gap-2 text-xs min-h-[1.25rem]" aria-live="polite">
      {#if copyFeedback}<span class="font-semibold {copySucceeded ? 'text-emerald-300' : 'text-amber-300'}">📋 {copyFeedback}</span>{/if}
      {#if downloadFeedback}<span class="text-emerald-300 font-semibold">💾 {downloadFeedback}</span>{/if}
    </div>

    <div class="flex gap-3">
      <button
        id="campaign-export-copy"
        class="btn-interactive flex-1 min-h-12 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg font-bold text-white border border-purple-400/30"
        onclick={handleCopy}
      >
        📋 Copy
      </button>
      <button
        id="campaign-export-download"
        class="btn-interactive flex-1 min-h-12 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white border border-emerald-400/30"
        onclick={handleDownload}
      >
        💾 Download
      </button>
    </div>
  </div>
</OverlayShell>
