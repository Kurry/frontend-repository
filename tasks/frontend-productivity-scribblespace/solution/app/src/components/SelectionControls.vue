<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()

const selectionCount = computed(() => store.selectedIds.length)

// Additional check if there's only one selected object
const singleSelectedId = computed(() => selectionCount.value === 1 ? store.selectedIds[0] : null)
</script>

<template>
  <div v-if="selectionCount > 0" class="flex flex-wrap items-center gap-2 px-3 py-2 bg-white/95 shadow-md w-full rounded-xl border border-gray-200">
    <span class="font-semibold text-sm text-gray-700 min-w-[80px]">
      {{ selectionCount }} selected
    </span>

    <div aria-hidden="true" class="w-px h-6 self-center bg-gray-200"></div>

    <button type="button" class="btn-action" @click="store.setShowDeleteConfirm(true)">
      Delete Selected
    </button>
    <button type="button" class="btn-action" @click="store.duplicateSelectedObjects()">
      Duplicate Selected
    </button>
    <button type="button" class="btn-action" @click="store.archiveSelectedObjects()">
      Archive Selected
    </button>
    <button type="button" class="btn-action" @click="store.deselectAll()">
      Clear selection
    </button>

    <template v-if="singleSelectedId">
      <div aria-hidden="true" class="w-px h-6 self-center bg-gray-200"></div>
      <button type="button" class="btn-action" @click="store.bringToFront(singleSelectedId)">
        Bring to Front
      </button>
      <button type="button" class="btn-action" @click="store.sendToBack(singleSelectedId)">
        Send to Back
      </button>

      <!-- Non-drag move/resize controls -->
      <div class="flex items-center gap-1 ml-auto">
        <button type="button" class="btn-icon" aria-label="Move left" @click="store.moveObject({ id: singleSelectedId, dx: -24, dy: 0 })">
           <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12 L6 8 L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <div class="flex flex-col gap-1">
          <button type="button" class="btn-icon" aria-label="Move up" @click="store.moveObject({ id: singleSelectedId, dx: 0, dy: -24 })">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 10 L8 6 L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <button type="button" class="btn-icon" aria-label="Move down" @click="store.moveObject({ id: singleSelectedId, dx: 0, dy: 24 })">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6 L8 10 L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <button type="button" class="btn-icon" aria-label="Move right" @click="store.moveObject({ id: singleSelectedId, dx: 24, dy: 0 })">
           <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12 L10 8 L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div class="flex items-center gap-1 ml-2">
         <button type="button" class="btn-action" @click="store.resizeObject({ id: singleSelectedId, dw: 24, dh: 24 })">
           Grow
         </button>
         <button type="button" class="btn-action" @click="store.resizeObject({ id: singleSelectedId, dw: -24, dh: -24 })">
           Shrink
         </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "../index.css";
.btn-action {
  @apply bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-medium rounded px-3 py-1 text-xs;
}
.btn-icon {
  @apply bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded p-1 flex items-center justify-center;
}
</style>
