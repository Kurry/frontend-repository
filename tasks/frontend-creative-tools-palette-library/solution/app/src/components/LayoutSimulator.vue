<template>
  <Transition name="overlay">
    <div
      v-if="store.simulatorOpen"
      ref="rootRef"
      class="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulator-title"
    >
      <div class="absolute inset-0 bg-ink/45" @click="store.simulatorOpen = false" aria-hidden="true"></div>

      <div
        id="layout-simulator"
        class="relative bg-parchment border border-rule shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        <div class="sticky top-0 z-10 bg-parchment/95 backdrop-blur border-b border-rule px-5 py-3.5 flex flex-wrap items-center gap-3">
          <h2 id="simulator-title" class="font-plate text-xl flex-1 min-w-40">Layout Simulator</h2>
          <label class="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
            <span class="whitespace-nowrap">Palette</span>
            <select v-model="store.simulatorPaletteId" class="min-h-11 border border-rule bg-cream px-2 font-mono text-xs max-w-44">
              <option v-for="p in store.palettes" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>
          <button
            type="button"
            data-autofocus
            class="min-w-11 min-h-11 inline-flex items-center justify-center font-mono text-sm hover:text-oxblood transition-colors"
            @click="store.simulatorOpen = false"
          >
            Close<span aria-hidden="true" class="ml-1 text-lg leading-none">×</span>
          </button>
        </div>

        <div v-if="palette" class="p-4 sm:p-5">
          <!-- Mock blog / dashboard surface, recolored live from the palette -->
          <div class="border border-ink/20 shadow-inner overflow-hidden">
            <div class="px-4 py-3 flex items-center justify-between swatch-surface" :style="{ backgroundColor: display(0), color: textOn(display(0)) }">
              <span class="font-display text-lg">Meridian Journal</span>
              <span class="font-mono text-[10px] tracking-[0.2em] uppercase opacity-80">Essays · Notes · Color</span>
            </div>

            <div class="px-5 py-7 swatch-surface" :style="{ backgroundColor: display(1), color: textOn(display(1)) }">
              <p class="font-mono text-[10px] tracking-[0.24em] uppercase opacity-80 mb-2">Featured essay</p>
              <p class="font-plate text-2xl sm:text-3xl leading-tight mb-3">Pigment, Light, and the Long Memory of Color</p>
              <button
                type="button"
                class="px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase border swatch-surface"
                :style="{ backgroundColor: display(2), color: textOn(display(2)), borderColor: textOn(display(2)) }"
              >
                Read the essay
              </button>
            </div>

            <div class="grid grid-cols-3 gap-px bg-ink/15">
              <div
                v-for="(stat, i) in stats"
                :key="i"
                class="px-4 py-5 swatch-surface"
                :style="{ backgroundColor: display((i + 3) % palette.swatches.length), color: textOn(display((i + 3) % palette.swatches.length)) }"
              >
                <p class="font-mono text-xl sm:text-2xl font-bold">{{ stat.value }}</p>
                <p class="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80 mt-1">{{ stat.label }}</p>
              </div>
            </div>

            <div class="px-5 py-4 flex flex-wrap gap-2 swatch-surface" :style="{ backgroundColor: display(0), color: textOn(display(0)) }">
              <span
                v-for="(hex, i) in palette.swatches"
                :key="i"
                class="w-6 h-6 rounded-full border border-ink/20 swatch-surface"
                :style="{ backgroundColor: display(i) }"
                :aria-hidden="true"
              ></span>
              <span class="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80 self-center ml-2">
                Recolored live from “{{ palette.name }}”
              </span>
            </div>
          </div>

          <p class="mt-3 font-serif italic text-sm text-ink-soft">
            Switching the palette above — or selecting a palette in the editor — recolors this
            mock surface without a reload.
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { textOn } from '../colorUtils';
import { useDialog } from '../composables/useDialog';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.simulatorOpen);
useDialog(open, rootRef, { onClose: () => (store.simulatorOpen = false) });

watch(
  () => store.simulatorOpen,
  (value) => {
    if (value) {
      // Opening follows the current selection (or the first library palette when none is selected).
      store.simulatorPaletteId = store.selectedPaletteId || store.palettes[0]?.id || null;
    }
  },
  { immediate: true },
);

const palette = computed(() => store.simulatorPalette);

const display = (i) => (palette.value ? store.displayHex(palette.value.swatches[i % palette.value.swatches.length]) : '#888888');

const stats = [
  { value: '214', label: 'Essays' },
  { value: '38', label: 'Pigments' },
  { value: '1784', label: 'Since' },
];
</script>
