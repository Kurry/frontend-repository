<template>
  <section class="card p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="section-title">Filter by tag</h2>
      <template v-if="activeTags.length > 0">
        <span class="meta-mono text-ink">
          {{ activeTags.length }} {{ activeTags.length === 1 ? 'tag' : 'tags' }} selected
        </span>
      </template>
    </div>

    <p v-if="allTags.length === 0" class="mt-2 text-[0.85rem] text-inksoft">
      No tags in use yet. Add a tag to a spark and it appears here as a filter.
    </p>

    <div v-else class="mt-3 flex flex-wrap items-center gap-2">
      <button
        v-for="tag in allTags"
        :key="tag.name"
        type="button"
        class="inline-flex min-h-6 items-center gap-1 rounded-full px-3 py-1 font-mono text-[0.72rem] leading-none transition-colors focus-ring"
        :class="
          isActive(tag.name)
            ? 'bg-primary text-white shadow-sm'
            : 'bg-hoverwash text-ink hover:bg-presswash'
        "
        :aria-pressed="isActive(tag.name)"
        @click="toggleTag(tag.name)"
      >
        <svg
          v-if="isActive(tag.name)"
          viewBox="0 0 24 24"
          class="h-3 w-3"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        #{{ tag.name }} ({{ tag.count }})
      </button>
      <button
        v-if="activeTags.length > 0"
        type="button"
        class="btn-quiet text-error hover:bg-error/10 hover:text-error"
        @click="$emit('update:activeTags', [])"
      >
        Clear Filters
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useSparkStore } from '../stores/sparkStore'

const props = withDefaults(
  defineProps<{
    activeTags?: string[]
  }>(),
  {
    activeTags: () => [],
  },
)

const emit = defineEmits<{
  (event: 'update:activeTags', value: string[]): void
}>()

const store = useSparkStore()
const { allTags: storeTags } = storeToRefs(store)
const allTags = computed(() => storeTags.value)

function isActive(name: string): boolean {
  return props.activeTags.includes(name)
}

function toggleTag(name: string) {
  const next = props.activeTags.includes(name)
    ? props.activeTags.filter(tag => tag !== name)
    : [...props.activeTags, name]
  emit('update:activeTags', next)
}
</script>
