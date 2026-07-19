<template>
  <span
    class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 font-mono text-[0.72rem] leading-none text-primary"
  >
    #{{ tag }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  tag: string
}>()
</script>
