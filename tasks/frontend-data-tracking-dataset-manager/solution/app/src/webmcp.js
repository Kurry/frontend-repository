import Papa from 'papaparse'
import { datasetCreateSchema, dynamicRowSchema, snapshotSchema, splitSchema, thresholdSchema } from './domain'
import { evalSuites, newImportState, sampleCsvs, store } from './store'

const result = (message, data = {}) => ({ ok: true, message, ...data })
const failure = (message) => ({ ok: false, error: message })
const current = () => { const s = store.getState(); return s.datasets.find((d) => d.id === s.selectedId) }

const MODULES = [
  { id: 'entity-collection-v1', contract_version: 'zto-webmcp-v1', tool_name_prefix: 'entity' },
  { id: 'form-workflow-v1', contract_version: 'zto-webmcp-v1', tool_name_prefix: 'form' },
  { id: 'command-session-v1', contract_version: 'zto-webmcp-v1', tool_name_prefix: 'session' },
  { id: 'artifact-transfer-v1', contract_version: 'zto-webmcp-v1', tool_name_prefix: 'artifact' },
]

const tools = [
  {
    name: 'entity_create_dataset_row', description: 'Create one row in the selected dataset using its visible record contract.',
    inputSchema: { type: 'object', properties: { values: { type: 'object' }, expectedOutput: { type: 'string', maxLength: 4000 }, verified: { type: 'boolean' }, split: { enum: ['train', 'validation', 'test'] } }, required: ['values', 'expectedOutput', 'verified'], additionalProperties: false },
    execute: async (args) => { const checked = dynamicRowSchema(current().schema).safeParse(args); if (!checked.success) return failure(checked.error.issues[0].message); store.getState().addRow(checked.data); return result('Row created', { rowCount: current().rows.length }) },
  },
  {
    name: 'entity_select_dataset_row', description: 'Select or clear a dataset row for the visible bulk action tray.',
    inputSchema: { type: 'object', properties: { rowId: { type: 'string', minLength: 1 }, selected: { type: 'boolean' } }, required: ['rowId', 'selected'], additionalProperties: false },
    execute: async ({ rowId, selected }) => { const s = store.getState(); const has = s.selectedRows.includes(rowId); if (selected !== has) s.toggleSelected(rowId); return result(selected ? 'Row selected' : 'Row selection cleared', { selectedCount: store.getState().selectedRows.length }) },
  },
  {
    name: 'entity_update_dataset_row', description: 'Update one declared dataset-row field through the same state commands as the visible controls.',
    inputSchema: { type: 'object', properties: { rowId: { type: 'string' }, field: { enum: ['schema-field-values', 'expected-output', 'verified', 'split', 'bulk-selection', 'unverified-only-filter', 'merge-surviving-values', 'dismiss-duplicate-group', 'pivot-rows-bucket', 'pivot-columns-bucket', 'pivot-values-bucket', 'pivot-aggregation', 'snapshot-selection', 'eval-suite-attachment'] }, schemaField: { type: 'string' }, value: {} }, required: ['field', 'value'], additionalProperties: false },
    execute: async ({ rowId, field, schemaField, value }) => {
      const s = store.getState(), ds = current()
      if (field === 'schema-field-values') {
        const row = ds.rows.find((r) => r.id === rowId), def = ds.schema.find((f) => f.name === schemaField)
        if (!row || !def) return failure('rowId and schemaField must name visible records')
        const candidate = { ...row, values: { ...row.values, [schemaField]: value } }
        const checked = dynamicRowSchema(ds.schema).safeParse(candidate)
        if (!checked.success) return failure(checked.error.issues[0].message)
        s.updateCell(rowId, schemaField, checked.data.values[schemaField])
      } else if (field === 'expected-output') { if (typeof value !== 'string' || value.length > 4000) return failure('expected-output must be a string of at most 4000 characters'); s.updateCell(rowId, 'expectedOutput', value) }
      else if (field === 'verified') s.updateCell(rowId, 'verified', Boolean(value))
      else if (field === 'split') { if (!['train', 'validation', 'test'].includes(value)) return failure('split must be train, validation, or test'); s.updateCell(rowId, 'split', value) }
      else if (field === 'bulk-selection') { const has = s.selectedRows.includes(rowId); if (Boolean(value) !== has) s.toggleSelected(rowId) }
      else if (field === 'unverified-only-filter') s.setUi({ unverifiedOnly: Boolean(value), selectedRows: [] })
      else if (field === 'dismiss-duplicate-group') { s.dismissDuplicate(String(value)); return result('Duplicate group dismissed') }
      else if (field === 'merge-surviving-values') {
        const v = value || {}
        if (typeof v.groupId !== 'string') return failure('merge-surviving-values requires value.groupId naming a visible duplicate group')
        const patch = { values: v.values || {}, expectedOutput: v.expectedOutput ?? '', verified: Boolean(v.verified), split: v.split || '' }
        const ok = s.mergeDuplicate(v.groupId, patch)
        if (!ok) return failure('groupId must name a visible duplicate group')
        return result('Duplicate group merged into one row', { rowCount: current().rows.length })
      }
      else if (field === 'pivot-aggregation') { if (!['count', 'sum', 'average'].includes(value)) return failure('pivot aggregation must be count, sum, or average'); s.setUi({ pivot: { ...s.pivot, aggregation: value }, pivotMode: true }) }
      else if (field === 'pivot-rows-bucket' || field === 'pivot-columns-bucket') { if (!ds.schema.some((f) => f.name === value)) return failure('pivot field must name a schema column'); const key = field === 'pivot-rows-bucket' ? 'rows' : 'columns'; s.setUi({ pivot: { ...s.pivot, [key]: [value] }, pivotMode: true }) }
      else if (field === 'pivot-values-bucket') { if (!ds.schema.some((f) => f.name === value)) return failure('pivot value must name a schema column'); s.setUi({ pivot: { ...s.pivot, value }, pivotMode: true }) }
      else if (field === 'snapshot-selection') { const names = Array.isArray(value) ? value.slice(0, 2) : [value]; if (names.some((n) => !ds.snapshots.some((x) => x.name === n))) return failure('snapshot selection must name saved snapshots'); s.setUi({ snapshotSelection: names, panel: 'snapshots' }) }
      else if (field === 'eval-suite-attachment') { if (value !== null && !evalSuites.some((x) => x.id === value)) return failure('eval suite attachment must name a seeded suite'); s.attachSuite(value) }
      else return failure('Unknown dataset-row field')
      return result('Dataset row state updated')
    },
  },
  {
    name: 'entity_delete_dataset_row', description: 'Delete one or more dataset rows. Explicit confirm=true is required.',
    inputSchema: { type: 'object', properties: { rowIds: { type: 'array', minItems: 1, maxItems: 1000, items: { type: 'string' } }, confirm: { const: true } }, required: ['rowIds', 'confirm'], additionalProperties: false },
    execute: async ({ rowIds, confirm }) => { if (confirm !== true) return failure('confirm=true is required'); store.getState().deleteRows(rowIds); return result('Rows deleted', { deletedCount: rowIds.length, rowCount: current().rows.length }) },
  },
  {
    name: 'entity_toggle_dataset_row', description: 'Toggle verified, bulk selection, or the unverified-only filter.',
    inputSchema: { type: 'object', properties: { field: { enum: ['verified', 'bulk-selection', 'unverified-only-filter'] }, rowId: { type: 'string' } }, required: ['field'], additionalProperties: false },
    execute: async ({ field, rowId }) => { const s = store.getState(); if (field === 'unverified-only-filter') s.setUi({ unverifiedOnly: !s.unverifiedOnly, selectedRows: [] }); else if (field === 'bulk-selection') { if (!rowId) return failure('rowId is required to toggle bulk-selection'); s.toggleSelected(rowId) } else { const row = current().rows.find((r) => r.id === rowId); if (!row) return failure('rowId must name an existing row'); s.updateCell(rowId, 'verified', !row.verified) } return result(`${field} toggled`, { verifiedCount: current().rows.filter((r) => r.verified).length }) },
  },
  {
    name: 'form_validate', description: 'Validate a declared visible form without mutating state.',
    inputSchema: { type: 'object', properties: { form: { enum: ['new-dataset', 'add-row', 'edit-row', 'threshold-rule', 'split-percentages', 'snapshot-name', 'attach-suite-select', 'formula-input'] }, values: { type: 'object' } }, required: ['form', 'values'], additionalProperties: false },
    execute: async ({ form, values }) => {
      let checked
      if (form === 'new-dataset') checked = datasetCreateSchema.safeParse(values)
      else if (form === 'add-row' || form === 'edit-row') checked = dynamicRowSchema(current().schema).safeParse(values)
      else if (form === 'threshold-rule') checked = thresholdSchema.safeParse(values)
      else if (form === 'split-percentages') checked = splitSchema.safeParse(values)
      else if (form === 'snapshot-name') checked = snapshotSchema.safeParse(values)
      else if (form === 'attach-suite-select') checked = { success: evalSuites.some((s) => s.id === values.suiteId), error: { issues: [{ message: 'suiteId must name a seeded eval suite' }] } }
      else { store.getState().evaluateFormula(values.formula); const formula = store.getState().formulaResult; return formula?.error ? failure(formula.error) : result('Formula is valid', { value: formula.value }) }
      return checked.success ? result(`${form} is valid`) : failure(checked.error.issues[0].message)
    },
  },
  {
    name: 'form_submit', description: 'Submit one declared form through the same domain command as its visible submit control.',
    inputSchema: { type: 'object', properties: { form: { enum: ['new-dataset', 'add-row', 'edit-row', 'threshold-rule', 'split-percentages', 'snapshot-name', 'attach-suite-select', 'formula-input'] }, values: { type: 'object' }, rowId: { type: 'string' } }, required: ['form', 'values'], additionalProperties: false },
    execute: async ({ form, values, rowId }) => {
      const validation = await tools.find((t) => t.name === 'form_validate').execute({ form, values })
      if (!validation.ok) return validation
      const s = store.getState()
      if (form === 'new-dataset') s.createDataset(values)
      else if (form === 'add-row') s.addRow(values)
      else if (form === 'edit-row') { if (!rowId) return failure('rowId is required for edit-row'); s.updateRow(rowId, values) }
      else if (form === 'threshold-rule') s.addThreshold(thresholdSchema.parse(values))
      else if (form === 'split-percentages') s.applySplits(splitSchema.parse(values))
      else if (form === 'snapshot-name') { if (current().snapshots.some((x) => x.name.toLowerCase() === values.name.trim().toLowerCase())) return failure('Snapshot name must be unique for this dataset'); s.saveSnapshot(values.name.trim()) }
      else if (form === 'attach-suite-select') s.attachSuite(values.suiteId)
      else s.evaluateFormula(values.formula)
      return result(`${form} submitted`)
    },
  },
  {
    name: 'form_cancel', description: 'Cancel the currently visible form or workflow.', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { store.getState().setUi({ modal: null, panel: null, importState: newImportState(false) }); return result('Visible form cancelled') },
  },
  {
    name: 'form_reset', description: 'Reset the CSV import workflow to its source step.', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => { store.getState().setUi({ importState: newImportState(true) }); return result('Import workflow reset to the source step') },
  },
  {
    name: 'form_advance', description: 'Advance the currently visible import workflow using its real enabled Continue or Commit control.', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => {
      const buttons = [...document.querySelectorAll('button')]
      const target = buttons.find((b) => !b.disabled && (/Continue to diagnostics/.test(b.textContent) || /^Commit \d+ row/.test(b.textContent)))
      if (!target) return failure('The workflow cannot advance until visible validation issues are resolved')
      target.click()
      return result('Import workflow advanced')
    },
  },
  {
    name: 'form_return', description: 'Return to the preceding visible import workflow step.', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => {
      const buttons = [...document.querySelectorAll('button')]
      const target = buttons.find((b) => /Back/.test(b.textContent) && !b.disabled)
      if (!target) return failure('No preceding workflow step is available')
      target.click()
      return result('Returned to the preceding import step')
    },
  },
  {
    name: 'session_start', description: 'Start the duplicate-scan demo with visible staged progress (scanning rows, grouping matches, done).', inputSchema: { type: 'object', properties: { demo: { const: 'duplicate-scan' } }, required: ['demo'], additionalProperties: false },
    execute: async () => { store.getState().setUi({ panel: 'duplicates' }); store.getState().runDuplicateScan(); return result('Duplicate scan started; observe staged progress in the panel') },
  },
  {
    name: 'artifact_import', description: 'Open CSV import from a bounded seeded sample fixture, or open the pasted-CSV source mode. No raw file bytes are accepted or returned.',
    inputSchema: { type: 'object', properties: { mode: { enum: ['sample-csv-fixture', 'pasted-csv'] }, fixtureId: { enum: sampleCsvs.map((s) => s.id) } }, required: ['mode'], additionalProperties: false },
    execute: async ({ mode, fixtureId }) => {
      if (mode === 'pasted-csv') { store.getState().setUi({ importState: { ...newImportState(true), sourceTab: 'paste' } }); return result('CSV import opened at the paste source step') }
      const sample = sampleCsvs.find((s) => s.id === fixtureId)
      if (!sample) return failure('fixtureId must name a seeded CSV fixture')
      const parsed = Papa.parse(sample.text, { header: true, skipEmptyLines: true })
      const ds = current()
      const headers = parsed.meta.fields
      const mapping = Object.fromEntries(headers.map((h) => { const f = ds.schema.find((x) => x.name.toLowerCase() === h.toLowerCase()); return [h, f?.name || (h.toLowerCase() === 'expectedoutput' ? 'expectedOutput' : 'ignore')] }))
      store.getState().setUi({ importState: { ...newImportState(true), step: 'mapping', sourceText: sample.text, headers, rawRows: parsed.data, mapping } })
      return result('Sample fixture loaded into the visible mapping step', { fixtureId, incomingRowCount: parsed.data.length })
    },
  },
  {
    name: 'artifact_export', description: 'Open the live export drawer at Rows CSV or Dataset Package JSON without returning artifact contents.',
    inputSchema: { type: 'object', properties: { format: { enum: ['rows-csv', 'dataset-card-text'] } }, required: ['format'], additionalProperties: false },
    execute: async ({ format }) => { store.getState().setUi({ panel: 'export', exportTab: format === 'rows-csv' ? 'csv' : 'json', exportGeneratedAt: Date.now() }); return result('Live export preview opened', { format }) },
  },
  {
    name: 'artifact_copy', description: 'Activate the visible export Copy control. Clipboard contents are intentionally not returned.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => {
      const button = [...document.querySelectorAll('button')].find((b) => /^(Copy artifact|Copied artifact)$/.test(b.textContent.trim()))
      if (!button) return failure('Open the export drawer before copying')
      button.click()
      return result('Visible Copy artifact control activated; a named confirmation toast is shown')
    },
  },
]

const listableTools = tools.map(({ execute: _execute, ...rest }) => rest)

function sessionInfo() {
  return {
    status: 'ready',
    app: 'dataset-workbench',
    contract_version: 'zto-webmcp-v1',
    selectedDatasetId: store.getState().selectedId,
    modules: MODULES.map((m) => ({ ...m, tools: listableTools.filter((t) => t.name.startsWith(m.tool_name_prefix + '_')).map((t) => t.name) })),
    tool_count: listableTools.length,
    mechanics_exclusions: ['file picker and drag-and-drop dropzone', 'virtualized-grid scroll smoothness', 'pivot chip drag gesture fidelity', 'undo/redo and inline-cell keyboard mechanics', 'animation and toast transients', 'clipboard contents of export Copy'],
  }
}

function registerAll() {
  window.datasetWorkbenchWebMcpTools = listableTools
  window.webmcp_session_info = sessionInfo
  window.webmcp_list_tools = () => listableTools
  window.webmcp_invoke_tool = async (name, args) => {
    const tool = tools.find((t) => t.name === name)
    if (!tool) return { ok: false, error: `Unknown tool: ${name}` }
    try { return await tool.execute(args || {}) } catch (error) { return { ok: false, error: error?.message || 'Tool execution failed' } }
  }

  const nativeApi = navigator.modelContext
  if (nativeApi?.registerTool && !window.__datasetWorkbenchNativeTools) {
    window.__datasetWorkbenchNativeTools = true
    for (const tool of tools) { try { nativeApi.registerTool(tool) } catch { /* native registration is optional */ } }
  }
  const api = window.webmcp
  if (api?.registerTool && !window.__datasetWorkbenchBridgeTools) {
    window.__datasetWorkbenchBridgeTools = true
    for (const tool of tools) {
      try { api.registerTool(tool) }
      catch { try { api.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }, tool.execute) } catch { /* bridge registration is optional */ } }
    }
  }
}

registerAll()
const registrationPoll = window.setInterval(registerAll, 500)
window.setTimeout(() => window.clearInterval(registrationPoll), 15000)
window.addEventListener('webmcp:ready', registerAll)
