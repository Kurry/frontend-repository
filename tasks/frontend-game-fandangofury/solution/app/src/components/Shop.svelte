<script lang="ts">
  import { game, gameState, UPGRADES } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let purchaseFeedback = $state('');

  function handleBuy(id: string) {
    const name = UPGRADES.find((u) => u.id === id)?.name ?? id;
    if (game.buyUpgrade(id)) {
      purchaseFeedback = `${name} upgraded to Lv ${gameState.upgrades[id]}!`;
      setTimeout(() => {
        purchaseFeedback = '';
      }, 1600);
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

<OverlayShell
  title="La Cantina"
  emoji="🍺"
  accent="var(--color-fury-gold)"
  subtitle="Spend Pesos on permanent upgrades"
  {onClose}
>
  <div class="flex items-center justify-between mb-3">
    <span class="text-fury-gold font-bold">💰 {gameState.pesos} Pesos</span>
    {#if purchaseFeedback}
      <span class="text-sm text-emerald-300 font-semibold animate-pulse" aria-live="polite">{purchaseFeedback}</span>
    {/if}
  </div>

  <div class="space-y-3">
    {#each UPGRADES as upgrade}
      {@const currentLevel = gameState.upgrades[upgrade.id] ?? 0}
      {@const cost = game.getUpgradeCost(upgrade.id)}
      {@const maxed = currentLevel >= upgrade.maxLevel}
      {@const canBuy = game.canUpgrade(upgrade.id)}
      {@const justLeveled = gameState.levelFlashId === `${upgrade.id}:${currentLevel}`}

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
            {#key gameState.levelFlashId}
              <span class="text-xs text-slate-300 {justLeveled ? 'level-pop text-fury-gold font-bold' : ''}">
                Lv {currentLevel}/{upgrade.maxLevel}
              </span>
            {/key}
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
            <div class="text-xs text-fury-gold mt-1 font-semibold">Next cost: {cost} Pesos</div>
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
</OverlayShell>

<style>
  .level-pop {
    animation: level-pop 0.5s ease-out;
  }
  @keyframes level-pop {
    0% { transform: scale(1.6); }
    100% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .level-pop { animation: none; }
  }
</style>
