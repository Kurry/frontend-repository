<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store'
import type { CanvasObject } from '../types'

const props = defineProps<{
  objects: CanvasObject[]
  viewportWidth: number
  viewportHeight: number
}>()

const store = useAppStore()

// MiniMap scale logic
const bounds = computed(() => {
  if (props.objects.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const obj of props.objects) {
    minX = Math.min(minX, obj.x)
    minY = Math.min(minY, obj.y)
    maxX = Math.max(maxX, obj.x + obj.width)
    maxY = Math.max(maxY, obj.y + obj.height)
  }
  // Add some padding
  const padding = 200
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding
  }
})

const mapWidth = 200
const mapHeight = 140

const scale = computed(() => {
  const w = bounds.value.maxX - bounds.value.minX
  const h = bounds.value.maxY - bounds.value.minY
  return Math.min(mapWidth / Math.max(w, 1), mapHeight / Math.max(h, 1))
})

const getMapRect = (x: number, y: number, w: number, h: number) => {
  return {
    left: (x - bounds.value.minX) * scale.value,
    top: (y - bounds.value.minY) * scale.value,
    width: w * scale.value,
    height: h * scale.value
  }
}

const viewportRect = computed(() => {
  const panX = store.canvasView.panX
  const panY = store.canvasView.panY
  const zoom = store.canvasView.zoom

  const vX = -panX / zoom
  const vY = -panY / zoom
  const vW = props.viewportWidth / zoom
  const vH = props.viewportHeight / zoom

  return getMapRect(vX, vY, vW, vH)
})

const handleMapClick = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top

  // World pos of click
  const worldX = clickX / scale.value + bounds.value.minX
  const worldY = clickY / scale.value + bounds.value.minY

  // Recenter view
  store.setCanvasView({
     panX: -worldX * store.canvasView.zoom + props.viewportWidth / 2,
     panY: -worldY * store.canvasView.zoom + props.viewportHeight / 2
  })
}
</script>

<template>
  <div
    class="absolute bottom-4 right-4 bg-white border border-gray-300 shadow-md overflow-hidden z-[45]"
    style="width: 200px; height: 140px; border-radius: 12px; cursor: pointer;"
    data-canvas-ui="true"
    @mousedown.stop="handleMapClick"
    aria-label="Mini-map"
    title="Mini-map (click to recenter)"
  >
    <div
      v-for="obj in objects"
      :key="`mm-${obj.id}`"
      class="absolute opacity-80"
      :style="{
        left: `${getMapRect(obj.x, obj.y, obj.width, obj.height).left}px`,
        top: `${getMapRect(obj.x, obj.y, obj.width, obj.height).top}px`,
        width: `${Math.max(1, getMapRect(obj.x, obj.y, obj.width, obj.height).width)}px`,
        height: `${Math.max(1, getMapRect(obj.x, obj.y, obj.width, obj.height).height)}px`,
        backgroundColor: obj.type === 'flashcard' ? '#DDD' : obj.color,
        borderRadius: obj.type === 'circle' ? '50%' : '1px'
      }"
    ></div>

    <div
      class="absolute border-2 border-[#6D5BD0] bg-[#6D5BD0]/10 pointer-events-none"
      :style="{
        left: `${viewportRect.left}px`,
        top: `${viewportRect.top}px`,
        width: `${viewportRect.width}px`,
        height: `${viewportRect.height}px`
      }"
    ></div>
  </div>
</template>
