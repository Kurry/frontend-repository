// TaskGrove - State Management (Svelte 5 Runes)

import Papa from 'papaparse';
import { TagUpsertSchema, TaskUpsertSchema } from './schemas.js';

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

function normalizeTaskInput(input) {
  const value = typeof input === 'string' ? { title: input } : (input || {});
  const parsed = TaskUpsertSchema.safeParse({
    title: String(value.title || '').trim(),
    status: value.status || 'todo',
    priority: value.priority || 'medium',
    dueDate: value.dueDate || ''
  });
  return parsed.success ? parsed.data : null;
}

function requireTaskInput(input) {
  const value = typeof input === 'string' ? { title: input } : (input || {});
  const parsed = TaskUpsertSchema.safeParse({
    title: String(value.title || '').trim(),
    status: value.status || 'todo',
    priority: value.priority || 'medium',
    dueDate: value.dueDate || ''
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  }
  return parsed.data;
}

export function createNode(input) {
  const task = normalizeTaskInput(input);
  if (!task) return null;
  return {
    id: generateId(),
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    children: [],
    collapsed: false,
    completed: task.status === 'done',
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
  showGrovePanel = $state(false);
  grovePanelFormat = $state('grove-json');

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

  addRootTask(input) {
    const task = normalizeTaskInput(input);
    if (!task) {
      this.addToast('Task title must be 1 to 120 characters');
      return false;
    }
    // Prevent exact duplicate root task titles (idempotent)
    if (this.tasks.some(t => t.title === task.title)) {
      this.addToast('A task with this name already exists');
      return false;
    }
    this.tasks = [...this.tasks, createNode(task)];
    this._save();
    this.addToast('Task created');
    return true;
  }

  addChildTask(parentId, input) {
    const task = normalizeTaskInput(input);
    if (!task) return false;
    const result = this._mutateTree(this.tasks, parentId, (parent) => {
      // Prevent exact duplicate sibling titles
      if (parent.children.some(c => c.title === task.title)) {
        this.addToast('A sibling task with this name already exists');
        return false;
      }
      parent.children = [...parent.children, createNode(task)];
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
    let node = findNode(this.tasks, nodeId);
    if (!node) {
      for (const a of this.archive) {
        const an = findNode([a.branch], nodeId);
        if (an) {
          node = an;
          break;
        }
      }
    }
    if (!node) return false;

    const task = normalizeTaskInput({
      title,
      status: node.status,
      priority: node.priority,
      dueDate: node.dueDate,
    });
    if (!task) {
      this.addToast('Task title must be 1 to 120 characters');
      return false;
    }

    node.title = task.title;
    this._save();
    return true;
  }

  updateTask(nodeId, input) {
    let node = findNode(this.tasks, nodeId);
    if (!node) {
      for (const a of this.archive) {
        node = findNode([a.branch], nodeId);
        if (node) break;
      }
    }
    if (!node) return false;

    const task = normalizeTaskInput(input);
    if (!task) {
      this.addToast('Task fields are invalid');
      return false;
    }

    node.title = task.title;
    node.status = task.status;
    node.priority = task.priority;
    node.dueDate = task.dueDate;
    node.completed = isLeaf(node) ? task.status === 'done' : completionPercent(node) >= 100;
    this._save();
    this.addToast('Task updated');
    return true;
  }

  toggleComplete(nodeId) {
    const node = findNode(this.tasks, nodeId);
    if (!node) return;
    if (!isLeaf(node)) return; // parents auto-computed
    node.completed = !node.completed;
    node.status = node.completed ? 'done' : 'todo';
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
    const parsed = TagUpsertSchema.safeParse({
      name: String(name || '').trim(),
      color: color || TAG_COLORS[this.tags.length % TAG_COLORS.length]
    });
    if (!parsed.success) {
      this.addToast(parsed.error.issues[0]?.message || 'Tag is invalid');
      return false;
    }
    if (this.tags.some(t => t.name.toLowerCase() === parsed.data.name.toLowerCase())) {
      this.addToast('Tag already exists');
      return false;
    }
    this.tags = [...this.tags, {
      id: generateId(),
      name: parsed.data.name,
      color: parsed.data.color
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

  _exportNode(node) {
    return {
      id: node.id,
      title: node.title,
      status: node.status || (node.completed ? 'done' : 'todo'),
      priority: node.priority || 'medium',
      dueDate: node.dueDate || '',
      completed: !!node.completed,
      collapsed: !!node.collapsed,
      tags: (node.tags || []).map(tagId => this.getTagById(tagId)?.name).filter(Boolean),
      children: node.children.map(child => this._exportNode(child))
    };
  }

  exportGroveJson() {
    return JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      theme: this.theme,
      tags: this.tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })),
      tasks: this.tasks.map(task => this._exportNode(task)),
      archive: this.archive.map(entry => this._exportNode(entry.branch))
    }, null, 2);
  }

  exportGroveCsv() {
    const rows = [];
    const visit = (node, parentId, archived) => {
      rows.push({
        id: node.id,
        title: node.title,
        status: node.status || (node.completed ? 'done' : 'todo'),
        priority: node.priority || 'medium',
        dueDate: node.dueDate || '',
        parentId: parentId || '',
        completed: String(!!node.completed),
        collapsed: String(!!node.collapsed),
        tags: (node.tags || []).map(tagId => this.getTagById(tagId)?.name).filter(Boolean).join('|'),
        archived: String(archived)
      });
      node.children.forEach(child => visit(child, node.id, archived));
    };
    this.tasks.forEach(task => visit(task, '', false));
    this.archive.forEach(entry => visit(entry.branch, '', true));
    return Papa.unparse(rows, {
      columns: ['id', 'title', 'status', 'priority', 'dueDate', 'parentId', 'completed', 'collapsed', 'tags', 'archived']
    });
  }

  _importNode(raw, tagIdsByName) {
    const task = requireTaskInput(raw);
    if (typeof raw.id !== 'string' || !raw.id) throw new Error('task id is required');
    if (typeof raw.completed !== 'boolean') throw new Error('task completed must be boolean');
    if (typeof raw.collapsed !== 'boolean') throw new Error('task collapsed must be boolean');
    if (!Array.isArray(raw.tags) || raw.tags.length > 5) throw new Error('task tags must be an array of at most 5 names');
    if (!Array.isArray(raw.children)) throw new Error('task children must be an array');
    const tagIds = raw.tags.map(name => tagIdsByName.get(name));
    if (tagIds.some(id => !id) || new Set(tagIds).size !== tagIds.length) {
      throw new Error('task tags must be unique existing tag names');
    }
    const node = createNode(task);
    node.id = raw.id;
    node.completed = raw.completed;
    node.collapsed = raw.collapsed;
    node.tags = tagIds;
    node.children = raw.children.map(child => this._importNode(child, tagIdsByName));
    if (node.children.length === 0 && node.completed !== (node.status === 'done')) {
      throw new Error('leaf completed must match status done');
    }
    return node;
  }

  importGrove(content, format) {
    try {
      if (format === 'grove-json') {
        const document = JSON.parse(content);
        if (document.schemaVersion !== 1) return { error: 'schemaVersion must equal 1' };
        if (!['light', 'dark', 'forest'].includes(document.theme)) return { error: 'theme must be light, dark, or forest' };
        if (!Array.isArray(document.tags) || !Array.isArray(document.tasks) || !Array.isArray(document.archive)) {
          return { error: 'tags, tasks, and archive must be arrays' };
        }
        const tags = document.tags.map(tag => {
          const parsed = TagUpsertSchema.safeParse(tag);
          if (!parsed.success || typeof tag.id !== 'string' || !tag.id) {
            throw new Error('tag id, name, or color is invalid');
          }
          return { id: tag.id, ...parsed.data };
        });
        if (new Set(tags.map(tag => tag.name.toLowerCase())).size !== tags.length) {
          return { error: 'tag names must be unique case-insensitively' };
        }
        const tagIdsByName = new Map(tags.map(tag => [tag.name, tag.id]));
        const tasks = document.tasks.map(task => this._importNode(task, tagIdsByName));
        const archive = document.archive.map(branch => ({ id: generateId(), branch: this._importNode(branch, tagIdsByName), archivedAt: Date.now() }));
        this.tags = tags;
        this.tasks = tasks;
        this.archive = archive;
        this.theme = document.theme;
      } else if (format === 'grove-csv') {
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        if (parsed.errors.length) return { error: `CSV import: ${parsed.errors[0].message}` };
        const expected = ['id', 'title', 'status', 'priority', 'dueDate', 'parentId', 'completed', 'collapsed', 'tags', 'archived'];
        if (expected.some((field, index) => parsed.meta.fields?.[index] !== field)) return { error: `CSV header must be ${expected.join(',')}` };
        const tagNamesByRow = new Map();
        const importedTagNames = new Map();
        for (const row of parsed.data) {
          const tagNames = String(row.tags || '').split('|').filter(Boolean);
          const uniqueNames = new Set(tagNames.map(name => name.toLowerCase()));
          if (tagNames.length > 5 || uniqueNames.size !== tagNames.length) {
            return { error: 'CSV tags must contain at most 5 unique names' };
          }
          for (const name of tagNames) {
            const key = name.toLowerCase();
            const color = TAG_COLORS[importedTagNames.size % TAG_COLORS.length];
            if (!TagUpsertSchema.safeParse({ name, color }).success) return { error: 'CSV tag name must be 1 to 40 characters' };
            if (!importedTagNames.has(key)) importedTagNames.set(key, name);
          }
          tagNamesByRow.set(row, tagNames);
        }
        const tags = [...importedTagNames.values()].map((name, index) => ({
          id: generateId(), name, color: TAG_COLORS[index % TAG_COLORS.length]
        }));
        const tagIdsByName = new Map(tags.map(tag => [tag.name.toLowerCase(), tag.id]));
        const byId = new Map();
        for (const row of parsed.data) {
          if (!row.id || byId.has(row.id)) return { error: 'CSV id must be present and unique' };
          if (!['true', 'false'].includes(row.completed) || !['true', 'false'].includes(row.collapsed) || !['true', 'false'].includes(row.archived)) {
            return { error: 'CSV completed, collapsed, and archived must be true or false' };
          }
          const task = requireTaskInput(row);
          const tagIds = tagNamesByRow.get(row).map(name => tagIdsByName.get(name.toLowerCase()));
          const node = createNode(task);
          node.id = row.id;
          node.completed = row.completed === 'true';
          node.collapsed = row.collapsed === 'true';
          node.tags = tagIds;
          byId.set(node.id, { node, row });
        }
        const tasks = [];
        const archived = [];
        for (const { node, row } of byId.values()) {
          if (row.parentId) {
            const parent = byId.get(row.parentId);
            if (!parent) return { error: `CSV parentId not found: ${row.parentId}` };
            parent.node.children.push(node);
          } else if (row.archived === 'true') archived.push({ id: generateId(), branch: node, archivedAt: Date.now() });
          else tasks.push(node);
        }
        const completionIsValid = node => (
          node.children.length === 0 ? node.completed === (node.status === 'done') : node.children.every(completionIsValid)
        );
        if (![...tasks, ...archived.map(entry => entry.branch)].every(completionIsValid)) {
          return { error: 'CSV leaf completed must match status done' };
        }
        this.tasks = tasks;
        this.archive = archived;
        this.tags = tags;
      } else {
        return { error: `unsupported import format: ${format}` };
      }
      this.zoomedNodeId = null;
      this.searchQuery = '';
      this.activeTagFilters = [];
      this._save();
      this.addToast('Grove imported');
      return { error: null };
    } catch (error) {
      return { error: `Import failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

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
