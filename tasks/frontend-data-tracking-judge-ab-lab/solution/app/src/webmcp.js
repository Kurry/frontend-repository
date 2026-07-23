import { createRescoreSchema } from './contracts.js'
import { useLabStore, visibleTrials, waitForStore } from './store.js'

const S = () => useLabStore.getState()

const DESTINATIONS = ['experiments', 'compare', 'cost', 'trial-criterion-diff']
const CAUSES = ['scorer-noise', 'rubric-change-effect', 'harness-change-effect']
const SCORERS = ['Sable 4', 'Quartz Mini', 'Onyx Pro']

function pairRollup(state, labelA, labelB) {
  const items = state.attributions.filter((item) => item.labelA === labelA && item.labelB === labelB)
  return {
    taggedFlips: items.length,
    byCause: {
      'scorer-noise': items.filter((item) => item.cause === 'scorer-noise').length,
      'rubric-change-effect': items.filter((item) => item.cause === 'rubric-change-effect').length,
      'harness-change-effect': items.filter((item) => item.cause === 'harness-change-effect').length,
    },
  }
}

function validateAttributionArgs({ trialId, criterionId, labelA, labelB }) {
  const state = S()
  const trial = state.trials.find((item) => item.id === trialId)
  if (!trial) return `trialId: ${trialId} does not exist in the collection`
  if (!state.labels.some((label) => label.name === labelA)) return `labelA: ${labelA} is not an existing label`
  if (!state.labels.some((label) => label.name === labelB)) return `labelB: ${labelB} is not an existing label`
  if (labelA === labelB) return 'labelB: must differ from labelA'
  const resultA = trial.results[labelA]
  const resultB = trial.results[labelB]
  if (!resultA || !resultB) return `trialId: ${trialId} has no results under ${!resultA ? labelA : labelB}`
  if (!resultA.criteria.some((criterion) => criterion.id === criterionId)) return `criterionId: ${criterionId} is not one of the 16 criteria`
  return null
}

async function saveAttributionLikeUi(record) {
  // Same store command the visible attribution drawer submits.
  const outcome = S().saveAttribution(record)
  if (!outcome.saved) return { saved: false, error: outcome.error }
  await waitForStore((state) => state.attributions.some((item) =>
    item.trialId === record.trialId && item.criterionId === record.criterionId &&
    item.labelA === record.labelA && item.labelB === record.labelB && item.cause === record.cause))
  return { saved: true, cause: record.cause, rollup: pairRollup(S(), record.labelA, record.labelB) }
}

const handlers = {
  async browse_search({ query } = {}) {
    if (typeof query !== 'string') return { searched: false, error: 'query: must be a string' }
    const normalized = query.trim().toLowerCase().slice(0, 200)
    const matches = S().trials
      .filter((trial) => !normalized || [trial.id, trial.taskName, ...Object.keys(trial.results)].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 25)
      .map((trial) => ({ id: trial.id, taskName: trial.taskName, labels: Object.keys(trial.results) }))
    return { searched: true, query: normalized, count: matches.length, matches }
  },

  async browse_open({ destination, trialId } = {}) {
    if (!DESTINATIONS.includes(destination)) return { opened: false, error: `destination: must be one of ${DESTINATIONS.join(', ')}` }
    const state = S()
    if (destination === 'trial-criterion-diff') {
      const target = trialId || state.openedTrialId || state.trials[0]?.id
      if (!state.compareA || !state.compareB) return { opened: false, error: 'compare pair: select label A and label B before opening a criterion diff' }
      state.setView('compare')
      state.openTrial(target)
      await waitForStore((s) => s.activeView === 'compare' && s.openedTrialId === target)
      return { visibleDestination: 'trial-criterion-diff', trialId: target, labelA: S().compareA, labelB: S().compareB }
    }
    state.setView(destination)
    await waitForStore((s) => s.activeView === destination)
    return { visibleDestination: S().activeView }
  },

  async browse_apply_filter({ filter, value } = {}) {
    const state = S()
    if (filter === 'task') state.setFilter('task', value)
    else if (filter === 'pass-fail') { state.setFilter('passState', value.state); if (value.label) state.setFilter('passLabel', value.label) }
    else if (filter === 'delta-size') state.setFilter('deltaMin', Number(value))
    else if (filter === 'label-columns') state.setShownLabels(Array.isArray(value) ? value : [value])
    else if (filter === 'compare-pair') {
      state.setView('compare')
      state.setCompare('A', value.labelA)
      state.setCompare('B', value.labelB)
      await waitForStore((s) => s.activeView === 'compare' && s.compareA === value.labelA && s.compareB === value.labelB)
    } else if (filter === 'suggestion-chip') state.toggleChip(value)
    else return { applied: false, error: `filter: must be one of task, pass-fail, delta-size, label-columns, compare-pair, suggestion-chip` }
    return { applied: filter, visibleTrials: visibleTrials(S()).length, activeChip: S().activeChip }
  },

  async browse_clear_filter() {
    S().clearFilters()
    await waitForStore((s) => s.activeChip === null && s.filters.task === 'all' && s.filters.deltaMin === 0)
    return { cleared: true, visibleTrials: visibleTrials(S()).length }
  },

  async browse_sort({ sort, label } = {}) {
    if (!['task-name', 'label-reward', 'delta-size'].includes(sort)) return { sorted: false, error: 'sort: must be one of task-name, label-reward, delta-size' }
    S().setSort(sort, label)
    return { sorted: true, sort: S().sort, firstRow: visibleTrials(S())[0]?.id ?? null }
  },

  async entity_create(input = {}) {
    const problem = validateAttributionArgs(input)
    if (problem) return { saved: false, error: problem }
    if (!CAUSES.includes(input.cause)) return { saved: false, error: `cause: must be one of ${CAUSES.join(', ')}` }
    if (typeof input.note !== 'string' || input.note.length > 200) return { saved: false, error: 'note: must be a string of at most 200 characters' }
    return saveAttributionLikeUi({ trialId: input.trialId, criterionId: input.criterionId, labelA: input.labelA, labelB: input.labelB, cause: input.cause, note: input.note })
  },

  async entity_update(input = {}) {
    const problem = validateAttributionArgs(input)
    if (problem) return { updated: false, error: problem }
    if (!CAUSES.includes(input.cause)) return { updated: false, error: `cause: must be one of ${CAUSES.join(', ')}` }
    if (typeof input.note !== 'string' || input.note.length > 200) return { updated: false, error: 'note: must be a string of at most 200 characters' }
    const outcome = await saveAttributionLikeUi({ trialId: input.trialId, criterionId: input.criterionId, labelA: input.labelA, labelB: input.labelB, cause: input.cause, note: input.note })
    return outcome.saved ? { updated: true, cause: input.cause, rollup: outcome.rollup } : outcome
  },

  async entity_select({ trialId } = {}) {
    const state = S()
    if (!state.trials.some((trial) => trial.id === trialId)) return { selected: false, error: `trialId: ${trialId} does not exist in the collection` }
    if (!state.compareA || !state.compareB) return { selected: false, error: 'compare pair: select label A and label B before selecting a trial diff' }
    state.setView('compare')
    state.openTrial(trialId)
    await waitForStore((s) => s.openedTrialId === trialId && s.activeView === 'compare')
    return { selected: true, trialId, visibleDestination: 'trial-criterion-diff' }
  },

  async session_start({ demo, ...payload } = {}) {
    if (demo !== 'rescore-run') return { started: false, error: 'demo: the only declared demo is rescore-run' }
    const state = S()
    if (state.run.active) return { started: false, error: 'rescore-run: a run is already in flight' }
    if (state.run.label) return { started: false, error: 'rescore-run: a run already completed this session; reload for a fresh lab' }
    const schema = createRescoreSchema(state.labels)
    const parsed = schema.safeParse({ labelName: payload.labelName ?? '', scorerModel: payload.scorerModel ?? '', configNote: payload.configNote ?? '' })
    if (!parsed.success) {
      const issue = parsed.error.issues?.[0]
      return { started: false, error: issue ? (issue.message.includes(':') ? issue.message : `${issue.path.join('.')}: ${issue.message}`) : 'payload: validation failed' }
    }
    state.setPaletteOpen(false)
    state.openRescore()
    const startPromise = state.startRescore(parsed.data)
    await waitForStore((s) => s.run.active && s.rescoreOpen)
    void startPromise
    return { started: 'rescore-run', labelName: parsed.data.labelName, stepsTotal: S().trials.length, rescorePanelVisible: true }
  },

  async artifact_export({ format } = {}) {
    if (format === 'config-summary-text') {
      const state = S()
      state.setView('cost')
      await waitForStore((s) => s.activeView === 'cost')
      return { opened: 'config-summary-text', visibleDestination: 'cost', labels: S().labels.map((label) => label.name) }
    }
    if (format !== 'lab-results-json') return { opened: false, error: 'format: must be lab-results-json or config-summary-text' }
    const state = S()
    state.setPaletteOpen(false)
    state.setSavePairOpen(false)
    state.setExportOpen(true)
    await waitForStore((s) => s.exportOpen)
    const live = S()
    return {
      opened: 'lab-results-json',
      exportPanelVisible: true,
      schemaVersion: 'rescore-ab-lab-v1',
      counts: { labels: live.labels.length, trials: live.trials.length, attributions: live.attributions.length, savedPairs: live.savedPairs.length },
    }
  },

  async artifact_import({ mode } = {}) {
    if (mode !== 'lab-results-json') return { opened: false, error: 'mode: the only declared import mode is lab-results-json' }
    const state = S()
    state.setPaletteOpen(false)
    state.setSavePairOpen(false)
    state.setExportOpen(true)
    await waitForStore((s) => s.exportOpen)
    return { opened: true, importSurfaceVisible: true, hint: 'The export panel shows an Import lab results section with a file picker and a paste field.' }
  },

  async artifact_copy({ format } = {}) {
    if (format === 'config-summary-text') {
      S().setView('cost')
      await waitForStore((s) => s.activeView === 'cost')
      return { opened: 'config-summary-text', copyControlsVisible: true, labels: S().labels.map((label) => label.name) }
    }
    if (format !== 'lab-results-json') return { opened: false, error: 'format: must be lab-results-json or config-summary-text' }
    S().setPaletteOpen(false)
    S().setExportOpen(true)
    await waitForStore((s) => s.exportOpen)
    return { opened: 'lab-results-json', copyControlsVisible: true }
  },
}

const SCHEMA_ATTRIBUTION = {
  type: 'object',
  properties: {
    trialId: { type: 'string' },
    criterionId: { type: 'string' },
    labelA: { type: 'string' },
    labelB: { type: 'string' },
    cause: { enum: CAUSES },
    note: { type: 'string', maxLength: 200 },
  },
  required: ['trialId', 'criterionId', 'labelA', 'labelB', 'cause', 'note'],
}

// Exactly the operations declared in the Bindings block — no extra routes.
const tools = [
  ['browse_search', 'Search trials by id, task name, or completed label without changing lab state.', { type: 'object', properties: { query: { type: 'string', maxLength: 200 } }, required: ['query'] }, handlers.browse_search, { readOnlyHint: true }],
  ['browse_open', 'Open a declared lab destination: experiments, compare, cost, or trial-criterion-diff.', { type: 'object', properties: { destination: { enum: DESTINATIONS }, trialId: { type: 'string' } }, required: ['destination'] }, handlers.browse_open],
  ['browse_apply_filter', 'Apply one declared filter: task, pass-fail, delta-size, label-columns, compare-pair, or suggestion-chip.', { type: 'object', properties: { filter: { enum: ['task', 'pass-fail', 'delta-size', 'label-columns', 'compare-pair', 'suggestion-chip'] }, value: {} }, required: ['filter', 'value'] }, handlers.browse_apply_filter],
  ['browse_clear_filter', 'Clear every shared experiment and comparison filter.', { type: 'object', properties: {} }, handlers.browse_clear_filter],
  ['browse_sort', 'Sort trials by a declared sort: task-name, label-reward, or delta-size.', { type: 'object', properties: { sort: { enum: ['task-name', 'label-reward', 'delta-size'] }, label: { type: 'string' } }, required: ['sort'] }, handlers.browse_sort],
  ['entity_create', 'Create a validated attribution record for a flip (same command as the attribution form).', SCHEMA_ATTRIBUTION, handlers.entity_create],
  ['entity_select', 'Open the criterion diff for one trial under the selected compare pair.', { type: 'object', properties: { trialId: { type: 'string' } }, required: ['trialId'] }, handlers.entity_select],
  ['entity_update', 'Update an existing attribution record (same command as the flip-row edit control).', SCHEMA_ATTRIBUTION, handlers.entity_update],
  ['session_start', 'Start the rescore-run demo with a validated label payload.', { type: 'object', properties: { demo: { enum: ['rescore-run'] }, labelName: { type: 'string', minLength: 1, maxLength: 80 }, scorerModel: { enum: SCORERS }, configNote: { type: 'string', maxLength: 120 } }, required: ['demo', 'labelName', 'scorerModel', 'configNote'] }, handlers.session_start],
  ['artifact_export', 'Open the visible export surface for lab-results-json or config-summary-text.', { type: 'object', properties: { format: { enum: ['lab-results-json', 'config-summary-text'] } }, required: ['format'] }, handlers.artifact_export],
  ['artifact_import', 'Open the visible lab-results JSON import surface (file picker and paste field).', { type: 'object', properties: { mode: { enum: ['lab-results-json'] } }, required: ['mode'] }, handlers.artifact_import],
  ['artifact_copy', 'Open the visible copy controls for lab-results-json or config-summary-text.', { type: 'object', properties: { format: { enum: ['lab-results-json', 'config-summary-text'] } }, required: ['format'] }, handlers.artifact_copy],
]

export function registerWebMcp() {
  if (typeof window === 'undefined' || window.__rescoreWebMcpRegistered) return
  window.__rescoreWebMcpRegistered = true

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map(([name]) => name),
  })
  window.webmcp_list_tools = () => tools.map(([name, description, inputSchema, , annotations]) => ({ name, description, inputSchema, annotations }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = tools.find(([toolName]) => toolName === name)
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`)
    return tool[3](args)
  }

  const modelContext = navigator.modelContext
  if (modelContext?.registerTool) {
    tools.forEach(([name, description, inputSchema, execute, annotations]) => {
      try {
        modelContext.registerTool({
          name,
          description,
          inputSchema,
          annotations,
          execute: async (input) => ({ content: [{ type: 'text', text: JSON.stringify(await execute(input)) }] }),
        })
      } catch { /* registration is best-effort; window.webmcp_* remain available */ }
    })
  }
}
