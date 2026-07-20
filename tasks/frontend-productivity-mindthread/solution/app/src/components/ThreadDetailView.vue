<template>
  <section v-if="thread" class="card p-5">
    <button type="button" class="btn-quiet" @click="$emit('close')">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>

    <header class="mt-3">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="break-words font-heading text-[1.6rem] font-semibold leading-tight text-ink">
          {{ thread.title }}
        </h1>
        <StatusBadge :status="thread.status" />
      </div>
      <p class="mt-2 meta-mono">{{ statsLabel }}</p>

      <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div class="flex items-center gap-2">
          <span class="field-label mb-0">Status</span>
          <div
            class="inline-flex items-center gap-1 rounded-md border border-line bg-surface p-1"
            role="group"
            aria-label="Status"
          >
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="rounded-md px-3 py-1 text-[0.8rem] font-medium transition-colors focus-ring"
              :class="
                thread.status === option.value
                  ? option.selectedClass
                  : 'text-inksoft hover:bg-hoverwash hover:text-ink'
              "
              :aria-pressed="thread.status === option.value"
              @click="setStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" :aria-pressed="thread.pinned" @click="togglePin">
            {{ thread.pinned ? 'Unpin' : 'Pin' }}
          </button>
          <button type="button" class="btn-secondary" @click="openMerge">Merge Into…</button>
          <button type="button" class="btn-secondary" @click="archiveThread">Archive</button>
          <button
            v-if="timelineSparks.length === 0"
            type="button"
            class="btn-secondary text-error hover:bg-error/10"
            @click="deleteEmptyThread"
          >
            Delete Thread
          </button>
        </div>
      </div>
    </header>

    <h2 class="mt-6 section-title">Timeline</h2>

    <EmptyState
      v-if="timelineSparks.length === 0"
      title="No sparks in this thread yet"
      body="Assign a spark from the Unthreaded inbox and it appears here on the timeline."
    />

    <div v-else class="relative mt-4">
      <div class="absolute bottom-3 left-1 top-3 w-px bg-linesoft" aria-hidden="true"></div>
      <ol v-auto-animate class="space-y-6">
        <li v-for="spark in timelineSparks" :key="spark.id" class="relative pl-6">
          <span
            class="absolute left-[-3px] top-2 h-3 w-3 rounded-full border-2 border-surface bg-accent shadow-sm"
            aria-hidden="true"
          ></span>
          <div class="rounded-lg border border-linesoft bg-surface p-4 transition-shadow hover:shadow-md">
            <p class="break-words text-[0.95rem] text-ink">{{ spark.text }}</p>
            <p class="mt-1 meta-mono">Captured {{ formatTimestamp(spark.createdAt) }}</p>

            <div class="mt-3">
              <SparkTagEditor :spark="spark" />
            </div>

            <ul v-if="reflectionsFor(spark.id).length > 0" class="mt-3 ml-6 space-y-2">
              <li
                v-for="reflection in reflectionsFor(spark.id)"
                :key="reflection.id"
                class="rounded-md border-l-2 border-l-primary/40 bg-primary/5 p-3"
              >
                <p class="meta-mono">Reflection · {{ formatTimestamp(reflection.createdAt) }}</p>
                <div
                  class="reflection-content mt-1 break-words text-[0.9rem] text-ink"
                  v-html="reflection.text"
                ></div>
              </li>
            </ul>

            <div class="mt-3">
              <button
                v-if="reflectionSparkId !== spark.id"
                type="button"
                class="btn-secondary"
                @click="openReflectionForm(spark.id)"
              >
                Add Reflection
              </button>
              <ReflectionEditor
                v-else
                :editor-id="`reflection-${spark.id}`"
                @save="(html, plain) => saveReflection(spark.id, html, plain)"
                @cancel="cancelReflection"
              />
            </div>
          </div>
        </li>
      </ol>
    </div>

    <MergeDialog
      v-model:open="isMergeOpen"
      :source-id="threadId"
      @merged="handleMerged"
    />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { ThreadStatus } from '../stores/sparkStore'
import { formatTimestamp } from '../utils/time'
import { showToast } from '../utils/toast'
import EmptyState from './EmptyState.vue'
import MergeDialog from './MergeDialog.vue'
import ReflectionEditor from './ReflectionEditor.vue'
import SparkTagEditor from './SparkTagEditor.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ threadId: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()

const store = useSparkStore()
const { activeThreads } = storeToRefs(store)

const thread = computed(() => store.getThread(props.threadId))
const timelineSparks = computed(() => store.sparksInThread(props.threadId))
const stats = computed(() => store.threadStats(props.threadId))
const isMergeOpen = ref(false)
const reflectionSparkId = ref<string | null>(null)

watchEffect(() => {
  if (!thread.value) emit('close')
})

const statusOptions: {
  value: ThreadStatus
  label: string
  selectedClass: string
}[] = [
  { value: 'active', label: 'Active', selectedClass: 'bg-primary font-semibold text-white shadow-sm' },
  { value: 'dormant', label: 'Dormant', selectedClass: 'bg-warning font-semibold text-ink shadow-sm' },
  { value: 'resolved', label: 'Resolved', selectedClass: 'bg-success font-semibold text-white shadow-sm' },
]

const statsLabel = computed(() => {
  const { sparkCount, reflectionCount, daysActive } = stats.value
  const sparkPart = `${sparkCount} ${sparkCount === 1 ? 'spark' : 'sparks'}`
  const reflectionPart = `${reflectionCount} ${reflectionCount === 1 ? 'reflection' : 'reflections'}`
  const daysPart = `${daysActive} ${daysActive === 1 ? 'day' : 'days'} active`
  return `${sparkPart} · ${reflectionPart} · ${daysPart}`
})

function reflectionsFor(sparkId: string) {
  return store.reflectionsForSpark(sparkId)
}

function setStatus(status: ThreadStatus) {
  store.setThreadStatus(props.threadId, status)
  const option = statusOptions.find(entry => entry.value === status)
  showToast(`Status set to ${option ? option.label : status}`, 'info')
}

function togglePin() {
  const wasPinned = thread.value?.pinned === true
  store.togglePin(props.threadId)
  showToast(wasPinned ? 'Thread unpinned' : 'Thread pinned', 'info')
}

function archiveThread() {
  store.setArchived(props.threadId, true)
  showToast('Thread archived', 'success')
  emit('close')
}

function deleteEmptyThread() {
  if (store.deleteThread(props.threadId)) {
    showToast('Thread deleted', 'info')
    emit('close')
  }
}

function openReflectionForm(sparkId: string) {
  reflectionSparkId.value = sparkId
}

function saveReflection(sparkId: string, html: string, plainText: string) {
  void plainText
  const reflection = store.addReflection(sparkId, html)
  if (!reflection) return
  reflectionSparkId.value = null
  showToast('Reflection added', 'success')
}

function cancelReflection() {
  reflectionSparkId.value = null
}

function openMerge() {
  if (activeThreads.value.filter(candidate => candidate.id !== props.threadId).length === 0) {
    showToast('Create a second thread to merge into', 'info')
    return
  }
  isMergeOpen.value = true
}

function handleMerged() {
  showToast('Threads merged successfully', 'success')
  emit('close')
}
</script>

<style scoped>
:deep(.reflection-content ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

:deep(.reflection-content strong) {
  font-weight: 700;
}
</style>
