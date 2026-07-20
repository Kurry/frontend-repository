import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  NativeSelect,
  Portal,
  Progress,
  Table,
  Tabs,
  Toast,
  Toaster,
  createToaster,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowClockwise,
  ArrowRight,
  ArrowsClockwise,
  CaretRight,
  Check,
  Clipboard,
  ClockCountdown,
  CloudArrowDown,
  CloudArrowUp,
  Code,
  Database,
  DownloadSimple,
  Export,
  FunnelSimple,
  Gauge,
  ListBullets,
  Pause,
  Play,
  Plus,
  Pulse,
  Queue,
  Stop,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createJobSchema, DATASETS, AGENTS, MODELS, STATUSES } from './schemas'
import { buildSnapshot, deriveAggregates, getProviderStats, MODEL_COLORS, useQueueStore } from './store'
import { registerWebMcp } from './webmcp'

const toaster = createToaster({ placement: 'bottom-end', pauseOnPageIdle: true })
const filterSchema = z.object({
  status: z.union([z.literal(''), z.enum(STATUSES)]),
  model: z.union([z.literal(''), z.enum(MODELS)]),
  dataset: z.union([z.literal(''), z.enum(DATASETS)]),
})
const importDraftSchema = z.object({ snapshot: z.string().min(1, 'Queue Snapshot JSON is required') })
const timelineFilterSchema = z.object({ status: z.union([z.literal(''), z.enum(STATUSES)]) })

const statusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1)
const shortTime = (iso) => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
const fullTime = (iso) => new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso))

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
}

function StatusBadge({ status, pulse = true }) {
  return (
    <Badge className={`status-badge status-${status}`} aria-label={`Status: ${status}`}>
      <span className={pulse && status === 'running' ? 'status-dot pulsing' : 'status-dot'} aria-hidden="true" />
      {statusLabel(status)}
    </Badge>
  )
}

function RateBadge({ rate }) {
  return <Badge className={`rate-badge rate-${rate}`}>{rate}</Badge>
}

function FieldError({ id, message }) {
  if (!message) return null
  return <p id={id} className="field-error" role="alert" aria-live="polite"><WarningCircle size={14} weight="fill" aria-hidden="true" />{message}</p>
}

function DialogShell({ open, onOpenChange, title, description, children, size = 'lg' }) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)} size={size} placement="center" motionPreset="scale">
      <Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Positioner className="dialog-positioner">
          <Dialog.Content className="dialog-content">
            <div className="dialog-header">
              <div>
                <Dialog.Title className="dialog-title">{title}</Dialog.Title>
                {description && <Dialog.Description className="dialog-description">{description}</Dialog.Description>}
              </div>
              <Dialog.CloseTrigger asChild>
                <button className="icon-button" aria-label={`Close ${title}`}><X size={18} aria-hidden="true" /></button>
              </Dialog.CloseTrigger>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function Header() {
  const activeView = useQueueStore((state) => state.activeView)
  const setActiveView = useQueueStore((state) => state.setActiveView)
  const setChrome = useQueueStore((state) => state.setChrome)
  const refreshExport = useQueueStore((state) => state.refreshExport)

  const openExport = () => {
    refreshExport()
    setChrome('exportOpen', true)
  }

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><Pulse size={21} weight="bold" aria-hidden="true" /></div>
        <div>
          <div className="eyebrow">Relaydeck console</div>
          <h1>Evaluation queue</h1>
        </div>
      </div>

      <Tabs.Root value={activeView} onValueChange={(details) => setActiveView(details.value)} className="view-tabs">
        <Tabs.List className="view-tab-list" aria-label="Queue views">
          <Tabs.Trigger value="jobs"><Queue size={16} aria-hidden="true" />Jobs</Tabs.Trigger>
          <Tabs.Trigger value="aggregates"><Gauge size={16} aria-hidden="true" />Aggregates</Tabs.Trigger>
          <Tabs.Trigger value="timeline"><ListBullets size={16} aria-hidden="true" />Timeline</Tabs.Trigger>
          <Tabs.Indicator className="tab-indicator" />
        </Tabs.List>
      </Tabs.Root>

      <div className="header-actions">
        <Button className="button button-ghost" onClick={() => setChrome('importOpen', true)}><CloudArrowUp size={17} aria-hidden="true" />Import queue</Button>
        <Button className="button button-ghost" onClick={openExport}><Export size={17} aria-hidden="true" />Export queue</Button>
        <Button className="button button-primary" onClick={() => setChrome('submitOpen', true)}><Plus size={17} weight="bold" aria-hidden="true" />Submit job</Button>
      </div>
    </header>
  )
}

function SummaryStrip() {
  const jobs = useQueueStore((state) => state.jobs)
  const aggregates = useMemo(() => deriveAggregates(jobs), [jobs])
  const counts = useMemo(() => ({
    running: jobs.filter((job) => job.status === 'running').length,
    queued: jobs.filter((job) => job.status === 'queued').length,
    completed: jobs.filter((job) => job.status === 'completed').length,
  }), [jobs])
  return (
    <section className="summary-strip" aria-label="Queue summary">
      <div className="summary-intro">
        <span className="live-pill"><span />Live</span>
        <p>Provider-aware scheduling across {jobs.length} jobs</p>
      </div>
      <div className="summary-metric"><span>Running</span><strong>{counts.running}</strong></div>
      <div className="summary-metric"><span>Queued</span><strong>{counts.queued}</strong></div>
      <div className="summary-metric"><span>Completed</span><strong>{counts.completed}</strong></div>
      <div className="summary-metric cost"><span>Total cost</span><strong>${aggregates.totalCost.toFixed(2)}</strong></div>
    </section>
  )
}

function ProviderLanes() {
  const providers = useQueueStore((state) => state.providers)
  const jobs = useQueueStore((state) => state.jobs)
  const requestConfirm = useQueueStore((state) => state.requestConfirm)
  const setProviderPaused = useQueueStore((state) => state.setProviderPaused)

  return (
    <aside className="panel lanes-panel" aria-labelledby="provider-lanes-title">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Scheduler</p>
          <h2 id="provider-lanes-title">Provider lanes</h2>
        </div>
        <span className="panel-note">3 lanes</span>
      </div>
      <div className="lane-list">
        {providers.map((provider) => {
          const stats = getProviderStats(jobs, provider.id)
          const queued = jobs
            .filter((job) => job.providerId === provider.id && job.status === 'queued')
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
          const paused = provider.rateLimit === 'paused'
          return (
            <section className={`lane-card ${paused ? 'lane-paused' : ''}`} key={provider.id}>
              <div className="lane-topline">
                <div className="provider-identity">
                  <span className="provider-glyph"><Database size={17} aria-hidden="true" /></span>
                  <div><h3>{provider.name}</h3><span>{provider.id}</span></div>
                </div>
                <RateBadge rate={provider.rateLimit} />
              </div>
              <div className="lane-stats">
                <div><span>Queue depth</span><strong>{stats.queueDepth}</strong></div>
                <div><span>In flight</span><strong>{stats.inFlight}</strong></div>
                <button
                  className={`lane-toggle ${paused ? 'resume' : ''}`}
                  onClick={() => paused
                    ? setProviderPaused(provider.id, false)
                    : requestConfirm({ type: 'pause', providerId: provider.id, title: `Pause ${provider.name}?`, body: 'Running trials will freeze at their current checkpoint. Completed results remain unchanged.' })}
                  aria-label={`${paused ? 'Resume' : 'Pause'} ${provider.name}`}
                >
                  {paused ? <Play size={15} weight="fill" aria-hidden="true" /> : <Pause size={15} weight="fill" aria-hidden="true" />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
              </div>
              {queued.length > 0 ? (
                <div className="queue-mini-list" aria-label={`${provider.name} queued jobs`}>
                  {queued.slice(0, 2).map((job, index) => <span key={job.id}><b>#{index + 1}</b>{job.id}</span>)}
                </div>
              ) : <div className="lane-clear"><Check size={14} aria-hidden="true" />No waiting jobs</div>}
            </section>
          )
        })}
      </div>
    </aside>
  )
}

function Filters({ resultCount }) {
  const filters = useQueueStore((state) => state.filters)
  const setFilter = useQueueStore((state) => state.setFilter)
  const clearFilters = useQueueStore((state) => state.clearFilters)
  const { register, reset } = useForm({ resolver: zodResolver(filterSchema), defaultValues: filters, mode: 'onChange' })

  useEffect(() => reset({ status: filters.status, model: filters.model, dataset: filters.dataset }), [filters.status, filters.model, filters.dataset, reset])
  const bind = (field) => register(field, { onChange: (event) => setFilter(field, event.target.value) })
  const active = Boolean(filters.status || filters.model || filters.dataset)

  return (
    <form className="filter-toolbar" aria-label="Job filters" onSubmit={(event) => event.preventDefault()}>
      <div className="filter-title"><FunnelSimple size={16} aria-hidden="true" /><span>Filter jobs</span></div>
      <label className="compact-field"><span>Status</span><NativeSelect.Root size="sm"><NativeSelect.Field aria-label="Filter by status" {...bind('status')}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></label>
      <label className="compact-field"><span>Model</span><NativeSelect.Root size="sm"><NativeSelect.Field aria-label="Filter by model" {...bind('model')}><option value="">All models</option>{MODELS.map((model) => <option key={model}>{model}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></label>
      <label className="compact-field"><span>Dataset</span><NativeSelect.Root size="sm"><NativeSelect.Field aria-label="Filter by dataset" {...bind('dataset')}><option value="">All datasets</option>{DATASETS.map((dataset) => <option key={dataset}>{dataset}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></label>
      <span className="result-count">{resultCount} result{resultCount === 1 ? '' : 's'}</span>
      {active && <button type="button" className="clear-button" onClick={clearFilters}><X size={14} aria-hidden="true" />Clear filters</button>}
    </form>
  )
}

function queuePosition(job, jobs) {
  if (job.status !== 'queued') return null
  return jobs
    .filter((item) => item.providerId === job.providerId && item.status === 'queued')
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .findIndex((item) => item.id === job.id) + 1
}

function JobsTable() {
  const jobs = useQueueStore((state) => state.jobs)
  const filters = useQueueStore((state) => state.filters)
  const setSelectedJob = useQueueStore((state) => state.setSelectedJob)
  const selectedJobId = useQueueStore((state) => state.selectedJobId)
  const clearFilters = useQueueStore((state) => state.clearFilters)
  const requestConfirm = useQueueStore((state) => state.requestConfirm)
  const providers = useQueueStore((state) => state.providers)

  const visibleJobs = useMemo(() => jobs.filter((job) =>
    (!filters.status || job.status === filters.status) &&
    (!filters.model || job.model === filters.model) &&
    (!filters.dataset || job.dataset === filters.dataset),
  ), [jobs, filters])

  return (
    <section className="panel jobs-panel" aria-labelledby="jobs-title">
      <div className="panel-heading jobs-heading">
        <div><p className="section-kicker">Workload</p><h2 id="jobs-title">Jobs</h2></div>
        <p className="panel-subtitle">Live trial progress and provider placement</p>
      </div>
      <Filters resultCount={visibleJobs.length} />
      <div className="table-scroll">
        <Table.Root className="jobs-table" size="sm" variant="line" interactive>
          <Table.Header><Table.Row><Table.ColumnHeader>Job</Table.ColumnHeader><Table.ColumnHeader>Configuration</Table.ColumnHeader><Table.ColumnHeader>Status</Table.ColumnHeader><Table.ColumnHeader>Progress</Table.ColumnHeader><Table.ColumnHeader>Submitted</Table.ColumnHeader><Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader></Table.Row></Table.Header>
          <Table.Body>
            {visibleJobs.map((job) => {
              const provider = providers.find((item) => item.id === job.providerId)
              const position = queuePosition(job, jobs)
              const completed = job.trials.filter((trial) => trial.status === 'completed').length
              const percent = job.trialCount ? completed / job.trialCount * 100 : 0
              return (
                <Table.Row
                  key={job.id}
                  className={`${selectedJobId === job.id ? 'selected-row' : ''} ${job.isNew ? 'new-row' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${job.id} details`}
                  onClick={() => setSelectedJob(job.id)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedJob(job.id) } }}
                >
                  <Table.Cell><div className="job-id"><span>{job.id}</span><small>{provider?.name || job.providerId}</small></div></Table.Cell>
                  <Table.Cell><div className="config-cell"><strong>{job.dataset}</strong><span>{job.agent} <i>·</i> {job.model}</span></div></Table.Cell>
                  <Table.Cell><StatusBadge status={job.status} />{position ? <span className="queue-position">Queue #{position}</span> : null}</Table.Cell>
                  <Table.Cell>
                    <div className="progress-cell"><div><span>{completed} of {job.trialCount} trials</span><b>{Math.round(percent)}%</b></div><Progress.Root value={percent} className="progress-root"><Progress.Track><Progress.Range /></Progress.Track></Progress.Root></div>
                  </Table.Cell>
                  <Table.Cell><time className="submitted-time" dateTime={job.submittedAt}>{shortTime(job.submittedAt)}<small>{new Date(job.submittedAt).toLocaleDateString('en', { month: 'short', day: '2-digit' })}</small></time></Table.Cell>
                  <Table.Cell textAlign="end">
                    <div className="row-actions">
                      {['queued', 'running'].includes(job.status) && <button className="action-button danger-action" onClick={(event) => { event.stopPropagation(); requestConfirm({ type: 'cancel', jobId: job.id, title: `Cancel ${job.id}?`, body: 'Unfinished trials will stop. Completed rewards and durations will remain available.' }) }}><Stop size={15} aria-hidden="true" />Cancel</button>}
                      <button className="row-open" aria-label={`View ${job.id}`} onClick={(event) => { event.stopPropagation(); setSelectedJob(job.id) }}><CaretRight size={18} aria-hidden="true" /></button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
        {visibleJobs.length === 0 && (
          <div className="empty-state" role="status" aria-live="polite"><FunnelSimple size={28} aria-hidden="true" /><h3>No jobs match these filters</h3><p>Clear the filters to return to the full evaluation queue.</p><Button className="button button-secondary" onClick={clearFilters}>Clear filters</Button></div>
        )}
      </div>
      <JobDetail />
    </section>
  )
}

function JobDetail() {
  const selectedJobId = useQueueStore((state) => state.selectedJobId)
  const job = useQueueStore((state) => state.jobs.find((item) => item.id === selectedJobId))
  const setSelectedJob = useQueueStore((state) => state.setSelectedJob)
  const manualRetry = useQueueStore((state) => state.manualRetry)
  if (!job) return null
  return (
    <section className="job-detail" aria-labelledby="job-detail-title">
      <div className="detail-header">
        <div><p className="section-kicker">Trial inspection</p><h3 id="job-detail-title">{job.id} <StatusBadge status={job.status} /></h3><p>{job.dataset} · {job.agent} · {job.model}</p></div>
        <button className="icon-button" aria-label="Close job detail" onClick={() => setSelectedJob(null)}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="trial-grid">
        {job.trials.map((trial) => (
          <article key={trial.id} className={`trial-card trial-${trial.status}`}>
            <div className="trial-top"><code>{trial.id.split('-').at(-1)}</code><StatusBadge status={trial.status} /></div>
            <dl>
              <div><dt>Reward</dt><dd>{trial.reward === null ? '—' : trial.reward.toFixed(2)}</dd></div>
              <div><dt>Duration</dt><dd>{trial.status === 'running' ? `${trial.elapsed || 0}s live` : trial.duration === null ? '—' : `${trial.duration}s`}</dd></div>
              <div><dt>Retries</dt><dd>{trial.retryCount} / 3</dd></div>
            </dl>
            {trial.status === 'failed' && (
              <div className="trial-failure">
                <Badge className="error-chip">{trial.errorCategory}</Badge>
                {typeof trial.backoff === 'number' && trial.backoff > 0 ? (
                  <div className="backoff-indicator"><ClockCountdown size={16} aria-hidden="true" /><span>Automatic retry {trial.retryCount + 1} in</span><strong>{trial.backoff}s</strong></div>
                ) : trial.retryCount >= 3 ? (
                  <Button className="button retry-button" onClick={() => manualRetry(job.id, trial.id)}><ArrowClockwise size={15} aria-hidden="true" />Retry trial</Button>
                ) : null}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function JobsView() {
  return <div className="jobs-layout"><ProviderLanes /><JobsTable /></div>
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{payload[0].name}</strong><span>Mean reward {Number(payload[0].value).toFixed(3)}</span></div>
}

function AggregatesView() {
  const jobs = useQueueStore((state) => state.jobs)
  const [hidden, setHidden] = useState(() => new Set())
  const aggregates = useMemo(() => deriveAggregates(jobs), [jobs])
  const chartData = [{ group: 'Completed jobs', ...aggregates.meanRewardByModel }]
  const toggle = (model) => setHidden((current) => {
    const next = new Set(current)
    if (next.has(model)) next.delete(model); else next.add(model)
    return next
  })

  return (
    <div className="aggregates-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><p className="section-kicker">Quality</p><h2>Mean reward by model</h2></div><span className="panel-note">Completed jobs only</span></div>
        <div className="chart-legend" aria-label="Toggle model series">{MODELS.map((model) => <button key={model} className={hidden.has(model) ? 'legend-hidden' : ''} onClick={() => toggle(model)} aria-pressed={!hidden.has(model)}><span style={{ background: MODEL_COLORS[model] }} />{model}</button>)}</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={395} minWidth={0} minHeight={320}>
            <BarChart data={chartData} barGap={10} margin={{ top: 15, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#27322e" />
              <XAxis dataKey="group" stroke="#7e8b85" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} stroke="#7e8b85" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(114, 215, 174, .04)' }} />
              {MODELS.map((model) => !hidden.has(model) && <Bar key={model} dataKey={model} name={model} fill={MODEL_COLORS[model]} radius={[5, 5, 0, 0]} maxBarSize={58} animationDuration={400} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel cost-panel">
        <div className="cost-icon"><Gauge size={25} aria-hidden="true" /></div>
        <p>Total evaluation cost</p>
        <strong>${aggregates.totalCost.toFixed(2)}</strong>
        <span>Derived live from completed trials</span>
        <div className="model-cost-list">{MODELS.map((model) => <div key={model}><i style={{ background: MODEL_COLORS[model] }} /><span>{model}</span><b>{jobs.flatMap((job) => job.model === model ? job.trials : []).filter((trial) => trial.status === 'completed').length} trials</b></div>)}</div>
      </section>
      <section className="panel aggregate-context">
        <div><ArrowsClockwise size={20} aria-hidden="true" /><span>Live calculation</span></div><p>Rewards and cost update the moment a running trial completes. Hidden chart series remain in the queue snapshot.</p>
      </section>
    </div>
  )
}

function TimelineView() {
  const timeline = useQueueStore((state) => state.timeline)
  const filter = useQueueStore((state) => state.filters.timelineStatus)
  const setFilter = useQueueStore((state) => state.setFilter)
  const { register, reset } = useForm({ resolver: zodResolver(timelineFilterSchema), defaultValues: { status: filter }, mode: 'onChange' })
  useEffect(() => reset({ status: filter }), [filter, reset])
  const visible = filter ? timeline.filter((event) => event.status === filter) : timeline
  return (
    <section className="panel timeline-panel">
      <form className="panel-heading timeline-heading" onSubmit={(event) => event.preventDefault()}><div><p className="section-kicker">Event stream</p><h2>Completions timeline</h2></div><label className="compact-field"><span>Status</span><NativeSelect.Root size="sm"><NativeSelect.Field aria-label="Filter timeline by status" {...register('status', { onChange: (event) => setFilter('timelineStatus', event.target.value) })}><option value="">All events</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></label></form>
      <div className="timeline-list">
        {visible.map((event) => <article className="timeline-event" key={event.id}><div className={`timeline-marker marker-${event.status}`}>{event.kind === 'job' ? <Queue size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</div><div><div className="event-top"><StatusBadge status={event.status} /><Badge className="kind-badge">{event.kind}</Badge></div><h3>{event.label}</h3><time dateTime={event.timestamp}>{fullTime(event.timestamp)} UTC</time></div></article>)}
        {!visible.length && <div className="empty-state" role="status" aria-live="polite"><ClockCountdown size={28} aria-hidden="true" /><h3>No timeline events match</h3><p>Clear the status filter to restore the full event stream.</p><Button className="button button-secondary" onClick={() => setFilter('timelineStatus', '')}>Clear filter</Button></div>}
      </div>
    </section>
  )
}

function ConfigPreview({ values }) {
  const [copied, setCopied] = useState(false)
  const addToast = useQueueStore((state) => state.addToast)
  const text = useMemo(() => [
    `dataset: ${values.dataset || 'not-set'}`,
    `agent: ${values.agent || 'not-set'}`,
    `model: ${values.model || 'not-set'}`,
    `trialCount: ${values.trialCount || 'not-set'}`,
    ...(values.sweepModel ? [`sweepModel: ${values.sweepModel}`] : []),
  ].join('\n'), [values])
  const copy = async () => {
    await copyText(text)
    setCopied(true); addToast('Configuration preview copied')
    window.setTimeout(() => setCopied(false), 1800)
  }
  return (
    <section className="config-preview"><div className="preview-heading"><div><Code size={17} aria-hidden="true" /><span>Configuration preview</span></div><button type="button" onClick={copy}>{copied ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}</button></div><pre>{text}</pre><p>API-shaped create payload</p></section>
  )
}

function SubmitDialog() {
  const open = useQueueStore((state) => state.chrome.submitOpen)
  const setChrome = useQueueStore((state) => state.setChrome)
  const draft = useQueueStore((state) => state.formDraft)
  const setFormDraft = useQueueStore((state) => state.setFormDraft)
  const submitJobs = useQueueStore((state) => state.submitJobs)
  const submitting = useQueueStore((state) => state.submitting)
  const { register, handleSubmit, watch, formState: { errors, isValid, isSubmitting }, reset, trigger } = useForm({ resolver: zodResolver(createJobSchema), mode: 'onChange', defaultValues: draft })
  const values = watch()
  useEffect(() => { setFormDraft(values) }, [values.dataset, values.agent, values.model, values.trialCount, values.sweepModel])
  useEffect(() => { if (open) { reset(draft); trigger() } }, [open])
  const onSubmit = (payload) => submitJobs({ ...payload, sweepModel: payload.sweepModel || undefined })
  const described = (field) => errors[field] ? `${field}-error` : undefined

  return (
    <DialogShell open={open} onOpenChange={(value) => setChrome('submitOpen', value)} title="Submit job" description="Create an evaluation job using the queue API field contract." size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="submit-layout" noValidate>
        <div className="form-column">
          <label className="form-field"><span>Dataset <b>Required</b></span><NativeSelect.Root><NativeSelect.Field aria-invalid={Boolean(errors.dataset)} aria-describedby={described('dataset')} {...register('dataset')}><option value="">Select dataset</option>{DATASETS.map((value) => <option key={value}>{value}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root><FieldError id="dataset-error" message={errors.dataset?.message} /></label>
          <label className="form-field"><span>Agent <b>Required</b></span><NativeSelect.Root><NativeSelect.Field aria-invalid={Boolean(errors.agent)} aria-describedby={described('agent')} {...register('agent')}><option value="">Select agent</option>{AGENTS.map((value) => <option key={value}>{value}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root><FieldError id="agent-error" message={errors.agent?.message} /></label>
          <label className="form-field"><span>Primary model <b>Required</b></span><NativeSelect.Root><NativeSelect.Field aria-invalid={Boolean(errors.model)} aria-describedby={described('model')} {...register('model')}><option value="">Select model</option>{MODELS.map((value) => <option key={value}>{value}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root><FieldError id="model-error" message={errors.model?.message} /></label>
          <label className="form-field"><span>Trial count <b>1–10</b></span><input className="text-input" type="number" min="1" max="10" step="1" inputMode="numeric" aria-invalid={Boolean(errors.trialCount)} aria-describedby={described('trialCount')} {...register('trialCount')} /><FieldError id="trialCount-error" message={errors.trialCount?.message} /></label>
          <div className="sweep-divider"><span>Optional model sweep</span></div>
          <label className="form-field"><span>Sweep model <b>Optional</b></span><NativeSelect.Root><NativeSelect.Field aria-invalid={Boolean(errors.sweepModel)} aria-describedby={described('sweepModel')} {...register('sweepModel')}><option value="">No sweep model</option>{MODELS.map((value) => <option key={value}>{value}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root><FieldError id="sweepModel-error" message={errors.sweepModel?.message} /><small>Creates one job for each selected model.</small></label>
        </div>
        <ConfigPreview values={values} />
        <div className="dialog-actions submit-actions"><Button type="button" className="button button-ghost" onClick={() => setChrome('submitOpen', false)}>Cancel</Button><Button type="submit" className="button button-primary" disabled={!isValid || isSubmitting || submitting}>{isSubmitting || submitting ? <span className="spinner" /> : <Plus size={17} aria-hidden="true" />}Submit job</Button></div>
      </form>
    </DialogShell>
  )
}

function ExportDialog() {
  const open = useQueueStore((state) => state.chrome.exportOpen)
  const setChrome = useQueueStore((state) => state.setChrome)
  const preview = useQueueStore((state) => state.exportPreviewText)
  const refreshExport = useQueueStore((state) => state.refreshExport)
  const jobs = useQueueStore((state) => state.jobs)
  const providers = useQueueStore((state) => state.providers)
  const timeline = useQueueStore((state) => state.timeline)
  const addToast = useQueueStore((state) => state.addToast)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (open) refreshExport() }, [open, jobs, providers, timeline])
  const copy = async () => { await copyText(preview); setCopied(true); addToast('Queue snapshot copied'); window.setTimeout(() => setCopied(false), 1800) }
  const download = () => {
    const url = URL.createObjectURL(new Blob([preview], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `relaydeck-queue-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); addToast('Queue snapshot downloaded')
  }
  return (
    <DialogShell open={open} onOpenChange={(value) => setChrome('exportOpen', value)} title="Export queue" description="A live, API-shaped Queue Snapshot compiled from this session." size="xl">
      <div className="snapshot-meta"><span><Code size={16} aria-hidden="true" />eval-queue-v1</span><span>{jobs.length} jobs</span><span>{providers.length} providers</span><span>{timeline.length} events</span></div>
      <div className="code-surface export-code"><pre aria-label="Queue snapshot JSON preview">{preview}</pre></div>
      <div className="dialog-actions"><Button className="button button-ghost" onClick={copy}>{copied ? <Check size={17} aria-hidden="true" /> : <Clipboard size={17} aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}</Button><Button className="button button-primary" onClick={download}><DownloadSimple size={17} aria-hidden="true" />Download</Button></div>
    </DialogShell>
  )
}

function ImportDialog() {
  const open = useQueueStore((state) => state.chrome.importOpen)
  const setChrome = useQueueStore((state) => state.setChrome)
  const storedDraft = useQueueStore((state) => state.importDraft)
  const setImportDraft = useQueueStore((state) => state.setImportDraft)
  const importError = useQueueStore((state) => state.importError)
  const importSnapshot = useQueueStore((state) => state.importSnapshot)
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(importDraftSchema), mode: 'onChange', defaultValues: { snapshot: storedDraft } })
  const value = watch('snapshot')
  useEffect(() => { setImportDraft(value || '') }, [value])
  useEffect(() => { if (open) reset({ snapshot: storedDraft }) }, [open])
  const submit = ({ snapshot }) => importSnapshot(snapshot)
  return (
    <DialogShell open={open} onOpenChange={(value) => setChrome('importOpen', value)} title="Import queue" description="Paste a valid eval-queue-v1 Queue Snapshot. A successful import replaces the live queue." size="xl">
      <form onSubmit={handleSubmit(submit)} className="import-form">
        <label className="form-field"><span>Queue Snapshot JSON <b>Required</b></span><textarea className="import-textarea" spellCheck="false" aria-invalid={Boolean(errors.snapshot || importError)} aria-describedby="import-error" placeholder={'{\n  "schemaVersion": "eval-queue-v1",\n  ...\n}'} {...register('snapshot')} /></label>
        <FieldError id="import-error" message={errors.snapshot?.message || importError} />
        <div className="import-notice"><WarningCircle size={17} aria-hidden="true" /><p><strong>Replace current queue</strong><span>Malformed or out-of-contract documents leave the current session unchanged.</span></p></div>
        <div className="dialog-actions"><Button type="button" className="button button-ghost" onClick={() => setChrome('importOpen', false)}>Cancel</Button><Button type="submit" className="button button-primary" disabled={!isValid}><CloudArrowUp size={17} aria-hidden="true" />Import queue</Button></div>
      </form>
    </DialogShell>
  )
}

function ConfirmDialog() {
  const confirm = useQueueStore((state) => state.chrome.confirm)
  const close = useQueueStore((state) => state.closeConfirm)
  const cancelJob = useQueueStore((state) => state.cancelJob)
  const setProviderPaused = useQueueStore((state) => state.setProviderPaused)
  const proceed = () => {
    if (confirm?.type === 'cancel') cancelJob(confirm.jobId)
    if (confirm?.type === 'pause') setProviderPaused(confirm.providerId, true)
  }
  return (
    <DialogShell open={Boolean(confirm)} onOpenChange={(value) => { if (!value) close() }} title={confirm?.title || 'Confirm action'} description={confirm?.body} size="sm">
      <div className="confirm-visual"><span className={confirm?.type === 'cancel' ? 'confirm-danger' : 'confirm-warning'}>{confirm?.type === 'cancel' ? <Stop size={24} weight="fill" aria-hidden="true" /> : <Pause size={24} weight="fill" aria-hidden="true" />}</span><p>{confirm?.type === 'cancel' ? 'This action stops all unfinished work for the job.' : 'This lane will not advance until you resume it.'}</p></div>
      <div className="dialog-actions"><Button className="button button-ghost" onClick={close}>Keep {confirm?.type === 'cancel' ? 'job' : 'running'}</Button><Button className={`button ${confirm?.type === 'cancel' ? 'button-danger' : 'button-primary'}`} onClick={proceed}>{confirm?.type === 'cancel' ? <Stop size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{confirm?.type === 'cancel' ? 'Cancel job' : 'Pause lane'}</Button></div>
    </DialogShell>
  )
}

function AppToaster() {
  const toasts = useQueueStore((state) => state.toasts)
  const shown = useRef(new Set())
  useEffect(() => {
    for (const toast of toasts) {
      if (shown.current.has(toast.id)) continue
      shown.current.add(toast.id)
      window.setTimeout(() => {
        toaster.create({ title: toast.title, type: toast.tone === 'warning' ? 'warning' : toast.tone === 'neutral' ? 'info' : 'success', duration: 3000 })
      }, 0)
    }
  }, [toasts])
  return (
    <Toaster toaster={toaster}>
      {(toast) => <Toast.Root className="app-toast" key={toast.id}><Toast.Indicator /><Toast.Title>{toast.title}</Toast.Title><Toast.CloseTrigger /></Toast.Root>}
    </Toaster>
  )
}

export default function App() {
  const activeView = useQueueStore((state) => state.activeView)
  const tick = useQueueStore((state) => state.tick)
  useEffect(() => { const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer) }, [tick])
  useEffect(() => registerWebMcp(), [])
  return (
    <div className="app-shell">
      <Header />
      <main>
        <SummaryStrip />
        {activeView === 'jobs' && <JobsView />}
        {activeView === 'aggregates' && <AggregatesView />}
        {activeView === 'timeline' && <TimelineView />}
      </main>
      <SubmitDialog /><ExportDialog /><ImportDialog /><ConfirmDialog /><AppToaster />
    </div>
  )
}
