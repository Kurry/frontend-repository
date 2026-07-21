<template>
  <div class="pointer-events-none absolute inset-0 w-full h-full z-[100]">

    <!-- Meter -->
    <div
      class="absolute left-4 md:left-20 top-1/2 -translate-y-1/2 z-[100] w-5 h-[360px] rounded-[10px] bg-dial flex items-center justify-center pointer-events-auto"
      aria-label="Exposure meter"
      role="meter"
      :aria-valuenow="clampedEV"
      aria-valuemin="-5"
      aria-valuemax="5"
      :aria-valuetext="meterCaption"
    >
      <div class="relative w-full h-full">
        <div
          class="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary z-20"
          :style="{ top: meterTop + '%', transition: transitionStyle }"
        ></div>
      </div>
      <span class="absolute w-[180px] text-center tracking-[2px] text-text-light text-[12px] font-medium -rotate-90 bottom-[80px]">UNDER EXPOSED</span>
      <span class="absolute w-[180px] text-center tracking-[2px] text-text-light text-[12px] font-medium -rotate-90 top-[80px]">OVER EXPOSED</span>
      <span class="absolute w-5 h-5 rounded-full bg-white/50" aria-hidden="true"></span>
      <!-- Text readout of the current exposure state for assistive tech -->
      <span class="sr-live" aria-live="polite">Exposure: {{ meterCaption }}</span>
    </div>

    <!-- Dials -->
    <div class="absolute right-4 md:right-10 top-[20%] md:top-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center justify-between h-[360px] pointer-events-auto md:w-auto w-[280px] md:h-[360px] h-[140px] md:flex-col flex-row max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-auto max-md:bottom-[30px] max-md:right-auto">

      <!-- Aperture -->
      <div class="relative flex md:flex-row flex-col items-center justify-center md:w-[180px] md:h-[100px] w-[72px] h-[140px]" data-control="aperture">
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-down.svg')] md:bg-[url('/assets/arrow.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:28px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:order-1"
                @click="(e) => guardedClick(e, () => stepAperture('down'))"
                @pointerdown="beginHold($event, 'down', stepAperture)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepAperture('up')"
                @keydown.down.prevent="stepAperture('down')"
                :disabled="atApertureEnd"
                :aria-disabled="atApertureEnd"
                :style="{ opacity: atApertureEnd ? 0 : 1, pointerEvents: atApertureEnd ? 'none' : 'auto' }"
                aria-label="Widen aperture (lower f-number)"></button>
        <div class="relative z-40 w-[72px] md:w-[100px] h-[72px] md:h-auto md:bg-transparent bg-dial md:rounded-none rounded-[10px] flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-text-light tracking-[1px] md:text-[14px] text-[12px] font-normal">APERTURE</span>
          <Transition name="dial-val" mode="out-in">
            <span :key="'a' + store.aperture" class="text-white text-[22px] font-light leading-[26px] w-[72px] md:w-20 h-8 flex items-center justify-center">f/{{ store.aperture }}</span>
          </Transition>
        </div>
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-up.svg')] md:bg-[url('/assets/arrow-up.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:30px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:-order-1"
                @click="(e) => guardedClick(e, () => stepAperture('up'))"
                @pointerdown="beginHold($event, 'up', stepAperture)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepAperture('up')"
                @keydown.down.prevent="stepAperture('down')"
                :disabled="atApertureStart"
                :aria-disabled="atApertureStart"
                :style="{ opacity: atApertureStart ? 0 : 1, pointerEvents: atApertureStart ? 'none' : 'auto' }"
                aria-label="Narrow aperture (higher f-number)"></button>
        <div class="absolute w-[100px] h-[100px] rounded-[20px] bg-dial z-0 hidden md:block transition-shadow duration-300" :class="{ 'ring-2 ring-primary/80': store.editorSelected === 'exposure' }" aria-hidden="true" style="pointer-events: none;"></div>
      </div>

      <!-- Shutter -->
      <div class="relative flex md:flex-row flex-col items-center justify-center md:w-[180px] md:h-[100px] w-[72px] h-[140px]" data-control="shutter">
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-down.svg')] md:bg-[url('/assets/arrow.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:28px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:order-1"
                @click="(e) => guardedClick(e, () => stepShutter('down'))"
                @pointerdown="beginHold($event, 'down', stepShutter)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepShutter('up')"
                @keydown.down.prevent="stepShutter('down')"
                :disabled="atShutterStart"
                :aria-disabled="atShutterStart"
                :style="{ opacity: atShutterStart ? 0 : 1, pointerEvents: atShutterStart ? 'none' : 'auto' }"
                aria-label="Decrease shutter speed"></button>
        <div class="relative z-40 w-[72px] md:w-[100px] h-[72px] md:h-auto md:bg-transparent bg-dial md:rounded-none rounded-[10px] flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-text-light tracking-[1px] md:text-[14px] text-[12px] font-normal">SPEED</span>
          <Transition name="dial-val" mode="out-in">
            <span :key="'s' + store.shutter" class="text-white text-[22px] font-light leading-[26px] w-[72px] md:w-20 h-8 flex items-center justify-center">1/{{ store.shutter }}</span>
          </Transition>
        </div>
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-up.svg')] md:bg-[url('/assets/arrow-up.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:30px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:-order-1"
                @click="(e) => guardedClick(e, () => stepShutter('up'))"
                @pointerdown="beginHold($event, 'up', stepShutter)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepShutter('up')"
                @keydown.down.prevent="stepShutter('down')"
                :disabled="atShutterEnd"
                :aria-disabled="atShutterEnd"
                :style="{ opacity: atShutterEnd ? 0 : 1, pointerEvents: atShutterEnd ? 'none' : 'auto' }"
                aria-label="Increase shutter speed"></button>
        <div class="absolute w-[100px] h-[100px] rounded-[20px] bg-dial z-0 hidden md:block transition-shadow duration-300" :class="{ 'ring-2 ring-primary/80': store.editorSelected === 'exposure' }" aria-hidden="true" style="pointer-events: none;"></div>
      </div>

      <!-- ISO -->
      <div class="relative flex md:flex-row flex-col items-center justify-center md:w-[180px] md:h-[100px] w-[72px] h-[140px]" data-control="iso">
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-down.svg')] md:bg-[url('/assets/arrow.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:28px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:order-1"
                @click="(e) => guardedClick(e, () => stepIso('down'))"
                @pointerdown="beginHold($event, 'down', stepIso)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepIso('up')"
                @keydown.down.prevent="stepIso('down')"
                :disabled="atIsoStart"
                :aria-disabled="atIsoStart"
                :style="{ opacity: atIsoStart ? 0 : 1, pointerEvents: atIsoStart ? 'none' : 'auto' }"
                aria-label="Decrease ISO"></button>
        <div class="relative z-40 w-[72px] md:w-[100px] h-[72px] md:h-auto md:bg-transparent bg-dial md:rounded-none rounded-[10px] flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-text-light tracking-[1px] md:text-[14px] text-[12px] font-normal">ISO</span>
          <Transition name="dial-val" mode="out-in">
            <span :key="'i' + store.iso" class="text-white text-[22px] font-light leading-[26px] w-[72px] md:w-20 h-8 flex items-center justify-center">{{ store.iso }}</span>
          </Transition>
        </div>
        <button type="button"
                class="relative z-10 w-full md:w-10 h-[30px] md:h-[100px] bg-[url('/assets/arrow-mob-up.svg')] md:bg-[url('/assets/arrow-up.svg')] bg-no-repeat bg-center bg-cover md:bg-[length:30px] transition-opacity duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:-order-1"
                @click="(e) => guardedClick(e, () => stepIso('up'))"
                @pointerdown="beginHold($event, 'up', stepIso)"
                @pointerup="endHold"
                @pointerleave="endHold"
                @pointercancel="endHold"
                @keydown.up.prevent="stepIso('up')"
                @keydown.down.prevent="stepIso('down')"
                :disabled="atIsoEnd"
                :aria-disabled="atIsoEnd"
                :style="{ opacity: atIsoEnd ? 0 : 1, pointerEvents: atIsoEnd ? 'none' : 'auto' }"
                aria-label="Increase ISO"></button>
        <div class="absolute w-[100px] h-[100px] rounded-[20px] bg-dial z-0 hidden md:block transition-shadow duration-300" :class="{ 'ring-2 ring-primary/80': store.editorSelected === 'exposure' }" aria-hidden="true" style="pointer-events: none;"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useStore } from '../store.js'
import { apertureStops, shutterStops, isoStops } from '../domain.js'
import { usePreferredReducedMotion } from '@vueuse/core'

const store = useStore()
const prefersReducedMotion = usePreferredReducedMotion()

const transitionStyle = computed(() => {
  return prefersReducedMotion.value === 'reduce' ? 'none' : 'top 0.35s ease'
})

// While beforeHold is active, LabPreview simulates the baseline (SOOC, 0 EV)
// exposure for the visual preview instead of the live dial-derived EV. The
// meter/EV readout has to track the same baseline or its numeric position
// won't match what the preview shows. `store.displayEV` is the single
// shared source of truth for this (also used by App.vue's drawer EV
// readout/histogram) so all three surfaces stay in sync during a Before hold.
const displayEV = computed(() => store.displayEV)

const clampedEV = computed(() => {
  const v = displayEV.value
  return Math.max(-5, Math.min(5, v))
})
const meterTop = computed(() => {
  return Math.max(5, Math.min(95, 50 - clampedEV.value * 10))
})
const meterCaption = computed(() => {
  if (clampedEV.value < -0.5) return 'under'
  if (clampedEV.value > 0.5) return 'over'
  return 'balanced'
})

const atApertureStart = computed(() => apertureStops.indexOf(store.aperture) === 0)
const atApertureEnd = computed(() => apertureStops.indexOf(store.aperture) === apertureStops.length - 1)

const atShutterStart = computed(() => shutterStops.indexOf(store.shutter) === 0)
const atShutterEnd = computed(() => shutterStops.indexOf(store.shutter) === shutterStops.length - 1)

const atIsoStart = computed(() => isoStops.indexOf(store.iso) === 0)
const atIsoEnd = computed(() => isoStops.indexOf(store.iso) === isoStops.length - 1)

function stepAperture(dir) {
  store.mutate('stepAperture', () => {
    let idx = apertureStops.indexOf(store.aperture)
    if (dir === 'up') idx = Math.max(0, idx - 1)
    else idx = Math.min(apertureStops.length - 1, idx + 1)
    store.aperture = apertureStops[idx]
  })
}

function stepShutter(dir) {
  store.mutate('stepShutter', () => {
    let idx = shutterStops.indexOf(store.shutter)
    if (dir === 'up') idx = Math.min(shutterStops.length - 1, idx + 1)
    else idx = Math.max(0, idx - 1)
    store.shutter = shutterStops[idx]
  })
}

function stepIso(dir) {
  store.mutate('stepIso', () => {
    let idx = isoStops.indexOf(store.iso)
    if (dir === 'up') idx = Math.min(isoStops.length - 1, idx + 1)
    else idx = Math.max(0, idx - 1)
    store.iso = isoStops[idx]
  })
}

// Hold-to-repeat: the first step fires on click; holding the stepper keeps
// stepping (after a short delay) until release. Stepping clamps inside the
// stop lists, so a held stepper at an edge simply stops advancing.
let holdTimeout = null
let holdInterval = null
let suppressClick = false

function beginHold(event, dir, stepFn) {
  if (event.button !== undefined && event.button !== 0) return
  suppressClick = false
  endHold()
  holdTimeout = setTimeout(() => {
    suppressClick = true
    holdInterval = setInterval(() => stepFn(dir), 130)
  }, 450)
}

function endHold() {
  if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null }
  if (holdInterval) { clearInterval(holdInterval); holdInterval = null }
}

function guardedClick(event, fn, ...args) {
  if (suppressClick) { event.preventDefault(); suppressClick = false; return }
  fn(...args)
}

onBeforeUnmount(endHold)
</script>
