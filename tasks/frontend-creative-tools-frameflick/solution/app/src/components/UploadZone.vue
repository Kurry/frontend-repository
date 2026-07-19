<template>
  <div
    class="upload-zone"
    :class="{ dragging: isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
    @click="fileInput?.click()"
    @keydown.enter.prevent="fileInput?.click()"
    @keydown.space.prevent="fileInput?.click()"
    role="button"
    tabindex="0"
    aria-label="Choose or drop a PNG or JPG image"
  >
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onFileChange" />
    <div class="upload-icon" aria-hidden="true">{{ store.imageDataUrl ? '🔄' : '⬆️' }}</div>
    <div class="upload-text">
      {{ store.imageDataUrl ? 'Replace image' : 'Drop PNG/JPG here' }}
    </div>
    <span class="upload-link">Choose image</span>
    <div v-if="error" class="error-msg" role="alert" style="margin-top: 8px;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useRecentStore } from '../stores/recent'

const store = useCanvasStore()
const recentStore = useRecentStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const error = ref('')

function processFile(file: File) {
  error.value = ''
  if (!file.type.startsWith('image/')) {
    error.value = 'Unsupported file type. Choose a PNG or JPG image.'
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    error.value = 'File too large (max 20MB)'
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    store.imageDataUrl = dataUrl
    store.imageName = file.name
    store.resetPosition()
    // Add to recent after a tick so current settings are captured
    setTimeout(() => {
      recentStore.addRecent(dataUrl, file.name, store.getSettings() as Record<string, unknown>)
    }, 50)
  }
  reader.readAsDataURL(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    processFile(file)
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #92400e;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fffbf0;
}
.upload-zone:hover, .upload-zone.dragging {
  border-color: #FDE047;
  background: #fef9e0;
  box-shadow: 0 0 0 4px rgba(253,224,71,0.15);
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
</style>
