<script setup>
import { ref, watch } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'
import { NModal, NCard, NButton, NInput } from 'naive-ui'

const store = useSidedockStore()
const jsonStr = ref('')

watch(() => store.showImportPackageModal, (show) => {
  if (show) jsonStr.value = ''
})

function handleImport() {
  if (!jsonStr.value.trim()) {
    store.addToast('Enter JSON package string', 'warning')
    return
  }
  try {
    store.importPackage(jsonStr.value)
    store.showImportPackageModal = false
  } catch (e) {
    // Handled by store
  }
}
</script>

<template>
  <NModal v-model:show="store.showImportPackageModal" preset="card" style="width: 500px; max-width: 90vw;" title="Import SideDock package">
    <div class="flex flex-col gap-4">
      <p class="text-sm secondary-text">Paste a valid SideDock JSON package below. This will replace the current state.</p>
      <NInput v-model:value="jsonStr" type="textarea" placeholder="Paste JSON here..." rows="8" />
      <div class="flex justify-end gap-2 mt-2">
        <NButton @click="store.showImportPackageModal = false">Cancel</NButton>
        <NButton type="primary" @click="handleImport" style="background: var(--color-accent); border-color: var(--color-accent);">Import</NButton>
      </div>
    </div>
  </NModal>
</template>
