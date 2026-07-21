<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
  DialogDescription, DialogClose, DialogTrigger,
  TabsRoot, TabsList, TabsTrigger, TabsContent,
} from 'reka-ui'
import { PhExport, PhX, PhCopy, PhDownloadSimple, PhCheck } from '@phosphor-icons/vue'
import { useWorkspaceStore } from '../store'

const store = useWorkspaceStore()
const open = ref(false)
const tab = ref('json')
const confirmation = ref('')

const activeText = computed(() => tab.value === 'json' ? store.templateJson : store.signingSummary)

watch([tab, open], () => { confirmation.value = '' })

async function copyArtifact() {
  try {
    await navigator.clipboard.writeText(activeText.value)
    confirmation.value = 'Copied'
    store.notify(`${tab.value === 'json' ? 'Template JSON' : 'Signing summary'} copied`)
  } catch {
    confirmation.value = 'Copy unavailable'
  }
  window.setTimeout(() => { confirmation.value = '' }, 1800)
}

function downloadArtifact() {
  const extension = tab.value === 'json' ? 'json' : 'md'
  const mime = tab.value === 'json' ? 'application/json' : 'text/markdown'
  const safeName = store.activeTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'template'
  const url = URL.createObjectURL(new Blob([activeText.value], { type: `${mime};charset=utf-8` }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeName}.${extension}`
  anchor.click()
  URL.revokeObjectURL(url)
  confirmation.value = 'Downloaded'
  store.notify(`${tab.value === 'json' ? 'Template JSON' : 'Signing summary'} downloaded`)
  window.setTimeout(() => { confirmation.value = '' }, 1800)
}

function handleExternalOpen(event) {
  tab.value = event.detail?.format === 'markdown' ? 'summary' : 'json'
  open.value = true
}

onMounted(() => window.addEventListener('docuseal:open-export', handleExternalOpen))
onBeforeUnmount(() => window.removeEventListener('docuseal:open-export', handleExternalOpen))
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button type="button" class="top-action" aria-label="Export template package">
        <PhExport :size="17" />
        <span>Export</span>
      </button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content export-dialog">
        <div class="dialog-heading">
          <div>
            <DialogTitle class="dialog-title">Export template package</DialogTitle>
            <DialogDescription class="dialog-description">
              Live artifacts generated from your current template and signing state.
            </DialogDescription>
          </div>
          <DialogClose class="icon-button" aria-label="Close export dialog"><PhX :size="18" /></DialogClose>
        </div>

        <TabsRoot v-model="tab" class="artifact-tabs">
          <TabsList class="tabs-list" aria-label="Export formats">
            <TabsTrigger value="json" class="tab-trigger">Template JSON</TabsTrigger>
            <TabsTrigger value="summary" class="tab-trigger">Signing summary</TabsTrigger>
          </TabsList>
          <TabsContent value="json" class="artifact-panel">
            <pre aria-label="Template JSON preview">{{ store.templateJson }}</pre>
          </TabsContent>
          <TabsContent value="summary" class="artifact-panel">
            <pre aria-label="Signing summary preview">{{ store.signingSummary }}</pre>
          </TabsContent>
        </TabsRoot>

        <div class="export-footer">
          <span class="artifact-meta">Generated live · {{ activeText.length.toLocaleString() }} characters</span>
          <div class="export-actions">
            <span v-if="confirmation" class="copy-confirmation" role="status"><PhCheck :size="14" />{{ confirmation }}</span>
            <button type="button" class="button button-secondary" @click="copyArtifact"><PhCopy :size="16" />Copy</button>
            <button type="button" class="button button-primary" @click="downloadArtifact"><PhDownloadSimple :size="16" />Download</button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
