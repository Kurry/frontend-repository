<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NConfigProvider, darkTheme, lightTheme } from 'naive-ui'
import IconArchive from '~icons/lucide/archive'
import IconCommand from '~icons/lucide/command'
import IconLayout from '~icons/lucide/layout-dashboard'
import IconMoon from '~icons/lucide/moon'
import IconPackage from '~icons/lucide/package-open'
import IconRedo from '~icons/lucide/redo-2'
import IconSpark from '~icons/lucide/sparkles'
import IconSun from '~icons/lucide/sun'
import IconUndo from '~icons/lucide/undo-2'
import IconX from '~icons/lucide/x'
import QueueView from './components/QueueView.vue'
import DetailView from './components/DetailView.vue'
import ExportView from './components/ExportView.vue'
import ContributorDrawer from './components/ContributorDrawer.vue'
import CommandPalette from './components/CommandPalette.vue'
import { useQcStore } from './store'
import { registerWebMcp } from './webmcp'

const store = useQcStore()
const title = computed(() => store.activeView === 'export' ? 'Export center' : store.activeView === 'detail' ? 'Submission detail' : 'Quality queue')
const density = ref('comfortable')
const showCoachmark = ref(true)
const paletteTrigger = ref(null)

const darkOverrides = {
  common: {
    primaryColor: '#63d7b0', primaryColorHover: '#7fe5bf', primaryColorPressed: '#40b98f', primaryColorSuppl: '#63d7b0',
    bodyColor: '#0b1110', cardColor: '#111a18', modalColor: '#111a18', popoverColor: '#16201e', inputColor: '#0f1816',
    borderColor: '#26332f', dividerColor: '#26332f', textColorBase: '#eef5f1', textColor1: '#eef5f1', textColor2: '#bdc9c4', textColor3: '#82918b',
    borderRadius: '8px', fontFamily: '"Avenir Next", "Segoe UI", Candara, Calibri, sans-serif', fontFamilyMono: '"SF Mono", "Menlo", Consolas, monospace',
  },
  Button: { fontWeight: '650', borderRadiusMedium: '7px', heightMedium: '38px' },
  DataTable: { thColor: '#111917', tdColor: '#0e1614', tdColorHover: '#15211e', borderColor: '#24312d', thTextColor: '#8d9c96' },
  Select: { peers: { InternalSelection: { color: '#0e1715', colorActive: '#111d1a', border: '#31403b', borderActive: '#63d7b0', borderFocus: '#63d7b0' } } },
}

const lightOverrides = {
  common: {
    primaryColor: '#1f8a6a', primaryColorHover: '#2aa17c', primaryColorPressed: '#176b52', primaryColorSuppl: '#1f8a6a',
    bodyColor: '#f4f7f5', cardColor: '#ffffff', modalColor: '#ffffff', popoverColor: '#ffffff', inputColor: '#f7faf8',
    borderColor: '#d5e0db', dividerColor: '#d5e0db', textColorBase: '#14201c', textColor1: '#14201c', textColor2: '#3d4f48', textColor3: '#6a7c74',
    borderRadius: '8px', fontFamily: '"Avenir Next", "Segoe UI", Candara, Calibri, sans-serif', fontFamilyMono: '"SF Mono", "Menlo", Consolas, monospace',
  },
  Button: { fontWeight: '650', borderRadiusMedium: '7px', heightMedium: '38px' },
  DataTable: { thColor: '#eef3f0', tdColor: '#ffffff', tdColorHover: '#f3f8f5', borderColor: '#d5e0db', thTextColor: '#5a6b64' },
}

const activeTheme = computed(() => (store.theme === 'light' ? lightTheme : darkTheme))
const themeOverrides = computed(() => (store.theme === 'light' ? lightOverrides : darkOverrides))

function openPalette() {
  store.paletteOpener = paletteTrigger.value || document.activeElement
  store.palette.open = true
}

function onKeydown(event) {
  const command = event.ctrlKey || event.metaKey
  if (command && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (!store.palette.open) store.paletteOpener = document.activeElement
    store.palette.open = !store.palette.open
    return
  }
  if (store.palette.open) return
  if (store.dialogs.add || store.dialogs.revision || store.dialogs.override || store.dialogs.approve) {
    if (event.key === 'Escape') {
      event.preventDefault()
      store.closeDialogs()
    }
    return
  }
  if (command && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? store.redo() : store.undo() }
  if (event.key === 'Escape' && store.drawerContributor) store.drawerContributor = null
}

function toggleTheme() {
  store.theme = store.theme === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = store.theme
}

function setDensity(value) {
  density.value = value
  document.documentElement.dataset.density = value
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.documentElement.dataset.theme = store.theme
  document.documentElement.dataset.density = density.value
  registerWebMcp(store)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
watch(() => store.activeView, () => window.scrollTo({ top: 0, behavior: 'auto' }))
watch(() => store.theme, (theme) => { document.documentElement.dataset.theme = theme })
</script>

<template>
  <NConfigProvider :theme="activeTheme" :theme-overrides="themeOverrides">
    <div class="app-shell" :class="[`theme-${store.theme}`, `density-${density}`]">
      <header class="app-header">
        <div class="brand" aria-label="Arcfield quality control"><span class="brand-mark"><IconSpark /></span><span><strong>ARCFIELD</strong><small>QUALITY CONTROL</small></span></div>
        <div class="header-context"><span>/</span><strong>{{ title }}</strong></div>
        <nav aria-label="Primary navigation">
          <button :class="{ active: store.activeView === 'queue' || store.activeView === 'detail' }" @click="store.openView('queue')"><IconLayout /> Queue</button>
          <button :class="{ active: store.activeView === 'export' }" @click="store.openView('export')"><IconPackage /> Export</button>
        </nav>
        <div class="header-actions">
          <div class="pref-controls" aria-label="Display preferences">
            <button type="button" class="pref-btn" :aria-pressed="density === 'compact'" title="Compact density" @click="setDensity(density === 'compact' ? 'comfortable' : 'compact')">{{ density === 'compact' ? 'Compact' : 'Cozy' }}</button>
            <button type="button" class="pref-btn theme-toggle" :aria-label="store.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'" @click="toggleTheme">
              <IconSun v-if="store.theme === 'dark'" /><IconMoon v-else />
            </button>
          </div>
          <div class="history-controls" aria-label="Session history">
            <button :disabled="!store.undoStack.length" aria-label="Undo last action" title="Undo (Ctrl+Z)" @click="store.undo"><IconUndo /><span>Undo</span></button>
            <button :disabled="!store.redoStack.length" aria-label="Redo last action" title="Redo (Ctrl+Shift+Z)" @click="store.redo"><IconRedo /><span>Redo</span></button>
          </div>
          <button ref="paletteTrigger" class="palette-trigger" aria-label="Open command palette" @click="openPalette"><IconCommand /><span>Quick find</span><kbd>⌘ K</kbd></button>
          <span class="operator-avatar" aria-label="Operator Nova Lin">NL</span>
        </div>
      </header>

      <div v-if="showCoachmark" class="coachmark" role="status">
        <div>
          <strong>Operator tip</strong>
          <p>Use <kbd>⌘K</kbd> to jump to a submission, then filter by stage and export a live QC package.</p>
        </div>
        <button type="button" aria-label="Dismiss tip" @click="showCoachmark = false"><IconX /></button>
      </div>

      <QueueView v-if="store.activeView === 'queue'" />
      <DetailView v-else-if="store.activeView === 'detail'" />
      <ExportView v-else />

      <ContributorDrawer />
      <CommandPalette />
      <Transition name="toast-slide">
        <div v-if="store.toast.visible" :key="store.toast.key" class="app-toast" :class="`toast-${store.toast.tone}`" role="status" aria-live="polite"><span><IconArchive /></span>{{ store.toast.message }}</div>
      </Transition>
      <div class="sr-live" aria-live="polite">{{ store.toast.visible ? store.toast.message : '' }}</div>
    </div>
  </NConfigProvider>
</template>
