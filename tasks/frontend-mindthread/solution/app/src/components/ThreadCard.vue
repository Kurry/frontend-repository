<template>
  <article
    class="card border-l-4 border-l-primary p-4 transition-shadow hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="min-w-0 flex-1 rounded-md text-left focus-ring"
        @click="$emit('open')"
      >
        <h3
          class="break-words font-heading text-[1.05rem] font-semibold text-ink transition-colors hover:text-primary"
        >
          <HighlightText :text="thread.title" :query="query" />
        </h3>
      </button>
      <StatusBadge :status="thread.status" />
    </div>
    <p class="mt-2 meta-mono">
      {{ sparkCountLabel }} · updated {{ relativeUpdated }}
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="btn-secondary"
        :aria-pressed="thread.pinned"
        @click="$emit('toggle-pin')"
      >
        {{ thread.pinned ? 'Unpin' : 'Pin' }}
      </button>
      <button type="button" class="btn-secondary" @click="$emit('archive')">Archive</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Thread } from '../stores/sparkStore'
import { formatRelative, now } from '../utils/time'
import HighlightText from './HighlightText.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  thread: Thread
  query?: string
}>()

defineEmits<{
  (event: 'open'): void
  (event: 'toggle-pin'): void
  (event: 'archive'): void
}>()

const store = useSparkStore()

const sparkCountLabel = computed(() => {
  const count = store.threadStats(props.thread.id).sparkCount
  return `${count} ${count === 1 ? 'spark' : 'sparks'}`
})

const relativeUpdated = computed(() =>
  formatRelative(store.threadLastActivity(props.thread.id), now.value),
)
</script>
