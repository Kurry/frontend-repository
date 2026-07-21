import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { RenderSettings } from './canvas'
import { validatePresetName } from '../utils/recipe'

export interface Preset {
  id: string
  name: string
  settings: RenderSettings
  createdAt: number
}

function safeLS() {
  try { return window.localStorage } catch { return null }
}
function load<T>(key: string, fallback: T): T {
  try { const s = safeLS()?.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { safeLS()?.setItem(key, JSON.stringify(val)) } catch {}
}

export const usePresetsStore = defineStore('presets', () => {
  const presets = ref<Preset[]>(load('ff_presets', []))

  watch(presets, v => save('ff_presets', v), { deep: true })

  function addPreset(name: string, settings: RenderSettings): { ok: boolean; error?: string } {
    const error = validatePresetName(name, presets.value.map(p => p.name))
    if (error) return { ok: false, error }
    presets.value.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      settings: JSON.parse(JSON.stringify(settings)),
      createdAt: Date.now(),
    })
    return { ok: true }
  }

  function deletePreset(id: string) {
    const idx = presets.value.findIndex(p => p.id === id)
    if (idx !== -1) presets.value.splice(idx, 1)
  }

  function getPreset(id: string) {
    return presets.value.find(p => p.id === id)
  }

  return { presets, addPreset, deletePreset, getPreset }
})
