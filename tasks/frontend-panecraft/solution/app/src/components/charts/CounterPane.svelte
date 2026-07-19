<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';

  let { pane }: { pane: Pane } = $props();
  
  const ds = $derived(getDataSourceById(pane.dataSourceId));
  const dateRange = $derived(store.getDateRange());
  
  const filteredRows = $derived(ds ? store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange) : []);
  
  const counterData = $derived.by(() => {
    if (!ds || filteredRows.length === 0) return null;
    
    const metric = pane.metric;
    let total = 0;
    let count = 0;
    
    if (metric === '_count') {
      total = filteredRows.length;
      count = 1;
    } else {
      for (const row of filteredRows) {
        const val = Number(row[metric]);
        if (!isNaN(val)) {
          total += val;
          count++;
        }
      }
    }
    
    const result = store.applyJitter(total, pane.refreshTick);
    const avg = count > 0 ? store.applyJitter(total / count, pane.refreshTick) : 0;
    
    return { result, avg, rowCount: filteredRows.length };
  });
  
  function formatNumber(n: number): string {
    const rounded = Math.round(n);
    if (rounded > 999999) return `${(rounded / 1000000).toFixed(1)}M`;
    if (rounded > 999) return `${(rounded / 1000).toFixed(1)}K`;
    return rounded.toLocaleString();
  }
</script>

{#if !counterData}
  <div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>
{:else}
  <div class="flex flex-col items-center justify-center h-full">
    <div class="text-[30px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight">
      {formatNumber(counterData.result)}
    </div>
    <div class="text-xs text-[var(--color-text-secondary)] mt-1">Total {pane.metric === '_count' ? 'rows' : pane.metric}</div>
    {#if counterData.rowCount > 0 && pane.metric !== '_count'}
      <div class="text-sm text-[var(--color-text-secondary)] mt-1">Avg: {formatNumber(counterData.avg)}</div>
    {/if}
    <div class="text-xs text-[var(--color-text-secondary)] mt-0.5">from {counterData.rowCount} rows</div>
  </div>
{/if}
