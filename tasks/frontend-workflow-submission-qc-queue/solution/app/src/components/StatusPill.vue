<script setup>
import { computed } from 'vue'
const props = defineProps({ kind: { type: String, required: true }, type: { type: String, default: 'stage' } })
const label = computed(() => props.kind.replace('-', ' '))
</script>

<template>
  <span class="status-pill" :class="`${type}-${kind}`">
    <span class="status-dot" aria-hidden="true"></span>{{ label }}
  </span>
</template>
