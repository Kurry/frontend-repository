<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <header>
      <h2 class="font-heading text-[1.35rem] font-semibold text-ink">Today</h2>
      <p class="mt-1 text-[0.9rem] text-inksoft">
        Every spark you capture today appears here, grouped by the thread it belongs to.
      </p>
    </header>

    <section v-if="todaySparks.length === 0" class="card">
      <EmptyState
        title="No sparks captured yet today"
        body="Capture a spark from the Home view and it appears in today's digest right away."
      >
        <template #icon>
          <svg
            viewBox="0 0 24 24"
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
          </svg>
        </template>
      </EmptyState>
    </section>

    <template v-else>
      <p class="meta-mono">
        {{ todaySparks.length }} {{ todaySparks.length === 1 ? 'spark' : 'sparks' }} captured
        today
      </p>

      <section v-if="unthreadedToday.length > 0" class="card p-5">
        <h3 class="section-title">Unthreaded</h3>
        <ul class="mt-3 space-y-2">
          <li
            v-for="spark in unthreadedToday"
            :key="spark.id"
            class="rounded-lg border border-linesoft p-4"
          >
            <p class="break-words text-[0.95rem] text-ink">{{ spark.text }}</p>
            <p class="mt-1 meta-mono">Captured {{ formatTimestamp(spark.createdAt) }}</p>
            <div v-if="spark.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
              <TagChip v-for="tag in spark.tags" :key="tag" :tag="tag" />
            </div>
          </li>
        </ul>
      </section>

      <section v-for="group in threadGroups" :key="group.thread.id" class="card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="break-words section-title">{{ group.thread.title }}</h3>
          <StatusBadge :status="group.thread.status" />
        </div>
        <ul class="mt-3 space-y-2">
          <li
            v-for="spark in group.sparks"
            :key="spark.id"
            class="rounded-lg border border-linesoft p-4"
          >
            <p class="break-words text-[0.95rem] text-ink">{{ spark.text }}</p>
            <p class="mt-1 meta-mono">Captured {{ formatTimestamp(spark.createdAt) }}</p>
            <div v-if="spark.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
              <TagChip v-for="tag in spark.tags" :key="tag" :tag="tag" />
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Spark, Thread } from '../stores/sparkStore'
import { formatTimestamp, now, startOfDay, startOfNextDay } from '../utils/time'
import EmptyState from './EmptyState.vue'
import StatusBadge from './StatusBadge.vue'
import TagChip from './TagChip.vue'

const store = useSparkStore()
const { sparks } = storeToRefs(store)

const todaySparks = computed(() => {
  const dayStart = startOfDay(now.value)
  const dayEnd = startOfNextDay(now.value)
  return sparks.value
    .filter(spark => spark.createdAt >= dayStart && spark.createdAt < dayEnd)
    .sort((a, b) => a.createdAt - b.createdAt)
})

const unthreadedToday = computed(() =>
  todaySparks.value.filter(spark => spark.threadId === null),
)

const threadGroups = computed(() => {
  const groups: { thread: Thread; sparks: Spark[] }[] = []
  for (const spark of todaySparks.value) {
    if (!spark.threadId) continue
    const existing = groups.find(group => group.thread.id === spark.threadId)
    if (existing) {
      existing.sparks.push(spark)
      continue
    }
    const thread = store.getThread(spark.threadId)
    if (thread) groups.push({ thread, sparks: [spark] })
  }
  return groups
})
</script>
