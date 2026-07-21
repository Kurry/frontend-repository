<script setup>
import { computed, watch } from 'vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()

const steps = [
  {
    selector: '.release-sidebar',
    title: 'The sealed register',
    copy: 'Every corpus version lives in the releases sidebar with its cut date and task count. Pick one to load its immutable task manifest — the newest release is selected for you.',
  },
  {
    selector: '.tab-list',
    title: 'Four views, one store',
    copy: 'Manifest, Diff, Splits, and Rotation all read the same shared Pinia store, so a sealed cut or an import updates every view — and the release pack — without a reload.',
  },
  {
    selector: '[data-tour="cut"]',
    title: 'Cut a sealed release',
    copy: 'Cutting walks four steps — collect manifests, compute digests, rank-stability check, seal. The gate blocks on a correlation below 0.95 and lets you retry the draw.',
  },
  {
    selector: '[data-tour="pack"]',
    title: 'Ship the release pack',
    copy: 'Export compiles a live, schema-shaped Release pack JSON or a Manifest summary you can copy or download. Import validates the same contract before replacing the session.',
  },
  {
    selector: '.timeline-panel',
    title: 'The audit trail',
    copy: 'Completed cuts and rotation advances append timestamped events here, newest first — the same timeline that travels inside the release pack.',
  },
  {
    selector: '[data-tour="prefs"]',
    title: 'Make it yours',
    copy: 'Press ⌘K (or Ctrl+K) for the command palette, and use preferences for a dark theme, compact density, and reduced motion. That’s the tour — happy releasing.',
  },
]

const stepIndex = computed(() => Math.min(store.tourStep, steps.length - 1))
const step = computed(() => steps[stepIndex.value])
const isLast = computed(() => stepIndex.value === steps.length - 1)

let highlighted = null
function clearHighlight() {
  if (highlighted) { highlighted.classList.remove('tour-highlight'); highlighted = null }
}

watch([() => store.tourOpen, stepIndex], ([open]) => {
  clearHighlight()
  if (!open) return
  const target = document.querySelector(step.value.selector)
  if (target) {
    target.classList.add('tour-highlight')
    highlighted = target
    target.scrollIntoView({ behavior: store.reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }
}, { flush: 'post' })

watch(() => store.tourOpen, (open) => { if (!open) clearHighlight() })

function back() { if (stepIndex.value > 0) store.setTourStep(stepIndex.value - 1) }
function next() {
  if (isLast.value) store.closeTour()
  else store.setTourStep(stepIndex.value + 1)
}
</script>

<template>
  <div v-if="store.tourOpen" class="tour-card" role="dialog" aria-label="Guided tour" aria-live="polite">
    <p class="tour-eyebrow">Guided tour · step {{ stepIndex + 1 }} of {{ steps.length }}</p>
    <h2 class="tour-title">{{ step.title }}</h2>
    <p class="tour-copy">{{ step.copy }}</p>
    <div class="tour-footer">
      <div class="tour-dots" aria-hidden="true">
        <span v-for="(item, index) in steps" :key="item.title" class="tour-dot" :class="{ active: index === stepIndex }" />
      </div>
      <button class="button secondary" type="button" @click="store.closeTour()">Skip</button>
      <button v-if="stepIndex > 0" class="button secondary" type="button" @click="back">Back</button>
      <button class="button primary" type="button" @click="next">{{ isLast ? 'Finish' : 'Next' }}</button>
    </div>
  </div>
</template>
