<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="emit('close')" aria-hidden="true"></div>
    <div class="fixed inset-y-0 right-0 max-w-sm w-full flex">
      <div class="w-full h-full bg-white shadow-xl flex flex-col">

        <div class="px-4 py-6 border-b border-gray-200 flex items-start justify-between">
          <h2 class="text-lg font-sans font-medium text-gray-900" id="slide-over-title">Cart</h2>
          <button @click="emit('close')" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black">
            <span class="sr-only">Close panel</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div v-if="store.cartItems.length === 0" class="text-center font-serif text-gray-500 py-12">
            Your cart is currently empty.
          </div>
          <ul v-else role="list" class="-my-6 divide-y divide-gray-200">
            <li v-for="item in store.cartItems" :key="item.paletteName" class="py-6 flex">
              <div class="flex-1 flex flex-col">
                <div>
                  <div class="flex justify-between text-base font-medium text-gray-900 font-sans">
                    <h3>{{ item.paletteName }}</h3>
                    <p class="ml-4">${{ item.price * item.quantity }}</p>
                  </div>
                </div>
                <div class="flex-1 flex items-end justify-between text-sm mt-4">
                  <p class="text-gray-500 font-sans">Qty {{ item.quantity }}</p>
                  <div class="flex">
                    <button @click="store.removeFromCart(item.paletteName)" type="button" class="font-medium text-red-600 hover:text-red-500">Remove</button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);
const store = usePaletteStore();

</script>
