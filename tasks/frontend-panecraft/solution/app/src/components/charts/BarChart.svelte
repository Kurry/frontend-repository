<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';

  let { pane }: { pane: Pane } = $props();
  
  const ds = $derived(getDataSourceById(pane.dataSourceId));
  const dateRange = $derived(store.getDateRange());
  
  const filteredRows = $derived(ds ? store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange) : []);
  
  const chartData = $derived.by(() => {
    if (!ds || filteredRows.length === 0) return null;
    
    const metric = pane.metric;
    const dimension = pane.dimension || ds.categoryColumn || 'category';
    
    const groups = new Map<string, number>();
    for (const row of filteredRows) {
      const key = String(row[dimension] ?? 'N/A');
      groups.set(key, (groups.get(key) || 0) + Number(row[metric] ?? 0));
    }
    
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const values = sorted.map(e => store.applyJitter(e[1], pane.refreshTick));
    const maxVal = Math.max(...values, 1);
    
    const width = 300;
    const height = 130;
    const padding = { top: 10, right: 10, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barGap = chartW / sorted.length;
    const barWidth = Math.min(barGap * 0.65, 36);
    
    const bars = sorted.map((entry, i) => {
      const val = store.applyJitter(entry[1], pane.refreshTick);
      const barH = (val / maxVal) * chartH;
      const x = padding.left + i * barGap + (barGap - barWidth) / 2;
      const y = padding.top + chartH - barH;
      return { x, y, barH, barWidth, val, label: entry[0] };
    });
    
    return { sorted, values, maxVal, bars, padding, chartW, chartH, width, height };
  });
  
  const colors = ['#E8536B', '#051441', '#1ABF68', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];
</script>

{#if !chartData}
  <div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>
{:else}
  <svg viewBox="0 0 {chartData.width} {chartData.height}" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <line x1={chartData.padding.left} y1={chartData.padding.top} x2={chartData.padding.left} y2={chartData.padding.top + chartData.chartH} stroke="#E3E6F0" stroke-width="1"/>
    <line x1={chartData.padding.left} y1={chartData.padding.top + chartData.chartH} x2={chartData.padding.left + chartData.chartW} y2={chartData.padding.top + chartData.chartH} stroke="#E3E6F0" stroke-width="1"/>
    
    {#each chartData.bars as bar, i}
      <rect x={bar.x} y={bar.y} width={bar.barWidth} height={bar.barH} rx="2" fill={colors[i % colors.length]}>
        <title>{bar.label}: {Math.round(bar.val)}</title>
      </rect>
      <text x={bar.x + bar.barWidth / 2} y={chartData.padding.top + chartData.chartH + 12} text-anchor="middle" font-size="8" fill="#677294">{bar.label.substring(0, 8)}</text>
      <text x={bar.x + bar.barWidth / 2} y={bar.y - 3} text-anchor="middle" font-size="7" fill="#677294">{Math.round(bar.val) > 0 ? Math.round(bar.val) : ''}</text>
    {/each}
    
    <text x={chartData.padding.left - 5} y={chartData.padding.top + 4} text-anchor="end" font-size="9" fill="#677294">{Math.round(chartData.maxVal)}</text>
  </svg>
{/if}
