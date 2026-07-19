<template>
  <div class="export-panel">
    <button class="pill-btn" @click="download" :disabled="!store.imageDataUrl">
      ⬇ Download PNG
    </button>
    <button class="pill-btn secondary" @click="copyImage" :disabled="!store.imageDataUrl || copying">
      {{ copying ? '✓ Copied!' : '📋 Copy image' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { renderToCanvas } from '../utils/render'

const props = defineProps<{ canvasRef: { canvasEl: { value: HTMLCanvasElement | null } } | null }>()
const store = useCanvasStore()
const copying = ref(false)

async function getExportCanvas(): Promise<HTMLCanvasElement> {
  const offscreen = document.createElement('canvas')
  await renderToCanvas(offscreen, {
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
    watermarkOpacity: store.watermarkOpacity,
    watermarkCorner: store.watermarkCorner,
    zoom: store.zoom,
    posX: store.posX,
    posY: store.posY,
  }, 2)
  return offscreen
}

async function download() {
  if (!store.imageDataUrl) return
  const canvas = await getExportCanvas()
  const link = document.createElement('a')
  link.download = 'frameflick-export.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

async function copyImage() {
  if (!store.imageDataUrl || copying.value) return
  copying.value = true
  try {
    const canvas = await getExportCanvas()
    canvas.toBlob(async (blob) => {
      if (!blob) return
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
    }, 'image/png')
  } catch (e) {
    console.warn('Copy failed', e)
  } finally {
    setTimeout(() => { copying.value = false }, 2000)
  }
}
</script>

<style scoped>
.export-panel {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
