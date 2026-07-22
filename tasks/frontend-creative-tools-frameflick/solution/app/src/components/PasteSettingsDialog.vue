<template>
  <div class="paste-overlay" @click.self="close">
    <div
      ref="dialogEl"
      class="paste-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-dialog-title"
      @keydown="onKeydown"
    >
      <h2 id="paste-dialog-title" class="paste-title">Paste settings</h2>
      <p class="paste-desc">Choose which copied groups to apply. Unchecked groups stay unchanged.</p>
      <fieldset class="paste-groups">
        <legend class="sr-only">Setting groups to paste</legend>
        <label v-for="group in SETTINGS_GROUPS" :key="group.id" class="group-row">
          <input type="checkbox" :value="group.id" v-model="checked" class="group-check" />
          <span class="group-label">{{ group.label }}</span>
        </label>
      </fieldset>
      <div class="paste-actions">
        <button ref="cancelEl" type="button" class="pill-btn ghost" @click="close">Cancel</button>
        <button type="button" class="pill-btn" @click="confirmPaste">Confirm paste</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHistoryStore, SETTINGS_GROUPS } from '../stores/history'
import type { SettingsGroup } from '../stores/history'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pasted', count: number): void
}>()

const history = useHistoryStore()
const checked = ref<SettingsGroup[]>(['background', 'composition', 'frame', 'caption', 'watermark'])
const dialogEl = ref<HTMLElement | null>(null)
const cancelEl = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!dialogEl.value) return []
  return Array.from(
    dialogEl.value.querySelectorAll<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.hasAttribute('disabled'))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'Tab') {
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

function close() {
  emit('close')
}

function confirmPaste() {
  const groups = new Set(checked.value)
  history.pasteSettings(groups)
  emit('pasted', groups.size)
}

onMounted(async () => {
  previouslyFocused = (history.pasteInvoker as HTMLElement | null) ?? (document.activeElement as HTMLElement | null)
  await nextTick()
  cancelEl.value?.focus()
})

onBeforeUnmount(() => {
  if (previouslyFocused && typeof previouslyFocused.focus === 'function' && document.contains(previouslyFocused)) {
    previouslyFocused.focus()
  }
})
</script>

<style scoped>
.paste-overlay {
  position: fixed;
  inset: 0;
  background: rgba(113, 63, 18, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.paste-dialog {
  width: 100%;
  max-width: 420px;
  background: #fffbf0;
  border: 2px solid #92400e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 16px 48px rgba(113, 63, 18, 0.35);
  animation: dialog-in 0.18s ease-out;
}
.paste-title {
  font-size: 16px;
  font-weight: 800;
  color: #713F12;
  margin-bottom: 8px;
}
.paste-desc {
  font-size: 13px;
  color: #92400e;
  margin-bottom: 16px;
  line-height: 1.4;
}
.paste-groups {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0;
}
.group-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f3d89a;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  min-height: 44px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.group-row:hover { border-color: #FDE047; background: #fefce8; }
.group-check { width: 20px; height: 20px; accent-color: #713F12; cursor: pointer; }
.group-label { font-size: 13px; font-weight: 600; color: #713F12; }
.paste-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@keyframes dialog-in {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .paste-dialog { animation: none; }
  .group-row { transition: none; }
}
</style>
