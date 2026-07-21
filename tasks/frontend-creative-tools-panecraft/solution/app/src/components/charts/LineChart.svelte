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
  const isTimeSeries = $derived(Boolean(ds?.dateColumn && pane.dimension === ds.dateColumn));
  const syncedLabel = $derived(store.getHoveredDateLabel());

  interface LayerData {
    points: { x: number; y: number; label: string; value: number }[];
    pathD: string;
    areaD: string;
    maxVal: number;
    minVal: number;
    padding: { top: number; right: number; bottom: number; left: number };
    chartW: number;
    chartH: number;
    width: number;
    height: number;
    signature: string;
  }

  const chartData = $derived.by((): LayerData | null => {
    if (!ds) return null;
    const rows = store.filterRowsByDateRange(ds.rows, ds.dateColumn, dateRange);
    if (rows.length === 0) return null;

    const metric = pane.metric;
    const dimension = pane.dimension || ds.dateColumn || 'date';
    const isCount = metric === '_count';

    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[dimension] ?? 'N/A');
      groups.set(key, (groups.get(key) || 0) + (isCount ? 1 : Number(row[metric] ?? 0)));
    }

    const sorted = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const values = sorted.map((entry) => store.applyJitter(entry[1], pane.refreshTick));
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const width = 300;
    const height = 130;
    const padding = { top: 10, right: 12, bottom: 24, left: 40 };
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
      pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
      areaD = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)} ${points
        .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ')} L ${points[points.length - 1]!.x.toFixed(2)} ${padding.top + chartH} L ${points[0]!.x.toFixed(2)} ${padding.top + chartH} Z`;
    }

    return {
      points,
      pathD,
      areaD,
      maxVal,
      minVal,
      padding,
      chartW,
      chartH,
      width,
      height,
      signature: `${dateRange}|${pane.source}|${metric}|${dimension}|${points.map((p) => `${p.label}:${p.value}`).join(',')}`,
    };
  });

  // Crossfade layers: the previous render fades out while the new one fades in,
  // so date-range / metric changes transition instead of snapping.
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

  function pointHover(event: MouseEvent, label: string, value: number) {
    const container = containerEl?.getBoundingClientRect();
    const mark = (event.currentTarget as SVGElement).getBoundingClientRect();
    if (!container) return;
    hover = {
      left: mark.left + mark.width / 2 - container.left,
      top: mark.top - container.top,
      label,
      value,
    };
    if (isTimeSeries) store.setHoveredDateLabel(label);
  }

  function clearHover() {
    hover = null;
    if (isTimeSeries) store.setHoveredDateLabel(null);
  }
</script>

{#if !chartData}
  <div class="flex flex-col items-center justify-center h-full gap-1 text-center">
    <p class="text-sm text-[var(--color-text-secondary)]">No data for this range</p>
    <p class="text-xs text-[var(--color-text-secondary)]">Widen the date range to bring rows back.</p>
  </div>
{:else}
  <div bind:this={containerEl} class="relative w-full h-full" onmouseleave={clearHover}>
    {#each layers as layer (layer.id)}
      {@const d = layer.data}
      {@const syncedPoint = syncedLabel && isTimeSeries ? d.points.find((p) => p.label === syncedLabel) : null}
      <div class="absolute inset-0 {layer.exiting ? 'chart-layer-exit' : 'chart-layer'}" aria-hidden={layer.exiting}>
        <svg viewBox="0 0 {d.width} {d.height}" class="chart-svg w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{pane.title} line chart">
          <defs>
            <linearGradient id="lg-{pane.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#E8536B" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#E8536B" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <line x1={d.padding.left} y1={d.padding.top} x2={d.padding.left} y2={d.padding.top + d.chartH} stroke="#E3E6F0" stroke-width="1"/>
          <line x1={d.padding.left} y1={d.padding.top + d.chartH} x2={d.padding.left + d.chartW} y2={d.padding.top + d.chartH} stroke="#E3E6F0" stroke-width="1"/>
          <line x1={d.padding.left} y1={d.padding.top} x2={d.padding.left + d.chartW} y2={d.padding.top} stroke="#E3E6F0" stroke-width="0.5" stroke-dasharray="3,3"/>
          <line x1={d.padding.left} y1={d.padding.top + d.chartH / 2} x2={d.padding.left + d.chartW} y2={d.padding.top + d.chartH / 2} stroke="#E3E6F0" stroke-width="0.5" stroke-dasharray="3,3"/>

          {#if d.areaD}
            <path d={d.areaD} fill="url(#lg-{pane.id})"/>
          {/if}
          {#if d.pathD}
            <path d={d.pathD} fill="none" stroke="#E8536B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          {/if}

          {#if syncedPoint && !layer.exiting}
            <line x1={syncedPoint.x} y1={d.padding.top} x2={syncedPoint.x} y2={d.padding.top + d.chartH} stroke="#051441" stroke-width="1" stroke-dasharray="3,2" opacity="0.55"/>
          {/if}

          {#each d.points as p}
            <circle
              cx={p.x}
              cy={p.y}
              r="3.2"
              fill="#E8536B"
              onmouseenter={(event) => pointHover(event, p.label, p.value)}
            ></circle>
          {/each}

          <text x={d.padding.left - 5} y={d.padding.top + 4} text-anchor="end" font-size="9" fill="#677294">{formatValue(d.maxVal)}</text>
          <text x={d.padding.left - 5} y={d.padding.top + d.chartH / 2 + 3} text-anchor="end" font-size="9" fill="#677294">{formatValue((d.maxVal + d.minVal) / 2)}</text>
          <text x={d.padding.left - 5} y={d.padding.top + d.chartH + 4} text-anchor="end" font-size="9" fill="#677294">{formatValue(d.minVal)}</text>

          {#if d.points.length > 0}
            <text x={d.points[0]!.x} y={d.padding.top + d.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{d.points[0]!.label.substring(5)}</text>
            {#if d.points.length > 4}
              <text x={d.points[Math.floor(d.points.length / 2)]!.x} y={d.padding.top + d.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{d.points[Math.floor(d.points.length / 2)]!.label.substring(5)}</text>
            {/if}
            <text x={d.points[d.points.length - 1]!.x} y={d.padding.top + d.chartH + 15} text-anchor="middle" font-size="8" fill="#677294">{d.points[d.points.length - 1]!.label.substring(5)}</text>
          {/if}
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
