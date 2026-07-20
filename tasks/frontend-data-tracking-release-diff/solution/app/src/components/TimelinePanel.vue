<script setup>
import { computed } from 'vue'
import { PhArrowClockwise as ArrowClockwiseIcon, PhClock as ClockIcon, PhPackage as PackageIcon, PhUploadSimple as UploadSimpleIcon, PhWarningDiamond as WarningDiamondIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const icons = { 'release-cut': PackageIcon, 'rank-stability-failed': WarningDiamondIcon, 'rotation-advance': ArrowClockwiseIcon, import: UploadSimpleIcon }
const labels = { 'release-cut': 'Release cut', 'rank-stability-failed': 'Check failed', 'rotation-advance': 'Rotation', import: 'Import' }
const formatted = computed(() => store.timeline.map((event) => ({
  ...event,
  date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(event.at)),
  time: new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(event.at)),
})))
</script>

<template>
  <aside class="timeline-panel" aria-labelledby="timeline-title">
    <div class="timeline-heading"><div><div class="eyebrow">Session audit</div><h2 id="timeline-title">Event timeline</h2></div><ClockIcon :size="20" /></div>
    <div v-if="formatted.length" class="timeline-list" aria-live="polite">
      <TransitionGroup name="timeline-event">
        <article v-for="event in formatted" :key="`${event.at}-${event.kind}`" class="timeline-event" :class="event.kind">
          <div class="event-glyph"><component :is="icons[event.kind]" :size="16" /></div>
          <div class="event-content"><div class="event-top"><span>{{ labels[event.kind] }}</span><time :datetime="event.at">{{ event.time }}</time></div><p>{{ event.description }}</p><small>{{ event.date }} · UTC</small></div>
        </article>
      </TransitionGroup>
    </div>
    <div v-else class="empty-state compact"><ClockIcon :size="28" /><h3>No events yet</h3><p>Release cuts, imports, and rotation changes will be recorded here.</p></div>
  </aside>
</template>
