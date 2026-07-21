<script setup>
import { computed, ref } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { PhCheck as CheckIcon, PhClipboard as ClipboardIcon, PhCode as CodeIcon, PhDownloadSimple as DownloadSimpleIcon, PhFileText as FileTextIcon, PhShareNetwork as ShareNetworkIcon, PhX as XIcon } from '@phosphor-icons/vue'
import { highlightJson } from '../lib/json-highlight'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const copied = ref(false)
const tabModel = computed({ get: () => store.exportTab, set: (value) => { store.exportTab = value; copied.value = false } })
const filename = computed(() => store.exportTab === 'json' ? 'release-pack.json' : `manifest-${store.selectedVersionName}.txt`)
const highlightedPack = computed(() => highlightJson(store.releasePackText))
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

async function copyText() {
  const ok = await store.copyActiveExport()
  if (!ok) return
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 2400)
}

async function shareText() {
  try {
    await navigator.share({ title: 'Larkspur release pack', text: store.activeExportText() })
    store.toast('Release pack shared.')
  } catch (error) {
    if (error?.name !== 'AbortError') store.toast('Sharing is unavailable in this browser.', 'info')
  }
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
            <TabsContent value="json" class="code-shell"><pre aria-label="Release pack JSON preview"><code v-html="highlightedPack" /></pre></TabsContent>
            <TabsContent value="summary" class="code-shell summary-shell"><pre aria-label="Manifest summary preview">{{ store.manifestSummary }}</pre></TabsContent>
          </TabsRoot>
          <div class="dialog-actions export-actions">
            <span class="file-name">{{ filename }}</span>
            <button v-if="canShare" class="button secondary" type="button" aria-label="Share the active export" @click="shareText"><ShareNetworkIcon :size="16" />Share</button>
            <button id="export-copy-button" class="button secondary" type="button" @click="copyText"><CheckIcon v-if="copied" :size="16" weight="bold" /><ClipboardIcon v-else :size="16" />{{ copied ? 'Copied' : 'Copy' }}</button>
            <button id="export-download-button" class="button primary" type="button" @click="download"><DownloadSimpleIcon :size="16" />Download</button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
