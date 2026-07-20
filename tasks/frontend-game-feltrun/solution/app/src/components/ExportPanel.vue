<template>
  <section class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-3">Export session</h2>
    <p class="caption mb-4">Export or import a complete session artifact in JSON format.</p>

    <div class="flex flex-wrap items-end gap-2 mb-4">
      <label class="flex flex-col gap-1 caption" style="font-size: 13px;">
        Difficulty
        <select v-model="s.difficulty" class="field" aria-label="Difficulty">
          <option>Easy</option>
          <option>Standard</option>
          <option>Hard</option>
        </select>
      </label>
      <button class="btn btn-sm" @click="saveTable">Save table</button>
      <button class="btn btn-sm" :disabled="!s.savedTable" @click="loadSavedTable">Load saved table</button>
      <button class="btn btn-sm" :disabled="!s.undoSnapshot || s.phase === 'handOver'" @click="undoLastAction">Undo last action</button>
    </div>

    <!-- Preview & Export -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label :for="previewId" class="font-semibold" style="font-size: 15px;">Session preview</label>
        <div class="flex items-center gap-2">
          <button class="btn btn-sm" @click="copyExport">Copy</button>
          <button class="btn btn-sm" @click="downloadExport">Download</button>
        </div>
      </div>
      <textarea
        :id="previewId"
        readonly
        class="field w-full num font-mono text-xs p-3"
        style="min-height: 200px; resize: vertical; white-space: pre;"
        :value="exportJson"
        aria-label="Session JSON preview"
      ></textarea>
      
      <!-- Polite live region for copy confirmation -->
      <p 
        role="status" 
        aria-live="polite" 
        class="mt-2 text-sm font-semibold min-h-[20px]" 
        style="color: var(--color-good);"
      >
        {{ copyMessage }}
      </p>
    </div>

    <!-- Import -->
    <form @submit.prevent="handleImport" class="flex flex-col gap-2">
      <label :for="importId" class="font-semibold" style="font-size: 15px;">Import session</label>
      <div class="flex items-start gap-2">
        <div class="flex-grow">
          <input
            :id="importId"
            v-model="importText"
            type="text"
            class="field w-full font-mono text-sm"
            placeholder="Paste JSON here..."
          />
          <p v-if="visibleImportError" role="alert" class="text-sm mt-1" style="color: var(--color-bad);">
            {{ visibleImportError }}
          </p>
        </div>
        <button type="submit" class="btn" :disabled="!importIsValid">Import</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useField } from 'vee-validate'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s } = storeToRefs(store)
const headingId = useId()
const previewId = useId()
const importId = useId()

const copyMessage = ref('')
const importResultError = ref('')
const {
  value: importText,
  errorMessage: importFieldError,
  validate: validateImport,
  resetField: resetImportField,
} = useField<string>('sessionImport', (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return 'Import field: session JSON is required'
  const result = store.validateSessionJson(value)
  return result.success ? true : `Import field: ${result.error}`
}, { initialValue: '', validateOnValueUpdate: false })
const visibleImportError = computed(() => importResultError.value || importFieldError.value || '')
const importIsValid = computed(() => {
  if (!importText.value.trim()) return false
  return store.validateSessionJson(importText.value).success
})

const exportJson = computed(() => {
  return store.generateExportJson()
})

async function copyExport() {
  try {
    await navigator.clipboard.writeText(exportJson.value)
    copyMessage.value = 'Copied to clipboard'
    setTimeout(() => {
      copyMessage.value = ''
    }, 3000)
  } catch {
    copyMessage.value = 'Copy to clipboard failed'
    setTimeout(() => {
      copyMessage.value = ''
    }, 3000)
  }
}

function downloadExport() {
  const blob = new Blob([exportJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `feltrun-session-${new Date().getTime()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport() {
  importResultError.value = ''
  const validation = await validateImport()
  if (!validation.valid) return
  
  const result = store.importSessionJson(importText.value)
  if (!result.success) {
    importResultError.value = `Import field: ${result.error}`
  } else {
    resetImportField({ value: '' })
    copyMessage.value = 'Session imported successfully'
    setTimeout(() => {
      copyMessage.value = ''
    }, 3000)
  }
}

function showControlMessage(message: string) {
  copyMessage.value = message
  setTimeout(() => { copyMessage.value = '' }, 3000)
}

function saveTable() {
  store.saveTable()
  showControlMessage('Table saved')
}

function loadSavedTable() {
  if (store.loadSavedTable()) {
    showControlMessage('Saved table loaded')
  } else {
    showControlMessage('Saved table could not be loaded')
  }
}

function undoLastAction() {
  if (store.undoAction()) {
    showControlMessage('Last action undone')
  } else {
    showControlMessage('No action available to undo')
  }
}
</script>
