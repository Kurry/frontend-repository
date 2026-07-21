<template>
  <section class="max-w-6xl mx-auto px-4 pt-12 scroll-mt-20">
    <div class="flex items-baseline justify-between gap-4 mb-6">
      <h2 class="font-plate text-3xl md:text-4xl">Browse the Library</h2>
      <p class="font-mono text-xs text-ink-soft whitespace-nowrap" aria-live="polite">
        {{ store.visiblePalettes.length }} of {{ store.palettes.length }} palettes
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-rule py-4">
      <!-- View toggles -->
      <div class="flex flex-wrap gap-1" role="group" aria-label="Browse view">
        <button
          v-for="view in views"
          :key="view.id"
          type="button"
          class="group flex items-center gap-2.5 min-h-11 px-3 py-2 font-mono text-xs tracking-[0.14em] transition-colors"
          :class="store.activeView === view.id ? 'text-ink' : 'text-ink-soft hover:text-ink'"
          :aria-pressed="store.activeView === view.id"
          @click="store.activeView = view.id"
        >
          <span
            class="w-3.5 h-3.5 rounded-full border border-ink flex items-center justify-center p-[3px]"
            aria-hidden="true"
          >
            <span
              class="w-full h-full rounded-full bg-ink transition-opacity duration-200"
              :class="store.activeView === view.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'"
            ></span>
          </span>
          {{ view.label }}
        </button>
      </div>

      <div class="hidden sm:block w-px h-7 bg-rule" aria-hidden="true"></div>

      <!-- Undo / redo + vision simulation strip -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="strip-btn"
          :disabled="!store.canUndo"
          :aria-disabled="!store.canUndo"
          @click="store.undo()"
        >
          Undo
        </button>
        <button
          type="button"
          class="strip-btn"
          :disabled="!store.canRedo"
          :aria-disabled="!store.canRedo"
          @click="store.redo()"
        >
          Redo
        </button>

        <label class="flex items-center gap-2 font-mono text-xs tracking-wide text-ink-soft ml-2">
          <span>Vision</span>
          <select
            v-model="store.visionMode"
            class="min-h-11 border border-rule bg-parchment px-2.5 font-mono text-xs text-ink"
          >
            <option value="None">None</option>
            <option value="Protanopia">Protanopia</option>
            <option value="Deuteranopia">Deuteranopia</option>
          </select>
        </label>
      </div>

      <div class="flex-1"></div>

      <!-- Period filter -->
      <label class="flex items-center gap-2 font-mono text-xs tracking-wide text-ink-soft">
        <span class="whitespace-nowrap">Filter by Period</span>
        <select
          v-model="store.periodFilter"
          data-period-filter
          class="min-h-11 min-w-40 border border-rule bg-parchment px-2.5 font-mono text-xs text-ink"
        >
          <option value="">All Periods</option>
          <option v-for="period in periods" :key="period" :value="period">{{ period }}</option>
        </select>
      </label>

      <button
        type="button"
        class="min-h-11 px-4 border border-ink font-mono text-xs tracking-[0.14em] hover:bg-ink hover:text-cream transition-colors"
        @click="openExport"
      >
        Export
      </button>
      <button
        type="button"
        class="min-h-11 px-4 border border-ink font-mono text-xs tracking-[0.14em] hover:bg-ink hover:text-cream transition-colors"
        @click="store.simulatorOpen = true"
      >
        Layout Simulator
      </button>
      <button
        type="button"
        class="min-h-11 px-4 bg-oxblood text-cream font-mono text-xs tracking-[0.14em] hover:bg-ink transition-colors"
        @click="goCreate"
      >
        Create Palette
      </button>
    </div>

    <p v-if="lastOpened" class="mt-3 font-mono text-[11px] text-ink-soft">
      Recently opened:
      <button
        type="button"
        class="underline decoration-dotted underline-offset-4 hover:text-oxblood transition-colors"
        @click="store.openDetail(lastOpened.id)"
      >
        {{ lastOpened.name }}
      </button>
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { PALETTE_PERIODS } from '../paletteSchema';
import { scrollToId } from '../composables/useDialog';

const store = usePaletteStore();

const views = [
  { id: 'nomenclature', label: 'Nomenclature' },
  { id: 'palette', label: 'Palette' },
  { id: 'swatch', label: 'Swatch' },
];

const periods = PALETTE_PERIODS;

const lastOpened = computed(() =>
  store.palettes.find((p) => p.id === store.lastOpenedPaletteId) || null,
);

function openExport() {
  store.exportOpen = true;
}

function goCreate() {
  scrollToId('create-palette');
  requestAnimationFrame(() => {
    setTimeout(() => document.getElementById('create-name')?.focus(), 350);
  });
}
</script>

<style scoped>
.strip-btn {
  min-height: 2.75rem;
  padding: 0 0.9rem;
  border: 1px solid var(--color-rule);
  background: var(--color-parchment);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  transition: color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
.strip-btn:not(:disabled):hover {
  border-color: var(--color-ink);
  color: var(--color-oxblood);
}
.strip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
