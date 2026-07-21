<template>
  <div class="flex flex-col items-center">
    <div
      ref="wheelRef"
      class="relative w-full max-w-72 aspect-square rounded-full select-none touch-none"
      :class="{ 'wheel-dragging': dragging }"
      style="background: conic-gradient(from 0deg, #e63946, #f4a261, #e9c46a, #8ab17d, #2a9d8f, #457b9d, #6d597a, #b56576, #e63946); box-shadow: inset 0 0 0 10px var(--color-cream), inset 0 0 0 11px var(--color-rule);"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <div class="absolute inset-8 rounded-full bg-cream border border-rule"></div>

      <!-- Companion points -->
      <span
        v-for="(point, i) in companionPoints"
        :key="i"
        class="wheel-point absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-cream shadow-md pointer-events-none"
        :style="{ left: point.x + '%', top: point.y + '%', backgroundColor: point.hex }"
        aria-hidden="true"
      ></span>

      <!-- Anchor point: draggable + keyboard adjustable -->
      <button
        type="button"
        role="slider"
        class="wheel-point absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-[3px] border-ink shadow-lg cursor-grab active:cursor-grabbing"
        :class="{ 'scale-110': dragging }"
        :style="{ left: anchorPoint.x + '%', top: anchorPoint.y + '%', backgroundColor: anchorHex }"
        :aria-valuenow="Math.round(store.wheelHue)"
        aria-valuemin="0"
        aria-valuemax="359"
        :aria-valuetext="`Anchor hue ${Math.round(store.wheelHue)} degrees, ${anchorHex}`"
        aria-label="Color wheel anchor — arrow keys move the anchor and its companion points"
        @keydown="onAnchorKey"
      ></button>
    </div>

    <!-- Live hex readouts -->
    <ul class="mt-4 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 font-mono text-[11px]">
      <li class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-full border border-ink/30 swatch-surface shrink-0" :style="{ backgroundColor: anchorHex }"></span>
        <span class="text-ink-soft">Anchor</span>
        <span class="uppercase font-bold">{{ anchorHex }}</span>
      </li>
      <li v-for="(point, i) in companions" :key="i" class="flex items-center gap-2">
        <span class="w-4 h-4 rounded-full border border-ink/30 swatch-surface shrink-0" :style="{ backgroundColor: point.hex }"></span>
        <span class="text-ink-soft">{{ modeLabel }} {{ i + 1 }}</span>
        <span class="uppercase font-bold">{{ point.hex }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { harmonyHues, hslToHex, wrapHue, ANCHOR_SAT, ANCHOR_LIGHT } from '../colorUtils';

const store = usePaletteStore();
const wheelRef = ref(null);
const dragging = ref(false);

const hues = computed(() => harmonyHues(store.wheelHue, store.harmonyMode));
const anchorHex = computed(() => hslToHex(store.wheelHue, ANCHOR_SAT, ANCHOR_LIGHT));
const companions = computed(() =>
  hues.value.slice(1).map((h) => ({ hue: h, hex: hslToHex(h, ANCHOR_SAT, ANCHOR_LIGHT) })),
);

function pointAt(hue) {
  const rad = ((hue - 90) * Math.PI) / 180;
  return { x: 50 + 38.5 * Math.cos(rad), y: 50 + 38.5 * Math.sin(rad) };
}

const anchorPoint = computed(() => pointAt(store.wheelHue));
const companionPoints = computed(() =>
  companions.value.map((c) => ({ ...pointAt(c.hue), hex: c.hex })),
);

const modeLabel = computed(() =>
  store.harmonyMode === 'Triadic' ? 'Triad' : store.harmonyMode === 'Complementary' ? 'Complement' : 'Adjacent',
);

function hueFromEvent(event) {
  const rect = wheelRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const deg = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI + 90;
  return wrapHue(deg);
}

function startDrag(event) {
  dragging.value = true;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  store.wheelHue = hueFromEvent(event);
}

function moveDrag(event) {
  if (!dragging.value) return;
  store.wheelHue = hueFromEvent(event);
}

function endDrag() {
  dragging.value = false;
}

function onAnchorKey(event) {
  const step = event.shiftKey ? 15 : 3;
  let delta = 0;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = step;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -step;
  else if (event.key === 'PageUp') delta = 30;
  else if (event.key === 'PageDown') delta = -30;
  else if (event.key === 'Home') {
    event.preventDefault();
    store.wheelHue = 0;
    return;
  } else if (event.key === 'End') {
    event.preventDefault();
    store.wheelHue = 359;
    return;
  } else return;
  event.preventDefault();
  store.wheelHue = wrapHue(store.wheelHue + delta);
}
</script>
