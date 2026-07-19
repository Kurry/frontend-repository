<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <label :for="inputId" class="meta-mono font-medium text-ink">Tags</label>
      <span
        v-for="tag in spark.tags"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2 pr-1 font-mono text-[0.72rem] leading-none text-primary"
      >
        #{{ tag }}
        <button
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/20 hover:text-primarydeeper focus-ring"
          :aria-label="`Remove tag ${tag}`"
          @click="removeTag(tag)"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </span>
    </div>
    <form class="mt-2 flex items-center gap-2" @submit.prevent="submitTag">
      <input
        :id="inputId"
        v-model="draft"
        type="text"
        class="input-field max-w-44 px-3 py-1 text-[0.8rem]"
        placeholder="New tag"
        autocomplete="off"
      />
      <button type="submit" class="btn-secondary min-h-8 px-3 text-[0.8rem]">Add Tag</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import type { Spark } from '../stores/sparkStore'
import { showToast } from '../utils/toast'

const props = defineProps<{
  spark: Spark
}>()

const store = useSparkStore()
const draft = ref('')

const inputId = computed(() => `tag-input-${props.spark.id}`)

function submitTag() {
  const value = draft.value.trim()
  if (!value) return
  const result = store.addTagToSpark(props.spark.id, value)
  if (result === 'duplicate') {
    showToast(`Tag "${value}" is already on this spark`, 'info')
  }
  draft.value = ''
}

function removeTag(tag: string) {
  store.removeTagFromSpark(props.spark.id, tag)
}
</script>
