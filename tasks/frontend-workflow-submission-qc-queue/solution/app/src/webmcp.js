import { nextTick } from 'vue'

const enumSchema = (values) => ({ type: 'string', enum: values })
const ok = (message, visible_postcondition = message) => ({ success: true, message, visible_postcondition })
const fail = (message) => ({ success: false, error: message })

async function settleVisibleUi() {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

function normalizeId(id) {
  if (typeof id !== 'string') return id
  const trimmed = id.trim()
  const match = trimmed.match(/^sub[-_]?(\d+)$/i)
  return match ? `sub-${match[1]}` : trimmed
}

function resolveSubmission(store, submissionId) {
  const id = normalizeId(submissionId)
  return store.submissions.find((s) => s.id === id || s.id.toLowerCase() === String(id || '').toLowerCase()) || null
}

export function registerWebMcp(store) {
  const stageValues = ['submitted', 'in-review', 'needs-revision', 'approved']
  const payoutValues = ['pending', 'held', 'released']
  const tierValues = ['blocker', 'major', 'minor']
  const categoryValues = ['correctness', 'instruction-clarity', 'rubric-alignment', 'environment', 'scoring', 'tooling']
  const destinations = ['queue', 'submission-detail', 'contributor-drawer', 'export-center']
  const workflowSteps = ['add-finding', 'request-revision', 'override-finding', 'approve', 'mark-revised', 'bulk-update', 'undo', 'redo', 'export-package']
  const formats = ['qc-package-json', 'qc-report-markdown']
  const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false })

  const formFields = {
    workflow_step: enumSchema(workflowSteps),
    submission_id: { type: 'string' },
    finding_id: { type: 'string' },
    tier: enumSchema(tierValues),
    category: enumSchema(categoryValues),
    description: { type: 'string', maxLength: 4000 },
    evidence: { type: 'string', maxLength: 8000 },
    revision_summary: { type: 'string', maxLength: 4000 },
    override_justification: { type: 'string', maxLength: 4000 },
    bulk_stage: enumSchema(['in-review']),
    bulk_payout_state: enumSchema(['held']),
  }

  const tools = [
    { name: 'browse_open', description: 'Open a declared Arcfield QC destination through the same navigation state as the visible chrome.', inputSchema: object({ destination: enumSchema(destinations), submission_id: { type: 'string' }, contributor_name: enumSchema(store.contributorNames) }, ['destination']), run: ({ destination, submission_id, contributor_name }) => {
      if (destination === 'queue') store.openView('queue')
      else if (destination === 'export-center') store.openView('export')
      else if (destination === 'submission-detail') {
        const sub = resolveSubmission(store, submission_id)
        if (!sub) return fail('The declared destination requires a valid bounded entity value.')
        store.openSubmission(sub.id)
      } else if (destination === 'contributor-drawer' && store.contributorNames.includes(contributor_name)) store.openContributor(contributor_name)
      else return fail('The declared destination requires a valid bounded entity value.')
      return ok(`Opened ${destination}`)
    } },
    { name: 'browse_search', description: 'Search the live submission queue without changing filters, selection, or navigation.', inputSchema: object({ query: { type: 'string', minLength: 1, maxLength: 200 } }, ['query']), run: ({ query }) => {
      const needle = query.trim().toLowerCase()
      const matches = store.submissions
        .filter((submission) => [submission.id, submission.title, submission.contributor_name].some((value) => value.toLowerCase().includes(needle)))
        .map(({ id, title, contributor_name, stage, payout_state }) => ({ id, title, contributor_name, stage, payout_state }))
      return { success: true, query, count: matches.length, submissions: matches }
    } },
    { name: 'browse_apply_filter', description: 'Apply one bounded queue or profile filter.', inputSchema: object({ filter: enumSchema(['stage', 'tier', 'contributor', 'date-range']), value: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string', format: 'date' }, minItems: 2, maxItems: 2 }] } }, ['filter', 'value']), run: ({ filter, value }) => {
      if (filter === 'stage' && stageValues.includes(value)) store.setFilter('stage', value)
      else if (filter === 'tier' && tierValues.includes(value)) store.setFilter('tier', value)
      else if (filter === 'contributor' && store.contributorNames.includes(value)) store.setFilter('contributor', value)
      else if (filter === 'date-range' && Array.isArray(value) && value.length === 2) store.setProfileRange(value)
      else return fail('Filter value is outside the declared bounds.')
      return ok(`${filter} filter applied`)
    } },
    { name: 'browse_clear_filter', description: 'Clear one declared filter or all queue filters.', inputSchema: object({ filter: { type: 'string', enum: ['stage', 'tier', 'contributor', 'date-range', 'all'] } }, ['filter']), run: ({ filter }) => { if (filter === 'all') store.clearFilters(); else if (filter === 'date-range') store.setProfileRange(['2026-07-11', '2026-07-18']); else store.setFilter(filter, null); return ok(`${filter} filter cleared`) } },
    { name: 'browse_sort', description: 'Sort the visible queue by open finding count.', inputSchema: object({ sort: enumSchema(['open-finding-count-asc', 'open-finding-count-desc']) }, ['sort']), run: ({ sort }) => { store.setSort(sort.endsWith('asc') ? 'asc' : 'desc'); return ok(`Queue sorted ${store.sort}`) } },
    { name: 'entity_select', description: 'Select or clear a submission using the same queue selection command.', inputSchema: object({ submission_id: { type: 'string' }, selected: { type: 'boolean' } }, ['submission_id', 'selected']), run: ({ submission_id, selected }) => {
      const sub = resolveSubmission(store, submission_id)
      if (!sub) return fail('Unknown submission id.')
      const has = store.selectedIds.includes(sub.id)
      if (selected !== has) store.toggleSelected(sub.id)
      return ok(`${sub.id} ${selected ? 'selected' : 'cleared'}`)
    } },
    { name: 'entity_update', description: 'Update one bounded submission stage or payout state through the shared domain command.', inputSchema: object({ submission_id: { type: 'string' }, field: enumSchema(['stage', 'payout-state']), value: { type: 'string' } }, ['submission_id', 'field', 'value']), run: ({ submission_id, field, value }) => {
      const sub = resolveSubmission(store, submission_id)
      if (!sub) return fail('Unknown submission id.')
      if (field === 'stage' && !stageValues.includes(value)) return fail('Stage is outside the closed enum.')
      if (field === 'payout-state' && !payoutValues.includes(value)) return fail('Payout state is outside the closed enum.')
      return store.updateSubmission(sub.id, field, value) ? ok(`${field} updated`) : fail('Guard rejected this update; approval requires in-review with zero open blockers.')
    } },
    { name: 'form_validate', description: 'Validate declared form workflow values without mutating the queue.', inputSchema: object(formFields, ['workflow_step']), run: (args) => validateWorkflow(args, tierValues, categoryValues, store) },
    { name: 'form_submit', description: 'Submit a declared workflow through the same shared commands used by visible review controls.', inputSchema: object(formFields, ['workflow_step']), run: (args) => {
      const validation = validateWorkflow(args, tierValues, categoryValues, store); if (!validation.success) { store.notify(validation.error, 'error'); return validation }
      const sub = args.submission_id ? resolveSubmission(store, args.submission_id) : null
      const id = sub?.id
      let result = false
      if (args.workflow_step === 'add-finding') result = store.addFinding(id, { tier: args.tier, category: args.category, description: args.description.trim(), evidence: (args.evidence || '').trim() })
      if (args.workflow_step === 'request-revision') result = store.requestRevision(id, { summary: args.revision_summary.trim() })
      if (args.workflow_step === 'override-finding') result = store.overrideFinding(id, args.finding_id, { justification: args.override_justification.trim() })
      if (args.workflow_step === 'approve') result = store.approve(id)
      if (args.workflow_step === 'mark-revised') result = store.markRevised(id)
      if (args.workflow_step === 'bulk-update') { if (args.bulk_stage) result = store.bulkMove() || result; if (args.bulk_payout_state) result = store.bulkHold() || result }
      if (args.workflow_step === 'undo') result = store.undo()
      if (args.workflow_step === 'redo') result = store.redo()
      if (args.workflow_step === 'export-package') { store.openView('export'); result = true }
      return result ? ok(`${args.workflow_step} completed`) : fail('Workflow guard rejected the operation or no eligible records were selected.')
    } },
    { name: 'form_cancel', description: 'Cancel any visible declared review form.', inputSchema: object({ workflow_step: enumSchema(workflowSteps) }, ['workflow_step']), run: () => { store.closeDialogs(); return ok('Visible form cancelled') } },
    { name: 'artifact_export', description: 'Prepare and download the live QC artifact in a declared format.', inputSchema: object({ format: enumSchema(formats) }, ['format']), run: ({ format }) => { store.exportFormat = format === 'qc-package-json' ? 'json' : 'markdown'; store.openView('export'); store.downloadExport(); return ok(`${format} download started`) } },
    { name: 'artifact_copy', description: 'Copy the exact visible live QC artifact and show visible confirmation.', inputSchema: object({ format: enumSchema(formats) }, ['format']), run: async ({ format }) => { store.exportFormat = format === 'qc-package-json' ? 'json' : 'markdown'; store.openView('export'); await store.copyExport(); return ok(`${format} copied; confirmation visible`) } },
  ]

  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1'], tool_names: tools.map((tool) => tool.name) })
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = tools.find((candidate) => candidate.name === name)
    if (!tool) return fail(`Unknown WebMCP tool: ${name}`)
    try {
      const result = await tool.run(args)
      await settleVisibleUi()
      return result
    } catch (error) { return fail(error?.message || 'Tool invocation failed.') }
  }
}

function validateWorkflow(args, tiers, categories, store) {
  const step = args.workflow_step
  const needsSubmission = ['add-finding', 'request-revision', 'override-finding', 'approve', 'mark-revised'].includes(step)
  if (needsSubmission) {
    if (!args.submission_id) return fail('submission_id is required for this workflow.')
    if (store && !resolveSubmission(store, args.submission_id)) return fail('Unknown submission id.')
  }
  if (step === 'add-finding') {
    if (!tiers.includes(args.tier)) return fail('Tier is required and must be blocker, major, or minor.')
    if (!categories.includes(args.category)) return fail('Category is required and must use the closed vocabulary.')
    if (typeof args.description !== 'string' || args.description.trim().length < 10) return fail('Description must be at least 10 characters.')
  }
  if (step === 'request-revision' && (typeof args.revision_summary !== 'string' || args.revision_summary.trim().length < 20)) return fail('Summary must be at least 20 characters.')
  if (step === 'override-finding' && (typeof args.override_justification !== 'string' || args.override_justification.trim().length < 10)) return fail('Justification must be at least 10 characters.')
  if (step === 'override-finding' && !args.finding_id) return fail('finding_id is required for override-finding.')
  if (step === 'bulk-update' && !args.bulk_stage && !args.bulk_payout_state) return fail('bulk-stage or bulk-payout-state is required.')
  return ok('Workflow fields are valid', 'No mutation performed during validation.')
}
