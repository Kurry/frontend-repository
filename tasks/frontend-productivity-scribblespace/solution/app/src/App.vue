<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from './store'
import BoardSwitcher from './components/BoardSwitcher.vue'
import SearchBar from './components/SearchBar.vue'
import Toolbar from './components/Toolbar.vue'
import SelectionControls from './components/SelectionControls.vue'
import Canvas from './components/Canvas.vue'
import OutlineView from './components/OutlineView.vue'
import LivePanel from './components/LivePanel.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ExportModal from './components/ExportModal.vue';
import ArchivePanel from './components/ArchivePanel.vue';
import CommandPalette from './components/CommandPalette.vue'

const store = useAppStore()

const mainRef = ref<HTMLElement | null>(null)
const mainSize = ref({ width: 1024, height: 640 })
let observer: ResizeObserver | null = null

const updateSize = () => {
  if (mainRef.value) {
    mainSize.value = { width: mainRef.value.clientWidth, height: mainRef.value.clientHeight }
  }
}

let streamInterval: number | null = null

onMounted(() => {
  if (mainRef.value) {
    observer = new ResizeObserver(updateSize)
    observer.observe(mainRef.value)
    updateSize()
  }

  // Ticker for stream
  streamInterval = window.setInterval(() => {
    if (store.stream.status === 'active' || store.stream.status === 'disconnected') {
      store.streamTick()
    }
  }, 1000)

  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (streamInterval !== null) window.clearInterval(streamInterval)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

const isCanvasTextEditorFocused = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest('[data-canvas-text-editor]')
}

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('scribblespace:open-palette'))
    return
  }
  if (isCanvasTextEditorFocused(e.target)) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
    return
  }
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) {
    e.preventDefault()
    store.redo()
  }
}

const canvasCenter = computed(() => {
  return {
    x: (-store.canvasView.panX + mainSize.value.width / 2) / store.canvasView.zoom,
    y: (-store.canvasView.panY + mainSize.value.height / 2) / store.canvasView.zoom,
  }
})

const objectCount = computed(() => store.activeBoard?.objects.length || 0)
</script>

<template>
  <div class="app-shell flex flex-col w-full h-screen min-h-[480px]">

    <header class="app-header flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-white/95 shrink-0 border-b border-gray-200 z-30">
      <h1 class="font-bold tracking-tight m-0 whitespace-nowrap text-[18px] text-[#6D5BD0]">
        ScribbleSpace
      </h1>
      <BoardSwitcher />
      <div class="app-search sm:ml-auto min-w-0">
        <SearchBar />
      </div>
    </header>

    <div class="app-actions flex flex-col gap-2 px-3 py-2 shrink-0 z-20 relative pointer-events-none">
      <div class="pointer-events-auto w-full flex justify-center"><Toolbar :canvasCenter="canvasCenter" /></div>
      <div class="pointer-events-auto w-full flex justify-center"><SelectionControls /></div>
    </div>

    <main ref="mainRef" class="app-main flex-1 relative overflow-hidden min-h-[280px]">
      <Canvas v-if="store.viewMode === 'canvas'" :width="mainSize.width" :height="mainSize.height" />
      <OutlineView v-else />
      <LivePanel v-if="store.showLivePanel" />
    </main>

    <footer class="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 bg-white/95 shrink-0 border-t border-gray-200 min-h-[32px]">
      <span class="font-medium text-[13px] text-gray-500">
        {{ objectCount === 1 ? '1 object' : `${objectCount} objects` }}
      </span>
      <span role="status" aria-live="polite" class="font-medium truncate text-[13px] text-gray-900" :key="store.statusMessage.key">
        {{ store.statusMessage.text }}
      </span>
    </footer>

    <ConfirmDialog />
    <ExportModal />
    <ArchivePanel />
    <CommandPalette />

  </div>
</template>
