<script setup>
import { watch, nextTick, ref } from 'vue'
import { NModal, NButton } from 'naive-ui'

const props = defineProps({
  show: { type: Boolean, default: false },
  itemLabel: { type: String, default: 'item' },
  itemType: { type: String, default: 'item' },
  triggerRef: { type: Object, default: null },
})

const emit = defineEmits(['confirm', 'cancel'])

const deleteBtn = ref(null)
const cancelBtn = ref(null)
const lastTrigger = ref(null)

watch(() => props.show, (open) => {
  if (open) {
    lastTrigger.value = document.activeElement
    nextTick(() => buttonEl(deleteBtn)?.focus())
  } else if (lastTrigger.value && typeof lastTrigger.value.focus === 'function') {
    nextTick(() => lastTrigger.value.focus())
    lastTrigger.value = null
  }
})

function buttonEl(ref) {
  const node = ref?.value
  return node?.$el ?? node
}

function onKeydown(event) {
  if (!props.show) return
  if (event.key === 'Tab') {
    const focusables = [buttonEl(deleteBtn), buttonEl(cancelBtn)].filter((el) => el instanceof HTMLElement)
    if (focusables.length < 2) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="`Delete ${itemType}?`"
    style="width: 420px; max-width: 92vw;"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="'delete-dialog-title'"
    @update:show="(value) => { if (!value) cancel() }"
    @keydown="onKeydown"
  >
    <p :id="'delete-dialog-title'" class="text-sm" style="color: var(--color-text-primary);">
      Delete <strong>{{ itemLabel }}</strong> and everything it contains? This cannot be undone.
    </p>
    <div class="flex justify-end gap-2 mt-4">
      <NButton ref="cancelBtn" @click="cancel">Cancel</NButton>
      <NButton ref="deleteBtn" type="error" @click="confirm">Delete</NButton>
    </div>
  </NModal>
</template>
