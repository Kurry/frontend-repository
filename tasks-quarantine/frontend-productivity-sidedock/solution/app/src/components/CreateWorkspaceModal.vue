<script setup>
import { ref, watch } from 'vue'
import { useSidedockStore } from '../stores/sidedock.js'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { NModal, NCard, NButton, NInput } from 'naive-ui'

import { WORKSPACE_COLORS } from '../validation.js'

const store = useSidedockStore()

const workspaceSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 characters or fewer'),
  color: z.enum(WORKSPACE_COLORS, { errorMap: () => ({ message: 'accentColor is invalid' }) })
}))

const { handleSubmit, errors, resetForm, setFieldValue } = useForm({
  validationSchema: workspaceSchema,
  initialValues: { name: '', color: '#E54610' }
})

const { value: name } = useField('name')
const { value: color } = useField('color')

watch(() => store.showCreateWorkspaceModal, (show) => {
  if (show) {
    resetForm({ values: { name: '', color: WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)] } })
  }
})

const onSubmit = handleSubmit((values) => {
  store.createWorkspace(values.name.trim(), values.color)
  store.showCreateWorkspaceModal = false
})
</script>

<template>
  <NModal v-model:show="store.showCreateWorkspaceModal" preset="card" style="width: 400px; max-width: 90vw;" title="Create workspace">
    <form @submit="onSubmit" class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-semibold mb-1" style="color: var(--color-text-primary)">Name</label>
        <NInput v-model:value="name" placeholder="Workspace name" :status="errors.name ? 'error' : undefined" />
        <p v-if="errors.name" class="text-red-600 text-xs mt-1" role="alert" aria-live="assertive">{{ errors.name }}</p>
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1" style="color: var(--color-text-primary)">Accent Color</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="c in WORKSPACE_COLORS"
            :key="c"
            type="button"
            class="w-8 h-8 rounded cursor-pointer transition-transform hover:scale-110 border-2"
            :class="color === c ? 'border-gray-800' : 'border-transparent'"
            :style="{ background: c }"
            @click="setFieldValue('color', c)"
            :aria-label="`Use color ${c}`"
            :aria-pressed="color === c"
          ></button>
        </div>
        <p v-if="errors.color" class="text-red-600 text-xs mt-1" role="alert" aria-live="assertive">{{ errors.color }}</p>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <NButton @click="store.showCreateWorkspaceModal = false">Cancel</NButton>
        <NButton type="primary" attr-type="submit" style="background: var(--color-accent); border-color: var(--color-accent);">Create</NButton>
      </div>
    </form>
  </NModal>
</template>
