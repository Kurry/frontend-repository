<script lang="ts">
  import * as store from '../lib/store';
  import { dataSources, metricsFor, dimensionsFor } from '../data/mockData';
  import Modal from './Modal.svelte';

  const editingInfo = $derived(store.getEditingPane());
  const page = $derived(editingInfo ? store.getPages().find((p) => p.id === editingInfo.pageId) : null);
  const pane = $derived(editingInfo && page ? page.panes.find((p) => p.id === editingInfo.paneId) : null);

  let title = $state('');
  let source = $state('website-analytics');
  let type = $state<store.PaneType>('line');
  let metric = $state('');
  let dimension = $state('');
  let size = $state<store.PaneSize>('small');
  let refreshInterval = $state<store.RefreshInterval>('off');
  let errors = $state<Record<string, string>>({});
  let initializedFor = $state('');

  const isChart = $derived(type === 'line' || type === 'bar' || type === 'donut');

  // Populate the draft from the pane each time a different pane opens.
  $effect(() => {
    if (pane && initializedFor !== pane.id) {
      initializedFor = pane.id;
      title = pane.title;
      source = pane.source;
      type = pane.type;
      metric = pane.metric;
      dimension = pane.dimension ?? '';
      size = pane.size;
      refreshInterval = pane.refreshInterval;
      errors = {};
    }
    if (!pane) initializedFor = '';
  });

  // Keep metric/dimension coherent when the source changes.
  $effect(() => {
    if (metric && !metricsFor(source).includes(metric)) metric = '';
    if (dimension && !dimensionsFor(source).includes(dimension)) dimension = '';
  });

  function close() {
    store.setEditingPane(null);
  }

  function handleSave() {
    if (!editingInfo) return;
    const result = store.updatePane(editingInfo.pageId, editingInfo.paneId, {
      title: title.trim() || undefined,
      type,
      source,
      metric,
      dimension: isChart ? dimension || null : null,
      size,
      refreshInterval,
      lastRefreshTime: Date.now(),
      refreshTick: 0,
    });
    if (result.ok) {
      store.announce('Pane updated in place.');
      store.maybeCoachAfterEdit();
      close();
    } else {
      errors = { [result.field]: result.message };
      store.announce(result.message);
    }
  }

  function fieldError(field: string): string {
    return errors[field] ?? '';
  }
</script>

<Modal
  open={Boolean(editingInfo && pane)}
  heading="Edit Pane"
  labelledBy="edit-pane-heading"
  widthClass="max-w-lg"
  onClose={close}
>
  {#if pane}
    <div class="p-6 space-y-4">
      <div>
        <label for="edit-pane-title" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Title</label>
        <input
          id="edit-pane-title"
          type="text"
          class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]"
          bind:value={title}
        />
      </div>

      <div>
        <label for="edit-pane-source" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Data Source</label>
        <select
          id="edit-pane-source"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('source') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          bind:value={source}
        >
          {#each dataSources as ds}
            <option value={ds.id}>{ds.name}</option>
          {/each}
        </select>
        <div aria-live="polite">
          {#if fieldError('source')}<p class="field-error" role="alert">{fieldError('source')}</p>{/if}
        </div>
      </div>

      <div>
        <label for="edit-pane-type" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Pane Type</label>
        <select
          id="edit-pane-type"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('type') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          value={type}
          onchange={(event) => (type = event.currentTarget.value as store.PaneType)}
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="donut">Donut Chart</option>
          <option value="table">Data Table</option>
          <option value="counter">Counter</option>
        </select>
        <div aria-live="polite">
          {#if fieldError('type')}<p class="field-error" role="alert">{fieldError('type')}</p>{/if}
        </div>
      </div>

      <div>
        <label for="edit-pane-metric" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Metric</label>
        <select
          id="edit-pane-metric"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('metric') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          bind:value={metric}
        >
          <option value="">Select a metric…</option>
          {#each metricsFor(source) as m}
            <option value={m}>{m === '_count' ? '_count (row count)' : m}</option>
          {/each}
        </select>
        <div aria-live="polite">
          {#if fieldError('metric')}<p class="field-error" role="alert">{fieldError('metric')}</p>{/if}
        </div>
      </div>

      {#if isChart}
        <div>
          <label for="edit-pane-dimension" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Group By (Dimension)</label>
          <select
            id="edit-pane-dimension"
            class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('dimension') ? 'input-invalid' : 'border-[var(--color-border)]'}"
            bind:value={dimension}
          >
            <option value="">Select a dimension…</option>
            {#each dimensionsFor(source) as d}
              <option value={d}>{d}</option>
            {/each}
          </select>
          <div aria-live="polite">
            {#if fieldError('dimension')}<p class="field-error" role="alert">{fieldError('dimension')}</p>{/if}
          </div>
        </div>
      {:else}
        <p class="text-xs text-[var(--color-text-secondary)]">Data Table and Counter panes aggregate whole rows, so no dimension applies (dimension stays null).</p>
      {/if}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="edit-pane-size" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Size</label>
          <select id="edit-pane-size" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={size}>
            <option value="small">Small (1 column)</option>
            <option value="medium">Medium (2 columns)</option>
            <option value="large">Large (4 columns)</option>
          </select>
        </div>
        <div>
          <label for="edit-pane-refresh" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Refresh Interval</label>
          <select id="edit-pane-refresh" class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={refreshInterval}>
            <option value="off">Off</option>
            <option value="30s">Every 30s</option>
            <option value="5m">Every 5m</option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        onclick={close}
      >Cancel</button>
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={handleSave}
      >Save Changes</button>
    </div>
  {/if}
</Modal>
