<template>
  <article
    class="rounded-lg border border-linesoft bg-surface p-4 transition-shadow hover:shadow-md active:translate-y-px"
  >
    <div class="flex items-start gap-3">
      <input
        :id="`select-${spark.id}`"
        type="checkbox"
        class="mt-1 h-4 w-4 cursor-pointer rounded border-line text-primary focus-ring"
        :checked="selected"
        :aria-label="`Select spark ${spark.text.slice(0, 40)}`"
        @change="onSelectChange"
      />
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
          <p v-if="editError" :id="`edit-error-${spark.id}`" class="mt-1 text-[0.8rem] text-error">
            {{ editError }}
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
          <label class="sr-only" :for="`assign-${spark.id}`">Assign to Thread</label>
          <select
            :id="`assign-${spark.id}`"
            :value="''"
            class="input-field w-auto max-w-full cursor-pointer py-2 text-[0.85rem]"
            @change="onAssign"
            @keydown.enter.prevent="($event.target as HTMLSelectElement).click()"
          >
            <option value="" disabled>Assign to Thread</option>
            <option v-for="thread in assignableThreads" :key="thread.id" :value="thread.id">
              {{ thread.title }}
            </option>
            <option value="__new__">New Thread…</option>
          </select>
          <button v-if="!editing" type="button" class="btn-secondary" @click="startEdit">Edit</button>
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
import { SparkUpsertSchema, useSparkStore } from '../stores/sparkStore'
import type { Spark } from '../stores/sparkStore'
import { formatTimestamp } from '../utils/time'
import { showToast } from '../utils/toast'
import SparkTagEditor from './SparkTagEditor.vue'

const props = defineProps<{
  spark: Spark
  selected?: boolean
}>()

const emit = defineEmits<{
  (event: 'delete', sparkId: string): void
  (event: 'assign', sparkId: string, threadId: string): void
  (event: 'toggle-select', sparkId: string, selected: boolean): void
}>()

const store = useSparkStore()
const assignableThreads = computed(() => store.activeThreads)

const editing = ref(false)
const editText = ref('')
const editError = ref('')
const editArea = ref<HTMLTextAreaElement | null>(null)

function onSelectChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  emit('toggle-select', props.spark.id, checked)
}

function startEdit() {
  editing.value = true
  editText.value = props.spark.text
  editError.value = ''
  nextTick(() => editArea.value?.focus())
}

function saveEdit() {
  const parsed = SparkUpsertSchema.safeParse({ text: editText.value })
  if (!parsed.success) {
    editError.value = parsed.error.issues[0]?.message ?? 'Enter some text to save the spark'
    return
  }
  const saved = store.updateSparkText(props.spark.id, parsed.data.text)
  if (!saved) {
    editError.value = 'Enter some text to save the spark'
    return
  }
  editing.value = false
  editError.value = ''
  showToast('Spark updated', 'success')
}

function cancelEdit() {
  editing.value = false
  editError.value = ''
}

function onAssign(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value
  if (!value) return
  emit('assign', props.spark.id, value)
  select.value = ''
}
</script>
