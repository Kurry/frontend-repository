import { newScriptSchema, paramSchemas, scheduleSchema, stepTypes } from './schemas'
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
  browse_open: ({ destination }) => {
    if (!destinations.includes(destination)) fail(`Unknown destination: ${destination}`)
    const state = useStudio.getState()
    state.setUi({ scheduleOpen: false, newScriptModal: false, paletteOpen: false, historyOpen: false })
    state.setView(destination)
    return ok(`Opened ${destination}`)
  },
  browse_search: ({ query }) => { useStudio.getState().setUi({ paletteOpen: true, paletteQuery: query, paletteIndex: 0 }); return ok(`Command palette shows results for ${query}`) },
  browse_apply_filter: ({ filter, value }) => {
    if (filter === 'timeline-status') useStudio.getState().setTimelineFilter(String(value))
    else useStudio.setState({ selectedRuns: Array.isArray(value) ? value.slice(0, 2) : [] })
    return ok(`Applied ${filter}`)
  },
  browse_clear_filter: ({ filter }) => { if (filter === 'timeline-status') useStudio.getState().setTimelineFilter('all'); else useStudio.setState({ selectedRuns: [] }); return ok(`Cleared ${filter}`) },
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
    if (args.object_type === 'script') {
      if (args.id && args.id !== state.selectedScriptId) state.selectScript(args.id)
      const key = prop === 'target-url' ? 'target_url' : prop
      if (key === 'target_url') { const parsed = newScriptSchema.shape.target_url.safeParse(args.value); if (!parsed.success) fail(parsed.error.issues[0].message) }
      if (key === 'name') { const parsed = newScriptSchema.shape.name.safeParse(args.value); if (!parsed.success) fail(parsed.error.issues[0].message) }
      if (!state.selectedScriptId) fail('No script is selected')
      state.updateScriptMeta(key, args.value)
    }
    else if (args.object_type === 'step') {
      if (!args.id) fail('Step id is required')
      const script = state.scripts.find(s => s.id === state.selectedScriptId)
      const step = script?.steps.find(s => s.id === args.id)
      if (!step) fail(`No step ${args.id} in the selected script`)
      const mapping = { 'step-type':'type', 'expected-text':'expected_text' }
      const paramKey = mapping[prop] || prop
      // Structural fields (type/disabled/order/label) pass through; typed params are bound-checked.
      const paramFields = ['url','selector','text','variable','ms','expected_text']
      if (paramFields.includes(paramKey)) {
        // A step type's param schema only declares the keys the UI actually renders for it
        // (e.g. `screenshot` has none, `click` has only `selector`) and Zod's object schema
        // silently strips unknown keys on parse instead of rejecting them — so without this
        // check a call could set e.g. `text` on a `screenshot`/`click` step, pass validation
        // (the stripped key means nothing failed), and then still get written to state below.
        if (!(paramKey in paramSchemas[step.type].shape)) fail(`${prop} does not apply to ${step.type} steps`)
        const coerced = paramKey === 'ms' && args.value !== '' ? Number(args.value) : args.value
        // Validate only the field being set, not the full merged params object: multi-field
        // step types (type/extract/assert_text) let the UI edit one field at a time via
        // updateStep, which writes without cross-field validation, so a sibling field that
        // hasn't been filled in yet must not block this field's update.
        const parsed = paramSchemas[step.type].shape[paramKey].safeParse(coerced)
        if (!parsed.success) fail(parsed.error.issues[0].message)
        state.updateStep(args.id, paramKey, coerced)
      } else {
        state.updateStep(args.id, paramKey, args.value)
      }
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
  session_start: ({ script_id, trigger = 'manual' }) => {
    const state = useStudio.getState()
    const id = script_id || state.selectedScriptId
    if (!id) fail('Run could not start: no script is selected')
    if (script_id && script_id !== state.selectedScriptId) state.selectScript(script_id)
    const started = state.startRun(id, trigger)
    if (!started) fail('Run could not start: another run is active or the script has no steps')
    return ok('Run started and is visibly streaming')
  },
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
