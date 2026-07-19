<script lang="ts">
  import { quest } from '../../store.svelte';

  const repHistory = $derived(quest.state.repHistory);

  function formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${h}:${mins} ${ampm}`;
  }

  function handleDelete(setId: string) {
    quest.deleteSet(setId);
  }
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold text-amber-400 mb-3">Rep history</h2>

  {#if repHistory.length === 0}
    <div class="text-center py-8">
      <div class="text-4xl mb-2">🏋️</div>
      <p class="text-slate-400 text-sm">No sets logged yet — log your first set!</p>
    </div>
  {:else}
    <div class="max-h-64 overflow-y-auto space-y-2 pr-1">
      {#each repHistory as set (set.id)}
        <div class="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 group hover:bg-slate-900/80 transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-amber-400">{set.reps}</span>
              <span class="text-xs text-slate-400">reps</span>
            </div>
            <p class="text-xs text-slate-500 truncate">{formatDate(set.timestamp)}</p>
          </div>
          <button
            onclick={() => handleDelete(set.id)}
            data-action="delete-set"
            data-set-id={set.id}
            class="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded
                   opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                   transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label="Delete set of {set.reps} reps"
          >
            Delete
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
