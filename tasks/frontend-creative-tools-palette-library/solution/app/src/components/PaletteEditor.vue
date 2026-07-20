<template>
  <div class="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 mt-12">
    <div class="flex justify-between items-center mb-8">
      <h2 class="font-sans text-xl font-medium">Create Palette</h2>
      <div class="flex gap-2">
        <button @click="store.undo" :disabled="!canUndo" class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50" aria-label="Undo">Undo</button>
        <button @click="store.redo" :disabled="!canRedo" class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50" aria-label="Redo">Redo</button>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6 max-w-2xl">
      <div class="space-y-1">
        <label for="paletteName" class="block font-sans text-sm font-medium">Name</label>
        <input
          id="paletteName"
          v-model="name"
          type="text"
          class="w-full border rounded px-3 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-black"
          :class="{'border-red-500': errors.name, 'border-gray-300': !errors.name}"
        />
        <p v-if="errors.name" class="text-red-500 text-xs font-sans mt-1" role="alert">{{ errors.name }}</p>
      </div>

      <div class="space-y-1">
        <label for="palettePeriod" class="block font-sans text-sm font-medium">Period</label>
        <select
          id="palettePeriod"
          v-model="period"
          class="w-full border rounded px-3 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-black"
          :class="{'border-red-500': errors.period, 'border-gray-300': !errors.period}"
        >
          <option value="" disabled>Select a period</option>
          <option v-for="p in periods" :key="p" :value="p">{{ p }}</option>
        </select>
        <p v-if="errors.period" class="text-red-500 text-xs font-sans mt-1" role="alert">{{ errors.period }}</p>
      </div>

      <div class="space-y-1">
        <label class="block font-sans text-sm font-medium">Swatches (Min 3, Max 6)</label>
        <div class="flex flex-wrap gap-3 mt-2">
          <div v-for="(swatch, idx) in swatches" :key="idx" class="relative group">
            <input
              type="color"
              v-model="swatches[idx]"
              class="w-12 h-12 rounded cursor-pointer border border-gray-300 p-0"
              :aria-label="`Color ${idx + 1}`"
            />
            <button
              @click.prevent="removeSwatch(idx)"
              type="button"
              class="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center border border-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-100"
              aria-label="Remove swatch"
            >×</button>
          </div>
          <button
            v-if="swatches.length < 6"
            @click.prevent="addSwatch"
            type="button"
            class="w-12 h-12 rounded border border-dashed border-gray-400 flex items-center justify-center text-gray-500 hover:text-black hover:border-black focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Add swatch"
          >+</button>
        </div>
        <p v-if="errors.swatches" class="text-red-500 text-xs font-sans mt-1" role="alert">{{ errors.swatches }}</p>
      </div>

      <div class="pt-4 border-t border-gray-200">
        <button
          type="submit"
          :disabled="!meta.valid"
          class="bg-black text-white px-6 py-2 rounded font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          Create Palette
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
const canUndo = computed(() => store.undoStack.length > 0);
const canRedo = computed(() => store.redoStack.length > 0);

const periods = [
  'Baroque to Neoclassical',
  'Expressionism',
  'Fauvism',
  'Historical',
  'Old Masters',
  'Post-Impressionism',
  'Realism',
  'Romanticism',
  'Symbolism',
  'Tonalism'
];

const schema = toTypedSchema(
  z.object({
    name: z.string().trim().min(1, 'Name is required'),
    period: z.string().min(1, 'Period is required'),
    swatches: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3, 'At least 3 swatches are required').max(6, 'Maximum 6 swatches allowed')
  })
);

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    period: '',
    swatches: ['#000000', '#888888', '#ffffff']
  }
});

const { value: name } = useField('name');
const { value: period } = useField('period');
const { value: swatches } = useField('swatches');

function addSwatch() {
  if (swatches.value.length < 6) {
    swatches.value.push('#000000');
  }
}

function removeSwatch(index) {
  if (swatches.value.length > 3) {
    swatches.value.splice(index, 1);
  }
}

const onSubmit = handleSubmit((values) => {
  store.addPalette({
    name: values.name,
    period: values.period,
    swatches: [...values.swatches],
    favorite: false
  });
  resetForm();
});
</script>
