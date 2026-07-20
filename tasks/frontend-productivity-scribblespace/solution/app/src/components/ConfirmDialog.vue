<script setup lang="ts">
import { useAppStore } from '../store'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription
} from 'reka-ui'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

const store = useAppStore()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const motionConfigOverlay = computed(() => {
  if (prefersReducedMotion.value) return undefined;
  return {
    initial: { opacity: 0 },
    enter: { opacity: 1, transition: { duration: 150 } },
    leave: { opacity: 0, transition: { duration: 150 } }
  }
})

const motionConfigContent = computed(() => {
  if (prefersReducedMotion.value) return undefined;
  return {
    initial: { opacity: 0, scale: 0.95, y: '-50%', x: '-50%' },
    enter: { opacity: 1, scale: 1, y: '-50%', x: '-50%', transition: { type: 'spring', stiffness: 300, damping: 25 } },
    leave: { opacity: 0, scale: 0.95, y: '-50%', x: '-50%', transition: { duration: 150 } }
  }
})

const handleConfirm = () => {
  store.deleteSelectedObjects()
}

const handleCancel = () => {
  store.setShowDeleteConfirm(false)
}
</script>

<template>
  <DialogRoot :open="store.showDeleteConfirm" @update:open="store.setShowDeleteConfirm($event)">
    <DialogPortal>
      <DialogOverlay v-motion="motionConfigOverlay" class="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300" />
      <DialogContent
        v-motion="motionConfigContent"
        class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[400px] z-50"
      >
        <DialogTitle class="text-xl font-bold text-gray-900 mb-2">Delete Selected</DialogTitle>
        <DialogDescription class="text-gray-600 mb-6">
          Are you sure you want to delete {{ store.selectedIds.length }} object(s) and any attached connectors? This action will move them to the Archive.
        </DialogDescription>

        <div class="flex justify-end gap-3">
          <button type="button" class="btn-cancel" @click="handleCancel">
            Cancel
          </button>
          <button type="button" class="btn-danger" @click="handleConfirm">
            Confirm
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
@reference "../index.css";
.btn-cancel {
  @apply bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg px-4 py-2 text-sm;
}
.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm;
}
</style>
