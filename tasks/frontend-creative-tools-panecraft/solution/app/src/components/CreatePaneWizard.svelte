<script lang="ts">
  import * as store from '../lib/store';
  import { dataSources, metricsFor, dimensionsFor } from '../data/mockData';
  import Modal from './Modal.svelte';

  const wizard = $derived(store.getWizard());
  const stepIndex = $derived(wizard.step === 'choose-source' ? 0 : wizard.step === 'choose-type' ? 1 : 2);
  const isChart = $derived(wizard.type === 'line' || wizard.type === 'bar' || wizard.type === 'donut');

  const paneTypes: { type: store.PaneType; label: string; icon: string }[] = [
    { type: 'line', label: 'Line Chart', icon: '📈' },
    { type: 'bar', label: 'Bar Chart', icon: '📊' },
    { type: 'donut', label: 'Donut Chart', icon: '🍩' },
    { type: 'table', label: 'Data Table', icon: '📋' },
    { type: 'counter', label: 'Counter', icon: '🔢' },
  ];

  function handleAdvance() {
    store.wizardAdvance();
  }

  function handleSubmit() {
    const result = store.submitCreateWizard();
    if (!result.ok) {
      store.announce(result.message);
    }
  }
</script>

<Modal
  open={wizard.open}
  heading="Create Pane"
  labelledBy="create-pane-title"
  soft={true}
  widthClass="max-w-lg"
  onClose={() => store.closeCreateWizard()}
>
  <!-- Step indicator -->
  <div class="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-border)]">
    {#each ['Source', 'Type', 'Configure'] as label, i}
      <div class="flex items-center gap-1.5">
        <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors {i <= stepIndex ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'}">
          {i + 1}
        </div>
        <span class="text-xs {i <= stepIndex ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'} hidden sm:inline">{label}</span>
      </div>
      {#if i < 2}
        <div class="w-4 h-px bg-[var(--color-border)]"></div>
      {/if}
    {/each}
  </div>

  <div class="p-6">
    {#if wizard.step === 'choose-source'}
      <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Choose a Data Source</h3>
      <div class="space-y-2">
        {#each dataSources as ds}
          <button
            type="button"
            class="w-full p-3 text-left border rounded-[var(--radius-base)] transition-colors {wizard.source === ds.id
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
            aria-pressed={wizard.source === ds.id}
            onclick={() => store.setWizardField('source', ds.id)}
          >
            <span class="block text-sm font-medium text-[var(--color-text-primary)]">{ds.name}</span>
            <span class="block text-xs text-[var(--color-text-secondary)]">{ds.description} — {ds.rows.length} rows</span>
          </button>
        {/each}
      </div>
      <div aria-live="polite">
        {#if wizard.errors.source}
          <p class="field-error" role="alert">{wizard.errors.source}</p>
        {/if}
      </div>
    {:else if wizard.step === 'choose-type'}
      <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Choose Pane Type</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {#each paneTypes as pt}
          <button
            type="button"
            class="p-3 border rounded-[var(--radius-base)] text-center transition-colors {wizard.type === pt.type
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
            aria-pressed={wizard.type === pt.type}
            onclick={() => store.setWizardField('type', pt.type)}
          >
            <span class="block text-xl mb-1" aria-hidden="true">{pt.icon}</span>
            <span class="block text-xs font-medium text-[var(--color-text-primary)]">{pt.label}</span>
          </button>
        {/each}
      </div>
    {:else}
      <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Configure Pane</h3>
      <div class="space-y-3">
        <div>
          <label for="pane-title" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Title (optional)</label>
          <input
            id="pane-title"
            type="text"
            class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)]"
            placeholder="My Pane"
            value={wizard.title}
            oninput={(event) => store.setWizardField('title', event.currentTarget.value)}
          />
        </div>

        <div>
          <label for="pane-metric" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Metric</label>
          <select
            id="pane-metric"
            class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {wizard.errors.metric ? 'input-invalid' : 'border-[var(--color-border)]'}"
            value={wizard.metric}
            onchange={(event) => store.setWizardField('metric', event.currentTarget.value)}
          >
            <option value="">Select a metric…</option>
            {#each metricsFor(wizard.source) as m}
              <option value={m}>{m === '_count' ? '_count (row count)' : m}</option>
            {/each}
          </select>
          <div aria-live="polite">
            {#if wizard.errors.metric}
              <p class="field-error" role="alert">{wizard.errors.metric}</p>
            {/if}
          </div>
        </div>

        {#if isChart}
          <div>
            <label for="pane-dimension" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Group By (Dimension)</label>
            <select
              id="pane-dimension"
              class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {wizard.errors.dimension ? 'input-invalid' : 'border-[var(--color-border)]'}"
              value={wizard.dimension}
              onchange={(event) => store.setWizardField('dimension', event.currentTarget.value)}
            >
              <option value="">Select a dimension…</option>
              {#each dimensionsFor(wizard.source) as d}
                <option value={d}>{d}</option>
              {/each}
            </select>
            <div aria-live="polite">
              {#if wizard.errors.dimension}
                <p class="field-error" role="alert">{wizard.errors.dimension}</p>
              {/if}
            </div>
          </div>
        {:else}
          <p class="text-xs text-[var(--color-text-secondary)]">Data Table and Counter panes aggregate whole rows, so no dimension applies (dimension stays null).</p>
        {/if}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="pane-size" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Size</label>
            <select
              id="pane-size"
              class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white"
              value={wizard.size}
              onchange={(event) => store.setWizardField('size', event.currentTarget.value)}
            >
              <option value="small">Small (1 column)</option>
              <option value="medium">Medium (2 columns)</option>
              <option value="large">Large (4 columns)</option>
            </select>
          </div>
          <div>
            <label for="pane-refresh" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Refresh Interval</label>
            <select
              id="pane-refresh"
              class="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white"
              value={wizard.refreshInterval}
              onchange={(event) => store.setWizardField('refreshInterval', event.currentTarget.value)}
            >
              <option value="off">Off</option>
              <option value="30s">Every 30s</option>
              <option value="5m">Every 5m</option>
            </select>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]">
    {#if stepIndex > 0}
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        onclick={() => store.wizardReturn()}
      >Back</button>
    {:else}
      <div></div>
    {/if}

    {#if wizard.step !== 'configure'}
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={handleAdvance}
      >Next</button>
    {:else}
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={handleSubmit}
      >Create Pane</button>
    {/if}
  </div>
</Modal>
