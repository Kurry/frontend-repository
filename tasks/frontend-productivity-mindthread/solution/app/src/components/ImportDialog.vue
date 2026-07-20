<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl"
        :aria-describedby="undefined"
      >
        <DialogTitle class="mb-4 font-heading text-xl font-bold text-ink">Import Workspace</DialogTitle>

        <div v-if="!confirming">
          <p class="mb-4 text-sm text-inksoft">
            Paste your Workspace JSON below to replace your current workspace.
          </p>
          <label for="import-json" class="field-label">Import Workspace JSON</label>
          <textarea
            id="import-json"
            v-model="importText"
            class="input-field mb-2 h-40 w-full font-mono text-sm"
            placeholder="Paste JSON here..."
          ></textarea>
          <p v-if="error" class="mb-4 text-sm text-error">{{ error }}</p>
          <div class="flex justify-end gap-3">
            <DialogClose class="btn-secondary">Cancel</DialogClose>
            <button type="button" class="btn-primary" :disabled="!importText.trim()" @click="handleValidate">
              Review Import
            </button>
          </div>
        </div>

        <div v-else>
          <p class="mb-4 text-sm font-bold text-error">
            Warning: This will completely replace your current workspace data.
          </p>
          <p class="mb-4 text-sm text-inksoft">Are you sure you want to proceed?</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn-secondary" @click="confirming = false">Back</button>
            <button type="button" class="btn-danger" @click="handleImport">Confirm Import</button>
          </div>
        </div>

        <DialogClose
          class="absolute right-4 top-4 text-inksoft transition-colors hover:text-ink focus-ring"
          aria-label="Close import dialog"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { z } from 'zod'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { useSparkStore, WorkspaceJSONSchema } from '../stores/sparkStore'
import { showToast } from '../utils/toast'

const open = defineModel<boolean>('open', { default: false })

const store = useSparkStore()
const importText = ref('')
const error = ref('')
const confirming = ref(false)
let parsedData: z.infer<typeof WorkspaceJSONSchema> | null = null

watch(open, value => {
  if (value) {
    importText.value = ''
    error.value = ''
    confirming.value = false
    parsedData = null
  }
})

function handleValidate() {
  error.value = ''
  try {
    parsedData = JSON.parse(importText.value)
    const result = WorkspaceJSONSchema.safeParse(parsedData)
    if (result.success) {
      parsedData = result.data
      confirming.value = true
    } else {
      error.value = result.error.issues[0]?.message ?? 'Invalid Workspace JSON'
      parsedData = null
    }
  } catch {
    error.value = 'Invalid JSON format'
    parsedData = null
  }
}

function handleImport() {
  if (!parsedData) return
  store.setWorkspace(parsedData)
  showToast('Workspace imported successfully', 'success')
  open.value = false
}
</script>
