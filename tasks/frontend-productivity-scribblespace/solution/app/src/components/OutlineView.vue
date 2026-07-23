<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore, NOTE_COLORS, SHAPE_COLORS } from '../store'

const store = useAppStore()

const board = computed(() => store.activeBoard)
const sortedObjects = computed(() => {
  if (!board.value) return []
  let objs = [...board.value.objects]
  const q = store.searchQuery.trim()
  if (q) {
    objs = objs.filter(o => store.searchMatchIds.includes(o.id))
  }
  return objs.sort((a, b) => b.zIndex - a.zIndex)
})

const hasSearchQuery = computed(() => store.searchQuery.trim().length > 0)

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
  <div class="h-full overflow-y-auto bg-white p-6 outline-none" tabindex="-1">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Outline: {{ board?.name }}</h2>

      <div v-if="sortedObjects.length === 0" class="text-gray-500 italic">
        {{ hasSearchQuery ? 'No results for the query' : 'No objects on this board.' }}
      </div>

      <div v-else class="flex flex-col gap-2 relative">
        <transition-group
          name="list"
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in absolute"
          enter-from-class="opacity-0 -translate-y-4"
          leave-to-class="opacity-0 scale-95"
          move-class="transition-transform duration-300 ease-in-out"
        >
          <div
            v-for="obj in sortedObjects"
            :key="obj.id"
            class="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"
            :class="{ 'ring-2 ring-[#6D5BD0]': store.selectedIds.includes(obj.id), 'ring-2 ring-[#E0A030] bg-[#FFF9C4]/30': store.searchMatchIds.includes(obj.id) }"
          >
             <div class="w-12 h-12 rounded flex items-center justify-center shrink-0 border border-gray-200" :style="{ backgroundColor: obj.color, borderRadius: obj.type === 'circle' ? '50%' : '4px' }">
                <svg v-if="obj.type === 'arrow'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
             </div>

             <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="flex items-center gap-2">
                   <span class="font-semibold text-gray-900 capitalize">{{ obj.type }}</span>
                   <span class="text-xs text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded">{{ colorName(obj.color) }}</span>
                   <span v-if="obj.type === 'flashcard'" class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {{ obj.flipped ? 'Showing Back' : 'Showing Front' }}
                   </span>
                </div>

                <div v-if="obj.type === 'note' || obj.type === 'flashcard'" class="text-sm text-gray-600 truncate mt-1">
                   {{ snippet(obj.type === 'note' ? obj.text : (obj.flipped ? obj.back : obj.front)) }}
                </div>
             </div>

             <div class="flex items-center gap-2 shrink-0">
                <button v-if="obj.type === 'note' || obj.type === 'flashcard'" type="button" class="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700" @click="store.selectOnly(obj.id); store.setViewMode('canvas')">
                   Edit on Canvas
                </button>
                <button v-if="obj.type === 'flashcard'" type="button" class="px-3 py-1.5 text-sm bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 text-purple-700" @click="store.updateObject({ id: obj.id, updates: { flipped: !obj.flipped } })">
                   Flip
                </button>
                <button type="button" class="px-3 py-1.5 text-sm bg-red-50 border border-red-200 rounded hover:bg-red-100 text-red-700" @click="store.selectOnly(obj.id); store.setShowDeleteConfirm(true)">
                   Delete
                </button>
             </div>
          </div>
        </transition-group>
      </div>
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
