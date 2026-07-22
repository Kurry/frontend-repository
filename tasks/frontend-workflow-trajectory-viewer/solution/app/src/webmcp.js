import { useEffect } from 'react'
import { useAppStore } from './store'
import { taskById, trialById } from './data'
import { annotationSchema, failureReportSchema, validateStepIndices } from './schemas'

const response = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] })
const fail = (message) => { throw new Error(message) }

export function useWebMcp() {
  useEffect(() => {
    if (window.__traceframeWebMcpRegistered) return
    window.__traceframeWebMcpRegistered = true

    const tools = []
    const handlers = {}

    const register = (name, description, properties, required, execute) => {
      const toolDef = {
        name,
        description,
        inputSchema: { type: 'object', properties, required, additionalProperties: false }
      }
      tools.push(toolDef)
      handlers[name] = execute
      window[`webmcp_${name}`] = execute
    }
    const state = () => useAppStore.getState()
    const activeTrial = () => trialById(state().activeTrialId)

    register('browse_open', 'Open a declared trajectory reviewer destination.', {
      destination: { type: 'string', enum: ['task-catalog', 'task-page', 'trial-viewer', 'reference-filesystem', 'trial-filesystem', 'annotations-list', 'classification-report', 'export-panel', 'command-palette'] },
      task_id: { type: 'string' }, trial_id: { type: 'string' },
    }, ['destination'], async ({ destination, task_id, trial_id }) => {
      const app = state()
      if (destination === 'task-catalog') app.openCatalog()
      else if (destination === 'task-page') { const id = task_id || app.activeTaskId; if (!taskById(id) || !app.openTask(id)) fail('task_id is not a seeded task') }
      else if (destination === 'trial-viewer') { const id = trial_id || app.activeTrialId; if (!trialById(id) || !app.openTrial(id)) fail('trial_id is not a seeded trial') }
      else if (destination === 'reference-filesystem') app.setFilesystemSide('reference')
      else if (destination === 'trial-filesystem') app.setFilesystemSide('trial')
      else if (destination === 'export-panel') app.openExport()
      else if (destination === 'command-palette') app.setChrome({ paletteOpen: true })
      else if (destination === 'annotations-list') app.setChrome({ mobilePane: 'detail' })
      else if (destination === 'classification-report') app.setChrome({ mobilePane: 'detail' })
      return response({ destination, visible: true })
    })
    register('browse_search', 'Search the active trial by step summary and optionally select a result.', {
      query: { type: 'string', minLength: 1, maxLength: 200 }, select_first: { type: 'boolean' },
    }, [], async ({ query = '', select_first = false }) => {
      const trial = activeTrial() || trialById('task-config-recovery-trial-1')
      if (!trial) fail('no seeded trial is available')
      const matches = trial.steps.filter((step) => step.summary.toLowerCase().includes(query.toLowerCase()))
      if (select_first && activeTrial() && matches[0]) state().setActiveStep(matches[0].index)
      return response({ match_count: matches.length, step_indices: matches.map((step) => step.index), active_step_index: state().activeStepIndex })
    })
    register('browse_apply_filter', 'Apply the declared step-type timeline filter.', {
      step_type: { type: 'string', enum: ['reasoning', 'tool-call', 'observation', 'terminal', 'screenshot', 'all'] },
    }, ['step_type'], async ({ step_type }) => { state().setStepTypeFilter(step_type); return response({ step_type }) })
    register('browse_clear_filter', 'Restore the full ordered step timeline.', {}, [], async () => { state().setStepTypeFilter('all'); return response({ step_type: 'all' }) })
    register('browse_sort', 'Sort the active task trial table by reward.', {
      sort: { type: 'string', enum: ['reward-asc', 'reward-desc'] },
    }, ['sort'], async ({ sort }) => { state().setSort(sort); return response({ sort }) })
    register('browse_set_locale', 'Set the bounded reviewer locale.', { locale: { type: 'string', enum: ['en'] } }, ['locale'], async ({ locale }) => { state().setLocale(locale); return response({ locale }) })
    register('browse_set_theme', 'Set the bounded reviewer theme.', { theme: { type: 'string', enum: ['dark'] } }, ['theme'], async ({ theme }) => { state().setTheme(theme); return response({ theme }) })

    register('entity_create', 'Create an annotation using the same note command as Add note.', {
      note_text: { type: 'string', minLength: 1, maxLength: 500 }, step_index: { type: 'integer', minimum: 1 },
    }, ['note_text', 'step_index'], async (args) => {
      if (!activeTrial()) state().openTrial('task-config-recovery-trial-1')
      const trial = activeTrial(); const parsed = annotationSchema.safeParse(args)
      if (!parsed.success) fail(parsed.error.issues[0].message)
      if (!trial || !validateStepIndices([parsed.data.step_index], trial)) fail('step_index must exist on the active trial')
      state().addAnnotation(parsed.data)
      return response({ annotation_count: state().annotationsByTrial[trial.id].length, active_step_index: state().activeStepIndex })
    })
    register('entity_select', 'Select an annotation and jump to its attached step.', {
      annotation_index: { type: 'integer', minimum: 0 },
    }, ['annotation_index'], async ({ annotation_index }) => {
      const app = state(); const notes = app.annotationsByTrial[app.activeTrialId] || []; const note = notes[annotation_index]
      if (!note) fail('annotation_index does not exist')
      app.setActiveStep(note.step_index); return response({ active_step_index: note.step_index })
    })
    register('entity_update', 'Update one annotation note_text in place.', {
      annotation_index: { type: 'integer', minimum: 0 }, note_text: { type: 'string', minLength: 1, maxLength: 500 },
    }, ['annotation_index', 'note_text'], async ({ annotation_index, note_text }) => {
      const app = state(); const notes = app.annotationsByTrial[app.activeTrialId] || []; const note = notes[annotation_index]
      if (!note) fail('annotation_index does not exist')
      const parsed = annotationSchema.safeParse({ ...note, note_text }); if (!parsed.success) fail(parsed.error.issues[0].message)
      app.updateAnnotation(annotation_index, parsed.data.note_text); return response({ annotation_count: state().annotationsByTrial[app.activeTrialId].length })
    })
    register('entity_delete', 'Delete exactly one annotation after explicit confirmation.', {
      annotation_index: { type: 'integer', minimum: 0 }, confirm: { type: 'boolean' },
    }, ['annotation_index', 'confirm'], async ({ annotation_index, confirm }) => {
      if (!confirm) fail('confirm=true is required')
      const app = state(); const notes = app.annotationsByTrial[app.activeTrialId] || []; if (!notes[annotation_index]) fail('annotation_index does not exist')
      app.deleteAnnotation(annotation_index); return response({ annotation_count: state().annotationsByTrial[app.activeTrialId].length })
    })

    const formProperties = {
      note_text: { type: 'string', minLength: 1, maxLength: 500 },
      stage: { type: 'string', enum: ['planning', 'tool-use', 'verification', 'recovery'] },
      root_cause: { type: 'string', enum: ['wrong-tool', 'missing-context', 'hallucinated-path', 'timeout'] },
      behavior: { type: 'string', enum: ['loops', 'abandons', 'invents-files', 'ignores-errors'] },
      impact: { type: 'string', enum: ['score-zero', 'partial-credit', 'flaky-pass', 'false-pass'] },
      evidence: { type: 'string', minLength: 20, maxLength: 2000 },
      implicated_steps: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 1 } },
    }
    const hasClassification = (args) => ['stage', 'root_cause', 'behavior', 'impact', 'evidence', 'implicated_steps'].some((key) => args[key] !== undefined)
    const validateFailure = (args) => {
      const trial = activeTrial(); const parsed = failureReportSchema.safeParse(args)
      if (!parsed.success) fail(parsed.error.issues[0].message)
      if (!trial || !validateStepIndices(parsed.data.implicated_steps, trial)) fail('implicated_steps must exist on the active trial')
      return parsed.data
    }
    const validateNote = (args) => {
      const trial = activeTrial()
      const step_index = Number(args.step_index || state().activeStepIndex)
      const parsed = annotationSchema.safeParse({ note_text: args.note_text, step_index })
      if (!parsed.success) fail(parsed.error.issues[0].message)
      if (!trial || !validateStepIndices([parsed.data.step_index], trial)) fail('step_index must exist on the active trial')
      return parsed.data
    }
    register('form_validate', 'Validate note text and/or failure classification without mutating review state.', formProperties, [], async (args) => {
      if (args.note_text === undefined && !hasClassification(args)) fail('Provide note_text and/or classification fields')
      if (args.note_text !== undefined) validateNote(args)
      if (hasClassification(args)) validateFailure(args)
      return response({ valid: true })
    })
    register('form_submit', 'Submit a note and/or failure classification using the same commands as the visible forms.', formProperties, [], async (args) => {
      if (args.note_text === undefined && !hasClassification(args)) fail('Provide note_text and/or classification fields')
      if (hasClassification(args)) validateFailure(args)
      let annotation_count
      if (args.note_text !== undefined) {
        const note = validateNote(args)
        state().addAnnotation(note)
        annotation_count = state().annotationsByTrial[activeTrial().id].length
      }
      if (hasClassification(args)) {
        const body = validateFailure(args)
        state().submitReport(body)
      }
      return response({
        valid: true,
        report_card_present: !!state().reportsByTrial[state().activeTrialId],
        annotation_count: annotation_count ?? (state().annotationsByTrial[state().activeTrialId] || []).length,
        active_step_index: state().activeStepIndex,
      })
    })

    register('artifact_export', 'Open the live review export preview in a declared format.', { format: { type: 'string', enum: ['json', 'markdown'] } }, ['format'], async ({ format }) => { state().setExportFormat(format); state().openExport(); return response({ export_preview_present: true, format }) })
    register('artifact_import', 'Open the visible review-package import workflow.', { mode: { type: 'string', enum: ['review-package'] } }, ['mode'], async () => { state().openImport(); return response({ import_surface_present: true }) })
    register('artifact_copy', 'Open the live export surface so clipboard transfer can be completed visibly.', { format: { type: 'string', enum: ['json', 'markdown'] } }, ['format'], async ({ format }) => { state().setExportFormat(format); state().openExport(); return response({ export_preview_present: true, copy_control_present: true, format }) })

    window.__traceframeWebMcpTools = tools

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
      tools: tools.map((tool) => tool.name),
    })
    window.webmcp_list_tools = async () => ({ tools })
    window.webmcp_invoke_tool = async (name, args) => {
      if (!handlers[name]) fail(`Tool ${name} not found`)
      return handlers[name](args)
    }

    if (navigator.modelContext?.registerTool) {
      for (const tool of tools) {
        navigator.modelContext.registerTool({
          ...tool,
          execute: handlers[tool.name]
        })
      }
    }
  }, [])
}
