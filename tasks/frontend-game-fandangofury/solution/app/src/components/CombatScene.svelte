<script lang="ts">
  import { onMount } from 'svelte';
  import { game, gameState, STAGES, MASK_DEFS } from '../lib/game-store.svelte.ts';

  interface Props {
    screen: string;
    paused: boolean;
    onBossStart: () => void;
    onVictory: () => void;
    onDefeat: () => void;
  }

  let { screen, paused, onBossStart, onVictory, onDefeat }: Props = $props();

  let animFrame = 0;
  let arena: HTMLDivElement;

  function playerBodyClass(): string {
    const base =
      'w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-colors';
    if (gameState.playerHealth <= game.getMaxHealth() * 0.25 && gameState.playerHealth > 0) {
      return `${base} bg-red-700`;
    }
    return `${base} bg-emerald-600`;
  }

  function bossHealthBar(health: number, maxHealth: number): string {
    const pct = health / maxHealth;
    const base = 'h-full transition-all duration-300 rounded-full';
    if (pct <= 0.25 && health > 0) return `${base} bg-red-900 animate-pulse`;
    return `${base} bg-fury-red`;
  }

  function enemyHealthBar(health: number, maxHealth: number): string {
    const pct = health / maxHealth;
    const base = 'h-full transition-all duration-200 rounded-full';
    if (pct <= 0.25 && health > 0) return `${base} bg-red-900`;
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
    let bossAnnounced = false;

    function tick() {
      if (!paused && !gameState.paused && gameState.playerHealth > 0) {
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
      }
      bossAnnounced = gameState.isBoss;
      animFrame = requestAnimationFrame(tick);
    }

    animFrame = requestAnimationFrame(tick);

    function handleKey(e: KeyboardEvent) {
      // Combat keys are inert while paused or dead — stale input from a frozen
      // run (or a finished one) must never mutate Health, Fury, or waves.
      if (paused || gameState.playerHealth <= 0) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
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
      if (paused) return;
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

  const theme = $derived(game.theme);
  const furyColor = $derived(game.furyColor);
  const maskAura = $derived(
    MASK_DEFS.find((m) => gameState.ownedMasks.includes(m.id) && gameState.equippedMask === m.id)?.furyColor ?? null,
  );
</script>

<div
  bind:this={arena}
  class="combat-stage relative w-full h-screen overflow-hidden"
  aria-label="Combat stage"
>
  {#key gameState.shakeId}
  <div class="absolute inset-0 {gameState.shakeId > 0 ? 'screen-shake' : ''}">
  <!-- Per-stage festival-night arena (the palette shifts between stages) -->
  <div
    class="absolute inset-0 transition-colors duration-700"
    style="background: linear-gradient(to bottom, {theme.skyTop}, {theme.skyMid} 55%, {theme.skyBot});"
  >
    <!-- papel picado bunting -->
    <div class="absolute top-10 left-0 right-0 flex justify-around opacity-70 pointer-events-none">
      {#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
        <span
          class="inline-block w-5 h-4 rounded-b-full"
          style="background: {i % 2 ? theme.banner : theme.lantern}; transform: rotate({(i % 3) - 1}deg);"
        />
      {/each}
    </div>
    <!-- floating lanterns -->
    <div class="absolute top-16 left-[12%] w-3 h-4 rounded-full animate-pulse" style="background: {theme.lantern}; box-shadow: 0 0 18px {theme.lantern};" />
    <div class="absolute top-24 right-[18%] w-2.5 h-3.5 rounded-full animate-pulse" style="background: {theme.lantern}; box-shadow: 0 0 14px {theme.lantern};" />
    <div class="absolute top-20 left-[46%] w-2 h-3 rounded-full animate-pulse" style="background: {theme.banner}; box-shadow: 0 0 12px {theme.banner};" />
    <div class="absolute bottom-0 left-0 right-0 h-32" style="background: linear-gradient(to top, {theme.ground}, transparent);" />
    <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-900 to-stone-800/50" />
  </div>

  <div class="absolute top-16 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
    <div class="text-xs text-slate-300 uppercase tracking-wide">
      Stage {gameState.currentStage}: {STAGES[gameState.currentStage - 1]?.name ?? 'Arena'}
    </div>
  </div>

  <!-- Boss duel banner (animated entrance when the duel begins) -->
  {#if gameState.bossBanner}
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none boss-banner">
      <div class="text-3xl sm:text-4xl font-black text-fury-red drop-shadow-[0_2px_10px_rgba(230,57,70,0.6)] tracking-wide whitespace-nowrap">
        ⚔️ {gameState.bossBanner} ⚔️
      </div>
    </div>
  {/if}

  <div aria-live="polite" aria-atomic="true" class="sr-only-ff">{gameState.statusMessage}</div>

  <div class="absolute z-20" style="left: 80px; bottom: 110px;">
    <div class="relative">
      {#if maskAura}
        <div
          class="absolute -inset-3 rounded-2xl opacity-60 animate-pulse pointer-events-none"
          style="box-shadow: 0 0 22px {maskAura}, 0 0 8px {maskAura} inset; border: 1px solid {maskAura}80;"
        />
      {/if}
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
      <div class="absolute z-15 enemy-enter" style="left: {Math.max(130, enemy.x)}px; bottom: 110px;">
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
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 text-lg animate-bounce text-yellow-300">⚡ WIND-UP ⚡</div>
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

  <!-- Screen-wide Fiesta Fury special, colored by the equipped Mask -->
  {#if gameState.screenFuryActive}
    <div class="absolute inset-0 z-30 pointer-events-none">
      <div
        class="absolute inset-0 fury-burst"
        style="background: radial-gradient(circle at center, {furyColor}cc, {furyColor}33 45%, transparent 72%);"
      />
      <div
        class="absolute inset-0 fury-ring"
        style="border: 4px solid {furyColor}; box-shadow: 0 0 40px {furyColor} inset;"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-4xl sm:text-6xl font-black drop-shadow-lg" style="color: {furyColor};">💥 FIESTA FURY!</span>
      </div>
    </div>
  {/if}

  <!-- First-combat guided hint (non-blocking, fades away) -->
  {#if gameState.showCombatHint && !paused}
    <div class="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none hint-chip">
      <div class="bg-fury-dark/90 border border-fury-gold/40 rounded-xl px-3 py-2 text-xs text-slate-100 text-center max-w-[90vw]">
        Press <kbd class="px-1 bg-gray-800 rounded">Z</kbd> / <kbd class="px-1 bg-gray-800 rounded">X</kbd> to attack ·
        <kbd class="px-1 bg-gray-800 rounded">P</kbd> to pause
      </div>
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
        aria-label="Hold to block (C)"
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
          💨 {game.dodgeCooldownSeconds}s
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
        aria-label="Activate Fiesta Fury (F)"
      >
        🌶️ Fiesta Fury
      </button>
    </div>
  </div>
  </div>
  {/key}
</div>

<style>
  .sr-only-ff {
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
  .screen-shake {
    animation: arena-shake 0.3s ease-in-out;
  }
  @keyframes arena-shake {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(-5px, 2px); }
    40% { transform: translate(5px, -2px); }
    60% { transform: translate(-3px, 1px); }
    80% { transform: translate(3px, -1px); }
  }
  .boss-banner {
    animation: boss-banner-in 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes boss-banner-in {
    0% { opacity: 0; transform: translate(-50%, 0) scale(0.6); letter-spacing: 0.4em; }
    40% { opacity: 1; transform: translate(-50%, 0) scale(1.12); }
    100% { opacity: 1; transform: translate(-50%, 0) scale(1); letter-spacing: normal; }
  }
  .fury-burst {
    animation: fury-burst 1.2s ease-out forwards;
  }
  @keyframes fury-burst {
    0% { opacity: 0; transform: scale(0.4); }
    25% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.4); }
  }
  .fury-ring {
    border-radius: 9999px;
    animation: fury-ring 1.2s ease-out forwards;
  }
  @keyframes fury-ring {
    0% { opacity: 0; transform: scale(0.1); }
    30% { opacity: 1; }
    100% { opacity: 0; transform: scale(2.2); }
  }
  .hint-chip {
    animation: hint-pulse 2s ease-in-out infinite;
  }
  @keyframes hint-pulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; transform: translate(-50%, -2px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .screen-shake, .boss-banner, .fury-burst, .fury-ring, .hint-chip { animation: none; }
  }
</style>
