<script setup>
import { computed } from 'vue'
import { PhCaretDown as CaretDownIcon, PhArrowsLeftRight as ArrowsLeftRightIcon, PhGitDiff as GitDiffIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const nonEmpty = computed(() => store.diffRows.length > 0)
const marker = { added: '+', removed: '−', changed: '~', unchanged: '·' }
const digest = (value) => value ? `${value.slice(0, 10)}…` : '—'
</script>

<template>
  <section class="view-panel" aria-labelledby="diff-title">
    <div class="view-heading">
      <div><div class="eyebrow">Version comparator</div><h1 id="diff-title">Version diff</h1><p>Classify every task across two sealed manifests.</p></div>
    </div>

    <div class="diff-controls">
      <label>Base version
        <select :value="store.diffBase" aria-label="Base version" @change="store.setDiffBase($event.target.value)">
          <option v-for="version in store.versions" :key="version.name" :value="version.name">v{{ version.name }} · {{ version.taskCount }} tasks</option>
        </select>
      </label>
      <button class="icon-button swap-button" type="button" title="Swap base and compare" aria-label="Swap base and compare versions" @click="store.swapDiff"><ArrowsLeftRightIcon :size="20" /></button>
      <label>Compare version
        <select :value="store.diffCompare" aria-label="Compare version" @change="store.setDiffCompare($event.target.value)">
          <option v-for="version in store.versions" :key="version.name" :value="version.name">v{{ version.name }} · {{ version.taskCount }} tasks</option>
        </select>
      </label>
    </div>

    <div class="summary-strip" aria-label="Diff summary">
      <div class="summary-cell added"><span>+</span><strong>{{ store.diffSummary.added }}</strong><small>Added</small></div>
      <div class="summary-cell removed"><span>−</span><strong>{{ store.diffSummary.removed }}</strong><small>Removed</small></div>
      <div class="summary-cell changed"><span>~</span><strong>{{ store.diffSummary.changed }}</strong><small>Changed</small></div>
      <div class="summary-cell unchanged"><span>·</span><strong>{{ store.diffSummary.unchanged }}</strong><small>Unchanged</small></div>
    </div>

    <div v-if="nonEmpty && !store.changedDiffRows.length" class="empty-state compact diff-identical">
      <GitDiffIcon :size="30" />
      <h2>These manifests are identical</h2>
      <p>{{ store.diffBase === store.diffCompare ? `v${store.diffBase} compared against itself has no added, removed, or changed tasks.` : `v${store.diffBase} and v${store.diffCompare} share every task unchanged.` }} Expand the stable tasks below to review them.</p>
    </div>

    <div v-if="nonEmpty" class="diff-list" aria-live="polite">
      <TransitionGroup v-if="store.diffBase !== store.diffCompare && store.changedDiffRows.length" name="diff-row">
        <article v-for="row in store.changedDiffRows" :key="`${store.diffBase}-${store.diffCompare}-${row.slug}`" class="diff-row" :class="row.kind">
          <span class="kind-marker" aria-hidden="true">{{ marker[row.kind] }}</span>
          <span class="kind-label">{{ row.kind }}</span>
          <div class="diff-task"><strong>{{ row.slug }}</strong><span>{{ row.task.title }}</span></div>
          <div v-if="row.kind === 'changed'" class="digest-pair"><code>{{ digest(row.before.contentDigest) }}</code><span>→</span><code>{{ digest(row.after.contentDigest) }}</code></div>
          <code v-else>{{ digest(row.task.contentDigest) }}</code>
        </article>
      </TransitionGroup>

      <button class="unchanged-disclosure" type="button" :aria-expanded="store.unchangedExpanded" aria-controls="unchanged-rows" @click="store.unchangedExpanded = !store.unchangedExpanded">
        <CaretDownIcon :size="17" :class="{ rotated: store.unchangedExpanded }" />
        <span>Unchanged {{ store.diffSummary.unchanged }}</span>
        <small>{{ store.unchangedExpanded ? 'Collapse stable tasks' : 'Show stable tasks' }}</small>
      </button>
      <Transition name="collapse">
        <div v-if="store.unchangedExpanded" id="unchanged-rows" class="unchanged-group">
          <article v-for="row in store.unchangedDiffRows" :key="row.slug" class="diff-row unchanged">
            <span class="kind-marker" aria-hidden="true">·</span><span class="kind-label">unchanged</span>
            <div class="diff-task"><strong>{{ row.slug }}</strong><span>{{ row.task.title }}</span></div><code>{{ digest(row.task.contentDigest) }}</code>
          </article>
        </div>
      </Transition>
    </div>
    <div v-else class="empty-state"><GitDiffIcon :size="34" /><h2>No tasks to compare</h2><p>Tasks from the selected manifest pair will appear here.</p></div>
  </section>
</template>
