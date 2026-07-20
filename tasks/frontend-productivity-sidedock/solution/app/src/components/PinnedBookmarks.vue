<script setup>
import { TransitionGroup } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()

function openBookmark(url) {
  window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <div class="px-4 py-2 border-b overflow-x-auto" style="border-color: var(--color-border); background: white;">
    <h2 class="pinned-heading mb-2">Pinned bookmarks</h2>
    <TransitionGroup name="pin-tile" tag="div" class="flex gap-2 pb-1" role="list" aria-label="Pinned bookmarks">
      <div
        v-for="pin in store.pinnedBookmarks"
        :key="pin.id"
        class="group relative flex-shrink-0 w-28 px-2 py-2 rounded-lg border transition-all hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
        style="border-color: var(--color-border);"
        role="listitem"
      >
        <button class="pin-open w-full rounded-md" @click="openBookmark(pin.url)" :aria-label="`Open ${pin.title}`">
          <span
            aria-hidden="true"
            class="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold mx-auto mb-1.5"
            :style="{ background: store.hashColor(store.getDomain(pin.url)) }"
          >
            {{ store.getDomain(pin.url)[0]?.toUpperCase() || '?' }}
          </span>
          <span class="text-xs text-center truncate font-medium block">{{ pin.title }}</span>
        </button>
        <button
          @click.stop="store.togglePin(pin)"
          class="absolute -top-1 -right-1 w-11 h-11 rounded-full bg-white border border-gray-300 text-gray-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-300"
          title="Unpin"
          :aria-label="`Unpin ${pin.title}`"
        >✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.pinned-heading { color: var(--secondary-text); font-family: "Cormorant Upright", Georgia, serif; font-size: 24px; line-height: 1.1; }
.pin-open { min-height: 64px; color: var(--color-text-primary); }
.pin-tile-enter-active, .pin-tile-leave-active { transition: all 0.24s ease; }
.pin-tile-enter-from, .pin-tile-leave-to { opacity: 0; transform: translateY(12px) scale(0.96); }
.pin-tile-move { transition: transform 0.24s ease; }
</style>
