<script setup>
import { computed, h } from 'vue'
import { NButton, NCheckbox, NDataTable, NSelect } from 'naive-ui'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { storeToRefs } from 'pinia'
import IconFilter from '~icons/lucide/list-filter'
import IconSort from '~icons/lucide/arrow-up-down'
import IconInbox from '~icons/lucide/inbox'
import IconLayers from '~icons/lucide/layers-3'
import IconPause from '~icons/lucide/pause-circle'
import IconX from '~icons/lucide/x'
import { contributors, openFindingCounts, useQcStore } from '../store'
import StatusPill from './StatusPill.vue'
import TierChips from './TierChips.vue'

const store = useQcStore()
const { filters, sort, visibleSubmissions, selectedIds } = storeToRefs(store)

const stageOptions = [
  { label: 'All stages', value: '' }, { label: 'Submitted', value: 'submitted' }, { label: 'In review', value: 'in-review' },
  { label: 'Needs revision', value: 'needs-revision' }, { label: 'Approved', value: 'approved' },
]
const tierOptions = [{ label: 'All tiers', value: '' }, { label: 'Blocker', value: 'blocker' }, { label: 'Major', value: 'major' }, { label: 'Minor', value: 'minor' }]
const contributorOptions = [{ label: 'All contributors', value: '' }, ...contributors.map((c) => ({ label: c.name, value: c.name }))]
const sortOptions = [{ label: 'Most findings first', value: 'desc' }, { label: 'Fewest findings first', value: 'asc' }]

const activeFilterCount = computed(() => Object.values(filters.value).filter(Boolean).length)
const allVisibleSelected = computed(() => visibleSubmissions.value.length > 0 && visibleSubmissions.value.every((s) => selectedIds.value.includes(s.id)))
const someVisibleSelected = computed(() => visibleSubmissions.value.some((s) => selectedIds.value.includes(s.id)) && !allVisibleSelected.value)

const bulkPayloadSchema = z.object({
  bulk_stage: z.enum(['in-review']).optional(),
  bulk_payout_state: z.enum(['held']).optional(),
})
const bulkSchema = toTypedSchema(bulkPayloadSchema)
const { setFieldValue, validate } = useForm({ validationSchema: bulkSchema, initialValues: { bulk_stage: undefined, bulk_payout_state: undefined } })
async function runBulk(type) {
  const payload = type === 'stage' ? { bulk_stage: 'in-review' } : { bulk_payout_state: 'held' }
  if (!bulkPayloadSchema.safeParse(payload).success) return
  if (type === 'stage') setFieldValue('bulk_stage', 'in-review')
  else setFieldValue('bulk_payout_state', 'held')
  await validate()
  type === 'stage' ? store.bulkMove() : store.bulkHold()
}

const columns = [
  {
    key: 'select', width: 52,
    title: () => h(NCheckbox, {
      checked: allVisibleSelected.value,
      indeterminate: someVisibleSelected.value,
      'aria-label': 'Select all visible submissions',
      onUpdateChecked: () => store.selectVisible(visibleSubmissions.value.map((s) => s.id)),
    }),
    render: (row) => h(NCheckbox, {
      checked: selectedIds.value.includes(row.id),
      'aria-label': `Select ${row.title}`,
      onClick: (e) => e.stopPropagation(),
      onUpdateChecked: () => store.toggleSelected(row.id),
    }),
  },
  {
    title: 'Submission', key: 'title', minWidth: 310,
    render: (row) => h('div', { class: 'submission-cell' }, [
      h('span', { class: 'submission-title' }, row.title),
      h('span', { class: 'submission-id' }, `${row.id.toUpperCase()} · Updated ${new Date(row.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`),
    ]),
  },
  {
    title: 'Contributor', key: 'contributor_name', minWidth: 170,
    render: (row) => h('button', { class: 'contributor-link', onClick: (e) => { e.stopPropagation(); store.openContributor(row.contributor_name) } }, row.contributor_name),
  },
  { title: 'Stage', key: 'stage', width: 152, render: (row) => h(StatusPill, { kind: row.stage }) },
  {
    title: () => h('span', { class: 'table-heading-with-meta' }, ['Findings', h('small', {}, 'OPEN')]),
    key: 'findings', minWidth: 220, sorter: (a, b) => openFindingCounts(a).blocker + openFindingCounts(a).major + openFindingCounts(a).minor - openFindingCounts(b).blocker - openFindingCounts(b).major - openFindingCounts(b).minor,
    render: (row) => h(TierChips, { submission: row }),
  },
  { title: 'Payout', key: 'payout_state', width: 120, render: (row) => h(StatusPill, { kind: row.payout_state, type: 'payout' }) },
]

function rowProps(row) {
  return {
    class: selectedIds.value.includes(row.id) ? 'queue-row-selected' : '',
    tabindex: 0,
    'aria-label': `Open ${row.title}`,
    onClick: () => store.openSubmission(row.id),
    onKeydown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); store.openSubmission(row.id) } },
  }
}
</script>

<template>
  <main class="view-shell queue-view" aria-labelledby="queue-heading">
    <section class="queue-intro">
      <div>
        <div class="eyebrow"><span class="live-dot"></span> Live quality operations</div>
        <h1 id="queue-heading">Submission queue</h1>
        <p>Review contributor work, resolve quality gates, and ship a complete QC package.</p>
      </div>
      <div class="queue-stat" aria-label="Queue summary">
        <span>{{ store.queueSummary.total }}</span>
        <small>total submissions</small>
      </div>
    </section>

    <section class="queue-panel" aria-label="Submission queue">
      <div class="filter-toolbar">
        <div class="filter-title"><IconFilter /><span>Filter queue</span><span v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</span></div>
        <div class="filter-controls">
          <label class="filter-field" :class="{ active: filters.stage }">
            <span>Stage</span>
            <select :value="filters.stage || ''" aria-label="Filter by stage" @change="store.setFilter('stage', $event.target.value)" class="filter-select"><option v-for="opt in stageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
          </label>
          <label class="filter-field" :class="{ active: filters.tier }">
            <span>Finding tier</span>
            <select :value="filters.tier || ''" aria-label="Filter by finding tier" @change="store.setFilter('tier', $event.target.value)" class="filter-select"><option v-for="opt in tierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
          </label>
          <label class="filter-field contributor-filter" :class="{ active: filters.contributor }">
            <span>Contributor</span>
            <select :value="filters.contributor || ''" aria-label="Filter by contributor" @change="store.setFilter('contributor', $event.target.value)" class="filter-select"><option v-for="opt in contributorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
          </label>
          <label class="filter-field sort-field">
            <span><IconSort /> Sort</span>
            <select :value="sort" aria-label="Sort by open finding count" @change="store.setSort($event.target.value)" class="filter-select"><option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
          </label>
          <NButton v-if="activeFilterCount" class="clear-filter" quaternary @click="store.clearFilters"><IconX /> Clear {{ activeFilterCount }}</NButton>
        </div>
      </div>

      <Transition name="bulk-reveal">
        <form v-if="store.selectedCount" class="bulk-bar" aria-label="Bulk submission actions" @submit.prevent>
          <div class="bulk-count"><span>{{ store.selectedCount }}</span> selected</div>
          <div class="bulk-actions">
            <NButton type="primary" @click="runBulk('stage')"><IconLayers /> Move to in-review</NButton>
            <NButton @click="runBulk('payout')"><IconPause /> Hold payout</NButton>
            <NButton quaternary @click="store.clearSelection"><IconX /> Clear selection</NButton>
          </div>
        </form>
      </Transition>

      <div class="table-summary"><span>Showing <strong>{{ visibleSubmissions.length }}</strong> of {{ store.submissions.length }}</span><span>Click a row to inspect</span></div>
      <NDataTable
        v-if="visibleSubmissions.length"
        :columns="columns"
        :data="visibleSubmissions"
        :row-key="(row) => row.id"
        :row-props="rowProps"
        :bordered="false"
        :single-line="false" :scroll-x="900"
        class="queue-table"
      />
      <div v-else class="designed-empty table-empty">
        <div class="empty-icon"><IconInbox /></div>
        <h2>No submissions match</h2>
        <p>This combination of stage, tier, and contributor filters has no results.</p>
        <NButton type="primary" @click="store.clearFilters">Clear all filters</NButton>
      </div>
    </section>
  </main>
</template>
