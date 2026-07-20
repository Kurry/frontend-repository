<script>
  import { Toast } from 'flowbite-svelte';
  import { CheckCircle, WarningCircle } from 'phosphor-svelte';
  import { reviewState } from './lib/state.svelte.js';
  import { copyExportText } from './lib/actions.js';
  import TopBar from './components/TopBar.svelte';
  import QueueView from './components/QueueView.svelte';
  import EvidenceView from './components/EvidenceView.svelte';
  import CanaryView from './components/CanaryView.svelte';
  import MutationView from './components/MutationView.svelte';
  import AuditView from './components/AuditView.svelte';
  import ExportPanel from './components/ExportPanel.svelte';

  const appState = reviewState;
  let exportButton = $state(null);

  async function copyExport() {
    return copyExportText(appState);
  }
</script>

<svelte:head>
  <meta name="theme-color" content={appState.theme === 'dark' ? '#111a1f' : '#f4f1ea'} />
</svelte:head>

<div class:theme-dark={appState.theme === 'dark'} class:mobile-nav-open={appState.mobileNavOpen} class="app-shell">
  <TopBar state={appState} bind:exportTrigger={exportButton} />
  <main class="mx-auto max-w-[1500px] px-3 pb-12 pt-24 sm:px-6 lg:px-8">
    {#if appState.activeView === 'queue'}
      <QueueView state={appState} />
    {:else if appState.activeView === 'evidence-view'}
      <EvidenceView state={appState} />
    {:else if appState.activeView === 'canary'}
      <CanaryView state={appState} />
    {:else if appState.activeView === 'mutation'}
      <MutationView state={appState} />
    {:else if appState.activeView === 'audit'}
      <AuditView state={appState} />
    {/if}
  </main>

  <ExportPanel state={appState} {copyExport} exportTrigger={exportButton} />

  {#if appState.toast}
    <div class="fixed bottom-4 right-4 z-[80] max-w-[calc(100vw-2rem)] toast-enter" role="status" aria-live="polite">
      <Toast color={appState.toast.tone === 'error' ? 'red' : 'green'} class="!rounded-xl !border !border-slate-200 !bg-white !shadow-xl">
        {#if appState.toast.tone === 'error'}<WarningCircle aria-hidden="true" size={19} weight="fill" class="mr-3 text-rose-600" />{:else}<CheckCircle aria-hidden="true" size={19} weight="fill" class="mr-3 text-emerald-600" />{/if}
        <span class="text-sm font-bold text-ink-900">{appState.toast.message}</span>
      </Toast>
    </div>
  {/if}

  <div class="sr-only" aria-live="polite">
    {appState.toast?.message || ''}
  </div>
</div>
