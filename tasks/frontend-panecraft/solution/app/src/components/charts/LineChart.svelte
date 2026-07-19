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
    const dimension = pane.dimension || ds.dateColumn || 'date';
    
    const groups = new Map<string, number>();
    for (const row of filteredRows) {
      const key = String(row[dimension] ?? 'N/A');
      groups.set(key, (groups.get(key) || 0) + Number(row[metric] ?? 0));
    }
    
    const sorted = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const values = sorted.map(e => store.applyJitter(e[1], pane.refreshTick));
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    
    const width = 300;
    const height = 130;
    const padding = { top: 10, right: 10, bottom: 25, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    
    const points = sorted.map((entry, i) => {
      const x = padding.left + (i / Math.max(sorted.length - 1, 1)) * chartW;
      const y = padding.top + chartH - ((store.applyJitter(entry[1], pane.refreshTick) - minVal) / range) * chartH;
      return { x, y, label: entry[0], value: store.applyJitter(entry[1], pane.refreshTick) };
    });
    
    let pathD = '';
    let areaD = '';
    if (points.length >= 2) {
      pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      areaD = `M ${points[0].x} ${points[0].y} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length-1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;
    }
    
    return { sorted, values, maxVal, minVal, range, points, pathD, areaD, padding, chartW, chartH, width, height };
  });
</script>

{#if !chartData}
  <div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>
{:else}
  <svg viewBox="0 0 {chartData.width} {chartData.height}" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lg-{pane.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E8536B" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#E8536B" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    
    <line x1={chartData.padding.left} y1={chartData.padding.top} x2={chartData.padding.left} y2={chartData.padding.top + chartData.chartH} stroke="#E3E6F0" stroke-width="1"/>
    <line x1={chartData.padding.left} y1={chartData.padding.top + chartData.chartH} x2={chartData.padding.left + chartData.chartW} y2={chartData.padding.top + chartData.chartH} stroke="#E3E6F0" stroke-width="1"/>
    <line x1={chartData.padding.left} y1={chartData.padding.top} x2={chartData.padding.left + chartData.chartW} y2={chartData.padding.top} stroke="#E3E6F0" stroke-width="0.5" stroke-dasharray="3,3"/>
    <line x1={chartData.padding.left} y1={chartData.padding.top + chartData.chartH / 2} x2={chartData.padding.left + chartData.chartW} y2={chartData.padding.top + chartData.chartH / 2} stroke="#E3E6F0" stroke-width="0.5" stroke-dasharray="3,3"/>
    
    {#if chartData.areaD}
      <path d={chartData.areaD} fill="url(#lg-{pane.id})"/>
    {/if}
    
    {#if chartData.pathD}
      <path d={chartData.pathD} fill="none" stroke="#E8536B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    {/if}
    
    {#each chartData.points as p}
      <circle cx={p.x} cy={p.y} r="3" fill="#E8536B">
        <title>{p.label}: {Math.round(p.value)}</title>
      </circle>
    {/each}
    
    <text x={chartData.padding.left - 5} y={chartData.padding.top + 4} text-anchor="end" font-size="9" fill="#677294">{Math.round(chartData.maxVal)}</text>
    <text x={chartData.padding.left - 5} y={chartData.padding.top + chartData.chartH / 2 + 3} text-anchor="end" font-size="9" fill="#677294">{Math.round((chartData.maxVal + chartData.minVal) / 2)}</text>
    <text x={chartData.padding.left - 5} y={chartData.padding.top + chartData.chartH + 4} text-anchor="end" font-size="9" fill="#677294">{Math.round(chartData.minVal)}</text>
    
    {#if chartData.points.length > 0}
      <text x={chartData.points[0].x} y={chartData.padding.top + chartData.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{chartData.points[0].label.substring(5)}</text>
      {#if chartData.points.length > 4}
        <text x={chartData.points[Math.floor(chartData.points.length / 2)].x} y={chartData.padding.top + chartData.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{chartData.points[Math.floor(chartData.points.length / 2)].label.substring(5)}</text>
      {/if}
      <text x={chartData.points[chartData.points.length - 1].x} y={chartData.padding.top + chartData.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{chartData.points[chartData.points.length - 1].label.substring(5)}</text>
    {/if}
  </svg>
{/if}
