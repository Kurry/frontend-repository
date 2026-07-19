<script lang="ts">
  import { game, gameState, UPGRADES } from '../lib/game-store.svelte.ts';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let purchaseFeedback = $state('');

  function handleBuy(id: string) {
    if (game.buyUpgrade(id)) {
      purchaseFeedback = 'Upgrade purchased!';
      setTimeout(() => {
        purchaseFeedback = '';
      }, 1500);
    }
  }

  function upgradeIcon(id: string): string {
    if (id === 'maxHealth') return '❤️';
    if (id === 'attackPower') return '⚔️';
    return '🔥';
  }

  function upgradeCardBg(id: string): string {
    if (id === 'maxHealth') return 'bg-red-900/20';
    if (id === 'attackPower') return 'bg-red-800/20';
    return 'bg-amber-600/20';
  }

  function upgradeRowClass(canBuy: boolean): string {
    if (canBuy) {
      return 'flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-blue-950/10';
    }
    return 'flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-fury-dark';
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-amber-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-label="Cantina shop"
  >
    <div class="sticky top-0 bg-fury-dark border-b border-amber-500/20 rounded-t-2xl p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-amber-400">🍺 La cantina</h2>
        <div class="flex items-center gap-2">
          <span class="text-fury-gold font-bold">💰 {gameState.pesos}</span>
          <button
            class="btn-interactive ml-2 min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
            onclick={onClose}
            aria-label="Close shop"
          >
            ✕
          </button>
        </div>
      </div>
      <p class="text-slate-300 text-xs mt-1">Spend pesos on permanent upgrades</p>
      {#if purchaseFeedback}
        <div class="mt-2 text-sm text-emerald-300 animate-pulse">{purchaseFeedback}</div>
      {/if}
    </div>

    <div class="p-4 sm:p-6 space-y-3">
      {#each UPGRADES as upgrade}
        {@const currentLevel = gameState.upgrades[upgrade.id] ?? 0}
        {@const cost = game.getUpgradeCost(upgrade.id)}
        {@const maxed = currentLevel >= upgrade.maxLevel}
        {@const canBuy = game.canUpgrade(upgrade.id)}

        <div class={upgradeRowClass(canBuy)}>
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 {upgradeCardBg(
              upgrade.id,
            )}"
          >
            {upgradeIcon(upgrade.id)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm sm:text-base text-slate-100">{upgrade.name}</span>
              <span class="text-xs text-slate-300">Lv {currentLevel}/{upgrade.maxLevel}</span>
            </div>
            <div class="text-xs text-slate-300 mt-0.5">
              Current: {upgrade.effect(currentLevel)}
              {#if !maxed}
                · Next: {upgrade.effect(currentLevel + 1)}
              {:else}
                (max)
              {/if}
            </div>
            {#if !maxed}
              <div class="text-xs text-fury-gold mt-1 font-semibold">Cost: {cost} pesos</div>
            {/if}
          </div>
          {#if maxed}
            <span class="text-xs font-bold text-emerald-300 px-2 py-1 bg-emerald-500/10 rounded-lg min-h-12 flex items-center">
              Max
            </span>
          {:else if canBuy}
            <button
              class="btn-interactive min-h-12 px-4 py-2 bg-fury-gold hover:bg-yellow-500 text-fury-darker font-bold text-xs sm:text-sm rounded-lg"
              onclick={() => handleBuy(upgrade.id)}
              aria-label={`Buy ${upgrade.name} for ${cost} pesos`}
            >
              Buy {cost}
            </button>
          {:else}
            <span class="text-xs text-slate-300 font-mono min-h-12 flex items-center">Need {cost}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
