<template>
  <div class="bg-panel p-6 rounded-[10px] w-full max-w-sm shadow-2xl">
    <h2 class="text-lg font-medium mb-1 mt-0">Save Snapshot</h2>
    <p class="m-0 mb-4 text-[12px] text-black/70">Captures the current stops (f/{{ store.aperture }} · 1/{{ store.shutter }} · ISO {{ store.iso }}) and every develop-slider value.</p>
    <form @submit="onSubmit" novalidate class="flex flex-col gap-4">
      <div>
        <label for="snapshot-name" class="block text-sm font-medium mb-1">Name</label>
        <input
          id="snapshot-name"
          v-model="name"
          type="text"
          autocomplete="off"
          class="w-full px-3 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm"
          :class="errors.name ? 'border-red-500' : 'border-black/20'"
          :aria-invalid="errors.name ? 'true' : 'false'"
          aria-describedby="snapshot-name-error"
        >
        <span v-if="errors.name" id="snapshot-name-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.name }}</span>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <button type="button" class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="$emit('cancel')">Cancel</button>
        <button
          type="submit"
          class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :disabled="!meta.valid"
        >
          Save snapshot
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useStore } from '../store.js'

const emit = defineEmits(['save', 'cancel'])
const store = useStore()

// Only the name is typed; stops and slider values are captured from the live
// store at save time. The name follows the DialSnapshot field contract
// (required, 1-40 chars, unique among snapshots).
const NameSchema = z.object({
  name: z.string()
    .min(1, 'Name is required. Enter a name of 1 to 40 characters.')
    .max(40, 'Name is longer than 40 characters. Shorten it to 40 or fewer.')
    .refine(
      val => !store.snapshots.some(s => s.name === val),
      'Name must be unique — another snapshot already uses it. Choose a different name.'
    )
})

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(NameSchema),
  initialValues: { name: '' },
  mode: 'eager'
})

const { value: name } = useField('name')

const onSubmit = handleSubmit(values => {
  emit('save', values.name)
})
</script>
