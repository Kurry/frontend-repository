import { DOCUMENT_TYPES, repositoryFormSchema, importFormSchema, type DocumentType } from './schemas'
import { scanSelected, startScan, useAppStore, type StepStatus } from './store'

type JsonSchema = Record<string, unknown>
type ToolDefinition = {
  name: string
  description: string
  inputSchema: JsonSchema
  handler: (args: Record<string, unknown>) => unknown | Promise<unknown>
}

declare global {
  interface Window {
    webmcp_session_info?: () => unknown
    webmcp_list_tools?: () => unknown
    webmcp_invoke_tool?: (name: string, args?: Record<string, unknown>) => unknown
  }
}

const repositoryIdSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 120,
  description: 'ID of a repository visible in the tracked repository list',
}

const tools: ToolDefinition[] = [
  {
    name: 'entity_repository_create',
    description: 'Create one tracked repository through the same command as the Add repository form.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['path'],
      properties: {
        path: { type: 'string', minLength: 1, maxLength: 260 },
        displayName: { type: 'string', maxLength: 80 },
      },
    },
    handler: ({ path, displayName }) => {
      const values = { path: String(path ?? ''), displayName: displayName === undefined ? '' : String(displayName) }
      const parsed = repositoryFormSchema.safeParse(values)
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid parameters' }
      }
      return useAppStore.getState().addRepository(parsed.data)
    },
  },
  {
    name: 'entity_repository_select',
    description: 'Select a visible repository row for batch scanning.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['repositoryId'], properties: { repositoryId: repositoryIdSchema } },
    handler: ({ repositoryId }) => {
      const id = String(repositoryId)
      const state = useAppStore.getState()
      if (!state.repositories.some((repository) => repository.id === id)) return { ok: false, error: 'repositoryId was not found' }
      if (!state.selectedRepositoryIds.includes(id)) state.toggleRepositorySelection(id)
      return { ok: true, selectedCount: useAppStore.getState().selectedRepositoryIds.length }
    },
  },
  {
    name: 'entity_repository_update',
    description: 'Update the display-name field of one repository using the visible Rename command.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['repositoryId', 'field', 'value'],
      properties: {
        repositoryId: repositoryIdSchema,
        field: { type: 'string', enum: ['display-name'] },
        value: { type: 'string', maxLength: 80 },
      },
    },
    handler: ({ repositoryId, field, value }) => {
      if (field !== 'display-name') return { ok: false, error: 'field must be display-name' }
      const parsed = repositoryFormSchema.pick({ displayName: true }).safeParse({ displayName: String(value ?? '') })
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid parameters' }
      }
      return useAppStore.getState().renameRepository(String(repositoryId), parsed.data.displayName || '')
    },
  },
  {
    name: 'entity_repository_delete',
    description: 'Delete a repository and its documents; explicit confirmation is required.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['repositoryId', 'confirm'],
      properties: { repositoryId: repositoryIdSchema, confirm: { type: 'boolean', const: true } },
    },
    handler: ({ repositoryId, confirm }) => {
      if (confirm !== true) return { ok: false, error: 'confirm must be true' }
      const id = String(repositoryId)
      const state = useAppStore.getState()
      if (!state.repositories.some((repository) => repository.id === id)) return { ok: false, error: 'repositoryId was not found' }
      state.removeRepository(id)
      return { ok: true, repositoryCount: useAppStore.getState().repositories.length }
    },
  },
  {
    name: 'entity_repository_toggle',
    description: 'Toggle a repository row checkbox using the visible selection command.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['repositoryId'], properties: { repositoryId: repositoryIdSchema } },
    handler: ({ repositoryId }) => {
      const id = String(repositoryId)
      const state = useAppStore.getState()
      if (!state.repositories.some((repository) => repository.id === id)) return { ok: false, error: 'repositoryId was not found' }
      state.toggleRepositorySelection(id)
      return { ok: true, selected: useAppStore.getState().selectedRepositoryIds.includes(id) }
    },
  },
  {
    name: 'session_scan_start',
    description: 'Start a scan for one repository, or sequential scans for the selected repositories.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { repositoryId: repositoryIdSchema, selected: { type: 'boolean' } },
    },
    handler: ({ repositoryId, selected }) => {
      if (selected === true) {
        const count = useAppStore.getState().selectedRepositoryIds.length
        if (!count) return { ok: false, error: 'No repositories selected' }
        void scanSelected()
        return { ok: true, started: true, selectedCount: count }
      }
      const id = String(repositoryId ?? '')
      const state = useAppStore.getState()
      if (!id || !state.repositories.some((repository) => repository.id === id)) {
        return { ok: false, error: 'repositoryId was not found' }
      }
      const currentRun = state.scanRuns[id]
      if (currentRun?.status === 'running' || currentRun?.status === 'paused') {
        return { ok: false, error: 'Scan already active for this repository' }
      }
      void startScan(id)
      return { ok: true, repositoryId: id, status: 'running' }
    },
  },
  {
    name: 'session_scan_pause',
    description: 'Pause the active scan at its current checkpoint.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['repositoryId'], properties: { repositoryId: repositoryIdSchema } },
    handler: ({ repositoryId }) => {
      useAppStore.getState().pauseScan(String(repositoryId))
      return { ok: true, status: useAppStore.getState().scanRuns[String(repositoryId)]?.status ?? 'not-found' }
    },
  },
  {
    name: 'session_scan_resume',
    description: 'Resume a paused scan from its exact checkpoint.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['repositoryId'], properties: { repositoryId: repositoryIdSchema } },
    handler: ({ repositoryId }) => {
      useAppStore.getState().resumeScan(String(repositoryId))
      return { ok: true, status: useAppStore.getState().scanRuns[String(repositoryId)]?.status ?? 'not-found' }
    },
  },
  {
    name: 'session_scan_restart',
    description: 'Restart a completed or failed repository scan with current pattern configuration.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['repositoryId'], properties: { repositoryId: repositoryIdSchema } },
    handler: ({ repositoryId }) => {
      const id = String(repositoryId)
      const state = useAppStore.getState()
      if (!state.repositories.some((repository) => repository.id === id)) {
        return { ok: false, error: 'repositoryId was not found' }
      }
      void startScan(id)
      return { ok: true, repositoryId: id, status: 'running' }
    },
  },
  {
    name: 'browse_open',
    description: 'Open a declared repository scanner destination.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['destination'],
      properties: {
        destination: { type: 'string', enum: ['document-tree', 'file-viewer', 'export-panel'] },
        documentId: { type: 'string', maxLength: 180 },
      },
    },
    handler: ({ destination, documentId }) => {
      const state = useAppStore.getState()
      if (destination === 'document-tree') state.showTree()
      else if (destination === 'export-panel') state.setUi('exportOpen', true)
      else if (destination === 'file-viewer') {
        const id = String(documentId ?? '')
        const exists = Object.values(state.documents).flat().some((document) => document.id === id)
        if (!exists) return { ok: false, error: 'documentId was not found' }
        state.openDocument(id)
      } else return { ok: false, error: 'destination is invalid' }
      return { ok: true, destination }
    },
  },
  {
    name: 'browse_search',
    description: 'Search the indexed documents by bounded text and open the first matching file.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['query'], properties: { query: { type: 'string', minLength: 1, maxLength: 120 } } },
    handler: ({ query }) => {
      const state = useAppStore.getState()
      const needle = String(query).toLowerCase()
      const matches = Object.values(state.documents).flat().filter((document) => `${document.path} ${document.content}`.toLowerCase().includes(needle))
      if (matches[0]) state.openDocument(matches[0].id)
      return { ok: true, matchCount: matches.length, openedDocumentId: matches[0]?.id ?? null }
    },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply a declared document-type or timeline-status filter using the visible filter commands.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['filter', 'value'],
      properties: {
        filter: { type: 'string', enum: ['document-type', 'timeline-status'] },
        value: { type: 'string', enum: [...DOCUMENT_TYPES, 'pending', 'running', 'complete', 'failed', 'retrying'] },
      },
    },
    handler: ({ filter, value }) => {
      const state = useAppStore.getState()
      if (filter === 'document-type' && DOCUMENT_TYPES.includes(value as DocumentType)) {
        if (!state.documentTypeFilters.includes(value as DocumentType)) state.toggleDocumentFilter(value as DocumentType)
      } else if (filter === 'timeline-status' && ['pending', 'running', 'complete', 'failed', 'retrying'].includes(String(value))) {
        if (!state.timelineFilters.includes(value as StepStatus)) state.toggleTimelineFilter(value as StepStatus)
      } else return { ok: false, error: 'filter and value combination is invalid' }
      return { ok: true, filter, value }
    },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear a declared document-type or timeline-status filter.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['filter'],
      properties: { filter: { type: 'string', enum: ['document-type', 'timeline-status'] } },
    },
    handler: ({ filter }) => {
      const state = useAppStore.getState()
      if (filter === 'document-type') state.clearDocumentFilters()
      else if (filter === 'timeline-status') state.timelineFilters.forEach((status) => useAppStore.getState().toggleTimelineFilter(status))
      else return { ok: false, error: 'filter is invalid' }
      return { ok: true, filter }
    },
  },
  {
    name: 'artifact_export',
    description: 'Open the live export panel for JSON or Markdown; content remains visible in the UI.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['format'], properties: { format: { type: 'string', enum: ['json', 'markdown'] } } },
    handler: ({ format }) => {
      useAppStore.getState().setUi('exportOpen', true)
      return { ok: true, format, destination: 'export-panel', visiblePostcondition: 'Export scan index dialog is open' }
    },
  },
  {
    name: 'artifact_import',
    description: 'Round-trip the current declared scan-index artifact without accepting raw file or payload content.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'source'],
      properties: { mode: { type: 'string', const: 'scan-index' }, source: { type: 'string', const: 'current-export' } },
    },
    handler: ({ mode, source }) => {
      if (mode !== 'scan-index' || source !== 'current-export') return { ok: false, error: 'Only scan-index/current-export is declared' }
      const state = useAppStore.getState()

      const payloadString = state.artifactJson
      const parseResult = importFormSchema.safeParse({ payload: payloadString })
      if (!parseResult.success) {
        return { ok: false, error: parseResult.error.issues[0]?.message || 'Invalid payload' }
      }

      let parsed: unknown
      try { parsed = JSON.parse(parseResult.data.payload) } catch { return { ok: false, error: 'malformed JSON' } }
      return state.importIndex(parsed)
    },
  },
  {
    name: 'artifact_copy',
    description: 'Open the artifact preview for Playwright-observed clipboard interaction.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['format'], properties: { format: { type: 'string', enum: ['json', 'markdown'] } } },
    handler: ({ format }) => {
      useAppStore.getState().setUi('exportOpen', true)
      return { ok: true, format, requiresPlaywrightClipboardObservation: true }
    },
  },
]

export function registerWebMcpTools() {
  if (typeof window === 'undefined') return
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'command-session-v1', 'browse-query-v1', 'artifact-transfer-v1'],
    tools: tools.map((tool) => tool.name),
  })
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = tools.find((candidate) => candidate.name === name)
    if (!tool) return { ok: false, error: `Unknown WebMCP tool: ${name}` }
    try {
      return await tool.handler(args)
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Tool invocation failed' }
    }
  }
}
