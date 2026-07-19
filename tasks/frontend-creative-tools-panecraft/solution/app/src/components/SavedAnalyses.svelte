<script lang="ts">
  import { dataSources, getDataSourceById } from '../data/mockData';

  type Analysis = {
    id: string;
    name: string;
    sourceId: string;
    metric: string;
    updatedAt: number;
  };

  type ViewMode = 'overview' | 'table';
  type SortMode = 'recent' | 'name';

  const STORAGE_KEY = 'panecraft-saved-analyses';

  function loadAnalyses(): Analysis[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Bundled defaults remain available when storage is unavailable.
    }
    return [{
      id: 'analysis-website-pulse',
      name: 'Website pulse',
      sourceId: 'website-analytics',
      metric: 'sessions',
      updatedAt: Date.now(),
    }];
  }

  let analyses = $state<Analysis[]>(loadAnalyses());
  let name = $state('');
  let sourceId = $state('website-analytics');
  let metric = $state('pageViews');
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let selectedId = $state<string | null>(analyses[0]?.id ?? null);
  let viewMode = $state<ViewMode>('overview');
  let search = $state('');
  let sourceFilter = $state('all');
  let sortMode = $state<SortMode>('recent');
  let feedback = $state('Ready');

  const selectedSource = $derived(getDataSourceById(sourceId));
  const availableMetrics = $derived(selectedSource?.numericColumns ?? []);
  const selectedAnalysis = $derived(analyses.find((item) => item.id === selectedId) ?? null);
  const filteredAnalyses = $derived.by(() => {
    const needle = search.trim().toLowerCase();
    const filtered = analyses.filter((item) => {
      const source = getDataSourceById(item.sourceId);
      const matchesSearch = !needle
        || item.name.toLowerCase().includes(needle)
        || source?.name.toLowerCase().includes(needle)
        || item.metric.toLowerCase().includes(needle);
      return matchesSearch && (sourceFilter === 'all' || item.sourceId === sourceFilter);
    });
    return [...filtered].sort((left, right) => sortMode === 'name'
      ? left.name.localeCompare(right.name)
      : right.updatedAt - left.updatedAt);
  });

  $effect(() => {
    if (selectedSource && !selectedSource.numericColumns.includes(metric)) {
      metric = selectedSource.numericColumns[0] ?? '';
    }
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    } catch {
      feedback = 'Saved for this session; browser storage is unavailable.';
    }
  }

  function resetForm() {
    editingId = null;
    name = '';
    sourceId = 'website-analytics';
    metric = 'pageViews';
  }

  function saveAnalysis() {
    const cleanName = name.trim();
    if (!cleanName) {
      feedback = 'Enter an analysis name before saving.';
      return;
    }
    if (cleanName.length > 50) {
      feedback = 'Use an analysis name with 50 characters or fewer.';
      return;
    }
    if (!metric) {
      feedback = 'Choose a metric before saving.';
      return;
    }
    const duplicate = analyses.find((item) =>
      item.name.toLowerCase() === cleanName.toLowerCase() && item.id !== editingId);
    if (duplicate) {
      selectedId = duplicate.id;
      feedback = `"${cleanName}" already exists. No duplicate was created.`;
      return;
    }

    if (editingId) {
      const existing = analyses.find((item) => item.id === editingId);
      if (!existing) {
        feedback = 'That analysis no longer exists. Choose another analysis.';
        resetForm();
        return;
      }
      existing.name = cleanName;
      existing.sourceId = sourceId;
      existing.metric = metric;
      existing.updatedAt = Date.now();
      selectedId = existing.id;
      feedback = `Updated ${cleanName}.`;
    } else {
      const created: Analysis = {
        id: `analysis-${Date.now()}-${analyses.length + 1}`,
        name: cleanName,
        sourceId,
        metric,
        updatedAt: Date.now(),
      };
      analyses.push(created);
      selectedId = created.id;
      feedback = `Created ${cleanName}.`;
    }
    persist();
    resetForm();
  }

  function editAnalysis(item: Analysis) {
    editingId = item.id;
    name = item.name;
    sourceId = item.sourceId;
    metric = item.metric;
    feedback = `Editing ${item.name}.`;
  }

  function deleteAnalysis() {
    if (!deletingId) return;
    const index = analyses.findIndex((item) => item.id === deletingId);
    if (index < 0) {
      deletingId = null;
      return;
    }
    const [deleted] = analyses.splice(index, 1);
    if (selectedId === deleted?.id) selectedId = analyses[0]?.id ?? null;
    if (editingId === deleted?.id) resetForm();
    deletingId = null;
    persist();
    feedback = `Deleted ${deleted?.name ?? 'analysis'}.`;
  }

  function clearControls() {
    search = '';
    sourceFilter = 'all';
    sortMode = 'recent';
    selectedId = null;
    feedback = 'Search, filters, sorting, and selection cleared.';
  }

  function sourceName(id: string): string {
    return getDataSourceById(id)?.name ?? 'Unknown source';
  }
</script>

<section class="analysis-workspace" aria-labelledby="analysis-heading">
  <div class="analysis-heading">
    <div>
      <p class="eyebrow">Saved analysis collection</p>
      <h2 id="analysis-heading">Analysis workspace</h2>
      <p>Create reusable dataset views, then search, sort, select, and inspect them.</p>
    </div>
    <div class="view-switcher" aria-label="Analysis view">
      <button class:active={viewMode === 'overview'} onclick={() => viewMode = 'overview'}>Overview</button>
      <button class:active={viewMode === 'table'} onclick={() => viewMode = 'table'}>Table</button>
    </div>
  </div>

  <div class="analysis-form">
    <label>
      Analysis name
      <input maxlength="80" bind:value={name} placeholder="Quarterly revenue" />
    </label>
    <label>
      Data source
      <select bind:value={sourceId}>
        {#each dataSources as source}
          <option value={source.id}>{source.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Metric
      <select bind:value={metric}>
        {#each availableMetrics as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <div class="form-actions">
      <button class="primary-action" onclick={saveAnalysis}>
        {editingId ? 'Save analysis changes' : 'Create analysis'}
      </button>
      {#if editingId}
        <button onclick={resetForm}>Cancel edit</button>
      {/if}
    </div>
  </div>

  <p class="feedback" aria-live="polite">{feedback} · {analyses.length} saved</p>

  <div class="analysis-controls">
    <label>
      Search analyses
      <input type="search" bind:value={search} placeholder="Name, source, or metric" />
    </label>
    <label>
      Source filter
      <select bind:value={sourceFilter}>
        <option value="all">All sources</option>
        {#each dataSources as source}
          <option value={source.id}>{source.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Sort analyses
      <select bind:value={sortMode}>
        <option value="recent">Recently updated</option>
        <option value="name">Name A–Z</option>
      </select>
    </label>
    <button onclick={clearControls}>Clear controls</button>
  </div>

  {#if viewMode === 'overview'}
    <div class="analysis-overview">
      <div class="analysis-cards" aria-label="Saved analyses">
        {#each filteredAnalyses as item}
          <article class:selected={selectedId === item.id}>
            <button class="select-analysis" onclick={() => selectedId = item.id}>
              <span>{item.name}</span>
              <small>{sourceName(item.sourceId)} · {item.metric}</small>
            </button>
            <div class="card-actions">
              <button onclick={() => editAnalysis(item)}>Edit</button>
              <button onclick={() => deletingId = item.id}>Delete</button>
            </div>
          </article>
        {:else}
          <p class="empty-result">No saved analyses match the active controls.</p>
        {/each}
      </div>
      <aside aria-label="Analysis detail">
        <h3>Analysis detail</h3>
        {#if selectedAnalysis}
          <strong>{selectedAnalysis.name}</strong>
          <dl>
            <div><dt>Source</dt><dd>{sourceName(selectedAnalysis.sourceId)}</dd></div>
            <div><dt>Metric</dt><dd>{selectedAnalysis.metric}</dd></div>
            <div><dt>Rows</dt><dd>{getDataSourceById(selectedAnalysis.sourceId)?.rows.length ?? 0}</dd></div>
          </dl>
        {:else}
          <p>Select an analysis to drill down.</p>
        {/if}
      </aside>
    </div>
  {:else}
    <div class="analysis-table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Source</th><th>Metric</th><th>Rows</th><th>Actions</th></tr></thead>
        <tbody>
          {#each filteredAnalyses as item}
            <tr class:selected={selectedId === item.id} onclick={() => selectedId = item.id}>
              <td>{item.name}</td>
              <td>{sourceName(item.sourceId)}</td>
              <td>{item.metric}</td>
              <td>{getDataSourceById(item.sourceId)?.rows.length ?? 0}</td>
              <td>
                <button onclick={(event) => { event.stopPropagation(); editAnalysis(item); }}>Edit</button>
                <button onclick={(event) => { event.stopPropagation(); deletingId = item.id; }}>Delete</button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="5">No saved analyses match the active controls.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

{#if deletingId}
  <div class="confirm-backdrop" role="presentation" onclick={() => deletingId = null}>
    <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-analysis-title" onclick={(event) => event.stopPropagation()}>
      <h3 id="delete-analysis-title">Delete saved analysis?</h3>
      <p>The bundled source data and your dashboard panes will not be changed.</p>
      <div>
        <button onclick={() => deletingId = null}>Cancel</button>
        <button class="primary-action" onclick={deleteAnalysis}>Delete analysis</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .analysis-workspace {
    max-width: 80rem;
    margin: 1rem auto 3rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: linear-gradient(135deg, #fff 0%, var(--color-surface) 100%);
    color: var(--color-text-primary);
  }
  .analysis-heading, .analysis-controls, .analysis-form, .analysis-overview {
    display: flex;
    gap: 1rem;
  }
  .analysis-heading { justify-content: space-between; align-items: flex-start; }
  .analysis-heading h2 { margin: 0; font-size: 22px; }
  .analysis-heading p { margin: .25rem 0 0; color: var(--color-text-secondary); font-size: 13px; }
  .eyebrow { color: var(--color-primary) !important; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; font-size: 10px !important; }
  button, input, select {
    min-height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: #fff;
    color: var(--color-text-primary);
    padding: .45rem .65rem;
  }
  button { cursor: pointer; }
  button:hover { border-color: var(--color-primary); }
  .primary-action, .view-switcher button.active { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
  .view-switcher { display: flex; }
  .view-switcher button:first-child { border-radius: var(--radius-base) 0 0 var(--radius-base); }
  .view-switcher button:last-child { border-radius: 0 var(--radius-base) var(--radius-base) 0; }
  .analysis-form {
    margin-top: 1rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    align-items: end;
    flex-wrap: wrap;
  }
  label { display: grid; gap: .3rem; color: var(--color-text-secondary); font-size: 12px; flex: 1 1 150px; }
  .form-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
  .feedback { color: var(--color-text-secondary); font-size: 12px; min-height: 18px; }
  .analysis-controls { align-items: end; flex-wrap: wrap; margin: 1rem 0; }
  .analysis-controls button { align-self: end; }
  .analysis-overview { align-items: stretch; }
  .analysis-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; flex: 2; }
  article {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: #fff;
    padding: .65rem;
  }
  article.selected, tr.selected { box-shadow: inset 3px 0 var(--color-primary); }
  .select-analysis { width: 100%; text-align: left; border: 0; padding: .25rem; display: grid; gap: .2rem; }
  .select-analysis span { font-weight: 600; }
  .select-analysis small { color: var(--color-text-secondary); }
  .card-actions { display: flex; gap: .4rem; margin-top: .5rem; }
  aside { flex: 1; min-width: 220px; border: 1px solid var(--color-border); border-radius: var(--radius-base); background: #fff; padding: 1rem; }
  aside h3 { margin: 0 0 .75rem; font-size: 15px; }
  aside p, dd { color: var(--color-text-secondary); font-size: 13px; }
  dl div { display: flex; justify-content: space-between; gap: 1rem; padding: .4rem 0; border-bottom: 1px solid var(--color-border); }
  dt { font-size: 12px; font-weight: 600; }
  dd { margin: 0; text-align: right; }
  .analysis-table-wrap { overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-base); }
  table { width: 100%; border-collapse: collapse; background: #fff; }
  th, td { padding: .65rem; text-align: left; border-bottom: 1px solid var(--color-border); font-size: 12px; }
  th { color: var(--color-text-primary); }
  td { color: var(--color-text-secondary); }
  td button { min-height: 30px; padding: .25rem .5rem; margin-right: .25rem; }
  .empty-result { color: var(--color-text-secondary); font-size: 13px; }
  .confirm-backdrop { position: fixed; inset: 0; z-index: 70; background: #05144199; display: grid; place-items: center; padding: 1rem; }
  .confirm-dialog { width: min(390px, 100%); background: #fff; border-radius: var(--radius-base); padding: 1.25rem; }
  .confirm-dialog h3 { margin-top: 0; }
  .confirm-dialog p { color: var(--color-text-secondary); font-size: 13px; }
  .confirm-dialog > div { display: flex; justify-content: flex-end; gap: .5rem; }
  @media (max-width: 700px) {
    .analysis-heading, .analysis-overview { flex-direction: column; }
    .analysis-cards { grid-template-columns: 1fr; width: 100%; }
    aside { width: 100%; min-width: 0; box-sizing: border-box; }
    .analysis-form > label, .analysis-controls > label { flex-basis: 100%; }
  }
</style>
