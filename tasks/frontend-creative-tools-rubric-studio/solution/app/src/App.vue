<script setup>
import { computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import {
  PhArrowCounterClockwise as ArrowCounterClockwise, PhArrowClockwise as ArrowClockwise,
  PhList as List, PhX as X, PhPlus as Plus, PhExport as Export, PhUploadSimple as UploadSimple,
  PhSlidersHorizontal as SlidersHorizontal, PhRows as Rows, PhChartDonut as ChartDonut,
  PhCaretDown as CaretDown, PhPencilSimple as PencilSimple, PhTrash as Trash,
  PhClockCounterClockwise as ClockCounterClockwise, PhCheckCircle as CheckCircle,
  PhWarningCircle as WarningCircle, PhSparkle as Sparkle, PhArrowLeft as ArrowLeft,
  PhScales as Scales, PhStack as Stack, PhFileText as FileText,
} from '@phosphor-icons/vue'
import CriterionDialog from './components/CriterionDialog.vue'
import VersionGateDialog from './components/VersionGateDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import { useStudioStore } from './store'
import { registerWebMCP } from './webmcp'

const store = useStudioStore()
const toast = useToast()
onMounted(() => registerWebMCP(store))

const models = [
  { label: 'quartz-arbiter-2', value: 'quartz-arbiter-2' },
  { label: 'sable-jury-9', value: 'sable-jury-9' },
  { label: 'cinder-panel-1', value: 'cinder-panel-1' },
]
const aggregations = [
  { label: 'weighted mean', value: 'weighted-mean' },
  { label: 'required-pass', value: 'required-pass' },
  { label: 'all-pass', value: 'all-pass' },
]
const editingCriterion = computed(() => store.activeRubric?.criteria.find((item) => item.id === store.ui.editingId) || null)

function notify(summary, detail, severity = 'success') {
  toast.add({ severity, summary, detail, life: 2800 })
}
function openAdd() {
  store.ui.criterionMode = 'add'
  store.ui.editingId = null
  store.ui.criterionOpen = true
}
function openEdit(id) {
  store.ui.criterionMode = 'edit'
  store.ui.editingId = id
  store.ui.criterionOpen = true
}
function handleCriterion(payload) {
  if (store.ui.criterionMode === 'add') {
    const result = store.addCriterion(payload)
    if (result.ok) {
      store.ui.criterionOpen = false
      notify('Criterion added', `${payload.id} is now part of ${store.activeRubric.name}.`)
    }
    return
  }
  if (store.stageEdit(store.ui.editingId, payload)) store.ui.criterionOpen = false
  else {
    store.ui.criterionOpen = false
    notify('No changes to save', 'The criterion already matches those values.', 'info')
  }
}
function requestDelete(id) {
  store.ui.deleteId = id
  store.ui.deleteConfirmOpen = true
}
function confirmDelete() {
  const id = store.ui.deleteId
  store.ui.deleteConfirmOpen = false
  if (store.stageDelete(id)) store.ui.deleteId = null
}
function handleVersionSaved(action) {
  notify(action === 'delete' ? 'Criterion deleted' : 'Change saved', `Version ${store.activeRubric.version} is now live in this session.`)
}
function openDiff(id) {
  store.ui.activeDiffId = id
}
function toggleRationale(id) {
  const index = store.ui.expandedRationales.indexOf(id)
  if (index >= 0) store.ui.expandedRationales.splice(index, 1)
  else store.ui.expandedRationales.push(id)
}
function formatMetric(value) { return value == null ? '—' : value.toFixed(2) }
function percent(value) { return `${Math.round((value || 0) * 100)}%` }
function formatWeight(value) { return Number.isInteger(value) ? value.toFixed(1) : String(value) }
function historyDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}
function changedFields(entry) {
  if (!entry?.diff?.before || !entry?.diff?.after) return []
  return Object.keys(entry.diff.after).filter((key) => JSON.stringify(entry.diff.before[key]) !== JSON.stringify(entry.diff.after[key]))
}
function valueLabel(value) {
  if (value == null) return 'Not set'
  return typeof value === 'string' ? value : JSON.stringify(value)
}
</script>

<template>
  <div class="studio-shell">
    <Toast position="top-right" />
    <a class="skip-link" href="#studio-main">Skip to rubric canvas</a>

    <div v-if="store.ui.railOpen" class="rail-scrim" @click="store.ui.railOpen = false" />
    <aside class="library-rail" :class="{ 'rail-open': store.ui.railOpen }" aria-label="Rubric library">
      <div class="rail-brand">
        <div class="brand-mark"><Scales :size="22" weight="fill" /></div>
        <div><strong>Rubric Studio</strong><span>Evaluation library</span></div>
        <button class="icon-button rail-close" type="button" aria-label="Close rubric library" @click="store.ui.railOpen = false"><X :size="20" /></button>
      </div>
      <div class="rail-heading"><span>Rubrics</span><span>{{ store.rubrics.length }} files</span></div>
      <nav class="rubric-list">
        <button v-for="rubric in store.rubrics" :key="rubric.slug" type="button" class="rubric-entry" :class="{ active: rubric.slug === store.activeSlug }" :aria-current="rubric.slug === store.activeSlug ? 'page' : undefined" @click="store.selectRubric(rubric.slug)">
          <span class="rubric-file-icon"><FileText :size="18" weight="duotone" /></span>
          <span class="rubric-entry-copy"><strong>{{ rubric.name }}</strong><span>{{ rubric.criteria.length }} criteria</span></span>
          <span class="version-badge">v{{ rubric.version }}</span>
        </button>
      </nav>
      <div class="rail-foot">
        <span class="status-dot" /> In-memory session
        <small>Reload to restore the seeded library</small>
      </div>
    </aside>

    <main id="studio-main" class="studio-main">
      <header class="studio-toolbar">
        <div class="toolbar-leading">
          <button class="icon-button rail-toggle" type="button" aria-label="Open rubric library" @click="store.ui.railOpen = true"><List :size="21" /></button>
          <div class="toolbar-context"><span>Evaluation workspace</span><strong>{{ store.activeRubric?.name || 'Rubric library' }}</strong></div>
        </div>
        <div class="toolbar-actions">
          <Button label="Undo" severity="secondary" text size="small" :disabled="!store.undoStack.length" :title="store.undoStack.at(-1)?.label" @click="store.undo"><template #icon><ArrowCounterClockwise :size="17" /></template></Button>
          <Button label="Redo" severity="secondary" text size="small" :disabled="!store.redoStack.length" :title="store.redoStack.at(-1)?.label" @click="store.redo"><template #icon><ArrowClockwise :size="17" /></template></Button>
          <span class="toolbar-divider" />
          <Button label="Import" severity="secondary" outlined size="small" @click="store.ui.importOpen = true"><template #icon><UploadSimple :size="17" /></template></Button>
          <Button label="Export" size="small" @click="store.openExport"><template #icon><Export :size="17" /></template></Button>
        </div>
      </header>

      <div v-if="store.activeRubric" class="canvas-wrap">
        <section class="rubric-header-card" aria-labelledby="rubric-title">
          <div class="header-title-row">
            <div>
              <div class="eyebrow"><span class="live-dot" /> Open rubric</div>
              <div class="rubric-title-line"><h1 id="rubric-title">{{ store.activeRubric.name }}</h1><span class="hero-version">v{{ store.activeRubric.version }}</span></div>
            </div>
            <div class="header-fields">
              <label><span>Arbiter model</span><Select :model-value="store.activeRubric.arbiterModel" :options="models" option-label="label" option-value="value" aria-label="Arbiter model" @update:model-value="store.setModel" /></label>
              <label><span>Aggregation mode</span><Select :model-value="store.activeRubric.aggregationMode" :options="aggregations" option-label="label" option-value="value" aria-label="Aggregation mode" @update:model-value="store.setAggregation" /></label>
            </div>
          </div>
          <div class="rollup-line">
            <div><Stack :size="17" /><span><strong>{{ store.rollup.count }}</strong> criteria</span></div>
            <div class="load-rollup"><Sparkle :size="17" weight="fill" /><span><strong>{{ store.rollup.loadBearing }}</strong> load-bearing</span></div>
            <div><ChartDonut :size="17" /><span><strong>{{ formatWeight(store.rollup.totalWeight) }}</strong> total weight</span></div>
          </div>
        </section>

        <div class="view-switcher" aria-label="Rubric view">
          <button type="button" :class="{ active: store.activeView === 'criteria' && !store.ui.activeDiffId }" @click="store.setView('criteria')"><Rows :size="17" />Criteria</button>
          <button type="button" :class="{ active: store.activeView === 'tune' }" @click="store.setView('tune')"><SlidersHorizontal :size="17" />Tune</button>
          <button type="button" :class="{ active: store.activeView === 'preview' }" @click="store.setView('preview')"><ChartDonut :size="17" />Preview</button>
        </div>

        <div class="workspace-grid">
          <section class="primary-surface">
            <div v-if="store.ui.activeDiffId && store.activeDiff" class="diff-view surface-enter">
              <button class="back-button" type="button" @click="store.ui.activeDiffId = null"><ArrowLeft :size="17" />Back to criteria</button>
              <div class="section-heading diff-heading">
                <div><span class="section-kicker">Version {{ store.activeDiff.version }}</span><h2>Change details</h2><p>{{ store.activeDiff.summary }}</p></div>
                <span class="history-time">{{ historyDate(store.activeDiff.timestamp) }}</span>
              </div>
              <div v-if="store.activeDiff.diff.kind === 'added'" class="diff-card diff-added">
                <span class="diff-label"><Plus :size="15" weight="bold" />Added</span>
                <h3>{{ store.activeDiff.diff.after.name }}</h3><code>{{ store.activeDiff.diff.after.id }}</code>
                <p>{{ store.activeDiff.diff.after.description }}</p>
              </div>
              <div v-else-if="store.activeDiff.diff.kind === 'removed'" class="diff-card diff-removed">
                <span class="diff-label"><Trash :size="15" />Removed</span>
                <div class="removed-copy"><h3>{{ store.activeDiff.diff.before.name }}</h3><code>{{ store.activeDiff.diff.before.id }}</code><p>{{ store.activeDiff.diff.before.description }}</p></div>
              </div>
              <div v-else class="diff-card diff-changed">
                <span class="diff-label"><WarningCircle :size="15" />Changed</span>
                <h3>{{ store.activeDiff.diff.after.name }}</h3><code>{{ store.activeDiff.diff.criterionId }}</code>
                <div v-for="field in changedFields(store.activeDiff)" :key="field" class="diff-field">
                  <strong>{{ field }}</strong>
                  <div class="before-after"><div><span>Before</span><p>{{ valueLabel(store.activeDiff.diff.before[field]) }}</p></div><div><span>After</span><p>{{ valueLabel(store.activeDiff.diff.after[field]) }}</p></div></div>
                </div>
              </div>
            </div>

            <div v-else-if="store.activeView === 'criteria'" class="criteria-view surface-enter">
              <div class="section-heading row-heading">
                <div><span class="section-kicker">Scoring framework</span><h2>Criteria</h2><p>Expand a row to review its guidance and rationale.</p></div>
                <Button label="Add criterion" @click="openAdd"><template #icon><Plus :size="17" weight="bold" /></template></Button>
              </div>
              <Accordion v-if="store.activeRubric.criteria.length" multiple :value="store.ui.expandedCriteria" class="criteria-accordion" @update:value="store.ui.expandedCriteria = $event">
                <AccordionPanel v-for="item in store.activeRubric.criteria" :key="item.id" :value="item.id" class="criterion-panel" :class="{ 'load-bearing': item.weight >= 3, 'new-row': store.ui.newCriterionId === item.id }">
                  <AccordionHeader>
                    <div class="criterion-summary">
                      <div class="criterion-identity"><code>{{ item.id }}</code><strong>{{ item.name }}</strong></div>
                      <div class="criterion-meta">
                        <span class="type-chip">{{ item.type === 'likert' ? `likert ${item.likertMin}-${item.likertMax}` : 'binary' }}</span>
                        <span class="weight-chip" :class="{ heavy: item.weight >= 3 }">weight {{ formatWeight(item.weight) }}</span>
                        <span class="importance-chip" :class="item.importance">{{ item.importance === 'must-have' ? 'must have' : 'nice to have' }}</span>
                      </div>
                    </div>
                  </AccordionHeader>
                  <AccordionContent>
                    <div class="criterion-detail">
                      <p class="criterion-description">{{ item.description }}</p>
                      <button type="button" class="rationale-toggle" :aria-expanded="store.ui.expandedRationales.includes(item.id)" @click="toggleRationale(item.id)">
                        <CaretDown :size="16" :class="{ rotated: store.ui.expandedRationales.includes(item.id) }" />Rationale notes
                      </button>
                      <div class="rationale-wrap" :class="{ open: store.ui.expandedRationales.includes(item.id) }">
                        <p>Use this signal {{ item.importance === 'must-have' ? 'as a required quality floor' : 'to distinguish otherwise strong responses' }}. Its weight of {{ formatWeight(item.weight) }} {{ item.weight >= 3 ? 'makes it load-bearing in the rollup.' : 'keeps it intentionally secondary.' }}</p>
                      </div>
                      <div class="criterion-actions"><Button label="Edit criterion" severity="secondary" text size="small" @click="openEdit(item.id)"><template #icon><PencilSimple :size="16" /></template></Button><Button label="Delete" severity="danger" text size="small" @click="requestDelete(item.id)"><template #icon><Trash :size="16" /></template></Button></div>
                    </div>
                  </AccordionContent>
                </AccordionPanel>
              </Accordion>
              <div v-else class="empty-state"><div class="empty-icon"><Rows :size="27" /></div><h3>No criteria yet</h3><p>Criteria define what the arbiter evaluates. Add one to rebuild this rubric.</p><Button label="Add criterion" @click="openAdd"><template #icon><Plus :size="17" /></template></Button></div>
            </div>

            <div v-else-if="store.activeView === 'tune'" class="tune-view surface-enter">
              <div class="section-heading"><span class="section-kicker">Labelled evaluation set</span><h2>Tune</h2><p>Include cases and adjust likert pass thresholds to test scoring sensitivity.</p></div>
              <div class="metric-summary-strip">
                <div><span>Included cases</span><strong>{{ store.includedCases.length }} / {{ store.cases.length }}</strong></div>
                <div><span>Macro precision</span><strong>{{ formatMetric(store.macroMetrics?.precision) }}</strong></div>
                <div><span>Macro recall</span><strong>{{ formatMetric(store.macroMetrics?.recall) }}</strong></div>
                <div><span>Macro F1</span><strong>{{ formatMetric(store.macroMetrics?.f1) }}</strong></div>
              </div>
              <div class="tune-grid">
                <aside class="case-panel">
                  <div class="panel-title"><strong>Labelled cases</strong><span>{{ store.includedCases.length }} included</span></div>
                  <div class="case-list">
                    <label v-for="labelled in store.cases" :key="labelled.id" class="case-row"><span><code>{{ labelled.id }}</code><small>{{ labelled.label }}</small></span><ToggleSwitch :model-value="labelled.included" :aria-label="`Include ${labelled.id}`" @update:model-value="store.toggleCase(labelled.id, $event)" /></label>
                  </div>
                </aside>
                <div class="metrics-panel">
                  <div v-if="!store.activeRubric.criteria.length" class="empty-state compact"><h3>No criteria to tune</h3><p>Add criteria in the Criteria view to see performance bars.</p></div>
                  <div v-else-if="!store.includedCases.length" class="empty-state compact"><div class="empty-icon"><SlidersHorizontal :size="25" /></div><h3>No cases included</h3><p>Turn on at least one labelled case to compute precision, recall, and F1 without zero-division artifacts.</p></div>
                  <article v-for="item in store.includedCases.length ? store.activeRubric.criteria : []" :key="item.id" class="metric-card">
                    <div class="metric-card-head"><div><code>{{ item.id }}</code><h3>{{ item.name }}</h3></div><label v-if="item.type === 'likert'" class="threshold-control"><span>Pass threshold</span><Select :model-value="store.thresholds[store.activeSlug][item.id]" :options="Array.from({ length: item.likertMax - item.likertMin + 1 }, (_, i) => item.likertMin + i)" :aria-label="`Pass threshold for ${item.name}`" @update:model-value="store.setThreshold(item.id, $event)" /></label></div>
                    <div v-for="metric in ['precision', 'recall', 'f1']" :key="metric" class="metric-row"><span>{{ metric === 'f1' ? 'F1' : metric }}</span><div class="metric-track"><span :style="{ width: percent(store.metricsFor(item)?.[metric]) }" /></div><strong>{{ formatMetric(store.metricsFor(item)?.[metric]) }}</strong></div>
                  </article>
                </div>
              </div>
            </div>

            <div v-else class="preview-view surface-enter">
              <div class="section-heading"><span class="section-kicker">Sample submission</span><h2>Weighted-total preview</h2><p>Set verdicts to inspect how the current aggregation mode changes the final score.</p></div>
              <div v-if="store.activeRubric.criteria.length">
                <div class="suggestion-row"><span>Suggestions</span><button type="button" class="suggestion-chip" @click="store.applyVerdictPattern('all-pass')"><CheckCircle :size="15" />All pass</button><button type="button" class="suggestion-chip" @click="store.applyVerdictPattern('all-fail')"><X :size="15" />All fail</button><button type="button" class="suggestion-chip" @click="store.applyVerdictPattern('must-haves')"><Sparkle :size="15" />Must-haves only</button></div>
                <div class="preview-layout">
                  <div class="verdict-list">
                    <label v-for="item in store.activeRubric.criteria" :key="item.id" class="verdict-row"><span class="verdict-copy"><code>{{ item.id }}</code><strong>{{ item.name }}</strong><small>{{ item.importance === 'must-have' ? 'Must have' : 'Nice to have' }} · weight {{ formatWeight(item.weight) }}</small></span><span class="verdict-control" :class="{ pass: store.verdicts[store.activeSlug][item.id] }"><b>{{ store.verdicts[store.activeSlug][item.id] ? 'Pass' : 'Fail' }}</b><ToggleSwitch :model-value="store.verdicts[store.activeSlug][item.id]" :aria-label="`Verdict for ${item.name}`" @update:model-value="store.setVerdict(item.id, $event)" /></span></label>
                  </div>
                  <aside class="aggregate-card">
                    <span>Aggregate score</span><strong :key="Math.round(store.aggregate * 10)" class="aggregate-value">{{ Math.round(store.aggregate) }}<small>%</small></strong>
                    <div class="score-ring" :style="{ '--score': `${store.aggregate * 3.6}deg` }"><span /></div>
                    <p>Using <b>{{ aggregations.find((item) => item.value === store.activeRubric.aggregationMode)?.label }}</b></p>
                  </aside>
                </div>
              </div>
              <div v-else class="empty-state"><div class="empty-icon"><ChartDonut :size="27" /></div><h3>No verdicts to preview</h3><p>Add criteria to create the sample submission panel.</p><Button label="Go to criteria" @click="store.setView('criteria')" /></div>
            </div>
          </section>

          <aside class="history-surface" aria-label="Version history">
            <div class="history-header"><div class="history-icon"><ClockCounterClockwise :size="19" /></div><div><h2>Version history</h2><span>Newest first</span></div></div>
            <div v-if="store.activeHistory.length" class="history-list">
              <button v-for="entry in store.activeHistory" :key="entry.id" type="button" class="history-entry" :class="{ active: store.ui.activeDiffId === entry.id }" @click="openDiff(entry.id)">
                <span class="history-node" /><span class="history-copy"><span><strong>v{{ entry.version }}</strong><time>{{ historyDate(entry.timestamp) }}</time></span><small>{{ entry.summary }}</small></span>
              </button>
            </div>
            <div v-else class="history-empty"><ClockCounterClockwise :size="23" /><strong>No saved versions yet</strong><span>Version-gated changes will appear here.</span></div>
          </aside>
        </div>
      </div>

      <div v-else class="empty-library"><h1>No rubrics in this package</h1><p>Import a package containing at least one rubric to open the canvas.</p><Button label="Import package" @click="store.ui.importOpen = true" /></div>
    </main>

    <CriterionDialog :open="store.ui.criterionOpen" :mode="store.ui.criterionMode" :criterion="editingCriterion" @close="store.ui.criterionOpen = false" @submitted="handleCriterion" />
    <VersionGateDialog :open="store.ui.versionOpen" @close="store.cancelPending" @saved="handleVersionSaved" />
    <ExportDialog :open="store.ui.exportOpen" @close="store.ui.exportOpen = false" @copied="(label) => notify(label === 'Copy unavailable' ? 'Copy unavailable' : 'Copied to clipboard', label, label === 'Copy unavailable' ? 'error' : 'success')" />
    <ImportDialog :open="store.ui.importOpen" @close="store.ui.importOpen = false" @imported="store.ui.importOpen = false; notify('Package imported', 'The rubric library now matches the imported package.')" />
    <Dialog :visible="store.ui.deleteConfirmOpen" modal header="Delete criterion?" :style="{ width: 'min(460px, calc(100vw - 24px))' }" @update:visible="!$event && (store.ui.deleteConfirmOpen = false)">
      <div class="delete-confirm"><div class="danger-icon"><Trash :size="22" /></div><p>This removes <strong>{{ store.ui.deleteId }}</strong> from the rubric. A major version bump will be required before the deletion is applied.</p></div>
      <template #footer><Button label="Cancel" severity="secondary" text @click="store.ui.deleteConfirmOpen = false" /><Button label="Continue to version" severity="danger" @click="confirmDelete" /></template>
    </Dialog>
  </div>
</template>
