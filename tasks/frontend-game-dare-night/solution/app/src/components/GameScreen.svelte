<script lang="ts">
  import type { Card } from '../lib/cards';
  import type { LiveEvent, StreamStatus } from '../lib/stream';
  import Scoreboard from './Scoreboard.svelte';
  import LiveEventPanel from './LiveEventPanel.svelte';

  interface ScoreEntry {
    name: string;
    points: number;
    forfeits: number;
  }

  interface Props {
    players: string[];
    currentPlayer: string;
    winner: string | null;
    sortedScores: ScoreEntry[];
    currentCard: Card | null;
    canUndo: boolean;
    reshuffleMessage: boolean;
    timerEnabled: boolean;
    timeLeft: number;
    bestRecord: { name: string; points: number } | null;
    streamStatus: StreamStatus;
    appliedEvents: LiveEvent[];
    bonuses: { name: string; bonus: number }[];
    offeredEvent: LiveEvent | null;
    deliveredCount: number;
    totalEvents: number;
    duplicatesIgnored: number;
    onDrawCard: () => void;
    onDone: () => void;
    onSkip: () => void;
    onUndo: () => void;
    onNewGame: () => void;
    onStreamStart: () => void;
    onStreamPause: () => void;
    onStreamReconnect: () => void;
    onStreamDeliverOutOfOrder: () => void;
    onExportSession?: () => void;
    onCopySession?: () => void;
    onSaveProgress?: () => void;
    turnLogCount?: number;
  }

  let {
    players,
    currentPlayer,
    winner,
    sortedScores,
    currentCard,
    canUndo,
    reshuffleMessage,
    timerEnabled,
    timeLeft,
    bestRecord,
    streamStatus,
    appliedEvents,
    bonuses,
    offeredEvent,
    deliveredCount,
    totalEvents,
    duplicatesIgnored,
    onDrawCard,
    onDone,
    onSkip,
    onUndo,
    onNewGame,
    onStreamStart,
    onStreamPause,
    onStreamReconnect,
    onStreamDeliverOutOfOrder,
    onExportSession,
    onCopySession,
    onSaveProgress,
    turnLogCount = 0,
  }: Props = $props();

  let showScoreboard = $state(false);
  let closeScoreboard = () => { showScoreboard = false; };

  function getCategoryBadgeClass(category: string): string {
    const cls: Record<string, string> = {
      'Icebreaker': 'bg-blue-500 text-white',
      'Truth': 'bg-teal-500 text-white',
      'Dare': 'bg-orange-500 text-white',
      'Wild': 'bg-fuchsia-500 text-white',
    };
    return cls[category] ?? 'bg-gray-500 text-white';
  }

  function getIntensityBadgeClass(intensity: string): string {
    const cls: Record<string, string> = {
      'Mild': 'bg-green-500 text-white',
      'Spicy': 'bg-amber-500 text-white',
      'Wild': 'bg-red-500 text-white',
    };
    return cls[intensity] ?? 'bg-gray-500 text-white';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showScoreboard) {
      closeScoreboard();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen p-4 flex flex-col" style="background-color: var(--color-bg);">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4 max-w-lg mx-auto w-full">
    <button
      class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      onclick={onNewGame}
    >
      Start new game
    </button>
    <div class="flex items-center gap-2">
      {#if bestRecord}
        <span class="text-xs text-black hidden sm:inline"><span aria-hidden="true">🏆</span> {bestRecord.name}: {bestRecord.points}</span>
      {/if}
      <button
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style="background-color: var(--color-accent); color: var(--color-text-inverse);"
        onclick={() => { showScoreboard = !showScoreboard; }}
      >
        View scores
      </button>
    </div>
  </div>

  <!-- Current Player -->
  <div class="text-center mb-4 max-w-lg mx-auto w-full">
    {#if winner}
      <p class="text-black text-sm mb-1">Game finished</p>
      <h2 class="text-2xl font-bold" style="color: var(--color-accent);" role="status" aria-live="polite">Winner — {winner}</h2>
    {:else}
      <p class="text-black text-sm mb-1">Current turn</p>
      <h2 class="text-2xl font-bold" style="color: var(--color-accent);">{currentPlayer}'s turn</h2>
    {/if}
  </div>

  <!-- Reshuffle Message -->
  {#if reshuffleMessage}
    <div class="text-center mb-2 max-w-lg mx-auto w-full">
      <span class="inline-block px-4 py-1 rounded-full text-white text-sm font-medium" style="background-color: var(--color-accent);">
        <span aria-hidden="true">🔄</span> Deck reshuffled!
      </span>
    </div>
  {/if}

  <!-- Card Area -->
  <div class="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
    {#if winner}
      <div class="bg-white rounded-xl p-10 mb-6 text-center shadow-2xl w-full" style="border: 3px solid var(--color-accent);">
        <span class="text-5xl" aria-hidden="true">🏆</span>
        <p class="text-2xl font-bold mt-3" style="color: var(--color-accent);">{winner} wins Dare Night!</p>
        <p class="text-black mt-2">First to 10</p>
      </div>
    {:else if currentCard}
      <!-- Card Display -->
      {#key currentCard.id}
        <div
          class="card-flip bg-white rounded-xl p-8 shadow-2xl w-full mb-6 min-h-[200px] flex flex-col items-center justify-center relative"
          style="border-radius: 10px;"
        >
          <!-- Category Badge -->
          <div class="flex items-center gap-2 mb-4">
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide {getCategoryBadgeClass(currentCard.category)}">
              {currentCard.category}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide {getIntensityBadgeClass(currentCard.intensity)}">
              {currentCard.intensity}
            </span>
          </div>

          <!-- Prompt Text -->
          <p class="text-lg font-medium text-center leading-relaxed" style="color: var(--color-text-primary); font-size: 18px;">
            {currentCard.prompt}
          </p>
        </div>
      {/key}

      <!-- Timer -->
      {#if timerEnabled}
        <div class="text-center mb-4">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full" style="background-color: var(--color-accent);">
            <span class="text-sm text-white font-medium" aria-hidden="true">⏱️</span>
            <span class="text-lg font-bold {timeLeft <= 5 ? 'timer-warning' : ''}" style="color: var(--color-text-inverse);">
              {timeLeft}s
            </span>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex gap-3 w-full max-w-xs">
        <button
          class="flex-1 px-6 py-4 rounded-full font-bold text-black text-base bg-white border-2 border-black transition-all shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          onclick={onSkip}
        >
          Skip
        </button>
        <button
          class="flex-1 px-6 py-4 rounded-full font-bold text-white text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          style="background-color: var(--color-accent);"
          onclick={onDone}
        >
          Done
        </button>
      </div>
    {:else}
      <!-- No Card - Draw Prompt -->
      <div class="flex flex-col items-center justify-center py-10 w-full">
        <div class="bg-white/20 rounded-xl p-10 mb-6 text-center">
          <span class="text-5xl" aria-hidden="true">🃏</span>
          <p class="text-black mt-3 text-sm">Tap to draw your next card</p>
        </div>
        <button
          class="px-10 py-4 rounded-full font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          style="background-color: var(--color-accent);"
          onclick={onDrawCard}
        >
          Draw card
        </button>
      </div>
    {/if}
  </div>

  <!-- Undo Button -->
  <div class="text-center pb-4 max-w-lg mx-auto w-full">
    {#if canUndo && !winner}
      <button
        class="px-6 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        style="background-color: white; color: black; border: 2px solid black;"
        onclick={onUndo}
      >
        <span aria-hidden="true">↩</span> Undo last turn
      </button>
    {/if}
  </div>

  <!-- Session Controls -->
  <div class="flex gap-4 justify-center pb-6 max-w-lg mx-auto w-full flex-wrap">
    <button
      class="px-6 py-2 rounded-full text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black shadow-md"
      style="background-color: #1a202c;"
      onclick={onExportSession}
    >
      Export Session
    </button>
    <button
      class="px-6 py-2 rounded-full text-sm font-medium bg-white text-black border-2 border-black transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
      onclick={onCopySession}
    >
      Copy Session JSON
    </button>
    <button
      class="px-6 py-2 rounded-full text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      style="background-color: #1a202c;"
      onclick={onSaveProgress}
      disabled={turnLogCount === 0 || !!winner}
    >
      Save Progress
    </button>
  </div>

  <!-- Live Event Feed -->
  <div class="max-w-lg mx-auto w-full pb-6">
    <LiveEventPanel
      status={streamStatus}
      appliedEvents={appliedEvents}
      bonuses={bonuses}
      offeredEvent={offeredEvent}
      deliveredCount={deliveredCount}
      totalEvents={totalEvents}
      duplicatesIgnored={duplicatesIgnored}
      onStart={onStreamStart}
      onPause={onStreamPause}
      onReconnect={onStreamReconnect}
      onDeliverOutOfOrder={onStreamDeliverOutOfOrder}
    />
  </div>

  <!-- Scoreboard Slide-over -->
  {#if showScoreboard}
    <div class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="scoreboard-title">
      <button class="absolute inset-0 bg-black/30" onclick={closeScoreboard} aria-label="Close scoreboard"></button>
      <div class="relative w-full max-w-sm bg-white rounded-l-xl shadow-2xl p-6 overflow-y-auto z-50">
        <div class="flex items-center justify-between mb-6">
          <h2 id="scoreboard-title" class="text-xl font-semibold" style="color: var(--color-accent);">Scoreboard</h2>
          <button
            class="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            onclick={closeScoreboard}
            aria-label="Close scoreboard"
          >
            ✕
          </button>
        </div>
        <Scoreboard sortedScores={sortedScores} {winner} />
      </div>
    </div>
  {/if}
</div>
