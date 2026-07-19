// WebMCP surface for SideDock (contract zto-webmcp-v1).
//
// Every tool below invokes the SAME Pinia store action the visible UI control
// uses -- there is no separate success path and no state the UI cannot produce.
// Destructive operations (delete workspace / folder / bookmark) require
// { confirm: true } to run, mirroring the app's own confirmation step.
//
// Deliberately NOT exposed (kept Playwright-observed per mechanics_exclusions):
//   * drag-to-move / drag-reorder gestures  (button ↑/↓ reorder IS exposed,
//     because that is a real non-drag control; the drag gesture is not)
//   * the inline-rename keystroke path (rename is exposed as a committed value,
//     not as a keydown stream)
//   * virtualized-list scrolling
//
// Modules bound here: browse-query-v1, entity-collection-v1, artifact-transfer-v1.

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1']

export function registerWebmcp(store) {
  const requireConfirm = (args) => {
    if (!args || args.confirm !== true) {
      return { ok: false, error: 'destructive operation requires { confirm: true }' }
    }
    return null
  }

  const findBookmark = (id) => {
    if (!store.activeWorkspace) return null
    return store.findItemById(id, store.activeWorkspace.items)
  }

  const TOOLS = {
    // ---------------- browse-query-v1 ----------------
    'browse.set-view': {
      module: 'browse-query-v1',
      operation: 'open',
      description: 'Switch the app between the full default view and the narrow Sidebar View panel.',
      parameters: { destination: { type: 'string', enum: ['default-view', 'sidebar-view'] } },
      handler(args) {
        const dest = args && args.destination
        if (dest !== 'default-view' && dest !== 'sidebar-view') {
          return { ok: false, error: 'unknown destination', allowed: ['default-view', 'sidebar-view'] }
        }
        const want = dest === 'sidebar-view'
        if (store.compactMode !== want) store.toggleCompactMode()
        return { ok: true, destination: dest, compactMode: store.compactMode }
      },
    },
    'browse.set-search-scope': {
      module: 'browse-query-v1',
      operation: 'filter',
      description: 'Set the search scope filter to the current workspace only or across all workspaces.',
      parameters: { scope: { type: 'string', enum: ['current', 'all'] } },
      handler(args) {
        const scope = args && args.scope
        if (scope !== 'current' && scope !== 'all') {
          return { ok: false, error: 'unknown scope', allowed: ['current', 'all'] }
        }
        store.searchScope = scope
        return { ok: true, searchScope: store.searchScope, resultCount: store.searchResults.length }
      },
    },
    'browse.search': {
      module: 'browse-query-v1',
      operation: 'search',
      description: 'Filter bookmarks by title or URL using the search field. Returns the matching bookmarks in the active scope.',
      parameters: { query: { type: 'string' } },
      handler(args) {
        store.searchQuery = (args && typeof args.query === 'string') ? args.query : ''
        return {
          ok: true,
          query: store.searchQuery,
          scope: store.searchScope,
          results: store.searchResults.map((b) => ({ id: b.id, title: b.title, url: b.url, workspace: b.workspaceName })),
        }
      },
    },

    // ---------------- entity-collection-v1 (bookmark) ----------------
    'entity.create-bookmark': {
      module: 'entity-collection-v1',
      operation: 'create',
      description: 'Add a bookmark to the active workspace (or into a folder by id). Title is optional; when blank it derives from the URL.',
      parameters: {
        url: { type: 'string' },
        title: { type: 'string' },
        folder: { type: 'string', description: 'optional parent folder id; omit for workspace root' },
      },
      handler(args) {
        args = args || {}
        const bm = store.createBookmark(args.url, (args.title || '').trim(), args.folder || null)
        if (!bm) return { ok: false, error: 'invalid or missing URL, or no active workspace' }
        return { ok: true, id: bm.id, title: bm.title, url: bm.url, folder: args.folder || null }
      },
    },
    'entity.select-bookmark': {
      module: 'entity-collection-v1',
      operation: 'select',
      description: 'Toggle selection of a bookmark by id (same as its selection checkbox).',
      parameters: { id: { type: 'string' } },
      handler(args) {
        const id = args && args.id
        if (!findBookmark(id)) return { ok: false, error: 'bookmark not found in active workspace' }
        store.toggleSelection(id)
        return { ok: true, id, selected: store.selectedItemIds.includes(id), selectedCount: store.selectedItemIds.length }
      },
    },
    'entity.update-bookmark': {
      module: 'entity-collection-v1',
      operation: 'update',
      description: 'Update a bookmark title and/or note (same commits as inline rename and inline note edit).',
      parameters: { id: { type: 'string' }, title: { type: 'string' }, note: { type: 'string' } },
      handler(args) {
        args = args || {}
        const bm = findBookmark(args.id)
        if (!bm || bm.type !== 'bookmark') return { ok: false, error: 'bookmark not found in active workspace' }
        if (typeof args.title === 'string') store.renameItem(args.id, args.title.trim())
        if (typeof args.note === 'string') store.updateBookmarkNote(args.id, args.note)
        return { ok: true, id: args.id, title: bm.title, note: bm.note }
      },
    },
    'entity.delete-bookmark': {
      module: 'entity-collection-v1',
      operation: 'delete',
      description: 'Delete a bookmark by id. Requires { confirm: true }.',
      parameters: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      handler(args) {
        const guard = requireConfirm(args)
        if (guard) return guard
        const bm = findBookmark(args.id)
        if (!bm) return { ok: false, error: 'bookmark not found in active workspace' }
        store.deleteItem(args.id)
        return { ok: true, id: args.id, deleted: !findBookmark(args.id) }
      },
    },
    'entity.toggle-pin': {
      module: 'entity-collection-v1',
      operation: 'toggle',
      description: 'Pin or unpin a bookmark (max 8 pinned). Same action as its pin control.',
      parameters: { id: { type: 'string' } },
      handler(args) {
        const bm = findBookmark(args && args.id)
        if (!bm || bm.type !== 'bookmark') return { ok: false, error: 'bookmark not found in active workspace' }
        store.togglePin(bm)
        return { ok: true, id: bm.id, pinned: store.isPinned(bm.id), pinnedCount: store.pinnedBookmarks.length }
      },
    },
    'entity.reorder-bookmark': {
      module: 'entity-collection-v1',
      operation: 'reorder',
      description: 'Move a bookmark or folder up or down within its list (same as its ↑/↓ controls, not the drag gesture).',
      parameters: { id: { type: 'string' }, direction: { type: 'string', enum: ['up', 'down'] } },
      handler(args) {
        args = args || {}
        if (!store.findItemById(args.id, store.activeWorkspace?.items)) {
          return { ok: false, error: 'item not found in active workspace' }
        }
        if (args.direction !== 'up' && args.direction !== 'down') {
          return { ok: false, error: 'direction must be up or down' }
        }
        store.reorderItem(args.id, args.direction === 'up' ? -1 : 1)
        return { ok: true, id: args.id, direction: args.direction }
      },
    },

    // ---------------- entity-collection-v1 (workspace + folder, same store actions) ----------------
    'workspace.create': {
      module: 'entity-collection-v1',
      operation: 'create',
      description: 'Create a color-coded workspace and make it active.',
      parameters: { name: { type: 'string' }, color: { type: 'string', description: 'hex accent color, e.g. #2563EB' } },
      handler(args) {
        args = args || {}
        const ws = store.createWorkspace((args.name || '').trim() || 'New workspace', args.color || '#E54610')
        return { ok: true, id: ws.id, name: ws.name, color: ws.color, active: store.activeWorkspaceId === ws.id }
      },
    },
    'workspace.select': {
      module: 'entity-collection-v1',
      operation: 'select',
      description: 'Switch the active workspace by id (same as clicking its tab).',
      parameters: { id: { type: 'string' } },
      handler(args) {
        const ws = store.workspaces.find((w) => w.id === (args && args.id))
        if (!ws) return { ok: false, error: 'workspace not found' }
        store.activeWorkspaceId = ws.id
        return { ok: true, id: ws.id, name: ws.name }
      },
    },
    'workspace.update': {
      module: 'entity-collection-v1',
      operation: 'update',
      description: 'Rename a workspace and/or change its accent color.',
      parameters: { id: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' } },
      handler(args) {
        args = args || {}
        const ws = store.workspaces.find((w) => w.id === args.id)
        if (!ws) return { ok: false, error: 'workspace not found' }
        if (typeof args.name === 'string') store.renameWorkspace(args.id, args.name.trim())
        if (typeof args.color === 'string') store.setWorkspaceColor(args.id, args.color)
        return { ok: true, id: ws.id, name: ws.name, color: ws.color }
      },
    },
    'workspace.delete': {
      module: 'entity-collection-v1',
      operation: 'delete',
      description: 'Delete a workspace and all its contents. Requires { confirm: true }.',
      parameters: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      handler(args) {
        const guard = requireConfirm(args)
        if (guard) return guard
        const existed = store.workspaces.some((w) => w.id === args.id)
        if (!existed) return { ok: false, error: 'workspace not found' }
        store.deleteWorkspace(args.id)
        return { ok: true, id: args.id, deleted: !store.workspaces.some((w) => w.id === args.id), remaining: store.workspaces.length }
      },
    },
    'folder.create': {
      module: 'entity-collection-v1',
      operation: 'create',
      description: 'Create a folder in the active workspace, optionally nested inside a parent folder by id.',
      parameters: { parentId: { type: 'string', description: 'optional parent folder id; omit for workspace root' } },
      handler(args) {
        const folder = store.createFolder((args && args.parentId) || null)
        if (!folder) return { ok: false, error: 'no active workspace' }
        return { ok: true, id: folder.id, name: folder.name, parentId: (args && args.parentId) || null }
      },
    },
    'folder.update': {
      module: 'entity-collection-v1',
      operation: 'update',
      description: 'Rename a folder (same commit as inline rename).',
      parameters: { id: { type: 'string' }, name: { type: 'string' } },
      handler(args) {
        args = args || {}
        const item = store.findItemById(args.id, store.activeWorkspace?.items)
        if (!item || item.type !== 'folder') return { ok: false, error: 'folder not found in active workspace' }
        store.renameItem(args.id, (args.name || '').trim())
        return { ok: true, id: args.id, name: item.name }
      },
    },
    'folder.delete': {
      module: 'entity-collection-v1',
      operation: 'delete',
      description: 'Delete a folder and everything inside it. Requires { confirm: true }.',
      parameters: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      handler(args) {
        const guard = requireConfirm(args)
        if (guard) return guard
        const item = store.findItemById(args.id, store.activeWorkspace?.items)
        if (!item || item.type !== 'folder') return { ok: false, error: 'folder not found in active workspace' }
        store.deleteItem(args.id)
        return { ok: true, id: args.id, deleted: !store.findItemById(args.id, store.activeWorkspace?.items) }
      },
    },

    // ---------------- artifact-transfer-v1 ----------------
    'artifact.import': {
      module: 'artifact-transfer-v1',
      operation: 'import',
      description: 'Import a Netscape-format bookmarks HTML string into the active workspace (same action as the Import bookmarks file picker).',
      parameters: { mode: { type: 'string', enum: ['netscape-html'] }, html: { type: 'string' } },
      handler(args) {
        args = args || {}
        if (args.mode && args.mode !== 'netscape-html') {
          return { ok: false, error: 'unsupported import mode', allowed: ['netscape-html'] }
        }
        if (typeof args.html !== 'string' || !args.html.trim()) {
          return { ok: false, error: 'html content required' }
        }
        const count = store.importBookmarks(args.html)
        return { ok: true, mode: 'netscape-html', imported: count }
      },
    },
    'artifact.export': {
      module: 'artifact-transfer-v1',
      operation: 'export',
      description: 'Export the current workspace or all workspaces as a Netscape-format bookmarks HTML download (same action as the Export controls).',
      parameters: { format: { type: 'string', enum: ['netscape-html'] }, scope: { type: 'string', enum: ['current', 'all'] } },
      handler(args) {
        args = args || {}
        if (args.format && args.format !== 'netscape-html') {
          return { ok: false, error: 'unsupported export format', allowed: ['netscape-html'] }
        }
        const scope = args.scope === 'all' ? 'all' : 'current'
        store.exportBookmarks(scope)
        return { ok: true, format: 'netscape-html', scope }
      },
    },
  }

  window.webmcp_session_info = function () {
    return {
      contract_version: CONTRACT_VERSION,
      app: 'sidedock',
      modules: MODULES,
      tools: Object.keys(TOOLS),
      state: {
        workspaceCount: store.workspaces.length,
        activeWorkspaceId: store.activeWorkspaceId,
        activeWorkspaceName: store.activeWorkspace ? store.activeWorkspace.name : null,
        compactMode: store.compactMode,
        searchScope: store.searchScope,
        pinnedCount: store.pinnedBookmarks.length,
      },
    }
  }

  window.webmcp_list_tools = function () {
    return Object.keys(TOOLS).map((name) => {
      const t = TOOLS[name]
      return { name, module: t.module, operation: t.operation, description: t.description, input_schema: { type: 'object', properties: t.parameters } }
    })
  }

  window.webmcp_invoke_tool = function (name, args) {
    const t = TOOLS[name]
    if (!t) return { ok: false, error: 'unknown tool: ' + name, tools: Object.keys(TOOLS) }
    try {
      return t.handler(args || {})
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) }
    }
  }

  // Optional navigator.modelContext mirror (non-fatal if unsupported).
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = navigator.modelContext || {}
      navigator.modelContext.sidedockTools = window.webmcp_list_tools()
    }
  } catch (e) { /* ignore */ }
}
