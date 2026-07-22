<script lang="ts">
  import { state, startRefresh, clearCredentials } from '../store.svelte';
  import { Play, Square, Settings, RefreshCcw } from '@lucide/svelte';

  let apiKey = '';
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold flex items-center gap-2"><Settings size={18} /> Connection</h2>
    <div class="flex gap-2">
      <button
        class="px-3 py-1 text-sm rounded {state.workspace.mode === 'demo' ? 'bg-primary text-white' : 'bg-zinc-800'}"
        onclick={() => state.workspace.mode = 'demo'}>Demo</button>
      <button
        class="px-3 py-1 text-sm rounded {state.workspace.mode === 'loopback' ? 'bg-primary text-white' : 'bg-zinc-800'}"
        onclick={() => state.workspace.mode = 'loopback'}>Loopback</button>
      <button
        class="px-3 py-1 text-sm rounded {state.workspace.mode === 'api-key' ? 'bg-primary text-white' : 'bg-zinc-800'}"
        onclick={() => state.workspace.mode = 'api-key'}>API Key</button>
    </div>
  </div>

  {#if state.workspace.mode === 'loopback'}
    <div class="mb-4">
      <label class="block text-sm text-zinc-400 mb-1">Loopback URL</label>
      <input type="text" bind:value={state.workspace.loopbackUrl} class="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm" disabled />
    </div>
  {:else if state.workspace.mode === 'api-key'}
    <div class="mb-4">
      <label class="block text-sm text-zinc-400 mb-1">API Key (open-router or z-ai)</label>
      <input type="password" bind:value={apiKey} class="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm" placeholder="sk-..." />
      <button class="mt-2 text-sm text-red-400" onclick={clearCredentials}>Clear Credentials</button>
    </div>
  {/if}

  <div class="flex gap-2">
    <button class="flex items-center gap-2 bg-success text-white px-4 py-2 rounded text-sm hover:bg-emerald-600 transition-colors" onclick={startRefresh}>
      <Play size={16} /> Start Refresh
    </button>
  </div>
</div>
