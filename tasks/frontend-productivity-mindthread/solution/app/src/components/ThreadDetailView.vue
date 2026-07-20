<template>
  <section v-if="thread" class="card p-5">
    <button type="button" class="btn-quiet" @click="$emit('close')">
      <svg
        viewBox="0 0 24 24"
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>

    <header class="mt-3">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="break-words font-heading text-[1.6rem] font-semibold leading-tight text-ink">
          {{ thread.title }}
        </h2>
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
          <button
            type="button"
            class="btn-secondary"
            :aria-pressed="thread.pinned"
            @click="togglePin"
          >
            {{ thread.pinned ? 'Unpin' : 'Pin' }}
          </button>
          <button type="button" class="btn-secondary" @click="openMerge">Merge Into…</button>
          <button type="button" class="btn-secondary" @click="archiveThread">Archive</button>
        </div>
      </div>
    </header>

    <h3 class="mt-6 section-title">Timeline</h3>

    <EmptyState
      v-if="timelineSparks.length === 0"
      title="No sparks in this thread yet"
      body="Assign a spark from the Unthreaded inbox and it appears here on the timeline."
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

    <div v-else class="relative mt-4">
      <div class="absolute bottom-3 left-1 top-3 w-px bg-linesoft" aria-hidden="true"></div>
      <ol class="space-y-6">
        <li v-for="spark in timelineSparks" :key="spark.id" class="relative pl-6">
          <span
            class="absolute left-[-3px] top-2 h-3 w-3 rounded-full border-2 border-surface bg-accent shadow-sm"
            aria-hidden="true"
          ></span>
          <div class="rounded-lg border border-linesoft bg-surface p-4">
            <p class="break-words text-[0.95rem] text-ink">{{ spark.text }}</p>
            <p class="mt-1 meta-mono">Captured {{ formatTimestamp(spark.createdAt) }}</p>

            <div class="mt-3">
              <SparkTagEditor :spark="spark" />
            </div>

            <ul
              v-if="reflectionsFor(spark.id).length > 0"
              class="mt-3 ml-6 space-y-2"
            >
              <li
                v-for="reflection in reflectionsFor(spark.id)"
                :key="reflection.id"
                class="rounded-md border-l-2 border-l-primary/40 bg-primary/5 p-3"
              >
                <p class="meta-mono">Reflection · {{ formatTimestamp(reflection.createdAt) }}</p>
                <p class="mt-1 break-words text-[0.9rem] text-ink">{{ reflection.text }}</p>
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
              <form v-else class="mt-1" @submit.prevent="saveReflection(spark.id)">
                <label :for="`reflection-${spark.id}`" class="field-label">Reflection</label>
                <textarea
                  :id="`reflection-${spark.id}`"
                  ref="reflectionArea"
                  v-model="reflectionText"
                  rows="2"
                  class="input-field mt-1"
                  placeholder="How has this idea evolved?"
                  :aria-invalid="reflectionError ? 'true' : undefined"
                  :aria-describedby="reflectionError ? `reflection-error-${spark.id}` : undefined"
                  @keydown.enter.exact.prevent="saveReflection(spark.id)"
                  @keydown.escape="cancelReflection"
                ></textarea>
                <p
                  v-if="reflectionError"
                  :id="`reflection-error-${spark.id}`"
                  class="mt-1 text-[0.8rem] text-error"
                >
                  Enter some text to save the reflection
                </p>
                <div class="mt-2 flex gap-2">
                  <button type="submit" class="btn-primary-sm">Save</button>
                  <button type="button" class="btn-secondary" @click="cancelReflection">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <div
      v-if="mergeOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeMerge"
      @keydown.escape="closeMerge"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-dialog-title"
        class="card w-full max-w-md p-6"
      >
        <h3 id="merge-dialog-title" class="font-heading text-[1.2rem] font-semibold text-ink">
          Merge this thread
        </h3>
        <template v-if="mergeStep === 'pick'">
          <p class="mt-2 text-[0.9rem] text-inksoft">
            Pick the target thread that receives every spark and reflection from
            "{{ thread.title }}".
          </p>
          <label for="merge-target" class="field-label mt-4">Target thread</label>
          <select
            id="merge-target"
            ref="mergeSelect"
            v-model="mergeTargetId"
            class="input-field mt-1 cursor-pointer"
          >
            <option value="" disabled>Select a thread</option>
            <option v-for="target in mergeTargets" :key="target.id" :value="target.id">
              {{ target.title }}
            </option>
          </select>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn-secondary" @click="closeMerge">Cancel</button>
            <button
              type="button"
              class="btn-primary-sm"
              :disabled="!mergeTargetId"
              @click="mergeStep = 'confirm'"
            >
              Continue
            </button>
          </div>
        </template>
        <template v-else>
          <p class="mt-2 text-[0.9rem] text-ink">
            Move {{ mergeSummary }} from "{{ thread.title }}" into "{{ mergeTargetTitle }}"? The
            source thread is removed after the merge.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn-secondary" @click="closeMerge">Cancel</button>
            <button type="button" class="btn-danger" @click="confirmMerge">Confirm Merge</button>
          </div>
        </template>
      </div>
    </div>

    <MergeDialog
      :isOpen="isMergeOpen"
      :sourceId="threadId"
      @update:open="isMergeOpen = $event"
      @merged="handleMerged"
    />
  </section>

</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watchEffect } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { ThreadStatus } from '../stores/sparkStore'
import { formatTimestamp } from '../utils/time'
import { showToast } from '../utils/toast'
import EmptyState from './EmptyState.vue'
import SparkTagEditor from './SparkTagEditor.vue'
import StatusBadge from './StatusBadge.vue'
import MergeDialog from './MergeDialog.vue'

import { ReflectionUpsertSchema } from '../stores/sparkStore'


const isMergeOpen = ref(false)

function handleMerged() {
  showToast('Threads merged', 'success')
  emit('close')
}


const props = defineProps<{
  threadId: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const store = useSparkStore()
const { activeThreads } = storeToRefs(store)

const thread = computed(() => store.getThread(props.threadId))
const timelineSparks = computed(() => store.sparksInThread(props.threadId))
const stats = computed(() => store.threadStats(props.threadId))

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

// --- Reflections ---


const reflectionSparkId = ref<string | null>(null)
const reflectionText = ref('')
const reflectionError = ref('')

const reflectionArea = ref<HTMLTextAreaElement[] | HTMLTextAreaElement | null>(null)

function openReflectionForm(sparkId: string) {
  reflectionSparkId.value = sparkId
  reflectionText.value = ''
  reflectionError.value = false
  nextTick(() => {
    const target = Array.isArray(reflectionArea.value)
      ? reflectionArea.value[0]
      : reflectionArea.value
    target?.focus()
  })
}

function saveReflection(sparkId: string) {
  const reflection = store.addReflection(sparkId, reflectionText.value)
  if (!reflection) {
    reflectionError.value = true
    return
  }
  reflectionSparkId.value = null
  reflectionText.value = ''
  reflectionError.value = false
  showToast('Reflection added', 'success')
}

function cancelReflection() {
  reflectionSparkId.value = null
  reflectionText.value = ''
  reflectionError.value = ''
}

// --- Merge ---

const mergeOpen = ref(false)
const mergeStep = ref<'pick' | 'confirm'>('pick')
const mergeTargetId = ref('')
const mergeSelect = ref<HTMLSelectElement | null>(null)

const mergeTargets = computed(() =>
  activeThreads.value.filter(candidate => candidate.id !== props.threadId),
)

const mergeTargetTitle = computed(
  () => store.getThread(mergeTargetId.value)?.title ?? '',
)

const mergeSummary = computed(() => {
  const { sparkCount, reflectionCount } = stats.value
  const sparkPart = `${sparkCount} ${sparkCount === 1 ? 'spark' : 'sparks'}`
  const reflectionPart = `${reflectionCount} ${reflectionCount === 1 ? 'reflection' : 'reflections'}`
  return `${sparkPart} and ${reflectionPart}`
})

function openMerge() {
  if (mergeTargets.value.length === 0) {
    showToast('Create a second thread to merge into', 'info')
    return
  }
  mergeOpen.value = true
  mergeStep.value = 'pick'
  mergeTargetId.value = ''
  nextTick(() => mergeSelect.value?.focus())
}

function closeMerge() {
  mergeOpen.value = false
  mergeStep.value = 'pick'
  mergeTargetId.value = ''
}

function confirmMerge() {
  const targetTitle = mergeTargetTitle.value
  const merged = store.mergeThreads(props.threadId, mergeTargetId.value)
  closeMerge()
  if (merged) {
    showToast(`Merged into "${targetTitle}"`, 'success')
    emit('close')
  }
}
</script>
