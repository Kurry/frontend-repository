<template>
  <div class="relative w-full h-full overflow-hidden flex items-center justify-center">
    <div class="absolute inset-0 z-50 pointer-events-none noise-layer" aria-hidden="true">
      <div
        class="absolute inset-0 mix-blend-multiply bg-[url('/assets/iso-noise.jpg')] bg-[length:200px_200px] bg-center"
        :style="{ opacity: noiseOpacity, transition: transitionStyle }"
      ></div>
    </div>

    <div class="absolute inset-0 z-1 overflow-hidden flex items-center justify-center preview-container"
         :style="{ filter: 'brightness(' + brightness + '%)', transition: transitionStyle }">

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
import { shutterStops } from '../domain.js'
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

const activeFrameIndex = computed(() => {
  const idx = shutterStops.indexOf(store.shutter)
  return idx >= 0 ? idx : 5
})

const blurAmount = computed(() => {
  return Math.max(0.2, MAX_BLUR / Math.pow(store.aperture, 1.1))
})

const brightness = computed(() => {
  const baseEV = 2 * Math.log2(16 / 16) + Math.log2(60 / 60) + Math.log2(100 / 100)
  const currentEV = store.beforeHold ? baseEV : store.ev
  const devExposure = store.beforeHold ? 0 : store.light.exposure
  return BASE_BRIGHTNESS * Math.pow(BRIGHTNESS_MULT, currentEV) + (devExposure * 0.5)
})

const noiseOpacity = computed(() => {
  const currentISO = store.beforeHold ? 100 : store.iso
  const opacity = Math.log2(currentISO / 100) * NOISE_MULTIPLIER
  return Math.min(MAX_NOISE, Math.max(0, opacity))
})
</script>
