import { defineStore } from 'pinia'
import { modelNames, harnessNames, tasks, createSeedCells } from './seed'
import { classificationSchema, calibrationPackSchema } from './schemas'

const categories = [...new Set(tasks.map((task) => task.category))]
const keyFor = (model, harness) => `${model}::${harness}`
const clamp = (value, min = 0.03, max = 0.99) => Math.max(min, Math.min(max, value))
const round = (value, digits = 4) => Number(value.toFixed(digits))
const meanOf = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

function cellMean(cell) {
  return round(meanOf(cell?.trials?.map((trial) => trial.reward) || []), 4)
}

function scoreFor(task, model, harness, cell) {
  const modelIndex = modelNames.indexOf(model)
  const harnessIndex = harnessNames.indexOf(harness)
  const taskIndex = tasks.findIndex((item) => item.name === task.name)
  const modulation = ((((taskIndex + 1) * (modelIndex + 2)) % 7) - 3) * 0.009
  return round(clamp(cellMean(cell) * 0.72 + task.base + task.biases[harnessIndex] + modulation), 4)
}

function coefficient(values) {
  if (values.length < 2) return 0
  const mean = meanOf(values)
  if (mean === 0) return 0
  const variance = meanOf(values.map((value) => (value - mean) ** 2))
  return round(Math.sqrt(variance) / Math.abs(mean), 4)
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const clonePlain = (value) => JSON.parse(JSON.stringify(value))

let eventSeq = 0
const nextEventId = () => { eventSeq += 1; return `event-${eventSeq}` }

export const useCalibrationStore = defineStore('calibration', {
  state: () => ({
    models: [...modelNames],
    harnesses: [...harnessNames],
    categories,
    tasks: tasks.map((task) => ({ ...task, biases: [...task.biases] })),
    cells: createSeedCells(),
    filters: { model: [], harness: [], taskCategory: [] },
    filterSearch: { model: '', harness: '', taskCategory: '' },
    sigmaThreshold: 0.12,
    classifications: {},
    reruns: {},
    timeline: [],
    baseline: null,
    selectedChartModel: modelNames[0],
    chartSeriesVisibility: Object.fromEntries(harnessNames.map((harness) => [harness, true])),
    selectedVarianceTasks: [],
    activeView: 'heatmap',
    ui: {
      selectedCellKey: null,
      cellDrawerOpen: false,
      exportOpen: false,
      exportTab: 'json',
      importOpen: false,
      triageOpen: false,
      paletteOpen: false,
      copyRequest: 0,
      toast: { show: false, text: '', color: 'success' },
      density: 'comfortable',
      tipsVisible: true,
      validation: null,
    },
    undoStack: [],
    redoStack: [],
    thresholdEditSnapshot: null,
  }),

  getters: {
    activeModels(state) {
      const search = state.filterSearch.model.trim().toLowerCase()
      const selected = state.filters.model.length ? state.models.filter((item) => state.filters.model.includes(item)) : state.models
      return search ? selected.filter((item) => item.toLowerCase().includes(search)) : selected
    },
    activeHarnesses(state) {
      const search = state.filterSearch.harness.trim().toLowerCase()
      const selected = state.filters.harness.length ? state.harnesses.filter((item) => state.filters.harness.includes(item)) : state.harnesses
      return search ? selected.filter((item) => item.toLowerCase().includes(search)) : selected
    },
    activeCategories(state) {
      const search = state.filterSearch.taskCategory.trim().toLowerCase()
      const selected = state.filters.taskCategory.length ? state.categories.filter((item) => state.filters.taskCategory.includes(item)) : state.categories
      return search ? selected.filter((item) => item.toLowerCase().includes(search)) : selected
    },
    visibleCells() {
      return this.activeModels.flatMap((model) => this.activeHarnesses.map((harness) => this.cells[keyFor(model, harness)]).filter(Boolean))
    },
    selectedCell(state) {
      return state.ui.selectedCellKey ? state.cells[state.ui.selectedCellKey] : null
    },
    varianceRows(state) {
      const visibleModels = this.activeModels
      const visibleHarnesses = this.activeHarnesses
      return state.tasks
        .filter((task) => this.activeCategories.includes(task.category))
        .map((task) => {
          const means = {}
          visibleHarnesses.forEach((harness) => {
            const scores = visibleModels.map((model) => scoreFor(task, model, harness, state.cells[keyFor(model, harness)]))
            means[harness] = round(meanOf(scores), 4)
          })
          const coefficientOfVariation = coefficient(Object.values(means))
          const stability = coefficientOfVariation <= state.sigmaThreshold ? 'stable' : 'divergent'
          return {
            task: task.name,
            category: task.category,
            means,
            coefficientOfVariation,
            stability,
            triage: state.classifications[task.name] || null,
          }
        })
    },
    divergentRows() {
      return this.varianceRows.filter((row) => row.stability === 'divergent')
    },
    divergentCount() {
      return this.divergentRows.length
    },
    triageSummary() {
      const divergentNames = new Set(this.divergentRows.map((row) => row.task))
      let capabilityGap = 0
      let specDefect = 0
      Object.entries(this.classifications).forEach(([task, record]) => {
        if (!divergentNames.has(task)) return
        if (record.classification === 'capability-gap') capabilityGap += 1
        if (record.classification === 'spec-defect') specDefect += 1
      })
      return {
        capabilityGap,
        specDefect,
        unclassified: Math.max(0, this.divergentCount - capabilityGap - specDefect),
      }
    },
    baselineMap(state) {
      if (!state.baseline) return {}
      return Object.fromEntries(state.baseline.cells.map((cell) => [keyFor(cell.model, cell.harness), cell.mean]))
    },
    allCellRecords(state) {
      return state.models.flatMap((model) => state.harnesses.map((harness) => {
        const cell = state.cells[keyFor(model, harness)]
        return {
          model,
          harness,
          mean: cellMean(cell),
          trialCount: cell.trials.length,
          trials: cell.trials.map((trial) => ({ ...trial })),
        }
      }))
    },
    calibrationPack(state) {
      const varianceRows = this.varianceRows.map((row) => ({
        task: row.task,
        category: row.category,
        means: { ...row.means },
        coefficientOfVariation: row.coefficientOfVariation,
        stability: row.stability,
        triage: row.triage ? { ...row.triage } : null,
      }))
      return {
        schemaVersion: 1,
        document: 'meridian-calibration',
        sigmaThreshold: state.sigmaThreshold,
        models: [...state.models],
        harnesses: [...state.harnesses],
        cells: this.allCellRecords,
        varianceRows,
        timeline: state.timeline.filter((entry) => entry.kind !== 'classification').map(({ timestamp, model, harness, mean }) => ({ timestamp, model, harness, mean })),
        baseline: state.baseline ? { cells: state.baseline.cells.map((cell) => ({ ...cell })) } : null,
        filters: {
          model: [...state.filters.model],
          harness: [...state.filters.harness],
          taskCategory: [...state.filters.taskCategory],
        },
        triage: Object.values(state.classifications).map((record) => ({ ...record })),
      }
    },
    exportJson() {
      return JSON.stringify(this.calibrationPack, null, 2)
    },
    exportCsv() {
      const harnesses = this.activeHarnesses
      const header = ['task', 'category', ...harnesses, 'coefficientOfVariation', 'stability', 'classification']
      const rows = this.varianceRows.map((row) => [
        row.task,
        row.category,
        ...harnesses.map((harness) => row.means[harness].toFixed(4)),
        row.coefficientOfVariation.toFixed(4),
        row.stability,
        row.triage?.classification || '',
      ])
      return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    },
    canUndo(state) {
      return state.undoStack.length > 0
    },
    canRedo(state) {
      return state.redoStack.length > 0
    },
  },

  actions: {
    cellKey(model, harness) {
      return keyFor(model, harness)
    },
    getCellMean(model, harness) {
      return cellMean(this.cells[keyFor(model, harness)])
    },
    heatmapMean(model, harness) {
      const cell = this.cells[keyFor(model, harness)]
      if (!cell) return 0
      if (!this.filters.taskCategory.length && !this.filterSearch.taskCategory.trim()) return cellMean(cell)
      const activeTasks = this.tasks.filter((task) => this.activeCategories.includes(task.category))
      if (!activeTasks.length) return 0
      return round(meanOf(activeTasks.map((task) => scoreFor(task, model, harness, cell))), 4)
    },
    scoreForTask(taskName, model, harness) {
      const task = this.tasks.find((item) => item.name === taskName)
      return task ? scoreFor(task, model, harness, this.cells[keyFor(model, harness)]) : 0
    },
    captureSnapshot() {
      return {
        sigmaThreshold: this.sigmaThreshold,
        classifications: clonePlain(this.classifications),
        baseline: this.baseline ? clonePlain(this.baseline) : null,
      }
    },
    restoreSnapshot(snapshot) {
      this.sigmaThreshold = snapshot.sigmaThreshold
      this.classifications = clonePlain(snapshot.classifications)
      this.baseline = snapshot.baseline ? clonePlain(snapshot.baseline) : null
      this.pruneClassificationEvents()
      this.sanitizeSelection()
    },
    pruneClassificationEvents() {
      this.timeline = this.timeline.filter((entry) => {
        if (entry.kind !== 'classification') return true
        const record = this.classifications[entry.task]
        return Boolean(record && record.classification === entry.classification)
      })
      // Keep timeline events coherent with restored classifications on undo/redo:
      // every classified task has exactly one matching event, newest first.
      Object.entries(this.classifications).forEach(([task, record]) => {
        const present = this.timeline.some((entry) => entry.kind === 'classification' && entry.task === task && entry.classification === record.classification)
        if (!present) {
          this.timeline.unshift({ id: nextEventId(), kind: 'classification', timestamp: new Date().toISOString(), task, classification: record.classification })
        }
      })
    },
    checkpoint(snapshot = null) {
      this.undoStack.push(snapshot || this.captureSnapshot())
      if (this.undoStack.length > 50) this.undoStack.shift()
      this.redoStack = []
    },
    undo() {
      if (!this.undoStack.length) return
      const previous = this.undoStack.pop()
      this.redoStack.push(this.captureSnapshot())
      this.restoreSnapshot(previous)
      this.showToast('Session edit undone', 'info')
    },
    redo() {
      if (!this.redoStack.length) return
      const next = this.redoStack.pop()
      this.undoStack.push(this.captureSnapshot())
      this.restoreSnapshot(next)
      this.showToast('Session edit restored', 'info')
    },
    beginThresholdEdit() {
      if (!this.thresholdEditSnapshot) this.thresholdEditSnapshot = this.captureSnapshot()
    },
    previewThreshold(value) {
      this.sigmaThreshold = round(Number(value), 2)
      this.sanitizeSelection()
    },
    finishThresholdEdit() {
      if (!this.thresholdEditSnapshot) return
      if (this.thresholdEditSnapshot.sigmaThreshold !== this.sigmaThreshold) this.checkpoint(this.thresholdEditSnapshot)
      this.thresholdEditSnapshot = null
    },
    setThreshold(value) {
      const next = round(Number(value), 2)
      if (next === this.sigmaThreshold) return
      this.checkpoint()
      this.sigmaThreshold = next
      this.sanitizeSelection()
    },
    setFilter(type, values) {
      if (!['model', 'harness', 'taskCategory'].includes(type)) return
      this.filters[type] = (Array.isArray(values) ? values : [values]).filter((value) => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())
      this.sanitizeSelection()
    },
    setFilterSearch(type, text) {
      if (!['model', 'harness', 'taskCategory'].includes(type)) return
      this.filterSearch[type] = typeof text === 'string' ? text : ''
      this.sanitizeSelection()
    },
    clearFilters() {
      this.filters = { model: [], harness: [], taskCategory: [] }
      this.filterSearch = { model: '', harness: '', taskCategory: '' }
      this.sanitizeSelection()
    },
    sanitizeSelection() {
      const divergent = new Set(this.divergentRows.map((row) => row.task))
      this.selectedVarianceTasks = this.selectedVarianceTasks.filter((task) => divergent.has(task))
    },
    toggleTaskSelection(task) {
      const row = this.varianceRows.find((item) => item.task === task)
      if (!row || row.stability !== 'divergent') return false
      this.selectedVarianceTasks = this.selectedVarianceTasks.includes(task)
        ? this.selectedVarianceTasks.filter((item) => item !== task)
        : [...this.selectedVarianceTasks, task]
      return true
    },
    clearTaskSelection() {
      this.selectedVarianceTasks = []
    },
    addClassificationEvents(records) {
      records.forEach((record) => {
        this.timeline = this.timeline.filter((entry) => !(entry.kind === 'classification' && entry.task === record.task))
        this.timeline.unshift({
          id: nextEventId(),
          kind: 'classification',
          timestamp: new Date().toISOString(),
          task: record.task,
          classification: record.classification,
        })
      })
    },
    classify(record) {
      const parsed = classificationSchema.safeParse(record)
      if (!parsed.success) return { ok: false, error: parsed.error }
      const row = this.varianceRows.find((item) => item.task === parsed.data.task)
      if (!row || row.stability !== 'divergent') return { ok: false, field: 'task', message: 'task must name a currently divergent row' }
      this.checkpoint()
      this.classifications[parsed.data.task] = parsed.data
      this.addClassificationEvents([parsed.data])
      this.showToast(`Classification saved for ${parsed.data.task} (${parsed.data.classification})`)
      return { ok: true, record: parsed.data }
    },
    bulkClassify(taskNames, classification, rationale) {
      const validRows = taskNames.filter((task) => this.divergentRows.some((row) => row.task === task))
      const records = validRows.map((task) => classificationSchema.safeParse({ task, classification, rationale }))
      if (validRows.length < 2 || records.some((result) => !result.success)) return { ok: false, message: 'Select at least two divergent tasks and complete every field' }
      this.checkpoint()
      const saved = records.map((result) => result.data)
      saved.forEach((record) => { this.classifications[record.task] = record })
      this.addClassificationEvents(saved)
      this.selectedVarianceTasks = []
      this.showToast(`${saved.length} tasks classified as ${classification}`)
      return { ok: true, records: saved }
    },
    importClassifications(entries) {
      const divergent = new Set(this.divergentRows.map((row) => row.task))
      const matches = entries.filter((entry) => divergent.has(entry.task))
      if (!matches.length) return { ok: false, message: 'entries: no tasks match currently divergent rows' }
      this.checkpoint()
      matches.forEach((entry) => { this.classifications[entry.task] = { ...entry } })
      this.addClassificationEvents(matches)
      this.showToast(`${matches.length} classifications imported`)
      return { ok: true, count: matches.length }
    },
    pinBaseline() {
      this.checkpoint()
      this.baseline = { cells: this.models.flatMap((model) => this.harnesses.map((harness) => ({ model, harness, mean: this.heatmapMean(model, harness) }))) }
      this.showToast('Baseline pinned from current cell means')
    },
    clearBaseline() {
      if (!this.baseline) return
      this.checkpoint()
      this.baseline = null
      this.showToast('Baseline cleared', 'info')
    },
    openCell(model, harness) {
      const key = keyFor(model, harness)
      if (!this.cells[key]) return
      this.ui.selectedCellKey = key
      this.ui.cellDrawerOpen = true
    },
    closeCell() {
      this.ui.cellDrawerOpen = false
    },
    goTo(view) {
      if (!['heatmap', 'variance', 'chart', 'timeline'].includes(view)) return
      this.activeView = view
      // A view switch must never be blocked by an open overlay drawer.
      this.ui.exportOpen = false
      this.ui.paletteOpen = false
    },
    openExport(format = 'json') {
      this.ui.exportTab = format === 'csv' || format === 'variance-csv' ? 'csv' : 'json'
      this.ui.exportOpen = true
    },
    openImport() {
      this.ui.importOpen = true
    },
    toggleChartSeries(harness) {
      if (this.harnesses.includes(harness)) this.chartSeriesVisibility[harness] = !this.chartSeriesVisibility[harness]
    },
    setChartModel(model) {
      if (this.models.includes(model)) this.selectedChartModel = model
    },
    requestCopy(format) {
      if (format) this.ui.exportTab = format === 'variance-csv' ? 'csv' : 'json'
      this.ui.copyRequest += 1
    },
    toggleDensity() {
      this.ui.density = this.ui.density === 'comfortable' ? 'compact' : 'comfortable'
      this.showToast(this.ui.density === 'compact' ? 'Compact density on' : 'Comfortable density restored', 'info')
    },
    dismissTips() {
      this.ui.tipsVisible = false
    },
    validatePack() {
      const result = calibrationPackSchema.safeParse(clonePlain(this.calibrationPack))
      if (result.success) {
        this.ui.validation = { ok: true, message: `CalibrationPack v${result.data.schemaVersion} schema valid — ${result.data.cells.length} cells, ${result.data.varianceRows.length} variance rows` }
      } else {
        const issue = result.error.issues[0]
        this.ui.validation = { ok: false, message: `${issue.path.join('.') || 'payload'}: ${issue.message}` }
      }
      return this.ui.validation
    },
    showToast(text, color = 'success') {
      this.ui.toast = { show: false, text, color }
      queueMicrotask(() => { this.ui.toast.show = true })
    },
    async startRerun(model, harness) {
      const key = keyFor(model, harness)
      if (!this.cells[key] || ['queued', 'running'].includes(this.reruns[key]?.status)) return { ok: false, message: 'run already active' }
      const runId = Date.now().toString(36)
      this.reruns[key] = { status: 'queued', progress: [], runId }
      await sleep(700)
      if (this.reruns[key]?.runId !== runId) return { ok: false }
      const count = 4 + Math.floor(Math.random() * 3)
      const currentMean = cellMean(this.cells[key])
      const directionalShift = (Math.random() - 0.42) * 0.18
      const nextTrials = Array.from({ length: count }, (_, index) => {
        const reward = clamp(currentMean + directionalShift + (Math.random() - 0.5) * 0.15)
        return {
          id: `rerun-${runId}-${String(index + 1).padStart(2, '0')}`,
          reward: round(reward, 3),
          runtime: round(1.1 + Math.random() * 3.9, 2),
          cost: round(0.005 + Math.random() * 0.018, 4),
        }
      })
      this.reruns[key] = {
        status: 'running',
        runId,
        progress: nextTrials.map((trial) => ({ id: trial.id, complete: false })),
      }
      for (let index = 0; index < nextTrials.length; index += 1) {
        await sleep(380)
        if (this.reruns[key]?.runId !== runId) return { ok: false }
        this.reruns[key].progress[index].complete = true
      }
      this.cells = { ...this.cells, [key]: { ...this.cells[key], trials: nextTrials } }
      const resultMean = cellMean(this.cells[key])
      this.reruns[key].status = 'complete'
      this.timeline.unshift({ id: nextEventId(), kind: 're-run', timestamp: new Date().toISOString(), model, harness, mean: resultMean })
      this.showToast(`Re-run complete: ${model} × ${harness} now ${resultMean.toFixed(2)} across ${count} trials`)
      return { ok: true, mean: resultMean, trialCount: count }
    },
  },
})

export { cellMean, scoreFor, keyFor }
