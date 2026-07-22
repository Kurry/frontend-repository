<script lang="ts">
  import type { ProviderSnapshot } from '../types';
  import { retryProvider, startRefresh, state, setPin } from '../store.svelte';
  import { RefreshCcw, AlertTriangle, Clock, CheckCircle2, Pin } from '@lucide/svelte';
  import { clsx } from 'clsx';

  export let provider: ProviderSnapshot;

  const statusColors = {
    fresh: 'text-success',
    updating: 'text-primary animate-pulse',
    stale: 'text-warning',
    error: 'text-error',
    disabled: 'text-zinc-500'
  };
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 min-w-[250px]">
  <div class="flex justify-between items-start">
    <h3 class="font-semibold text-zinc-100">{provider.name}</h3>
    <div class="flex items-center gap-1 text-xs {statusColors[provider.status]}">
      {#if provider.status === 'fresh'}<CheckCircle2 size={14} /> Fresh{/if}
      {#if provider.status === 'updating'}<RefreshCcw size={14} class="animate-spin" /> Updating{/if}
      {#if provider.status === 'stale'}<Clock size={14} /> Outdated{/if}
      {#if provider.status === 'error'}<AlertTriangle size={14} /> Error{/if}
    </div>
  </div>

  {#if provider.status === 'error'}
    <div class="text-xs text-error bg-error/10 p-2 rounded">
      {provider.errorMessage}
      <button class="underline ml-2" onclick={() => retryProvider(provider.providerId)}>Retry</button>
    </div>
  {/if}

  {#if provider.resources.length > 0}
    <div class="flex flex-col gap-2">
      {#each provider.resources as resource}
        <div class="bg-zinc-950 p-2 rounded flex justify-between items-center group">
          <div class="text-sm">
            <div class="text-zinc-300">{resource.name}</div>
            <div class="text-xs text-zinc-500">
              {#if resource.type === 'consumption'}
                {resource.used?.toFixed(2)} / {resource.limit?.toFixed(2)} {resource.unit}
              {:else}
                {resource.remaining?.toFixed(2)} {resource.unit} remaining
              {/if}
            </div>
          </div>
          <button
            class="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Pin to Focus Strip"
            onclick={() => setPin(-1, provider.providerId, resource.id)}
          >
            <Pin size={16} />
          </button>
        </div>
      {/each}
    </div>
  {:else if provider.status !== 'error' && provider.status !== 'updating'}
    <div class="text-xs text-zinc-500 italic">No resources available.</div>
  {/if}

  {#if provider.lastUpdated}
    <div class="text-[10px] text-zinc-600 mt-auto pt-2">Last updated: {new Date(provider.lastUpdated).toLocaleTimeString()}</div>
  {/if}
</div>
