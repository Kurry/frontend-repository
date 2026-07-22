<script lang="ts">
  import { state } from '../store.svelte';
  import ProviderCard from './ProviderCard.svelte';
</script>

<div class="mb-6">
  <h2 class="text-lg font-semibold mb-3">Providers</h2>
  <div class="flex overflow-x-auto gap-4 pb-2 snap-x">
    {#each state.workspace.providers as provider}
      <div class="snap-start shrink-0">
        <ProviderCard {provider} />
      </div>
    {:else}
      <div class="text-sm text-zinc-500 italic w-full text-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        No providers loaded. Start a refresh.
      </div>
    {/each}
  </div>
</div>
