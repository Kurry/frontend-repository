<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore, NOTE_COLORS, SHAPE_COLORS } from '../store'

const store = useAppStore()

const colorName = (hex: string) => {
  const map: Record<string, string> = {}
  NOTE_COLORS.forEach(c => map[c.hex.toUpperCase()] = c.name)
  SHAPE_COLORS.forEach(c => map[c.hex.toUpperCase()] = c.name)
  return map[hex.toUpperCase()] || hex
}

const snippet = (text?: string) => {
  if (!text) return '(empty)'
  const plain = text.replace(/<[^>]*>?/gm, '')
  return plain.length > 40 ? plain.substring(0, 40) + '...' : plain
}
</script>

<template>
  <div v-if="store.showArchivePanel" class="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-[70] flex flex-col">
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
       <h3 class="font-bold text-gray-900 m-0">Archive</h3>
       <button type="button" @click="store.setShowArchivePanel(false)" class="text-gray-400 hover:text-gray-700 outline-none focus:ring-2 focus:ring-[#6D5BD0] rounded p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
       </button>
    </div>

    <div v-if="store.archive.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 italic">
       Deleted or archived objects appear here
    </div>

    <div v-else class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
       <transition-group
          name="list"
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in absolute"
          enter-from-class="opacity-0 -translate-x-4"
          leave-to-class="opacity-0 scale-95"
          move-class="transition-transform duration-300 ease-in-out"
       >
         <div
            v-for="item in store.archive"
            :key="item.id"
            class="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white shadow-sm"
         >
            <div class="flex items-center gap-2">
               <span class="font-semibold text-gray-900 text-sm capitalize">{{ item.obj.type }}</span>
               <span class="text-[10px] text-gray-500 uppercase tracking-wide bg-gray-100 px-1.5 rounded">{{ colorName(item.obj.color) }}</span>
            </div>

            <div v-if="item.obj.type === 'note' || item.obj.type === 'flashcard'" class="text-xs text-gray-600 truncate">
               {{ snippet(item.obj.type === 'note' ? item.obj.text : (item.obj.flipped ? item.obj.back : item.obj.front)) }}
            </div>

            <div class="flex items-center justify-end gap-2 mt-1">
               <button type="button" class="text-xs text-blue-600 hover:underline outline-none" @click="store.restoreFromArchive(item.id)">
                  Restore
               </button>
               <button type="button" class="text-xs text-red-600 hover:underline outline-none" @click="store.purgeFromArchive(item.id)">
                  Purge
               </button>
            </div>
         </div>
       </transition-group>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion) {
  .list-enter-active,
  .list-leave-active,
  .list-move {
    transition: none !important;
  }
}
</style>
