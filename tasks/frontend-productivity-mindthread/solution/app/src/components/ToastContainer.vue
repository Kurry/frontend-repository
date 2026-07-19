<template>
  <div
    class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 max-w-[calc(100vw-32px)] flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="rounded-md border-l-4 bg-ink px-4 py-3 text-[0.9rem] font-medium text-white shadow-lg"
        :class="{
          'border-l-primary': toast.type === 'info',
          'border-l-success': toast.type === 'success',
          'border-l-error': toast.type === 'error',
        }"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { toasts } from '../utils/toast'
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
