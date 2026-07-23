<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-40 border-b border-linesoft bg-surface shadow-sm">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <p class="font-heading text-[1.25rem] font-bold text-ink">
          Mind<span class="text-primary">Thread</span>
        </p>
        <nav aria-label="Views" role="tablist" class="flex flex-wrap items-center gap-2" @keydown="handleNavKeydown">
          <button
            v-for="(view, idx) in views"
            :key="view.id"
            :ref="el => { if (el) navRefs[idx] = el as HTMLButtonElement }"
            type="button"
            role="tab"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring"
            :class="
              currentView === view.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-inksoft hover:bg-hoverwash hover:text-ink'
            "
            :aria-selected="currentView === view.id"
            :tabindex="currentView === view.id ? 0 : -1"
            @click="setView(view.id)"
          >
            {{ view.label }}
          </button>

          <button
            type="button"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring text-inksoft hover:bg-hoverwash hover:text-ink"
            @click="isExportOpen = true"
          >
            Export
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring text-inksoft hover:bg-hoverwash hover:text-ink"
            @click="isImportOpen = true"
          >
            Import
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring text-inksoft hover:bg-hoverwash hover:text-ink disabled:opacity-45"
            :disabled="!canUndo"
            aria-label="Undo"
            @click="handleUndo"
          >
            Undo
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring text-inksoft hover:bg-hoverwash hover:text-ink disabled:opacity-45"
            :disabled="!canRedo"
            aria-label="Redo"
            @click="handleRedo"
          >
            Redo
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <HomeView v-if="currentView === 'home'" />
      <TodayView v-else-if="currentView === 'today'" />
      <ArchivedView v-else />
    </main>

    <div
      v-if="showCoachmark"
      class="fixed bottom-24 left-4 z-30 max-w-xs rounded-xl border border-linesoft bg-surface p-4 shadow-lg"
      role="status"
    >
      <p class="font-heading text-[0.95rem] font-semibold text-ink">Capture your first spark</p>
      <p class="mt-1 text-[0.85rem] text-inksoft">
        Type a thought in the capture bar above and press Enter or select Add Spark.
      </p>
      <button type="button" class="btn-primary-sm mt-3" @click="showCoachmark = false">
        Got it
      </button>
    </div>

    <ToastContainer />
    <ExportDrawer v-model:open="isExportOpen" />
    <ImportDialog v-model:open="isImportOpen" />
    <CommandPalette @open-export="isExportOpen = true" @open-import="isImportOpen = true" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import ArchivedView from './components/ArchivedView.vue'
import CommandPalette from './components/CommandPalette.vue'
import ExportDrawer from './components/ExportDrawer.vue'
import HomeView from './components/HomeView.vue'
import ImportDialog from './components/ImportDialog.vue'
import ToastContainer from './components/ToastContainer.vue'
import TodayView from './components/TodayView.vue'
import { useSparkStore } from './stores/sparkStore'
import { useUiStore } from './stores/uiStore'
import type { ViewId } from './stores/uiStore'
import { showToast } from './utils/toast'

const isExportOpen = ref(false)
const isImportOpen = ref(false)
const showCoachmark = ref(false)

const views: { id: ViewId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'today', label: 'Today' },
  { id: 'archived', label: 'Archived' },
]

const ui = useUiStore()
const { currentView } = storeToRefs(ui)

const store = useSparkStore()
const { canUndo, canRedo } = storeToRefs(store)
const navRefs = ref<HTMLButtonElement[]>([])

function setView(view: ViewId) {
  ui.setView(view)
}

function handleNavKeydown(e: KeyboardEvent) {
  const currentIndex = views.findIndex(v => v.id === currentView.value)
  let nextIndex = currentIndex

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextIndex = (currentIndex + 1) % views.length
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    nextIndex = (currentIndex - 1 + views.length) % views.length
  }

  if (nextIndex !== currentIndex) {
    const view = views[nextIndex]
    if (view) {
      setView(view.id)
      navRefs.value[nextIndex]?.focus()
    }
  }
}

function handleUndo() {
  if (store.undo()) showToast('Undid last change', 'info')
}

function handleRedo() {
  if (store.redo()) showToast('Redid change', 'info')
}

onMounted(() => {
  showCoachmark.value = true
})
</script>
