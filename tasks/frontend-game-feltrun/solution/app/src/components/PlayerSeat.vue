<template>
  <div
    class="seat"
    :class="{
      'seat-human': player.isHuman,
      'seat-active pulse-ring': isTurn,
      'seat-folded': player.folded,
    }"
  >
    <div class="flex items-center gap-2">
      <span class="font-semibold" :style="{ color: player.isHuman ? 'var(--color-primary)' : '#e8ecf4', fontSize: '14px' }">
        {{ player.name }}
      </span>
      <span
        v-if="isDealer"
        class="num"
        aria-label="Dealer"
        style="font-size: 11px; font-weight: 700; color: #10141c; background-color: var(--color-accent); border-radius: 5px; padding: 0 6px; line-height: 18px;"
      >D</span>
    </div>

    <!-- Play-style badge: color plus a distinct shape icon -->
    <span v-if="player.style" class="style-badge" :class="styleClass">
      <svg v-if="player.style === 'Aggressive'" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
        <polygon points="5,0 10,10 0,10" fill="currentColor" />
      </svg>
      <svg v-else-if="player.style === 'Tight'" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="5" fill="currentColor" />
      </svg>
      <svg v-else aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
        <polygon points="5,0 10,5 5,10 0,5" fill="currentColor" />
      </svg>
      {{ player.style }}
    </span>

    <!-- Cards -->
    <div class="flex gap-1 items-center" style="min-height: 52px;">
      <template v-if="player.hole.length === 2 && cardsVisible">
        <div
          v-for="card in player.hole"
          :key="cardKey(card)"
          class="pcard"
          :class="[isRed(card.suit) ? 'red' : 'black', isWinCard(card) ? 'win-card' : '']"
        >
          <span class="rank">{{ card.rank }}</span>
          <span class="suit" aria-hidden="true">{{ card.suit }}</span>
        </div>
      </template>
      <template v-else-if="player.hole.length === 2 && !player.folded">
        <div class="pcard-back" role="img" aria-label="Face-down card"></div>
        <div class="pcard-back" role="img" aria-label="Face-down card"></div>
      </template>
      <span v-else class="caption">No cards</span>
    </div>

    <!-- Winner tag -->
    <span
      v-if="isWinner"
      class="num font-semibold"
      style="color: #10141c; background-color: var(--color-primary); border-radius: 5px; padding: 2px 8px; font-size: 12px;"
    >
      Winner — {{ s.winLabel }}
    </span>

    <!-- Chips and state -->
    <div class="num font-semibold" style="color: var(--color-accent); font-size: 14px;">
      Stack {{ player.chips.toLocaleString('en-US') }}
    </div>
    <div v-if="player.bet > 0" class="num" style="color: var(--color-accent); font-size: 12px;">Bet {{ player.bet }}</div>
    <div v-if="player.folded" style="color: #ff9d9d; font-size: 12px; font-weight: 600;">Folded</div>
    <div v-else-if="player.allIn" style="color: var(--color-accent); font-size: 12px; font-weight: 600;">All-in</div>

    <!-- Equity meter (human only) -->
    <div v-if="player.isHuman && s.equity !== null && !player.folded" class="w-full mt-1" style="min-width: 96px;">
      <div class="flex items-center justify-between gap-2">
        <span class="caption" style="font-size: 12px;">Equity</span>
        <span
          class="equity-value num font-bold"
          :class="{ 'equity-changed': flash }"
          style="color: var(--color-accent); font-size: 14px;"
        >{{ displayEquity.toFixed(1) }}%</span>
      </div>
      <div class="equity-bar" aria-hidden="true">
        <div class="equity-fill" :style="{ width: equityWidth }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'
import { cardKey, isRed } from '../utils/poker'
import type { Card } from '../utils/poker'
import type { Player } from '../stores/game'

const props = defineProps<{ player: Player }>()

const store = useGameStore()
const { s } = storeToRefs(store)

const isTurn = computed(() =>
  ['preflop', 'flop', 'turn', 'river'].includes(s.value.phase) &&
  s.value.players[s.value.turnIdx]?.id === props.player.id &&
  !props.player.folded && !props.player.allIn,
)
const isDealer = computed(() => s.value.dealerIdx === props.player.id && s.value.phase !== 'idle')
const cardsVisible = computed(() => props.player.isHuman || (s.value.revealed && !props.player.folded))
const styleClass = computed(() => {
  switch (props.player.style) {
    case 'Aggressive':
      return 'style-aggressive'
    case 'Tight':
      return 'style-tight'
    case 'Bluffer':
      return 'style-bluffer'
    default:
      return ''
  }
})
const isWinner = computed(() => s.value.phase === 'handOver' && s.value.winnerIds.includes(props.player.id) && !!s.value.winLabel)

function isWinCard(card: Card): boolean {
  return s.value.phase === 'handOver' && s.value.winCardKeys.includes(cardKey(card))
}

// Animated equity display: tweens between values so changes never snap.
import confetti from 'canvas-confetti'

const displayEquity = ref(0)
const equityWidth = computed(() => `${Math.min(100, Math.max(0, displayEquity.value))}%`)
const flash = ref(false)
let flashTimer = 0
let equityFrame = 0

function animateEquityValue(target: number) {
  window.cancelAnimationFrame(equityFrame)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayEquity.value = target
    return
  }
  const initial = displayEquity.value
  const startedAt = performance.now()
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / 700)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayEquity.value = initial + (target - initial) * eased
    if (progress < 1) equityFrame = window.requestAnimationFrame(tick)
  }
  equityFrame = window.requestAnimationFrame(tick)
}

watch(
  () => (props.player.isHuman ? s.value.equity : null),
  (next) => {
    if (next === null || next === undefined) return
    animateEquityValue(next)
    flash.value = false
    window.clearTimeout(flashTimer)
    flashTimer = window.setTimeout(() => {
      flash.value = true
      flashTimer = window.setTimeout(() => { flash.value = false }, 750)
    }, 10)
  },
  { immediate: true },
)

watch(isWinner, (winner) => {
  if (
    winner &&
    props.player.isHuman &&
    s.value.winLabel &&
    s.value.winLabel !== 'Uncontested' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(equityFrame)
  window.clearTimeout(flashTimer)
})
</script>
