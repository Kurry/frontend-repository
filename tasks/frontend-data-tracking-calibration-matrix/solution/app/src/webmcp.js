// In-page WebMCP surface for the Meridian Calibration console.
// Exposes window.webmcp_session_info / window.webmcp_list_tools /
// window.webmcp_invoke_tool (the surface the verifier's CDP bridge calls) and
// additionally registers the same tools on navigator.modelContext when a
// browser-native Model Context implementation is present. Every handler calls
// the exact Pinia store command used by the visible UI control.

import { useCalibrationStore } from './store'
import { classificationSchema } from './schemas'

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1']

const DESTINATIONS = ['heatmap', 'variance', 'chart', 'timeline', 'cell-drawer', 'export', 'import']
const FILTERS = ['model', 'harness', 'task-category', 'sigma-threshold', 'chart-model', 'chart-series']
const EXPORT_FORMATS = ['calibration-json', 'variance-csv']
const IMPORT_MODES = ['calibration-json', 'triage-json']
const CLASSIFICATIONS = ['capability-gap', 'spec-defect']

const ok = (result = {}) => ({ status: 'success', ...result })
const fail = (error) => ({ status: 'error', error })

export function registerWebMcp(pinia) {
  const store = useCalibrationStore(pinia)
  const models = [...store.models]
  const harnesses = [...store.harnesses]
  const animatedTools = new Set(['browse_apply_filter', 'entity_create', 'entity_update', 'session_start'])

  const settleVisibleState = async (toolName) => {
    await Promise.resolve()
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    if (animatedTools.has(toolName)) await new Promise((resolve) => setTimeout(resolve, 560))
  }

  const classificationArgsSchema = {
    type: 'object',
    properties: {
      task: { type: 'string', minLength: 1, maxLength: 80, description: 'Variance-row task name (trimmed, non-empty, at most 80 characters)' },
      classification: { type: 'string', enum: CLASSIFICATIONS, description: 'Closed Classification enum' },
      rationale: { type: 'string', minLength: 15, maxLength: 500, description: 'Trimmed rationale, 15 through 500 characters' },
    },
    required: ['task', 'classification', 'rationale'],
    additionalProperties: false,
  }

  const saveClassification = (args) => {
    const parsed = classificationSchema.safeParse(args)
    if (!parsed.success) return fail(parsed.error.issues[0].message)
    const result = store.classify(parsed.data)
    if (!result.ok) return fail(result.message || result.error?.issues?.[0]?.message || 'classification rejected')
    return ok({
      saved: result.record,
      triageSummary: { ...store.triageSummary },
      visible_postcondition: `Row ${result.record.task} is badged ${result.record.classification} and the triage summary totals shifted.`,
    })
  }

  const handlers = {
    browse_open: ({ destination, model, harness } = {}) => {
      if (!DESTINATIONS.includes(destination)) return fail(`destination must be one of ${DESTINATIONS.join(', ')}`)
      if (destination === 'cell-drawer') {
        if (!models.includes(model) || !harnesses.includes(harness)) return fail('cell-drawer requires a seeded model and harness')
        store.goTo('heatmap')
        store.openCell(model, harness)
        return ok({ destination, model, harness, visible_postcondition: 'Cell drawer is open with the trial ledger and distribution chart.' })
      }
      if (destination === 'export') { store.openExport(); return ok({ destination, visible_postcondition: 'Export drawer is open on the JSON tab.' }) }
      if (destination === 'import') { store.openImport(); return ok({ destination, visible_postcondition: 'Import dialog is open in paste mode.' }) }
      store.goTo(destination)
      return ok({ destination, visible_postcondition: `The ${destination} view is active.` })
    },

    browse_search: ({ query } = {}) => {
      if (typeof query !== 'string' || !query.trim()) return fail('query must be a non-empty string')
      const needle = query.toLowerCase()
      const matches = store.allCellRecords.filter((cell) => `${cell.model} ${cell.harness}`.toLowerCase().includes(needle))
      const modelMatches = models.some((item) => item.toLowerCase().includes(needle))
      const harnessMatches = harnesses.some((item) => item.toLowerCase().includes(needle))
      store.setFilterSearch('model', harnessMatches && !modelMatches ? '' : query)
      store.setFilterSearch('harness', harnessMatches ? query : '')
      return ok({
        query,
        matchCount: matches.length,
        matches: matches.slice(0, 8).map((cell) => ({ model: cell.model, harness: cell.harness, mean: cell.mean })),
        visible_postcondition: matches.length
          ? 'The visible matrix is narrowed to matching model or harness labels.'
          : 'The visible matrix shows its designed empty state.',
      })
    },

    browse_apply_filter: ({ filter, values, value } = {}) => {
      if (!FILTERS.includes(filter)) return fail(`filter must be one of ${FILTERS.join(', ')}`)
      if (filter === 'model' || filter === 'harness' || filter === 'task-category') {
        const source = Array.isArray(values) ? values : value !== undefined ? [value] : []
        const allowed = filter === 'model' ? models : filter === 'harness' ? harnesses : store.categories
        const bounded = source.filter((item) => allowed.includes(item))
        if (source.length && !bounded.length) return fail(`${filter} values must come from the seeded set: ${allowed.join(', ')}`)
        store.setFilter(filter === 'task-category' ? 'taskCategory' : filter, bounded)
        return ok({ filter, applied: bounded, visible_postcondition: 'Heatmap and variance view narrowed from the same shared data.' })
      }
      if (filter === 'sigma-threshold') {
        const next = Number(value)
        if (!Number.isFinite(next) || next < 0 || next > 0.4) return fail('sigma-threshold value must be a number between 0 and 0.4')
        store.beginThresholdEdit()
        store.previewThreshold(next)
        store.finishThresholdEdit()
        return ok({ filter, sigmaThreshold: store.sigmaThreshold, divergentCount: store.divergentCount, visible_postcondition: 'Chips and the divergent rollup reclassified live.' })
      }
      if (filter === 'chart-model') {
        if (!models.includes(value)) return fail(`chart-model must be one of ${models.join(', ')}`)
        store.setChartModel(value)
        return ok({ filter, chartModel: store.selectedChartModel, visible_postcondition: 'Chart bars redrawn for the selected model.' })
      }
      if (!harnesses.includes(value)) return fail(`chart-series must name a seeded harness: ${harnesses.join(', ')}`)
      store.toggleChartSeries(value)
      return ok({ filter, harness: value, visible: Boolean(store.chartSeriesVisibility[value]), visible_postcondition: 'Legend toggle updated and chart bars animated.' })
    },

    browse_clear_filter: () => {
      store.clearFilters()
      return ok({ visible_postcondition: 'All model, harness, and task-category filters cleared; full grid restored.' })
    },

    entity_select: ({ task } = {}) => {
      if (typeof task !== 'string' || !task.trim()) return fail('task must be a non-empty string')
      const row = store.varianceRows.find((item) => item.task === task)
      if (!row) return fail(`task "${task}" is not a visible variance row`)
      if (row.stability !== 'divergent') return fail(`task "${task}" is stable; only divergent rows can be selected for bulk triage`)
      store.toggleTaskSelection(task)
      return ok({ task, selected: store.selectedVarianceTasks.includes(task), selectedTasks: [...store.selectedVarianceTasks], visible_postcondition: 'Row checkbox updated; the bulk action bar appears at two or more selections.' })
    },

    entity_create: saveClassification,
    entity_update: saveClassification,

    session_start: async ({ demo, model, harness } = {}) => {
      if (demo !== 'cell-re-run') return fail('demo must be cell-re-run')
      if (!models.includes(model) || !harnesses.includes(harness)) return fail(`model and harness must come from the seeded set (models: ${models.join(', ')}; harnesses: ${harnesses.join(', ')})`)
      store.goTo('heatmap')
      const result = await store.startRerun(model, harness)
      if (!result.ok) return fail(result.message || 're-run did not complete')
      return ok({
        model,
        harness,
        mean: result.mean,
        trialCount: result.trialCount,
        timelineEvents: store.timeline.length,
        visible_postcondition: 'The cell shows the new mean and trial count, dependent variance rows recomputed, and one timeline entry was appended.',
      })
    },

    artifact_export: ({ format } = {}) => {
      if (!EXPORT_FORMATS.includes(format)) return fail(`format must be one of ${EXPORT_FORMATS.join(', ')}`)
      store.openExport(format)
      return ok({ format, visible_postcondition: `Export drawer is open on the ${format === 'variance-csv' ? 'CSV' : 'JSON'} tab with the live preview.` })
    },

    artifact_import: ({ mode } = {}) => {
      if (!IMPORT_MODES.includes(mode)) return fail(`mode must be one of ${IMPORT_MODES.join(', ')}`)
      store.openImport()
      return ok({ mode, visible_postcondition: 'Import dialog is open in paste mode; paste the pack and confirm with the visible Import control.' })
    },

    artifact_copy: ({ format } = {}) => {
      if (!EXPORT_FORMATS.includes(format)) return fail(`format must be one of ${EXPORT_FORMATS.join(', ')}`)
      store.openExport(format)
      store.requestCopy(format)
      return ok({ format, visible_postcondition: 'The export drawer shows the copied confirmation for the active tab.' })
    },
  }

  const TOOLS = [
    {
      name: 'browse_open',
      description: 'Open one bounded destination: heatmap, variance, chart, timeline, cell-drawer (requires seeded model and harness), export, or import. Uses the same Pinia commands as the visible tabs and controls.',
      inputSchema: {
        type: 'object',
        properties: {
          destination: { type: 'string', enum: DESTINATIONS },
          model: { type: 'string', enum: models },
          harness: { type: 'string', enum: harnesses },
        },
        required: ['destination'],
        additionalProperties: false,
      },
    },
    {
      name: 'browse_search',
      description: 'Search the bounded visible cell collection by seeded model or harness name.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', minLength: 1, maxLength: 80 } },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'browse_apply_filter',
      description: 'Apply one bounded dashboard filter (model, harness, task-category, sigma-threshold, chart-model, chart-series) through the same store command as the visible controls.',
      inputSchema: {
        type: 'object',
        properties: {
          filter: { type: 'string', enum: FILTERS },
          values: { type: 'array', items: { type: 'string' }, maxItems: 6 },
          value: { oneOf: [{ type: 'string' }, { type: 'number', minimum: 0, maximum: 0.4 }] },
        },
        required: ['filter'],
        additionalProperties: false,
      },
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear all active model, harness, and task-category filters and restore the full grid.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'entity_select',
      description: 'Select or unselect a currently divergent variance task for bulk classification.',
      inputSchema: {
        type: 'object',
        properties: { task: { type: 'string', minLength: 1, maxLength: 80 } },
        required: ['task'],
        additionalProperties: false,
      },
    },
    {
      name: 'entity_create',
      description: 'Create a Classification record for a divergent task; validates the Classification field contract and badges the row through the same handler as the visible Classify form.',
      inputSchema: classificationArgsSchema,
    },
    {
      name: 'entity_update',
      description: 'Update an existing Classification record for a divergent task; same field contract and handler as entity_create.',
      inputSchema: classificationArgsSchema,
    },
    {
      name: 'session_start',
      description: 'Start the cell-re-run demo for one bounded seeded model and harness; completes with the same queued/running/complete walk and timeline entry as the visible Re-run control.',
      inputSchema: {
        type: 'object',
        properties: {
          demo: { type: 'string', enum: ['cell-re-run'] },
          model: { type: 'string', enum: models },
          harness: { type: 'string', enum: harnesses },
        },
        required: ['demo', 'model', 'harness'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_export',
      description: 'Open the live export drawer at a bounded format: calibration-json or variance-csv.',
      inputSchema: {
        type: 'object',
        properties: { format: { type: 'string', enum: EXPORT_FORMATS } },
        required: ['format'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_import',
      description: 'Open paste-mode Import for a bounded pack mode: calibration-json or triage-json. Pasting and confirming stay with the visible form.',
      inputSchema: {
        type: 'object',
        properties: { mode: { type: 'string', enum: IMPORT_MODES } },
        required: ['mode'],
        additionalProperties: false,
      },
    },
    {
      name: 'artifact_copy',
      description: 'Copy the active bounded export format using the same visible export workflow; confirmation appears in the export drawer.',
      inputSchema: {
        type: 'object',
        properties: { format: { type: 'string', enum: EXPORT_FORMATS } },
        required: ['format'],
        additionalProperties: false,
      },
    },
  ]

  const toolNames = TOOLS.map((tool) => tool.name)

  const sessionInfo = () => ({
    contract_version: CONTRACT_VERSION,
    app: 'meridian-calibration',
    modules: MODULES,
    tools: toolNames,
    bindings: {
      browsable_entity: 'cells',
      destinations: DESTINATIONS,
      filters: FILTERS,
      models,
      harnesses,
      entity: 'classification',
      entity_operations: ['create', 'select', 'update'],
      entity_fields: ['classification', 'rationale'],
      session_operations: ['start'],
      demos: ['cell-re-run'],
      artifact_operations: ['export', 'import', 'copy'],
      export_formats: EXPORT_FORMATS,
      import_modes: IMPORT_MODES,
    },
  })

  const listTools = () => ({ tools: TOOLS })

  const invokeTool = async (name, args = {}) => {
    const handler = handlers[name]
    if (!handler) return fail(`Unsupported tool: ${name}. Registered tools: ${toolNames.join(', ')}`)
    try {
      const result = await handler(args || {})
      await settleVisibleState(name)
      return result
    } catch (error) {
      return fail(error?.message || String(error))
    }
  }

  // The verifier's CDP bridge calls these three window functions directly.
  window.webmcp_session_info = sessionInfo
  window.webmcp_list_tools = listTools
  window.webmcp_invoke_tool = invokeTool
  window.webmcp = { sessionInfo, listTools, invokeTool }

  // Also register on the browser-native Model Context surface when present.
  const native = typeof navigator !== 'undefined' ? navigator.modelContext : null
  if (native?.registerTool) {
    TOOLS.forEach((tool) => {
      try {
        native.registerTool({ ...tool, execute: (args) => invokeTool(tool.name, args) })
      } catch {
        // The window.webmcp_* surface above remains the authoritative path.
      }
    })
  }
}
