<template>
  <div class="presets-section panel-card">
    <h2 class="panel-title">Saved presets <span class="count-badge" data-testid="preset-count">{{ presetsStore.presets.length }}</span></h2>

    <!-- Save new preset -->
    <div class="save-row">
      <label class="field-label" for="preset-name">Preset name</label>
      <input
        id="preset-name"
        v-model="newName"
        class="text-input"
        :class="{ invalid: nameError }"
        placeholder="Preset name…"
        maxlength="60"
        :aria-invalid="Boolean(nameError)"
        aria-describedby="preset-name-msg"
        @keyup.enter="savePreset"
      />
      <div
        id="preset-name-msg"
        class="name-msg"
        :class="nameError ? 'error-msg' : 'hint-msg'"
        role="alert"
        aria-live="polite"
      >{{ nameError ?? 'Up to 40 characters; names are unique.' }}</div>
      <button
        type="button"
        class="pill-btn save-btn"
        :disabled="Boolean(nameError) || saving"
        @click="savePreset"
      >Save preset</button>
    </div>
    <transition name="fade-slide">
      <div v-if="saveError" class="error-msg fade-in" role="alert">{{ saveError }}</div>
    </transition>
    <transition name="fade-slide">
      <div v-if="saveSuccess" class="success-msg" role="status">{{ saveSuccess }}</div>
    </transition>

    <!-- Preset list -->
    <div v-if="presetsStore.presets.length === 0" class="empty-msg">
      No presets yet — dial in a look and save it here.
    </div>
    <TransitionGroup v-else tag="ul" class="preset-list" name="list">
      <li v-for="preset in presetsStore.presets" :key="preset.id" class="preset-item">
        <span class="preset-name" :title="preset.name">{{ preset.name }}</span>
        <div class="preset-actions">
          <button type="button" class="pill-btn ghost mini-btn" @click="applyPreset(preset)">Apply</button>
          <button type="button" class="pill-btn danger mini-btn" @click="openDelete(preset)">Del</button>
        </div>
      </li>
    </TransitionGroup>

    <ConfirmDialog
      v-if="deletePending"
      label-id="delete-preset-title"
      title="Delete preset?"
      :body="`This permanently deletes “${deletePending.name}”. This action cannot be undone.`"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="deletePending = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePresetsStore } from '../stores/presets'
import type { Preset } from '../stores/presets'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'
import { validatePresetName } from '../utils/recipe'
import ConfirmDialog from './ConfirmDialog.vue'

const presetsStore = usePresetsStore()
const canvasStore = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

const newName = ref('')
const saveError = ref('')
const saveSuccess = ref('')
const saving = ref(false)
const deletePending = ref<Preset | null>(null)

let successTimer: ReturnType<typeof setTimeout> | null = null

// Proactive inline validation: the message names the name field before any
// submit attempt, and Save preset stays disabled until the name is valid.
const nameError = computed(() =>
  validatePresetName(newName.value, presetsStore.presets.map(p => p.name))
)

watch(nameError, err => {
  if (err) announcer.announce(err)
})

function savePreset() {
  if (saving.value) return
  saveError.value = ''
  const err = nameError.value
  if (err) {
    saveError.value = err
    announcer.announce(err)
    return
  }
  saving.value = true // double-activation guard: exactly one record per save
  const savedName = newName.value.trim()
  const result = presetsStore.addPreset(newName.value, canvasStore.getSettings())
  saving.value = false
  if (!result.ok) {
    saveError.value = result.error ?? 'Could not save the preset.'
    announcer.announce(saveError.value)
    return
  }
  newName.value = ''
  saveSuccess.value = `Preset “${savedName}” saved.`
  announcer.announce(`Preset “${savedName}” saved.`)
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { saveSuccess.value = '' }, 2200)
}

function applyPreset(preset: Preset) {
  history.markDiscrete()
  canvasStore.applySettings(preset.settings)
  canvasStore.showingBefore = false
  announcer.announce(`Preset “${preset.name}” applied.`)
}

function openDelete(preset: Preset) {
  deletePending.value = preset
}

function confirmDelete() {
  if (!deletePending.value) return
  const name = deletePending.value.name
  presetsStore.deletePreset(deletePending.value.id)
  deletePending.value = null
  announcer.announce(`Preset “${name}” deleted.`)
}
</script>

<style scoped>
.save-row { display: flex; flex-direction: column; gap: 4px; }
.save-btn { width: 100%; margin-top: 8px; }
.name-msg { font-size: 11px; margin-top: 4px; }
.hint-msg { color: #92400e; }
.text-input.invalid { border-color: #ef4444; }
.empty-msg { font-size: 12px; color: #713F12; text-align: center; padding: 12px 0; }
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  list-style: none;
  padding: 0;
}
.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffbf0;
  border: 1px solid #f3d89a;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.preset-item:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(113, 63, 18, 0.12); }
.preset-name {
  font-size: 12px;
  font-weight: 700;
  color: #713F12;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preset-actions { display: flex; gap: 4px; flex-shrink: 0; }
.mini-btn { min-height: 44px; padding: 8px 12px; font-size: 11px; }
.count-badge {
  display: inline-block;
  min-width: 24px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #FDE047;
  color: #713F12;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

/* List enter / exit animation */
.list-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.list-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.list-enter-from { opacity: 0; transform: translateY(-8px) scale(0.97); }
.list-leave-to { opacity: 0; transform: translateX(24px); }
.list-move { transition: transform 0.22s ease; }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-in { animation: feedback-in 0.2s ease-out; }
@keyframes feedback-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .list-enter-active,
  .list-leave-active,
  .list-move,
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .preset-item { transition: none; }
  .list-enter-from,
  .list-leave-to { opacity: 1; transform: none; }
  .fade-in { animation: none; }
  .preset-item:hover { transform: none; }
}
</style>
