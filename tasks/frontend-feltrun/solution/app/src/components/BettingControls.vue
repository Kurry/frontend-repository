<template>
  <div class="panel w-full max-w-2xl">
    <p class="caption m-0 mb-3 text-center">
      Your turn — {{ canCheck ? 'check, raise or go all-in' : `call ${callAmount}, raise, fold or go all-in` }}
    </p>

    <div class="flex flex-wrap justify-center gap-2 mb-4">
      <button class="btn" @click="onFold">Fold</button>
      <button v-if="canCheck" class="btn" @click="onCheck">Check</button>
      <button v-else class="btn num" @click="onCall">Call {{ callAmount }}</button>
      <button class="btn" :disabled="!canRaise" @click="onRaise">Raise</button>
      <button class="btn" @click="onAllIn">All-in</button>
    </div>

    <div class="flex flex-wrap items-end justify-center gap-3">
      <button class="btn btn-sm num" :disabled="!canRaise" @click="setHalfPot">1/2 pot</button>
      <button class="btn btn-sm num" :disabled="!canRaise" @click="setFullPot">Pot</button>

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
          @input="raiseError = ''"
        />
      </div>

      <div class="flex flex-col gap-1 grow" style="min-width: 140px; max-width: 260px;">
        <input
          v-model.number="raiseAmount"
          type="range"
          aria-label="Raise amount"
          :min="Math.min(minRaiseAdd, human.chips)"
          :max="human.chips"
          :step="1"
          :disabled="!canRaise"
          @input="raiseError = ''"
        />
      </div>
    </div>

    <p id="raise-hint" class="caption m-0 mt-2 text-center num" style="font-size: 12px;">
      Chips to add to the pot — between {{ minRaiseAdd }} and {{ human.chips }}
    </p>
    <p
      v-if="raiseError"
      role="alert"
      class="m-0 mt-2 text-center"
      style="color: #ff9d9d; font-size: 14px;"
    >
      {{ raiseError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s, canCheck, callAmount, minRaiseAdd, human } = storeToRefs(store)

const raiseAmount = ref(minRaiseAdd.value)
const raiseError = ref('')

const canRaise = computed(() => human.value.chips > callAmount.value)

watch([minRaiseAdd, () => s.value.turnIdx, () => s.value.phase], () => {
  if (raiseAmount.value < minRaiseAdd.value || raiseAmount.value > human.value.chips) {
    raiseAmount.value = minRaiseAdd.value
  }
})

function setHalfPot() {
  raiseAmount.value = Math.min(Math.max(Math.floor(s.value.pot / 2), 1), human.value.chips)
  raiseError.value = ''
}

function setFullPot() {
  raiseAmount.value = Math.min(Math.max(s.value.pot, 1), human.value.chips)
  raiseError.value = ''
}

function onFold() {
  raiseError.value = ''
  store.humanFold()
}

function onCheck() {
  raiseError.value = ''
  store.humanCheck()
}

function onCall() {
  raiseError.value = ''
  store.humanCall()
}

function onRaise() {
  if (!canRaise.value) return
  const error = store.humanRaise(Number(raiseAmount.value))
  raiseError.value = error || ''
}

function onAllIn() {
  raiseError.value = ''
  store.humanAllIn()
}
</script>
