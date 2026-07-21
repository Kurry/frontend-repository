<template>
  <Transition name="overlay">
    <aside
      v-if="visible && !store.coachDismissed"
      class="fixed bottom-4 left-4 z-[60] w-[min(92vw,21rem)] bg-ink text-cream shadow-2xl border border-ink p-5"
      role="complementary"
      aria-label="Guided introduction"
    >
      <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-sand mb-2">
        First visit · {{ step + 1 }} of {{ steps.length }}
      </p>
      <p class="font-plate text-xl mb-2">{{ steps[step].title }}</p>
      <p class="font-serif text-sm leading-relaxed text-cream/85 mb-4">{{ steps[step].body }}</p>
      <div class="flex items-center justify-between gap-3">
        <div class="flex gap-1.5" aria-hidden="true">
          <span
            v-for="(s, i) in steps"
            :key="i"
            class="w-2 h-2 rounded-full transition-colors duration-300"
            :class="i === step ? 'bg-gold' : 'bg-cream/30'"
          ></span>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-11 px-3 font-mono text-xs tracking-widest text-cream/70 hover:text-cream transition-colors"
            @click="dismiss"
          >
            Skip
          </button>
          <button
            type="button"
            class="min-h-11 px-4 bg-cream text-ink font-mono text-xs tracking-widest hover:bg-gold transition-colors"
            @click="next"
          >
            {{ step === steps.length - 1 ? 'Start browsing' : 'Next' }}
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
const visible = ref(true);
const step = ref(0);

const steps = [
  {
    title: 'Three ways to browse',
    body: 'Switch between Nomenclature rows, Palette cards, and large Swatch tiles — the period filter follows you into every view.',
  },
  {
    title: 'Filter by period',
    body: 'Pick an art-historical period on the right to narrow the archive; choose All Periods to restore the full set.',
  },
  {
    title: 'Create & edit palettes',
    body: 'File a new palette below the library, or open any card to edit its name, period, swatches, harmony, and contrast.',
  },
];

function next() {
  if (step.value === steps.length - 1) dismiss();
  else step.value += 1;
}

function dismiss() {
  store.coachDismissed = true;
}
</script>
