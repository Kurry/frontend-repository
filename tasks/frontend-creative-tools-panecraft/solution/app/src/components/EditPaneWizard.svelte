<script lang="ts">
  import * as store from '../lib/store';
  import { dataSources, getDataSourceById } from '../data/mockData';
  
  const editingInfo = $derived(store.getEditingPane());
  
  let selectedSourceId = $state('');
  let paneType = $state<store.PaneType>('line');
  let metric = $state('');
  let dimension = $state('');
  let title = $state('');
  let size = $state<store.PaneSize>('small');
  let refreshInterval = $state<store.RefreshInterval>('off');
  let initialized = $state(false);
  
  const page = $derived(editingInfo ? store.getPages().find(p => p.id === editingInfo.pageId) : null);
  const pane = $derived(editingInfo && page ? page.panes.find(p => p.id === editingInfo.paneId) : null);
  const selectedSource = $derived(getDataSourceById(selectedSourceId));
  
  const paneTypes: { type: store.PaneType; label: string; icon: string }[] = [
    { type: 'line', label: 'Line Chart', icon: '📈' },
    { type: 'bar', label: 'Bar Chart', icon: '📊' },
    { type: 'donut', label: 'Donut Chart', icon: '🍩' },
    { type: 'table', label: 'Data Table', icon: '📋' },
    { type: 'counter', label: 'Counter', icon: '🔢' },
  ];
  
  // Initialize from pane
  $effect(() => {
    if (pane && !initialized) {
      selectedSourceId = pane.dataSourceId;
      paneType = pane.type;
      metric = pane.metric;
      dimension = pane.dimension || '';
      title = pane.title;
      size = pane.size;
      refreshInterval = pane.refreshInterval;
      initialized = true;
    }
  });
  
  const availableMetrics = $derived.by(() => {
    if (!selectedSource) return [];
    const metrics = [...selectedSource.numericColumns];
    if (selectedSource.id === 'support-tickets' || selectedSource.id === 'sales-sheet') {
      metrics.push('_count');
    }
    return metrics;
  });
  
  const availableDimensions = $derived.by(() => {
    if (!selectedSource) return [];
    const dims: string[] = [];
    if (selectedSource.dateColumn) dims.push(selectedSource.dateColumn);
    if (selectedSource.categoryColumn) dims.push(selectedSource.categoryColumn);
    for (const col of selectedSource.columns) {
      if (col !== selectedSource.dateColumn && col !== selectedSource.categoryColumn && !selectedSource.numericColumns.includes(col)) {
        dims.push(col);
      }
    }
    return [...new Set(dims)];
  });

  $effect(() => {
    if (selectedSource && initialized) {
      if (!availableMetrics.includes(metric)) metric = availableMetrics[0] ?? '';
      if (dimension && !availableDimensions.includes(dimension)) dimension = '';
    }
  });
  
  function close() {
    initialized = false;
    store.setEditingPane(null);
  }
  
  function handleSave() {
    if (!editingInfo || !metric || !title.trim()) return;
    
    store.updatePane(editingInfo.pageId, editingInfo.paneId, {
      title: title.trim(),
      type: paneType,
      dataSourceId: selectedSourceId,
      metric,
      dimension: dimension || undefined,
      size,
      refreshInterval,
      refreshTick: 0,
      lastRefreshTime: Date.now(),
    });
    
    close();
  }
</script>

{#if editingInfo && pane}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="presentation" onclick={close}>
    <div class="bg-white rounded-[var(--radius-base)] w-full max-w-lg max-h-[85vh] overflow-auto shadow-xl" role="dialog" aria-modal="true" aria-labelledby="edit-pane-heading" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <h2 id="edit-pane-heading" class="text-lg font-semibold text-[var(--color-text-primary)]">Edit Pane</h2>
        <button aria-label="Close Edit Pane" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl min-w-8 min-h-8" onclick={close}>×</button>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="edit-pane-title" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Title</label>
          <input id="edit-pane-title" type="text" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]" bind:value={title} />
        </div>
        
        <div>
          <label for="edit-pane-source" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Data Source</label>
          <select id="edit-pane-source" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={selectedSourceId}>
            {#each dataSources as ds}
              <option value={ds.id}>{ds.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Pane Type</label>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {#each paneTypes as pt}
              <button type="button" class="p-2 border rounded-[var(--radius-base)] cursor-pointer text-center text-xs {paneType === pt.type ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}" onclick={() => paneType = pt.type}>
                <div class="text-base">{pt.icon}</div>
                <div class="tiny mt-0.5">{pt.label.split(' ')[0]}</div>
              </button>
            {/each}
          </div>
        </div>
        
        <div>
          <label for="edit-pane-metric" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Metric</label>
          <select id="edit-pane-metric" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={metric}>
            {#each availableMetrics as m}
              <option value={m}>{m === '_count' ? 'Count (rows)' : m}</option>
            {/each}
          </select>
        </div>
        
        {#if paneType !== 'counter' && paneType !== 'table'}
          <div>
            <label for="edit-pane-dimension" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Group By</label>
            <select id="edit-pane-dimension" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={dimension}>
              <option value="">None</option>
              {#each availableDimensions as d}
                <option value={d}>{d}</option>
              {/each}
            </select>
          </div>
        {/if}
        
        <div>
          <label class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Size</label>
          <div class="flex gap-2">
            {#each ['small', 'medium', 'large'] as sz}
              <button class="px-3 py-1.5 text-xs rounded-[var(--radius-base)] {size === sz ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)]'}" onclick={() => size = sz as store.PaneSize}>{sz.charAt(0).toUpperCase() + sz.slice(1)}</button>
            {/each}
          </div>
        </div>
        
        <div>
          <label for="edit-pane-refresh" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Refresh Interval</label>
          <select id="edit-pane-refresh" class="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={refreshInterval}>
            <option value="off">Off</option>
            <option value="30s">Every 30s</option>
            <option value="5m">Every 5m</option>
          </select>
        </div>
      </div>
      
      <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
        <button class="px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]" onclick={close}>Cancel</button>
        <button class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 disabled:opacity-40" disabled={!metric || !title.trim()} onclick={handleSave}>Save Changes</button>
      </div>
    </div>
  </div>
{/if}
