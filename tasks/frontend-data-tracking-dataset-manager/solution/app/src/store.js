import { create } from 'zustand'
import { computeStats, findDuplicateGroups, makePackage, parseFormula, rowsCsv, validatePackage } from './domain'

const now = '2026-07-01T09:00:00.000Z'
let sequence = 20000
export const uid = (prefix = 'id') => `${prefix}-${++sequence}`

const flagshipSchema = [
  { name: 'prompt', type: 'text', allowedValues: [] },
  { name: 'score', type: 'number', allowedValues: [] },
  { name: 'category', type: 'category', allowedValues: ['Reasoning', 'Safety', 'Writing'] },
]

function flagshipRows() {
  const rows = Array.from({ length: 520 }, (_, i) => ({
    id: `row-${i + 1}`,
    values: { prompt: `Evaluate response ${i + 1}: ${['clarity', 'factuality', 'helpfulness'][i % 3]}`, score: Number(((i * 17) % 101 / 10).toFixed(1)), category: ['Reasoning', 'Safety', 'Writing'][i % 3] },
    expectedOutput: `Reference answer ${i + 1}`,
    verified: i % 2 === 0,
    split: i % 10 === 0 ? 'test' : i % 10 === 1 ? 'validation' : 'train',
  }))
  rows[1].values = { ...rows[0].values }; rows[1].expectedOutput = 'Alternate first reference'; rows[1].verified = false
  rows[11].values = { ...rows[10].values }; rows[11].expectedOutput = 'Alternate duplicate reference'; rows[11].verified = true
  return rows
}

const initialFlagshipRows = flagshipRows()
export const seedDatasets = [
  {
    id: 'ds-eval-prompts', name: 'Eval prompts — flagship', description: 'Balanced prompt-response evaluation corpus.', createdAt: now, schema: flagshipSchema, rows: initialFlagshipRows,
    thresholdRules: [{ id: 'rule-1', column: 'score', comparator: 'below', cap: 3 }],
    snapshots: [{ name: 'Seed baseline', createdAt: now, rows: initialFlagshipRows.map((r) => ({ ...r, values: { ...r.values } })) }],
    splitPercentages: { train: 80, validation: 10, test: 10 }, attachedSuiteId: null,
  },
  {
    id: 'ds-support', name: 'Support intents', description: 'Customer support intent classification.', createdAt: '2026-07-16T12:00:00.000Z',
    schema: [{ name: 'utterance', type: 'text', allowedValues: [] }, { name: 'confidence', type: 'number', allowedValues: [] }, { name: 'intent', type: 'category', allowedValues: ['Billing', 'Technical', 'Account'] }],
    rows: Array.from({ length: 36 }, (_, i) => ({ id: `support-${i}`, values: { utterance: `Support request ${i + 1}`, confidence: .5 + (i % 5) / 10, intent: ['Billing', 'Technical', 'Account'][i % 3] }, expectedOutput: `route_${i % 3}`, verified: i % 2 === 0, split: 'train' })),
    thresholdRules: [], snapshots: [], splitPercentages: { train: 80, validation: 10, test: 10 }, attachedSuiteId: null,
  },
  {
    id: 'ds-rubric', name: 'Rubric calibration', description: 'Human scoring calibration set.', createdAt: '2026-07-12T16:20:00.000Z',
    schema: [{ name: 'response', type: 'text', allowedValues: [] }, { name: 'rating', type: 'number', allowedValues: [] }, { name: 'band', type: 'category', allowedValues: ['Strong', 'Mixed', 'Weak'] }],
    rows: Array.from({ length: 28 }, (_, i) => ({ id: `rubric-${i}`, values: { response: `Candidate response ${i + 1}`, rating: (i % 5) + 1, band: ['Strong', 'Mixed', 'Weak'][i % 3] }, expectedOutput: `${(i % 5) + 1}`, verified: i % 2 === 1, split: i % 5 ? 'train' : 'test' })),
    thresholdRules: [], snapshots: [], splitPercentages: { train: 80, validation: 10, test: 10 }, attachedSuiteId: null,
  },
]

export const evalSuites = [
  { id: 'suite-quality', name: 'Core quality regression', detail: 'Nightly regression across flagship behaviors' },
  { id: 'suite-safety', name: 'Safety release gate', detail: 'Blocking gate for release candidates' },
  { id: 'suite-weekly', name: 'Weekly model comparison', detail: 'Side-by-side weekly model tracking' },
]

export const sampleCsvs = [
  {
    id: 'sample-clean', name: 'Clean evaluation batch',
    text: [
      'prompt,score,category,expectedOutput',
      ...Array.from({ length: 12 }, (_, i) => `Imported prompt ${i + 1}: ${['reasoning depth', 'safety margin', 'writing flow', 'factuality check'][i % 4]},${(6 + (i % 4)) + i / 10},${['Reasoning', 'Safety', 'Writing'][i % 3]},Reference answer ${i + 1}`),
    ].join('\n'),
  },
  {
    id: 'sample-issues', name: 'Batch with diagnostics',
    text: 'prompt,score,category,expectedOutput\nNeeds score repair,not-a-number,Reasoning,Repair me\nNeeds category repair,6.5,Unknown,Repair category\nValid import row,7.8,Writing,Ready\nExclude this row,,Safety,Missing score',
  },
]

export const newImportState = (open = false) => ({ open, step: 'source', sourceTab: 'samples', paste: '', sourceError: null, dragging: false, committing: false, sourceText: '', headers: [], rawRows: [], mapping: {}, diagnostic: [] })

const cloneDatasets = (sets) => structuredClone(sets)
const selected = (state) => state.datasets.find((d) => d.id === state.selectedId)

let scanTimers = []
let toastTimer = null

export const useStore = create((set, get) => ({
  datasets: cloneDatasets(seedDatasets), selectedId: 'ds-eval-prompts', selectedRows: [], unverifiedOnly: false,
  history: [], future: [], formulaInput: '=AVERAGE(score)', formulaResult: null,
  pivotMode: false, pivot: { rows: [], columns: [], value: null, aggregation: 'count' },
  panel: null, modal: null, toast: null, sidebarOpen: false, sidebarDesktopOpen: true, inlineEdit: null,
  duplicateScan: { status: 'idle', stages: ['pending', 'pending', 'pending'], groups: [], dismissed: [], announce: '' },
  importState: newImportState(false),
  exportTab: 'json', exportGeneratedAt: null,
  snapshotSelection: [],
  recentRows: { ids: [], type: null },
  sort: { field: null, dir: null },
  settings: { theme: 'light', density: 'comfortable', reduceMotion: false, hiddenColumns: [] },
  tour: { active: false, step: 0, seen: false },
  paletteOpen: false, shortcutsOpen: false, settingsOpen: false,
  liveMessage: '',

  selectDataset: (id) => set({ selectedId: id, selectedRows: [], unverifiedOnly: false, formulaResult: null, sidebarOpen: false, sort: { field: null, dir: null }, duplicateScan: { status: 'idle', stages: ['pending', 'pending', 'pending'], groups: [], dismissed: [], announce: '' } }),
  setUi: (patch) => set(patch),
  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  announce: (message) => set({ liveMessage: `${message} (${Date.now()})` }),
  notify: (message, kind = 'success') => {
    set({ toast: { message, kind, id: Date.now(), leaving: false } })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      const t = get().toast
      if (t?.message === message) {
        set({ toast: { ...t, leaving: true } })
        setTimeout(() => { if (get().toast?.message === message) set({ toast: null }) }, 320)
      }
    }, 3400)
  },
  commit: (mutator, message) => {
    set((state) => {
      const before = cloneDatasets(state.datasets)
      const next = cloneDatasets(state.datasets)
      const selectedIndex = next.findIndex((dataset) => dataset.id === state.selectedId)
      mutator(next, state.selectedId)
      const activeDataset = next.find((dataset) => dataset.id === state.selectedId) ?? next[selectedIndex]
      const formulaResult = state.formulaInput && activeDataset ? parseFormula(state.formulaInput, activeDataset) : null
      return { datasets: next, formulaResult, history: [...state.history.slice(-39), before], future: [], selectedRows: [], ...(message ? { toast: { message, kind: 'success', id: Date.now(), leaving: false } } : {}) }
    })
    if (message) {
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => { if (get().toast?.message === message) set({ toast: null }) }, 3400)
    }
  },
  createDataset: (payload) => {
    const id = uid('dataset')
    get().commit((datasets) => datasets.push({ id, ...payload, createdAt: new Date().toISOString(), rows: [], thresholdRules: [], snapshots: [], splitPercentages: { train: 80, validation: 10, test: 10 }, attachedSuiteId: null }), `Dataset “${payload.name}” created with 0 rows`)
    set({ selectedId: id, modal: null })
    return id
  },
  addRow: (row) => { const item = { id: uid('row'), ...row }; get().commit((datasets, id) => datasets.find((d) => d.id === id).rows.push(item), '1 row added'); set({ recentRows: { ids: [item.id], type: 'single' } }); setTimeout(() => set({ recentRows: { ids: [], type: null } }), 1800) },
  updateRow: (rowId, row) => get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); const at = ds.rows.findIndex((r) => r.id === rowId); if (at >= 0) ds.rows[at] = { id: rowId, ...ds.rows[at], ...row } }, 'Row updated'),
  updateCell: (rowId, field, value) => get().commit((datasets, id) => { const row = datasets.find((d) => d.id === id).rows.find((r) => r.id === rowId); if (!row) return; if (field === 'expectedOutput') row.expectedOutput = value; else if (field === 'verified') row.verified = value; else if (field === 'split') value ? row.split = value : delete row.split; else row.values[field] = value }, 'Cell updated'),
  deleteRows: (ids) => get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); ds.rows = ds.rows.filter((r) => !ids.includes(r.id)) }, `${ids.length} row${ids.length === 1 ? '' : 's'} deleted`),
  appendRows: (rows) => { const items = rows.map((r) => ({ id: uid('row'), ...r })); get().commit((datasets, id) => datasets.find((d) => d.id === id).rows.push(...items), `${rows.length} rows imported`); set({ recentRows: { ids: items.map((r) => r.id), type: 'import' } }); setTimeout(() => set({ recentRows: { ids: [], type: null } }), Math.max(1800, Math.ceil(items.length / 10) * 100 + 700)) },
  bulk: (action, value) => { const ids = get().selectedRows; if (!ids.length) return; get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); if (action === 'delete') ds.rows = ds.rows.filter((r) => !ids.includes(r.id)); else ds.rows.forEach((r) => { if (ids.includes(r.id)) { if (action === 'verified') r.verified = value; if (action === 'split') r.split = value } }) }, `${ids.length} rows updated`); get().announce(`Bulk ${action === 'delete' ? 'delete' : action + ' ' + value} applied to ${ids.length} rows`) },
  toggleSelected: (id) => set((s) => ({ selectedRows: s.selectedRows.includes(id) ? s.selectedRows.filter((v) => v !== id) : [...s.selectedRows, id] })),
  selectAll: (ids, checked) => set({ selectedRows: checked ? ids : [] }),
  undo: () => set((s) => s.history.length ? ({ datasets: s.history.at(-1), history: s.history.slice(0, -1), future: [cloneDatasets(s.datasets), ...s.future].slice(0, 40), selectedRows: [], toast: { message: 'Change undone', kind: 'info', id: Date.now(), leaving: false } }) : {}),
  redo: () => set((s) => s.future.length ? ({ datasets: s.future[0], future: s.future.slice(1), history: [...s.history, cloneDatasets(s.datasets)], selectedRows: [], toast: { message: 'Change restored', kind: 'info', id: Date.now(), leaving: false } }) : {}),
  evaluateFormula: (input = get().formulaInput) => { const result = parseFormula(input, selected(get())); set({ formulaInput: input, formulaResult: result }) },
  addThreshold: (rule) => get().commit((datasets, id) => datasets.find((d) => d.id === id).thresholdRules.push({ id: uid('rule'), ...rule }), 'Threshold rule added'),
  deleteThreshold: (ruleId) => get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); ds.thresholdRules = ds.thresholdRules.filter((r) => r.id !== ruleId) }, 'Threshold rule deleted'),
  applySplits: (percentages) => get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); ds.splitPercentages = percentages; const trainEnd = Math.round(ds.rows.length * percentages.train / 100); const validationEnd = trainEnd + Math.round(ds.rows.length * percentages.validation / 100); ds.rows.forEach((r, i) => { r.split = i < trainEnd ? 'train' : i < validationEnd ? 'validation' : 'test' }) }, 'Split assignments applied'),
  saveSnapshot: (name) => get().commit((datasets, id) => { const ds = datasets.find((d) => d.id === id); ds.snapshots.push({ name, createdAt: new Date().toISOString(), rows: structuredClone(ds.rows) }) }, `Snapshot “${name}” saved`),
  attachSuite: (suiteId) => get().commit((datasets, id) => { datasets.find((d) => d.id === id).attachedSuiteId = suiteId }, suiteId ? `Attached to ${evalSuites.find((s) => s.id === suiteId)?.name}` : 'Eval suite detached'),
  runDuplicateScan: () => {
    scanTimers.forEach(clearTimeout)
    scanTimers = []
    const advance = (stages, status, extra = {}) => set((s) => ({ duplicateScan: { ...s.duplicateScan, stages, status, ...extra } }))
    advance(['running', 'pending', 'pending'], 'running')
    set((s) => ({ duplicateScan: { ...s.duplicateScan, announce: 'Stage 1 of 3: scanning rows' } }))
    scanTimers.push(setTimeout(() => { advance(['complete', 'running', 'pending'], 'running'); set((s) => ({ duplicateScan: { ...s.duplicateScan, announce: 'Stage 2 of 3: grouping matches' } })) }, 1100))
    scanTimers.push(setTimeout(() => { advance(['complete', 'complete', 'running'], 'running'); set((s) => ({ duplicateScan: { ...s.duplicateScan, announce: 'Stage 3 of 3: finishing' } })) }, 2200))
    scanTimers.push(setTimeout(() => {
      const s = get()
      const groups = findDuplicateGroups(selected(s), s.duplicateScan.dismissed)
      set({ duplicateScan: { ...s.duplicateScan, status: 'done', stages: ['complete', 'complete', 'complete'], groups, announce: `Scan complete: ${groups.length} duplicate group${groups.length === 1 ? '' : 's'} found` } })
    }, 3300))
  },
  dismissDuplicate: (groupId) => set((s) => ({ duplicateScan: { ...s.duplicateScan, groups: s.duplicateScan.groups.filter((g) => g.id !== groupId), dismissed: [...s.duplicateScan.dismissed, groupId], announce: 'Group dismissed as not duplicates' } })),
  mergeDuplicate: (groupId, survivorPatch) => {
    const group = get().duplicateScan.groups.find((g) => g.id === groupId) || findDuplicateGroups(selected(get())).find((g) => g.id === groupId)
    if (!group) return false
    const ids = group.rows.map((r) => r.id)
    get().commit((datasets, id) => {
      const ds = datasets.find((d) => d.id === id)
      const survivor = ds.rows.find((r) => r.id === ids[0])
      if (!survivor) return
      survivor.values = { ...survivor.values, ...survivorPatch.values }
      survivor.expectedOutput = survivorPatch.expectedOutput
      survivor.verified = survivorPatch.verified
      if (survivorPatch.split) survivor.split = survivorPatch.split; else delete survivor.split
      ds.rows = ds.rows.filter((r) => r.id === ids[0] || !ids.includes(r.id))
    }, `${ids.length} duplicates merged into 1 row`)
    get().announce(`Merged ${ids.length} duplicate rows into 1 row`)
    set((s) => ({ modal: null, duplicateScan: { ...s.duplicateScan, groups: s.duplicateScan.groups.filter((g) => g.id !== groupId) } }))
    return true
  },
  importPackage: (text) => {
    let parsed; try { parsed = JSON.parse(text) } catch { return { error: 'Package JSON is malformed' } }
    const checked = validatePackage(parsed); if (checked.error) return checked
    const d = parsed.dataset
    get().commit((datasets, id) => {
      const at = datasets.findIndex((v) => v.id === id)
      datasets[at] = {
        id: d.id || id, name: d.name, description: d.description, createdAt: d.createdAt, schema: structuredClone(d.schema),
        rows: d.rows.map((r) => ({ id: uid('row'), values: { ...r.values }, expectedOutput: r.expectedOutput, verified: r.verified, ...(r.split ? { split: r.split } : {}) })),
        thresholdRules: d.thresholdRules.map((r) => ({ id: uid('rule'), column: r.column, comparator: r.comparator, cap: r.cap })),
        snapshots: d.snapshots.map((sn) => ({ name: sn.name, createdAt: sn.createdAt, rows: sn.rows.map((r) => ({ id: uid('snaprow'), values: { ...r.values }, expectedOutput: r.expectedOutput, verified: r.verified, ...(r.split ? { split: r.split } : {}) })) })),
        splitPercentages: { ...d.splitPercentages }, attachedSuiteId: d.attachedSuiteId ?? null,
      }
    }, 'Dataset package imported')
    set({ selectedId: d.id || get().selectedId, selectedRows: [], unverifiedOnly: false })
    return { success: true }
  },
  getExport: () => { const state = get(), ds = selected(state), visible = state.unverifiedOnly ? ds.rows.filter((r) => !r.verified) : ds.rows; return { json: JSON.stringify(makePackage(ds), null, 2), csv: rowsCsv(ds, visible), stats: computeStats(ds) } },
}))

export const store = useStore
