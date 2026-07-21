<template>
  <Transition name="bulk-tray">
    <aside
      v-if="selectedCount > 0"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-linesoft bg-surface px-4 py-3 shadow-lg"
      role="region"
      aria-label="Bulk actions"
    >
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <span class="font-body text-[0.9rem] font-medium text-ink">
          {{ selectedCount }} selected
        </span>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="spark in previewSparks"
            :key="spark.id"
            class="rounded-full bg-primary/10 px-2 py-1 font-mono text-[0.72rem] text-primary"
          >
            {{ spark.text.slice(0, 24) }}{{ spark.text.length > 24 ? '…' : '' }}
          </span>
        </div>
        <form class="ml-auto flex flex-wrap items-center gap-2" @submit.prevent="submitTag">
          <label for="bulk-tag-input" class="sr-only">Bulk Add Tag</label>
          <input
            id="bulk-tag-input"
            v-model="tagDraft"
            type="text"
            class="input-field max-w-40 py-1 text-[0.85rem]"
            placeholder="Add Tag"
            :aria-invalid="tagError ? 'true' : undefined"
            :aria-describedby="tagError ? 'bulk-tag-error' : undefined"
          />
          <button type="submit" class="btn-secondary">Add Tag</button>
          <p v-if="tagError" id="bulk-tag-error" class="w-full text-[0.75rem] text-error">
            {{ tagError }}
          </p>
        </form>
        <button type="button" class="btn-danger" @click="confirmDelete = true">Delete</button>
        <button type="button" class="btn-quiet" @click="$emit('clear')">Clear selection</button>
      </div>
    </aside>
  </Transition>

  <div
    v-if="confirmDelete"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bulk-delete-title"
    @click.self="confirmDelete = false"
    @keydown.escape="confirmDelete = false"
  >
    <div class="card w-full max-w-sm p-6">
      <h3 id="bulk-delete-title" class="font-heading text-[1.1rem] font-semibold text-ink">
        Delete {{ selectedCount }} sparks?
      </h3>
      <p class="mt-2 text-[0.9rem] text-inksoft">
        This removes the selected sparks and their reflections.
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="btn-secondary" @click="confirmDelete = false">Cancel</button>
        <button type="button" class="btn-danger" @click="handleDelete">Confirm Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSparkStore } from '../stores/sparkStore'
import { TagAddSchema } from '../stores/sparkStore'
import { showToast } from '../utils/toast'

const props = defineProps<{
  selectedIds: string[]
}>()

const emit = defineEmits<{
  (event: 'clear'): void
  (event: 'deleted'): void
}>()

const store = useSparkStore()
const tagDraft = ref('')
const tagError = ref('')
const confirmDelete = ref(false)

const selectedCount = computed(() => props.selectedIds.length)

const previewSparks = computed(() =>
  props.selectedIds
    .map(id => store.getSpark(id))
    .filter(Boolean)
    .slice(0, 3),
)

function submitTag() {
  tagError.value = ''
  const parsed = TagAddSchema.safeParse(tagDraft.value)
  if (!parsed.success) {
    tagError.value = parsed.error.issues[0]?.message ?? 'tag must be 1 to 32 characters'
    return
  }
  store.bulkAddTag(props.selectedIds, parsed.data)
  showToast(`Tag "${parsed.data}" applied to ${selectedCount.value} sparks`, 'success')
  tagDraft.value = ''
}

function handleDelete() {
  store.bulkDeleteSparks(props.selectedIds)
  showToast(`Deleted ${selectedCount.value} sparks`, 'info')
  confirmDelete.value = false
  emit('deleted')
  emit('clear')
}
</script>

<style scoped>
.bulk-tray-enter-active,
.bulk-tray-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.bulk-tray-enter-from,
.bulk-tray-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
