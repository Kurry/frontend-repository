<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="sortedAndDedupedSwatches.length === 0" class="py-12 text-center font-serif text-gray-500">
      No colors found for the selected filter. Try adjusting your search or restoring palettes.
    </div>

    <div v-else class="flex flex-col gap-2">
      <div class="grid grid-cols-12 gap-4 pb-2 border-b border-gray-200 font-mono text-xs text-gray-500 uppercase tracking-widest">
        <div class="col-span-1">Swatch</div>
        <div class="col-span-2">Hex</div>
        <div class="col-span-3">Name</div>
        <div class="col-span-3">Notes</div>
        <div class="col-span-3">Source</div>
      </div>

      <div
        v-for="(item, index) in sortedAndDedupedSwatches"
        :key="item.hex + index"
        class="grid grid-cols-12 gap-4 items-center py-2 hover:bg-gray-50 group transition-colors"
      >
        <div class="col-span-1">
          <button
            @click="copyHex(item.hex, index)"
            class="w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 relative"
            :style="{ backgroundColor: item.hex }"
            :aria-label="`Copy hex ${item.hex}`"
          >
            <span class="absolute inset-0 m-auto w-full text-center text-xs text-white opacity-0 group-focus:opacity-100 transition-opacity drop-shadow">Copy</span>
            <span
              v-if="store.copyFeedback === `nom-${index}`"
              class="absolute top-0 -right-16 h-6 leading-6 bg-black text-white text-xs px-2 py-0.5 rounded shadow z-10 whitespace-nowrap"
              aria-live="polite"
            >Copied</span>
          </button>
        </div>
        <div class="col-span-2 font-mono text-sm uppercase">
          {{ item.hex }}
        </div>
        <div class="col-span-3 font-serif italic text-base">
          {{ colorName(item.hex) }}
        </div>
        <div class="col-span-3 font-sans text-sm text-gray-600">
          Historical pigment equivalent.
        </div>
        <div class="col-span-3 font-sans text-sm font-medium">
          {{ item.paletteName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { oaColorName } from '../../vendor/oa-color-library.js';
const store = usePaletteStore();

function hueSortValue(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  let r = parseInt(h.substring(0,2),16) / 255;
  let g = parseInt(h.substring(2,4),16) / 255;
  let b = parseInt(h.substring(4,6),16) / 255;
  let max = Math.max(r,g,b), min = Math.min(r,g,b);
  let l = (max + min) / 2;
  if (max === min) return 1000 + (1 - l) * 100;
  let d = max - min;
  let s = d / (1 - Math.abs(2*l - 1));
  let hue;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;
  if (s < 0.12 || l < 0.12) return 1000 + (1 - l) * 100;
  return hue * 360;
}

const sortedAndDedupedSwatches = computed(() => {
  const swatches = store.allSwatches;
  const sorted = [...swatches].sort((a, b) => hueSortValue(a.hex) - hueSortValue(b.hex));
  const seen = new Set();
  const deduped = [];
  for (const item of sorted) {
    const lower = item.hex.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(item);
    }
  }
  return deduped;
});

function copyHex(hex, index) {
  navigator.clipboard.writeText(hex).then(() => {
    store.copyFeedback = `nom-${index}`;
    setTimeout(() => {
      if (store.copyFeedback === `nom-${index}`) {
        store.copyFeedback = null;
      }
    }, 1000);
  });
}

function colorName(hex) {
  return oaColorName(hex).name;
}
</script>
