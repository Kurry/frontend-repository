<script lang="ts">
  import { quest } from '../../store.svelte';

  const heatMap = $derived(quest.heatMapData);
  const dailyGoal = $derived(quest.state.dailyGoal);
  let hovered = $state<{ date: string; reps: number } | null>(null);

  function level(reps: number): 'empty' | 'building' | 'met' {
    if (reps === 0) return 'empty';
    return reps >= dailyGoal ? 'met' : 'building';
  }
  const fillClass: Record<string, string> = {
    empty: 'bg-slate-900',
    building: 'bg-amber-600/80',
    met: 'bg-emerald-500',
  };
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
    <h2 class="text-lg font-bold" style="color: var(--accent-strong)">28-day streak heat-map</h2>
    <div class="flex items-center gap-2 text-[11px] text-slate-400">
      <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-slate-900 border border-slate-700"></span>Empty</span>
      <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-amber-600/80"></span>Building</span>
      <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>Goal met</span>
    </div>
  </div>

  <div class="relative">
    <div class="grid grid-cols-7 gap-1" role="group" aria-label="Last 28 calendar days of rep totals">
      {#each heatMap as day}
        {@const lvl = level(day.reps)}
        <button
          type="button"
          class="aspect-square rounded-sm border border-slate-700 {fillClass[lvl]} transition-transform hover:scale-110 focus-visible:scale-110"
          onmouseenter={() => hovered = day}
          onmouseleave={() => hovered = null}
          onfocus={() => hovered = day}
          onblur={() => hovered = null}
          aria-label={`${day.date}: ${day.reps} reps${lvl === 'met' ? ', goal met' : lvl === 'empty' ? ', no reps' : ', below goal'}`}
          title={`${day.date}: ${day.reps} reps`}
        ></button>
      {/each}
    </div>
    {#if hovered}
      <div class="mt-2 text-xs text-slate-200 bg-slate-900 inline-block rounded-lg px-2.5 py-1 border border-slate-700" aria-live="polite">
        <span class="font-semibold" style="color: var(--accent-strong)">{hovered.date}</span> — {hovered.reps} reps {level(hovered.reps) === 'met' ? '(goal met)' : level(hovered.reps) === 'empty' ? '(no reps)' : `(of ${dailyGoal} goal)`}
      </div>
    {:else}
      <p class="text-[11px] text-slate-500 mt-2">Hover or focus a cell to read that day's total.</p>
    {/if}
  </div>

  <p class="sr-only">{heatMap.map((day) => `${day.date}: ${day.reps} reps`).join('; ')}</p>
</div>
