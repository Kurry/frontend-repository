<script setup>
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
  DialogDescription, DialogClose,
} from 'reka-ui'
import { PhX, PhKeyboard } from '@phosphor-icons/vue'

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content dialog-small">
        <div class="dialog-heading">
          <div>
            <DialogTitle class="dialog-title">Keyboard shortcuts</DialogTitle>
            <DialogDescription class="dialog-description">
              Speed up field editing and template work from the keyboard.
            </DialogDescription>
          </div>
          <DialogClose class="icon-button" aria-label="Close keyboard shortcuts dialog">
            <PhX :size="18" />
          </DialogClose>
        </div>
        <ul class="shortcut-list">
          <li><span>Undo</span><kbd>Ctrl/Cmd + Z</kbd></li>
          <li><span>Redo</span><kbd>Ctrl/Cmd + Shift + Z</kbd></li>
          <li><span>Duplicate selected field</span><kbd>Ctrl/Cmd + D</kbd></li>
          <li><span>Delete selected field</span><kbd>Delete</kbd></li>
          <li><span>Multi-select field</span><kbd>Shift + click</kbd></li>
          <li><span>Show this help</span><kbd>?</kbd></li>
        </ul>
        <div class="dialog-actions">
          <DialogClose as-child>
            <button type="button" class="button button-primary"><PhKeyboard :size="16" />Close</button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
