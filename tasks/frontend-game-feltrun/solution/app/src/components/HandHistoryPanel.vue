<template>
  <section class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-3">Hand history</h2>

    <p v-if="s.history.length === 0" class="caption m-0" style="font-size: 15px;">No hands played yet</p>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <button class="btn btn-sm" @click="toggleSelectAll">
          {{ allSelected ? 'Deselect all' : 'Select all' }}
        </button>
        <template v-if="selected.length > 0">
          <span class="caption num" style="font-size: 14px;">{{ selected.length }} selected</span>
          <button class="btn btn-sm" @click="removeSelected">Remove selected</button>
        </template>
      </div>

      <transition-group name="history-list" tag="ul" class="m-0 p-0 flex flex-col gap-2" style="list-style: none; max-height: 420px; overflow-y: auto;">
        <li
          v-for="entry in s.history"
          :key="entry.id"
          class="rounded-[5px] px-3 py-2 history-row"
          :class="{ 'history-new': newIds.has(entry.id) && !prefersReducedMotion }"
          :style="{
            backgroundColor: selected.includes(entry.id) ? '#1a3050' : '#122540',
            border: selected.includes(entry.id) ? '1px solid var(--color-primary)' : '1px solid #3d4c63',
          }"
        >
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2" style="min-height: 24px; cursor: pointer;">
              <input
                type="checkbox"
                :checked="selected.includes(entry.id)"
                :aria-label="`Select hand ${entry.hand}`"
                @change="toggleSelected(entry.id)"
              />
              <span v-if="selected.includes(entry.id)" aria-hidden="true" style="color: var(--color-primary); font-weight: 700;">✓</span>
            </label>
            <button
              class="btn-reset grow text-left flex items-center gap-3"
              :aria-expanded="expanded.has(entry.id) ? 'true' : 'false'"
              :aria-controls="`review-${entry.id}`"
              @click="toggleExpand(entry.id)"
            >
              <span class="num font-semibold" style="font-size: 14px; min-width: 64px;">Hand {{ entry.hand }}</span>
              <span class="grow" style="font-size: 14px;">
                {{ entry.winner }} — <span style="color: var(--color-accent);">{{ entry.result }}</span>
              </span>
              <span class="num font-semibold text-right" style="font-size: 14px; min-width: 88px;">{{ entry.pot }} chips</span>
              <span aria-hidden="true" style="color: var(--color-accent); font-size: 12px;">{{ expanded.has(entry.id) ? '▾' : '▸' }}</span>
            </button>
          </div>

          <!-- Hand review: street-by-street replay plus the winning cards -->
          <div class="row-detail" :class="{ open: expanded.has(entry.id) }">
            <div class="row-detail-inner">
              <div :id="`review-${entry.id}`" class="mt-2 pl-7 flex flex-col gap-2">
                <div v-if="entry.board && entry.board.length" class="flex flex-wrap items-center gap-1">
                  <span class="caption" style="font-size: 12px; margin-right: 4px;">Board</span>
                  <span
                    v-for="code in entry.board"
                    :key="code"
                    class="pcard mini"
                    :class="[isRedCode(code) ? 'red' : 'black', (entry.winCards ?? []).includes(code) ? 'win-card' : '']"
                  >
                    <span class="rank">{{ code[0] }}</span>
                    <span class="suit" aria-hidden="true">{{ code.slice(1) }}</span>
                  </span>
                </div>
                <div v-for="street in (['preflop', 'flop', 'turn', 'river'] as const)" :key="street">
                  <p v-if="actionsByStreet(entry, street).length" class="caption m-0" style="font-size: 13px;">
                    <span style="color: var(--color-accent); font-weight: 600;">{{ street[0].toUpperCase() }}{{ street.slice(1) }}:</span>
                    {{ actionsByStreet(entry, street).join(' · ') }}
                  </p>
                </div>
                <p v-if="!(entry.actions ?? []).length" class="caption m-0" style="font-size: 13px;">No recorded actions for this hand.</p>
              </div>
            </div>
          </div>
        </li>
      </transition-group>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'
import type { HistoryEntry } from '../stores/game'
import { isRed, parseCard } from '../utils/poker'

const store = useGameStore()
const { s } = storeToRefs(store)
const headingId = useId()
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const selected = ref<string[]>([])
const expanded = ref<Set<string>>(new Set())
// Entries that should play the entrance animation: the latest entry on mount
// (so opening the panel onto a just-completed hand still animates it in) and any
// entry prepended while this instance is mounted.
const newIds = ref<Set<string>>(new Set(s.value.history[0] ? [s.value.history[0].id] : []))

let lastLen = s.value.history.length
watch(() => s.value.history.length, (len) => {
  selected.value = selected.value.filter(id => s.value.history.some(entry => entry.id === id))
  if (len > lastLen && s.value.history[0]) newIds.value = new Set([...newIds.value, s.value.history[0].id])
  lastLen = len
})

const allSelected = computed(() =>
  s.value.history.length > 0 && selected.value.length === s.value.history.length,
)

function toggleSelected(id: string) {
  if (selected.value.includes(id)) selected.value = selected.value.filter(x => x !== id)
  else selected.value = [...selected.value, id]
}
function toggleSelectAll() {
  selected.value = allSelected.value ? [] : s.value.history.map(entry => entry.id)
}
function removeSelected() {
  store.removeHistory(selected.value)
  selected.value = []
}
function toggleExpand(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function actionsByStreet(entry: HistoryEntry, street: 'preflop' | 'flop' | 'turn' | 'river'): string[] {
  return (entry.actions ?? [])
    .filter(a => a.street === street)
    .map(a => {
      const name = s.value.players[a.seat]?.name ?? `Seat ${a.seat}`
      const amount = a.action === 'call' || a.action === 'raise' || a.action === 'all-in' ? ` ${a.amount}` : ''
      return `${name} ${a.action}${amount}`
    })
}

function isRedCode(code: string): boolean {
  return isRed(parseCard(code).suit)
}
</script>

<style scoped>
.btn-reset {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: 5px;
}
.btn-reset:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.btn-reset:hover {
  color: #ffffff;
}

.pcard.mini {
  width: 30px;
  height: 42px;
}
.pcard.mini .rank { font-size: 12px; }
.pcard.mini .suit { font-size: 13px; }

.row-detail {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}
.row-detail.open {
  grid-template-rows: 1fr;
}
.row-detail-inner {
  overflow: hidden;
}

@keyframes history-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.history-new {
  /* animation: history-in 0.45s ease-out; let Vue transition group handle it */
}
.history-list-enter-active,
.history-list-leave-active {
  transition: all 0.45s ease;
}
.history-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.history-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
@media (prefers-reduced-motion: reduce) {
  .history-list-enter-active, .history-list-leave-active { transition: none; }
  .history-new { animation: none; }
  .row-detail { transition: none; }
}
</style>
