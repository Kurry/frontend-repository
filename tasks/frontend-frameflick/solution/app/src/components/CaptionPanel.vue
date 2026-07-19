<template>
  <div class="panel-card">
    <h2 class="panel-title">Caption</h2>

    <label class="field-label" for="caption-text">Caption text</label>
    <input
      id="caption-text"
      v-model="store.captionText"
      class="text-input"
      placeholder="Add a caption…"
      maxlength="120"
    />

    <div v-if="store.captionText.trim()" class="caption-settings">
      <div class="toggle-row" style="margin-top:8px">
        <span class="toggle-label">Position</span>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: store.captionPosition === 'above' }" :aria-pressed="store.captionPosition === 'above'" @click="store.captionPosition = 'above'"><span v-if="store.captionPosition === 'above'" aria-hidden="true">✓ </span>Above</button>
          <button class="toggle-btn" :class="{ active: store.captionPosition === 'below' }" :aria-pressed="store.captionPosition === 'below'" @click="store.captionPosition = 'below'"><span v-if="store.captionPosition === 'below'" aria-hidden="true">✓ </span>Below</button>
        </div>
      </div>

      <div class="slider-row" style="margin-top:8px">
        <label class="slider-label" for="caption-size">
          <span>Font size</span>
          <span class="slider-value">{{ Math.round(store.captionFontSize) }}px</span>
        </label>
        <input id="caption-size" type="range" min="12" max="64" step="1" :value="store.captionFontSize" @input="store.captionFontSize = +($event.target as HTMLInputElement).value" />
      </div>

      <div class="color-row">
        <label class="toggle-label" for="caption-color">Color</label>
        <input id="caption-color" type="color" :value="store.captionColor" @input="store.captionColor = ($event.target as HTMLInputElement).value" class="color-picker-sm" />
        <label class="field-label hex-label" for="caption-color-hex">Hex value</label>
        <input id="caption-color-hex" type="text" :value="store.captionColor" @change="onHexChange" class="hex-input-sm" maxlength="7" placeholder="#RRGGBB" :aria-invalid="Boolean(hexError)" aria-describedby="caption-color-hint caption-color-error" />
      </div>
      <div id="caption-color-hint" class="field-hint">Format: #RRGGBB</div>
      <div v-if="hexError" id="caption-color-error" class="error-msg" role="alert">{{ hexError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
const store = useCanvasStore()
const hexError = ref('')

function onHexChange(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    store.captionColor = val
    hexError.value = ''
  } else {
    hexError.value = 'Invalid color. Enter six hexadecimal digits after #.'
  }
}
</script>

<style scoped>
.caption-settings {}
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 12px; font-weight: 600; color: #92400e; }
.toggle-group { display: flex; border: 2px solid #92400e; border-radius: 8px; overflow: hidden; }
.toggle-btn { min-height: 44px; padding: 8px 12px; font-size: 11px; font-weight: 600; cursor: pointer; border: none; background: #fffbf0; color: #92400e; transition: all 0.15s; }
.toggle-btn:hover { background: #fef3d0; }
.toggle-btn.active { background: #FDE047; color: #713F12; }
.color-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.color-picker-sm { width: 44px; height: 44px; border-radius: 8px; border: 2px solid #92400e; padding: 4px; cursor: pointer; }
.hex-label { margin: 0; }
.hex-input-sm { width: 92px; min-height: 44px; padding: 8px; border: 2px solid #92400e; border-radius: 8px; font-size: 12px; color: #713F12; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.hex-input-sm:focus { border-color: #2563eb; }
</style>
