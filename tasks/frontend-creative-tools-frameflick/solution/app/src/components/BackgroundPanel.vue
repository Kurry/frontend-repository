<template>
  <div class="panel-card">
    <h2 class="panel-title">Background</h2>

    <!-- Preset swatches -->
    <div class="swatches" role="group" aria-label="Background presets">
      <button
        v-for="preset in BG_PRESETS"
        :key="preset.id"
        type="button"
        class="swatch"
        :style="{ background: preset.value }"
        :class="{ active: !store.useCustomBg && store.backgroundPreset === preset.id }"
        :title="preset.label"
        :aria-label="`${preset.label} background`"
        :aria-pressed="!store.useCustomBg && store.backgroundPreset === preset.id"
        @click="selectPreset(preset.id)"
      >
        <span v-if="!store.useCustomBg && store.backgroundPreset === preset.id" class="selected-mark" aria-hidden="true">✓</span>
      </button>
    </div>

    <!-- Custom color -->
    <div class="custom-row">
      <button
        type="button"
        class="custom-toggle"
        :class="{ active: store.useCustomBg }"
        :aria-pressed="store.useCustomBg"
        @click="toggleCustom"
      >Custom</button>
      <div v-if="store.useCustomBg" class="color-inputs">
        <label class="sr-only" for="background-color">Custom background color picker</label>
        <input id="background-color" type="color" :value="store.customBgColor" class="color-picker" @input="onColorInput" />
        <label class="sr-only" for="background-hex">Custom background hex value</label>
        <input
          id="background-hex"
          type="text"
          :value="store.customBgColor"
          class="hex-input"
          maxlength="7"
          placeholder="#FDE047"
          :aria-invalid="Boolean(hexError)"
          aria-describedby="background-hex-error"
          @change="onHexChange"
        />
      </div>
    </div>
    <div v-if="hexError" id="background-hex-error" class="error-msg fade-in" role="alert" aria-live="polite">{{ hexError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore, BACKGROUND_PRESETS } from '../stores/canvas'
import { useAnnouncer } from '../stores/announcer'
import { INVALID_COLOR_MSG } from '../utils/recipe'

const BG_PRESETS = BACKGROUND_PRESETS
const store = useCanvasStore()
const announcer = useAnnouncer()
const hexError = ref('')

function selectPreset(id: string) {
  store.backgroundPreset = id
  store.useCustomBg = false
  hexError.value = ''
}

function toggleCustom() {
  store.useCustomBg = !store.useCustomBg
  hexError.value = ''
}

function onColorInput(e: Event) {
  store.customBgColor = (e.target as HTMLInputElement).value
  store.useCustomBg = true
  hexError.value = ''
}

function onHexChange(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    store.customBgColor = val
    store.useCustomBg = true
    hexError.value = ''
  } else {
    // Keep the last valid color rendering; reject the bad hex with a named error.
    hexError.value = INVALID_COLOR_MSG
    announcer.announce(INVALID_COLOR_MSG)
    ;(e.target as HTMLInputElement).value = store.customBgColor
  }
}
</script>

<style scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.swatch {
  aspect-ratio: 1;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid #92400e;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  position: relative;
}
.swatch:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 4px 12px rgba(113, 63, 18, 0.25); }
.swatch.active {
  border-color: #713F12;
  box-shadow: 0 0 0 3px rgba(253, 224, 71, 0.6);
  transform: scale(1.05);
}
.selected-mark {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #fff;
  color: #713F12;
  font-size: 16px;
  font-weight: 900;
}
.custom-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.custom-toggle {
  font-size: 11px;
  font-weight: 700;
  padding: 8px 16px;
  min-height: 44px;
  border-radius: 999px;
  border: 2px solid #92400e;
  background: #fff;
  cursor: pointer;
  color: #92400e;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.custom-toggle:hover { border-color: #FDE047; transform: translateY(-1px); }
.custom-toggle.active { background: #FDE047; color: #713F12; border-color: #FDE047; }
.color-inputs { display: flex; align-items: center; gap: 8px; }
.color-picker { width: 44px; height: 44px; border-radius: 8px; border: 2px solid #92400e; padding: 4px; }
.hex-input {
  width: 88px;
  min-height: 44px;
  padding: 8px;
  border: 2px solid #92400e;
  border-radius: 8px;
  font-size: 12px;
  color: #713F12;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hex-input:focus { border-color: #2563eb; }
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
  .swatch, .custom-toggle { transition: none; }
  .swatch:hover, .custom-toggle:hover, .swatch.active { transform: none; }
  .fade-in { animation: none; }
}
</style>
