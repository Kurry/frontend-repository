<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { TabsList, TabsRoot, TabsTrigger, TooltipProvider } from 'reka-ui'
import {
  PhArchiveTray as ArchiveTrayIcon,
  PhArrowsLeftRight as ArrowsLeftRightIcon,
  PhChartBar as ChartBarIcon,
  PhClockCounterClockwise as ClockCounterClockwiseIcon,
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

const store = useReleaseStore()
const { activeTab, sidebarOpen } = storeToRefs(store)

const tabIcons = { manifest: ArchiveTrayIcon, diff: ArrowsLeftRightIcon, splits: ChartBarIcon, rotation: ClockCounterClockwiseIcon }
const tabs = [
  { id: 'manifest', label: 'Manifest' },
  { id: 'diff', label: 'Diff' },
  { id: 'splits', label: 'Splits' },
  { id: 'rotation', label: 'Rotation' },
]
const activeView = computed(() => ({ manifest: ManifestView, diff: DiffView, splits: SplitsView, rotation: RotationView }[activeTab.value] || ManifestView))
const tabModel = computed({ get: () => activeTab.value, set: (value) => store.setActiveTab(value) })
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <div class="app-root">
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
          <button class="button secondary header-button" type="button" @click="store.openDialog('import')">
            <UploadSimpleIcon :size="17" /> <span>Import <span class="button-long">release pack</span></span>
          </button>
          <button class="button secondary header-button" type="button" @click="store.openDialog('export')">
            <DownloadSimpleIcon :size="17" /> <span>Export <span class="button-long">release pack</span></span>
          </button>
          <button class="button primary header-button" type="button" :disabled="store.cutRun.running" @click="store.resetCut(); store.openDialog('cut')">
            <PlusIcon :size="17" weight="bold" /> <span>{{ store.cutRun.running ? 'Cut running' : 'Cut release' }}</span>
          </button>
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
    </div>
  </TooltipProvider>
</template>
