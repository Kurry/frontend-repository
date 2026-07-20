<script setup>
import { computed } from 'vue'
import { openFindingCounts } from '../store'
const props = defineProps({ submission: { type: Object, required: true } })
const counts = computed(() => openFindingCounts(props.submission))
const total = computed(() => counts.value.blocker + counts.value.major + counts.value.minor)
</script>

<template>
  <div v-if="total" class="tier-chips" aria-label="Open findings by tier">
    <span v-if="counts.blocker" class="tier-chip tier-blocker"><span aria-hidden="true">!</span> {{ counts.blocker }} blocker</span>
    <span v-if="counts.major" class="tier-chip tier-major">{{ counts.major }} major</span>
    <span v-if="counts.minor" class="tier-chip tier-minor">{{ counts.minor }} minor</span>
  </div>
  <span v-else class="zero-findings"><span aria-hidden="true">✓</span> Zero open</span>
</template>
