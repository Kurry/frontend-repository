import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Button,
  IconButton,
  Select,
  SelectItem,
  ProgressBar,
  Tag,
  ToastNotification,
} from '@carbon/react'
import {
  Add,
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarAdd,
  CaretRight,
  CheckmarkFilled,
  Close,
  Compare,
  DocumentImport,
  Edit,
  ErrorFilled,
  Events,
  Export,
  Launch,
  Menu,
  Pause,
  Play,
  Redo,
  Renew,
  Restart,
  EventSchedule,
  Stop,
  Time,
  TrashCan,
  Undo,
} from '@carbon/icons-react'
import { ComposerModal } from './components/ComposerModal'
import {
  CalendarModal,
  CompareModal,
  DeleteModal,
  ExportModal,
  ImportModal,
  OpenExportButton,
  ScheduleModal,
} from './components/Modals'
import { StatusBadge } from './components/StatusBadge'
import { ITEM_STATUSES, MODELS, formatMoney, type ItemStatus } from './contracts'
import { deriveRollups, type Job, type Run, type RunItem, useBatchStore } from './store'

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDuration = (ms: number | null) => {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
const summarize = (input: string) => input.length > 60 ? `${input.slice(0, 60)}…` : input

function jobTagType(status: Job['status']) {
  if (status === 'Running') return 'blue' as const
  if (status === 'Paused' || status === 'Scheduled') return 'warm-gray' as const
  if (status === 'Complete') return 'green' as const
  if (status === 'Stopped') return 'cool-gray' as const
  return 'gray' as const
}

function App() {
  const jobs = useBatchStore((state) => state.jobs)
  const selectedJobId = useBatchStore((state) => state.selectedJobId)
  const selectedRunId = useBatchStore((state) => state.selectedRunId)
  const pastLength = useBatchStore((state) => state.past.length)
  const futureLength = useBatchStore((state) => state.future.length)
  const ui = useBatchStore((state) => state.ui)
  const setUi = useBatchStore((state) => state.setUi)
  const undo = useBatchStore((state) => state.undo)
  const redo = useBatchStore((state) => state.redo)
  const simulateWindowStart = useBatchStore((state) => state.simulateWindowStart)
  const clearToast = useBatchStore((state) => state.clearToast)

  const selectedJob = jobs.find((job) => job.id === selectedJobId)
  const selectedRun = selectedJob?.runs.find((run) => run.id === selectedRunId) ?? selectedJob?.runs.at(-1)
  const scheduledCount = jobs.filter((job) => job.schedule).length

  useEffect(() => {
    if (!ui.toast) return
    const timer = window.setTimeout(clearToast, 4200)
    return () => window.clearTimeout(timer)
  }, [ui.toast, clearToast])

  return (
    <div className="app-shell">
      <header className="topbar">
        <IconButton className="mobile-menu" kind="ghost" size="md" label="Open job sidebar" onClick={() => setUi({ sidebarOpen: !ui.sidebarOpen })}><Menu /></IconButton>
        <div className="brand-mark" aria-hidden="true">B·</div>
        <div><div className="topbar-kicker">Inference operations</div><div className="topbar-title">Batchline operator</div></div>
        <div className="topbar-spacer" />
        <IconButton className="desktop-tool" kind="ghost" size="md" label="Undo last state edit" disabled={!pastLength} onClick={undo}><Undo /></IconButton>
        <IconButton className="desktop-tool" kind="ghost" size="md" label="Redo state edit" disabled={!futureLength} onClick={redo}><Redo /></IconButton>
        <Button className="desktop-tool" kind="ghost" size="sm" renderIcon={Calendar} data-modal-opener="calendar" onClick={() => setUi({ calendarOpen: true })}>Calendar ({scheduledCount})</Button>
        <Button className="desktop-tool" kind="ghost" size="sm" renderIcon={DocumentImport} data-modal-opener="import" onClick={() => setUi({ importOpen: true })}>Import run</Button>
        <Button size="sm" renderIcon={Add} data-modal-opener="composer" onClick={() => setUi({ composerOpen: true, editingJobId: null })}>New job</Button>
      </header>
      <div className="workspace">
        {ui.sidebarOpen && <button className="sidebar-backdrop" aria-label="Close job sidebar" onClick={() => setUi({ sidebarOpen: false })} />}
        <JobSidebar />
        <main className="main">
          {selectedJob ? <JobDetail job={selectedJob} run={selectedRun} /> : <EmptySelection />}
        </main>
      </div>

      <ComposerModal />
      <ScheduleModal />
      <ExportModal />
      <ImportModal />
      <CalendarModal />
      <CompareModal />
      <DeleteModal />
      {ui.toast && <div className="toast-layer"><ToastNotification kind={ui.toast.kind} lowContrast title={ui.toast.title} subtitle={ui.toast.subtitle} timeout={0} onCloseButtonClick={clearToast} /></div>}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{ui.announcement}</div>
    </div>
  )
}

function JobSidebar() {
  const jobs = useBatchStore((state) => state.jobs)
  const selectedJobId = useBatchStore((state) => state.selectedJobId)
  const sidebarOpen = useBatchStore((state) => state.ui.sidebarOpen)
  const selectJob = useBatchStore((state) => state.selectJob)
  const setUi = useBatchStore((state) => state.setUi)
  const [query, setQuery] = useState('')
  const filtered = jobs.filter((job) => job.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Job sidebar">
      <div className="sidebar-head">
        <div className="sidebar-title-row"><span className="sidebar-title">Jobs</span><span className="count-badge" aria-label={`${jobs.length} jobs`}>{jobs.length}</span></div>
        <input className="job-search" aria-label="Search jobs" placeholder="Search job names" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <nav className="job-list" aria-label="Jobs">
        {filtered.map((job) => (
          <button key={job.id} className={`job-card ${selectedJobId === job.id ? 'selected' : ''}`} onClick={() => selectJob(job.id)} aria-current={selectedJobId === job.id ? 'page' : undefined}>
            <span className="job-name">{job.name}</span>
            <span className="job-meta"><Tag size="sm" type={jobTagType(job.status)}>{job.status}</Tag><span>{job.dataset.length} rows</span><span>·</span><span>{formatDate(job.createdAt)}</span></span>
            {job.schedule && <span className="schedule-mini"><EventSchedule size={13} /><span>{formatDateTime(job.schedule.windowStart)} → {formatDateTime(job.schedule.windowEnd)}</span></span>}
          </button>
        ))}
        {!filtered.length && <div className="panel-empty">No jobs match “{query}”. Clear the search or create a new job.</div>}
      </nav>
      <div className="border-t border-[#e0e0e0] p-2 grid grid-cols-2 gap-2 md:hidden">
        <Button kind="ghost" size="sm" renderIcon={Undo} disabled={!useBatchStore.getState().past.length} onClick={() => useBatchStore.getState().undo()}>Undo</Button>
        <Button kind="ghost" size="sm" renderIcon={Redo} disabled={!useBatchStore.getState().future.length} onClick={() => useBatchStore.getState().redo()}>Redo</Button>
        <Button className="col-span-2" kind="ghost" size="sm" renderIcon={Calendar} onClick={() => setUi({ calendarOpen: true })}>Schedule calendar</Button>
        <Button className="col-span-2" kind="ghost" size="sm" renderIcon={DocumentImport} onClick={() => setUi({ importOpen: true, sidebarOpen: false })}>Import run</Button>
      </div>
    </aside>
  )
}

function EmptySelection() {
  const setUi = useBatchStore((state) => state.setUi)
  return <div className="empty-state"><div className="empty-state-inner"><div className="empty-icon"><Events size={24} /></div><h1 className="text-2xl font-normal">No job selected</h1><p className="mt-2 mb-5 text-sm text-subtle">Select a job from the sidebar to inspect its runs, or compose a new API-shaped batch job.</p><Button renderIcon={Add} data-modal-opener="composer" onClick={() => setUi({ composerOpen: true, editingJobId: null })}>Create a job</Button></div></div>
}

function JobDetail({ job, run }: { job: Job; run?: Run }) {
  const setUi = useBatchStore((state) => state.setUi)
  const launchJob = useBatchStore((state) => state.launchJob)
  const pauseJob = useBatchStore((state) => state.pauseJob)
  const resumeJob = useBatchStore((state) => state.resumeJob)
  const requestDelete = useBatchStore((state) => state.requestDelete)
  const model = MODELS.find((entry) => entry.id === job.model)
  const activeRun = [...job.runs].reverse().find((entry) => entry.status === 'running' || entry.status === 'paused')
  const isRunning = activeRun?.status === 'running'
  const isPaused = activeRun?.status === 'paused'
  const canLaunch = !isRunning && !isPaused
  const openCompare = () => {
    const latest = job.runs.at(-1)?.id ?? null
    const previous = job.runs.at(-2)?.id ?? null
    setUi({ compareOpen: true, compareA: previous, compareB: latest })
  }
  return (
    <>
      <section className="detail-header">
        <div>
          <div className="eyebrow">{job.status} · {job.runs.length} run {job.runs.length === 1 ? 'record' : 'records'}</div>
          <h1 className="detail-title">{job.name}</h1>
          <div className="detail-subtitle"><span>{model?.label} · ${model?.rate.toFixed(3)} / 1K tokens</span><span>{job.promptTemplate}</span><span>Concurrency {job.concurrency}</span></div>
        </div>
        <div className="action-row" aria-label="Job actions">
          <Button kind="ghost" size="sm" renderIcon={Edit} onClick={() => setUi({ composerOpen: true, editingJobId: job.id })}>Edit</Button>
          <Button kind="ghost" size="sm" renderIcon={CalendarAdd} data-modal-opener="schedule" onClick={() => setUi({ scheduleOpen: true })}>Schedule</Button>
          <Button kind="ghost" size="sm" renderIcon={Compare} disabled={job.runs.length < 2} onClick={openCompare}>Compare runs</Button>
          <OpenExportButton kind="ghost" size="sm" />
          <Button kind="danger--ghost" size="sm" renderIcon={TrashCan} data-modal-opener="delete" onClick={() => requestDelete(job.id)}>Delete</Button>
          {isRunning ? <Button size="sm" renderIcon={Pause} onClick={() => pauseJob(job.id)}>Pause</Button> : isPaused ? <Button size="sm" renderIcon={Play} onClick={() => resumeJob(job.id)}>Resume</Button> : <Button size="sm" renderIcon={Launch} disabled={!canLaunch} data-action="launch-job" onClick={() => launchJob(job.id)}>Launch</Button>}
        </div>
      </section>
      {!run ? <ReadyState job={job} /> : <RunWorkspace job={job} run={run} />}
    </>
  )
}

function ReadyState({ job }: { job: Job }) {
  const launchJob = useBatchStore((state) => state.launchJob)
  return (
    <section className="ready-hero">
      <div><div className="eyebrow">Ready workload</div><h2 className="ready-title">{job.dataset.length} items are staged for inference.</h2><p className="ready-copy">Launch creates exactly one run and fills the execution grid from this payload. The deterministic first-failure subset stays stable for this job configuration.</p><Button size="lg" renderIcon={Launch} onClick={() => launchJob(job.id)}>Launch batch</Button></div>
      <div className="ready-stats"><div className="ready-stat"><strong>{job.concurrency}</strong><span>Maximum concurrent items</span></div><div className="ready-stat"><strong>{job.dataset.filter((row) => row.expected !== undefined).length}</strong><span>Rows with expected output</span></div><div className="ready-stat"><strong>{job.schedule ? 'Scheduled' : 'Manual'}</strong><span>Launch mode</span></div></div>
    </section>
  )
}

function RunWorkspace({ job, run }: { job: Job; run: Run }) {
  const rollups = deriveRollups(run, job.concurrency)
  const running = run.items.filter((item) => item.status === 'running').length
  const settled = run.items.filter((item) => ['complete', 'failed', 'stopped'].includes(item.status)).length
  const progress = run.items.length ? (settled / run.items.length) * 100 : 0
  const failedCount = run.items.filter((item) => item.status === 'failed').length
  const pauseJob = useBatchStore((state) => state.pauseJob)
  const resumeJob = useBatchStore((state) => state.resumeJob)
  const stopJob = useBatchStore((state) => state.stopJob)
  const retryFailed = useBatchStore((state) => state.retryFailed)
  return (
    <>
      <section className="rollups" aria-label="Live run rollups">
        <div className="metric"><span className="metric-label">Completed</span><strong className="metric-value">{rollups.completed} of {rollups.total}</strong><div className="metric-note">Successful outputs</div></div>
        <div className="metric"><span className="metric-label">Failure rate</span><strong className="metric-value">{rollups.failureRate.toFixed(1)}%</strong><div className="metric-note">{failedCount} failed items</div></div>
        <div className="metric"><span className="metric-label">Estimated remaining</span><strong className="metric-value">{formatDuration(rollups.estimatedRemainingMs)}</strong><div className="metric-note">{run.status === 'paused' ? 'Frozen at checkpoint' : 'Updates from item latency'}</div></div>
        <div className="metric"><span className="metric-label">Accumulated cost</span><strong className="metric-value">{formatMoney(rollups.totalCost)}</strong><div className="metric-note">Model-token rate</div></div>
      </section>
      <section className="progress-panel" aria-label="Run progress">
        <div className="progress-top"><strong>Run progress</strong><span>{settled} of {run.items.length} settled · {Math.round(progress)}%</span></div>
        <ProgressBar label="Items settled" hideLabel value={settled} max={run.items.length} helperText={`${settled} of ${run.items.length}`} />
        <div className={`guard-strip ${running === job.concurrency && running > 0 ? 'saturated' : ''}`}><span className="guard-dot" /><strong>{running} of {job.concurrency} running</strong><span>{running === job.concurrency && running > 0 ? 'Concurrency limit saturated' : 'Concurrency capacity available'}</span></div>
      </section>
      <section className="macrobar" aria-label="Bulk run macros">
        <span className="macro-label">Bulk macros</span>
        <Button kind="ghost" size="sm" renderIcon={Play} disabled={run.status === 'running' || run.status === 'complete' || run.status === 'stopped'} onClick={() => resumeJob()}>Start all</Button>
        <Button kind="ghost" size="sm" renderIcon={Pause} disabled={run.status !== 'running'} onClick={() => pauseJob()}>Pause all</Button>
        <Button kind="ghost" size="sm" renderIcon={Stop} disabled={!['running', 'paused'].includes(run.status)} onClick={() => stopJob()}>Stop all</Button>
        <div className="flex-1" />
        <Button kind="ghost" size="sm" renderIcon={Restart} disabled={!failedCount || ['running', 'paused'].includes(run.status)} title={!failedCount ? 'There are no failed items to retry' : 'Only failed items are re-queued'} onClick={() => retryFailed()}>Retry failed items ({failedCount})</Button>
      </section>
      <div className="content-grid">
        <ExecutionGrid run={run} />
        <div className="side-stack"><PendingQueue run={run} /><Timeline run={run} /><RunHistory job={job} run={run} /></div>
        <InspectorPanel job={job} run={run} />
      </div>
    </>
  )
}

function ExecutionGrid({ run }: { run: Run }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const inspectorIndex = useBatchStore((state) => state.ui.inspectorIndex)
  const highlightedIndex = useBatchStore((state) => state.ui.highlightedIndex)
  const setUi = useBatchStore((state) => state.setUi)
  const virtualizer = useVirtualizer({ count: run.items.length, getScrollElement: () => parentRef.current, estimateSize: () => 52, overscan: 12, scrollPaddingStart: 40 })
  useEffect(() => {
    if (highlightedIndex !== null) virtualizer.scrollToIndex(highlightedIndex, { align: 'center', behavior: 'smooth' })
  }, [highlightedIndex, virtualizer])
  return (
    <section className="panel" aria-label="Execution grid">
      <div className="panel-head"><div><h2 className="panel-heading">Per-item execution</h2><p className="panel-caption">Virtualized · {run.items.length} item rows</p></div><Tag type={run.status === 'running' ? 'blue' : run.status === 'paused' ? 'warm-gray' : 'gray'}>{run.status}</Tag></div>
      <div className="virtual-grid" ref={parentRef} role="grid" aria-rowcount={run.items.length} tabIndex={0}>
        <div className="grid-header" role="row"><span role="columnheader">Row</span><span role="columnheader">Input</span><span role="columnheader">Status</span><span role="columnheader">Attempts</span><span role="columnheader">Latency</span><span role="columnheader">Cost</span></div>
        <div style={{ height: `${virtualizer.getTotalSize() + 40}px`, position: 'relative', width: '100%' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = run.items[virtualRow.index]
            const countdown = item.retryAt ? Math.max(0, Math.ceil((item.retryAt - Date.now()) / 1000)) : undefined
            const settling = item.status === 'complete' && item.completedAt && Date.now() - Date.parse(item.completedAt) < 400
            return (
              <button
                key={item.index}
                className={`grid-row ${highlightedIndex === item.index ? 'highlighted' : ''} ${inspectorIndex === item.index ? 'inspected' : ''} ${item.reconciling ? 'reconciling' : ''} ${settling ? 'item-settling' : ''}`}
                style={{ transform: `translateY(${virtualRow.start}px)`, animationDelay: settling ? `${(item.index % 8) * 60}ms` : undefined }}
                role="row"
                aria-rowindex={item.index + 1}
                aria-label={`Inspect item ${item.index + 1}, ${item.status}`}
                onClick={() => setUi({ inspectorIndex: inspectorIndex === item.index ? null : item.index })}
              >
                <span className="grid-cell row-index" role="gridcell">{item.index + 1}</span>
                <span className="grid-cell input-summary" role="gridcell" title={item.input}>{summarize(item.input)}</span>
                <span className="grid-cell" role="gridcell"><StatusBadge status={item.status} countdown={countdown} />{item.reconciling && <span className="attempt-sub">Reconciling…</span>}{item.error && <span className="attempt-sub" title={item.error}>Retry limit reached</span>}</span>
                <span className="grid-cell" role="gridcell">{item.attempts}{item.status === 'retrying' && <span className="attempt-sub">next {Math.min(3, item.attempts + 1)} of 3</span>}</span>
                <span className="grid-cell" role="gridcell">{item.latencyMs === null ? '—' : `${Math.round(item.latencyMs)} ms`}</span>
                <span className="grid-cell" role="gridcell">{formatMoney(item.cost)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PendingQueue({ run }: { run: Run }) {
  const reorderQueue = useBatchStore((state) => state.reorderQueue)
  const moveQueueItem = useBatchStore((state) => state.moveQueueItem)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const visibleQueue = run.queue.slice(0, 80)

  const focusQueueEntry = (itemIndex: number) => {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-queue-item="${itemIndex}"] [aria-label^="Move item"]`)?.focus()
    })
  }

  const moveEntry = (itemIndex: number, direction: -1 | 1) => {
    moveQueueItem(itemIndex, direction)
    focusQueueEntry(itemIndex)
  }
  return (
    <section className="panel" aria-label="Pending queue">
      <div className="panel-head"><div><h2 className="panel-heading">Pending queue</h2><p className="panel-caption">Launch order · drag or use arrow controls</p></div><Tag size="sm" type="gray">{run.queue.length}</Tag></div>
      {run.queue.length ? <div className="queue-list">{visibleQueue.map((itemIndex, position) => {
        const item = run.items[itemIndex]
        return <div
          key={itemIndex}
          data-queue-item={itemIndex}
          className={`queue-entry ${dragIndex === position ? 'dragging' : ''}`}
          draggable
          onDragStart={(event) => { setDragIndex(position); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(position)) }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
          onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) reorderQueue(from, position); setDragIndex(null) }}
          onDragEnd={() => setDragIndex(null)}
        >
          <span className="queue-handle" aria-hidden="true">⋮⋮</span>
          <span className="queue-copy"><span className="queue-index">#{item.index + 1}</span><span className="queue-input" title={item.input}>{summarize(item.input)}</span></span>
          <span className="queue-buttons"><button type="button" className="mini-icon-button queue-move" aria-label={`Move item ${item.index + 1} up`} disabled={position === 0} onClick={() => moveEntry(itemIndex, -1)}><ArrowUp size={14} /></button><button type="button" className="mini-icon-button queue-move" aria-label={`Move item ${item.index + 1} down`} disabled={position === run.queue.length - 1} onClick={() => moveEntry(itemIndex, 1)}><ArrowDown size={14} /></button></span>
        </div>
      })}{run.queue.length > visibleQueue.length && <div className="panel-empty">Showing the next {visibleQueue.length} of {run.queue.length} queued items.</div>}</div> : <div className="panel-empty">No pending items. New work appears here before it starts.</div>}
    </section>
  )
}

function Timeline({ run }: { run: Run }) {
  const filter = useBatchStore((state) => state.ui.timelineFilter)
  const setUi = useBatchStore((state) => state.setUi)
  const entries = (filter === 'all' ? run.timeline : run.timeline.filter((entry) => entry.status === filter)).slice().reverse().slice(0, 120)
  return (
    <section className="panel" aria-label="Event timeline">
      <div className="panel-head"><div><h2 className="panel-heading">Event timeline</h2><p className="panel-caption">Ordered item transitions</p></div><Select className="timeline-filter" hideLabel id="timeline-filter" labelText="Filter timeline status" size="sm" value={filter} onChange={(event) => setUi({ timelineFilter: event.target.value as 'all' | ItemStatus })}><SelectItem value="all" text="All statuses" />{ITEM_STATUSES.map((status) => <SelectItem key={status} value={status} text={status[0].toUpperCase() + status.slice(1)} />)}</Select></div>
      {entries.length ? <div className="timeline-list">{entries.map((entry) => <button key={entry.id} className={`timeline-entry ${entry.status}`} onClick={() => setUi({ highlightedIndex: entry.itemIndex })}><StatusBadge status={entry.status} /><span><span className="timeline-label">{entry.label}</span><span className="timeline-time">{new Date(entry.timestamp).toLocaleTimeString()}</span></span></button>)}</div> : <div className="panel-empty">No {filter === 'all' ? '' : `${filter} `}events match this timeline filter.</div>}
    </section>
  )
}

function RunHistory({ job, run }: { job: Job; run: Run }) {
  const selectRun = useBatchStore((state) => state.selectRun)
  return (
    <section className="panel" aria-label="Run history">
      <div className="panel-head"><div><h2 className="panel-heading">Run history</h2><p className="panel-caption">Select a durable run snapshot</p></div><Tag size="sm" type="blue">{job.runs.length}</Tag></div>
      <div className="history-list">{job.runs.slice().reverse().map((entry, reverseIndex) => {
        const complete = entry.items.filter((item) => item.status === 'complete').length
        const failed = entry.items.filter((item) => item.status === 'failed').length
        const stopped = entry.items.filter((item) => item.status === 'stopped').length
        return <button key={entry.id} className={`history-entry ${entry.id === run.id ? 'selected' : ''}`} onClick={() => selectRun(entry.id)}><span><span className="history-date">Run {job.runs.length - reverseIndex} · {formatDateTime(entry.startedAt)}</span><span className="history-counts">{complete} complete · {failed} failed · {stopped} stopped</span></span><CaretRight size={16} /></button>
      })}</div>
    </section>
  )
}

function TokenDiff({ expected, actual }: { expected: string; actual: string }) {
  const expectedTokens = expected.trim().split(/\s+/).filter(Boolean)
  const actualTokens = actual.trim().split(/\s+/).filter(Boolean)
  const max = Math.max(expectedTokens.length, actualTokens.length)
  return <div className="token-diff">{Array.from({ length: max }, (_, index) => {
    const act = actualTokens[index]
    const exp = expectedTokens[index]
    if (act === undefined && exp !== undefined) {
      return <span key={index} className="diff-token different" title={`Different from expected: ${exp}`}>≠ missing: {exp}</span>
    }
    if (exp === undefined && act !== undefined) {
      return <span key={index} className="diff-token different" title="Extra output not in expected">≠ extra: {act}</span>
    }
    const match = act === exp
    const title = match ? 'Matching segment' : `Different from expected: ${exp}`
    return <span key={index} className={`diff-token ${match ? 'match' : 'different'}`} title={title}>{match ? '✓ ' : '≠ '}{act}</span>
  })}</div>
}

function InspectorPanel({ job, run }: { job: Job; run: Run }) {
  const inspectorIndex = useBatchStore((state) => state.ui.inspectorIndex)
  const setUi = useBatchStore((state) => state.setUi)
  const item = inspectorIndex === null ? null : run.items.find((entry) => entry.index === inspectorIndex)
  const match = item?.expected !== undefined && item.output !== null && item.output.trim() === item.expected.trim()

  return (
    <aside className={`inspector-dock ${item ? 'open' : ''}`} aria-label="Result inspector">
      <div className="inspector-head"><div><div className="topbar-kicker">Result inspector</div><h2 className="panel-heading">{item ? `Item ${item.index + 1}` : 'Select a row'}</h2></div>{item && <IconButton kind="ghost" label="Close inspector" onClick={() => setUi({ inspectorIndex: null })}><Close /></IconButton>}</div>
      <div className="inspector-body">
        {!item ? (
          <div className="panel-empty">Click an execution grid row to inspect full input, simulated output, attempts log, and expected comparison.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2"><StatusBadge status={item.status} /><Tag type="gray">{item.attempts} {item.attempts === 1 ? 'attempt' : 'attempts'}</Tag><Tag type="blue">{formatMoney(item.cost)}</Tag>{item.latencyMs !== null && <Tag type="cool-gray">{Math.round(item.latencyMs)} ms</Tag>}</div>
            <section className="inspect-section"><div className="inspect-label">Full input</div><div className="inspect-content">{item.input}</div></section>
            <section className="inspect-section"><div className="inspect-label">Full simulated output</div><div className="inspect-content">{item.output ?? (item.error ? `No output — ${item.error}` : 'Output has not been produced yet.')}</div></section>
            {item.expected !== undefined && item.output !== null && (
              <section className="inspect-section">
                <div className="inspect-label flex justify-between"><span>Expected / actual comparison</span><Tag size="sm" type={match ? 'green' : 'red'}>{match ? '✓ Match' : '≠ Mismatch'}</Tag></div>
                <div className="inspect-content diff-block">
                  <div className={match ? 'diff-line diff-match' : 'diff-line diff-expected'}><strong>Expected:</strong> {item.expected}</div>
                  <div className={match ? 'diff-line diff-match' : 'diff-line diff-actual'}><strong>Actual:</strong> {item.output}</div>
                  <TokenDiff expected={item.expected} actual={item.output} />
                </div>
              </section>
            )}
            <section className="inspect-section"><div className="inspect-label">Attempts log</div>{item.attemptsLog.length ? item.attemptsLog.map((attempt, index) => <div className="attempt-line" key={`${attempt.attempt}-${index}`}><strong>Attempt {attempt.attempt}</strong><span>{new Date(attempt.timestamp).toLocaleString()}<br /><span className="text-subtle">{attempt.detail}</span></span>{attempt.outcome === 'complete' ? <CheckmarkFilled className="text-success" /> : <ErrorFilled className="text-danger" />}</div>) : <div className="panel-empty">No attempts have started for this item.</div>}</section>
            <p className="text-xs text-subtle">Model: {job.model} · Run started {new Date(run.startedAt).toLocaleString()}</p>
          </>
        )}
      </div>
    </aside>
  )
}

export default App
