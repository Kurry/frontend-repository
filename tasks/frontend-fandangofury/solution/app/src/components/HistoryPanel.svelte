<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  function undoBtnClass(): string {
    if (game.canUndo) {
      return 'btn-interactive min-h-12 min-w-12 flex items-center justify-center rounded-lg text-sm bg-gray-700 text-slate-100';
    }
    return 'min-h-12 min-w-12 flex items-center justify-center rounded-lg text-sm bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed';
  }

  function redoBtnClass(): string {
    if (game.canRedo) {
      return 'btn-interactive min-h-12 min-w-12 flex items-center justify-center rounded-lg text-sm bg-gray-700 text-slate-100';
    }
    return 'min-h-12 min-w-12 flex items-center justify-center rounded-lg text-sm bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed';
  }

  function historyItemClass(index: number): string {
    if (index === gameState.historyIndex) {
      return 'flex items-center gap-3 p-3 rounded-xl border border-emerald-500 bg-emerald-500/10';
    }
    return 'flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-fury-dark/50';
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-emerald-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-label="History panel"
  >
    <div class="sticky top-0 bg-fury-dark border-b border-emerald-500/20 rounded-t-2xl p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black text-emerald-300">📜 History</h2>
        <div class="flex items-center gap-2">
          <button
            class={undoBtnClass()}
            onclick={() => game.undo()}
            disabled={!game.canUndo}
            aria-label="Undo"
          >
            ↩️
          </button>
          <button
            class={redoBtnClass()}
            onclick={() => game.redo()}
            disabled={!game.canRedo}
            aria-label="Redo"
          >
            ↪️
          </button>
          <button
            class="btn-interactive min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
            onclick={onClose}
            aria-label="Close history"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6 space-y-2">
      {#if gameState.history.length === 0}
        <div class="text-center text-slate-400 py-8 text-sm">
          No history yet. Play the game to build up your history!
        </div>
      {:else}
        {#each gameState.history as entry, index}
          <div class={historyItemClass(index)}>
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 {index ===
              gameState.historyIndex
                ? 'bg-emerald-500'
                : 'bg-gray-700'}"
            >
              {#if index === gameState.historyIndex}➤{:else}{index + 1}{/if}
            </div>
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-semibold truncate {index === gameState.historyIndex
                  ? 'text-emerald-300'
                  : 'text-slate-300'}"
              >
                {entry.label}
              </div>
              <div class="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
            </div>
            {#if index !== gameState.historyIndex}
              <button
                class="btn-interactive min-h-12 px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 rounded text-xs text-emerald-300 border border-emerald-500/20"
                onclick={() => game.restoreToIndex(index)}
                aria-label={`Restore to: ${entry.label}`}
              >
                Restore
              </button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <div class="p-4 border-t border-gray-800">
      <h3 class="text-sm font-bold text-slate-200 mb-2">History state</h3>
      <div
        class="bg-fury-darker rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto max-h-32 overflow-y-auto"
        aria-live="polite"
      >
        {#if gameState.historyIndex >= 0 && gameState.history[gameState.historyIndex]}
          {JSON.stringify(JSON.parse(gameState.history[gameState.historyIndex].data), null, 2)}
        {:else}
          No snapshot available
        {/if}
      </div>
    </div>

    <div class="p-4 border-t border-gray-800 text-center">
      <button
        class="btn-interactive min-h-12 px-6 py-2 bg-emerald-600 hover:bg-teal-500 rounded-lg font-bold text-sm text-white border border-teal-400/30"
        onclick={() => game.applyScenarioChange()}
        aria-label="Apply scenario change"
      >
        Apply scenario change
      </button>
    </div>
  </div>
</div>
