<template>
  <div class="panel-card">
    <h2 class="panel-title">Style</h2>

    <div class="slider-row">
      <label class="slider-label" for="padding-slider">
        <span>Padding</span>
        <span class="slider-value">{{ Math.round(store.padding) }}%</span>
      </label>
      <input id="padding-slider" type="range" min="0" max="25" step="1" :value="store.padding" @input="store.padding = +($event.target as HTMLInputElement).value" />
    </div>

    <div class="slider-row">
      <label class="slider-label" for="corner-radius-slider">
        <span>Corner radius</span>
        <span class="slider-value">{{ Math.round(store.cornerRadius) }}px</span>
      </label>
      <input id="corner-radius-slider" type="range" min="0" max="48" step="1" :value="store.cornerRadius" @input="store.cornerRadius = +($event.target as HTMLInputElement).value" />
    </div>

    <div class="slider-row" style="margin-bottom:0">
      <label class="slider-label" for="shadow-slider">
        <span>Shadow</span>
        <span class="slider-value">{{ shadowLabel }}</span>
      </label>
      <input id="shadow-slider" type="range" min="0" max="10" step="1" :value="store.shadow" @input="store.shadow = +($event.target as HTMLInputElement).value" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '../stores/canvas'

const store = useCanvasStore()

const shadowLabel = computed(() => {
  const v = store.shadow
  if (v === 0) return 'None'
  if (v <= 3) return 'Soft'
  if (v <= 6) return 'Medium'
  if (v <= 8) return 'Strong'
  return 'Hard'
})
</script>
