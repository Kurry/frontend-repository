import { createJobSchema } from './schemas'
import { buildSnapshot, useQueueStore } from './store'
import { flushUi } from './flushBridge'

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

const previewYaml = (values) => [
  `dataset: ${values.dataset || 'not-set'}`,
  `agent: ${values.agent || 'not-set'}`,
  `model: ${values.model || 'not-set'}`,
  `trialCount: ${values.trialCount || 'not-set'}`,
  ...(values.sweepModel ? [`sweepModel: ${values.sweepModel}`] : []),
].join('\n')

const visibleState = () => {
  const state = useQueueStore.getState()
  return { activeView: state.activeView, selectedJobId: state.selectedJobId, jobs: state.jobs.length }
}

async function copyAndStage(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  useQueueStore.getState().stageClipboard(text)
}

function invoke(name, args = {}) {
  const state = useQueueStore.getState()
  let result
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
      result = { success: true, visible: visibleState() }
      break
    }
    case 'browse_search': {
      state.setActiveView('jobs')
      const query = String(args.query).toLowerCase()
      const matches = state.jobs.filter((job) => [job.id, job.dataset, job.agent, job.model].some((value) => value.toLowerCase().includes(query)))
      if (matches.length === 1) state.setSelectedJob(matches[0].id)
      result = { success: true, matchCount: matches.length, matches: matches.slice(0, 10).map((job) => job.id), visible: visibleState() }
      break
    }
    case 'browse_apply_filter': {
      const key = args.filter === 'timeline-status' ? 'timelineStatus' : args.filter
      state.setFilter(key, args.value)
      if (key === 'timelineStatus') state.setActiveView('timeline'); else state.setActiveView('jobs')
      result = { success: true, filter: args.filter, value: args.value }
      break
    }
    case 'browse_clear_filter': {
      if (args.filter === 'all') state.clearFilters()
      else state.setFilter(args.filter === 'timeline-status' ? 'timelineStatus' : args.filter, '')
      result = { success: true }
      break
    }
    case 'browse_sort':
      result = { success: true, sort: 'submitted-desc', message: 'Jobs use the fixed queue ordering shown in the table.' }
      break
    case 'browse_set_locale':
      result = { success: false, message: 'Locale switching is not configured; the visible console remains English.' }
      break
    case 'browse_set_theme': {
      if (['dark', 'light'].includes(args.theme)) {
        state.setTheme(args.theme)
        result = { success: true, theme: args.theme }
      } else {
        result = { success: false, message: 'Supported themes are dark and light.' }
      }
      break
    }
    case 'form_validate': {
      const resultParse = createJobSchema.safeParse(draftFromArgs(args))
      state.setFormDraft(draftFromArgs(args)); state.setChrome('submitOpen', true)
      result = resultParse.success ? { success: true, valid: true } : { success: false, valid: false, errors: resultParse.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) }
      break
    }
    case 'form_submit': {
      const resultParse = createJobSchema.safeParse(draftFromArgs(args))
      state.setFormDraft(draftFromArgs(args)); state.setChrome('submitOpen', true)
      if (!resultParse.success) {
        result = { success: false, errors: resultParse.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) }
        break
      }
      const created = useQueueStore.getState().submitJobs({ ...resultParse.data, sweepModel: resultParse.data.sweepModel || undefined })
      result = { success: true, createdJobIds: created.map((job) => job.id), visible: visibleState() }
      break
    }
    case 'form_cancel':
      state.setChrome('submitOpen', false)
      result = { success: true }
      break
    case 'form_reset':
      state.setFormDraft({ dataset: '', agent: '', model: '', trialCount: '4', sweepModel: '' }); state.setChrome('submitOpen', true)
      result = { success: true }
      break
    case 'form_advance':
      state.setChrome('submitOpen', true)
      result = { success: true, step: 'create-job' }
      break
    case 'form_return':
      state.setChrome('submitOpen', false); state.setActiveView('jobs')
      result = { success: true }
      break
    case 'session_start':
      result = { success: true, message: 'The visible live simulation is running.' }
      break
    case 'session_pause':
      result = { success: state.setProviderPaused(args.providerId, true), providerId: args.providerId, rateLimit: 'paused' }
      break
    case 'session_resume':
      result = { success: state.setProviderPaused(args.providerId, false), providerId: args.providerId }
      break
    case 'session_stop':
      result = { success: state.cancelJob(args.jobId), jobId: args.jobId }
      break
    case 'session_restart':
      result = { success: state.manualRetry(args.jobId, args.trialId), jobId: args.jobId, trialId: args.trialId }
      break
    case 'session_advance':
      state.tick()
      result = { success: true, message: 'One scheduler tick applied; timing behavior remains visible in the UI.' }
      break
    case 'session_trigger_demo':
      state.resetQueue()
      result = { success: true, visible: visibleState() }
      break
    case 'session_connect':
      result = { success: true, connection: 'local-client-simulation' }
      break
    case 'session_disconnect':
      result = { success: false, message: 'The in-memory simulation is part of this page session and has no remote connection.' }
      break
    case 'artifact_import':
      state.setChrome('importOpen', true)
      result = { success: true, visibleSurface: 'import-queue' }
      break
    case 'artifact_export': {
      if (args.format === 'yaml-config-preview') { state.setChrome('submitOpen', true); result = { success: true, visibleSurface: 'submit-job', format: args.format }; break }
      state.refreshExport(); state.setChrome('exportOpen', true)
      result = { success: true, visibleSurface: 'export-queue', format: args.format }
      break
    }
    case 'artifact_copy': {
      if (args.format === 'queue-snapshot-json') {
        const text = state.refreshExport()
        copyAndStage(text)
        state.setChrome('exportOpen', true); state.addToast('Queue snapshot copied')
        result = { success: true, format: args.format, message: 'Visible Queue Snapshot preview copied.' }
        break
      }
      const draft = { ...state.formDraft, ...draftFromArgs(args) }
      state.setFormDraft(draft)
      state.setChrome('submitOpen', true)
      const text = previewYaml(draft)
      copyAndStage(text)
      state.addToast('Configuration preview copied')
      result = { success: true, format: args.format, message: 'Visible configuration preview copied.' }
      break
    }
    case 'artifact_print_preview':
      result = { success: false, message: 'Print preview is not configured for this queue.' }
      break
    case 'artifact_convert':
      result = { success: false, message: 'No artifact conversion modes are configured.' }
      break
    default:
      throw new Error(`Unknown WebMCP tool: ${name}`)
  }
  flushUi()
  return result
}

export function registerWebMcp() {
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((item) => item.name),
    entity: 'jobs',
  })
  window.webmcp_list_tools = () => tools
  window.webmcp_invoke_tool = (name, args) => Promise.resolve(invoke(name, args))
}
