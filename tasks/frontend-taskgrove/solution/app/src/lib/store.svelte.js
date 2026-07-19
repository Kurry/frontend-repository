// TaskGrove - State Management (Svelte 5 Runes)

let idCounter = 0;
function generateId() {
  return `tg_${Date.now()}_${++idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Tree Traversal Helpers ---

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function findParent(nodes, id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return { parent, siblings: parent ? parent.children : nodes };
    const found = findParent(node.children, id, node);
    if (found) return found;
  }
  return null;
}

function getDescendantLeaves(node) {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(getDescendantLeaves);
}

function countLeaves(node) {
  if (node.children.length === 0) return 1;
  return node.children.reduce((s, c) => s + countLeaves(c), 0);
}

function countCompletedLeaves(node) {
  if (node.children.length === 0) return node.completed ? 1 : 0;
  return node.children.reduce((s, c) => s + countCompletedLeaves(c), 0);
}

function completionPercent(node) {
  const total = countLeaves(node);
  if (total === 0) return 0;
  return Math.round((countCompletedLeaves(node) / total) * 100);
}

function isLeaf(node) {
  return node.children.length === 0;
}

function isNodeDescendant(ancestorId, descendantId, nodes) {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  return findNode(ancestor.children, descendantId) !== null;
}

function getPathToNode(nodes, targetId, path = []) {
  for (const node of nodes) {
    if (node.id === targetId) return [...path, node];
    const found = getPathToNode(node.children, targetId, [...path, node]);
    if (found.length > 0) return found;
  }
  return [];
}

function collectAllNodes(nodes, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    result.push(...collectAllNodes(node.children, depth + 1));
  }
  return result;
}

function nodeMatchesSearch(node, query) {
  if (!query || !query.trim()) return true;
  return node.title.toLowerCase().includes(query.toLowerCase().trim());
}

function subtreeHasMatch(node, query) {
  if (nodeMatchesSearch(node, query)) return true;
  return node.children.some(c => subtreeHasMatch(c, query));
}

function subtreeHasTagMatch(node, tagFilters) {
  if (!tagFilters || tagFilters.size === 0) return true;
  if (node.tags && node.tags.some(t => tagFilters.has(t))) return true;
  return node.children.some(c => subtreeHasTagMatch(c, tagFilters));
}

const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
];

const STORAGE_KEY = 'taskgrove_data';

export function createNode(title) {
  return {
    id: generateId(),
    title: title.trim(),
    children: [],
    collapsed: false,
    completed: false,
    tags: []
  };
}

// --- Store Class ---

class TaskStore {
  tasks = $state([]);
  tags = $state([]);
  archive = $state([]);
  theme = $state('light');
  zoomedNodeId = $state(null);
  searchQuery = $state('');
  activeTagFilters = $state([]);
  toasts = $state([]);
  showTagManager = $state(false);
  moveToSourceId = $state(null);

  constructor() {
    this._load();
  }

  _load() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.tasks) this.tasks = data.tasks;
      if (data.tags) this.tags = data.tags;
      if (data.archive) this.archive = data.archive;
      if (data.theme) this.theme = data.theme;
    } catch (_e) {
      // ignore corrupt data
    }
  }

  _save() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks: this.tasks,
        tags: this.tags,
        archive: this.archive,
        theme: this.theme
      }));
    } catch (_e) {
      // ignore
    }
  }

  // --- Toasts ---

  addToast(message) {
    const id = generateId();
    this.toasts = [...this.toasts, { id, message }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 2500);
  }

  // --- CRUD ---

  addRootTask(title) {
    if (!title || !title.trim()) return false;
    // Prevent exact duplicate root task titles (idempotent)
    if (this.tasks.some(t => t.title === title.trim())) {
      this.addToast('A task with this name already exists');
      return false;
    }
    this.tasks = [...this.tasks, createNode(title)];
    this._save();
    this.addToast('Task created');
    return true;
  }

  addChildTask(parentId, title) {
    if (!title || !title.trim()) return false;
    const result = this._mutateTree(this.tasks, parentId, (parent) => {
      // Prevent exact duplicate sibling titles
      if (parent.children.some(c => c.title === title.trim())) {
        this.addToast('A sibling task with this name already exists');
        return false;
      }
      parent.children = [...parent.children, createNode(title)];
      parent.collapsed = false;
      return true;
    });
    if (result) {
      this.tasks = result;
      this._save();
      this.addToast('Child task added');
    }
    return !!result;
  }

  deleteTask(nodeId) {
    const result = this._removeNode(this.tasks, nodeId);
    if (result) {
      this.tasks = result;
      this._save();
      this.addToast('Task deleted');
    }
  }

  updateTaskTitle(nodeId, title) {
    if (!title || !title.trim()) return;
    const node = findNode(this.tasks, nodeId);
    if (node) node.title = title.trim();
    // Also check archive
    if (!node) {
      for (const a of this.archive) {
        const an = findNode([a.branch], nodeId);
        if (an) { an.title = title.trim(); break; }
      }
    }
    this._save();
  }

  toggleComplete(nodeId) {
    const node = findNode(this.tasks, nodeId);
    if (!node) return;
    if (!isLeaf(node)) return; // parents auto-computed
    node.completed = !node.completed;
    this._save();
  }

  toggleCollapse(nodeId) {
    const node = findNode(this.tasks, nodeId);
    if (node && node.children.length > 0) {
      node.collapsed = !node.collapsed;
      this._save();
    }
  }

  // --- Reorder ---

  moveUp(nodeId) {
    this.tasks = this._moveSibling(this.tasks, nodeId, -1);
    this._save();
  }

  moveDown(nodeId) {
    this.tasks = this._moveSibling(this.tasks, nodeId, 1);
    this._save();
  }

  _moveSibling(nodes, nodeId, delta) {
    const copy = JSON.parse(JSON.stringify(nodes));
    const result = findParent(copy, nodeId);
    if (!result) return nodes;
    const idx = result.siblings.findIndex(n => n.id === nodeId);
    const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= result.siblings.length) return nodes;
    [result.siblings[idx], result.siblings[newIdx]] = [result.siblings[newIdx], result.siblings[idx]];
    return copy;
  }

  // --- Reparent ---

  reparent(nodeId, newParentId) {
    // Can't reparent to self or a descendant
    if (nodeId === newParentId) return;
    if (isNodeDescendant(nodeId, newParentId, this.tasks)) return;

    // Find and remove node from current position
    const source = findParent(this.tasks, nodeId);
    if (!source) return;
    const idx = source.siblings.findIndex(n => n.id === nodeId);
    if (idx < 0) return;

    const tasksCopy = JSON.parse(JSON.stringify(this.tasks));
    const sourceCopy = findParent(tasksCopy, nodeId);
    const idxCopy = sourceCopy.siblings.findIndex(n => n.id === nodeId);
    const [movingNode] = sourceCopy.siblings.splice(idxCopy, 1);

    if (!newParentId) {
      // Move to root
      this.tasks = [...tasksCopy, movingNode];
    } else {
      const target = findNode(tasksCopy, newParentId);
      if (!target) return;
      target.children = [...target.children, movingNode];
      target.collapsed = false;
      this.tasks = tasksCopy;
    }
    this._save();
    this.addToast('Task moved');
    this.moveToSourceId = null;
  }

  // --- Archive ---

  archiveBranch(nodeId) {
    const source = findParent(this.tasks, nodeId);
    if (!source) return;

    const tasksCopy = JSON.parse(JSON.stringify(this.tasks));
    const sourceCopy = findParent(tasksCopy, nodeId);
    const idxCopy = sourceCopy.siblings.findIndex(n => n.id === nodeId);
    if (idxCopy < 0) return;
    const [branch] = sourceCopy.siblings.splice(idxCopy, 1);

    this.tasks = tasksCopy;
    this.archive = [...this.archive, {
      id: generateId(),
      branch,
      archivedAt: Date.now()
    }];
    if (this.zoomedNodeId === nodeId) this.zoomedNodeId = null;
    this._save();
    this.addToast('Branch archived');
  }

  restoreBranch(archiveId) {
    const idx = this.archive.findIndex(a => a.id === archiveId);
    if (idx < 0) return;
    const archiveCopy = [...this.archive];
    const [archived] = archiveCopy.splice(idx, 1);
    this.archive = archiveCopy;
    this.tasks = [...this.tasks, archived.branch];
    this._save();
    this.addToast('Branch restored');
  }

  // --- Tags ---

  addTag(name, color) {
    if (!name || !name.trim()) return false;
    const trimmed = name.trim();
    if (this.tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      this.addToast('Tag already exists');
      return false;
    }
    this.tags = [...this.tags, {
      id: generateId(),
      name: trimmed,
      color: color || TAG_COLORS[this.tags.length % TAG_COLORS.length]
    }];
    this._save();
    return true;
  }

  deleteTag(tagId) {
    this.tags = this.tags.filter(t => t.id !== tagId);
    // Remove from all nodes in tasks and archive
    this._removeTagFromAll(this.tasks, tagId);
    this._removeTagFromAll(this.archive.map(a => a.branch), tagId);
    this.activeTagFilters = this.activeTagFilters.filter(id => id !== tagId);
    this._save();
  }

  _removeTagFromAll(nodes, tagId) {
    for (const node of nodes) {
      node.tags = node.tags.filter(t => t !== tagId);
      this._removeTagFromAll(node.children, tagId);
    }
  }

  toggleNodeTag(nodeId, tagId) {
    // Search in both tasks and archive
    let node = findNode(this.tasks, nodeId);
    if (!node) {
      for (const a of this.archive) {
        node = findNode([a.branch], nodeId);
        if (node) break;
      }
    }
    if (!node) return;
    const tags = [...node.tags];
    const idx = tags.indexOf(tagId);
    if (idx >= 0) {
      tags.splice(idx, 1);
    } else {
      if (tags.length >= 5) {
        this.addToast('Maximum 5 tags per task');
        return;
      }
      tags.push(tagId);
    }
    node.tags = tags;
    this._save();
  }

  // --- Search & Filter ---

  setSearchQuery(query) {
    this.searchQuery = query;
    // Auto-expand ancestors of matches
    if (query && query.trim()) {
      this._expandAncestorsWithMatch(this.tasks, query);
      this._save();
    }
  }

  _expandAncestorsWithMatch(nodes, query) {
    for (const node of nodes) {
      if (node.children.length > 0 && subtreeHasMatch(node, query)) {
        node.collapsed = false;
        this._expandAncestorsWithMatch(node.children, query);
      }
    }
  }

  toggleTagFilter(tagId) {
    const current = [...this.activeTagFilters];
    const idx = current.indexOf(tagId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(tagId);
    }
    this.activeTagFilters = current;

    // Auto-expand ancestors of tag matches
    if (current.length > 0) {
      this._expandAncestorsWithTagMatch(this.tasks, new Set(current));
      this._save();
    }
  }

  _expandAncestorsWithTagMatch(nodes, tagSet) {
    for (const node of nodes) {
      if (node.children.length > 0 && subtreeHasTagMatch(node, tagSet)) {
        node.collapsed = false;
        this._expandAncestorsWithTagMatch(node.children, tagSet);
      }
    }
  }

  get activeTagFilterSet() {
    return new Set(this.activeTagFilters);
  }

  // --- Zoom ---

  zoomTo(nodeId) {
    this.zoomedNodeId = nodeId || null;
  }

  get breadcrumbPath() {
    if (!this.zoomedNodeId) return [];
    return getPathToNode(this.tasks, this.zoomedNodeId);
  }

  get visibleTasks() {
    if (!this.zoomedNodeId) return this.tasks;
    const node = findNode(this.tasks, this.zoomedNodeId);
    return node ? [node] : this.tasks;
  }

  // --- Theme ---

  cycleTheme() {
    const themes = ['light', 'dark', 'forest'];
    const idx = themes.indexOf(this.theme);
    this.theme = themes[(idx + 1) % themes.length];
    this._save();
  }

  // --- Export ---

  exportBranch(nodeId) {
    const node = findNode(this.tasks, nodeId);
    if (!node) return '';
    let text = '';
    function build(n, depth) {
      const indent = '  '.repeat(depth);
      const check = isLeaf(n) ? (n.completed ? '[x] ' : '[ ] ') : '';
      text += `${indent}${check}${n.title}\n`;
      for (const child of n.children) {
        build(child, depth + 1);
      }
    }
    build(node, 0);
    return text;
  }

  // --- Move To targets ---

  getMoveToTargets(nodeId) {
    const targets = [{ id: null, title: '(Root Level)', depth: 0 }];
    function addNodes(nodes, depth) {
      for (const node of nodes) {
        if (node.id === nodeId) continue; // skip self
        // Check if this node is a descendant of nodeId (skip those too)
        targets.push({ id: node.id, title: node.title, depth });
        addNodes(node.children, depth + 1);
      }
    }
    addNodes(this.tasks, 1);
    return targets;
  }

  getTagById(tagId) {
    return this.tags.find(t => t.id === tagId);
  }

  // --- Internal Mutate Helper ---

  _mutateTree(nodes, targetId, fn, isSiblingOp = false) {
    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    const result = findParent(nodesCopy, targetId);
    if (!result) return null;
    const node = result.parent ? result.parent.children.find(c => c.id === targetId) : nodesCopy.find(c => c.id === targetId);
    if (!node && !isSiblingOp) return null;

    if (isSiblingOp) {
      const ok = fn(null, result.parent, result.siblings);
      return ok ? nodesCopy : null;
    }

    const ok = fn(node, result.parent, result.siblings);
    return ok ? nodesCopy : null;
  }

  _removeNode(nodes, nodeId) {
    const copy = JSON.parse(JSON.stringify(nodes));
    const result = findParent(copy, nodeId);
    if (!result) return null;
    const idx = result.siblings.findIndex(n => n.id === nodeId);
    if (idx < 0) return null;
    result.siblings.splice(idx, 1);
    return copy;
  }
}

// Singleton
export const store = new TaskStore();
