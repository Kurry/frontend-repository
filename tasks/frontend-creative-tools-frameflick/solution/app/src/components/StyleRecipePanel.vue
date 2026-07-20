<template>
  <div class="recipe-panel panel-card">
    <h2 class="panel-title">Style recipe</h2>

    <div class="recipe-actions">
      <button type="button" class="pill-btn recipe-btn" @click="downloadJson">
        <span aria-hidden="true">⬇️</span> Download style JSON
      </button>
      <button type="button" class="pill-btn secondary recipe-btn" @click="copyJson">
        <span aria-hidden="true">{{ copiedStyle ? '✅' : '📋' }}</span> {{ copiedStyle ? 'Copied style!' : 'Copy style JSON' }}
      </button>
      <button type="button" class="pill-btn ghost recipe-btn" @click="openImport">
        <span aria-hidden="true">📥</span> Import style JSON
      </button>
    </div>

    <transition name="fade-slide">
      <div v-if="notice" class="recipe-notice" :class="notice.kind" role="status">{{ notice.text }}</div>
    </transition>

    <label class="preview-label" for="export-preview">Export preview</label>
    <pre
      id="export-preview"
      class="export-preview"
      tabindex="0"
      aria-label="Live style JSON preview (read-only)"
    >{{ recipeText }}</pre>

    <ImportStyleDialog v-if="importOpen" @close="importOpen = false" @imported="onImported" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useHistoryStore } from '../stores/history'
import { useAnnouncer } from '../stores/announcer'
import { recipeJson } from '../utils/recipe'
import ImportStyleDialog from './ImportStyleDialog.vue'

const store = useCanvasStore()
const history = useHistoryStore()
const announcer = useAnnouncer()

const copiedStyle = ref(false)
const importOpen = ref(false)
const notice = ref<{ text: string; kind: 'ok' | 'err' } | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let noticeTimer: ReturnType<typeof setTimeout> | null = null

const recipeText = computed(() => recipeJson(store.getSettings()))

function flashNotice(text: string, kind: 'ok' | 'err') {
  notice.value = { text, kind }
  announcer.announce(text)
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = null }, 3200)
}

function downloadJson() {
  const blob = new Blob([recipeText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'frameflick-style.json'
  link.href = url
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  flashNotice('Style recipe downloaded as frameflick-style.json ✨', 'ok')
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(recipeText.value)
  } catch {
    // Clipboard blocked — fall back to a transient selection copy.
    const ta = document.createElement('textarea')
    ta.value = recipeText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* best effort */ }
    ta.remove()
  }
  copiedStyle.value = true
  announcer.announce('Copied style!')
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copiedStyle.value = false }, 2000)
}

function openImport() {
  importOpen.value = true
}

function onImported(result: { ok: boolean; message: string }) {
  importOpen.value = false
  if (result.ok) {
    flashNotice(result.message, 'ok')
  } else {
    flashNotice(result.message, 'err')
  }
}
</script>

<style scoped>
.recipe-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.recipe-btn {
  min-height: 44px;
  font-size: 12px;
  padding: 8px 12px;
  flex: 1 1 auto;
}
.preview-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 4px;
}
.export-preview {
  background: #fffbeb;
  border: 1px solid #f3d89a;
  border-radius: 8px;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #713F12;
  max-height: 240px;
  overflow: auto;
  white-space: pre;
  margin: 0;
}
.recipe-notice {
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
}
.recipe-notice.ok {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}
.recipe-notice.err {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active { transition: none; }
}
</style>
