<script lang="ts">
  import { onMount } from 'svelte';
  import * as store from './lib/store';
  import { dataSources } from './data/mockData';
  import Header from './components/Header.svelte';
  import PageTabs from './components/PageTabs.svelte';
  import DateRangeFilter from './components/DateRangeFilter.svelte';
  import CollaborationPanel from './components/CollaborationPanel.svelte';
  import SavedAnalyses from './components/SavedAnalyses.svelte';
  import PaneGrid from './components/PaneGrid.svelte';
  import CreatePaneWizard from './components/CreatePaneWizard.svelte';
  import EditPaneWizard from './components/EditPaneWizard.svelte';
  import DataSourcePreview from './components/DataSourcePreview.svelte';
  import SharePanel from './components/SharePanel.svelte';
  import ExportCenter from './components/ExportCenter.svelte';
  import EmptyPageState from './components/EmptyPageState.svelte';
  import Coachmark from './components/Coachmark.svelte';

  const announcement = $derived(store.getAnnouncement());
  const storageWarning = $derived(store.getStorageWarning());

  onMount(() => {
    return store.startRefreshTicker();
  });
</script>

<div class="min-h-screen bg-white">
  <Header />

  {#if storageWarning}
    <div class="bg-[#FFF7ED] border-b border-[#F59E0B] px-4 py-2" role="alert">
      <p class="max-w-7xl mx-auto text-xs" style="color: #92400E;">
        ⚠ {storageWarning}
      </p>
    </div>
  {/if}

  <main class="max-w-7xl mx-auto px-4 py-4">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <PageTabs />
      <div class="flex items-center gap-2 flex-wrap">
        <CollaborationPanel />
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors whitespace-nowrap"
          onclick={() => store.setShowSharePanel(true)}
        >
          Share
        </button>
        <DateRangeFilter />
        <button
          type="button"
          class="tap-target bg-[var(--color-primary)] text-white px-4 py-2 rounded-[var(--radius-base)] text-sm font-medium hover:opacity-90 transition-opacity"
          onclick={() => store.openCreateWizard()}
        >
          Create Pane
        </button>
      </div>
    </div>

    {#if store.getActivePage().panes.length === 0}
      <EmptyPageState />
    {:else}
      <PaneGrid />
    {/if}
  </main>

  <!-- Data Source Library -->
  <div class="max-w-7xl mx-auto px-4 py-6 mt-4 border-t border-[var(--color-border)]">
    <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Data Source Library</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each dataSources as ds}
        <div
          class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] p-4 hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer"
          onclick={() => store.setShowDataSourcePreview(ds.id)}
          role="button"
          tabindex="0"
          aria-label="Preview {ds.name} rows"
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              store.setShowDataSourcePreview(ds.id);
            }
          }}
        >
          <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{ds.name}</h3>
          <p class="text-xs text-[var(--color-text-secondary)] mb-2">{ds.description}</p>
          <span class="text-xs text-[var(--color-text-secondary)]">{ds.rows.length} rows</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="px-4">
    <SavedAnalyses />
  </div>

  <!-- Overlays -->
  <CreatePaneWizard />
  <EditPaneWizard />
  <DataSourcePreview />
  <SharePanel />
  <ExportCenter />
  <Coachmark />

  <!-- Polite live region for transient confirmations and validation errors -->
  <div class="sr-only" aria-live="polite" data-announcement-stamp={announcement.stamp}>
    {announcement.message}
  </div>
</div>
