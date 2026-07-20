import { createJobSchema, DATASET_SLICES, ITEM_STATUSES, MODEL_IDS, PROMPT_TEMPLATES, type DatasetRow } from './contracts'
import { parseDatasetPaste } from './components/ComposerModal'
import { selectedEntities, useBatchStore } from './store'

type ToolResult = { ok: boolean; message: string; visibleState?: Record<string, unknown>; error?: string }
type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (args?: Record<string, unknown>) => Promise<ToolResult> | ToolResult
}

const objectSchema = (properties: Record<string, unknown> = {}, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false })
const stringEnum = (values: readonly string[]) => ({ type: 'string', enum: values })

function visibleSelection() {
  const state = useBatchStore.getState()
  const { job, run } = selectedEntities(state)
  return { selectedJobId: job?.id ?? null, selectedJobName: job?.name ?? null, selectedRunId: run?.id ?? null, runStatus: run?.status ?? null }
}

function scrollToLabel(label: string) {
  window.requestAnimationFrame(() => document.querySelector(`[aria-label="${label}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

const destinations = ['job-sidebar', 'job-detail', 'execution-grid', 'pending-queue', 'event-timeline', 'run-history', 'compare-runs', 'result-inspector', 'export'] as const
const reportFormats = ['run-report-json', 'run-report-csv', 'ics-calendar-text'] as const

function parseFormPayload(args: Record<string, unknown>) {
  let dataset: DatasetRow[] = []
  const sliceId = String(args['dataset-slice'] ?? '')
  const paste = String(args['dataset-paste'] ?? '')
  if (paste) {
    const parsed = parseDatasetPaste(paste)
    if (parsed.errors.length) return { success: false as const, error: parsed.errors.join('; ') }
    dataset = parsed.rows
  } else if (sliceId) {
    dataset = structuredClone(DATASET_SLICES.find((slice) => slice.id === sliceId)?.rows ?? [])
  }
  const windowStart = String(args['schedule-window-start'] ?? '')
  const windowEnd = String(args['schedule-window-end'] ?? '')
  const payload = {
    name: args['job-name'],
    promptTemplate: args['prompt-template'],
    model: args.model,
    concurrency: args.concurrency,
    dataset,
    schedule: windowStart || windowEnd ? {
      windowStart: windowStart && !Number.isNaN(Date.parse(windowStart)) ? new Date(windowStart).toISOString() : windowStart,
      windowEnd: windowEnd && !Number.isNaN(Date.parse(windowEnd)) ? new Date(windowEnd).toISOString() : windowEnd,
    } : null,
  }
  const parsed = createJobSchema.safeParse(payload)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ') }
  return { success: true as const, data: parsed.data }
}

const tools: ToolDefinition[] = [
  {
    name: 'browse_open',
    description: 'Open a declared Batchline destination and update the same visible selection used by the UI.',
    inputSchema: objectSchema({ destination: stringEnum(destinations), jobId: { type: 'string' }, runId: { type: 'string' }, itemIndex: { type: 'integer', minimum: 0 } }, ['destination']),
    execute: (args = {}) => {
      const destination = String(args.destination ?? '') as (typeof destinations)[number]
      if (!destinations.includes(destination)) return { ok: false, message: 'Destination was rejected.', error: 'destination must be one of the declared destinations' }
      const store = useBatchStore.getState()
      if (typeof args.jobId === 'string' && store.jobs.some((job) => job.id === args.jobId)) store.selectJob(args.jobId)
      if (typeof args.runId === 'string') useBatchStore.getState().selectRun(args.runId)
      if (destination === 'job-sidebar') store.setUi({ sidebarOpen: true })
      if (destination === 'compare-runs') {
        const { job } = selectedEntities(useBatchStore.getState())
        store.setUi({ compareOpen: true, compareA: job?.runs.at(-2)?.id ?? null, compareB: job?.runs.at(-1)?.id ?? null })
      }
      if (destination === 'result-inspector' && Number.isInteger(args.itemIndex)) store.setUi({ inspectorIndex: Number(args.itemIndex) })
      if (destination === 'export') store.setUi({ exportOpen: true, exportTimestamp: new Date().toISOString() })
      const labels: Partial<Record<(typeof destinations)[number], string>> = { 'execution-grid': 'Execution grid', 'pending-queue': 'Pending queue', 'event-timeline': 'Event timeline', 'run-history': 'Run history' }
      if (labels[destination]) scrollToLabel(labels[destination]!)
      return { ok: true, message: `Opened ${destination}.`, visibleState: { destination, ...visibleSelection() } }
    },
  },
  {
    name: 'browse_search',
    description: 'Search the bounded jobs collection by name and select the first visible match.',
    inputSchema: objectSchema({ query: { type: 'string', minLength: 1 } }, ['query']),
    execute: (args = {}) => {
      const query = String(args.query ?? '').trim().toLowerCase()
      const matches = useBatchStore.getState().jobs.filter((job) => job.name.toLowerCase().includes(query))
      if (matches[0]) useBatchStore.getState().selectJob(matches[0].id)
      return { ok: true, message: `${matches.length} jobs matched.`, visibleState: { matchCount: matches.length, matches: matches.map((job) => ({ id: job.id, name: job.name })), ...visibleSelection() } }
    },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply one of the declared timeline, run-history, or comparison filters.',
    inputSchema: objectSchema({ filter: stringEnum(['timeline-status', 'run-history-selection', 'compare-run-pair']), value: {}, valueB: { type: 'string' } }, ['filter', 'value']),
    execute: (args = {}) => {
      const filter = String(args.filter)
      const store = useBatchStore.getState()
      if (filter === 'timeline-status') {
        const status = String(args.value)
        if (status !== 'all' && !ITEM_STATUSES.includes(status as typeof ITEM_STATUSES[number])) return { ok: false, message: 'Filter rejected.', error: 'timeline-status must be all or a closed-set item status' }
        store.setUi({ timelineFilter: status as 'all' | typeof ITEM_STATUSES[number] })
      } else if (filter === 'run-history-selection') store.selectRun(String(args.value))
      else if (filter === 'compare-run-pair') store.setUi({ compareOpen: true, compareA: String(args.value), compareB: String(args.valueB ?? '') })
      else return { ok: false, message: 'Filter rejected.', error: 'filter is not declared' }
      return { ok: true, message: `Applied ${filter}.`, visibleState: { filter, value: args.value, ...visibleSelection() } }
    },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear a declared visible filter.',
    inputSchema: objectSchema({ filter: stringEnum(['timeline-status', 'run-history-selection', 'compare-run-pair']) }, ['filter']),
    execute: (args = {}) => {
      const store = useBatchStore.getState()
      if (args.filter === 'timeline-status') store.setUi({ timelineFilter: 'all' })
      else if (args.filter === 'compare-run-pair') store.setUi({ compareA: null, compareB: null })
      else if (args.filter === 'run-history-selection') {
        const { job } = selectedEntities(store)
        if (job?.runs.at(-1)) store.selectRun(job.runs.at(-1)!.id)
      }
      return { ok: true, message: `Cleared ${String(args.filter)}.`, visibleState: visibleSelection() }
    },
  },
  
  
  

  {
    name: 'form_validate',
    description: 'Validate only the declared job composer fields through the same Zod payload contract.',
    inputSchema: composerInputSchema(false),
    execute: (args = {}) => {
      const parsed = parseFormPayload(args)
      useBatchStore.getState().setUi({ composerOpen: true, editingJobId: null })
      return parsed.success ? { ok: true, message: 'Composer payload is valid.', visibleState: { valid: true, rowCount: parsed.data.dataset.length } } : { ok: false, message: 'Composer payload is invalid.', error: parsed.error, visibleState: { valid: false } }
    },
  },
  {
    name: 'form_submit',
    description: 'Submit declared job fields through the same createJob command as the visible composer.',
    inputSchema: composerInputSchema(true),
    execute: (args = {}) => {
      const parsed = parseFormPayload(args)
      if (!parsed.success) { useBatchStore.getState().setUi({ composerOpen: true, editingJobId: null }); return { ok: false, message: 'Job was not created.', error: parsed.error, visibleState: { jobCount: useBatchStore.getState().jobs.length } } }
      const before = useBatchStore.getState().jobs.length
      const jobId = useBatchStore.getState().createJob(parsed.data)
      return { ok: true, message: 'One Ready job was created.', visibleState: { jobId, jobCountBefore: before, jobCountAfter: useBatchStore.getState().jobs.length, status: parsed.data.schedule ? 'Scheduled' : 'Ready' } }
    },
  },
  { name: 'form_cancel', description: 'Cancel the currently visible declared form workflow.', inputSchema: objectSchema(), execute: () => { useBatchStore.getState().setUi({ composerOpen: false, scheduleOpen: false, importOpen: false, editingJobId: null }); return { ok: true, message: 'Visible form workflow cancelled.', visibleState: { formOpen: false } } } },
  { name: 'form_reset', description: 'Reset the composer by closing and reopening a clean form.', inputSchema: objectSchema(), execute: () => { const store = useBatchStore.getState(); store.setUi({ composerOpen: false, editingJobId: null }); window.setTimeout(() => useBatchStore.getState().setUi({ composerOpen: true }), 0); return { ok: true, message: 'Composer reset to defaults.', visibleState: { composerOpen: true } } } },
  { name: 'form_advance', description: 'Advance to the composer dataset section through the visible composer.', inputSchema: objectSchema(), execute: () => { useBatchStore.getState().setUi({ composerOpen: true, editingJobId: null }); return { ok: true, message: 'Composer opened; its declared fields are visible.', visibleState: { composerOpen: true } } } },
  { name: 'form_return', description: 'Return from the active form to the job workspace.', inputSchema: objectSchema(), execute: () => { useBatchStore.getState().setUi({ composerOpen: false, scheduleOpen: false, importOpen: false }); return { ok: true, message: 'Returned to the job workspace.', visibleState: visibleSelection() } } },

  sessionTool('start', 'Launch the selected Ready job exactly once.', () => useBatchStore.getState().launchJob()),
  sessionTool('pause', 'Pause the selected run at a checkpoint.', () => useBatchStore.getState().pauseJob()),
  sessionTool('resume', 'Resume the selected paused run from its checkpoint.', () => useBatchStore.getState().resumeJob()),
  sessionTool('stop', 'Stop pending and running items while preserving completed outputs.', () => useBatchStore.getState().stopJob()),
  sessionTool('restart', 'Retry only failed items of the selected run.', () => useBatchStore.getState().retryFailed()),
  sessionTool('trigger_demo', 'Trigger the declared simulate-window-start demo.', () => useBatchStore.getState().simulateWindowStart(), objectSchema({ demo: stringEnum(['simulate-window-start']) })),
  
  

  { name: 'artifact_import', description: 'Open the visible Run Report import surface; artifact contents remain a Playwright responsibility.', inputSchema: objectSchema(), execute: () => { useBatchStore.getState().setUi({ importOpen: true }); return { ok: true, message: 'Import run dialog opened.', visibleState: { importOpen: true } } } },
  {
    name: 'artifact_export',
    description: 'Open the visible export surface for a declared artifact format without returning artifact contents.',
    inputSchema: objectSchema({ format: stringEnum(reportFormats) }, ['format']),
    execute: (args = {}) => {
      const format = String(args.format)
      if (format === 'ics-calendar-text') useBatchStore.getState().setUi({ calendarOpen: true })
      else useBatchStore.getState().setUi({ exportOpen: true, exportTimestamp: new Date().toISOString() })
      return { ok: true, message: `${format} export surface opened.`, visibleState: { format, exportOpen: format !== 'ics-calendar-text', calendarOpen: format === 'ics-calendar-text', ...visibleSelection() } }
    },
  },
  {
    name: 'artifact_copy',
    description: 'Open a declared artifact preview so the real copy control can be observed; no contents are returned.',
    inputSchema: objectSchema({ format: stringEnum(['run-report-json', 'ics-calendar-text']) }, ['format']),
    execute: (args = {}) => {
      const format = String(args.format)
      useBatchStore.getState().setUi(format === 'ics-calendar-text' ? { calendarOpen: true } : { exportOpen: true, exportTimestamp: new Date().toISOString() })
      return { ok: true, message: `Opened ${format}; activate its visible Copy control to place exact text on the clipboard.`, visibleState: { format, previewVisible: true } }
    },
  },
  
  
]

function composerInputSchema(required: boolean) {
  const fields = {
    'job-name': { type: 'string', minLength: 1, maxLength: 80 },
    'prompt-template': stringEnum(PROMPT_TEMPLATES.map((template) => template.id)),
    model: stringEnum(MODEL_IDS),
    concurrency: { type: 'integer', minimum: 1, maximum: 5, default: 3 },
    'dataset-slice': stringEnum(DATASET_SLICES.map((slice) => slice.id)),
    'dataset-paste': { type: 'string' },
    'schedule-window-start': { type: 'string' },
    'schedule-window-end': { type: 'string' },
  }
  return objectSchema(fields, required ? ['job-name', 'prompt-template', 'model', 'concurrency'] : [])
}

function sessionTool(operation: string, description: string, action: () => unknown, inputSchema = objectSchema()): ToolDefinition {
  return {
    name: `session_${operation}`,
    description,
    inputSchema,
    execute: () => {
      const before = visibleSelection()
      action()
      return { ok: true, message: `Session ${operation} command applied through the visible run handler.`, visibleState: { before, after: visibleSelection() } }
    },
  }
}

let registered = false

export function registerWebMcp() {
  if (registered || typeof window === 'undefined') return
  registered = true
  const registry = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  window.webmcpTools = registry
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = registry[name]
    if (!tool) return { ok: false, message: 'Unknown WebMCP tool.', error: `Tool ${name} is not registered.` }
    try { return await tool.execute(args) }
    catch (error) { return { ok: false, message: 'WebMCP handler failed.', error: error instanceof Error ? error.message : String(error) } }
  }
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', modules: ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'], toolCount: tools.length })

  const nativeContext = (navigator as Navigator & { modelContext?: { registerTool?: (definition: unknown) => void } }).modelContext
  tools.forEach((tool) => {
    const definition = { name: tool.name, description: tool.description, inputSchema: tool.inputSchema, execute: tool.execute }
    try { nativeContext?.registerTool?.(definition) } catch { /* compatibility registry remains available */ }
    try { window.webmcp?.registerTool?.(definition) } catch { /* compatibility registry remains available */ }
  })
}
