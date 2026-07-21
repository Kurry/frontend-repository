<template>
  <div class="bg-panel p-6 rounded-[10px] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
    <h2 class="text-lg font-medium mb-4 mt-0">{{ initialData ? 'Edit Preset' : 'Create Preset' }}</h2>

    <form @submit="onSubmit" novalidate class="flex flex-col gap-4">
      <!-- Name -->
      <div>
        <label for="preset-name" class="block text-sm font-medium mb-1">Name</label>
        <input
          id="preset-name"
          v-model="name"
          type="text"
          autocomplete="off"
          class="w-full px-3 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm"
          :class="errors.name ? 'border-red-500' : 'border-black/20'"
          :aria-invalid="errors.name ? 'true' : 'false'"
          aria-describedby="preset-name-error"
        >
        <span v-if="errors.name" id="preset-name-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.name }}</span>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <!-- Aperture -->
        <div>
          <label for="preset-aperture" class="block text-sm font-medium mb-1">Aperture</label>
          <input
            id="preset-aperture"
            v-model="aperture"
            type="text"
            inputmode="decimal"
            list="aperture-options"
            autocomplete="off"
            class="w-full px-2 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm"
            :class="errors.aperture ? 'border-red-500' : 'border-black/20'"
            :aria-invalid="errors.aperture ? 'true' : 'false'"
            aria-describedby="preset-aperture-error"
          >
          <datalist id="aperture-options">
            <option v-for="stop in apertureStops" :key="stop" :value="'f/' + stop"></option>
          </datalist>
          <span v-if="errors.aperture" id="preset-aperture-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.aperture }}</span>
        </div>

        <!-- Shutter -->
        <div>
          <label for="preset-shutter" class="block text-sm font-medium mb-1">Shutter</label>
          <input
            id="preset-shutter"
            v-model="shutter"
            type="text"
            inputmode="numeric"
            list="shutter-options"
            autocomplete="off"
            class="w-full px-2 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm"
            :class="errors.shutter ? 'border-red-500' : 'border-black/20'"
            :aria-invalid="errors.shutter ? 'true' : 'false'"
            aria-describedby="preset-shutter-error"
          >
          <datalist id="shutter-options">
            <option v-for="stop in shutterStops" :key="stop" :value="'1/' + stop"></option>
          </datalist>
          <span v-if="errors.shutter" id="preset-shutter-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.shutter }}</span>
        </div>

        <!-- ISO -->
        <div>
          <label for="preset-iso" class="block text-sm font-medium mb-1">ISO</label>
          <input
            id="preset-iso"
            v-model="iso"
            type="text"
            inputmode="numeric"
            list="iso-options"
            autocomplete="off"
            class="w-full px-2 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm"
            :class="errors.iso ? 'border-red-500' : 'border-black/20'"
            :aria-invalid="errors.iso ? 'true' : 'false'"
            aria-describedby="preset-iso-error"
          >
          <datalist id="iso-options">
            <option v-for="stop in isoStops" :key="stop" :value="String(stop)"></option>
          </datalist>
          <span v-if="errors.iso" id="preset-iso-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.iso }}</span>
        </div>
      </div>

      <!-- LookTag -->
      <div>
        <label for="preset-looktag" class="block text-sm font-medium mb-1">Look Tag</label>
        <input
          id="preset-looktag"
          v-model="lookTag"
          type="text"
          list="looktag-options"
          autocomplete="off"
          class="w-full px-3 py-2 border rounded focus-visible:outline-2 focus-visible:outline-primary bg-white text-sm capitalize"
          :class="errors.lookTag ? 'border-red-500' : 'border-black/20'"
          :aria-invalid="errors.lookTag ? 'true' : 'false'"
          aria-describedby="preset-looktag-error"
        >
        <datalist id="looktag-options">
          <option v-for="tag in lookTags" :key="tag" :value="tag"></option>
        </datalist>
        <span v-if="errors.lookTag" id="preset-looktag-error" class="text-red-600 text-[10px] mt-1 block font-medium" aria-live="polite">{{ errors.lookTag }}</span>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <button type="button" class="px-4 py-2 rounded bg-black/10 hover:bg-black/20 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="$emit('cancel')">Cancel</button>
        <button
          type="submit"
          class="px-4 py-2 rounded bg-primary hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :disabled="!meta.valid"
        >
          {{ initialData ? 'Save preset' : 'Create preset' }}
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
import {
  apertureStops, shutterStops, isoStops, lookTags,
  APERTURE_LIST_TEXT, SHUTTER_LIST_TEXT, ISO_LIST_TEXT
} from '../domain.js'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['save', 'cancel'])
const store = useStore()

// The create/edit form accepts typed input (with datalist suggestions) so an
// out-of-list stop or lookTag can be attempted and rejected with a visible
// inline error, while the submitted record is coerced back to the strict
// ExposurePreset API shape (numbers for stops, lowercase enum lookTag).
function parseStopInput(val) {
  if (typeof val !== 'string') return val
  const trimmed = val.trim()
  if (trimmed === '') return val
  const numeric = Number(trimmed.replace(/^f\/|^1\//i, ''))
  return Number.isNaN(numeric) ? val : numeric
}

const FormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required. Enter a name of 1 to 40 characters.')
    .max(40, 'Name is longer than 40 characters. Shorten it to 40 or fewer.'),
  aperture: z.preprocess(parseStopInput,
    z.number({ invalid_type_error: `Aperture must be a number. Pick one of ${APERTURE_LIST_TEXT}.` })
      .refine(val => apertureStops.includes(val), val => ({ message: `Aperture ${val} is not a supported stop. Pick one of ${APERTURE_LIST_TEXT}.` }))),
  shutter: z.preprocess(parseStopInput,
    z.number({ invalid_type_error: `Shutter must be a number. Pick one of ${SHUTTER_LIST_TEXT}.` })
      .refine(val => shutterStops.includes(val), val => ({ message: `Shutter ${val} is not a supported stop. Pick one of ${SHUTTER_LIST_TEXT}.` }))),
  iso: z.preprocess(parseStopInput,
    z.number({ invalid_type_error: `ISO must be a number. Pick one of ${ISO_LIST_TEXT}.` })
      .refine(val => isoStops.includes(val), val => ({ message: `ISO ${val} is not a supported stop. Pick one of ${ISO_LIST_TEXT}.` }))),
  lookTag: z.preprocess(
    val => typeof val === 'string' ? val.trim().toLowerCase() : val,
    z.enum(['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic'], {
      errorMap: () => ({ message: 'Look tag must be one of soft, crisp, grainy, night, daylight, cinematic.' })
    })),
  favorite: z.boolean().default(false).optional()
}).refine(
  data => {
    if (props.initialData && data.name === props.initialData.name) return true
    return !store.presets.some(p => p.name === data.name)
  },
  { message: 'Name must be unique — another preset already uses it. Choose a different name.', path: ['name'] }
)

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(FormSchema),
  initialValues: props.initialData ? { ...props.initialData } : {
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
// Not bound to a visible input -- registering it keeps an edited preset's
// existing favorite flag in the submitted payload instead of dropping it
// (favorite is only ever changed via the star toggle in PresetsView).
const { value: favorite } = useField('favorite')

const onSubmit = handleSubmit(values => {
  emit('save', values)
})
</script>
