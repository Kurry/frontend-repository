<template>
  <div class="panel-card">
    <h2 class="panel-title">Background</h2>

    <!-- Presets swatches -->
    <div class="swatches">
      <button
        v-for="preset in BG_PRESETS"
        :key="preset.id"
        type="button"
        class="swatch"
        :style="{ background: preset.value }"
        :class="{ active: !store.useCustomBg && store.backgroundPreset === preset.id }"
        @click="selectPreset(preset.id)"
        :title="preset.label"
        :aria-label="`${preset.label} background`"
        :aria-pressed="!store.useCustomBg && store.backgroundPreset === preset.id"
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
        @click="store.useCustomBg = !store.useCustomBg"
        :aria-pressed="store.useCustomBg"
      >Custom</button>
      <div v-if="store.useCustomBg" class="color-inputs">
        <label class="sr-only" for="background-color">Background color</label>
        <input id="background-color" type="color" :value="store.customBgColor" @input="onColorInput" class="color-picker" />
        <label class="sr-only" for="background-hex">Background hex value</label>
        <input
          id="background-hex"
          type="text"
          :value="store.customBgColor"
          @change="onHexChange"
          class="hex-input"
          maxlength="7"
          placeholder="#FDE047"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore, BACKGROUND_PRESETS } from '../stores/canvas'

const BG_PRESETS = BACKGROUND_PRESETS
const store = useCanvasStore()

function selectPreset(id: string) {
  store.backgroundPreset = id
  store.useCustomBg = false
}

function onColorInput(e: Event) {
  store.customBgColor = (e.target as HTMLInputElement).value
  store.useCustomBg = true
}

function onHexChange(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    store.customBgColor = val
    store.useCustomBg = true
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
  transition: all 0.15s;
  position: relative;
}
.swatch:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.swatch.active { border-color: #713F12; box-shadow: 0 0 0 3px rgba(253,224,71,0.5); transform: scale(1.08); }
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
  padding: 8px 12px;
  min-height: 44px;
  border-radius: 999px;
  border: 2px solid #92400e;
  background: #fff;
  cursor: pointer;
  color: #92400e;
  transition: all 0.15s;
}
.custom-toggle:hover { border-color: #FDE047; }
.custom-toggle.active { background: #FDE047; color: #713F12; border-color: #FDE047; }
.color-inputs { display: flex; align-items: center; gap: 8px; }
.color-picker { width: 44px; height: 44px; border-radius: 8px; border: 2px solid #92400e; padding: 4px; }
.hex-input {
  width: 80px;
  min-height: 44px;
  padding: 8px;
  border: 2px solid #92400e;
  border-radius: 6px;
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
</style>
