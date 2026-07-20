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
    bars: { x: number; y: number; barH: number; barWidth: number; val: number; label: string; color: string }[];
    maxVal: number;
    padding: { top: number; right: number; bottom: number; left: number };
    chartW: number;
    chartH: number;
    width: number;
    height: number;
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

    const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const values = sorted.map((entry) => store.applyJitter(entry[1], pane.refreshTick));
    const maxVal = Math.max(...values, 1);

    const width = 300;
    const height = 130;
    const padding = { top: 12, right: 10, bottom: 28, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barGap = chartW / sorted.length;
    const barWidth = Math.min(barGap * 0.65, 36);

    const bars = sorted.map((entry, i) => {
      const val = store.applyJitter(entry[1], pane.refreshTick);
      const barH = Math.max((val / maxVal) * chartH, 1);
      const x = padding.left + i * barGap + (barGap - barWidth) / 2;
      const y = padding.top + chartH - barH;
      return { x, y, barH, barWidth, val, label: entry[0], color: colors[i % colors.length]! };
    });

    return {
      bars,
      maxVal,
      padding,
      chartW,
      chartH,
      width,
      height,
      signature: `${dateRange}|${pane.source}|${metric}|${dimension}|${bars.map((b) => `${b.label}:${b.val}`).join(',')}`,
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

  const liveLayer = $derived(layers.find((layer) => !layer.exiting) ?? layers[layers.length - 1]);

  function barHover(event: MouseEvent, label: string, value: number) {
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
  <div bind:this={containerEl} class="relative w-full h-full" onmouseleave={() => (hover = null)}>
    {#each layers as layer (layer.id)}
      {@const d = layer.data}
      <div class="absolute inset-0 {layer.exiting ? 'chart-layer-exit' : 'chart-layer'}" aria-hidden={layer.exiting}>
        <svg viewBox="0 0 {d.width} {d.height}" class="chart-svg w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{pane.title} bar chart">
          <line x1={d.padding.left} y1={d.padding.top} x2={d.padding.left} y2={d.padding.top + d.chartH} stroke="#E3E6F0" stroke-width="1"/>
          <line x1={d.padding.left} y1={d.padding.top + d.chartH} x2={d.padding.left + d.chartW} y2={d.padding.top + d.chartH} stroke="#E3E6F0" stroke-width="1"/>

          {#each d.bars as bar}
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.barWidth}
              height={bar.barH}
              rx="2"
              fill={bar.color}
              onmouseenter={(event) => barHover(event, bar.label, bar.val)}
            ></rect>
            <text x={bar.x + bar.barWidth / 2} y={d.padding.top + d.chartH + 12} text-anchor="middle" font-size="8" fill="#677294">{bar.label.length > 9 ? `${bar.label.substring(0, 8)}…` : bar.label}</text>
          {/each}

          <text x={d.padding.left - 5} y={d.padding.top + 4} text-anchor="end" font-size="9" fill="#677294">{formatValue(d.maxVal)}</text>
        </svg>
      </div>
    {/each}

    {#if hover && liveLayer}
      <div
        class="absolute z-10 pointer-events-none px-2 py-1 rounded-[var(--radius-base)] bg-[var(--color-secondary)] text-white text-xs shadow-lg whitespace-nowrap"
        style="left:{hover.left}px; top:{hover.top}px; transform:translate(-50%, -130%);"
        role="status"
      >
        <span class="font-semibold">{hover.label}</span>
        <span class="opacity-80"> · {pane.metric}: {formatValue(hover.value)}</span>
      </div>
    {/if}
  </div>
{/if}
