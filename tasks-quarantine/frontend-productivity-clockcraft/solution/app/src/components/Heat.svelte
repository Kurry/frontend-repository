<script lang="ts">
  import { heatmapData, todayKey, showTip, hideTip } from '../state.svelte';

  const cells = $derived(heatmapData());
  const today = todayKey();

  function tip(e: MouseEvent, label: string, total: number, lean: number) {
    const leanTxt = lean > 0 ? 'leans Meaningful' : lean < 0 ? 'leans Draining' : 'balanced';
    showTip(e.clientX, e.clientY, `${label} — ${total} min (${leanTxt})`);
  }

  function leanAttr(lean: number): string {
    if (lean > 0) return 'm';
    if (lean < 0) return 'd';
    return 'n';
  }
</script>

<div class="heat" role="img" aria-label="Streak heat-map of total tracked minutes for the last 12 weeks">
  {#each cells as cell (cell.key)}
    <button
      type="button"
      class="heat-cell"
      class:today={cell.key === today}
      data-level={cell.level}
      data-lean={leanAttr(cell.lean)}
      data-lean-val={cell.lean}
      aria-label="{cell.label}: {cell.total} minutes tracked, lean {cell.lean}"
      onmouseenter={(e) => tip(e, cell.label, cell.total, cell.lean)}
      onmousemove={(e) => tip(e, cell.label, cell.total, cell.lean)}
      onmouseleave={hideTip}
      onfocus={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const leanTxt = cell.lean > 0 ? 'leans Meaningful' : cell.lean < 0 ? 'leans Draining' : 'balanced';
        showTip(r.left + r.width / 2, r.top, `${cell.label} — ${cell.total} min (${leanTxt})`);
      }}
      onblur={hideTip}
    ></button>
  {/each}
</div>
<div class="heat-scale" aria-hidden="true">
  Less
  <i data-level="0" class="heat-cell" style="aspect-ratio:auto;width:12px;height:12px"></i>
  <i data-level="1" class="heat-cell" style="aspect-ratio:auto;width:12px;height:12px"></i>
  <i data-level="2" class="heat-cell" style="aspect-ratio:auto;width:12px;height:12px"></i>
  <i data-level="3" class="heat-cell" style="aspect-ratio:auto;width:12px;height:12px"></i>
  <i data-level="4" class="heat-cell" style="aspect-ratio:auto;width:12px;height:12px"></i>
  More
</div>
