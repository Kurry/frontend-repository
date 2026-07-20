<template>
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Hero Header -->
    <div class="bg-[url('https://via.placeholder.com/1200x400?text=French+Riviera')] bg-cover bg-center h-48 relative flex items-end p-6" v-if="!store.selectedDay">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div class="relative z-10 text-white w-full">
        <input
          v-model="heroTitle"
          class="text-3xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-white/50 rounded px-2 -mx-2 w-full"
        />
        <p class="text-sm mt-1 opacity-90">7/5 to 7/11</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="store.visibleStops.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
      <IconMapPin class="w-16 h-16 mb-4 opacity-50" />
      <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No stops yet</h3>
      <p class="mb-6">Start planning your trip by adding some places to visit.</p>
      <button @click="isCreating = true" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-2">
        <IconPlus class="w-4 h-4" /> Add a Stop
      </button>
    </div>

    <!-- List -->
    <div v-else class="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 relative">
      <div class="flex justify-between items-center sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur z-20 pb-4">
        <h2 class="text-2xl font-bold">Itinerary</h2>
        <button @click="isCreating = true" class="p-2 bg-primary text-white rounded-full hover:bg-primary/90 shadow-md" aria-label="Add Stop">
          <IconPlus />
        </button>
      </div>

      <transition name="slide-down">
        <div v-if="isCreating" class="mb-8">
          <StopForm @submit="handleCreate" @cancel="isCreating = false" />
        </div>
      </transition>

      <div v-for="day in visibleDays" :key="day" class="space-y-4">
        <h3 class="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 sticky top-14 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur z-10">
          <span class="w-3 h-3 rounded-full" :class="getDayColor(tripDates.indexOf(day))"></span>
          {{ formatLongDay(day) }}
        </h3>

        <transition-group name="list" tag="div" class="space-y-3">
          <div
            v-for="stop in getStopsForDay(day)"
            :key="stop.id"
            class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
            :class="{'ring-2 ring-primary': store.selectedStopId === stop.id}"
            @click="store.selectStop(stop.id)"
          >
            <div v-if="editingId === stop.id" @click.stop>
              <StopForm :stop="stop" @submit="handleUpdate(stop.id, $event)" @cancel="editingId = null" />
            </div>
            <div v-else class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    {{ stop.category }}
                  </span>
                  <span v-if="stop.startTime" class="text-xs text-slate-500 font-medium">
                    {{ stop.startTime }} <template v-if="stop.endTime">- {{ stop.endTime }}</template>
                  </span>
                </div>
                <h4 class="font-bold text-lg text-slate-800 dark:text-slate-100">{{ stop.title }}</h4>
                <p v-if="stop.location" class="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <IconMapPin class="w-3 h-3" /> {{ stop.location }}
                </p>
                <p v-if="stop.notes" class="text-sm text-slate-600 dark:text-slate-400 mt-2 italic line-clamp-2">
                  {{ stop.notes }}
                </p>
              </div>

              <div class="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button @click.stop="editingId = stop.id" class="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-slate-700" aria-label="Edit stop"><IconEdit class="w-4 h-4" /></button>
                <button @click.stop="handleDelete(stop.id)" class="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-slate-700" aria-label="Delete stop"><IconTrash class="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTripStore } from '~/stores/trip'
import { format, parseISO } from 'date-fns'
import { IconMapPin, IconPlus, IconEdit, IconTrash } from '@tabler/icons-vue'

const store = useTripStore()
const isCreating = ref(false)
const editingId = ref<string | null>(null)
const heroTitle = ref("Trip to the French Riviera - Cote d'Azur")

const tripDates = [
  '2025-07-05',
  '2025-07-06',
  '2025-07-07',
  '2025-07-08',
  '2025-07-09',
  '2025-07-10',
  '2025-07-11'
]

const visibleDays = computed(() => {
  if (store.selectedDay) return [store.selectedDay]
  return tripDates.filter(day => store.stops.some(s => s.day === day))
})

const formatLongDay = (dateStr: string) => {
  return format(parseISO(dateStr), 'EEEE, MMMM do, yyyy')
}

const getStopsForDay = (day: string) => {
  return store.stops.filter(s => s.day === day).sort((a, b) => {
    if (!a.startTime) return 1
    if (!b.startTime) return -1
    return a.startTime.localeCompare(b.startTime)
  })
}

const dayColors = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'
]
const getDayColor = (index: number) => dayColors[index % dayColors.length]

const handleCreate = (values: any) => {
  store.addStop(values)
  isCreating.value = false
}

const handleUpdate = (id: string, values: any) => {
  store.updateStop(id, values)
  editingId.value = null
}

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this stop?')) {
    store.deleteStop(id)
  }
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
