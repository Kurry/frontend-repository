<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.match">{{ part.text }}</mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  query?: string
}>()

const parts = computed(() => {
  const text = props.text
  const query = (props.query ?? '').trim()
  if (!query) return [{ text, match: false }]
  const result: { text: string; match: boolean }[] = []
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let index = 0
  while (index < text.length) {
    const found = lower.indexOf(q, index)
    if (found === -1) {
      result.push({ text: text.slice(index), match: false })
      break
    }
    if (found > index) result.push({ text: text.slice(index, found), match: false })
    result.push({ text: text.slice(found, found + q.length), match: true })
    index = found + q.length
  }
  return result
})
</script>
