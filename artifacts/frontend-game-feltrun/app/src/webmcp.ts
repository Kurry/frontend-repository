import type { useGameStore } from './stores/game'

type GameStore = ReturnType<typeof useGameStore>
type Handler = (args: Record<string, unknown>) => unknown

interface ToolDef {
  name: string
  module: string
  description: string
  handler: Handler
}

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['command-session-v1', 'browse-query-v1', 'structured-editor-v1', 'artifact-transfer-v1']
const DESTINATIONS = ['table', 'stats', 'hand-history', 'badges', 'export', 'collaboration'] as const

function boundedString(value: unknown, label: string, max = 200): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) {
    throw new Error(`${label} must be a non-empty string of at most ${max} characters`)
  }
  return value
}

function afterRender(action: () => boolean): Promise<{ ok: boolean; error?: string }> {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => {
      const ok = action()
      resolve(ok ? { ok: true } : { ok: false, error: 'The visible control is not available' })
    })
  })
}

export function registerWebMcp(store: GameStore) {
  const sessionStart = () => {
    if (store.s.phase !== 'idle') return { ok: false, error: 'A session is already active' }
    store.dealNextHand()
    return { ok: true, operation: 'start', phase: store.s.phase }
  }

  const sessionAdvance = () => {
    if (store.s.phase !== 'handOver') {
      return { ok: false, error: 'Advance is available between hands; betting remains Playwright-driven' }
    }
    store.dealNextHand()
    return { ok: true, operation: 'advance', phase: store.s.phase }
  }

  const sessionRestart = () => {
    store.requestNewSession()
    store.confirmNewSession()
    return { ok: true, operation: 'restart', phase: store.s.phase }
  }

  const uiOnlySessionOperation = (operation: 'pause' | 'resume') => ({
    ok: false,
    operation,
    error: `${operation} is represented by the visible Save table / Load saved table controls and remains Playwright-driven`,
  })

  const sessionTriggerDemo = (args: Record<string, unknown>) => {
    const demo = boundedString(args.demo, 'demo', 64)
    if (demo !== 'rebuy') return { ok: false, error: 'The only available demo is rebuy' }
    const before = store.s.rebuys
    store.rebuy()
    const applied = store.s.rebuys > before
    return {
      ok: applied,
      operation: 'trigger_demo',
      demo,
      error: applied ? undefined : 'Rebuy is available only at zero chips between hands',
    }
  }

  const browseOpen = (args: Record<string, unknown>) => {
    const destination = boundedString(args.destination, 'destination', 64) as (typeof DESTINATIONS)[number]
    if (!DESTINATIONS.includes(destination)) {
      return { ok: false, error: `destination must be one of ${DESTINATIONS.join(', ')}` }
    }
    const narrow = window.innerWidth < 768
    if (destination === 'hand-history') store.showHistory = true
    if (destination === 'badges') store.showBadges = true
    if (destination === 'export') store.showExport = true
    if (narrow && ['stats', 'hand-history', 'badges', 'export'].includes(destination)) store.drawerOpen = true
    const id = destination === 'collaboration' ? 'collab-section' : destination === 'table' ? 'poker-table' : null
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return { ok: true, operation: 'open', destination }
  }

  const editorAdd = (args: Record<string, unknown>) => {
    if (args.type !== 'shared-note') return { ok: false, error: 'type must be shared-note' }
    const ok = store.addNote('Shared note')
    const note = store.collab.notes[store.collab.notes.length - 1]
    return ok ? { ok: true, operation: 'add', id: note?.id, type: 'shared-note' } : { ok: false, error: 'Unable to add note' }
  }

  const editorUpdate = (args: Record<string, unknown>) => {
    const id = boundedString(args.id, 'id', 128)
    const property = boundedString(args.property, 'property', 64)
    if (property !== 'text') return { ok: false, error: 'The shared-note property is text' }
    const value = boundedString(args.value, 'value')
    if (!store.collab.notes.some(note => note.id === id)) return { ok: false, error: `Unknown shared note: ${id}` }
    return store.editNote(id, value)
      ? { ok: true, operation: 'update_property', id, property }
      : { ok: false, error: 'Unable to update note' }
  }

  const artifactExport = (args: Record<string, unknown>) => {
    if (args.format !== 'json') return { ok: false, error: 'format must be json' }
    store.showExport = true
    return afterRender(() => {
      const button = document.querySelector<HTMLButtonElement>('button[aria-label="Download session JSON"]')
      button?.click()
      return Boolean(button)
    }).then(result => ({ ...result, operation: 'export', format: 'json' }))
  }

  const artifactImport = (args: Record<string, unknown>) => {
    if (args.mode !== 'session-json') return { ok: false, error: 'mode must be session-json' }
    store.showExport = true
    return afterRender(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="Paste JSON here..."]')
      input?.focus()
      return Boolean(input)
    }).then(result => ({ ...result, operation: 'import', mode: 'session-json', completed: false }))
  }

  const artifactCopy = () => {
    store.showExport = true
    return afterRender(() => {
      const button = document.querySelector<HTMLButtonElement>('button[aria-label="Copy session JSON"]')
      button?.click()
      return Boolean(button)
    }).then(result => ({ ...result, operation: 'copy' }))
  }

  const tools: ToolDef[] = [
    { name: 'session.start', module: 'command-session-v1', description: 'Start the first hand through the Deal control handler.', handler: sessionStart },
    { name: 'session.pause', module: 'command-session-v1', description: 'Pause remains on the visible Save table control.', handler: () => uiOnlySessionOperation('pause') },
    { name: 'session.resume', module: 'command-session-v1', description: 'Resume remains on the visible Load saved table control.', handler: () => uiOnlySessionOperation('resume') },
    { name: 'session.restart', module: 'command-session-v1', description: 'Confirm a new session through the application handler.', handler: sessionRestart },
    { name: 'session.advance', module: 'command-session-v1', description: 'Deal the next hand between hands; betting stays Playwright-driven.', handler: sessionAdvance },
    { name: 'session.trigger_demo', module: 'command-session-v1', description: 'Trigger the bounded rebuy demo.', handler: sessionTriggerDemo },
    { name: 'session.connect', module: 'command-session-v1', description: 'Reconnect collaboration.', handler: () => { store.goOnline(); return { ok: true, operation: 'connect' } } },
    { name: 'session.disconnect', module: 'command-session-v1', description: 'Take collaboration offline.', handler: () => { store.goOffline(); return { ok: true, operation: 'disconnect' } } },
    { name: 'browse.open', module: 'browse-query-v1', description: 'Open a declared table surface.', handler: browseOpen },
    { name: 'browse.search', module: 'browse-query-v1', description: 'No search UI is present in this task.', handler: args => ({ ok: false, query: boundedString(args.query, 'query'), error: 'This application has no visible search surface' }) },
    { name: 'editor.add', module: 'structured-editor-v1', description: 'Add a shared-note object.', handler: editorAdd },
    { name: 'editor.update_property', module: 'structured-editor-v1', description: 'Update the text property of a shared note.', handler: editorUpdate },
    { name: 'artifact.export', module: 'artifact-transfer-v1', description: 'Trigger the visible JSON download control without returning artifact contents.', handler: artifactExport },
    { name: 'artifact.import', module: 'artifact-transfer-v1', description: 'Open and focus the visible session-json import mode without accepting file contents.', handler: artifactImport },
    { name: 'artifact.copy', module: 'artifact-transfer-v1', description: 'Trigger the visible JSON copy control without returning clipboard contents.', handler: artifactCopy },
  ]

  const invoke = (name: string, args: Record<string, unknown> = {}) => {
    const tool = tools.find(candidate => candidate.name === name)
    if (!tool) return { ok: false, error: `Unknown tool: ${name}` }
    try {
      return tool.handler(args ?? {})
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  const w = window as unknown as Record<string, unknown>
  w.webmcp_session_info = () => ({ contract_version: CONTRACT_VERSION, modules: MODULES, tools: tools.map(tool => tool.name) })
  w.webmcp_list_tools = () => tools.map(({ name, module, description }) => ({ name, module, description }))
  w.webmcp_invoke_tool = (name: string, args: Record<string, unknown> = {}) => invoke(name, args)

  try {
    const modelContext = (navigator as Navigator & { modelContext?: { registerTool?: (tool: unknown) => void } }).modelContext
    for (const tool of tools) {
      modelContext?.registerTool?.({ name: tool.name, description: tool.description, invoke: (args: Record<string, unknown>) => invoke(tool.name, args) })
    }
  } catch {
    // The window bridge remains authoritative when the optional API is absent.
  }
}
