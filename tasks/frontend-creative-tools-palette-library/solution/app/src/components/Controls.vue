<template>
  <div class="max-w-5xl mx-auto px-4 py-8 flex flex-wrap gap-6 justify-between items-center border-b border-gray-200">
    <div class="flex gap-6 items-center">
      <button
        v-for="view in views"
        :key="view.id"
        @click="store.activeView = view.id"
        class="flex items-center gap-2 font-mono text-xs uppercase hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        :aria-pressed="store.activeView === view.id"
      >
        <div class="w-3 h-3 rounded-full border border-black flex items-center justify-center p-0.5">
          <div
            class="w-full h-full rounded-full bg-black transition-opacity"
            :class="{ 'opacity-100': store.activeView === view.id, 'opacity-0': store.activeView !== view.id }"
          ></div>
        </div>
        {{ view.label }}
      </button>
    </div>

    <div>
      <select
        v-model="store.periodFilter"
        class="border border-gray-300 rounded px-3 py-1 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Filter by Period"
      >
        <option value="">All Periods</option>
        <option v-for="period in periods" :key="period" :value="period">
          {{ period }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';
import { PALETTE_PERIODS } from '../paletteSchema';
const store = usePaletteStore();

const views = [
  { id: 'nomenclature', label: 'Nomenclature' },
  { id: 'palette', label: 'Palette' },
  { id: 'swatch', label: 'Swatch' }
];

const periods = PALETTE_PERIODS;
</script>
