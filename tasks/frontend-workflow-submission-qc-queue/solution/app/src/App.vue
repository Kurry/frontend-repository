<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { NButton, NConfigProvider, darkTheme } from 'naive-ui'
import IconArchive from '~icons/lucide/archive'
import IconCommand from '~icons/lucide/command'
import IconLayout from '~icons/lucide/layout-dashboard'
import IconPackage from '~icons/lucide/package-open'
import IconRedo from '~icons/lucide/redo-2'
import IconSpark from '~icons/lucide/sparkles'
import IconUndo from '~icons/lucide/undo-2'
import QueueView from './components/QueueView.vue'
import DetailView from './components/DetailView.vue'
import ExportView from './components/ExportView.vue'
import ContributorDrawer from './components/ContributorDrawer.vue'
import CommandPalette from './components/CommandPalette.vue'
import { useQcStore } from './store'
import { registerWebMcp } from './webmcp'

const store = useQcStore()
const title = computed(() => store.activeView === 'export' ? 'Export center' : store.activeView === 'detail' ? 'Submission detail' : 'Quality queue')
const themeOverrides = {
  common: {
    primaryColor: '#63d7b0', primaryColorHover: '#7fe5bf', primaryColorPressed: '#40b98f', primaryColorSuppl: '#63d7b0',
    bodyColor: '#0b1110', cardColor: '#111a18', modalColor: '#111a18', popoverColor: '#16201e', inputColor: '#0f1816',
    borderColor: '#26332f', dividerColor: '#26332f', textColorBase: '#eef5f1', textColor1: '#eef5f1', textColor2: '#bdc9c4', textColor3: '#82918b',
    borderRadius: '8px', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontFamilyMono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  Button: { fontWeight: '650', borderRadiusMedium: '7px', heightMedium: '38px' },
  DataTable: { thColor: '#111917', tdColor: '#0e1614', tdColorHover: '#15211e', borderColor: '#24312d', thTextColor: '#8d9c96' },
  Select: { peers: { InternalSelection: { color: '#0e1715', colorActive: '#111d1a', border: '#31403b', borderActive: '#63d7b0', borderFocus: '#63d7b0' } } },
}

function onKeydown(event) {
  const command = event.ctrlKey || event.metaKey
  if (command && event.key.toLowerCase() === 'k') { event.preventDefault(); store.palette.open = !store.palette.open; return }
  if (store.palette.open) return
  if (command && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? store.redo() : store.undo() }
  if (event.key === 'Escape' && store.drawerContributor) store.drawerContributor = null
}
onMounted(() => { window.addEventListener('keydown', onKeydown); registerWebMcp(store) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
watch(() => store.activeView, () => window.scrollTo({ top: 0, behavior: 'auto' }))
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="app-shell">
      <header class="app-header">
        <div class="brand" aria-label="Arcfield quality control"><span class="brand-mark"><IconSpark /></span><span><strong>ARCFIELD</strong><small>QUALITY CONTROL</small></span></div>
        <div class="header-context"><span>/</span><strong>{{ title }}</strong></div>
        <nav aria-label="Primary navigation">
          <button :class="{ active: store.activeView === 'queue' || store.activeView === 'detail' }" @click="store.openView('queue')"><IconLayout /> Queue</button>
          <button :class="{ active: store.activeView === 'export' }" @click="store.openView('export')"><IconPackage /> Export</button>
        </nav>
        <div class="header-actions">
          <div class="history-controls" aria-label="Session history">
            <button :disabled="!store.undoStack.length" aria-label="Undo last action" title="Undo (Ctrl+Z)" @click="store.undo"><IconUndo /><span>Undo</span></button>
            <button :disabled="!store.redoStack.length" aria-label="Redo last action" title="Redo (Ctrl+Shift+Z)" @click="store.redo"><IconRedo /><span>Redo</span></button>
          </div>
          <button class="palette-trigger" aria-label="Open command palette" @click="store.palette.open = true"><IconCommand /><span>Quick find</span><kbd>⌘ K</kbd></button>
          <span class="operator-avatar" aria-label="Operator Nova Lin">NL</span>
        </div>
      </header>

      <Transition name="view-shift" mode="out-in">
        <QueueView v-if="store.activeView === 'queue'" key="queue" />
        <DetailView v-else-if="store.activeView === 'detail'" key="detail" />
        <ExportView v-else key="export" />
      </Transition>

      <ContributorDrawer />
      <CommandPalette />
      <Transition name="toast-slide">
        <div v-if="store.toast.visible" :key="store.toast.key" class="app-toast" :class="`toast-${store.toast.tone}`" role="status" aria-live="polite"><span><IconArchive /></span>{{ store.toast.message }}</div>
      </Transition>
      <div class="sr-live" aria-live="polite">{{ store.toast.visible ? store.toast.message : '' }}</div>
    </div>
  </NConfigProvider>
</template>
