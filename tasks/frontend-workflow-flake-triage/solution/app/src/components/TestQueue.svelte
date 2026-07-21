<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import {
    IconAdjustmentsHorizontal,
    IconArrowDown,
    IconArrowUp,
    IconArrowsSort,
    IconRefresh,
    IconSearch,
    IconX,
  } from '@tabler/icons-svelte';
  import { triage } from '../lib/triage.svelte';
  import { reasonUpdateSchema } from '../lib/schemas';
  import { REASONS, VERDICTS, divergenceFor, verdictFor, type Reason, type Verdict } from '../lib/types';
  import RunMatrix from './RunMatrix.svelte';
  import VerdictChip from './VerdictChip.svelte';
  import ReasonSelect from './ReasonSelect.svelte';

  const filtersForm = createForm(() => ({
    defaultValues: {
      suite: triage.selectedSuiteId,
      verdict: '' as Verdict | '',
      reason: '' as Reason | '',
      search: '',
    },
  }));

  const reasonForm = createForm(() => ({
    defaultValues: { testId: '', reason: 'timing-sensitive' as Reason },
    validators: { onSubmit: reasonUpdateSchema },
    onSubmit: ({ value }) => {
      const parsed = reasonUpdateSchema.safeParse(value);
      if (parsed.success) triage.updateReason(parsed.data);
    },
  }));

  async function updateReason(testId: string, reason: Reason) {
    reasonForm.setFieldValue('testId', testId);
    reasonForm.setFieldValue('reason', reason);
    await reasonForm.handleSubmit();
  }

  function clearFilters() {
    triage.clearFilters();
    filtersForm.setFieldValue('verdict', '');
    filtersForm.setFieldValue('reason', '');
    filtersForm.setFieldValue('search', '');
  }
</script>

<section class="card-panel queue-panel" id="triage-queue" aria-labelledby="queue-title">
  <div class="queue-header">
    <div>
      <span class="eyebrow">Active worklist</span>
      <h2 class="panel-title" id="queue-title">Triage queue</h2>
    </div>
    <div class="result-legend" aria-label="Run result legend">
      <span><i class="pass-dot"></i>Pass</span>
      <span><i class="fail-dot"></i>Fail</span>
    </div>
  </div>

  <form class="filter-bar" aria-label="Queue filters" onsubmit={(event) => event.preventDefault()}>
    <filtersForm.Field name="suite">
      {#snippet children(field)}
        <label>
          <span>Suite</span>
          <select
            class="control suite-control"
            aria-label="Filter by suite"
            value={triage.selectedSuiteId}
            onchange={(event) => {
              const value = (event.currentTarget as HTMLSelectElement).value;
              field.handleChange(value);
              triage.selectSuite(value);
            }}
          >
            {#each triage.suites as suite}
              <option value={suite.id}>{suite.name}</option>
            {/each}
          </select>
        </label>
      {/snippet}
    </filtersForm.Field>
    <filtersForm.Field name="verdict">
      {#snippet children(field)}
        <label>
          <span>Verdict</span>
          <select
            class="control"
            aria-label="Filter by verdict"
            value={triage.filters.verdict}
            onchange={(event) => {
              const value = (event.currentTarget as HTMLSelectElement).value as Verdict | '';
              field.handleChange(value);
              triage.setVerdictFilter(value);
            }}
          >
            <option value="">All verdicts</option>
            {#each VERDICTS as verdict}
              <option value={verdict}>{verdict}</option>
            {/each}
          </select>
        </label>
      {/snippet}
    </filtersForm.Field>
    <filtersForm.Field name="reason">
      {#snippet children(field)}
        <label>
          <span>Reason</span>
          <select
            class="control"
            aria-label="Filter by reason"
            value={triage.filters.reason}
            onchange={(event) => {
              const value = (event.currentTarget as HTMLSelectElement).value as Reason | '';
              field.handleChange(value);
              triage.setReasonFilter(value);
            }}
          >
            <option value="">All reasons</option>
            {#each REASONS as reason}
              <option value={reason}>{reason}</option>
            {/each}
          </select>
        </label>
      {/snippet}
    </filtersForm.Field>
    <filtersForm.Field name="search">
      {#snippet children(field)}
        <label class="search-field">
          <span>Search tests</span>
          <span class="search-wrap">
            <IconSearch size={15} aria-hidden="true" />
            <input
              class="control"
              aria-label="Search test identifiers"
              value={triage.filters.search}
              oninput={(event) => {
                const value = (event.currentTarget as HTMLInputElement).value;
                field.handleChange(value);
                triage.setSearch(value);
              }}
            />
          </span>
        </label>
      {/snippet}
    </filtersForm.Field>
    <button class="action-btn clear-button" type="button" onclick={clearFilters} disabled={!triage.filters.verdict && !triage.filters.reason && !triage.filters.search}>
      <IconX size={14} /> Clear filters
    </button>
  </form>

  <div class="queue-meta">
    <span><IconAdjustmentsHorizontal size={15} /> Showing <strong>{triage.visibleTests.length}</strong> of {triage.activeSuite.tests.length} tests</span>
    <span class="suite-subtitle">{triage.activeSuite.subtitle}</span>
  </div>

  <div class="table-scroll">
    {#if triage.visibleTests.length === 0}
      <div class="empty-state" role="status">
        <div class="empty-icon"><IconAdjustmentsHorizontal size={20} /></div>
        <strong>No tests match these filters</strong>
        <span>Clear the active verdict, reason, or search filter to restore the full queue.</span>
        <button class="action-btn" type="button" onclick={clearFilters}>Clear filters</button>
      </div>
    {:else}
    <table class="triage-table">
      <thead>
        <tr>
          <th>Test identifier</th>
          <th>Five-run matrix</th>
          <th>Verdict</th>
          <th>Assigned reason</th>
          <th>
            <button class="sort-button" type="button" onclick={() => triage.toggleDivergenceSort()} aria-label={`Sort by divergence${triage.sortDirection === 'none' ? '' : ` ${triage.sortDirection}`}`}>
              Divergence
              {#if triage.sortDirection === 'desc'}
                <IconArrowDown size={14} />
              {:else if triage.sortDirection === 'asc'}
                <IconArrowUp size={14} />
              {:else}
                <IconArrowsSort size={14} />
              {/if}
            </button>
          </th>
          <th><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {#each triage.visibleTests as test (test.id)}
          <tr
            class:selected={triage.selectedTestId === test.id}
            tabindex="0"
            role="button"
            aria-pressed={triage.selectedTestId === test.id}
            aria-label={`Inspect ${test.id}`}
            onclick={() => triage.selectTest(test.id)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                triage.selectTest(test.id);
              }
            }}
          >
            <td data-label="Test identifier">
              <span class="test-id mono">{test.id}</span>
            </td>
            <td data-label="Five-run matrix"><RunMatrix runs={test.runs} /></td>
            <td data-label="Verdict"><VerdictChip verdict={verdictFor(test.runs)} /></td>
            <td data-label="Assigned reason"><ReasonSelect testId={test.id} reason={test.reason} onReasonChange={updateReason} /></td>
            <td data-label="Divergence"><span class="divergence-count mono">{divergenceFor(test.runs)} / 5</span></td>
            <td data-label="Action">
              <button
                class="rerun-button"
                type="button"
                onclick={(event) => {
                  event.stopPropagation();
                  triage.openRerun(test.id, event.currentTarget);
                }}
                aria-label={`Open re-run form for ${test.id}`}
              >
                <IconRefresh size={15} /> Re-run
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {/if}
  </div>
</section>

<style>
  .queue-panel { overflow: hidden; }
  .queue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 19px 20px 15px;
    border-bottom: 1px solid #e3e8e5;
  }
  .queue-header h2 { margin: 2px 0 0; }
  .result-legend {
    display: flex;
    align-items: center;
    gap: 13px;
    color: #64726c;
    font-size: 11px;
    font-weight: 700;
  }
  .result-legend span { display: inline-flex; align-items: center; gap: 5px; }
  .result-legend i { width: 10px; height: 10px; border-radius: 3px; }
  .pass-dot { border: 1px solid #8dceb8; background: #cfeadf; }
  .fail-dot { border: 1px solid #e9a4a6; background: #ffd9d7; }
  .filter-bar {
    display: grid;
    grid-template-columns: minmax(210px, 1.15fr) minmax(122px, .65fr) minmax(170px, .9fr) minmax(155px, .8fr) auto;
    align-items: end;
    gap: 9px;
    padding: 14px 20px;
    background: #f8faf8;
    border-bottom: 1px solid #e3e8e5;
  }
  label > span:first-child {
    display: block;
    margin: 0 0 5px 2px;
    color: #68766f;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .control { width: 100%; }
  .search-wrap { position: relative; display: block; }
  .search-wrap :global(svg) { position: absolute; z-index: 1; left: 10px; top: 11px; color: #84908b; }
  .search-wrap input { padding-left: 32px; }
  .clear-button { white-space: nowrap; }
  .queue-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 10px 20px;
    border-bottom: 1px solid #e3e8e5;
    color: #6d7a75;
    font-size: 11px;
  }
  .queue-meta span { display: inline-flex; align-items: center; gap: 6px; }
  .table-scroll { width: 100%; overflow-x: auto; contain: layout paint; }
  .triage-table { width: 100%; min-width: 940px; border-collapse: collapse; table-layout: auto; }
  th {
    height: 36px;
    padding: 0 12px;
    background: #fbfcfb;
    color: #6b7873;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .055em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }
  th:first-child, td:first-child { padding-left: 20px; }
  th:last-child, td:last-child { padding-right: 18px; }
  td {
    height: 58px;
    padding: 7px 12px;
    border-top: 1px solid #e7ebe8;
    vertical-align: middle;
  }
  tbody tr[role='button'] { cursor: pointer; transition: background-color 150ms ease, box-shadow 150ms ease; }
  tbody tr[role='button']:hover { background: #f2f8f5; }
  tbody tr.selected { background: #eaf5f1; box-shadow: inset 3px 0 0 #087f6d; }
  .test-id {
    display: block;
    max-width: 260px;
    overflow: hidden;
    color: #26332f;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .divergence-count { color: #65736d; font-size: 12px; white-space: nowrap; }
  .sort-button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 0;
    border-radius: 6px;
    padding: 5px 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 800;
    letter-spacing: inherit;
    text-transform: inherit;
  }
  .sort-button:hover { background: #e9efeb; color: #27352f; }
  .rerun-button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 0;
    border-radius: 8px;
    padding: 7px 8px;
    background: transparent;
    color: #087f6d;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }
  .rerun-button:hover { background: #dcefe8; }
  .empty-state {
    display: flex;
    width: min(100%, 420px);
    margin: 28px auto;
    align-items: center;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;
    color: #73807b;
    text-align: center;
    font-size: 13px;
    line-height: 1.45;
    box-sizing: border-box;
  }
  .empty-state span { max-width: 100%; overflow-wrap: anywhere; }
  .empty-state strong { color: #2b3834; font-size: 15px; }
  .empty-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; background: #e9f2ed; color: #087f6d; }
  :global(.dark) .queue-header,
  :global(.dark) .filter-bar,
  :global(.dark) .queue-meta,
  :global(.dark) td { border-color: #2e3c37; }
  :global(.dark) .filter-bar { background: #17211e; }
  :global(.dark) th { background: #1b2622; color: #9eaaa5; }
  :global(.dark) tbody tr[role='button']:hover { background: #202f2a; }
  :global(.dark) tbody tr.selected { background: #19342c; }
  :global(.dark) .test-id { color: #e4ebe7; }
  :global(.dark) .sort-button:hover { background: #2b3934; color: #eff4f1; }
  :global(.dark) .rerun-button:hover { background: #214038; }
  :global(.dark) .empty-state strong { color: #e7ece9; }
  @media (max-width: 1180px) {
    .filter-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .clear-button { align-self: end; }
  }
  @media (max-width: 768px) {
    .queue-header { align-items: flex-start; padding: 16px; }
    .result-legend { flex-direction: column; align-items: flex-start; gap: 4px; }
    .filter-bar { grid-template-columns: 1fr; padding: 12px 16px; }
    .queue-meta { align-items: flex-start; flex-direction: column; padding: 10px 16px; }
    .suite-subtitle { display: none !important; }
    .test-id, .divergence-count, .rerun-button { font-size: 12px; }
    .table-scroll { overflow-x: hidden; padding: 10px; box-sizing: border-box; }
    .triage-table, .triage-table tbody { display: block; width: 100%; min-width: 0; }
    .triage-table thead { display: none; }
    .triage-table tbody { display: grid; gap: 10px; }
    .triage-table tbody tr {
      display: grid;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      border: 1px solid #e0e7e3;
      border-radius: 12px;
      box-sizing: border-box;
    }
    .triage-table td {
      display: grid;
      width: 100%;
      min-width: 0;
      height: auto;
      min-height: 46px;
      grid-template-columns: minmax(92px, .42fr) minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      box-sizing: border-box;
      font-size: 12px;
    }
    .triage-table td:first-child,
    .triage-table td:last-child { padding-right: 12px; padding-left: 12px; }
    .triage-table td::before {
      content: attr(data-label);
      color: #6b7873;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .05em;
      text-transform: uppercase;
    }
    .triage-table td :global(select),
    .triage-table td .rerun-button { width: 100%; max-width: 100%; justify-content: center; box-sizing: border-box; }
    .triage-table td :global(select),
    .triage-table td .rerun-button { min-height: 38px; }
    :global(.dark) .triage-table tbody tr { border-color: #30403a; }
    :global(.dark) .triage-table td::before { color: #9eaaa5; }
  }
  @media (max-width: 420px) {
    .empty-state {
      width: 100%;
      margin: 20px auto;
      padding: 0 12px;
      font-size: 12px;
    }
    .empty-state strong { font-size: 14px; }
    .empty-state span { hyphens: auto; overflow-wrap: break-word; word-break: break-word; }
    .test-id { font-size: 12px; max-width: 100%; white-space: normal; }
    th, td { font-size: 12px; }
  }
</style>
