<template>
  <div class="space-y-6">
    <header>
      <h1 class="font-heading text-[1.35rem] font-semibold text-ink">Home</h1>
      <p class="mt-1 text-[0.9rem] text-inksoft">
        Capture sparks, weave them into threads, and export your workspace.
      </p>
    </header>

    <section class="card p-5">
      <form @submit.prevent="handleAddSpark">
        <h2 class="font-heading text-[1rem] font-semibold text-ink">
          <label for="capture-input">Capture a spark</label>
        </h2>
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
          {{ captureError }}
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span class="meta-mono">Press Enter or select Add Spark</span>
          <button type="submit" class="btn-primary" :disabled="capturing">Add Spark</button>
        </div>
      </form>
    </section>

    <div class="flex flex-col gap-6 lg:flex-row">
      <div class="min-w-0 flex-1 space-y-4">
        <section class="card p-4">
          <label for="search-input" class="field-label">Search</label>
          <div class="mt-1 flex items-center gap-2">
            <input
              id="search-input"
              v-model="searchQuery"
              type="search"
              class="input-field"
              placeholder="Search sparks, reflections and threads"
              autocomplete="off"
              @keydown.escape="searchQuery = ''"
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

        <TagFilterPanel v-model:active-tags="activeTags" />

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
              <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </template>
          </EmptyState>

          <EmptyState
            v-else-if="filteredUnthreaded.length === 0"
            title="No matching sparks"
            body="No unthreaded sparks carry the selected tags. Select Clear Filters to see every spark again."
          />

          <ul v-else v-auto-animate class="mt-4 space-y-3">
            <li v-for="spark in filteredUnthreaded" :key="spark.id">
              <SparkCard
                :spark="spark"
                :selected="selectedSparkIds.includes(spark.id)"
                @delete="handleDeleteSpark"
                @assign="handleAssign"
                @toggle-select="toggleSelect"
              />
            </li>
          </ul>
        </section>
      </div>

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
            <p v-if="threadTitleError" id="thread-title-error" class="mt-1 text-[0.8rem] text-error">
              {{ threadTitleError }}
            </p>
            <button type="submit" class="btn-primary-sm mt-3 w-full">+ New Thread</button>
          </form>
        </section>

        <section v-if="visiblePinnedThreads.length > 0">
          <h2 class="mb-2 flex items-center gap-2 section-title">Pinned</h2>
          <TransitionGroup name="thread-reorder" tag="ul" class="space-y-3">
            <li v-for="thread in visiblePinnedThreads" :key="thread.id">
              <ThreadCard
                :thread="thread"
                @open="openThread(thread.id)"
                @toggle-pin="handleTogglePin(thread.id)"
                @archive="handleArchive(thread.id)"
              />
            </li>
          </TransitionGroup>
        </section>

        <section>
          <h2 class="mb-2 section-title">
            Threads
            <span class="meta-mono font-normal">{{ threadCountLabel }}</span>
          </h2>

          <div v-if="showThreadsEmptyState" class="card">
            <EmptyState
              title="No threads yet"
              body="Create a thread with + New Thread, or assign an unthreaded spark to a new thread."
            />
          </div>

          <p
            v-else-if="visibleRegularThreads.length === 0"
            class="card p-4 text-[0.85rem] text-inksoft"
          >
            No matching threads carry the selected tags. Select Clear Filters to see every thread again.
          </p>

          <TransitionGroup v-else name="thread-reorder" tag="ul" class="space-y-3">
            <li v-for="thread in visibleRegularThreads" :key="thread.id">
              <ThreadCard
                :thread="thread"
                @open="openThread(thread.id)"
                @toggle-pin="handleTogglePin(thread.id)"
                @archive="handleArchive(thread.id)"
              />
            </li>
          </TransitionGroup>
        </section>
      </aside>
    </div>

    <VirtualizedItemsPanel />
    <BulkTray :selected-ids="selectedSparkIds" @clear="selectedSparkIds = []" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { SparkUpsertSchema, ThreadUpsertSchema, useSparkStore } from '../stores/sparkStore'
import type { Spark, Thread } from '../stores/sparkStore'
import { useUiStore } from '../stores/uiStore'
import { showToast } from '../utils/toast'
import BulkTray from './BulkTray.vue'
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
const captureError = ref('')
const newThreadTitle = ref('')
const threadTitleError = ref('')
const capturing = ref(false)
const selectedSparkIds = ref<string[]>([])

const trimmedQuery = computed(() => searchQuery.value.trim())
const searchActive = computed(() => trimmedQuery.value.length > 0)

watch(newSparkText, () => {
  captureError.value = ''
})

watch(newThreadTitle, () => {
  threadTitleError.value = ''
})

function handleAddSpark() {
  if (capturing.value) return
  capturing.value = true
  const parsed = SparkUpsertSchema.safeParse({ text: newSparkText.value })
  if (!parsed.success) {
    captureError.value = parsed.error.issues[0]?.message ?? 'Enter a thought to add a spark'
    capturing.value = false
    return
  }
  const spark = store.addSpark(parsed.data.text)
  if (!spark) {
    captureError.value = 'Enter a thought to add a spark'
    capturing.value = false
    return
  }
  newSparkText.value = ''
  captureError.value = ''
  showToast('Spark added', 'success')
  capturing.value = false
}

function handleDeleteSpark(sparkId: string) {
  store.deleteSpark(sparkId)
  selectedSparkIds.value = selectedSparkIds.value.filter(id => id !== sparkId)
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

function handleCreateThread() {
  const parsed = ThreadUpsertSchema.safeParse({ title: newThreadTitle.value })
  if (!parsed.success) {
    threadTitleError.value =
      parsed.error.issues[0]?.message ?? 'Enter a title to create a thread'
    return
  }
  const thread = store.addThread(parsed.data.title)
  if (!thread) {
    threadTitleError.value = 'Enter a title to create a thread'
    return
  }
  newThreadTitle.value = ''
  threadTitleError.value = ''
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
  if (openThreadId.value === threadId) ui.closeThread()
  showToast('Thread archived', 'success')
}

function toggleSelect(sparkId: string, selected: boolean) {
  if (selected) {
    if (!selectedSparkIds.value.includes(sparkId)) {
      selectedSparkIds.value = [...selectedSparkIds.value, sparkId]
    }
  } else {
    selectedSparkIds.value = selectedSparkIds.value.filter(id => id !== sparkId)
  }
}

function sparkMatchesTags(spark: Spark): boolean {
  if (activeTags.value.length === 0) return true
  return activeTags.value.some(tag => spark.tags.includes(tag))
}

function threadMatchesTags(thread: Thread): boolean {
  if (activeTags.value.length === 0) return true
  return sparks.value.some(spark => spark.threadId === thread.id && sparkMatchesTags(spark))
}

const filteredUnthreaded = computed(() => unthreadedSparks.value.filter(sparkMatchesTags))

const visiblePinnedThreads = computed(() => pinnedThreads.value.filter(threadMatchesTags))
const visibleRegularThreads = computed(() => unpinnedThreads.value.filter(threadMatchesTags))

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

const threadCountLabel = computed(() => {
  const total = pinnedThreads.value.length + unpinnedThreads.value.length
  return `${total} ${total === 1 ? 'thread' : 'threads'}`
})
</script>

<style scoped>
.thread-reorder-move {
  transition: transform 0.25s ease;
}
</style>
