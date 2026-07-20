import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

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

import { watch } from 'vue'

export const useStore = defineStore('lab', () => {
  const aperture = ref(parseInt(localStorage.getItem('lab-aperture')) || BASE_APERTURE)
  const shutter = ref(parseInt(localStorage.getItem('lab-shutter')) || BASE_SHUTTER)
  const iso = ref(parseInt(localStorage.getItem('lab-iso')) || BASE_ISO)
  const activeMode = ref(localStorage.getItem('lab-activeMode') || 'Meter/Lab')
  const helpOpen = ref(false)
  const beforeHold = ref(false)

  const savedLight = JSON.parse(localStorage.getItem('lab-light') || 'null')
  const light = reactive(savedLight || { ...defaultLight })
  const savedEffects = JSON.parse(localStorage.getItem('lab-effects') || 'null')
  const effects = reactive(savedEffects || { ...defaultEffects })
  const activeLook = ref(localStorage.getItem('lab-activeLook') || null)

  const savedPresets = JSON.parse(localStorage.getItem('lab-presets') || 'null')
  const presets = ref(savedPresets || JSON.parse(JSON.stringify(initialPresets)))
  const savedSnapshots = JSON.parse(localStorage.getItem('lab-snapshots') || 'null')
  const snapshots = ref(savedSnapshots || JSON.parse(JSON.stringify(initialSnapshots)))

  const undoStack = ref([])
  const redoStack = ref([])

  watch([activeMode, aperture, shutter, iso, light, effects, activeLook, presets, snapshots], () => {
    localStorage.setItem('lab-activeMode', activeMode.value)
    localStorage.setItem('lab-aperture', aperture.value)
    localStorage.setItem('lab-shutter', shutter.value)
    localStorage.setItem('lab-iso', iso.value)
    localStorage.setItem('lab-light', JSON.stringify(light))
    localStorage.setItem('lab-effects', JSON.stringify(effects))
    if (activeLook.value) localStorage.setItem('lab-activeLook', activeLook.value)
    else localStorage.removeItem('lab-activeLook')
    localStorage.setItem('lab-presets', JSON.stringify(presets.value))
    localStorage.setItem('lab-snapshots', JSON.stringify(snapshots.value))
  }, { deep: true })
  const settingsClipboard = ref(null) // { groups: [], state: {} }

  // derived state
  const ev = computed(() => {
    return 2 * Math.log2(16 / aperture.value) +
           Math.log2(60 / shutter.value) +
           Math.log2(iso.value / 100)
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

  function mutate(actionName, updateFn) {
    const stateBefore = currentLabState.value
    updateFn()
    const stateAfter = currentLabState.value

    // Only push if state changed (shallow check for simplicity, deep in reality)
    if (JSON.stringify(stateBefore) !== JSON.stringify(stateAfter)) {
      undoStack.value.push(stateBefore)
      redoStack.value = [] // clear redo
    }
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
    if (pkg.schemaVersion !== 'exposure-control-lab.package.v1') throw new Error('Invalid schemaVersion')
    // We would validate here normally (domain logic does that)
    applyState({
      aperture: pkg.aperture,
      shutter: pkg.shutter,
      iso: pkg.iso,
      light: pkg.light,
      effects: pkg.effects,
      look: pkg.look,
      presets: pkg.presets,
      snapshots: pkg.snapshots
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
    undoStack, redoStack, settingsClipboard,
    ev, labPackageJson, currentLabState,
    mutate, undo, redo, loadLabPackage, resetToSeed
  }
})
