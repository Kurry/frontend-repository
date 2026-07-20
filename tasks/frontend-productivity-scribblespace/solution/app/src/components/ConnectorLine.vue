<script setup lang="ts">
import { computed } from 'vue'
import type { Connector, CanvasObject } from '../types'

const props = defineProps<{
  connector: Connector
  objects: CanvasObject[]
}>()

const fromObj = computed(() => props.objects.find(o => o.id === props.connector.fromId))
const toObj = computed(() => props.objects.find(o => o.id === props.connector.toId))

const midpoint = computed(() => {
  if (!fromObj.value || !toObj.value) return null
  const cx1 = fromObj.value.x + fromObj.value.width / 2
  const cy1 = fromObj.value.y + fromObj.value.height / 2
  const cx2 = toObj.value.x + toObj.value.width / 2
  const cy2 = toObj.value.y + toObj.value.height / 2
  return { x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2 }
})
</script>

<template>
  <g v-if="fromObj && toObj">
    <line
      :x1="fromObj.x + fromObj.width / 2"
      :y1="fromObj.y + fromObj.height / 2"
      :x2="toObj.x + toObj.width / 2"
      :y2="toObj.y + toObj.height / 2"
      stroke="#6D5BD0"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  </g>
</template>
