<script setup>
import { ref, watch } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'
import { NModal, NCard, NButton, NInput } from 'naive-ui'

const store = useSidedockStore()
const jsonPreview = ref('')

watch(() => store.showExportPackageModal, (show) => {
  if (show) jsonPreview.value = store.getPackageJson()
})

function handleDownload() {
  store.exportPackage()
  store.showExportPackageModal = false
}

function handleCopy() {
  store.copyPackage()
  store.showExportPackageModal = false
}
</script>

<template>
  <NModal v-model:show="store.showExportPackageModal" preset="card" style="width: 600px; max-width: 90vw;" title="Export SideDock package">
    <div class="flex flex-col gap-4">
      <p class="text-sm secondary-text">Preview of your SideDock JSON package:</p>
      <NInput :value="jsonPreview" type="textarea" readonly rows="12" style="font-family: monospace; font-size: 12px;" />
      <div class="flex justify-end gap-2 mt-2">
        <NButton @click="store.showExportPackageModal = false">Close</NButton>
        <NButton @click="handleCopy">Copy to clipboard</NButton>
        <NButton type="primary" @click="handleDownload" style="background: var(--color-accent); border-color: var(--color-accent);">Download JSON</NButton>
      </div>
    </div>
  </NModal>
</template>
