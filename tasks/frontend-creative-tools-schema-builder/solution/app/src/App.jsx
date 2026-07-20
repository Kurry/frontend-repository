import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Checkbox, InlineNotification, Modal, Select, SelectItem, Tab, TabList,
  TabPanel, TabPanels, Tabs, TextArea, TextInput, ToastNotification, Toggle,
} from '@carbon/react';
import {
  Add, ArrowDownLeft, ArrowUpRight, CaretDown, CaretRight, CheckmarkFilled,
  ChevronDown, ChevronUp, Close, Code, Copy, DataBase, DocumentExport,
  DocumentImport, Download, DragVertical, Edit, ErrorFilled, FolderOpen, List,
  Menu, PauseFilled, PlayFilled, Redo, Renew, Save, Settings, Split, TrashCan,
  Undo, WatsonHealthTextAnnotationToggle,
} from '@carbon/icons-react';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';
import {
  FIELD_TYPES, diffFields, fieldDefinitionSchema, findParent, flattenFields, metadataFieldSchema,
  versionSnapshotSchema,
} from './domain';
import {
  getActiveFields, getActiveSchema, getRollup, getSelectedField, getVersions,
  useSchemaStore,
} from './store';

const cx = (...classes) => classes.filter(Boolean).join(' ');
const waitFrame = () => new Promise((resolve) => setTimeout(resolve, 0));
// Shared with ConfigDrawerInner's exit transition so the workspace keeps its
// reserved padding for exactly as long as the sliding panel is still visible.
const CONFIG_DRAWER_EXIT_MS = 220;

// Mirrors `value` when true; when it flips to false, stays true for `delay`ms
// before following. Used to hold layout state (like drawer padding) until an
// exit animation actually finishes instead of collapsing the instant the
// underlying selection clears.
function useDelayedFalse(value, delay) {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    if (value) { setDelayed(true); return undefined; }
    const id = setTimeout(() => setDelayed(false), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return delayed;
}

// Guarantees overlay dismissal on Escape and returns focus to the opener when it
// closes, regardless of the underlying component's own focus handling.
function useOverlayDismiss(open, onClose) {
  const openerRef = useRef(null);
  const closeRef = useRef(onClose);
  const restoreTimerRef = useRef(null);
  closeRef.current = onClose;
  useEffect(() => {
    const clearRestore = () => {
      if (restoreTimerRef.current !== null) { clearTimeout(restoreTimerRef.current); restoreTimerRef.current = null; }
    };
    // Cancel any pending focus-restore from a previous close so a rapid
    // reopen can't have that stale callback yank focus away later.
    clearRestore();
    if (open) {
      openerRef.current = document.activeElement;
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); } };
      document.addEventListener('keydown', onKey, true);
      return () => document.removeEventListener('keydown', onKey, true);
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && typeof opener.focus === 'function') {
      restoreTimerRef.current = setTimeout(() => {
        restoreTimerRef.current = null;
        try { opener.focus(); } catch { /* opener detached */ }
      }, 0);
    }
    return clearRestore;
  }, [open]);
}

function IconAction({ label, children, className, ...props }) {
  return <button type="button" className={cx('icon-action focusable', className)} aria-label={label} title={label} {...props}>{children}</button>;
}

function FieldError({ children }) {
  return children ? <div className="field-error" role="alert">{children}</div> : null;
}

function AppHeader() {
  const active = useSchemaStore(getActiveSchema);
  const setSidebarOpen = useSchemaStore((s) => s.setSidebarOpen);
  const sidebarOpen = useSchemaStore((s) => s.sidebarOpen);
  const setExportOpen = useSchemaStore((s) => s.setExportOpen);
  const setImportPackageOpen = useSchemaStore((s) => s.setImportPackageOpen);
  const setPromptDrawerOpen = useSchemaStore((s) => s.setPromptDrawerOpen);
  return (
    <header className="top-header">
      <IconAction className="mobile-menu !text-white hover:!bg-white/15" label="Toggle schema library" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></IconAction>
      <div className="brand-mark" aria-hidden="true">S/</div>
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-.02em]">Schema Forge</h1>
        <div className="hidden text-[11px] text-[#b7b7ae] sm:block">Structured output workbench</div>
      </div>
      <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
        <span className="max-w-[180px] truncate text-xs text-[#c6c6be]">{active?.name || 'No active schema'}</span>
        <span className="h-4 w-px bg-white/20" />
      </div>
      <div className="desktop-actions flex items-center gap-2">
        <Button kind="ghost" size="sm" renderIcon={WatsonHealthTextAnnotationToggle} onClick={() => setPromptDrawerOpen(true)}>Prompt draft</Button>
        <Button kind="ghost" size="sm" renderIcon={DocumentImport} onClick={() => setImportPackageOpen(true)}>Import package</Button>
        <Button size="sm" renderIcon={DocumentExport} onClick={() => setExportOpen(true)} disabled={!active}>Export</Button>
      </div>
    </header>
  );
}

function SchemaLibrary() {
  const schemas = useSchemaStore((s) => s.schemas);
  const activeId = useSchemaStore((s) => s.activeSchemaId);
  const active = useSchemaStore(getActiveSchema);
  const fields = useSchemaStore((s) => s.metadataFields);
  const sidebarOpen = useSchemaStore((s) => s.sidebarOpen);
  const actions = useSchemaStore(useShallow((s) => ({
    select: s.selectSchema, create: s.createSchema, duplicate: s.duplicateSchema, delete: s.deleteSchema,
    setSidebarOpen: s.setSidebarOpen, setMetadataValue: s.setMetadataValue,
  })));
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <aside className={cx('sidebar', sidebarOpen && 'open')} aria-label="Schema library">
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <div className="eyebrow">Library</div>
          <h2 className="mt-1 text-base font-medium">Saved schemas</h2>
        </div>
        <Button hasIconOnly iconDescription="New schema" size="sm" renderIcon={Add} onClick={() => actions.create()} />
      </div>
      <div className="grid gap-1">
        {schemas.map((schema) => (
          <button key={schema.id} className={cx('library-item focusable', schema.id === activeId && 'active')} onClick={() => { actions.select(schema.id); actions.setSidebarOpen(false); }}>
            <span className="library-dot" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{schema.name}</span>
              <span className="block text-xs subtle">{flattenFields(schema.fields).length} fields</span>
            </span>
          </button>
        ))}
      </div>

      {active && <>
        <div className="mt-4 flex gap-2 px-2">
          <Button kind="tertiary" size="sm" renderIcon={Copy} onClick={() => actions.duplicate(active.id)} className="flex-1">Duplicate</Button>
          {!confirmDelete ? (
            <Button kind="danger--tertiary" size="sm" hasIconOnly iconDescription="Delete active schema" renderIcon={TrashCan} onClick={() => setConfirmDelete(true)} />
          ) : (
            <div className="flex items-center gap-1" role="alert">
              <Button kind="danger" size="sm" onClick={() => { actions.delete(active.id); setConfirmDelete(false); }}>Confirm</Button>
              <IconAction label="Cancel delete" onClick={() => setConfirmDelete(false)}><Close /></IconAction>
            </div>
          )}
        </div>
        <div className="my-5 border-t border-[#d3d2cb]" />
        <div className="px-2">
          <div className="eyebrow">Entry details</div>
          <p className="mt-1 text-xs subtle">Custom metadata travels with the SchemaPackage.</p>
        </div>
        <div className="mt-3 grid gap-3 px-2">
          {fields.map((field) => field.type === 'dropdown' ? (
            <Select key={field.id} id={`meta-${field.id}`} labelText={field.label} size="sm" value={active.metadata?.[field.label] || ''} onChange={(e) => actions.setMetadataValue(field.label, e.target.value)}>
              <SelectItem value="" text="Select a value" />
              {field.options?.map((option) => <SelectItem key={option} value={option} text={option} />)}
            </Select>
          ) : (
            <TextInput key={field.id} id={`meta-${field.id}`} labelText={field.label} size="sm" type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={active.metadata?.[field.label] || ''} onChange={(e) => actions.setMetadataValue(field.label, e.target.value)} />
          ))}
        </div>
        <MetadataBuilder />
      </>}
    </aside>
  );
}

function MetadataBuilder() {
  const addMetadata = useSchemaStore((s) => s.addMetadataField);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(metadataFieldSchema), defaultValues: { label: '', type: 'text', options: [] } });
  const type = watch('type');
  const submit = (data) => {
    const payload = { label: data.label, type: data.type, ...(data.type === 'dropdown' ? { options: String(data.options || '').split(',').map((x) => x.trim()) } : {}) };
    const result = metadataFieldSchema.safeParse(payload);
    if (!result.success) return;
    addMetadata(result.data); reset(); setOpen(false);
  };
  return (
    <div className="mt-5 px-2">
      <button className="flex w-full items-center justify-between border-t border-[#d3d2cb] py-3 text-left text-sm font-medium" onClick={() => setOpen(!open)} aria-expanded={open}>
        Metadata field builder {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && <form className="grid gap-3 pb-5" onSubmit={handleSubmit(submit)}>
        <TextInput id="metadata-label" labelText="Label" size="sm" invalid={!!errors.label} invalidText={errors.label?.message} {...register('label')} />
        <Select id="metadata-type" labelText="Type" size="sm" {...register('type')}>
          <SelectItem value="text" text="Text" /><SelectItem value="number" text="Number" /><SelectItem value="date" text="Date" /><SelectItem value="dropdown" text="Dropdown" />
        </Select>
        {type === 'dropdown' && <TextInput id="metadata-options" labelText="Options (comma separated)" size="sm" invalid={!!errors.options} invalidText={errors.options?.message} {...register('options', { setValueAs: (value) => String(value).split(',').map((item) => item.trim()) })} />}
        <Button type="submit" size="sm" kind="secondary" renderIcon={Add}>Add metadata field</Button>
      </form>}
    </div>
  );
}

function TreeEditor() {
  const active = useSchemaStore(getActiveSchema);
  const fields = useSchemaStore(getActiveFields);
  const selected = useSchemaStore((s) => s.selectedIds);
  const history = useSchemaStore((s) => s.history);
  const historyIndex = useSchemaStore((s) => s.historyIndex);
  const actions = useSchemaStore(useShallow((s) => ({
    add: s.addField, rename: s.renameSchema, reorder: s.reorderField, undo: s.undo, redo: s.redo,
    scrub: s.scrubHistory, bulkRequired: s.bulkRequired, bulkDelete: s.bulkDelete, clear: s.clearSelected,
  })));
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  if (!active) return (
    <main className="tree-panel">
      <div className="empty-state m-5">
        <DataBase size={28} className="mx-auto mb-3" />
        <h2 className="text-lg font-medium">No schema is loaded</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm subtle">The active schema was removed. Create a blank schema or select one from the library.</p>
        <Button className="mt-4" renderIcon={Add} onClick={() => useSchemaStore.getState().createSchema()}>Create schema</Button>
      </div>
    </main>
  );
  const undoLabel = historyIndex > 0 ? history[historyIndex].label : '';
  const redoLabel = historyIndex < history.length - 1 ? history[historyIndex + 1].label : '';
  return (
    <main className="tree-panel" aria-label="Schema tree editor">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Active schema</div>
            <input className="schema-name-input" aria-label="Schema name" value={active.name} onChange={(e) => actions.rename(e.target.value)} />
          </div>
          <Button size="sm" renderIcon={Add} onClick={() => actions.add(null)}>Add field</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" kind="ghost" renderIcon={Undo} disabled={!undoLabel} onClick={actions.undo} title={undoLabel ? `Undo ${undoLabel}` : 'Nothing to undo'}>Undo{undoLabel ? ` · ${undoLabel}` : ''}</Button>
          <Button size="sm" kind="ghost" renderIcon={Redo} disabled={!redoLabel} onClick={actions.redo} title={redoLabel ? `Redo ${redoLabel}` : 'Nothing to redo'}>Redo{redoLabel ? ` · ${redoLabel}` : ''}</Button>
          <div className="ml-auto flex min-w-[190px] flex-1 items-center gap-3 sm:max-w-[310px]">
            <label htmlFor="history-slider" className="whitespace-nowrap text-xs subtle">History</label>
            <input id="history-slider" aria-label="History timeline" type="range" min="0" max={Math.max(0, history.length - 1)} value={historyIndex} onChange={(e) => actions.scrub(Number(e.target.value))} className="min-w-0 flex-1 accent-[#171715]" />
            <span className="max-w-[110px] truncate text-xs">{history[historyIndex]?.label}</span>
          </div>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active: drag, over }) => over && drag.id !== over.id && actions.reorder(drag.id, over.id)}>
        <div className="tree-scroll">
          <div className="root-card" role="tree" aria-label={`${active.name} schema hierarchy`}>
            <div className="root-row">
              <FolderOpen size={18} className="mr-2" />
              <span className="font-medium">root</span>
              <span className="type-tag type-object ml-2">object</span>
              <span className="ml-auto text-xs subtle">{fields.length} top-level fields</span>
            </div>
            {fields.length ? <TreeLevel fields={fields} level={1} /> : (
              <div className="p-8 text-center">
                <p className="text-sm font-medium">This object has no fields</p>
                <p className="mt-1 text-xs subtle">Add the first FieldDefinition to begin.</p>
                <Button className="mt-4" size="sm" kind="tertiary" renderIcon={Add} onClick={() => actions.add(null)}>Add first field</Button>
              </div>
            )}
          </div>
        </div>
      </DndContext>
      <AnimatePresence>
        {selected.length > 0 && <motion.div className="context-bar" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
          <span className="mr-auto text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" kind="ghost" onClick={() => actions.bulkRequired(true)}>Set required</Button>
          <Button size="sm" kind="ghost" onClick={() => actions.bulkRequired(false)}>Clear required</Button>
          {!bulkConfirm ? <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} onClick={() => setBulkConfirm(true)}>Delete selected</Button> : <>
            <span className="text-xs">Delete {selected.length} fields?</span>
            <Button size="sm" kind="danger" onClick={() => { actions.bulkDelete(); setBulkConfirm(false); }}>Confirm</Button>
          </>}
          <IconAction className="!text-white hover:!bg-white/20" label="Clear selection" onClick={actions.clear}><Close /></IconAction>
        </motion.div>}
      </AnimatePresence>
      <WorkflowZone />
    </main>
  );
}

function TreeLevel({ fields, level }) {
  return (
    <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
      <AnimatePresence initial={false}>
        {fields.map((field) => <TreeNode key={field.id} field={field} level={level} />)}
      </AnimatePresence>
    </SortableContext>
  );
}

function TreeNode({ field, level }) {
  const selectedNodeId = useSchemaStore((s) => s.selectedNodeId);
  const multi = useSchemaStore((s) => s.selectedIds);
  const collapsed = useSchemaStore((s) => s.collapsedIds.includes(field.id));
  const annotation = useSchemaStore((s) => s.validation.annotations[field.id]);
  const fields = useSchemaStore(getActiveFields);
  const actions = useSchemaStore(useShallow((s) => ({ select: s.selectNode, toggleMulti: s.toggleSelected, toggleCollapse: s.toggleCollapsed, update: s.updateField, add: s.addField, delete: s.deleteField, nest: s.nestField, unnest: s.unnestField })));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.key);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const info = findParent(fields, field.id);
  const index = info?.siblings.findIndex((item) => item.id === field.id) ?? 0;
  const canNest = index > 0 && info?.siblings[index - 1]?.type === 'object';
  const canUnnest = !!info?.parent;
  const hasChildren = ['object', 'array'].includes(field.type);
  const commitRename = () => {
    const candidate = { ...field, key: draft };
    const parsed = fieldDefinitionSchema.safeParse(candidate);
    if (!parsed.success) { setError(parsed.error.issues.find((x) => x.path[0] === 'key')?.message || parsed.error.issues[0].message); return; }
    if (info?.siblings.some((item) => item.id !== field.id && item.key === draft)) { setError('Key must be unique among siblings'); return; }
    actions.update(field.id, { key: draft }, 'Rename field'); setEditing(false); setError('');
  };
  return (
    <motion.div ref={setNodeRef} className="tree-row-wrap" layout="position" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: isDragging ? .45 : 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .15, layout: { duration: .2 } }} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div
        className={cx('tree-row', selectedNodeId === field.id && 'selected', annotation?.status === 'pass' && 'validation-pass', annotation?.status === 'fail' && 'validation-fail')}
        style={{ paddingLeft: `${Math.min(6 + (level - 1) * 17, 68)}px` }} role="treeitem" aria-level={level} aria-selected={selectedNodeId === field.id} aria-expanded={hasChildren ? !collapsed : undefined}
        tabIndex={0}
        onClick={() => actions.select(field.id)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actions.select(field.id); }
          else if (hasChildren && e.key === 'ArrowRight' && collapsed) { e.preventDefault(); actions.toggleCollapse(field.id); }
          else if (hasChildren && e.key === 'ArrowLeft' && !collapsed) { e.preventDefault(); actions.toggleCollapse(field.id); }
        }}
      >
        <button className="drag-handle focusable" aria-label={`Drag ${field.key}`} {...attributes} {...listeners}><DragVertical size={16} /></button>
        <Checkbox id={`multi-${field.id}`} labelText={`Select ${field.key}`} hideLabel checked={multi.includes(field.id)} onChange={(_, data) => actions.toggleMulti(field.id)} onClick={(e) => e.stopPropagation()} />
        {hasChildren ? <IconAction label={collapsed ? `Expand ${field.key}` : `Collapse ${field.key}`} onClick={(e) => { e.stopPropagation(); actions.toggleCollapse(field.id); }}>{collapsed ? <CaretRight size={16} /> : <CaretDown size={16} />}</IconAction> : <span className="w-7" />}
        {editing ? (
          <input autoFocus className="min-w-0 flex-1 border-b border-[#171715] bg-transparent px-1 py-1 text-sm outline-none" aria-label="Field key" value={draft} onChange={(e) => { setDraft(e.target.value); setError(''); }} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(field.key); setEditing(false); setError(''); } }} onClick={(e) => e.stopPropagation()} />
        ) : (
          <button className="tree-name focusable flex-1" title={field.key} onClick={(e) => { e.stopPropagation(); actions.select(field.id); setDraft(field.key); setEditing(true); }}>{field.key}<span className="sr-only"> Edit key</span>{field.required && <span className="req-star" aria-label="required">*</span>}</button>
        )}
        <span className={`type-tag type-${field.type}`}>{field.type}</span>
        <div className="scale-[.72]" onClick={(e) => e.stopPropagation()} title="Toggle required">
          <Toggle id={`required-${field.id}`} size="sm" labelText={`${field.key} required`} hideLabel toggled={field.required} onToggle={(value) => actions.update(field.id, { required: value }, value ? 'Set required' : 'Clear required')} />
        </div>
        {annotation?.status === 'pass' && <CheckmarkFilled className="motion-pop text-[#198038]" size={17} aria-label="Validation passed" />}
        {annotation?.status === 'fail' && <ErrorFilled className="motion-pop text-[#da1e28]" size={17} aria-label={annotation.message} />}
        <div className="secondary-actions flex">
          {field.type === 'object' && <IconAction label={`Add child to ${field.key}`} onClick={(e) => { e.stopPropagation(); actions.add(field.id); }}><Add size={16} /></IconAction>}
          <IconAction label={`Nest ${field.key}`} disabled={!canNest} onClick={(e) => { e.stopPropagation(); actions.nest(field.id); }}><ArrowDownLeft size={16} /></IconAction>
          <IconAction label={`Un-nest ${field.key}`} disabled={!canUnnest} onClick={(e) => { e.stopPropagation(); actions.unnest(field.id); }}><ArrowUpRight size={16} /></IconAction>
          {!confirmDelete ? <IconAction className="danger" label={`Delete ${field.key}`} onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}><TrashCan size={16} /></IconAction> : <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" kind="danger--ghost" onClick={() => actions.delete(field.id)}>Delete?</Button>
            <IconAction label="Cancel delete" onClick={() => setConfirmDelete(false)}><Close size={14} /></IconAction>
          </div>}
        </div>
      </div>
      {(error || annotation?.status === 'fail') && <div style={{ marginLeft: `${72 + (level - 1) * 17}px` }} className="pb-2 text-xs text-[#da1e28]" role="alert">{error || annotation.message}</div>}
      {hasChildren && !collapsed && field.children?.length > 0 && <div className="tree-guide"><TreeLevel fields={field.children} level={level + 1} /></div>}
    </motion.div>
  );
}

function OutputRegion() {
  const active = useSchemaStore(getActiveSchema);
  const activeTab = useSchemaStore((s) => s.activeTab);
  const setTab = useSchemaStore((s) => s.setTab);
  const compiledText = useSchemaStore((s) => s.compiledText());
  const exampleText = useSchemaStore((s) => JSON.stringify(s.examplePayload(), null, 2));
  const example = useMemo(() => JSON.parse(exampleText), [exampleText]);
  const instruction = useSchemaStore((s) => s.instruction());
  const regenerate = useSchemaStore((s) => s.regenerateExample);
  const insertPrompt = useSchemaStore((s) => s.insertPrompt);
  const showToast = useSchemaStore((s) => s.showToast);
  const tabs = ['schema', 'example', 'format'];
  const copy = async (text, label) => { await navigator.clipboard.writeText(text); showToast('success', `${label} copied`); };
  if (!active) return <section className="output-panel"><div className="empty-state m-5"><Code className="mx-auto mb-3" /><p className="text-sm">Select or create a schema to compile an output.</p></div></section>;
  return (
    <section className="output-panel" aria-label="Derived schema outputs">
      <div className="panel-header flex items-end justify-between">
        <div><div className="eyebrow">Live output</div><h2 className="panel-title mt-1">Registry-ready artifacts</h2></div>
        <span className="flex items-center gap-1 text-xs text-[#0e6027]"><span className="h-2 w-2 rounded-full bg-[#24a148]" /> Synced</span>
      </div>
      <Tabs className="output-tabs" selectedIndex={tabs.indexOf(activeTab)} onChange={({ selectedIndex }) => setTab(tabs[selectedIndex])}>
        <TabList aria-label="Output views" contained>
          <Tab>Schema</Tab><Tab>Example</Tab><Tab>Format prompt</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="code-toolbar"><span className="text-xs subtle">draft-07 · JSON</span><Button kind="ghost" size="sm" renderIcon={Copy} onClick={() => copy(compiledText, 'Compiled schema')}>Copy</Button></div>
            <motion.pre key={compiledText} className="code-surface" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .28 }}>{compiledText}</motion.pre>
          </TabPanel>
          <TabPanel>
            <div className="code-toolbar"><span className="text-xs subtle">Generated from every visible field</span><div className="flex gap-1"><Button kind="ghost" size="sm" renderIcon={Renew} onClick={regenerate}>Regenerate</Button><Button kind="ghost" size="sm" renderIcon={Copy} onClick={() => copy(JSON.stringify(example, null, 2), 'Example payload')}>Copy</Button></div></div>
            <motion.pre key={JSON.stringify(example)} className="code-surface" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .28 }}>{JSON.stringify(example, null, 2)}</motion.pre>
          </TabPanel>
          <TabPanel>
            <div className="code-toolbar"><span className="text-xs subtle">Paste-ready response instruction</span><Button kind="primary" size="sm" renderIcon={WatsonHealthTextAnnotationToggle} onClick={insertPrompt}>Insert into prompt draft</Button></div>
            <motion.pre key={instruction} className="code-surface !whitespace-pre-wrap !text-[#f4f4f4]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .28 }}>{instruction}</motion.pre>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </section>
  );
}

function FieldConfigDrawer() {
  const field = useSchemaStore(getSelectedField);
  return (
    <AnimatePresence>
      {field && <ConfigDrawerInner key={field.id} field={field} />}
    </AnimatePresence>
  );
}

function ConfigDrawerInner({ field }) {
  const fields = useSchemaStore(getActiveFields);
  const close = useSchemaStore((s) => s.selectNode);
  const update = useSchemaStore((s) => s.updateField);
  const { register, reset, setValue, getValues, watch, setError, clearErrors, formState: { errors } } = useForm({ resolver: zodResolver(fieldDefinitionSchema), mode: 'onChange' });
  const type = watch('type');
  const timer = useRef();
  useEffect(() => {
    reset({ ...field, enumValues: field.enumValues?.join('\n') || '' });
  }, [field.id, reset]);
  const commit = async () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await waitFrame();
      const raw = getValues();
      const candidate = {
        ...field, key: raw.key, type: raw.type, required: !!raw.required,
        ...(raw.description ? { description: raw.description } : {}),
        ...(raw.type === 'string' && raw.enumValues ? { enumValues: String(raw.enumValues).split('\n') } : {}),
        ...(raw.type === 'string' && raw.pattern ? { pattern: raw.pattern } : {}),
        ...(raw.type === 'number' && raw.minimum !== '' && raw.minimum !== undefined ? { minimum: Number(raw.minimum) } : {}),
        ...(raw.type === 'number' && raw.maximum !== '' && raw.maximum !== undefined ? { maximum: Number(raw.maximum) } : {}),
      };
      delete candidate.id;
      const parsed = fieldDefinitionSchema.safeParse(candidate);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => setError(issue.path[0] || 'key', { message: issue.message }));
        return;
      }
      const info = findParent(fields, field.id);
      if (info?.siblings.some((sibling) => sibling.id !== field.id && sibling.key === candidate.key)) { setError('key', { message: 'Key must be unique among siblings' }); return; }
      clearErrors(); update(field.id, parsed.data, 'Configure field');
    }, 80);
  };
  const templates = [
    { name: 'Email pattern', type: 'string', patch: { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', enumValues: '' } },
    { name: 'Percentage 0 to 100', type: 'number', patch: { minimum: 0, maximum: 100 } },
    { name: 'ISO date pattern', type: 'string', patch: { pattern: '^\\d{4}-\\d{2}-\\d{2}$', enumValues: '' } },
    { name: 'Non-empty string', type: 'string', patch: { pattern: '^.+$', enumValues: '' } },
    { name: 'Status enum', type: 'string', patch: { enumValues: 'pending\nrunning\ncomplete', pattern: '' } },
  ];
  const applyTemplate = async (template) => {
    setValue('type', template.type); Object.entries(template.patch).forEach(([key, value]) => setValue(key, value));
    await waitFrame(); commit(); useSchemaStore.getState().showToast('success', `${template.name} applied`);
  };
  const reg = (name, options) => {
    const props = register(name, options);
    return { ...props, onChange: (e) => { props.onChange(e); clearErrors(name); commit(); } };
  };
  return (
    <motion.aside className="config-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: CONFIG_DRAWER_EXIT_MS / 1000, ease: 'easeOut' }} aria-label={`Configure ${field.key}`}>
      <div className="drawer-header"><div><div className="eyebrow">FieldDefinition</div><h2 className="mt-1 text-lg font-medium">Configure field</h2></div><IconAction label="Close configuration" onClick={() => close(null)}><Close /></IconAction></div>
      <form className="form-stack" onSubmit={(e) => e.preventDefault()}>
        <TextInput id="config-key" labelText="Key" value={watch('key') || ''} invalid={!!errors.key} invalidText={errors.key?.message} {...reg('key')} />
        <Select id="config-type" labelText="Type" value={type || 'string'} invalid={!!errors.type} invalidText={errors.type?.message} {...reg('type')}>
          {FIELD_TYPES.map((item) => <SelectItem key={item} value={item} text={item} />)}
        </Select>
        <TextArea id="config-description" labelText="Description (optional)" rows={3} value={watch('description') || ''} {...reg('description')} />
        <Toggle id="config-required" labelText="Required field" toggled={!!watch('required')} onToggle={(value) => { setValue('required', value); commit(); }} />
        {type === 'string' && <div className="constraint-card">
          <div className="text-sm font-medium">String constraints</div>
          <TextArea id="config-enum" labelText="Enum values (one per line)" rows={3} value={watch('enumValues') || ''} invalid={!!errors.enumValues} invalidText={errors.enumValues?.message} {...reg('enumValues')} />
          <TextInput id="config-pattern" labelText="Pattern" value={watch('pattern') || ''} invalid={!!errors.pattern} invalidText={errors.pattern?.message} {...reg('pattern')} />
        </div>}
        {type === 'number' && <div className="constraint-card">
          <div className="text-sm font-medium">Number constraints</div>
          <TextInput id="config-minimum" type="number" labelText="Minimum" value={watch('minimum') ?? ''} invalid={!!errors.minimum} invalidText={errors.minimum?.message} {...reg('minimum')} />
          <TextInput id="config-maximum" type="number" labelText="Maximum" value={watch('maximum') ?? ''} invalid={!!errors.maximum} invalidText={errors.maximum?.message} {...reg('maximum')} />
        </div>}
        <div>
          <div className="eyebrow mb-2">Constraint templates</div>
          <div className="grid gap-2">
            {templates.map((template) => <button type="button" key={template.name} className="template-button" onClick={() => applyTemplate(template)}><span className="block text-sm font-medium">{template.name}</span><span className="mt-1 block text-xs subtle">Apply a validated {template.type} preset</span></button>)}
          </div>
        </div>
      </form>
    </motion.aside>
  );
}

function WorkflowZone() {
  const panel = useSchemaStore((s) => s.workflowPanel);
  const open = useSchemaStore((s) => s.workflowOpen);
  const setWorkflow = useSchemaStore((s) => s.setWorkflow);
  const items = [
    ['versions', 'Versions', Save], ['playground', 'Playground', PlayFilled], ['import', 'Import example', DocumentImport],
  ];
  return (
    <section className="workflow-zone" aria-label="Schema workflows">
      <div className="workflow-nav">
        {items.map(([id, label, Icon]) => <button key={id} className={panel === id && open ? 'active' : ''} onClick={() => setWorkflow(id)}><span className="flex items-center gap-2"><Icon size={15} />{label}</span></button>)}
        <span className="ml-auto px-3 text-xs subtle">Session tools</span>
      </div>
      <AnimatePresence initial={false}>
        {open && <motion.div className="workflow-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          {panel === 'versions' && <VersionsPanel />}
          {panel === 'playground' && <PlaygroundPanel />}
          {panel === 'import' && <ImportExamplePanel />}
        </motion.div>}
      </AnimatePresence>
    </section>
  );
}

function VersionsPanel() {
  const versions = useSchemaStore(useShallow(getVersions));
  const save = useSchemaStore((s) => s.saveVersion);
  const diffA = useSchemaStore((s) => s.diffA);
  const diffB = useSchemaStore((s) => s.diffB);
  const setDiff = useSchemaStore((s) => s.setDiff);
  const allVersions = useSchemaStore((s) => s.versions);
  const results = useMemo(() => {
    const a = allVersions.find((v) => v.id === diffA);
    const b = allVersions.find((v) => v.id === diffB);
    return a && b ? diffFields(a.fields, b.fields) : [];
  }, [allVersions, diffA, diffB]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(versionSnapshotSchema), defaultValues: { name: '' } });
  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <form className="min-w-[230px] flex-1 surface-box p-4" onSubmit={handleSubmit((data) => { save(data); reset(); })}>
          <div className="eyebrow">Snapshot</div><h3 className="mt-1 text-base font-medium">Save this working state</h3>
          <div className="mt-3 flex items-start gap-2"><TextInput id="version-name" labelText="Version name" hideLabel invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} /><Button type="submit" renderIcon={Save}>Save version</Button></div>
        </form>
        <div className="min-w-[260px] flex-1 surface-box p-4">
          <div className="eyebrow">Version history</div>
          <div className="mt-2 grid gap-1">{versions.slice(0, 4).map((version) => <div key={version.id} className="flex items-center justify-between border-b border-[#e0dfd8] py-2 text-sm"><span>{version.name}</span><span className="text-xs subtle">{new Date(version.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>)}</div>
        </div>
      </div>
      {versions.length >= 1 && <div className="mt-4 surface-box p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select id="diff-from" labelText="Compare from" size="sm" value={diffA || versions[0].id} onChange={(e) => setDiff('a', e.target.value)}>{versions.map((v) => <SelectItem key={v.id} value={v.id} text={v.name} />)}</Select>
          <Select id="diff-to" labelText="Compare to" size="sm" value={diffB || versions[0].id} onChange={(e) => setDiff('b', e.target.value)}>{versions.map((v) => <SelectItem key={v.id} value={v.id} text={v.name} />)}</Select>
          <span className="mb-2 text-xs subtle">Structural diff</span>
        </div>
        <div className="mt-3 grid gap-2">
          {diffA === diffB || results.length === 0 ? <div className="empty-state !p-5 text-sm">No differences between these versions.</div> : results.map((item) => <div key={`${item.kind}-${item.path}`} className={`diff-${item.kind} flex items-center gap-3 p-3 text-sm`}><span className="status-pill bg-white/70">{item.kind}</span><strong>{item.path}</strong><span>{item.detail}</span></div>)}
        </div>
      </div>}
    </div>
  );
}

function ImportExamplePanel() {
  const draft = useSchemaStore((s) => s.importDraft);
  const error = useSchemaStore((s) => s.importError);
  const infer = useSchemaStore((s) => s.inferExample);
  const toggle = useSchemaStore((s) => s.toggleImportField);
  const apply = useSchemaStore((s) => s.applyImportDraft);
  const exampleForm = z.object({ text: z.string().min(1, 'Import example JSON is required') });
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(exampleForm), defaultValues: { text: '' } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="surface-box p-4" onSubmit={handleSubmit(({ text }) => infer(text))}>
        <div className="eyebrow">Inference source</div><h3 className="mt-1 text-base font-medium">Paste a JSON object</h3>
        <TextArea className="mt-3" id="import-example-json" labelText="Example JSON" rows={7} invalid={!!errors.text || !!error} invalidText={errors.text?.message || error} {...register('text')} />
        <Button className="mt-3" type="submit" renderIcon={Split}>Infer schema draft</Button>
      </form>
      <div className="surface-box p-4">
        <div className="eyebrow">Review draft</div>
        {!draft ? <div className="empty-state mt-3 !p-6 text-sm">Inferred fields appear here with accept and reject controls.</div> : <>
          <div className="mt-3 grid gap-2">{draft.fields.map((field) => <label key={field.id} className="flex cursor-pointer items-center gap-3 border border-[#deddd5] p-3 hover:bg-[#f1f0ea]"><Checkbox id={`infer-${field.id}`} labelText={`Accept ${field.key}`} hideLabel checked={draft.accepted[field.id]} onChange={() => toggle(field.id)} /><span className="flex-1 text-sm font-medium">{field.key}</span><span className={`type-tag type-${field.type}`}>{field.type}</span><span className="text-xs">{draft.accepted[field.id] ? 'Accept' : 'Reject'}</span></label>)}</div>
          <Button className="mt-3" renderIcon={CheckmarkFilled} onClick={apply}>Apply reviewed draft</Button>
        </>}
      </div>
    </div>
  );
}

function PlaygroundPanel() {
  const validation = useSchemaStore((s) => s.validation);
  const rollup = useSchemaStore(useShallow(getRollup));
  const actions = useSchemaStore(useShallow((s) => ({ setPayload: s.setPlaygroundPayload, start: s.startValidation, pause: s.pauseValidation, resume: s.resumeValidation, retry: s.retryValidation })));
  const [filter, setFilter] = useState('all');
  const payloadSchema = z.object({ payload: z.string().min(1, 'Playground payload is required') });
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(payloadSchema), defaultValues: { payload: validation.payloadText } });
  useEffect(() => setValue('payload', validation.payloadText), []);
  const timeline = filter === 'all' ? validation.timeline : validation.timeline.filter((e) => e.status === filter);
  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <form className="surface-box p-4" onSubmit={handleSubmit(({ payload }) => { actions.setPayload(payload); setTimeout(() => useSchemaStore.getState().startValidation(), 0); })}>
          <div className="eyebrow">Request body</div><h3 className="mt-1 text-base font-medium">Validate a payload</h3>
          <TextArea className="mt-3 font-mono" id="playground-payload" labelText="JSON payload" rows={8} invalid={!!errors.payload || !!validation.parseError} invalidText={errors.payload?.message || validation.parseError} {...register('payload', { onChange: (e) => actions.setPayload(e.target.value) })} />
          <div className="mt-3 flex gap-2">
            <Button type="submit" disabled={validation.status === 'running'} renderIcon={PlayFilled}>Run validation</Button>
            {validation.status === 'running' && (!validation.paused ? <Button type="button" kind="secondary" renderIcon={PauseFilled} onClick={actions.pause}>Pause</Button> : <Button type="button" kind="secondary" renderIcon={PlayFilled} onClick={actions.resume}>Resume</Button>)}
          </div>
        </form>
        <div className="surface-box p-4">
          <div className="flex items-center justify-between"><div><div className="eyebrow">Validation run</div><h3 className="mt-1 text-base font-medium">{rollup.checked} of {rollup.total} fields checked</h3></div><div className="text-right"><div className="text-2xl font-light">{rollup.failures}</div><div className="text-xs subtle">failures</div></div></div>
          <div className="mt-4 grid gap-2">
            {validation.steps.length === 0 ? <div className="empty-state !p-6 text-sm">Run validation to see one gateway check per top-level field.</div> : validation.steps.map((step, index) => <div key={step.fieldId} className="flex items-center gap-3 border border-[#deddd5] p-3">
              <span className={`status-pill status-${step.status}`}>{step.status}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{step.path}</span><span className="text-xs subtle">Attempt {step.attempts || 1}/3</span>{step.status === 'retrying' && <span className="text-xs text-[#8e6a00]">retry in {step.countdown}</span>}{step.status === 'failed' && <Button kind="ghost" size="sm" onClick={() => actions.retry(index)}>Retry</Button>}
              {step.message && <span className="sr-only">{step.message}</span>}
            </div>)}
          </div>
        </div>
      </div>
      {validation.timeline.length > 0 && <div className="mt-4 surface-box p-4">
        <div className="mb-4 flex items-center justify-between"><div><div className="eyebrow">Event timeline</div><h3 className="mt-1 text-base font-medium">Ordered transitions</h3></div><Select id="timeline-filter" labelText="Filter status" hideLabel size="sm" value={filter} onChange={(e) => setFilter(e.target.value)}><SelectItem value="all" text="All statuses" />{['running', 'retrying', 'complete', 'failed'].map((s) => <SelectItem key={s} value={s} text={s} />)}</Select></div>
        <div className="timeline">{timeline.map((item) => <div key={item.id} className={`timeline-event ${item.status}`}><div className="flex gap-3 text-sm"><strong>{item.field}</strong><span className={`status-pill status-${item.status}`}>{item.status}</span><span className="ml-auto text-xs subtle">{item.time}</span></div><p className="mt-1 text-xs subtle">{item.detail}</p></div>)}</div>
      </div>}
      <div className="sr-only" aria-live="assertive">{validation.steps.findLast?.((step) => step.status === 'failed')?.message || (validation.status === 'complete' ? `Validation complete with ${rollup.failures} failures` : '')}</div>
    </div>
  );
}

function ExportModal() {
  const open = useSchemaStore((s) => s.exportOpen);
  const close = useSchemaStore((s) => s.setExportOpen);
  const showToast = useSchemaStore((s) => s.showToast);
  const validation = useSchemaStore((s) => s.validation);
  const compiled = useSchemaStore((s) => s.compiledText());
  const packageText = useSchemaStore((s) => JSON.stringify(s.schemaPackage(), null, 2));
  const pkg = useMemo(() => JSON.parse(packageText), [packageText]);
  const instruction = useSchemaStore((s) => s.instruction());
  const [format, setFormat] = useState('package');
  useOverlayDismiss(open, () => close(false));
  const report = JSON.stringify({
    schemaName: pkg.name,
    payloadSummary: validation.payload ? { keys: Object.keys(validation.payload), fieldCount: Object.keys(validation.payload).length } : null,
    outcomes: validation.steps.map((step) => ({ field: step.path, status: step.status, attempts: step.attempts, message: step.message || null })),
    failureCount: validation.steps.filter((step) => step.status === 'failed').length,
  }, null, 2);
  const formats = {
    package: { label: 'SchemaPackage JSON', text: packageText, filename: `${pkg.name.replaceAll(' ', '-').toLowerCase()}.schema-package.json` },
    compiled: { label: 'Compiled schema', text: compiled, filename: `${pkg.name.replaceAll(' ', '-').toLowerCase()}.schema.json` },
    instruction: { label: 'Format instruction', text: instruction, filename: `${pkg.name.replaceAll(' ', '-').toLowerCase()}.prompt.txt` },
    ...(validation.status === 'complete' ? { report: { label: 'Validation report', text: report, filename: 'validation-report.json' } } : {}),
  };
  const current = formats[format] || formats.package;
  const copy = async () => { await navigator.clipboard.writeText(current.text); showToast('success', `${current.label} copied`); };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([current.text], { type: format === 'instruction' ? 'text/plain' : 'application/json' })); a.download = current.filename; a.click(); URL.revokeObjectURL(a.href); showToast('success', `${current.label} downloaded`); };
  return (
    <Modal open={open} passiveModal size="lg" onRequestClose={() => close(false)} modalHeading="Export session artifacts" modalLabel="Live compiled output">
      <div className="mb-4 flex flex-wrap gap-2">{Object.entries(formats).map(([id, item]) => <Button key={id} size="sm" kind={format === id ? 'primary' : 'tertiary'} onClick={() => setFormat(id)}>{item.label}</Button>)}</div>
      <p className="mb-3 text-sm subtle">This preview is compiled from the active in-memory session now.</p>
      <pre className="code-surface !max-h-[52vh] !min-h-[320px]">{current.text}</pre>
      <div className="mt-4 flex justify-end gap-2"><Button kind="secondary" renderIcon={Copy} onClick={copy}>Copy exact preview</Button><Button renderIcon={Download} onClick={download}>Download</Button></div>
    </Modal>
  );
}

function ImportPackageModal() {
  const open = useSchemaStore((s) => s.importPackageOpen);
  const close = useSchemaStore((s) => s.setImportPackageOpen);
  const importPackage = useSchemaStore((s) => s.importPackage);
  const packageError = useSchemaStore((s) => s.packageImportError);
  const schema = z.object({ text: z.string().min(1, 'SchemaPackage JSON is required') });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { text: '' } });
  useOverlayDismiss(open, () => { close(false); reset(); });
  return (
    <Modal open={open} passiveModal size="lg" onRequestClose={() => { close(false); reset(); }} modalHeading="Import SchemaPackage" modalLabel="schema-package-v1">
      <form onSubmit={handleSubmit(({ text }) => importPackage(text))}>
        <p className="mb-4 text-sm subtle">Paste the complete API-shaped package. The working tree changes only after every contract field validates.</p>
        <TextArea id="schema-package-json" labelText="SchemaPackage JSON" rows={14} invalid={!!errors.text || !!packageError} invalidText={errors.text?.message || packageError} {...register('text')} />
        <div className="mt-4 flex justify-end gap-2"><Button type="button" kind="secondary" onClick={() => close(false)}>Cancel</Button><Button type="submit" renderIcon={DocumentImport}>Import package</Button></div>
      </form>
    </Modal>
  );
}

function PromptDrawer() {
  const open = useSchemaStore((s) => s.promptDrawerOpen);
  const close = useSchemaStore((s) => s.setPromptDrawerOpen);
  const draft = useSchemaStore((s) => s.promptDraft);
  const setDraft = useSchemaStore((s) => s.setPromptDraft);
  useOverlayDismiss(open, () => close(false));
  if (!open) return null;
  return <><div className="overlay-backdrop" onClick={() => close(false)} /><aside className="prompt-drawer" aria-label="Prompt draft drawer"><div className="drawer-header"><div><div className="eyebrow">Working prompt</div><h2 className="mt-1 text-lg font-medium">Prompt draft</h2></div><IconAction label="Close prompt draft" onClick={() => close(false)}><Close /></IconAction></div><div className="p-5"><TextArea id="prompt-draft" labelText="Editable prompt draft" rows={20} value={draft} onChange={(e) => setDraft(e.target.value)} /><p className="mt-3 text-xs subtle">Format instructions append here without leaving the workbench.</p></div></aside></>;
}

function ToastHost() {
  const toast = useSchemaStore((s) => s.toast);
  const clear = useSchemaStore((s) => s.showToast);
  if (!toast) return null;
  return <div className="toast-wrap"><ToastNotification kind={toast.kind} title={toast.title} subtitle={toast.subtitle} timeout={0} onCloseButtonClick={() => useSchemaStore.setState({ toast: null })} /></div>;
}

export default function App() {
  const selectedNodeId = useSchemaStore((s) => !!s.selectedNodeId);
  const drawerOpen = useDelayedFalse(selectedNodeId, CONFIG_DRAWER_EXIT_MS);
  return (
    <MotionConfig reducedMotion="user">
    <div className="app-shell">
      <AppHeader />
      <div className={cx('workspace', drawerOpen && 'drawer-open')}><SchemaLibrary /><TreeEditor /><OutputRegion /></div>
      <FieldConfigDrawer />
      <ExportModal />
      <ImportPackageModal />
      <PromptDrawer />
      <ToastHost />
    </div>
    </MotionConfig>
  );
}
