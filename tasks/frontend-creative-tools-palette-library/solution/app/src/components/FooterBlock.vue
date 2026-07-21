<template>
  <footer class="mt-20 border-t border-ink bg-ink text-cream">
    <div class="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <p class="font-display text-2xl mb-3"><span class="text-gold">The O&amp;A</span> Palette Library</p>
        <p class="font-serif italic text-sm text-cream/75 leading-relaxed">
          Object and Archive — a fine-art color library kept entirely in memory.
          Reload and the seeds return; export the package to carry the session's work.
        </p>
      </div>
      <div>
        <h2 class="footer-title">Sources</h2>
        <ul class="space-y-1.5 font-mono text-xs text-cream/75">
          <li>Werner's Nomenclature of Colours, 1814</li>
          <li>Winsor &amp; Newton catalogues, 1870s</li>
          <li>Cennino Cennini, Il Libro dell'Arte</li>
          <li>Ridgway, Color Standards, 1912</li>
        </ul>
      </div>
      <div>
        <h2 class="footer-title">In this session</h2>
        <ul class="space-y-1.5 font-mono text-xs text-cream/75">
          <li>{{ store.palettes.length }} user-manageable palettes</li>
          <li>{{ store.cartItems.length }} cart line items</li>
          <li>Vision simulation: {{ store.visionMode }}</li>
          <li>Undo steps available: {{ store.undoStack.length }}</li>
        </ul>
      </div>
      <div>
        <h2 class="footer-title">Colophon</h2>
        <ul class="space-y-1.5 font-mono text-xs text-cream/75">
          <li>Set in Desmontilles, Abril &amp; Timezone</li>
          <li>Built with Vue 3, Pinia, Tailwind 4</li>
          <li>No outbound links · no storage · no checkout</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-cream/15">
      <p class="max-w-6xl mx-auto px-4 py-4 font-mono text-[10px] tracking-[0.24em] uppercase text-cream/50">
        Object and Archive · o+a · Palette Library
      </p>
    </div>
  </footer>
</template>

<script setup>
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();
</script>

<style scoped>
.footer-title {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-gold);
  margin-bottom: 0.8rem;
}
</style>
