<script lang="ts">
  import { state, stopRefresh } from '../store.svelte';
  import { Square } from '@lucide/svelte';
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col h-64 mb-6">
  <div class="flex items-center justify-between p-3 border-b border-zinc-800">
    <h2 class="text-sm font-semibold">Event Trace Stream</h2>
    <button class="flex items-center gap-1 text-xs bg-error text-white px-2 py-1 rounded hover:bg-red-600 transition-colors" onclick={stopRefresh}>
      <Square size={12} fill="currentColor"/> Stop All
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-2 font-mono text-[10px] flex flex-col gap-1">
    {#each state.events.slice(-50) as event}
      <div class="bg-zinc-950 p-1.5 rounded flex items-start gap-2 border border-zinc-800/50">
        <span class="text-zinc-500 whitespace-nowrap">{new Date(event.timestamp).toLocaleTimeString()}</span>
        <span class="text-primary font-bold w-6">{event.sequence}</span>
        <span class="text-zinc-300 w-24 truncate" title={event.providerId}>{event.providerId}</span>
        <span class="text-zinc-400 w-16">{event.phase}</span>
        <span class="text-zinc-400 w-20">{event.kind}</span>
        <span class="text-zinc-500 truncate flex-1">{JSON.stringify(event.payload)}</span>
      </div>
    {:else}
      <div class="text-center text-zinc-600 italic mt-8 text-sm">No events recorded.</div>
    {/each}
  </div>
</div>
