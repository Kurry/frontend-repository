<template>
  <div class="space-y-6">
    <!-- Capture bar -->
    <section class="card p-5">
      <form @submit.prevent="handleAddSpark">
        <label
          for="capture-input"
          class="block font-heading text-[1rem] font-semibold text-ink"
        >
          Capture a spark
        </label>
        <textarea
          id="capture-input"
          v-model="newSparkText"
          rows="2"
          class="input-field mt-2"
          placeholder="What idea just crossed your mind?"
          :aria-invalid="captureError ? 'true' : undefined"
          :aria-describedby="captureError ? 'capture-error' : undefined"
          @keydown.enter.exact.prevent="handleAddSpark"
        ></textarea>
        <p v-if="captureError" id="capture-error" class="mt-1 text-[0.8rem] text-error">
          Enter a thought to add a spark
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span class="meta-mono">Press Enter or select Add Spark</span>
          <button type="submit" class="btn-primary">Add Spark</button>
        </div>
      </form>
    </section>

    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Main column -->
      <div class="min-w-0 flex-1 space-y-4">
        <!-- Search -->
        <section class="card p-4">
          <label for="search-input" class="field-label">Search</label>
          <div class="mt-1 flex items-center gap-2">
            <input
              id="search-input"
              v-model="searchQuery"
              type="text"
              class="input-field"
              placeholder="Search sparks, reflections and threads"
              autocomplete="off"
              @keydown.escape="searchQuery = ''"
              @keydown.enter.prevent
            />
            <button
              v-if="searchQuery"
              type="button"
              class="btn-secondary"
              @click="searchQuery = ''"
            >
              Clear
            </button>
          </div>
        </section>

        <!-- Tag filter -->
        <TagFilterPanel v-model:active-tags="activeTags" />

        <!-- Search results, thread detail, or inbox -->
        <SearchResults
          v-if="searchActive"
          :query="trimmedQuery"
          @open-thread="openThread"
        />

        <ThreadDetailView
          v-else-if="openThreadId"
          :thread-id="openThreadId"
          @close="ui.closeThread()"
        />

        <section v-else class="card p-5">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-heading text-[1rem] font-semibold text-ink">Unthreaded</h2>
            <span class="meta-mono">{{ inboxCountLabel }}</span>
          </div>

          <EmptyState
            v-if="showInboxEmptyState"
            title="Capture your first spark"
            body="A spark is a quick, fleeting thought worth keeping. Type it in the capture bar above and select Add Spark to store it here until you weave it into a thread."
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
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </template>
          </EmptyState>

          <EmptyState
            v-else-if="filteredUnthreaded.length === 0"
            title="No matching sparks"
            body="No unthreaded sparks carry the selected tags. Select Clear Filters to see every spark again."
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
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </template>
          </EmptyState>

          <ul v-else class="mt-4 space-y-3">
            <li v-for="spark in filteredUnthreaded" :key="spark.id">
              <SparkCard :spark="spark" @delete="handleDeleteSpark" @assign="handleAssign" />
            </li>
          </ul>
        </section>
      </div>

      <!-- Threads column -->
      <aside class="w-full flex-shrink-0 space-y-4 lg:w-80">
        <section class="card p-4">
          <form @submit.prevent="handleCreateThread">
            <label for="new-thread-title" class="field-label">Thread title</label>
            <input
              id="new-thread-title"
              v-model="newThreadTitle"
              type="text"
              class="input-field mt-1"
              placeholder="Name the idea this thread follows"
              autocomplete="off"
              :aria-invalid="threadTitleError ? 'true' : undefined"
              :aria-describedby="threadTitleError ? 'thread-title-error' : undefined"
            />
            <p
              v-if="threadTitleError"
              id="thread-title-error"
              class="mt-1 text-[0.8rem] text-error"
            >
              Enter a title to create a thread
            </p>
            <button type="submit" class="btn-primary-sm mt-3 w-full">+ New Thread</button>
          </form>
        </section>

        <section v-if="visiblePinnedThreads.length > 0">
          <h2 class="mb-2 flex items-center gap-2 section-title">
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4 text-primary"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6 3h12v18l-6-4-6 4V3z" />
            </svg>
            Pinned
          </h2>
          <ul class="space-y-3">
            <li v-for="thread in visiblePinnedThreads" :key="thread.id">
              <ThreadCard
                :thread="thread"
                @open="openThread(thread.id)"
                @toggle-pin="handleTogglePin(thread.id)"
                @archive="handleArchive(thread.id)"
              />
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-2 section-title">
            Threads
            <span class="meta-mono font-normal">{{ visibleRegularThreads.length }}</span>
          </h2>

          <div v-if="showThreadsEmptyState" class="card">
            <EmptyState
              title="No threads yet"
              body="Create a thread with + New Thread, or assign an unthreaded spark to a new thread."
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
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </template>
            </EmptyState>
          </div>

          <p
            v-else-if="visibleRegularThreads.length === 0"
            class="card p-4 text-[0.85rem] text-inksoft"
          >
            No matching threads carry the selected tags. Select Clear Filters to see every
            thread again.
          </p>

          <ul v-else class="space-y-3">
            <li v-for="thread in visibleRegularThreads" :key="thread.id">
              <ThreadCard
                :thread="thread"
                @open="openThread(thread.id)"
                @toggle-pin="handleTogglePin(thread.id)"
                @archive="handleArchive(thread.id)"
              />
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <!-- Virtualized sample collection -->
    <VirtualizedItemsPanel />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Spark, Thread } from '../stores/sparkStore'
import { useUiStore } from '../stores/uiStore'
import { showToast } from '../utils/toast'
import EmptyState from './EmptyState.vue'
import SearchResults from './SearchResults.vue'
import SparkCard from './SparkCard.vue'
import TagFilterPanel from './TagFilterPanel.vue'
import ThreadCard from './ThreadCard.vue'
import ThreadDetailView from './ThreadDetailView.vue'
import VirtualizedItemsPanel from './VirtualizedItemsPanel.vue'

const store = useSparkStore()
const { pinnedThreads, sparks, unpinnedThreads, unthreadedSparks } = storeToRefs(store)

const ui = useUiStore()
const { activeTags, openThreadId, searchQuery } = storeToRefs(ui)

const newSparkText = ref('')
const captureError = ref(false)
const newThreadTitle = ref('')
const threadTitleError = ref(false)

const trimmedQuery = computed(() => searchQuery.value.trim())
const searchActive = computed(() => trimmedQuery.value.length > 0)

watch(newSparkText, () => {
  captureError.value = false
})

watch(newThreadTitle, () => {
  threadTitleError.value = false
})

// --- Capture ---

function handleAddSpark() {
  const spark = store.addSpark(newSparkText.value)
  if (!spark) {
    captureError.value = true
    return
  }
  newSparkText.value = ''
  captureError.value = false
  showToast('Spark added', 'success')
}

function handleDeleteSpark(sparkId: string) {
  store.deleteSpark(sparkId)
  showToast('Spark deleted', 'info')
}

function handleAssign(sparkId: string, threadId: string) {
  if (threadId === '__new__') {
    const spark = store.getSpark(sparkId)
    if (!spark) return
    const title =
      spark.text.length > 40 ? `${spark.text.slice(0, 40).trimEnd()}…` : spark.text
    const thread = store.addThread(title)
    if (!thread) return
    store.assignSparkToThread(sparkId, thread.id)
    showToast(`Spark assigned to new thread "${thread.title}"`, 'success')
    return
  }
  const thread = store.getThread(threadId)
  if (!thread) return
  store.assignSparkToThread(sparkId, threadId)
  showToast(`Spark assigned to "${thread.title}"`, 'success')
}

// --- Threads ---

function handleCreateThread() {
  const thread = store.addThread(newThreadTitle.value)
  if (!thread) {
    threadTitleError.value = true
    return
  }
  newThreadTitle.value = ''
  threadTitleError.value = false
  showToast(`Thread "${thread.title}" created`, 'success')
}

function openThread(threadId: string) {
  ui.openThread(threadId)
}

function handleTogglePin(threadId: string) {
  const wasPinned = store.getThread(threadId)?.pinned === true
  store.togglePin(threadId)
  showToast(wasPinned ? 'Thread unpinned' : 'Thread pinned', 'info')
}

function handleArchive(threadId: string) {
  store.setArchived(threadId, true)
  if (openThreadId.value === threadId) openThreadId.value = null
  showToast('Thread archived', 'success')
}

// --- Filtering ---

function sparkMatchesTags(spark: Spark): boolean {
  if (activeTags.value.length === 0) return true
  return activeTags.value.some(tag => spark.tags.includes(tag))
}

function threadMatchesTags(thread: Thread): boolean {
  if (activeTags.value.length === 0) return true
  return sparks.value.some(
    spark => spark.threadId === thread.id && sparkMatchesTags(spark),
  )
}

const filteredUnthreaded = computed(() =>
  unthreadedSparks.value.filter(sparkMatchesTags),
)

const visiblePinnedThreads = computed(() => pinnedThreads.value.filter(threadMatchesTags))
const visibleRegularThreads = computed(() =>
  unpinnedThreads.value.filter(threadMatchesTags),
)

const showInboxEmptyState = computed(
  () => unthreadedSparks.value.length === 0 && activeTags.value.length === 0,
)

const showThreadsEmptyState = computed(
  () =>
    pinnedThreads.value.length === 0 &&
    unpinnedThreads.value.length === 0 &&
    activeTags.value.length === 0,
)

const inboxCountLabel = computed(() => {
  const total = unthreadedSparks.value.length
  const shown = filteredUnthreaded.value.length
  if (activeTags.value.length > 0 && shown !== total) {
    return `${shown} of ${total} ${total === 1 ? 'spark' : 'sparks'}`
  }
  return `${total} ${total === 1 ? 'spark' : 'sparks'}`
})
</script>
