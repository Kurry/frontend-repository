<template>
  <div class="h-full flex flex-col bg-panel p-4 overflow-hidden relative">

    <!-- Header & Filters -->
    <div class="flex justify-between items-center mb-3 shrink-0 gap-2">
      <h2 class="text-[10px] font-semibold tracking-widest text-black/60 m-0">PRESETS · {{ store.presets.length }}</h2>
      <label class="flex items-center gap-1 text-[10px] font-semibold tracking-widest text-black/60">
        <span class="sr-only">Filter presets</span>
        <select v-model="filter" class="text-sm bg-transparent border border-black/20 rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary normal-case tracking-normal font-medium" aria-label="Filter presets">
          <option value="all">All</option>
          <option value="favorites">Favorites only</option>
          <option v-for="tag in lookTags" :key="tag" :value="tag" class="capitalize">{{ tag }}</option>
        </select>
      </label>
    </div>

    <!-- Empty State: collection has no presets at all -->
    <div v-if="store.presets.length === 0" class="flex-1 flex flex-col items-center justify-center text-center px-4">
      <p class="mb-1 text-sm font-semibold m-0">No presets in your collection.</p>
      <p class="mb-4 text-[12px] text-black/60 m-0">Create a preset to save the current stops and look tag for one-tap recall.</p>
      <button @click="openCreate" class="px-4 py-2 border border-black/40 rounded text-sm hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Create preset</button>
    </div>

    <!-- Empty State: filter hides every preset -->
    <div v-else-if="filteredPresets.length === 0" class="flex-1 flex flex-col items-center justify-center text-center px-4">
      <p class="mb-1 text-sm font-semibold m-0">No presets match the {{ filterLabel }} filter.</p>
      <p class="mb-4 text-[12px] text-black/60 m-0">Switch back to All to see the full collection.</p>
      <button @click="filter = 'all'" class="px-4 py-2 border border-black/40 rounded text-sm hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Show all presets</button>
    </div>

    <template v-else>
      <!-- Compare panel: appears whenever exactly two presets are selected -->
      <div v-if="comparePair" class="shrink-0 mb-3 p-3 rounded-[10px] bg-black/80 text-white">
        <h3 class="m-0 mb-2 text-[10px] font-semibold tracking-widest text-white/60">COMPARE · {{ comparePair[0].name }} vs {{ comparePair[1].name }}</h3>
        <div class="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 text-[11px] tabular-nums">
          <span class="text-white/50"></span>
          <span class="font-medium truncate" :title="comparePair[0].name">{{ comparePair[0].name }}</span>
          <span class="font-medium truncate" :title="comparePair[1].name">{{ comparePair[1].name }}</span>

          <span class="text-white/50">Aperture</span>
          <span :class="comparePair[0].aperture !== comparePair[1].aperture && 'text-[#ffb199]'">f/{{ comparePair[0].aperture }}</span>
          <span :class="comparePair[0].aperture !== comparePair[1].aperture && 'text-[#ffb199]'">f/{{ comparePair[1].aperture }}</span>

          <span class="text-white/50">Speed</span>
          <span :class="comparePair[0].shutter !== comparePair[1].shutter && 'text-[#ffb199]'">1/{{ comparePair[0].shutter }}</span>
          <span :class="comparePair[0].shutter !== comparePair[1].shutter && 'text-[#ffb199]'">1/{{ comparePair[1].shutter }}</span>

          <span class="text-white/50">ISO</span>
          <span :class="comparePair[0].iso !== comparePair[1].iso && 'text-[#ffb199]'">{{ comparePair[0].iso }}</span>
          <span :class="comparePair[0].iso !== comparePair[1].iso && 'text-[#ffb199]'">{{ comparePair[1].iso }}</span>

          <span class="text-white/50">Look</span>
          <span class="capitalize">{{ comparePair[0].lookTag }}</span>
          <span class="capitalize">{{ comparePair[1].lookTag }}</span>

          <span class="text-white/50">EV</span>
          <span>{{ presetEV(comparePair[0]) }}{{ evBadge(0) }}</span>
          <span>{{ presetEV(comparePair[1]) }}{{ evBadge(1) }}</span>
        </div>
      </div>

      <!-- Presets List -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
        <TransitionGroup name="preset-row">
          <div
            v-for="preset in filteredPresets"
            :key="preset.name"
            class="preset-card bg-white/40 rounded-[10px] p-3 flex flex-col relative overflow-hidden transition-colors hover:bg-white/65"
          >
            <div class="flex justify-between items-start gap-1 mb-1">
              <label class="flex items-center justify-center cursor-pointer shrink-0 rounded w-7 h-7 max-md:w-11 max-md:h-11 -ml-1">
                <input
                  type="checkbox"
                  :value="preset.name"
                  v-model="selectedPresets"
                  class="w-5 h-5 accent-primary cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  :aria-label="'Select ' + preset.name"
                >
              </label>
              <h3 class="font-medium text-sm flex-1 min-w-0 m-0 self-center truncate" :title="preset.name">{{ preset.name }}</h3>
              <span class="capitalize self-center px-2 py-0.5 bg-black/5 rounded-full font-medium text-[10px] shrink-0">{{ preset.lookTag }}</span>
              <button
                @click="toggleFavorite(preset)"
                class="shrink-0 w-9 h-9 max-md:w-11 max-md:h-11 -mr-1 flex items-center justify-center rounded-full text-[18px] leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :class="preset.favorite ? 'text-primary hover:bg-primary/10' : 'text-black/25 hover:text-black/50 hover:bg-black/5'"
                :aria-label="preset.favorite ? 'Remove favorite from ' + preset.name : 'Mark ' + preset.name + ' favorite'"
                :aria-pressed="preset.favorite"
              >
                <span :key="String(preset.favorite)" class="inline-block" :class="{ 'fav-pop': preset.favorite }" aria-hidden="true">★</span>
              </button>
            </div>
            <div class="text-[10px] text-black/60 tabular-nums font-medium mb-2 pl-6">f/{{ preset.aperture }} • 1/{{ preset.shutter }} • ISO {{ preset.iso }}</div>

            <!-- Row actions: always visible, never occluded -->
            <div class="flex flex-wrap gap-1.5">
              <button
                @click="applyPreset(preset)"
                class="flex-1 min-w-[72px] px-2 py-1.5 max-md:min-h-[44px] rounded bg-black/80 hover:bg-black text-white text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="'Apply preset ' + preset.name + ' to the dials'"
              >
                Apply
              </button>
              <button
                v-if="!isMatchingStops(preset)"
                @click="copyStopsToPreset(preset)"
                class="px-2 py-1.5 max-md:min-h-[44px] rounded bg-black/10 hover:bg-black/20 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                title="Overwrite this preset's stops with the current dial values"
              >
                Copy stops
              </button>
              <button
                @click="startEdit(preset)"
                class="px-2.5 py-1.5 max-md:min-h-[44px] rounded bg-black/10 hover:bg-black/20 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="'Edit preset ' + preset.name"
              >
                Edit
              </button>
              <button
                @click="deletePreset(preset)"
                class="px-2.5 py-1.5 max-md:min-h-[44px] rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="'Delete preset ' + preset.name"
              >
                Delete
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <!-- Batch Bar -->
    <div v-if="selectedPresets.length >= 2" class="shrink-0 mt-3 p-3 bg-black/80 text-white rounded-[10px] flex justify-between items-center gap-2 flex-wrap shadow-xl">
      <span class="text-sm font-medium">{{ selectedPresets.length }} selected</span>
      <div class="flex gap-2 flex-wrap">
        <button class="px-3 py-1.5 max-md:min-h-[44px] text-xs rounded bg-white/10 hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary font-medium" @click="batchFavorite">Favorite selected</button>
        <button class="px-3 py-1.5 max-md:min-h-[44px] text-xs rounded bg-red-500 hover:bg-red-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary font-medium" @click="batchDelete">Delete selected</button>
      </div>
    </div>

    <!-- Controls below -->
    <div class="shrink-0 pt-3 flex gap-2">
      <button
        class="flex-1 py-2 bg-black/10 hover:bg-black/20 rounded-[8px] text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="openCreate"
      >
        Create preset
      </button>
    </div>

    <!-- Preset create/edit modal -->
    <Transition name="dialog">
      <div v-if="showCreate || editingPreset" ref="presetModalRef" class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50 p-4" @keydown.esc="closeModals" @keydown.tab="trapFocus($event, presetModalRef)" tabindex="-1">
        <PresetForm
          class="dialog-card"
          :initialData="editingPreset"
          @save="savePreset"
          @cancel="closeModals"
        />
      </div>
    </Transition>

    <!-- Snapshots Strip -->
    <div class="shrink-0 pt-3 mt-3 border-t border-black/10">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-[10px] font-semibold tracking-widest text-black/60 m-0">SNAPSHOTS · {{ store.snapshots.length }}</h2>
        <button class="text-[10px] px-2 py-1.5 max-md:min-h-[44px] bg-black/10 hover:bg-black/20 rounded font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="openSnapshotForm">Save snapshot</button>
      </div>
      <div class="flex overflow-x-auto gap-2 pb-1">
        <TransitionGroup name="preset-row">
          <button
            v-for="snap in store.snapshots"
            :key="snap.name"
            class="shrink-0 bg-white/40 rounded-[8px] p-2 flex flex-col text-left hover:bg-white/60 transition-colors w-32 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-label="'Restore snapshot ' + snap.name"
            @click="restoreSnapshot(snap)"
          >
            <span class="text-[12px] font-medium truncate w-full" :title="snap.name">{{ snap.name }}</span>
            <span class="text-[10px] text-black/60 font-medium mt-1">f/{{ snap.aperture }} • 1/{{ snap.shutter }} • {{ snap.iso }}</span>
          </button>
        </TransitionGroup>
      </div>
    </div>

    <Transition name="dialog">
      <div v-if="showSnapshotForm" ref="snapshotModalRef" class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50 p-4" @keydown.esc="showSnapshotForm = false" @keydown.tab="trapFocus($event, snapshotModalRef)" tabindex="-1">
        <SnapshotForm
          class="dialog-card"
          @save="saveSnapshot"
          @cancel="showSnapshotForm = false"
        />
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from '../store.js'
import { lookTags } from '../domain.js'
import PresetForm from './PresetForm.vue'
import SnapshotForm from './SnapshotForm.vue'

const store = useStore()
const filter = ref('all')
const selectedPresets = ref([])

const showCreate = ref(false)
const editingPreset = ref(null)
const showSnapshotForm = ref(false)

// Preset create/edit and snapshot overlays: move focus into the modal on
// open, trap Tab within it while open, and return focus to whichever
// control (Create preset, per-row Edit, or Save snapshot) triggered it --
// same modal-dialog contract as the Copy settings and help overlays.
const presetModalRef = ref(null)
const snapshotModalRef = ref(null)
let presetModalTrigger = null
let snapshotModalTrigger = null

function focusFirstIn(container) {
  if (!container) return
  const focusable = container.querySelector(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  ;(focusable || container).focus()
}

function trapFocus(e, containerRef) {
  if (!containerRef.value) return
  const focusable = containerRef.value.querySelectorAll(
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

watch(() => showCreate.value || !!editingPreset.value, async (open) => {
  if (open) {
    presetModalTrigger = document.activeElement
    await nextTick()
    focusFirstIn(presetModalRef.value)
  } else {
    await nextTick()
    presetModalTrigger?.focus()
    presetModalTrigger = null
  }
})

watch(showSnapshotForm, async (open) => {
  if (open) {
    snapshotModalTrigger = document.activeElement
    await nextTick()
    focusFirstIn(snapshotModalRef.value)
  } else {
    await nextTick()
    snapshotModalTrigger?.focus()
    snapshotModalTrigger = null
  }
})

const filterLabel = computed(() => filter.value === 'favorites' ? 'favorites-only' : filter.value)

const filteredPresets = computed(() => {
  let list = store.presets
  if (filter.value === 'favorites') list = list.filter(p => p.favorite)
  else if (filter.value !== 'all') list = list.filter(p => p.lookTag === filter.value)
  return list
})

// Side-by-side compare: derived live from the shared collection, so edits to
// either preset are reflected here the same tick.
const comparePair = computed(() => {
  if (selectedPresets.value.length !== 2) return null
  const a = store.presets.find(p => p.name === selectedPresets.value[0])
  const b = store.presets.find(p => p.name === selectedPresets.value[1])
  return a && b ? [a, b] : null
})

function presetEV(p) {
  const ev = 2 * Math.log2(16 / p.aperture) + Math.log2(60 / p.shutter) + Math.log2(p.iso / 100)
  return (ev >= 0 ? '+' : '−') + Math.abs(ev).toFixed(1)
}
function evBadge(idx) {
  if (!comparePair.value) return ''
  const d0 = 2 * Math.log2(16 / comparePair.value[0].aperture) + Math.log2(60 / comparePair.value[0].shutter) + Math.log2(comparePair.value[0].iso / 100)
  const d1 = 2 * Math.log2(16 / comparePair.value[1].aperture) + Math.log2(60 / comparePair.value[1].shutter) + Math.log2(comparePair.value[1].iso / 100)
  if (Math.abs(d0 - d1) < 0.05) return ''
  const diff = Math.abs(d0 - d1).toFixed(1)
  return idx === (d0 > d1 ? 0 : 1) ? ` · ${diff} st brighter` : ''
}

function openCreate(event) {
  presetModalTrigger = event?.currentTarget || null
  showCreate.value = true
}

function openSnapshotForm(event) {
  snapshotModalTrigger = event?.currentTarget || null
  showSnapshotForm.value = true
}

function applyPreset(preset) {
  // Same store mutation the WebMCP entity_select handler uses.
  store.mutate('applyPreset', () => {
    store.aperture = preset.aperture
    store.shutter = preset.shutter
    store.iso = preset.iso
  })
  store.toast(`Applied "${preset.name}" to the dials`)
}

function isMatchingStops(preset) {
  return preset.aperture === store.aperture &&
         preset.shutter === store.shutter &&
         preset.iso === store.iso
}

function copyStopsToPreset(preset) {
  store.mutate('copyStopsToPreset', () => {
    const p = store.presets.find(x => x.name === preset.name)
    if (p) {
      p.aperture = store.aperture
      p.shutter = store.shutter
      p.iso = store.iso
    }
  })
  store.toast(`Copied current stops to "${preset.name}"`)
}

function toggleFavorite(preset) {
  store.mutate('toggleFavorite', () => {
    const p = store.presets.find(x => x.name === preset.name)
    if (p) p.favorite = !p.favorite
  })
}

function startEdit(preset) {
  editingPreset.value = { ...preset }
}

function deletePreset(preset) {
  store.mutate('deletePreset', () => {
    store.presets = store.presets.filter(p => p.name !== preset.name)
    selectedPresets.value = selectedPresets.value.filter(n => n !== preset.name)
  })
  store.toast(`Deleted preset "${preset.name}"`)
}

function batchFavorite() {
  if (selectedPresets.value.length < 2) return
  store.mutate('batchFavorite', () => {
    selectedPresets.value.forEach(name => {
      const p = store.presets.find(x => x.name === name)
      if (p) p.favorite = true
    })
  })
  store.toast(`Marked ${selectedPresets.value.length} presets favorite`)
}

function batchDelete() {
  if (selectedPresets.value.length < 2) return
  const count = selectedPresets.value.length
  store.mutate('batchDelete', () => {
    store.presets = store.presets.filter(p => !selectedPresets.value.includes(p.name))
    selectedPresets.value = []
  })
  store.toast(`Deleted ${count} presets`)
}

function closeModals() {
  showCreate.value = false
  editingPreset.value = null
}

function savePreset(presetData) {
  // Double-activation guard: if a rapid second submit lands after an
  // identical create already landed, the name now exists -- treat it as the
  // same action instead of creating a duplicate row.
  if (!editingPreset.value && store.presets.some(p => p.name === presetData.name)) {
    closeModals()
    return
  }
  store.mutate(editingPreset.value ? 'editPreset' : 'createPreset', () => {
    if (editingPreset.value) {
      const oldName = editingPreset.value.name
      const idx = store.presets.findIndex(p => p.name === oldName)
      if (idx !== -1) store.presets[idx] = presetData
      // Renaming leaves selectedPresets holding the old name, which would
      // silently drop the preset from any in-progress batch selection since
      // it no longer matches an existing preset name. Keep the selection in
      // sync by swapping the old name for the new one.
      if (oldName !== presetData.name) {
        const selIdx = selectedPresets.value.indexOf(oldName)
        if (selIdx !== -1) selectedPresets.value[selIdx] = presetData.name
      }
    } else {
      store.presets.push(presetData)
    }
  })
  store.toast(editingPreset.value ? `Updated preset "${presetData.name}"` : `Created preset "${presetData.name}"`)
  closeModals()
}

function saveSnapshot(snapshotName) {
  // Captures the live stops AND the current develop-slider values at save
  // time, shaped exactly like the DialSnapshot API request body.
  const snapData = {
    name: snapshotName,
    aperture: store.aperture,
    shutter: store.shutter,
    iso: store.iso,
    light: { ...store.light },
    effects: { ...store.effects }
  }
  store.mutate('createSnapshot', () => {
    store.snapshots.push(snapData)
  })
  store.toast(`Saved snapshot "${snapData.name}"`)
  showSnapshotForm.value = false
}

function restoreSnapshot(snap) {
  store.mutate('restoreSnapshot', () => {
    store.aperture = snap.aperture
    store.shutter = snap.shutter
    store.iso = snap.iso
    Object.assign(store.light, snap.light)
    Object.assign(store.effects, snap.effects)
    store.activeLook = null
  })
  store.toast(`Restored snapshot "${snap.name}"`)
}
</script>
