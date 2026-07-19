<script lang="ts">
  import { game, gameState, MASK_DEFS } from '../lib/game-store.svelte.ts';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  function maskCardClass(owned: boolean, equipped: boolean): string {
    if (equipped) return 'relative p-4 rounded-xl border-2 border-yellow-500 bg-yellow-500/10 mask-equipped';
    if (owned) return 'relative p-4 rounded-xl border-2 border-purple-500/40 bg-purple-500/5';
    return 'relative p-4 rounded-xl border-2 border-gray-600 bg-gray-800/40';
  }

  function bonusText(bonus: string, bonusValue: number): string {
    const pct = Math.round((bonusValue - 1) * 100);
    if (bonus === 'damage') return `+${pct}% damage`;
    if (bonus === 'speed') return `+${pct}% speed`;
    return `+${pct}% defense`;
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-purple-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-label="Mask collection"
  >
    <div class="sticky top-0 bg-fury-dark border-b border-purple-500/20 rounded-t-2xl p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-purple-300">🎭 Mask collection</h2>
        <button
          class="btn-interactive min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
          onclick={onClose}
          aria-label="Close masks"
        >
          ✕
        </button>
      </div>
      <p class="text-slate-300 text-xs mt-1">Equip a mask to change Fiesta Fury and gain a passive bonus</p>
      {#if gameState.equippedMask}
        {@const cur = game.masks().find((m) => m.id === gameState.equippedMask)}
        <p class="text-xs text-fury-gold mt-1">Equipped: {cur?.emoji} {cur?.name}</p>
      {/if}
      {#if gameState.maskEquipToast}
        <div class="mt-2 text-sm text-fury-gold animate-pulse" aria-live="polite">{gameState.maskEquipToast}</div>
      {/if}
    </div>

    <div class="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each MASK_DEFS as maskDef}
        {@const owned = gameState.ownedMasks.includes(maskDef.id)}
        {@const equipped = gameState.equippedMask === maskDef.id}

        <div class={maskCardClass(owned, equipped)}>
          {#if !owned}
            <div class="flex items-center gap-3 opacity-70">
              <div class="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl grayscale">
                {maskDef.emoji}
              </div>
              <div>
                <div class="font-bold text-slate-300 text-sm">Locked mask</div>
                <div class="text-xs text-slate-300">🔒 Defeat the boss to unlock</div>
              </div>
            </div>
          {:else if !equipped}
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style="background: {maskDef.furyColor}20; border: 1px solid {maskDef.furyColor}40;"
              >
                {maskDef.emoji}
              </div>
              <div class="flex-1">
                <div class="font-bold text-sm text-slate-100">{maskDef.name}</div>
                <div class="text-xs text-slate-300">{bonusText(maskDef.bonus, maskDef.bonusValue)}</div>
              </div>
              <button
                class="btn-interactive min-h-12 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs font-bold text-white"
                onclick={() => game.equipMask(maskDef.id)}
                aria-label={`Equip ${maskDef.name}`}
              >
                Equip
              </button>
            </div>
          {:else}
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style="background: {maskDef.furyColor}30; border: 2px solid {maskDef.furyColor};"
              >
                {maskDef.emoji}
              </div>
              <div class="flex-1">
                <div class="font-bold text-sm text-fury-gold">{maskDef.name}</div>
                <div class="text-xs text-fury-gold/80">{bonusText(maskDef.bonus, maskDef.bonusValue)}</div>
              </div>
              <button
                class="btn-interactive min-h-12 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-xs font-bold text-fury-gold border border-yellow-500/30"
                onclick={() => game.equipMask(null)}
                aria-label={`Unequip ${maskDef.name}`}
              >
                Unequip
              </button>
            </div>
            <div class="absolute top-2 right-2 text-fury-gold text-xs font-bold">Equipped</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
