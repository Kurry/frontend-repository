<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[0.72rem] font-medium leading-none"
    :class="badgeClass"
  >
    <svg viewBox="0 0 8 8" class="h-2 w-2" aria-hidden="true" focusable="false">
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThreadStatus } from '../stores/sparkStore'

const props = defineProps<{
  status: ThreadStatus
}>()

const badgeClass = computed(() => {
  switch (props.status) {
    case 'dormant':
      return 'bg-warning text-ink'
    case 'resolved':
      return 'bg-success text-white'
    default:
      return 'bg-primary text-white'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'dormant':
      return 'Dormant'
    case 'resolved':
      return 'Resolved'
    default:
      return 'Active'
  }
})
</script>
