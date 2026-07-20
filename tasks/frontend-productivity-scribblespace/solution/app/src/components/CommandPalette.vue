<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from '../store'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem
} from 'reka-ui'

const store = useAppStore()
const isOpen = ref(false)
const query = ref('')

const commands = [
  { id: 'new_note', label: 'New Note' },
  { id: 'new_flashcard', label: 'New Flashcard' },
  { id: 'new_shape_rect', label: 'New Rectangle' },
  { id: 'new_shape_circ', label: 'New Circle' },
  { id: 'new_shape_arr', label: 'New Arrow' },
  { id: 'export_ws', label: 'Export workspace' },
  { id: 'import_ws', label: 'Import workspace' },
  { id: 'toggle_outline', label: 'Toggle Outline View' },
]

const filteredCommands = computed(() => {
  if (!query.value) return commands
  const q = query.value.toLowerCase()
  return commands.filter(c => c.label.toLowerCase().includes(q))
})

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = true
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const placeAt = () => {
  return {
    x: (-store.canvasView.panX + (window.innerWidth || 1024) / 2) / store.canvasView.zoom - 100,
    y: (-store.canvasView.panY + (window.innerHeight || 640) / 2) / store.canvasView.zoom - 75
  }
}

const handleSelect = (id: string | null) => {
  if (!id) return;
  isOpen.value = false
  const pos = placeAt()
  switch (id) {
    case 'new_note': store.addObject({ kind: 'note', x: pos.x, y: pos.y }); break
    case 'new_flashcard': store.addObject({ kind: 'flashcard', x: pos.x, y: pos.y }); break
    case 'new_shape_rect': store.addObject({ kind: 'rectangle', x: pos.x, y: pos.y }); break
    case 'new_shape_circ': store.addObject({ kind: 'circle', x: pos.x, y: pos.y }); break
    case 'new_shape_arr': store.addObject({ kind: 'arrow', x: pos.x, y: pos.y }); break
    case 'export_ws': store.setShowExport(true); break
    // case 'import_ws': is also handled in export dialog
    case 'toggle_outline': store.setViewMode(store.viewMode === 'outline' ? 'canvas' : 'outline'); break
  }
}

watch(isOpen, (val) => {
  if (val) query.value = ''
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300" />
      <DialogContent
        class="fixed top-[20%] left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl w-[480px] z-[60] overflow-hidden"
      >
         <ComboboxRoot
            v-model:search-term="query"
            class="flex flex-col"
            @update:modelValue="handleSelect"
            :open="true"
         >
            <div class="flex items-center px-3 border-b border-gray-200">
               <svg class="text-gray-400 mr-2 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <ComboboxInput
                  class="flex-1 py-4 text-base bg-transparent border-none outline-none placeholder-gray-400 text-gray-900"
                  placeholder="Type a command or search..."
                  autoFocus
               />
            </div>

            <ComboboxContent class="max-h-[300px] overflow-y-auto p-2" :open="true">
               <div v-if="filteredCommands.length === 0" class="p-4 text-sm text-center text-gray-500">
                  No results found.
               </div>
               <ComboboxItem
                  v-for="cmd in filteredCommands"
                  :key="cmd.id"
                  :value="cmd.id"
                  class="px-4 py-2 text-sm text-gray-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-[#F3F0FF] data-[highlighted]:text-[#6D5BD0] flex items-center justify-between"
               >
                  {{ cmd.label }}
               </ComboboxItem>
            </ComboboxContent>
         </ComboboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
