<template>
  <div class="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans relative">

    <!-- Sidebar / Drawer toggle for mobile -->
    <div class="md:hidden flex items-center p-4 bg-primary text-white z-50 shadow-md">
      <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 rounded hover:bg-white/20 mr-4" aria-label="Toggle Sidebar">
        <IconMenu2 />
      </button>
      <h1 class="text-xl font-bold">Trip Planner</h1>
    </div>

    <!-- Sidebar Overlay for mobile -->
    <div v-if="isSidebarOpen" class="fixed inset-0 bg-black/50 z-40 md:hidden" @click="isSidebarOpen = false"></div>

    <!-- Sidebar (Left Pane) -->
    <aside
      :class="['fixed md:static inset-y-0 left-0 w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transition-transform duration-300',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0']"
    >
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h1 class="text-xl font-bold text-primary dark:text-accent">Overview</h1>
        <button class="md:hidden" @click="isSidebarOpen = false" aria-label="Close Sidebar"><IconX /></button>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-2">
        <div class="mb-6">
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Explore</h2>
          <button class="w-full text-left p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inert-nav" aria-label="Explore AI Assistant">AI Assistant</button>
          <button class="w-full text-left p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inert-nav" aria-label="Notes">Notes</button>
          <button class="w-full text-left p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inert-nav" aria-label="Places">Places</button>
        </div>

        <div>
          <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Itinerary</h2>
          <button
            class="w-full text-left p-2 flex items-center justify-between rounded"
            :class="store.selectedDay === null ? 'bg-primary/10 text-primary font-bold dark:text-accent' : 'hover:bg-slate-100 dark:hover:bg-slate-700'"
            @click="store.setDayFilter(null)"
          >
            <span>All Days</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600">{{ store.stops.length }}</span>
          </button>

          <button
            v-for="(day, index) in tripDates"
            :key="day"
            class="w-full text-left p-2 flex items-center justify-between rounded group"
            :class="store.selectedDay === day ? 'bg-primary/10 text-primary font-bold dark:text-accent' : 'hover:bg-slate-100 dark:hover:bg-slate-700'"
            @click="store.setDayFilter(day)"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="getDayColor(index)"></span>
              <span>{{ formatShortDay(day) }}</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-white dark:bg-slate-700 dark:group-hover:bg-slate-600">{{ getStopsForDay(day).length }}</span>
          </button>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button class="w-full p-2 flex items-center justify-between rounded hover:bg-slate-100 dark:hover:bg-slate-700" @click="store.setMode('Budget')">
          <span class="flex items-center gap-2"><IconWallet class="w-4 h-4" /> Budget</span>
        </button>
        <button class="w-full p-2 flex items-center justify-between rounded hover:bg-slate-100 dark:hover:bg-slate-700" @click="store.setMode('Spreadsheet')">
          <span class="flex items-center gap-2"><IconTable class="w-4 h-4" /> Spreadsheet</span>
        </button>

        <div class="flex items-center justify-between mt-4">
          <button class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" @click="store.toggleTheme" aria-label="Toggle Theme">
            <IconMoon v-if="store.theme === 'light'" class="w-5 h-5"/>
            <IconSun v-else class="w-5 h-5"/>
          </button>
          <button class="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inert-nav">Support</button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
      <!-- Plan Column (Center Pane) -->
      <section class="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto" v-show="store.activeMode !== 'Map'">
        <slot />
      </section>

      <!-- Map Pane (Right Pane) -->
      <section
        class="w-full md:w-1/3 lg:w-2/5 xl:w-1/2 flex flex-col bg-slate-100 dark:bg-slate-800"
        v-show="store.activeMode === 'Map' || !isMobile"
      >
        <!-- Mock Map Chrome -->
        <div class="flex-1 relative bg-[url('https://via.placeholder.com/800x1200?text=Map+Snapshot')] bg-cover bg-center">
            <div class="absolute inset-0 bg-blue-500/10 mix-blend-multiply"></div>

            <div class="absolute top-4 right-4 flex flex-col gap-2">
               <button class="p-2 bg-white dark:bg-slate-800 rounded shadow-md inert-nav" aria-label="Layers"><IconLayersLinked /></button>
               <button class="p-2 bg-white dark:bg-slate-800 rounded shadow-md inert-nav" aria-label="Zoom In"><IconPlus /></button>
               <button class="p-2 bg-white dark:bg-slate-800 rounded shadow-md inert-nav" aria-label="Zoom Out"><IconMinus /></button>
            </div>

            <div class="absolute bottom-4 left-4 flex gap-2">
                <button class="px-4 py-2 bg-primary text-white rounded shadow-md text-sm font-semibold inert-nav">Optimize Route</button>
                <button @click="isExportOpen = true" class="px-4 py-2 bg-white text-slate-800 rounded shadow-md text-sm font-semibold">Export</button>
            </div>

            <!-- Floating Place Detail Card -->
            <transition name="slide-up">
              <div v-if="store.selectedStopId" class="absolute bottom-16 left-4 right-4 md:left-8 md:right-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 flex flex-col max-h-[50%]">
                 <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">{{ selectedStop?.title }}</h3>
                    <button @click="store.selectStop(null)" class="text-slate-400 hover:text-slate-800"><IconX class="w-5 h-5"/></button>
                 </div>
                 <div class="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto">
                    <button v-for="tab in ['About', 'Book', 'Reviews', 'Photos', 'Mentions']" :key="tab"
                            @click="store.setDetailTab(tab as any)"
                            class="pb-2 text-sm font-semibold whitespace-nowrap"
                            :class="store.activeDetailTab === tab ? 'border-b-2 border-primary text-primary dark:text-accent' : 'text-slate-500'">
                      {{ tab }}
                    </button>
                 </div>
                 <div class="overflow-y-auto flex-1 text-sm text-slate-600 dark:text-slate-300">
                    <p>Details for {{ selectedStop?.title }}</p>
                    <p class="mt-2 text-xs opacity-70">Category: {{ selectedStop?.category }}</p>
                 </div>
              </div>
            </transition>
        </div>
      </section>
    </main>

    <ExportImport :isOpen="isExportOpen" @close="isExportOpen = false" />

    <!-- Toasts container -->
    <div class="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite" aria-atomic="true">
      <transition-group name="toast">
        <div v-for="toast in store.toasts" :key="toast.id" class="bg-slate-800 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 w-80">
          <IconInfoCircle class="w-5 h-5 text-blue-400" />
          <span class="flex-1">{{ toast.message }}</span>
          <button @click="store.toasts = store.toasts.filter(t => t.id !== toast.id)"><IconX class="w-4 h-4" /></button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTripStore } from '~/stores/trip'
import { format, parseISO } from 'date-fns'
import {
  IconMenu2, IconX, IconWallet, IconTable, IconMoon, IconSun,
  IconLayersLinked, IconPlus, IconMinus, IconInfoCircle
} from '@tabler/icons-vue'

const store = useTripStore()
const isSidebarOpen = ref(false)
const windowWidth = ref(1024)
const isExportOpen = ref(false)

const isMobile = computed(() => windowWidth.value < 768)

const tripDates = [
  '2025-07-05',
  '2025-07-06',
  '2025-07-07',
  '2025-07-08',
  '2025-07-09',
  '2025-07-10',
  '2025-07-11'
]

const formatShortDay = (dateStr: string) => {
  return format(parseISO(dateStr), 'EEE M/d')
}

const getStopsForDay = (day: string) => {
  return store.stops.filter(s => s.day === day)
}

const selectedStop = computed(() => {
  return store.stops.find(s => s.id === store.selectedStopId)
})

const dayColors = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'
]
const getDayColor = (index: number) => dayColors[index % dayColors.length]

const updateWidth = () => {
  windowWidth.value = window.innerWidth
  if (!isMobile.value) {
    isSidebarOpen.value = false
  }
}

// Intercept inert navs globally for demo
const handleInertNavClick = (e: MouseEvent) => {
  const target = (e.target as HTMLElement).closest('.inert-nav')
  if (target) {
    e.preventDefault()
    const label = target.getAttribute('aria-label') || target.textContent?.trim() || 'Action'
    store.showToast(`${label} — demo only`)
  }
}

onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth)
  document.addEventListener('click', handleInertNavClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
  document.removeEventListener('click', handleInertNavClick)
})
</script>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.inert-nav {
  cursor: pointer;
}
</style>
