<script lang="ts">
  import * as store from '../lib/store';
  import { dataSources, getDataSourceById, metricsFor } from '../data/mockData';
  import Modal from './Modal.svelte';

  type ViewMode = 'overview' | 'table';
  type SortMode = 'recent' | 'name-asc' | 'name-desc';

  let name = $state('');
  let sourceId = $state('website-analytics');
  let metric = $state('pageViews');
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let viewMode = $state<ViewMode>('overview');
  let search = $state('');
  let sourceFilter = $state('all');
  let sortMode = $state<SortMode>('recent');
  let fieldErrors = $state<Record<string, string>>({});
  let feedback = $state('Ready.');

  const analyses = $derived(store.getSavedAnalyses());
  const availableMetrics = $derived(metricsFor(sourceId));
  const selectedAnalysis = $derived(analyses.find((item) => item.id === selectedId) ?? null);
  const deletingAnalysis = $derived(analyses.find((item) => item.id === deletingId) ?? null);

  const filteredAnalyses = $derived.by(() => {
    const needle = search.trim().toLowerCase();
    const filtered = analyses.filter((item) => {
      const source = getDataSourceById(item.source);
      const matchesSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        (source?.name.toLowerCase().includes(needle) ?? false) ||
        item.metric.toLowerCase().includes(needle);
      return matchesSearch && (sourceFilter === 'all' || item.source === sourceFilter);
    });
    return [...filtered].sort((left, right) => {
      if (sortMode === 'name-asc') return left.name.localeCompare(right.name);
      if (sortMode === 'name-desc') return right.name.localeCompare(left.name);
      return right.updatedAt - left.updatedAt;
    });
  });

  $effect(() => {
    if (!availableMetrics.includes(metric)) {
      metric = availableMetrics[0] ?? '';
    }
  });

  function resetForm() {
    editingId = null;
    name = '';
    sourceId = 'website-analytics';
    metric = 'pageViews';
    fieldErrors = {};
  }

  function saveAnalysis() {
    fieldErrors = {};
    const candidate = { name, source: sourceId, metric };
    const excludeId = editingId ?? undefined;
    const check = store.validateSavedAnalysis(candidate, excludeId);
    if (!check.ok) {
      fieldErrors = { [check.field]: check.message };
      feedback = `Not saved — ${check.message}`;
      store.announce(feedback);
      return;
    }
    if (editingId) {
      const result = store.updateSavedAnalysis(editingId, candidate);
      if (!result.ok) {
        fieldErrors = { [result.field]: result.message };
        feedback = `Not saved — ${result.message}`;
        return;
      }
      feedback = `Updated ${candidate.name.trim()}.`;
    } else {
      const result = store.createSavedAnalysis(candidate);
      if (!result.ok) {
        fieldErrors = { [result.field]: result.message };
        feedback = `Not saved — ${result.message}`;
        return;
      }
      selectedId = result.id ?? null;
      feedback = `Created ${candidate.name.trim()}.`;
    }
    store.announce(feedback);
    resetForm();
  }

  function editAnalysis(item: { id: string; name: string; source: string; metric: string }) {
    editingId = item.id;
    name = item.name;
    sourceId = item.source;
    metric = item.metric;
    fieldErrors = {};
    feedback = `Editing ${item.name}.`;
  }

  function deleteAnalysis() {
    if (!deletingId) return;
    const target = analyses.find((item) => item.id === deletingId);
    store.deleteSavedAnalysis(deletingId);
    if (selectedId === deletingId) selectedId = null;
    if (editingId === deletingId) resetForm();
    deletingId = null;
    feedback = `Deleted ${target?.name ?? 'analysis'}.`;
    store.announce(feedback);
  }

  function clearControls() {
    search = '';
    sourceFilter = 'all';
    sortMode = 'recent';
    selectedId = null;
    feedback = 'Search, filters, sorting, and selection cleared.';
    store.announce(feedback);
  }

  function sourceName(id: string): string {
    return getDataSourceById(id)?.name ?? 'Unknown source';
  }

  function fieldError(field: string): string {
    return fieldErrors[field] ?? '';
  }

  function toggleNameSort() {
    sortMode = sortMode === 'name-asc' ? 'name-desc' : 'name-asc';
  }
</script>

<section aria-labelledby="analysis-heading">
  <div class="max-w-7xl mx-auto mt-6 p-5 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-[var(--color-surface)]">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--color-primary);">Saved analysis collection</p>
        <h2 id="analysis-heading" class="text-[22px] font-semibold text-[var(--color-text-primary)]">Analysis workspace</h2>
        <p class="text-[13px] text-[var(--color-text-secondary)]">Create reusable dataset views, then search, sort, select, and inspect them.</p>
      </div>
      <div class="flex" role="group" aria-label="Analysis view">
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-l-[var(--radius-base)] transition-colors {viewMode === 'overview' ? 'bg-[var(--color-primary)] text-white font-semibold' : 'bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'}"
          aria-pressed={viewMode === 'overview'}
          onclick={() => (viewMode = 'overview')}
        >Overview</button>
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-r-[var(--radius-base)] transition-colors {viewMode === 'table' ? 'bg-[var(--color-primary)] text-white font-semibold' : 'bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'}"
          aria-pressed={viewMode === 'table'}
          onclick={() => (viewMode = 'table')}
        >Table</button>
      </div>
    </div>

    <div class="mt-4 p-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
      <div>
        <label for="analysis-name" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Analysis name</label>
        <input
          id="analysis-name"
          type="text"
          maxlength="80"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] {fieldError('name') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          placeholder="Quarterly revenue"
          bind:value={name}
        />
        <div aria-live="polite">
          {#if fieldError('name')}<p class="field-error" role="alert">{fieldError('name')}</p>{/if}
        </div>
      </div>
      <div>
        <label for="analysis-source" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Data source</label>
        <select
          id="analysis-source"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('source') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          bind:value={sourceId}
        >
          {#each dataSources as source}
            <option value={source.id}>{source.name}</option>
          {/each}
        </select>
        <div aria-live="polite">
          {#if fieldError('source')}<p class="field-error" role="alert">{fieldError('source')}</p>{/if}
        </div>
      </div>
      <div>
        <label for="analysis-metric" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Metric</label>
        <select
          id="analysis-metric"
          class="w-full px-3 py-2 text-sm border rounded-[var(--radius-base)] bg-white {fieldError('metric') ? 'input-invalid' : 'border-[var(--color-border)]'}"
          bind:value={metric}
        >
          {#each availableMetrics as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
        <div aria-live="polite">
          {#if fieldError('metric')}<p class="field-error" role="alert">{fieldError('metric')}</p>{/if}
        </div>
      </div>
      <div class="flex gap-2 items-end flex-wrap sm:justify-end">
        <button
          type="button"
          class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
          onclick={saveAnalysis}
        >
          {editingId ? 'Save analysis changes' : 'Create analysis'}
        </button>
        {#if editingId}
          <button
            type="button"
            class="tap-target px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
            onclick={resetForm}
          >Cancel edit</button>
        {/if}
      </div>
    </div>

    <p class="text-xs text-[var(--color-text-secondary)] mt-3 min-h-[18px]" aria-live="polite">{feedback} · {analyses.length} saved</p>

    <div class="flex flex-wrap gap-3 items-end my-4">
      <div>
        <label for="analysis-search" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Search analyses</label>
        <input id="analysis-search" type="search" class="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white min-w-[200px]" placeholder="Name, source, or metric" bind:value={search} />
      </div>
      <div>
        <label for="analysis-source-filter" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Source filter</label>
        <select id="analysis-source-filter" class="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={sourceFilter}>
          <option value="all">All sources</option>
          {#each dataSources as source}
            <option value={source.id}>{source.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="analysis-sort" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Sort analyses</label>
        <select id="analysis-sort" class="px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white" bind:value={sortMode}>
          <option value="recent">Recently updated</option>
          <option value="name-asc">Name A–Z (ascending)</option>
          <option value="name-desc">Name Z–A (descending)</option>
        </select>
      </div>
      <button
        type="button"
        class="tap-target px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-colors"
        onclick={clearControls}
      >Clear controls</button>
    </div>

    {#if viewMode === 'overview'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Saved analyses">
          {#each filteredAnalyses as item}
            <article class="p-3 bg-white border rounded-[var(--radius-base)] transition-shadow {selectedId === item.id ? 'border-[var(--color-primary)] shadow-[inset_3px_0_0_var(--color-primary)]' : 'border-[var(--color-border)] hover:shadow-md'}">
              <button
                type="button"
                class="w-full text-left p-1 rounded"
                onclick={() => (selectedId = item.id)}
                aria-pressed={selectedId === item.id}
              >
                <span class="block text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</span>
                <small class="block text-xs text-[var(--color-text-secondary)]">{sourceName(item.source)} · {item.metric}</small>
              </button>
              <div class="flex gap-2 mt-2">
                <button type="button" class="tap-target-x text-xs px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-colors" onclick={() => editAnalysis(item)}>Edit</button>
                <button type="button" class="tap-target-x text-xs px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-colors" onclick={() => (deletingId = item.id)}>Delete</button>
              </div>
            </article>
          {:else}
            <p class="text-sm text-[var(--color-text-secondary)]">No saved analyses match the active controls.</p>
          {/each}
        </div>
        <aside class="p-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-base)]" aria-label="Analysis detail">
          <h3 class="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">Analysis detail</h3>
          {#if selectedAnalysis}
            <strong class="block text-sm text-[var(--color-text-primary)] mb-2">{selectedAnalysis.name}</strong>
            <dl class="text-sm">
              <div class="flex justify-between gap-3 py-2 border-b border-[var(--color-border)]">
                <dt class="text-xs font-semibold text-[var(--color-text-primary)]">Source</dt>
                <dd class="text-xs text-[var(--color-text-secondary)]">{sourceName(selectedAnalysis.source)}</dd>
              </div>
              <div class="flex justify-between gap-3 py-2 border-b border-[var(--color-border)]">
                <dt class="text-xs font-semibold text-[var(--color-text-primary)]">Metric</dt>
                <dd class="text-xs text-[var(--color-text-secondary)]">{selectedAnalysis.metric}</dd>
              </div>
              <div class="flex justify-between gap-3 py-2">
                <dt class="text-xs font-semibold text-[var(--color-text-primary)]">Rows</dt>
                <dd class="text-xs text-[var(--color-text-secondary)]">{getDataSourceById(selectedAnalysis.source)?.rows.length ?? 0}</dd>
              </div>
            </dl>
          {:else}
            <p class="text-[13px] text-[var(--color-text-secondary)]">Select an analysis to drill down.</p>
          {/if}
        </aside>
      </div>
    {:else}
      <div class="overflow-x-auto border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white">
        <table class="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">
                <button
                  type="button"
                  class="font-semibold hover:text-[var(--color-primary)] transition-colors"
                  onclick={toggleNameSort}
                  aria-label="Sort by name {sortMode === 'name-desc' ? 'ascending' : 'descending'}"
                >
                  Name {sortMode === 'name-asc' ? '▲' : sortMode === 'name-desc' ? '▼' : ''}
                </button>
              </th>
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">Source</th>
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">Metric</th>
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">Rows</th>
              <th class="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredAnalyses as item}
              <tr class="transition-colors hover:bg-[var(--color-surface)] cursor-pointer {selectedId === item.id ? 'shadow-[inset_3px_0_0_var(--color-primary)]' : ''}" onclick={() => (selectedId = item.id)}>
                <td class="px-3 py-2 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{item.name}</td>
                <td class="px-3 py-2 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{sourceName(item.source)}</td>
                <td class="px-3 py-2 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{item.metric}</td>
                <td class="px-3 py-2 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{getDataSourceById(item.source)?.rows.length ?? 0}</td>
                <td class="px-3 py-2 border-b border-[var(--color-border)]">
                  <button type="button" class="tap-target-x text-xs px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-colors" onclick={(event) => { event.stopPropagation(); editAnalysis(item); }}>Edit</button>
                  <button type="button" class="tap-target-x ml-1 text-xs px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-base)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-colors" onclick={(event) => { event.stopPropagation(); deletingId = item.id; }}>Delete</button>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="px-3 py-4 text-sm text-center text-[var(--color-text-secondary)]">No saved analyses match the active controls.</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</section>

<Modal
  open={deletingId !== null}
  heading="Delete saved analysis?"
  labelledBy="delete-analysis-title"
  widthClass="max-w-sm"
  onClose={() => (deletingId = null)}
>
  <div class="p-6">
    <p class="text-sm text-[var(--color-text-secondary)] mb-4">
      This removes “{deletingAnalysis?.name ?? 'this analysis'}” from the collection. The bundled source data and your dashboard panes will not be changed.
    </p>
    <div class="flex gap-2 justify-end">
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        onclick={() => (deletingId = null)}
      >Cancel</button>
      <button
        type="button"
        class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={deleteAnalysis}
      >Delete analysis</button>
    </div>
  </div>
</Modal>
