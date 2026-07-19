<script setup>
import { useSidedockStore } from '../stores/sidedock.js'

const store = useSidedockStore()
</script>

<template>
  <div class="toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite" aria-atomic="false">
    <div
      v-for="toast in store.toasts"
      :key="toast.id"
      class="toast px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto transition-all animate-slide-up"
      :style="{
        background: toast.type === 'success' ? '#059669' : toast.type === 'warning' ? '#D97706' : toast.type === 'error' ? '#DC2626' : 'var(--color-text-primary)',
        color: 'white',
      }"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
