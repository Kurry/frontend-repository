<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl data-[state=open]:animate-in"
        :aria-describedby="undefined"
      >
        <DialogTitle class="mb-4 font-heading text-lg font-bold text-ink">Merge Into…</DialogTitle>

        <div v-if="step === 1">
          <label for="merge-target" class="field-label mb-2 block">Select target thread</label>
          <select id="merge-target" v-model="targetId" class="input-field mb-4 w-full">
            <option disabled value="">Choose a thread</option>
            <option v-for="thread in otherThreads" :key="thread.id" :value="thread.id">
              {{ thread.title }}
            </option>
          </select>
          <div class="flex justify-end gap-3">
            <DialogClose class="btn-secondary">Cancel</DialogClose>
            <button type="button" class="btn-primary" :disabled="!targetId" @click="step = 2">
              Continue
            </button>
          </div>
        </div>

        <div v-else-if="step === 2">
          <p class="mb-4 text-sm font-bold text-error">Warning: This action cannot be undone.</p>
          <p class="mb-4 text-sm text-inksoft">Are you sure you want to merge these threads?</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn-secondary" @click="step = 1">Back</button>
            <button type="button" class="btn-danger" @click="confirmMerge">Confirm Merge</button>
          </div>
        </div>

        <DialogClose
          class="absolute right-4 top-4 text-inksoft transition-colors hover:text-ink focus-ring"
          aria-label="Close merge dialog"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { useSparkStore } from '../stores/sparkStore'
import { showToast } from '../utils/toast'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{ sourceId: string }>()
const emit = defineEmits<{ (event: 'merged'): void }>()

const store = useSparkStore()
const step = ref(1)
const targetId = ref('')

watch(open, value => {
  if (value) {
    step.value = 1
    targetId.value = ''
  }
})

const otherThreads = computed(() =>
  store.threads.filter(thread => thread.id !== props.sourceId && !thread.archived),
)

function confirmMerge() {
  if (!targetId.value) return
  const targetTitle = store.getThread(targetId.value)?.title ?? 'target thread'
  store.mergeThreads(props.sourceId, targetId.value)
  showToast(`Merged into "${targetTitle}"`, 'success')
  emit('merged')
  open.value = false
}
</script>

<style scoped>
@keyframes merge-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

:deep([data-state='open'].animate-in) {
  animation: merge-in 0.2s ease;
}
</style>
