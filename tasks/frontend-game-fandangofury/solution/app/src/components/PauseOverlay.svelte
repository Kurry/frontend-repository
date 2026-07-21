<script lang="ts">
  import { game, gameState, STAGES } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';

  interface Props {
    onResume: () => void;
    onSaveCheckpoint: () => void;
    onAbandon: () => void;
  }

  let { onResume, onSaveCheckpoint, onAbandon }: Props = $props();
  let showConfirm = $state(false);

  const stage = $derived(STAGES[gameState.currentStage - 1]);

  function closePauseSurface() {
    if (showConfirm) {
      showConfirm = false;
      return;
    }
    onResume();
  }
</script>

<OverlayShell title="Paused" emoji="⏸️" accent="#94a3b8" onClose={closePauseSurface}>
  {#if showConfirm}
    <div class="text-center">
      <h3 class="text-lg font-bold text-fury-orange mb-3">Abandon Run?</h3>
      <p class="text-slate-300 text-sm mb-6">
        This ends your current run without rewards and clears any checkpoint.
      </p>
      <div class="flex flex-col gap-3">
        <button
          class="btn-interactive min-h-12 w-full px-4 py-2 bg-fury-red hover:bg-red-600 rounded-lg font-bold text-white"
          onclick={() => {
            showConfirm = false;
            onAbandon();
          }}
        >
          Confirm Abandon
        </button>
        <button
          class="btn-interactive min-h-12 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white"
          onclick={() => (showConfirm = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <div class="bg-fury-darker/70 border border-gray-700 rounded-xl p-3 mb-4 text-sm" aria-label="Frozen run status">
      <div class="grid grid-cols-2 gap-2 text-slate-200">
        <div>Stage <span class="text-fury-gold font-bold">{gameState.currentStage}</span> · {stage?.name ?? ''}</div>
        <div>{gameState.isBoss ? 'Boss Duel' : `Wave ${gameState.currentWave} of ${stage?.waves ?? '?'}`}</div>
        <div>Health <span class="font-bold">{gameState.playerHealth}/{game.getMaxHealth()}</span></div>
        <div>Fury <span class="font-bold">{Math.floor(gameState.furyMeter)}/100</span></div>
        {#if gameState.isBoss}
          {@const boss = gameState.enemies.find((e) => e.type === 'boss')}
          <div class="col-span-2">Boss <span class="text-fury-red font-bold">{stage?.bossName}</span> {boss ? `${boss.health}/${boss.maxHealth}` : ''}</div>
        {/if}
      </div>
      <p class="text-[11px] text-slate-400 mt-2">Combat is frozen. Resume continues from these exact values.</p>
    </div>

    <div class="flex flex-col gap-3">
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
        onclick={() => (showConfirm = true)}
      >
        🏳️ Abandon Run
      </button>
    </div>
  {/if}
</OverlayShell>
