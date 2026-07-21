<script setup>
import { ref, watch } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NModal, NCard, NButton, NInput } from 'naive-ui'

const store = useSidedockStore()

const folderSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer')
}))

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: folderSchema,
  initialValues: { name: '' }
})

const { value: name } = useField('name')

watch(() => store.showCreateFolderModal, (show) => {
  if (show) resetForm({ values: { name: '' } })
})

const onSubmit = handleSubmit((values) => {
  store.createFolder(store.createFolderParentId, values.name.trim())
  store.showCreateFolderModal = false
})
</script>

<template>
  <NModal v-model:show="store.showCreateFolderModal" preset="card" style="width: 400px; max-width: 90vw;" title="Create folder">
    <form @submit="onSubmit" class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-semibold mb-1" style="color: var(--color-text-primary)">Name</label>
        <NInput v-model:value="name" placeholder="Folder name" :status="errors.name ? 'error' : undefined" />
        <p v-if="errors.name" class="text-red-600 text-xs mt-1" role="alert" aria-live="assertive">{{ errors.name }}</p>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <NButton @click="store.showCreateFolderModal = false">Cancel</NButton>
        <NButton type="primary" attr-type="submit" style="background: var(--color-accent); border-color: var(--color-accent);">Create</NButton>
      </div>
    </form>
  </NModal>
</template>
