<template>
  <div class="palette-overlay" @click.self="close">
    <div
      ref="dialogEl"
      class="palette-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      @keydown="onKeydown"
    >
      <label class="sr-only" for="palette-filter">Filter commands</label>
      <input
        id="palette-filter"
        ref="filterEl"
        v-model="filter"
        class="palette-filter"
        type="text"
        placeholder="Type a command… (presets, snapshots, views, export)"
        autocomplete="off"
      />
      <ul v-if="visible.length > 0" class="palette-list" role="listbox" aria-label="Commands">
        <li
          v-for="(cmd, i) in visible"
          :key="cmd.id"
          role="option"
          :aria-selected="i === cursor"
          class="palette-item"
          :class="{ active: i === cursor }"
          @click="run(cmd)"
          @mouseenter="cursor = i"
        >
          <span class="cmd-icon" aria-hidden="true">{{ cmd.icon }}</span>
          <span class="cmd-label">{{ cmd.label }}</span>
          <span class="cmd-group">{{ cmd.group }}</span>
        </li>
      </ul>
      <div v-else class="palette-empty">No matching commands.</div>
      <div class="palette-hint" aria-hidden="true">↑↓ navigate · Enter run · Esc close</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { usePresetsStore } from '../stores/presets'
import { useSnapshotsStore } from '../stores/snapshots'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'

interface Command {
  id: string
  icon: string
  label: string
  group: string
  action: () => void
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'view', view: 'editor' | 'collab'): void
}>()

const canvasStore = useCanvasStore()
const presetsStore = usePresetsStore()
const snapshotsStore = useSnapshotsStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

const filter = ref('')
const cursor = ref(0)
const filterEl = ref<HTMLInputElement | null>(null)
const dialogEl = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const commands = computed<Command[]>(() => {
  const list: Command[] = [
    { id: 'view-editor', icon: '🖌️', label: 'Go to Editor', group: 'Views', action: () => emit('view', 'editor') },
    { id: 'view-collab', icon: '🤝', label: 'Go to Collaboration', group: 'Views', action: () => emit('view', 'collab') },
    { id: 'act-undo', icon: '↩', label: 'Undo last style change', group: 'Actions', action: () => history.undo() },
    { id: 'act-redo', icon: '↪', label: 'Redo style change', group: 'Actions', action: () => history.redo() },
    { id: 'act-reset', icon: '♻️', label: 'Reset style to upload defaults', group: 'Actions', action: () => { history.markDiscrete(); canvasStore.resetStyle() } },
    { id: 'act-copy', icon: '📄', label: 'Copy settings', group: 'Actions', action: () => history.copySettings() },
  ]
  for (const p of presetsStore.presets) {
    list.push({
      id: `preset-${p.id}`,
      icon: '🎨',
      label: `Apply preset “${p.name}”`,
      group: 'Saved presets',
      action: () => { history.markDiscrete(); canvasStore.applySettings(p.settings); canvasStore.showingBefore = false },
    })
  }
  for (const s of snapshotsStore.snapshots) {
    list.push({
      id: `snapshot-${s.id}`,
      icon: '📸',
      label: `Apply snapshot “${s.name}”`,
      group: 'Snapshots',
      action: () => { history.markDiscrete(); canvasStore.applySettings(s.settings); canvasStore.showingBefore = false },
    })
  }
  return list
})

const visible = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return commands.value
  return commands.value.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
})

function run(cmd: Command) {
  cmd.action()
  announcer.announce(cmd.label)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = Math.min(cursor.value + 1, visible.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = Math.max(cursor.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const cmd = visible.value[cursor.value]
    if (cmd) run(cmd)
  }
}

function close() {
  emit('close')
}

onMounted(async () => {
  previouslyFocused = document.activeElement as HTMLElement | null
  await nextTick()
  filterEl.value?.focus()
})

onBeforeUnmount(() => {
  if (previouslyFocused && typeof previouslyFocused.focus === 'function' && document.contains(previouslyFocused)) {
    previouslyFocused.focus()
  }
})
</script>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(113, 63, 18, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 15vh 16px 16px;
  z-index: 300;
}
.palette-dialog {
  width: 100%;
  max-width: 520px;
  background: #fffbf0;
  border: 2px solid #92400e;
  border-radius: 8px;
  box-shadow: 0 24px 64px rgba(113, 63, 18, 0.4);
  overflow: hidden;
  animation: dialog-in 0.16s ease-out;
}
.palette-filter {
  width: 100%;
  padding: 16px;
  border: none;
  border-bottom: 1px solid #f3d89a;
  background: #fff;
  font-size: 14px;
  color: #713F12;
}
.palette-filter:focus { outline: none; }
.palette-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  max-height: 320px;
  overflow-y: auto;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}
.palette-item.active { background: #FDE047; }
.cmd-icon { font-size: 16px; }
.cmd-label { flex: 1; font-size: 13px; font-weight: 600; color: #713F12; }
.cmd-group {
  font-size: 10px;
  font-weight: 800;
  color: #92400e;
  background: #fef3d0;
  border-radius: 999px;
  padding: 4px 8px;
  white-space: nowrap;
}
.palette-empty { padding: 16px; font-size: 13px; color: #92400e; text-align: center; }
.palette-hint {
  padding: 8px 16px;
  border-top: 1px solid #f3d89a;
  font-size: 11px;
  color: #92400e;
  background: #fff8ee;
  text-align: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@keyframes dialog-in {
  from { opacity: 0; transform: translateY(-12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .palette-dialog { animation: none; }
}
</style>
