<template>
  <section class="max-w-6xl mx-auto px-4 py-10" aria-label="Nomenclature view">
    <EmptyState v-if="store.nomenclatureRows.length === 0" />

    <div v-else>
      <div class="hidden md:grid grid-cols-[3.5rem_6rem_1.2fr_1.4fr_1fr] gap-4 pb-2 border-b border-ink font-mono text-[10px] tracking-[0.24em] uppercase text-ink-soft">
        <span>Swatch</span>
        <span>Hex</span>
        <span>Historical Name</span>
        <span>Notes</span>
        <span>Source</span>
      </div>

      <TransitionGroup name="fade" tag="div">
        <div
          v-for="row in store.nomenclatureRows"
          :key="row.hex.toLowerCase()"
          class="grid grid-cols-[3.5rem_1fr] md:grid-cols-[3.5rem_6rem_1.2fr_1.4fr_1fr] gap-x-4 gap-y-1 items-center py-2.5 border-b border-rule transition-colors duration-200 hover:bg-parchment"
        >
          <button
            type="button"
            class="relative w-9 h-9 rounded-full border border-ink/30 swatch-surface hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-ink"
            :style="{ backgroundColor: store.displayHex(row.hex) }"
            :aria-label="`Copy swatch ${row.hex}`"
            @click="copy(row.hex)"
          >
            <CopiedChip :hex="row.hex" :show="store.copyFeedback === row.hex.toLowerCase()" class="left-11 top-1/2 -translate-y-1/2" />
          </button>

          <span class="font-mono text-xs uppercase tracking-wider">{{ row.hex }}</span>

          <span class="font-serif italic text-base leading-snug">{{ colorName(row.hex).name }}</span>

          <span class="font-serif text-sm text-ink-soft leading-snug hidden md:block">{{ colorName(row.hex).note }}</span>

          <button
            type="button"
            class="justify-self-start md:justify-self-auto font-sans text-sm font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-oxblood hover:decoration-oxblood text-left min-h-11 md:min-h-0 flex items-center"
            :aria-label="`Open ${row.paletteName} in the editor`"
            @click="store.openDetail(row.paletteId)"
          >
            {{ row.paletteName }}
          </button>
        </div>
      </TransitionGroup>
    </div>
  </section>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';
import { oaColorName } from '../lib/oaColorNames.js';
import { writeClipboard } from '../composables/useDialog';
import CopiedChip from './CopiedChip.vue';
import EmptyState from './EmptyState.vue';

const store = usePaletteStore();

const colorName = (hex) => oaColorName(hex);

function copy(hex) {
  writeClipboard(hex).finally(() => store.copyHex(hex, hex.toLowerCase()));
}
</script>
