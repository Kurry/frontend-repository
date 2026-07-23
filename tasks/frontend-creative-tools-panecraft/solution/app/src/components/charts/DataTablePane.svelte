<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';

  let { pane }: { pane: Pane } = $props();

  const ds = $derived(getDataSourceById(pane.source));
  const dateRange = $derived(store.getDateRange());

  const filteredRows = $derived(ds ? store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange) : []);
  const displayRows = $derived(filteredRows.slice(0, 20));
  const columns = $derived(ds?.columns || []);

  function getStatusBadge(status: string): string {
    if (status === 'Resolved') return 'bg-[#1ABF68] text-white';
    if (status === 'Open') return 'bg-[#E8536B] text-white';
    if (status === 'In Progress') return 'bg-[#F59E0B] text-white';
    return 'bg-gray-200 text-gray-700';
  }
</script>

{#if !ds || filteredRows.length === 0}
  <div class="flex flex-col items-center justify-center h-full gap-1 text-center">
    <p class="text-sm text-[var(--color-text-secondary)]">No data for this range</p>
    <p class="text-xs text-[var(--color-text-secondary)]">Widen the date range to bring rows back.</p>
  </div>
{:else}
  <div class="overflow-auto max-h-full chart-layer">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          {#each columns as col}
            <th class="px-2 py-1.5 text-left text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] whitespace-nowrap sticky top-0 bg-[var(--color-surface)]">
              {col}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each displayRows as row}
          <tr class="transition-colors hover:bg-white">
            {#each columns as col}
              {#if col === 'status' && typeof row[col] === 'string'}
                <td class="px-2 py-1 text-sm font-normal text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                  <span class="inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold {getStatusBadge(String(row[col]))}">{row[col]}</span>
                </td>
              {:else}
                <td class="px-2 py-1 text-sm font-normal text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                  {String(row[col] ?? '-')}
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if filteredRows.length > 20}
      <div class="text-xs text-[var(--color-text-secondary)] px-2 py-1.5">Showing 20 of {filteredRows.length} rows</div>
    {/if}
  </div>
{/if}
