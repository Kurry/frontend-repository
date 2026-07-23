<template>
  <DialogRoot :open="isOpen" @update:open="isOpen = $event">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogContent class="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl bg-surface shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[24%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[24%]" :aria-describedby="undefined">
        <DialogTitle class="sr-only">Command Palette</DialogTitle>
        <ComboboxRoot v-model="selectedAction" @update:modelValue="handleAction">
          <ComboboxInput
            class="w-full bg-transparent p-4 text-ink outline-none placeholder:text-inksoft border-b border-linesoft"
            placeholder="Search commands..."
            auto-focus
          />
          <ComboboxContent class="max-h-60 overflow-auto p-2">
            <ComboboxEmpty class="p-4 text-center text-sm text-inksoft">
              No results found.
            </ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem
                v-for="action in actions"
                :key="action.id"
                :value="action"
                class="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-ink hover:bg-hoverwash data-[highlighted]:bg-hoverwash data-[highlighted]:text-primary"
              >
                {{ action.label }}
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxContent>
        </ComboboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
  ComboboxRoot, ComboboxInput, ComboboxContent, ComboboxGroup, ComboboxItem, ComboboxEmpty
} from 'reka-ui'
import { useUiStore } from '../stores/uiStore'

const isOpen = ref(false)
const selectedAction = ref(null)

const emit = defineEmits<{
  (e: 'open-export'): void
  (e: 'open-import'): void
}>()

const ui = useUiStore()

const actions = [
  { id: 'home', label: 'Go to Home' },
  { id: 'today', label: 'Go to Today' },
  { id: 'archived', label: 'Go to Archived' },
  { id: 'capture', label: 'Focus capture bar' },
  { id: 'export', label: 'Export Workspace JSON' },
  { id: 'import', label: 'Import Workspace JSON' }
]

function handleAction(action: any) {
  if (!action) return
  isOpen.value = false
  setTimeout(() => {
    switch (action.id) {
      case 'home':
        ui.setView('home')
        break
      case 'today':
        ui.setView('today')
        break
      case 'archived':
        ui.setView('archived')
        break
      case 'capture':
        ui.setView('home')
        setTimeout(() => document.getElementById('capture-input')?.focus(), 50)
        break
      case 'export':
        emit('open-export')
        break
      case 'import':
        emit('open-import')
        break
    }
    selectedAction.value = null
  }, 10)
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
