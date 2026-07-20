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
      <div class="toggle-row" style="margin-top: 12px">
        <span class="toggle-label">Position</span>
        <div class="toggle-group" role="group" aria-label="Caption position">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: store.captionPosition === 'above' }"
            :aria-pressed="store.captionPosition === 'above'"
            @click="store.captionPosition = 'above'"
          ><span v-if="store.captionPosition === 'above'" aria-hidden="true">✓ </span>Above</button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: store.captionPosition === 'below' }"
            :aria-pressed="store.captionPosition === 'below'"
            @click="store.captionPosition = 'below'"
          ><span v-if="store.captionPosition === 'below'" aria-hidden="true">✓ </span>Below</button>
        </div>
      </div>

      <div class="slider-row" style="margin-top: 12px">
        <label class="slider-label" for="caption-size">
          <span>Font size</span>
          <span class="slider-value">{{ Math.round(store.captionFontSize) }}px</span>
        </label>
        <input
          id="caption-size"
          type="range"
          min="12"
          max="64"
          step="1"
          :value="store.captionFontSize"
          @input="store.captionFontSize = +($event.target as HTMLInputElement).value"
        />
      </div>

      <div class="color-row">
        <label class="toggle-label" for="caption-color">Color</label>
        <input id="caption-color" type="color" :value="store.captionColor" class="color-picker-sm" @input="onColorInput" />
        <label class="sr-only" for="caption-color-hex">Caption color hex value</label>
        <input
          id="caption-color-hex"
          type="text"
          :value="store.captionColor"
          class="hex-input-sm"
          maxlength="7"
          placeholder="#RRGGBB"
          :aria-invalid="Boolean(hexError)"
          aria-describedby="caption-color-hint caption-color-error"
          @change="onHexChange"
        />
      </div>
      <div id="caption-color-hint" class="field-hint">Format: #RRGGBB</div>
      <div v-if="hexError" id="caption-color-error" class="error-msg fade-in" role="alert" aria-live="polite">{{ hexError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '../stores/canvas'
import { useAnnouncer } from '../stores/announcer'
import { INVALID_COLOR_MSG } from '../utils/recipe'

const store = useCanvasStore()
const announcer = useAnnouncer()
const hexError = ref('')

function onColorInput(e: Event) {
  store.captionColor = (e.target as HTMLInputElement).value
  hexError.value = ''
}

function onHexChange(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    store.captionColor = val
    hexError.value = ''
  } else {
    hexError.value = INVALID_COLOR_MSG
    announcer.announce(INVALID_COLOR_MSG)
    ;(e.target as HTMLInputElement).value = store.captionColor
  }
}
</script>

<style scoped>
.toggle-row { display: flex; align-items: center; justify-content: space-between; }
.toggle-label { font-size: 12px; font-weight: 700; color: #92400e; }
.toggle-group { display: flex; border: 2px solid #92400e; border-radius: 8px; overflow: hidden; }
.toggle-btn {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: #fffbf0;
  color: #92400e;
  transition: background 0.15s ease, color 0.15s ease;
}
.toggle-btn:hover { background: #fef3d0; }
.toggle-btn.active { background: #FDE047; color: #713F12; }
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
  .toggle-btn { transition: none; }
  .fade-in { animation: none; }
}
</style>
