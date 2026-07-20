<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const localQuery = ref(store.searchQuery)

// Center the viewport on the first search match, mirroring the React
// reference's panToFirstMatch math (object center in world space, offset
// by half the viewport, accounting for the current zoom level).
const panToFirstMatch = () => {
  if (!localQuery.value.trim()) return
  const firstId = store.searchMatchIds[0]
  if (!firstId) return
  const firstMatch = store.activeBoard?.objects.find(o => o.id === firstId)
  if (!firstMatch) return

  const centerX = firstMatch.x + firstMatch.width / 2
  const centerY = firstMatch.y + firstMatch.height / 2

  store.setCanvasView({
    panX: -(centerX * store.canvasView.zoom - window.innerWidth / 2),
    panY: -(centerY * store.canvasView.zoom - (window.innerHeight - 180) / 2),
  })
}

const handleSearch = () => {
  store.setSearchQuery(localQuery.value)
  panToFirstMatch()
}

const clearSearch = () => {
  localQuery.value = ''
  store.setSearchQuery('')
}
</script>

<template>
  <div class="relative flex items-center w-64">
    <div class="absolute left-2.5 text-gray-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </div>
    <input
      v-model="localQuery"
      type="text"
      placeholder="Search notes..."
      class="w-full pl-8 pr-16 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6D5BD0] focus:border-transparent placeholder-gray-400"
      @input="handleSearch"
      @keydown.esc="clearSearch"
      @keydown.enter="panToFirstMatch"
    />
    <div v-if="store.searchQuery.trim()" class="absolute right-2 flex items-center gap-1.5">
      <span class="text-xs font-medium text-gray-500">
        {{ store.searchMatchIds.length }}
      </span>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 outline-none rounded-full focus:ring-2 focus:ring-[#6D5BD0]"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  </div>
</template>
