import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowDown, ArrowUp, Archive, CheckCircle, ClipboardText, DownloadSimple, FileArrowUp, MagnifyingGlass, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { calculateDerived, repairSchema, taskInputSchema } from './store/schema';
import { currentArtifact, useGardenStore } from './store/gardenStore';
import { plots, statuses, type WorkTaskRecord } from './store/types';
import './webmcp';

const emptyTask = { title: '', description: '', status: 'draft', date: '2026-06-20', plot: 'North Beds', volunteers: 4, durationMinutes: 60 };

function TaskDialog({ editing, open, onOpenChange }: { editing: WorkTaskRecord | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createRecord = useGardenStore((state) => state.createRecord);
  const updateRecord = useGardenStore((state) => state.updateRecord);
  const { register, handleSubmit, reset, setError, formState: { errors, isValid } } = useForm<any>({ resolver: zodResolver(taskInputSchema), mode: 'onChange', defaultValues: emptyTask });

  useEffect(() => {
    reset(editing ? { title: editing.title, description: editing.description, status: editing.status, date: editing.date, plot: editing.plot, volunteers: editing.volunteers, durationMinutes: editing.durationMinutes } : emptyTask);
  }, [editing, open, reset]);

  const submit = handleSubmit((values) => {
    const result = editing ? updateRecord(editing.id, values) : createRecord(values);
    if (!result.ok) {
      Object.entries(result.errors ?? {}).forEach(([field, message]) => setError(field, { message }));
      return;
    }
    onOpenChange(false);
  });

  const fieldError = (name: string) => errors[name]?.message ? <span className="field-error" role="alert">{String(errors[name]?.message)}</span> : null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby="task-dialog-help">
          <div className="dialog-heading"><div><Dialog.Title>{editing ? 'Edit work task' : 'Create work task'}</Dialog.Title><Dialog.Description id="task-dialog-help">API-shaped workday request fields; every bound is validated before the collection changes.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close task form">×</Dialog.Close></div>
          <form onSubmit={submit} className="task-form" noValidate>
            <label>Title <input {...register('title')} aria-invalid={Boolean(errors.title)} maxLength={81} /></label>{fieldError('title')}
            <label>Description <textarea {...register('description')} aria-invalid={Boolean(errors.description)} maxLength={241} /></label>{fieldError('description')}
            <div className="form-grid">
              <label>Status <select {...register('status')}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label>Date <input type="date" min="2026-01-01" max="2026-12-31" {...register('date')} /></label>
              <label>Plot <select {...register('plot')}>{plots.map((plot) => <option key={plot}>{plot}</option>)}</select></label>
              <label>Volunteers <input type="number" min="1" max="20" {...register('volunteers')} /></label>
              <label>Duration (minutes) <input type="number" min="15" max="240" step="15" {...register('durationMinutes')} /></label>
            </div>
            {['status', 'date', 'plot', 'volunteers', 'durationMinutes'].map((name) => <span key={name}>{fieldError(name)}</span>)}
            <p className="schema-hint">Bounds: title 3–80, description 0–240, volunteers 1–20 (Greenhouse max 8), duration 15–240 in 15-minute steps.</p>
            <div className="dialog-actions"><Dialog.Close className="secondary-button" type="button">Cancel</Dialog.Close><button className="primary-button" disabled={!isValid}>{editing ? 'Save task changes' : 'Create work task'}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RepairDialog({ record, onClose }: { record: WorkTaskRecord | null; onClose: () => void }) {
  const resolveRecovery = useGardenStore((state) => state.resolveRecovery);
  const { register, handleSubmit, reset, setError, formState: { errors, isValid } } = useForm<any>({ resolver: zodResolver(repairSchema), mode: 'onChange', defaultValues: { repairNote: '' } });
  useEffect(() => reset({ repairNote: '' }), [record, reset]);
  return <Dialog.Root open={Boolean(record)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content"><div className="dialog-heading"><div><Dialog.Title>Repair downstream consequences</Dialog.Title><Dialog.Description>{record?.title}. Record the concrete supplier, schedule, or material repair before resolving it.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close repair form">×</Dialog.Close></div><form onSubmit={handleSubmit(({ repairNote }) => { if (!record) return; const result = resolveRecovery(record.id, repairNote); if (!result.ok) return setError('repairNote', { message: result.message }); onClose(); })} className="task-form"><label>Repair note <textarea autoFocus {...register('repairNote')} maxLength={181} /></label>{errors.repairNote && <span className="field-error" role="alert">{String(errors.repairNote.message)}</span>}<p className="schema-hint">10–180 characters. This note is preserved in the linked preview and exported artifact.</p><div className="dialog-actions"><Dialog.Close className="secondary-button" type="button">Cancel repair</Dialog.Close><button disabled={!isValid} className="primary-button">Resolve recovery</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function ArtifactDialog({ open, mode, copyOnOpen, onOpenChange }: { open: boolean; mode: 'export' | 'import'; copyOnOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const importSession = useGardenStore((state) => state.importSession);
  const diagnostics = useGardenStore((state) => state.diagnostics);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (mode === 'export') setText(JSON.stringify(currentArtifact(), null, 2));
    else setText('');
    setCopied(false);
  }, [open, mode]);
  useEffect(() => {
    if (!open || mode !== 'export' || !copyOnOpen || !text) return;
    navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false));
  }, [copyOnOpen, mode, open, text]);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); };
  const download = () => { const blob = new Blob([text], { type: 'application/json' }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'garden-workday-v1-recovery-board.json'; anchor.click(); URL.revokeObjectURL(href); };
  const runImport = () => { try { importSession(JSON.parse(text)); } catch { importSession({ parseFailure: text.slice(0, 80) }); } };
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content artifact-dialog"><div className="dialog-heading"><div><Dialog.Title>{mode === 'export' ? 'Portable session artifact' : 'Import session artifact'}</Dialog.Title><Dialog.Description>{mode === 'export' ? 'A stable-order, API-shaped snapshot of authored and derived state.' : 'Validation is atomic: every record and field is checked before any state changes.'}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close artifact dialog">×</Dialog.Close></div><label className="artifact-label">{mode === 'export' ? 'garden-workday-v1-recovery-board.json preview' : 'Paste garden-workday-v1 JSON'}<textarea value={text} onChange={(event) => setText(event.target.value)} readOnly={mode === 'export'} spellCheck={false} /></label>{diagnostics.length > 0 && <div className="diagnostics" role="alert"><strong>{diagnostics.length} diagnostics — import rejected with zero state mutation</strong>{diagnostics.map((item, index) => <div key={`${item.path}-${index}`}><code>{item.path}</code>: {item.message} <span>Recovery: {item.recovery}</span></div>)}</div>}<div className="dialog-actions"><Dialog.Close className="secondary-button">Close</Dialog.Close>{mode === 'export' ? <><button className="secondary-button" onClick={copy} type="button"><ClipboardText /> {copied ? 'Copied session JSON' : 'Copy session JSON'}</button><button className="primary-button" onClick={download} type="button"><DownloadSimple /> Download JSON</button></> : <button className="primary-button" onClick={runImport} type="button"><FileArrowUp /> Validate and import</button>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function WorkTasks({ onEdit }: { onEdit: (record: WorkTaskRecord) => void }) {
  const records = useGardenStore((state) => state.records);
  const filters = useGardenStore((state) => state.filters);
  const selectionId = useGardenStore((state) => state.selectionId);
  const selectRecord = useGardenStore((state) => state.selectRecord);
  const setQuery = useGardenStore((state) => state.setQuery);
  const setStatusFilter = useGardenStore((state) => state.setStatusFilter);
  const toggleArchive = useGardenStore((state) => state.toggleArchive);
  const deleteRecord = useGardenStore((state) => state.deleteRecord);
  const reorderRecord = useGardenStore((state) => state.reorderRecord);
  const visible = useMemo(() => records.filter((record) => filters.status === 'all' || record.status === filters.status).filter((record) => `${record.title} ${record.description} ${record.plot}`.toLowerCase().includes(filters.query.toLowerCase())).sort((a, b) => a.order - b.order), [records, filters]);
  return <section className="panel task-panel" aria-labelledby="work-tasks-heading"><div className="section-heading"><div><span className="eyebrow">Primary collection</span><h2 id="work-tasks-heading">Work tasks <span>{records.length}</span></h2></div><div className="search"><MagnifyingGlass /><label className="sr-only" htmlFor="task-search">Search tasks</label><input id="task-search" value={filters.query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, plot, or detail" /></div></div><div className="filter-row" aria-label="Filter tasks by status"><button className={filters.status === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>{statuses.map((status) => <button key={status} className={filters.status === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status}</button>)}</div><div className="task-list" aria-label={`${visible.length} matching tasks`}><AnimatePresence initial={false}>{visible.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><strong>No tasks match this view.</strong><span>Clear search or choose All to recover the full workday list.</span></motion.div> : visible.map((record) => <motion.article layout key={record.id} className={`task-row ${selectionId === record.id ? 'selected' : ''}`} onClick={() => selectRecord(record.id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -16 }}><div className="task-main"><button className="task-title" onClick={(event) => { event.stopPropagation(); selectRecord(record.id); }}>{record.title}</button><div className="task-meta"><span className={`status status-${record.status}`}><i />{record.status}</span><span>{record.plot}</span><span>{record.date}</span><span>{record.volunteers} volunteers · {record.durationMinutes} min</span></div></div><div className="row-actions"><button aria-label={`Move ${record.title} up`} onClick={(event) => { event.stopPropagation(); reorderRecord(record.id, -1); }}><ArrowUp /></button><button aria-label={`Move ${record.title} down`} onClick={(event) => { event.stopPropagation(); reorderRecord(record.id, 1); }}><ArrowDown /></button><button aria-label={`Edit ${record.title}`} onClick={(event) => { event.stopPropagation(); onEdit(record); }}><PencilSimple /></button><button aria-label={`${record.status === 'archived' ? 'Restore' : 'Archive'} ${record.title}`} onClick={(event) => { event.stopPropagation(); toggleArchive(record.id); }}><Archive /></button><button aria-label={`Delete ${record.title}`} onClick={(event) => { event.stopPropagation(); if (window.confirm(`Delete ${record.title}? This can be undone.`)) deleteRecord(record.id); }}><Trash /></button></div></motion.article>)}</AnimatePresence></div></section>;
}

function RecoveryBoard({ onRepair }: { onRepair: (record: WorkTaskRecord) => void }) {
  const records = useGardenStore((state) => state.records);
  const moveToRecovery = useGardenStore((state) => state.moveToRecovery);
  const selectRecord = useGardenStore((state) => state.selectRecord);
  const lanes = [
    { key: 'failed', title: 'Failed', subtitle: 'Needs a recovery decision', records: records.filter((record) => record.status === 'failed') },
    { key: 'recovery', title: 'Recovery path', subtitle: 'Repair downstream consequences', records: records.filter((record) => record.status === 'recovery') },
    { key: 'resolved', title: 'Resolved', subtitle: 'Repair evidence preserved', records: records.filter((record) => record.status === 'resolved') },
  ];
  return <section className="panel board-panel" aria-labelledby="recovery-heading"><div className="section-heading"><div><span className="eyebrow">Signature interaction</span><h2 id="recovery-heading">Recovery board</h2></div><p>Drag a failed card into Recovery path, or use its exact-value button. Both routes call one canonical mutation.</p></div><div className="board">{lanes.map((lane) => <div key={lane.key} className={`lane lane-${lane.key}`} onDragOver={(event) => lane.key === 'recovery' && event.preventDefault()} onDrop={(event) => { if (lane.key !== 'recovery') return; event.preventDefault(); moveToRecovery(event.dataTransfer.getData('text/plain')); }}><header><div><strong>{lane.title}</strong><span>{lane.subtitle}</span></div><b>{lane.records.length}</b></header><div className="lane-cards">{lane.records.length === 0 && <div className="lane-empty">{lane.key === 'resolved' ? 'No repair milestone yet.' : lane.key === 'recovery' ? 'Drop a failed task here.' : 'No failed tasks.'}</div>}{lane.records.map((record) => <article key={record.id} draggable={lane.key === 'failed'} onDragStart={(event) => event.dataTransfer.setData('text/plain', record.id)} onClick={() => selectRecord(record.id)} className="board-card" tabIndex={0}><span className={`status status-${record.status}`}><i />{record.status}</span><h3>{record.title}</h3><p>{record.description}</p>{lane.key === 'failed' && <button className="warning-button" onClick={() => moveToRecovery(record.id)}>Move to recovery path</button>}{lane.key === 'recovery' && <button className="primary-button" onClick={() => onRepair(record)}>Repair consequences</button>}{lane.key === 'resolved' && <blockquote>{record.recoveryBoardState.repairNote}</blockquote>}</article>)}</div></div>)}</div></section>;
}

function PreviewAndInspector() {
  const records = useGardenStore((state) => state.records);
  const selectionId = useGardenStore((state) => state.selectionId);
  const history = useGardenStore((state) => state.history);
  const selected = records.find((record) => record.id === selectionId) ?? null;
  const derived = calculateDerived(records);
  return <aside className="preview" aria-label="Live mobile preview and inspector"><div className="phone"><div className="phone-top"><span>Live mobile preview</span><i>●</i></div><h2>Garden workday</h2><p>Desktop edits arrive here immediately.</p><div className="metric-grid"><div><strong>{derived.total}</strong><span>Tasks</span></div><div><strong>{derived.failed}</strong><span>Failed</span></div><div><strong>{derived.inRecovery}</strong><span>Recovery</span></div><div><strong>{derived.resolved}</strong><span>Resolved</span></div></div><div className="hours"><span>Volunteer workload</span><strong>{derived.volunteerHours.toFixed(2)} hours</strong></div>{selected ? <div className="inspector"><span className="eyebrow">Selected task</span><h3>{selected.title}</h3><span className={`status status-${selected.status}`}><i />{selected.status}</span><dl><div><dt>Plot</dt><dd>{selected.plot}</dd></div><div><dt>Crew</dt><dd>{selected.volunteers}</dd></div><div><dt>Timing</dt><dd>{selected.durationMinutes} min</dd></div></dl>{selected.recoveryBoardState.repairNote && <blockquote>{selected.recoveryBoardState.repairNote}</blockquote>}</div> : <div className="inspector empty"><strong>Select a task</strong><span>Its timing, crew, state, and recovery evidence will appear here.</span></div>}<div className="history"><span className="eyebrow">Event history · {history.length}</span>{history.slice(-4).reverse().map((item) => <div key={item.id}><b>{item.event.replaceAll('_', ' ')}</b><span>{item.recordId ?? 'session'}</span></div>)}{history.length === 0 && <p>No authored events yet.</p>}</div></div></aside>;
}

export default function App() {
  const undo = useGardenStore((state) => state.undo);
  const clearSession = useGardenStore((state) => state.clearSession);
  const announcement = useGardenStore((state) => state.announcement);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<WorkTaskRecord | null>(null);
  const [repairing, setRepairing] = useState<WorkTaskRecord | null>(null);
  const [artifact, setArtifact] = useState<{ open: boolean; mode: 'export' | 'import'; copy: boolean }>({ open: false, mode: 'export', copy: false });
  const createButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const listener = (event: Event) => { const detail = (event as CustomEvent<{ mode: 'export' | 'import'; copy?: boolean }>).detail; setArtifact({ open: true, mode: detail.mode, copy: Boolean(detail.copy) }); };
    document.addEventListener('garden:artifact', listener);
    return () => document.removeEventListener('garden:artifact', listener);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('task-search')?.focus(); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [undo]);
  return <div className="app-shell"><a href="#main" className="skip-link">Skip to workbench</a><header className="topbar"><div className="brand"><div className="brand-mark">GW</div><div><span className="eyebrow">Community operations</span><h1>Garden Workday Recovery</h1></div></div><div className="top-actions"><button className="secondary-button" onClick={() => undo()} aria-label="Undo last mutation, Ctrl or Command Z">↶ Undo</button><button className="secondary-button" onClick={() => setArtifact({ open: true, mode: 'import', copy: false })}><FileArrowUp /> Import</button><button className="secondary-button" onClick={() => setArtifact({ open: true, mode: 'export', copy: false })}><DownloadSimple /> Export</button><button ref={createButton} className="primary-button" onClick={() => { setEditing(null); setTaskOpen(true); }}><Plus /> Create task</button></div></header><main id="main"><div className="workspace"><Tabs.Root defaultValue="tasks" className="tabs"><Tabs.List aria-label="Planner surfaces"><Tabs.Trigger value="tasks">Work tasks</Tabs.Trigger><Tabs.Trigger value="recovery">Recovery board</Tabs.Trigger></Tabs.List><Tabs.Content value="tasks"><WorkTasks onEdit={(record) => { setEditing(record); setTaskOpen(true); }} /></Tabs.Content><Tabs.Content value="recovery"><RecoveryBoard onRepair={setRepairing} /></Tabs.Content></Tabs.Root><PreviewAndInspector /></div><section className="session-strip"><div><CheckCircle /><span><strong>In-memory session</strong> Reload resets to the deterministic fixture; export/import is the persistence boundary.</span></div><button className="danger-link" onClick={() => window.confirm('Clear every task and event from this in-memory session?') && clearSession()}>Clear session</button></section></main><div className="sr-only" role="status" aria-live="polite">{announcement}</div><TaskDialog editing={editing} open={taskOpen} onOpenChange={(open) => { setTaskOpen(open); if (!open) setEditing(null); }} /><RepairDialog record={repairing} onClose={() => setRepairing(null)} /><ArtifactDialog open={artifact.open} mode={artifact.mode} copyOnOpen={artifact.copy} onOpenChange={(open) => setArtifact((state) => ({ ...state, open }))} /></div>;
}
