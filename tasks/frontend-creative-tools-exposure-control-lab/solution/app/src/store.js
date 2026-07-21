import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { LabPackageSchema } from './domain.js'

const BASE_APERTURE = 16
const BASE_SHUTTER = 60
const BASE_ISO = 100

const defaultLight = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0 }
const defaultEffects = { texture: 0, clarity: 0, vignette: 0, grain: 0 }

const initialPresets = [
  { name: 'Classic Punch', aperture: 5.6, shutter: 250, iso: 200, lookTag: 'crisp', favorite: true },
  { name: 'Soft Portrait', aperture: 2.8, shutter: 125, iso: 100, lookTag: 'soft', favorite: false },
  { name: 'Gritty Street', aperture: 8, shutter: 500, iso: 800, lookTag: 'grainy', favorite: true },
  { name: 'Night Walk', aperture: 1.8, shutter: 30, iso: 3200, lookTag: 'night', favorite: false },
  { name: 'Sunny Day', aperture: 11, shutter: 500, iso: 100, lookTag: 'daylight', favorite: false },
  { name: 'Cinematic Mood', aperture: 4, shutter: 60, iso: 400, lookTag: 'cinematic', favorite: true }
]

const initialSnapshots = [
  {
    name: 'Base Starting Point',
    aperture: 16, shutter: 60, iso: 100,
    light: { ...defaultLight },
    effects: { ...defaultEffects }
  },
  {
    name: 'Pushed Shadows',
    aperture: 8, shutter: 125, iso: 400,
    light: { ...defaultLight, exposure: 20, shadows: 40 },
    effects: { ...defaultEffects, clarity: 15 }
  }
]

export const useStore = defineStore('lab', () => {
  const aperture = ref(BASE_APERTURE)
  const shutter = ref(BASE_SHUTTER)
  const iso = ref(BASE_ISO)
  const activeMode = ref('Meter/Lab')
  const helpOpen = ref(false)
  const beforeHold = ref(false)

  // Session chrome (in-memory only, resets on reload like everything else):
  // a running flag the WebMCP command-session surface toggles (with a visible
  // banner when stopped), the currently editor-selected object, and a shared
  // toast so any surface (UI or WebMCP) can confirm an action.
  const sessionRunning = ref(true)
  const editorSelected = ref(null)
  const toastMessage = ref('')
  let toastTimer = null
  function toast(message) {
    toastMessage.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, 2200)
  }

  const light = reactive({ ...defaultLight })
  const effects = reactive({ ...defaultEffects })
  const activeLook = ref(null)

  const presets = ref(JSON.parse(JSON.stringify(initialPresets)))
  const snapshots = ref(JSON.parse(JSON.stringify(initialSnapshots)))

  const undoStack = ref([])
  const redoStack = ref([])

  const settingsClipboard = ref(null) // { groups: [], state: {} }

  // derived state
  const ev = computed(() => {
    return 2 * Math.log2(16 / aperture.value) +
           Math.log2(60 / shutter.value) +
           Math.log2(iso.value / 100)
  })

  // Single source of truth for the "before" (SOOC baseline, 0 EV) hold.
  // LabPreview.vue simulates baseline exposure for the visual preview while
  // beforeHold is active; the meter (DialsMeter.vue) and the drawer's EV
  // readout/histogram (App.vue) all have to track this same baseline value
  // or they'll visually disagree with the preview during a Before hold.
  const displayEV = computed(() => {
    return beforeHold.value ? 0 : ev.value
  })

  // Baseline dev-panel exposure (0, matching the SOOC baseline) used
  // alongside displayEV by anything deriving from `light.exposure` while
  // beforeHold is active (e.g. App.vue's fake histogram).
  const displayLightExposure = computed(() => {
    return beforeHold.value ? 0 : light.exposure
  })

  const currentLabState = computed(() => {
    return {
      aperture: aperture.value,
      shutter: shutter.value,
      iso: iso.value,
      light: { ...light },
      effects: { ...effects },
      look: activeLook.value,
      presets: JSON.parse(JSON.stringify(presets.value)),
      snapshots: JSON.parse(JSON.stringify(snapshots.value))
    }
  })

  const labPackageJson = computed(() => {
    return JSON.stringify({
      schemaVersion: 'exposure-control-lab.package.v1',
      aperture: aperture.value,
      shutter: shutter.value,
      iso: iso.value,
      ev: Number(ev.value.toFixed(2)),
      light: { ...light },
      effects: { ...effects },
      look: activeLook.value,
      presets: presets.value,
      snapshots: snapshots.value
    }, null, 2)
  })

  // Shared history-push logic: given a "before" snapshot, push it onto the
  // undo stack (and clear redo) only if current state actually differs.
  // Both `mutate` (single synchronous updates) and `commitPending` (drag-style
  // interactions that apply live and commit once on release) funnel through
  // this so every logical interaction produces exactly one undo entry.
  function pushHistoryIfChanged(stateBefore) {
    const stateAfter = currentLabState.value
    if (JSON.stringify(stateBefore) !== JSON.stringify(stateAfter)) {
      undoStack.value.push(stateBefore)
      redoStack.value = [] // clear redo
    }
  }

  function mutate(actionName, updateFn) {
    const stateBefore = currentLabState.value
    updateFn()
    pushHistoryIfChanged(stateBefore)
  }

  // For interactions that apply changes live (e.g. a slider drag) before a
  // single history entry is committed on release. Callers capture the
  // pre-drag state via `currentLabState` at drag-start and pass it here once,
  // on release/`@change`, instead of pushing to undoStack/redoStack directly.
  //
  // `historyIndexAtStart` is `undoStack.length` captured at the same moment as
  // `stateBefore`. If some other action (e.g. a dial edit via `mutate`) pushed
  // its own entry while this drag was still in progress, bailing out here
  // used to silently drop the slider's own net change from undo history
  // entirely (its release value was never recorded anywhere). We still push
  // our own entry for the slider's net change so it stays undoable even when
  // another mutation interleaved mid-drag — that can produce two undo
  // entries for the compound interaction, which is preferable to losing the
  // slider's change outright.
  function commitPending(stateBefore, historyIndexAtStart) {
    pushHistoryIfChanged(stateBefore)
  }

  function applyState(state) {
    aperture.value = state.aperture
    shutter.value = state.shutter
    iso.value = state.iso
    Object.assign(light, state.light)
    Object.assign(effects, state.effects)
    activeLook.value = state.look
    presets.value = JSON.parse(JSON.stringify(state.presets))
    snapshots.value = JSON.parse(JSON.stringify(state.snapshots))
  }

  function undo() {
    if (undoStack.value.length === 0) return
    const currentState = currentLabState.value
    const previousState = undoStack.value.pop()
    redoStack.value.push(currentState)
    applyState(previousState)
  }

  function redo() {
    if (redoStack.value.length === 0) return
    const currentState = currentLabState.value
    const nextState = redoStack.value.pop()
    undoStack.value.push(currentState)
    applyState(nextState)
  }

  function loadLabPackage(pkg) {
    if (!pkg || typeof pkg !== 'object') throw new Error('Invalid package: not an object')

    const result = LabPackageSchema.safeParse(pkg)
    if (!result.success) {
      const details = result.error.issues
        .map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid package: ${details}`)
    }

    const validated = result.data
    applyState({
      aperture: validated.aperture,
      shutter: validated.shutter,
      iso: validated.iso,
      light: validated.light,
      effects: validated.effects,
      look: validated.look,
      presets: validated.presets,
      snapshots: validated.snapshots
    })
    undoStack.value = []
    redoStack.value = []
  }

  function resetToSeed() {
    aperture.value = BASE_APERTURE
    shutter.value = BASE_SHUTTER
    iso.value = BASE_ISO
    Object.assign(light, defaultLight)
    Object.assign(effects, defaultEffects)
    activeLook.value = null
    presets.value = JSON.parse(JSON.stringify(initialPresets))
    snapshots.value = JSON.parse(JSON.stringify(initialSnapshots))
    undoStack.value = []
    redoStack.value = []
  }

  return {
    aperture, shutter, iso,
    light, effects, activeLook,
    presets, snapshots,
    activeMode, helpOpen, beforeHold,
    sessionRunning, editorSelected, toastMessage, toast,
    undoStack, redoStack, settingsClipboard,
    ev, displayEV, displayLightExposure, labPackageJson, currentLabState,
    mutate, commitPending, undo, redo, loadLabPackage, resetToSeed
  }
})
