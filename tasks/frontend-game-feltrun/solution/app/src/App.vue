<template>
  <div class="min-h-screen" style="background-color: var(--color-background);">
    <div class="mx-auto w-full max-w-[1240px] px-4 pb-16">
      <!-- Header -->
      <header class="pt-6 pb-2">
        <h1 class="h-app">FeltRun</h1>
        <p class="copy mt-2">Play Texas hold'em against three computer opponents with distinct play styles</p>
      </header>

      <!-- Mode tabs -->
      <nav class="mt-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Table mode">
        <button
          role="tab"
          :aria-selected="mode === 'tournament' ? 'true' : 'false'"
          class="tab"
          @click="setMode('tournament')"
        >
          Tournament
        </button>
        <button
          role="tab"
          :aria-selected="mode === 'practice' ? 'true' : 'false'"
          class="tab"
          @click="setMode('practice')"
        >
          Practice
        </button>
        <span class="caption ml-2">
          {{ mode === 'tournament'
            ? 'Blinds rise every eight hands and your progress saves in this browser'
            : 'Practice keeps blinds at 5/10 and clears when you switch back' }}
        </span>
      </nav>

      <!-- Top bar -->
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="panel !py-2 !px-4 flex items-center gap-4" style="min-height: 48px;">
          <span class="font-semibold num" style="color: var(--color-accent);">
            Level {{ blinds.level }} — blinds {{ blinds.small }}/{{ blinds.big }}
          </span>
          <span class="caption num">
            {{ inHand ? `Hand ${s.completedHands + 1}` : `Hands played ${s.completedHands}` }}
          </span>
        </div>
        <div class="hidden md:flex flex-wrap gap-2 ml-auto">
          <button class="btn btn-sm" @click="showHistory = !showHistory">
            {{ showHistory ? 'Hide history' : 'Show history' }}
          </button>
          <button class="btn btn-sm" @click="showBadges = !showBadges">
            {{ showBadges ? 'Hide badges' : 'Show badges' }}
          </button>
          <button class="btn btn-sm" @click="requestNewSession">Start new session</button>
        </div>
        <div class="flex md:hidden gap-2 ml-auto">
          <button class="btn btn-sm" @click="openDrawer">Show panels</button>
          <button class="btn btn-sm" @click="requestNewSession">Start new session</button>
        </div>
      </div>

      <!-- Table -->
      <PokerTable class="mt-4" />

      <!-- Status line -->
      <p class="mt-3 text-center min-h-[24px]" aria-live="polite" style="color: var(--color-accent);">
        {{ s.status }}
      </p>

      <!-- Controls -->
      <div class="mt-2 flex flex-col items-center gap-3">
        <BettingControls v-if="isHumanTurn" />

        <template v-if="s.phase === 'idle' || s.phase === 'handOver'">
          <div v-if="human.chips === 0" class="panel max-w-md text-center">
            <p class="mb-3" style="color: #e8ecf4;">
              Your stack is empty. Rebuy resets it to 1,000 chips and adds to the rebuy counter.
            </p>
            <button class="btn btn-primary" @click="rebuy">Rebuy</button>
          </div>
          <button v-else class="btn btn-primary text-lg px-8" @click="dealNextHand">
            {{ s.completedHands === 0 && s.phase === 'idle' ? 'Deal first hand' : 'Deal next hand' }}
          </button>
        </template>
      </div>

      <!-- Desktop panels -->
      <div class="hidden md:grid mt-8 grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <StatsPanel />
        <div class="flex flex-col gap-4">
          <HandHistoryPanel v-if="showHistory" />
          <BadgesPanel v-if="showBadges" />
        </div>
      </div>

      <!-- Mobile drawer: inline collapsible so it never obstructs the table -->
      <div v-if="drawerOpen" class="drawer md:hidden mt-6" role="region" aria-label="Stats, history and badges">
        <div class="flex items-center justify-between mb-3">
          <span class="font-semibold" style="font-size: 18px;">Stats, history and badges</span>
          <button ref="drawerCloseBtn" class="btn btn-sm" @click="drawerOpen = false">Hide panels</button>
        </div>
        <div class="flex flex-col gap-4">
          <StatsPanel />
          <HandHistoryPanel />
          <BadgesPanel />
        </div>
      </div>

      <!-- Collaboration scenario -->
      <CollaborationSection class="mt-8" />
    </div>

    <!-- New session confirmation -->
    <div v-if="confirmOpen" class="overlay" @click.self="cancelNewSession">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="new-session-title">
        <h2 id="new-session-title" class="font-semibold mb-3" style="font-size: 22px;">Start a new session?</h2>
        <p class="mb-5" style="color: #d4dcea;">
          This clears the table and resets chip stacks, stats, hand history and badges.
          Your stack returns to 1,000 chips and blinds return to level 1.
        </p>
        <div class="flex justify-end gap-3">
          <button ref="cancelBtn" class="btn" @click="cancelNewSession">Cancel</button>
          <button class="btn btn-primary" @click="confirmNewSession">Reset session</button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-xs" aria-live="polite" role="status">
      <div v-for="toast in toasts" :key="toast.id" class="toast">
        <p class="font-semibold m-0" style="color: var(--color-primary);">{{ toast.title }}</p>
        <p class="caption m-0">{{ toast.body }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from './stores/game'
import PokerTable from './components/PokerTable.vue'
import BettingControls from './components/BettingControls.vue'
import StatsPanel from './components/StatsPanel.vue'
import HandHistoryPanel from './components/HandHistoryPanel.vue'
import BadgesPanel from './components/BadgesPanel.vue'
import CollaborationSection from './components/CollaborationSection.vue'

const store = useGameStore()
const {
  s, blinds, mode, toasts, confirmOpen, drawerOpen, showHistory, showBadges,
  isHumanTurn, human,
} = storeToRefs(store)
const { setMode, requestNewSession, cancelNewSession, confirmNewSession, dealNextHand, rebuy } = store

const cancelBtn = ref<HTMLButtonElement | null>(null)
const drawerCloseBtn = ref<HTMLButtonElement | null>(null)

const inHand = computed(() => ['preflop', 'flop', 'turn', 'river'].includes(s.value.phase))

function openDrawer() {
  drawerOpen.value = true
}

watch(confirmOpen, async open => {
  if (open) {
    await nextTick()
    cancelBtn.value?.focus()
  }
})

watch(drawerOpen, async open => {
  if (open) {
    await nextTick()
    drawerCloseBtn.value?.focus()
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (confirmOpen.value) {
      cancelNewSession()
    } else if (drawerOpen.value) {
      drawerOpen.value = false
    }
  }
}

onMounted(() => {
  store.initGame()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
