<template>
  <DialogRoot :open="isOpen" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/40" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl" :aria-describedby="undefined">
        <DialogTitle class="font-heading text-lg font-bold text-ink mb-4">Merge Into…</DialogTitle>

        <div v-if="step === 1">
          <label class="field-label mb-2 block">Select target thread</label>
          <select v-model="targetId" class="input-field w-full mb-4">
            <option disabled value="">Choose a thread</option>
            <option v-for="thread in otherThreads" :key="thread.id" :value="thread.id">
              {{ thread.title }}
            </option>
          </select>
          <div class="flex justify-end gap-3">
            <DialogClose class="btn-secondary">Cancel</DialogClose>
            <button class="btn-primary" :disabled="!targetId" @click="step = 2">Continue</button>
          </div>
        </div>

        <div v-else-if="step === 2">
          <p class="text-sm text-ink mb-4 font-bold text-error">Warning: This action cannot be undone.</p>
          <p class="text-sm text-inksoft mb-4">Are you sure you want to merge these threads?</p>
          <div class="flex justify-end gap-3">
            <button class="btn-secondary" @click="step = 1">Back</button>
            <button class="btn-danger" @click="confirmMerge">Confirm Merge</button>
          </div>
        </div>

        <DialogClose class="absolute top-4 right-4 text-inksoft hover:text-ink">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose
} from 'reka-ui'
import { useSparkStore } from '../stores/sparkStore'

const props = defineProps<{ isOpen: boolean; sourceId: string }>()
const emit = defineEmits<{ (e: 'update:open', val: boolean): void; (e: 'merged'): void }>()

const store = useSparkStore()
const step = ref(1)
const targetId = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    step.value = 1
    targetId.value = ''
  }
})

const otherThreads = computed(() => {
  return store.threads.filter(t => t.id !== props.sourceId && !t.archived)
})

function confirmMerge() {
  if (!targetId.value) return
  store.mergeThreads(props.sourceId, targetId.value)
  emit('merged')
  emit('update:open', false)
}
</script>
