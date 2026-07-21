<template>
  <div class="min-h-screen bg-cream text-ink paper-field font-serif">
    <Header />
    <MenuSheet />
    <Coachmarks />

    <EditorialIntro />

    <main id="library">
      <Controls />
      <NomenclatureView v-if="store.activeView === 'nomenclature'" />
      <PaletteView v-else-if="store.activeView === 'palette'" />
      <SwatchView v-else-if="store.activeView === 'swatch'" />

      <section id="create-palette" class="max-w-5xl mx-auto px-4 py-14 scroll-mt-24">
        <h2 class="font-plate text-3xl md:text-4xl mb-2">Add to the Archive</h2>
        <p class="text-ink-soft italic mb-8">
          Compose a palette of three to eight unique hex values and file it beside the historical sets.
        </p>
        <PaletteForm mode="create" />
      </section>
    </main>

    <FooterBlock />

    <DetailEditor />
    <LayoutSimulator />
    <ExportDrawer />
    <CartDrawer />
    <SubscribeDialog />

    <!-- Polite announcer for copy confirmations and validation summaries -->
    <div aria-live="polite" role="status" class="sr-only">{{ store.liveMessage }}</div>
  </div>
</template>

<script setup>
import { usePaletteStore } from './stores/palette';
import Header from './components/Header.vue';
import MenuSheet from './components/MenuSheet.vue';
import Coachmarks from './components/Coachmarks.vue';
import EditorialIntro from './components/EditorialIntro.vue';
import Controls from './components/Controls.vue';
import NomenclatureView from './components/NomenclatureView.vue';
import PaletteView from './components/PaletteView.vue';
import SwatchView from './components/SwatchView.vue';
import PaletteForm from './components/PaletteForm.vue';
import FooterBlock from './components/FooterBlock.vue';
import DetailEditor from './components/DetailEditor.vue';
import LayoutSimulator from './components/LayoutSimulator.vue';
import ExportDrawer from './components/ExportDrawer.vue';
import CartDrawer from './components/CartDrawer.vue';
import SubscribeDialog from './components/SubscribeDialog.vue';

const store = usePaletteStore();
</script>
