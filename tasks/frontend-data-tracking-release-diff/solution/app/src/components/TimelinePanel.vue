<script setup>
import { computed, ref } from 'vue'
import { PhArrowClockwise as ArrowClockwiseIcon, PhClock as ClockIcon, PhPackage as PackageIcon, PhUploadSimple as UploadSimpleIcon, PhWarningDiamond as WarningDiamondIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'
import { useReveal } from '../lib/useReveal'

const store = useReleaseStore()
const listRef = ref(null)
useReveal(listRef, { stagger: 55 })
const icons = { 'release-cut': PackageIcon, 'rank-stability-failed': WarningDiamondIcon, 'rotation-advance': ArrowClockwiseIcon, import: UploadSimpleIcon }
const labels = { 'release-cut': 'Release cut', 'rank-stability-failed': 'Check failed', 'rotation-advance': 'Rotation', import: 'Import' }
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
const formatted = computed(() => store.timeline.map((event) => ({
  ...event,
  date: event.at.slice(0, 10),
  time: timeFormat.format(new Date(event.at)),
})))
</script>

<template>
  <aside class="timeline-panel" aria-labelledby="timeline-title">
    <div class="timeline-heading"><div><div class="eyebrow">Session audit</div><h2 id="timeline-title">Event timeline</h2></div><ClockIcon :size="20" /></div>
    <div v-if="formatted.length" ref="listRef" class="timeline-list" aria-live="polite">
      <TransitionGroup name="timeline-event">
        <article v-for="event in formatted" :key="`${event.at}-${event.kind}`" class="timeline-event reveal" :class="event.kind">
          <div class="event-glyph"><component :is="icons[event.kind]" :size="16" /></div>
          <div class="event-content"><div class="event-top"><span>{{ labels[event.kind] }}</span><time :datetime="event.at">{{ event.time }} UTC</time></div><p>{{ event.description }}</p><small>{{ event.date }}</small></div>
        </article>
      </TransitionGroup>
    </div>
    <div v-else class="empty-state compact"><ClockIcon :size="28" /><h3>No events yet</h3><p>Release cuts, imports, and rotation changes will be recorded here.</p></div>
  </aside>
</template>
