<script lang="ts">
  import { quest } from '../../store.svelte';

  const canUndo = $derived(quest.canUndo);
  const canRedo = $derived(quest.canRedo);
  const history = $derived(quest.history);
  const branches = $derived(quest.branches);
  const activeBranchId = $derived(quest.activeBranchId);
  const historyStateLabel = $derived(quest.historyStateLabel);
  const lifetimeReps = $derived(quest.state.lifetimeReps);
  const currentStreak = $derived(quest.state.currentStreak);
  const currentQp = $derived(quest.state.questPoints);

  function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
    <h2 class="text-lg font-bold text-amber-400">History state</h2>
    <div class="flex gap-2">
      <button
        onclick={() => quest.applyScenarioChange()}
        data-action="apply-scenario-change"
        class="text-xs px-3 py-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-900 font-semibold
               transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        Apply scenario change
      </button>
      <button
        onclick={() => quest.undo()}
        disabled={!canUndo}
        data-action="undo"
        class="text-xs px-3 py-4 rounded-lg transition-colors
               {canUndo ? 'bg-slate-700 hover:bg-slate-600 text-white focus-visible:ring-2 focus-visible:ring-amber-400' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}"
        aria-label="Undo last action"
      >
        Undo
      </button>
      <button
        onclick={() => quest.redo()}
        disabled={!canRedo}
        data-action="redo"
        class="text-xs px-3 py-4 rounded-lg transition-colors
               {canRedo ? 'bg-slate-700 hover:bg-slate-600 text-white focus-visible:ring-2 focus-visible:ring-amber-400' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}"
        aria-label="Redo last action"
      >
        Redo
      </button>
    </div>
  </div>

  <div class="bg-slate-900 rounded-lg p-3 mb-3" aria-label="History state">
    <p class="text-xs text-slate-400 mb-1">Current history state</p>
    <p class="text-sm text-amber-300 font-medium mb-2">{historyStateLabel}</p>
    <div class="grid grid-cols-3 gap-2 text-xs">
      <div>
        <span class="text-slate-300">Lifetime:</span>
        <span class="text-white font-bold ml-1">{lifetimeReps}</span>
      </div>
      <div>
        <span class="text-slate-300">Streak:</span>
        <span class="text-amber-400 font-bold ml-1">{currentStreak}</span>
      </div>
      <div>
        <span class="text-slate-300">QP:</span>
        <span class="text-amber-400 font-bold ml-1">{currentQp}</span>
      </div>
    </div>
  </div>

  {#if branches.length > 1}
    <div class="mb-3">
      <p class="text-xs text-slate-500 mb-1">History branches</p>
      <div class="flex flex-wrap gap-2">
        {#each branches as branch (branch.id)}
          <button
            onclick={() => quest.selectBranch(branch.id)}
            class="text-xs px-2 py-1 rounded-lg border transition-colors
                   {branch.id === activeBranchId
                     ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                     : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'}
                   focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-pressed={branch.id === activeBranchId}
          >
            {branch.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if history.snapshots.length === 0}
    <p class="text-slate-500 text-xs text-center py-4">No history yet. Start logging reps!</p>
  {:else}
    <div class="max-h-32 overflow-y-auto space-y-1">
      {#each history.snapshots as snapshot, i}
        <div
          class="text-xs px-2 py-1 rounded flex items-center justify-between
                 {i === history.currentIndex ? 'bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50' : 'text-slate-400 hover:bg-slate-900/50'}"
        >
          <span>{snapshot.action}</span>
          <span class="text-slate-400 text-xs">{getTimeAgo(snapshot.timestamp)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
