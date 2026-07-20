<template>
  <section id="library-grid" class="max-w-6xl mx-auto px-4 py-10 scroll-mt-20" aria-label="Palette view">
    <EmptyState v-if="store.visiblePalettes.length === 0" />

    <TransitionGroup v-else name="card" tag="div" class="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      <article
        v-for="palette in store.visiblePalettes"
        :key="palette.id"
        class="palette-card bg-parchment border border-rule flex flex-col transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_-14px_rgba(33,26,18,0.45)] hover:border-ink/50"
      >
        <div class="flex h-32">
          <button
            v-for="(hex, idx) in palette.swatches"
            :key="hex + idx"
            type="button"
            class="group/sw relative flex-1 h-full swatch-surface hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-ink"
            :style="{ backgroundColor: store.displayHex(hex) }"
            :aria-label="`Copy swatch ${hex} from ${palette.name}`"
            @click="copy(hex, palette.id, idx)"
          >
            <span
              class="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase opacity-0 group-hover/sw:opacity-100 transition-opacity duration-200"
              :style="{ color: textOn(hex) }"
            >{{ hex }}</span>
            <CopiedChip :hex="hex" :show="store.copyFeedback === `${palette.id}-${idx}`" class="inset-0 m-auto h-max w-max" />
          </button>
        </div>

        <div class="p-4 flex items-start justify-between gap-3 border-t border-rule">
          <div class="min-w-0">
            <h3 class="font-sans font-semibold text-lg leading-tight truncate">{{ palette.name }}</h3>
            <p class="font-serif italic text-sm text-ink-soft mt-0.5">{{ palette.period }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 min-w-11 min-h-11 inline-flex items-center justify-center text-xl leading-none rounded-full transition-[color,transform] duration-200 hover:scale-110"
            :class="palette.favorite ? 'text-oxblood' : 'text-rule hover:text-oxblood'"
            :aria-pressed="palette.favorite"
            :aria-label="palette.favorite ? `Remove ${palette.name} from favorites` : `Add ${palette.name} to favorites`"
            @click="store.toggleFavorite(palette.id)"
          >
            <span aria-hidden="true">{{ palette.favorite ? '♥' : '♡' }}</span>
          </button>
        </div>

        <div class="px-4 pb-4 flex gap-2 mt-auto">
          <button
            type="button"
            class="flex-1 min-h-11 border border-ink font-mono text-[11px] tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream"
            :aria-label="`Open ${palette.name} in the editor`"
            @click="store.openDetail(palette.id)"
          >
            Edit Palette
          </button>
          <button
            type="button"
            class="min-h-11 px-3 border border-rule font-mono text-[11px] tracking-[0.14em] transition-colors hover:border-oxblood hover:text-oxblood"
            :aria-label="`Add ${palette.name} to cart`"
            @click="quickAdd(palette.name)"
          >
            Add to Cart
          </button>
        </div>
      </article>
    </TransitionGroup>
  </section>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';
import { textOn } from '../colorUtils';
import { writeClipboard } from '../composables/useDialog';
import CopiedChip from './CopiedChip.vue';
import EmptyState from './EmptyState.vue';

const store = usePaletteStore();

function copy(hex, paletteId, idx) {
  writeClipboard(hex).finally(() => store.copyHex(hex, `${paletteId}-${idx}`));
}

function quickAdd(name) {
  store.cartPrefill = name;
  store.cartOpen = true;
}
</script>
