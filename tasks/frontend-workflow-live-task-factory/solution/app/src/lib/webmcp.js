import { addRepositorySchema, aiConnectionSchema, githubConnectionSchema, importErrors, rejectActionSchema, rejectReasons } from './schemas'
import { useAppStore } from '../store/useAppStore'

let registered = false
const toolRegistry = new Map()

const toolShape = (name, description, properties, required = []) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
})

function result(message, data = {}) {
  return { content: [{ type: 'text', text: message }], ...data }
}

function arg(args, ...keys) {
  for (const key of keys) {
    if (args[key] !== undefined && args[key] !== null && args[key] !== '') return args[key]
  }
  return undefined
}

function matchPackage(entry, repository, prNumber, createdDate, difficulty, language) {
  if (repository && entry.repo !== repository) return false
  if (prNumber != null && Number(entry.pr_number) !== Number(prNumber)) return false
  if (difficulty && entry.difficulty !== difficulty) return false
  if (language && entry.language !== language) return false
  if (createdDate) {
    const needle = String(createdDate)
    if (entry.created_at !== needle && !entry.created_at.startsWith(needle) && !needle.startsWith(entry.created_at.slice(0, 10))) return false
  }
  return true
}

function addTool(definition, handler) {
  toolRegistry.set(definition.name, { definition, handler })
  const context = navigator.modelContext
  if (!context?.registerTool) return
  try {
    context.registerTool({ ...definition, execute: handler })
  } catch {
    try { context.registerTool(definition, handler) } catch { /* unsupported browser draft */ }
  }
}

export function registerWebMCP() {
  if (registered || typeof navigator === 'undefined') return
  registered = true

  addTool(toolShape('entity_select_library_package', 'Select a library-package using its closed identity fields.', {
    repository: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
    created_date: { type: 'string', minLength: 4, maxLength: 40 },
    'created-date': { type: 'string', minLength: 4, maxLength: 40 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    language: { type: 'string', minLength: 1, maxLength: 40 },
  }, ['repository']), async (args) => {
    const repository = arg(args, 'repository')
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const createdDate = arg(args, 'created_date', 'created-date')
    const difficulty = arg(args, 'difficulty')
    const language = arg(args, 'language')
    const store = useAppStore.getState()
    const matches = store.packages.filter((entry) => matchPackage(entry, repository, prNumber, createdDate, difficulty, language))
    if (matches.length !== 1) return result(matches.length ? 'Selection requires a unique library-package match.' : 'No matching library-package is visible.', { isError: true })
    store.selectPackage(matches[0])
    return result(`Selected library-package ${matches[0].repo} PR ${matches[0].pr_number}.`)
  })

  addTool(toolShape('entity_delete_library_package', 'Delete exactly one library-package. Explicit confirm=true is required.', {
    repository: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
    created_date: { type: 'string', minLength: 4, maxLength: 40 },
    'created-date': { type: 'string', minLength: 4, maxLength: 40 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    language: { type: 'string', minLength: 1, maxLength: 40 },
    confirm: { type: 'boolean' },
  }, ['repository', 'confirm']), async (args) => {
    if (args.confirm !== true) return result('Deletion requires explicit confirm=true.', { isError: true })
    const repository = arg(args, 'repository')
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const createdDate = arg(args, 'created_date', 'created-date')
    const difficulty = arg(args, 'difficulty')
    const language = arg(args, 'language')
    const store = useAppStore.getState()
    const matches = store.packages.filter((entry) => matchPackage(entry, repository, prNumber, createdDate, difficulty, language))
    if (matches.length !== 1) return result(matches.length ? 'Deletion requires a unique created-date match for one library-package.' : 'No matching library-package is visible.', { isError: true })
    store.deletePackage(matches[0])
    return result(`Deleted exactly one library-package: ${matches[0].repo} PR ${matches[0].pr_number}.`)
  })

  addTool(toolShape('form_validate', 'Validate declared TaskFoundry form fields without bypassing product validation.', {
    form: { type: 'string', enum: ['add-repository', 'github-connection', 'ai-connection', 'reject-action'] },
    repository: { type: 'string', minLength: 1, maxLength: 160 },
    github_token: { type: 'string', minLength: 1, maxLength: 500 },
    'github-token': { type: 'string', minLength: 1, maxLength: 500 },
    ai_base_url: { type: 'string', minLength: 1, maxLength: 500 },
    'ai-base-url': { type: 'string', minLength: 1, maxLength: 500 },
    ai_api_key: { type: 'string', minLength: 1, maxLength: 500 },
    'ai-api-key': { type: 'string', minLength: 1, maxLength: 500 },
    reject_reason: { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
    'reject-reason': { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
  }, ['form']), async (args) => {
    const parsed = args.form === 'add-repository' ? addRepositorySchema.safeParse({ repository: args.repository })
      : args.form === 'github-connection' ? githubConnectionSchema.safeParse({ githubToken: arg(args, 'github_token', 'github-token') })
        : args.form === 'ai-connection' ? aiConnectionSchema.safeParse({ aiBaseUrl: arg(args, 'ai_base_url', 'ai-base-url'), aiApiKey: arg(args, 'ai_api_key', 'ai-api-key') })
          : rejectActionSchema.safeParse({ reason: arg(args, 'reject_reason', 'reject-reason') })
    if (!parsed.success) return result(`Validation failed: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`, { isError: true })
    return result(`${args.form} fields are valid.`)
  })

  addTool(toolShape('form_submit', 'Submit a declared form through the same visible product command.', {
    form: { type: 'string', enum: ['add-repository', 'github-connection', 'ai-connection', 'reject-action'] },
    repository: { type: 'string', minLength: 1, maxLength: 160 },
    github_token: { type: 'string', minLength: 1, maxLength: 500 },
    'github-token': { type: 'string', minLength: 1, maxLength: 500 },
    ai_base_url: { type: 'string', minLength: 1, maxLength: 500 },
    'ai-base-url': { type: 'string', minLength: 1, maxLength: 500 },
    ai_api_key: { type: 'string', minLength: 1, maxLength: 500 },
    'ai-api-key': { type: 'string', minLength: 1, maxLength: 500 },
    reject_reason: { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
    'reject-reason': { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
    repo: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
  }, ['form']), async (args) => {
    const store = useAppStore.getState()
    if (args.form === 'add-repository') {
      const parsed = addRepositorySchema.safeParse({ repository: args.repository })
      if (!parsed.success) return result(`repository: ${parsed.error.issues[0].message}`, { isError: true })
      const response = await store.addRepository(parsed.data)
      return response.ok ? result(`Added repository ${args.repository}.`) : result(response.notice, { isError: true })
    }
    if (args.form === 'github-connection') {
      const parsed = githubConnectionSchema.safeParse({ githubToken: arg(args, 'github_token', 'github-token') })
      if (!parsed.success) return result('github-token is invalid.', { isError: true })
      store.setCredential('githubToken', parsed.data.githubToken)
      store.setConnectionsOpen(true)
      await store.connectGithub()
      return useAppStore.getState().githubStatus === 'connected' ? result('GitHub connection check succeeded.') : result('GitHub connection check failed visibly; Demo data remains active.', { isError: true })
    }
    if (args.form === 'ai-connection') {
      const parsed = aiConnectionSchema.safeParse({ aiBaseUrl: arg(args, 'ai_base_url', 'ai-base-url'), aiApiKey: arg(args, 'ai_api_key', 'ai-api-key') })
      if (!parsed.success) return result('ai-base-url or ai-api-key is invalid.', { isError: true })
      store.setAiBaseUrl(parsed.data.aiBaseUrl)
      store.setCredential('aiApiKey', parsed.data.aiApiKey)
      store.setConnectionsOpen(true)
      await store.connectAI()
      return useAppStore.getState().aiStatus === 'connected' ? result('AI endpoint check succeeded.') : result('AI endpoint check failed visibly; demo simulation remains active.', { isError: true })
    }
    const reason = arg(args, 'reject_reason', 'reject-reason')
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const parsed = rejectActionSchema.safeParse({ reason })
    if (!parsed.success || !args.repo || !prNumber) return result('reject-reason, repo, and pr_number are required.', { isError: true })
    store.setView('triage')
    store.triagePr(args.repo, prNumber, 'rejected', parsed.data.reason)
    return result(`Rejected ${args.repo} PR ${prNumber} for ${parsed.data.reason}.`)
  })

  addTool(toolShape('form_cancel', 'Cancel the open form workflow and return to the visible workbench.', {}), async () => {
    useAppStore.setState({ connectionsOpen: false, commandOpen: false })
    return result('Open form workflow cancelled.')
  })

  addTool(toolShape('form_reset', 'Reset the bounded coachmark workflow or current source-file filters.', {
    target: { type: 'string', enum: ['coachmarks', 'source-file-filters'] },
  }, ['target']), async ({ target }) => {
    const store = useAppStore.getState()
    if (target === 'coachmarks') store.resetCoachmarks()
    else store.clearSourceFilters()
    return result(`Reset ${target}.`)
  })

  addTool(toolShape('form_advance', 'Advance a bounded workflow step through the same domain command.', {
    step: { type: 'string', enum: ['accept-pr', 'reject-pr', 'undo-triage', 'queue-batch', 'disconnect-credential', 'reset-coachmarks'] },
    repo: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
    reject_reason: { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
    'reject-reason': { type: 'string', enum: ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue'] },
    credential: { type: 'string', enum: ['github', 'ai'] },
  }, ['step']), async (args) => {
    const { step, repo, credential } = args
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const rejectReason = arg(args, 'reject_reason', 'reject-reason')
    const store = useAppStore.getState()
    if (step === 'accept-pr' && repo && prNumber) { store.setView('triage'); store.triagePr(repo, prNumber, 'accepted') }
    else if (step === 'reject-pr' && repo && prNumber && rejectReasons.includes(rejectReason)) { store.setView('triage'); store.triagePr(repo, prNumber, 'rejected', rejectReason) }
    else if (step === 'undo-triage') store.undoTriage()
    else if (step === 'queue-batch' && repo && prNumber) { store.setView('runs'); store.toggleBatchQueue(repo, prNumber) }
    else if (step === 'disconnect-credential' && credential) credential === 'github' ? store.disconnectGithub() : store.disconnectAI()
    else if (step === 'reset-coachmarks') store.resetCoachmarks()
    else return result('The requested workflow step is missing its bounded inputs.', { isError: true })
    return result(`Advanced workflow step ${step}.`)
  })

  addTool(toolShape('form_return', 'Return from a package or detail workflow to its collection.', {
    destination: { type: 'string', enum: ['library', 'candidates', 'triage', 'runs'] },
  }, ['destination']), async ({ destination }) => {
    useAppStore.setState({
      activeView: destination,
      selectedPackage: null,
      mobileNavOpen: false,
      connectionsOpen: false,
      commandOpen: false,
    })
    return result(`Returned to ${destination}.`)
  })

  addTool(toolShape('session_start', 'Start one bounded pipeline demo or the current batch through product handlers.', {
    demo: { type: 'string', enum: ['demo-pipeline-run', 'rate-limit-retry-driftline-pr-58', 'generate-failure-retry-petrel-pr-31', 'trivial-verdict-run', 'batch-run'] },
    repo: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
  }, ['demo']), async (args) => {
    const { demo, repo } = args
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const store = useAppStore.getState()
    if (store.run?.status === 'running') {
      useAppStore.setState({ run: { ...store.run, status: 'stopped' } })
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    if (demo === 'batch-run') {
      const started = await useAppStore.getState().startBatch()
      useAppStore.getState().setView('runs')
      return started.ok ? result('Batch session started.') : result(started.error, { isError: true })
    }
    const target = demo === 'rate-limit-retry-driftline-pr-58' ? ['nimbusworks/driftline', 58]
      : demo === 'generate-failure-retry-petrel-pr-31' ? ['fernfield/petrel', 31]
        : demo === 'trivial-verdict-run' ? ['nimbusworks/driftline', 52]
          : [repo || 'nimbusworks/driftline', prNumber || 57]
    const started = useAppStore.getState().startRun(target[0], target[1])
    useAppStore.getState().setView('runs')
    return started.ok ? result(`Pipeline session started for ${target[0]} PR ${target[1]}.`) : result(started.error, { isError: true })
  })

  addTool(toolShape('session_pause', 'Pause the active pipeline at its current visible stage.', {}), async () => {
    const store = useAppStore.getState()
    if (!store.run || (store.run.status !== 'running' && !store.run.paused)) return result('No running pipeline can be paused.', { isError: true })
    store.setView('runs')
    store.pauseRun()
    return result('Pipeline pause requested. Observe the visible stage to verify timing.')
  })

  addTool(toolShape('session_resume', 'Resume the paused pipeline from its unchanged checkpoint.', {}), async () => {
    const store = useAppStore.getState()
    if (!store.run?.paused) return result('No paused pipeline can be resumed.', { isError: true })
    store.setView('runs')
    store.resumeRun()
    return result('Pipeline resumed from the current checkpoint.')
  })

  addTool(toolShape('artifact_export', 'Prepare a selected artifact for visible export. Download mechanics remain user-driven.', {
    format: { type: 'string', enum: ['instruction-document-text', 'task-config-toml', 'package-bundle-json', 'batch-run-report-json'] },
    repository: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
  }, ['format']), async (args) => {
    const { format, repository } = args
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const store = useAppStore.getState()
    if (format === 'batch-run-report-json') {
      if (!store.batchReport) return result('No finished BatchRunReport is available.', { isError: true })
      store.setView('runs')
      return result('BatchRunReport is visible and ready for its Download report control.')
    }
    const item = store.packages.find((entry) => matchPackage(entry, repository, prNumber))
    if (!item) return result('No matching TaskPackageBundle is available.', { isError: true })
    store.selectPackage(item)
    return result(`${format} is visible and ready for its export control.`)
  })

  addTool(toolShape('artifact_copy', 'Prepare a selected package part for the visible copy control; artifact contents are not returned.', {
    part: { type: 'string', enum: ['instruction-document-text', 'task-config-toml', 'package-bundle-json'] },
    repository: { type: 'string', minLength: 3, maxLength: 160 },
    pr_number: { type: 'integer', minimum: 1 },
    'pr-number': { type: 'integer', minimum: 1 },
  }, ['part', 'repository']), async (args) => {
    const { part, repository } = args
    const prNumber = arg(args, 'pr_number', 'pr-number')
    const store = useAppStore.getState()
    const item = store.packages.find((entry) => matchPackage(entry, repository, prNumber))
    if (!item) return result('No matching TaskPackageBundle is available.', { isError: true })
    store.selectPackage(item)
    return result(`${part} is visible; activate its Copy control to observe clipboard mechanics.`)
  })

  addTool(toolShape('artifact_import', 'Open the package library for a user-driven package-bundle-json file import.', {
    mode: { type: 'string', enum: ['package-bundle-json'] },
    bundle_json: { type: 'string', minLength: 2 },
  }, ['mode']), async (args) => {
    const store = useAppStore.getState()
    useAppStore.setState({ activeView: 'library', selectedPackage: null, mobileNavOpen: false })
    if (args.bundle_json) {
      try {
        const value = JSON.parse(args.bundle_json)
        const parsed = importErrors(value)
        if (parsed.errors.length) return result(`Bundle rejected: ${parsed.errors.map((error) => `${error.field}: ${error.message}`).join('; ')}`, { isError: true })
        store.importPackage(parsed.data)
        return result(`Imported ${parsed.data.repo} PR ${parsed.data.pr_number}.`)
      } catch {
        return result('bundle must contain valid JSON', { isError: true })
      }
    }
    return result('Library import control is visible. Choose the JSON file through the file picker.')
  })

  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'],
    tool_names: [...toolRegistry.keys()],
  })
  window.webmcp_list_tools = () => [...toolRegistry.values()].map(({ definition }) => definition)
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = toolRegistry.get(name)
    if (!tool) throw new Error(`Unknown TaskFoundry WebMCP tool: ${name}`)
    return tool.handler(args)
  }
  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  }
  window.__taskfoundry_webmcp_tools = true
}
