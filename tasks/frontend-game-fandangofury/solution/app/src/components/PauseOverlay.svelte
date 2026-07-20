<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';

  interface Props {
    onResume: () => void;
    onSaveCheckpoint: () => void;
    onAbandon: () => void;
  }

  let { onResume, onSaveCheckpoint, onAbandon }: Props = $props();
  let showConfirm = $state(false);

  function handleAbandon() {
    showConfirm = true;
  }
  
  function confirmAbandon() {
    showConfirm = false;
    onAbandon();
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-gray-500/30 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-label="Pause menu"
  >
    {#if showConfirm}
      <div class="p-6 text-center">
        <h2 class="text-xl font-bold text-fury-orange mb-4">Abandon Run?</h2>
        <p class="text-slate-300 text-sm mb-6">
          This will end your current run without any rewards. Checkpoint will be cleared.
        </p>
        <div class="flex flex-col gap-3">
          <button
            class="btn-interactive min-h-12 w-full px-4 py-2 bg-fury-red hover:bg-red-600 rounded-lg font-bold text-white"
            onclick={confirmAbandon}
          >
            Confirm Abandon
          </button>
          <button
            class="btn-interactive min-h-12 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white"
            onclick={() => showConfirm = false}
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <div class="sticky top-0 bg-fury-dark border-b border-gray-500/20 rounded-t-2xl p-4 sm:p-6 text-center">
        <h2 class="text-2xl font-black text-slate-100 mb-1">⏸️ Paused</h2>
      </div>

      <div class="p-4 sm:p-6 flex flex-col gap-3">
        <button
          class="btn-interactive min-h-12 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white border border-emerald-400/30"
          onclick={onResume}
        >
          ▶️ Resume
        </button>
        <button
          class="btn-interactive min-h-12 w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white border border-blue-400/30"
          onclick={onSaveCheckpoint}
        >
          💾 Save Checkpoint
        </button>
        <button
          class="btn-interactive min-h-12 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-slate-200 border border-gray-500/30"
          onclick={handleAbandon}
        >
          🏳️ Abandon Run
        </button>
      </div>
    {/if}
  </div>
</div>
