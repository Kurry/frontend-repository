<template>
  <div class="px-6 py-10 text-center">
    <div
      class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
      aria-hidden="true"
    >
      <slot name="icon" />
    </div>
    <h3 class="font-heading text-[0.95rem] font-semibold text-ink">{{ title }}</h3>
    <p class="mx-auto mt-1 max-w-md text-[0.85rem] text-inksoft">{{ body }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  body: string
}>()
</script>
