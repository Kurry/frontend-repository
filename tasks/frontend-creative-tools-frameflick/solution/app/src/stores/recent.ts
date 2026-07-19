import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface RecentItem {
  id: string
  dataUrl: string
  name: string
  settings: Record<string, unknown>
  timestamp: number
}

const MAX_RECENT = 6

function safeLS() {
  try { return window.localStorage } catch { return null }
}
function load<T>(key: string, fallback: T): T {
  try { const s = safeLS()?.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { safeLS()?.setItem(key, JSON.stringify(val)) } catch {}
}

export const useRecentStore = defineStore('recent', () => {
  const items = ref<RecentItem[]>(load('ff_recent', []))

  watch(items, v => save('ff_recent', v), { deep: true })

  function addRecent(dataUrl: string, name: string, settings: Record<string, unknown>) {
    // Remove existing entry for same image name if present
    const existingIdx = items.value.findIndex(i => i.name === name)
    if (existingIdx !== -1) items.value.splice(existingIdx, 1)

    items.value.unshift({
      id: crypto.randomUUID(),
      dataUrl,
      name,
      settings,
      timestamp: Date.now(),
    })

    if (items.value.length > MAX_RECENT) {
      items.value = items.value.slice(0, MAX_RECENT)
    }
  }

  function updateSettings(id: string, settings: Record<string, unknown>) {
    const item = items.value.find(i => i.id === id)
    if (item) item.settings = settings
  }

  return { items, addRecent, updateSettings }
})
