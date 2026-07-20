<script setup>
import { computed, ref } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { PhCheck as CheckIcon, PhClipboard as ClipboardIcon, PhCode as CodeIcon, PhDownloadSimple as DownloadSimpleIcon, PhFileText as FileTextIcon, PhX as XIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const copied = ref(false)
const tabModel = computed({ get: () => store.exportTab, set: (value) => { store.exportTab = value; copied.value = false } })
const activeText = computed(() => store.exportTab === 'json' ? store.releasePackText : store.manifestSummary)
const filename = computed(() => store.exportTab === 'json' ? 'release-pack.json' : `manifest-${store.selectedVersionName}.txt`)

async function copyText() {
  await store.copyActiveExport()
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 2400)
}

function download() {
  store.downloadActiveExport()
}
</script>

<template>
  <DialogRoot :open="store.dialog === 'export'" @update:open="!$event && store.closeDialog()">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content export-dialog">
        <div class="dialog-header"><div class="dialog-icon"><DownloadSimpleIcon :size="20" /></div><div><DialogTitle class="dialog-title">Export release pack</DialogTitle><DialogDescription class="dialog-description">Compile a portable snapshot directly from this in-memory session.</DialogDescription></div><DialogClose class="icon-button dialog-close" aria-label="Close export"><XIcon :size="18" /></DialogClose></div>
        <div class="dialog-body export-body">
          <TabsRoot v-model="tabModel" class="export-tabs">
            <TabsList class="export-tab-list">
              <TabsTrigger value="json" class="export-tab"><CodeIcon :size="16" />Release pack JSON</TabsTrigger>
              <TabsTrigger value="summary" class="export-tab"><FileTextIcon :size="16" />Manifest summary</TabsTrigger>
            </TabsList>
            <div class="export-meta"><span><i class="live-dot" />Live from shared store</span><span>{{ store.exportTab === 'json' ? `${store.versions.length} versions · cycle ${store.rotation.cycle}` : `Selected v${store.selectedVersionName}` }}</span></div>
            <TabsContent value="json" class="code-shell"><pre aria-label="Release pack JSON preview">{{ store.releasePackText }}</pre></TabsContent>
            <TabsContent value="summary" class="code-shell summary-shell"><pre aria-label="Manifest summary preview">{{ store.manifestSummary }}</pre></TabsContent>
          </TabsRoot>
          <div class="dialog-actions export-actions"><span class="file-name">{{ filename }}</span><button class="button secondary" type="button" @click="copyText"><CheckIcon v-if="copied" :size="16" weight="bold" /><ClipboardIcon v-else :size="16" />{{ copied ? 'Copied' : 'Copy' }}</button><button class="button primary" type="button" @click="download"><DownloadSimpleIcon :size="16" />Download</button></div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
