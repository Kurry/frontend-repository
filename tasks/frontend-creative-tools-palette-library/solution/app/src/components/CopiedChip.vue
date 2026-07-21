<template>
  <Transition name="chip-pop">
    <span
      v-if="show"
      class="pointer-events-none absolute z-20 bg-ink text-cream font-mono text-[11px] leading-none px-2 py-1.5 rounded-sm shadow-md whitespace-nowrap"
      role="status"
    >
      Copied {{ hex }}
    </span>
  </Transition>
</template>

<script setup>
defineProps({
  hex: { type: String, required: true },
  show: { type: Boolean, default: false },
});
</script>
