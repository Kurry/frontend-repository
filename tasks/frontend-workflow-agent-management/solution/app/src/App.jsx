import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Button,
  Dropdown,
  InlineNotification,
  Modal,
  OverflowMenu,
  OverflowMenuItem,
  ProgressBar,
  Search,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextArea,
  TextInput,
  ToastNotification,
} from '@carbon/react'
import {
  Add,
  ArrowDown,
  ArrowUp,
  CheckmarkFilled,
  ChevronDown,
  Close,
  Copy,
  Download,
  ErrorFilled,
  Export,
  Filter,
  InProgress,
  Pause,
  Play,
  Redo,
  Renew,
  Restart,
  Settings,
  Time,
  Undo,
  Upload,
} from '@carbon/icons-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFleetStore, getRollup, STATUSES } from './store'
import {
  createUniqueAgentSchema,
  importFormSchema,
  parseFleetText,
} from './schemas'
import { registerWebMCP } from './webmcp'
import { trapFocus } from './focus'

function useOverlayFocusTrap(open, containerRef) {
  useEffect(() => {
    if (!open || !containerRef.current) return undefined
    const root = containerRef.current.closest('.cds--modal-container') ?? containerRef.current.closest('[role="dialog"]') ?? containerRef.current
    return trapFocus(root)
  }, [open, containerRef])
}

const timestampFormatter = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
function formatTimestamp(value) {
  return timestampFormatter.format(new Date(value))
}
const TYPE_LABELS = { aster: 'Aster', boreal: 'Boreal', cinder: 'Cinder' }
const EDITOR_LABELS = { codedeck: 'Codedeck', nimbus: 'Nimbus', quill: 'Quill', vector: 'Vector', none: 'None' }
const STATUS_LABELS = { idle: 'Idle', running: 'Running', paused: 'Paused', error: 'Error', offline: 'Offline' }
const STATUS_TAG_TYPES = { idle: 'green', running: 'blue', paused: 'teal', error: 'red', offline: 'gray' }
const TYPE_ITEMS = Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label }))
const EDITOR_ITEMS = Object.entries(EDITOR_LABELS).map(([id, label]) => ({ id, label }))

function maskKey(key) {
  if (!key) return '—'
  return `${'•'.repeat(Math.min(16, Math.max(8, key.length - 4)))}${key.slice(-4)}`
}

function StatusBadge({ status }) {
  return <Tag className={`status-tag status-${status}`} type={STATUS_TAG_TYPES[status]} size="sm">{STATUS_LABELS[status]}</Tag>
}

function RollupStrip({ agents }) {
  const rollup = useMemo(() => getRollup(agents), [agents])
  return (
    <section className="rollup-strip" aria-label="Fleet status summary">
      <div className="rollup-total">
        <span className="eyebrow">Registered</span>
        <strong>{rollup.total}</strong>
        <span>total agents</span>
      </div>
      {STATUSES.map((status) => (
        <div className={`rollup-tile rollup-${status}`} key={status}>
          <span className="status-dot" aria-hidden="true" />
          <span>{STATUS_LABELS[status]}</span>
          <strong>{rollup[status]}</strong>
        </div>
      ))}
    </section>
  )
}

function StatusFilterControl() {
  const statusFilters = useFleetStore((state) => state.statusFilters)
  const setFilters = useFleetStore((state) => state.setFilters)
  return (
    <fieldset className="status-filter">
      <legend>Status filter</legend>
      <span className="filter-summary">{statusFilters.length ? `${statusFilters.length} selected` : 'All statuses'}</span>
      <div className="filter-options">
        {STATUSES.map((status) => (
          <label key={status}>
            <input type="checkbox" checked={statusFilters.includes(status)} onChange={(event) => {
              const next = event.target.checked ? [...statusFilters, status] : statusFilters.filter((item) => item !== status)
              setFilters(next)
            }} />
            <span>{STATUS_LABELS[status]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ActionToolbar() {
  const store = useFleetStore()
  const selected = store.agents.filter((agent) => store.selectedIds.includes(agent.id))
  const canPause = selected.some((agent) => agent.status === 'running')
  const canResume = selected.some((agent) => agent.status === 'paused')
  return (
    <div className="fleet-toolbar" aria-label="Fleet actions">
      <div className="toolbar-primary">
        <Button size="sm" renderIcon={Add} onClick={store.openRegister}>Register Agent</Button>
        <Button size="sm" kind="tertiary" renderIcon={Export} onClick={store.openExport}>Export fleet</Button>
        <Button size="sm" kind="tertiary" renderIcon={Upload} onClick={store.openImport}>Import fleet</Button>
      </div>
      <div className="toolbar-secondary">
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={Undo} iconDescription="Undo registry mutation" tooltipPosition="bottom" disabled={!store.undoStack.length && !store.exitingAgentId} onClick={store.undo} />
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={Redo} iconDescription="Redo registry mutation" tooltipPosition="bottom" disabled={!store.redoStack.length} onClick={store.redo} />
        <div className="toolbar-divider" aria-hidden="true" />
        <Button size="sm" kind="ghost" renderIcon={Pause} disabled={!canPause} onClick={store.pauseSelected}>Pause All</Button>
        <Button size="sm" kind="ghost" renderIcon={Play} disabled={!canResume} onClick={store.resumeSelected}>Resume All</Button>
        <StatusFilterControl />
      </div>
    </div>
  )
}

function AgentActions({ agent, compact = false }) {
  const startRun = useFleetStore((state) => state.startRun)
  const pauseAgent = useFleetStore((state) => state.pauseAgent)
  const resumeAgent = useFleetStore((state) => state.resumeAgent)
  const retryAgent = useFleetStore((state) => state.retryAgent)
  if (agent.status === 'idle') return <Button className="row-action" size="sm" kind="ghost" renderIcon={Play} onClick={(event) => { event.stopPropagation(); startRun(agent.id) }}>{compact ? 'Start' : 'Start run'}</Button>
  if (agent.status === 'running') return <Button className="row-action" size="sm" kind="ghost" renderIcon={Pause} onClick={(event) => { event.stopPropagation(); pauseAgent(agent.id) }}>Pause</Button>
  if (agent.status === 'paused') return <Button className="row-action" size="sm" kind="ghost" renderIcon={Play} onClick={(event) => { event.stopPropagation(); resumeAgent(agent.id) }}>Resume</Button>
  if (agent.status === 'error') return <Button className="row-action error-action" size="sm" kind="ghost" renderIcon={Renew} onClick={(event) => { event.stopPropagation(); retryAgent(agent.id) }}>Retry</Button>
  return <span className="unavailable-action">Unavailable</span>
}

function CurrentWork({ agent }) {
  const expanded = useFleetStore((state) => Boolean(state.expandedSummaries[agent.id]))
  const toggle = useFleetStore((state) => state.toggleSummary)
  const current = agent.run?.steps[agent.run.currentStep]
  const complete = agent.run?.status === 'complete'
  return (
    <>
      <button className={`summary-toggle ${expanded ? 'is-open' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); toggle(agent.id) }} aria-expanded={expanded} aria-controls={`summary-${agent.id}`}>
        <ChevronDown size={16} aria-hidden="true" />
        <span>{expanded ? 'Hide work' : 'Current work'}</span>
      </button>
      <div id={`summary-${agent.id}`} className={`summary-region ${expanded ? 'is-open' : ''}`}>
        <div className="summary-inner">
          {agent.status === 'running' && current ? <><span className="active-pulse" aria-hidden="true" /><strong>Active now</strong><span>{current.name}</span></> : complete ? <><CheckmarkFilled size={16} /><strong>Last run complete</strong><span>Finished {agent.run.progressTotal} steps in {agent.run.duration}s</span></> : agent.status === 'paused' && current ? <><Pause size={16} /><strong>Checkpointed</strong><span>{current.name}</span></> : <><Time size={16} /><strong>No active work</strong><span>{agent.status === 'offline' ? 'Agent is offline' : 'Ready for the next run'}</span></>}
        </div>
      </div>
    </>
  )
}

function AgentTable() {
  const store = useFleetStore()
  const filtered = useMemo(() => {
    const rows = store.statusFilters.length ? store.agents.filter((agent) => store.statusFilters.includes(agent.status)) : store.agents
    return [...rows].sort((a, b) => store.sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
  }, [store.agents, store.statusFilters, store.sortDirection])
  const visibleIds = filtered.map((agent) => agent.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => store.selectedIds.includes(id))
  if (!store.agents.length) {
    return <div className="table-empty"><div className="empty-orbit"><Settings size={28} /></div><h2>No agents registered</h2><p>Register an agent or import a fleet snapshot to begin.</p><Button size="sm" renderIcon={Add} onClick={store.openRegister}>Register Agent</Button></div>
  }
  if (!filtered.length) {
    return <div className="table-empty"><div className="empty-orbit"><Filter size={28} /></div><h2>No agents match the active filter</h2><p>Filtered by {store.statusFilters.map((status) => STATUS_LABELS[status]).join(', ')}.</p><Button size="sm" kind="tertiary" onClick={store.clearFilters}>Clear filter</Button></div>
  }
  return (
    <TableContainer className="agent-table-container">
      <Table className="agent-table" size="lg" useZebraStyles={false}>
        <TableHead>
          <TableRow>
            <TableHeader className="checkbox-cell"><label className="row-checkbox"><input id="select-all-agents" type="checkbox" aria-label="Select all visible agents" checked={allSelected} ref={(node) => { if (node) node.indeterminate = !allSelected && visibleIds.some((id) => store.selectedIds.includes(id)) }} onChange={(event) => store.toggleAllVisible(visibleIds, event.target.checked)} /><span className="sr-only">Select all visible agents</span></label></TableHeader>
            <TableHeader><button className="sort-button" type="button" onClick={store.toggleSort}>Agent {store.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button></TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Editor</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Last seen</TableHeader>
            <TableHeader>Run control</TableHeader>
            <TableHeader className="overflow-cell"><span className="sr-only">More actions</span></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((agent) => {
            return (
              <TableRow key={agent.id} className={['agent-row', agent.isNew && 'new-agent-row', store.exitingAgentId === agent.id && 'agent-row-exit', store.detailAgentId === agent.id && 'is-selected'].filter(Boolean).join(' ')} onClick={() => store.selectAgent(agent.id)} tabIndex={0} onKeyDown={(event) => { if (event.currentTarget === event.target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); store.selectAgent(agent.id) } }}>
                <TableCell className="checkbox-cell" onClick={(event) => event.stopPropagation()}><label className="row-checkbox"><input id={`select-${agent.id}`} type="checkbox" aria-label={`Select ${agent.name}`} checked={store.selectedIds.includes(agent.id)} onChange={(event) => store.toggleSelection(agent.id, event.target.checked)} /><span className="sr-only">{`Select ${agent.name}`}</span></label></TableCell>
                <TableCell><div className="agent-identity"><span className={`agent-mark type-${agent.agentType}`}>{agent.name.slice(0, 1)}</span><div><strong>{agent.name}</strong><CurrentWork agent={agent} /></div></div></TableCell>
                <TableCell><span className="type-label">{TYPE_LABELS[agent.agentType]}</span></TableCell>
                <TableCell>{EDITOR_LABELS[agent.editorIntegration]}</TableCell>
                <TableCell className={agent.status === 'error' ? 'error-status-cell' : ''}><StatusBadge status={agent.status} /></TableCell>
                <TableCell><time dateTime={agent.lastSeen} title={new Date(agent.lastSeen).toLocaleString()}>{formatTimestamp(agent.lastSeen)}</time></TableCell>
                <TableCell><AgentActions agent={agent} /></TableCell>
                <TableCell className="overflow-cell" onClick={(event) => event.stopPropagation()}>
                  <OverflowMenu size="sm" flipped align="left" aria-label={`Actions for ${agent.name}`} iconDescription={`Actions for ${agent.name}`} menuOptionsClass="agent-overflow-menu">
                    <OverflowMenuItem itemText="Edit" onClick={() => store.openEdit(agent.id)} />
                    <OverflowMenuItem hasDivider isDelete itemText="Remove" onClick={() => store.openRemove(agent.id)} />
                  </OverflowMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function AgentModal() {
  const modal = useFleetStore((state) => state.modal)
  const agents = useFleetStore((state) => state.agents)
  const closeModal = useFleetStore((state) => state.closeModal)
  const registerAgent = useFleetStore((state) => state.registerAgent)
  const updateAgent = useFleetStore((state) => state.updateAgent)
  const containerRef = useRef(null)
  const current = modal?.agentId ? agents.find((agent) => agent.id === modal.agentId) : null
  const isEdit = modal?.mode === 'edit'
  const open = Boolean(modal && modal.mode !== 'remove')
  useOverlayFocusTrap(open, containerRef)
  const schema = useMemo(() => createUniqueAgentSchema(agents.map((agent) => agent.name), current?.name || ''), [agents, current?.name])
  const { control, register, handleSubmit, reset, trigger, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { name: '', agentType: '', editorIntegration: '', accessKey: '' },
  })
  useLayoutEffect(() => {
    if (!modal || modal.mode === 'remove') return
    reset(current ? { name: current.name, agentType: current.agentType, editorIntegration: current.editorIntegration, accessKey: current.accessKey } : { name: '', agentType: '', editorIntegration: '', accessKey: '' })
    void trigger()
  }, [modal?.mode, modal?.agentId, current?.name, current?.agentType, current?.editorIntegration, current?.accessKey, reset, trigger])
  if (!open) return null
  const onSubmit = (payload) => isEdit ? updateAgent(current.id, payload) : registerAgent(payload)
  return (
    <Modal open modalHeading={isEdit ? `Edit ${current?.name}` : 'Register Agent'} modalLabel="Agent registry" primaryButtonText={isEdit ? 'Save changes' : 'Register Agent'} secondaryButtonText="Cancel" primaryButtonDisabled={isSubmitting} onRequestClose={closeModal} onSecondarySubmit={closeModal} onRequestSubmit={handleSubmit(onSubmit)} preventCloseOnClickOutside selectorPrimaryFocus="#agent-name">
      <div ref={containerRef}>
        <p className="modal-intro">{isEdit ? 'Update the API configuration for this fleet agent.' : 'Create the exact payload sent to the fleet registration API.'}</p>
        <div className="form-grid">
          <TextInput id="agent-name" labelText="Name" placeholder="Example: Aster Vale" invalid={Boolean(errors.name)} invalidText={errors.name?.message} aria-describedby={errors.name ? 'agent-name-error' : undefined} {...register('name')} />
          {errors.name && <span id="agent-name-error" className="sr-only">{errors.name.message}</span>}
          <Controller name="agentType" control={control} render={({ field }) => <Dropdown id="agent-type" titleText="Agent type" label="Choose a type" items={TYPE_ITEMS} itemToString={(item) => item?.label || ''} selectedItem={TYPE_ITEMS.find((item) => item.id === field.value) || null} onChange={({ selectedItem }) => field.onChange(selectedItem?.id || '')} invalid={Boolean(errors.agentType)} invalidText={errors.agentType?.message} aria-describedby={errors.agentType ? 'agent-type-error' : undefined} />} />
          {errors.agentType && <span id="agent-type-error" className="sr-only">{errors.agentType.message}</span>}
          <Controller name="editorIntegration" control={control} render={({ field }) => <Dropdown id="agent-editor" titleText="Editor integration" label="Choose an integration" items={EDITOR_ITEMS} itemToString={(item) => item?.label || ''} selectedItem={EDITOR_ITEMS.find((item) => item.id === field.value) || null} onChange={({ selectedItem }) => field.onChange(selectedItem?.id || '')} invalid={Boolean(errors.editorIntegration)} invalidText={errors.editorIntegration?.message} aria-describedby={errors.editorIntegration ? 'agent-editor-error' : undefined} />} />
          {errors.editorIntegration && <span id="agent-editor-error" className="sr-only">{errors.editorIntegration.message}</span>}
          <TextInput id="agent-access-key" type="password" labelText="Access key" placeholder="16–64 letters, digits, hyphens, or underscores" invalid={Boolean(errors.accessKey)} invalidText={errors.accessKey?.message} aria-describedby={errors.accessKey ? 'agent-access-key-error' : undefined} {...register('accessKey')} />
          {errors.accessKey && <span id="agent-access-key-error" className="sr-only">{errors.accessKey.message}</span>}
        </div>
      </div>
    </Modal>
  )
}

function RemoveModal() {
  const modal = useFleetStore((state) => state.modal)
  const target = useFleetStore((state) => state.agents.find((agent) => agent.id === state.modal?.agentId))
  const closeModal = useFleetStore((state) => state.closeModal)
  const removeAgent = useFleetStore((state) => state.removeAgent)
  if (modal?.mode !== 'remove' || !target) return null
  return <Modal danger open modalHeading={`Remove ${target.name}?`} primaryButtonText="Remove agent" secondaryButtonText="Cancel" onRequestClose={closeModal} onSecondarySubmit={closeModal} onRequestSubmit={() => { if (removeAgent(target.id)) closeModal() }}><p>This explicitly removes the agent, its timeline, and its run state from the live registry. You can undo this mutation afterward.</p></Modal>
}

function ConfigurationTab({ agent }) {
  return (
    <div className="tab-content fade-in">
      <dl className="config-list">
        <div><dt>Name</dt><dd>{agent.name}</dd></div>
        <div><dt>Agent type</dt><dd>{TYPE_LABELS[agent.agentType]}</dd></div>
        <div><dt>Editor integration</dt><dd>{EDITOR_LABELS[agent.editorIntegration]}</dd></div>
        <div><dt>Access key</dt><dd className="masked-key">{maskKey(agent.accessKey)}</dd></div>
        <div><dt>Status</dt><dd><StatusBadge status={agent.status} /></dd></div>
      </dl>
    </div>
  )
}

const TIMELINE_KINDS = ['all', 'status', 'run', 'step', 'retry', 'checkpoint', 'error', 'manual']
function HistoryTab({ agent }) {
  const filter = useFleetStore((state) => state.timelineFilter)
  const setFilter = useFleetStore((state) => state.setTimelineFilter)
  const highlightStep = useFleetStore((state) => state.highlightStep)
  const items = [...agent.timeline].reverse().filter((event) => filter === 'all' || event.kind === filter).slice(0, 10)
  return (
    <div className="tab-content fade-in history-tab">
      <label className="timeline-filter-label" htmlFor={`timeline-filter-${agent.id}`}>Timeline event kind</label>
      <select id={`timeline-filter-${agent.id}`} className="timeline-filter-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
        {TIMELINE_KINDS.map((kind) => <option key={kind} value={kind}>{kind === 'all' ? 'All events' : `${kind.slice(0, 1).toUpperCase()}${kind.slice(1)}`}</option>)}
      </select>
      {filter !== 'all' && <Button className="clear-timeline" size="sm" kind="ghost" onClick={() => setFilter('all')}>Clear filter</Button>}
      <ol className="timeline-list">
        {items.map((event) => (
          <li key={event.id} className={`timeline-item kind-${event.kind}`}>
            <span className="timeline-node" aria-hidden="true" />
            <div>
              {event.stepId ? <button type="button" className="timeline-label" onClick={() => highlightStep(event.stepId)}>{event.label}</button> : <p className="timeline-label">{event.label}</p>}
              <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
            </div>
          </li>
        ))}
      </ol>
      {!items.length && <div className="small-empty"><Filter size={24} /><p>No timeline entries match this event kind.</p><Button kind="ghost" size="sm" onClick={() => setFilter('all')}>Clear filter</Button></div>}
    </div>
  )
}

function StepIcon({ status }) {
  if (status === 'complete') return <CheckmarkFilled className="step-icon complete" size={18} />
  if (status === 'failed') return <ErrorFilled className="step-icon failed" size={18} />
  if (status === 'running') return <InProgress className="step-icon running" size={18} />
  if (status === 'retrying') return <Restart className="step-icon retrying" size={18} />
  return <span className="step-icon pending" aria-hidden="true" />
}

function ActivityTab({ agent }) {
  const highlighted = useFleetStore((state) => state.highlightedStepId)
  const manualRetry = useFleetStore((state) => state.manualRetryStep)
  const run = agent.run
  return (
    <div className="tab-content fade-in activity-tab">
      {run ? (
        <section aria-label="Current run progress">
          <div className="run-heading"><div><span className="eyebrow">Run {run.serial || ''}</span><h3>{run.status === 'complete' ? 'Run complete' : run.status === 'failed' ? 'Attention required' : run.status === 'paused' ? 'Run paused' : 'Run in progress'}</h3></div>{Number.isFinite(run.duration) && <span className="duration-pill">{run.duration}s total</span>}</div>
          <ProgressBar label={`${run.progressComplete} of ${run.progressTotal} steps complete`} helperText={`${Math.round((run.progressComplete / run.progressTotal) * 100)}%`} value={(run.progressComplete / run.progressTotal) * 100} max={100} status={run.status === 'failed' ? 'error' : 'active'} />
          <ol className="step-list">
            {run.steps.map((step, index) => (
              <li key={step.id} className={`step-row status-${step.status} ${highlighted === step.id ? 'is-highlighted' : ''}`}>
                <StepIcon status={step.status} />
                <div className="step-copy">
                  <div className="step-title"><strong>{step.name}</strong><span>{step.status}</span></div>
                  <div className="step-meta">
                    <span>Step {index + 1}</span>
                    {step.attempts > 0 && <span>Attempt {step.attempts}{step.maxAttempts ? ` of ${step.maxAttempts}` : ''}</span>}
                    {step.completedAt && <time dateTime={step.completedAt}>{formatTimestamp(step.completedAt)}</time>}
                  </div>
                  {step.status === 'retrying' && <p className="backoff-copy">Waiting {step.backoffRemaining}s before retry {Math.min(step.attempts + 1, step.maxAttempts)} of {step.maxAttempts}</p>}
                  {step.checkpoint && <p className="checkpoint-copy"><Pause size={14} /> {step.checkpoint}</p>}
                  {step.output && <p className="output-copy">{step.output}</p>}
                  {step.status === 'failed' && <><InlineNotification lowContrast hideCloseButton kind="error" title="Automatic retries exhausted" subtitle={step.error} /><Button className="manual-retry-button" size="sm" kind="tertiary" renderIcon={Restart} onClick={() => manualRetry(agent.id)}>Retry step</Button></>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : agent.activity.length === 0 ? (
        <div className="activity-empty"><div className="empty-signal"><Play size={26} /></div><h3>No prompts executed today</h3><p>Start a run to see its live task progress and outputs here.</p>{agent.status === 'idle' && <Button size="sm" renderIcon={Play} onClick={() => useFleetStore.getState().startRun(agent.id)}>Start run</Button>}</div>
      ) : null}
      {agent.activity.length > 0 && <section className="prompt-history"><h3>Today's prompts</h3><ul>{agent.activity.map((item) => <li key={item.id}><div><strong>{item.label}</strong><time dateTime={item.timestamp}>{formatTimestamp(item.timestamp)}</time></div></li>)}</ul></section>}
    </div>
  )
}

function DetailPanel() {
  const store = useFleetStore()
  const agent = store.agents.find((item) => item.id === store.detailAgentId)
  useEffect(() => {
    if (!agent) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        store.closeDetail()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [agent, store.closeDetail])
  if (!agent) return null
  return (
    <>
      <button className="detail-backdrop" aria-label="Close agent detail" onClick={store.closeDetail} />
      <aside className="detail-panel" role="complementary" aria-label={`${agent.name} details`}>
        <header className="detail-header">
          <div className="detail-kicker"><span>Agent detail</span><StatusBadge status={agent.status} /></div>
          <div className="detail-title-row"><div><h2>{agent.name}</h2><p>{TYPE_LABELS[agent.agentType]} · {EDITOR_LABELS[agent.editorIntegration]}</p></div><Button hasIconOnly kind="ghost" size="sm" renderIcon={Close} iconDescription="Close agent detail" onClick={store.closeDetail} /></div>
          <div className="detail-actions"><AgentActions agent={agent} /><Button size="sm" kind="tertiary" renderIcon={Settings} onClick={() => store.openEdit(agent.id)}>Edit</Button></div>
        </header>
        <Tabs selectedIndex={store.detailTab} onChange={({ selectedIndex }) => store.setDetailTab(selectedIndex)} className="detail-tabs">
          <TabList aria-label="Agent detail tabs" contained>
            <Tab>Configuration</Tab>
            <Tab>History</Tab>
            <Tab>Activity</Tab>
          </TabList>
          <TabPanels>
            <TabPanel><ConfigurationTab agent={agent} /></TabPanel>
            <TabPanel><HistoryTab agent={agent} /></TabPanel>
            <TabPanel><ActivityTab agent={agent} /></TabPanel>
          </TabPanels>
        </Tabs>
      </aside>
    </>
  )
}

function ExportModal() {
  const open = useFleetStore((state) => state.exportOpen)
  const text = useFleetStore((state) => state.exportPreviewText)
  const close = useFleetStore((state) => state.closeExport)
  const copy = useFleetStore((state) => state.copyExport)
  const download = useFleetStore((state) => state.downloadExport)
  const changeHint = useFleetStore((state) => state.exportChangeHint)
  const agents = useFleetStore((state) => state.agents)
  const rollup = getRollup(agents)
  const containerRef = useRef(null)
  useOverlayFocusTrap(open, containerRef)
  if (!open) return null
  return (
    <Modal className="export-modal" open modalHeading="Export fleet" modalLabel="Live fleet snapshot" onRequestClose={close} size="lg" primaryButtonText="Close" onRequestSubmit={close} selectorPrimaryFocus=".json-preview">
      <div ref={containerRef}>
        <p className="modal-intro">This API-shaped document is compiled from the current registry, timelines, and run state.</p>
        <p className="export-change-hint" role="status">{changeHint}</p>
        <section className="print-summary" aria-label="Printable fleet summary">
          <div><span>Fleet total</span><strong>{rollup.total}</strong></div>
          {STATUSES.map((status) => <div key={status}><span>{STATUS_LABELS[status]}</span><strong>{rollup[status]}</strong></div>)}
        </section>
        <div className="export-meta"><span>fleet-json</span><span>{new Blob([text]).size.toLocaleString()} bytes</span></div>
        <pre className="json-preview" tabIndex={0} aria-label="Fleet JSON preview">{text}</pre>
        <div className="modal-actions-row"><Button size="sm" kind="ghost" onClick={() => window.print()}>Print summary</Button><Button size="sm" renderIcon={Copy} onClick={() => copy(text)}>Copy</Button><Button size="sm" kind="tertiary" renderIcon={Download} onClick={() => download(text)}>Download</Button></div>
      </div>
    </Modal>
  )
}

function ImportModal() {
  const open = useFleetStore((state) => state.importOpen)
  const draft = useFleetStore((state) => state.importDraft)
  const close = useFleetStore((state) => state.closeImport)
  const setDraft = useFleetStore((state) => state.setImportDraft)
  const importFleet = useFleetStore((state) => state.importFleet)
  const containerRef = useRef(null)
  useOverlayFocusTrap(open, containerRef)
  const { control, handleSubmit, reset, trigger, formState: { errors, isValid, isSubmitting } } = useForm({ resolver: zodResolver(importFormSchema), mode: 'onChange', defaultValues: { jsonText: draft } })
  useEffect(() => { if (open) { reset({ jsonText: useFleetStore.getState().importDraft }); setTimeout(() => trigger(), 0) } }, [open, reset, trigger])
  if (!open) return null
  const submit = (data) => {
    const result = parseFleetText(data.jsonText)
    if (result.success) importFleet(result.data)
  }
  return (
    <Modal open modalHeading="Import fleet" modalLabel="Fleet snapshot" primaryButtonText="Import fleet" secondaryButtonText="Cancel" primaryButtonDisabled={isSubmitting} onRequestClose={close} onSecondarySubmit={close} onRequestSubmit={handleSubmit(submit)} size="lg" preventCloseOnClickOutside selectorPrimaryFocus="#fleet-json-import">
      <div ref={containerRef}>
        <p className="modal-intro">Paste a complete fleet JSON document. A valid import replaces the current registry and can be undone.</p>
        <Controller name="jsonText" control={control} render={({ field }) => (
          <TextArea id="fleet-json-import" rows={13} labelText="Fleet JSON" placeholder="Paste the exported fleet snapshot here" invalid={Boolean(errors.jsonText)} invalidText={errors.jsonText?.message} aria-describedby={errors.jsonText ? 'fleet-json-import-error' : undefined} value={field.value} onChange={(event) => { field.onChange(event); setDraft(event.target.value) }} onBlur={field.onBlur} />
        )} />
        {errors.jsonText && <span id="fleet-json-import-error" className="sr-only">{errors.jsonText.message}</span>}
      </div>
    </Modal>
  )
}

function CommandPalette() {
  const store = useFleetStore()
  const containerRef = useRef(null)
  useOverlayFocusTrap(store.paletteOpen, containerRef)
  if (!store.paletteOpen) return null
  const commands = [
    ...store.agents.map((agent) => ({ id: `jump-${agent.id}`, label: `Jump to ${agent.name}`, hint: `${TYPE_LABELS[agent.agentType]} · ${STATUS_LABELS[agent.status]}`, icon: Settings, run: () => store.selectAgent(agent.id) })),
    { id: 'register', label: 'Register Agent', hint: 'Create API payload', icon: Add, run: store.openRegister },
    { id: 'export', label: 'Export fleet', hint: 'Open live JSON', icon: Export, run: store.openExport },
    { id: 'undo', label: 'Undo', hint: store.exitingAgentId ? 'Cancel pending removal' : store.undoStack.length ? 'Restore previous registry' : 'Nothing to undo', icon: Undo, disabled: !store.undoStack.length && !store.exitingAgentId, run: store.undo },
    { id: 'redo', label: 'Redo', hint: store.redoStack.length ? 'Reapply registry mutation' : 'Nothing to redo', icon: Redo, disabled: !store.redoStack.length, run: store.redo },
  ]
  const query = store.paletteQuery.trim().toLocaleLowerCase()
  const fuzzyMatch = (label) => {
    if (!query) return true
    let cursor = 0
    for (const character of label.toLocaleLowerCase()) if (character === query[cursor]) cursor += 1
    return cursor === query.length
  }
  const visible = commands.filter((command) => command.label.toLocaleLowerCase().includes(query) || fuzzyMatch(command.label))
  const moveCommandFocus = (event, offset) => {
    const buttons = [...document.querySelectorAll('.command-list button:not(:disabled)')]
    if (!buttons.length) return
    const index = buttons.indexOf(document.activeElement)
    const next = index < 0 ? 0 : (index + offset + buttons.length) % buttons.length
    event.preventDefault()
    buttons[next].focus()
  }
  return (
    <Modal className="palette-modal" open modalHeading="Command palette" modalLabel="Fleet navigation" onRequestClose={store.closePalette} size="sm" primaryButtonText="Close" onRequestSubmit={store.closePalette} selectorPrimaryFocus="#palette-search">
      <div ref={containerRef}>
        <Search id="palette-search" autoFocus labelText="Search commands" placeholder="Search agents and actions" value={store.paletteQuery} onChange={(event) => store.setPaletteQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') moveCommandFocus(event, 1) }} />
        <div className="palette-shortcut"><span>Navigate</span><kbd>↑↓</kbd><span>Run</span><kbd>Enter</kbd><span>Close</span><kbd>Esc</kbd></div>
        <ul className="command-list">
          {visible.map((command) => {
            const Icon = command.icon
            return <li key={command.id}><button type="button" disabled={command.disabled} onKeyDown={(event) => { if (event.key === 'ArrowDown') moveCommandFocus(event, 1); if (event.key === 'ArrowUp') moveCommandFocus(event, -1) }} onClick={() => { const modalCommand = command.id === 'register' || command.id === 'export'; command.run(); if (modalCommand) store.dismissPalette(); else store.closePalette(); }}><Icon size={18} /><span><strong>{command.label}</strong><small>{command.hint}</small></span></button></li>
          })}
        </ul>
        {!visible.length && <div className="small-empty"><Filter size={24} /><p>No command matches “{store.paletteQuery}”. Try a different agent name or action, or clear the search to browse all commands.</p><Button kind="ghost" size="sm" onClick={() => store.setPaletteQuery('')}>Clear search</Button></div>}
      </div>
    </Modal>
  )
}

function Toasts() {
  const toasts = useFleetStore((state) => state.toasts)
  const dismiss = useFleetStore((state) => state.dismissToast)
  return <div className="toast-stack" aria-label="Notifications">{toasts.map((toast) => <ToastNotification key={toast.id} timeout={3600} lowContrast kind={toast.kind} title={toast.title} onClose={() => dismiss(toast.id)} />)}</div>
}

export default function App() {
  const agents = useFleetStore((state) => state.agents)
  const detailAgentId = useFleetStore((state) => state.detailAgentId)
  const announcement = useFleetStore((state) => state.announcement)
  const theme = useFleetStore((state) => state.theme)
  const timer = useRef(null)
  useEffect(() => {
    timer.current = window.setInterval(() => useFleetStore.getState().tickRuns(), 1000)
    return () => window.clearInterval(timer.current)
  }, [])
  useEffect(() => registerWebMCP(), [])
  useEffect(() => {
    const onKeyDown = (event) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        useFleetStore.getState().openPalette()
      }
      const target = event.target
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable
      if (modifier && event.key.toLocaleLowerCase() === 'z' && !typing) {
        event.preventDefault()
        if (event.shiftKey) useFleetStore.getState().redo()
        else useFleetStore.getState().undo()
      }
      if (event.key === 'Escape') {
        const state = useFleetStore.getState()
        if (state.paletteOpen) state.closePalette()
        else if (state.exportOpen) state.closeExport()
        else if (state.importOpen) state.closeImport()
        else if (state.modal) state.closeModal()
        else if (state.detailAgentId) state.closeDetail()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
  return (
    <div className={`app-shell theme-${theme} ${detailAgentId ? 'has-detail' : ''}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-glyph"><span /></span><div><strong>Mission Control</strong><span>Engineering systems</span></div></div>
        <button className="command-trigger" type="button" onClick={() => useFleetStore.getState().openPalette()}><span>Search or run a command</span><kbd>⌘ K</kbd></button>
        <div className="environment-pill"><span className="live-dot" />Production fleet</div>
      </header>
      <main className="main-workspace">
        <section className="page-heading">
          <div><span className="eyebrow">Operations / agent fleet</span><h1>Agent registry</h1><p>Monitor coding agents, orchestrate runs, and move fleet state between sessions.</p></div>
          <div className="snapshot-stamp"><span>Live snapshot</span><strong>{agents.length.toString().padStart(2, '0')} agents</strong></div>
        </section>
        <RollupStrip agents={agents} />
        <section className="registry-card" aria-labelledby="registry-heading">
          <div className="registry-card-heading"><div><h2 id="registry-heading">Fleet agents</h2><p>All registered integrations and their latest state</p></div><span className="keyboard-hint"><kbd>⌘ K</kbd> commands</span></div>
          <ActionToolbar />
          <AgentTable />
        </section>
      </main>
      <DetailPanel />
      <AgentModal />
      <RemoveModal />
      <ExportModal />
      <ImportModal />
      <CommandPalette />
      <Toasts />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </div>
  )
}
