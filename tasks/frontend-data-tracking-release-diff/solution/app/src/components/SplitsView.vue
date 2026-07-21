<script setup>
import { ref } from 'vue'
import { PhChartBar as ChartBarIcon, PhLinkSimple as LinkSimpleIcon, PhWarningCircle as WarningCircleIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'
import { useReveal } from '../lib/useReveal'

const store = useReleaseStore()
const gridRef = ref(null)
useReveal(gridRef)
const width = (item) => `${Math.min(100, (item.current / item.target) * 100)}%`
</script>

<template>
  <section class="view-panel" aria-labelledby="splits-title">
    <div class="view-heading"><div><div class="eyebrow">Composition catalog</div><h1 id="splits-title">Splits & quotas</h1><p>Current category coverage against the release target, recomputed from whichever release is selected.</p></div></div>
    <p class="split-source"><LinkSimpleIcon :size="13" /> Derived live from <strong>v{{ store.selectedVersionName }}</strong> · {{ store.selectedVersion?.taskCount }} manifest tasks</p>
    <div ref="gridRef" class="split-grid">
      <article v-for="split in store.splitComposition" :key="split.name" class="split-card reveal">
        <div class="split-card-head"><div class="split-icon"><ChartBarIcon :size="18" /></div><div><h2>{{ split.name }}</h2><p>{{ split.description }}</p></div></div>
        <div class="quota-list">
          <div v-for="category in split.categories" :key="category.name" class="quota-row" :class="{ shortfall: category.current < category.target }">
            <div class="quota-label"><span>{{ category.name }}</span><span v-if="category.current < category.target" class="shortfall-label"><WarningCircleIcon :size="14" /> short {{ category.target - category.current }}</span></div>
            <div class="quota-meter"><div class="quota-track"><span class="quota-fill" :style="{ width: width(category) }" /><span v-if="category.current < category.target" class="quota-hatch" :style="{ left: width(category) }" /></div><strong>{{ category.current }}<small>/{{ category.target }}</small></strong></div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
