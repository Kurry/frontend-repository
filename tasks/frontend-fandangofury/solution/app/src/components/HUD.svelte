<script lang="ts">
  import { game, gameState, STAGES } from '../lib/game-store.svelte.ts';

  const stage = $derived(STAGES[gameState.currentStage - 1]);

  function playerHealthBarClass(): string {
    const pct = gameState.playerHealth / game.getMaxHealth();
    const base = 'h-full transition-all duration-300 rounded-full';
    if (pct <= 0.25 && gameState.playerHealth > 0) return `${base} bg-red-900 animate-pulse`;
    return `${base} bg-fury-red`;
  }

  function feedbackColor(type: string): string {
    switch (type) {
      case 'damage':
        return 'text-amber-400';
      case 'combo':
        return 'text-fury-gold';
      case 'fiesta':
        return 'text-fury-red';
      case 'peso':
        return 'text-yellow-300';
      case 'mask':
        return 'text-purple-300';
      default:
        return 'text-white';
    }
  }
</script>

<div class="fixed top-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-blue-800/30 px-2 sm:px-4 py-2">
  <div class="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 flex-wrap">
    <div class="flex items-center gap-2 flex-1 min-w-[120px]">
      <span class="text-lg sm:text-xl" aria-hidden="true">⚔️</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-slate-200 truncate">Health</div>
        <div class="h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            class={playerHealthBarClass()}
            style="width: {(gameState.playerHealth / game.getMaxHealth()) * 100}%"
          />
        </div>
        <div class="text-xs text-slate-200">{gameState.playerHealth}/{game.getMaxHealth()}</div>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-1 min-w-[120px]">
      <span class="text-lg sm:text-xl" aria-hidden="true">🔥</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-slate-200 truncate">Fury</div>
        <div
          class="h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 {game.furyReady
            ? 'fury-ready'
            : ''}"
        >
          <div
            class="h-full transition-all duration-200 rounded-full"
            style="width: {game.furyPct}%; background: linear-gradient(90deg, #f4a261, #e63946);"
          />
        </div>
        <div class="text-xs text-slate-200">{Math.floor(gameState.furyMeter)}/100</div>
      </div>
    </div>

    {#if stage}
      <div class="text-center px-2 min-w-[88px]">
        {#if gameState.isBoss}
          <div class="text-sm font-bold text-fury-orange animate-pulse">Boss duel</div>
        {:else}
          <div class="text-xs text-slate-200">Wave</div>
          <div class="text-sm font-bold text-emerald-300">{gameState.currentWave} of {stage.waves}</div>
        {/if}
      </div>
    {/if}

    <div class="flex items-center gap-2 sm:gap-3">
      <div class="flex items-center gap-1 text-fury-gold text-sm font-semibold">
        <span aria-hidden="true">💰</span> {gameState.pesos}
      </div>
      {#if gameState.equippedMask}
        {@const mask = game.masks().find((m) => m.id === gameState.equippedMask)}
        {#if mask}
          <div class="text-lg" title={mask.name}>{mask.emoji}</div>
        {/if}
      {/if}
    </div>
  </div>
</div>

{#if gameState.combo.count > 0}
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none" aria-live="polite">
    {#if gameState.fiestaFlash}
      <div class="fiesta-flash text-2xl sm:text-3xl font-black text-fury-gold drop-shadow-lg">
        🎉 Fiesta Combo! 🎉
      </div>
    {:else}
      <div class="combo-popup text-xl sm:text-2xl font-bold text-fury-orange drop-shadow-lg">
        {gameState.combo.count}x Combo
      </div>
    {/if}
  </div>
{/if}

{#if gameState.dodgeCooldown > 0}
  <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-30" aria-live="polite">
    <div class="bg-fury-dark/90 border border-blue-400/50 rounded-lg px-3 py-1 text-xs text-slate-100">
      Dodge cooldown: {Math.ceil(game.dodgeCooldownPct * 100)}%
      <div class="h-1.5 bg-gray-700 rounded-full mt-1 w-20">
        <div
          class="h-full bg-blue-400 rounded-full transition-all"
          style="width: {(1 - game.dodgeCooldownPct) * 100}%"
        />
      </div>
    </div>
  </div>
{/if}

{#if gameState.screenFuryActive}
  <div class="screen-fury" />
{/if}

{#if gameState.playerHitFlash}
  <div class="fixed inset-0 bg-red-500/20 pointer-events-none z-50" />
{/if}

{#each gameState.feedbacks as fb (fb.id)}
  <div
    class="fixed float-up z-40 pointer-events-none font-bold {feedbackColor(fb.type)}"
    style="left: {fb.x}px; top: {fb.y}px;"
  >
    {fb.text}
  </div>
{/each}
