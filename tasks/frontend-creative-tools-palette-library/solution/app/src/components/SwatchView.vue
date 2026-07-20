<template>
  <section class="max-w-6xl mx-auto px-4 py-10" aria-label="Swatch view">
    <EmptyState v-if="store.allSwatches.length === 0" />

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-rule border border-rule">
      <button
        v-for="item in store.allSwatches"
        :key="`${item.paletteId}-${item.index}-${item.hex}`"
        type="button"
        class="group relative aspect-square p-4 flex flex-col justify-end items-start text-left swatch-surface hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-ink hover:z-10"
        :style="{ backgroundColor: store.displayHex(item.hex), color: textOn(store.displayHex(item.hex)) }"
        :aria-label="`Copy swatch ${item.hex} from ${item.paletteName}`"
        @click="copy(item.hex, item.paletteId, item.index)"
      >
        <span class="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
          <span class="font-mono text-sm uppercase font-bold tracking-wider">{{ item.hex }}</span>
          <span class="font-serif italic text-sm leading-tight">{{ colorName(item.hex).name }}</span>
          <span class="font-sans text-[11px] opacity-80 mt-1">{{ item.paletteName }}</span>
        </span>
        <CopiedChip :hex="item.hex" :show="store.copyFeedback === `${item.paletteId}-${item.index}`" class="inset-0 m-auto h-max w-max" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';
import { textOn } from '../colorUtils';
import { oaColorName } from '../lib/oaColorNames.js';
import { writeClipboard } from '../composables/useDialog';
import CopiedChip from './CopiedChip.vue';
import EmptyState from './EmptyState.vue';

const store = usePaletteStore();

const colorName = (hex) => oaColorName(hex);

async function copy(hex, paletteId, index) {
  const copied = await writeClipboard(hex);
  if (copied) store.copyHex(hex, `${paletteId}-${index}`);
  else store.announce('Clipboard unavailable — the hex was not copied.');
}
</script>
