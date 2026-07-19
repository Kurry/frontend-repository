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
  import DataSourcePreview from './components/DataSourcePreview.svelte';
  import SharePanel from './components/SharePanel.svelte';
  import EditPaneWizard from './components/EditPaneWizard.svelte';
  import EmptyPageState from './components/EmptyPageState.svelte';

  onMount(() => {
    return store.startRefreshTicker();
  });
</script>

<div class="min-h-screen bg-white">
  <Header />
  
  <div class="max-w-7xl mx-auto px-4 py-4">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <PageTabs />
      <div class="flex items-center gap-2 flex-wrap">
        <CollaborationPanel />
        <button
          class="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] whitespace-nowrap"
          onclick={() => store.setShowSharePanel(true)}
        >
          Share
        </button>
        <DateRangeFilter />
        <button 
          class="bg-[var(--color-primary)] text-white px-4 py-2 rounded-[var(--radius-base)] text-sm font-medium hover:opacity-90 transition-opacity"
          onclick={() => store.setShowCreateWizard(true)}
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
  </div>

  {#if store.getShowCreateWizard()}
    <CreatePaneWizard />
  {/if}

  {#if store.getShowDataSourcePreview()}
    <DataSourcePreview />
  {/if}

  {#if store.getShowSharePanel()}
    <SharePanel />
  {/if}

  {#if store.getEditingPane()}
    <EditPaneWizard />
  {/if}

  <!-- Data Source Library -->
  <div class="max-w-7xl mx-auto px-4 py-6 mt-4 border-t border-[var(--color-border)]">
    <h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Data Source Library</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each dataSources as ds}
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] p-4 hover:border-[var(--color-primary)] transition-colors cursor-pointer"
             onclick={() => store.setShowDataSourcePreview(ds)}
             role="button"
             tabindex="0"
             onkeydown={(e) => { if (e.key === 'Enter') store.setShowDataSourcePreview(ds); }}>
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
</div>
