// WebMCP surface for the TaskGrove oracle.
//
// Every tool drives the SAME store actions the visible controls call
// (store.addRootTask, store.addChildTask, store.toggleComplete,
// store.archiveBranch, store.restoreBranch, store.reparent,
// store.toggleNodeTag, store.setSearchQuery, store.toggleTagFilter,
// store.cycleTheme, store.zoomTo). It never fabricates a success state the
// UI would not otherwise reach: delete/archive require confirm=true, and
// every tool returns the same post-condition data a human would see
// on-screen. Exposed on window as webmcp_session_info / webmcp_list_tools /
// webmcp_invoke_tool. Contract version zto-webmcp-v1.

import { store } from './lib/store.svelte.js';
import { TaskUpsertSchema } from './lib/schemas.js';

const CONTRACT_VERSION = 'zto-webmcp-v1';

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function findAnywhere(id) {
  let node = findNode(store.tasks, id);
  if (node) return node;
  for (const a of store.archive) {
    node = findNode([a.branch], id);
    if (node) return node;
  }
  return null;
}

function nodeSummary(node) {
  if (!node) return null;
  return {
    id: node.id,
    title: node.title,
    completed: node.completed,
    collapsed: node.collapsed,
    tags: node.tags,
    childCount: node.children.length,
  };
}

// ---- entity-collection-v1 --------------------------------------------------

function entityCreate(args) {
  const title = String(args.title ?? '').trim();
  const status = args.status != null ? String(args.status) : 'todo';
  const priority = args.priority != null ? String(args.priority) : 'medium';
  const dueDate = args.dueDate != null ? String(args.dueDate) : '';
  const parsed = TaskUpsertSchema.safeParse({ title, status, priority, dueDate });

  const parentId = args.parentId != null ? String(args.parentId) : null;
  if (!parsed.success) {
    const error = parsed.error.issues.map(issue => issue.message).join(', ');
    return { ok: false, error };
  }
  const payload = parsed.data;

  if (!parentId) {
    if (store.tasks.some(task => task.title === payload.title)) {
      return { ok: false, error: 'a task with this name already exists' };
    }
    const before = store.tasks.length;
    const created = store.addRootTask(payload);
    if (!created) return { ok: false, error: 'task could not be created' };
    return { ok: true, operation: 'create', scope: 'root', created, taskCount: store.tasks.length, delta: store.tasks.length - before };
  }

  const parent = findNode(store.tasks, parentId);
  if (!parent) return { ok: false, error: `parent not found: ${parentId}` };
  if (parent.children.some(child => child.title === payload.title)) {
    return { ok: false, error: 'a sibling task with this name already exists' };
  }
  const before = parent.children.length;
  const created = store.addChildTask(parentId, payload);
  if (!created) return { ok: false, error: 'child task could not be created' };
  const parentAfter = findNode(store.tasks, parentId);
  return { ok: true, operation: 'create', scope: 'child', created, childCount: parentAfter ? parentAfter.children.length : before };
}

function entitySelect(args) {
  const id = String(args.id ?? '');
  const node = findAnywhere(id);
  if (!node) return { ok: false, error: `node not found: ${id}` };
  return { ok: true, operation: 'select', node: nodeSummary(node) };
}

function entityUpdate(args) {
  const id = String(args.id ?? '');
  const field = String(args.field ?? 'title');
  const node = findAnywhere(id);
  if (!node) return { ok: false, error: `node not found: ${id}` };
  if (field === 'title') {
    const title = String(args.value ?? '').trim();
    if (!title) return { ok: false, error: 'title value is required' };
    const updated = store.updateTaskTitle(id, title);
    if (!updated) return { ok: false, error: 'title must be 1 to 120 characters' };
    return { ok: true, operation: 'update', field: 'title', node: nodeSummary(findAnywhere(id)) };
  }
  if (['status', 'priority', 'dueDate'].includes(field)) {
    const value = String(args.value ?? '');
    const updated = store.updateTask(id, { title: node.title, status: node.status, priority: node.priority, dueDate: node.dueDate, [field]: value });
    if (!updated) return { ok: false, error: `invalid ${field} value` };
    return { ok: true, operation: 'update', field, node: nodeSummary(findAnywhere(id)) };
  }
  if (field === 'reparent') {
    const newParentId = args.value != null ? String(args.value) : null;
    store.reparent(id, newParentId === '' ? null : newParentId);
    return { ok: true, operation: 'update', field: 'reparent', node: nodeSummary(findAnywhere(id)) };
  }
  return { ok: false, error: `unsupported field: ${field}` };
}

function entityDelete(args) {
  const id = String(args.id ?? '');
  if (args.confirm !== true) return { ok: false, error: 'confirm=true is required to delete' };
  const node = findNode(store.tasks, id);
  if (!node) return { ok: false, error: `node not found: ${id}` };
  store.deleteTask(id);
  return { ok: true, operation: 'delete', id, stillPresent: !!findNode(store.tasks, id) };
}

function entityToggle(args) {
  const id = String(args.id ?? '');
  const kind = String(args.kind ?? 'complete');
  const node = findNode(store.tasks, id);
  if (!node) return { ok: false, error: `node not found: ${id}` };
  if (kind === 'complete') {
    store.toggleComplete(id);
    return { ok: true, operation: 'toggle', kind: 'complete', node: nodeSummary(findNode(store.tasks, id)) };
  }
  if (kind === 'collapse') {
    store.toggleCollapse(id);
    return { ok: true, operation: 'toggle', kind: 'collapse', node: nodeSummary(findNode(store.tasks, id)) };
  }
  if (kind === 'archive') {
    const isLeaf = node.children.length === 0;
    const isComplete = isLeaf ? node.completed : (() => {
      const leaves = [];
      (function collect(n) { if (n.children.length === 0) leaves.push(n); else n.children.forEach(collect); })(node);
      return leaves.length > 0 && leaves.every(l => l.completed);
    })();
    if (!node.children.length || !isComplete) return { ok: false, error: 'branch is not fully complete; Archive is unavailable' };
    store.archiveBranch(id);
    return { ok: true, operation: 'toggle', kind: 'archive', id, inMainTree: !!findNode(store.tasks, id), archiveCount: store.archive.length };
  }
  if (kind === 'restore') {
    const archiveId = args.archiveId != null ? String(args.archiveId) : id;
    const entry = store.archive.find(a => a.id === archiveId);
    if (!entry) return { ok: false, error: `archive entry not found: ${archiveId}` };
    store.restoreBranch(archiveId);
    return { ok: true, operation: 'toggle', kind: 'restore', archiveId, archiveCount: store.archive.length, taskCount: store.tasks.length };
  }
  if (kind === 'tag') {
    const tagId = String(args.tagId ?? '');
    if (!tagId) return { ok: false, error: 'tagId is required' };
    store.toggleNodeTag(id, tagId);
    return { ok: true, operation: 'toggle', kind: 'tag', node: nodeSummary(findAnywhere(id)) };
  }
  return { ok: false, error: `unsupported kind: ${kind}` };
}

// A tag is a reusable entity too: create/update(select-color)/delete.
function tagCreate(args) {
  const name = String(args.name ?? '').trim();
  const color = args.color != null ? String(args.color) : undefined;
  if (!name) return { ok: false, error: 'name is required' };
  const before = store.tags.length;
  const created = store.addTag(name, color);
  return { ok: created, operation: 'create', scope: 'tag', tagCount: store.tags.length, delta: store.tags.length - before };
}

function tagDelete(args) {
  const tagId = String(args.tagId ?? '');
  if (args.confirm !== true) return { ok: false, error: 'confirm=true is required to delete a tag' };
  if (!store.tags.some(t => t.id === tagId)) return { ok: false, error: `tag not found: ${tagId}` };
  store.deleteTag(tagId);
  return { ok: true, operation: 'delete', scope: 'tag', tagId, tagCount: store.tags.length };
}

// ---- browse-query-v1 -------------------------------------------------------

function browseOpen(args) {
  const destination = String(args.destination ?? '');
  if (destination === 'grove-panel') {
    store.showGrovePanel = true;
    return { ok: true, operation: 'open', destination, panelOpen: store.showGrovePanel };
  }
  if (destination === 'root') {
    store.zoomTo(null);
    return { ok: true, operation: 'open', destination, zoomed: store.zoomedNodeId };
  }
  const node = findNode(store.tasks, destination);
  if (!node) return { ok: false, error: `unknown destination: ${destination}` };
  if (!node.children.length) return { ok: false, error: 'destination has no children to zoom into' };
  store.zoomTo(destination);
  return { ok: true, operation: 'open', destination, zoomed: store.zoomedNodeId, breadcrumb: store.breadcrumbPath.map(n => n.title) };
}

function browseSearch(args) {
  const query = String(args.query ?? '');
  store.setSearchQuery(query);
  return { ok: true, operation: 'search', query, matches: query ? 'see visible tree for highlighted/dimmed state' : 'cleared' };
}

function browseApplyFilter(args) {
  const tagId = String(args.tagId ?? '');
  if (!tagId) return { ok: false, error: 'tagId is required' };
  if (!store.activeTagFilters.includes(tagId)) store.toggleTagFilter(tagId);
  return { ok: true, operation: 'apply_filter', activeTagFilters: [...store.activeTagFilters] };
}

function browseClearFilter(_args) {
  store.activeTagFilters = [];
  return { ok: true, operation: 'clear_filter', activeTagFilters: [...store.activeTagFilters] };
}

function browseSetTheme(args) {
  const theme = String(args.theme ?? '').toLowerCase();
  const themes = ['light', 'dark', 'forest'];
  if (!themes.includes(theme)) return { ok: false, error: `unknown theme: ${theme}` };
  while (store.theme !== theme) store.cycleTheme();
  return { ok: true, operation: 'set_theme', theme: store.theme };
}

// ---- registry --------------------------------------------------------------

const TOOLS = [
  {
    name: 'entity-create',
    description: 'Create a root task (args.title) or, with args.parentId, add a child task under an existing node — same as "New Root Task" / "Add Child".',
    handler: entityCreate,
  },
  {
    name: 'entity-select',
    description: 'Look up a task node by id (args.id) and return its visible state.',
    handler: entitySelect,
  },
  {
    name: 'entity-update',
    description: 'Update a task node: args.field "title" (args.value new title, double-click-to-edit path) or "reparent" (args.value new parent id or null for root, same as Move To…).',
    handler: entityUpdate,
  },
  {
    name: 'entity-delete',
    description: 'Delete a leaf task (args.id, args.confirm must be true) — same as the Delete control.',
    handler: entityDelete,
  },
  {
    name: 'entity-toggle',
    description: 'Toggle a node state: args.kind "complete" (leaf checkbox), "collapse" (chevron), "archive" (args.id, only when the branch is fully complete), "restore" (args.archiveId), or "tag" (args.id, args.tagId — attach/detach, max 5 per node).',
    handler: entityToggle,
  },
  {
    name: 'entity-tag-create',
    description: 'Create a reusable tag (args.name, optional args.color) in the Tag Manager.',
    handler: tagCreate,
  },
  {
    name: 'entity-tag-delete',
    description: 'Delete a reusable tag (args.tagId, args.confirm must be true) — removes it from every node.',
    handler: tagDelete,
  },
  {
    name: 'browse-open',
    description: 'Open the Grove package panel (args.destination: "grove-panel"), zoom in to a node branch (a node id), or zoom back to the true root ("root").',
    handler: browseOpen,
  },
  {
    name: 'browse-search',
    description: 'Set the Smart Search query (args.query); empty string clears it.',
    handler: browseSearch,
  },
  {
    name: 'browse-apply_filter',
    description: 'Turn on a tag filter chip (args.tagId) in the toolbar.',
    handler: browseApplyFilter,
  },
  {
    name: 'browse-clear_filter',
    description: 'Clear all active tag filter chips.',
    handler: browseClearFilter,
  },
  {
    name: 'browse-set_theme',
    description: 'Cycle to a named theme (args.theme: light|dark|forest) — same as the Theme control.',
    handler: browseSetTheme,
  },
];

function artifactExport(args) {
  const format = String(args.format ?? '');
  if (format === 'grove-json') {
    store.grovePanelFormat = format;
    store.showGrovePanel = true;
    return { ok: true, operation: 'export', format, content: store.exportGroveJson() };
  } else if (format === 'grove-csv') {
    store.grovePanelFormat = format;
    store.showGrovePanel = true;
    return { ok: true, operation: 'export', format, content: store.exportGroveCsv() };
  }
  return { ok: false, error: `unsupported export format: ${format}` };
}

function artifactImport(args) {
  const format = String(args.format ?? '');
  const content = String(args.content ?? '');
  if (!content) return { ok: false, error: 'content is required' };

  if (format === 'grove-json' || format === 'grove-csv') {
    const res = store.importGrove(content, format);
    if (res.error) return { ok: false, error: res.error };
    return { ok: true, operation: 'import', format, taskCount: store.tasks.length };
  }
  return { ok: false, error: `unsupported import format: ${format}` };
}

function artifactCopy(args) {
  const format = String(args.format ?? '');
  if (format === 'grove-json') {
    return { ok: true, operation: 'copy', format, content: store.exportGroveJson() };
  } else if (format === 'grove-csv') {
    return { ok: true, operation: 'copy', format, content: store.exportGroveCsv() };
  }
  return { ok: false, error: `unsupported copy format: ${format}` };
}

TOOLS.push(
  {
    name: 'artifact-export',
    description: 'Export grove JSON or CSV. Format must be "grove-json" or "grove-csv".',
    handler: artifactExport,
  },
  {
    name: 'artifact-import',
    description: 'Import grove JSON or CSV. Format must be "grove-json" or "grove-csv", with document string in args.content.',
    handler: artifactImport,
  },
  {
    name: 'artifact-copy',
    description: 'Copy grove JSON or CSV. Format must be "grove-json" or "grove-csv".',
    handler: artifactCopy,
  }
);

export function initWebMcp() {
  const w = window;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ['entity-collection-v1', 'browse-query-v1', 'artifact-transfer-v1'],
    tools: TOOLS.map((t) => t.name),
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
  w.webmcp_invoke_tool = (name, args = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
