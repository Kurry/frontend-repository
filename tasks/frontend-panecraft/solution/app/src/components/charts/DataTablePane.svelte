<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';

  let { pane }: { pane: Pane } = $props();
  
  const ds = $derived(getDataSourceById(pane.dataSourceId));
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

{#if filteredRows.length === 0}
  <div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>
{:else}
  <div class="overflow-auto max-h-full">
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
          <tr class="hover:bg-white/50">
            {#each columns as col}
              {#if col === 'status' && typeof row[col] === 'string'}
                <td class="px-2 py-1 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                  <span class="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium {getStatusBadge(row[col])}">{row[col]}</span>
                </td>
              {:else}
                <td class="px-2 py-1 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">
                  {row[col] ?? '-'}
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if filteredRows.length > 20}
      <div class="text-[10px] text-[var(--color-text-secondary)] px-2 py-1.5">Showing 20 of {filteredRows.length} rows</div>
    {/if}
  </div>
{/if}
