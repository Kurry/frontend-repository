<template>
  <PlanList v-if="store.activeMode === 'Plan List' || store.activeMode === 'Map'" />
  <BudgetView v-else-if="store.activeMode === 'Budget'" />
  <SpreadsheetView v-else-if="store.activeMode === 'Spreadsheet'" />
  <div v-else class="p-8 text-center text-slate-500">
    <h2 class="text-2xl font-bold mb-4">{{ store.activeMode }}</h2>
    <p>This view is under construction.</p>
  </div>
</template>

<script setup lang="ts">
import { useTripStore } from '~/stores/trip'
const store = useTripStore()
</script>
