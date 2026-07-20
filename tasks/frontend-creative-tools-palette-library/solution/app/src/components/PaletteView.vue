<template>
  <div id="library-grid" class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="store.visiblePalettes.length === 0" class="py-12 text-center font-serif text-gray-500">
      No palettes found for the selected filter. Try adjusting your search or restoring palettes.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="palette in store.visiblePalettes"
        :key="palette.id"
        class="border border-gray-200 bg-white shadow-sm flex flex-col transition-shadow hover:shadow-md"
      >
        <div class="flex-1 flex" style="min-height: 120px;">
          <button
            v-for="(swatch, idx) in palette.swatches"
            :key="idx"
            @click="copyHex(swatch, `${palette.id}-${idx}`)"
            class="flex-1 h-full cursor-pointer hover:opacity-90 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-white transition-opacity relative group"
            :style="{ backgroundColor: swatch }"
            :aria-label="`Copy hex ${swatch}`"
          >
            <span
              v-if="store.copyFeedback === `${palette.id}-${idx}`"
              class="absolute inset-0 m-auto h-6 leading-6 bg-black text-white text-xs px-2 py-0.5 rounded shadow z-10 w-max"
              aria-live="polite"
            >Copied</span>
            <span class="absolute inset-0 m-auto text-xs text-white opacity-0 group-hover:opacity-100 mix-blend-difference pointer-events-none">{{ swatch }}</span>
          </button>
        </div>
        <div class="p-4 flex justify-between items-start border-t border-gray-100">
          <div>
            <h3 class="font-sans font-medium text-base mb-1">{{ palette.name }}</h3>
            <p class="font-serif italic text-sm text-gray-500">{{ palette.period }}</p>
          </div>
          <button
            @click="store.toggleFavorite(palette.id)"
            class="text-gray-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded"
            :aria-label="palette.favorite ? 'Remove from favorites' : 'Add to favorites'"
          >
            <span v-if="palette.favorite" class="text-black text-lg leading-none">♥</span>
            <span v-else class="text-lg leading-none">♡</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';
const store = usePaletteStore();

function copyHex(hex, id) {
  navigator.clipboard.writeText(hex).then(() => {
    store.copyFeedback = id;
    setTimeout(() => {
      if (store.copyFeedback === id) {
        store.copyFeedback = null;
      }
    }, 1000);
  });
}
</script>
