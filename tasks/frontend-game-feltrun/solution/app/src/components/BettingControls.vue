<template>
  <div class="panel w-full max-w-2xl">
    <p class="caption m-0 mb-3 text-center">
      Your turn — {{ canCheck ? 'check, raise or go all-in' : `call ${callAmount}, raise, fold or go all-in` }}
    </p>

    <div class="flex flex-wrap justify-center gap-2 mb-4">
      <button class="btn" @click="onFold">Fold</button>
      <button v-if="canCheck" class="btn" @click="onCheck">Check</button>
      <button v-else class="btn num" @click="onCall">Call {{ callAmount }}</button>
      <button class="btn inline-flex items-center gap-1" :disabled="!canRaise || !raiseIsValid" @click="onRaise">
        <PhPokerChip :size="16" weight="fill" aria-hidden="true" />
        Raise
      </button>
      <button class="btn" @click="onAllIn">All-in</button>
    </div>

    <div class="flex flex-wrap items-end justify-center gap-3">
      <button class="btn btn-sm num" :disabled="!canRaise || !halfPotValid" @click="setHalfPot">1/2 pot</button>
      <button class="btn btn-sm num" :disabled="!canRaise || !fullPotValid" @click="setFullPot">Pot</button>

      <div class="flex flex-col gap-1" style="min-width: 150px;">
        <label for="raise-amount" class="caption" style="font-size: 13px;">Raise amount</label>
        <input
          id="raise-amount"
          v-model.number="raiseAmount"
          type="number"
          class="field num"
          inputmode="numeric"
          :min="minRaiseAdd"
          :max="human.chips"
          :step="1"
          aria-describedby="raise-hint"
          :disabled="!canRaise"
          @keydown.enter.prevent="onRaise"
          
        />
      </div>

      <div class="flex flex-col gap-1 grow" style="min-width: 140px; max-width: 260px;">
        <SliderRoot
          v-model="sliderValue"
          class="raise-slider"
          :min="Math.min(minRaiseAdd, human.chips)"
          :max="human.chips"
          :step="1"
          :disabled="!canRaise"
          aria-label="Raise amount"
        >
          <SliderTrack class="raise-slider__track">
            <SliderRange class="raise-slider__range" />
          </SliderTrack>
          <SliderThumb class="raise-slider__thumb" aria-label="Raise amount" />
        </SliderRoot>
      </div>
    </div>

    <p id="raise-hint" class="caption m-0 mt-2 text-center num" style="font-size: 12px;">
      Chips to add to the pot — between {{ minRaiseAdd }} and {{ human.chips }}
    </p>
    <p
      v-if="visibleRaiseError"
      role="alert"
      class="m-0 mt-2 text-center"
      style="color: #ff9d9d; font-size: 14px;"
    >
      {{ visibleRaiseError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { PhPokerChip } from '@phosphor-icons/vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s, canCheck, callAmount, minRaiseAdd, human } = storeToRefs(store)


import { useField } from 'vee-validate'
import { z } from 'zod'

// Create a validation schema for the raise amount
const raiseSchema = computed(() => {
  return z.number()
    .int("Raise amount must be an integer")
    .min(minRaiseAdd.value, `Minimum raise is ${minRaiseAdd.value}`)
    .max(human.value.chips, `Maximum raise is your stack (${human.value.chips})`)
})

const { value: raiseAmount, errorMessage: raiseError, setValue: setRaiseAmount } = useField<number>('amount', (val: unknown) => {
  const result = raiseSchema.value.safeParse(val)
  if (!result.success) return result.error.issues[0].message
  return true
}, { initialValue: minRaiseAdd.value })
const storeRaiseError = ref('')
const visibleRaiseError = computed(() => storeRaiseError.value || raiseError.value)

const canRaise = computed(() => human.value.chips > callAmount.value)
const raiseIsValid = computed(() => raiseSchema.value.safeParse(raiseAmount.value).success && !storeRaiseError.value)
const sliderValue = computed({
  get: () => [Number(raiseAmount.value)],
  set: (values: number[]) => setRaiseAmount(values[0] ?? minRaiseAdd.value),
})

watch([minRaiseAdd, () => s.value.turnIdx, () => s.value.phase], () => {
  storeRaiseError.value = ''
  if (raiseAmount.value < minRaiseAdd.value || raiseAmount.value > human.value.chips) {
    setRaiseAmount(minRaiseAdd.value)
  }
})

watch(raiseAmount, () => {
  storeRaiseError.value = ''
})

// True pot fractions (clamped only to the human's stack) so the two shortcuts
// stay distinct; when a fraction falls below the legal minimum raise the
// corresponding button is disabled instead of being silently bumped up to
// the minimum, which used to make both shortcuts collapse to the same value.
const halfPotAmount = computed(() => Math.min(Math.floor(s.value.pot / 2), human.value.chips))
const fullPotAmount = computed(() => Math.min(s.value.pot, human.value.chips))
const halfPotValid = computed(() => halfPotAmount.value >= minRaiseAdd.value)
const fullPotValid = computed(() => fullPotAmount.value >= minRaiseAdd.value)

function setHalfPot() {
  if (!halfPotValid.value) return
  storeRaiseError.value = ''
  setRaiseAmount(halfPotAmount.value)
}

function setFullPot() {
  if (!fullPotValid.value) return
  storeRaiseError.value = ''
  setRaiseAmount(fullPotAmount.value)
}

function onFold() {
  // error cleared automatically by validation
  store.humanFold()
}

function onCheck() {
  // error cleared automatically by validation
  store.humanCheck()
}

function onCall() {
  // error cleared automatically by validation
  store.humanCall()
}

function onRaise() {
  if (!canRaise.value || !raiseIsValid.value) return
  storeRaiseError.value = ''
  const error = store.humanRaise(Number(raiseAmount.value))
  if (error) storeRaiseError.value = error
}

function onAllIn() {
  // error cleared automatically by validation
  store.humanAllIn()
}
</script>

<style scoped>
.raise-slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 24px;
  touch-action: none;
  user-select: none;
}

.raise-slider__track {
  position: relative;
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.raise-slider__range {
  position: absolute;
  height: 100%;
  background: #d6b45f;
}

.raise-slider__thumb {
  display: block;
  width: 18px;
  height: 18px;
  border: 2px solid #f7e2a0;
  border-radius: 999px;
  background: #8f6a1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.raise-slider__thumb:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
