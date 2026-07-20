<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import CanvasObjectComponent from './CanvasObject.vue'
import ConnectorLine from './ConnectorLine.vue'
import MiniMap from './MiniMap.vue' // To be added later

const props = defineProps<{
  width: number
  height: number
}>()

const store = useAppStore()

const board = computed(() => store.activeBoard)
const objects = computed(() => board.value?.objects || [])
const connectors = computed(() => board.value?.connectors || [])
const sortedObjects = computed(() => [...objects.value].sort((a, b) => a.zIndex - b.zIndex))

const containerRef = ref<HTMLElement | null>(null)
let isPanning = false
const cursorWorld = ref<{ x: number, y: number } | null>(null)

const connectSource = computed(() => store.connectFromId ? objects.value.find(o => o.id === store.connectFromId) : null)

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('[data-canvas-object]')) return
  if (target.closest('[data-canvas-ui]')) return
  e.preventDefault()

  isPanning = true
  const startX = e.clientX
  const startY = e.clientY
  let lastX = startX
  let lastY = startY
  let movedTotal = 0

  const onMove = (me: MouseEvent) => {
    if (!isPanning) return
    const dx = me.clientX - lastX
    const dy = me.clientY - lastY
    movedTotal += Math.abs(dx) + Math.abs(dy)
    lastX = me.clientX
    lastY = me.clientY
    store.panCanvas({ dx, dy })
  }

  const onUp = () => {
    isPanning = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    if (movedTotal < 4 && store.activeTool === 'select') {
      store.deselectAll()
    }
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (store.activeTool !== 'connect' || !store.connectFromId || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  cursorWorld.value = {
    x: (e.clientX - rect.left - store.canvasView.panX) / store.canvasView.zoom,
    y: (e.clientY - rect.top - store.canvasView.panY) / store.canvasView.zoom,
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.target !== e.currentTarget) return
  const step = 60
  let handled = true
  if (e.key === 'ArrowLeft') store.panCanvas({ dx: step, dy: 0 })
  else if (e.key === 'ArrowRight') store.panCanvas({ dx: -step, dy: 0 })
  else if (e.key === 'ArrowUp') store.panCanvas({ dx: 0, dy: step })
  else if (e.key === 'ArrowDown') store.panCanvas({ dx: 0, dy: -step })
  else handled = false

  if (handled) {
     e.preventDefault()
  }
}

const connectorMidpoint = (conn: any) => {
   const fromObj = objects.value.find(o => o.id === conn.fromId)
   const toObj = objects.value.find(o => o.id === conn.toId)
   if (!fromObj || !toObj) return null
   const cx1 = fromObj.x + fromObj.width / 2
   const cy1 = fromObj.y + fromObj.height / 2
   const cx2 = toObj.x + toObj.width / 2
   const cy2 = toObj.y + toObj.height / 2
   return { x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2 }
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative overflow-hidden w-full h-full"
    role="region"
    aria-label="Canvas — arrow keys pan the view"
    tabindex="0"
    :style="{
      backgroundColor: '#F4F2FB',
      cursor: store.activeTool === 'connect' ? 'crosshair' : 'grab'
    }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @keydown="handleKeyDown"
  >
    <!-- Dot grid backdrop -->
    <div
      aria-hidden="true"
      class="absolute inset-0 pointer-events-none"
      :style="{
        backgroundImage: 'radial-gradient(circle, #C9C3E4 1px, transparent 1px)',
        backgroundSize: `${24 * store.canvasView.zoom}px ${24 * store.canvasView.zoom}px`,
        backgroundPosition: `${store.canvasView.panX}px ${store.canvasView.panY}px`,
        opacity: 0.7
      }"
    ></div>

    <!-- World transform layer -->
    <div
      class="absolute"
      :style="{
        transform: `translate(${store.canvasView.panX}px, ${store.canvasView.panY}px) scale(${store.canvasView.zoom})`,
        transformOrigin: '0 0',
        width: 0,
        height: 0
      }"
    >
      <svg
        aria-hidden="true"
        class="absolute"
        style="left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none;"
      >
        <ConnectorLine
          v-for="conn in connectors"
          :key="conn.id"
          :connector="conn"
          :objects="objects"
        />
        <line
          v-if="connectSource && cursorWorld"
          :x1="connectSource.x + connectSource.width / 2"
          :y1="connectSource.y + connectSource.height / 2"
          :x2="cursorWorld.x"
          :y2="cursorWorld.y"
          stroke="#6D5BD0"
          stroke-width="2.5"
          stroke-dasharray="7 5"
          stroke-linecap="round"
        />
      </svg>

      <CanvasObjectComponent
        v-for="obj in sortedObjects"
        :key="obj.id"
        :obj="obj"
        :is-selected="store.selectedIds.includes(obj.id)"
        :is-search-highlight="store.searchMatchIds.includes(obj.id)"
        :is-connect-source="store.connectFromId === obj.id"
        :zoom="store.canvasView.zoom"
      />

      <!-- Connector remove controls -->
      <button
        v-for="conn in connectors"
        :key="`remove-${conn.id}`"
        type="button"
        aria-label="Remove Connector"
        title="Remove Connector"
        data-canvas-ui="true"
        class="absolute hover:bg-[#EAE6F7] flex items-center justify-center rounded-full bg-white text-gray-800 shadow z-[500]"
        :style="{
           left: `${connectorMidpoint(conn)?.x! - 13}px`,
           top: `${connectorMidpoint(conn)?.y! - 13}px`,
           width: '26px',
           height: '26px',
           border: '1.5px solid var(--color-text-secondary)',
           cursor: 'pointer',
           padding: 0
        }"
        @mousedown.stop
        @click="store.removeConnector(conn.id)"
      >
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>

    </div>

    <!-- Empty state -->
    <div v-if="objects.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
      <div class="text-center px-8 py-6 bg-white/85 rounded-xl max-w-[420px]">
        <p class="font-semibold text-lg text-gray-900">This board is empty</p>
        <p class="mt-1 text-sm text-gray-600 leading-snug">Add a note, flashcard or shape to get started</p>
      </div>
    </div>

    <!-- Connect mode helper -->
    <div v-if="store.activeTool === 'connect'" class="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 font-medium text-white bg-[#6D5BD0] shadow-md rounded-lg text-[13px] z-40 pointer-events-none max-w-[calc(100%-24px)]">
       {{ store.connectFromId ? 'Click a second object to finish the connector' : 'Click an object to start a connector' }}
    </div>

    <!-- No search results -->
    <div v-if="store.searchQuery.trim() && store.searchMatchIds.length === 0" class="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 shadow-md bg-white border-[1.5px] border-gray-500 rounded-lg text-[13px] text-gray-900 z-40 pointer-events-none max-w-[calc(100%-24px)]">
       No results for "{{ store.searchQuery.trim() }}" — try a different word
    </div>

    <!-- <MiniMap :objects="objects" :viewportWidth="width" :viewportHeight="height" /> -->
  </div>
</template>
