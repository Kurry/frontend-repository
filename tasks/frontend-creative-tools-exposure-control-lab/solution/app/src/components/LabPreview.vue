<template>
  <div ref="previewRoot" class="relative w-full h-full overflow-hidden flex items-center justify-center" role="img" aria-label="Live exposure preview">
    <div class="absolute inset-0 z-50 pointer-events-none noise-layer" aria-hidden="true">
      <div
        class="absolute inset-0 mix-blend-multiply bg-[url('/assets/iso-noise.jpg')] bg-[length:200px_200px] bg-center"
        :style="{ opacity: noiseOpacity, transition: transitionStyle }"
      ></div>
    </div>

    <div class="absolute inset-0 z-50 pointer-events-none grain-layer" aria-hidden="true">
      <div
        class="absolute inset-0 mix-blend-multiply bg-[url('/assets/iso-noise.jpg')] bg-[length:120px_120px] bg-center"
        :style="{ opacity: grainOpacity, transition: transitionStyle }"
      ></div>
    </div>

    <div
      class="absolute inset-0 z-50 pointer-events-none vignette-layer"
      aria-hidden="true"
      :style="{ opacity: vignetteOpacity, transition: transitionStyle, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)' }"
    ></div>

    <div class="absolute inset-0 z-1 overflow-hidden flex items-center justify-center preview-container"
         :style="{ filter: previewFilter, transition: transitionStyle }">

      <div class="absolute inset-0 z-40 overflow-hidden motion-stack"
           :style="{ filter: 'blur(' + blurAmount + 'px)', transition: transitionStyle }">
        <img
          v-for="(frame, i) in 10"
          :key="i"
          class="absolute inset-0 w-full h-full object-cover block"
          :class="{ 'z-10': activeFrameIndex === i }"
          :style="{ opacity: activeFrameIndex === i ? 1 : 0, transition: transitionStyle }"
          :src="`/assets/motion-${(i + 1).toString().padStart(2, '0')}.jpg`"
          alt=""
          width="1600"
          height="1000"
        />
      </div>

      <div class="absolute inset-0 z-30 overflow-hidden depth-plate"
           :style="{ filter: 'blur(' + blurAmount + 'px)', transition: transitionStyle }"
           aria-hidden="true">
        <img src="/assets/background.jpg" alt="" class="absolute inset-0 w-full h-full object-cover block scale-[1.05]" width="1600" height="1000" />
      </div>
    </div>

    <!-- Split A/B before-after divider (bonus aid): drag or arrow-key the
         handle to reveal the original unedited capture on the left. -->
    <div v-if="splitEnabled" class="absolute inset-0 z-[55] pointer-events-none overflow-hidden"
         :style="{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }" aria-hidden="true">
      <div class="absolute inset-0" :style="{ filter: BASELINE_FILTER }">
        <div class="absolute inset-0 z-40 overflow-hidden" :style="{ filter: 'blur(' + BASELINE_BLUR + 'px)' }">
          <img :src="`/assets/motion-06.jpg`" alt="" class="absolute inset-0 w-full h-full object-cover block" width="1600" height="1000" />
        </div>
        <div class="absolute inset-0 z-30 overflow-hidden" :style="{ filter: 'blur(' + BASELINE_BLUR + 'px)' }">
          <img src="/assets/background.jpg" alt="" class="absolute inset-0 w-full h-full object-cover block scale-[1.05]" width="1600" height="1000" />
        </div>
      </div>
      <span class="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-[10px] tracking-[0.14em] font-medium">ORIGINAL</span>
      <span class="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-[10px] tracking-[0.14em] font-medium">EDIT</span>
    </div>
    <div
      v-if="splitEnabled"
      class="absolute top-0 bottom-0 z-[56] w-1 bg-white/80 pointer-events-auto cursor-ew-resize"
      :style="{ left: `calc(${splitPos}% - 2px)` }"
      role="slider"
      tabindex="0"
      aria-label="Before/after split position"
      aria-valuemin="5"
      aria-valuemax="95"
      :aria-valuenow="Math.round(splitPos)"
      @pointerdown="startSplitDrag"
      @pointermove="dragSplit"
      @pointerup="splitDragging = false"
      @pointercancel="splitDragging = false"
      @keydown.left.prevent="splitPos = Math.max(5, splitPos - 5)"
      @keydown.right.prevent="splitPos = Math.min(95, splitPos + 5)"
    >
      <span class="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[13px] font-semibold shadow-lg select-none" style="transform: translate(-50%, -50%)" aria-hidden="true">⇔</span>
    </div>

    <!-- Preview usability aids: exposure warning + stop-delta caption (kept
         clear of the top-right help trigger and the bottom-center brand chip) -->
    <div class="absolute bottom-[60px] right-3 md:right-6 z-[60] flex flex-col items-end gap-1.5 pointer-events-none">
      <button
        class="pointer-events-auto px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-medium tracking-wide transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        :class="splitEnabled ? 'bg-primary/90 hover:bg-primary' : ''"
        :aria-pressed="splitEnabled"
        @click="splitEnabled = !splitEnabled"
      >
        {{ splitEnabled ? 'Exit split A/B' : 'Split A/B' }}
      </button>
      <span
        v-if="!store.beforeHold && exposureWarning"
        class="px-2.5 py-1 rounded-full text-[11px] font-medium shadow transition-opacity duration-300"
        :class="exposureWarning.over ? 'bg-amber-400/95 text-black' : 'bg-sky-300/95 text-black'"
      >
        {{ exposureWarning.text }}
      </span>
      <span class="px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-medium tabular-nums">
        Δ {{ deltaCaption }} stops vs baseline
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from '../store.js'
import { shutterStops, computeToneAdjustments, computeTextureClarityAdjustments } from '../domain.js'
import { usePreferredReducedMotion } from '@vueuse/core'

const store = useStore()
const prefersReducedMotion = usePreferredReducedMotion()

const transitionStyle = computed(() => {
  return prefersReducedMotion.value === 'reduce' ? 'none' : 'all 0.25s ease'
})

const BASE_BRIGHTNESS = 120
const BRIGHTNESS_MULT = 1.2
const NOISE_MULTIPLIER = 0.1
const MAX_NOISE = 0.5
const MAX_BLUR = 20
// Baseline dial values the "before" (SOOC) simulation reverts to -- same
// neutral aperture/shutter this component's `brightness` baseEV already
// assumes (16/16, 60/60, 100/100 => 0 EV). activeFrameIndex/blurAmount need
// to key off these too while beforeHold is active, otherwise the motion
// frame and blur amount stay tied to the live dials while everything else
// in this preview (brightness, tone, texture, noise, vignette) reverts.
const BASE_APERTURE = 16
const BASE_SHUTTER = 60

// Fixed rendering of the original capture used by the Split A/B divider:
// baseline stops, no develop edits, no vignette/grain/ISO noise.
const BASELINE_FILTER = `brightness(${BASE_BRIGHTNESS}%) contrast(100%) saturate(1)`
const BASELINE_BLUR = Math.max(0.2, MAX_BLUR / Math.pow(BASE_APERTURE, 1.1))

// --- Split A/B divider state (in-memory only) -------------------------------
const splitEnabled = ref(false)
const splitPos = ref(50)
const splitDragging = ref(false)
const previewRoot = ref(null)

function startSplitDrag(event) {
  splitDragging.value = true
  event.target.setPointerCapture?.(event.pointerId)
  dragSplit(event)
}
function dragSplit(event) {
  if (!splitDragging.value || !previewRoot.value) return
  const rect = previewRoot.value.getBoundingClientRect()
  const pct = ((event.clientX - rect.left) / rect.width) * 100
  splitPos.value = Math.max(5, Math.min(95, pct))
}

// --- Exposure aids ----------------------------------------------------------
const deltaCaption = computed(() => {
  const d = store.beforeHold ? 0 : store.ev + store.light.exposure * 0.02
  const rounded = Math.round(d * 10) / 10
  return (rounded >= 0 ? '+' : '−') + Math.abs(rounded).toFixed(1)
})

const exposureWarning = computed(() => {
  const v = store.displayEV
  if (v > 1.5) return { over: true, text: '▲ Overexposed — narrow aperture, speed up shutter, or lower ISO' }
  if (v < -1.5) return { over: false, text: '▼ Underexposed — widen aperture, slow the shutter, or raise ISO' }
  return null
})

// --- Live preview pipeline ---------------------------------------------------
const activeFrameIndex = computed(() => {
  const shutterForFrame = store.beforeHold ? BASE_SHUTTER : store.shutter
  const idx = shutterStops.indexOf(shutterForFrame)
  return idx >= 0 ? idx : 5
})

const blurAmount = computed(() => {
  const apertureForBlur = store.beforeHold ? BASE_APERTURE : store.aperture
  return Math.max(0.2, MAX_BLUR / Math.pow(apertureForBlur, 1.1))
})

const toneAdjustments = computed(() => {
  return store.beforeHold ? { brightnessDelta: 0, contrastDelta: 0 } : computeToneAdjustments(store.light)
})

const textureClarityAdjustments = computed(() => {
  return store.beforeHold ? { contrastDelta: 0, saturateMult: 1 } : computeTextureClarityAdjustments(store.effects)
})

const brightness = computed(() => {
  const baseEV = 2 * Math.log2(BASE_APERTURE / BASE_APERTURE) + Math.log2(BASE_SHUTTER / BASE_SHUTTER) + Math.log2(100 / 100)
  const currentEV = store.beforeHold ? baseEV : store.ev
  const devExposure = store.beforeHold ? 0 : store.light.exposure
  return BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULT, currentEV) + (devExposure * 0.5) + toneAdjustments.value.brightnessDelta
})

const previewFilter = computed(() => {
  const devContrast = store.beforeHold ? 0 : store.light.contrast
  const mono = !store.beforeHold && store.activeLook === 'Mono'
  const contrastValue = 100 + devContrast + toneAdjustments.value.contrastDelta + textureClarityAdjustments.value.contrastDelta
  let filter = 'brightness(' + brightness.value + '%) contrast(' + contrastValue + '%) saturate(' + textureClarityAdjustments.value.saturateMult + ')'
  if (mono) filter += ' grayscale(1)'
  return filter
})

const grainOpacity = computed(() => {
  const grain = store.beforeHold ? 0 : store.effects.grain
  return Math.min(0.6, (grain / 100) * 0.6)
})

const vignetteOpacity = computed(() => {
  const vignette = store.beforeHold ? 0 : store.effects.vignette
  return Math.min(1, Math.max(0, vignette / 100))
})

const noiseOpacity = computed(() => {
  const currentISO = store.beforeHold ? 100 : store.iso
  const opacity = Math.log2(currentISO / 100) * NOISE_MULTIPLIER
  return Math.min(MAX_NOISE, Math.max(0, opacity))
})
</script>
