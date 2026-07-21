import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button, Checkbox, InlineNotification, Modal, Select, SelectItem, Tag, TextArea, TextInput, Toggle,
} from '@carbon/react'
import {
  Add, ArrowDown, Calendar, Checkmark, ChevronDown, Close, Code, Copy, DataView, Draggable,
  Edit, Export, List, Menu, Pause, Play, Redo, Renew, Save, Search, SendAlt, SettingsAdjust,
  Terminal, Time, TrashCan, Undo, WarningAlt,
} from '@carbon/icons-react'
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'motion/react'
import { getSelectedScript, statusLabel, useStudio } from './store'
import { newScriptSchema, paramSchemas, runReportSchema, scheduleSchema, stepTypes, typeLabels, validateStep } from './schemas'
import './webmcp'

const viewItems = [
  ['step-editor', 'Editor', Edit], ['playground', 'Playground', SettingsAdjust], ['runs', 'Runs', List],
  ['scheduled-queue', 'Scheduled queue', Calendar], ['export', 'Export', Export],
]

const formatDate = value => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Never run'
const formatDuration = ms => ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
const timeOnly = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const fuzzy = (text, query) => {
  const source = text.toLowerCase(); let cursor = 0
  for (const char of query.toLowerCase()) { cursor = source.indexOf(char, cursor); if (cursor < 0) return false; cursor++ }
  return true
}

function useFocusReturn(open, returnRef) {
  useEffect(() => {
    if (open) return
    returnRef?.current?.focus?.()
  }, [open, returnRef])
}

function StatusTag({ status, small = true }) {
  if (!status) return null
  const types = { pass: 'green', fail: 'red', skipped: 'gray', running: 'blue', retrying: 'purple', paused: 'cool-gray', failed: 'red', complete: 'green', pending: 'gray' }
  const labels = { failed: 'Fail', complete: 'Pass', ...Object.fromEntries(Object.keys(types).map(key => [key, statusLabel(key)])) }
  return <Tag size={small ? 'sm' : 'md'} type={types[status] || 'gray'}>{labels[status] || status}</Tag>
}

function Sidebar({ newScriptRef }) {
  const scripts = useStudio(s => s.scripts)
  const selectedId = useStudio(s => s.selectedScriptId)
  const selected = useStudio(s => s.selectedScripts)
  const open = useStudio(s => s.sidebarOpen)
  const { selectScript, toggleScriptSelection, duplicateSelectedScripts, deleteScripts, setUi, toggleSidebar } = useStudio()
  const [confirmDelete, setConfirmDelete] = useState(false)
  return <>
    {open && <div className="sidebar-scrim" onClick={toggleSidebar} aria-hidden="true" />}
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Script library">
      <div className="sidebar-brand">
        <div className="flex items-center"><span className="sidebar-brand-mark">T</span><div className="leading-tight"><div className="text-lg font-semibold">Ternwave</div><div className="text-xs text-slate-400">Automation studio</div></div></div>
        <Button ref={newScriptRef} className="mt-5 w-full" size="sm" renderIcon={Add} onClick={() => setUi({ newScriptModal: true })}>New Script</Button>
      </div>
      {selected.length > 0 && <div className="sidebar-bulk" aria-label="Script bulk actions">
        <div className="mb-2 text-xs font-semibold">{selected.length} selected</div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" kind="tertiary" renderIcon={Copy} onClick={duplicateSelectedScripts}>Duplicate selected</Button>
          <Button size="sm" kind="danger--tertiary" renderIcon={TrashCan} onClick={() => setConfirmDelete(true)}>Delete selected</Button>
        </div>
      </div>}
      <div className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">Saved scripts · {scripts.length}</div>
      <nav>
        {scripts.map(script => <div key={script.id} className={`script-row ${selectedId === script.id ? 'active' : ''}`}>
          <Checkbox id={`script-${script.id}`} labelText={`Select ${script.name}`} checked={selected.includes(script.id)} onChange={() => toggleScriptSelection(script.id)} />
          <div className="script-main" role="button" tabIndex={0} onClick={() => selectScript(script.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectScript(script.id) } }}>
            <div className="flex items-center gap-2">
              <span className="script-name">{script.name}</span>
              {script.schedule.enabled && <Time size={13} aria-label="Scheduled" className="text-blue-300" />}
            </div>
            <div className="script-meta">
              <span>{script.steps.length} steps</span><span>·</span><StatusTag status={script.lastRunStatus} />
              <span className="basis-full">{formatDate(script.lastRunAt)}</span>
            </div>
          </div>
        </div>)}
        {!scripts.length && <div className="px-6 py-12 text-center text-sm text-slate-400">No scripts yet. Use New Script to build one.</div>}
      </nav>
    </aside>
    <Modal open={confirmDelete} danger modalHeading={`Delete ${selected.length} selected script${selected.length === 1 ? '' : 's'}?`} primaryButtonText="Delete selected" secondaryButtonText="Cancel"
      onRequestClose={() => setConfirmDelete(false)} onRequestSubmit={() => { deleteScripts(selected); setConfirmDelete(false) }}>
      <p>This removes {selected.length} script{selected.length === 1 ? '' : 's'}, their run history, and their schedule queue entries together.</p>
    </Modal>
  </>
}

function HistoryDrawer() {
  const open = useStudio(s => s.historyOpen)
  const actions = useStudio(s => s.editActions)
  const cursor = useStudio(s => s.historyCursor)
  const { rollbackTo, setUi } = useStudio()
  if (!open) return null
  return <section className="panel history-drawer" aria-label="Editing history timeline">
    <div className="panel-header"><div><div className="eyebrow">Workspace</div><h2 className="panel-title">Edit history</h2></div><Button kind="ghost" size="sm" hasIconOnly iconDescription="Close history" renderIcon={Close} onClick={() => setUi({ historyOpen: false })} /></div>
    {actions.length ? actions.map((action, index) => <button type="button" key={action.id} className={`history-item ${index >= cursor ? 'undone' : ''}`} onClick={() => rollbackTo(index)}>
      <div className="text-sm font-medium">{action.label}</div><div className="muted mt-1 text-xs">{formatDate(action.timestamp)} {index >= cursor ? '· Undone' : ''}</div>
    </button>) : <div className="empty-state py-8 text-sm">Editing actions will appear here after your first change.</div>}
  </section>
}

function Toolbar() {
  const view = useStudio(s => s.view)
  const script = useStudio(getSelectedScript)
  const cursor = useStudio(s => s.historyCursor)
  const actionCount = useStudio(s => s.editActions.length)
  const density = useStudio(s => s.density)
  const { setView, undo, redo, setUi, toggleSidebar, setDensity } = useStudio()
  return <header className="topbar">
    <div className="topbar-main">
      <Button className="mobile-menu" kind="ghost" size="sm" hasIconOnly renderIcon={Menu} iconDescription="Open script library" onClick={toggleSidebar} />
      <div className="topbar-title min-w-0 flex-1"><div className="eyebrow">Current script</div><div className="truncate text-sm font-semibold">{script?.name || 'No script selected'}</div></div>
      <Button kind="ghost" size="sm" hasIconOnly renderIcon={Undo} iconDescription="Undo" disabled={!cursor} onClick={undo} />
      <Button kind="ghost" size="sm" hasIconOnly renderIcon={Redo} iconDescription="Redo" disabled={cursor >= actionCount} onClick={redo} />
      <Button kind="ghost" size="sm" aria-pressed={density === 'compact'} onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}>{density === 'compact' ? 'Comfortable view' : 'Compact view'}</Button>
      <Button kind="ghost" size="sm" renderIcon={Time} onClick={() => setUi({ historyOpen: !useStudio.getState().historyOpen })}>History</Button>
      <Button kind="tertiary" size="sm" renderIcon={Search} onClick={() => setUi({ paletteOpen: true, paletteQuery: '', paletteIndex: 0 })}>Commands <span className="ml-2 opacity-60">⌘K</span></Button>
    </div>
    <nav className="view-switcher" aria-label="Workspace views">
      {viewItems.map(([id, label, Icon]) => <button key={id} className={`view-tab ${view === id ? 'active' : ''}`} onClick={() => setView(id)}><Icon size={15} className="mr-1.5 inline" />{label}</button>)}
    </nav>
  </header>
}

function NewScriptModal({ launcherRef }) {
  const open = useStudio(s => s.newScriptModal)
  const creating = useStudio(s => s.creatingScript)
  const { createScript, setUi } = useStudio()
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(newScriptSchema), mode: 'onChange', defaultValues: { name: '', target_url: '', description: '' } })
  useFocusReturn(open, launcherRef)
  const close = () => { reset(); setUi({ newScriptModal: false }) }
  const submit = handleSubmit(values => { if (!creating) { createScript(values); reset() } })
  return <Modal open={open} modalHeading="Create a new script" modalLabel="Script library" primaryButtonText="Create script" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || creating} onRequestClose={close} onRequestSubmit={submit} launcherButtonRef={launcherRef} selectorPrimaryFocus="#new-name">
    <div className="grid gap-5 pt-2">
      <TextInput id="new-name" labelText="Script name" invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} />
      <TextInput id="new-url" labelText="Target URL" invalid={!!errors.target_url} invalidText={errors.target_url?.message || 'Target URL must be a valid URL'} {...register('target_url')} />
      <TextArea id="new-description" labelText="Description (optional)" rows={3} {...register('description')} />
    </div>
  </Modal>
}

function ScheduleModal() {
  const open = useStudio(s => s.scheduleOpen)
  const script = useStudio(getSelectedScript)
  const { updateSchedule, setUi } = useStudio()
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isValid } } = useForm({ resolver: zodResolver(scheduleSchema), mode: 'onChange', defaultValues: script?.schedule })
  useEffect(() => { if (script) reset(script.schedule) }, [script?.id, open])
  const enabled = watch('enabled')
  return <Modal open={open} modalHeading="Recurring schedule" modalLabel={script?.name} primaryButtonText="Save schedule" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid} onRequestClose={() => setUi({ scheduleOpen: false })} onRequestSubmit={handleSubmit(updateSchedule)}>
    <div className="grid gap-5 pt-2">
      <div className="schedule-toggle-row">
        <Toggle id="schedule-enabled" labelText="Schedule" labelA="Off" labelB="On" toggled={!!enabled} onToggle={value => setValue('enabled', value, { shouldValidate: true })} />
      </div>
      {enabled && <>
        <TextInput id="schedule-time" type="time" labelText="Schedule time" invalid={!!errors.time} invalidText={errors.time?.message || 'Schedule time is required'} {...register('time')} />
        <Select id="schedule-interval" labelText="Repeat interval" invalid={!!errors.interval} invalidText={errors.interval?.message || 'Schedule interval is required'} {...register('interval')}>
          <SelectItem value="" text="Choose interval" /><SelectItem value="hourly" text="Hourly" /><SelectItem value="daily" text="Daily" /><SelectItem value="weekly" text="Weekly" />
        </Select>
      </>}
    </div>
  </Modal>
}

function CommandPalette() {
  const open = useStudio(s => s.paletteOpen)
  const query = useStudio(s => s.paletteQuery)
  const index = useStudio(s => s.paletteIndex)
  const scripts = useStudio(s => s.scripts)
  const selected = useStudio(getSelectedScript)
  const { setUi, selectScript, setView, highlightStep } = useStudio()
  const inputRef = useRef(null)
  const results = useMemo(() => {
    const items = [
      ...scripts.map(s => ({ id: `script-${s.id}`, kind: 'Script', label: s.name, activate: () => { selectScript(s.id); setView('step-editor') } })),
      ...(selected?.steps || []).map(s => ({ id: `step-${s.id}`, kind: 'Step', label: `${s.order}. ${s.label}`, activate: () => { setView('step-editor'); highlightStep(s.id); setTimeout(() => document.getElementById(`step-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0) } })),
      ...viewItems.map(([id, label]) => ({ id: `view-${id}`, kind: 'View', label, activate: () => setView(id) })),
    ]
    return items.filter(item => !query || fuzzy(`${item.label} ${item.kind}`, query))
  }, [query, scripts, selected?.id, selected?.steps])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30) }, [open])
  useEffect(() => { if (index >= results.length) setUi({ paletteIndex: 0 }) }, [results.length])
  if (!open) return null
  const activate = item => { item?.activate(); setUi({ paletteOpen: false }) }
  return <motion.div className="palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) setUi({ paletteOpen: false }) }}>
    <motion.div className="palette" initial={{ opacity: 0, scale: .97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
      <input ref={inputRef} className="palette-input" aria-label="Search commands" value={query} onChange={e => setUi({ paletteQuery: e.target.value, paletteIndex: 0 })}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setUi({ paletteIndex: results.length ? (index + 1) % results.length : 0 }) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setUi({ paletteIndex: results.length ? (index - 1 + results.length) % results.length : 0 }) }
          if (e.key === 'Enter') { e.preventDefault(); activate(results[index]) }
          if (e.key === 'Escape') setUi({ paletteOpen: false })
        }} />
      <div className="palette-results" role="listbox">
        {results.map((item, i) => <button key={item.id} role="option" aria-selected={i === index} className={`palette-result ${i === index ? 'highlight' : ''}`} onMouseEnter={() => setUi({ paletteIndex: i })} onClick={() => activate(item)}><span>{item.label}</span><span className="kind-label">{item.kind}</span></button>)}
        {!results.length && <div className="empty-state py-10 text-sm">No commands match “{query}”.</div>}
      </div>
    </motion.div>
  </motion.div>
}

function StepField({ step, name, label, type = 'text' }) {
  const schema = useMemo(() => z.object({ params: paramSchemas[step.type] }), [step.type])
  const { register, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { params: step.params } })
  const updateStep = useStudio(s => s.updateStep)
  useEffect(() => reset({ params: step.params }), [step.id, step.type, step.params[name]])
  const error = errors.params?.[name]?.message || validateStep(step)[name]
  return <div className="compact-field min-w-0">
    <TextInput id={`${step.id}-${name}`} type={type} labelText={label} invalid={!!error} invalidText={error} {...register(`params.${name}`, {
      onChange: e => updateStep(step.id, name, type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value),
    })} />
  </div>
}

function StepParams({ step }) {
  if (step.type === 'navigate') return <StepField step={step} name="url" label="URL" />
  if (step.type === 'click') return <StepField step={step} name="selector" label="CSS selector" />
  if (step.type === 'type') return <><StepField step={step} name="selector" label="CSS selector" /><StepField step={step} name="text" label="Text" /></>
  if (step.type === 'extract') return <><StepField step={step} name="selector" label="CSS selector" /><StepField step={step} name="variable" label="Variable name" /></>
  if (step.type === 'wait') return <StepField step={step} name="ms" label="Milliseconds" type="text" />
  if (step.type === 'assert_text') return <><StepField step={step} name="selector" label="CSS selector" /><StepField step={step} name="expected_text" label="Expected text" /></>
  return <div className="flex min-h-9 items-center text-xs text-slate-500">No parameters required</div>
}

function SortableStep({ step }) {
  const selected = useStudio(s => s.selectedSteps.includes(step.id))
  const live = useStudio(s => s.liveRun)
  const highlighted = useStudio(s => s.highlightedStepId === step.id)
  const { updateStep, toggleStepSelection, deleteSteps } = useStudio()
  const [confirm, setConfirm] = useState(false)
  const result = live?.scriptId === useStudio.getState().selectedScriptId ? live.stepResults[step.id] : null
  const active = live?.currentStepId === step.id && ['running', 'retrying', 'paused'].includes(live.status)
  const errors = validateStep(step)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  return <div ref={setNodeRef} id={`step-${step.id}`} style={{ transform: CSS.Transform.toString(transform), transition }} className={`step-row ${active ? 'running' : ''} ${highlighted ? 'highlighted' : ''} ${step.disabled ? 'disabled' : ''} ${isDragging ? 'dragging' : ''}`}>
    <div className="step-index">
      <button className="drag-handle" aria-label={`Drag step ${step.order}`} {...attributes} {...listeners}><Draggable size={16} /></button>
      <Checkbox id={`select-step-${step.id}`} labelText={`Select step ${step.order}`} hideLabel checked={selected} onChange={() => toggleStepSelection(step.id)} />
      <strong>{step.order}</strong>
    </div>
    <div className="min-w-0">
      <div className="compact-field">
        <TextInput id={`label-${step.id}`} labelText="Step label" value={step.label} onChange={e => updateStep(step.id, 'label', e.target.value)} />
      </div>
      <div className="compact-field mt-2">
        <Select id={`type-${step.id}`} labelText="Step type" value={step.type} onChange={e => updateStep(step.id, 'type', e.target.value)}>
          {stepTypes.map(type => <SelectItem key={type} value={type} text={typeLabels[type]} />)}
        </Select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {step.disabled && <Tag size="sm" type="cool-gray">Disabled</Tag>}
        {Object.keys(errors).length > 0 && <span className="warning-dot" title={Object.values(errors).join(', ')}><WarningAlt size={16} aria-label="Invalid parameters" /></span>}
        {result && <StatusTag status={result.status} />}
        {live?.status === 'retrying' && live.currentStepId === step.id && <span className="text-xs font-semibold text-purple-700">Attempt {live.attempt + 1} of 3 · {live.countdown}s</span>}
      </div>
      {result?.error_reason && <div className="field-error mt-2">{result.error_reason}</div>}
    </div>
    <div className={`step-controls ${['navigate','click','wait','screenshot'].includes(step.type) ? 'one' : ''}`}><StepParams step={step} /></div>
    <div className="step-actions">
      <Button kind="ghost" size="sm" hasIconOnly renderIcon={step.disabled ? Checkmark : Close} iconDescription={step.disabled ? 'Enable step' : 'Disable step'} onClick={() => updateStep(step.id, 'disabled', !step.disabled)} />
      <Button kind="danger--ghost" size="sm" hasIconOnly renderIcon={TrashCan} iconDescription="Delete step" onClick={() => setConfirm(true)} />
      {confirm && <div className="inline-confirm"><span>Delete step?</span><button type="button" className="font-semibold text-red-700" onClick={() => { deleteSteps([step.id]); setConfirm(false) }}>Delete</button><button type="button" onClick={() => setConfirm(false)}>Cancel</button></div>}
      {result?.status === 'fail' && <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={useStudio.getState().retryFailed}>Retry</Button>}
    </div>
  </div>
}

function StepBulkBar() {
  const selected = useStudio(s => s.selectedSteps)
  const { setStepsDisabled, duplicateSteps, deleteSteps } = useStudio()
  const [confirm, setConfirm] = useState(false)
  if (!selected.length) return null
  return <div className="bulk-bar"><strong className="mr-2 text-xs">{selected.length} selected</strong>
    <Button size="sm" kind="ghost" onClick={() => setStepsDisabled(selected, true)}>Disable selected</Button>
    <Button size="sm" kind="ghost" onClick={() => setStepsDisabled(selected, false)}>Enable selected</Button>
    <Button size="sm" kind="ghost" renderIcon={Copy} onClick={() => duplicateSteps(selected)}>Duplicate selected</Button>
    {!confirm ? <Button size="sm" kind="danger--ghost" renderIcon={TrashCan} onClick={() => setConfirm(true)}>Delete selected</Button> : <div className="inline-confirm"><span>Delete {selected.length} selected steps?</span><button className="font-semibold text-red-700" onClick={() => { deleteSteps(selected); setConfirm(false) }}>Confirm</button><button onClick={() => setConfirm(false)}>Cancel</button></div>}
  </div>
}

function VersionPreview({ version }) {
  return <div className="p-3">
    <InlineNotification lowContrast hideCloseButton kind="info" title={`Version ${version.number} is read-only`} subtitle="Restore it to copy these steps into a new version." />
    <ol className="mt-3 divide-y divide-slate-200">{version.steps.map(step => <li key={step.id} className="flex items-start gap-3 px-3 py-3"><span className="w-6 text-xs font-bold text-slate-500">{step.order}</span><div><div className="text-sm font-semibold">{step.label}</div><div className="mt-1 text-xs text-slate-500">{typeLabels[step.type]} · {Object.values(step.params).join(' · ') || 'No parameters'}</div></div>{step.disabled && <Tag size="sm">Disabled</Tag>}</li>)}</ol>
  </div>
}

function StepList({ script }) {
  const selectedVersion = useStudio(s => s.selectedVersion)
  const { reorderSteps, addStep } = useStudio()
  const version = script.versions.find(v => v.number === selectedVersion)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  if (version) return <VersionPreview version={version} />
  if (!script.steps.length) return <div className="empty-state"><h3 className="font-semibold text-slate-800">This script has no steps</h3><p className="mt-2 text-sm">Use Add Step to define the next automation action.</p><Button className="mt-5" size="sm" renderIcon={Add} onClick={() => addStep('click')}>Add Step</Button></div>
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (over) reorderSteps(active.id, over.id) }}>
    <SortableContext items={script.steps.map(s => s.id)} strategy={verticalListSortingStrategy}><div className="step-list">{script.steps.map(step => <SortableStep key={step.id} step={step} />)}</div></SortableContext>
  </DndContext>
}

function VersionsPanel({ script }) {
  const selectedVersion = useStudio(s => s.selectedVersion)
  const { previewVersion, restoreVersion } = useStudio()
  return <aside className="panel versions-panel">
    <div className="panel-header"><div><div className="eyebrow">Immutable history</div><h2 className="panel-title">Versions</h2></div><Tag size="sm" type="blue">v{script.version}</Tag></div>
    {script.versions.length ? script.versions.map(version => <div role="button" tabIndex={0} key={version.number} className={`version-item ${selectedVersion === version.number ? 'active' : ''}`} onClick={() => previewVersion(version.number)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); previewVersion(version.number) } }}>
      <div className="flex items-center justify-between"><strong className="text-sm">Version {version.number}</strong>{version.number === script.version && <Tag size="sm" type="green">Current</Tag>}</div>
      <div className="muted mt-1 text-xs">{formatDate(version.timestamp)} · {version.steps.length} steps</div>
      {selectedVersion === version.number && <Button className="mt-3" size="sm" kind="tertiary" renderIcon={Renew} onClick={e => { e.stopPropagation(); restoreVersion(version.number) }}>Restore version</Button>}
    </div>) : <div className="empty-state py-8 text-sm">Save a version to create the first immutable snapshot.</div>}
  </aside>
}

function RunRollup({ script }) {
  const live = useStudio(s => s.liveRun)
  const results = Object.values(live?.stepResults || {})
  const rollup = { passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, skipped: results.filter(r => r.status === 'skipped').length, retries: live?.retryCount || 0 }
  const [, tick] = useState(0)
  useEffect(() => { if (!live || ['complete','failed'].includes(live.status)) return; const id = setInterval(() => tick(v => v + 1), 250); return () => clearInterval(id) }, [live?.status])
  const elapsed = live ? Date.now() - Date.parse(live.start_time) : 0
  return <>
    <div className="rollup-grid">
      <div className="metric"><span className="metric-label">Pass</span><strong>{rollup.passed} of {script.steps.length}</strong></div>
      <div className="metric"><span className="metric-label">Fail</span><strong>{rollup.failed}</strong></div>
      <div className="metric"><span className="metric-label">Skipped</span><strong>{rollup.skipped}</strong></div>
      <div className="metric"><span className="metric-label">Retries</span><strong>{rollup.retries}</strong></div>
      <div className="metric"><span className="metric-label">Elapsed</span><strong>{formatDuration(elapsed)}</strong></div>
    </div>
    {live?.checkpointLabel && <div className="checkpoint-note" role="status">{live.checkpointLabel}</div>}
  </>
}

function RunConsole() {
  const lines = useStudio(s => s.consoleLines)
  const theme = useStudio(s => s.consoleTheme)
  const following = useStudio(s => s.consoleFollowing)
  const setTheme = useStudio(s => s.setConsoleTheme)
  const setFollowing = useStudio(s => s.setConsoleFollowing)
  const setUi = useStudio(s => s.setUi)
  const scrollRef = useRef(null)
  useEffect(() => { if (following && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [lines.length, following])
  const className = theme === 'Ocean' ? 'console-ocean' : theme === 'Solar' ? 'console-solar' : 'console-midnight'
  return <section className={`panel console ${className}`} aria-label="Run console">
    <div className="console-toolbar"><div className="flex items-center gap-2"><Terminal size={17} /><strong className="text-sm">Run console</strong><span className="text-xs opacity-60">{lines.length} events</span></div>
      <Select id="console-theme" hideLabel labelText="Console theme" size="sm" value={theme} onChange={e => setTheme(e.target.value)}><SelectItem value="Midnight" text="Midnight" /><SelectItem value="Ocean" text="Ocean" /><SelectItem value="Solar" text="Solar" /></Select>
    </div>
    <div ref={scrollRef} className="console-body" onScroll={e => { const el = e.currentTarget; const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8; setFollowing(atBottom) }}>
      {!lines.length && <div className="opacity-70">Ready. Run a script to stream step events.</div>}
      {lines.map(line => <div key={line.id}><div className={`console-line ${line.level}`}><span className="opacity-60">{timeOnly(line.timestamp)}</span><span>{line.text}</span></div>{line.screenshot && <button className="screenshot-thumb" onClick={() => setUi({ screenshotModal: { label: line.screenshotLabel } })}><DataView size={30} /><strong>Screenshot captured</strong><span>Open full-size preview</span></button>}</div>)}
      {!following && <button className="jump-latest" onClick={() => { setFollowing(true); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }}><ArrowDown size={13} className="mr-1 inline" />Jump to latest</button>}
    </div>
  </section>
}

function RunDetails({ script }) {
  const live = useStudio(s => s.liveRun)
  const filter = useStudio(s => s.timelineFilter)
  const { setTimelineFilter, highlightStep } = useStudio()
  if (!live || live.scriptId !== script.id) return null
  const events = live.timeline.filter(e => filter === 'all' || e.status === filter)
  const values = Object.values(live.stepResults).filter(r => r.extracted_name)
  return <div className="details-grid">
    <section className="panel"><div className="panel-header"><div><div className="eyebrow">Live output</div><h2 className="panel-title">Extracted values</h2></div></div>
      {values.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Variable name</th><th>Value</th><th>Source step</th></tr></thead><tbody>{values.map(v => <tr key={v.stepId}><td>{v.extracted_name}</td><td className="font-mono">{v.extracted_value}</td><td>Step {v.order}</td></tr>)}</tbody></table></div> : <div className="empty-state py-8 text-sm">Extracted values appear here as Extract steps pass.</div>}
    </section>
    <section className="panel"><div className="panel-header"><div><div className="eyebrow">Ordered transitions</div><h2 className="panel-title">Event timeline</h2></div><Select id="timeline-filter" hideLabel labelText="Timeline status" size="sm" value={filter} onChange={e => setTimelineFilter(e.target.value)}><SelectItem value="all" text="All statuses" />{['running','pass','fail','retrying','paused','skipped'].map(v => <SelectItem key={v} value={v} text={statusLabel(v)} />)}</Select></div>
      {events.length ? events.map(event => <div role="button" tabIndex={0} key={event.id} className="timeline-row" onClick={() => { highlightStep(event.stepId); document.getElementById(`step-${event.stepId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }} onKeyDown={keyEvent => { if (keyEvent.key === 'Enter' || keyEvent.key === ' ') { keyEvent.preventDefault(); highlightStep(event.stepId); document.getElementById(`step-${event.stepId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) } }}><div className="flex items-center justify-between gap-3"><span className="text-xs">{event.label}</span><StatusTag status={event.status} /></div><div className="muted mt-1 text-[10px]">{timeOnly(event.timestamp)}</div></div>) : <div className="empty-state py-8 text-sm">No timeline events match this status.</div>}
    </section>
  </div>
}

function EditorView() {
  const script = useStudio(getSelectedScript)
  const live = useStudio(s => s.liveRun)
  const { updateScriptMeta, saveVersion, addStep, startRun, pauseRun, resumeRun, setUi } = useStudio()
  const [stepMenu, setStepMenu] = useState(false)
  if (!script) return <div className="panel empty-state"><h1 className="page-title text-slate-900">No script selected</h1><p className="mt-3">Choose a script from the library or create a new script to open the editor.</p><Button className="mt-6" renderIcon={Add} onClick={() => setUi({ newScriptModal: true })}>New Script</Button></div>
  const running = live?.scriptId === script.id && ['running','retrying','paused'].includes(live.status)
  const canRun = script.steps.length > 0
  return <>
    <div className="editor-grid">
      <section className="panel min-w-0">
        <div className="panel-header">
          <div className="min-w-[240px] flex-1"><div className="eyebrow">Script editor · v{script.version} {script.unsaved && <span className="ml-2 text-amber-700">● Unsaved changes</span>}</div>
            <TextInput id="script-name" labelText="Script name" value={script.name} onChange={e => updateScriptMeta('name', e.target.value)} />
            <div className="mt-2"><TextInput id="script-target-url" labelText="Target URL" value={script.target_url} onChange={e => updateScriptMeta('target_url', e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" kind="tertiary" renderIcon={Time} onClick={() => setUi({ scheduleOpen: true })}>{script.schedule.enabled ? 'Edit schedule' : 'Schedule'}</Button>
            <Button size="sm" kind="tertiary" renderIcon={Save} disabled={!script.unsaved} onClick={saveVersion}>Save version</Button>
            {live?.scriptId === script.id && live.status === 'paused' ? <Button size="sm" renderIcon={Play} onClick={resumeRun}>Resume</Button> : running ? <Button size="sm" renderIcon={Pause} onClick={pauseRun}>Pause</Button> : <Button size="sm" renderIcon={Play} disabled={!canRun} onClick={() => startRun(script.id, 'manual')}>Run Script</Button>}
          </div>
        </div>
        <RunRollup script={script} />
        <div className="flex items-center justify-between border-y border-slate-200 px-4 py-2">
          <div className="text-sm"><span className="font-semibold">Steps</span><span className="muted"> · {script.steps.length} total</span></div>
          <div className="relative"><Button size="sm" kind="ghost" renderIcon={Add} onClick={() => setStepMenu(!stepMenu)}>Add Step <ChevronDown size={13} className="ml-1" /></Button>
            {stepMenu && <div className="absolute right-0 z-20 mt-1 w-44 rounded border border-slate-200 bg-white p-1 shadow-xl">{stepTypes.map(type => <button key={type} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => { addStep(type); setStepMenu(false) }}>{typeLabels[type]}</button>)}</div>}
          </div>
        </div>
        <StepBulkBar /><StepList script={script} />
      </section>
      <VersionsPanel script={script} />
    </div>
    <RunConsole /><RunDetails script={script} />
  </>
}

function PlaygroundView() {
  const script = useStudio(getSelectedScript)
  const html = useStudio(s => s.playgroundHtml)
  const selector = useStudio(s => s.playgroundSelector)
  const matches = useStudio(s => s.playgroundMatches)
  const target = useStudio(s => s.playgroundTargetStep)
  const { setPlayground, sendSelectorToStep } = useStudio()
  const schema = z.object({ mock_html: z.string().min(1, 'Mock HTML is required'), selector: z.string().min(1, 'Selector is required').superRefine((value, ctx) => { try { document.createElement('div').querySelector(value) } catch (error) { ctx.addIssue({ code: 'custom', message: `Selector is invalid: ${error.message}` }) } }) })
  const { register, formState: { errors }, setValue, trigger } = useForm({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { mock_html: html, selector } })
  const preview = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html'); const found = selector ? [...doc.querySelectorAll(selector)] : []
      found.forEach(el => el.setAttribute('data-ternwave-match', 'true'))
      const style = doc.createElement('style'); style.textContent = `body{font-family:IBM Plex Sans,Arial;padding:24px;color:#172033} [data-ternwave-match]{outline:3px solid #0f62fe!important;background:#dceaff!important;animation:tw .25s ease}@keyframes tw{from{transform:scale(.98)}to{transform:none}} article{border:1px solid #d8dee8;padding:14px;margin:10px 0;border-radius:6px}`; doc.head.appendChild(style)
      if (found.length !== matches) setTimeout(() => setPlayground({ playgroundMatches: found.length, playgroundError: '' }), 0)
      return '<!doctype html>' + doc.documentElement.outerHTML
    } catch (error) { setTimeout(() => setPlayground({ playgroundError: error.message }), 0); return html }
  }, [html, selector])
  const selectorError = errors.selector?.message || useStudio.getState().playgroundError
  const eligible = script?.steps.filter(s => ['click','type','extract','assert_text'].includes(s.type)) || []
  const eligibleIds = eligible.map(s => s.id).join(',')
  // Pre-select the first selector-bearing step so Send to step is immediately usable.
  // Keyed on the actual id set (not just length) so a deleted/replaced step that keeps
  // the eligible count unchanged still clears a now-stale target selection. When the
  // eligible list goes empty (last selector-bearing step deleted/retyped), fall back to
  // the placeholder instead of leaving a stale id referencing a step no longer offered.
  useEffect(() => {
    if (eligible.length) { if (!target || !eligible.some(s => s.id === target)) setPlayground({ playgroundTargetStep: eligible[0].id }) }
    else if (target) setPlayground({ playgroundTargetStep: '' })
  }, [script?.id, eligibleIds])
  return <section><div className="mb-5"><div className="eyebrow">Selector laboratory</div><h1 className="page-title">Playground</h1><p className="muted mt-2 text-sm">Test selectors against safe mock HTML, then send a match directly to a step.</p></div>
    <div className="playground-grid">
      <div className="panel p-5"><TextArea id="mock-html" labelText="Mock HTML" rows={14} value={html} {...register('mock_html', { onChange: e => { setValue('mock_html', e.target.value, { shouldValidate: true }); setPlayground({ playgroundHtml: e.target.value }) } })} />
        <div className="mt-5"><TextInput id="playground-selector" labelText="CSS selector" value={selector} invalid={!!selectorError} invalidText={selectorError} {...register('selector', { onChange: async e => { const value = e.target.value; setValue('selector', value, { shouldValidate: true }); const valid = await trigger('selector'); if (valid) setPlayground({ playgroundSelector: value, playgroundError: '' }); else setPlayground({ playgroundSelector: value }) } })} /></div>
        {!selectorError && <div className={`mt-3 text-sm font-semibold ${matches ? 'text-green-700' : 'text-amber-700'}`}>{matches ? `${matches} match${matches === 1 ? '' : 'es'}` : 'Zero matches for this selector'}</div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><Select id="target-step" labelText="Send to step" value={target} onChange={e => setPlayground({ playgroundTargetStep: e.target.value })}><SelectItem value="" text="Choose a selector step" />{eligible.map(step => <SelectItem key={step.id} value={step.id} text={`${step.order}. ${step.label}`} />)}</Select><Button className="self-end" size="sm" renderIcon={SendAlt} disabled={!target || !!selectorError || !selector} onClick={() => sendSelectorToStep(target)}>Send to step</Button></div>
      </div>
      <div className="panel overflow-hidden"><div className="panel-header"><div><div className="eyebrow">Rendered safely</div><h2 className="panel-title">Preview</h2></div><Tag size="sm" type={matches ? 'blue' : 'gray'}>{matches} matches</Tag></div><iframe title="Mock HTML preview" sandbox="" srcDoc={preview} className="preview-frame" /></div>
    </div>
  </section>
}

function RunReadOnly({ run }) {
  if (!run) return <div className="empty-state">Select a run to inspect its step outcomes and extracted values.</div>
  return <div><div className="rollup-grid p-4"><div className="metric"><span className="metric-label">Status</span><div className="mt-2"><StatusTag status={run.status} /></div></div><div className="metric"><span className="metric-label">Duration</span><strong>{formatDuration(run.duration)}</strong></div><div className="metric"><span className="metric-label">Pass</span><strong>{run.totals.passed}</strong></div><div className="metric"><span className="metric-label">Fail</span><strong>{run.totals.failed}</strong></div></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Step</th><th>Type</th><th>Status</th><th>Attempts</th><th>Output</th></tr></thead><tbody>{run.steps.map(step => <tr key={`${step.stepId}-${step.order}`}><td>{step.order}. {step.label}</td><td>{typeLabels[step.type]}</td><td><StatusTag status={step.status} /></td><td>{step.attempts}</td><td>{step.error_reason || step.extracted_value || '—'}</td></tr>)}</tbody></table></div>
  </div>
}

function DiffView({ runA, runB }) {
  if (!runA || !runB) return null
  if (runA.id === runB.id) return <div className="empty-state"><Checkmark size={32} className="mx-auto mb-3 text-green-600" /><h3 className="font-semibold text-slate-900">No differences</h3><p className="mt-2 text-sm">You compared run {runA.number} against itself.</p></div>
  const max = Math.max(runA.steps.length, runB.steps.length)
  return <div className="p-4"><div className="mb-3 grid grid-cols-2 gap-4 text-xs font-semibold"><span>Run {runA.number}</span><span>Run {runB.number}</span></div>{Array.from({ length: max }, (_, i) => {
    const a = runA.steps[i], b = runB.steps[i]; let kind = ''
    if (!a) kind = 'diff-added'; else if (!b) kind = 'diff-removed'; else if (a.status !== b.status || a.extracted_value !== b.extracted_value || a.type !== b.type) kind = 'diff-changed'
    return <div key={i} className={`mb-2 grid grid-cols-2 gap-4 rounded p-3 text-xs ${kind}`}><div>{a ? <><strong>{a.order}. {a.label}</strong><div className="mt-1"><StatusTag status={a.status} /> {a.extracted_value}</div></> : <span className="font-semibold text-green-700">Added in run {runB.number}</span>}</div><div>{b ? <><strong>{b.order}. {b.label}</strong><div className="mt-1"><StatusTag status={b.status} /> {b.extracted_value}</div></> : <span className="font-semibold text-red-700">Removed after run {runA.number}</span>}</div>{kind && <span className="col-span-2 font-semibold">{kind === 'diff-added' ? '+ Added' : kind === 'diff-removed' ? '− Removed' : '△ Changed'}</span>}</div>
  })}</div>
}

function RunsView() {
  const script = useStudio(getSelectedScript)
  const [inspectId, setInspectId] = useState(null)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [compare, setCompare] = useState(false)
  useEffect(() => { setInspectId(script?.runs.at(-1)?.id || null); setCompare(false); setA(''); setB('') }, [script?.id])
  if (!script) return <div className="panel empty-state">Select a script to view its run history.</div>
  const runs = [...script.runs].reverse()
  return <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">{script.name}</div><h1 className="page-title">Run history</h1><p className="muted mt-2 text-sm">{runs.length} saved runs from the current session seed.</p></div>
    <div className="flex flex-wrap items-end gap-2"><Select id="compare-a" labelText="First run" size="sm" value={a} onChange={e => { setA(e.target.value); setCompare(false) }}><SelectItem value="" text="Choose run" />{runs.map(r => <SelectItem key={r.id} value={r.id} text={`Run ${r.number}`} />)}</Select><Select id="compare-b" labelText="Second run" size="sm" value={b} onChange={e => { setB(e.target.value); setCompare(false) }}><SelectItem value="" text="Choose run" />{runs.map(r => <SelectItem key={r.id} value={r.id} text={`Run ${r.number}`} />)}</Select><Button size="sm" disabled={!a || !b} onClick={() => setCompare(true)}>Compare</Button></div>
  </div>
  <div className="grid gap-[18px] lg:grid-cols-[370px_minmax(0,1fr)]"><div className="panel overflow-hidden"><div className="panel-header"><h2 className="panel-title">Past runs</h2></div>{runs.map(run => <div role="button" tabIndex={0} key={run.id} className={`run-row ${inspectId === run.id ? 'bg-blue-50' : ''}`} onClick={() => { setInspectId(run.id); setCompare(false) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setInspectId(run.id); setCompare(false) } }}><div className="flex items-center justify-between"><strong>Run {run.number}</strong><StatusTag status={run.status} /></div><div className="muted mt-2 text-xs">{formatDate(run.start_time)} · {formatDuration(run.duration)} · {run.totals.passed} Pass / {run.totals.failed} Fail</div><div className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{run.trigger} trigger</div></div>)}</div>
    <div className="panel overflow-hidden"><div className="panel-header"><h2 className="panel-title">{compare ? 'Run comparison' : 'Run details'}</h2></div>{compare ? <DiffView runA={script.runs.find(r => r.id === a)} runB={script.runs.find(r => r.id === b)} /> : <RunReadOnly run={script.runs.find(r => r.id === inspectId)} />}</div>
  </div></section>
}

function ScheduledView() {
  const allScripts = useStudio(s => s.scripts)
  const scripts = useMemo(() => allScripts.filter(script => script.schedule.enabled), [allScripts])
  const startRun = useStudio(s => s.startRun)
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick(v => v + 1), 1000); return () => clearInterval(id) }, [])
  const nextRun = script => {
    const [hour, minute] = script.schedule.time.split(':').map(Number); const next = new Date(); next.setHours(hour, minute, 0, 0)
    if (script.schedule.interval === 'hourly') { next.setHours(new Date().getHours(), minute, 0, 0); if (next <= new Date()) next.setHours(next.getHours() + 1) }
    else if (next <= new Date()) next.setDate(next.getDate() + (script.schedule.interval === 'weekly' ? 7 : 1))
    return next
  }
  const countdown = script => {
    const secs = Math.max(0, Math.floor((nextRun(script) - Date.now()) / 1000)); return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ${secs % 60}s`
  }
  return <section><div className="mb-5"><div className="eyebrow">Recurring automation</div><h1 className="page-title">Scheduled queue</h1><p className="muted mt-2 text-sm">Live countdowns for scripts with an enabled schedule.</p></div>
    <div className="panel overflow-hidden">{scripts.length ? scripts.map(script => <div key={script.id} className="run-row flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="rounded-full bg-blue-100 p-2 text-blue-700"><Time size={18} /></span><div><strong>{script.name}</strong><div className="muted mt-1 text-xs capitalize">{script.schedule.interval} at {script.schedule.time}</div><div className="mt-1 text-xs">Next {formatDate(nextRun(script))} · <span className="font-mono font-semibold text-slate-800">{countdown(script)}</span></div></div></div><Button size="sm" renderIcon={Play} onClick={() => startRun(script.id, 'schedule')}>Trigger now</Button></div>) : <div className="empty-state"><Calendar size={34} className="mx-auto mb-3" /><h2 className="font-semibold text-slate-900">No scheduled scripts</h2><p className="mt-2 text-sm">Open a script in the editor and use Schedule to add it to this queue.</p></div>}</div>
  </section>
}

function definitionFor(script) {
  if (!script) return { script: null }
  return { script: { id: script.id, name: script.name, target_url: script.target_url, version: script.version, schedule: script.schedule,
    steps: script.steps.map(step => ({ id: step.id, order: step.order, type: step.type, params: step.params, disabled: step.disabled })) } }
}
function reportFor(script) {
  const run = script?.runs.at(-1)
  if (!run) return { run: null }
  return runReportSchema.parse({ run: { id: run.id, trigger: run.trigger, start_time: run.start_time, duration: run.duration, totals: run.totals,
    steps: run.steps.map(step => ({ order: step.order, type: step.type, status: step.status, attempts: step.attempts, ...(step.error_reason ? { error_reason: step.error_reason } : {}), ...(step.extracted_name ? { extracted_name: step.extracted_name, extracted_value: step.extracted_value } : {}) })),
  } })
}

function ExportView() {
  const script = useStudio(getSelectedScript)
  const tab = useStudio(s => s.exportTab)
  const copied = useStudio(s => s.copied)
  const setUi = useStudio(s => s.setUi)
  const value = JSON.stringify(tab === 'definition' ? definitionFor(script) : reportFor(script), null, 2)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    const label = tab === 'definition' ? 'Definition JSON' : 'Run report'
    setUi({ copied: true, announcement: `${label} copied to the clipboard.` })
    useStudio.getState().toastMessage(`${label} copied`)
    setTimeout(() => setUi({ copied: false }), 1800)
  }
  return <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">API-shaped artifacts</div><h1 className="page-title">Export center</h1><p className="muted mt-2 text-sm">The visible payload compiles live from the current Zustand session.</p></div><Button className={`copy-export-btn${copied ? ' copied' : ''}`} onClick={copy}><span className="copy-icon inline-flex items-center gap-2">{copied ? <Checkmark size={16} /> : <Copy size={16} />}{copied ? `${tab === 'definition' ? 'Definition JSON' : 'Run report'} copied` : 'Copy export'}</span></Button></div>
    <div className="panel overflow-hidden"><div className="panel-header"><div className="flex gap-1"><button className={`view-tab ${tab === 'definition' ? 'active' : ''}`} onClick={() => setUi({ exportTab: 'definition' })}>Definition JSON</button><button className={`view-tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setUi({ exportTab: 'report' })}>Run report</button></div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" /><span className="text-xs font-semibold text-green-700">Compiled from session state</span></div></div><pre className="export-code" aria-label="Export preview">{value}</pre></div>
  </section>
}

function ScreenshotModal() {
  const modal = useStudio(s => s.screenshotModal)
  const setUi = useStudio(s => s.setUi)
  return <Modal passiveModal open={!!modal} modalHeading={modal?.label || 'Screenshot'} onRequestClose={() => setUi({ screenshotModal: null })}><div className="screenshot-full"><div className="text-center"><DataView size={64} className="mx-auto mb-4" /><strong className="text-xl">Simulated browser capture</strong><p className="mt-2 text-sm">{modal?.label}</p><p className="mt-1 text-xs opacity-70">Generated locally · no outbound request</p></div></div></Modal>
}

function App() {
  const view = useStudio(s => s.view)
  const toast = useStudio(s => s.toast)
  const announcement = useStudio(s => s.announcement)
  const setUi = useStudio(s => s.setUi)
  const undo = useStudio(s => s.undo)
  const redo = useStudio(s => s.redo)
  const density = useStudio(s => s.density)
  const onboardingOpen = useStudio(s => s.onboardingOpen)
  const dismissOnboarding = useStudio(s => s.dismissOnboarding)
  const newScriptRef = useRef(null)
  useEffect(() => {
    const onKey = event => {
      const meta = event.ctrlKey || event.metaKey
      if (meta && event.key.toLowerCase() === 'k') { event.preventDefault(); setUi({ paletteOpen: true, paletteQuery: '', paletteIndex: 0 }) }
      if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); undo() }
      if (meta && event.key.toLowerCase() === 'z' && event.shiftKey) { event.preventDefault(); redo() }
      if (event.key === 'Escape') {
        const state = useStudio.getState()
        if (state.paletteOpen) { setUi({ paletteOpen: false }); return }
        if (state.newScriptModal) { setUi({ newScriptModal: false }); return }
        if (state.scheduleOpen) { setUi({ scheduleOpen: false }); return }
        if (state.screenshotModal) { setUi({ screenshotModal: null }); return }
        if (state.historyOpen) { setUi({ historyOpen: false }) }
      }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])
  const page = { 'step-editor': <EditorView />, playground: <PlaygroundView />, runs: <RunsView />, 'scheduled-queue': <ScheduledView />, export: <ExportView /> }[view]
  return <div className="app-shell" data-density={density}><Sidebar newScriptRef={newScriptRef} /><div className="workspace"><Toolbar /><main className="content">{onboardingOpen && <section className="onboarding-card" aria-label="Automation studio quick start"><div><strong>Build, run, and export your first automation</strong><p>Choose a seeded script, edit its ordered steps, then run it to watch the console and report update together.</p></div><Button size="sm" kind="ghost" onClick={dismissOnboarding}>Dismiss tips</Button></section>}{page}</main></div>
    <HistoryDrawer /><NewScriptModal launcherRef={newScriptRef} /><ScheduleModal /><ScreenshotModal /><AnimatePresence><CommandPalette /></AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast-stack" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><InlineNotification lowContrast kind="success" title={toast.message} /></motion.div>}</AnimatePresence>
    <div className="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</div>
  </div>
}

export { definitionFor, reportFor }
export default App
