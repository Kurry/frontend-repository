<script lang="ts">
  import { ShieldCheck, LockSimple, LockSimpleOpen, CheckCircle } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  const gear = $derived(quest.state.gear);
  const questPoints = $derived(quest.state.questPoints);
  const equippedGearId = $derived(quest.state.equippedGearId);
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
    <h2 class="text-lg font-bold flex items-center gap-2" style="color: var(--accent-strong)"><ShieldCheck size={18} weight="fill" /> Gear shop</h2>
    <span class="text-sm px-2.5 py-1 rounded-lg font-semibold" style="color: var(--accent-strong); background: var(--accent-soft)">{questPoints} QP</span>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {#each gear as item}
      <div
        data-gear-id={item.id}
        class="relative rounded-lg p-3 border transition-all hover:border-slate-500 min-w-0 {item.unlocked ? 'border-slate-600 bg-slate-900' : 'border-slate-700 bg-slate-900/50'}"
        class:ring-2={item.id === equippedGearId}
        style={item.id === equippedGearId ? 'box-shadow: 0 0 0 2px var(--accent)' : ''}
      >
        {#if item.id === equippedGearId}
          <span class="absolute top-1.5 right-1.5 text-emerald-400"><CheckCircle size={16} weight="fill" /></span>
        {/if}
        <div class="flex justify-center mb-2">
          <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true" style="{item.unlocked ? '' : 'filter: grayscale(100%) opacity(0.5);'}">
            <rect x="10" y="14" width="12" height="14" rx="2" fill={item.bodyColor || item.color} />
            <circle cx="16" cy="10" r="6" fill="#fcd9b6" />
            <ellipse cx="16" cy="5" rx="9" ry="4" fill={item.hatColor || '#fff'} />
            <rect x="11" y="0" width="10" height="6" rx="2" fill={item.hatColor || '#fff'} />
            <rect x="10" y="28" width="5" height="8" rx="1" fill="#5c4033" />
            <rect x="17" y="28" width="5" height="8" rx="1" fill="#5c4033" />
          </svg>
        </div>

        <h3 class="text-xs font-semibold text-center text-white break-words {item.unlocked ? '' : 'text-slate-500'}">
          {item.name}
        </h3>
        <p class="text-[10px] text-slate-500 text-center mt-0.5 leading-tight">{item.description}</p>

        {#if item.unlocked}
          {#if item.id === equippedGearId}
            <p class="text-center text-xs text-green-400 font-bold mt-1.5">Equipped</p>
          {:else}
            <button
              onclick={() => quest.equipGear(item.id)}
              data-action="equip-gear"
              class="w-full mt-1.5 inline-flex items-center justify-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded transition-colors"
            >
              <LockSimpleOpen size={13} /> Equip
            </button>
          {/if}
        {:else}
          <button
            onclick={() => quest.buyGear(item.id)}
            disabled={questPoints < item.cost}
            data-action="buy-gear"
            class="w-full mt-1.5 inline-flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-colors
                   {(questPoints >= item.cost)
                     ? 'text-white'
                     : 'bg-slate-800 text-slate-300 cursor-not-allowed'}"
            style={questPoints >= item.cost ? 'background: var(--accent)' : ''}
          >
            <LockSimple size={13} /> Unlock · {item.cost} QP
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
