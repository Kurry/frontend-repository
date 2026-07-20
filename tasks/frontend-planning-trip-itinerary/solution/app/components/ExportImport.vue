<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" v-if="isOpen">
    <div class="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
      <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl">
        <h2 class="text-xl font-bold">Export / Import</h2>
        <button @click="$emit('close')" class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><IconX /></button>
      </div>

      <div class="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button v-for="tab in ['Markdown', 'ICS', 'Trip JSON', 'Import JSON']" :key="tab"
                @click="activeTab = tab"
                class="px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors"
                :class="activeTab === tab ? 'border-b-2 border-primary text-primary dark:text-accent' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
          {{ tab }}
        </button>
      </div>

      <div class="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <!-- Markdown -->
        <div v-if="activeTab === 'Markdown'" class="h-full flex flex-col">
          <textarea readonly class="flex-1 w-full p-4 font-mono text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 resize-none mb-4">{{ markdownPreview }}</textarea>
          <div class="flex justify-end gap-2">
            <button @click="copyToClipboard(markdownPreview)" class="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300">Copy</button>
          </div>
        </div>

        <!-- ICS -->
        <div v-if="activeTab === 'ICS'" class="h-full flex flex-col">
          <textarea readonly class="flex-1 w-full p-4 font-mono text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 resize-none mb-4">{{ icsPreview }}</textarea>
          <div class="flex justify-end gap-2">
            <button @click="copyToClipboard(icsPreview)" class="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300">Copy</button>
            <button @click="downloadFile('trip.ics', icsPreview)" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Download</button>
          </div>
        </div>

        <!-- Trip JSON -->
        <div v-if="activeTab === 'Trip JSON'" class="h-full flex flex-col">
          <textarea readonly class="flex-1 w-full p-4 font-mono text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 resize-none mb-4">{{ jsonPreview }}</textarea>
          <div class="flex justify-end gap-2">
            <button @click="copyToClipboard(jsonPreview)" class="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300">Copy</button>
            <button @click="downloadFile('trip.json', jsonPreview)" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Download</button>
          </div>
        </div>

        <!-- Import JSON -->
        <div v-if="activeTab === 'Import JSON'" class="h-full flex flex-col">
          <p class="text-sm mb-2 text-slate-600 dark:text-slate-400">Paste a previously exported Trip JSON below to reconstruct your plan and ledger.</p>
          <textarea v-model="importText" class="flex-1 w-full p-4 font-mono text-sm border rounded bg-white dark:bg-slate-800 dark:border-slate-600 resize-none mb-2" placeholder='{"schemaVersion": "1", ...}'></textarea>
          <p v-if="importError" class="text-red-500 text-sm mb-2 font-bold">{{ importError }}</p>
          <div class="flex justify-end">
            <button @click="importJson" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Import</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTripStore } from '~/stores/trip'
import { format, parseISO } from 'date-fns'
import { IconX } from '@tabler/icons-vue'

defineProps<{
  isOpen: boolean
}>()
const emit = defineEmits(['close'])

const store = useTripStore()
const activeTab = ref('Markdown')
const importText = ref('')
const importError = ref('')

// Helpers
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    store.showToast('Copied to clipboard')
  } catch (err) {
    store.showToast('Failed to copy')
  }
}

const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  store.showToast(`Downloading ${filename}`)
}

// Markdown Preview
const markdownPreview = computed(() => {
  let md = "# Trip to the French Riviera - Cote d'Azur\n\n"
  const dates = [...new Set(store.stops.map(s => s.day))].sort()

  for (const date of dates) {
    md += `## ${format(parseISO(date), 'EEEE, MMMM do, yyyy')}\n\n`
    const dayStops = store.stops.filter(s => s.day === date).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    for (const stop of dayStops) {
      let timeStr = stop.startTime ? `${stop.startTime}${stop.endTime ? ' - ' + stop.endTime : ''}` : ''
      md += `- **${stop.title}**${timeStr ? ` (${timeStr})` : ''}\n`
      if (stop.location) md += `  - Location: ${stop.location}\n`
      if (stop.notes) md += `  - Notes: ${stop.notes}\n`
    }
    md += '\n'
  }
  return md.trim()
})

// ICS Preview
const icsPreview = computed(() => {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Travel Planner//NONSGML v1.0//EN\n"

  store.stops.forEach(stop => {
    ics += "BEGIN:VEVENT\n"

    let dtstart = stop.day.replace(/-/g, '')
    if (stop.startTime) {
      dtstart += `T${stop.startTime.replace(':', '')}00`
    }
    ics += `DTSTART:${dtstart}\n`

    if (stop.endTime) {
      ics += `DTEND:${stop.day.replace(/-/g, '')}T${stop.endTime.replace(':', '')}00\n`
    }

    ics += `SUMMARY:${stop.title}\n`
    if (stop.location) ics += `LOCATION:${stop.location}\n`
    if (stop.notes) ics += `DESCRIPTION:${stop.notes.replace(/\n/g, '\\n')}\n`

    ics += "END:VEVENT\n"
  })

  ics += "END:VCALENDAR"
  return ics
})

// JSON Preview
const jsonPreview = computed(() => {
  return JSON.stringify({
    schemaVersion: "1",
    trip: {
      title: "Trip to the French Riviera - Cote d'Azur",
      dateStart: "2025-07-05",
      dateEnd: "2025-07-11",
      budgetCeilingEur: 4500
    },
    stops: store.stops.map(s => {
      const obj: any = { ...s }
      delete obj.id
      return obj
    }),
    expenses: store.expenses.map(e => {
      const obj: any = { ...e }
      delete obj.id
      return obj
    })
  }, null, 2)
})

// Import Logic
const importJson = () => {
  importError.value = ''
  try {
    const data = JSON.parse(importText.value)
    if (data.schemaVersion !== "1") throw new Error("Invalid schemaVersion, expected 1")
    if (!data.trip || data.trip.budgetCeilingEur !== 4500) throw new Error("Missing or invalid trip configuration")
    if (!Array.isArray(data.stops) || !Array.isArray(data.expenses)) throw new Error("stops and expenses must be arrays")

    // Naive validation passed
    store.pushHistory()
    store.stops = data.stops.map((s: any) => ({ ...s, id: crypto.randomUUID() }))
    store.expenses = data.expenses.map((e: any) => ({ ...e, id: crypto.randomUUID() }))

    store.showToast('Import successful')
    importText.value = ''
    emit('close')
  } catch (err: any) {
    importError.value = err.message || 'Invalid JSON document'
  }
}
</script>
