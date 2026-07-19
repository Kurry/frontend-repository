<script lang="ts">
  import { quest } from '../../store.svelte';

  const gear = $derived(quest.state.gear);
  const questPoints = $derived(quest.state.questPoints);
  const equippedGearId = $derived(quest.state.equippedGearId);
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-lg font-bold text-amber-400">Gear shop</h2>
    <span class="text-sm text-amber-300 bg-amber-900/30 px-2 py-1 rounded-lg">{questPoints} QP</span>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {#each gear as item}
      <div
        data-gear-id={item.id}
        class="relative rounded-lg p-3 border transition-all hover:border-slate-500 hover:bg-slate-800/70 {item.unlocked ? 'border-slate-600 bg-slate-900' : 'border-slate-700 bg-slate-900/50'}"
        class:ring-2={item.id === equippedGearId}
        class:!ring-amber-400={item.id === equippedGearId}
      >
        <!-- Gear preview -->
        <div class="flex justify-center mb-2">
          <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"
               style="{item.unlocked ? '' : 'filter: grayscale(100%) opacity(0.5);'}">
            <!-- Body -->
            <rect x="10" y="14" width="12" height="14" rx="2" fill={item.bodyColor || item.color} />
            <!-- Head -->
            <circle cx="16" cy="10" r="6" fill="#fcd9b6" />
            <!-- Hat -->
            <ellipse cx="16" cy="5" rx="9" ry="4" fill={item.hatColor || '#fff'} />
            <rect x="11" y="0" width="10" height="6" rx="2" fill={item.hatColor || '#fff'} />
            <!-- Legs -->
            <rect x="10" y="28" width="5" height="8" rx="1" fill="#5c4033" />
            <rect x="17" y="28" width="5" height="8" rx="1" fill="#5c4033" />
          </svg>
        </div>

        <h3 class="text-xs font-semibold text-center text-white {item.unlocked ? '' : 'text-slate-500'}">
          {item.name}
        </h3>

        {#if item.unlocked}
          {#if item.id === equippedGearId}
            <p class="text-center text-xs text-green-400 font-bold mt-1">Equipped</p>
          {:else}
            <button
              onclick={() => quest.equipGear(item.id)}
              data-action="equip-gear"
              class="w-full mt-1 text-xs bg-slate-700 hover:bg-slate-600 text-white py-1 rounded
                     transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Equip
            </button>
          {/if}
        {:else}
          <button
            onclick={() => quest.buyGear(item.id)}
            disabled={questPoints < item.cost}
            data-action="buy-gear"
            class="w-full mt-1 text-xs py-1 rounded transition-colors
                   {(questPoints >= item.cost)
                     ? 'bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-2 focus-visible:ring-amber-400'
                     : 'bg-slate-800 text-slate-300 cursor-not-allowed'}"
          >
            Unlock · {item.cost} QP
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
