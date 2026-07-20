<template>
  <div class="import-overlay" @click.self="close">
    <div
      ref="dialogEl"
      class="import-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      @keydown="onKeydown"
    >
      <h2 id="import-dialog-title" class="import-title">Import style JSON</h2>
      <p class="import-desc">
        Paste a previously exported RenderSettings recipe, or choose a frameflick-style.json file.
        Every included setting applies live to the canvas.
      </p>
      <label class="sr-only" for="import-text">Style JSON text</label>
      <textarea
        id="import-text"
        ref="textareaEl"
        v-model="text"
        class="import-text"
        rows="8"
        placeholder='Paste style JSON here, e.g. { "backgroundPreset": "Ocean", "padding": 16, "frame": "Browser", ... }'
        spellcheck="false"
      />
      <div class="import-file-row">
        <button type="button" class="pill-btn ghost" @click="fileInput?.click()">Choose JSON file…</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile" />
        <span v-if="fileName" class="file-name">{{ fileName }}</span>
      </div>
      <div v-if="error" class="import-error fade-in" role="alert">{{ error }}</div>
      <div class="import-actions">
        <button ref="cancelEl" type="button" class="pill-btn ghost" @click="close">Cancel</button>
        <button type="button" class="pill-btn" @click="applyImport">Import</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'
import { parseRecipe } from '../utils/recipe'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', result: { ok: boolean; message: string }): void
}>()

const store = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

const text = ref('')
const error = ref('')
const fileName = ref('')
const dialogEl = ref<HTMLElement | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)
const cancelEl = ref<HTMLButtonElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!dialogEl.value) return []
  return Array.from(
    dialogEl.value.querySelectorAll<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.hasAttribute('disabled'))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'Tab') {
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && (active === first || !dialogEl.value?.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    } else if (!dialogEl.value?.contains(active)) {
      e.preventDefault()
      first.focus()
    }
  }
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => { text.value = String(reader.result ?? '') }
  reader.readAsText(file)
}

function applyImport() {
  const result = parseRecipe(text.value, store.getSettings())
  if (!result.ok) {
    error.value = result.error
    announcer.announce(result.error)
    return
  }
  history.markDiscrete()
  store.applySettings(result.settings)
  // Match the preset/snapshot/palette apply paths: leave the Before baseline so
  // the canvas shows the freshly imported look, not the stale baseline preview.
  store.showingBefore = false
  emit('imported', { ok: true, message: 'Style recipe imported — canvas updated.' })
}

function close() {
  emit('close')
}

onMounted(async () => {
  previouslyFocused = document.activeElement as HTMLElement | null
  await nextTick()
  textareaEl.value?.focus()
})

onBeforeUnmount(() => {
  if (previouslyFocused && typeof previouslyFocused.focus === 'function' && document.contains(previouslyFocused)) {
    previouslyFocused.focus()
  }
})
</script>

<style scoped>
.import-overlay {
  position: fixed;
  inset: 0;
  background: rgba(113, 63, 18, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.import-dialog {
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  background: #fffbf0;
  border: 2px solid #92400e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 16px 48px rgba(113, 63, 18, 0.35);
  animation: dialog-in 0.18s ease-out;
}
.import-title {
  font-size: 16px;
  font-weight: 800;
  color: #713F12;
  margin-bottom: 8px;
}
.import-desc {
  font-size: 13px;
  color: #92400e;
  line-height: 1.4;
  margin-bottom: 12px;
}
.import-text {
  width: 100%;
  padding: 12px;
  border: 2px solid #92400e;
  border-radius: 8px;
  background: #fff;
  color: #713F12;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  resize: vertical;
}
.import-text:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
.import-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.file-name { font-size: 12px; font-weight: 600; color: #713F12; }
.import-error {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
}
.import-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.fade-in { animation: feedback-in 0.2s ease-out; }
@keyframes feedback-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dialog-in {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .import-dialog { animation: none; }
  .fade-in { animation: none; }
}
</style>
