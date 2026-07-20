<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';
  import { formatValue, tweenNumber } from '../../lib/chartUtils';

  let { pane }: { pane: Pane } = $props();

  const ds = $derived(getDataSourceById(pane.source));
  const dateRange = $derived(store.getDateRange());

  const counterData = $derived.by(() => {
    if (!ds) return null;
    const rows = store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange);
    if (rows.length === 0) return null;

    const metric = pane.metric;
    let total = 0;
    let count = 0;

    if (metric === '_count') {
      total = rows.length;
      count = 1;
    } else {
      for (const row of rows) {
        const val = Number(row[metric]);
        if (!isNaN(val)) {
          total += val;
          count++;
        }
      }
    }

    const result = store.applyJitter(total, pane.refreshTick);
    const avg = count > 0 && metric !== '_count' ? store.applyJitter(total / count, pane.refreshTick) : 0;
    return { result, avg, rowCount: rows.length };
  });

  // Tween the displayed figure so recomputed values glide in place instead of
  // snapping (refresh ticks, date-range switches).
  let displayValue = $state(0);
  let pulseKey = $state(0);
  let previousTarget = Number.NaN;

  $effect(() => {
    const target = counterData?.result ?? 0;
    if (target === previousTarget) return;
    const from = Number.isFinite(previousTarget) ? previousTarget : target;
    previousTarget = target;
    if (from === target) {
      displayValue = target;
      return;
    }
    pulseKey += 1;
    const cancel = tweenNumber(from, target, 400, (value) => {
      displayValue = value;
    });
    return cancel;
  });
</script>

{#if !counterData}
  <div class="flex flex-col items-center justify-center h-full gap-1 text-center">
    <p class="text-sm text-[var(--color-text-secondary)]">No data for this range</p>
    <p class="text-xs text-[var(--color-text-secondary)]">Widen the date range to bring rows back.</p>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center h-full">
    {#key pulseKey}
      <div class="text-[30px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight {pulseKey > 0 ? 'value-updated' : ''}">
        {formatValue(displayValue)}
      </div>
    {/key}
    <div class="text-xs text-[var(--color-text-secondary)] mt-1">Total {pane.metric === '_count' ? 'rows' : pane.metric}</div>
    {#if counterData.rowCount > 0 && pane.metric !== '_count'}
      <div class="text-sm text-[var(--color-text-secondary)] mt-1">Avg: {formatValue(counterData.avg)}</div>
    {/if}
    <div class="text-[12px] text-[var(--color-text-secondary)] mt-0.5">from {counterData.rowCount} rows</div>
  </div>
{/if}
