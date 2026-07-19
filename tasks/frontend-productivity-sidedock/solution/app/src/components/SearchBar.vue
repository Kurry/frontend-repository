<script setup>
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()

function clearSearch() {
  store.searchQuery = ''
}
</script>

<template>
  <div class="px-4 py-2 border-b flex items-center gap-2" style="border-color: var(--color-border); background: white;">
    <label class="flex-1 relative search-label">
      <span>Search bookmarks</span>
      <span aria-hidden="true" class="absolute left-2.5 input-icon text-sm">🔍</span>
      <input
        v-model="store.searchQuery"
        type="text"
        placeholder="Title or URL"
        class="w-full pl-8 pr-3 py-1.5 rounded-md border text-sm outline-none transition-all"
        style="border-color: var(--color-border); font-family: Inter, sans-serif;"
        @focus="$event.target.style.borderColor = 'var(--color-accent)'"
        @blur="$event.target.style.borderColor = 'var(--color-border)'"
        @keydown.escape="clearSearch"
      />
    </label>
    <button
      @click="store.searchScope = store.searchScope === 'current' ? 'all' : 'current'"
      class="px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all border whitespace-nowrap"
      :class="store.searchScope === 'all' ? 'border-transparent' : 'border-[var(--color-border)]'"
      :style="store.searchScope === 'all' 
        ? { background: 'var(--color-accent)', color: 'white' } 
        : { background: 'white', color: 'var(--color-text-primary)' }"
    >
      {{ store.searchScope === 'current' ? 'Search all' : 'Search current' }}
    </button>
  </div>
</template>

<style scoped>
.search-label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; }
.input-icon { bottom: 8px; top: auto; }
@media (max-width: 420px) {
  .border-b { align-items: flex-end; flex-wrap: wrap; }
  button { min-height: 44px; }
}
</style>
