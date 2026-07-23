<script lang="ts">
  import { Trophy, Medal } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  const bestSingle = $derived(quest.bestSingleSet);
  const bestDay = $derived(quest.bestDayTotal);
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--accent-strong)">
    <Trophy size={18} weight="fill" /> Personal records
  </h2>
  <div class="grid grid-cols-2 gap-3">
    <div class="bg-slate-900 rounded-lg p-3 flex items-center gap-2">
      <Medal size={20} class="text-amber-400 shrink-0" />
      <div class="min-w-0">
        <p class="text-xs text-slate-400">Best single set</p>
        <p class="text-2xl font-black text-white">{bestSingle} <span class="text-xs font-normal text-slate-400">reps</span></p>
      </div>
    </div>
    <div class="bg-slate-900 rounded-lg p-3 flex items-center gap-2">
      <Trophy size={20} class="text-amber-400 shrink-0" />
      <div class="min-w-0">
        <p class="text-xs text-slate-400">Best day total</p>
        <p class="text-2xl font-black text-white">{bestDay} <span class="text-xs font-normal text-slate-400">reps</span></p>
      </div>
    </div>
  </div>
</div>
