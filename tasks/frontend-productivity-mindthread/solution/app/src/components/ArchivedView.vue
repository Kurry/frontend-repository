<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <header>
      <h1 class="font-heading text-[1.35rem] font-semibold text-ink">Archived</h1>
      <p class="mt-1 text-[0.9rem] text-inksoft">
        Threads you archive move here. Restore one with Unarchive.
      </p>
    </header>

    <section v-if="archivedThreads.length === 0" class="card">
      <EmptyState
        title="No archived threads"
        body="Select Archive on a thread to move it out of the main list and into this screen."
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
            <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
          </svg>
        </template>
      </EmptyState>
    </section>

    <ul v-else class="space-y-3">
      <li v-for="thread in archivedThreads" :key="thread.id">
        <article class="card border-l-4 border-l-primary p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="break-words font-heading text-[1.05rem] font-semibold text-ink">
                  {{ thread.title }}
                </h3>
                <StatusBadge :status="thread.status" />
              </div>
              <p class="mt-2 meta-mono">{{ statsLabel(thread.id) }}</p>
            </div>
            <button type="button" class="btn-secondary" @click="unarchive(thread.id)">
              Unarchive
            </button>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSparkStore } from '../stores/sparkStore'
import { showToast } from '../utils/toast'
import EmptyState from './EmptyState.vue'
import StatusBadge from './StatusBadge.vue'

const store = useSparkStore()
const { archivedThreads } = storeToRefs(store)

function statsLabel(threadId: string): string {
  const { sparkCount, reflectionCount } = store.threadStats(threadId)
  const sparkPart = `${sparkCount} ${sparkCount === 1 ? 'spark' : 'sparks'}`
  const reflectionPart = `${reflectionCount} ${reflectionCount === 1 ? 'reflection' : 'reflections'}`
  return `${sparkPart} · ${reflectionPart}`
}

function unarchive(threadId: string) {
  store.setArchived(threadId, false)
  showToast('Thread unarchived', 'success')
}
</script>
