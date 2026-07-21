<template>
  <section ref="sectionEl" id="poker-table" class="felt relative px-3 py-5 md:px-8 md:py-7" aria-label="Poker table">
    <div ref="chipLayer" class="chip-layer" aria-hidden="true"></div>

    <!-- Opponent seats -->
    <div class="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:justify-center md:gap-8">
      <PlayerSeat v-for="p in opponents" :key="p.id" :player="p" />
    </div>

    <!-- Board -->
    <div class="my-5 md:my-7 flex flex-col items-center gap-3">
      <div ref="potEl" class="panel !py-2 !px-5 inline-flex items-center gap-3" style="background-color: rgba(4, 10, 18, 0.72);">
        <span class="font-semibold num" style="color: var(--color-accent); font-size: 17px;">Pot {{ s.pot }}</span>
        <span v-if="s.phase === 'handOver' && s.winLabel" class="num" style="color: var(--color-accent); font-size: 14px;">
          {{ winnerNames }} — {{ s.winLabel }}
        </span>
      </div>

      <div v-if="s.board.length > 0" class="flex items-center gap-2">
        <div
          v-for="card in s.board"
          :key="cardKey(card)"
          class="pcard"
          :class="[isRed(card.suit) ? 'red' : 'black', isWinCard(card) ? 'win-card' : '']"
        >
          <span class="rank">{{ card.rank }}</span>
          <span class="suit" aria-hidden="true">{{ card.suit }}</span>
        </div>
      </div>
      <div v-else-if="inHand" class="caption">Community cards arrive on the flop</div>

      <!-- Idle prompt -->
      <div v-if="s.phase === 'idle' && s.completedHands === 0" class="panel text-center max-w-xl" style="background-color: rgba(4, 10, 18, 0.8);">
        <p class="m-0" aria-hidden="true" style="color: var(--color-primary); font-size: 22px; letter-spacing: 4px;">♠ ♥ ♦ ♣</p>
        <p class="copy m-0 mt-2">Select Deal first hand to start your session</p>
      </div>
    </div>

    <!-- Human seat -->
    <div class="flex justify-center">
      <PlayerSeat :player="humanPlayer" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'
import { cardKey, isRed } from '../utils/poker'
import type { Card } from '../utils/poker'
import PlayerSeat from './PlayerSeat.vue'

const store = useGameStore()
const { s } = storeToRefs(store)

const opponents = computed(() => s.value.players.filter(p => !p.isHuman))
const humanPlayer = computed(() => s.value.players[0])
const inHand = computed(() => ['preflop', 'flop', 'turn', 'river'].includes(s.value.phase))
const winnerNames = computed(() => s.value.winnerIds.map(id => s.value.players[id].name).join(' and '))

function isWinCard(card: Card): boolean {
  return s.value.phase === 'handOver' && s.value.winCardKeys.includes(cardKey(card))
}

const sectionEl = ref<HTMLElement | null>(null)
const potEl = ref<HTMLElement | null>(null)
const chipLayer = ref<HTMLElement | null>(null)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Chip-fly: whenever chips enter the pot, animate a chip token from the acting
// seat into the pot — a deliberate micro-interaction beyond the equity tween.
watch(() => s.value.potPulse, async () => {
  if (prefersReducedMotion) return
  await nextTick()
  const actor = s.value.lastActor
  const root = sectionEl.value
  const pot = potEl.value
  const layer = chipLayer.value
  if (!root || !pot || !layer || actor < 0) return
  const seat = root.querySelector<HTMLElement>(`[data-seat-id="${actor}"]`)
  if (!seat) return
  const rb = root.getBoundingClientRect()
  const sb = seat.getBoundingClientRect()
  const pb = pot.getBoundingClientRect()
  const fromX = sb.left - rb.left + sb.width / 2
  const fromY = sb.top - rb.top + sb.height / 2
  const dx = pb.left - rb.left + pb.width / 2 - fromX
  const dy = pb.top - rb.top + pb.height / 2 - fromY
  const chip = document.createElement('span')
  chip.className = 'chip-fly'
  chip.style.left = `${fromX}px`
  chip.style.top = `${fromY}px`
  layer.appendChild(chip)
  const anim = chip.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.8)`, opacity: 1 },
    ],
    { duration: 520, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
  )
  anim.onfinish = () => chip.remove()
})
</script>
