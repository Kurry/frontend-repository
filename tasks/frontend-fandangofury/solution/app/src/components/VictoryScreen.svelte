<script lang="ts">
  import { gameState, STAGES, MASK_DEFS } from '../lib/game-store.svelte.ts';

  interface Props {
    onContinue: () => void;
  }

  let { onContinue }: Props = $props();
  const stage = $derived(STAGES[gameState.currentStage - 1]);
</script>

<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border-2 border-yellow-500/40 rounded-2xl w-full max-w-md text-center p-6 sm:p-8 relative overflow-hidden victory-screen"
  >
    <div class="relative z-10">
      <div class="text-5xl sm:text-6xl mb-4 animate-bounce">🏆</div>
      <h2 class="text-3xl sm:text-4xl font-black text-fury-gold mb-2">Victory!</h2>
      <p class="text-slate-200 mb-6 text-sm sm:text-base">
        You conquered {stage?.name ?? 'the stage'} and defeated {stage?.bossName ?? 'the boss'}!
      </p>

      <div class="bg-fury-dark border border-yellow-500/20 rounded-xl p-4 mb-6 space-y-3 text-left">
        <div class="flex items-center justify-between">
          <span class="text-slate-200 text-sm">Pesos earned</span>
          <span class="text-fury-gold font-bold text-lg">+{gameState.runPesos}₱</span>
        </div>
        {#if gameState.runMasks.length > 0}
          <div class="border-t border-gray-700 pt-3">
            <div class="text-slate-200 text-sm mb-2">Masks found</div>
            {#each gameState.runMasks as maskId}
              {@const mask = MASK_DEFS.find((m) => m.id === maskId)}
              <div class="text-purple-300 font-semibold text-sm">{mask?.emoji ?? '🎭'} {mask?.name ?? maskId}</div>
            {/each}
          </div>
        {/if}
        <div class="border-t border-gray-700 pt-3 flex items-center justify-between">
          <span class="text-slate-200 text-sm">Total pesos</span>
          <span class="text-fury-gold font-bold">{gameState.pesos}₱</span>
        </div>
      </div>

      <button
        class="btn-interactive min-h-12 px-8 py-3 bg-fury-gold hover:bg-yellow-500 text-fury-darker font-black text-lg rounded-xl border border-yellow-400/50"
        onclick={onContinue}
        aria-label="Continue to stage map"
      >
        Continue
      </button>
    </div>
  </div>
</div>
