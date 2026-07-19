<template>
  <div class="panel-card">
    <h2 class="panel-title">Frame style</h2>
    <div class="frame-options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="frame-opt"
        :class="{ active: store.frameStyle === opt.value }"
        @click="store.frameStyle = opt.value"
        :aria-pressed="store.frameStyle === opt.value"
      >
        <span class="frame-icon">{{ opt.icon }}</span>
        <span class="frame-label">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '../stores/canvas'
import type { FrameStyle } from '../stores/canvas'

const store = useCanvasStore()

const options: { value: FrameStyle; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⬜' },
  { value: 'browser', label: 'Browser', icon: '🌐' },
  { value: 'phone', label: 'Phone', icon: '📱' },
]
</script>

<style scoped>
.frame-options {
  display: flex;
  gap: 8px;
}
.frame-opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid #92400e;
  border-radius: 10px;
  background: #fffbf0;
  cursor: pointer;
  transition: all 0.15s;
}
.frame-opt:hover { border-color: #FDE047; background: #fef9e0; }
.frame-opt.active { border-color: #f59e0b; background: #FDE047; box-shadow: 0 0 0 3px rgba(253,224,71,0.3); }
.frame-icon { font-size: 18px; }
.frame-label { font-size: 11px; font-weight: 700; color: #713F12; }
</style>
