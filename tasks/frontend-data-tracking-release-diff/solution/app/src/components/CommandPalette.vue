<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import {
  PhArchiveTray as ArchiveTrayIcon,
  PhArrowsLeftRight as ArrowsLeftRightIcon,
  PhChartBar as ChartBarIcon,
  PhClockCounterClockwise as ClockCounterClockwiseIcon,
  PhCompass as CompassIcon,
  PhDownloadSimple as DownloadSimpleIcon,
  PhList as ListIcon,
  PhMoon as MoonIcon,
  PhPlus as PlusIcon,
  PhRows as RowsIcon,
  PhTimer as TimerIcon,
  PhUploadSimple as UploadSimpleIcon,
} from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const query = ref('')
const cursor = ref(0)
const inputRef = ref(null)
let restoreFocus = null

const actions = [
  { id: 'goto-manifest', group: 'Views', label: 'Go to Manifest', icon: ArchiveTrayIcon, run: () => store.setActiveTab('manifest') },
  { id: 'goto-diff', group: 'Views', label: 'Go to Diff', icon: ArrowsLeftRightIcon, run: () => store.setActiveTab('diff') },
  { id: 'goto-splits', group: 'Views', label: 'Go to Splits', icon: ChartBarIcon, run: () => store.setActiveTab('splits') },
  { id: 'goto-rotation', group: 'Views', label: 'Go to Rotation', icon: ClockCounterClockwiseIcon, run: () => store.setActiveTab('rotation') },
  { id: 'goto-timeline', group: 'Views', label: 'Reveal event timeline', icon: ListIcon, run: () => document.querySelector('.timeline-panel')?.scrollIntoView({ behavior: store.reduceMotion ? 'auto' : 'smooth', block: 'start' }) },
  { id: 'cut-release', group: 'Actions', label: 'Cut a sealed release', icon: PlusIcon, run: () => { store.resetCut(); store.openDialog('cut') } },
  { id: 'advance-rotation', group: 'Actions', label: 'Advance rotation', icon: TimerIcon, run: () => store.advanceRotation() },
  { id: 'export-pack', group: 'Actions', label: 'Export release pack', icon: DownloadSimpleIcon, run: () => store.openDialog('export') },
  { id: 'import-pack', group: 'Actions', label: 'Import release pack', icon: UploadSimpleIcon, run: () => store.openDialog('import') },
  { id: 'toggle-theme', group: 'Preferences', label: 'Toggle light / dark theme', icon: MoonIcon, run: () => store.toggleTheme() },
  { id: 'toggle-density', group: 'Preferences', label: 'Toggle comfortable / compact density', icon: RowsIcon, run: () => store.toggleDensity() },
  { id: 'start-tour', group: 'Preferences', label: 'Start the guided tour', icon: CompassIcon, run: () => store.openTour() },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return actions
  return actions.filter((action) => action.label.toLowerCase().includes(q) || action.group.toLowerCase().includes(q))
})

watch(() => store.paletteOpen, async (open) => {
  if (open) {
    restoreFocus = document.activeElement
    query.value = ''
    cursor.value = 0
    await nextTick()
    inputRef.value?.focus()
  } else if (restoreFocus?.focus) {
    restoreFocus.focus()
    restoreFocus = null
  }
})
watch(query, () => { cursor.value = 0 })

function choose(action) {
  store.setPaletteOpen(false)
  action.run()
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') { event.preventDefault(); cursor.value = (cursor.value + 1) % Math.max(filtered.value.length, 1) }
  else if (event.key === 'ArrowUp') { event.preventDefault(); cursor.value = (cursor.value - 1 + filtered.value.length) % Math.max(filtered.value.length, 1) }
  else if (event.key === 'Enter') { event.preventDefault(); const action = filtered.value[cursor.value]; if (action) choose(action) }
  else if (event.key === 'Escape') { event.preventDefault(); store.setPaletteOpen(false) }
}
</script>

<template>
  <div v-if="store.paletteOpen" class="palette-overlay" @click.self="store.setPaletteOpen(false)">
    <div class="palette-panel" role="dialog" aria-modal="true" aria-label="Command palette" @keydown="onKeydown">
      <div class="palette-input-row">
        <CompassIcon :size="18" aria-hidden="true" />
        <input ref="inputRef" v-model="query" class="palette-input" type="text" placeholder="Type a command or search…" aria-label="Command palette search" autocomplete="off" spellcheck="false" />
        <kbd class="palette-kbd">esc</kbd>
      </div>
      <div class="palette-list" role="listbox" aria-label="Commands">
        <button
          v-for="(action, index) in filtered"
          :key="action.id"
          type="button"
          class="palette-item"
          :class="{ active: index === cursor }"
          role="option"
          :aria-selected="index === cursor"
          @click="choose(action)"
          @mouseenter="cursor = index"
        >
          <component :is="action.icon" :size="16" />
          <span>{{ action.label }}</span>
          <small>{{ action.group }}</small>
        </button>
        <div v-if="!filtered.length" class="palette-empty">No commands match “{{ query }}”.</div>
      </div>
      <div class="palette-hint"><span>↑↓ navigate</span><span>↵ run</span><span>esc close</span><span>⌘K / Ctrl+K toggle</span></div>
    </div>
  </div>
</template>
