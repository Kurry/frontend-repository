<template>
  <div class="bg-panel p-6 rounded-[10px] w-96 shadow-2xl">
    <h2 class="text-lg font-medium mb-4">Save Snapshot</h2>
    <form @submit="onSubmit" class="flex flex-col gap-4">
      <div>
        <label for="snapshot-name" class="block text-sm font-medium mb-1">Name</label>
        <input
          id="snapshot-name"
          v-model="name"
          type="text"
          class="w-full px-3 py-2 border rounded focus:outline-primary"
          :class="errors.name ? 'border-red-500' : 'border-black/20'"
        >
        <span v-if="errors.name" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.name }}</span>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium" @click="$emit('cancel')">Cancel</button>
        <button
          type="submit"
          class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
          :disabled="!meta.valid"
        >
          Save
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { DialSnapshotSchema } from '../domain.js'
import { useStore } from '../store.js'

const emit = defineEmits(['save', 'cancel'])
const store = useStore()

const ExtendedSchema = DialSnapshotSchema.refine(
  data => !store.snapshots.some(s => s.name === data.name),
  { message: 'Name must be unique', path: ['name'] }
)

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(ExtendedSchema),
  initialValues: {
    name: '',
    aperture: store.aperture,
    shutter: store.shutter,
    iso: store.iso,
    light: JSON.parse(JSON.stringify(store.light)),
    effects: JSON.parse(JSON.stringify(store.effects))
  },
  mode: 'eager'
})

const { value: name } = useField('name')

const onSubmit = handleSubmit(values => {
  emit('save', values)
})
</script>
