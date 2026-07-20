<template>
  <DialogRoot :open="isOpen" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl" :aria-describedby="undefined">
        <DialogTitle class="font-heading text-xl font-bold text-ink mb-4">Import Workspace</DialogTitle>

        <div v-if="!confirming">
          <p class="text-sm text-inksoft mb-4">Paste your Workspace JSON below to replace your current workspace.</p>
          <textarea
            v-model="importText"
            class="w-full h-40 input-field font-mono text-sm mb-2"
            placeholder="Paste JSON here..."
          ></textarea>
          <p v-if="error" class="text-error text-sm mb-4">{{ error }}</p>
          <div class="flex justify-end gap-3">
            <DialogClose class="btn-secondary">Cancel</DialogClose>
            <button class="btn-primary" @click="handleValidate" :disabled="!importText">Review Import</button>
          </div>
        </div>

        <div v-else>
          <p class="text-sm text-ink mb-4 font-bold text-error">Warning: This will completely replace your current workspace data.</p>
          <p class="text-sm text-inksoft mb-4">Are you sure you want to proceed?</p>
          <div class="flex justify-end gap-3">
            <button class="btn-secondary" @click="confirming = false">Back</button>
            <button class="btn-danger" @click="handleImport">Confirm Import</button>
          </div>
        </div>

        <DialogClose class="absolute top-4 right-4 text-inksoft hover:text-ink">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose
} from 'reka-ui'
import { useSparkStore, WorkspaceJSONSchema } from '../stores/sparkStore'
import { showToast } from '../utils/toast'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'update:open', val: boolean): void }>()

const store = useSparkStore()
const importText = ref('')
const error = ref('')
const confirming = ref(false)
let parsedData: any = null

watch(() => props.isOpen, (open) => {
  if (open) {
    importText.value = ''
    error.value = ''
    confirming.value = false
    parsedData = null
  }
})

function handleValidate() {
  error.value = ''
  try {
    const data = JSON.parse(importText.value)
    const result = WorkspaceJSONSchema.safeParse(data)

    if (result.success) {
      parsedData = result.data
      confirming.value = true
    } else {
      const issue = result.error.issues[0]
      error.value = issue.message || 'Invalid Workspace JSON'
    }
  } catch (e) {
    error.value = 'Invalid JSON format'
  }
}

function handleImport() {
  if (parsedData) {
    store.setWorkspace(parsedData)
    showToast('Workspace imported', 'success')
    emit('update:open', false)
  }
}
</script>
