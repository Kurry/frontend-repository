<template>
  <div class="sr-only" aria-live="polite" role="status" data-testid="live-announcer">{{ announcer.message }}</div>
</template>

<script setup lang="ts">
import { useAnnouncer } from '../stores/announcer'
const announcer = useAnnouncer()
</script>

<style scoped>
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
