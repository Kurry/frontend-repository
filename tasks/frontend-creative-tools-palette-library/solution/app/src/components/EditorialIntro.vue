<template>
  <section id="intro" class="max-w-6xl mx-auto px-4 pt-14 pb-10 sm:pt-20">
    <!-- Living swatch strip sampled from the seed archive -->
    <div class="flex h-2 w-full overflow-hidden rounded-full mb-10" aria-hidden="true">
      <span
        v-for="(hex, i) in stripSwatches"
        :key="i"
        class="flex-1 swatch-surface"
        :style="{ backgroundColor: store.displayHex(hex) }"
      ></span>
    </div>

    <div class="max-w-3xl">
      <p class="font-mono text-[11px] tracking-[0.3em] text-ink-soft uppercase mb-4 reveal">Object &amp; Archive · Est. collection in memory</p>
      <h1 class="font-plate text-4xl sm:text-5xl md:text-6xl leading-[1.08] mb-6 reveal">
        The <span class="font-display text-oxblood normal-case">O&amp;A</span> Palette Library
      </h1>
      <p class="font-serif text-xl sm:text-2xl leading-relaxed text-ink max-w-2xl reveal">
        Browse fine-art color palettes drawn from centuries of paintings — a living
        archive where pigment meets hex, and every swatch carries a history.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 font-mono text-[13px] leading-relaxed text-ink-soft">
      <p class="reveal">
        Derived from Werner's <em class="font-serif italic">Nomenclature of Colours</em>,
        the Winsor &amp; Newton catalogues, and Cennino Cennini's <em class="font-serif italic">Il Libro dell'Arte</em> —
        historical color sources translated into working palettes.
      </p>
      <p class="reveal">
        This ongoing, open dataset frames color as an evolving historical dialogue
        rather than static hex values. Copy a swatch, chart its contrast, or shift its hue.
      </p>
    </div>

    <!-- Scroll-driven storytelling beat: centuries of pigment advance with the page -->
    <div ref="stripRef" class="relative mt-14 border-y border-rule py-6 select-none" aria-hidden="false">
      <p class="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-soft mb-4">Pigment through the centuries</p>
      <div class="relative h-2 rounded-full bg-sand overflow-hidden">
        <div
          class="absolute inset-y-0 left-0 rounded-full"
          :style="{ width: `${Math.round(progress * 100)}%`, background: progressGradient }"
        ></div>
      </div>
      <ol class="flex justify-between mt-3 font-mono text-[10px] sm:text-[11px] tracking-wide text-ink-soft">
        <li
          v-for="(era, i) in eras"
          :key="era.label"
          class="transition-colors duration-300"
          :class="i <= activeEra ? 'text-oxblood font-bold' : ''"
        >
          {{ era.label }}
        </li>
      </ol>
      <p class="mt-3 font-serif italic text-sm text-ink min-h-6" aria-live="off">
        {{ eras[activeEra].caption }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePaletteStore } from '../stores/palette';

const store = usePaletteStore();

const stripSwatches = computed(() => store.palettes.flatMap((p) => p.swatches));

const eras = [
  { label: '1300s', caption: 'Cennini grinds earth pigments for the Florentine workshops.' },
  { label: '1600s', caption: 'Dutch traders bucket sap green and buckthorn lakes across the channel.' },
  { label: '1700s', caption: 'Gobelins tapestry dyers work madder into garance reds.' },
  { label: '1800s', caption: "Werner's Nomenclature catalogues color for science and art alike." },
  { label: '1900s', caption: 'Perkin mauve opens the age of synthetic dye.' },
  { label: 'Today', caption: 'The archive stays open — every hex an ongoing dialogue.' },
];

const stripRef = ref(null);
const progress = ref(0);
const activeEra = computed(() => Math.min(eras.length - 1, Math.floor(progress.value * eras.length)));
const progressGradient = 'linear-gradient(90deg, #8B4513, #B79E4B, #7C2D26, #4A5D23, #483D8B)';

function onScroll() {
  const el = stripRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const p = 1 - Math.min(1, Math.max(0, rect.top / vh));
  progress.value = p;
}

let observer = null;
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('is-revealed');
      }
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  observer?.disconnect();
});
</script>
