<template>
  <div class="collab-wrap">
    <h2 class="collab-title">Collaboration scenario</h2>
    <p class="collab-desc">
      Simulate two users editing a shared caption offline and merging their changes.
      Changes are tracked by Yjs CRDT — both authors' edits converge without data loss.
    </p>

    <!-- Connection controls -->
    <div class="conn-bar">
      <button class="pill-btn" :class="{ secondary: isOnline }" @click="toggleOnline">
        {{ isOnline ? '🔴 Go offline' : '🟢 Go online' }}
      </button>
      <span class="conn-status" :class="isOnline ? 'online' : 'offline'" role="status" aria-live="polite">
        {{ isOnline ? 'Online — changes sync immediately' : 'Offline — changes queued locally' }}
      </span>
    </div>

    <!-- Shared editor -->
    <div class="editors-row">
      <div class="editor-col">
        <label class="editor-label" for="shared-editor">Shared editor (you)</label>
        <textarea
          id="shared-editor"
          class="shared-editor"
          v-model="localText"
          @input="onLocalInput"
          placeholder="Type your caption here…"
          rows="4"
          aria-label="Shared editor"
        />
      </div>
      <div class="editor-col">
        <label class="editor-label" for="peer-editor">Peer editor (simulated)</label>
        <textarea
          id="peer-editor"
          class="shared-editor peer"
          v-model="peerText"
          @input="onPeerInput"
          placeholder="Peer types here (simulated)…"
          rows="4"
          aria-label="Peer editor"
        />
        <button class="pill-btn ghost" style="margin-top:8px;font-size:12px;" @click="simulatePeerEdit">
          Simulate peer edit
        </button>
      </div>
    </div>

    <!-- Queue inspection -->
    <div v-if="!isOnline && pendingOps.length > 0" class="queue-box" role="status" aria-live="polite">
      <div class="queue-title">Queued operations ({{ pendingOps.length }})</div>
      <div v-for="op in pendingOps" :key="op.id" class="queue-item">
        <span class="queue-author">{{ op.author }}</span>: "{{ op.preview }}"
      </div>
    </div>

    <!-- Conflict UI -->
    <div v-if="conflict" class="conflict-box">
      <div class="conflict-title">⚠ Merge conflict detected</div>
      <div class="conflict-options">
        <div class="conflict-choice">
          <div class="conflict-label">Keep your version:</div>
          <div class="conflict-text">{{ conflict.local }}</div>
          <button class="pill-btn" @click="resolveConflict('local')">Use mine</button>
        </div>
        <div class="conflict-choice">
          <div class="conflict-label">Keep peer version:</div>
          <div class="conflict-text">{{ conflict.peer }}</div>
          <button class="pill-btn secondary" @click="resolveConflict('peer')">Use theirs</button>
        </div>
        <div class="conflict-choice">
          <div class="conflict-label">Merge both:</div>
          <div class="conflict-text">{{ conflict.merged }}</div>
          <button class="pill-btn ghost" @click="resolveConflict('merged')">Merge</button>
        </div>
      </div>
    </div>

    <!-- Converged result -->
    <div class="result-box" role="status" aria-live="polite">
      <div class="result-label">Shared content</div>
      <div class="result-text">{{ sharedContent }}</div>
      <button class="pill-btn" style="margin-top:12px;" @click="applyToCanvas">Apply to canvas</button>
    </div>

    <!-- Operation log -->
    <div class="log-box" aria-live="polite">
      <div class="log-title">Operation log</div>
      <div v-if="opLog.length === 0" class="log-empty">No operations yet</div>
      <div v-for="entry in opLog.slice().reverse()" :key="entry.id" class="log-entry">
        <span class="log-time">{{ entry.time }}</span>
        <span :class="'log-author-' + entry.author.toLowerCase().split(' ')[0]">{{ entry.author }}</span>:
        {{ entry.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as Y from 'yjs'
import { useCanvasStore } from '../stores/canvas'

const canvasStore = useCanvasStore()

// Yjs documents for two simulated peers
const localDoc = new Y.Doc()
const peerDoc = new Y.Doc()

const localYText = localDoc.getText('caption')
const peerYText = peerDoc.getText('caption')

function loadCollabState() {
  try {
    const saved = window.localStorage.getItem('ff_collab_state')
    if (saved) return JSON.parse(saved) as { localText: string; peerText: string; sharedContent: string }
  } catch {}
  return { localText: '', peerText: '', sharedContent: '' }
}

const savedState = loadCollabState()
const restoredText = savedState.sharedContent || savedState.localText || savedState.peerText
if (restoredText) {
  localYText.insert(0, restoredText)
  peerYText.insert(0, restoredText)
}

const isOnline = ref(true)
const localText = ref(restoredText)
const peerText = ref(restoredText)
const pendingOps = ref<{ id: string; author: string; update: Uint8Array; preview: string }[]>([])
const opLog = ref<{ id: string; time: string; author: string; message: string }[]>([])
const conflict = ref<{ local: string; peer: string; merged: string } | null>(null)

const sharedContent = ref(restoredText)
let offlineBase = restoredText

watch([localText, peerText, sharedContent], () => {
  try {
    window.localStorage.setItem('ff_collab_state', JSON.stringify({
      localText: localText.value,
      peerText: peerText.value,
      sharedContent: sharedContent.value,
    }))
  } catch {}
})

function timestamp() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
}

function addLog(author: string, message: string) {
  opLog.value.push({ id: crypto.randomUUID(), time: timestamp(), author, message })
  if (opLog.value.length > 50) opLog.value = opLog.value.slice(-50)
}

function syncPeerToLocal() {
  const update = Y.encodeStateAsUpdate(peerDoc)
  Y.applyUpdate(localDoc, update)
}
function syncLocalToPeer() {
  const update = Y.encodeStateAsUpdate(localDoc)
  Y.applyUpdate(peerDoc, update)
}

function replaceText(target: Y.Text, value: string) {
  target.delete(0, target.length)
  target.insert(0, value)
}

function reconnectQueuedChanges() {
  const localVal = localText.value
  const peerVal = peerText.value

  if (localVal && peerVal && localVal === peerVal) {
    conflict.value = {
      local: localVal,
      peer: peerVal,
      merged: localVal,
    }
    addLog('System', 'Conflict detected — user resolution required')
    return
  }

  const mergeBase = offlineBase && (localVal.startsWith(offlineBase) || peerVal.startsWith(offlineBase))
    ? offlineBase
    : ''
  const localDelta = mergeBase && localVal.startsWith(mergeBase)
    ? localVal.slice(mergeBase.length)
    : localVal
  const peerDelta = mergeBase && peerVal.startsWith(mergeBase)
    ? peerVal.slice(mergeBase.length)
    : peerVal
  const merged = mergeBase
    ? mergeBase + localDelta + peerDelta
    : localDelta + peerDelta

  localDoc.transact(() => replaceText(localYText, merged))
  peerDoc.transact(() => replaceText(peerYText, merged))
  localText.value = merged
  peerText.value = merged
  sharedContent.value = merged
  conflict.value = null
  addLog('System', `Converged: "${merged.slice(0,40)}"`)
}

function mergeAndResolve() {
  const localVal = localYText.toString()
  const peerVal = peerYText.toString()

  if (localVal === peerVal) {
    sharedContent.value = localVal
    conflict.value = null
    addLog('System', `Converged: "${localVal.slice(0,40)}"`)
    return
  }

  // Check for non-trivial conflict (both changed from a common base)
  if (localVal && peerVal && localVal !== peerVal) {
    const merged = localVal + ' | ' + peerVal
    conflict.value = { local: localVal, peer: peerVal, merged }
    addLog('System', 'Conflict detected — user resolution required')
    return
  }

  // One side is empty or they match
  sharedContent.value = localVal || peerVal
  conflict.value = null
}

function resolveConflict(choice: 'local' | 'peer' | 'merged') {
  if (!conflict.value) return
  const chosen = conflict.value[choice]

  // Apply chosen value to both docs
  localDoc.transact(() => { localYText.delete(0, localYText.length); localYText.insert(0, chosen) })
  peerDoc.transact(() => { peerYText.delete(0, peerYText.length); peerYText.insert(0, chosen) })

  localText.value = chosen
  peerText.value = chosen
  sharedContent.value = chosen
  conflict.value = null
  addLog('System', `Conflict resolved (${choice}): "${chosen.slice(0,40)}"`)
}

function onLocalInput() {
  const val = localText.value
  localDoc.transact(() => {
    localYText.delete(0, localYText.length)
    localYText.insert(0, val)
  })

  if (isOnline.value) {
    syncLocalToPeer()
    peerText.value = peerYText.toString()
    mergeAndResolve()
    addLog('You', `Typed: "${val.slice(0,30)}"`)
  } else {
    const update = Y.encodeStateAsUpdate(localDoc)
    pendingOps.value.push({
      id: crypto.randomUUID(),
      author: 'You',
      update,
      preview: val.slice(0, 30),
    })
    addLog('You (offline)', `Queued: "${val.slice(0,30)}"`)
  }
}

function onPeerInput() {
  const val = peerText.value
  peerDoc.transact(() => {
    peerYText.delete(0, peerYText.length)
    peerYText.insert(0, val)
  })

  if (isOnline.value) {
    syncPeerToLocal()
    localText.value = localYText.toString()
    mergeAndResolve()
    addLog('Peer', `Typed: "${val.slice(0,30)}"`)
  } else {
    const update = Y.encodeStateAsUpdate(peerDoc)
    pendingOps.value.push({
      id: crypto.randomUUID(),
      author: 'Peer',
      update,
      preview: val.slice(0, 30),
    })
    addLog('Peer (offline)', `Queued: "${val.slice(0,30)}"`)
  }
}

const peerPhrases = [
  'Check out this feature!',
  'Amazing screenshot 🚀',
  'Built with FrameFlick',
  'Design made simple',
  'Share your creations',
]
let peerPhraseIdx = 0

function simulatePeerEdit() {
  const phrase = peerPhrases[peerPhraseIdx % peerPhrases.length]
  peerPhraseIdx++
  peerText.value = phrase
  onPeerInput()
}

function toggleOnline() {
  isOnline.value = !isOnline.value
  if (isOnline.value) {
    addLog('System', `Going online — applying ${pendingOps.value.length} queued op(s)`)
    pendingOps.value = []
    reconnectQueuedChanges()
    addLog('System', 'Sync complete')
  } else {
    offlineBase = sharedContent.value || localText.value || peerText.value
    addLog('System', 'Went offline — changes will be queued')
  }
}

function applyToCanvas() {
  canvasStore.captionText = sharedContent.value
  addLog('System', 'Applied to canvas')
}
</script>

<style scoped>
.collab-wrap {
  max-width: 820px;
}
.collab-title { font-size: 16px; font-weight: 800; color: #713F12; margin-bottom: 8px; }
.collab-desc { max-width: 68ch; font-size: 14px; color: #92400e; margin-bottom: 24px; line-height: 1.5; }

.conn-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff8ee;
  border: 1.5px solid #f3d89a;
  border-radius: 12px;
}
.conn-status { font-size: 13px; font-weight: 600; }
.conn-status.online { color: #16a34a; }
.conn-status.offline { color: #dc2626; }

.editors-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.editor-col { display: flex; flex-direction: column; }
.editor-label { font-size: 12px; font-weight: 700; letter-spacing: 0; color: #713F12; margin-bottom: 8px; }
.shared-editor {
  width: 100%;
  padding: 12px;
  border: 2px solid #92400e;
  border-radius: 10px;
  font-size: 14px;
  color: #713F12;
  background: #fffbf0;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s;
}
.shared-editor:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.28); }
.shared-editor.peer { border-color: #bfdbfe; background: #eff6ff; }
.shared-editor.peer:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,0.2); }

.queue-box {
  background: #fef3c7;
  border: 1.5px solid #fcd34d;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.queue-title { font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 8px; }
.queue-item { font-size: 12px; color: #713F12; padding: 4px 0; border-bottom: 1px solid #fde68a; }
.queue-item:last-child { border-bottom: none; }
.queue-author { font-weight: 700; }

.conflict-box {
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.conflict-title { font-size: 14px; font-weight: 800; color: #dc2626; margin-bottom: 12px; }
.conflict-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.conflict-choice { display: flex; flex-direction: column; gap: 8px; }
.conflict-label { font-size: 12px; font-weight: 700; color: #92400e; letter-spacing: 0; }
.conflict-text { font-size: 12px; color: #713F12; background: #fff; border: 1px solid #fca5a5; border-radius: 8px; padding: 8px; min-height: 36px; }

.result-box {
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.result-label { font-size: 12px; font-weight: 700; letter-spacing: 0; color: #166534; margin-bottom: 8px; }
.result-text { font-size: 16px; font-weight: 600; color: #14532d; min-height: 24px; word-break: break-word; }

.log-box {
  background: #fff8ee;
  border: 1.5px solid #f3d89a;
  border-radius: 12px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}
.log-title { font-size: 12px; font-weight: 700; letter-spacing: 0; color: #713F12; margin-bottom: 8px; }
.log-empty { font-size: 12px; color: #713F12; }
.log-entry { font-size: 12px; color: #713F12; padding: 3px 0; }
.log-time { color: #713F12; margin-right: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.log-author-you { font-weight: 700; color: #713F12; }
.log-author-peer { font-weight: 700; color: #3b82f6; }
.log-author-system { font-weight: 700; color: #16a34a; }

@media (max-width: 600px) {
  .editors-row,
  .conflict-options {
    grid-template-columns: 1fr;
  }
  .conn-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
