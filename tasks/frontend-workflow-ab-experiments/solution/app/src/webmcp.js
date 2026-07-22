import { useStudio } from './store'
import { experimentSchema, criterionSchema, decisionSchema, zodErrorMessage } from './contracts'

const tool = (name, description, properties = {}, required = []) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
})

const formValuesSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
    hypothesis: { type: 'string', minLength: 1, maxLength: 2000 },
    successMetric: { type: 'string' },
    minimumSampleSize: { type: 'integer', minimum: 1, maximum: 500 },
    variants: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 40 },
          promptId: { type: 'string' },
          model: { type: 'string', enum: ['Larkspur-2', 'Cobalt-Mini', 'Meridian-XL', 'Fernwave-1'] },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          trafficAllocation: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['title', 'promptId', 'model', 'temperature', 'trafficAllocation'],
        additionalProperties: false,
      },
    },
    description: { type: 'string', minLength: 1, maxLength: 400 },
    passThreshold: { type: 'integer', minimum: 0, maximum: 100 },
    choice: { type: 'string', enum: ['declare-winner', 'inconclusive', 'stop-early'] },
    winnerVariant: { type: ['string', 'null'], enum: ['A', 'B', 'C', 'D', null] },
    rationale: { type: 'string', minLength: 1, maxLength: 1000 },
  },
  additionalProperties: false,
}

const formInput = {
  workflow: { type: 'string', enum: ['experiment-designer', 'new-criterion-form', 'decision-dialog', 'promote-winner-confirm'] },
  experimentId: { type: 'string' },
  values: formValuesSchema,
}

const entityInput = {
  experimentId: { type: 'string' },
  responseId: { type: 'string' },
  field: { type: 'string', enum: ['archived', 'outlier-flag'] },
  value: { type: 'boolean' },
  confirm: { type: 'boolean' },
}

const formValidateTool = tool('form_validate', 'Validate declared fields in the active workflow.', formInput, ['workflow'])
formValidateTool.inputSchema.default = {
  workflow: 'new-criterion-form',
  values: { name: 'Quality', description: 'Responses satisfy the declared quality bar.', passThreshold: 80 },
}
const formSubmitTool = tool('form_submit', 'Submit the active declared form workflow.', formInput, ['workflow'])
formSubmitTool.inputSchema.default = {
  workflow: 'experiment-designer',
  values: {
    name: 'Schema round-trip experiment',
    hypothesis: 'A structured prompt improves response quality.',
    successMetric: 'factual-accuracy',
    minimumSampleSize: 10,
    variants: [
      { title: 'Control', promptId: 'prompt-concise-v3', model: 'Larkspur-2', temperature: 0.5, trafficAllocation: 50 },
      { title: 'Treatment', promptId: 'prompt-evidence-v2', model: 'Meridian-XL', temperature: 0.5, trafficAllocation: 50 },
    ],
  },
}

const tools = [
  formValidateTool,
  formSubmitTool,
  tool('form_cancel', 'Cancel the active form workflow.'),
  tool('session_start', 'Start an experiment run.', { experimentId: { type: 'string' } }, ['experimentId']),
  tool('session_pause', 'Pause an experiment run.', { experimentId: { type: 'string' } }, ['experimentId']),
  tool('session_resume', 'Resume an experiment run.', { experimentId: { type: 'string' } }, ['experimentId']),
  tool('session_trigger_demo', 'Run the preview-run demo.', { demo: { type: 'string', enum: ['preview-run'] } }, ['demo']),
  tool('entity_select', 'Select an experiment.', { experimentId: { type: 'string' } }, ['experimentId']),
  tool('entity_toggle', 'Toggle archived or outlier-flag on an experiment.', entityInput, ['experimentId', 'field', 'value']),
  tool('entity_delete', 'Delete an experiment with explicit confirmation.', { experimentId: { type: 'string' }, confirm: { const: true } }, ['experimentId', 'confirm']),
  tool('artifact_export', 'Open experiment-report export.', { experimentId: { type: 'string' }, format: { type: 'string', enum: ['experiment-report'] } }, ['experimentId', 'format']),
]

function invoke(name, args = {}) {
  const state = useStudio.getState()

  if (name === 'form_validate' || name === 'form_submit') {
    if (args.workflow === 'promote-winner-confirm') {
      if (name === 'form_submit') state.promoteWinner(args.experimentId)
      return { ok: true, workflow: args.workflow }
    }
    const schemas = {
      'experiment-designer': experimentSchema,
      'new-criterion-form': criterionSchema,
      'decision-dialog': decisionSchema,
    }
    const schema = schemas[args.workflow]
    if (!schema) return { ok: false, error: 'workflow must be experiment-designer, new-criterion-form, decision-dialog, or promote-winner-confirm' }
    const parsed = schema.safeParse(args.values || {})
    if (!parsed.success) return { ok: false, error: zodErrorMessage(parsed.error) }
    if (name === 'form_validate') return { ok: true, valid: true, workflow: args.workflow }
    if (args.workflow === 'experiment-designer') return state.saveExperiment(parsed.data, args.experimentId || null)
    if (args.workflow === 'new-criterion-form') return state.addCriterion(parsed.data)
    if (args.workflow === 'decision-dialog') {
      const normalized = {
        ...parsed.data,
        winnerVariant: parsed.data.choice === 'declare-winner' ? parsed.data.winnerVariant || null : null,
      }
      return state.decide(args.experimentId, normalized)
    }
  }

  if (name === 'form_cancel') {
    state.setField('designer', null)
    state.setField('criterionOpen', false)
    state.setField('decisionFor', null)
    state.setField('confirm', null)
    return { ok: true }
  }

  if (name === 'session_start') {
    state.startRun(args.experimentId)
    return { ok: true, visiblePostcondition: 'Status changes to Running' }
  }
  if (name === 'session_pause') {
    state.pauseRun(args.experimentId)
    return { ok: true }
  }
  if (name === 'session_resume') {
    state.resumeRun(args.experimentId)
    return { ok: true }
  }
  if (name === 'session_trigger_demo') {
    state.runPreview()
    return { ok: true, demo: 'preview-run' }
  }

  if (name === 'entity_select') {
    state.selectExperiment(args.experimentId)
    return { ok: true }
  }
  if (name === 'entity_toggle') {
    if (args.field === 'archived') {
      if (args.value) state.archiveOneDirect(args.experimentId)
      else state.unarchive(args.experimentId)
    } else if (args.field === 'outlier-flag') {
      state.toggleOutlier(args.experimentId, args.responseId)
    }
    return { ok: true }
  }
  if (name === 'entity_delete') {
    if (args.confirm !== true) return { ok: false, error: 'confirm=true is required' }
    const deleted = useStudio.getState().deleteOneDirect(args.experimentId)
    return deleted ? { ok: true } : { ok: false, error: 'experimentId was not found' }
  }

  if (name === 'artifact_export') {
    const report = state.compileReport(args.experimentId)
    if (!report) return { ok: false, error: 'A completed or decided experiment is required' }
    state.setField('reportFor', args.experimentId)
    return { ok: true, format: 'experiment-report', visiblePostcondition: 'The Experiment Report panel is open' }
  }

  return { ok: false, error: `Unknown WebMCP tool: ${name}` }
}

export function registerWebMcp() {
  if (window.webmcp_session_info) return
  window.webmcp_action_contract = 'zto-webmcp-v1'
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['form-workflow-v1', 'command-session-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    toolNames: tools.map(item => item.name),
    entity: 'experiment',
  })
  window.webmcp_list_tools = () => tools
  window.webmcp_invoke_tool = (name, args) => Promise.resolve(invoke(name, args))
}
