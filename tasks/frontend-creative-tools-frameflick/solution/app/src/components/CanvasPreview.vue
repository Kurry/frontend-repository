<template>
  <div class="canvas-wrapper">
    <div
      class="canvas-container"
      :class="{ 'is-dragging': dragging }"
      @pointerdown="onPointerDown"
    >
      <canvas
        ref="afterCanvas"
        class="main-canvas layer after-layer"
        :class="{ faded: store.showingBefore }"
        tabindex="-1"
        aria-hidden="true"
      />
      <canvas
        ref="beforeCanvas"
        class="main-canvas layer before-layer"
        :class="{ visible: store.showingBefore }"
        tabindex="-1"
        aria-hidden="true"
      />
      <canvas
        ref="hitCanvas"
        class="hit-layer"
        :tabindex="store.imageDataUrl ? 0 : -1"
        role="img"
        :aria-label="store.imageDataUrl
          ? 'Composed canvas preview. Use arrow keys to reposition the screenshot.'
          : 'Empty canvas. Upload an image to get started.'"
        @keydown="onKeyDown"
      />
      <div v-if="dragging" class="drag-status" role="status">Moving image</div>
      <div v-if="!store.imageDataUrl" class="canvas-placeholder">
        <div class="placeholder-inner">
          <div class="placeholder-icon" aria-hidden="true">🖼️</div>
          <div class="placeholder-text">Upload an image to get started</div>
          <div class="placeholder-sub">Drop a PNG/JPG into the upload panel, or use a sample image.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { renderToCanvas } from '../utils/render'
import type { RenderOptions } from '../utils/render'

const store = useCanvasStore()
const history = useHistoryStore()
const afterCanvas = ref<HTMLCanvasElement | null>(null)
const beforeCanvas = ref<HTMLCanvasElement | null>(null)
const hitCanvas = ref<HTMLCanvasElement | null>(null)

let afterScheduled = false
let beforeScheduled = false

function currentOptions(): RenderOptions {
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

function baselineOptions(): RenderOptions {
  const b = store.baseline
  return {
    imageDataUrl: store.imageDataUrl,
    backgroundPreset: b.backgroundPreset,
    customBgColor: b.customBgColor,
    useCustomBg: b.useCustomBg,
    padding: b.padding,
    cornerRadius: b.cornerRadius,
    shadow: b.shadow,
    frameStyle: b.frameStyle,
    canvasSize: b.canvasSize,
    captionText: b.captionText,
    captionPosition: b.captionPosition,
    captionFontSize: b.captionFontSize,
    captionColor: b.captionColor,
    watermarkEnabled: b.watermarkEnabled,
    watermarkText: b.watermarkText,
    watermarkColor: b.watermarkColor,
    watermarkOpacity: b.watermarkOpacity,
    watermarkCorner: b.watermarkCorner,
    zoom: b.zoom,
    posX: b.posX,
    posY: b.posY,
  }
}

async function renderAfter() {
  if (!afterCanvas.value) return
  afterScheduled = false
  await renderToCanvas(afterCanvas.value, currentOptions(), 1)
}
async function renderBefore() {
  if (!beforeCanvas.value) return
  beforeScheduled = false
  await renderToCanvas(beforeCanvas.value, baselineOptions(), 1)
}

function scheduleAfter() {
  if (afterScheduled) return
  afterScheduled = true
  requestAnimationFrame(() => void renderAfter())
}
function scheduleBefore() {
  if (beforeScheduled) return
  beforeScheduled = true
  requestAnimationFrame(() => void renderBefore())
}

// Expose for export + WebMCP preview.
defineExpose({ canvasEl: afterCanvas, doRender: renderAfter })

watch(() => store.getSettings(), scheduleAfter, { deep: true, immediate: true })
watch(
  () => [store.imageDataUrl, store.baseline] as const,
  scheduleBefore,
  { deep: true, immediate: true }
)

// ---- Drag to reposition (pointer events = mouse + touch + pen) -------------
const dragging = ref(false)
let lastX = 0
let lastY = 0
let dragStartX = 0
let dragStartY = 0
// The element that owns the drag listeners + pointer capture, so any teardown
// path (pointer up/cancel, or Escape from either key handler) can remove them.
let dragTarget: HTMLElement | null = null
let dragPointerId = -1

function displayScale(): number {
  const el = afterCanvas.value
  if (!el) return 1
  const rect = el.getBoundingClientRect()
  return rect.width > 0 ? el.width / rect.width : 1
}

/** Remove every listener + capture registered by onPointerDown and end the drag. */
function teardownDrag() {
  const target = dragTarget
  if (target) {
    target.removeEventListener('pointermove', onPointerMove)
    target.removeEventListener('pointerup', onPointerUp)
    target.removeEventListener('pointercancel', onPointerCancel)
    if (dragPointerId !== -1) {
      try {
        if (target.hasPointerCapture(dragPointerId)) target.releasePointerCapture(dragPointerId)
      } catch { /* noop */ }
    }
  }
  window.removeEventListener('keydown', onDragEscape)
  dragTarget = null
  dragPointerId = -1
  dragging.value = false
}

/** Cancel the drag: revert to the pre-drag position, then tear everything down. */
function cancelDrag() {
  store.posX = dragStartX
  store.posY = dragStartY
  teardownDrag()
}

function onDragEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && dragging.value) {
    e.preventDefault()
    cancelDrag()
  }
}

function onPointerDown(e: PointerEvent) {
  if (!store.imageDataUrl || store.showingBefore) return
  if (e.button !== 0) return
  const target = e.currentTarget as HTMLElement
  dragging.value = true
  history.markDiscrete() // a drag commits as one undo entry
  lastX = e.clientX
  lastY = e.clientY
  dragStartX = store.posX
  dragStartY = store.posY
  dragTarget = target
  dragPointerId = e.pointerId
  try { target.setPointerCapture(e.pointerId) } catch { /* noop */ }
  target.addEventListener('pointermove', onPointerMove)
  target.addEventListener('pointerup', onPointerUp)
  target.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('keydown', onDragEscape)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const s = displayScale()
  const dx = (e.clientX - lastX) * s
  const dy = (e.clientY - lastY) * s
  lastX = e.clientX
  lastY = e.clientY
  store.posX += dx
  store.posY += dy
}

function onPointerUp() {
  if (!dragging.value) return
  teardownDrag() // releasing commits the position
}

function onPointerCancel() {
  if (!dragging.value) return
  cancelDrag()
}

function onKeyDown(e: KeyboardEvent) {
  if (!store.imageDataUrl) return
  if (e.key === 'Escape' && dragging.value) {
    e.preventDefault()
    cancelDrag() // revert + drop listeners/capture, same as the window handler
    return
  }
  // Position is locked while previewing Before, same as pointer drag — nudging
  // would silently edit the live composition hidden behind the baseline view.
  if (store.showingBefore) return
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
  e.preventDefault()
  const step = e.shiftKey ? 20 : 5
  if (e.key === 'ArrowUp') store.posY -= step
  if (e.key === 'ArrowDown') store.posY += step
  if (e.key === 'ArrowLeft') store.posX -= step
  if (e.key === 'ArrowRight') store.posX += step
}

onMounted(() => {
  scheduleAfter()
  scheduleBefore()
})
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}
.canvas-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(113, 63, 18, 0.18);
  max-width: 100%;
  background: #fde68a;
  transition: outline-color 0.15s ease, box-shadow 0.15s ease;
  outline: 4px solid transparent;
  outline-offset: 4px;
  cursor: grab;
}
.canvas-container.is-dragging {
  cursor: grabbing;
  outline-color: #2563eb;
  box-shadow: 0 12px 40px rgba(37, 99, 235, 0.35);
}
.layer {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}
.after-layer {
  position: relative;
  z-index: 1;
  opacity: 1;
  transition: opacity 0.28s ease;
}
.after-layer.faded { opacity: 0; }
.before-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.28s ease;
  pointer-events: none;
}
.before-layer.visible { opacity: 1; }
.hit-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: inherit;
}
.hit-layer:focus-visible {
  opacity: 1;
  outline: 3px solid #2563eb;
  outline-offset: -3px;
  background: rgba(37, 99, 235, 0.08);
}
.canvas-placeholder {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.placeholder-inner {
  text-align: center;
  color: #713F12;
  padding: 16px;
}
.placeholder-icon { font-size: 48px; margin-bottom: 12px; }
.placeholder-text { font-size: 16px; font-weight: 700; }
.placeholder-sub { font-size: 12px; margin-top: 8px; color: #92400e; }
.drag-status {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 5;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 999px;
  background: #713F12;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
  animation: feedback-in 0.18s ease-out;
}
@keyframes feedback-in {
  from { opacity: 0; transform: translate(-50%, -4px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .after-layer,
  .before-layer { transition: none; }
  .drag-status { animation: none; }
}
</style>
