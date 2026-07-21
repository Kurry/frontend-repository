<template>
  <div class="min-h-screen" style="background-color: var(--color-background);">
    <div class="mx-auto w-full max-w-[1240px] px-4 pb-16">
      <!-- Header -->
      <header class="pt-6 pb-2">
        <h1 class="h-app">FeltRun</h1>
        <p class="copy mt-2">Play Texas hold'em against three computer opponents with distinct play styles</p>
      </header>

      <main aria-label="Poker table and session workspace">
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
            <button class="btn btn-sm" @click="showExport = !showExport">
              {{ showExport ? 'Hide export' : 'Show export' }}
            </button>
            <button class="btn btn-sm" @click="requestNewSession">Start new session</button>
          </div>
          <div class="flex md:hidden flex-wrap gap-2 ml-auto">
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
          <BettingControls v-if="controlsVisible" />

          <!-- Coachmark for first-time players -->
          <div
            v-if="showCoach"
            class="coachmark panel max-w-md text-center"
            role="note"
            aria-label="How to start"
          >
            <p class="font-semibold m-0 mb-1" style="color: var(--color-primary); font-size: 16px;">New to FeltRun?</p>
            <p class="caption m-0" style="font-size: 14px;">
              Deal your first hand to seat four players at 1,000 chips each. Use the betting controls or the
              keyboard — F folds, C checks or calls, R raises the slider amount, A goes all-in.
            </p>
            <button class="btn btn-sm mt-2" @click="dismissCoach">Got it</button>
          </div>

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

        <!-- Play-by-play feed -->
        <section
          v-if="s.feed.length > 0"
          class="mt-4 panel"
          aria-label="Play-by-play"
          aria-live="polite"
        >
          <h2 class="font-semibold mb-2" style="font-size: 15px; color: var(--color-ink);">Play-by-play</h2>
          <ul class="m-0 p-0 flex flex-col gap-1" style="list-style: none;">
            <li
              v-for="(line, i) in s.feed"
              :key="s.historySeq + '-' + i"
              class="caption num"
              :class="{ 'feed-new': i === 0 && !prefersReducedMotion }"
              style="font-size: 13px;"
            >{{ line }}</li>
          </ul>
        </section>

        <!-- Desktop panels -->
        <div class="hidden md:grid mt-8 grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div class="flex flex-col gap-4">
            <StatsPanel />
            <ExportPanel v-if="showExport" />
          </div>
          <div class="flex flex-col gap-4">
            <HandHistoryPanel v-if="showHistory" />
            <BadgesPanel v-if="showBadges" />
          </div>
        </div>

        <!-- Mobile drawer: smooth in-flow collapsible so it never obstructs the table -->
        <div class="drawer-wrap md:hidden mt-6" :class="{ 'is-open': drawerOpen }">
          <div class="drawer-inner">
            <div class="drawer">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold" style="font-size: 18px;">Stats, history, badges and export</span>
                <button ref="drawerCloseBtn" class="btn btn-sm" @click="drawerOpen = false">Hide panels</button>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex flex-wrap gap-2" aria-label="Panel visibility">
                  <button class="btn btn-sm" @click="showHistory = !showHistory">
                    {{ showHistory ? 'Hide history' : 'Show history' }}
                  </button>
                  <button class="btn btn-sm" @click="showBadges = !showBadges">
                    {{ showBadges ? 'Hide badges' : 'Show badges' }}
                  </button>
                  <button class="btn btn-sm" @click="showExport = !showExport">
                    {{ showExport ? 'Hide export' : 'Show export' }}
                  </button>
                </div>
                <StatsPanel />
                <HandHistoryPanel v-if="showHistory" />
                <BadgesPanel v-if="showBadges" />
                <ExportPanel v-if="showExport" />
              </div>
            </div>
          </div>
        </div>

        <!-- Collaboration scenario -->
        <CollaborationSection class="mt-8" />
      </main>
    </div>

    <!-- New session confirmation (Reka dialog: traps focus, restores on close) -->
    <DialogRoot v-model:open="confirmOpen">
      <DialogPortal>
        <DialogOverlay class="overlay" />
        <DialogContent class="dialog" aria-labelledby="new-session-title" aria-describedby="new-session-desc">
          <DialogTitle id="new-session-title" class="font-semibold mb-3" style="font-size: 22px;">
            Start a new session?
          </DialogTitle>
          <DialogDescription id="new-session-desc" class="mb-5" style="color: #d4dcea;">
            This clears the table and resets chip stacks, stats, hand history and badges.
            Your stack returns to 1,000 chips and blinds return to level 1. This cannot be undone.
          </DialogDescription>
          <div class="flex justify-end gap-3">
            <button ref="cancelBtn" class="btn" @click="cancelNewSession">Cancel</button>
            <button class="btn btn-primary" @click="confirmNewSession">Reset session</button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Toasts (polite live region) -->
    <section class="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-xs pointer-events-none" aria-label="Notifications">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast pointer-events-auto"
        role="status"
        aria-live="polite"
      >
        <p class="font-semibold m-0" style="color: var(--color-primary);">{{ toast.title }}</p>
        <p class="caption m-0">{{ toast.body }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from 'reka-ui'
import { useGameStore } from './stores/game'
import PokerTable from './components/PokerTable.vue'
import BettingControls from './components/BettingControls.vue'
import StatsPanel from './components/StatsPanel.vue'
import HandHistoryPanel from './components/HandHistoryPanel.vue'
import BadgesPanel from './components/BadgesPanel.vue'
import ExportPanel from './components/ExportPanel.vue'
import CollaborationSection from './components/CollaborationSection.vue'

const store = useGameStore()
const {
  s, blinds, mode, toasts, confirmOpen, drawerOpen, showHistory, showBadges, showExport,
  isHumanTurn, human, canCheck,
} = storeToRefs(store)
const { setMode, requestNewSession, cancelNewSession, confirmNewSession, dealNextHand, rebuy, dismissCoach } = store

const cancelBtn = ref<HTMLButtonElement | null>(null)
const drawerCloseBtn = ref<HTMLButtonElement | null>(null)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const inHand = computed(() => ['preflop', 'flop', 'turn', 'river'].includes(s.value.phase))
const controlsVisible = computed(
  () => s.value.phase !== 'idle' && !(s.value.phase === 'handOver' && human.value.chips === 0),
)
const showCoach = computed(
  () => s.value.phase === 'idle' && s.value.completedHands === 0 && !s.value.coachDismissed,
)

function openDrawer() {
  drawerOpen.value = true
}

watch(drawerOpen, async open => {
  if (open) {
    await nextTick()
    drawerCloseBtn.value?.focus()
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (drawerOpen.value) drawerOpen.value = false
    return
  }
  if (confirmOpen.value) return
  const target = event.target as HTMLElement | null
  if (target) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const phase = s.value.phase
  const active = phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river' || phase === 'handOver'
  if (!active) return
  const key = event.key.toLowerCase()
  let err: string | null = null
  if (key === 'f') err = store.humanFold()
  else if (key === 'c') err = canCheck.value ? store.humanCheck() : store.humanCall()
  else if (key === 'r') err = store.humanRaise(store.shortcutRaise || store.minRaiseAdd)
  else if (key === 'a') err = store.humanAllIn()
  else return
  event.preventDefault()
  store.controlMessage = err || ''
}

onMounted(() => {
  store.initGame()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
