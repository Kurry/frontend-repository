<template>
  <div class="panel-card">
    <h2 class="panel-title">Position &amp; zoom</h2>

    <div class="slider-row">
      <label class="slider-label" for="zoom-slider">
        <span>Zoom</span>
        <span class="slider-value">{{ Math.round(store.zoom) }}%</span>
      </label>
      <input id="zoom-slider" type="range" min="20" max="200" step="1" :value="store.zoom" @input="store.zoom = +($event.target as HTMLInputElement).value" />
    </div>

    <div class="pos-info">{{ store.showingBefore ? 'Position is locked while previewing Before' : 'Drag the canvas or use the move buttons to reposition' }}</div>
    <div class="move-grid" role="group" aria-label="Move image">
      <button type="button" class="move-btn up" :disabled="store.showingBefore" aria-label="Move image up" title="Move image up" @click="move(0, -10)">↑</button>
      <button type="button" class="move-btn left" :disabled="store.showingBefore" aria-label="Move image left" title="Move image left" @click="move(-10, 0)">←</button>
      <button type="button" class="move-btn right" :disabled="store.showingBefore" aria-label="Move image right" title="Move image right" @click="move(10, 0)">→</button>
      <button type="button" class="move-btn down" :disabled="store.showingBefore" aria-label="Move image down" title="Move image down" @click="move(0, 10)">↓</button>
    </div>

    <button type="button" class="pill-btn ghost" :disabled="store.showingBefore" style="width:100%;margin-top:8px;font-size:11px;" @click="reset">
      <span aria-hidden="true">🎯</span> Reset position
    </button>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '../stores/canvas'
const store = useCanvasStore()
// Position edits are disabled while the Before preview is shown (matches the
// canvas drag + arrow-key behavior), so they can't edit the hidden live look.
function move(x: number, y: number) { if (store.showingBefore) return; store.posX += x; store.posY += y }
function reset() { if (store.showingBefore) return; store.resetPosition() }
</script>

<style scoped>
.pos-info { font-size: 12px; color: #713F12; text-align: center; margin-top: 8px; }
.move-grid {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-areas:
    ". up ."
    "left . right"
    ". down .";
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
}
.move-btn {
  min-width: 44px;
  min-height: 44px;
  border: 2px solid #92400e;
  border-radius: 8px;
  background: #fff;
  color: #713F12;
  font-size: 20px;
  cursor: pointer;
}
.up { grid-area: up; }
.left { grid-area: left; }
.right { grid-area: right; }
.down { grid-area: down; }
</style>
