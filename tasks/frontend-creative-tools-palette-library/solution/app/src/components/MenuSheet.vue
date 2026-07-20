<template>
  <Transition name="overlay">
    <div
      v-if="store.menuOpen"
      ref="rootRef"
      class="fixed inset-0 z-[90] flex items-start justify-center pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-title"
    >
      <div class="absolute inset-0 bg-ink/40" @click="store.menuOpen = false" aria-hidden="true"></div>
      <div class="relative bg-parchment border border-rule shadow-xl w-[min(92vw,26rem)] p-6">
        <div class="flex items-start justify-between mb-4">
          <h2 id="menu-title" class="font-display text-2xl text-oxblood">The O&amp;A Archive</h2>
          <button
            type="button"
            data-autofocus
            class="min-w-11 min-h-11 -mr-2 -mt-2 inline-flex items-center justify-center font-mono text-sm hover:text-oxblood transition-colors"
            @click="store.menuOpen = false"
          >
            Close<span class="sr-only"> menu</span>
          </button>
        </div>
        <p class="font-serif italic text-sm text-ink-soft mb-5">
          Everything below happens on this page — no destinations, no checkout.
        </p>
        <ul class="flex flex-col gap-1 font-mono text-sm">
          <li>
            <button type="button" class="w-full text-left px-2 py-2.5 min-h-11 border-b border-rule transition-[color,padding-left] duration-200 hover:text-oxblood hover:pl-4" @click="go('library')">Browse the library</button>
          </li>
          <li>
            <button type="button" class="w-full text-left px-2 py-2.5 min-h-11 border-b border-rule transition-[color,padding-left] duration-200 hover:text-oxblood hover:pl-4" @click="go('create-palette')">Create a palette</button>
          </li>
          <li>
            <button type="button" class="w-full text-left px-2 py-2.5 min-h-11 border-b border-rule transition-[color,padding-left] duration-200 hover:text-oxblood hover:pl-4" @click="openExport">Export &amp; import package</button>
          </li>
          <li>
            <button type="button" class="w-full text-left px-2 py-2.5 min-h-11 border-b border-rule transition-[color,padding-left] duration-200 hover:text-oxblood hover:pl-4" @click="openSimulator">Layout simulator</button>
          </li>
          <li>
            <button type="button" class="w-full text-left px-2 py-2.5 min-h-11 border-b border-rule transition-[color,padding-left] duration-200 hover:text-oxblood hover:pl-4" @click="store.cartOpen = true; store.menuOpen = false">Cart drawer</button>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { useDialog, scrollToId } from '../composables/useDialog';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.menuOpen);
useDialog(open, rootRef, { onClose: () => (store.menuOpen = false) });

function go(id) {
  store.menuOpen = false;
  scrollToId(id);
}
function openExport() {
  store.menuOpen = false;
  store.exportOpen = true;
}
function openSimulator() {
  store.menuOpen = false;
  store.simulatorOpen = true;
}
</script>
