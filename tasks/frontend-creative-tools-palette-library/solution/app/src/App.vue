<template>
  <div class="font-sans text-gray-900 min-h-screen bg-white">
    <Header @cart="cartOpen = true" />
    <EditorialIntro />
    <Controls />

    <main>
      <NomenclatureView v-if="store.activeView === 'nomenclature'" />
      <PaletteView v-else-if="store.activeView === 'palette'" />
      <SwatchView v-else-if="store.activeView === 'swatch'" />
    </main>

    <PaletteEditor />
    <AdvancedTools />
    <ExportImport />

    <CartDrawer :isOpen="cartOpen" @close="cartOpen = false" />
    <SubscribeDialog />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePaletteStore } from './stores/palette';
import Header from './components/Header.vue';
import EditorialIntro from './components/EditorialIntro.vue';
import Controls from './components/Controls.vue';
import NomenclatureView from './components/NomenclatureView.vue';
import PaletteView from './components/PaletteView.vue';
import SwatchView from './components/SwatchView.vue';
import PaletteEditor from './components/PaletteEditor.vue';
import AdvancedTools from './components/AdvancedTools.vue';
import ExportImport from './components/ExportImport.vue';
import CartDrawer from './components/CartDrawer.vue';
import SubscribeDialog from './components/SubscribeDialog.vue';

const store = usePaletteStore();
const cartOpen = ref(false);
</script>
