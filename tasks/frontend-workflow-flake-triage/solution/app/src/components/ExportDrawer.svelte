<script lang="ts">
  import { IconBraces, IconCheck, IconClipboard, IconDownload, IconFileText, IconX } from '@tabler/icons-svelte';
  import { onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { focusTrap } from '../lib/focusTrap';
  import { motion } from '../lib/motion.svelte';

  let { returnFocus }: { returnFocus?: HTMLElement } = $props();
  let closeButton: HTMLButtonElement;
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    if (copyTimer) clearTimeout(copyTimer);
  });

  async function copy() {
    copied = await triage.copyExport();
    if (copied) {
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1800);
    }
  }
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && triage.closeExport()} />

<div class="modal-layer" role="presentation">
  <button class="backdrop" aria-label="Close export triage report" onclick={() => triage.closeExport()} transition:fade={{ duration: motion.reduced ? 0 : 200 }}></button>
  <div class="drawer card-panel" role="dialog" aria-modal="true" aria-labelledby="export-title" transition:fly={{ x: 30, duration: motion.reduced ? 0 : 240 }} use:focusTrap={{ returnFocus }}>
    <header class="drawer-header">
      <div>
        <span class="eyebrow">Session artifact</span>
        <h2 id="export-title">Export triage report</h2>
        <p>Compiled live from {triage.activeSuite.name}</p>
      </div>
      <button bind:this={closeButton} class="close-button" type="button" aria-label="Close export triage report" onclick={() => triage.closeExport()}>
        <IconX size={19} />
      </button>
    </header>

    <div class="tabs-root">
      <div class="tabs-list" role="tablist" aria-label="Export format">
        <button role="tab" aria-selected={triage.exportTab === 'quarantine-text'} aria-controls="quarantine-tab-panel" class="tab-trigger" class:active={triage.exportTab === 'quarantine-text'} type="button" onclick={() => triage.setExportTab('quarantine-text')}>
          <IconFileText size={15} /> Quarantine text
        </button>
        <button role="tab" aria-selected={triage.exportTab === 'triage-report-json'} aria-controls="json-tab-panel" class="tab-trigger" class:active={triage.exportTab === 'triage-report-json'} type="button" onclick={() => triage.setExportTab('triage-report-json')}>
          <IconBraces size={15} /> Triage report JSON
        </button>
      </div>

      {#if triage.exportTab === 'quarantine-text'}
      <div id="quarantine-tab-panel" role="tabpanel" class="tab-content">
        <div class="format-summary">
          <span><strong>{triage.allFailTests.length}</strong> all-fail</span>
          <span><strong>{triage.flakyTests.length}</strong> flaky</span>
          <span>Plain text · grouped identifiers</span>
        </div>
        <pre class="preview" data-export-preview="quarantine-text">{triage.quarantineText}</pre>
      </div>
      {:else}
      <div id="json-tab-panel" role="tabpanel" class="tab-content">
        <div class="format-summary">
          <span><strong>{triage.activeSuite.tests.length}</strong> test records</span>
          <span><strong>v1</strong> schema</span>
          <span>JSON · live session state</span>
        </div>
        <pre class="preview json-preview" data-export-preview="triage-report-json">{triage.reportText}</pre>
      </div>
      {/if}
    </div>

    <footer class="drawer-footer">
      <span class="export-note">Copy and Download use the exact preview shown above.</span>
      <div class="footer-actions">
        <button class="action-btn" type="button" onclick={copy}>
          {#if copied}<IconCheck size={16} /> Copied{:else}<IconClipboard size={16} /> Copy{/if}
        </button>
        <button class="action-btn primary" type="button" onclick={() => triage.downloadExport()}>
          <IconDownload size={16} /> Download
        </button>
      </div>
    </footer>
  </div>
</div>

<style>
  .modal-layer { position: fixed; z-index: 80; inset: 0; display: flex; justify-content: flex-end; }
  .backdrop { position: absolute; inset: 0; border: 0; background: rgba(16, 25, 22, .46); backdrop-filter: blur(3px); }
  .drawer { position: relative; display: flex; width: min(680px, calc(100vw - 28px)); height: calc(100vh - 24px); margin: 12px; overflow: hidden; flex-direction: column; border-radius: 20px; }
  .drawer-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; padding: 22px 22px 17px; border-bottom: 1px solid #e1e7e3; }
  h2 { margin: 3px 0 0; color: #17201d; font-size: 21px; letter-spacing: -.025em; }
  .drawer-header p { margin: 4px 0 0; color: #74817b; font-size: 11px; }
  .close-button { display: grid; width: 36px; height: 36px; flex: 0 0 auto; place-items: center; border: 1px solid #dbe3de; border-radius: 10px; background: #fff; color: #52615b; transition: background-color 150ms ease, transform 100ms ease; }
  .close-button:hover { background: #f2f6f3; }
  .close-button:active { transform: scale(.97); }
  .tabs-root { display: flex; min-height: 0; flex: 1; flex-direction: column; }
  .tabs-list { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 16px 22px 0; border-radius: 11px; background: #edf2ef; padding: 4px; }
  .tab-trigger { display: inline-flex; min-height: 38px; align-items: center; justify-content: center; gap: 7px; border: 0; border-radius: 8px; background: transparent; color: #66736e; font-size: 12px; font-weight: 800; transition: background-color 150ms ease, box-shadow 150ms ease; }
  .tab-trigger:hover { background: rgba(255,255,255,.58); }
  .tab-trigger.active { background: #fff; color: #1f2c27; box-shadow: 0 2px 8px rgba(27,49,41,.08); }
  .tab-content { display: flex; min-height: 0; flex: 1; flex-direction: column; padding: 13px 22px 17px; }
  .format-summary { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 9px; }
  .format-summary span { border: 1px solid #dfe6e2; border-radius: 7px; background: #f9fbfa; padding: 5px 7px; color: #66746e; font-size: 9px; }
  .format-summary strong { color: #283630; }
  .preview { min-height: 0; margin: 0; overflow: auto; flex: 1; border: 1px solid #d7e0db; border-radius: 12px; background: #17201d; padding: 16px; color: #cce6db; font-family: var(--font-mono); font-size: 11px; line-height: 1.68; tab-size: 2; white-space: pre; }
  .json-preview { color: #d5e4dd; }
  .drawer-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-top: 1px solid #e1e7e3; padding: 14px 22px; }
  .export-note { color: #7b8782; font-size: 10px; }
  .footer-actions { display: flex; gap: 8px; }
  :global(.dark) .drawer-header, :global(.dark) .drawer-footer { border-color: #30403a; }
  :global(.dark) h2 { color: #eff4f1; }
  :global(.dark) .close-button { border-color: #3a4944; background: #202c28; color: #e4ebe7; }
  :global(.dark) .tabs-list { background: #121b18; }
  :global(.dark) .tab-trigger:hover { background: #23312c; }
  :global(.dark) .tab-trigger.active { background: #283631; color: #eff4f1; }
  :global(.dark) .format-summary span { border-color: #35433e; background: #18221f; color: #9ba8a2; }
  :global(.dark) .format-summary strong { color: #e1e8e4; }
  :global(.dark) .preview { border-color: #3c4a45; background: #0e1513; }
  @media (max-width: 560px) {
    .drawer { width: calc(100vw - 16px); height: calc(100vh - 16px); margin: 8px; }
    .drawer-header { padding: 18px 15px 14px; }
    .tabs-list { margin: 12px 15px 0; }
    .tab-trigger { font-size: 10px; }
    .tab-content { padding: 10px 15px 13px; }
    .drawer-footer { align-items: stretch; flex-direction: column; padding: 12px 15px; }
    .footer-actions { display: grid; grid-template-columns: 1fr 1fr; }
  }
</style>
