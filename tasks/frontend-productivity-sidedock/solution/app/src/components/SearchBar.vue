<script setup>
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()

function clearSearch() {
  store.searchQuery = ''
}
</script>

<template>
  <div class="px-4 py-2 border-b flex items-center gap-2" style="border-color: var(--color-border); background: white;">
    <div class="flex-1 relative search-label">
      <label for="search-input">Search bookmarks</label>
      <div class="relative">
        <span aria-hidden="true" class="absolute left-3 top-3 text-sm">🔍</span>
        <input
          id="search-input"
          v-model="store.searchQuery"
          type="search"
          placeholder="Title or URL"
          class="search-input w-full pl-10 pr-3 py-2 rounded-md border text-sm outline-none transition-all"
          style="border-color: var(--color-border); font-family: Inter, sans-serif; background: transparent; color: var(--color-text-primary); font-size: 15px;"
          @focus="$event.target.style.borderColor = 'var(--color-accent)'"
          @blur="$event.target.style.borderColor = 'var(--color-border)'"
          @keydown.escape="clearSearch"
        />
      </div>
    </div>
    <button
      type="button"
      class="scope-toggle px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-all border whitespace-nowrap"
      :class="store.searchScope === 'all' ? 'border-transparent' : 'border-[var(--color-border)]'"
      :style="store.searchScope === 'all'
        ? { background: 'var(--color-accent)', color: 'white' }
        : { background: 'transparent', color: 'var(--color-text-primary)' }"
      :aria-pressed="store.searchScope === 'all'"
      aria-label="Toggle search scope between current workspace and all workspaces"
      @click="store.searchScope = store.searchScope === 'current' ? 'all' : 'current'"
      @keydown.enter.prevent="store.searchScope = store.searchScope === 'current' ? 'all' : 'current'"
      @keydown.space.prevent="store.searchScope = store.searchScope === 'current' ? 'all' : 'current'"
    >
      {{ store.searchScope === 'current' ? 'Search all' : 'Search current' }}
    </button>
  </div>
</template>

<style scoped>
.search-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}
.search-input { min-height: 44px; }
.scope-toggle {
  min-height: 44px;
  min-width: 44px;
  font-size: 14px;
}
.scope-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
