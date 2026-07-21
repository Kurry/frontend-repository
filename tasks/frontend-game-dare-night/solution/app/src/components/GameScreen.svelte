<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly, scale } from 'svelte/transition';
  import {
    Cards, Check, SkipForward, ArrowCounterClockwise, Trophy, ArrowClockwise,
    ChartBar, DownloadSimple, CopySimple, FloppyDisk, PlayCircle, Target, X,
  } from 'phosphor-svelte';
  import type { Card } from '../lib/cards';
  import type { LiveEvent, StreamStatus } from '../lib/stream';
  import { motionMs } from '../lib/motion';
  import Scoreboard from './Scoreboard.svelte';
  import LiveEventPanel from './LiveEventPanel.svelte';

  interface ScoreEntry { name: string; points: number; forfeits: number }
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
    hasCheckpoint: boolean;
    streamStatus: StreamStatus;
    appliedEvents: LiveEvent[];
    bonuses: { name: string; bonus: number }[];
    offeredEvent: LiveEvent | null;
    deliveredCount: number;
    totalEvents: number;
    duplicatesIgnored: number;
    turnLogCount: number;
    onDrawCard: () => void;
    onDone: () => void;
    onSkip: () => void;
    onUndo: () => void;
    onNewGame: () => void;
    onStreamStart: () => void;
    onStreamPause: () => void;
    onStreamReconnect: () => void;
    onStreamDeliverOutOfOrder: () => void;
    onExportSession: () => void;
    onCopySession: () => void;
    onSaveProgress: () => void;
    onResumeSavedSession: () => void;
  }
  let {
    players, currentPlayer, winner, sortedScores, currentCard, canUndo, reshuffleMessage,
    timerEnabled, timeLeft, bestRecord, hasCheckpoint, streamStatus, appliedEvents, bonuses,
    offeredEvent, deliveredCount, totalEvents, duplicatesIgnored, turnLogCount,
    onDrawCard, onDone, onSkip, onUndo, onNewGame, onStreamStart, onStreamPause,
    onStreamReconnect, onStreamDeliverOutOfOrder, onExportSession, onCopySession,
    onSaveProgress, onResumeSavedSession,
  }: Props = $props();

  let showScoreboard = $state(false);

  function categoryBadge(category: string): string {
    const m: Record<string, string> = { Icebreaker: 'bg-blue-500 text-white', Truth: 'bg-teal-500 text-white', Dare: 'bg-orange-500 text-white', Wild: 'bg-fuchsia-500 text-white' };
    return m[category] ?? 'bg-gray-500 text-white';
  }
  function intensityBadge(intensity: string): string {
    const m: Record<string, string> = { Mild: 'bg-green-500 text-white', Spicy: 'bg-amber-500 text-white', Wild: 'bg-red-500 text-white' };
    return m[intensity] ?? 'bg-gray-500 text-white';
  }
</script>

<svelte:window onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape' && showScoreboard) showScoreboard = false; }} />

<main class="min-h-screen p-5 flex flex-col gap-5" style="background-color: var(--color-bg);">
  <!-- Header -->
  <header class="flex items-center justify-between gap-2.5 max-w-lg mx-auto w-full">
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-sm font-semibold border-2 border-black hover:bg-gray-50 transition-colors" onclick={onNewGame}>
      <ArrowClockwise size={18} weight="bold" aria-hidden="true" /> Start new game
    </button>
    <div class="flex items-center gap-2.5">
      <span class="inline-flex items-center gap-2.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-white text-black"><Target size={14} weight="bold" aria-hidden="true" /> First to 10</span>
      {#if bestRecord}<span class="hidden sm:inline-flex items-center gap-2.5 text-xs text-black"><Trophy size={14} weight="fill" aria-hidden="true" /> {bestRecord.name}: {bestRecord.points}</span>{/if}
      <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors" style="background-color: var(--color-accent); color: var(--color-text-inverse);" onclick={() => { showScoreboard = !showScoreboard; }}>
        <ChartBar size={18} weight="bold" aria-hidden="true" /> View scores
      </button>
    </div>
  </header>

  <!-- Turn / Winner indicator -->
  <div class="text-center max-w-lg mx-auto w-full">
    {#if winner}
      <p class="text-black text-sm mb-1">Game finished</p>
      <h2 class="text-2xl font-bold" style="color: var(--color-accent);">{winner}'s turn is over</h2>
    {:else}
      <p class="text-black text-sm mb-1">Current turn</p>
      <h2 class="text-2xl font-bold" style="color: var(--color-accent);">{currentPlayer}'s turn</h2>
    {/if}
  </div>

  {#if reshuffleMessage}
    <div class="text-center max-w-lg mx-auto w-full" role="status" aria-live="polite">
      <span class="inline-flex items-center gap-2.5 px-5 py-1 rounded-full text-white text-sm font-semibold" style="background-color: var(--color-accent);">
        <Cards size={16} weight="bold" aria-hidden="true" /> Deck reshuffled
      </span>
    </div>
  {/if}

  <!-- Inline progress readout (re-sorts with FLIP on standings change — 1.20 / 3.4) -->
  <section class="max-w-lg mx-auto w-full bg-white rounded-[10px] p-5 shadow-lg" aria-label="Scoreboard progress toward 10">
    <div class="flex items-center justify-between mb-2.5">
      <h2 class="text-base font-semibold" style="color: var(--color-accent);">Standings</h2>
      <span class="text-xs text-gray-600">{winner ? `${winner} wins` : 'progress to 10'}</span>
    </div>
    <ol class="space-y-2.5">
      {#each sortedScores as entry, i (entry.name)}
        <li animate:flip={{ duration: motionMs(300) }} class="rounded-[10px] p-2.5 {entry.name === winner ? 'bg-amber-100 ring-2 ring-amber-400' : entry.name === currentPlayer ? 'bg-cyan-50 ring-2 ring-cyan-300' : 'bg-gray-50'}">
          <div class="flex items-center justify-between gap-2.5 mb-1">
            <span class="text-sm font-semibold truncate {entry.name === winner ? 'text-amber-800' : 'text-black'}">
              <span class="text-gray-400 mr-1">{i + 1}.</span>{entry.name}
              {#if entry.name === winner}<Trophy size={14} weight="fill" class="inline -mt-0.5" aria-hidden="true" /> Winner{/if}
              {#if entry.name === currentPlayer && !winner}<span class="ml-1 text-xs text-cyan-700">(turn)</span>{/if}
            </span>
            <span class="text-sm tabular-nums"><strong class="text-green-600">{entry.points}</strong><span class="text-gray-400">/10</span> · <span class="text-red-500">{entry.forfeits}</span> skip</span>
          </div>
          <div class="h-2.5 rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={entry.points} aria-valuemin={0} aria-valuemax={10} aria-label={`${entry.name} points`}>
            <div class="h-full rounded-full transition-[width] duration-300" style="width: {Math.min(100, entry.points * 10)}%; background-color: {entry.name === winner ? '#F59E0B' : 'var(--color-accent)'};"></div>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- Card area / Winner banner -->
  <section class="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
    {#if winner}
      <div class="winner-pop bg-white rounded-[10px] p-5 mb-5 text-center shadow-2xl w-full" style="border: 3px solid var(--color-accent);" role="status" aria-live="polite" aria-atomic="true">
        <Trophy size={48} weight="fill" class="mx-auto" style="color: var(--color-accent);" aria-hidden="true" />
        <p class="text-2xl font-bold mt-2.5" style="color: var(--color-accent);">{winner} wins Dare Night!</p>
        <p class="text-black mt-2.5">First to 10 — a decided outcome from play.</p>
      </div>
    {:else if currentCard}
      {#key currentCard.id}
        <div class="card-flip bg-white rounded-[10px] p-5 shadow-2xl w-full mb-5 min-h-[200px] flex flex-col items-center justify-center relative">
          <div class="flex items-center gap-2.5 mb-2.5">
            <span class="px-2.5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide {categoryBadge(currentCard.category)}">{currentCard.category}</span>
            <span class="px-2.5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide {intensityBadge(currentCard.intensity)}">{currentCard.intensity}</span>
          </div>
          <p class="text-lg font-medium text-center leading-relaxed" style="color: var(--color-text-primary); font-size: 18px;">{currentCard.prompt}</p>
        </div>
      {/key}

      {#if timerEnabled}
        <div class="text-center mb-5">
          <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full" style="background-color: var(--color-accent);">
            <span class="text-lg font-bold tabular-nums {timeLeft <= 5 ? 'timer-warning' : ''}" style="color: var(--color-text-inverse);" aria-live="off">{timeLeft}s</span>
          </div>
        </div>
      {/if}

      <div class="flex gap-2.5 w-full max-w-xs">
        <button class="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-5 rounded-full font-bold text-black text-base bg-white border-2 border-black transition-all shadow-md hover:shadow-xl active:scale-[0.98]" onclick={onSkip}><SkipForward size={20} weight="bold" aria-hidden="true" /> Skip</button>
        <button class="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-5 rounded-full font-bold text-white text-base transition-all shadow-lg hover:shadow-xl active:scale-[0.98]" style="background-color: var(--color-accent);" onclick={onDone}><Check size={20} weight="bold" aria-hidden="true" /> Done</button>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center py-10 w-full">
        <div class="bg-white/30 rounded-[10px] p-5 mb-5 text-center">
          <Cards size={44} weight="duotone" class="mx-auto" style="color: var(--color-accent);" aria-hidden="true" />
          <p class="text-black mt-2.5 text-sm">Select Draw card to reveal the next card for {currentPlayer}.</p>
        </div>
        <button class="inline-flex items-center gap-2.5 px-10 py-5 rounded-full font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98]" style="background-color: var(--color-accent);" onclick={onDrawCard}><Cards size={22} weight="bold" aria-hidden="true" /> Draw card</button>
      </div>
    {/if}
  </section>

  <!-- Undo -->
  {#if canUndo && !winner}
    <div class="text-center max-w-lg mx-auto w-full">
      <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50" onclick={onUndo}><ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" /> Undo last turn</button>
    </div>
  {/if}

  <!-- Session controls -->
  <div class="flex gap-2.5 justify-center max-w-lg mx-auto w-full flex-wrap">
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90" style="background-color: #1a202c;" onclick={onExportSession}><DownloadSimple size={18} weight="bold" aria-hidden="true" /> Export Session</button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50" onclick={onCopySession}><CopySimple size={18} weight="bold" aria-hidden="true" /> Copy Session JSON</button>
    <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style="background-color: #1a202c;" onclick={onSaveProgress} disabled={turnLogCount === 0 || !!winner} aria-disabled={turnLogCount === 0 || !!winner}><FloppyDisk size={18} weight="bold" aria-hidden="true" /> Save Progress</button>
  </div>

  {#if hasCheckpoint}
    <div class="text-center max-w-lg mx-auto w-full">
      <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black transition-colors hover:bg-gray-50" onclick={onResumeSavedSession}><PlayCircle size={18} weight="bold" aria-hidden="true" /> Resume Saved Session</button>
      <p class="text-xs text-black/70 mt-1">Restore your last saved checkpoint.</p>
    </div>
  {/if}

  <!-- Live event feed -->
  <aside class="max-w-lg mx-auto w-full" aria-label="Live event feed">
    <LiveEventPanel status={streamStatus} {appliedEvents} {bonuses} {offeredEvent} {deliveredCount} {totalEvents} {duplicatesIgnored} onStart={onStreamStart} onPause={onStreamPause} onReconnect={onStreamReconnect} onDeliverOutOfOrder={onStreamDeliverOutOfOrder} />
  </aside>

  <!-- Scoreboard slide-over -->
  {#if showScoreboard}
    <div class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="scoreboard-title" transition:scale={{ start: 0.98, duration: motionMs(180) }}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <button class="absolute inset-0 dialog-backdrop" style="background-color: rgba(0,0,0,0.35);" onclick={() => (showScoreboard = false)} aria-label="Close scoreboard"></button>
      <div class="relative w-full max-w-sm bg-white rounded-l-[10px] shadow-2xl p-5 overflow-y-auto z-50">
        <div class="flex items-center justify-between mb-5">
          <h2 id="scoreboard-title" class="text-xl font-semibold" style="color: var(--color-accent);">Scoreboard</h2>
          <button class="p-2.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" onclick={() => (showScoreboard = false)} aria-label="Close scoreboard"><X size={18} weight="bold" /></button>
        </div>
        <Scoreboard {sortedScores} {winner} />
      </div>
    </div>
  {/if}
</main>
