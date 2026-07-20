<template>
  <div class="relative w-full h-full overflow-hidden flex items-center justify-center" role="img" aria-label="Live exposure preview">
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

      <div class="absolute inset-0 z-30 w-[100vw] h-[105vh] bg-[url('/assets/background.jpg')] bg-cover bg-center depth-plate"
           :style="{ filter: 'blur(' + blurAmount + 'px)', transition: transitionStyle }"
           aria-hidden="true">
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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
