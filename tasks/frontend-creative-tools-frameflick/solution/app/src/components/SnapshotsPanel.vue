<template>
  <div class="snapshots-section panel-card">
    <h2 class="panel-title">Snapshots <span class="count-badge" data-testid="snapshot-count">{{ snapshotsStore.snapshots.length }}</span></h2>

    <div class="save-row">
      <label class="field-label" for="snapshot-name">Snapshot name</label>
      <input
        id="snapshot-name"
        v-model="newName"
        class="text-input"
        :class="{ invalid: nameError }"
        placeholder="Snapshot name…"
        maxlength="60"
        :aria-invalid="Boolean(nameError)"
        aria-describedby="snapshot-name-msg"
        @keyup.enter="saveSnapshot"
      />
      <div
        id="snapshot-name-msg"
        class="name-msg"
        :class="nameError ? 'error-msg' : 'hint-msg'"
        role="alert"
        aria-live="polite"
      >{{ nameError ?? 'Snapshots capture the full live style.' }}</div>
      <button
        type="button"
        class="pill-btn save-btn"
        :disabled="Boolean(nameError) || saving"
        @click="saveSnapshot"
      >Save snapshot</button>
    </div>
    <transition name="fade-slide">
      <div v-if="saveSuccess" class="success-msg" role="status">{{ saveSuccess }}</div>
    </transition>

    <div v-if="snapshotsStore.snapshots.length === 0" class="empty-msg">
      No snapshots yet — capture this exact look to return to it later.
    </div>
    <TransitionGroup v-else tag="ul" class="snapshot-list" name="list">
      <li v-for="snapshot in snapshotsStore.snapshots" :key="snapshot.id" class="snapshot-item">
        <span class="snapshot-name" :title="snapshot.name">{{ snapshot.name }}</span>
        <div class="snapshot-actions">
          <button type="button" class="pill-btn ghost mini-btn" @click="applySnapshot(snapshot)">Apply</button>
          <button type="button" class="pill-btn danger mini-btn" @click="deletePending = snapshot">Del</button>
        </div>
      </li>
    </TransitionGroup>

    <ConfirmDialog
      v-if="deletePending"
      label-id="delete-snapshot-title"
      title="Delete snapshot?"
      :body="`This permanently deletes “${deletePending.name}”. This action cannot be undone.`"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="deletePending = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSnapshotsStore, validateSnapshotName } from '../stores/snapshots'
import type { Snapshot } from '../stores/snapshots'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'
import ConfirmDialog from './ConfirmDialog.vue'

const snapshotsStore = useSnapshotsStore()
const canvasStore = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

const newName = ref('')
const saveSuccess = ref('')
const saving = ref(false)
const deletePending = ref<Snapshot | null>(null)

let successTimer: ReturnType<typeof setTimeout> | null = null

const nameError = computed(() =>
  validateSnapshotName(newName.value, snapshotsStore.snapshots)
)

watch(nameError, err => {
  if (err) announcer.announce(err)
})

function saveSnapshot() {
  if (saving.value) return
  const err = nameError.value
  if (err) {
    announcer.announce(err)
    return
  }
  saving.value = true
  const savedName = newName.value.trim()
  const result = snapshotsStore.addSnapshot(newName.value, canvasStore.getSettings())
  saving.value = false
  if (!result.ok) {
    announcer.announce(result.error ?? 'Could not save the snapshot.')
    return
  }
  newName.value = ''
  saveSuccess.value = `Snapshot “${savedName}” saved.`
  announcer.announce(`Snapshot “${savedName}” saved.`)
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { saveSuccess.value = '' }, 2200)
}

function applySnapshot(snapshot: Snapshot) {
  history.markDiscrete()
  canvasStore.applySettings(snapshot.settings)
  canvasStore.showingBefore = false
  announcer.announce(`Snapshot “${snapshot.name}” applied.`)
}

function confirmDelete() {
  if (!deletePending.value) return
  const name = deletePending.value.name
  snapshotsStore.deleteSnapshot(deletePending.value.id)
  deletePending.value = null
  announcer.announce(`Snapshot “${name}” deleted.`)
}
</script>

<style scoped>
.save-row { display: flex; flex-direction: column; gap: 4px; }
.save-btn { width: 100%; margin-top: 8px; }
.name-msg { font-size: 11px; margin-top: 4px; }
.hint-msg { color: #92400e; }
.text-input.invalid { border-color: #ef4444; }
.empty-msg { font-size: 12px; color: #713F12; text-align: center; padding: 12px 0; }
.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  list-style: none;
  padding: 0;
}
.snapshot-item {
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
.snapshot-item:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(113, 63, 18, 0.12); }
.snapshot-name {
  font-size: 12px;
  font-weight: 700;
  color: #713F12;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.snapshot-actions { display: flex; gap: 4px; flex-shrink: 0; }
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

.list-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.list-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.list-enter-from { opacity: 0; transform: translateY(-8px) scale(0.97); }
.list-leave-to { opacity: 0; transform: translateX(24px); }
.list-move { transition: transform 0.22s ease; }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }
@media (prefers-reduced-motion: reduce) {
  .list-enter-active,
  .list-leave-active,
  .list-move,
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .snapshot-item { transition: none; }
  .list-enter-from,
  .list-leave-to { opacity: 1; transform: none; }
  .snapshot-item:hover { transform: none; }
}
</style>
