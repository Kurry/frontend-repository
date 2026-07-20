<script>
  import { onMount } from 'svelte';
  import { Toast } from 'flowbite-svelte';
  import { CheckCircle, Info, WarningCircle } from 'phosphor-svelte';
  import { reviewState } from './lib/state.svelte.js';
  import { registerWebMCP } from './lib/webmcp.js';
  import TopBar from './components/TopBar.svelte';
  import QueueView from './components/QueueView.svelte';
  import EvidenceView from './components/EvidenceView.svelte';
  import CanaryView from './components/CanaryView.svelte';
  import MutationView from './components/MutationView.svelte';
  import AuditView from './components/AuditView.svelte';
  import ExportPanel from './components/ExportPanel.svelte';

  const state = reviewState;

  async function copyExport() {
    if (!state.exportOpen) state.openExport();
    try {
      await navigator.clipboard.writeText(state.activeExportText);
      state.showToast(`${state.exportFormat === 'review-report-json' ? 'Review report JSON' : 'Summary text'} copied to clipboard.`);
      return true;
    } catch {
      state.showToast('Clipboard access was unavailable. Select the preview text to copy it.', 'error');
      return false;
    }
  }

  function openImportPicker() {
    state.openExport('review-report-json');
    requestAnimationFrame(() => document.getElementById('report-import')?.click());
  }

  onMount(() => registerWebMCP(state, { copyExport, openImportPicker }));
</script>

<svelte:head>
  <meta name="theme-color" content={state.theme === 'dark' ? '#111a1f' : '#f4f1ea'} />
</svelte:head>

<div class:theme-dark={state.theme === 'dark'} class="app-shell">
  <TopBar {state} />
  <main class="mx-auto max-w-[1500px] px-3 pb-12 pt-24 sm:px-6 lg:px-8">
    {#if state.activeView === 'queue'}
      <QueueView {state} />
    {:else if state.activeView === 'evidence-view'}
      <EvidenceView {state} />
    {:else if state.activeView === 'canary'}
      <CanaryView {state} />
    {:else if state.activeView === 'mutation'}
      <MutationView {state} />
    {:else if state.activeView === 'audit'}
      <AuditView {state} />
    {/if}
  </main>

  <ExportPanel {state} {copyExport} />

  {#if state.toast}
    <div class="fixed bottom-4 right-4 z-[80] max-w-[calc(100vw-2rem)] toast-enter" role="status" aria-live="polite">
      <Toast color={state.toast.tone === 'error' ? 'red' : 'green'} class="!rounded-xl !border !border-slate-200 !bg-white !shadow-xl">
        {#if state.toast.tone === 'error'}<WarningCircle size={19} weight="fill" class="mr-3 text-rose-600" />{:else}<CheckCircle size={19} weight="fill" class="mr-3 text-emerald-600" />{/if}
        <span class="text-sm font-bold text-ink-900">{state.toast.message}</span>
      </Toast>
    </div>
  {/if}

  <div class="sr-only" aria-live="polite">
    {state.toast?.message || ''}
  </div>
</div>
