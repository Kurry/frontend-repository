<template>
  <section id="collab-section" class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-2">Collaboration scenario</h2>
    <p class="copy m-0 mb-4">
      Queue changes while offline, reconnect and merge them with your peer's edits. Conflicting edits ask you to choose a version.
    </p>

    <!-- Connection status and controls -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <button class="btn" :disabled="collab.offline" @click="store.goOffline()">Go Offline</button>
      <button class="btn" :disabled="!collab.offline" @click="store.goOnline()">Go Online</button>
      <p class="m-0 flex items-center gap-2" aria-live="polite" style="font-size: 15px;">
        <span
          aria-hidden="true"
          :style="{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '5px',
            backgroundColor: collab.offline ? '#ff9d9d' : 'var(--color-primary)',
          }"
        ></span>
        <span :style="{ color: collab.offline ? '#ff9d9d' : 'var(--color-primary)' }">
          {{ collab.offline ? 'Offline — your changes queue locally' : 'Online — changes sync now' }}
        </span>
      </p>
    </div>

    <div v-if="collab.offline" class="caption num mb-4" style="font-size: 14px;">
      <p class="m-0">Queued changes {{ collab.queued.length }} · Peer changes waiting {{ collab.peerPending.length }}</p>
      <ul v-if="collab.queued.length > 0" class="m-0 mt-1 p-0" style="list-style: none;">
        <li v-for="op in collab.queued" :key="op.opId" style="font-size: 13px;">
          Queued {{ op.kind === 'add' ? 'note' : 'edit' }} — {{ op.text }}
        </li>
      </ul>
    </div>

    <!-- Shared editor -->
    <div class="flex flex-wrap items-end gap-3 mb-3">
      <div class="flex flex-col gap-1 grow" style="min-width: 200px; max-width: 460px;">
        <label :for="editorId" class="caption" style="font-size: 14px;">Shared editor</label>
        <input
          :id="editorId"
          v-model="draft"
          type="text"
          class="field"
          :aria-describedby="editorHintId"
          @keydown.enter.prevent="submitDraft"
        />
        <p :id="editorHintId" class="caption m-0" style="font-size: 12px;">
          {{ editingId ? 'Update the note text, then select Save note' : 'Write a short note, then select Add note' }}
        </p>
      </div>
      <button class="btn" @click="submitDraft">{{ editingId ? 'Save note' : 'Add note' }}</button>
      <button v-if="editingId" class="btn" @click="cancelEdit">Cancel edit</button>
    </div>

    <!-- Peer simulation -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <button class="btn btn-sm" @click="store.peerAddNote()">Add peer note</button>
      <button class="btn btn-sm" @click="onPeerEdit">Simulate peer edit</button>
      <span class="caption" style="font-size: 13px;">Peer actions stand in for a second collaborator</span>
    </div>
    <p v-if="peerNotice" role="status" class="m-0 mb-3" style="color: #ff9d9d; font-size: 14px;">{{ peerNotice }}</p>

    <!-- Delivery order chooser -->
    <div v-if="collab.pendingDelivery" class="rounded-[5px] p-4 mb-4" style="border: 1px solid var(--color-primary); background-color: #16283f;">
      <p class="m-0 font-semibold" style="font-size: 16px;">Reconnected — deliver queued changes</p>
      <p class="caption m-0 mt-1 mb-3" style="font-size: 14px;">Select an order — both orders merge to the same shared content</p>
      <div class="flex flex-wrap gap-2">
        <button class="btn" @click="store.deliver('mine')">Apply mine first</button>
        <button class="btn" @click="store.deliver('peer')">Apply peer first</button>
      </div>
    </div>

    <!-- Conflict resolution -->
    <div v-if="collab.conflict" class="rounded-[5px] p-4 mb-4" style="border: 1px solid #ff9d9d; background-color: #2a1620;">
      <p class="m-0 font-semibold" style="color: #ff9d9d; font-size: 16px;">Conflicting edits on one note</p>
      <p class="caption m-0 mt-1 mb-2" style="font-size: 14px;">Both sides changed the same note while apart — choose the version to keep</p>
      <p class="m-0" style="font-size: 14px;">Your version: “{{ collab.conflict.mine.text }}”</p>
      <p class="m-0 mb-3" style="font-size: 14px;">Peer version: “{{ collab.conflict.theirs.text }}”</p>
      <div class="flex flex-wrap gap-2">
        <button class="btn" @click="store.resolveConflict('mine')">Keep my version</button>
        <button class="btn" @click="store.resolveConflict('theirs')">Keep peer version</button>
      </div>
    </div>

    <!-- Shared content -->
    <div role="region" :aria-labelledby="contentId">
      <h3 :id="contentId" class="font-semibold mb-2" style="font-size: 18px;">Shared content</h3>
      <p v-if="displayNotes.length === 0" class="caption m-0" style="font-size: 15px;">No shared notes yet</p>
      <ul v-else class="m-0 p-0 flex flex-col gap-2" style="list-style: none;">
        <li
          v-for="note in displayNotes"
          :key="note.id"
          class="flex items-center gap-3 rounded-[5px] px-3 py-2"
          :style="{
            backgroundColor: note.queued ? '#16283f' : '#122540',
            border: note.queued ? '1px dashed var(--color-accent)' : '1px solid #3d4c63',
          }"
        >
          <span class="grow" style="font-size: 15px;">{{ note.text }}</span>
          <span
            v-if="note.queued"
            class="num"
            style="font-size: 12px; fontWeight: 600; border-radius: 5px; padding: 0 8px; line-height: 22px; color: #10141c; background-color: var(--color-accent);"
          >Queued</span>
          <span
            class="num"
            :style="{
              fontSize: '12px', fontWeight: 600, borderRadius: '5px', padding: '0 8px', lineHeight: '22px',
              color: '#10141c',
              backgroundColor: note.author === 'You' ? 'var(--color-primary)' : 'var(--color-accent)',
            }"
          >{{ note.author }}</span>
          <button v-if="!note.queued" class="btn btn-sm" @click="startEdit(note.id)">Edit</button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { collab } = storeToRefs(store)

// Applied notes plus offline-queued additions shown as pending entries so the
// queued state is visible (and Shared content is never mysteriously empty while
// offline). Queued edits to an existing note appear in the queue list above.
const displayNotes = computed(() => {
  const queuedAdds = collab.value.queued
    .filter(op => op.kind === 'add')
    .map(op => ({ id: op.noteId, seq: op.noteSeq, text: op.text, author: 'You' as const, queued: true }))
  const applied = collab.value.notes.map(n => ({ id: n.id, seq: n.seq, text: n.text, author: n.author, queued: false }))
  return [...applied, ...queuedAdds]
    .filter(n => !applied.some(a => a.id === n.id && n.queued))
    .sort((a, b) => a.seq - b.seq)
})

const headingId = useId()
const editorId = useId()
const editorHintId = useId()
const contentId = useId()

const draft = ref('')
const editingId = ref<string | null>(null)
const peerNotice = ref('')

function submitDraft() {
  if (editingId.value) {
    if (store.editNote(editingId.value, draft.value)) {
      draft.value = ''
      editingId.value = null
    }
  } else if (store.addNote(draft.value)) {
    draft.value = ''
  }
}

function startEdit(noteId: string) {
  const note = collab.value.notes.find(n => n.id === noteId)
  if (!note) return
  editingId.value = noteId
  draft.value = note.text
  peerNotice.value = ''
}

function cancelEdit() {
  editingId.value = null
  draft.value = ''
}

function onPeerEdit() {
  const ok = store.peerEditLatest()
  peerNotice.value = ok ? '' : 'No note exists yet — add a note before simulating a peer edit'
}
</script>
