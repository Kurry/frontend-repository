<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-40 border-b border-linesoft bg-surface shadow-sm">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <h1 class="font-heading text-[1.25rem] font-bold text-ink">
          Mind<span class="text-primary">Thread</span>
        </h1>
        <nav aria-label="Views" class="flex items-center gap-2">
          <button
            v-for="view in views"
            :key="view.id"
            type="button"
            class="rounded-md px-3 py-2 text-[0.9rem] font-medium transition-colors focus-ring"
            :class="
              currentView === view.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-inksoft hover:bg-hoverwash hover:text-ink'
            "
            :aria-current="currentView === view.id ? 'page' : undefined"
            @click="setView(view.id)"
          >
            {{ view.label }}
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <HomeView v-if="currentView === 'home'" />
      <TodayView v-else-if="currentView === 'today'" />
      <ArchivedView v-else />
    </main>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ArchivedView from './components/ArchivedView.vue'
import HomeView from './components/HomeView.vue'
import ToastContainer from './components/ToastContainer.vue'
import TodayView from './components/TodayView.vue'
import { useUiStore } from './stores/uiStore'
import type { ViewId } from './stores/uiStore'

const views: { id: ViewId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'today', label: 'Today' },
  { id: 'archived', label: 'Archived' },
]

const ui = useUiStore()
const { currentView } = storeToRefs(ui)

function setView(view: ViewId) {
  ui.setView(view)
}
</script>
