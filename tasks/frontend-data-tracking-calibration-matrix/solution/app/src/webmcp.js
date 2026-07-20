import { useCalibrationStore } from './store'
import { classificationSchema } from './schemas'

const textResult = (text) => ({ content: [{ type: 'text', text }] })

function register(context, definition, handler) {
  try {
    context.registerTool({ ...definition, execute: handler }, handler)
  } catch (error) {
    console.warn(`WebMCP tool ${definition.name} was not registered`, error)
  }
}

export function registerWebMcp(pinia) {
  const context = navigator.modelContext
  if (!context?.registerTool) return
  const store = useCalibrationStore(pinia)
  const destinations = ['heatmap', 'variance', 'chart', 'timeline', 'cell-drawer', 'export', 'import']
  const models = [...store.models]
  const harnesses = [...store.harnesses]

  register(context, {
    name: 'browse_open',
    description: 'Open a bounded Meridian destination. Cell drawer also requires a seeded model and harness.',
    inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: destinations }, model: { type: 'string', enum: models }, harness: { type: 'string', enum: harnesses } }, required: ['destination'], additionalProperties: false },
  }, async ({ destination, model, harness }) => {
    if (destination === 'cell-drawer') {
      if (!model || !harness) throw new Error('model and harness are required for cell-drawer')
      store.openCell(model, harness)
    } else if (destination === 'export') store.openExport()
    else if (destination === 'import') store.openImport()
    else store.goTo(destination)
    return textResult(`Opened ${destination}`)
  })

  register(context, {
    name: 'browse_search',
    description: 'Search the bounded visible cell collection by seeded model or harness name.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['query'], additionalProperties: false },
  }, async ({ query }) => {
    const needle = query.toLowerCase()
    const matches = store.allCellRecords.filter((cell) => `${cell.model} ${cell.harness}`.toLowerCase().includes(needle))
    return textResult(`${matches.length} visible cell matches; use browse_open with cell-drawer to inspect a bounded match.`)
  })

  register(context, {
    name: 'browse_apply_filter',
    description: 'Apply one bounded dashboard filter using the same Pinia command as the visible controls.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['model', 'harness', 'task-category', 'sigma-threshold', 'chart-model', 'chart-series'] },
        values: { type: 'array', items: { type: 'string' }, maxItems: 6 },
        value: { oneOf: [{ type: 'string' }, { type: 'number', minimum: 0, maximum: 0.4 }] },
      },
      required: ['filter'], additionalProperties: false,
    },
  }, async ({ filter, values, value }) => {
    if (filter === 'model') store.setFilter('model', values || [value])
    else if (filter === 'harness') store.setFilter('harness', values || [value])
    else if (filter === 'task-category') store.setFilter('taskCategory', values || [value])
    else if (filter === 'sigma-threshold') store.setThreshold(value)
    else if (filter === 'chart-model') store.setChartModel(value)
    else if (filter === 'chart-series') {
      if (!harnesses.includes(value)) throw new Error('chart-series must name a seeded harness')
      store.toggleChartSeries(value)
    }
    return textResult(`Applied ${filter}; visible dashboard state updated.`)
  })

  register(context, {
    name: 'browse_clear_filter',
    description: 'Clear all active model, harness, and task-category filters.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }, async () => { store.clearFilters(); return textResult('All dashboard filters cleared.') })

  register(context, {
    name: 'entity_select',
    description: 'Select or unselect a currently divergent task for bulk classification.',
    inputSchema: { type: 'object', properties: { task: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['task'], additionalProperties: false },
  }, async ({ task }) => { store.toggleTaskSelection(task); return textResult(`Selection toggled for ${task}.`) })

  const classificationToolSchema = {
    type: 'object',
    properties: {
      task: { type: 'string', minLength: 1, maxLength: 80 },
      classification: { type: 'string', enum: ['capability-gap', 'spec-defect'] },
      rationale: { type: 'string', minLength: 15, maxLength: 500 },
    },
    required: ['task', 'classification', 'rationale'], additionalProperties: false,
  }

  const saveClassification = async (args) => {
    const parsed = classificationSchema.safeParse(args)
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const result = store.classify(parsed.data)
    if (!result.ok) throw new Error(result.message || result.error?.issues?.[0]?.message || 'classification failed')
    return textResult(`Saved ${parsed.data.classification} for ${parsed.data.task}; triage totals updated.`)
  }
  register(context, { name: 'entity_create', description: 'Create a Classification record for a divergent task.', inputSchema: classificationToolSchema }, saveClassification)
  register(context, { name: 'entity_update', description: 'Update an existing Classification record for a divergent task.', inputSchema: classificationToolSchema }, saveClassification)

  register(context, {
    name: 'session_start',
    description: 'Start the cell-re-run demo for one bounded seeded model and harness.',
    inputSchema: { type: 'object', properties: { demo: { type: 'string', enum: ['cell-re-run'] }, model: { type: 'string', enum: models }, harness: { type: 'string', enum: harnesses } }, required: ['demo', 'model', 'harness'], additionalProperties: false },
  }, async ({ model, harness }) => {
    store.goTo('heatmap')
    const result = await store.startRerun(model, harness)
    if (!result.ok) throw new Error(result.message || 're-run did not complete')
    return textResult(`Cell re-run complete for ${model} on ${harness}; resulting mean ${result.mean.toFixed(2)}.`)
  })

  register(context, {
    name: 'artifact_export',
    description: 'Open the live export drawer at a bounded calibration JSON or variance CSV format.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['calibration-json', 'variance-csv'] } }, required: ['format'], additionalProperties: false },
  }, async ({ format }) => { store.openExport(format); return textResult(`Opened ${format} export preview.`) })

  register(context, {
    name: 'artifact_import',
    description: 'Open paste-mode Import for a bounded calibration or triage JSON pack. Artifact contents remain in the visible form.',
    inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['calibration-json', 'triage-json'] } }, required: ['mode'], additionalProperties: false },
  }, async ({ mode }) => { store.openImport(); return textResult(`Opened ${mode} paste-mode import. Paste and confirm in the visible form.`) })

  register(context, {
    name: 'artifact_copy',
    description: 'Copy the active bounded export format using the same visible export workflow.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['calibration-json', 'variance-csv'] } }, required: ['format'], additionalProperties: false },
  }, async ({ format }) => { store.openExport(format); store.requestCopy(format); return textResult(`Copy requested for ${format}; confirmation is visible in the export drawer.`) })
}
