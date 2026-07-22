<script lang="ts">
  import { Plus, X, Trophy, DownloadSimple, CopySimple, UploadSimple, PlayCircle, Timer, Target } from 'phosphor-svelte';
  import type { Card, Category, Intensity } from '../lib/cards';
  import CustomCards from './CustomCards.svelte';

  interface Props {
    bestRecord: { name: string; points: number } | null;
    selectedCategories: Category[];
    selectedIntensity: Intensity;
    customCards: Card[];
    timerEnabled: boolean;
    showDeleteConfirm: string | null;
    playerNames: string[];
    newPlayerInput: string;
    playerError: string;
    categoryError: string;
    startAttempted: boolean;
    canStart: boolean;
    hasCheckpoint: boolean;
    onNewPlayerInput: (v: string) => void;
    onAddPlayer: (name: string) => void;
    onRemovePlayer: (index: number) => void;
    onUpdatePlayerName: (index: number, value: string) => void;
    onToggleCategory: (cat: Category) => void;
    onSetCategories: (cats: Category[]) => void;
    onUpdateIntensity: (int: Intensity) => void;
    onStartGame: () => void;
    onToggleTimer: () => void;
    onAddCustomCard: (data: { prompt: string; category: Category; intensity: Intensity }) => void;
    onShowDeleteConfirm: (id: string | null) => void;
    onExportSession: () => void;
    onCopySession: () => void;
    onImportSession: () => void;
    onImportFile?: (e: Event) => void;
    onResumeSavedSession: () => void;
  }
  let {
    bestRecord, selectedCategories, selectedIntensity, customCards, timerEnabled, showDeleteConfirm,
    playerNames, newPlayerInput, playerError, categoryError, startAttempted, canStart, hasCheckpoint,
    onNewPlayerInput, onAddPlayer, onRemovePlayer, onUpdatePlayerName, onToggleCategory, onSetCategories,
    onUpdateIntensity, onStartGame, onToggleTimer, onAddCustomCard, onShowDeleteConfirm,
    onExportSession, onCopySession, onImportSession, onResumeSavedSession,
  }: Props = $props();

  const categories: Category[] = ['Icebreaker', 'Truth', 'Dare', 'Wild'];
  const intensities: Intensity[] = ['Mild', 'Spicy', 'Wild'];

  const catColor: Record<Category, { sel: string; idle: string }> = {
    Icebreaker: { sel: 'bg-blue-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-blue-400' },
    Truth: { sel: 'bg-teal-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-teal-400' },
    Dare: { sel: 'bg-orange-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-orange-400' },
    Wild: { sel: 'bg-fuchsia-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-fuchsia-400' },
  };
  const intColor: Record<Intensity, { sel: string; idle: string }> = {
    Mild: { sel: 'bg-green-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-green-400' },
    Spicy: { sel: 'bg-amber-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-amber-400' },
    Wild: { sel: 'bg-red-500 text-white', idle: 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400' },
  };

  let validPlayers = $derived(playerNames.map(n => n.trim()).filter(Boolean));
  let rosterFull = $derived(validPlayers.length >= 8);
  let newTrimmed = $derived(newPlayerInput.trim());
  let addDisabled = $derived(
    newTrimmed.length < 1 || newTrimmed.length > 20 || rosterFull ||
    validPlayers.map(n => n.toLowerCase()).includes(newTrimmed.toLowerCase())
  );
  // Live inline error for the Add field so an invalid entry is never only a
  // silently-disabled button (criterion 1.38 / 4.n1 / edge-case duplicate).
  let addError = $derived(
    newPlayerInput.length === 0 ? '' :
    newTrimmed.length < 1 ? 'Field name is required — enter 1 to 20 characters' :
    newTrimmed.length > 20 ? 'Field name must be 1 to 20 characters' :
    (newTrimmed.length > 0 && validPlayers.map(n => n.toLowerCase()).includes(newTrimmed.toLowerCase())) ? `Field name must be unique — "${newTrimmed}" is already in the roster` : ''
  );

  function fieldIssue(value: string): string {
    const t = value.trim();
    if (value.length > 0 && t.length < 1) return 'Field name is required — enter 1 to 20 characters';
    if (value.length > 0 && t.length > 20) return 'Field name must be 1 to 20 characters';
    return '';
  }
</script>

<main class="min-h-screen p-5 flex flex-col items-center" style="background-color: var(--color-bg);">
  <div class="w-full max-w-lg mx-auto">
    <!-- Header -->
    <header class="text-center mb-5 mt-5">
      <h1 class="text-4xl font-bold mb-2.5" style="color: var(--color-accent);">Dare Night</h1>
      <p class="inline-block rounded-full px-5 py-1 text-sm" style="color: var(--color-link); background-color: var(--color-accent);">A pass-the-device party game for friends</p>
      <div class="mt-2.5 flex flex-wrap items-center justify-center gap-2.5">
        <span class="inline-flex items-center gap-2.5 rounded-full px-5 py-1 text-sm font-semibold bg-white text-black">
          <Target size={16} weight="bold" aria-hidden="true" /> First to 10
        </span>
        {#if bestRecord}
          <span class="inline-flex items-center gap-2.5 rounded-full px-5 py-1 text-sm bg-white text-black">
            <Trophy size={16} weight="fill" aria-hidden="true" />
            <span><strong>Dare Night record:</strong> {bestRecord.name} — {bestRecord.points} pts</span>
          </span>
        {/if}
      </div>
    </header>

    <!-- Players -->
    <section class="bg-white rounded-[10px] p-5 mb-5 shadow-lg" role="form" aria-labelledby="players-heading">
      <h2 id="players-heading" class="text-lg font-semibold mb-2.5" style="color: var(--color-accent);">Players (2–8)</h2>

      <div class="space-y-2.5 mb-2.5">
        {#each playerNames as name, index}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1" for="player-{index}">Player {index + 1} name</label>
            <div class="flex items-center gap-2.5">
              <input
                id="player-{index}"
                type="text"
                class="min-w-0 flex-1 px-5 py-2.5 rounded-full border-2 text-sm transition-colors {fieldIssue(name) ? 'border-red-500' : 'border-gray-500'}"
                placeholder="Player {index + 1} name"
                value={playerNames[index]}
                oninput={(e) => onUpdatePlayerName(index, (e.currentTarget as HTMLInputElement).value)}
              />
              {#if playerNames.length > 2}
                <button class="p-2.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" onclick={() => onRemovePlayer(index)} aria-label={`Remove player ${index + 1}`}><X size={18} weight="bold" /></button>
              {/if}
            </div>
            {#if fieldIssue(name)}<p class="text-red-600 text-xs mt-1" role="alert">{fieldIssue(name)}</p>{/if}
          </div>
        {/each}
      </div>

      <!-- Add row (always visible; refused with an explanation when the roster is full) -->
      <label class="block text-xs font-medium text-gray-700 mb-1" for="add-player">Another player</label>
      <div class="flex gap-2.5 mb-2.5 min-w-0">
        <input
          id="add-player"
          type="text"
          class="min-w-0 flex-1 px-5 py-2.5 rounded-full border-2 text-sm transition-colors {newPlayerInput.length > 0 && (newTrimmed.length > 20) ? 'border-red-500' : 'border-gray-500'}"
          placeholder={rosterFull ? 'Roster full (8 max)' : 'Add another player…'}
          value={newPlayerInput}
          oninput={(e) => onNewPlayerInput((e.currentTarget as HTMLInputElement).value)}
          onkeydown={(e) => { if (e.key === 'Enter' && !addDisabled) onAddPlayer(newPlayerInput); }}
          disabled={rosterFull}
        />
        <button
          class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style="background-color: var(--color-accent);"
          onclick={() => { if (!addDisabled) onAddPlayer(newPlayerInput); }}
          aria-disabled={addDisabled}
        >
          <Plus size={18} weight="bold" aria-hidden="true" /> Add
        </button>
      </div>
      {#if rosterFull}
        <p class="text-gray-600 text-xs" role="status">Roster is full — Dare Night supports up to 8 players.</p>
      {:else if addError}
        <p class="text-red-600 text-xs" role="alert">{addError}</p>
      {/if}

      {#if playerError}
        <p class="text-red-600 text-xs mt-2.5" role="alert">{playerError}</p>
      {/if}
    </section>

    <!-- Categories -->
    <section class="bg-white rounded-[10px] p-5 mb-5 shadow-lg">
      <div class="flex items-center justify-between gap-2.5 mb-2.5">
        <div>
          <h2 class="text-lg font-semibold" style="color: var(--color-accent);">Categories</h2>
          <p class="text-xs text-gray-600">{selectedCategories.length} selected</p>
        </div>
        <button class="px-5 py-2.5 rounded-full text-sm font-medium bg-white text-black border-2 border-black transition-all hover:bg-gray-50" onclick={() => onSetCategories(selectedCategories.length > 0 ? [] : [...categories])}>
          {selectedCategories.length > 0 ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div class="flex flex-wrap gap-2.5 mb-2.5">
        {#each categories as cat}
          <button
            class="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 {catColor[cat][selectedCategories.includes(cat) ? 'sel' : 'idle']}"
            onclick={() => onToggleCategory(cat)}
            aria-pressed={selectedCategories.includes(cat)}
          >
            {cat}
          </button>
        {/each}
      </div>
      {#if selectedCategories.length === 0}
        <p class="text-red-600 text-xs mt-2.5" role="alert">Select at least one category to build a deck.</p>
      {/if}
      {#if categoryError}<p class="text-red-600 text-xs mt-2.5" role="alert">{categoryError}</p>{/if}
    </section>

    <!-- Intensity -->
    <section class="bg-white rounded-[10px] p-5 mb-5 shadow-lg">
      <h2 class="text-lg font-semibold mb-2.5" style="color: var(--color-accent);">Intensity</h2>
      <div class="flex gap-2.5">
        {#each intensities as intensity}
          <button
            class="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 {intColor[intensity][selectedIntensity === intensity ? 'sel' : 'idle']}"
            onclick={() => onUpdateIntensity(intensity)}
            aria-pressed={selectedIntensity === intensity}
          >
            {intensity}
          </button>
        {/each}
      </div>
      <p class="text-xs text-gray-600 mt-2.5">Wild intensity weights the deck toward Wild-tagged cards.</p>
    </section>

    <!-- Timer -->
    <section class="bg-white rounded-[10px] p-5 mb-5 shadow-lg">
      <h2 class="text-lg font-semibold mb-2.5" style="color: var(--color-accent);">Round timer</h2>
      <div class="flex items-center justify-between gap-2.5">
        <p class="inline-flex items-center gap-2.5 text-gray-700 text-sm"><Timer size={18} weight="bold" aria-hidden="true" /> 15-second countdown per card</p>
        <button class="timer-switch relative inline-flex w-[50px] rounded-full transition-colors duration-200" style={timerEnabled ? 'background-color: var(--color-accent);' : 'background-color: #6B7280;'} onclick={onToggleTimer} role="switch" aria-checked={timerEnabled} aria-label="Round timer">
          <span class="absolute top-2.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200" style={timerEnabled ? 'transform: translateX(26px);' : ''}></span>
        </button>
      </div>
    </section>

    <!-- Custom cards -->
    <aside class="bg-white rounded-[10px] p-5 mb-5 shadow-lg" aria-label="Custom card editor">
      <CustomCards {customCards} {showDeleteConfirm} onAddCard={onAddCustomCard} onShowDeleteConfirm={onShowDeleteConfirm} />
    </aside>

    <!-- Session transfer -->
    <section class="bg-white rounded-[10px] p-5 mb-5 shadow-lg">
      <h2 class="text-lg font-semibold mb-2.5" style="color: var(--color-accent);">Session</h2>
      <div class="flex flex-wrap gap-2.5">
        <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-black text-white border-2 border-black transition-all hover:bg-gray-800" onclick={onExportSession}><DownloadSimple size={18} weight="bold" aria-hidden="true" /> Export Session</button>
        <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black transition-all hover:bg-gray-50" onclick={onCopySession}><CopySimple size={18} weight="bold" aria-hidden="true" /> Copy Session JSON</button>
        <button class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-black border-2 border-black transition-all hover:bg-gray-50" onclick={onImportSession}><UploadSimple size={18} weight="bold" aria-hidden="true" /> Import Session</button>
      </div>
    </section>

    <!-- Start / Resume -->
    <button
      class="w-full inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-full text-lg font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98] {!canStart ? 'opacity-40 cursor-not-allowed' : ''}"
      style="background-color: var(--color-accent);"
      aria-disabled={!canStart}
      onclick={onStartGame}
    >
      <PlayCircle size={20} weight="bold" aria-hidden="true" /> Start game
    </button>

    {#if hasCheckpoint}
      <div class="mt-5 rounded-[10px] bg-white p-5 shadow-lg">
        <p class="text-xs text-gray-600 mb-2.5">We found a saved checkpoint from your last session. Resume it to pick up the same players, scores, and current turn — or start a brand new game above.</p>
        <button class="w-full inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-full text-lg font-bold bg-white text-black border-2 border-black transition-all shadow-md hover:shadow-xl active:scale-[0.98]" onclick={onResumeSavedSession}>
          <PlayCircle size={20} weight="bold" aria-hidden="true" /> Resume Saved Session
        </button>
      </div>
    {/if}

    {#if !canStart && startAttempted}
      <p class="text-center text-red-600 text-xs mt-2.5 font-medium" role="alert">
        {#if validPlayers.length < 2}Add at least 2 unique player names to start.
        {:else if selectedCategories.length === 0}Select at least one category to start.{/if}
      </p>
    {/if}
  </div>
</main>
