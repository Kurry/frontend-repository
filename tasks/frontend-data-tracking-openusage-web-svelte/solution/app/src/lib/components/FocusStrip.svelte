<script lang="ts">
  import { state, unpin, reorderPins } from '../store.svelte';
  import { X, ArrowLeft, ArrowRight, GripVertical } from '@lucide/svelte';

  function getResource(providerId: string, resourceId: string) {
    const provider = state.workspace.providers.find(p => p.providerId === providerId);
    if (!provider) return null;
    return provider.resources.find(r => r.id === resourceId) || null;
  }

  function getProvider(providerId: string) {
    return state.workspace.providers.find(p => p.providerId === providerId) || null;
  }
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 relative">
  <h2 class="text-lg font-semibold mb-3">Focus Strip (Max 2)</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each state.workspace.pins as pin, i}
      {@const resource = getResource(pin.providerId, pin.resourceId)}
      {@const provider = getProvider(pin.providerId)}

      <div class="bg-zinc-950 border border-zinc-700 rounded p-3 flex flex-col gap-2 relative group" tabindex="0">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2">
            <button class="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white" title="Drag Handle"><GripVertical size={16} /></button>
            <div class="font-medium text-sm text-zinc-100">{provider?.name} - {resource?.name}</div>
          </div>
          <button class="text-zinc-500 hover:text-error" onclick={() => unpin(i)} aria-label="Unpin"><X size={16} /></button>
        </div>

        {#if resource}
           <div class="text-2xl font-bold">
              {#if resource.type === 'consumption'}
                {resource.used?.toFixed(2)} <span class="text-sm font-normal text-zinc-400">/ {resource.limit?.toFixed(2)} {resource.unit}</span>
              {:else}
                {resource.remaining?.toFixed(2)} <span class="text-sm font-normal text-zinc-400">{resource.unit} remaining</span>
              {/if}
           </div>
        {:else}
           <div class="text-sm text-zinc-500">Resource data unavailable</div>
        {/if}

        <div class="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
           {#if i > 0}
             <button class="text-xs bg-zinc-800 px-2 py-1 rounded flex items-center gap-1" onclick={() => reorderPins(i, i - 1)}><ArrowLeft size={12}/> Move Left</button>
           {/if}
           {#if i < state.workspace.pins.length - 1}
             <button class="text-xs bg-zinc-800 px-2 py-1 rounded flex items-center gap-1" onclick={() => reorderPins(i, i + 1)}>Move Right <ArrowRight size={12}/></button>
           {/if}
        </div>
      </div>
    {:else}
      <div class="col-span-1 md:col-span-2 text-center p-8 border border-dashed border-zinc-700 rounded text-zinc-500 text-sm">
        Pin resources here to focus on them.
      </div>
    {/each}
  </div>
</div>
