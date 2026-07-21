import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { RenderSettings } from './canvas'

export interface RecentItem {
  id: string
  dataUrl: string
  name: string
  /** Last-used style settings for this image (kept in sync while it is active). */
  settings: RenderSettings
  /** The look captured when this image was first loaded (Before/After baseline). */
  baseline: RenderSettings
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
  /** Id of the item currently shown on the canvas (survives refresh). */
  const activeId = ref<string | null>(load<string | null>('ff_recentActive', null))

  watch(items, v => save('ff_recent', v), { deep: true })
  watch(activeId, v => save('ff_recentActive', v))

  function addRecent(dataUrl: string, name: string, settings: RenderSettings, baseline: RenderSettings) {
    // Re-processing the exact same image replaces its entry instead of stacking.
    const existingIdx = items.value.findIndex(i => i.dataUrl === dataUrl)
    if (existingIdx !== -1) items.value.splice(existingIdx, 1)

    const item: RecentItem = {
      id: crypto.randomUUID(),
      dataUrl,
      name,
      settings: JSON.parse(JSON.stringify(settings)),
      baseline: JSON.parse(JSON.stringify(baseline)),
      timestamp: Date.now(),
    }
    items.value.unshift(item)

    if (items.value.length > MAX_RECENT) {
      items.value = items.value.slice(0, MAX_RECENT)
    }
    activeId.value = item.id
    return item
  }

  function updateSettings(id: string, settings: RenderSettings) {
    const item = items.value.find(i => i.id === id)
    if (item) item.settings = JSON.parse(JSON.stringify(settings))
  }

  function updateBaseline(id: string, baseline: RenderSettings) {
    const item = items.value.find(i => i.id === id)
    if (item) item.baseline = JSON.parse(JSON.stringify(baseline))
  }

  function setActive(id: string) {
    activeId.value = id
  }

  return { items, activeId, addRecent, updateSettings, updateBaseline, setActive }
})
