import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Checkbox,
  InlineLoading,
  Modal,
  Search,
  Select,
  SelectItem,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
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
  Theme,
  ToastNotification,
  Toggle,
} from '@carbon/react'
import {
  Add,
  ArrowRight,
  ChartPie,
  Checkmark,
  ChevronDown,
  Close,
  Compare,
  Copy,
  DataBase,
  Download,
  Launch,
  List,
  Notification,
  PauseFilled,
  Pin,
  PinFilled,
  PlayFilledAlt,
  Redo,
  Renew,
  Search as SearchIcon,
  StarFilled,
  Undo,
  Upload,
} from '@carbon/icons-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateCost, chartColors } from './data.js'
import { alertSchema, budgetSchema, importInputSchema, makeUsageFormSchema } from './schemas.js'
import { csvFromEvents, deriveRollups, reportFromState, useAppStore } from './store.js'

const currency = (value, digits = 2) => `$${Number(value || 0).toFixed(digits)}`
const compactNumber = (value) => Intl.NumberFormat('en-US', { notation: value >= 1_000_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
const time = (value) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(value))
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const fuzzy = (text, query) => {
  const source = text.toLowerCase()
  const wanted = query.toLowerCase().trim()
  let index = 0
  for (const char of source) if (char === wanted[index]) index += 1
  return index === wanted.length
}

function StatusBadge({ tier }) {
  return <Tag type={tier === 'free' ? 'green' : 'gray'} size="sm" className={`status-badge ${tier}`}><span className="badge-dot" />{tier === 'free' ? 'Free' : 'Paid'}</Tag>
}

function ToolbarButton({ label, icon: Icon, disabled, onClick, active = false, className = '' }) {
  return (
    <button type="button" className={`toolbar-button ${active ? 'active' : ''} ${className}`} disabled={disabled} onClick={onClick}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  )
}

function BudgetForm({ total }) {
  const budget = useAppStore((state) => state.sessionBudget)
  const saveBudget = useAppStore((state) => state.saveBudget)
  const { register, handleSubmit, reset, formState: { errors, isValid, isDirty } } = useForm({
    resolver: zodResolver(budgetSchema),
    mode: 'onChange',
    defaultValues: { session_budget_usd: budget.toFixed(2) },
  })
  useEffect(() => reset({ session_budget_usd: budget.toFixed(2) }), [budget, reset])
  const remaining = budget - total
  const over = remaining < 0
  return (
    <section className="budget-block" aria-labelledby="budget-heading">
      <div className="section-eyebrow" id="budget-heading">Session budget</div>
      <form className="budget-form" onSubmit={handleSubmit((data) => saveBudget(data.session_budget_usd))} noValidate>
        <TextInput
          id="session-budget"
          labelText="Budget ceiling (USD)"
          size="sm"
          inputMode="decimal"
          invalid={Boolean(errors.session_budget_usd)}
          invalidText={errors.session_budget_usd?.message}
          {...register('session_budget_usd')}
        />
        <Button type="submit" size="sm" kind="secondary" disabled={!isValid || !isDirty}>Apply</Button>
      </form>
      <div className={`remaining-budget ${over ? 'over' : ''}`} role="status" aria-live="polite">
        <div>
          <span>{over ? 'Over budget' : 'Remaining'}</span>
          <small>{over ? 'Ceiling exceeded' : 'Available this session'}</small>
        </div>
        <strong>{currency(Math.abs(remaining))}</strong>
      </div>
    </section>
  )
}

function CostTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{payload[0].payload.model}</strong><span>{currency(payload[0].value, 4)}</span></div>
}

function CostSidebar({ rollups, total }) {
  const models = useAppStore((state) => state.models)
  const hidden = useAppStore((state) => state.hiddenChartModels)
  const toggleLegend = useAppStore((state) => state.toggleLegend)
  const disclosureOpen = useAppStore((state) => state.disclosureOpen)
  const toggleDisclosure = useAppStore((state) => state.toggleDisclosure)
  const highlightCatalogModel = useAppStore((state) => state.highlightCatalogModel)
  const visibleData = rollups.filter((row) => !hidden.includes(row.model) && row.subtotal > 0)
  return (
    <aside className="cost-sidebar" id="cost-sidebar" aria-label="Session cost tracker">
      <div className="cost-header">
        <div>
          <span className="section-eyebrow">Cost tracker</span>
          <h2>Session spend</h2>
        </div>
        <div className="total-chip"><strong>{currency(total)}</strong><span>{rollups.reduce((sum, row) => sum + row.requests, 0)} requests</span></div>
      </div>

      <div className="chart-shell" aria-label="Cost distribution pie chart">
        {visibleData.length ? (
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={visibleData} dataKey="subtotal" nameKey="model" innerRadius={48} outerRadius={76} paddingAngle={2} stroke="transparent" isAnimationActive animationDuration={450}>
                {visibleData.map((entry) => <Cell key={entry.model} fill={chartColors[rollups.findIndex((item) => item.model === entry.model) % chartColors.length]} />)}
              </Pie>
              <Tooltip content={<CostTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart"><ChartPie size={28} /><strong>No slices visible</strong><span>Turn a legend model back on.</span></div>
        )}
        {visibleData.length > 0 && <div className="chart-center"><span>Total</span><strong>{currency(visibleData.reduce((sum, row) => sum + row.subtotal, 0))}</strong></div>}
      </div>

      <div className="chart-legend" aria-label="Chart legend">
        {rollups.map((row, index) => {
          const isVisible = !hidden.includes(row.model)
          return (
            <button key={row.model} type="button" aria-pressed={isVisible} onClick={() => toggleLegend(row.model)} className={!isVisible ? 'muted' : ''}>
              <span className="legend-swatch" style={{ background: chartColors[index % chartColors.length] }} />
              <span>{row.model}</span>
            </button>
          )
        })}
      </div>

      <BudgetForm total={total} />

      <section className="cost-rollups" aria-labelledby="model-spend-heading">
        <div className="section-eyebrow" id="model-spend-heading">By model</div>
        <StructuredListWrapper isCondensed>
          <StructuredListBody>
            {rollups.map((row) => {
              const open = Boolean(disclosureOpen[row.model])
              return (
                <StructuredListRow key={row.model} className="rollup-row">
                  <StructuredListCell>
                    <div className="rollup-top">
                      <div><strong>{row.model}</strong><span className="rollup-meta">{row.requests} request{row.requests === 1 ? '' : 's'} {models.find((item) => item.name === row.model) && <StatusBadge tier={models.find((item) => item.name === row.model).pricing_tier} />}</span></div>
                      <strong>{currency(row.subtotal, 4)}</strong>
                    </div>
                    <button className="source-trigger" type="button" aria-expanded={open} onClick={() => toggleDisclosure(row.model)}>
                      <ChevronDown className={open ? 'rotated' : ''} size={14} />
                      {row.events.length} contributing event{row.events.length === 1 ? '' : 's'}
                    </button>
                    <div className={`source-list ${open ? 'open' : ''}`}>
                      <div>
                        {row.events.map((event) => (
                          <button type="button" className="source-event" key={event.id} onClick={() => highlightCatalogModel(row.model)}>
                            <span><strong>{event.request_label}</strong><small>{time(event.timestamp)} · {event.prompt_tokens.toLocaleString()} in / {event.completion_tokens.toLocaleString()} out</small></span>
                            <span>{currency(event.cost, 4)} <ArrowRight size={12} /></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </StructuredListCell>
                </StructuredListRow>
              )
            })}
          </StructuredListBody>
        </StructuredListWrapper>
      </section>
    </aside>
  )
}

function AlertModal() {
  const open = useAppStore((state) => state.alertOpen)
  const config = useAppStore((state) => state.alertConfig)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const save = useAppStore((state) => state.saveAlertConfig)
  const { control, register, reset, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(alertSchema),
    mode: 'onChange',
    defaultValues: config,
  })
  useEffect(() => { if (open) reset(config) }, [open, config, reset])
  return (
    <Modal
      open={open}
      modalHeading="Free model alerts"
      modalLabel="Routing watchlist"
      primaryButtonText="Save alerts"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid}
      onRequestClose={() => setOverlay('alertOpen', false)}
      onRequestSubmit={handleSubmit(save)}
      selectorPrimaryFocus="#alert-toggle"
    >
      <p className="modal-intro">Get notified when a qualifying paid model transitions to a zero-cost route.</p>
      <div className="form-stack">
        <Controller name="alerts_enabled" control={control} render={({ field }) => (
          <Toggle id="alert-toggle" labelText="Free-model alerts" labelA="Off" labelB="On" toggled={field.value} onToggle={field.onChange} />
        )} />
        <TextInput
          id="min-context-window"
          labelText="Minimum context window"
          helperText="Whole tokens, 0 or greater"
          inputMode="numeric"
          invalid={Boolean(errors.min_context_window)}
          invalidText={errors.min_context_window?.message}
          {...register('min_context_window', { setValueAs: (value) => value === '' ? undefined : Number(value) })}
        />
      </div>
    </Modal>
  )
}

function LogUsageModal() {
  const open = useAppStore((state) => state.logOpen)
  const models = useAppStore((state) => state.models)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const addManualUsage = useAppStore((state) => state.addManualUsage)
  const activeModels = useMemo(() => models.filter((item) => item.lifecycle !== 'departing'), [models])
  const schema = useMemo(() => makeUsageFormSchema(activeModels.map((item) => item.name)), [activeModels])
  const { register, watch, reset, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { model: activeModels[0]?.name || '', request_label: '', prompt_tokens: 0, completion_tokens: 0 },
  })
  useEffect(() => { if (open) reset({ model: activeModels[0]?.name || '', request_label: '', prompt_tokens: 0, completion_tokens: 0 }) }, [open, activeModels, reset])
  const values = watch()
  const selected = activeModels.find((item) => item.name === values.model)
  const preview = calculateCost(selected, values.prompt_tokens, values.completion_tokens)
  const lock = useRef(false)
  const submit = (data) => {
    if (lock.current) return
    lock.current = true
    addManualUsage(data, calculateCost(activeModels.find((item) => item.name === data.model), data.prompt_tokens, data.completion_tokens))
    window.setTimeout(() => { lock.current = false }, 300)
  }
  return (
    <Modal
      open={open}
      modalHeading="Log model usage"
      modalLabel="Manual usage event"
      primaryButtonText="Log usage"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || isSubmitting}
      onRequestClose={() => setOverlay('logOpen', false)}
      onRequestSubmit={handleSubmit(submit)}
      selectorPrimaryFocus="#usage-model"
    >
      <p className="modal-intro">Record one inference event. Cost is calculated from the current catalog rates.</p>
      <div className="form-stack">
        <Select id="usage-model" labelText="Model" invalid={Boolean(errors.model)} invalidText={errors.model?.message} {...register('model')}>
          <SelectItem value="" text="Select a model" />
          {activeModels.map((item) => <SelectItem key={item.name} value={item.name} text={`${item.name} · ${item.provider}`} />)}
        </Select>
        <TextInput id="request-label" labelText="Request label" placeholder="e.g. Customer support summary" invalid={Boolean(errors.request_label)} invalidText={errors.request_label?.message} {...register('request_label')} />
        <div className="two-column-fields">
          <TextInput id="prompt-tokens" type="number" labelText="Prompt tokens" min="0" invalid={Boolean(errors.prompt_tokens)} invalidText={errors.prompt_tokens?.message} {...register('prompt_tokens', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
          <TextInput id="completion-tokens" type="number" labelText="Completion tokens" min="0" invalid={Boolean(errors.completion_tokens)} invalidText={errors.completion_tokens?.message} {...register('completion_tokens', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
        </div>
        <div className="cost-preview"><span>Computed cost</span><strong>{currency(preview, 6)}</strong><small>Read-only · based on catalog rates</small></div>
      </div>
    </Modal>
  )
}

function ComparisonModal() {
  const open = useAppStore((state) => state.compareOpen)
  const selectedNames = useAppStore((state) => state.compareSelected)
  const models = useAppStore((state) => state.models)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const selected = selectedNames.map((name) => models.find((item) => item.name === name)).filter(Boolean)
  const rows = [
    ['Provider', (m) => m.provider],
    ['Context window', (m) => `${compactNumber(m.context_window)} tokens`],
    ['Input / 1k', (m) => currency(m.input_cost_per_1k, 4)],
    ['Output / 1k', (m) => currency(m.output_cost_per_1k, 4)],
    ['Availability', (m) => <StatusBadge tier={m.pricing_tier} />],
    ['Pinned', (m) => m.pinned ? 'Yes' : 'No'],
  ]
  return (
    <Modal open={open} passiveModal modalHeading="Compare selected models" modalLabel={`${selected.length} routing candidates`} onRequestClose={() => setOverlay('compareOpen', false)} className="compare-modal">
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead><tr><th>Attribute</th>{selected.map((model) => <th key={model.name}>{model.name}</th>)}</tr></thead>
          <tbody>{rows.map(([label, render]) => <tr key={label}><th>{label}</th>{selected.map((model) => <td key={model.name}>{render(model)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Modal>
  )
}

function ImportForm({ onImported }) {
  const importReport = useAppStore((state) => state.importReport)
  const { register, handleSubmit, setError, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(importInputSchema),
    mode: 'onChange',
    defaultValues: { import_json: '' },
  })
  const submit = ({ import_json }) => {
    const result = importReport(JSON.parse(import_json))
    if (!result.ok) {
      setError('import_json', { message: `Import field is invalid: ${result.error}` })
      return
    }
    reset()
    onImported()
  }
  return (
    <form className="import-form" onSubmit={handleSubmit(submit)} noValidate>
      <TextArea id="import-json" labelText="Import Session JSON" placeholder="Paste a routing-session-report-v1 document…" rows={4} invalid={Boolean(errors.import_json)} invalidText={errors.import_json?.message} {...register('import_json')} />
      <Button type="submit" size="sm" kind="tertiary" renderIcon={Upload} disabled={!isValid}>Import and replace</Button>
    </form>
  )
}

function ExportModal() {
  const open = useAppStore((state) => state.exportOpen)
  const tab = useAppStore((state) => state.exportTab)
  const state = useAppStore()
  const setOverlay = state.setOverlay
  const setTab = state.setExportTab
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState(false)
  const [exportedAt, setExportedAt] = useState(() => new Date().toISOString())
  useEffect(() => { if (open) { setExportedAt(new Date().toISOString()); setCopied(false); setImported(false) } }, [open])
  const report = useMemo(() => reportFromState(state, exportedAt), [state.models, state.usageEvents, state.alertConfig, state.sessionBudget, state.compareSelected, exportedAt])
  const json = useMemo(() => JSON.stringify(report, null, 2), [report])
  const csv = useMemo(() => csvFromEvents(state.usageEvents), [state.usageEvents])
  const preview = tab === 'json' ? json : csv
  const copy = async () => {
    await navigator.clipboard.writeText(preview)
    setCopied(true)
    state.setLiveMessage(`${tab.toUpperCase()} export copied`)
    window.setTimeout(() => setCopied(false), 2400)
  }
  const download = () => {
    const blob = new Blob([preview], { type: tab === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = tab === 'json' ? 'routewatch-session.json' : 'routewatch-usage.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Modal open={open} passiveModal modalHeading="Export routing session" modalLabel="Live session artifact" onRequestClose={() => setOverlay('exportOpen', false)} className="export-modal">
      <div className="export-tabs" role="tablist" aria-label="Export format">
        <button type="button" role="tab" aria-selected={tab === 'json'} onClick={() => setTab('json')}>Session JSON</button>
        <button type="button" role="tab" aria-selected={tab === 'csv'} onClick={() => setTab('csv')}>Usage CSV</button>
      </div>
      <div className="export-meta"><span>Compiled live from this session</span><strong>{tab === 'json' ? `${report.catalog.length} models · ${report.total_requests} events` : `${state.usageEvents.length} data rows`}</strong></div>
      <pre className="export-preview" tabIndex="0" aria-label={`${tab.toUpperCase()} export preview`}>{preview}</pre>
      <div className="export-actions">
        <Button size="sm" kind="secondary" renderIcon={Copy} onClick={copy}>Copy</Button>
        <Button size="sm" kind="primary" renderIcon={Download} onClick={download}>Download</Button>
      </div>
      {(copied || imported) && <div className="confirmation" role="status"><Checkmark size={16} /> {copied ? 'Preview copied to clipboard' : 'Session imported successfully'}</div>}
      <div className="import-divider"><span>Restore a report</span></div>
      <ImportForm onImported={() => setImported(true)} />
    </Modal>
  )
}

const commands = [
  { label: 'Model catalog', detail: 'Jump to marketplace table', type: 'destination', value: 'model-catalog', icon: DataBase },
  { label: 'Cost sidebar', detail: 'Review spend and budget', type: 'destination', value: 'cost-sidebar', icon: ChartPie },
  { label: 'Event feed', detail: 'Jump to live usage events', type: 'destination', value: 'event-feed', icon: List },
  { label: 'Alert settings', detail: 'Configure free-model alerts', type: 'destination', value: 'alert-settings-modal', icon: Notification },
  { label: 'Log usage', detail: 'Create a manual usage event', type: 'destination', value: 'log-usage-modal', icon: Add },
  { label: 'Export session', detail: 'Open JSON and CSV artifacts', type: 'destination', value: 'export-panel', icon: Download },
  { label: 'Start simulation', detail: 'Begin the live usage stream', type: 'action', value: 'start', icon: PlayFilledAlt },
  { label: 'Pause simulation', detail: 'Freeze the live usage stream', type: 'action', value: 'pause', icon: PauseFilled },
  { label: 'Refresh catalog', detail: 'Discover marketplace changes', type: 'action', value: 'refresh', icon: Renew },
  { label: 'Compare selection', detail: 'Open side-by-side model comparison', type: 'destination', value: 'comparison-modal', icon: Compare },
]

function CommandPalette() {
  const open = useAppStore((state) => state.commandOpen)
  const query = useAppStore((state) => state.commandQuery)
  const setQuery = useAppStore((state) => state.setCommandQuery)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const navigate = useAppStore((state) => state.navigateDestination)
  const setSimulation = useAppStore((state) => state.setSimulationRunning)
  const triggerRefresh = useAppStore((state) => state.triggerRefresh)
  const matches = commands.filter((command) => fuzzy(`${command.label} ${command.detail}`, query))
  const choose = (command) => {
    if (command.type === 'destination') navigate(command.value)
    if (command.value === 'start') { setSimulation(true); setOverlay('commandOpen', false) }
    if (command.value === 'pause') { setSimulation(false); setOverlay('commandOpen', false) }
    if (command.value === 'refresh') { triggerRefresh(); setOverlay('commandOpen', false) }
  }
  return (
    <Modal open={open} passiveModal modalHeading="Command palette" modalLabel="Navigate or run an action" onRequestClose={() => setOverlay('commandOpen', false)} selectorPrimaryFocus="#command-search" className="command-modal">
      <div className="command-search-wrap"><SearchIcon size={18} /><input id="command-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destinations and actions…" aria-label="Search commands" autoComplete="off" /><kbd>ESC</kbd></div>
      <div className="command-results" role="listbox" aria-label="Commands">
        {matches.map((command) => {
          const Icon = command.icon
          return <button type="button" role="option" aria-selected="false" key={command.label} onClick={() => choose(command)}><span className="command-icon"><Icon size={18} /></span><span><strong>{command.label}</strong><small>{command.detail}</small></span><ArrowRight size={16} /></button>
        })}
        {!matches.length && <div className="command-empty"><SearchIcon size={28} /><strong>No matching commands</strong><span>Type “catalog”, “export”, “simulate”, or “alerts”.</span></div>}
      </div>
      <div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>⌘ K</kbd> toggle</span></div>
    </Modal>
  )
}

function EventFeed({ events, running }) {
  return (
    <section className="event-panel" id="event-feed" aria-labelledby="event-feed-heading">
      <div className="panel-heading-row">
        <div><span className="section-eyebrow">Shared event stream</span><h2 id="event-feed-heading">Usage activity</h2></div>
        <div className={`stream-status ${running ? 'live' : ''}`}><span />{running ? 'Live' : 'Paused'}</div>
      </div>
      {running && <div className="pending-event"><InlineLoading description="Waiting for the next routed request…" /></div>}
      {!events.length ? (
        <div className="feed-empty"><List size={32} /><strong>No usage events yet</strong><span>Start the simulation or log usage to populate this shared stream.</span></div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-model-icon">{event.model.slice(0, 1)}</div>
              <div className="event-copy"><div><strong>{event.request_label}</strong><span>{time(event.timestamp)}</span></div><p>{event.model}</p><small>{event.prompt_tokens.toLocaleString()} prompt · {event.completion_tokens.toLocaleString()} completion</small></div>
              <div className="event-cost"><strong>{currency(event.cost, 4)}</strong><span>{event.source}</span></div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function Catalog({ models, visibleModels, providers }) {
  const searchQuery = useAppStore((state) => state.searchQuery)
  const providerFilter = useAppStore((state) => state.providerFilter)
  const pinnedOnly = useAppStore((state) => state.pinnedOnly)
  const freeOnly = useAppStore((state) => state.freeOnly)
  const selected = useAppStore((state) => state.compareSelected)
  const highlighted = useAppStore((state) => state.highlightedModel)
  const refreshLoading = useAppStore((state) => state.refreshLoading)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)
  const setProviderFilter = useAppStore((state) => state.setProviderFilter)
  const setPinnedOnly = useAppStore((state) => state.setPinnedOnly)
  const applySuggestion = useAppStore((state) => state.applySuggestion)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const toggleCompare = useAppStore((state) => state.toggleCompare)
  const togglePin = useAppStore((state) => state.togglePin)
  const suggestions = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Free']
  const activeFilter = searchQuery || providerFilter !== 'All providers' || pinnedOnly || freeOnly
  return (
    <section className="catalog-panel" id="model-catalog" aria-labelledby="catalog-heading">
      <div className="panel-heading-row catalog-title-row">
        <div><span className="section-eyebrow">Marketplace discovery</span><h2 id="catalog-heading">Model catalog</h2></div>
        <div className="model-count" aria-live="polite"><strong>{visibleModels.length}</strong> of {models.length} models</div>
      </div>
      <div className="catalog-controls">
        <Search id="catalog-search" size="lg" labelText="Search models or providers" placeholder="Search models or providers" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onClear={() => setSearchQuery('')} />
        <Select id="provider-filter" labelText="Provider filter" hideLabel value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
          <SelectItem value="All providers" text="All providers" />
          {providers.map((provider) => <SelectItem key={provider} value={provider} text={provider} />)}
        </Select>
      </div>
      <div className="suggestion-scroller" aria-label="Suggested filters">
        <span className="suggestion-label">Explore</span>
        {suggestions.map((suggestion) => <button className={`suggestion-chip ${(providerFilter === suggestion || (suggestion === 'Free' && searchQuery.toLowerCase() === 'free')) ? 'active' : ''}`} type="button" key={suggestion} onClick={() => applySuggestion(suggestion)}>{suggestion === 'Free' && <StarFilled size={13} />} {suggestion}</button>)}
        <button className={`suggestion-chip ${pinnedOnly ? 'active' : ''}`} type="button" aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(!pinnedOnly)}><PinFilled size={13} /> Pinned only</button>
        {activeFilter && <button className="clear-chip" type="button" onClick={clearFilters}><Close size={13} /> Clear</button>}
      </div>
      <div className={`table-region ${refreshLoading ? 'is-loading' : ''}`}>
        {refreshLoading && <div className="table-loading"><InlineLoading description="Discovering marketplace changes…" /></div>}
        {visibleModels.length ? (
          <TableContainer className="catalog-table-container">
            <Table size="lg" useZebraStyles={false} className="catalog-table">
              <TableHead><TableRow>
                <TableHeader className="select-col"><span className="sr-only">Compare selection</span></TableHeader>
                <TableHeader>Model</TableHeader>
                <TableHeader>Provider</TableHeader>
                <TableHeader>Context</TableHeader>
                <TableHeader>Input / 1k</TableHeader>
                <TableHeader>Output / 1k</TableHeader>
                <TableHeader>Access</TableHeader>
                <TableHeader className="pin-col">Pin</TableHeader>
              </TableRow></TableHead>
              <TableBody>
                {visibleModels.map((model) => (
                  <TableRow id={`catalog-row-${slug(model.name)}`} key={model.name} className={`${model.lifecycle === 'new' ? 'model-new' : ''} ${model.lifecycle === 'departing' ? 'model-departing' : ''} ${highlighted === model.name ? 'highlighted' : ''}`}>
                    <TableCell className="select-col"><Checkbox id={`compare-${model.id}`} hideLabel labelText={`Select ${model.name} for comparison`} checked={selected.includes(model.name)} onChange={(_, data) => toggleCompare(model.name, data?.checked)} /></TableCell>
                    <TableCell><div className="model-name-cell"><span className="name-icons">{model.pricing_tier === 'free' && <StarFilled className="free-star" size={15} />}{model.pinned && <PinFilled className="pinned-mark" size={14} />}</span><span><strong>{model.name}</strong>{model.lifecycle === 'new' && <small>Newly discovered</small>}{model.lifecycle === 'departing' && <small>Leaving catalog</small>}</span></div></TableCell>
                    <TableCell><span className="provider-name">{model.provider}</span></TableCell>
                    <TableCell>{compactNumber(model.context_window)}</TableCell>
                    <TableCell className="mono-cost">{currency(model.input_cost_per_1k, 4)}</TableCell>
                    <TableCell className="mono-cost">{currency(model.output_cost_per_1k, 4)}</TableCell>
                    <TableCell><StatusBadge tier={model.pricing_tier} /></TableCell>
                    <TableCell className="pin-col"><button type="button" className={`pin-button ${model.pinned ? 'active' : ''}`} aria-pressed={model.pinned} aria-label={`${model.pinned ? 'Unpin' : 'Pin'} ${model.name}`} onClick={() => togglePin(model.name)}>{model.pinned ? <PinFilled size={17} /> : <Pin size={17} />}</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="catalog-empty"><SearchIcon size={34} /><strong>No models found</strong><span>Nothing matched “{searchQuery || providerFilter}” with the active filters.</span><Button size="sm" kind="tertiary" onClick={clearFilters}>Clear filters</Button></div>
        )}
      </div>
    </section>
  )
}

function App() {
  const state = useAppStore()
  const { models, usageEvents, searchQuery, providerFilter, pinnedOnly, freeOnly, sortBy, compareSelected, simulationRunning, sessionBudget, navTarget, toasts, liveMessage } = state
  const providers = useMemo(() => [...new Set(models.filter((item) => item.lifecycle !== 'departing').map((item) => item.provider))].sort(), [models])
  const visibleModels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const result = models.filter((model) => {
      const queryMatch = !query || model.name.toLowerCase().includes(query) || model.provider.toLowerCase().includes(query) || (query === 'free' && model.pricing_tier === 'free')
      return queryMatch && (providerFilter === 'All providers' || model.provider === providerFilter) && (!pinnedOnly || model.pinned) && (!freeOnly || model.pricing_tier === 'free')
    })
    return result.sort((a, b) => {
      if (sortBy === 'provider') return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name)
      if (sortBy === 'context-window') return b.context_window - a.context_window
      if (sortBy === 'input-cost') return a.input_cost_per_1k - b.input_cost_per_1k
      return a.name.localeCompare(b.name)
    })
  }, [models, searchQuery, providerFilter, pinnedOnly, freeOnly, sortBy])
  const rollups = useMemo(() => deriveRollups(usageEvents), [usageEvents])
  const total = useMemo(() => Number(rollups.reduce((sum, row) => sum + row.subtotal, 0).toFixed(8)), [rollups])
  const previousFocus = useRef(null)

  useEffect(() => {
    if (!simulationRunning) return undefined
    const initial = window.setTimeout(() => useAppStore.getState().addSimulatedUsage(), 1200)
    const interval = window.setInterval(() => useAppStore.getState().addSimulatedUsage(), 3600)
    return () => { window.clearTimeout(initial); window.clearInterval(interval) }
  }, [simulationRunning])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        previousFocus.current = document.activeElement
        state.setOverlay('commandOpen', !useAppStore.getState().commandOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.setOverlay])

  useEffect(() => {
    if (!state.commandOpen && previousFocus.current && document.contains(previousFocus.current)) {
      window.setTimeout(() => previousFocus.current?.focus(), 0)
    }
  }, [state.commandOpen])

  useEffect(() => {
    if (!navTarget) return
    if (['model-catalog', 'event-feed', 'cost-sidebar'].includes(navTarget.destination)) {
      window.setTimeout(() => document.getElementById(navTarget.destination)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [navTarget])

  useEffect(() => {
    if (!state.highlightedModel) return undefined
    const timer = window.setTimeout(() => state.clearHighlight(), 4000)
    return () => window.clearTimeout(timer)
  }, [state.highlightedModel, state.clearHighlight])

  const overBudget = total > sessionBudget
  return (
    <Theme theme="g100">
      <div className="app-shell">
        <a className="skip-link" href="#model-catalog">Skip to model catalog</a>
        <header className="app-header">
          <div className="brand-block"><div className="brand-mark"><DataBase size={21} /></div><div><span>Routewatch</span><strong>Model marketplace monitor</strong></div></div>
          <div className="header-state"><span className="status-dot" />Marketplace online <kbd>⌘ K</kbd></div>
        </header>

        <div className="main-grid">
          <main className="workspace">
            <section className="hero-strip">
              <div><span className="hero-kicker">Routing operations / Live session</span><h1>Find the right route.<br /><em>Watch every dollar.</em></h1><p>Discover models, monitor live inference spend, and keep your routing budget under control.</p></div>
              <div className="hero-metrics">
                <div><span>Catalog</span><strong>{models.filter((item) => item.lifecycle !== 'departing').length}</strong><small>active models</small></div>
                <div><span>Free routes</span><strong>{models.filter((item) => item.pricing_tier === 'free' && item.lifecycle !== 'departing').length}</strong><small>available now</small></div>
                <div className={overBudget ? 'metric-alert' : ''}><span>Remaining</span><strong>{currency(Math.abs(sessionBudget - total))}</strong><small>{overBudget ? 'over budget' : 'session budget'}</small></div>
              </div>
            </section>

            <nav className="action-toolbar" aria-label="Session actions">
              <div className="toolbar-primary">
                <ToolbarButton label={simulationRunning ? 'Pause simulation' : 'Start simulation'} icon={simulationRunning ? PauseFilled : PlayFilledAlt} active={simulationRunning} onClick={() => state.setSimulationRunning(!simulationRunning)} />
                <ToolbarButton label="Log usage" icon={Add} onClick={() => state.setOverlay('logOpen', true)} />
                <ToolbarButton label="Refresh" icon={Renew} disabled={state.refreshLoading} onClick={state.triggerRefresh} />
                <ToolbarButton label={`Compare ${compareSelected.length ? `(${compareSelected.length})` : ''}`} icon={Compare} disabled={compareSelected.length < 2} onClick={() => state.setOverlay('compareOpen', true)} />
              </div>
              <div className="toolbar-secondary">
                <ToolbarButton label="Undo" icon={Undo} disabled={!state.undoStack.length} onClick={state.undo} />
                <ToolbarButton label="Redo" icon={Redo} disabled={!state.redoStack.length} onClick={state.redo} />
                <ToolbarButton label="Alerts" icon={Notification} onClick={() => state.setOverlay('alertOpen', true)} />
                <ToolbarButton label="Costs" icon={ChartPie} className="mobile-cost-button" onClick={() => state.setOverlay('mobileCostsOpen', true)} />
                <ToolbarButton label="Export" icon={Download} onClick={() => state.setOverlay('exportOpen', true)} />
                <button type="button" className="command-key-button" onClick={() => state.setOverlay('commandOpen', true)} aria-label="Open command palette"><SearchIcon size={16} /><span>Commands</span><kbd>⌘K</kbd></button>
              </div>
            </nav>

            <Catalog models={models} visibleModels={visibleModels} providers={providers} />
            <EventFeed events={usageEvents} running={simulationRunning} />
            <footer className="app-footer"><span><span className="status-dot" /> All systems operational</span><span>In-memory session · Reload to reset</span></footer>
          </main>
          <CostSidebar rollups={rollups} total={total} />
        </div>

        {state.mobileCostsOpen && <div className="mobile-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) state.setOverlay('mobileCostsOpen', false) }}><div className="mobile-cost-drawer"><button type="button" className="drawer-close" onClick={() => state.setOverlay('mobileCostsOpen', false)} aria-label="Close cost sidebar"><Close size={18} /></button><CostSidebar rollups={rollups} total={total} /></div></div>}

        <AlertModal />
        <LogUsageModal />
        <ComparisonModal />
        <ExportModal />
        <CommandPalette />

        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => <AutoToast key={toast.id} toast={toast} />)}
        </div>
        <div className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      </div>
    </Theme>
  )
}

function AutoToast({ toast }) {
  const dismiss = useAppStore((state) => state.dismissToast)
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 5200)
    return () => window.clearTimeout(timer)
  }, [toast.id, dismiss])
  return <ToastNotification kind={toast.kind} title="Free route discovered" subtitle={toast.message} timeout={0} onCloseButtonClick={() => dismiss(toast.id)} />
}

export default App
