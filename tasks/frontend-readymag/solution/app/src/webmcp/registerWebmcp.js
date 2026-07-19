/**
 * WebMCP surface for the Readymag homepage (contract zto-webmcp-v1).
 *
 * Exposes window.webmcp_session_info(), window.webmcp_list_tools(), and
 * window.webmcp_invoke_tool(name, args). Every tool calls the SAME state
 * setter/ref the visible UI control uses — no success path the UI lacks.
 *
 * Modules:
 * - browse-query-v1 (prefix "browse"): browse_open scrolls an on-page section
 *   into view (hero, workflow, teams, support, closing).
 * - command-session-v1 (prefix "session"): session_advance advances the
 *   six-image project slideshow (same call as its 2200ms timed advance);
 *   session_trigger_demo with demo="solutions-menu" opens the Solutions
 *   combobox menu (same call as clicking the Solutions trigger).
 */

const CONTRACT = 'zto-webmcp-v1'
const DESTINATIONS = ['hero', 'workflow', 'teams', 'support', 'closing']
const SESSION_OPERATIONS = ['advance']
const DEMOS = ['solutions-menu']

// Handlers the React components populate (in useEffect) so WebMCP drives the
// exact same state as the visible controls.
export const webmcpBus = {
  advanceSlideshow: null, // () => { ok, active }
  openSolutions: null, // () => { ok, expanded }
}

function scrollToSection(dest) {
  const el = document.getElementById(`rm-section-${dest}`)
  if (!el) return { ok: false, error: `Unknown destination; use one of ${DESTINATIONS.join(', ')}` }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return { ok: true, destination: dest }
}

const tools = {
  browse_open: {
    module: 'browse-query-v1',
    description:
      'Open (scroll into view) an on-page section. destination: one of hero, workflow, teams, support, closing.',
    handler: (args) => {
      const dest = (args || {}).destination
      if (!DESTINATIONS.includes(dest)) {
        return { ok: false, error: `destination must be one of ${DESTINATIONS.join(', ')}` }
      }
      return scrollToSection(dest)
    },
  },
  session_advance: {
    module: 'command-session-v1',
    description: 'Advance the six-image project slideshow to its next slide (same as the timed advance).',
    handler: () => {
      if (typeof webmcpBus.advanceSlideshow !== 'function') {
        return { ok: false, error: 'slideshow not ready' }
      }
      return webmcpBus.advanceSlideshow()
    },
  },
  session_trigger_demo: {
    module: 'command-session-v1',
    description: 'Trigger a demo. demo="solutions-menu" opens the Solutions combobox menu (same as clicking Solutions).',
    handler: (args) => {
      const demo = (args || {}).demo
      if (demo !== 'solutions-menu') {
        return { ok: false, error: 'demo must be one of solutions-menu' }
      }
      if (typeof webmcpBus.openSolutions !== 'function') {
        return { ok: false, error: 'solutions menu not ready' }
      }
      return webmcpBus.openSolutions()
    },
  },
}

let installed = false

export function registerWebmcp() {
  if (installed || typeof window === 'undefined') return
  installed = true

  window.webmcp_session_info = () => ({
    contract_version: CONTRACT,
    app: 'readymag-homepage',
    modules: ['browse-query-v1', 'command-session-v1'],
    destinations: DESTINATIONS,
    session_operations: SESSION_OPERATIONS,
    demos: DEMOS,
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
