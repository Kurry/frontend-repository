<template>
  <div class="h-full flex flex-col bg-panel p-4 overflow-hidden relative">

    <!-- Header & Filters -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h2 class="text-[10px] font-semibold tracking-widest text-black/60">PRESETS</h2>
      <select v-model="filter" class="text-sm bg-transparent border border-black/20 rounded px-2 py-1 focus:outline-primary" aria-label="Filter presets">
        <option value="all">All</option>
        <option value="favorites">Favorites Only</option>
        <option v-for="tag in lookTags" :key="tag" :value="tag" class="capitalize">{{ tag }}</option>
      </select>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPresets.length === 0" class="flex-1 flex flex-col items-center justify-center opacity-50 text-center">
      <p class="mb-4 text-sm font-medium">No presets found.</p>
      <button @click="showCreate = true" class="px-4 py-2 border border-black/40 rounded text-sm hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Create one</button>
    </div>

    <!-- Presets List -->
    <div v-else class="flex-1 overflow-y-auto pr-2 space-y-2">
      <div
        v-for="preset in filteredPresets"
        :key="preset.name"
        class="bg-white/40 rounded-[10px] p-3 flex flex-col group relative overflow-hidden transition-colors hover:bg-white/60 cursor-pointer"
        @click="applyPreset(preset)"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <input type="checkbox" :value="preset.name" v-model="selectedPresets" class="w-4 h-4 accent-primary shrink-0 cursor-pointer" @click.stop aria-label="Select preset">
            <h3 class="font-medium text-sm">{{ preset.name }}</h3>
          </div>
          <button
            @click.stop="toggleFavorite(preset)"
            class="text-[16px] shrink-0 leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="preset.favorite ? 'text-primary' : 'text-black/20 hover:text-black/40'"
            :aria-label="preset.favorite ? 'Remove favorite' : 'Mark favorite'"
          >
            ★
          </button>
        </div>
        <div class="flex justify-between items-center text-[10px] text-black/60">
          <span class="tabular-nums font-medium">f/{{ preset.aperture }} • 1/{{ preset.shutter }} • ISO {{ preset.iso }}</span>
          <span class="capitalize px-2 py-0.5 bg-black/5 rounded-full font-medium">{{ preset.lookTag }}</span>
        </div>

        <!-- Hover Actions -->
        <div class="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            v-if="!isMatchingStops(preset)"
            @click.stop="copyStopsToPreset(preset)"
            class="px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            title="Copy stops from dials"
          >
            Copy stops
          </button>
          <button
            @click.stop="startEdit(preset)"
            class="px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Edit preset"
          >
            Edit
          </button>
          <button
            @click.stop="deletePreset(preset)"
            class="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Delete preset"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Bar -->
    <div v-if="selectedPresets.length >= 2" class="shrink-0 mt-4 p-3 bg-black/80 text-white rounded-[10px] flex justify-between items-center shadow-xl">
      <span class="text-sm font-medium">{{ selectedPresets.length }} selected</span>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary font-medium" @click="batchFavorite">Favorite selected</button>
        <button class="px-3 py-1.5 text-xs rounded bg-red-500 hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary font-medium" @click="batchDelete">Delete selected</button>
      </div>
    </div>

    <!-- Controls below -->
    <div class="shrink-0 pt-4 flex gap-2">
      <button
        class="flex-1 py-2 bg-black/10 hover:bg-black/20 rounded-[8px] text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
        @click="showCreate = true"
      >
        Create preset
      </button>
    </div>

    <!-- Modals -->
    <div v-if="showCreate || editingPreset" ref="presetModalRef" class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50 p-4" @keydown.esc="closeModals" @keydown.tab="trapFocus($event, presetModalRef)" tabindex="-1">
      <PresetForm
        :initialData="editingPreset"
        @save="savePreset"
        @cancel="closeModals"
      />
    </div>

    <!-- Snapshots Strip -->
    <div class="shrink-0 pt-4 mt-4 border-t border-black/10">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-[10px] font-semibold tracking-widest text-black/60">SNAPSHOTS</h2>
        <button class="text-[10px] px-2 py-1 bg-black/10 hover:bg-black/20 rounded font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="showSnapshotForm = true">Save snapshot</button>
      </div>
      <div class="flex overflow-x-auto gap-2 pb-2">
        <button
          v-for="snap in store.snapshots"
          :key="snap.name"
          class="shrink-0 bg-white/40 rounded-[8px] p-2 flex flex-col text-left hover:bg-white/60 transition-colors w-32 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="restoreSnapshot(snap)"
        >
          <span class="text-[12px] font-medium truncate w-full" :title="snap.name">{{ snap.name }}</span>
          <span class="text-[10px] text-black/60 font-medium mt-1">f/{{ snap.aperture }} • 1/{{ snap.shutter }} • {{ snap.iso }}</span>
        </button>
      </div>
    </div>

    <div v-if="showSnapshotForm" ref="snapshotModalRef" class="fixed inset-0 z-[2600] flex items-center justify-center bg-black/50 p-4" @keydown.esc="showSnapshotForm = false" @keydown.tab="trapFocus($event, snapshotModalRef)" tabindex="-1">
      <SnapshotForm
        @save="saveSnapshot"
        @cancel="showSnapshotForm = false"
      />
    </div>

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
  }
})

const filteredPresets = computed(() => {
  let list = store.presets
  if (filter.value === 'favorites') list = list.filter(p => p.favorite)
  else if (filter.value !== 'all') list = list.filter(p => p.lookTag === filter.value)
  return list
})

function applyPreset(preset) {
  store.mutate('applyPreset', () => {
    store.aperture = preset.aperture
    store.shutter = preset.shutter
    store.iso = preset.iso
  })
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
}

function batchFavorite() {
  if (selectedPresets.value.length < 2) return
  store.mutate('batchFavorite', () => {
    selectedPresets.value.forEach(name => {
      const p = store.presets.find(x => x.name === name)
      if (p) p.favorite = true
    })
  })
}

function batchDelete() {
  if (selectedPresets.value.length < 2) return
  store.mutate('batchDelete', () => {
    store.presets = store.presets.filter(p => !selectedPresets.value.includes(p.name))
    selectedPresets.value = []
  })
}

function closeModals() {
  showCreate.value = false
  editingPreset.value = null
}

function savePreset(presetData) {
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
  closeModals()
}

function saveSnapshot(snapData) {
  store.mutate('createSnapshot', () => {
    store.snapshots.push(snapData)
  })
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
}
</script>
