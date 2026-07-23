<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { Trash, ListChecks, NoteBlank } from 'phosphor-svelte';
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
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--accent-strong)">
    <ListChecks size={18} weight="fill" /> Rep history
  </h2>

  {#if repHistory.length === 0}
    <div class="text-center py-8" transition:fade={{ duration: 200 }}>
      <div class="flex justify-center mb-2 text-slate-500"><NoteBlank size={36} /></div>
      <p class="text-slate-300 text-sm font-medium">No sets logged yet.</p>
      <p class="text-slate-500 text-xs mt-1">Each set you log from the Quest tab appears here, most recent first, with its rep count, note, and timestamp.</p>
    </div>
  {:else}
    <ul class="max-h-72 overflow-y-auto space-y-2 pr-1" data-history-list>
      {#each repHistory as set (set.id)}
        <li
          class="flex items-center justify-between gap-2 bg-slate-900 rounded-lg px-3 py-2.5 group hover:bg-slate-900/70 transition-colors border border-slate-800 history-row"
          data-history-row={set.id}
          data-rep-count={set.reps}
          out:fade={{ duration: 220 }}
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-bold" style="color: var(--accent-strong)">Logged {set.reps} reps</span>
              <span class="text-xs text-slate-500 ml-auto sm:ml-0">{formatDate(set.timestamp)}</span>
            </div>
            <p class="text-[10px] text-slate-500 truncate">ID: {set.setId || set.id} · {set.loggedAt || new Date(set.timestamp).toISOString()}</p>
            {#if set.note}<p class="text-sm text-slate-300 mt-1 break-words">{set.note}</p>{/if}
          </div>
          <button
            onclick={() => handleDelete(set.id)}
            data-action="delete-set"
            data-set-id={set.id}
            class="inline-flex items-center gap-1 text-slate-400 hover:text-red-400 text-xs px-2 py-1.5 rounded border border-transparent hover:border-red-800
                   opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                   transition-all focus-visible:opacity-100"
            aria-label="Delete set of {set.reps} reps"
          >
            <Trash size={14} /> Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .history-row {
    animation: history-enter 0.26s ease-out forwards;
  }
  @keyframes history-enter {
    from { opacity: 0; transform: translateY(-14px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
