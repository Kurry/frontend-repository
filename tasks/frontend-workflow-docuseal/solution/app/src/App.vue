<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { PhCheckCircle } from '@phosphor-icons/vue'
import TopBar from './components/TopBar.vue'
import LeftRail from './components/LeftRail.vue'
import DocumentCanvas from './components/DocumentCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import KeyboardShortcutsDialog from './components/KeyboardShortcutsDialog.vue'
import { useWorkspaceStore } from './store'
import { registerWebMCP } from './webmcp'

const store = useWorkspaceStore()
const toastOpen = ref(false)
const shortcutsOpen = ref(false)
let toastTimer
let webmcpTimer

watch(() => store.notice.id, async () => {
  if (!store.notice.message) return
  toastOpen.value = false
  await nextTick()
  toastOpen.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastOpen.value = false }, 2600)
})

function onKeydown(event) {
  const target = event.target
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable
  const modifier = event.metaKey || event.ctrlKey
  if (event.key === '?' && !editing) {
    event.preventDefault()
    shortcutsOpen.value = true
    return
  }
  if (modifier && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
    return
  }
  if (modifier && event.key.toLowerCase() === 'd' && store.selectedField) {
    event.preventDefault()
    store.duplicateField()
    return
  }
  if (!editing && (event.key === 'Delete' || event.key === 'Backspace') && store.selectedFieldIds.length) {
    event.preventDefault()
    store.deleteFields()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (!registerWebMCP(store)) {
    webmcpTimer = window.setInterval(() => {
      if (registerWebMCP(store)) window.clearInterval(webmcpTimer)
    }, 500)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(toastTimer)
  window.clearInterval(webmcpTimer)
})
</script>

<template>
  <ToastProvider :duration="2600" swipe-direction="right">
    <div class="app-shell">
      <h1 class="sr-only">Docuseal template editor</h1>
      <div id="action-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ store.notice.message }}
      </div>
      <TopBar />
      <div class="workspace-grid">
        <LeftRail />
        <DocumentCanvas />
        <PropertiesPanel />
      </div>
    </div>

    <ToastRoot v-model:open="toastOpen" class="toast-root" role="status" aria-live="polite" aria-atomic="true">
      <PhCheckCircle :size="19" weight="fill" />
      <ToastTitle class="toast-title">{{ store.notice.message }}</ToastTitle>
    </ToastRoot>
    <ToastViewport class="toast-viewport" aria-label="Action feedback" />
    <KeyboardShortcutsDialog v-model:open="shortcutsOpen" />
  </ToastProvider>
</template>
