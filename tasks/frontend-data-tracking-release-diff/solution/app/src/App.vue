<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { TabsList, TabsRoot, TabsTrigger, TooltipProvider } from 'reka-ui'
import {
  PhArchiveTray as ArchiveTrayIcon,
  PhArrowsLeftRight as ArrowsLeftRightIcon,
  PhChartBar as ChartBarIcon,
  PhClockCounterClockwise as ClockCounterClockwiseIcon,
  PhCompass as CompassIcon,
  PhDownloadSimple as DownloadSimpleIcon,
  PhList as ListIcon,
  PhPlus as PlusIcon,
  PhUploadSimple as UploadSimpleIcon,
  PhX as XIcon,
} from '@phosphor-icons/vue'
import { useReleaseStore } from './stores/releases'
import ReleaseSidebar from './components/ReleaseSidebar.vue'
import ManifestView from './components/ManifestView.vue'
import DiffView from './components/DiffView.vue'
import SplitsView from './components/SplitsView.vue'
import RotationView from './components/RotationView.vue'
import TimelinePanel from './components/TimelinePanel.vue'
import CutDialog from './components/CutDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import ToastStack from './components/ToastStack.vue'
import CommandPalette from './components/CommandPalette.vue'
import TourOverlay from './components/TourOverlay.vue'
import PrefsPopover from './components/PrefsPopover.vue'

const store = useReleaseStore()
const { activeTab, sidebarOpen, theme, density, reduceMotion } = storeToRefs(store)

const tabIcons = { manifest: ArchiveTrayIcon, diff: ArrowsLeftRightIcon, splits: ChartBarIcon, rotation: ClockCounterClockwiseIcon }
const tabs = [
  { id: 'manifest', label: 'Manifest' },
  { id: 'diff', label: 'Diff' },
  { id: 'splits', label: 'Splits' },
  { id: 'rotation', label: 'Rotation' },
]
const activeView = computed(() => ({ manifest: ManifestView, diff: DiffView, splits: SplitsView, rotation: RotationView }[activeTab.value] || ManifestView))
const tabModel = computed({ get: () => activeTab.value, set: (value) => store.setActiveTab(value) })
const rootClasses = computed(() => ({
  'theme-dark': theme.value === 'dark',
  'density-compact': density.value === 'compact',
  'reduce-motion': reduceMotion.value,
}))

function onGlobalKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    store.setPaletteOpen(!store.paletteOpen)
  }
}
const goOnline = () => store.setOnline(true)
const goOffline = () => store.setOnline(false)

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('online', goOnline)
  window.removeEventListener('offline', goOffline)
})
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <div class="app-root" :class="rootClasses">
      <header class="topbar">
        <div class="brand-block">
          <button class="icon-button mobile-menu" type="button" :aria-label="sidebarOpen ? 'Close releases' : 'Open releases'" @click="store.sidebarOpen = !store.sidebarOpen">
            <XIcon v-if="sidebarOpen" :size="20" />
            <ListIcon v-else :size="20" />
          </button>
          <div class="brand-mark" aria-hidden="true"><span>L</span></div>
          <div>
            <div class="brand-name">Larkspur <span>Releases</span></div>
            <div class="brand-kicker">Benchmark corpus register</div>
          </div>
        </div>
        <div class="header-actions">
          <span class="pack-group" data-tour="pack">
            <button class="button secondary header-button" type="button" @click="store.openDialog('import')">
              <UploadSimpleIcon :size="17" /> <span>Import <span class="button-long">release pack</span></span>
            </button>
            <button class="button secondary header-button" type="button" @click="store.openDialog('export')">
              <DownloadSimpleIcon :size="17" /> <span>Export <span class="button-long">release pack</span></span>
            </button>
          </span>
          <button class="button primary header-button" type="button" data-tour="cut" :disabled="store.cutRun.running" @click="store.resetCut(); store.openDialog('cut')">
            <PlusIcon :size="17" weight="bold" /> <span>{{ store.cutRun.running ? 'Cut running' : 'Cut release' }}</span>
          </button>
          <button class="icon-button tour-button" type="button" aria-label="Take the guided tour" title="Guided tour" @click="store.openTour()">
            <CompassIcon :size="18" />
          </button>
          <PrefsPopover />
        </div>
      </header>

      <div class="workspace">
        <div v-if="sidebarOpen" class="sidebar-scrim" aria-hidden="true" @click="store.sidebarOpen = false" />
        <ReleaseSidebar />

        <main class="main-column">
          <TabsRoot v-model="tabModel" class="tabs-root">
            <div class="tab-bar-wrap">
              <TabsList class="tab-list" aria-label="Corpus release views">
                <TabsTrigger v-for="tab in tabs" :key="tab.id" :value="tab.id" class="tab-trigger">
                  <component :is="tabIcons[tab.id]" :size="16" />
                  {{ tab.label }}
                </TabsTrigger>
              </TabsList>
            </div>
          </TabsRoot>
          <Transition name="view-fade" mode="out-in">
            <component :is="activeView" :key="activeTab" />
          </Transition>
        </main>

        <TimelinePanel class="desktop-timeline" />
      </div>

      <CutDialog />
      <ExportDialog />
      <ImportDialog />
      <ToastStack />
      <CommandPalette />
      <TourOverlay />
    </div>
  </TooltipProvider>
</template>
