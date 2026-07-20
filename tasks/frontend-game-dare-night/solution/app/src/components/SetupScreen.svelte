<script lang="ts">
  import { type Category, type Intensity } from '../lib/cards';
  import CustomCards from './CustomCards.svelte';

  interface Props {
    bestRecord: { name: string; points: number } | null;
    selectedCategories: Category[];
    selectedIntensity: Intensity;
    customCards: import('../lib/cards').Card[];
    timerEnabled: boolean;
    showDeleteConfirm: string | null;
    playerNames: string[];
    newPlayerInput: string;
    playerError: string;
    categoryError: string;
    startAttempted: boolean;
    canStart: boolean;
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
    onDeleteCustomCard: (id: string) => void;

    onShowDeleteConfirm: (id: string | null) => void;
    onExportJSON: () => void;
    onImportJSON: (data: any) => void;
    onResumeSession: () => void;
    hasSavedSession: boolean;

  }

  let {
    bestRecord,
    selectedCategories,
    selectedIntensity,
    customCards,
    timerEnabled,
    showDeleteConfirm,
    playerNames,
    newPlayerInput,
    playerError,
    categoryError,
    startAttempted,
    canStart,
    onNewPlayerInput,
    onAddPlayer,
    onRemovePlayer,
    onUpdatePlayerName,
    onToggleCategory,
    onSetCategories,
    onUpdateIntensity,
    onStartGame,
    onToggleTimer,
    onAddCustomCard,
    onDeleteCustomCard,

    onShowDeleteConfirm,
    onExportJSON,
    onImportJSON,
    onResumeSession,
    hasSavedSession,

  }: Props = $props();

  const categories: Category[] = ['Icebreaker', 'Truth', 'Dare', 'Wild'];
  const intensities: Intensity[] = ['Mild', 'Spicy', 'Wild'];

  let validPlayers = $derived(playerNames.filter(n => n.trim()));

  function getCategoryButtonClass(cat: Category, isSelected: boolean): string {
    const colorMap: Record<Category, { selected: string; unselected: string }> = {
      'Icebreaker': { selected: 'bg-blue-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300' },
      'Truth': { selected: 'bg-teal-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-300' },
      'Dare': { selected: 'bg-orange-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-300' },
      'Wild': { selected: 'bg-fuchsia-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-fuchsia-300' },
    };
    const colors = colorMap[cat];
    return `px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none ${isSelected ? colors.selected : colors.unselected}`;
  }

  function getIntensityButtonClass(intensity: Intensity, isSelected: boolean): string {
    const colorMap: Record<Intensity, { selected: string; unselected: string }> = {
      'Mild': { selected: 'bg-green-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-300' },
      'Spicy': { selected: 'bg-amber-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-amber-300' },
      'Wild': { selected: 'bg-red-500 text-white shadow-md', unselected: 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300' },
    };
    const colors = colorMap[intensity];
    return `flex-1 px-4 py-3 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none ${isSelected ? colors.selected : colors.unselected}`;
  }

  function isCatSelected(cat: Category): boolean {
    return selectedCategories.includes(cat);
  }
</script>

<div class="min-h-screen p-6 flex flex-col items-center" style="background-color: var(--color-bg);">
  <div class="w-full max-w-lg mx-auto">
    <!-- Header -->
    <div class="text-center mb-8 mt-4">
      <h1 class="text-4xl font-bold mb-2" style="color: var(--color-accent);">Dare Night</h1>
      <p class="inline-block rounded-full px-3 py-1 text-sm font-bold mb-2">First to 10</p>
      <br/>
      <p class="inline-block rounded-full px-3 py-1 text-sm" style="color: var(--color-link); background-color: var(--color-accent);">A pass-the-device party game for friends</p>
      {#if bestRecord}
        <div class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm">
          <span aria-hidden="true">🏆</span>
          <span><strong>Dare Night record:</strong> {bestRecord.name} — {bestRecord.points} pts</span>
        </div>
      {/if}
    </div>


    <!-- Session Controls -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <div class="flex flex-wrap gap-3 items-center justify-center">
        {#if hasSavedSession}
          <button
            class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus-visible:ring-black focus:outline-none focus-visible:ring-offset-2 focus:outline-none"
            onclick={onResumeSession}
          >
            Resume Saved Session
          </button>
        {/if}
        <button
          class="px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none shadow-md"
          style="background-color: #222; color: white;"
          onclick={onExportJSON}
        >
          Export Session
        </button>

        <label class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus-visible:ring-black focus:outline-none focus-visible:ring-offset-2 focus:outline-none cursor-pointer inline-flex items-center">
          Import Session
          <input
            type="file"
            accept=".json,application/json"
            class="sr-only"
            onchange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                  try {
                    const data = JSON.parse(re.target?.result as string);
                    onImportJSON(data);
                  } catch(err) {
                    onImportJSON(null);
                  }
                  // Reset input so the same file can be selected again
                  (e.target as HTMLInputElement).value = '';
                };
                reader.readAsText(file);
              }
            }}
          />
        </label>
      </div>
    </div>

    <!-- Player Setup -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--color-accent);">Players (2–8)</h2>

      <div class="space-y-2 mb-4">
        {#each playerNames as name, index}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1" for="player-{index}">Player {index + 1} name</label>
          <div class="flex items-center gap-2">
            <input
              id="player-{index}"
              type="text"
              class="min-w-0 flex-1 px-4 py-2 rounded-full border-2 border-gray-500 text-sm focus:outline-none focus-visible:border-black focus:outline-none transition-colors"
              placeholder="Player {index + 1} name"
              value={playerNames[index]}
              oninput={(e) => { onUpdatePlayerName(index, (e.currentTarget as HTMLInputElement).value); }}
              maxlength="20"
            />
            {#if playerNames.length > 2}
              <button
                class="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                onclick={() => onRemovePlayer(index)}
                aria-label="Remove player"
              >
                ✕
              </button>
            {/if}
          </div>
          </div>
        {/each}
      </div>

      {#if playerNames.length < 8}
        <label class="block text-xs font-medium text-gray-700 mb-1" for="add-player">Another player</label>
        <div class="flex gap-2 mb-2 min-w-0">
          <input
            id="add-player"
            type="text"
            class="min-w-0 flex-1 px-4 py-2 rounded-full border-2 border-gray-500 text-sm focus:outline-none focus-visible:border-black focus:outline-none transition-colors"
            placeholder="Add another player..."
            value={newPlayerInput}
            oninput={(e) => onNewPlayerInput((e.currentTarget as HTMLInputElement).value)}
            onkeydown={(e) => { if (e.key === 'Enter') onAddPlayer(newPlayerInput); }}
            maxlength="20"
          />
          <button
            class="px-5 py-2 rounded-full text-white font-semibold text-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none shadow-md"
            style="background-color: var(--color-accent);"
            onclick={() => onAddPlayer(newPlayerInput)}
          >
            Add
          </button>
        </div>
      {/if}

      {#if playerError}
        <p class="text-red-500 text-xs mt-2" role="alert" aria-live="assertive">{playerError}</p>
      {/if}
    </div>

    <!-- Category Toggles -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-semibold" style="color: var(--color-accent);">Categories</h2>
          <p class="text-xs text-gray-600">{selectedCategories.length} selected</p>
        </div>
        {#if selectedCategories.length > 0}
          <button
            class="px-4 py-2 rounded-full text-sm font-medium bg-white text-black border-2 border-black transition-all focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none"
            onclick={() => onSetCategories([])}
          >
            Clear all
          </button>
        {:else}
          <button
            class="px-4 py-2 rounded-full text-sm font-medium bg-white text-black border-2 border-black transition-all focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none"
            onclick={() => onSetCategories([...categories])}
          >
            Select all
          </button>
        {/if}
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        {#each categories as cat}
          <button
            class={getCategoryButtonClass(cat, isCatSelected(cat))}
            onclick={() => onToggleCategory(cat)}
            aria-pressed={isCatSelected(cat)}
            aria-label={cat}
          >
            {cat}
          </button>
        {/each}
      </div>
      {#if selectedCategories.length === 0}
        <p class="text-red-600 text-xs mt-2" role="alert">Select at least one category</p>
      {/if}
      {#if categoryError}
        <p class="text-red-500 text-xs mt-2" role="alert" aria-live="assertive">{categoryError}</p>
      {/if}
    </div>

    <!-- Intensity Selector -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--color-accent);">Intensity</h2>
      <div class="flex gap-2">
        {#each intensities as intensity}
          <button
            class={getIntensityButtonClass(intensity, selectedIntensity === intensity)}
            onclick={() => onUpdateIntensity(intensity)}
            aria-pressed={selectedIntensity === intensity}
            aria-label={intensity}
          >
            {intensity}
          </button>
        {/each}
      </div>
    </div>

    <!-- Timer Toggle -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <h2 class="text-lg font-semibold mb-4" style="color: var(--color-accent);">Round timer</h2>
      <div class="flex items-center justify-between">
        <p class="text-gray-600 text-sm">15-second countdown per card</p>
        <button
          class="timer-switch relative inline-flex w-14 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none"
          style={timerEnabled ? 'background-color: var(--color-accent);' : 'background-color: #6B7280;'}
          onclick={onToggleTimer}
          role="switch"
          aria-checked={timerEnabled}
          aria-label="Round timer"
        >
          <span
            class="absolute top-3 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200"
            style={timerEnabled ? 'transform: translateX(28px);' : ''}
          ></span>
        </button>
      </div>
    </div>

    <!-- Custom Cards Section -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <CustomCards
        customCards={customCards}
        showDeleteConfirm={showDeleteConfirm}
        onAddCard={(data) => onAddCustomCard(data)}
        onDeleteCard={(id) => onDeleteCustomCard(id)}
        onShowDeleteConfirm={(id) => onShowDeleteConfirm(id)}
      />
    </div>

    <!-- Start Button -->
    <button
      class="w-full px-8 py-4 rounded-full text-lg font-bold text-white transition-all shadow-lg focus:outline-none focus:ring-2 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-black focus:outline-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
      style="background-color: var(--color-accent);"
      disabled={!canStart}
      onclick={onStartGame}
    >
      Start game
    </button>
    {#if !canStart && startAttempted}
      <p class="text-center text-red-600 text-xs mt-2 font-medium" role="alert">
        {#if validPlayers.length < 2}
          Add at least 2 players to start
        {:else if selectedCategories.length === 0}
          Select at least one category to start
        {/if}
      </p>
    {/if}
  </div>
</div>
