<template>
  <div class="panel-card">
    <h2 class="panel-title">Watermark</h2>

    <div class="toggle-row">
      <span class="toggle-label">Enable watermark</span>
      <button class="toggle-switch" :class="{ on: store.watermarkEnabled }" :aria-pressed="store.watermarkEnabled" aria-label="Enable watermark" @click="store.watermarkEnabled = !store.watermarkEnabled">
        <span class="toggle-knob" aria-hidden="true" />
      </button>
    </div>

    <div v-if="store.watermarkEnabled" class="wm-settings">
      <label class="field-label" for="watermark-text">Watermark text</label>
      <input
        id="watermark-text"
        v-model="store.watermarkText"
        class="text-input"
        style="margin-top:8px"
        placeholder="Watermark text…"
        maxlength="40"
      />

      <div class="slider-row" style="margin-top:8px">
        <label class="slider-label" for="watermark-opacity">
          <span>Opacity</span>
          <span class="slider-value">{{ Math.round(store.watermarkOpacity) }}%</span>
        </label>
        <input id="watermark-opacity" type="range" min="5" max="100" step="5" :value="store.watermarkOpacity" @input="store.watermarkOpacity = +($event.target as HTMLInputElement).value" />
      </div>

      <div class="corner-grid">
        <button v-for="c in corners" :key="c.value" class="corner-btn" :class="{ active: store.watermarkCorner === c.value }" :aria-pressed="store.watermarkCorner === c.value" @click="store.watermarkCorner = c.value">
          <span v-if="store.watermarkCorner === c.value" aria-hidden="true">✓ </span>{{ c.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '../stores/canvas'
import type { WatermarkCorner } from '../stores/canvas'

const store = useCanvasStore()

const corners: { value: WatermarkCorner; label: string }[] = [
  { value: 'tl', label: '↖ TL' },
  { value: 'tr', label: '↗ TR' },
  { value: 'bl', label: '↙ BL' },
  { value: 'br', label: '↘ BR' },
]
</script>

<style scoped>
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 12px; font-weight: 600; color: #92400e; }
.toggle-switch {
  width: 48px; height: 28px; min-height: 28px; border-radius: 14px;
  background: #e9c97a; border: 2px solid #713F12; cursor: pointer;
  position: relative; transition: background 0.2s; padding: 0;
}
.toggle-switch.on { background: #f59e0b; }
.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  display: block;
}
.toggle-switch.on .toggle-knob { transform: translateX(20px); }
.wm-settings {}
.corner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.corner-btn {
  min-height: 44px;
  padding: 8px;
  border: 2px solid #92400e;
  border-radius: 8px;
  background: #fffbf0;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
  cursor: pointer;
  transition: all 0.15s;
}
.corner-btn:hover { border-color: #FDE047; background: #fef3d0; }
.corner-btn.active { background: #FDE047; border-color: #f59e0b; color: #713F12; }
</style>
