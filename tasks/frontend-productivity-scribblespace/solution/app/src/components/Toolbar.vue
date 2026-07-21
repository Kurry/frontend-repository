<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from '../store'

const props = defineProps<{
  canvasCenter: { x: number; y: number }
}>()

const store = useAppStore()

const showShapeMenu = ref(false)
const shapeMenuRef = ref<HTMLElement | null>(null)
const shapeButtonRef = ref<HTMLElement | null>(null)

const onDocMouseDown = (e: MouseEvent) => {
  if (!shapeMenuRef.value?.contains(e.target as Node) && !shapeButtonRef.value?.contains(e.target as Node)) {
    showShapeMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
})

const placeAt = () => ({ x: props.canvasCenter.x - 100, y: props.canvasCenter.y - 75 })

const handleAddShape = (kind: 'rectangle' | 'circle' | 'arrow', e: MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
  if (!showShapeMenu.value) return
  showShapeMenu.value = false
  const pos = placeAt()
  store.addObject({ kind, x: pos.x, y: pos.y })
  shapeButtonRef.value?.focus()
}

const objectCount = computed(() => store.activeBoard?.objects.length || 0)
</script>

<template>
  <div
    class="flex flex-nowrap items-center gap-2 px-3 py-2 bg-white/95 shadow-md w-full rounded-[12px] border border-gray-200 overflow-x-auto"
    role="toolbar"
    aria-label="Canvas tools"
  >
    <button
      type="button"
      class="btn-tool"
      :aria-pressed="store.activeTool === 'select'"
      @click="store.setTool('select')"
    >
      Select
    </button>
    <button
      type="button"
      class="btn-tool"
      :aria-pressed="store.activeTool === 'connect'"
      @click="store.setTool(store.activeTool === 'connect' ? 'select' : 'connect')"
    >
      Connect
    </button>

    <div aria-hidden="true" class="w-px h-8 self-center bg-gray-200"></div>

    <button type="button" class="btn-primary" @click="() => { const pos = placeAt(); store.addObject({ kind: 'note', x: pos.x, y: pos.y }) }">
      New Note
    </button>
    <button type="button" class="btn-primary" @click="() => { const pos = placeAt(); store.addObject({ kind: 'flashcard', x: pos.x, y: pos.y }) }">
      New Flashcard
    </button>

    <div class="relative">
      <button
        ref="shapeButtonRef"
        type="button"
        class="btn-primary"
        aria-haspopup="menu"
        :aria-expanded="showShapeMenu"
        @click="showShapeMenu = !showShapeMenu"
        @keydown.esc="showShapeMenu = false"
      >
        New Shape
      </button>
      <div
        v-if="showShapeMenu"
        ref="shapeMenuRef"
        role="menu"
        aria-label="Shape options"
        class="absolute top-full left-0 mt-1 bg-white shadow-lg py-1 z-50 min-w-[150px] rounded-lg border-[1.5px] border-gray-500"
        @keydown.esc="showShapeMenu = false; shapeButtonRef?.focus()"
      >
        <button
          v-for="kind in ['rectangle', 'circle', 'arrow']"
          :key="kind"
          type="button"
          role="menuitem"
          class="w-full px-4 text-left hover:bg-[#EAE6F7] text-[14px] min-h-[44px] text-gray-900"
          @click.stop.prevent="handleAddShape(kind as any, $event)"
        >
          {{ kind === 'rectangle' ? 'Rectangle' : kind === 'circle' ? 'Circle' : 'Arrow' }}
        </button>
      </div>
    </div>

    <div aria-hidden="true" class="w-px h-8 self-center bg-gray-200"></div>

    <button
      type="button"
      class="btn-secondary disabled:opacity-50"
      @click="store.selectAll()"
      :disabled="objectCount === 0"
    >
      Select all
    </button>
    <button type="button" class="btn-secondary" @click="store.setShowArchivePanel(true)">Archive</button>
    <button type="button" class="btn-secondary" @click="store.setShowExport(true)">
      Export workspace
    </button>

    <div aria-hidden="true" class="w-px h-8 self-center bg-gray-200"></div>

    <button type="button" class="btn-tool disabled:opacity-50" :disabled="!store.canUndo" @click="store.undo()" title="Undo (Ctrl+Z)">Undo</button>
    <button type="button" class="btn-tool disabled:opacity-50" :disabled="!store.canRedo" @click="store.redo()" title="Redo (Ctrl+Y)">Redo</button>

    <div aria-hidden="true" class="w-px h-8 self-center bg-gray-200"></div>

    <div class="flex flex-wrap items-center gap-1" role="group" aria-label="Zoom controls">
      <button type="button" class="btn-secondary" @click="store.setZoom(store.canvasView.zoom - 0.15)">
        Zoom Out
      </button>
      <span
        class="font-semibold text-center text-[13px] text-gray-600 min-w-[48px]"
      >
        {{ Math.round(store.canvasView.zoom * 100) }}%
      </span>
      <button type="button" class="btn-secondary" @click="store.setZoom(store.canvasView.zoom + 0.15)">
        Zoom In
      </button>
      <button type="button" class="btn-secondary" @click="store.resetView()">
        Reset View
      </button>
    </div>

    <div aria-hidden="true" class="w-px h-8 self-center bg-gray-200"></div>

    <button
      type="button"
      class="btn-tool"
      :aria-pressed="store.viewMode === 'outline'"
      @click="store.setViewMode(store.viewMode === 'outline' ? 'canvas' : 'outline')"
    >
      {{ store.viewMode === 'outline' ? 'Show canvas' : 'Show outline' }}
    </button>
    <button
      type="button"
      class="btn-tool"
      :aria-pressed="store.showLivePanel"
      @click="store.setShowLivePanel(!store.showLivePanel)"
    >
      {{ store.showLivePanel ? 'Hide live events' : 'Show live events' }}
    </button>
  </div>
</template>
