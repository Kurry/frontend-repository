<template>
  <div class="panel-card">
    <h2 class="panel-title">Watermark</h2>

    <div class="toggle-row">
      <span class="toggle-label" id="wm-toggle-label">Enable watermark</span>
      <button
        type="button"
        class="toggle-switch"
        :class="{ on: store.watermarkEnabled }"
        :aria-pressed="store.watermarkEnabled"
        aria-labelledby="wm-toggle-label"
        @click="store.watermarkEnabled = !store.watermarkEnabled"
      >
        <span class="toggle-knob" aria-hidden="true" />
      </button>
    </div>

    <div v-if="store.watermarkEnabled" class="wm-settings">
      <label class="field-label" for="watermark-text">Watermark text</label>
      <input
        id="watermark-text"
        v-model="store.watermarkText"
        class="text-input"
        style="margin-top: 4px"
        placeholder="Watermark text…"
        maxlength="40"
      />

      <div class="slider-row" style="margin-top: 12px">
        <label class="slider-label" for="watermark-opacity">
          <span>Opacity</span>
          <span class="slider-value">{{ Math.round(store.watermarkOpacity) }}%</span>
        </label>
        <input
          id="watermark-opacity"
          type="range"
          min="5"
          max="100"
          step="5"
          :value="store.watermarkOpacity"
          @input="store.watermarkOpacity = +($event.target as HTMLInputElement).value"
        />
      </div>

      <div class="color-row">
        <label class="toggle-label" for="watermark-color">Color</label>
        <input
          id="watermark-color"
          type="color"
          :value="store.watermarkColor"
          class="color-picker-sm"
          @input="onColorInput"
        />
        <label class="sr-only" for="watermark-color-hex">Watermark color hex value</label>
        <input
          id="watermark-color-hex"
          type="text"
          :value="store.watermarkColor"
          class="hex-input-sm"
          maxlength="7"
          placeholder="#RRGGBB"
          :aria-invalid="Boolean(hexError)"
          aria-describedby="watermark-color-error"
          @change="onHexChange"
        />
      </div>
      <div v-if="hexError" id="watermark-color-error" class="error-msg fade-in" role="alert" aria-live="polite">{{ hexError }}</div>

      <fieldset class="corner-fieldset">
        <legend class="field-label">Corner</legend>
        <div class="corner-grid">
          <button
            v-for="c in corners"
            :key="c.value"
            type="button"
            class="corner-btn"
            :class="{ active: store.watermarkCorner === c.value }"
            :aria-pressed="store.watermarkCorner === c.value"
            @click="store.watermarkCorner = c.value"
          ><span v-if="store.watermarkCorner === c.value" aria-hidden="true">✓ </span>{{ c.label }}</button>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import type { WatermarkCorner } from '../stores/canvas'
import { useAnnouncer } from '../stores/announcer'
import { INVALID_COLOR_MSG } from '../utils/recipe'

const store = useCanvasStore()
const announcer = useAnnouncer()
const hexError = ref('')

const corners: { value: WatermarkCorner; label: string }[] = [
  { value: 'tl', label: '↖ TL' },
  { value: 'tr', label: '↗ TR' },
  { value: 'bl', label: '↙ BL' },
  { value: 'br', label: '↘ BR' },
]

function onColorInput(e: Event) {
  store.watermarkColor = (e.target as HTMLInputElement).value
  hexError.value = ''
}

function onHexChange(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    store.watermarkColor = val
    hexError.value = ''
  } else {
    hexError.value = INVALID_COLOR_MSG
    announcer.announce(INVALID_COLOR_MSG)
    ;(e.target as HTMLInputElement).value = store.watermarkColor
  }
}
</script>

<style scoped>
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 12px; font-weight: 700; color: #92400e; }
.toggle-switch {
  width: 52px;
  height: 28px;
  min-height: 28px;
  border-radius: 999px;
  background: #e9c97a;
  border: 2px solid #713F12;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  padding: 0;
}
.toggle-switch.on { background: #f59e0b; }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
  display: block;
}
.toggle-switch.on .toggle-knob { transform: translateX(24px); }
.wm-settings { margin-top: 12px; }
.color-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.color-picker-sm { width: 44px; height: 44px; border-radius: 8px; border: 2px solid #92400e; padding: 4px; cursor: pointer; }
.hex-input-sm {
  width: 96px;
  min-height: 44px;
  padding: 8px;
  border: 2px solid #92400e;
  border-radius: 8px;
  font-size: 12px;
  color: #713F12;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hex-input-sm:focus { border-color: #2563eb; }
.corner-fieldset { border: none; padding: 0; margin: 12px 0 0; }
.corner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
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
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.corner-btn:hover { border-color: #FDE047; background: #fef3d0; transform: translateY(-1px); }
.corner-btn.active { background: #FDE047; border-color: #f59e0b; color: #713F12; }
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
.fade-in { animation: feedback-in 0.2s ease-out; }
@keyframes feedback-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .toggle-switch, .toggle-knob, .corner-btn { transition: none; }
  .corner-btn:hover { transform: none; }
  .fade-in { animation: none; }
}
</style>
