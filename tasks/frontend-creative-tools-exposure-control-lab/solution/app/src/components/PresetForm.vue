<template>
  <div class="bg-panel p-6 rounded-[10px] w-96 shadow-2xl">
    <h2 class="text-lg font-medium mb-4">{{ initialData ? 'Edit Preset' : 'Create Preset' }}</h2>

    <form @submit="onSubmit" class="flex flex-col gap-4">
      <!-- Name -->
      <div>
        <label for="preset-name" class="block text-sm font-medium mb-1">Name</label>
        <input
          id="preset-name"
          v-model="name"
          type="text"
          class="w-full px-3 py-2 border rounded focus:outline-primary"
          :class="errors.name ? 'border-red-500' : 'border-black/20'"
        >
        <span v-if="errors.name" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.name }}</span>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <!-- Aperture -->
        <div>
          <label for="preset-aperture" class="block text-sm font-medium mb-1">Aperture</label>
          <select id="preset-aperture" v-model.number="aperture" class="w-full px-2 py-2 border border-black/20 rounded focus:outline-primary bg-white text-sm">
            <option v-for="stop in apertureStops" :key="stop" :value="stop">f/{{ stop }}</option>
          </select>
          <span v-if="errors.aperture" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.aperture }}</span>
        </div>

        <!-- Shutter -->
        <div>
          <label for="preset-shutter" class="block text-sm font-medium mb-1">Shutter</label>
          <select id="preset-shutter" v-model.number="shutter" class="w-full px-2 py-2 border border-black/20 rounded focus:outline-primary bg-white text-sm">
            <option v-for="stop in shutterStops" :key="stop" :value="stop">1/{{ stop }}</option>
          </select>
          <span v-if="errors.shutter" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.shutter }}</span>
        </div>

        <!-- ISO -->
        <div>
          <label for="preset-iso" class="block text-sm font-medium mb-1">ISO</label>
          <select id="preset-iso" v-model.number="iso" class="w-full px-2 py-2 border border-black/20 rounded focus:outline-primary bg-white text-sm">
            <option v-for="stop in isoStops" :key="stop" :value="stop">{{ stop }}</option>
          </select>
          <span v-if="errors.iso" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.iso }}</span>
        </div>
      </div>

      <!-- LookTag -->
      <div>
        <label for="preset-looktag" class="block text-sm font-medium mb-1">Look Tag</label>
        <select id="preset-looktag" v-model="lookTag" class="w-full px-3 py-2 border border-black/20 rounded focus:outline-primary bg-white">
          <option v-for="tag in lookTags" :key="tag" :value="tag" class="capitalize">{{ tag }}</option>
        </select>
        <span v-if="errors.lookTag" class="text-red-500 text-[10px] mt-1 block" aria-live="polite">{{ errors.lookTag }}</span>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium" @click="$emit('cancel')">Cancel</button>
        <button
          type="submit"
          class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
          :disabled="!meta.valid"
        >
          {{ initialData ? 'Save' : 'Create' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useStore } from '../store.js'
import { apertureStops, shutterStops, isoStops, lookTags, ExposurePresetSchema } from '../domain.js'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['save', 'cancel'])
const store = useStore()

const ExtendedSchema = ExposurePresetSchema.refine(
  data => {
    if (props.initialData && data.name === props.initialData.name) return true;
    return !store.presets.some(p => p.name === data.name)
  },
  { message: 'Name must be unique', path: ['name'] }
)

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(ExtendedSchema),
  initialValues: props.initialData || {
    name: '',
    aperture: store.aperture,
    shutter: store.shutter,
    iso: store.iso,
    lookTag: 'cinematic',
    favorite: false
  },
  mode: 'eager'
})

const { value: name } = useField('name')
const { value: aperture } = useField('aperture')
const { value: shutter } = useField('shutter')
const { value: iso } = useField('iso')
const { value: lookTag } = useField('lookTag')

const onSubmit = handleSubmit(values => {
  emit('save', values)
})
</script>
