<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="allSwatches.length === 0" class="py-12 text-center font-serif text-gray-500">
      No swatches found for the selected filter. Try adjusting your search or restoring palettes.
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-0">
      <button
        v-for="(item, index) in allSwatches"
        :key="item.hex + index"
        @click="copyHex(item.hex, index)"
        class="aspect-square w-full p-4 flex flex-col justify-end text-left group focus:outline-none focus:ring-4 focus:ring-inset focus:ring-black transition-transform hover:z-10 hover:scale-105 shadow-sm relative"
        :style="{ backgroundColor: item.hex, color: getLuminanceColor(item.hex) }"
        :aria-label="`Copy hex ${item.hex} from ${item.paletteName}`"
      >
        <div class="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col gap-1">
          <span class="font-mono text-sm uppercase font-bold">{{ item.hex }}</span>
          <span class="font-serif italic text-sm">{{ colorName(item.hex) }}</span>
          <span class="font-sans text-xs opacity-75 mt-1">{{ item.paletteName }}</span>
        </div>

        <span
          v-if="store.copyFeedback === `swatch-${index}`"
          class="absolute inset-0 m-auto h-6 leading-6 bg-black text-white text-xs px-2 py-0.5 rounded shadow z-20 w-max text-center"
          aria-live="polite"
        >Copied</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
const store = usePaletteStore();

const allSwatches = computed(() => store.allSwatches);

function getLuminanceColor(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  let r = parseInt(h.substring(0,2),16);
  let g = parseInt(h.substring(2,4),16);
  let b = parseInt(h.substring(4,6),16);
  let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
}

function copyHex(hex, index) {
  navigator.clipboard.writeText(hex).then(() => {
    store.copyFeedback = `swatch-${index}`;
    setTimeout(() => {
      if (store.copyFeedback === `swatch-${index}`) {
        store.copyFeedback = null;
      }
    }, 1000);
  });
}

function colorName(hex) {
  return 'Historical ' + hex;
}
</script>
