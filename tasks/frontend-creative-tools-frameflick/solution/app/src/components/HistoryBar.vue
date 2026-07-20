<template>
  <div class="history-bar" role="toolbar" aria-label="Canvas history and style tools">
    <button
      type="button"
      class="pill-btn tool-btn"
      :disabled="!history.canUndo"
      title="Undo (Ctrl+Z)"
      @click="history.undo()"
    ><span aria-hidden="true">↩</span> Undo</button>
    <button
      type="button"
      class="pill-btn tool-btn"
      :disabled="!history.canRedo"
      title="Redo (Ctrl+Shift+Z)"
      @click="history.redo()"
    ><span aria-hidden="true">↪</span> Redo</button>

    <span class="bar-divider" aria-hidden="true" />

    <div class="segmented" role="group" aria-label="Before and after compare">
      <button
        type="button"
        class="seg-btn"
        :class="{ active: store.showingBefore }"
        :aria-pressed="store.showingBefore"
        @click="store.showingBefore = true"
      >Before</button>
      <button
        type="button"
        class="seg-btn"
        :class="{ active: !store.showingBefore }"
        :aria-pressed="!store.showingBefore"
        @click="store.showingBefore = false"
      >After</button>
    </div>

    <button type="button" class="pill-btn ghost tool-btn" @click="resetStyle">
      <span aria-hidden="true">♻️</span> Reset style
    </button>

    <span class="bar-divider" aria-hidden="true" />

    <button type="button" class="pill-btn ghost tool-btn" @click="copySettings">
      <span aria-hidden="true">📄</span> Copy settings
    </button>
    <button
      type="button"
      class="pill-btn ghost tool-btn"
      :disabled="!history.settingsClipboard"
      @click="openPaste"
    ><span aria-hidden="true">📋</span> Paste settings</button>

    <transition name="fade-slide">
      <span v-if="feedback" class="bar-feedback" role="status">{{ feedback }}</span>
    </transition>

    <PasteSettingsDialog
      v-if="history.pasteDialogOpen"
      @close="history.pasteDialogOpen = false"
      @pasted="onPasted"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'
import PasteSettingsDialog from './PasteSettingsDialog.vue'

const store = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()
const feedback = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function flash(text: string) {
  feedback.value = text
  announcer.announce(text)
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = '' }, 2000)
}

function resetStyle() {
  history.markDiscrete()
  store.resetStyle()
  flash('Style reset to upload defaults.')
}

function copySettings() {
  history.copySettings()
  flash('Settings copied.')
}

function openPaste(e: MouseEvent) {
  history.pasteInvoker = (e.currentTarget as HTMLElement) ?? null
  history.pasteDialogOpen = true
}

function onPasted(count: number) {
  history.pasteDialogOpen = false
  flash(count === 0 ? 'No groups checked — nothing pasted.' : `Pasted ${count} group${count === 1 ? '' : 's'}.`)
}

function onShortcut(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const tag = target?.tagName ?? ''
  const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable === true
  if (editable) return
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  const key = e.key.toLowerCase()
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault()
    history.undo()
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    e.preventDefault()
    history.redo()
  }
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<style scoped>
.history-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 12px 16px;
  background: #fff8ee;
  border: 1px solid #f3d89a;
  border-radius: 8px;
}
.tool-btn {
  min-height: 44px;
  padding: 8px 16px;
  font-size: 12px;
}
.bar-divider {
  width: 1px;
  height: 28px;
  background: #f3d89a;
}
.segmented {
  display: inline-flex;
  border: 2px solid #92400e;
  border-radius: 999px;
  overflow: hidden;
  background: #fffbf0;
}
.seg-btn {
  min-height: 44px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: #92400e;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.seg-btn:hover { background: #fef3d0; }
.seg-btn.active {
  background: #FDE047;
  color: #713F12;
}
.bar-feedback {
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
  .seg-btn, .history-bar { transition: none; }
}
</style>
