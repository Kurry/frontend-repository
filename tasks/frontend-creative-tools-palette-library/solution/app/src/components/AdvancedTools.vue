<template>
  <div class="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200">
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-sans text-xl font-medium">Advanced Color Tools</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      <!-- Harmony Wheel Simulation -->
      <div class="border border-gray-200 p-4 rounded">
        <h3 class="font-sans font-medium mb-4 text-sm">Harmony Mode</h3>
        <select v-model="store.harmonyMode" class="w-full border border-gray-300 rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black">
          <option value="Analogous">Analogous</option>
          <option value="Complementary">Complementary</option>
          <option value="Triadic">Triadic</option>
        </select>
        <button class="mt-4 w-full bg-gray-100 text-black px-4 py-2 rounded font-sans text-sm hover:bg-gray-200 transition-colors">
          Apply Harmony
        </button>
      </div>

      <!-- Batch Shift Simulation -->
      <div class="border border-gray-200 p-4 rounded">
        <h3 class="font-sans font-medium mb-4 text-sm">Batch Shift (H/S/L)</h3>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-mono uppercase text-gray-500">Hue</label>
            <input type="range" min="-180" max="180" value="0" class="w-full accent-black" />
          </div>
          <div>
            <label class="text-xs font-mono uppercase text-gray-500">Saturation</label>
            <input type="range" min="-100" max="100" value="0" class="w-full accent-black" />
          </div>
          <div>
            <label class="text-xs font-mono uppercase text-gray-500">Lightness</label>
            <input type="range" min="-100" max="100" value="0" class="w-full accent-black" />
          </div>
        </div>
        <button class="mt-4 w-full bg-gray-100 text-black px-4 py-2 rounded font-sans text-sm hover:bg-gray-200 transition-colors">
          Apply Shift
        </button>
      </div>

      <!-- Contrast Matrix Simulation -->
      <div class="border border-gray-200 p-4 rounded">
        <h3 class="font-sans font-medium mb-4 text-sm">Vision & Contrast</h3>
        <select class="w-full border border-gray-300 rounded px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4">
          <option value="Normal">Normal Vision</option>
          <option value="Protanopia">Protanopia</option>
          <option value="Deuteranopia">Deuteranopia</option>
        </select>
        <div class="flex justify-between items-center text-sm font-sans font-medium mt-2">
          <span>Target Ratio:</span>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">AA</span>
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">AAA</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
</script>
