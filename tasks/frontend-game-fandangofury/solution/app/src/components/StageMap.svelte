<script lang="ts">
  import { game, gameState, STAGES } from '../lib/game-store.svelte.ts';

  interface Props {
    onStart: (stageId: number) => void;
    onResumeRun: () => void;
    onOpenShop: () => void;
    onOpenMasks: () => void;
    onOpenReset: () => void;
    onOpenExport: () => void;
    onOpenImport: () => void;
    onOpenSettings: () => void;
  }

  let {
    onStart,
    onResumeRun,
    onOpenShop,
    onOpenMasks,
    onOpenReset,
    onOpenExport,
    onOpenImport,
    onOpenSettings,
  }: Props = $props();

  function getNodeClass(stage: (typeof STAGES)[0]): string {
    const unlocked = gameState.unlockedStages.includes(stage.id);
    const completed = gameState.completedStages.includes(stage.id);
    const base =
      'relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 flex-shrink-0';
    if (completed) return `${base} bg-emerald-900/30 border-emerald-500 text-emerald-300 btn-interactive`;
    if (unlocked) return `${base} bg-blue-950/30 border-fury-orange text-fury-orange node-glow btn-interactive`;
    return `${base} bg-gray-800/50 border-gray-600 text-slate-300 opacity-60 cursor-not-allowed`;
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative">
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-fury-dark via-fury-darker to-blue-950/20" />
    <div class="absolute top-6 left-[10%] w-2 h-3 rounded-full bg-fury-orange/60 animate-pulse" />
    <div class="absolute top-10 right-[14%] w-2 h-3 rounded-full bg-fury-red/60 animate-pulse" />
  </div>

  <div class="relative z-10 w-full max-w-2xl">
    <div class="text-center mb-6 sm:mb-10">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
        <span class="text-fury-gold">Fandango</span><span class="text-fury-red">Fury</span>
      </h1>
      <p class="text-slate-300 mt-2 text-sm sm:text-base">
        Hack and slash through the festival town — Fighter:
        <span class="text-fury-gold font-bold">{gameState.fighterDisplayName || 'Fandango'}</span>
      </p>
    </div>

    <div class="mb-6 sm:mb-8">
      <h2 class="text-lg font-bold text-slate-100 mb-4 text-center">Stage Select</h2>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        {#each STAGES as stage, i}
          {#if i > 0}
            <div
              class="hidden sm:block w-8 h-0.5 {gameState.completedStages.includes(stage.id - 1)
                ? 'bg-emerald-500'
                : 'bg-gray-700'}"
              aria-hidden="true"
            />
            <div
              class="sm:hidden h-5 w-0.5 {gameState.completedStages.includes(stage.id - 1)
                ? 'bg-emerald-500'
                : 'bg-gray-700'}"
              aria-hidden="true"
            />
          {/if}
          <div class="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <button
              class={getNodeClass(stage)}
              onclick={() => gameState.unlockedStages.includes(stage.id) && onStart(stage.id)}
              disabled={!gameState.unlockedStages.includes(stage.id)}
              aria-label={gameState.unlockedStages.includes(stage.id)
                ? `Play ${stage.name}`
                : `${stage.name} locked`}
            >
              {#if gameState.completedStages.includes(stage.id)}
                <span class="text-lg sm:text-xl">✅</span>
              {:else if gameState.unlockedStages.includes(stage.id)}
                <span class="text-lg sm:text-xl">⚔️</span>
              {:else}
                <span class="text-lg sm:text-xl">🔒</span>
              {/if}
              <span class="mt-0.5 text-xs">{stage.id}</span>
            </button>
            <span class="text-[11px] sm:text-xs text-slate-300 text-center max-w-[120px] leading-tight">
              {stage.name}
            </span>
          </div>
        {/each}
      </div>
      <div class="text-center mt-3 text-xs sm:text-sm text-slate-200 min-h-[1.25rem]">
        {#each STAGES as stage}
          {#if gameState.unlockedStages.includes(stage.id) && !gameState.completedStages.includes(stage.id)}
            <span class="text-fury-orange font-semibold">{stage.name}</span> — {stage.waves} waves + boss {stage.bossName}
          {/if}
        {/each}
        {#if gameState.completedStages.length === STAGES.length}
          <span class="text-fury-gold font-bold">All stages complete!</span>
        {/if}
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5">
      <div class="flex items-center gap-2 bg-fury-dark/50 border border-yellow-500/20 rounded-lg px-3 py-2 min-h-12">
        <span class="text-lg" aria-hidden="true">💰</span>
        <span class="text-fury-gold font-bold">{gameState.pesos}</span>
        <span class="text-slate-300 text-xs">Pesos</span>
      </div>
      <div class="flex items-center gap-2 bg-fury-dark/50 border border-purple-500/20 rounded-lg px-3 py-2 min-h-12">
        <span class="text-lg" aria-hidden="true">🎭</span>
        <span class="text-purple-300 font-bold">{gameState.ownedMasks.length}</span>
        <span class="text-slate-300 text-xs">Masks</span>
      </div>
      {#if gameState.equippedMask}
        {@const eqMask = game.masks().find((m) => m.id === gameState.equippedMask)}
        {#if eqMask}
          <div class="flex items-center gap-2 bg-fury-dark/50 border border-yellow-500/30 rounded-lg px-3 py-2 min-h-12 mask-equipped">
            <span class="text-lg">{eqMask.emoji}</span>
            <span class="text-fury-gold font-bold text-xs">{eqMask.name}</span>
          </div>
        {/if}
      {/if}
    </div>

    <div class="flex flex-wrap justify-center gap-2 sm:gap-3">
      {#if gameState.checkpoint}
        <button
          class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold text-sm sm:text-base text-white border border-emerald-400/30"
          onclick={onResumeRun}
          aria-label="Resume run"
        >
          ▶️ Resume Run
        </button>
      {/if}
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-sm sm:text-base text-white border border-amber-400/30"
        onclick={onOpenShop}
        aria-label="Open Cantina"
      >
        🍺 Open Cantina
      </button>
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-bold text-sm sm:text-base text-white border border-purple-400/30"
        onclick={onOpenMasks}
        aria-label="Open Masks"
      >
        🎭 Open Masks
      </button>
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-bold text-sm sm:text-base text-white border border-teal-400/30"
        onclick={onOpenSettings}
        aria-label="Open Fighter Settings"
      >
        ⚙️ Fighter Settings
      </button>
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm sm:text-base text-white border border-purple-400/30"
        onclick={onOpenExport}
        aria-label="Export Campaign"
      >
        📤 Export Campaign
      </button>
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm sm:text-base text-white border border-blue-400/30"
        onclick={onOpenImport}
        aria-label="Import Campaign"
      >
        📥 Import Campaign
      </button>
      <button
        class="btn-interactive min-h-12 px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm sm:text-base text-slate-100 border border-gray-500/30"
        onclick={onOpenReset}
        aria-label="Reset Progress"
      >
        🗑️ Reset Progress
      </button>
    </div>

    {#if gameState.showMapHint}
      <div class="text-center mt-5 hint-chip">
        <span class="inline-block bg-fury-dark/80 border border-fury-gold/40 rounded-lg px-3 py-1.5 text-xs text-slate-100">
          💡 Select Stage 1 to begin your campaign. Use the Cantina to spend Pesos between runs.
        </span>
      </div>
    {/if}

    <div class="text-center mt-6 text-xs text-slate-300">
      <div class="flex flex-wrap justify-center gap-2 sm:gap-3">
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">Z</kbd> Light Strike</span>
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">X</kbd> Heavy Strike</span>
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">C</kbd> Block</span>
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">Space</kbd> Dodge</span>
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">F</kbd> Fiesta Fury</span>
        <span><kbd class="px-1.5 py-0.5 bg-gray-800 rounded text-slate-200">P</kbd> Pause</span>
      </div>
      <div class="mt-2 text-slate-400">Light + Light + Heavy = Fiesta Combo</div>
    </div>
  </div>
</div>

<style>
  .hint-chip {
    animation: hint-pulse 2.2s ease-in-out infinite;
  }
  @keyframes hint-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hint-chip { animation: none; }
  }
</style>
