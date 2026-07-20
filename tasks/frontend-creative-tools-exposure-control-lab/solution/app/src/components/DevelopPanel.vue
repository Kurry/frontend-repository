<template>
  <div class="w-full bg-panel p-4 md:p-6 overflow-y-auto pointer-events-auto h-full flex flex-col gap-6" aria-label="Develop Panel">

    <!-- Controls header -->
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded bg-black/10 hover:bg-black/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="store.undo()"
          :disabled="store.undoStack.length === 0"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          class="px-3 py-1.5 rounded bg-black/10 hover:bg-black/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="store.redo()"
          :disabled="store.redoStack.length === 0"
          aria-label="Redo"
        >
          Redo
        </button>
      </div>
      <button
        class="px-3 py-1.5 rounded text-primary border border-primary hover:bg-primary/10 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="resetAll"
      >
        Reset to original
      </button>
    </div>

    <!-- Look Chips -->
    <div>
      <h3 class="text-[10px] font-semibold tracking-widest text-black/60 mb-3">LOOK</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="look in lookChips"
          :key="look"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="store.activeLook === look ? 'bg-primary text-white' : 'bg-black/5 hover:bg-black/10 text-black/80'"
          @click="applyLook(look)"
          :aria-pressed="store.activeLook === look"
        >
          {{ look }}
        </button>
      </div>
    </div>

    <!-- Light Group -->
    <div>
      <div class="flex justify-between items-end mb-3">
        <h3 class="text-[10px] font-semibold tracking-widest text-black/60">LIGHT</h3>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="key in ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks']" :key="key" class="grid grid-cols-[80px_1fr_40px_24px] gap-2 items-center">
          <label :for="'slider-' + key" class="text-[12px] capitalize font-medium">{{ key }}</label>
          <input
            type="range"
            :id="'slider-' + key"
            min="-100" max="100"
            :value="store.light[key]"
            @input="updateLight(key, $event.target.value)"
            @change="commitLight(key, $event.target.value)"
            class="w-full accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
          <span class="text-right text-[12px] font-medium tabular-nums">{{ store.light[key] }}</span>
          <button
            @click="resetSlider('light', key)"
            class="w-6 h-6 flex items-center justify-center text-black/40 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-full hover:bg-black/5"
            aria-label="Reset slider"
            v-show="store.light[key] !== 0"
          >×</button>
          <span v-show="store.light[key] === 0"></span>
        </div>
      </div>
    </div>

    <!-- Effects Group -->
    <div>
      <div class="flex justify-between items-end mb-3">
        <h3 class="text-[10px] font-semibold tracking-widest text-black/60">EFFECTS</h3>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="key in ['texture', 'clarity', 'vignette', 'grain']" :key="key" class="grid grid-cols-[80px_1fr_40px_24px] gap-2 items-center">
          <label :for="'slider-' + key" class="text-[12px] capitalize font-medium">{{ key }}</label>
          <input
            type="range"
            :id="'slider-' + key"
            :min="['vignette', 'grain'].includes(key) ? 0 : -100" max="100"
            :value="store.effects[key]"
            @input="updateEffects(key, $event.target.value)"
            @change="commitEffects(key, $event.target.value)"
            class="w-full accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
          <span class="text-right text-[12px] font-medium tabular-nums">{{ store.effects[key] }}</span>
          <button
            @click="resetSlider('effects', key)"
            class="w-6 h-6 flex items-center justify-center text-black/40 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-full hover:bg-black/5"
            aria-label="Reset slider"
            v-show="store.effects[key] !== 0"
          >×</button>
          <span v-show="store.effects[key] === 0"></span>
        </div>
      </div>
    </div>

    <!-- Copy / Paste Settings -->
    <div class="flex gap-2 pt-4 border-t border-black/10 mt-auto shrink-0">
      <button
        ref="copyTriggerRef"
        class="flex-1 py-2 bg-black/80 hover:bg-black text-white rounded text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="showCopyDialog = true"
      >
        Copy settings
      </button>
      <button
        class="flex-1 py-2 bg-black/10 hover:bg-black/20 rounded text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="pasteSettings"
        :disabled="!store.settingsClipboard"
      >
        Paste settings
      </button>
    </div>
    <div v-if="copyConfirmMessage" role="status" aria-live="polite" class="text-[11px] text-center text-black/60 pt-1">
      {{ copyConfirmMessage }}
    </div>

    <!-- Copy Settings Dialog -->
    <Transition name="dialog">
      <div v-if="showCopyDialog" class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50" @keydown.esc="showCopyDialog = false" @keydown.tab="handleCopyDialogKeydown" tabindex="-1" ref="copyDialogRef">
        <div class="dialog-card bg-panel p-6 rounded-[10px] w-80 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="copy-dialog-title">
          <h2 id="copy-dialog-title" class="text-lg font-medium mb-4 mt-0">Copy settings</h2>
          <div class="flex flex-col gap-3 mb-6">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="copyGroups.dials" class="w-4 h-4 accent-primary">
              Dials (Aperture, Shutter, ISO)
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="copyGroups.light" class="w-4 h-4 accent-primary">
              Light
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="copyGroups.effects" class="w-4 h-4 accent-primary">
              Effects
            </label>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium" @click="showCopyDialog = false">Cancel</button>
            <button
              class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canCopy"
              @click="confirmCopy"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from '../store.js'
import { lookChips } from '../domain.js'

const store = useStore()
const showCopyDialog = ref(false)
const copyDialogRef = ref(null)
const copyTriggerRef = ref(null)
const copyConfirmMessage = ref('')

const copyGroups = ref({
  dials: true,
  light: true,
  effects: true
})

const canCopy = computed(() => copyGroups.value.dials || copyGroups.value.light || copyGroups.value.effects)

watch(showCopyDialog, async (newVal) => {
  if (newVal) {
    copyGroups.value = { dials: true, light: true, effects: true }
    await nextTick()
    if (copyDialogRef.value) {
      copyDialogRef.value.focus()
    }
  } else {
    await nextTick()
    copyTriggerRef.value?.focus()
  }
})

// Keeps Tab/Shift+Tab cycling within the Copy settings dialog while it's
// open, per the modal-dialog contract (traps focus while open).
function handleCopyDialogKeydown(e) {
  if (!copyDialogRef.value) return
  const focusable = copyDialogRef.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// Slider drags apply live on `@input` for immediate visual feedback, then
// commit exactly one undo entry on `@change` (release) via store.commitPending
// -- the same history-push path store.mutate uses -- so a single logical
// drag interaction never records more than one undo step. The undo-stack
// length is captured alongside the baseline so store.commitPending can detect
// an interleaved edit (e.g. a dial change mid-drag) and skip the stale push
// instead of double-stacking two entries for one interaction.
let lightDragStartState = null
let lightDragStartIndex = -1
let effectsDragStartState = null
let effectsDragStartIndex = -1

function updateLight(key, val) {
  if (!lightDragStartState) {
    lightDragStartState = store.currentLabState
    lightDragStartIndex = store.undoStack.length
  }
  store.light[key] = Number(val)
  store.activeLook = null
}
function commitLight(key, val) {
  if (lightDragStartState) {
    store.commitPending(lightDragStartState, lightDragStartIndex)
    lightDragStartState = null
    lightDragStartIndex = -1
  }
}

function updateEffects(key, val) {
  if (!effectsDragStartState) {
    effectsDragStartState = store.currentLabState
    effectsDragStartIndex = store.undoStack.length
  }
  store.effects[key] = Number(val)
  store.activeLook = null
}
function commitEffects(key, val) {
  if (effectsDragStartState) {
    store.commitPending(effectsDragStartState, effectsDragStartIndex)
    effectsDragStartState = null
    effectsDragStartIndex = -1
  }
}

function resetSlider(group, key) {
  store.mutate('resetSlider', () => {
    store[group][key] = 0
    store.activeLook = null
  })
}

function resetAll() {
  store.mutate('resetAll', () => {
    store.aperture = 16
    store.shutter = 60
    store.iso = 100
    for(let k in store.light) store.light[k] = 0
    for(let k in store.effects) store.effects[k] = 0
    store.activeLook = null
  })
}

const lookDefinitions = {
  'Punch': { light: { exposure: 10, contrast: 25, highlights: -10, shadows: 15, whites: 10, blacks: -15 }, effects: { texture: 10, clarity: 15, vignette: 10, grain: 0 } },
  'Matte': { light: { exposure: 5, contrast: -15, highlights: -20, shadows: 30, whites: -10, blacks: 40 }, effects: { texture: -5, clarity: -10, vignette: 5, grain: 20 } },
  'Golden': { light: { exposure: 15, contrast: 10, highlights: 10, shadows: 5, whites: 15, blacks: -5 }, effects: { texture: 5, clarity: 5, vignette: 15, grain: 10 } },
  'Mono': { light: { exposure: 0, contrast: 30, highlights: -15, shadows: -10, whites: 20, blacks: -30 }, effects: { texture: 20, clarity: 25, vignette: 20, grain: 40 } }
}

function applyLook(look) {
  if (store.activeLook === look) return
  store.mutate('applyLook', () => {
    const def = lookDefinitions[look]
    Object.assign(store.light, def.light)
    Object.assign(store.effects, def.effects)
    store.activeLook = look
  })
}

function confirmCopy() {
  const groups = []
  if (copyGroups.value.dials) groups.push('Dials')
  if (copyGroups.value.light) groups.push('Light')
  if (copyGroups.value.effects) groups.push('Effects')

  store.settingsClipboard = {
    groups,
    state: JSON.parse(JSON.stringify(store.currentLabState))
  }
  showCopyDialog.value = false
  copyConfirmMessage.value = `Copied groups: ${groups.join(', ')}`
  setTimeout(() => { copyConfirmMessage.value = '' }, 3000)
}

function pasteSettings() {
  if (!store.settingsClipboard) return
  store.mutate('pasteSettings', () => {
    const { groups, state } = store.settingsClipboard
    if (groups.includes('Dials')) {
      store.aperture = state.aperture
      store.shutter = state.shutter
      store.iso = state.iso
    }
    if (groups.includes('Light')) {
      Object.assign(store.light, state.light)
    }
    if (groups.includes('Effects')) {
      Object.assign(store.effects, state.effects)
    }
    store.activeLook = null
  })
}
</script>
