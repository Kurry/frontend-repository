<template>
  <div class="presets-section">
    <h2 class="panel-title">Saved presets</h2>

    <!-- Save new preset -->
    <div class="save-row">
      <label class="field-label" for="preset-name">Preset name</label>
      <input
        id="preset-name"
        v-model="newName"
        class="text-input"
        placeholder="Preset name…"
        @keyup.enter="savePreset"
        maxlength="40"
      />
      <button class="pill-btn" style="width:100%;margin-top:8px;" @click="savePreset" :disabled="!newName.trim()">
        Save current
      </button>
    </div>
    <div v-if="saveError" class="error-msg" role="alert">{{ saveError }}</div>
    <div v-if="saveSuccess" class="success-msg" role="status" aria-live="polite">{{ saveSuccess }}</div>

    <!-- Preset list -->
    <div v-if="presetsStore.presets.length === 0" class="empty-msg">
      No presets yet
    </div>
    <ul v-else class="preset-list">
      <li v-for="preset in presetsStore.presets" :key="preset.id" class="preset-item">
        <span class="preset-name">{{ preset.name }}</span>
        <div class="preset-actions">
          <button class="pill-btn ghost" style="padding:8px 12px;font-size:11px;" @click="applyPreset(preset)">Apply</button>
          <button class="pill-btn danger" style="padding:8px 12px;font-size:11px;" @click="deletePending = preset">Del</button>
        </div>
      </li>
    </ul>

    <div
      v-if="deletePending"
      class="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-preset-title"
      tabindex="-1"
      @keydown.esc="deletePending = null"
    >
      <h3 id="delete-preset-title">Delete preset?</h3>
      <p>This permanently deletes “{{ deletePending.name }}”.</p>
      <div class="confirm-actions">
        <button class="pill-btn ghost" @click="deletePending = null">Cancel</button>
        <button class="pill-btn danger" @click="confirmDelete">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePresetsStore } from '../stores/presets'
import { useCanvasStore } from '../stores/canvas'

const presetsStore = usePresetsStore()
const canvasStore = useCanvasStore()
const newName = ref('')
const saveError = ref('')
const saveSuccess = ref('')
const deletePending = ref<(typeof presetsStore.presets)[0] | null>(null)

let successTimer: ReturnType<typeof setTimeout> | null = null

function savePreset() {
  saveError.value = ''
  saveSuccess.value = ''
  const name = newName.value.trim()
  if (!name) { saveError.value = 'Enter a preset name'; return }
  const result = presetsStore.addPreset(name, canvasStore.getSettings() as Record<string, unknown>)
  if (!result.ok) { saveError.value = result.error ?? 'Error'; return }
  newName.value = ''
  saveSuccess.value = 'Preset saved!'
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { saveSuccess.value = '' }, 2000)
}

function applyPreset(preset: typeof presetsStore.presets[0]) {
  canvasStore.applySettings(preset.settings as Parameters<typeof canvasStore.applySettings>[0])
}

function confirmDelete() {
  if (!deletePending.value) return
  presetsStore.deletePreset(deletePending.value.id)
  deletePending.value = null
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') deletePending.value = null
}

onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))
</script>

<style scoped>
.presets-section {}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  color: #a16207;
  margin-bottom: 12px;
}
.save-row { display: flex; flex-direction: column; gap: 0; }
.empty-msg { font-size: 12px; color: #713F12; text-align: center; padding: 12px 0; }
.preset-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; list-style: none; }
.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffbf0;
  border: 1px solid #f3d89a;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}
.preset-name { font-size: 12px; font-weight: 600; color: #713F12; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preset-actions { display: flex; gap: 4px; flex-shrink: 0; }
.error-msg { color: #ef4444; font-size: 11px; margin-top: 4px; }
.success-msg { color: #22c55e; font-size: 11px; margin-top: 4px; }
.confirm-dialog {
  margin-top: 12px;
  padding: 16px;
  border: 2px solid #92400e;
  border-radius: 12px;
  background: #fff8ee;
}
.confirm-dialog h3 { font-size: 16px; margin-bottom: 8px; }
.confirm-dialog p { font-size: 14px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
