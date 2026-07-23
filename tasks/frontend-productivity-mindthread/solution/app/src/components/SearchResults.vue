<template>
  <section class="card p-5" aria-label="Search results">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="section-title">Search results</h2>
      <span class="meta-mono">
        {{ totalCount }} {{ totalCount === 1 ? 'match' : 'matches' }} for "{{ query }}"
      </span>
    </div>

    <div v-if="totalCount === 0" class="px-6 py-10 text-center">
      <h3 class="font-heading text-[0.95rem] font-semibold text-ink">
        No matching sparks
      </h3>
      <p class="mx-auto mt-1 max-w-md text-[0.85rem] text-inksoft">
        Nothing contains "{{ query }}". Try a different term, or select Clear to browse
        everything again.
      </p>
    </div>

    <template v-else>
      <div v-if="matches.threads.length > 0" class="mt-4">
        <h3 class="meta-mono font-medium text-inksoft">Matching threads</h3>
        <ul class="mt-2 space-y-2">
          <li v-for="thread in matches.threads" :key="thread.id">
            <button
              type="button"
              class="flex w-full flex-wrap items-center gap-2 rounded-lg border border-linesoft bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-hoverwash focus-ring"
              @click="$emit('open-thread', thread.id)"
            >
              <span class="break-words font-heading text-[0.95rem] font-semibold text-ink">
                <HighlightText :text="thread.title" :query="query" />
              </span>
              <StatusBadge :status="thread.status" />
              <span v-if="thread.archived" class="meta-mono">archived</span>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="matches.sparks.length > 0" class="mt-4">
        <h3 class="meta-mono font-medium text-inksoft">Matching sparks</h3>
        <ul class="mt-2 space-y-2">
          <li
            v-for="spark in matches.sparks"
            :key="spark.id"
            class="rounded-lg border border-linesoft bg-surface p-3"
          >
            <p class="break-words text-[0.95rem] text-ink">
              <HighlightText :text="spark.text" :query="query" />
            </p>
            <p class="mt-1 meta-mono">
              {{ sparkLocation(spark) }} · {{ formatTimestamp(spark.createdAt) }}
            </p>
          </li>
        </ul>
      </div>

      <div v-if="matches.reflections.length > 0" class="mt-4">
        <h3 class="meta-mono font-medium text-inksoft">Matching reflections</h3>
        <ul class="mt-2 space-y-2">
          <li
            v-for="reflection in matches.reflections"
            :key="reflection.id"
            class="rounded-md border-l-2 border-l-primary/40 bg-primary/5 p-3"
          >
            <p class="break-words text-[0.9rem] text-ink">
              <HighlightText :text="reflection.text" :query="query" />
            </p>
            <p class="mt-1 meta-mono">
              {{ reflectionLocation(reflection) }} ·
              {{ formatTimestamp(reflection.createdAt) }}
            </p>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Reflection, Spark } from '../stores/sparkStore'
import { formatTimestamp } from '../utils/time'
import HighlightText from './HighlightText.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  query: string
}>()

defineEmits<{
  (event: 'open-thread', threadId: string): void
}>()

const store = useSparkStore()

const matches = computed(() => store.searchAll(props.query))

const totalCount = computed(
  () =>
    matches.value.sparks.length +
    matches.value.reflections.length +
    matches.value.threads.length,
)

function sparkLocation(spark: Spark): string {
  if (!spark.threadId) return 'Unthreaded'
  const thread = store.getThread(spark.threadId)
  return thread ? `Thread "${thread.title}"` : 'Unthreaded'
}

function reflectionLocation(reflection: Reflection): string {
  const spark = store.getSpark(reflection.sparkId)
  if (!spark) return 'Reflection'
  return `Reflection on a spark · ${sparkLocation(spark)}`
}
</script>
