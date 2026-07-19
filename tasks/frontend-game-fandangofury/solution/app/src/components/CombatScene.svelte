<script lang="ts">
  import { onMount } from 'svelte';
  import { game, gameState, STAGES, MASK_DEFS } from '../lib/game-store.svelte.ts';

  interface Props {
    screen: string;
    onBossStart: () => void;
    onVictory: () => void;
    onDefeat: () => void;
  }

  let { screen, onBossStart, onVictory, onDefeat }: Props = $props();

  let animFrame = 0;

  function playerBodyClass(): string {
    const base = 'w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl';
    if (gameState.playerHealth <= game.getMaxHealth() * 0.25) return `${base} bg-red-700`;
    return `${base} bg-emerald-600`;
  }

  function bossHealthBar(health: number, maxHealth: number): string {
    const pct = health / maxHealth;
    const base = 'h-full transition-all duration-300 rounded-full';
    if (pct <= 0.25) return `${base} bg-red-900 animate-pulse`;
    return `${base} bg-fury-red`;
  }

  function enemyHealthBar(health: number, maxHealth: number): string {
    const pct = health / maxHealth;
    const base = 'h-full transition-all duration-200 rounded-full';
    if (pct <= 0.25) return `${base} bg-red-900`;
    return `${base} bg-amber-500`;
  }

  function dodgeBtnClass(): string {
    const base =
      'btn-interactive min-h-12 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base text-white border active:scale-95 min-w-[72px]';
    if (gameState.dodgeCooldown > 0) {
      return `${base} bg-gray-600 opacity-70 border-gray-400/50 cursor-not-allowed`;
    }
    return `${base} bg-purple-700 border-purple-400/30 hover:bg-purple-600`;
  }

  onMount(() => {
    function tick() {
      game.tickEnemies();
      game.tickCombo();

      if (screen === 'COMBAT' && gameState.isBoss && gameState.enemies.some((e) => e.type === 'boss' && !e.dead)) {
        onBossStart();
      }

      if ((screen === 'BOSS' || screen === 'COMBAT') && gameState.isBoss) {
        const boss = gameState.enemies.find((e) => e.type === 'boss');
        if (boss?.dead) {
          game.saveToStorage();
          setTimeout(() => onVictory(), 500);
          return;
        }
      }

      if (gameState.playerHealth <= 0) {
        setTimeout(() => onDefeat(), 300);
        return;
      }

      animFrame = requestAnimationFrame(tick);
    }

    animFrame = requestAnimationFrame(tick);

    function handleKey(e: KeyboardEvent) {
      if (gameState.playerHealth <= 0) return;
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          game.lightAttack();
          break;
        case 'x':
          e.preventDefault();
          game.heavyAttack();
          break;
        case 'c':
          e.preventDefault();
          game.startBlock();
          break;
        case ' ':
          e.preventDefault();
          game.dodgeRoll();
          break;
        case 'f':
          e.preventDefault();
          game.activateFury();
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'c') game.stopBlock();
    }

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });
</script>

<div class="combat-stage relative w-full h-screen overflow-hidden" aria-label="Combat stage">
  <div class="absolute inset-0 bg-gradient-to-b from-blue-950 via-fury-dark to-fury-darker">
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-900/30 to-transparent" />
    <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-900 to-stone-800/50" />
  </div>

  <div class="absolute top-16 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
    <div class="text-xs text-slate-300 uppercase tracking-wide">
      Stage {gameState.currentStage}: {STAGES[gameState.currentStage - 1]?.name ?? 'Arena'}
    </div>
  </div>

  <div aria-live="polite" aria-atomic="true" class="sr-only">{gameState.statusMessage}</div>

  <div class="absolute z-20" style="left: 80px; bottom: 100px;">
    <div class="relative">
      <div
        class={playerBodyClass()}
        class:animate-pulse={gameState.playerHitFlash}
        class:opacity-40={gameState.dodging}
        class:light-attack={gameState.playerAttacking === 'light'}
        class:heavy-attack={gameState.playerAttacking === 'heavy'}
      >
        🥷
      </div>
      {#if gameState.blocking}
        <div class="absolute -inset-2 border-2 border-blue-400 rounded-xl bg-blue-900/30 animate-pulse" />
      {/if}
      {#if gameState.playerAttacking === 'light'}
        <div class="absolute top-0 -right-8 w-8 h-8 bg-amber-500/70 rounded-full animate-ping" />
      {:else if gameState.playerAttacking === 'heavy'}
        <div class="absolute top-0 -right-12 w-12 h-12 bg-fury-red/70 rounded-full animate-ping" />
      {/if}
    </div>
  </div>

  {#each gameState.enemies as enemy (enemy.id)}
    {#if !enemy.dead}
      <div class="absolute z-15 enemy-enter" style="left: {Math.max(130, enemy.x)}px; bottom: 100px;">
        <div class="relative {enemy.telegraphing ? 'boss-telegraph' : ''} {enemy.hitFlash ? 'shake' : ''}">
          {#if enemy.type === 'boss'}
            <div class="w-16 h-20 sm:w-20 sm:h-24 rounded-lg flex items-center justify-center text-3xl sm:text-4xl border-2 border-fury-red bg-fury-red/20">
              💀
            </div>
            <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-32 text-center">
              <div class="text-xs font-bold text-fury-red mb-1 whitespace-nowrap">{enemy.name}</div>
              <div class="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                <div
                  class={bossHealthBar(enemy.health, enemy.maxHealth)}
                  style="width: {(enemy.health / enemy.maxHealth) * 100}%"
                />
              </div>
            </div>
            {#if enemy.telegraphing}
              <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-lg animate-bounce">⚡</div>
            {/if}
          {:else if enemy.type === 'brute'}
            <div class="w-14 h-16 sm:w-16 rounded-lg flex items-center justify-center text-2xl sm:text-3xl border border-amber-500/50 bg-amber-500/10">
              👹
            </div>
          {:else}
            <div class="w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center text-xl sm:text-2xl border border-gray-600 bg-gray-800/50">
              🗡️
            </div>
          {/if}

          {#if enemy.type !== 'boss'}
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-12">
              <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class={enemyHealthBar(enemy.health, enemy.maxHealth)}
                  style="width: {(enemy.health / enemy.maxHealth) * 100}%"
                />
              </div>
            </div>
          {/if}

          {#if enemy.attacking}
            <div class="absolute top-1/2 -left-6 w-6 h-6 bg-fury-red/50 rounded-full animate-ping" />
          {/if}
        </div>
      </div>
    {/if}
  {/each}

  {#if gameState.playerAttacking === 'fury'}
    {@const mask = gameState.equippedMask
      ? MASK_DEFS.find((m) => m.id === gameState.equippedMask)
      : null}
    <div class="absolute inset-0 z-30 pointer-events-none">
      <div
        class="absolute inset-0 animate-pulse"
        style="background: radial-gradient(circle at center, {(mask?.furyColor ?? '#e63946')}66, transparent 70%);"
      />
    </div>
  {/if}

  <div class="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-sm border-t border-blue-800/30 p-2 sm:p-3">
    <div class="max-w-2xl mx-auto flex justify-center gap-1.5 sm:gap-2 flex-wrap">
      <button
        class="btn-interactive min-h-12 px-2.5 py-2 sm:px-3 sm:py-2.5 bg-emerald-600 hover:bg-teal-600 rounded-lg font-bold text-xs sm:text-sm text-white border border-teal-400/30 active:scale-95"
        onclick={() => game.lightAttack()}
        aria-label="Strike lightly (Z)"
      >
        ⚔️ Strike (Z)
      </button>
      <button
        class="btn-interactive min-h-12 px-2.5 py-2 sm:px-3 sm:py-2.5 bg-fury-red hover:bg-red-600 rounded-lg font-bold text-xs sm:text-sm text-white border border-red-400/30 active:scale-95"
        onclick={() => game.heavyAttack()}
        aria-label="Strike heavily (X)"
      >
        🔨 Smash (X)
      </button>
      <button
        class="btn-interactive min-h-12 px-2.5 py-2 sm:px-3 sm:py-2.5 bg-blue-800 hover:bg-blue-700 rounded-lg font-bold text-xs sm:text-sm text-white border border-blue-400/30 active:scale-95"
        onmousedown={() => game.startBlock()}
        onmouseup={() => game.stopBlock()}
        ontouchstart={() => game.startBlock()}
        ontouchend={() => game.stopBlock()}
        aria-label="Block (C)"
      >
        🛡️ Block (C)
      </button>
      <button
        class={dodgeBtnClass()}
        onclick={() => game.dodgeRoll()}
        disabled={gameState.dodgeCooldown > 0}
        aria-disabled={gameState.dodgeCooldown > 0}
        aria-label="Dodge roll (Space)"
      >
        {#if gameState.dodgeCooldown > 0}
          💨 {Math.ceil(game.dodgeCooldownPct * 100)}%
        {:else}
          💨 Dodge
        {/if}
      </button>
      <button
        class="btn-interactive min-h-12 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm border active:scale-95 {game.furyReady
          ? 'bg-fury-red hover:bg-red-600 text-white border-fury-gold fury-ready'
          : 'bg-gray-700 text-slate-300 border-gray-600 opacity-70 cursor-not-allowed'}"
        onclick={() => game.activateFury()}
        disabled={!game.furyReady}
        aria-disabled={!game.furyReady}
        aria-label="Activate Fiesta Fury"
      >
        🌶️ Fiesta Fury
      </button>
    </div>
  </div>
</div>

<style>
  .bg-gradient-radial {
    background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to));
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
