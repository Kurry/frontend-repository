<template>
  <div class="canvas-wrapper">
    <div class="canvas-container" ref="containerRef" :class="{ 'is-dragging': dragging }">
      <canvas
        ref="canvasEl"
        class="main-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="cancelDrag"
        @keydown="onKeyDown"
        :tabindex="store.imageDataUrl ? 0 : -1"
        aria-label="Canvas preview. Use arrow keys to reposition the image."
        :style="{ cursor: dragging ? 'grabbing' : (store.imageDataUrl ? 'grab' : 'default') }"
      />
      <div v-if="dragging" class="drag-status" role="status">Moving image</div>
      <div v-if="!store.imageDataUrl" class="canvas-placeholder">
        <div class="placeholder-inner">
          <div class="placeholder-icon">🖼</div>
          <div class="placeholder-text">Upload an image to get started</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { renderToCanvas } from '../utils/render'

const store = useCanvasStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let renderPending = false
let renderScheduled = false

async function doRender() {
  if (!canvasEl.value) return
  renderPending = false
  await renderToCanvas(canvasEl.value, {
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
  }, 1)
}

function scheduleRender() {
  if (renderScheduled) return
  renderScheduled = true
  requestAnimationFrame(async () => {
    renderScheduled = false
    await doRender()
  })
}

// Expose for export
defineExpose({ canvasEl, doRender })

watch(
  () => [
    store.imageDataUrl, store.backgroundPreset, store.customBgColor, store.useCustomBg,
    store.padding, store.cornerRadius, store.shadow, store.frameStyle, store.canvasSize,
    store.captionText, store.captionPosition, store.captionFontSize, store.captionColor,
    store.watermarkEnabled, store.watermarkText, store.watermarkOpacity, store.watermarkCorner,
    store.zoom, store.posX, store.posY,
  ],
  scheduleRender,
  { immediate: true }
)

// Drag to reposition
const dragging = ref(false)
let lastX = 0, lastY = 0
let dragStartX = 0, dragStartY = 0

function onMouseDown(e: MouseEvent) {
  if (!store.imageDataUrl) return
  dragging.value = true
  lastX = e.clientX
  lastY = e.clientY
  dragStartX = store.posX
  dragStartY = store.posY
}
function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  store.posX += dx
  store.posY += dy
}
function onMouseUp() { dragging.value = false }
function cancelDrag() {
  if (!dragging.value) return
  store.posX = dragStartX
  store.posY = dragStartY
  dragging.value = false
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && dragging.value) {
    e.preventDefault()
    cancelDrag()
    return
  }
  if (!store.imageDataUrl || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
  e.preventDefault()
  const step = e.shiftKey ? 20 : 5
  if (e.key === 'ArrowUp') store.posY -= step
  if (e.key === 'ArrowDown') store.posY += step
  if (e.key === 'ArrowLeft') store.posX -= step
  if (e.key === 'ArrowRight') store.posX += step
}

onMounted(scheduleRender)
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}
.canvas-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(113,63,18,0.18);
  max-width: 100%;
  background: #fde68a;
}
.canvas-container.is-dragging {
  overflow: visible;
  outline: 4px solid #2563eb;
  outline-offset: 4px;
  box-shadow: 0 12px 40px rgba(37,99,235,0.35);
}
.main-canvas {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}
.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.placeholder-inner {
  text-align: center;
  color: #713F12;
}
.placeholder-icon { font-size: 48px; margin-bottom: 12px; }
.placeholder-text { font-size: 14px; font-weight: 500; }
.drag-status {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 999px;
  background: #713F12;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
}
</style>
