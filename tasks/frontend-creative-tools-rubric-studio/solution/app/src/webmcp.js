const rubricDestinations = ['response-quality', 'code-review-depth', 'safety-screening', 'summarization-fidelity']
const destinations = [...rubricDestinations, 'version-history', 'diff-view', 'tune-view', 'preview-panel', 'export', 'export-center']
const formats = ['structured-text', 'rubric-json', 'package-json']

const schema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const enumString = (values, description) => ({ type: 'string', enum: values, description })

export function registerWebMCP(store) {
  const tools = [
    { name: 'editor_select', description: 'Select a declared criterion, labelled case, or sample verdict in the current rubric.', inputSchema: schema({ objectType: enumString(['criterion', 'labelled-case', 'sample-verdict']), id: { type: 'string' } }, ['objectType', 'id']) },
    { name: 'editor_add', description: 'Add a CriterionUpsert object to the open rubric.', inputSchema: schema({ objectType: enumString(['criterion']), criterion: { type: 'object', description: 'Complete CriterionUpsert request body.' } }, ['objectType', 'criterion']) },
    { name: 'editor_delete', description: 'Begin the version-gated deletion of a criterion.', inputSchema: schema({ objectType: enumString(['criterion']), id: { type: 'string' } }, ['objectType', 'id']) },
    { name: 'editor_update_property', description: 'Update one declared editor property through the same store commands as the UI.', inputSchema: schema({ objectType: enumString(['criterion', 'labelled-case', 'sample-verdict']), id: { type: 'string' }, property: enumString(['id', 'name', 'description', 'type', 'likert-min', 'likert-max', 'weight', 'importance', 'version', 'judge-model', 'aggregation-mode', 'include', 'pass-threshold', 'verdict']), value: {}, version: { type: 'string' } }, ['objectType', 'property', 'value']) },
    { name: 'editor_switch_mode', description: 'Switch the visible editor mode.', inputSchema: schema({ mode: enumString(['criteria', 'tune', 'preview']) }, ['mode']) },
    { name: 'editor_preview', description: 'Open the sample submission preview panel.', inputSchema: schema() },
    { name: 'browse_open', description: 'Open one bounded rubric or studio destination.', inputSchema: schema({ destination: enumString(destinations) }, ['destination']) },
    { name: 'artifact_import', description: 'Open the package JSON import surface. File and artifact contents remain browser-driven.', inputSchema: schema({ mode: enumString(['package-json']) }, ['mode']) },
    { name: 'artifact_export', description: 'Open an export format preview without returning artifact contents.', inputSchema: schema({ format: enumString(formats) }, ['format']) },
    { name: 'artifact_copy', description: 'Open the selected format so clipboard interaction can remain browser-driven.', inputSchema: schema({ format: enumString(formats) }, ['format']) },
  ]

  const ok = (message, state = {}) => ({ ok: true, message, visibleState: state })
  const handlers = {
    editor_select({ objectType, id }) {
      if (objectType === 'criterion') {
        if (!store.activeRubric.criteria.some((item) => item.id === id)) return { ok: false, message: `Unknown criterion ${id}` }
        store.setView('criteria')
        if (!store.ui.expandedCriteria.includes(id)) store.ui.expandedCriteria.push(id)
        return ok(`Selected criterion ${id}`, { activeView: store.activeView, expandedCriterion: id })
      }
      if (objectType === 'labelled-case') {
        if (!store.cases.some((item) => item.id === id)) return { ok: false, message: `Unknown labelled case ${id}` }
        store.setView('tune'); return ok(`Selected labelled case ${id}`, { activeView: store.activeView })
      }
      if (!store.activeRubric.criteria.some((item) => item.id === id)) return { ok: false, message: `Unknown sample verdict ${id}` }
      store.setView('preview'); return ok(`Selected sample verdict ${id}`, { activeView: store.activeView })
    },
    editor_add({ criterion }) {
      const result = store.addCriterion(criterion)
      return result.ok ? ok(`Added criterion ${criterion.id}`, { criteriaCount: store.rollup.count }) : result
    },
    editor_delete({ id }) {
      if (!store.stageDelete(id)) return { ok: false, message: `Unknown criterion ${id}` }
      return ok(`Major bump required before deleting ${id}`, { versionGateOpen: true, pendingKind: 'major' })
    },
    editor_update_property({ objectType, id, property, value, version }) {
      if (property === 'judge-model') return store.setModel(value) ? ok('Arbiter model updated', { arbiterModel: value }) : { ok: false, message: 'Invalid or unchanged judge-model' }
      if (property === 'aggregation-mode') return store.setAggregation(value) ? ok('Aggregation mode updated', { aggregationMode: value }) : { ok: false, message: 'Invalid or unchanged aggregation-mode' }
      if (property === 'version') {
        const result = store.applyPending(value)
        return result.ok ? ok('Pending version-gated change saved', { version: store.activeRubric.version }) : result
      }
      if (objectType === 'labelled-case' && property === 'include') return store.toggleCase(id, Boolean(value)) ? ok(`Include set for ${id}`, { included: Boolean(value) }) : { ok: false, message: 'Unknown case or unchanged include value' }
      if (objectType === 'sample-verdict' && property === 'verdict') return store.setVerdict(id, Boolean(value)) ? ok(`Verdict set for ${id}`, { verdict: Boolean(value), aggregate: store.aggregate }) : { ok: false, message: 'Unknown verdict or unchanged value' }
      if (objectType === 'criterion' && property === 'pass-threshold') return store.setThreshold(id, value) ? ok(`Pass threshold set for ${id}`, { threshold: Number(value) }) : { ok: false, message: 'Invalid or unchanged pass-threshold' }
      const item = store.activeRubric.criteria.find((entry) => entry.id === id)
      if (!item) return { ok: false, message: `Unknown criterion ${id}` }
      const map = { 'likert-min': 'likertMin', 'likert-max': 'likertMax' }
      const key = map[property] || property
      const after = { ...item, [key]: value }
      if (!store.stageEdit(id, after)) return { ok: false, message: 'Property is invalid or unchanged' }
      if (version) {
        const result = store.applyPending(version)
        return result.ok ? ok(`Updated ${property} for ${id}`, { version: store.activeRubric.version }) : result
      }
      return ok(`${store.pendingChange.kind} bump required before updating ${property}`, { versionGateOpen: true, pendingKind: store.pendingChange.kind })
    },
    editor_switch_mode({ mode }) { return store.setView(mode) ? ok(`Switched to ${mode}`, { activeView: mode }) : { ok: false, message: 'Invalid mode' } },
    editor_preview() { store.setView('preview'); return ok('Preview panel opened', { activeView: 'preview' }) },
    browse_open({ destination }) {
      if (rubricDestinations.includes(destination)) return store.selectRubric(destination) ? ok(`Opened ${destination}`, { activeRubric: destination }) : { ok: false, message: `Destination ${destination} is not present in the current imported package` }
      if (destination === 'tune-view') store.setView('tune')
      else if (destination === 'preview-panel') store.setView('preview')
      else if (destination === 'diff-view') store.ui.activeDiffId = store.activeHistory[0]?.id || null
      else if (destination === 'version-history') store.ui.activeDiffId = null
      else if (['export', 'export-center'].includes(destination)) store.openExport()
      return ok(`Opened ${destination}`, { destination })
    },
    artifact_import() { store.ui.importOpen = true; return ok('Package import surface opened', { importOpen: true }) },
    artifact_export({ format }) { store.ui.exportTab = format; store.openExport(); return ok(`${format} preview opened`, { exportOpen: true, format }) },
    artifact_copy({ format }) { store.ui.exportTab = format; store.openExport(); return ok(`${format} opened for browser clipboard interaction`, { exportOpen: true, format }) },
  }

  const invoke = async ({ name, arguments: args = {} } = {}) => {
    if (!handlers[name]) return { ok: false, message: `Unknown tool ${name}` }
    try { return await handlers[name](args) } catch (error) { return { ok: false, message: error?.message || 'Tool invocation failed' } }
  }
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', app: 'Rubric Studio', modules: ['structured-editor-v1', 'browse-query-v1', 'artifact-transfer-v1'] })
  window.webmcp_list_tools = () => ({ tools })
  window.webmcp_invoke_tool = invoke
  window.webmcp = { sessionInfo: window.webmcp_session_info, listTools: window.webmcp_list_tools, invokeTool: invoke }
}
