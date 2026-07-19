<script lang="ts">
  import { quest } from '../../store.svelte';

  const gameMode = $derived(quest.gameMode);
</script>

<div class="bg-slate-800 rounded-xl p-3 border border-slate-700">
  <p class="text-xs text-slate-400 mb-2 tracking-wide font-semibold">Game mode</p>
  <div class="flex gap-2">
    <button
      onclick={() => quest.setGameMode('quest')}
      class="flex-1 py-3.5 px-3 rounded-lg text-sm font-medium transition-colors
             {gameMode === 'quest'
               ? 'bg-amber-500 text-slate-900'
               : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}
             focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-pressed={gameMode === 'quest'}
    >
      Quest mode
    </button>
    <button
      onclick={() => quest.setGameMode('challenge')}
      class="flex-1 py-3.5 px-3 rounded-lg text-sm font-medium transition-colors
             {gameMode === 'challenge'
               ? 'bg-red-600 text-white'
               : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}
             focus-visible:ring-2 focus-visible:ring-red-400"
      aria-pressed={gameMode === 'challenge'}
    >
      Challenge mode
    </button>
  </div>
</div>
