<script lang="ts">
  import { gameState } from '../lib/game-store.svelte.ts';

  interface Props {
    onTryAgain: () => void;
    onToMap: () => void;
  }

  let { onTryAgain, onToMap }: Props = $props();
</script>

<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="bg-fury-dark border-2 border-fury-red/40 rounded-2xl w-full max-w-md text-center p-6 sm:p-8 relative overflow-hidden">
    <div class="relative z-10">
      <div class="text-5xl sm:text-6xl mb-4">💀</div>
      <h2 class="text-3xl sm:text-4xl font-black text-fury-red mb-2">Derrota!</h2>
      <p class="text-slate-200 mb-6 text-sm sm:text-base">The bandits got the better of you this time.</p>

      <div class="bg-fury-dark border border-fury-red/20 rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between">
          <span class="text-slate-200 text-sm">Pesos earned</span>
          <span class="text-fury-gold font-bold text-lg">{gameState.runPesos}₱</span>
        </div>
        <div class="border-t border-gray-700 mt-3 pt-3 flex items-center justify-between">
          <span class="text-slate-200 text-sm">Total pesos</span>
          <span class="text-fury-gold font-bold">{gameState.pesos}₱</span>
        </div>
      </div>

      <div class="flex gap-3 justify-center flex-wrap">
        <button
          class="btn-interactive min-h-12 px-6 py-3 bg-fury-red hover:bg-red-600 text-white font-bold text-base rounded-xl border border-red-400/30"
          onclick={onTryAgain}
          aria-label="Try again"
        >
          Try again
        </button>
        <button
          class="btn-interactive min-h-12 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-slate-100 font-bold text-base rounded-xl border border-gray-500/30"
          onclick={onToMap}
          aria-label="Return to map"
        >
          Stage map
        </button>
      </div>
    </div>
  </div>
</div>
