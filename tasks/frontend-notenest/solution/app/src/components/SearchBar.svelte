<script lang="ts">
  import { store } from '../lib/store.svelte';
</script>

<div class="relative w-full">
  <input
    type="text"
    placeholder="Search notes..."
    class="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
    bind:value={store.searchQuery}
    aria-label="Search notes"
  />
  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
</div>
