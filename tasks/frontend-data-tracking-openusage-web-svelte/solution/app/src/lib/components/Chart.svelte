<script lang="ts">
  import { state, setDateRange } from '../store.svelte';

  // A simple linked chart placeholder that respects the dateRange from state

  let isBrushing = false;
  let brushStart = 0;
  let brushCurrent = 0;

  function handlePointerDown(e: PointerEvent) {
     isBrushing = true;
     brushStart = e.clientX;
     brushCurrent = e.clientX;
  }

  function handlePointerMove(e: PointerEvent) {
     if (isBrushing) {
         brushCurrent = e.clientX;
     }
  }

  function handlePointerUp() {
     if (isBrushing) {
         isBrushing = false;
         // In a real chart, calculate dates based on x coordinates.
         // Here we just set a dummy date range for demonstration of the flow.
         const start = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];
         const end = new Date().toISOString().split('T')[0];
         setDateRange(start, end);
     }
  }
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
  <h2 class="text-lg font-semibold mb-3">30-Day Trend</h2>

  <div class="flex items-center gap-4 mb-4">
    <div class="flex items-center gap-2">
      <label class="text-sm text-zinc-400">Start Date</label>
      <input type="date" value={state.workspace.dateRange?.start || ''} onchange={(e) => setDateRange(e.currentTarget.value, state.workspace.dateRange?.end || '')} class="bg-zinc-950 border border-zinc-800 rounded p-1 text-sm text-white" />
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-zinc-400">End Date</label>
      <input type="date" value={state.workspace.dateRange?.end || ''} onchange={(e) => setDateRange(state.workspace.dateRange?.start || '', e.currentTarget.value)} class="bg-zinc-950 border border-zinc-800 rounded p-1 text-sm text-white" />
    </div>
    {#if state.workspace.dateRange}
      <button class="text-xs bg-zinc-800 px-2 py-1 rounded" onclick={() => state.workspace.dateRange = null}>Clear Range</button>
    {/if}
  </div>

  <div class="h-32 bg-zinc-950 border border-zinc-800 rounded relative overflow-hidden"
       onpointerdown={handlePointerDown}
       onpointermove={handlePointerMove}
       onpointerup={handlePointerUp}
       onpointerleave={handlePointerUp}>

    <div class="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm pointer-events-none">
       [Chart Visualization] Drag to brush date range
    </div>

    {#if isBrushing}
      <div class="absolute bg-primary/20 border border-primary/50 top-0 bottom-0 pointer-events-none"
           style="left: {Math.min(brushStart, brushCurrent) - (e => e.target.getBoundingClientRect().left)(window.event)}px; width: {Math.abs(brushCurrent - brushStart)}px">
      </div>
    {/if}
  </div>
</div>
