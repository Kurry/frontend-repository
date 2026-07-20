<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useCalibrationStore } from './store'
import { classificationSchema, calibrationPackSchema, triagePackSchema, zodIssueMessage } from './schemas'
import VChart from 'vue-echarts'
import { use as useECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

useECharts([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

const store = useCalibrationStore()
const lastCellTrigger = ref(null)
const lastOverlayTrigger = ref(null)
const exportTrigger = ref(null)
const paletteTrigger = ref(null)
const drawerRef = ref(null)
const paletteQuery = ref('')
const copied = ref(false)
const triageOpen = computed({
  get: () => store.ui.triageOpen,
  set: (value) => { store.ui.triageOpen = value },
})
const triageMode = ref('single')
const triageTarget = ref('')
const importError = ref('')
const fileInput = ref(null)
let thresholdCommitTimer = null

const {
  defineField: defineTriageField,
  errors: triageErrors,
  meta: triageMeta,
  resetForm: resetTriageForm,
  validate: validateTriage,
  setFieldError: setTriageFieldError,
} = useForm({ validationSchema: toTypedSchema(classificationSchema), initialValues: { task: '', classification: '', rationale: '' } })

const [taskField, taskAttrs] = defineTriageField('task', { validateOnModelUpdate: true })
const [classificationField, classificationAttrs] = defineTriageField('classification', { validateOnModelUpdate: true })
const [rationaleField, rationaleAttrs] = defineTriageField('rationale', { validateOnModelUpdate: true })

const importFormSchema = z.object({ payload: z.string().trim().min(1, 'payload is required; paste JSON or choose a file') })
const {
  defineField: defineImportField,
  errors: importErrors,
  meta: importMeta,
  resetForm: resetImportForm,
  setFieldError: setImportFieldError,
  validate: validateImportForm,
} = useForm({ validationSchema: toTypedSchema(importFormSchema), initialValues: { payload: '' } })
const [importPayload, importPayloadAttrs] = defineImportField('payload', { validateOnModelUpdate: true })

const navItems = [
  { value: 'heatmap', label: 'Heatmap', icon: 'mdi-grid' },
  { value: 'variance', label: 'Variance', icon: 'mdi-chart-bell-curve' },
  { value: 'chart', label: 'Chart', icon: 'mdi-chart-bar' },
  { value: 'timeline', label: 'Timeline', icon: 'mdi-timeline-clock-outline' },
]

const commands = computed(() => [
  ...navItems.map((item) => ({ ...item, hint: 'Go to view', run: () => store.goTo(item.value) })),
  { value: 'export', label: 'Export calibration pack', icon: 'mdi-export-variant', hint: 'Open JSON and CSV', run: () => openExport() },
  { value: 'clear-filters', label: 'Clear all filters', icon: 'mdi-filter-off-outline', hint: 'Restore full dataset', run: () => store.clearFilters() },
  { value: 'pin-baseline', label: 'Pin baseline', icon: 'mdi-pin-outline', hint: 'Snapshot live cell means', run: () => store.pinBaseline() },
])

const filteredCommands = computed(() => {
  const query = paletteQuery.value.trim().toLowerCase()
  return query ? commands.value.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(query)) : commands.value
})

const activeSeries = computed(() => store.activeHarnesses.filter((harness) => store.chartSeriesVisibility[harness]))
const scoreChartOption = computed(() => ({
  animationDuration: 420,
  animationDurationUpdate: 360,
  color: ['#6255c7', '#0e8b7c', '#d27835', '#3f78b8'],
  grid: { left: 48, right: 18, top: 20, bottom: 86 },
  tooltip: {
    trigger: 'item',
    formatter: (params) => `<strong>${params.seriesName}</strong><br/>${params.name}: ${Number(params.value).toFixed(2)}`,
  },
  xAxis: {
    type: 'category',
    data: store.tasks.map((task) => task.name),
    axisLabel: { rotate: 38, fontSize: 10, color: '#64748b', interval: 0 },
    axisLine: { lineStyle: { color: '#d9dfeb' } },
  },
  yAxis: {
    type: 'value', min: 0, max: 1,
    axisLabel: { formatter: (value) => value.toFixed(1), color: '#64748b' },
    splitLine: { lineStyle: { color: '#edf0f6' } },
  },
  series: activeSeries.value.map((harness) => ({
    name: harness,
    type: 'bar',
    barMaxWidth: 18,
    itemStyle: { borderRadius: [4, 4, 0, 0] },
    emphasis: { focus: 'series' },
    data: store.tasks.map((task) => store.scoreForTask(task.name, store.selectedChartModel, harness)),
  })),
}))

const distributionOption = computed(() => {
  const trials = store.selectedCell?.trials || []
  return {
    animationDuration: 280,
    color: ['#6255c7'],
    grid: { left: 38, right: 12, top: 12, bottom: 30 },
    tooltip: { trigger: 'item', formatter: (params) => `${trials[params.dataIndex]?.id}<br/>Reward: ${Number(params.value).toFixed(3)}` },
    xAxis: { type: 'category', data: trials.map((_, index) => `T${index + 1}`), axisTick: { show: false }, axisLabel: { color: '#7a8497' } },
    yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: '#7a8497', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf0f6' } } },
    series: [{ type: 'bar', barMaxWidth: 28, itemStyle: { borderRadius: [5, 5, 0, 0] }, data: trials.map((trial) => trial.reward) }],
  }
})

const selectedRun = computed(() => store.ui.selectedCellKey ? store.reruns[store.ui.selectedCellKey] : null)
const exportText = computed(() => store.ui.exportTab === 'json' ? store.exportJson : store.exportCsv)
const activeFilterCount = computed(() => store.filters.model.length + store.filters.harness.length + store.filters.taskCategory.length)

function heatColor(mean) {
  const value = Math.max(0, Math.min(1, (mean - 0.42) / 0.48))
  const hue = Math.round(value * 118)
  return `hsl(${hue} 67% 85%)`
}

function heatBorder(mean) {
  const hue = Math.round(Math.max(0, Math.min(1, (mean - 0.42) / 0.48)) * 118)
  return `hsl(${hue} 45% 63%)`
}

function cellDelta(model, harness) {
  const baseline = store.baselineMap[store.cellKey(model, harness)]
  if (baseline === undefined) return null
  return store.getCellMean(model, harness) - baseline
}

function formatDelta(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(timestamp))
}

function openCell(cell, event) {
  lastCellTrigger.value = event?.currentTarget || null
  store.openCell(cell.model, cell.harness)
}

function closeCell() {
  store.closeCell()
}

function runCell(cell) {
  store.startRerun(cell.model, cell.harness)
}

async function openTriage(row = null, mode = 'single') {
  triageMode.value = mode
  triageTarget.value = row?.task || store.selectedVarianceTasks[0] || ''
  const previous = store.classifications[triageTarget.value]
  resetTriageForm({
    values: {
      task: triageTarget.value,
      classification: previous?.classification || '',
      rationale: previous?.rationale || '',
    },
  })
  triageOpen.value = true
  await nextTick()
  validateTriage()
}

async function submitTriage() {
  const validation = await validateTriage()
  if (!validation.valid) return
  const values = {
    task: taskField.value,
    classification: classificationField.value,
    rationale: rationaleField.value,
  }
  const result = triageMode.value === 'bulk'
    ? store.bulkClassify([...store.selectedVarianceTasks], values.classification, values.rationale)
    : store.classify(values)
  if (result.ok) {
    triageOpen.value = false
  } else {
    const msg = result.message || (result.error && result.error.issues ? result.error.issues[0].message : 'Classification failed');
    const field = result.field || (result.error && result.error.issues ? result.error.issues[0].path[0] : 'task');
    setTriageFieldError(field, msg);
  }
}

function closeTriage() {
  triageOpen.value = false
}

function updateFilter(type, values) {
  store.setFilter(type, values || [])
}

function finishThreshold() {
  if (thresholdCommitTimer) window.clearTimeout(thresholdCommitTimer)
  thresholdCommitTimer = null
  store.finishThresholdEdit()
}

function triggerElement(candidate) {
  const element = candidate?.$el || candidate
  if (!(element instanceof HTMLElement) || element === document.body || element === document.documentElement || element.closest('.palette-dialog')) return null
  return element
}

function rememberOverlayTrigger(event, fallback) {
  lastOverlayTrigger.value = triggerElement(event?.currentTarget) || triggerElement(document.activeElement) || triggerElement(fallback)
}

function openExport(event) {
  rememberOverlayTrigger(event, exportTrigger.value)
  store.openExport()
}

function openPalette(event) {
  rememberOverlayTrigger(event, paletteTrigger.value)
  store.ui.paletteOpen = true
}

function closeOverlay(kind) {
  if (kind === 'palette') store.ui.paletteOpen = false
  else store.ui.exportOpen = false
  const trigger = lastOverlayTrigger.value
  lastOverlayTrigger.value = null
  nextTick(() => trigger?.focus?.())
}

function onThresholdUpdate(value) {
  store.beginThresholdEdit()
  store.previewThreshold(value)
  if (thresholdCommitTimer) window.clearTimeout(thresholdCommitTimer)
  thresholdCommitTimer = window.setTimeout(finishThreshold, 80)
}

function selectCommand(command) {
  command.run()
  store.ui.paletteOpen = false
  paletteQuery.value = ''
}

async function copyActive() {
  try {
    await navigator.clipboard.writeText(exportText.value)
  } catch {
    const area = document.createElement('textarea')
    area.value = exportText.value
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1500)
}

function downloadActive() {
  const json = store.ui.exportTab === 'json'
  const blob = new Blob([exportText.value], { type: json ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = json ? 'meridian-calibration.json' : 'meridian-variance.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function openImport() {
  resetImportForm({ values: { payload: '' } })
  importError.value = ''
  store.openImport()
}

async function pickImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importPayload.value = await file.text()
  importError.value = ''
}

async function submitImport() {
  const validation = await validateImportForm()
  if (!validation.valid) return
  importError.value = ''
  let parsedJson
  try {
    parsedJson = JSON.parse(importPayload.value)
  } catch {
    const message = 'payload: must be valid JSON'
    importError.value = message
    setImportFieldError('payload', message)
    return
  }
  if (!parsedJson || typeof parsedJson !== 'object' || Array.isArray(parsedJson)) {
    importError.value = 'payload: must be a JSON object'
    setImportFieldError('payload', importError.value)
    return
  }
  if (parsedJson.schemaVersion !== 1) {
    importError.value = 'schemaVersion: must be 1'
    setImportFieldError('payload', importError.value)
    return
  }
  if (!['meridian-triage', 'meridian-calibration'].includes(parsedJson.document)) {
    importError.value = 'document: must be meridian-triage or meridian-calibration'
    setImportFieldError('payload', importError.value)
    return
  }
  const isTriage = parsedJson.document === 'meridian-triage'
  const requiredArray = isTriage ? 'entries' : 'triage'
  if (!Array.isArray(parsedJson[requiredArray])) {
    importError.value = `${requiredArray}: must be an array of Classification payloads`
    setImportFieldError('payload', importError.value)
    return
  }
  const parsed = (isTriage ? triagePackSchema : calibrationPackSchema).safeParse(parsedJson)
  if (!parsed.success) {
    const message = zodIssueMessage(parsed.error)
    importError.value = message
    setImportFieldError('payload', message)
    return
  }
  const entries = isTriage ? parsed.data.entries : parsed.data.triage
  const result = store.importClassifications(entries)
  if (!result.ok) {
    importError.value = result.message
    setImportFieldError('payload', result.message)
    return
  }
  store.ui.importOpen = false
}

function onGlobalKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openPalette(event)
    return
  }
  if ((store.ui.exportOpen || store.ui.paletteOpen) && ['Escape', 'Tab'].includes(event.key)) {
    trapDrawerFocus(event)
    return
  }
  if (event.key === 'Escape') {
    if (store.ui.paletteOpen) store.ui.paletteOpen = false
    else if (triageOpen.value) closeTriage()
    else if (store.ui.importOpen) store.ui.importOpen = false
    else if (store.ui.exportOpen) store.ui.exportOpen = false
    else if (store.ui.cellDrawerOpen) closeCell()
    return
  }
  const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)
  if (!editable && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
  }
}

function trapDrawerFocus(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (store.ui.paletteOpen) closeOverlay('palette')
    else if (store.ui.exportOpen) closeOverlay('export')
    else if (store.ui.cellDrawerOpen) closeCell()
    return
  }
  if (event.key !== 'Tab') return
  let root = null
  if (store.ui.paletteOpen) root = document.querySelector('.palette-dialog')
  else if (store.ui.exportOpen) root = document.querySelector('.export-drawer')
  else if (store.ui.cellDrawerOpen) root = drawerRef.value?.$el || drawerRef.value
  if (!root) return
  const focusable = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!root.contains(document.activeElement)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

watch(() => store.ui.cellDrawerOpen, async (open) => {
  if (open) {
    await nextTick()
    const root = drawerRef.value?.$el || drawerRef.value
    root?.querySelector?.('[data-drawer-close]')?.focus()
  } else {
    await nextTick()
    lastCellTrigger.value?.focus?.()
  }
})

watch(() => store.ui.copyRequest, () => copyActive())
watch(() => store.ui.paletteOpen, (open) => { if (!open) paletteQuery.value = '' })

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (thresholdCommitTimer) window.clearTimeout(thresholdCommitTimer)
})
</script>

<template>
  <v-app class="meridian-app">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true"><v-icon icon="mdi-axis-arrow" size="23" /></div>
        <div>
          <div class="eyebrow">EVAL OPERATIONS</div>
          <h1>Meridian Calibration</h1>
        </div>
      </div>
      <div class="header-actions">
        <div class="live-pill"><span></span> Seeded session</div>
        <v-tooltip text="Undo (Ctrl/⌘ Z)" location="bottom">
          <template #activator="{ props }"><v-btn v-bind="props" icon="mdi-undo-variant" variant="text" size="small" :disabled="!store.canUndo" aria-label="Undo" @click="store.undo" /></template>
        </v-tooltip>
        <v-tooltip text="Redo (Ctrl/⌘ Shift Z)" location="bottom">
          <template #activator="{ props }"><v-btn v-bind="props" icon="mdi-redo-variant" variant="text" size="small" :disabled="!store.canRedo" aria-label="Redo" @click="store.redo" /></template>
        </v-tooltip>
        <v-btn class="toolbar-button" prepend-icon="mdi-import" variant="tonal" size="small" @click="openImport">Import</v-btn>
        <v-btn ref="exportTrigger" class="toolbar-button" prepend-icon="mdi-export-variant" color="primary" size="small" @click="openExport">Export</v-btn>
        <button ref="paletteTrigger" class="command-key" aria-label="Open command palette" @click="openPalette"><v-icon icon="mdi-magnify" size="17" /> <span>⌘ K</span></button>
      </div>
    </header>

    <main class="page-shell">
      <section class="overview-row">
        <div>
          <p class="kicker">INTER-HARNESS AGREEMENT</p>
          <h2>{{ navItems.find((item) => item.value === store.activeView)?.label }}</h2>
          <p class="lede">Inspect score alignment, isolate divergent tasks, and package the session with confidence.</p>
        </div>
        <div class="overview-actions">
          <v-btn v-if="!store.baseline" prepend-icon="mdi-pin-outline" variant="outlined" color="primary" @click="store.pinBaseline">Pin baseline</v-btn>
          <v-btn v-else prepend-icon="mdi-pin-off-outline" variant="outlined" color="primary" @click="store.clearBaseline">Clear baseline</v-btn>
          <div v-if="store.baseline" class="baseline-badge"><v-icon icon="mdi-check-decagram" size="16" /> Baseline pinned</div>
        </div>
      </section>

      <section class="filter-card panel-card" aria-label="Calibration filters">
        <div class="filter-title">
          <span><v-icon icon="mdi-tune-variant" size="18" /> Filters</span>
          <span class="filter-count">{{ activeFilterCount ? `${activeFilterCount} selections` : 'Showing all data' }}</span>
        </div>
        <div class="filter-grid">
          <v-select
            label="Models" :items="store.models" :model-value="store.filters.model" multiple chips closable-chips hide-details
            aria-label="Filter models" @update:model-value="updateFilter('model', $event)"
          />
          <v-select
            label="Harnesses" :items="store.harnesses" :model-value="store.filters.harness" multiple chips closable-chips hide-details
            aria-label="Filter harnesses" @update:model-value="updateFilter('harness', $event)"
          />
          <v-select
            label="Task categories" :items="store.categories" :model-value="store.filters.taskCategory" multiple chips closable-chips hide-details
            aria-label="Filter task categories" @update:model-value="updateFilter('taskCategory', $event)"
          />
          <v-btn prepend-icon="mdi-filter-off-outline" variant="text" :disabled="!activeFilterCount" @click="store.clearFilters">Clear filters</v-btn>
        </div>
      </section>

      <nav class="view-tabs" aria-label="Calibration views">
        <button
          v-for="item in navItems" :key="item.value" :class="{ active: store.activeView === item.value }"
          :aria-current="store.activeView === item.value ? 'page' : undefined" @click="store.goTo(item.value)"
        ><v-icon :icon="item.icon" size="18" />{{ item.label }}</button>
      </nav>

      <section v-if="store.activeView === 'heatmap'" class="workspace-grid heatmap-workspace">
        <article class="panel-card heatmap-card">
          <div class="panel-heading">
            <div><p class="section-label">CALIBRATION MATRIX</p><h3>Mean reward by harness</h3></div>
            <div class="ramp-legend" aria-label="Score color ramp"><span>Lower</span><i></i><span>Higher</span></div>
          </div>
          <div v-if="store.activeModels.length && store.activeHarnesses.length" class="heatmap-scroll">
            <table class="heatmap-table">
              <thead><tr><th>Model</th><th v-for="harness in store.activeHarnesses" :key="harness">{{ harness }}</th></tr></thead>
              <tbody>
                <tr v-for="model in store.activeModels" :key="model">
                  <th scope="row"><span class="model-dot"></span>{{ model }}</th>
                  <td v-for="harness in store.activeHarnesses" :key="harness">
                    <div
                      class="heat-cell" :class="{ busy: ['queued', 'running'].includes(store.reruns[store.cellKey(model, harness)]?.status) }"
                      :style="{ background: heatColor(store.getCellMean(model, harness)), borderColor: heatBorder(store.getCellMean(model, harness)) }"
                    >
                      <v-tooltip location="top" :open-delay="180">
                        <template #activator="{ props }">
                          <button
                            v-bind="props" class="cell-main"
                            :aria-label="`${model} on ${harness}, mean ${store.getCellMean(model, harness).toFixed(2)}, ${store.cells[store.cellKey(model, harness)].trials.length} trials`"
                            @click="openCell(store.cells[store.cellKey(model, harness)], $event)"
                          >
                            <span class="cell-score">{{ store.getCellMean(model, harness).toFixed(2) }}</span>
                            <span class="cell-meta">{{ store.cells[store.cellKey(model, harness)].trials.length }} trials</span>
                            <span v-if="cellDelta(model, harness) !== null && cellDelta(model, harness) !== 0" class="delta" :class="cellDelta(model, harness) >= 0 ? 'positive' : 'negative'">{{ formatDelta(cellDelta(model, harness)) }}</span>
                          </button>
                        </template>
                        <div class="reward-tooltip">
                          <strong>{{ model }} · {{ harness }}</strong>
                          <span v-for="trial in store.cells[store.cellKey(model, harness)].trials" :key="trial.id">{{ trial.id }} <b>{{ trial.reward.toFixed(3) }}</b></span>
                        </div>
                      </v-tooltip>
                      <button
                        class="rerun-mini" :disabled="['queued', 'running'].includes(store.reruns[store.cellKey(model, harness)]?.status)"
                        :aria-label="`Re-run ${model} on ${harness}`" @click.stop="runCell(store.cells[store.cellKey(model, harness)])"
                      ><v-icon :icon="['queued', 'running'].includes(store.reruns[store.cellKey(model, harness)]?.status) ? 'mdi-loading' : 'mdi-refresh'" size="15" :class="{ spinning: ['queued', 'running'].includes(store.reruns[store.cellKey(model, harness)]?.status) }" /></button>
                      <div v-if="['queued', 'running'].includes(store.reruns[store.cellKey(model, harness)]?.status)" class="cell-loading"><v-progress-circular indeterminate size="19" width="2" /><span>{{ store.reruns[store.cellKey(model, harness)].status }}</span></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state"><v-icon icon="mdi-table-off" size="38" /><h4>No cells match these filters</h4><p>Restore the full matrix to continue comparing harnesses.</p><v-btn color="primary" @click="store.clearFilters">Clear filters</v-btn></div>
        </article>

        <aside class="side-stack">
          <article class="panel-card compact-panel">
            <div class="panel-heading"><div><p class="section-label">TRIAGE</p><h3>Divergence summary</h3></div><span class="sigma-chip">σ {{ store.sigmaThreshold.toFixed(2) }}</span></div>
            <div class="triage-donut-row">
              <div class="donut" :style="{ '--portion': `${store.divergentCount ? (store.triageSummary.capabilityGap + store.triageSummary.specDefect) / store.divergentCount * 360 : 0}deg` }"><strong>{{ store.divergentCount }}</strong><span>divergent</span></div>
              <div class="summary-list">
                <div><i class="cap"></i><span>Capability gap</span><b>{{ store.triageSummary.capabilityGap }}</b></div>
                <div><i class="spec"></i><span>Spec defect</span><b>{{ store.triageSummary.specDefect }}</b></div>
                <div><i class="none"></i><span>Unclassified</span><b>{{ store.triageSummary.unclassified }}</b></div>
              </div>
            </div>
            <v-btn block variant="tonal" color="primary" append-icon="mdi-arrow-right" @click="store.goTo('variance')">Review variance</v-btn>
          </article>

          <article class="panel-card compact-panel">
            <div class="panel-heading"><div><p class="section-label">SESSION</p><h3>Latest events</h3></div><v-btn icon="mdi-open-in-new" variant="text" size="x-small" aria-label="Open timeline" @click="store.goTo('timeline')" /></div>
            <div v-if="store.timeline.length" class="mini-timeline">
              <div v-for="entry in store.timeline.slice(0, 3)" :key="entry.timestamp" class="timeline-row"><span class="event-icon"><v-icon icon="mdi-check" size="14" /></span><div><strong>{{ entry.model }}</strong><small>{{ entry.harness }} · {{ formatTime(entry.timestamp) }}</small></div><b>{{ entry.mean.toFixed(2) }}</b></div>
            </div>
            <div v-else class="mini-empty"><v-icon icon="mdi-timeline-clock-outline" /><span>Completed re-runs will appear here.</span></div>
          </article>
        </aside>
      </section>

      <section v-else-if="store.activeView === 'variance'" class="variance-layout">
        <div class="variance-top-grid">
          <article class="panel-card threshold-card">
            <div class="threshold-heading">
              <div><p class="section-label">SIGMA GATE</p><h3>Agreement threshold</h3></div>
              <div class="threshold-number"><span>σ gate</span><strong>{{ store.sigmaThreshold.toFixed(2) }}</strong></div>
            </div>
            <v-slider
              :model-value="store.sigmaThreshold" :min="0" :max="0.4" :step="0.01" color="primary" track-color="#dfe3ef" thumb-label hide-details
              aria-label="Sigma gate threshold" @start="store.beginThresholdEdit" @update:model-value="onThresholdUpdate" @end="finishThreshold"
              @mousedown="store.beginThresholdEdit" @mouseup="finishThreshold" @keydown="store.beginThresholdEdit" @keyup="finishThreshold"
            />
            <div class="slider-scale"><span>0.00 stricter</span><span>0.40 tolerant</span></div>
          </article>
          <article class="panel-card divergent-rollup" aria-live="polite">
            <span class="rollup-icon"><v-icon icon="mdi-alert-decagram-outline" /></span><div><p>Currently divergent</p><strong :key="store.divergentCount">{{ store.divergentCount }}</strong><span>of {{ store.varianceRows.length }} visible tasks</span></div>
          </article>
          <article class="panel-card triage-metrics">
            <div><span>Capability gap</span><strong>{{ store.triageSummary.capabilityGap }}</strong></div>
            <div><span>Spec defect</span><strong>{{ store.triageSummary.specDefect }}</strong></div>
            <div><span>Unclassified</span><strong>{{ store.triageSummary.unclassified }}</strong></div>
          </article>
        </div>

        <article class="panel-card variance-card">
          <div class="panel-heading"><div><p class="section-label">TASK AGREEMENT</p><h3>Per-task variance</h3></div><span class="subtle-note">CV across {{ store.activeHarnesses.length }} harnesses</span></div>
          <div v-if="store.varianceRows.length && store.activeHarnesses.length && store.activeModels.length" class="variance-table-scroll">
            <table class="variance-table">
              <thead><tr><th class="check-col"><span class="sr-only">Select</span></th><th>Task</th><th>Category</th><th v-for="harness in store.activeHarnesses" :key="harness">{{ harness }}</th><th>CV</th><th>Status</th><th>Triage</th><th></th></tr></thead>
              <tbody>
                <tr v-for="row in store.varianceRows" :key="row.task">
                  <td class="check-col"><v-checkbox-btn v-if="row.stability === 'divergent'" :model-value="store.selectedVarianceTasks.includes(row.task)" :aria-label="`Select ${row.task}`" @update:model-value="store.toggleTaskSelection(row.task)" /></td>
                  <th scope="row"><strong>{{ row.task }}</strong></th>
                  <td><span class="category-label">{{ row.category }}</span></td>
                  <td v-for="harness in store.activeHarnesses" :key="harness" class="numeric">{{ row.means[harness].toFixed(2) }}</td>
                  <td class="numeric cv-value">{{ row.coefficientOfVariation.toFixed(2) }}</td>
                  <td><transition name="chip-fade" mode="out-in"><span :key="row.stability" class="status-chip" :class="row.stability"><v-icon :icon="row.stability === 'stable' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" size="14" />{{ row.stability }}</span></transition></td>
                  <td><span v-if="row.triage" class="classification-badge" :class="row.triage.classification">{{ row.triage.classification }}</span><span v-else class="muted-dash">—</span></td>
                  <td><v-btn v-if="row.stability === 'divergent'" size="x-small" variant="tonal" color="primary" @click="openTriage(row)">Classify</v-btn></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="store.varianceRows.length && !store.activeModels.length" class="empty-state"><v-icon icon="mdi-database-search-outline" size="38" /><h4>No models match the current filters</h4><p>Tasks remain available, but the selected model filter has no matches.</p><v-btn color="primary" @click="store.clearFilters">Clear filters</v-btn></div>
          <div v-else class="empty-state"><v-icon icon="mdi-chart-bell-curve-cumulative" size="38" /><h4>No variance rows to calculate</h4><p>No tasks or harnesses match the current filter set.</p><v-btn color="primary" @click="store.clearFilters">Clear filters</v-btn></div>
        </article>

        <transition name="bulk-bar">
          <div v-if="store.selectedVarianceTasks.length >= 2" class="bulk-action-bar">
            <span><v-icon icon="mdi-checkbox-multiple-marked-outline" /> <strong>{{ store.selectedVarianceTasks.length }}</strong> divergent tasks selected</span>
            <div><v-btn variant="text" @click="store.clearTaskSelection">Clear selection</v-btn><v-btn color="primary" prepend-icon="mdi-tag-multiple-outline" @click="openTriage(null, 'bulk')">Apply classification</v-btn></div>
          </div>
        </transition>
      </section>

      <section v-else-if="store.activeView === 'chart'" class="panel-card chart-card">
        <div class="panel-heading chart-heading">
          <div><p class="section-label">SCORE PROFILE</p><h3>Score by harness</h3><p class="panel-description">Grouped task rewards for the selected model.</p></div>
          <v-select class="model-selector" label="Model" :items="store.models" :model-value="store.selectedChartModel" hide-details @update:model-value="store.setChartModel" />
        </div>
        <div class="chart-legend" aria-label="Harness series legend">
          <button v-for="(harness, index) in store.activeHarnesses" :key="harness" role="switch" :aria-checked="store.chartSeriesVisibility[harness]" :class="{ off: !store.chartSeriesVisibility[harness] }" @click="store.toggleChartSeries(harness)"><i :class="`series-${index}`"></i>{{ harness }}<v-icon :icon="store.chartSeriesVisibility[harness] ? 'mdi-eye-outline' : 'mdi-eye-off-outline'" size="15" /></button>
        </div>
        <div v-if="activeSeries.length" class="chart-wrap"><VChart autoresize :option="scoreChartOption" /></div>
        <div v-else class="empty-state chart-empty"><v-icon icon="mdi-chart-bar-stacked" size="42" /><h4>Every harness series is hidden</h4><p>Turn a legend toggle back on to restore bars.</p><v-btn variant="tonal" color="primary" @click="store.activeHarnesses.forEach((h) => { if (!store.chartSeriesVisibility[h]) store.toggleChartSeries(h) })">Show all series</v-btn></div>
      </section>

      <section v-else class="panel-card timeline-card">
        <div class="panel-heading"><div><p class="section-label">AUDIT TRAIL</p><h3>Re-run event timeline</h3><p class="panel-description">Newest completed calibration run first.</p></div><span class="event-count">{{ store.timeline.length }} events</span></div>
        <transition-group v-if="store.timeline.length" name="timeline-list" tag="div" class="full-timeline">
          <article v-for="entry in store.timeline" :key="entry.timestamp" class="full-event">
            <div class="full-event-icon"><v-icon icon="mdi-check-bold" /></div>
            <div class="event-copy"><strong>{{ entry.model }} <span>×</span> {{ entry.harness }}</strong><small>{{ new Date(entry.timestamp).toLocaleString() }}</small></div>
            <div class="event-result"><span>Resulting mean</span><strong>{{ entry.mean.toFixed(2) }}</strong></div>
          </article>
        </transition-group>
        <div v-else class="empty-state"><v-icon icon="mdi-timeline-plus-outline" size="42" /><h4>No completed re-runs yet</h4><p>Start a re-run from any heatmap cell to build the session audit trail.</p><v-btn color="primary" @click="store.goTo('heatmap')">Open heatmap</v-btn></div>
      </section>
    </main>

    <v-navigation-drawer
      ref="drawerRef" :model-value="store.ui.cellDrawerOpen" temporary location="end" width="540" class="detail-drawer"
      aria-label="Cell trial details" @update:model-value="$event ? null : closeCell()" @keydown="trapDrawerFocus"
    >
      <template v-if="store.selectedCell">
        <div class="drawer-head">
          <div><p class="section-label">CELL DETAIL</p><h2>{{ store.selectedCell.model }}</h2><span>{{ store.selectedCell.harness }}</span></div>
          <v-btn data-drawer-close icon="mdi-close" variant="text" aria-label="Close cell drawer" @click="closeCell" />
        </div>
        <div class="drawer-body">
          <div class="cell-kpis">
            <div><span>Mean reward</span><strong>{{ store.getCellMean(store.selectedCell.model, store.selectedCell.harness).toFixed(2) }}</strong></div>
            <div><span>Trials</span><strong>{{ store.selectedCell.trials.length }}</strong></div>
            <div><span>Est. cost</span><strong>${{ store.selectedCell.trials.reduce((sum, trial) => sum + trial.cost, 0).toFixed(3) }}</strong></div>
          </div>
          <section class="drawer-section"><div class="drawer-section-title"><h3>Reward distribution</h3><span>0–1 scale</span></div><div class="distribution-chart"><VChart autoresize :option="distributionOption" /></div></section>
          <section v-if="selectedRun && ['queued', 'running'].includes(selectedRun.status)" class="run-progress">
            <div class="drawer-section-title"><h3>Re-run progress</h3><span class="run-status">{{ selectedRun.status }}</span></div>
            <transition name="fade" mode="out-in">
              <div v-if="selectedRun.status === 'queued'" class="queue-message"><v-progress-circular indeterminate size="18" width="2" />Preparing trial workers…</div>
              <div v-else class="progress-list"><div v-for="item in selectedRun.progress" :key="item.id" :class="{ done: item.complete }"><v-icon :icon="item.complete ? 'mdi-check-circle' : 'mdi-circle-outline'" size="17" /><span>{{ item.id }}</span><b>{{ item.complete ? 'complete' : 'running' }}</b></div></div>
            </transition>
          </section>
          <section class="drawer-section"><div class="drawer-section-title"><h3>Trial ledger</h3><span>{{ store.selectedCell.trials.length }} records</span></div>
            <div class="trial-table-wrap"><table class="trial-table"><thead><tr><th>Trial id</th><th>Reward</th><th>Runtime</th><th>Cost</th></tr></thead><tbody><tr v-for="trial in store.selectedCell.trials" :key="trial.id"><td>{{ trial.id }}</td><td>{{ trial.reward.toFixed(3) }}</td><td>{{ trial.runtime.toFixed(2) }}s</td><td>${{ trial.cost.toFixed(4) }}</td></tr></tbody></table></div>
          </section>
        </div>
        <div class="drawer-footer"><v-btn block color="primary" prepend-icon="mdi-refresh" :loading="selectedRun && ['queued', 'running'].includes(selectedRun.status)" :disabled="selectedRun && ['queued', 'running'].includes(selectedRun.status)" @click="runCell(store.selectedCell)">Re-run</v-btn></div>
      </template>
    </v-navigation-drawer>

    <v-navigation-drawer :model-value="store.ui.exportOpen" temporary location="end" width="700" class="export-drawer" @update:model-value="$event ? null : closeOverlay('export')">
      <div class="drawer-head export-head"><div><p class="section-label">SESSION ARTIFACT</p><h2>Export calibration pack</h2><span>Live, schema-validated session state</span></div><div class="export-head-tools"><span class="schema-badge">schemaVersion 1</span><v-btn icon="mdi-close" variant="text" aria-label="Close export drawer" @click="closeOverlay('export')" /></div></div>
      <div class="export-summary"><div><span>Cells</span><strong>{{ store.calibrationPack.cells.length }}</strong></div><div><span>Divergent</span><strong>{{ store.divergentCount }}</strong></div><div><span>Classified</span><strong>{{ store.calibrationPack.triage.length }}</strong></div><div><span>Events</span><strong>{{ store.timeline.length }}</strong></div></div>
      <v-tabs v-model="store.ui.exportTab" color="primary" grow><v-tab value="json">JSON</v-tab><v-tab value="csv">CSV</v-tab></v-tabs>
      <div class="export-preview">
        <div v-if="store.ui.exportTab === 'csv' && !store.activeHarnesses.length" class="inline-empty">No harness columns match the filters. Clear filters to populate the CSV table.</div>
        <pre :aria-label="`${store.ui.exportTab.toUpperCase()} export preview`">{{ exportText }}</pre>
      </div>
      <div class="export-footer">
        <span class="live-compiled"><i></i> Compiled live from Pinia</span>
        <div><v-btn variant="text" :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'" @click="copyActive">{{ copied ? `Copied ${store.ui.exportTab.toUpperCase()}` : 'Copy' }}</v-btn><v-btn color="primary" prepend-icon="mdi-download" @click="downloadActive">Download {{ store.ui.exportTab.toUpperCase() }}</v-btn></div>
      </div>
    </v-navigation-drawer>

    <v-dialog v-model="triageOpen" max-width="600" persistent>
      <form class="dialog-card" novalidate @submit.prevent="submitTriage">
        <div class="dialog-head"><div><p class="section-label">FAIRNESS TRIAGE</p><h2>{{ triageMode === 'bulk' ? `Classify ${store.selectedVarianceTasks.length} tasks` : 'Classify divergent task' }}</h2><p>Saved values are the exact Classification request body.</p></div><v-btn icon="mdi-close" variant="text" aria-label="Cancel classification" @click="closeTriage" /></div>
        <div class="dialog-body">
          <v-text-field v-model="taskField" v-bind="taskAttrs" label="Task" maxlength="80" :readonly="triageMode === 'bulk'" :error-messages="triageErrors.task" aria-describedby="task-error" />
          <p v-if="triageMode === 'bulk'" class="bulk-task-note"><v-icon icon="mdi-information-outline" size="16" />The task field is set separately for each selected variance row.</p>
          <fieldset class="classification-options"><legend>Classification</legend>
            <v-radio-group v-model="classificationField" v-bind="classificationAttrs" :error-messages="triageErrors.classification" inline>
              <v-radio value="capability-gap"><template #label><span class="radio-label"><v-icon icon="mdi-chart-gap" />Capability gap<small>Harness exposes a capability difference</small></span></template></v-radio>
              <v-radio value="spec-defect"><template #label><span class="radio-label"><v-icon icon="mdi-file-alert-outline" />Spec defect<small>Evaluation contract needs correction</small></span></template></v-radio>
            </v-radio-group>
          </fieldset>
          <v-textarea v-model="rationaleField" v-bind="rationaleAttrs" label="Rationale" counter="500" rows="4" maxlength="500" placeholder="Explain the cross-harness evidence and operator decision…" :error-messages="triageErrors.rationale" aria-describedby="rationale-error" />
          <div class="contract-note"><v-icon icon="mdi-shield-check-outline" /><span>Required: 15–500 trimmed characters. Classification is limited to the two API enum values.</span></div>
        </div>
        <div class="dialog-footer"><v-btn variant="text" @click="closeTriage">Cancel</v-btn><v-btn type="submit" color="primary" :disabled="!triageMeta.valid">{{ triageMode === 'bulk' ? 'Apply classification' : 'Classify' }}</v-btn></div>
      </form>
    </v-dialog>

    <v-dialog :model-value="store.ui.importOpen" max-width="680" @update:model-value="store.ui.importOpen = $event">
      <form class="dialog-card" novalidate @submit.prevent="submitImport">
        <div class="dialog-head"><div><p class="section-label">RESTORE TRIAGE</p><h2>Import triage pack</h2><p>Accepts Meridian TriagePack or CalibrationPack JSON.</p></div><v-btn icon="mdi-close" variant="text" aria-label="Close import" @click="store.ui.importOpen = false" /></div>
        <div class="dialog-body">
          <div class="file-pick-row"><input ref="fileInput" class="sr-only" type="file" accept="application/json,.json" @change="pickImportFile"><v-btn variant="outlined" prepend-icon="mdi-file-upload-outline" @click="fileInput?.click()">Choose JSON file</v-btn><span>or paste the document below</span></div>
          <v-textarea v-model="importPayload" v-bind="importPayloadAttrs" label="JSON payload" rows="10" placeholder="{ &quot;schemaVersion&quot;: 1, … }" :error-messages="importErrors.payload" />
          <div v-if="importError" class="import-error" role="alert"><v-icon icon="mdi-alert-circle-outline" />{{ importError }}</div>
          <div class="contract-note"><v-icon icon="mdi-undo-variant" /><span>A valid import is one undoable session edit. Only matching divergent tasks are applied.</span></div>
        </div>
        <div class="dialog-footer"><v-btn variant="text" @click="store.ui.importOpen = false">Cancel</v-btn><v-btn type="submit" color="primary" prepend-icon="mdi-import" :disabled="!importMeta.valid">Import</v-btn></div>
      </form>
    </v-dialog>

    <v-dialog :model-value="store.ui.paletteOpen" max-width="620" class="palette-dialog" @update:model-value="$event ? null : closeOverlay('palette')">
      <div class="palette-card">
        <div class="palette-search"><v-icon icon="mdi-magnify" /><input v-model="paletteQuery" autofocus placeholder="Type a command…" aria-label="Search commands"><kbd>Esc</kbd></div>
        <div class="command-list">
          <button v-for="command in filteredCommands" :key="command.value" @click="selectCommand(command)"><span class="command-icon"><v-icon :icon="command.icon" /></span><span><strong>{{ command.label }}</strong><small>{{ command.hint }}</small></span><v-icon icon="mdi-arrow-right" class="command-arrow" /></button>
          <div v-if="!filteredCommands.length" class="palette-empty">No commands match “{{ paletteQuery }}”.</div>
        </div>
        <div class="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> browse</span><span><kbd>↵</kbd> run</span><span>Meridian commands</span></div>
      </div>
    </v-dialog>

    <v-snackbar v-model="store.ui.toast.show" :color="store.ui.toast.color" location="bottom right" timeout="3200" rounded="lg"><v-icon icon="mdi-check-circle-outline" class="mr-2" />{{ store.ui.toast.text }}</v-snackbar>
  </v-app>
</template>
