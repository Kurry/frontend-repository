<script setup>
import { PhArrowClockwise as ArrowClockwiseIcon, PhCalendarDots as CalendarDotsIcon, PhCheckCircle as CheckCircleIcon, PhPlanet as OrbitIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'
const store = useReleaseStore()
</script>

<template>
  <section class="view-panel" aria-labelledby="rotation-title">
    <div class="view-heading rotation-heading">
      <div><div class="eyebrow">Held-out subset schedule</div><h1 id="rotation-title">Rotation cycle {{ store.rotation.cycle }}</h1><p>A three-cycle exclusion window protects evaluation freshness.</p></div>
      <button class="button primary" type="button" @click="store.advanceRotation"><ArrowClockwiseIcon :size="17" />Advance rotation</button>
    </div>
    <div class="rotation-current">
      <div class="cycle-orbit"><OrbitIcon :size="34" /><span>{{ store.rotation.cycle }}</span><small>cycle</small></div>
      <div><div class="eyebrow">Active held-out subsets</div><div class="active-subsets"><span v-for="subset in store.rotation.activeSubsets" :key="subset"><span class="live-dot" />{{ subset }}</span></div><p>These subsets are sequestered from the current training and tuning pass.</p></div>
    </div>
    <div class="history-panel">
      <div class="section-title-row"><div><h2>Rotation history</h2><p>Newest cycle first · no subset repeats within three cycles.</p></div><span class="verified-chip"><CheckCircleIcon :size="16" weight="fill" /> window verified</span></div>
      <div class="history-list">
        <article v-for="(entry, index) in store.rotation.history" :key="entry.cycle" class="history-entry" :class="{ current: index === 0 }">
          <span class="history-line" /><div class="history-cycle"><CalendarDotsIcon :size="17" />Cycle {{ entry.cycle }}</div><div class="history-subsets"><span v-for="subset in entry.subsets" :key="subset">{{ subset }}</span></div><small>{{ index === 0 ? 'active' : `${index} cycle${index === 1 ? '' : 's'} ago` }}</small>
        </article>
      </div>
      <div v-if="!store.rotation.history.length" class="empty-state compact"><p>Past rotation cycles will be recorded here.</p></div>
    </div>
  </section>
</template>
