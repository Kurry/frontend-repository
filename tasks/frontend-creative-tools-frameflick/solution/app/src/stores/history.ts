import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useCanvasStore } from './canvas'
import type { RenderSettings } from './canvas'

export type SettingsGroup = 'background' | 'composition' | 'frame' | 'caption' | 'watermark'

export const SETTINGS_GROUPS: { id: SettingsGroup; label: string }[] = [
  { id: 'background', label: 'Background' },
  { id: 'composition', label: 'Composition (padding, corner radius, shadow)' },
  { id: 'frame', label: 'Frame' },
  { id: 'caption', label: 'Caption' },
  { id: 'watermark', label: 'Watermark' },
]

// Style mutations landing within this window merge into ONE undo entry, so a
// quick "background Night→Ocean then padding 8→18" session round-trips with a
// single Undo. Consecutive edits of the SAME field (slider drags, arrow-key
// repeats) always coalesce, even across the window.
const BURST_MS = 4000

function clone(s: RenderSettings): RenderSettings {
  return JSON.parse(JSON.stringify(s))
}

function diffField(a: RenderSettings, b: RenderSettings): string | null {
  for (const key of Object.keys(a) as (keyof RenderSettings)[]) {
    if (a[key] !== b[key]) return key
  }
  return null
}

export const useHistoryStore = defineStore('history', () => {
  const canvas = useCanvasStore()

  const undoStack = ref<RenderSettings[]>([])
  const redoStack = ref<RenderSettings[]>([])
  const settingsClipboard = ref<RenderSettings | null>(null)
  const pasteDialogOpen = ref(false)
  const pasteInvoker = ref<HTMLElement | null>(null)

  let applying = false
  let lastChangeAt = 0
  let lastField: string | null = null

  // Observe every style mutation the visible controls make and record history.
  watch(
    () => canvas.getSettings(),
    (next, prev) => {
      if (applying || !prev) return
      const now = Date.now()
      const changedField = diffField(prev, next)
      const sameFieldRun = changedField !== null && changedField === lastField
      const coalesce = now - lastChangeAt <= BURST_MS || sameFieldRun
      if (!coalesce) {
        // Burst boundary: the pre-change snapshot becomes the undo entry.
        undoStack.value.push(clone(prev))
        if (undoStack.value.length > 100) undoStack.value.shift()
      }
      // Any new mutation invalidates the redo stack.
      redoStack.value = []
      lastChangeAt = now
      lastField = changedField
    },
    { deep: true }
  )

  // Style snapshots are tied to one image, so a fresh image load (upload, Recent
  // thumbnail, WebMCP select) starts a new undo/redo context — otherwise Undo
  // would re-apply the previous image's look onto the new one. loadCount also
  // covers re-uploading the same image, where imageDataUrl is unchanged so a
  // plain imageDataUrl watch wouldn't fire. Created after the settings watcher
  // so, in the flush triggered by a load, this runs second and clears the entry
  // that watcher just recorded.
  watch(() => [canvas.imageDataUrl, canvas.loadCount] as const, () => {
    undoStack.value = []
    redoStack.value = []
    lastChangeAt = 0
    lastField = null
  })

  /** Force the next mutation to start a fresh undo entry (Apply / Import / Paste / Reset). */
  function markDiscrete() {
    lastChangeAt = 0
    lastField = null
  }

  function applyState(s: RenderSettings) {
    applying = true
    canvas.applySettings(clone(s))
    // The settings watcher is pre-flush, so it fires after this synchronous
    // block — keep the suppression flag up until it has run, otherwise the
    // undo/redo application itself would be recorded as a new mutation (and
    // wipe the redo stack).
    void nextTick(() => { applying = false })
    lastChangeAt = 0
    lastField = null
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function undo() {
    if (!canUndo.value) return
    redoStack.value.push(clone(canvas.getSettings()))
    applyState(undoStack.value.pop()!)
  }

  function redo() {
    if (!canRedo.value) return
    undoStack.value.push(clone(canvas.getSettings()))
    applyState(redoStack.value.pop()!)
  }

  // ---- Copy / paste settings groups --------------------------------------

  function copySettings() {
    settingsClipboard.value = clone(canvas.getSettings())
  }

  function pasteSettings(groups: Set<SettingsGroup>) {
    const clip = settingsClipboard.value
    if (!clip || groups.size === 0) return // nothing checked → nothing applied
    markDiscrete() // own undo entry, recorded by the watcher
    const merged = clone(canvas.getSettings())
    if (groups.has('background')) {
      merged.backgroundPreset = clip.backgroundPreset
      merged.customBgColor = clip.customBgColor
      merged.useCustomBg = clip.useCustomBg
    }
    if (groups.has('composition')) {
      merged.padding = clip.padding
      merged.cornerRadius = clip.cornerRadius
      merged.shadow = clip.shadow
    }
    if (groups.has('frame')) {
      merged.frameStyle = clip.frameStyle
      merged.canvasSize = clip.canvasSize
    }
    if (groups.has('caption')) {
      merged.captionText = clip.captionText
      merged.captionPosition = clip.captionPosition
      merged.captionFontSize = clip.captionFontSize
      merged.captionColor = clip.captionColor
    }
    if (groups.has('watermark')) {
      merged.watermarkEnabled = clip.watermarkEnabled
      merged.watermarkText = clip.watermarkText
      merged.watermarkColor = clip.watermarkColor
      merged.watermarkOpacity = clip.watermarkOpacity
      merged.watermarkCorner = clip.watermarkCorner
    }
    canvas.applySettings(merged)
    // Match the preset/snapshot/import apply paths: leave the Before baseline
    // so the canvas shows the freshly pasted look.
    canvas.showingBefore = false
  }

  return {
    undoStack, redoStack, canUndo, canRedo, undo, redo, markDiscrete,
    settingsClipboard, copySettings, pasteSettings,
    pasteDialogOpen, pasteInvoker,
  }
})
