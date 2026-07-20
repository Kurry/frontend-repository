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

      <ul class="m-0 p-0 flex flex-col gap-2" style="list-style: none; max-height: 320px; overflow-y: auto;">
        <li
          v-for="entry in s.history"
          :key="entry.id"
          v-motion
          :initial="prefersReducedMotion || initialIds.has(entry.id) ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }"
          :enter="{ opacity: 1, y: 0 }"
          class="flex items-center gap-3 rounded-[5px] px-3 py-2"
          :style="{
            backgroundColor: selected.includes(entry.id) ? '#1a3050' : '#122540',
            border: selected.includes(entry.id) ? '1px solid var(--color-primary)' : '1px solid #3d4c63',
          }"
        >
          <label class="flex items-center gap-2" style="min-height: 24px; cursor: pointer;">
            <input
              type="checkbox"
              :checked="selected.includes(entry.id)"
              :aria-label="`Select hand ${entry.hand}`"
              @change="toggleSelected(entry.id)"
            />
            <span v-if="selected.includes(entry.id)" aria-hidden="true" style="color: var(--color-primary); font-weight: 700;">✓</span>
          </label>
          <span class="num font-semibold" style="font-size: 14px; min-width: 64px;">Hand {{ entry.hand }}</span>
          <span class="grow" style="font-size: 14px;">
            {{ entry.winner }} — <span style="color: var(--color-accent);">{{ entry.result }}</span>
          </span>
          <span class="num font-semibold text-right" style="font-size: 14px; min-width: 88px;">{{ entry.pot }} chips</span>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { s } = storeToRefs(store)
const headingId = useId()
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const selected = ref<string[]>([])

// Hands already in the store when this panel instance mounts render
// statically — that covers both a fresh load and hands that completed while
// the panel was hidden (toggled via v-if), since those are equally "already
// there" from this mount's point of view. Only a hand appended to history
// while this instance stays mounted is genuinely new and gets the v-motion
// entrance animation.
const initialIds = new Set(s.value.history.map(entry => entry.id))

watch(() => s.value.history.length, () => {
  selected.value = selected.value.filter(id => s.value.history.some(entry => entry.id === id))
})

const allSelected = computed(() =>
  s.value.history.length > 0 && selected.value.length === s.value.history.length,
)

function toggleSelected(id: string) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(x => x !== id)
  } else {
    selected.value = [...selected.value, id]
  }
}

function toggleSelectAll() {
  selected.value = allSelected.value ? [] : s.value.history.map(entry => entry.id)
}

function removeSelected() {
  store.removeHistory(selected.value)
  selected.value = []
}
</script>
