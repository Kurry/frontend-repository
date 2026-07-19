<template>
  <div class="panel-card">
    <h2 class="panel-title">Canvas size</h2>
    <label class="field-label" for="canvas-size">Canvas size preset</label>
    <select id="canvas-size" class="size-select" :value="store.canvasSize" @change="store.canvasSize = ($event.target as HTMLSelectElement).value as any">
      <option value="square">Square (1:1) — 800×800</option>
      <option value="widescreen">Widescreen (16:9) — 1280×720</option>
      <option value="story">Story (9:16) — 720×1280</option>
      <option value="original">Original (image size)</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '../stores/canvas'
const store = useCanvasStore()
</script>

<style scoped>
.size-select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #92400e;
  border-radius: 8px;
  font-size: 12px;
  color: #713F12;
  background: #fffbf0;
  cursor: pointer;
}
.size-select:focus { border-color: #2563eb; }
</style>
