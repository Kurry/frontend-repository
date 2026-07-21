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

    <!-- Session sparkline + win/loss timeline -->
    <div class="mt-3">
      <p class="caption m-0 mb-1" style="font-size: 13px;">Stack over the session</p>
      <svg
        v-if="sparkPoints"
        class="w-full"
        viewBox="0 0 300 48"
        preserveAspectRatio="none"
        role="img"
        :aria-label="`Stack timeline from 1,000 to ${lastStack} over ${s.timeline.length} hands`"
        style="height: 48px;"
      >
        <polyline :points="sparkPoints" fill="none" stroke="var(--color-accent)" stroke-width="2" vector-effect="non-scaling-stroke" />
        <line x1="0" :y1="baselineY" x2="300" :y2="baselineY" stroke="#3d4c63" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" />
      </svg>
      <div v-else class="caption" style="font-size: 13px;">Play a hand to start your stack timeline.</div>

      <div class="flex items-center gap-1 mt-2 flex-wrap" aria-label="Win and loss timeline, newest on the right">
        <span
          v-for="point in s.timeline"
          :key="point.hand"
          class="timeline-dot"
          :class="point.won ? 'dot-win' : 'dot-loss'"
          :title="`Hand ${point.hand}: ${point.won ? 'won' : 'lost'} (${point.delta >= 0 ? '+' : ''}${point.delta})`"
          :aria-label="`Hand ${point.hand} ${point.won ? 'won' : 'lost'}`"
        ></span>
        <span v-if="s.timeline.length === 0" class="caption" style="font-size: 13px;">No results yet</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s, winRate } = storeToRefs(store)
const headingId = useId()

const W = 300
const H = 48
const PAD = 4

const series = computed(() => [1000, ...s.value.timeline.map(p => p.stack)])
const lastStack = computed(() => s.value.timeline.length ? s.value.timeline[s.value.timeline.length - 1].stack : 1000)

const baselineY = computed(() => {
  const vals = series.value
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  if (max === min) return H / 2
  return PAD + (1 - (1000 - min) / (max - min)) * (H - 2 * PAD)
})

const sparkPoints = computed(() => {
  const vals = series.value
  if (vals.length < 2) return ''
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const step = vals.length === 1 ? 0 : (W) / (vals.length - 1)
  return vals
    .map((v, i) => {
      const x = i * step
      const y = PAD + (1 - (v - min) / span) * (H - 2 * PAD)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<style scoped>
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  display: inline-block;
}
.dot-win { background-color: var(--color-accent); }
.dot-loss { background-color: #5c6879; }
</style>
