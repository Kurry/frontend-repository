<template>
  <section class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-3">Export session</h2>
    <p class="caption mb-4">Export or import a complete session artifact in JSON format.</p>

    <div class="flex flex-wrap items-end gap-2 mb-2">
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
    <p class="caption m-0 mb-4" style="font-size: 12px;">
      Easy folds often and plays passively · Standard is balanced · Hard calls and raises more, folding less.
    </p>

    <!-- Two portable views of the same session -->
    <TabsRoot v-model="tab" class="mb-4" default-value="json">
      <TabsList class="flex gap-2 mb-2" aria-label="Export view">
        <TabsTrigger value="json" class="tab tab-sm" :class="{ 'tab-on': tab === 'json' }">Session JSON</TabsTrigger>
        <TabsTrigger value="text" class="tab tab-sm" :class="{ 'tab-on': tab === 'text' }">Hand log</TabsTrigger>
      </TabsList>

      <TabsContent value="json">
        <div class="flex items-center justify-between mb-2">
          <label :for="previewId" class="font-semibold" style="font-size: 15px;">Session preview</label>
          <div class="flex items-center gap-2">
            <button class="btn btn-sm" aria-label="Copy session JSON" @click="copyJson">Copy</button>
            <button class="btn btn-sm" aria-label="Download session JSON" @click="downloadJson">Download</button>
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
      </TabsContent>

      <TabsContent value="text">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold" style="font-size: 15px;">Readable hand log</span>
          <div class="flex items-center gap-2">
            <button class="btn btn-sm" @click="copyText">Copy</button>
            <button class="btn btn-sm" @click="downloadText">Download</button>
          </div>
        </div>
        <pre class="field w-full font-mono text-xs p-3" style="min-height: 200px; overflow: auto; white-space: pre-wrap;" aria-label="Readable hand log preview">{{ exportText }}</pre>
      </TabsContent>
    </TabsRoot>

    <!-- Polite live region for copy / save / load feedback -->
    <p
      role="status"
      aria-live="polite"
      class="mt-2 text-sm font-semibold min-h-[20px]"
      style="color: var(--color-good);"
    >
      {{ copyMessage }}
    </p>

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
            aria-describedby="import-error-slot"
          />
          <p id="import-error-slot" v-if="visibleImportError" role="status" aria-live="polite" class="text-sm mt-1" style="color: var(--color-bad);">
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
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { useField } from 'vee-validate'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s } = storeToRefs(store)
const headingId = useId()
const previewId = useId()
const importId = useId()

const tab = ref<'json' | 'text'>('json')
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

const exportJson = computed(() => store.generateExportJson())
const exportText = computed(() => store.generateHandHistoryText())

function flash(message: string) {
  copyMessage.value = message
  window.setTimeout(() => { copyMessage.value = '' }, 3000)
}

async function writeClipboard(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    flash(okMsg)
  } catch {
    flash('Copy to clipboard failed')
  }
}
function downloadFile(text: string, name: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function copyJson() { writeClipboard(exportJson.value, 'Copied session JSON to clipboard') }
function downloadJson() { downloadFile(exportJson.value, `feltrun-session-${Date.now()}.json`); flash('Downloaded session JSON') }
function copyText() { writeClipboard(exportText.value, 'Copied hand log to clipboard') }
function downloadText() { downloadFile(exportText.value, `feltrun-hands-${Date.now()}.txt`); flash('Downloaded hand log') }

async function handleImport() {
  importResultError.value = ''
  const validation = await validateImport()
  if (!validation.valid) return
  const result = store.importSessionJson(importText.value)
  if (!result.success) {
    importResultError.value = `Import field: ${result.error}`
  } else {
    resetImportField({ value: '' })
    flash('Session imported successfully')
  }
}

function saveTable() {
  store.saveTable()
  flash('Table saved')
}
function loadSavedTable() {
  flash(store.loadSavedTable() ? 'Saved table loaded' : 'Saved table could not be loaded')
}
function undoLastAction() {
  flash(store.undoAction() ? 'Last action undone' : 'No action available to undo')
}
</script>

<style scoped>
.tab-sm {
  padding: 8px 14px;
  min-height: 40px;
  font-size: 14px;
}
.tab-on {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background-color: #0b1a2e;
  font-weight: 700;
}
</style>
