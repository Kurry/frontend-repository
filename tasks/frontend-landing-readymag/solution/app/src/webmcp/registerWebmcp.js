const CONTRACT = 'zto-webmcp-v1'
const DESTINATIONS = ['hero', 'workflow', 'teams', 'support', 'closing', 'trial-brief']
const SESSION_OPERATIONS = ['advance']
const DEMOS = ['solutions-menu']

export const webmcpBus = {
  advanceSlideshow: null,
  openSolutions: null,
  closeSolutions: null,
  validateBrief: null,
  submitBrief: null,
  resetBrief: null,
  exportBrief: null,
  copyBrief: null,
  importBrief: null
}

function scrollToSection(dest) {
  const el = document.getElementById(`rm-section-${dest}`)
  if (!el) return { ok: false, error: `Unknown destination; use one of ${DESTINATIONS.join(', ')}` }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return { ok: true, destination: dest }
}

const tools = {
  'browse.open': {
    module: 'browse-query-v1',
    description: 'Open section',
    handler: (args) => {
      const dest = (args || {}).destination
      if (!DESTINATIONS.includes(dest)) {
        return { ok: false, error: `destination must be one of ${DESTINATIONS.join(', ')}` }
      }
      return scrollToSection(dest)
    },
  },
  'browse.search': {
    module: 'browse-query-v1',
    description: 'Search declared destinations',
    handler: (args) => {
      const query = String((args || {}).query || '').trim().toLowerCase()
      if (!query || query.length > 200) return { ok: false, error: 'query must be 1-200 characters' }
      return { ok: true, matches: DESTINATIONS.filter((destination) => destination.includes(query)) }
    },
  },
  'session.advance': {
    module: 'command-session-v1',
    description: 'Advance slideshow',
    handler: () => {
      if (typeof webmcpBus.advanceSlideshow !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.advanceSlideshow()
    },
  },
  'form.validate': {
    module: 'form-workflow-v1',
    description: 'Validate form',
    handler: () => {
      if (typeof webmcpBus.validateBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.validateBrief()
    }
  },
  'form.submit': {
    module: 'form-workflow-v1',
    description: 'Submit form',
    handler: () => {
      if (typeof webmcpBus.submitBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.submitBrief()
    }
  },
  'form.reset': {
    module: 'form-workflow-v1',
    description: 'Reset form',
    handler: () => {
      if (typeof webmcpBus.resetBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.resetBrief()
    }
  },
  'artifact.export': {
    module: 'artifact-transfer-v1',
    description: 'Export JSON',
    handler: (args) => {
      if (typeof webmcpBus.exportBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.exportBrief(args.format)
    }
  },
  'artifact.copy': {
    module: 'artifact-transfer-v1',
    description: 'Copy JSON',
    handler: () => {
      if (typeof webmcpBus.copyBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.copyBrief()
    }
  },
  'artifact.import': {
    module: 'artifact-transfer-v1',
    description: 'Import JSON',
    handler: (args) => {
      if (typeof webmcpBus.importBrief !== 'function') return { ok: false, error: 'not ready' }
      return webmcpBus.importBrief(args.mode)
    }
  }
}

let installed = false

export function registerWebmcp() {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.webmcp_session_info = () => ({
    contract_version: CONTRACT,
    app: 'canvasly-homepage',
    modules: ['browse-query-v1', 'command-session-v1', 'form-workflow-v1', 'artifact-transfer-v1'],
    destinations: DESTINATIONS,
    session_operations: SESSION_OPERATIONS,
    demos: DEMOS,
    form_fields: ['name', 'email', 'plan', 'team_size', 'interests'],
    form_operations: ['validate', 'submit', 'reset'],
    artifact_operations: ['export', 'copy', 'import'],
    export_formats: ['json'],
    import_modes: ['replace'],
    tool_count: Object.keys(tools).length,
  })

  window.webmcp_list_tools = () =>
    Object.keys(tools).map((name) => ({
      name,
      module: tools[name].module,
      description: tools[name].description,
    }))

  window.webmcp_invoke_tool = (name, args) => {
    if (!tools[name]) throw new Error('Unknown WebMCP tool: ' + name)
    return tools[name].handler(args || {})
  }
}
