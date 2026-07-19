<script lang="ts">
  import * as store from '../lib/store';
  import { dataSources, getDataSourceById } from '../data/mockData';
  
  let step = $state(1);
  let selectedSourceId = $state('');
  let paneType = $state<store.PaneType>('line');
  let metric = $state('');
  let dimension = $state('');
  let title = $state('');
  let feedback = $state('');
  
  const selectedSource = $derived(getDataSourceById(selectedSourceId));
  
  const paneTypes: { type: store.PaneType; label: string; icon: string }[] = [
    { type: 'line', label: 'Line Chart', icon: '📈' },
    { type: 'bar', label: 'Bar Chart', icon: '📊' },
    { type: 'donut', label: 'Donut Chart', icon: '🍩' },
    { type: 'table', label: 'Data Table', icon: '📋' },
    { type: 'counter', label: 'Counter', icon: '🔢' },
  ];
  
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
    // Add other string columns
    for (const col of selectedSource.columns) {
      if (col !== selectedSource.dateColumn && col !== selectedSource.categoryColumn && !selectedSource.numericColumns.includes(col)) {
        dims.push(col);
      }
    }
    return [...new Set(dims)];
  });
  
  function reset() {
    step = 1;
    selectedSourceId = '';
    paneType = 'line';
    metric = '';
    dimension = '';
    title = '';
    feedback = '';
  }
  
  function close() {
    reset();
    store.setShowCreateWizard(false);
  }
  
  function handleCreate() {
    if (!selectedSourceId || !metric) {
      feedback = 'Choose a data source and metric before creating the pane.';
      return;
    }
    if (paneType !== 'counter' && paneType !== 'table' && !dimension) {
      feedback = 'Choose a grouping dimension for chart panes.';
      return;
    }
    
    const paneTypeLabel = paneTypes.find((option) => option.type === paneType)?.label ?? 'Pane';
    const paneTitle = title.trim() || `${selectedSource?.name} ${paneTypeLabel}`;
    
    store.addPane(store.getActivePageId(), {
      title: paneTitle,
      type: paneType,
      dataSourceId: selectedSourceId,
      metric,
      dimension: dimension || undefined,
      size: 'small',
      refreshInterval: 'off',
    });
    
    close();
  }
</script>

<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="presentation">
  <div class="bg-white rounded-[var(--radius-base)] w-full max-w-lg max-h-[85vh] overflow-auto shadow-xl" role="dialog" aria-modal="true" aria-labelledby="create-pane-title" onclick={(e) => e.stopPropagation()}>
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <h2 id="create-pane-title" class="text-lg font-semibold text-[var(--color-text-primary)]">Create Pane</h2>
      <button aria-label="Close Create Pane" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl min-w-8 min-h-8" onclick={close}>×</button>
    </div>
    
    <!-- Step indicator -->
    <div class="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-border)]">
      {#each ['Source', 'Type', 'Configure'] as label, i}
        <div class="flex items-center gap-1">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium {i + 1 <= step ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'}">
            {i + 1}
          </div>
          <span class="text-xs {i + 1 <= step ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'} hidden sm:inline">{label}</span>
        </div>
        {#if i < 2}
          <div class="w-4 h-px bg-[var(--color-border)]"></div>
        {/if}
      {/each}
    </div>
    
    <!-- Content -->
    <div class="p-6">
      {#if step === 1}
        <!-- Step 1: Choose data source -->
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Choose a Data Source</h3>
        <div class="space-y-2">
          {#each dataSources as ds}
            <button
              type="button"
              class="p-3 border rounded-[var(--radius-base)] cursor-pointer transition-colors {selectedSourceId === ds.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
              onclick={() => selectedSourceId = ds.id}
            >
              <div class="text-sm font-medium text-[var(--color-text-primary)]">{ds.name}</div>
              <div class="text-xs text-[var(--color-text-secondary)]">{ds.description} — {ds.rows.length} rows</div>
            </button>
          {/each}
        </div>
      {:else if step === 2}
        <!-- Step 2: Choose pane type -->
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Choose Pane Type</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {#each paneTypes as pt}
            <button
              type="button"
              class="p-3 border rounded-[var(--radius-base)] cursor-pointer text-center transition-colors {paneType === pt.type ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
              onclick={() => paneType = pt.type}
            >
              <div class="text-xl mb-1">{pt.icon}</div>
              <div class="text-xs font-medium text-[var(--color-text-primary)]">{pt.label}</div>
            </button>
          {/each}
        </div>
      {:else if step === 3}
        <!-- Step 3: Configure -->
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Configure Pane</h3>
        <div class="space-y-3">
          <div>
            <label for="pane-title" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Title (optional)</label>
            <input 
              id="pane-title"
              type="text" 
              class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]"
              placeholder="My Pane"
              bind:value={title}
            />
          </div>
          
          <div>
            <label for="pane-metric" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Metric</label>
            <select 
              id="pane-metric"
              class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white"
              bind:value={metric}
            >
              <option value="">Select a metric...</option>
              {#each availableMetrics as m}
                <option value={m}>{m === '_count' ? 'Count (rows)' : m}</option>
              {/each}
            </select>
          </div>
          
          {#if paneType !== 'counter' && paneType !== 'table'}
            <div>
              <label for="pane-dimension" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Group By (Dimension)</label>
              <select 
                id="pane-dimension"
                class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white"
                bind:value={dimension}
              >
                <option value="">Select a dimension...</option>
                {#each availableDimensions as d}
                  <option value={d}>{d}</option>
                {/each}
              </select>
            </div>
          {/if}
          {#if feedback}
            <p class="text-xs text-[var(--color-primary)]" role="alert">{feedback}</p>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Footer -->
    <div class="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]">
      {#if step > 1}
        <button 
          class="px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
          onclick={() => step--}
        >Back</button>
      {:else}
        <div></div>
      {/if}
      
      {#if step < 3}
        <button 
          class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 disabled:opacity-40"
          disabled={step === 1 && !selectedSourceId}
          onclick={() => step++}
        >Next</button>
      {:else}
        <button 
          class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 disabled:opacity-40"
          disabled={!metric || (paneType !== 'counter' && paneType !== 'table' && !dimension)}
          onclick={handleCreate}
        >Create Pane</button>
      {/if}
    </div>
  </div>
</div>
