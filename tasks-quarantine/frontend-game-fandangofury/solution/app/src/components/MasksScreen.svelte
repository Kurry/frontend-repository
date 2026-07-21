<script lang="ts">
  import { game, gameState, MASK_DEFS } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  function maskCardClass(owned: boolean, equipped: boolean): string {
    if (equipped) return 'relative p-4 rounded-xl border-2 border-yellow-500 bg-yellow-500/10 mask-equipped';
    if (owned) return 'relative p-4 rounded-xl border-2 border-purple-500/50 bg-purple-500/10';
    return 'relative p-4 rounded-xl border-2 border-gray-600 bg-gray-800/40 opacity-70';
  }

  function bonusText(bonus: string, bonusValue: number): string {
    const pct = Math.round((bonusValue - 1) * 100);
    if (bonus === 'damage') return `+${pct}% Damage`;
    if (bonus === 'speed') return `+${pct}% Speed`;
    return `+${pct}% Defense`;
  }
</script>

<OverlayShell
  title="Mask Collection"
  emoji="🎭"
  accent="#a855f7"
  subtitle="Equip one Mask for a passive bonus and to color Fiesta Fury"
  {onClose}
>
  {#if gameState.equippedMask}
    {@const cur = game.masks().find((m) => m.id === gameState.equippedMask)}
    <p class="text-xs text-fury-gold mb-2">Equipped: {cur?.emoji} {cur?.name}</p>
  {/if}
  {#if gameState.maskEquipToast}
    <div class="mb-3 text-sm text-fury-gold font-semibold animate-pulse rounded-lg bg-fury-gold/10 px-3 py-1.5" aria-live="polite">
      {gameState.maskEquipToast}
    </div>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each MASK_DEFS as maskDef}
      {@const owned = gameState.ownedMasks.includes(maskDef.id)}
      {@const equipped = gameState.equippedMask === maskDef.id}

      <div class={maskCardClass(owned, equipped)}>
        {#if equipped}
          <span class="absolute top-2 right-2 text-fury-gold text-[10px] font-black uppercase tracking-wide">Equipped</span>
        {:else if owned}
          <span class="absolute top-2 right-2 text-purple-300 text-[10px] font-bold uppercase tracking-wide">Unlocked</span>
        {:else}
          <span class="absolute top-2 right-2 text-slate-400 text-[10px] font-bold uppercase tracking-wide">Locked</span>
        {/if}

        {#if !owned}
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl grayscale">
              {maskDef.emoji}
            </div>
            <div>
              <div class="font-bold text-slate-300 text-sm">Locked Mask</div>
              <div class="text-xs text-slate-400">🔒 Defeat the boss to unlock</div>
            </div>
          </div>
        {:else if !equipped}
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style="background: {maskDef.furyColor}22; border: 1px solid {maskDef.furyColor}55;"
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
              style="background: {maskDef.furyColor}33; border: 2px solid {maskDef.furyColor};"
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
        {/if}
      </div>
    {/each}
  </div>
</OverlayShell>
