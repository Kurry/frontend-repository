import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { RenderSettings } from './canvas'

export interface Snapshot {
  id: string
  name: string
  settings: RenderSettings
  createdAt: number
}

const MAX_NAME = 40

function safeLS() {
  try { return window.localStorage } catch { return null }
}
function load<T>(key: string, fallback: T): T {
  try { const s = safeLS()?.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { safeLS()?.setItem(key, JSON.stringify(val)) } catch {}
}

/** Inline validation for the snapshot name field. Returns null when valid. */
export function validateSnapshotName(raw: string, existing: Snapshot[]): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Give the snapshot a name in the name field.'
  if (raw.length > MAX_NAME) return `Snapshot name must be ${MAX_NAME} characters or fewer.`
  if (existing.some(s => s.name === trimmed)) return `Snapshot "${trimmed}" already exists.`
  return null
}

export const useSnapshotsStore = defineStore('snapshots', () => {
  const snapshots = ref<Snapshot[]>(load('ff_snapshots', []))

  watch(snapshots, v => save('ff_snapshots', v), { deep: true })

  function addSnapshot(name: string, settings: RenderSettings): { ok: boolean; error?: string } {
    const error = validateSnapshotName(name, snapshots.value)
    if (error) return { ok: false, error }
    snapshots.value.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      settings: JSON.parse(JSON.stringify(settings)),
      createdAt: Date.now(),
    })
    return { ok: true }
  }

  function deleteSnapshot(id: string) {
    const idx = snapshots.value.findIndex(s => s.id === id)
    if (idx !== -1) snapshots.value.splice(idx, 1)
  }

  return { snapshots, addSnapshot, deleteSnapshot }
})
