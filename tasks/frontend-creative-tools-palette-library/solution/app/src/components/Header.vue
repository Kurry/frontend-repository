<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200">
    <div class="px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button class="font-sans text-sm tracking-wide" @click="emit('menu')">MENU</button>
      </div>
      <div class="font-serif text-lg">
        THE O&A PALETTE LIBRARY
      </div>
      <div class="flex items-center gap-4">
        <button class="font-sans text-sm tracking-wide" @click="emit('cart')">CART ({{ cartCount }})</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { usePaletteStore } from '../stores/palette';

const emit = defineEmits(['menu', 'cart']);
const store = usePaletteStore();

const cartCount = computed(() => {
  return store.cartItems.reduce((acc, item) => acc + item.quantity, 0);
});
</script>
