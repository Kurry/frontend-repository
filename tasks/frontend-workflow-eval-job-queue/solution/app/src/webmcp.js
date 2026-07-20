import { createJobSchema } from './schemas'
import { buildSnapshot, useQueueStore } from './store'

const tool = (name, description, properties = {}, required = []) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
})

const tools = [
  tool('browse_open', 'Open a declared evaluation queue destination.', { destination: { type: 'string', enum: ['jobs', 'job-detail', 'provider-lanes', 'aggregates', 'timeline', 'export-queue', 'import-queue'] }, jobId: { type: 'string' } }, ['destination']),
  tool('browse_search', 'Search the jobs entity by a visible job id, dataset, agent, or model.', { query: { type: 'string' } }, ['query']),
  tool('browse_apply_filter', 'Apply one declared queue filter.', { filter: { type: 'string', enum: ['status', 'model', 'dataset', 'timeline-status'] }, value: { type: 'string' } }, ['filter', 'value']),
  tool('browse_clear_filter', 'Clear one declared queue filter or all job filters.', { filter: { type: 'string', enum: ['status', 'model', 'dataset', 'timeline-status', 'all'] } }, ['filter']),
  tool('browse_sort', 'Report the fixed newest-submission queue ordering.', { sort: { type: 'string', enum: ['submitted-desc'] } }, ['sort']),
  tool('browse_set_locale', 'Report locale availability for the queue console.', { locale: { type: 'string' } }, ['locale']),
  tool('browse_set_theme', 'Report theme availability for the queue console.', { theme: { type: 'string' } }, ['theme']),
  tool('form_validate', 'Validate the declared create-job fields with the visible form schema.', {
    dataset: { type: 'string' }, agent: { type: 'string' }, model: { type: 'string' }, 'trial-count': { type: ['number', 'string'] }, 'sweep-model': { type: 'string' },
  }),
  tool('form_submit', 'Submit a valid job using the same handler as the Submit job dialog.', {
    dataset: { type: 'string' }, agent: { type: 'string' }, model: { type: 'string' }, 'trial-count': { type: ['number', 'string'] }, 'sweep-model': { type: 'string' },
  }, ['dataset', 'agent', 'model', 'trial-count']),
  tool('form_cancel', 'Close the visible Submit job workflow.'),
  tool('form_reset', 'Reset the declared create-job fields.'),
  tool('form_advance', 'Open the Submit job workflow at its single form step.'),
  tool('form_return', 'Return from the Submit job workflow to jobs.'),
  tool('session_start', 'Start or acknowledge the live client-side queue simulation.'),
  tool('session_pause', 'Pause a declared provider lane.', { providerId: { type: 'string', enum: ['northgale-compute', 'bluefjord-cloud', 'skylark-systems'] } }, ['providerId']),
  tool('session_resume', 'Resume a declared provider lane.', { providerId: { type: 'string', enum: ['northgale-compute', 'bluefjord-cloud', 'skylark-systems'] } }, ['providerId']),
  tool('session_stop', 'Cancel a queued or running job.', { jobId: { type: 'string' } }, ['jobId']),
  tool('session_restart', 'Manually retry one exhausted trial.', { jobId: { type: 'string' }, trialId: { type: 'string' } }, ['jobId', 'trialId']),
  tool('session_advance', 'Advance the simulation by one scheduler tick.'),
  tool('session_trigger_demo', 'Reset the in-memory queue to its seeded demonstration state.'),
  tool('session_connect', 'Report the local simulation connection state.'),
  tool('session_disconnect', 'Report that the local simulation cannot be disconnected independently.'),
  tool('artifact_import', 'Open the Queue Snapshot JSON import surface.'),
  tool('artifact_export', 'Open and compile the Queue Snapshot JSON export surface.', { format: { type: 'string', enum: ['queue-snapshot-json', 'yaml-config-preview'] } }, ['format']),
  tool('artifact_copy', 'Copy the currently visible declared preview using the product handler.', { format: { type: 'string', enum: ['queue-snapshot-json', 'yaml-config-preview'] } }, ['format']),
  tool('artifact_print_preview', 'Report print-preview availability without changing queue state.'),
  tool('artifact_convert', 'Report conversion availability for declared artifacts.'),
]

const draftFromArgs = (args) => ({
  dataset: args.dataset ?? '',
  agent: args.agent ?? '',
  model: args.model ?? '',
  trialCount: args['trial-count'] ?? '',
  sweepModel: args['sweep-model'] ?? '',
})

const visibleState = () => {
  const state = useQueueStore.getState()
  return { activeView: state.activeView, selectedJobId: state.selectedJobId, jobs: state.jobs.length }
}

function invoke(name, args = {}) {
  const state = useQueueStore.getState()
  switch (name) {
    case 'browse_open': {
      if (args.destination === 'jobs' || args.destination === 'provider-lanes') state.setActiveView('jobs')
      else if (args.destination === 'job-detail') {
        const job = state.jobs.find((item) => item.id === args.jobId) || state.jobs[0]
        if (job) state.setSelectedJob(job.id)
      } else if (args.destination === 'aggregates') state.setActiveView('aggregates')
      else if (args.destination === 'timeline') state.setActiveView('timeline')
      else if (args.destination === 'export-queue') { state.refreshExport(); state.setChrome('exportOpen', true) }
      else if (args.destination === 'import-queue') state.setChrome('importOpen', true)
      return { success: true, visible: visibleState() }
    }
    case 'browse_search': {
      state.setActiveView('jobs')
      const query = String(args.query).toLowerCase()
      const matches = state.jobs.filter((job) => [job.id, job.dataset, job.agent, job.model].some((value) => value.toLowerCase().includes(query)))
      if (matches.length === 1) state.setSelectedJob(matches[0].id)
      return { success: true, matchCount: matches.length, matches: matches.slice(0, 10).map((job) => job.id), visible: visibleState() }
    }
    case 'browse_apply_filter': {
      const key = args.filter === 'timeline-status' ? 'timelineStatus' : args.filter
      state.setFilter(key, args.value)
      if (key === 'timelineStatus') state.setActiveView('timeline'); else state.setActiveView('jobs')
      return { success: true, filter: args.filter, value: args.value }
    }
    case 'browse_clear_filter': {
      if (args.filter === 'all') state.clearFilters()
      else state.setFilter(args.filter === 'timeline-status' ? 'timelineStatus' : args.filter, '')
      return { success: true }
    }
    case 'browse_sort': return { success: true, sort: 'submitted-desc', message: 'Jobs use the fixed queue ordering shown in the table.' }
    case 'browse_set_locale': return { success: false, message: 'Locale switching is not configured; the visible console remains English.' }
    case 'browse_set_theme': return { success: false, message: 'Theme switching is not configured; the visible console keeps its operator theme.' }
    case 'form_validate': {
      const result = createJobSchema.safeParse(draftFromArgs(args))
      state.setFormDraft(draftFromArgs(args)); state.setChrome('submitOpen', true)
      return result.success ? { success: true, valid: true } : { success: false, valid: false, errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) }
    }
    case 'form_submit': {
      const result = createJobSchema.safeParse(draftFromArgs(args))
      state.setFormDraft(draftFromArgs(args)); state.setChrome('submitOpen', true)
      if (!result.success) return { success: false, errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) }
      const created = useQueueStore.getState().submitJobs({ ...result.data, sweepModel: result.data.sweepModel || undefined })
      return { success: true, createdJobIds: created.map((job) => job.id), visible: visibleState() }
    }
    case 'form_cancel': state.setChrome('submitOpen', false); return { success: true }
    case 'form_reset': state.setFormDraft({ dataset: '', agent: '', model: '', trialCount: '4', sweepModel: '' }); state.setChrome('submitOpen', true); return { success: true }
    case 'form_advance': state.setChrome('submitOpen', true); return { success: true, step: 'create-job' }
    case 'form_return': state.setChrome('submitOpen', false); state.setActiveView('jobs'); return { success: true }
    case 'session_start': return { success: true, message: 'The visible live simulation is running.' }
    case 'session_pause': return { success: state.setProviderPaused(args.providerId, true), providerId: args.providerId, rateLimit: 'paused' }
    case 'session_resume': return { success: state.setProviderPaused(args.providerId, false), providerId: args.providerId }
    case 'session_stop': return { success: state.cancelJob(args.jobId), jobId: args.jobId }
    case 'session_restart': return { success: state.manualRetry(args.jobId, args.trialId), jobId: args.jobId, trialId: args.trialId }
    case 'session_advance': state.tick(); return { success: true, message: 'One scheduler tick applied; timing behavior remains visible in the UI.' }
    case 'session_trigger_demo': state.resetQueue(); return { success: true, visible: visibleState() }
    case 'session_connect': return { success: true, connection: 'local-client-simulation' }
    case 'session_disconnect': return { success: false, message: 'The in-memory simulation is part of this page session and has no remote connection.' }
    case 'artifact_import': state.setChrome('importOpen', true); return { success: true, visibleSurface: 'import-queue' }
    case 'artifact_export': {
      if (args.format === 'yaml-config-preview') { state.setChrome('submitOpen', true); return { success: true, visibleSurface: 'submit-job', format: args.format } }
      state.refreshExport(); state.setChrome('exportOpen', true); return { success: true, visibleSurface: 'export-queue', format: args.format }
    }
    case 'artifact_copy': {
      if (args.format === 'queue-snapshot-json') {
        const text = state.refreshExport()
        navigator.clipboard.writeText(text).catch(() => {})
        state.setChrome('exportOpen', true); state.addToast('Queue snapshot copied')
        return { success: true, format: args.format, message: 'Visible Queue Snapshot preview copied.' }
      }
      state.setChrome('submitOpen', true)
      return { success: false, format: args.format, message: 'Use the visible Configuration preview Copy control after choosing form values.' }
    }
    case 'artifact_print_preview': return { success: false, message: 'Print preview is not configured for this queue.' }
    case 'artifact_convert': return { success: false, message: 'No artifact conversion modes are configured.' }
    default: throw new Error(`Unknown WebMCP tool: ${name}`)
  }
}

export function registerWebMcp() {
  if (window.webmcp_list_tools) return
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((item) => item.name),
    entity: 'jobs',
  })
  window.webmcp_list_tools = () => tools
  window.webmcp_invoke_tool = (name, args) => Promise.resolve(invoke(name, args))
}
