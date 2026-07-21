<template>
  <div class="confirm-overlay" @click.self="cancel">
    <div
      ref="dialogEl"
      class="confirm-dialog panel-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelId"
      @keydown="onDialogKeydown"
    >
      <h2 :id="labelId" class="confirm-title">{{ title }}</h2>
      <p class="confirm-body">{{ body }}</p>
      <div class="confirm-actions">
        <button ref="cancelEl" type="button" class="pill-btn ghost" @click="cancel">Cancel</button>
        <button type="button" class="pill-btn danger" @click="confirm">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  title: string
  body: string
  confirmLabel?: string
  labelId: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const dialogEl = ref<HTMLElement | null>(null)
const cancelEl = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!dialogEl.value) return []
  return Array.from(
    dialogEl.value.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.hasAttribute('disabled'))
}

function onDialogKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
    return
  }
  if (e.key === 'Tab') {
    // Trap focus inside the dialog while it is open.
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && (active === first || !dialogEl.value?.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    } else if (!dialogEl.value?.contains(active)) {
      e.preventDefault()
      first.focus()
    }
  }
}

function cancel() {
  emit('cancel')
}
function confirm() {
  emit('confirm')
}

onMounted(async () => {
  previouslyFocused = document.activeElement as HTMLElement | null
  await nextTick()
  cancelEl.value?.focus()
})

onBeforeUnmount(() => {
  // Return focus to the control that opened the dialog.
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus()
  }
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(113, 63, 18, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.confirm-dialog {
  width: 100%;
  max-width: 400px;
  background: #fffbf0;
  border: 2px solid #92400e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 16px 48px rgba(113, 63, 18, 0.35);
  animation: dialog-in 0.18s ease-out;
}
.confirm-title {
  font-size: 16px;
  font-weight: 800;
  color: #713F12;
  margin-bottom: 8px;
}
.confirm-body {
  font-size: 14px;
  line-height: 1.5;
  color: #713F12;
  margin-bottom: 16px;
}
.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
@keyframes dialog-in {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .confirm-dialog { animation: none; }
}
</style>
