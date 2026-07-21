<script lang="ts">
  import * as store from '../../lib/store';
  import { getDataSourceById } from '../../data/mockData';
  import type { Pane } from '../../lib/store';
  import { prefersReducedMotion, formatValue } from '../../lib/chartUtils';

  let { pane }: { pane: Pane } = $props();

  let containerEl = $state<HTMLDivElement | undefined>();
  let hover = $state<{ left: number; top: number; label: string; value: number } | null>(null);

  const ds = $derived(getDataSourceById(pane.source));
  const dateRange = $derived(store.getDateRange());

  interface LayerData {
    segments: { path: string; color: string; label: string; value: number }[];
    centerText: string;
    size: number;
    cx: number;
    cy: number;
    signature: string;
  }

  const colors = ['#E8536B', '#051441', '#1ABF68', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

  const chartData = $derived.by((): LayerData | null => {
    if (!ds) return null;
    const rows = store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange);
    if (rows.length === 0) return null;

    const metric = pane.metric;
    const dimension = pane.dimension || ds.categoryColumn || 'category';
    const isCount = metric === '_count';

    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[dimension] ?? 'N/A');
      groups.set(key, (groups.get(key) || 0) + (isCount ? 1 : Number(row[metric] ?? 0)));
    }

    const entries = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, entry) => sum + store.applyJitter(entry[1], pane.refreshTick), 0);

    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 50;
    const innerR = 28;

    const segments: { path: string; color: string; label: string; value: number }[] = [];
    let cumulativeAngle = -Math.PI / 2;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const val = store.applyJitter(entry[1], pane.refreshTick);
      const fraction = total > 0 ? val / total : 1 / entries.length;
      const angle = Math.max(fraction * 2 * Math.PI, 0.02);
      const largeArc = angle > Math.PI ? 1 : 0;

      const x1 = cx + outerR * Math.cos(cumulativeAngle);
      const y1 = cy + outerR * Math.sin(cumulativeAngle);
      const x2 = cx + outerR * Math.cos(cumulativeAngle + angle);
      const y2 = cy + outerR * Math.sin(cumulativeAngle + angle);
      const ix1 = cx + innerR * Math.cos(cumulativeAngle);
      const iy1 = cy + innerR * Math.sin(cumulativeAngle);
      const ix2 = cx + innerR * Math.cos(cumulativeAngle + angle);
      const iy2 = cy + innerR * Math.sin(cumulativeAngle + angle);

      segments.push({
        path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`,
        color: colors[i % colors.length]!,
        label: entry[0],
        value: Math.round(val),
      });
      cumulativeAngle += angle;
    }

    const centerTotal = Math.round(total);
    return {
      segments,
      centerText: formatValue(centerTotal),
      size,
      cx,
      cy,
      signature: `${dateRange}|${pane.source}|${metric}|${dimension}|${segments.map((s) => `${s.label}:${s.value}`).join(',')}`,
    };
  });

  let layers = $state<{ id: number; data: LayerData; exiting: boolean }[]>([]);
  let layerId = 0;
  let lastSignature = '';

  $effect(() => {
    const data = chartData;
    if (!data) {
      layers = [];
      lastSignature = '';
      return;
    }
    if (data.signature === lastSignature) return;
    lastSignature = data.signature;
    const entering = { id: ++layerId, data, exiting: false };
    const previous = layers.filter((layer) => !layer.exiting);
    if (previous.length === 0 || prefersReducedMotion()) {
      layers = [entering];
      return;
    }
    layers = [...previous.map((layer) => ({ ...layer, exiting: true })), entering];
    const previousIds = new Set(previous.map((layer) => layer.id));
    setTimeout(() => {
      layers = layers.filter((layer) => !previousIds.has(layer.id));
    }, 320);
  });

  function segmentHover(event: MouseEvent, label: string, value: number) {
    const container = containerEl?.getBoundingClientRect();
    const mark = (event.currentTarget as SVGElement).getBoundingClientRect();
    if (!container) return;
    hover = {
      left: mark.left + mark.width / 2 - container.left,
      top: mark.top - container.top,
      label,
      value,
    };
  }
</script>

{#if !chartData}
  <div class="flex flex-col items-center justify-center h-full gap-1 text-center">
    <p class="text-sm text-[var(--color-text-secondary)]">No data for this range</p>
    <p class="text-xs text-[var(--color-text-secondary)]">Widen the date range to bring rows back.</p>
  </div>
{:else}
  <div bind:this={containerEl} class="relative flex items-center gap-3 flex-wrap h-full" onmouseleave={() => (hover = null)}>
    {#each layers as layer (layer.id)}
      {@const d = layer.data}
      <div class="flex items-center gap-3 {layer.exiting ? 'chart-layer-exit absolute inset-0' : 'chart-layer'}" aria-hidden={layer.exiting}>
        <svg viewBox="0 0 {d.size} {d.size}" class="chart-svg w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{pane.title} donut chart">
          {#each d.segments as seg}
            <path
              d={seg.path}
              fill={seg.color}
              onmouseenter={(event) => segmentHover(event, seg.label, seg.value)}
            ></path>
          {/each}
          <text x={d.cx} y={d.cy} text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="700" fill="#051441">{d.centerText}</text>
        </svg>
        {#if !layer.exiting}
          <div class="flex flex-col gap-1 text-xs min-w-0">
            {#each d.segments as seg}
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{seg.color}"></div>
                <span class="text-[var(--color-text-secondary)] truncate">{seg.label}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if hover}
      <div
        class="absolute z-10 pointer-events-none px-2 py-1 rounded-[var(--radius-base)] bg-[var(--color-secondary)] text-white text-xs shadow-lg whitespace-nowrap"
        style="left:{hover.left}px; top:{hover.top}px; transform:translate(-50%, -130%);"
        role="status"
      >
        <span class="font-semibold">{hover.label}</span>
        <span class="opacity-80"> · {formatValue(hover.value)}</span>
      </div>
    {/if}
  </div>
{/if}
