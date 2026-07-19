<template>
  <section class="card p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="section-title">Virtualized items</h2>
      <button type="button" class="btn-secondary" @click="loadItems">Load 10,000 Items</button>
    </div>

    <p v-if="items.length === 0" class="mt-2 text-[0.85rem] text-inksoft">
      Select Load 10,000 Items to generate a deterministic sample collection and browse it in a
      virtualized list that renders only the visible rows.
    </p>

    <div v-show="items.length > 0">
      <div class="mt-3">
        <label for="virtual-filter" class="field-label">Filter items</label>
        <input
          id="virtual-filter"
          v-model="filterText"
          type="text"
          class="input-field mt-1"
          placeholder="Type to filter by text or category"
          autocomplete="off"
          @keydown.escape="filterText = ''"
          @keydown.enter.prevent
        />
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="meta-mono">
          Showing {{ filteredItems.length.toLocaleString('en-US') }} of
          {{ items.length.toLocaleString('en-US') }} items
        </span>
        <span class="meta-mono">Rendered item count: {{ renderedCount }}</span>
        <template v-if="selectedItem">
          <span class="meta-mono text-ink">1 item selected: {{ selectedItem.label }}</span>
          <button type="button" class="btn-quiet" @click="clearSelection">Clear Selection</button>
        </template>
      </div>

      <div
        ref="scrollRef"
        tabindex="0"
        role="listbox"
        aria-label="Virtualized items"
        :aria-activedescendant="activeDescendant"
        class="mt-3 h-96 overflow-auto rounded-md border border-line bg-surface focus-ring"
        @keydown="onKeydown"
      >
        <div
          v-if="items.length > 0 && filteredItems.length === 0"
          class="p-6 text-center text-[0.85rem] text-inksoft"
        >
          No matching items. Clear the filter to see all 10,000 items.
        </div>
        <div
          v-else
          :style="{ height: `${totalSize}px`, position: 'relative', width: '100%' }"
        >
          <div
            v-for="row in virtualRows"
            :id="`vitem-${filteredItems[row.index].id}`"
            :key="filteredItems[row.index].id"
            role="option"
            :aria-selected="selectedId === filteredItems[row.index].id"
            class="absolute left-0 top-0 flex w-full cursor-pointer items-center gap-3 border-b border-linesoft px-4 transition-colors"
            :class="rowClass(filteredItems[row.index].id)"
            :style="{ height: `${row.size}px`, transform: `translateY(${row.start}px)` }"
            @click="toggleSelect(filteredItems[row.index].id)"
          >
            <svg
              v-if="selectedId === filteredItems[row.index].id"
              viewBox="0 0 24 24"
              class="h-4 w-4 flex-shrink-0 text-primary"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span class="min-w-0 flex-1 text-[0.85rem] text-ink">
              {{ filteredItems[row.index].label }}
            </span>
            <span
              class="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 font-mono text-[0.72rem] leading-none text-primary"
            >
              {{ filteredItems[row.index].category }}
            </span>
          </div>
        </div>
      </div>
      <p class="mt-2 text-[0.85rem] text-inksoft">
        Use the arrow keys to move through the list and press Enter to select the highlighted
        item.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { generateSampleItems } from '../utils/sampleItems'
import type { SampleItem } from '../utils/sampleItems'
import { showToast } from '../utils/toast'

const items = ref<SampleItem[]>([])
const filterText = ref('')
const selectedId = ref<string | null>(null)
const activeId = ref<string | null>(null)
const scrollRef = ref<HTMLElement | null>(null)

const filteredItems = computed(() => {
  const query = filterText.value.trim().toLowerCase()
  if (!query) return items.value
  return items.value.filter(
    item =>
      item.label.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query),
  )
})

const virtualizer = useVirtualizer(
  computed(() => ({
    count: filteredItems.value.length,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => 48,
    overscan: 8,
  })),
)

const virtualRows = computed(() => {
  const instance = virtualizer.value
  if (!instance) return []
  return instance
    .getVirtualItems()
    .filter(row => row.index >= 0 && row.index < filteredItems.value.length)
})
const totalSize = computed(() => virtualizer.value?.getTotalSize() ?? 0)
const renderedCount = computed(() => virtualRows.value.length)

const selectedItem = computed(() =>
  selectedId.value ? items.value.find(item => item.id === selectedId.value) ?? null : null,
)

const activeDescendant = computed(() => {
  if (!activeId.value) return undefined
  const visible = filteredItems.value.some(item => item.id === activeId.value)
  return visible ? `vitem-${activeId.value}` : undefined
})

function loadItems() {
  if (items.value.length > 0) {
    showToast('Sample items are already loaded', 'info')
    return
  }
  items.value = generateSampleItems()
  showToast('10,000 sample items loaded', 'success')
  nextTick(() => virtualizer.value?.measure())
}

function rowClass(id: string): string {
  const classes: string[] = []
  if (selectedId.value === id) {
    classes.push('border-l-4 border-l-primary bg-primary/10')
  } else {
    classes.push('hover:bg-hoverwash')
  }
  if (activeId.value === id) {
    classes.push('ring-2 ring-inset ring-primary')
  }
  return classes.join(' ')
}

function toggleSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
  activeId.value = id
}

function clearSelection() {
  selectedId.value = null
}

function currentIndex(): number {
  const list = filteredItems.value
  if (activeId.value) {
    const index = list.findIndex(item => item.id === activeId.value)
    if (index !== -1) return index
  }
  if (selectedId.value) {
    const index = list.findIndex(item => item.id === selectedId.value)
    if (index !== -1) return index
  }
  return -1
}

function onKeydown(event: KeyboardEvent) {
  const list = filteredItems.value
  if (list.length === 0) return
  const current = currentIndex()
  let next = current
  if (event.key === 'ArrowDown') {
    next = Math.min(list.length - 1, current + 1)
  } else if (event.key === 'ArrowUp') {
    next = current <= 0 ? 0 : current - 1
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = list.length - 1
  } else if (event.key === 'Enter' || event.key === ' ') {
    if (current >= 0) {
      event.preventDefault()
      toggleSelect(list[current].id)
    }
    return
  } else {
    return
  }
  event.preventDefault()
  activeId.value = list[next].id
  virtualizer.value?.scrollToIndex(next, { align: 'auto' })
}
</script>
