<template>
  <section class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-3">Session stats</h2>
    <dl class="m-0 grid gap-2" style="grid-template-columns: 1fr auto;">
      <dt class="caption" style="font-size: 15px;">Hands played</dt>
      <dd class="m-0 num font-semibold text-right" style="font-size: 15px;">{{ s.completedHands }}</dd>

      <dt class="caption" style="font-size: 15px;">Hands won</dt>
      <dd class="m-0 num font-semibold text-right" style="font-size: 15px; color: var(--color-accent);">{{ s.handsWon }}</dd>

      <dt class="caption" style="font-size: 15px;">Win rate</dt>
      <dd class="m-0 num font-semibold text-right" style="font-size: 15px; color: var(--color-accent);">{{ winRate }}%</dd>

      <dt class="caption" style="font-size: 15px;">Biggest pot</dt>
      <dd class="m-0 num font-semibold text-right" style="font-size: 15px;">{{ s.biggestPot }}</dd>

      <dt class="caption" style="font-size: 15px;">Rebuys</dt>
      <dd class="m-0 num font-semibold text-right" style="font-size: 15px;">{{ s.rebuys }}</dd>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s, winRate } = storeToRefs(store)
const headingId = useId()
</script>
