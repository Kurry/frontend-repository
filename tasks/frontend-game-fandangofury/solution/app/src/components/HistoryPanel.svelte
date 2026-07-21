<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  function undoBtnClass(): string {
    if (game.canUndo) {
      return 'btn-interactive min-h-11 min-w-11 flex items-center justify-center rounded-lg text-sm bg-gray-700 hover:bg-gray-600 text-slate-100';
    }
    return 'min-h-11 min-w-11 flex items-center justify-center rounded-lg text-sm bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed';
  }

  function redoBtnClass(): string {
    if (game.canRedo) {
      return 'btn-interactive min-h-11 min-w-11 flex items-center justify-center rounded-lg text-sm bg-gray-700 hover:bg-gray-600 text-slate-100';
    }
    return 'min-h-11 min-w-11 flex items-center justify-center rounded-lg text-sm bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed';
  }

  function historyItemClass(index: number): string {
    if (index === gameState.historyIndex) {
      return 'flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10';
    }
    if (game.isBranch(index)) {
      return 'flex items-center gap-3 p-3 rounded-xl border border-amber-500/40 bg-amber-500/5';
    }
    return 'flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-fury-dark/50';
  }
</script>

<OverlayShell title="History" emoji="📜" accent="#34d399" maxWidth="max-w-lg" {onClose}>
  <div class="space-y-4">
    <div class="flex items-center gap-2" aria-label="History navigation controls">
      <button class={undoBtnClass()} onclick={() => game.undo()} disabled={!game.canUndo} aria-label="Undo">↩️</button>
      <button class={redoBtnClass()} onclick={() => game.redo()} disabled={!game.canRedo} aria-label="Redo">↪️</button>
      <span class="text-xs text-slate-400 ml-1">
        {gameState.historyIndex >= 0 ? gameState.historyIndex + 1 : 0} / {gameState.history.length}
      </span>
    </div>

    <div>
      <h3 class="text-sm font-bold text-slate-200 mb-2">Snapshots</h3>
      {#if gameState.history.length === 0}
        <div class="text-center text-slate-400 py-6 text-sm">No history yet — play to build up your timeline.</div>
      {:else}
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          {#each gameState.history as entry, index}
            <div class={historyItemClass(index)}>
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 {index ===
                gameState.historyIndex
                  ? 'bg-emerald-500 text-fury-darker'
                  : game.isBranch(index)
                    ? 'bg-amber-500/30 text-amber-200'
                    : 'bg-gray-700'}"
              >
                {#if index === gameState.historyIndex}➤{:else if game.isBranch(index)}⑂{:else}{index + 1}{/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm font-semibold truncate {index === gameState.historyIndex
                      ? 'text-emerald-300'
                      : 'text-slate-300'}"
                  >
                    {entry.label}
                  </span>
                  {#if game.isBranch(index)}
                    <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex-shrink-0">Alt branch</span>
                  {/if}
                </div>
                <div class="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
              </div>
              {#if index !== gameState.historyIndex}
                <button
                  class="btn-interactive min-h-11 px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 rounded text-xs text-emerald-300 border border-emerald-500/20 flex-shrink-0"
                  onclick={() => game.restoreToIndex(index)}
                  aria-label={`Restore to: ${entry.label}`}
                >
                  Restore
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div>
      <h3 class="text-sm font-bold text-slate-200 mb-2">History State</h3>
      <div
        class="bg-fury-darker rounded-lg p-3 text-xs text-slate-300 font-mono overflow-auto max-h-32"
        aria-live="polite"
      >
        {#if gameState.historyIndex >= 0 && gameState.history[gameState.historyIndex]}
          {JSON.stringify(JSON.parse(gameState.history[gameState.historyIndex].data), null, 2)}
        {:else}
          No snapshot available
        {/if}
      </div>
    </div>

    <div class="text-center pt-1 border-t border-gray-800">
      <button
        class="btn-interactive min-h-12 px-6 py-2 bg-emerald-600 hover:bg-teal-500 rounded-lg font-bold text-sm text-white border border-teal-400/30"
        onclick={() => game.applyScenarioChange()}
        aria-label="Apply scenario change"
      >
        Apply Scenario Change
      </button>
    </div>
  </div>
</OverlayShell>
