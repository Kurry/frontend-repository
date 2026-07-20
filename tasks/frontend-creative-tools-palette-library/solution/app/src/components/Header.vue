<template>
  <header class="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-rule">
    <div class="max-w-6xl mx-auto px-4 grid grid-cols-[1fr_auto_1fr] items-center min-h-16">
      <div class="justify-self-start">
        <button
          type="button"
          class="inline-flex items-center justify-center min-w-11 min-h-11 px-3 font-mono text-xs tracking-[0.22em] text-ink hover:text-oxblood transition-colors"
          aria-haspopup="dialog"
          :aria-expanded="store.menuOpen"
          @click="store.menuOpen = true"
        >
          MENU
        </button>
      </div>

      <p class="font-display text-2xl sm:text-3xl leading-none text-ink select-none whitespace-nowrap">
        <span class="text-oxblood">The O&amp;A</span> Palette Library
      </p>

      <div class="justify-self-end">
        <button
          type="button"
          class="inline-flex items-center justify-center min-w-11 min-h-11 px-3 font-mono text-xs tracking-[0.22em] text-ink hover:text-oxblood transition-colors"
          aria-haspopup="dialog"
          :aria-expanded="store.cartOpen"
          @click="store.cartOpen = true"
        >
          CART<span
            v-if="cartCount > 0"
            class="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-oxblood text-cream text-[10px] font-bold"
          >{{ cartCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
const cartCount = computed(() => store.cartItems.reduce((sum, item) => sum + item.quantity, 0));
</script>
