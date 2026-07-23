<script lang="ts">
  import { game, gameState, STAGES } from '../lib/game-store.svelte.ts';

  const stage = $derived(STAGES[gameState.currentStage - 1]);
  const boss = $derived(gameState.isBoss ? gameState.enemies.find((e) => e.type === 'boss') : undefined);
  const maxHealth = $derived(game.getMaxHealth());
  const healthPct = $derived(maxHealth > 0 ? gameState.playerHealth / maxHealth : 0);
  const danger = $derived(healthPct <= 0.25 && gameState.playerHealth > 0);

  function playerHealthBarClass(): string {
    const base = 'h-full transition-all duration-300 ease-out rounded-full';
    if (danger) return `${base} bg-red-600 animate-pulse`;
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
      <span class="text-lg sm:text-xl" aria-hidden="true">❤️</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-slate-200 truncate">Health {#if danger}<span class="text-red-400 font-bold">LOW</span>{/if}</div>
        <div
          class="h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden border {danger ? 'border-red-500' : 'border-gray-700'}"
          role="meter"
          aria-label="Fighter health"
          aria-valuemin={0}
          aria-valuemax={maxHealth}
          aria-valuenow={gameState.playerHealth}
        >
          <div class={playerHealthBarClass()} style="width: {healthPct * 100}%" />
        </div>
        <div class="text-xs text-slate-200">{gameState.playerHealth}/{maxHealth}</div>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-1 min-w-[120px]">
      <span class="text-lg sm:text-xl" aria-hidden="true">🔥</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-slate-200 truncate">
          Fury {#if game.furyReady}<span class="text-fury-gold font-black">READY</span>{/if}
        </div>
        {#key gameState.furyDeniedId}
          <div
            class="h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 {game.furyReady
              ? 'fury-ready'
              : ''} {gameState.furyDeniedId > 0 ? 'fury-denied' : ''}"
            role="meter"
            aria-label="Fury meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(gameState.furyMeter)}
          >
            <div
              class="h-full transition-all duration-200 ease-out rounded-full"
              style="width: {game.furyPct}%; background: linear-gradient(90deg, #f4a261, #e63946);"
            />
          </div>
        {/key}
        <div class="text-xs text-slate-200">{Math.floor(gameState.furyMeter)}/100</div>
      </div>
    </div>

    {#if stage}
      <div class="text-center px-2 min-w-[92px]">
        {#if gameState.isBoss}
          <div class="text-sm font-black text-fury-red animate-pulse">⚔️ Boss Duel</div>
          <div class="text-[10px] text-slate-300 truncate max-w-[92px]">{stage.bossName}</div>
        {:else}
          <div class="text-xs text-slate-200">Wave</div>
          <div class="text-sm font-bold text-emerald-300">{gameState.currentWave} of {stage.waves}</div>
        {/if}
      </div>
    {/if}

    <div class="flex items-center gap-2 sm:gap-3">
      {#key gameState.pesosChangeSeq}
        <div class="flex items-center gap-1 text-fury-gold text-sm font-semibold pesos-flash" aria-label="{gameState.pesos} pesos">
          <span aria-hidden="true">💰</span> {gameState.pesos} Pesos
        </div>
        <div class="flex items-center gap-1 text-amber-300 text-sm font-semibold ml-2">
          <span aria-hidden="true">⚡</span> {gameState.comboCount}x Combo
        </div>
      {/key}
      {#if gameState.equippedMask}
        {@const mask = game.masks().find((m) => m.id === gameState.equippedMask)}
        {#if mask}
          <div class="text-lg" title="Equipped {mask.name}">{mask.emoji}</div>
        {/if}
      {/if}
    </div>
  </div>

  {#if boss && !boss.dead}
    <div class="max-w-4xl mx-auto mt-1.5">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-fury-red whitespace-nowrap">💀 {boss.name}</span>
        <div class="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-red-700/50"
          role="meter" aria-label="Boss {boss.name} health" aria-valuemin={0} aria-valuemax={boss.maxHealth} aria-valuenow={boss.health}>
          <div
            class="h-full transition-all duration-300 ease-out rounded-full {boss.health / boss.maxHealth <= 0.25 ? 'bg-red-900 animate-pulse' : 'bg-fury-red'}"
            style="width: {(boss.health / boss.maxHealth) * 100}%"
          />
        </div>
        <span class="text-[10px] text-slate-300 tabular-nums">{boss.health}/{boss.maxHealth}</span>
      </div>
    </div>
  {/if}
</div>

{#if gameState.combo.count > 0}
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none" aria-live="polite">
    {#if gameState.fiestaFlash}
      {#key gameState.fiestaFlash}
        <div class="fiesta-flash text-2xl sm:text-3xl font-black text-fury-gold drop-shadow-[0_2px_8px_rgba(233,196,106,0.7)]">
          🎉 Fiesta Combo! 🎉
        </div>
      {/key}
    {:else}
      {#key gameState.combo.count}
        <div class="combo-popup text-xl sm:text-2xl font-bold text-fury-orange drop-shadow-lg">
          {gameState.combo.count}× Combo
        </div>
      {/key}
    {/if}
  </div>
{/if}

{#if gameState.dodgeCooldown > 0}
  <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-30" aria-live="polite">
    <div class="bg-fury-dark/90 border border-blue-400/50 rounded-lg px-3 py-1 text-xs text-slate-100">
      Dodge cooldown: {game.dodgeCooldownSeconds}s
      <div class="h-1.5 bg-gray-700 rounded-full mt-1 w-20">
        <div
          class="h-full bg-blue-400 rounded-full transition-all duration-100"
          style="width: {(1 - game.dodgeCooldownPct) * 100}%"
        />
      </div>
    </div>
  </div>
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

<style>
  .pesos-flash {
    animation: pesos-pop 0.4s ease-out;
  }
  @keyframes pesos-pop {
    0% { transform: scale(1.35); color: #fff; }
    100% { transform: scale(1); }
  }
  .fury-denied {
    animation: fury-denied 0.4s ease-in-out;
  }
  @keyframes fury-denied {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .pesos-flash, .fury-denied { animation: none; }
  }
</style>
