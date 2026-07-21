<template>
  <section class="panel w-full max-w-2xl" aria-label="Betting controls">
    <p class="caption m-0 mb-3 text-center">
      <template v-if="isHumanTurn">
        Your turn — {{ canCheck ? 'check, raise or go all-in' : `call ${callAmount}, raise, fold or go all-in` }}
      </template>
      <template v-else-if="s.phase === 'handOver'">
        Hand over — deal the next hand to bet again
      </template>
      <template v-else-if="s.players[0].folded">
        You folded this hand — waiting for the next hand
      </template>
      <template v-else-if="s.turnThinking">
        {{ s.turnThinking }} is acting — you can bet when the action reaches you
      </template>
      <template v-else>
        Waiting for the action to reach you
      </template>
    </p>

    <div class="flex flex-wrap justify-center gap-2 mb-4">
      <button class="btn" @click="onFold">Fold</button>
      <button v-if="canCheck" class="btn" @click="onCheck">Check</button>
      <button v-else class="btn num" @click="onCall">Call {{ callAmount }}</button>
      <button class="btn inline-flex items-center gap-1" :disabled="!raiseIsValid" @click="onRaise">
        <PhPokerChip :size="16" weight="fill" aria-hidden="true" />
        Raise
      </button>
      <button class="btn" @click="onAllIn">All-in</button>
    </div>

    <div class="flex flex-wrap items-end justify-center gap-3">
      <button class="btn btn-sm num" @click="setHalfPot">1/2 pot</button>
      <button class="btn btn-sm num" @click="setFullPot">Pot</button>

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
          aria-describedby="raise-hint raise-error-slot"
          @keydown.enter.prevent="onRaise"
        />
      </div>

      <div class="flex flex-col gap-1 grow" style="min-width: 140px; max-width: 260px;">
        <SliderRoot
          v-model="sliderValue"
          class="raise-slider"
          :min="sliderMin"
          :max="human.chips"
          :step="1"
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

    <p id="raise-error-slot" class="m-0 mt-2 text-center min-h-[20px]" role="status" aria-live="polite">
      <span v-if="visibleRaiseError" style="color: var(--color-bad); font-size: 14px;">{{ visibleRaiseError }}</span>
      <span v-else-if="controlMessage" style="color: var(--color-accent); font-size: 14px;">{{ controlMessage }}</span>
    </p>

    <p class="caption m-0 mt-1 text-center" style="font-size: 12px;">
      Shortcuts: F fold · C check/call · R raise · A all-in
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { PhPokerChip } from '@phosphor-icons/vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { useField } from 'vee-validate'
import { z } from 'zod'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s, canCheck, callAmount, minRaiseAdd, human, isHumanTurn, controlMessage } = storeToRefs(store)

const raiseSchema = computed(() =>
  z.number()
    .int('Raise amount must be an integer')
    .min(minRaiseAdd.value, `Minimum raise is ${minRaiseAdd.value}`)
    .max(human.value.chips, `Maximum raise is your stack (${human.value.chips})`),
)

const { value: raiseAmount, errorMessage: raiseError, setValue: setRaiseAmount } = useField<number>('amount', (val: unknown) => {
  const result = raiseSchema.value.safeParse(val)
  if (!result.success) return result.error.issues[0].message
  return true
}, { initialValue: minRaiseAdd.value })
const storeRaiseError = ref('')
const visibleRaiseError = computed(() => storeRaiseError.value || raiseError.value || '')

const raiseIsValid = computed(() => raiseSchema.value.safeParse(raiseAmount.value).success && !storeRaiseError.value)

// The slider range tracks the current raise amount down into the illegal zone
// so a quick-bet that lands below the minimum raise stays visible in the input
// (showing its validation message) instead of being silently clamped up.
const sliderMin = computed(() => {
  const amt = Number(raiseAmount.value)
  const safe = Number.isFinite(amt) ? amt : minRaiseAdd.value
  return Math.max(0, Math.min(minRaiseAdd.value, safe, human.value.chips))
})
const sliderValue = computed({
  get: () => [Math.max(sliderMin.value, Math.min(human.value.chips, Number(raiseAmount.value) || sliderMin.value))],
  set: (values: number[]) => setRaiseAmount(values[0] ?? minRaiseAdd.value),
})

watch([minRaiseAdd, () => s.value.turnIdx, () => s.value.phase], () => {
  storeRaiseError.value = ''
  controlMessage.value = ''
  if (s.value.phase === 'preflop') setRaiseAmount(minRaiseAdd.value)
})

watch(raiseAmount, (v) => {
  storeRaiseError.value = ''
  controlMessage.value = ''
  store.shortcutRaise = Number(v) || 0
}, { immediate: true })

// Quick bets fill the literal pot fraction (clamped only to the stack). When the
// fraction is below the legal minimum raise the input shows that value with its
// inline validation, and the two shortcuts still resolve to distinct numbers.
const halfPotAmount = computed(() => Math.min(Math.floor(s.value.pot / 2), human.value.chips))
const fullPotAmount = computed(() => Math.min(s.value.pot, human.value.chips))

function setHalfPot() {
  storeRaiseError.value = ''
  controlMessage.value = ''
  setRaiseAmount(halfPotAmount.value)
}

function setFullPot() {
  storeRaiseError.value = ''
  controlMessage.value = ''
  setRaiseAmount(fullPotAmount.value)
}

function flash(message: string | null) {
  storeRaiseError.value = ''
  controlMessage.value = message ?? ''
}

function onFold() { flash(store.humanFold()) }
function onCheck() { flash(store.humanCheck()) }
function onCall() { flash(store.humanCall()) }
function onRaise() {
  if (!raiseIsValid.value) return
  storeRaiseError.value = ''
  const error = store.humanRaise(Number(raiseAmount.value))
  if (error) storeRaiseError.value = error
  else controlMessage.value = ''
}
function onAllIn() { flash(store.humanAllIn()) }
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
  transition: background-color 0.15s ease;
}

.raise-slider:hover .raise-slider__track {
  background: rgba(255, 255, 255, 0.32);
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
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.raise-slider__thumb:hover {
  transform: scale(1.12);
  box-shadow: 0 2px 12px rgba(255, 255, 125, 0.4);
}

.raise-slider__thumb:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
