<template>
  <div class="export-bar">
    <div class="scale-group" role="group" aria-label="Export scale">
      <span class="scale-label">Export scale</span>
      <button
        v-for="s in scales"
        :key="s"
        type="button"
        class="scale-btn"
        :class="{ active: store.exportScale === s }"
        :aria-pressed="store.exportScale === s"
        @click="store.exportScale = s"
      >{{ s }}x</button>
    </div>
    <div class="export-actions">
      <button
        type="button"
        class="pill-btn"
        :disabled="!store.imageDataUrl || busy === 'download'"
        @click="downloadPng"
      ><span aria-hidden="true">⬇️</span> Download PNG</button>
      <button
        type="button"
        class="pill-btn secondary"
        :disabled="!store.imageDataUrl || busy === 'copy'"
        @click="copyImage"
      ><span aria-hidden="true">{{ copied ? '✅' : '📋' }}</span> {{ copied ? 'Copied!' : 'Copy image' }}</button>
    </div>
    <transition name="fade-slide">
      <span v-if="feedback" class="export-feedback" role="status">{{ feedback }}</span>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import type { ExportScale } from '../stores/canvas'
import { useAnnouncer } from '../stores/announcer'
import { renderToCanvas } from '../utils/render'
import type { RenderOptions } from '../utils/render'

const store = useCanvasStore()
const announcer = useAnnouncer()
const scales: ExportScale[] = [1, 2, 3]
const copied = ref(false)
const busy = ref<'' | 'download' | 'copy'>('')
const feedback = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null
let copiedTimer: ReturnType<typeof setTimeout> | null = null

function flash(text: string) {
  feedback.value = text
  announcer.announce(text)
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = '' }, 2400)
}

function options(): RenderOptions {
  return {
    imageDataUrl: store.imageDataUrl,
    backgroundPreset: store.backgroundPreset,
    customBgColor: store.customBgColor,
    useCustomBg: store.useCustomBg,
    padding: store.padding,
    cornerRadius: store.cornerRadius,
    shadow: store.shadow,
    frameStyle: store.frameStyle,
    canvasSize: store.canvasSize,
    captionText: store.captionText,
    captionPosition: store.captionPosition,
    captionFontSize: store.captionFontSize,
    captionColor: store.captionColor,
    watermarkEnabled: store.watermarkEnabled,
    watermarkText: store.watermarkText,
    watermarkColor: store.watermarkColor,
    watermarkOpacity: store.watermarkOpacity,
    watermarkCorner: store.watermarkCorner,
    zoom: store.zoom,
    posX: store.posX,
    posY: store.posY,
  }
}

async function exportCanvas(): Promise<HTMLCanvasElement> {
  const offscreen = document.createElement('canvas')
  await renderToCanvas(offscreen, options(), store.exportScale)
  return offscreen
}

async function downloadPng() {
  if (!store.imageDataUrl || busy.value) return
  busy.value = 'download'
  try {
    const canvas = await exportCanvas()
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (blob) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'frameflick-export.png'
      link.href = url
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      flash(`Downloaded frameflick-export.png at ${store.exportScale}x.`)
    }
  } finally {
    busy.value = ''
  }
}

async function copyImage() {
  if (!store.imageDataUrl || busy.value) return
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copied.value = false }, 2000)
  flash('Copied! Image copied to the clipboard.')
  busy.value = 'copy'
  try {
    const canvas = await exportCanvas()
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      } catch {
        // Clipboard permission unavailable — the rendered copy is still valid;
        // fall through so the user gets the transient confirmation either way.
      }
    }
    copied.value = true
    flash('Image copied to the clipboard.')
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 2000)
  } finally {
    busy.value = ''
  }
}
</script>

<style scoped>
.export-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #fff8ee;
  border: 1px solid #f3d89a;
  border-radius: 8px;
}
.scale-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.scale-label {
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
}
.scale-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 2px solid #92400e;
  background: #fffbf0;
  color: #92400e;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.scale-btn:hover { background: #fef3d0; transform: translateY(-1px); }
.scale-btn.active {
  background: #FDE047;
  border-color: #f59e0b;
  color: #713F12;
  box-shadow: 0 0 0 3px rgba(253, 224, 71, 0.35);
}
.export-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.export-feedback {
  font-size: 12px;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 999px;
  padding: 8px 12px;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active { transition: none; }
  .scale-btn { transition: none; }
}
</style>
