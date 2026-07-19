<template>
  <article class="rounded-lg border border-linesoft bg-surface p-4 transition-shadow hover:shadow-md">
    <div class="flex items-start gap-3">
      <span class="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-accent" aria-hidden="true"></span>
      <div class="min-w-0 flex-1">
        <template v-if="editing">
          <label :for="`edit-spark-${spark.id}`" class="field-label">Spark text</label>
          <textarea
            :id="`edit-spark-${spark.id}`"
            ref="editArea"
            v-model="editText"
            rows="2"
            class="input-field mt-1"
            :aria-invalid="editError ? 'true' : undefined"
            :aria-describedby="editError ? `edit-error-${spark.id}` : undefined"
            @keydown.enter.exact.prevent="saveEdit"
            @keydown.escape="cancelEdit"
          ></textarea>
          <p
            v-if="editError"
            :id="`edit-error-${spark.id}`"
            class="mt-1 text-[0.8rem] text-error"
          >
            Enter some text to save the spark
          </p>
          <div class="mt-2 flex gap-2">
            <button type="button" class="btn-primary-sm" @click="saveEdit">Save</button>
            <button type="button" class="btn-secondary" @click="cancelEdit">Cancel</button>
          </div>
        </template>
        <template v-else>
          <p class="break-words text-[0.95rem] text-ink">{{ spark.text }}</p>
          <p class="mt-1 meta-mono">Captured {{ formatTimestamp(spark.createdAt) }}</p>
        </template>

        <div class="mt-3">
          <SparkTagEditor :spark="spark" />
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <select
            :value="''"
            class="input-field w-auto max-w-full cursor-pointer py-2 text-[0.85rem]"
            aria-label="Assign to Thread"
            @change="onAssign"
          >
            <option value="" disabled>Assign to Thread</option>
            <option v-for="thread in assignableThreads" :key="thread.id" :value="thread.id">
              {{ thread.title }}
            </option>
            <option value="__new__">New Thread…</option>
          </select>
          <button v-if="!editing" type="button" class="btn-secondary" @click="startEdit">
            Edit
          </button>
          <button
            type="button"
            class="btn-secondary text-error hover:bg-error/10"
            @click="$emit('delete', spark.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Spark } from '../stores/sparkStore'
import { formatTimestamp } from '../utils/time'
import { showToast } from '../utils/toast'
import SparkTagEditor from './SparkTagEditor.vue'

const props = defineProps<{
  spark: Spark
}>()

const emit = defineEmits<{
  (event: 'delete', sparkId: string): void
  (event: 'assign', sparkId: string, threadId: string): void
}>()

const store = useSparkStore()

const assignableThreads = computed(() => store.activeThreads)

const editing = ref(false)
const editText = ref('')
const editError = ref(false)
const editArea = ref<HTMLTextAreaElement | null>(null)

function startEdit() {
  editing.value = true
  editText.value = props.spark.text
  editError.value = false
  nextTick(() => editArea.value?.focus())
}

function saveEdit() {
  const saved = store.updateSparkText(props.spark.id, editText.value)
  if (!saved) {
    editError.value = true
    return
  }
  editing.value = false
  editError.value = false
  showToast('Spark updated', 'success')
}

function cancelEdit() {
  editing.value = false
  editError.value = false
}

function onAssign(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value
  if (!value) return
  emit('assign', props.spark.id, value)
  select.value = ''
}
</script>
