import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  IconButton,
  InlineNotification,
  Select,
  SelectItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  Theme,
  Tile,
  Toggle,
} from '@carbon/react'
import {
  Activity,
  Add,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChartLine,
  CheckmarkFilled,
  ChevronDown,
  Close,
  Copy,
  Currency,
  DataBase,
  Document,
  Download,
  Edit,
  ErrorFilled,
  Filter,
  ImportExport,
  InformationFilled,
  Moon,
  Play,
  Redo,
  Renew,
  Search,
  Time,
  TrashCan,
  Undo,
  Upload,
} from '@carbon/icons-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { z } from 'zod'
import {
  MODELS,
  agentInputSchema,
  compileAgentsCsv,
  compileSessionJson,
  getActiveAgentCount,
  getLiveKpis,
  nightScheduleSchema,
  renameSchema,
  useCommandStore,
} from './store.js'
import { registerWebMCPTools } from './webmcp.js'

const cx = (...values) => values.filter(Boolean).join(' ')

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const formatKpi = (kpi, value) => kpi.format === 'currency' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString()

function useCountUp(target) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return }
    let frame
    const start = performance.now()
    const tick = (time) => {
      const progress = Math.min(1, (time - start) / 800)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}

function useFocusTrap(open, onClose, returnFocusRef) {
  const containerRef = useRef(null)
  const previousRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    if (!open) return
    previousRef.current = returnFocusRef?.current || document.activeElement
    const timer = setTimeout(() => {
      const target = containerRef.current?.querySelector('[data-autofocus], input, select, textarea, button, [tabindex="0"]')
      target?.focus()
    }, 30)
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return }
      if (event.key !== 'Tab' || !containerRef.current) return
      const focusable = [...containerRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
      setTimeout(() => previousRef.current?.focus?.(), 0)
    }
  }, [open, returnFocusRef])
  return containerRef
}

function StatusChip({ status, children }) {
  const label = children || status.charAt(0).toUpperCase() + status.slice(1)
  const type = status === 'error' ? 'red' : status === 'success' || status === 'running' ? 'green' : status === 'info' ? 'blue' : 'cool-gray'
  return <Tag size="sm" type={type} className={`status-chip status-${status}`}>{label}</Tag>
}

function MetricTooltip({ active, payload, label, format = 'number' }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return <div className="chart-tooltip"><span>{label}</span><strong>{format === 'currency' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString()}</strong></div>
}

function KpiCard({ kpi, onOpen }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const initialValue = useRef(kpi.current).current
  const initialCount = useCountUp(initialValue)
  const counted = kpi.current === initialValue ? initialCount : kpi.current
  const positive = kpi.trend >= 0
  const Icon = kpi.key === 'cost-this-month' ? Currency : kpi.key === 'active-agents' ? Activity : kpi.key === 'total-prompts' ? Document : ChartLine
  return (
    <Tile className="kpi-tile">
      <button type="button" className="kpi-button" onClick={onOpen} aria-label={`Open ${kpi.label} detail`}>
        <div className="kpi-heading"><span className="kpi-icon"><Icon size={18} /></span><span>{kpi.label}</span></div>
        <div className="kpi-core">
          <strong className="kpi-value">{formatKpi(kpi, counted)}</strong>
          <span className={cx('trend', positive ? 'trend-up' : 'trend-down')}>
            {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{Math.abs(kpi.trend)}%
          </span>
        </div>
        <div
          className="sparkline"
          aria-label={`${kpi.label} seven day trend chart`}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            const chartLeft = bounds.left + 3
            const chartWidth = Math.max(bounds.width - 6, 1)
            const ratio = Math.max(0, Math.min(0.999, (event.clientX - chartLeft) / chartWidth))
            setHoveredPoint(Math.floor(ratio * kpi.series.length))
          }}
          onPointerLeave={() => setHoveredPoint(null)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpi.series} margin={{ top: 8, right: 3, bottom: 3, left: 3 }}>
              <ChartTooltip content={<MetricTooltip format={kpi.format} />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />
              <Line type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={2} dot={{ r: 2.5, fill: 'var(--app-surface)', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          {hoveredPoint !== null && <div className="spark-tooltip" role="tooltip"><span>{kpi.series[hoveredPoint].label}</span><strong>{formatKpi(kpi, kpi.series[hoveredPoint].value)}</strong></div>}
        </div>
      </button>
    </Tile>
  )
}

function KpiStrip() {
  const storedKpis = useCommandStore((state) => state.kpis)
  const agents = useCommandStore((state) => state.agents)
  const kpis = useMemo(() => getLiveKpis({ kpis: storedKpis, agents }), [storedKpis, agents])
  const setView = useCommandStore((state) => state.setView)
  return <section className="kpi-grid" aria-label="Key performance indicators">{kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} onOpen={() => setView(`${kpi.key}-detail`)} />)}</section>
}

function ConfirmDialog({ open, title, description, confirmLabel, danger = true, onConfirm, onClose }) {
  const ref = useFocusTrap(open, onClose)
  if (!open) return null
  return (
    <div className="overlay overlay-center" role="presentation">
      <section ref={ref} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="modal-card confirm-card">
        <div className="modal-heading"><div><p className="eyebrow">Confirmation required</p><h2 id="confirm-title">{title}</h2></div><IconButton kind="ghost" label="Close confirmation" onClick={onClose}><Close /></IconButton></div>
        <p className="modal-copy">{description}</p>
        <div className="modal-actions"><Button kind="secondary" onClick={onClose}>Cancel</Button><Button kind={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button></div>
      </section>
    </div>
  )
}

function AgentRow({ agent, onRequestDisconnect }) {
  const toggleExpanded = useCommandStore((state) => state.toggleExpanded)
  const toggleSelected = useCommandStore((state) => state.toggleSelected)
  const retryAgent = useCommandStore((state) => state.retryAgent)
  const runAgent = useCommandStore((state) => state.runAgent)
  const renameAgent = useCommandStore((state) => state.renameAgent)
  const [renaming, setRenaming] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(renameSchema), mode: 'onChange', defaultValues: { name: agent.name } })
  useEffect(() => reset({ name: agent.name }), [agent.name, reset])
  const completed = agent.steps.filter((step) => step.status === 'complete').length
  const current = agent.steps.find((step) => step.status === 'running')
  const onRename = (values) => {
    const outcome = renameAgent(agent.id, values)
    if (outcome.ok) setRenaming(false)
  }
  return (
    <article className={cx('agent-row', agent.state === 'error' && 'agent-error', agent.isNew && 'row-enter')} data-agent-id={agent.id}>
      <div className="agent-summary">
        <div className="agent-select" onClick={(event) => event.stopPropagation()}>
          <Checkbox id={`select-${agent.id}`} labelText={`Select ${agent.name}`} hideLabel checked={agent.selected} onChange={(_, data) => toggleSelected(agent.id, Boolean(data?.checked))} />
        </div>
        <button className="agent-main-button" type="button" onClick={() => toggleExpanded(agent.id)} aria-expanded={agent.expanded} aria-controls={`agent-detail-${agent.id}`}>
          <span className={cx('agent-avatar', `avatar-${agent.state}`)}>{agent.name.slice(0, 2).toUpperCase()}</span>
          <span className="agent-identity">
            <strong className="agent-name" title={agent.name}>{agent.name}</strong>
            <span className="agent-model">{agent.model}</span>
          </span>
          <span className="agent-progress">
            {agent.state === 'running' ? <><strong>{current?.name || 'Run complete'}</strong><span>{completed} of {agent.steps.length} steps complete</span></> : <><strong>{agent.state === 'error' ? 'Run needs attention' : 'Ready for a task'}</strong><span>Last active {relativeTime(agent.lastActive)}</span></>}
          </span>
          <StatusChip status={agent.state} />
          <ChevronDown className={cx('row-chevron', agent.expanded && 'rotated')} size={18} />
        </button>
        <div className="agent-actions">
          {agent.state === 'idle' && <Button size="sm" kind="tertiary" renderIcon={Play} onClick={() => runAgent(agent.id)}>Run</Button>}
          {agent.state === 'error' && <Button size="sm" kind="danger--tertiary" renderIcon={Renew} onClick={() => retryAgent(agent.id)}>Retry</Button>}
          <IconButton size="sm" kind="ghost" label={`Rename ${agent.name}`} onClick={() => setRenaming(true)}><Edit /></IconButton>
          <IconButton size="sm" kind="ghost" label={`Disconnect ${agent.name}`} onClick={() => onRequestDisconnect(agent)}><TrashCan /></IconButton>
        </div>
      </div>
      <div id={`agent-detail-${agent.id}`} className={cx('agent-detail', agent.expanded && 'expanded')} aria-hidden={!agent.expanded}>
        <div className="agent-detail-inner">
          <div className="detail-meta">
            <div><span>Description</span><strong>{agent.description || 'No agent description was supplied.'}</strong></div>
            <div><span>Full agent name</span><strong>{agent.name}</strong></div>
            <div><span>Last active</span><strong>{new Date(agent.lastActive).toLocaleString()}</strong></div>
          </div>
          <ol className="step-list" aria-label={`${agent.name} steps`}>
            {agent.steps.map((step, index) => <li key={step.id} className={`step step-${step.status}`}><span className="step-indicator">{step.status === 'complete' ? <CheckmarkFilled size={16} /> : step.status === 'running' ? <span className="step-pulse" /> : index + 1}</span><span><strong>{step.name}</strong><small>{step.status}</small></span></li>)}
          </ol>
        </div>
      </div>
      {renaming && <form className="rename-form" onSubmit={handleSubmit(onRename)}><TextInput id={`rename-${agent.id}`} labelText="Agent name" invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} /><div className="rename-actions"><Button size="sm" kind="secondary" type="button" onClick={() => { setRenaming(false); reset({ name: agent.name }) }}>Cancel</Button><Button size="sm" type="submit" disabled={!isValid}>Save name</Button></div></form>}
    </article>
  )
}

function AgentPanel({ connectButtonRef }) {
  const agents = useCommandStore((state) => state.agents)
  const setConnectOpen = useCommandStore((state) => state.setConnectOpen)
  const bulkDisconnect = useCommandStore((state) => state.bulkDisconnect)
  const [parent] = useAutoAnimate({ duration: 200 })
  const [disconnectTarget, setDisconnectTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const selectedCount = agents.filter((agent) => agent.selected).length
  return (
    <section className="panel agent-panel" aria-labelledby="agents-title">
      <header className="panel-header">
        <div><p className="eyebrow">Live orchestration</p><h2 id="agents-title">Coding agents</h2><p>{agents.length} connected · {getActiveAgentCount({ agents })} running</p></div>
        <div className="panel-actions"><Button size="sm" kind="secondary" renderIcon={TrashCan} disabled={!selectedCount} onClick={() => selectedCount && setBulkConfirm(true)}>Disconnect selected{selectedCount ? ` (${selectedCount})` : ''}</Button><Button ref={connectButtonRef} size="sm" renderIcon={Add} onClick={() => setConnectOpen(true)}>Connect agent</Button></div>
      </header>
      {agents.length ? <div ref={parent} className="agent-list">{agents.map((agent) => <AgentRow key={agent.id} agent={agent} onRequestDisconnect={setDisconnectTarget} />)}</div> : <div className="empty-state"><DataBase size={32} /><h3>No coding agents connected</h3><p>Connected agents and their live run steps belong here.</p><Button renderIcon={Add} onClick={() => setConnectOpen(true)}>Connect agent</Button></div>}
      <ConfirmDialog open={!!disconnectTarget} title={`Disconnect ${disconnectTarget?.name || 'agent'}?`} description="The agent will be removed from this session and its exported artifacts. You can restore it with Undo." confirmLabel="Disconnect agent" onClose={() => setDisconnectTarget(null)} onConfirm={() => useCommandStore.getState().disconnectAgent(disconnectTarget.id)} />
      <ConfirmDialog open={bulkConfirm} title={`Disconnect ${selectedCount} selected agents?`} description="Every checked agent will be removed in one action, with one activity event recorded for each agent." confirmLabel="Disconnect selected" onClose={() => setBulkConfirm(false)} onConfirm={bulkDisconnect} />
    </section>
  )
}

const feedIcon = { agent: Activity, prompt: Document, evaluation: ChartLine }

function ActivityFeed() {
  const events = useCommandStore((state) => state.events)
  const filters = useCommandStore((state) => state.feedFilters)
  const search = useCommandStore((state) => state.feedSearch)
  const autoFollow = useCommandStore((state) => state.autoFollow)
  const toggleFilter = useCommandStore((state) => state.toggleFilter)
  const setFilters = useCommandStore((state) => state.setFilters)
  const clearFilters = useCommandStore((state) => state.clearFilters)
  const simulateActivity = useCommandStore((state) => state.simulateActivity)
  const setAutoFollow = useCommandStore((state) => state.setAutoFollow)
  const setView = useCommandStore((state) => state.setView)
  const openAgentFromEvent = useCommandStore((state) => state.openAgentFromEvent)
  const [parent] = useAutoAnimate({ duration: 200 })
  const scrollRef = useRef(null)
  const typeFilters = filters.filter((filter) => filter !== 'error')
  const visible = useMemo(() => events.filter((event) => {
    if (typeFilters.length && !typeFilters.includes(event.type)) return false
    if (filters.includes('error') && event.status !== 'error') return false
    if (search && !event.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [events, filters, search, typeFilters])
  useEffect(() => {
    if (autoFollow && scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [events.length, autoFollow])
  const openEvent = (event) => {
    if (event.type === 'agent') openAgentFromEvent(event.resourceId, event.relatedName)
    else if (event.metricKey) setView(`${event.metricKey}-detail`)
  }
  const suggestions = [
    { label: 'Show errors only', filter: ['error'] },
    { label: 'Show agent events', filter: ['agent'] },
    { label: 'Show evaluations', filter: ['evaluation'] },
    { label: 'Show prompt changes', filter: ['prompt'] },
  ]
  return (
    <section className="panel activity-panel" aria-labelledby="activity-title">
      <header className="panel-header feed-header"><div><p className="eyebrow">Session pulse</p><h2 id="activity-title">Activity feed</h2><p>{visible.length} of {events.length} events visible</p></div><Button size="sm" kind="tertiary" renderIcon={Play} onClick={simulateActivity}>Simulate activity</Button></header>
      <div className="suggestion-wrap" aria-label="Feed suggestions">{suggestions.map((item) => <button key={item.label} type="button" className={cx('suggestion-chip', filters.join(',') === item.filter.join(',') && 'selected')} onClick={() => setFilters(item.filter, item.label)}><Search size={14} />{item.label}</button>)}</div>
      <div className="feed-filters" aria-label="Activity filters"><Filter size={16} aria-hidden="true" />{['prompt', 'evaluation', 'agent', 'error'].map((filter) => <button key={filter} type="button" className={cx('filter-chip', filters.includes(filter) && 'selected')} aria-pressed={filters.includes(filter)} onClick={() => toggleFilter(filter)}>{filter === 'error' ? 'Errors' : `${filter[0].toUpperCase()}${filter.slice(1)}`}</button>)}<button type="button" className="clear-filter" onClick={clearFilters} disabled={!filters.length && !search}>Clear filters</button></div>
      <div className="feed-shell">
        <div ref={scrollRef} className="feed-scroll" tabIndex="0" onScroll={(event) => setAutoFollow(event.currentTarget.scrollTop < 32)} aria-label="Recent activity events">
          {visible.length ? <div ref={parent} className="feed-list">{visible.map((event) => {
            const Icon = feedIcon[event.type]
            return <button key={event.id} type="button" className={cx('feed-item', event.isNew && 'feed-enter')} onClick={() => openEvent(event)}><span className={`feed-icon feed-icon-${event.status}`}><Icon size={17} /></span><span className="feed-body"><span className="feed-description">{event.description}</span><span className="feed-meta"><StatusChip status={event.status} /><span>{event.type}</span><Time size={13} /><time dateTime={event.timestamp}>{relativeTime(event.timestamp)}</time></span></span></button>
          })}</div> : <div className="empty-state feed-empty"><Filter size={28} /><h3>No events match these filters</h3><p>Clear the active filters to restore the complete activity feed.</p><Button size="sm" kind="tertiary" onClick={clearFilters}>Clear filters</Button></div>}
        </div>
        {!autoFollow && <button className="jump-latest" type="button" onClick={() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setAutoFollow(true) }}><ArrowUp size={15} />Jump to latest</button>}
      </div>
    </section>
  )
}

function ConnectDialog({ openerRef }) {
  const open = useCommandStore((state) => state.connectOpen)
  const setOpen = useCommandStore((state) => state.setConnectOpen)
  const connectAgent = useCommandStore((state) => state.connectAgent)
  const dialogRef = useFocusTrap(open, () => setOpen(false), openerRef)
  const submitLock = useRef(false)
  const { register, control, handleSubmit, reset, trigger, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(agentInputSchema), mode: 'onChange', defaultValues: { name: '', model: '', description: '' } })
  useEffect(() => {
    if (!open) return
    submitLock.current = false
    reset({ name: '', model: '', description: '' })
    const timer = setTimeout(() => trigger(['name', 'model']), 0)
    return () => clearTimeout(timer)
  }, [open, reset, trigger])
  const onSubmit = (values) => {
    if (submitLock.current) return
    submitLock.current = true
    const outcome = connectAgent(values)
    if (!outcome.ok) submitLock.current = false
  }
  if (!open) return null
  const descriptionLength = watch('description')?.length || 0
  return (
    <div className="overlay overlay-center" role="presentation">
      <section ref={dialogRef} className="modal-card connect-dialog" role="dialog" aria-modal="true" aria-labelledby="connect-title">
        <div className="modal-heading"><div><p className="eyebrow">Agent registration</p><h2 id="connect-title">Connect agent</h2><p>Register a coding agent using the shared session contract.</p></div><IconButton kind="ghost" label="Close Connect agent dialog" onClick={() => setOpen(false)}><Close /></IconButton></div>
        <form onSubmit={handleSubmit(onSubmit)} className="form-stack" noValidate>
          <TextInput id="agent-name" labelText="Agent name" invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} />
          <Controller name="model" control={control} render={({ field }) => <Select id="agent-model" labelText="Model" value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} invalid={!!errors.model} invalidText={errors.model?.message}><SelectItem value="" text="Choose an allowed model" disabled />{MODELS.map((model) => <SelectItem key={model} value={model} text={model} />)}</Select>} />
          <div><TextArea id="agent-description" labelText="Description (optional)" invalid={!!errors.description} invalidText={errors.description?.message} rows={4} {...register('description')} /><div className={cx('char-count', descriptionLength > 280 && 'danger-text')}>{descriptionLength}/280</div></div>
          <div className="modal-actions"><Button kind="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" renderIcon={Add} disabled={!isValid || submitLock.current}>Connect agent</Button></div>
        </form>
      </section>
    </div>
  )
}

function NightSchedule({ badgeRef }) {
  const open = useCommandStore((state) => state.nightOpen)
  const setOpen = useCommandStore((state) => state.setNightOpen)
  const schedule = useCommandStore((state) => state.nightSchedule)
  const theme = useCommandStore((state) => state.theme)
  const save = useCommandStore((state) => state.saveNightSchedule)
  const popoverRef = useFocusTrap(open, () => setOpen(false), badgeRef)
  const { register, control, handleSubmit, reset, trigger, watch, formState: { errors } } = useForm({ resolver: zodResolver(nightScheduleSchema), mode: 'onChange', defaultValues: schedule })
  useEffect(() => { if (open) reset(schedule) }, [open, reset, schedule])
  const enabled = watch('enable')
  const state = theme === 'night' ? 'active' : schedule.enable ? 'scheduled' : 'disabled'
  return (
    <div className="night-control">
      <button ref={badgeRef} className={`night-badge night-${state}`} type="button" aria-expanded={open} onClick={() => setOpen(!open)}><Moon size={16} /><span>Night mode {state}</span></button>
      {open && <section ref={popoverRef} className="night-popover" role="dialog" aria-labelledby="night-title">
        <div className="modal-heading compact"><div><p className="eyebrow">Appearance schedule</p><h2 id="night-title">Night mode</h2></div><IconButton size="sm" kind="ghost" label="Close night mode schedule" onClick={() => setOpen(false)}><Close /></IconButton></div>
        <form className="form-stack" onSubmit={handleSubmit(save)} noValidate>
          <Controller name="enable" control={control} render={({ field }) => <Toggle id="night-enable" labelText="Enable schedule" labelA="Disabled" labelB="Enabled" toggled={field.value} onToggle={(value) => { field.onChange(Boolean(value)); setTimeout(() => trigger(['startTime', 'endTime']), 0) }} />} />
          <div className="time-grid">
            <TextInput id="night-start" type="time" labelText="Start time" disabled={!enabled} invalid={!!errors.startTime} invalidText={errors.startTime?.message} aria-describedby="night-start-validation" {...register('startTime')} />
            <TextInput id="night-end" type="time" labelText="End time" disabled={!enabled} invalid={!!errors.endTime} invalidText={errors.endTime?.message} aria-describedby="night-end-validation" {...register('endTime')} />
          </div>
          <span id="night-start-validation" className="sr-only">{errors.startTime?.message || 'Start time must use 24-hour HH:MM format when the schedule is enabled.'}</span>
          <span id="night-end-validation" className="sr-only">{errors.endTime?.message || 'End time must use 24-hour HH:MM format when the schedule is enabled.'}</span>
          <Button size="sm" type="submit">Save schedule</Button>
        </form>
      </section>}
    </div>
  )
}

function ExportDrawer({ openerRef }) {
  const open = useCommandStore((state) => state.exportOpen)
  const setOpen = useCommandStore((state) => state.setExportOpen)
  const format = useCommandStore((state) => state.exportFormat)
  const setFormat = useCommandStore((state) => state.setExportFormat)
  const importError = useCommandStore((state) => state.importError)
  const importSession = useCommandStore((state) => state.importSession)
  const agents = useCommandStore((state) => state.agents)
  const active = useCommandStore((state) => getActiveAgentCount(state))
  const state = useCommandStore()
  const drawerRef = useFocusTrap(open, () => setOpen(false), openerRef)
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState(false)
  const preview = format === 'json' ? compileSessionJson(state) : compileAgentsCsv(state)
  const importFormSchema = z.object({ sessionJson: z.string().min(1, 'Session JSON import field is required.') })
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(importFormSchema), defaultValues: { sessionJson: '' } })
  useEffect(() => { if (open) { setCopied(false); setImported(false); reset({ sessionJson: '' }) } }, [open, reset])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      useCommandStore.getState().markArtifactAction(`Copied ${format === 'json' ? 'Session JSON' : 'Agents CSV'}`, `${format === 'json' ? 'Session JSON' : 'Agents CSV'} copied.`)
      setTimeout(() => setCopied(false), 1800)
    } catch { useCommandStore.getState().announce('Clipboard copy was unavailable.') }
  }
  const download = () => {
    const blob = new Blob([preview], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'json' ? 'promptops-session.json' : 'promptops-agents.csv'
    link.click()
    URL.revokeObjectURL(url)
    useCommandStore.getState().markArtifactAction(`Downloaded ${format === 'json' ? 'Session JSON' : 'Agents CSV'}`, `${format === 'json' ? 'Session JSON' : 'Agents CSV'} downloaded.`)
  }
  if (!open) return null
  return (
    <div className="overlay drawer-overlay" role="presentation">
      <aside ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="export-drawer">
        <div className="drawer-heading"><div><p className="eyebrow">Live session artifact</p><h2 id="export-title">Export session</h2><p>Every preview is compiled from the current store.</p></div><IconButton kind="ghost" label="Close Export session drawer" onClick={() => setOpen(false)}><Close /></IconButton></div>
        <div className="export-summary"><div><span>Agents</span><strong>{agents.length}</strong></div><div><span>Active agents</span><strong>{active}</strong></div><div><span>Events</span><strong>{state.events.length}</strong></div><div><span>Last mutation</span><strong>{state.lastAction}</strong></div></div>
        <Tabs selectedIndex={format === 'json' ? 0 : 1} onChange={({ selectedIndex }) => setFormat(selectedIndex === 0 ? 'json' : 'csv')}>
          <TabList aria-label="Export formats"><Tab>Session JSON</Tab><Tab>Agents CSV</Tab></TabList>
          <TabPanels><TabPanel /><TabPanel /></TabPanels>
        </Tabs>
        <div className="preview-heading"><span>{format === 'json' ? 'Session JSON' : 'Agents CSV'} preview</span><span>{new Blob([preview]).size.toLocaleString()} bytes</span></div>
        <pre className="export-preview" tabIndex="0">{preview}</pre>
        <div className="drawer-actions"><Button kind="secondary" renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button><Button renderIcon={Download} onClick={download}>Download</Button></div>
        {copied && <div className="copied-note" role="status"><CheckmarkFilled size={16} />Preview copied to clipboard.</div>}
        <div className="import-section">
          <div className="section-divider"><Upload size={17} /><h3>Import session JSON</h3></div>
          <form onSubmit={handleSubmit(({ sessionJson }) => { const outcome = importSession(sessionJson); setImported(outcome.ok); if (outcome.ok) reset({ sessionJson: '' }) })}>
            <TextArea id="session-import" labelText="Session JSON import field" rows={5} invalid={!!errors.sessionJson || !!importError} invalidText={errors.sessionJson?.message || importError} {...register('sessionJson')} />
            {importError && <InlineNotification lowContrast hideCloseButton kind="error" title="Import failed" subtitle={importError} />}
            {imported && !importError && <InlineNotification lowContrast hideCloseButton kind="success" title="Import completed" subtitle="The visible session now matches the imported Session JSON." />}
            <Button type="submit" size="sm" kind="tertiary" renderIcon={ImportExport}>Import session</Button>
          </form>
        </div>
      </aside>
    </div>
  )
}

const fuzzy = (text, query) => {
  let index = 0
  const source = text.toLowerCase()
  for (const char of query.toLowerCase()) { index = source.indexOf(char, index); if (index < 0) return false; index += 1 }
  return true
}

function CommandPalette({ openerRef, exportRef }) {
  const open = useCommandStore((state) => state.paletteOpen)
  const setOpen = useCommandStore((state) => state.setPaletteOpen)
  const dialogRef = useFocusTrap(open, () => setOpen(false), openerRef)
  const [query, setQuery] = useState('')
  useEffect(() => { if (open) setQuery('') }, [open])
  const store = useCommandStore.getState
  const commands = [
    { name: 'Connect agent', meta: 'Agent', icon: Add, action: () => store().setConnectOpen(true) },
    { name: 'Simulate activity', meta: 'Feed', icon: Play, action: () => store().simulateActivity() },
    { name: 'Export session', meta: 'Artifact', icon: ImportExport, action: () => store().setExportOpen(true) },
    { name: 'Clear filters', meta: 'Feed', icon: Filter, action: () => store().clearFilters() },
    ...getLiveKpis(store()).map((kpi) => ({ name: `Open ${kpi.label}`, meta: 'KPI detail', icon: ChartLine, action: () => store().setView(`${kpi.key}-detail`) })),
  ]
  const filtered = commands.filter((command) => fuzzy(command.name, query))
  if (!open) return null
  return (
    <div className="overlay palette-overlay" role="presentation">
      <section ref={dialogRef} className="palette-card" role="dialog" aria-modal="true" aria-labelledby="palette-title">
        <h2 id="palette-title" className="sr-only">Command palette</h2>
        <div className="palette-search"><Search size={20} /><input data-autofocus aria-label="Filter commands" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>Esc</kbd></div>
        <div className="command-list">{filtered.length ? filtered.map((command) => { const Icon = command.icon; return <button type="button" key={command.name} onClick={() => { setOpen(false); setTimeout(() => command.action(), 0) }}><span className="command-icon"><Icon size={18} /></span><span><strong>{command.name}</strong><small>{command.meta}</small></span><span className="command-enter">↵</span></button> }) : <div className="command-empty">No commands match “{query}”.</div>}</div>
        <footer className="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> run command</span></footer>
      </section>
    </div>
  )
}

function MetricDetail() {
  const state = useCommandStore()
  const kpis = getLiveKpis(state)
  const key = state.activeView.replace('-detail', '')
  const kpi = kpis.find((item) => item.key === key)
  if (!kpi) return null
  return (
    <main className="detail-view">
      <button className="back-button" type="button" onClick={() => {
        if (window.history.state?.promptOpsView === state.activeView) window.history.back()
        else state.setView('dashboard')
      }}><ArrowLeft size={18} />Back to dashboard</button>
      <section className="detail-hero"><div><p className="eyebrow">KPI investigation</p><h1>{kpi.label}</h1><p>Seven-day operational trend with the same live series used on the dashboard.</p></div><div className="detail-current"><span>Current value</span><strong>{formatKpi(kpi, kpi.current)}</strong><span className={cx('trend', kpi.trend >= 0 ? 'trend-up' : 'trend-down')}>{kpi.trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}{Math.abs(kpi.trend)}%</span></div></section>
      <section className="panel detail-chart-panel"><header className="panel-header"><div><p className="eyebrow">Recent trajectory</p><h2>{kpi.label} trend</h2></div></header><div className="detail-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={kpi.series} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}><defs><linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35}/><stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="label" stroke="var(--text-muted)" tickLine={false} axisLine={false} /><YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} width={60} /><ChartTooltip content={<MetricTooltip format={kpi.format} />} /><Area type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={3} fill="url(#area-gradient)" activeDot={{ r: 6 }} /></AreaChart></ResponsiveContainer></div></section>
      <section className="panel breakdown-panel"><header className="panel-header"><div><p className="eyebrow">Daily breakdown</p><h2>Series values</h2><p>{kpi.series.length} reporting periods</p></div></header><div className="breakdown-table-wrap"><table className="breakdown-table"><thead><tr><th>Period</th><th>Value</th><th>Change</th><th>Signal</th></tr></thead><tbody>{kpi.series.map((point, index) => { const prior = kpi.series[Math.max(0, index - 1)].value; const change = index ? point.value - prior : 0; return <tr key={point.label}><td>{point.label}</td><td>{formatKpi(kpi, point.value)}</td><td className={change >= 0 ? 'positive' : 'negative'}>{change >= 0 ? '+' : ''}{formatKpi(kpi, change)}</td><td><StatusChip status={change >= 0 ? 'success' : 'error'}>{change >= 0 ? 'On track' : 'Watch'}</StatusChip></td></tr> })}</tbody></table></div></section>
    </main>
  )
}

function Header({ connectRef, paletteRef, exportRef, nightRef }) {
  const state = useCommandStore()
  return (
    <header className="app-header">
      <div className="brand-block"><span className="brand-mark"><span /><span /><span /></span><div><strong>PromptOps</strong><span>Command center</span></div><span className="environment"><i />Production</span></div>
      <div className="header-actions">
        <span className="last-action" title={state.lastAction}><Activity size={14} />{state.lastAction}</span>
        <NightSchedule badgeRef={nightRef} />
        <div className="history-actions"><IconButton kind="ghost" label="Undo" disabled={!state.undoStack.length} onClick={state.undo}><Undo /></IconButton><IconButton kind="ghost" label="Redo" disabled={!state.redoStack.length} onClick={state.redo}><Redo /></IconButton></div>
        <Button ref={paletteRef} size="sm" kind="ghost" renderIcon={Search} onClick={() => state.setPaletteOpen(true)}>Commands <kbd>⌘K</kbd></Button>
        <Button ref={exportRef} size="sm" kind="secondary" renderIcon={ImportExport} onClick={() => state.setExportOpen(true)}>Export session</Button>
        <Button ref={connectRef} size="sm" renderIcon={Add} onClick={() => state.setConnectOpen(true)}>Connect agent</Button>
      </div>
    </header>
  )
}

function App() {
  const theme = useCommandStore((state) => state.theme)
  const activeView = useCommandStore((state) => state.activeView)
  const announcement = useCommandStore((state) => state.announcement)
  const connectRef = useRef(null)
  const paletteRef = useRef(null)
  const exportRef = useRef(null)
  const nightRef = useRef(null)
  useEffect(registerWebMCPTools, [])
  useEffect(() => {
    window.history.replaceState({ ...(window.history.state || {}), promptOpsView: 'dashboard' }, '', `${window.location.pathname}${window.location.search}`)
    const onPopState = (event) => useCommandStore.getState().setView(event.state?.promptOpsView || 'dashboard', { fromHistory: true })
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    const interval = setInterval(() => useCommandStore.getState().advanceAgentSteps(), 1700)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    const onKey = (event) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); useCommandStore.getState().setPaletteOpen(true) }
      if (mod && event.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault()
        if (event.shiftKey) useCommandStore.getState().redo()
        else useCommandStore.getState().undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  return (
    <Theme theme={theme === 'night' ? 'g100' : 'white'} className={cx('app-theme', theme === 'night' && 'theme-night')}>
      <div className="app-shell">
        <Header connectRef={connectRef} paletteRef={paletteRef} exportRef={exportRef} nightRef={nightRef} />
        <div className="page-wrap">
          {activeView === 'dashboard' ? <><div className="page-intro"><div><p className="eyebrow">Monday, July 20 · Live workspace</p><h1>Good morning, operator.</h1><p>Monitor prompt performance, coordinate coding agents, and preserve the session artifact.</p></div><span className="health-pill"><CheckmarkFilled size={16} />All systems operational</span></div><KpiStrip /><main className="dashboard-grid"><AgentPanel connectButtonRef={connectRef} /><ActivityFeed /></main></> : <MetricDetail />}
        </div>
        <ConnectDialog openerRef={connectRef} />
        <ExportDrawer openerRef={exportRef} />
        <CommandPalette openerRef={paletteRef} exportRef={exportRef} />
        <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      </div>
    </Theme>
  )
}

export default App
