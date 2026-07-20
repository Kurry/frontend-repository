import { newScriptSchema, scheduleSchema, stepTypes } from './schemas'
import { useStudio } from './store'

const destinations = ['step-editor', 'playground', 'runs', 'scheduled-queue', 'export']
const themes = ['Midnight', 'Ocean', 'Solar']
const intervals = ['hourly', 'daily', 'weekly']

const schemas = {
  destination: { type: 'string', enum: destinations },
  id: { type: 'string' },
  confirm: { type: 'boolean' },
}

const tools = [
  ['browse_open', 'Open a declared studio destination.', { destination: schemas.destination }, ['destination']],
  ['browse_search', 'Search the bounded script catalog and visible command results.', { query: { type: 'string' } }, ['query']],
  ['browse_apply_filter', 'Apply a declared timeline status or compare-pair filter.', { filter: { type: 'string', enum: ['timeline-status', 'compare-pair'] }, value: {} }, ['filter', 'value']],
  ['browse_clear_filter', 'Clear a declared filter.', { filter: { type: 'string', enum: ['timeline-status', 'compare-pair'] } }, ['filter']],
  ['browse_sort', 'Sort scripts by name or latest run.', { sort: { type: 'string', enum: ['name', 'latest-run'] } }, ['sort']],
  ['browse_set_locale', 'Set the bounded application locale.', { locale: { type: 'string', enum: ['en'] } }, ['locale']],
  ['browse_set_theme', 'Set a named console theme.', { theme: { type: 'string', enum: themes } }, ['theme']],
  ['editor_select', 'Select a script, step, version, or run object.', { object_type: { type: 'string', enum: ['script', 'step', 'schedule', 'playground'] }, id: schemas.id }, ['object_type']],
  ['editor_add', 'Add a script or step through the shared editor actions.', { object_type: { type: 'string', enum: ['script', 'step'] }, name: { type: 'string' }, target_url: { type: 'string' }, description: { type: 'string' }, step_type: { type: 'string', enum: stepTypes } }, ['object_type']],
  ['editor_delete', 'Delete a declared script or step after explicit confirmation.', { object_type: { type: 'string', enum: ['script', 'step'] }, id: schemas.id, confirm: schemas.confirm }, ['object_type', 'id', 'confirm']],
  ['editor_update_property', 'Update a declared editor property through the same shared actions as the UI.', { object_type: { type: 'string', enum: ['script', 'step', 'schedule', 'playground'] }, id: schemas.id, property: { type: 'string', enum: ['name','target-url','description','step-type','url','selector','text','variable','ms','expected-text','disabled','order','schedule-enabled','schedule-time','schedule-interval','mock-html','playground-selector','console-theme'] }, value: {} }, ['object_type', 'property', 'value']],
  ['editor_set_content', 'Set bounded mock HTML or playground selector content.', { object_type: { type: 'string', enum: ['playground'] }, property: { type: 'string', enum: ['mock-html', 'playground-selector'] }, value: { type: 'string' } }, ['object_type', 'property', 'value']],
  ['editor_switch_mode', 'Switch the editor to edit, version preview, or run diff mode.', { mode: { type: 'string', enum: ['edit', 'version-preview', 'diff'] }, version: { type: 'number' } }, ['mode']],
  ['editor_preview', 'Open a visible structured preview.', { preview: { type: 'string', enum: ['definition-json', 'run-report-json', 'version'] }, version: { type: 'number' } }, ['preview']],
  ['session_start', 'Start one simulated script run.', { script_id: schemas.id, trigger: { type: 'string', enum: ['manual', 'schedule'] } }, []],
  ['session_pause', 'Pause the active simulated run.', {}, []],
  ['session_resume', 'Resume the active simulated run from its checkpoint.', {}, []],
  ['session_restart', 'Restart the active simulated run.', {}, []],
  ['session_trigger_demo', 'Trigger a declared visible workflow demo.', { demo: { type: 'string', enum: ['script-run', 'trigger-now', 'save-version', 'restore-version'] }, script_id: schemas.id, version: { type: 'number' } }, ['demo']],
  ['artifact_export', 'Open a declared export format without returning artifact contents.', { format: { type: 'string', enum: ['definition-json', 'run-report-json'] } }, ['format']],
  ['artifact_copy', 'Activate the visible copy-export workflow without returning clipboard contents.', { format: { type: 'string', enum: ['definition-json', 'run-report-json'] } }, ['format']],
]

const definitions = tools.map(([name, description, properties, required]) => ({
  name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false },
}))

function ok(message, extra = {}) { return { ok: true, message, visible_postcondition: message, ...extra } }
function fail(message) { throw new Error(message) }

const handlers = {
  browse_open: ({ destination }) => { useStudio.getState().setView(destination); return ok(`Opened ${destination}`) },
  browse_search: ({ query }) => { useStudio.getState().setUi({ paletteOpen: true, paletteQuery: query, paletteIndex: 0 }); return ok(`Command palette shows results for ${query}`) },
  browse_apply_filter: ({ filter, value }) => {
    if (filter === 'timeline-status') useStudio.getState().setTimelineFilter(String(value))
    else useStudio.setState({ selectedRuns: Array.isArray(value) ? value.slice(0, 2) : [] })
    return ok(`Applied ${filter}`)
  },
  browse_clear_filter: ({ filter }) => { if (filter === 'timeline-status') useStudio.getState().setTimelineFilter('all'); else useStudio.setState({ selectedRuns: [] }); return ok(`Cleared ${filter}`) },
  browse_sort: ({ sort }) => { const scripts = [...useStudio.getState().scripts].sort(sort === 'name' ? (a,b) => a.name.localeCompare(b.name) : (a,b) => Date.parse(b.lastRunAt || 0) - Date.parse(a.lastRunAt || 0)); useStudio.setState({ scripts }); return ok(`Sorted scripts by ${sort}`) },
  browse_set_locale: () => ok('Locale remains en'),
  browse_set_theme: ({ theme }) => { useStudio.getState().setConsoleTheme(theme); return ok(`Console theme is ${theme}`) },
  editor_select: ({ object_type, id }) => {
    if (object_type === 'script') useStudio.getState().selectScript(id)
    else if (object_type === 'step') useStudio.getState().highlightStep(id)
    else if (object_type === 'schedule') useStudio.getState().setView('scheduled-queue')
    else useStudio.getState().setView('playground')
    return ok(`Selected ${object_type}${id ? ` ${id}` : ''}`)
  },
  editor_add: args => {
    if (args.object_type === 'script') { const parsed = newScriptSchema.safeParse({ name: args.name, target_url: args.target_url, description: args.description || '' }); if (!parsed.success) fail(parsed.error.issues[0].message); const id = useStudio.getState().createScript(parsed.data); return ok('Created and selected one script', { id }) }
    useStudio.getState().addStep(args.step_type || 'click'); return ok(`Added ${args.step_type || 'click'} step`)
  },
  editor_delete: ({ object_type, id, confirm }) => { if (!confirm) fail('Delete requires confirm=true'); if (object_type === 'script') useStudio.getState().deleteScripts([id]); else useStudio.getState().deleteSteps([id]); return ok(`Deleted ${object_type} and dependent state`) },
  editor_update_property: args => {
    const state = useStudio.getState(); const prop = args.property
    if (args.object_type === 'script') state.updateScriptMeta(prop === 'target-url' ? 'target_url' : prop, args.value)
    else if (args.object_type === 'step') {
      if (!args.id) fail('Step id is required')
      const mapping = { 'step-type':'type', 'expected-text':'expected_text' }; state.updateStep(args.id, mapping[prop] || prop, args.value)
    } else if (args.object_type === 'schedule') {
      const script = state.scripts.find(s => s.id === state.selectedScriptId); const schedule = { ...script.schedule }
      if (prop === 'schedule-enabled') schedule.enabled = !!args.value
      if (prop === 'schedule-time') schedule.time = args.value
      if (prop === 'schedule-interval') schedule.interval = args.value
      const parsed = scheduleSchema.safeParse(schedule); if (!parsed.success) fail(parsed.error.issues[0].message); state.updateSchedule(parsed.data)
    } else {
      const key = prop === 'mock-html' ? 'playgroundHtml' : prop === 'playground-selector' ? 'playgroundSelector' : null; if (key) state.setPlayground({ [key]: args.value })
    }
    if (prop === 'console-theme') state.setConsoleTheme(args.value)
    return ok(`Updated ${prop}`)
  },
  editor_set_content: ({ property, value }) => { useStudio.getState().setPlayground({ [property === 'mock-html' ? 'playgroundHtml' : 'playgroundSelector']: value }); useStudio.getState().setView('playground'); return ok(`Updated ${property}`) },
  editor_switch_mode: ({ mode, version }) => { if (mode === 'version-preview') useStudio.getState().previewVersion(version); else if (mode === 'diff') useStudio.getState().setView('runs'); else useStudio.getState().previewVersion(null); return ok(`Switched to ${mode}`) },
  editor_preview: ({ preview, version }) => { if (preview === 'version') { useStudio.getState().setView('step-editor'); useStudio.getState().previewVersion(version) } else { useStudio.getState().setView('export'); useStudio.getState().setUi({ exportTab: preview === 'definition-json' ? 'definition' : 'report' }) } return ok(`Opened ${preview} preview`) },
  session_start: ({ script_id, trigger = 'manual' }) => { const started = useStudio.getState().startRun(script_id || useStudio.getState().selectedScriptId, trigger); if (!started) fail('Run could not start: another run is active or the script has no steps'); return ok('Run started and is visibly streaming') },
  session_pause: () => { useStudio.getState().pauseRun(); return ok('Active run is paused') },
  session_resume: () => { useStudio.getState().resumeRun(); return ok('Active run resumed from its checkpoint') },
  session_restart: () => { useStudio.getState().restartRun(); return ok('Active run restarted') },
  session_trigger_demo: ({ demo, script_id, version }) => {
    const state = useStudio.getState()
    if (demo === 'script-run') state.startRun(script_id || state.selectedScriptId, 'manual')
    if (demo === 'trigger-now') state.startRun(script_id || state.selectedScriptId, 'schedule')
    if (demo === 'save-version') state.saveVersion()
    if (demo === 'restore-version') state.restoreVersion(version)
    return ok(`Triggered ${demo}`)
  },
  artifact_export: ({ format }) => { useStudio.getState().setView('export'); useStudio.getState().setUi({ exportTab: format === 'definition-json' ? 'definition' : 'report' }); return ok(`Visible export is ${format}`) },
  artifact_copy: ({ format }) => { useStudio.getState().setView('export'); useStudio.getState().setUi({ exportTab: format === 'definition-json' ? 'definition' : 'report' }); setTimeout(() => document.querySelector('button') && [...document.querySelectorAll('button')].find(button => button.textContent.includes('Copy export'))?.click(), 50); return ok(`Activated visible copy workflow for ${format}`) },
}

if (typeof window !== 'undefined') {
  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['browse-query-v1','structured-editor-v1','command-session-v1','artifact-transfer-v1'], tools: definitions.map(tool => tool.name) })
  window.webmcp_list_tools = () => definitions
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name]; if (!handler) throw new Error(`Unknown WebMCP tool: ${name}`)
    return await handler(args)
  }
  window.webmcp = { sessionInfo: window.webmcp_session_info, listTools: window.webmcp_list_tools, invokeTool: window.webmcp_invoke_tool }
}
