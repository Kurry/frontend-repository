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
      groups.set(key, (groups.get(key) || 0) + (metric === '_count' ? 1 : Number(row[metric] ?? 0)));
    }
    
    const entries = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + store.applyJitter(e[1], pane.refreshTick), 0);
    
    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 50;
    const innerR = 28;
    
    const colors = ['#E8536B', '#051441', '#1ABF68', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];
    
    const segments: Array<{ path: string; color: string; label: string; value: number }> = [];
    let cumulativeAngle = -Math.PI / 2;
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const val = store.applyJitter(entry[1], pane.refreshTick);
      const fraction = total > 0 ? val / total : 1 / entries.length;
      const angle = fraction * 2 * Math.PI;
      
      const largeArc = angle > Math.PI ? 1 : 0;
      
      const x1 = cx + outerR * Math.cos(cumulativeAngle);
      const y1 = cy + outerR * Math.sin(cumulativeAngle);
      const x2 = cx + outerR * Math.cos(cumulativeAngle + angle);
      const y2 = cy + outerR * Math.sin(cumulativeAngle + angle);
      
      const ix1 = cx + innerR * Math.cos(cumulativeAngle);
      const iy1 = cy + innerR * Math.sin(cumulativeAngle);
      const ix2 = cx + innerR * Math.cos(cumulativeAngle + angle);
      const iy2 = cy + innerR * Math.sin(cumulativeAngle + angle);
      
      const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      
      segments.push({ path, color: colors[i % colors.length], label: entry[0], value: Math.round(val) });
      cumulativeAngle += angle;
    }
    
    const centerTotal = Math.round(total);
    const centerText = centerTotal > 999999 ? `${(centerTotal / 1000000).toFixed(1)}M` : centerTotal > 999 ? `${(centerTotal / 1000).toFixed(1)}K` : centerTotal.toString();
    
    return { segments, centerText, size, cx, cy };
  });
</script>

{#if !chartData}
  <div class="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">No data for this range</div>
{:else}
  <div class="flex items-center gap-3 flex-wrap">
    <svg viewBox="0 0 {chartData.size} {chartData.size}" class="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      {#each chartData.segments as seg}
        <path d={seg.path} fill={seg.color}>
          <title>{seg.label}: {seg.value}</title>
        </path>
      {/each}
      <text x={chartData.cx} y={chartData.cy} text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="700" fill="#051441">{chartData.centerText}</text>
    </svg>
    <div class="flex flex-col gap-1 text-xs min-w-0">
      {#each chartData.segments as seg}
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{seg.color}"></div>
          <span class="text-[var(--color-text-secondary)] truncate">{seg.label}</span>
        </div>
      {/each}
    </div>
  </div>
{/if}
