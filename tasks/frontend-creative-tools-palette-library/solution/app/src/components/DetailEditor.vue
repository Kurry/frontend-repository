<template>
  <Transition name="overlay">
    <div
      v-if="open && palette"
      ref="rootRef"
      class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'detail-title'"
    >
      <div class="absolute inset-0 bg-ink/45" @click="store.closeDetail()" aria-hidden="true"></div>

      <div
        id="palette-detail"
        class="relative bg-cream border border-rule shadow-2xl w-full sm:w-[min(94vw,52rem)] max-h-[94vh] overflow-y-auto scroll-mt-20"
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-rule px-5 sm:px-7 py-4 flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink-soft">Detail / Editor</p>
            <h2 id="detail-title" class="font-plate text-2xl leading-tight truncate">{{ palette.name }}</h2>
            <p class="font-serif italic text-sm text-ink-soft">{{ palette.period }} · {{ palette.swatches.length }} swatches</p>
          </div>

          <button
            type="button"
            class="min-w-11 min-h-11 text-xl transition-transform duration-200 hover:scale-110"
            :class="palette.favorite ? 'text-oxblood' : 'text-rule hover:text-oxblood'"
            :aria-pressed="palette.favorite"
            :aria-label="palette.favorite ? `Remove ${palette.name} from favorites` : `Add ${palette.name} to favorites`"
            @click="store.toggleFavorite(palette.id)"
          >
            <span aria-hidden="true">{{ palette.favorite ? '♥' : '♡' }}</span>
          </button>

          <button
            type="button"
            class="min-h-11 px-3 border border-ink font-mono text-[11px] tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream"
            @click="addPaletteToCart"
          >
            Add to Cart
          </button>

          <button
            type="button"
            data-autofocus
            class="min-w-11 min-h-11 -mr-2 inline-flex items-center justify-center font-mono text-sm transition-colors hover:text-oxblood"
            :aria-label="`Close editor and return to Browse`"
            @click="store.closeDetail()"
          >
            Close<span aria-hidden="true" class="ml-1 text-lg leading-none">×</span>
          </button>
        </div>

        <div class="px-5 sm:px-7 py-6 space-y-10">
          <!-- Edit form with batch tray -->
          <section aria-label="Edit palette fields">
            <h3 class="section-title">Edit Name, Period &amp; Swatches</h3>
            <PaletteForm mode="edit" :palette="palette" :reset-token="resetToken" @saved="onFormSaved" />
          </section>

          <!-- Color wheel harmonic engine -->
          <section id="color-wheel" aria-label="Color wheel harmonic engine" class="scroll-mt-24">
            <h3 class="section-title">Harmonic Engine</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <ColorWheel />
              <div class="space-y-4">
                <div>
                  <label for="harmony-mode" class="block font-mono text-xs tracking-[0.18em] uppercase text-ink-soft mb-1.5">Harmony mode</label>
                  <select
                    id="harmony-mode"
                    v-model="store.harmonyMode"
                    class="w-full min-h-11 border border-rule bg-parchment px-3 font-mono text-sm"
                  >
                    <option value="Analogous">Analogous</option>
                    <option value="Complementary">Complementary</option>
                    <option value="Triadic">Triadic</option>
                  </select>
                </div>
                <p class="font-serif italic text-sm text-ink-soft leading-relaxed">
                  Drag the anchor (or focus it and use the arrow keys) — companion points
                  track continuously. Apply harmony replaces this palette's swatches with
                  the computed set as one undoable step.
                </p>
                <button
                  type="button"
                  class="min-h-11 px-5 bg-ink text-cream font-mono text-xs tracking-[0.16em] uppercase transition-colors hover:bg-oxblood"
                  @click="applyHarmony"
                >
                  Apply Harmony
                </button>
              </div>
            </div>
            <p v-if="harmonyError" class="error-line" role="alert">{{ harmonyError }}</p>
          </section>

          <!-- Contrast matrix -->
          <section id="contrast-matrix" aria-label="WCAG contrast matrix" class="scroll-mt-24">
            <h3 class="section-title">Contrast Matrix</h3>
            <ContrastMatrix :swatches="palette.swatches" />
          </section>

          <!-- Danger zone -->
          <section class="border-t border-rule pt-6 flex flex-wrap items-center gap-3" aria-label="Delete palette">
            <button
              type="button"
              class="min-h-11 px-5 border transition-colors font-mono text-xs tracking-[0.14em]"
              :class="confirmingDelete
                ? 'border-error text-error bg-error/10'
                : 'border-error/50 text-error/80 hover:border-error hover:text-error'"
              :aria-describedby="confirmingDelete ? 'delete-confirm-note' : undefined"
              @click="onDeleteClick"
            >
              {{ confirmingDelete ? 'Confirm Delete?' : 'Delete Palette' }}
            </button>
            <p v-if="confirmingDelete" id="delete-confirm-note" class="font-serif italic text-sm text-error" role="alert">
              Press again to permanently remove “{{ palette.name }}” from the library. Undo can bring it back.
            </p>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { harmonyHues, hslToHex, ANCHOR_SAT, ANCHOR_LIGHT } from '../colorUtils';
import { useDialog } from '../composables/useDialog';
import PaletteForm from './PaletteForm.vue';
import ColorWheel from './ColorWheel.vue';
import ContrastMatrix from './ContrastMatrix.vue';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.detailOpen && !!store.selectedPalette);
const palette = computed(() => store.selectedPalette);

useDialog(open, rootRef, { onClose: () => store.closeDetail() });

const resetToken = ref(0);
const harmonyError = ref('');
const confirmingDelete = ref(false);
let confirmTimer = null;

// If the open palette disappears (delete, import, undo), close the editor.
watch(palette, (value) => {
  if (!value) {
    store.detailOpen = false;
    confirmingDelete.value = false;
  }
});

watch(open, (value) => {
  if (value) {
    harmonyError.value = '';
    confirmingDelete.value = false;
  }
});

function applyHarmony() {
  harmonyError.value = '';
  const set = harmonyHues(store.wheelHue, store.harmonyMode).map((h) =>
    hslToHex(h, ANCHOR_SAT, ANCHOR_LIGHT),
  );
  // A complementary wheel has two hue positions, while every palette must
  // contain at least three unique swatches. Keep the true 180° companion and
  // add a lighter anchor tone so applying the harmony preserves that contract.
  if (store.harmonyMode === 'Complementary') {
    set.push(hslToHex(store.wheelHue, ANCHOR_SAT - 18, ANCHOR_LIGHT + 24));
  }
  const result = store.applyHarmonySet(palette.value.id, set);
  if (!result.ok) {
    harmonyError.value = result.error;
    return;
  }
  resetToken.value += 1;
  store.announce(`Applied ${store.harmonyMode} harmony to ${palette.value.name}`);
}

function onDeleteClick() {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true;
    if (confirmTimer) clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmingDelete.value = false;
    }, 4000);
    return;
  }
  const name = palette.value.name;
  store.deletePalette(palette.value.id);
  store.closeDetail();
  store.announce(`Deleted palette ${name}. Press Undo in the controls strip to restore it.`);
}

function addPaletteToCart() {
  store.cartPrefill = palette.value.name;
  store.cartOpen = true;
}

function onFormSaved() {
  resetToken.value += 1;
}
</script>

<style scoped>
.section-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
}
.error-line {
  margin-top: 0.9rem;
  color: var(--color-error);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}
</style>
