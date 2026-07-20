<script setup>
import { PhCheckCircle as CheckCircleIcon, PhInfo as InfoIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'
const store = useReleaseStore()
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="toast in store.toasts" :key="toast.id" class="toast" :class="toast.tone" role="status"><CheckCircleIcon v-if="toast.tone === 'success'" :size="20" weight="fill" /><InfoIcon v-else :size="20" /><span>{{ toast.message }}</span></div>
    </TransitionGroup>
  </div>
</template>
