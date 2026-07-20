<template>
  <div class="collab-wrap">
    <h2 class="collab-title">Collaboration scenario</h2>
    <p class="collab-desc">
      Co-edit the shared caption with a simulated peer. Go offline to queue changes from both
      authors by stable operation identity, then go online to merge: non-conflicting edits from
      either author converge in any delivery order, and a true conflict asks you to choose
      instead of silently overwriting.
    </p>

    <!-- Connection controls -->
    <div class="conn-bar">
      <button type="button" class="pill-btn conn-btn" :class="{ secondary: isOnline }" @click="toggleOnline">
        <span aria-hidden="true">{{ isOnline ? '🔴' : '🟢' }}</span> {{ isOnline ? 'Go offline' : 'Go online' }}
      </button>
      <span class="conn-status" :class="isOnline ? 'online' : 'offline'" role="status" aria-live="polite">
        {{ isOnline ? 'Online — changes sync immediately' : `Offline — ${pendingOps.length} change(s) queued` }}
      </span>
    </div>

    <!-- Editors -->
    <div class="editors-row">
      <div class="editor-col">
        <label class="editor-label" for="shared-editor">Shared editor (you)</label>
        <textarea
          id="shared-editor"
          class="shared-editor"
          v-model="localText"
          rows="4"
          placeholder="Type your caption here…"
          aria-label="Shared editor"
          @input="onLocalInput"
        />
      </div>
      <div class="editor-col">
        <label class="editor-label" for="peer-editor">Peer editor (simulated)</label>
        <textarea
          id="peer-editor"
          class="shared-editor peer"
          v-model="peerText"
          rows="4"
          placeholder="Peer types here (simulated)…"
          aria-label="Peer editor"
          @input="onPeerInput"
        />
        <button type="button" class="pill-btn ghost peer-btn" @click="simulatePeerEdit">
          <span aria-hidden="true">🤖</span> Simulate peer edit
        </button>
      </div>
    </div>

    <!-- Queue inspection -->
    <div v-if="!isOnline && pendingOps.length > 0" class="queue-box" role="status" aria-live="polite">
      <div class="queue-title">Queued operations ({{ pendingOps.length }})</div>
      <div v-for="op in pendingOps" :key="op.id" class="queue-item">
        <span class="queue-id">{{ op.id }}</span>
        <span class="queue-author">{{ op.author }}</span>: “{{ op.preview }}”
      </div>
    </div>

    <!-- Conflict resolution -->
    <div v-if="conflict" class="conflict-box" role="dialog" aria-labelledby="conflict-title">
      <h3 id="conflict-title" class="conflict-title">⚠️ Merge conflict detected</h3>
      <p class="conflict-desc">
        Both authors changed the same part of the caption while offline. Choose how to resolve it:
      </p>
      <div class="conflict-options">
        <div class="conflict-choice">
          <div class="conflict-label">Keep your version</div>
          <div class="conflict-text">{{ conflict.mine }}</div>
          <button type="button" class="pill-btn conflict-btn" @click="resolveConflict('mine')">Use mine</button>
        </div>
        <div class="conflict-choice">
          <div class="conflict-label">Keep peer version</div>
          <div class="conflict-text">{{ conflict.theirs }}</div>
          <button type="button" class="pill-btn secondary conflict-btn" @click="resolveConflict('theirs')">Use theirs</button>
        </div>
        <div class="conflict-choice">
          <div class="conflict-label">Keep both changes</div>
          <div class="conflict-text">{{ conflict.merged }}</div>
          <button type="button" class="pill-btn ghost conflict-btn" @click="resolveConflict('merged')">Merge</button>
        </div>
      </div>
    </div>

    <!-- Converged result -->
    <div class="result-box" role="status" aria-live="polite">
      <div class="result-label">Shared content</div>
      <div class="result-text" data-testid="shared-content">{{ sharedContent || '—' }}</div>
      <button type="button" class="pill-btn apply-btn" @click="applyToCanvas">
        <span aria-hidden="true">🖼️</span> Apply to canvas
      </button>
    </div>

    <!-- Operation log -->
    <div class="log-box" aria-live="polite">
      <div class="log-title">Operation log</div>
      <div v-if="opLog.length === 0" class="log-empty">No operations yet</div>
      <div v-for="entry in opLogReversed" :key="entry.id" class="log-entry">
        <span class="log-time">{{ entry.time }}</span>
        <span :class="'log-author-' + entry.kind">{{ entry.author }}</span>: {{ entry.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as Y from 'yjs'
import { useCanvasStore } from '../stores/canvas'
import { useAnnouncer } from '../stores/announcer'

const canvasStore = useCanvasStore()
const announcer = useAnnouncer()

// The converged caption lives in a Yjs text; queued offline operations are
// applied to it through Yjs transactions on reconnect.
const doc = new Y.Doc()
const sharedYText = doc.getText('shared')

interface QueuedOp {
  id: string           // stable operation identity — re-delivery is a no-op
  author: 'You' | 'Peer'
  base: string         // shared content when this offline session started
  value: string        // this author's draft at queue time
  preview: string
}

interface ConflictRegion { start: number; end: number; insert: string }
interface ConflictState {
  mine: string
  theirs: string
  merged: string
  resolve: (choice: 'mine' | 'theirs' | 'merged') => void
}

function loadShared(): string {
  try {
    return window.localStorage.getItem('ff_collab_shared') ?? ''
  } catch { return '' }
}
function persistShared(value: string) {
  try { window.localStorage.setItem('ff_collab_shared', value) } catch {}
}

const restored = loadShared()
if (restored) sharedYText.insert(0, restored)

const isOnline = ref(true)
const sharedContent = ref(restored)
const localText = ref(restored)
const peerText = ref(restored)
const pendingOps = ref<QueuedOp[]>([])
const conflict = ref<ConflictState | null>(null)
const opLog = ref<{ id: string; time: string; author: string; kind: string; message: string }[]>([])
const appliedOpIds = new Set<string>()
let opSeq = 0
let offlineBase = restored

const opLogReversed = computed(() => opLog.value.slice().reverse())

function timestamp() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

function addLog(author: string, kind: string, message: string) {
  opLog.value.push({ id: `log-${++opSeq}`, time: timestamp(), author, kind, message })
  if (opLog.value.length > 60) opLog.value = opLog.value.slice(-60)
}

function setShared(value: string) {
  doc.transact(() => {
    sharedYText.delete(0, sharedYText.length)
    sharedYText.insert(0, value)
  })
  sharedContent.value = sharedYText.toString()
  persistShared(sharedContent.value)
}

// ---- diff helpers ----------------------------------------------------------

function diffRegion(base: string, next: string): ConflictRegion {
  let start = 0
  while (start < base.length && start < next.length && base[start] === next[start]) start++
  let endB = base.length
  let endN = next.length
  while (endB > start && endN > start && base[endB - 1] === next[endN - 1]) { endB--; endN-- }
  return { start, end: endB, insert: next.slice(start, endN) }
}

function applyRegion(content: string, region: ConflictRegion): string {
  const start = Math.min(region.start, content.length)
  const end = Math.min(region.end, content.length)
  return content.slice(0, start) + region.insert + content.slice(end)
}

function regionsOverlap(a: ConflictRegion, b: ConflictRegion): boolean {
  // Two different inserts at the exact same spot are genuinely ambiguous
  // (both authors wrote different text in the same place) → conflict.
  const aIsInsert = a.end <= a.start
  const bIsInsert = b.end <= b.start
  if (aIsInsert && bIsInsert) {
    return a.start === b.start && a.insert !== b.insert
  }
  return a.start < b.end && b.start < a.end
}

/**
 * Apply several edit regions to a string in canonical order (position, then
 * text) with index shifting — deterministic regardless of delivery order.
 * Adjacent word inserts get a space so merged text reads naturally.
 */
function applyRegions(content: string, regions: ConflictRegion[]): string {
  const sorted = regions.slice().sort((a, b) => a.start - b.start || a.insert.localeCompare(b.insert))
  let out = content
  let shift = 0
  let prevEnd = -1
  let prevInsert = ''
  for (const r of sorted) {
    let ins = r.insert
    const start = Math.min(r.start + shift, out.length)
    const end = Math.min(r.end + shift, out.length)
    if (prevInsert && ins && start === prevEnd && !/\s$/.test(prevInsert) && !/^\s/.test(ins)) {
      ins = ' ' + ins
    }
    out = out.slice(0, start) + ins + out.slice(end)
    shift += ins.length - (r.end - r.start)
    prevEnd = start + ins.length
    prevInsert = ins
  }
  return out
}

/**
 * Both authors can converge on the exact same edit (same span, same text);
 * `regionsOverlap` correctly treats that as non-conflicting, but applying it
 * twice would duplicate the text. Collapse identical regions into one.
 */
function dedupeRegions(regions: ConflictRegion[]): ConflictRegion[] {
  const out: ConflictRegion[] = []
  for (const r of regions) {
    if (!out.some(o => o.start === r.start && o.end === r.end && o.insert === r.insert)) {
      out.push(r)
    }
  }
  return out
}

// ---- online path -----------------------------------------------------------

function applyAuthorChange(author: 'You' | 'Peer', draft: string) {
  if (draft === sharedContent.value) return
  setShared(draft)
  localText.value = draft
  peerText.value = draft
  addLog(author, author === 'You' ? 'you' : 'peer', `Edited shared caption → “${draft.slice(0, 40)}${draft.length > 40 ? '…' : ''}”`)
}

function onLocalInput() {
  if (isOnline.value) {
    applyAuthorChange('You', localText.value)
  } else {
    queueOp('You', localText.value)
  }
}

function onPeerInput() {
  if (isOnline.value) {
    applyAuthorChange('Peer', peerText.value)
  } else {
    queueOp('Peer', peerText.value)
  }
}

// ---- offline queue ----------------------------------------------------------

function queueOp(author: 'You' | 'Peer', draft: string) {
  // One op per author per offline session: re-queueing updates the same
  // stable identity rather than stacking duplicates.
  const existing = pendingOps.value.find(o => o.author === author)
  if (existing) {
    existing.value = draft
    existing.preview = draft.slice(0, 40)
    addLog(author, author === 'You' ? 'you' : 'peer', `Queued update ${existing.id}: “${existing.preview}”`)
  } else {
    const opId = `${author.toLowerCase()}-${++opSeq}`
    pendingOps.value.push({ id: opId, author, base: offlineBase, value: draft, preview: draft.slice(0, 40) })
    addLog(author, author === 'You' ? 'you' : 'peer', `Queued ${opId}: “${draft.slice(0, 40)}”`)
  }
}

// ---- reconnect merge ---------------------------------------------------------

function reconnect() {
  const ops = pendingOps.value.filter(op => !appliedOpIds.has(op.id))
  let content = sharedContent.value

  const yours = ops.filter(o => o.author === 'You')
  const theirs = ops.filter(o => o.author === 'Peer')

  // Collapse each author's queued ops into one effective edit against the base.
  const effective = (list: QueuedOp[]): { region: ConflictRegion; value: string } | null => {
    if (list.length === 0) return null
    const first = list[0]
    const last = list[list.length - 1]
    return { region: diffRegion(first.base, last.value), value: last.value }
  }
  const mine = effective(yours)
  const their = effective(theirs)

  const finish = (final: string, note: string) => {
    setShared(final)
    localText.value = final
    peerText.value = final
    for (const op of ops) appliedOpIds.add(op.id)
    pendingOps.value = []
    addLog('System', 'system', note)
    announcer.announce(note)
  }

  if (mine && their && regionsOverlap(mine.region, their.region)) {
    // Genuine conflict: surface the explicit choice instead of overwriting.
    const mineOnly = applyRegion(content, mine.region)
    const theirsOnly = applyRegion(content, their.region)
    // Merge keeps both edits, canonically ordered (same result in either
    // delivery order) with a readable join between adjacent inserts.
    const merged = applyRegions(content, [mine.region, their.region])
    conflict.value = {
      mine: mineOnly,
      theirs: theirsOnly,
      merged,
      resolve: choice => {
        const chosen = choice === 'mine' ? mineOnly : choice === 'theirs' ? theirsOnly : merged
        finish(chosen, `Conflict resolved (${choice === 'mine' ? 'use mine' : choice === 'theirs' ? 'use theirs' : 'merged'}): “${chosen.slice(0, 40)}”`)
        conflict.value = null
      },
    }
    for (const op of ops) appliedOpIds.add(op.id)
    pendingOps.value = []
    addLog('System', 'system', 'Conflict detected — choose Use mine, Use theirs, or Merge')
    announcer.announce('Merge conflict detected — choose Use mine, Use theirs, or Merge.')
    return
  }

  // Non-conflicting: apply in canonical order (position, then author) so either
  // delivery order converges to the same content. Re-delivery of an already
  // applied operation identity is a no-op. Identical edits from both authors are
  // collapsed so the same change is applied once, not duplicated.
  const regions = dedupeRegions([
    ...(mine ? [mine.region] : []),
    ...(their ? [their.region] : []),
  ])

  if (regions.length > 0) {
    content = applyRegions(content, regions)
    finish(content, `Converged ${regions.length} queued change(s): “${content.slice(0, 40)}${content.length > 40 ? '…' : ''}”`)
  } else {
    pendingOps.value = []
    addLog('System', 'system', 'No pending changes to apply')
  }
}

function resolveConflict(choice: 'mine' | 'theirs' | 'merged') {
  conflict.value?.resolve(choice)
}

function toggleOnline() {
  isOnline.value = !isOnline.value
  if (isOnline.value) {
    addLog('System', 'system', `Going online — delivering ${pendingOps.value.length} queued operation(s)`)
    reconnect()
  } else {
    offlineBase = sharedContent.value
    conflict.value = null
    addLog('System', 'system', 'Went offline — edits will be queued by stable operation identity')
    announcer.announce('Offline — edits will be queued.')
  }
}

const peerPhrases = [
  'Shot on FrameFlick ✨',
  'Shipping this look today',
  'Made with one click',
  'Design, dressed up',
  'From screenshot to shareable',
]
let peerPhraseIdx = 0

function simulatePeerEdit() {
  const phrase = peerPhrases[peerPhraseIdx % peerPhrases.length]
  peerPhraseIdx++
  peerText.value = phrase
  onPeerInput()
}

function applyToCanvas() {
  canvasStore.captionText = sharedContent.value
  canvasStore.showingBefore = false
  addLog('System', 'system', 'Applied shared content to the canvas caption')
  announcer.announce('Shared content applied to the canvas caption.')
}
</script>

<style scoped>
.collab-wrap {
  max-width: 840px;
}
.collab-title {
  font-size: 16px;
  font-weight: 800;
  color: #713F12;
  margin-bottom: 8px;
}
.collab-desc {
  max-width: 68ch;
  font-size: 14px;
  color: #92400e;
  margin-bottom: 24px;
  line-height: 1.5;
}
.conn-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff8ee;
  border: 1px solid #f3d89a;
  border-radius: 8px;
}
.conn-btn { min-height: 48px; }
.conn-status { font-size: 13px; font-weight: 700; }
.conn-status.online { color: #166534; }
.conn-status.offline { color: #b91c1c; }

.editors-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.editor-col { display: flex; flex-direction: column; }
.editor-label {
  font-size: 12px;
  font-weight: 700;
  color: #713F12;
  margin-bottom: 8px;
}
.shared-editor {
  width: 100%;
  padding: 12px;
  border: 2px solid #92400e;
  border-radius: 8px;
  font-size: 14px;
  color: #713F12;
  background: #fffbf0;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.shared-editor:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
.shared-editor.peer { border-color: #93c5fd; background: #eff6ff; }
.peer-btn { margin-top: 8px; align-self: flex-start; }

.queue-box {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.queue-title { font-size: 12px; font-weight: 800; color: #92400e; margin-bottom: 8px; }
.queue-item { font-size: 12px; color: #713F12; padding: 4px 0; border-bottom: 1px solid #fde68a; }
.queue-item:last-child { border-bottom: none; }
.queue-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  background: #fde68a;
  border-radius: 4px;
  padding: 2px 6px;
  margin-right: 8px;
}
.queue-author { font-weight: 700; }

.conflict-box {
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}
.conflict-title { font-size: 16px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; }
.conflict-desc { font-size: 13px; color: #713F12; margin-bottom: 12px; line-height: 1.4; }
.conflict-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.conflict-choice { display: flex; flex-direction: column; gap: 8px; }
.conflict-label { font-size: 12px; font-weight: 800; color: #92400e; }
.conflict-text {
  font-size: 12px;
  color: #713F12;
  background: #fff;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 8px;
  min-height: 40px;
  word-break: break-word;
  flex: 1;
}
.conflict-btn { min-height: 44px; }

.result-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}
.result-label { font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 8px; }
.result-text {
  font-size: 16px;
  font-weight: 600;
  color: #14532d;
  min-height: 24px;
  word-break: break-word;
  margin-bottom: 12px;
}

.log-box {
  background: #fff8ee;
  border: 1px solid #f3d89a;
  border-radius: 8px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}
.log-title { font-size: 12px; font-weight: 800; color: #713F12; margin-bottom: 8px; }
.log-empty { font-size: 12px; color: #92400e; }
.log-entry { font-size: 12px; color: #713F12; padding: 4px 0; line-height: 1.4; }
.log-time {
  color: #92400e;
  margin-right: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}
.log-author-you { font-weight: 700; color: #713F12; }
.log-author-peer { font-weight: 700; color: #1d4ed8; }
.log-author-system { font-weight: 700; color: #166534; }

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
