<script setup>
import { computed, ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { PhCopy as Copy, PhCheck as Check, PhDownloadSimple as DownloadSimple } from '@phosphor-icons/vue'
import { useStudioStore } from '../store'
import { useFocusTrap } from '../focus-trap'
import { useDialogEscape } from '../composables/useDialogEscape'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'copied'])
const store = useStudioStore()
useFocusTrap(computed(() => props.open))
useDialogEscape(props, emit)
const copied = ref(false)
const tabs = [
  { value: 'structured-text', label: 'Structured text', filename: 'rubric.txt', mime: 'text/plain' },
  { value: 'rubric-json', label: 'Rubric JSON', filename: 'rubric.json', mime: 'application/json' },
  { value: 'package-json', label: 'Package JSON', filename: 'rubric-package.json', mime: 'application/json' },
]
const active = computed(() => tabs.find((tab) => tab.value === store.ui.exportTab) || tabs[0])
const preview = computed(() => {
  if (store.ui.exportTab === 'rubric-json') return store.rubricJson
  if (store.ui.exportTab === 'package-json') return store.packageJson
  return store.structuredText
})
async function copyPreview() {
  try {
    await navigator.clipboard.writeText(preview.value)
    copied.value = true
    emit('copied', active.value.label)
    setTimeout(() => { copied.value = false }, 1800)
  } catch {
    emit('copied', 'Copy unavailable')
  }
}
function downloadPreview() {
  const blob = new Blob([preview.value], { type: active.value.mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = active.value.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <Dialog :visible="open" modal header="Export center" class="export-dialog" :style="{ width: 'min(960px, calc(100vw - 24px))' }" @update:visible="!$event && emit('close')">
    <div class="export-head">
      <div class="export-tabs" role="tablist" aria-label="Export formats">
        <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="store.ui.exportTab === tab.value" :class="{ active: store.ui.exportTab === tab.value }" @click="store.ui.exportTab = tab.value">
          {{ tab.label }}
        </button>
      </div>
      <div class="export-actions">
        <Button :label="copied ? 'Copied' : 'Copy'" severity="secondary" outlined @click="copyPreview">
          <template #icon><Check v-if="copied" :size="17" weight="bold" aria-hidden="true" /><Copy v-else :size="17" aria-hidden="true" /></template>
        </Button>
        <Button label="Download" @click="downloadPreview"><template #icon><DownloadSimple :size="17" aria-hidden="true" /></template></Button>
      </div>
    </div>
    <div class="preview-meta">
      <span>Live preview</span><span>{{ preview.length.toLocaleString() }} characters</span>
    </div>
    <pre class="export-preview" tabindex="0">{{ preview }}</pre>
  </Dialog>
</template>
