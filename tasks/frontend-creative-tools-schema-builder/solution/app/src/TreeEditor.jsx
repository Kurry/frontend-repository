// The schema tree editor: semantic tree roles, keyboard reachability,
// dnd-kit sibling reorder with a 200ms slide, 150ms add expansion and
// 120ms delete collapse, per-field validation annotations.
import React, { useMemo, useRef, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight, ChevronDown, Add, TrashCan, Checkbox, ArrowRight, ArrowLeft,
  Draggable, CheckmarkFilled, MisuseOutline,
} from '@carbon/icons-react';
import { useStore, displayedTree, isScrubbing } from './store.js';
import { findParent } from './lib.js';
import { TypeBadge, useDur, EmptyState } from './ui.jsx';

function focusRow(el, dir) {
  const rows = Array.from(document.querySelectorAll('[data-tree-row]'));
  const idx = rows.indexOf(el);
  const next = rows[idx + dir];
  if (next) next.focus();
}

function Row({ node, level, index, readOnly }) {
  const dur = useDur();
  const store = useStore;
  const selectedNodeId = store((s) => s.selectedNodeId);
  const selectedIds = store((s) => s.selectedIds);
  const collapsedIds = store((s) => s.collapsedIds);
  const run = store((s) => s.run);
  const density = store((s) => s.density);
  const lastDroppedId = store((s) => s.lastDroppedId);
  const selectNode = store((s) => s.selectNode);
  const toggleCollapsed = store((s) => s.toggleCollapsed);
  const toggleSelect = store((s) => s.toggleSelect);
  const setNodeRequired = store((s) => s.setNodeRequired);
  const doDeleteNode = store((s) => s.doDeleteNode);
  const addField = store((s) => s.addField);
  const nestNode = store((s) => s.nestNode);
  const unnestNode = store((s) => s.unnestNode);
  const renameNode = store((s) => s.renameNode);
  const toast = store((s) => s.toast);

  const isRoot = level === 0;
  const hasChildren = node.type === 'object' || node.type === 'array';
  const collapsed = collapsedIds.includes(node.id);
  const selected = selectedNodeId === node.id;
  const checked = selectedIds.includes(node.id);
  const ann = run ? run.annotations[node.id] : null;
  const isDropped = lastDroppedId === node.id;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.key);
  const [renameError, setRenameError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: isRoot || readOnly,
    transition: { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  function commitRename() {
    const r = renameNode(node.id, draft);
    if (!r.ok) {
      setRenameError(r.error);
      return;
    }
    setEditing(false);
    setRenameError('');
  }

  function onRowKey(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      selectNode(isRoot ? null : node.id);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (!isRoot && !readOnly) toggleSelect(node.id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(e.currentTarget, 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusRow(e.currentTarget, -1);
    } else if (e.key === 'ArrowRight' && hasChildren && collapsed) {
      e.preventDefault();
      toggleCollapsed(node.id);
    } else if (e.key === 'ArrowLeft' && hasChildren && !collapsed) {
      e.preventDefault();
      toggleCollapsed(node.id);
    }
  }

  const nestDisabled = isRoot || readOnly;
  const pad = density === 'compact' ? 'py-1' : 'py-1.5';

  return (
    <motion.li
      {...attributes}
      role="treeitem"
      aria-level={level + 1}
      aria-selected={selected}
      aria-expanded={hasChildren ? !collapsed : undefined}
      aria-label={isRoot ? `root object${node.required ? ', required' : ''}` : undefined}
      tabIndex={0}
      data-tree-row
      className={`tree-row group relative ${pad} ${selected ? 'tree-row-selected' : ''} ${checked ? 'tree-row-checked' : ''} ${isDropped ? 'row-settle' : ''}`}
      style={{ ...style, '--tree-level': level }}
      ref={setNodeRef}
      onKeyDown={onRowKey}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {!isRoot && (
          <button
            type="button"
            className="drag-grip tap"
            aria-label={`Drag to reorder ${node.key}`}
            title="Drag to reorder among siblings"
            tabIndex={readOnly ? -1 : 0}
            {...listeners}
          >
            <Draggable size={14} aria-hidden="true" />
          </button>
        )}
        {hasChildren ? (
          <button
            type="button"
            className="icon-btn tap"
            aria-label={collapsed ? `Expand ${node.key}` : `Collapse ${node.key}`}
            aria-expanded={!collapsed}
            onClick={() => toggleCollapsed(node.id)}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="w-7 shrink-0" aria-hidden="true" />
        )}
        {!isRoot && (
          <input
            type="checkbox"
            className="row-check tap"
            checked={checked}
            disabled={readOnly}
            aria-label={`Select ${node.key}`}
            onChange={() => toggleSelect(node.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {editing && !isRoot ? (
          <span className="min-w-0 flex-1">
            <input
              className="input input-inline"
              value={draft}
              autoFocus
              aria-label={`Rename ${node.key}`}
              aria-invalid={!!renameError}
              aria-describedby={renameError ? `rename-err-${node.id}` : undefined}
              onChange={(e) => {
                setDraft(e.target.value);
                setRenameError('');
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setRenameError('');
                }
              }}
              onBlur={commitRename}
            />
            {renameError && (
              <span className="field-error mt-0.5 block" id={`rename-err-${node.id}`} role="alert">
                {renameError}
              </span>
            )}
          </span>
        ) : (
          <button
            type="button"
            className="node-name min-w-0 truncate text-left"
            title={isRoot ? 'root' : node.key}
            onClick={() => {
              if (isRoot) {
                selectNode(null);
                return;
              }
              if (readOnly) {
                selectNode(node.id);
                return;
              }
              if (selected) {
                setDraft(node.key);
                setEditing(true);
              } else {
                selectNode(node.id);
              }
            }}
            onDoubleClick={() => {
              if (isRoot || readOnly) return;
              setDraft(node.key);
              setEditing(true);
            }}
          >
            <span className="truncate">{isRoot ? 'root' : node.key}</span>
            {node.required && (
              <span className="req-star" aria-label="required">
                *
              </span>
            )}
          </button>
        )}
        <TypeBadge type={node.type} />
        {node.type === 'array' && <span className="child-count">{(node.children || []).length} items schema</span>}
        {hasChildren && <span className="child-count">{(node.children || []).length}</span>}
        {ann && (
          <motion.span
            key={`${node.id}-${ann.pass}`}
            className={`ann-badge ${ann.pass ? 'ann-pass' : 'ann-fail'}`}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, duration: dur.fast }}
            role="img"
            aria-label={ann.pass ? `${node.key} passed validation` : `${node.key} failed validation`}
            title={ann.message || undefined}
          >
            {ann.pass ? <CheckmarkFilled size={13} aria-hidden="true" /> : <MisuseOutline size={13} aria-hidden="true" />}
            {!ann.pass && <span className="ann-msg">{ann.message}</span>}
          </motion.span>
        )}
        <span className="row-actions ml-auto flex shrink-0 items-center gap-0.5">
          {!isRoot && !readOnly && (
            <>
              <button
                type="button"
                className="icon-btn tap"
                aria-label={`Nest ${node.key} into the previous object sibling`}
                title="Nest into previous object sibling"
                onClick={() => {
                  const r = nestNode(node.id);
                  if (!r.ok) toast(r.error, 'error');
                }}
              >
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn tap"
                aria-label={`Un-nest ${node.key} to its parent's level`}
                title={level <= 1 ? 'Already at the top level' : "Un-nest to parent's level"}
                disabled={level <= 1}
                onClick={() => {
                  const r = unnestNode(node.id);
                  if (!r.ok) toast(r.error, 'error');
                }}
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-danger tap"
                aria-label={`Delete ${node.key}`}
                title="Delete field"
                aria-expanded={confirmDelete}
                aria-controls={`delete-confirm-${node.id}`}
                onClick={() => setConfirmDelete(true)}
              >
                <TrashCan size={14} aria-hidden="true" />
              </button>
            </>
          )}
          {hasChildren && !readOnly && (
            <button
              type="button"
              className="icon-btn tap"
              aria-label={`Add field inside ${isRoot ? 'the root object' : node.key}`}
              title="Add field"
              onClick={() => {
                const r = addField(node.id);
                if (!r.ok && r.error !== 'ignored-duplicate') toast(r.error, 'error');
              }}
            >
              <Add size={14} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {confirmDelete && (
          <motion.div
            id={`delete-confirm-${node.id}`}
            className="inline-delete-confirm"
            role="alertdialog"
            aria-label={`Confirm deletion of ${node.key}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.fast }}
          >
            <span>
              Delete <strong>{node.key}</strong>{(node.children || []).length ? ' and all nested fields' : ''}?
            </span>
            <span className="inline-confirm-actions">
              <button type="button" className="btn btn-ghost tap" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="btn btn-danger tap" onClick={() => doDeleteNode(node.id)}>Delete field</button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {hasChildren && !collapsed && (
        <ChildrenList nodes={node.children || []} level={level + 1} parentId={node.id} readOnly={readOnly} emptyHint={
          node.type === 'array' ? 'This array has no item schema — press + to define its items' : 'No fields yet — press + or Add field to create one'
        } />
      )}
      {hasChildren && collapsed && <span className="collapsed-note">… {(node.children || []).length} hidden</span>}
    </motion.li>
  );
}

function ChildrenList({ nodes, level, parentId, readOnly, emptyHint }) {
  const dur = useDur();
  return (
    <ul role="group" className="tree-group">
      <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence initial={false}>
          {nodes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: { height: { duration: dur.fast }, opacity: { duration: dur.fast, delay: Math.min(i * 0.012, 0.12) } } }}
              exit={{ height: 0, opacity: 0, transition: { height: { duration: dur.fast - 0.03 }, opacity: { duration: 0.09 } } }}
              style={{ overflow: 'hidden' }}
            >
              <Row node={n} level={level} index={i} readOnly={readOnly} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!nodes.length && (
          <li className="tree-empty-note" role="none">
            {emptyHint}
          </li>
        )}
      </SortableContext>
    </ul>
  );
}

export default function TreeEditor() {
  const store = useStore;
  const tree = store(displayedTree);
  const sc = store((s) => s.schemas.find((x) => x.id === s.activeId) || null);
  const readOnly = store(isScrubbing);
  const selectedIds = store((s) => s.selectedIds);
  const addField = store((s) => s.addField);
  const clearSelection = store((s) => s.clearSelection);
  const bulkSetRequired = store((s) => s.bulkSetRequired);
  const requestBulkDelete = store((s) => s.requestBulkDelete);
  const reorderNode = store((s) => s.reorderNode);
  const setLastDropped = store((s) => s.setLastDropped);
  const toast = store((s) => s.toast);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e) {
    const { active, over } = e;
    if (!over || active.id === over.id || !tree) return;
    const pa = findParent(tree, active.id);
    const po = findParent(tree, over.id);
    if (!pa || !po || pa.id !== po.id) return;
    const from = pa.children.findIndex((c) => c.id === active.id);
    const toIdx = pa.children.findIndex((c) => c.id === over.id);
    if (from < 0 || toIdx < 0) return;
    reorderNode(pa.id, from, toIdx);
    setLastDropped(active.id);
  }

  const rootChildren = useMemo(() => tree?.children || [], [tree]);

  if (!sc || !tree) {
    return (
      <EmptyState title="No schema loaded">
        <p className="muted max-w-md text-sm">
          The library on the left is empty. Create a schema to start building its fields, or import a SchemaPackage JSON.
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            className="bulk-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="toolbar"
            aria-label="Bulk actions for selected fields"
          >
            <span className="text-sm font-semibold">
              {selectedIds.length} selected
            </span>
            <button type="button" className="btn btn-ghost tap" onClick={() => bulkSetRequired(selectedIds, true)}>
              <Checkbox size={14} aria-hidden="true" /> Set required
            </button>
            <button type="button" className="btn btn-ghost tap" onClick={() => bulkSetRequired(selectedIds, false)}>
              Clear required
            </button>
            <button type="button" className="btn btn-danger tap" onClick={() => requestBulkDelete(selectedIds)}>
              <TrashCan size={14} aria-hidden="true" /> Delete {selectedIds.length} selected
            </button>
            <button type="button" className="btn btn-ghost tap ml-auto" onClick={clearSelection}>
              Clear selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {readOnly && (
        <div className="scrub-banner" role="status">
          Viewing an earlier state — the tree, compiled text, and example are read-only. Slide back to Current to edit.
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          <ul role="tree" aria-label={`Fields of ${sc.name}`}>
            <SortableContext items={rootChildren.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              <Row node={tree} level={0} index={0} readOnly={readOnly} />
            </SortableContext>
          </ul>
        </div>
      </DndContext>
    </div>
  );
}
