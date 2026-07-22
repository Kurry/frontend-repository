<template>
  <div class="py-16 px-6 text-center border border-dashed border-rule bg-parchment/60">
    <p class="font-plate text-2xl mb-3 text-ink">{{ title }}</p>
    <p class="font-serif italic text-ink-soft max-w-md mx-auto mb-6">{{ body }}</p>
    <div class="flex flex-wrap justify-center gap-3">
      <button
        v-if="store.periodFilter"
        type="button"
        class="min-h-11 px-5 border border-ink font-mono text-xs tracking-[0.14em] hover:bg-ink hover:text-cream transition-colors"
        @click="store.periodFilter = ''"
      >
        Clear the period filter
      </button>
      <button
        type="button"
        class="min-h-11 px-5 bg-oxblood text-cream font-mono text-xs tracking-[0.14em] hover:bg-ink transition-colors"
        @click="goCreate"
      >
        Create a palette
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { scrollToId } from '../composables/useDialog';

const store = usePaletteStore();

const title = computed(() =>
  store.palettes.length === 0
    ? 'The archive is empty'
    : 'No palettes match this period',
);

const body = computed(() =>
  store.palettes.length === 0
    ? 'Every user palette has been deleted. Create a new palette below to refill the library.'
    : `Nothing in the library is tagged “${store.periodFilter}”. Clear the filter to see every period, or create a palette in this one.`,
);

function goCreate() {
  scrollToId('create-palette');
}
</script>
