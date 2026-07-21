<template>
  <div class="upload-panel panel-card">
    <h2 class="panel-title">Upload</h2>
    <div
      class="upload-zone"
      :class="{ dragging: isDragging }"
      role="button"
      tabindex="0"
      aria-label="Choose or drop a PNG or JPG image"
      @dragover.prevent="isDragging = true"
      @dragenter.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
      @keydown.enter.prevent="fileInput?.click()"
      @keydown.space.prevent="fileInput?.click()"
    >
      <input ref="fileInput" type="file" accept="image/png,image/jpeg" hidden @change="onFileChange" aria-hidden="true" tabindex="-1" />
      <div class="upload-icon" aria-hidden="true">{{ store.imageDataUrl ? '🔄' : '⬆️' }}</div>
      <div class="upload-text">{{ store.imageDataUrl ? 'Replace image' : 'Drop PNG/JPG here' }}</div>
      <span class="upload-link">Choose image</span>
    </div>
    <button type="button" class="pill-btn secondary sample-btn" @click="loadSample">
      ✨ Use sample image
    </button>
    <p class="upload-hint">No file handy? Load a built-in sample screenshot to explore every control.</p>
    <div v-if="error" class="error-msg fade-in" role="alert">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useRecentStore } from '../stores/recent'
import { useAnnouncer } from '../stores/announcer'
import { useHistoryStore } from '../stores/history'
import { makeSampleImage } from '../utils/sampleImage'

const store = useCanvasStore()
const recentStore = useRecentStore()
const announcer = useAnnouncer()
const history = useHistoryStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const error = ref('')

let sampleCounter = 0

const MAX_DIM = 1024

/** Re-encode the upload as a compact data URL (bounded dimensions, JPEG/PNG). */
function compactDataUrl(rawDataUrl: string, mime: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * scale))
      const h = Math.max(1, Math.round(img.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const outMime = mime === 'image/png' ? 'image/png' : 'image/jpeg'
      try {
        resolve(canvas.toDataURL(outMime, outMime === 'image/jpeg' ? 0.85 : undefined))
      } catch {
        resolve(rawDataUrl)
      }
    }
    img.onerror = () => resolve(rawDataUrl)
    img.src = rawDataUrl
  })
}

function reject(message: string) {
  error.value = message
  announcer.announce(message)
}

function loadOntoCanvas(dataUrl: string, name: string) {
  history.markDiscrete()
  // Capture the outgoing image's final settings onto its Recent entry first.
  const previous = recentStore.items.find(i => i.id === recentStore.activeId)
  if (previous) recentStore.updateSettings(previous.id, store.getSettings())

  store.imageDataUrl = dataUrl
  store.imageName = name
  store.posX = 0
  store.posY = 0
  // A freshly loaded image keeps the currently selected style settings, and the
  // look at load time becomes its Before/After baseline.
  store.captureBaseline()
  recentStore.addRecent(dataUrl, name, store.getSettings(), store.getSettings())
  error.value = ''
  announcer.announce(`${name} loaded onto the canvas.`)
}

async function processFile(file: File) {
  if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
    reject('Unsupported file type. Choose a PNG or JPG image.')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    reject('File too large. Choose a PNG or JPG under 20 MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = async e => {
    const raw = e.target?.result as string
    const compact = await compactDataUrl(raw, file.type)
    loadOntoCanvas(compact, file.name || 'upload.png')
  }
  reader.onerror = () => reject('Unsupported file type. Choose a PNG or JPG image.')
  reader.readAsDataURL(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    void processFile(file)
    return
  }
  // Accept a dropped data URL (e.g. dragged from another tab or tooling).
  const text = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || ''
  if (text.trim().startsWith('data:image/png') || text.trim().startsWith('data:image/jpeg')) {
    const mime = text.trim().startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
    void compactDataUrl(text.trim(), mime).then(compact => loadOntoCanvas(compact, 'dropped-image.png'))
    return
  }
  reject('Unsupported file type. Choose a PNG or JPG image.')
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    void processFile(file)
    ;(e.target as HTMLInputElement).value = ''
  }
}

function loadSample() {
  const { dataUrl, name } = makeSampleImage(sampleCounter)
  sampleCounter += 1
  loadOntoCanvas(dataUrl, name)
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #92400e;
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  background: #fffbf0;
}
.upload-zone:hover, .upload-zone.dragging {
  border-color: #FDE047;
  background: #fef9e0;
  box-shadow: 0 0 0 4px rgba(253, 224, 71, 0.2);
}
.upload-icon { font-size: 28px; margin-bottom: 8px; }
.upload-text { font-weight: 700; font-size: 13px; color: #713F12; }
.upload-link {
  display: inline-block;
  margin-top: 8px;
  color: #713F12;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
}
.sample-btn {
  width: 100%;
  margin-top: 8px;
}
.upload-hint {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.4;
  color: #92400e;
}
.fade-in {
  animation: feedback-in 0.2s ease-out;
}
@keyframes feedback-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .fade-in { animation: none; }
}
</style>
