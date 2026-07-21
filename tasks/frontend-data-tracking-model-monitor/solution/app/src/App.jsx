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
  Flash,
  Idea,
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
  Wallet,
} from '@carbon/icons-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateCost, chartColors } from './data.js'
import { alertSchema, budgetSchema, importInputSchema, makeUsageFormSchema } from './schemas.js'
import {
  burnProjection,
  csvFromEvents,
  deriveRollups,
  reportFromState,
  seedDiff,
  seedSnapshot,
  sessionTotal,
  useAppStore,
} from './store.js'

const currency = (value, digits = 2) => `$${Number(value || 0).toFixed(digits)}`
const compactNumber = (value) => Intl.NumberFormat('en-US', { notation: value >= 1_000_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
const isoTime = (value) => new Date(value).toISOString()
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const fuzzy = (text, query) => {
  const source = text.toLowerCase()
  const wanted = query.toLowerCase().trim()
  if (!wanted) return true
  if (source.includes(wanted)) return true
  let index = 0
  for (const char of source) if (char === wanted[index]) index += 1
  return index === wanted.length
}

/* Deterministic simulated provider latency, stable per refresh cycle. */
function latencyFor(model, refreshIndex) {
  const seed = `${model.provider}|${model.name}|${refreshIndex}`
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  const ms = 74 + (hash % 312)
  const band = ms < 160 ? 'fast' : ms < 260 ? 'steady' : 'busy'
  return { ms, band }
}

function formatMinutes(minutes) {
  if (minutes == null) return '—'
  if (minutes <= 0) return 'now'
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `~${Math.round(minutes)}m`
  return `~${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`
}

/* Keep an overlay mounted through its exit transition. */
function useOverlayPhase(open, delay = 260) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return undefined
    }
    const timer = window.setTimeout(() => setMounted(false), delay)
    return () => window.clearTimeout(timer)
  }, [open, delay])
  return mounted
}

/* Return focus to the control that opened an overlay when it closes.
   The opener is captured during render (before Carbon's own mount-time
   focus moves off the trigger) and restored after the exit transition. */
function useOpenerFocus(open, delay = 320) {
  const opener = useRef(null)
  const wasOpen = useRef(false)
  if (open && !wasOpen.current) {
    const active = document.activeElement
    if (active && active !== document.body) opener.current = active
  }
  wasOpen.current = open
  useEffect(() => {
    if (open) return undefined
    if (!opener.current) return undefined
    const element = opener.current
    opener.current = null
    if (!document.body.contains(element)) return undefined
    const timer = window.setTimeout(() => element.focus({ preventScroll: true }), delay)
    return () => window.clearTimeout(timer)
  }, [open, delay])
}

/* Visible label + hint/error wired to the field with aria-describedby. */
function Field({ id, label, hint, error, children }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {error
        ? <p className="field-error" id={`${id}-error`}>{error}</p>
        : hint ? <p className="field-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  )
}

const a11yProps = (id, error, hint) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
})

function StatusBadge({ tier }) {
  return (
    <Tag type={tier === 'free' ? 'green' : 'gray'} size="sm" className={`status-badge ${tier}`}>
      <span className="badge-dot" />{tier === 'free' ? 'Free' : 'Paid'}
    </Tag>
  )
}

function ToolbarButton({ label, icon: Icon, disabled, onClick, active = false, className = '', badge }) {
  return (
    <button type="button" className={`toolbar-button ${active ? 'active' : ''} ${className}`} disabled={disabled} onClick={onClick} aria-pressed={active || undefined}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{label}</span>
      {badge ? <span className="toolbar-badge">{badge}</span> : null}
    </button>
  )
}

function BudgetForm({ total }) {
  const budget = useAppStore((state) => state.sessionBudget)
  const running = useAppStore((state) => state.simulationRunning)
  const events = useAppStore((state) => state.usageEvents)
  const saveBudget = useAppStore((state) => state.saveBudget)
  const { register, handleSubmit, reset, formState: { errors, isValid, isDirty, touchedFields } } = useForm({
    resolver: zodResolver(budgetSchema),
    mode: 'onChange',
    defaultValues: { session_budget_usd: budget.toFixed(2) },
  })
  useEffect(() => { reset({ session_budget_usd: budget.toFixed(2) }) }, [budget, reset])
  const remaining = budget - total
  const over = remaining < 0
  const showError = Boolean(errors.session_budget_usd)
  const burn = useMemo(() => burnProjection(events, budget), [events, budget])
  return (
    <section className="budget-block" aria-labelledby="budget-heading">
      <div className="section-eyebrow" id="budget-heading"><Wallet size={13} /> Session budget</div>
      <form className="budget-form" onSubmit={handleSubmit((data) => saveBudget(Number(data.session_budget_usd)))} noValidate>
        <Field id="session-budget" label="Budget ceiling (USD)" hint="Greater than $0.00, max $100,000.00, up to 2 decimals" error={showError ? errors.session_budget_usd.message : undefined}>
          <div className="budget-input-row">
            <TextInput
              id="session-budget"
              labelText="Budget ceiling (USD)"
              hideLabel
              size="sm"
              inputMode="decimal"
              {...a11yProps('session-budget', showError, true)}
              {...register('session_budget_usd')}
            />
            <Button type="submit" size="sm" kind="secondary" disabled={!isValid || !isDirty}>Apply</Button>
          </div>
        </Field>
      </form>
      <div className={`remaining-budget ${over ? 'over' : ''}`} role="status">
        <div className="remaining-copy">
          <span className="remaining-label">{over ? 'Over budget' : 'Remaining'}</span>
          <small>{over ? 'Ceiling exceeded — raise it or undo spend' : 'Available under the ceiling'}</small>
        </div>
        <strong className="remaining-value">{over ? `−${currency(Math.abs(remaining))}` : currency(remaining)}</strong>
      </div>
      <div className={`burn-readout ${running ? 'live' : ''}`} aria-live="off">
        <Flash size={13} aria-hidden="true" />
        {running
          ? <span>Burn ≈ <strong>{currency(burn.perMinute, 4)}</strong>/min · exhausts in <strong>{burn.exhausted ? 'now' : formatMinutes(burn.minutesLeft)}</strong></span>
          : <span>Start the simulation to project burn rate and time-to-exhaustion.</span>}
      </div>
    </section>
  )
}

function CostTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="chart-tooltip">
      <strong>{entry.payload.model}</strong>
      <span>{currency(entry.value, 4)}</span>
      <small>{entry.payload.share}% of session spend</small>
    </div>
  )
}

function CostSidebar({ rollups, total, id = 'cost-sidebar' }) {
  const models = useAppStore((state) => state.models)
  const hidden = useAppStore((state) => state.hiddenChartModels)
  const toggleLegend = useAppStore((state) => state.toggleLegend)
  const disclosureOpen = useAppStore((state) => state.disclosureOpen)
  const toggleDisclosure = useAppStore((state) => state.toggleDisclosure)
  const highlightCatalogModel = useAppStore((state) => state.highlightCatalogModel)
  const rollupsWithSubtotal = rollups.filter((row) => row.subtotal > 0)
  const visibleData = rollupsWithSubtotal
    .filter((row) => !hidden.includes(row.model))
    .map((row) => ({ ...row, share: total > 0 ? Number(((row.subtotal / total) * 100).toFixed(1)) : 0 }))
  const totalRequests = rollups.reduce((sum, row) => sum + row.requests, 0)
  return (
    <aside className="cost-sidebar" id={id} aria-label="Session cost tracker">
      <div className="cost-header">
        <div>
          <span className="section-eyebrow"><ChartPie size={13} /> Cost tracker</span>
          <h2>Session spend</h2>
        </div>
        <div className="total-chip">
          <strong>{currency(total)}</strong>
          <span>{totalRequests} request{totalRequests === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="chart-shell" role="img" aria-label={visibleData.length ? `Cost distribution pie chart across ${visibleData.length} models` : 'Cost pie chart with every legend entry toggled off'}>
        {visibleData.length ? (
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={visibleData}
                dataKey="subtotal"
                nameKey="model"
                innerRadius={48}
                outerRadius={76}
                paddingAngle={2}
                stroke="transparent"
                isAnimationActive
                animationDuration={520}
              >
                {visibleData.map((entry) => (
                  <Cell key={entry.model} fill={chartColors[rollups.findIndex((item) => item.model === entry.model) % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CostTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">
            <ChartPie size={26} aria-hidden="true" />
            <strong>No slices visible</strong>
            <span>Every legend entry is toggled off. Re-enable a model to redraw the distribution.</span>
          </div>
        )}
        {visibleData.length > 0 && (
          <div className="chart-center" aria-hidden="true">
            <span>Visible</span>
            <strong>{currency(visibleData.reduce((sum, row) => sum + row.subtotal, 0))}</strong>
          </div>
        )}
      </div>

      <div className="chart-legend" aria-label="Chart legend — toggle slices">
        {rollupsWithSubtotal.map((row, index) => {
          const isVisible = !hidden.includes(row.model)
          return (
            <button key={row.model} type="button" aria-pressed={isVisible} onClick={() => toggleLegend(row.model)} className={`legend-entry ${isVisible ? '' : 'muted'}`}>
              <span className="legend-swatch" style={{ background: chartColors[index % chartColors.length] }} aria-hidden="true" />
              <span className="legend-name">{row.model}</span>
            </button>
          )
        })}
      </div>

      <BudgetForm total={total} />

      <section className="cost-rollups" aria-labelledby="model-spend-heading">
        <div className="section-eyebrow" id="model-spend-heading">By model</div>
        <StructuredListWrapper isCondensed aria-label="Cost rollups by model">
          <StructuredListBody>
            {rollups.map((row, index) => {
              const open = Boolean(disclosureOpen[row.model])
              const modelRecord = models.find((item) => item.name === row.model)
              return (
                <StructuredListRow key={row.model} className="rollup-row">
                  <StructuredListCell>
                    <div className="rollup-top">
                      <div className="rollup-id">
                        <span className="legend-swatch small" style={{ background: chartColors[index % chartColors.length] }} aria-hidden="true" />
                        <div>
                          <strong>{row.model}</strong>
                          <span className="rollup-meta">
                            {row.requests} request{row.requests === 1 ? '' : 's'}
                            {modelRecord && <StatusBadge tier={modelRecord.pricing_tier} />}
                          </span>
                        </div>
                      </div>
                      <strong className="rollup-subtotal">{currency(row.subtotal)}</strong>
                    </div>
                    <button className="source-trigger" type="button" aria-expanded={open} onClick={() => toggleDisclosure(row.model)}>
                      <ChevronDown className={`chevron ${open ? 'rotated' : ''}`} size={14} aria-hidden="true" />
                      <span>{row.events.length} contributing event{row.events.length === 1 ? '' : 's'}</span>
                    </button>
                    <div className={`source-list ${open ? 'open' : ''}`}>
                      <div className="source-list-clip">
                        {row.events.map((event) => (
                          <button type="button" className="source-event" key={event.id} onClick={() => highlightCatalogModel(row.model)}>
                            <span className="source-event-copy">
                              <strong>{event.request_label}</strong>
                              <small>{isoTime(event.timestamp)} · {event.prompt_tokens.toLocaleString()} in / {event.completion_tokens.toLocaleString()} out</small>
                            </span>
                            <span className="source-event-cost">{currency(event.cost, 4)} <ArrowRight size={12} aria-hidden="true" /></span>
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
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  const { control, register, reset, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(alertSchema),
    mode: 'onChange',
    defaultValues: config,
  })
  useEffect(() => { if (open) reset(config) }, [open, config, reset])
  if (!mounted) return null
  const contextError = errors.min_context_window?.message
  return (
    <Modal
      open={open}
      preventCloseOnClickOutside
      hasScrollingContent={false}
      modalHeading="Free model alerts"
      modalLabel="Routing watchlist"
      primaryButtonText="Save alerts"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid}
      onRequestClose={() => setOverlay('alertOpen', false)}
      onRequestSubmit={handleSubmit(save)}
      selectorPrimaryFocus="#alert-toggle"
      className="app-modal"
    >
      <p className="modal-intro">Get an in-app toast whenever a qualifying paid model transitions to a zero-cost route during a refresh or a simulation event.</p>
      <div className="form-stack">
        <Controller name="alerts_enabled" control={control} render={({ field }) => (
          <Toggle id="alert-toggle" labelText="Free-model alerts" labelA="Off" labelB="On" toggled={Boolean(field.value)} onToggle={(checked) => field.onChange(checked)} />
        )} />
        <Field id="min-context-window" label="Minimum context window" hint="Whole tokens, 0 or greater" error={contextError}>
          <TextInput
            id="min-context-window"
            labelText="Minimum context window"
            hideLabel
            inputMode="numeric"
            {...a11yProps('min-context-window', Boolean(contextError), true)}
            {...register('min_context_window', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
          />
        </Field>
      </div>
    </Modal>
  )
}

function LogUsageModal() {
  const open = useAppStore((state) => state.logOpen)
  const models = useAppStore((state) => state.models)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const addManualUsage = useAppStore((state) => state.addManualUsage)
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  const activeModels = useMemo(() => models.filter((item) => item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing'), [models])
  const schema = useMemo(() => makeUsageFormSchema(activeModels.map((item) => item.name)), [activeModels])
  const defaults = { model: '', request_label: '', prompt_tokens: '', completion_tokens: '' }
  const { register, watch, reset, handleSubmit, trigger, formState: { errors, isValid, dirtyFields, isSubmitted } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: defaults,
  })
  useEffect(() => { if (open) reset(defaults) }, [open, reset])
  /* Once the form has been touched, validate every field so untouched but
     invalid fields (e.g. an empty token field) name their error too. */
  const anyTouched = isSubmitted || Object.keys(dirtyFields).length > 0
  useEffect(() => { if (open && anyTouched) trigger() }, [open, anyTouched, trigger])
  const values = watch()
  const selected = activeModels.find((item) => item.name === values.model)
  const preview = calculateCost(selected, values.prompt_tokens, values.completion_tokens)
  const lock = useRef(false)
  const submit = (data) => {
    if (lock.current) return
    lock.current = true
    addManualUsage(data, calculateCost(activeModels.find((item) => item.name === data.model), data.prompt_tokens, data.completion_tokens))
    window.setTimeout(() => { lock.current = false }, 350)
  }
  if (!mounted) return null
  const show = (name) => anyTouched && Boolean(errors[name])
  const message = (name) => (show(name) ? errors[name].message : undefined)
  return (
    <Modal
      open={open}
      preventCloseOnClickOutside
      hasScrollingContent={false}
      modalHeading="Log model usage"
      modalLabel="Manual usage event"
      primaryButtonText="Log usage"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid}
      onRequestClose={() => setOverlay('logOpen', false)}
      onRequestSubmit={handleSubmit(submit)}
      selectorPrimaryFocus="#usage-model"
      className="app-modal"
    >
      <p className="modal-intro">Record one inference event. Cost is computed from the selected model&apos;s current catalog rates and cannot be overridden.</p>
      <div className="form-stack">
        <Field id="usage-model" label="Model" hint="Must exactly match a catalog model name" error={message('model')}>
          <Select id="usage-model" labelText="Model" hideLabel {...a11yProps('usage-model', show('model'), true)} {...register('model')}>
            <SelectItem value="" text="Select a model" />
            {activeModels.map((item) => <SelectItem key={item.name} value={item.name} text={`${item.name} · ${item.provider}`} />)}
          </Select>
        </Field>
        <Field id="request-label" label="Request label" hint="1–80 characters" error={message('request_label')}>
          <TextInput id="request-label" labelText="Request label" hideLabel placeholder="e.g. Customer support summary" {...a11yProps('request-label', show('request_label'), true)} {...register('request_label')} />
        </Field>
        <div className="two-column-fields">
          <Field id="prompt-tokens" label="Prompt tokens" hint="Integer ≥ 0" error={message('prompt_tokens')}>
            <TextInput id="prompt-tokens" type="number" labelText="Prompt tokens" hideLabel min="0" step="1" {...a11yProps('prompt-tokens', show('prompt_tokens'), true)} {...register('prompt_tokens', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })} />
          </Field>
          <Field id="completion-tokens" label="Completion tokens" hint="Integer ≥ 0" error={message('completion_tokens')}>
            <TextInput id="completion-tokens" type="number" labelText="Completion tokens" hideLabel min="0" step="1" {...a11yProps('completion-tokens', show('completion_tokens'), true)} {...register('completion_tokens', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })} />
          </Field>
        </div>
        <div className="cost-preview" aria-live="off">
          <span>Computed cost</span>
          <strong>{currency(preview, 6)}</strong>
          <small>Read-only · (prompt × in-rate) + (completion × out-rate)</small>
        </div>
      </div>
    </Modal>
  )
}

function ComparisonModal() {
  const open = useAppStore((state) => state.compareOpen)
  const selectedNames = useAppStore((state) => state.compareSelected)
  const models = useAppStore((state) => state.models)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  const selected = selectedNames.map((name) => models.find((item) => item.name === name)).filter(Boolean)
  if (!mounted) return null
  const rows = [
    ['Provider', (m) => m.provider],
    ['Context window', (m) => `${compactNumber(m.context_window)} tokens`],
    ['Input / 1k', (m) => currency(m.input_cost_per_1k, 4)],
    ['Output / 1k', (m) => currency(m.output_cost_per_1k, 4)],
    ['Availability', (m) => <StatusBadge tier={m.pricing_tier} />],
    ['Pinned', (m) => (m.pinned ? <span className="pinned-yes"><PinFilled size={13} aria-hidden="true" /> Yes</span> : 'No')],
  ]
  return (
    <Modal
      open={open}
      passiveModal
      preventCloseOnClickOutside
      hasScrollingContent={false}
      modalHeading="Compare selected models"
      modalLabel={`${selected.length} routing candidates side by side`}
      onRequestClose={() => setOverlay('compareOpen', false)}
      className="app-modal compare-modal"
    >
      <div className="comparison-scroll" tabIndex="0">
        <table className="comparison-table">
          <thead><tr><th scope="col">Attribute</th>{selected.map((model) => <th scope="col" key={model.name}>{model.name}</th>)}</tr></thead>
          <tbody>
            {rows.map(([label, render]) => (
              <tr key={label}><th scope="row">{label}</th>{selected.map((model) => <td key={model.name}>{render(model)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="compare-hint">Closing keeps the row selection intact for another pass.</p>
    </Modal>
  )
}

function ImportForm({ onImported }) {
  const importReport = useAppStore((state) => state.importReport)
  const importFocusToken = useAppStore((state) => state.importFocusToken)
  const exportOpen = useAppStore((state) => state.exportOpen)
  const textRef = useRef(null)
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({
    resolver: zodResolver(importInputSchema),
    mode: 'onChange',
    defaultValues: { import_json: '' },
  })
  const importField = register('import_json')
  useEffect(() => {
    if (exportOpen && importFocusToken > 0) textRef.current?.focus()
  }, [importFocusToken, exportOpen])
  const submit = ({ import_json }) => {
    let parsed
    try {
      parsed = JSON.parse(import_json)
    } catch {
      setError('import_json', { message: 'Import field must contain valid Session JSON' })
      return
    }
    const result = importReport(parsed)
    if (!result.ok) {
      setError('import_json', { message: `Import field is invalid: ${result.error}` })
      return
    }
    reset()
    onImported()
  }
  const importError = errors.import_json?.message
  return (
    <form className="import-form" onSubmit={handleSubmit(submit)} noValidate>
      <Field id="import-json" label="Import Session JSON" hint="Paste a routing-session-report-v1 document to replace this session" error={importError}>
        <TextArea
          id="import-json"
          labelText="Import Session JSON"
          hideLabel
          placeholder="Paste a routing-session-report-v1 document…"
          rows={4}
          {...a11yProps('import-json', Boolean(importError), true)}
          {...importField}
          ref={(element) => { importField.ref(element); textRef.current = element }}
        />
      </Field>
      <Button type="submit" size="sm" kind="tertiary" renderIcon={Upload}>Import and replace</Button>
    </form>
  )
}

function ExportPanel() {
  const open = useAppStore((state) => state.exportOpen)
  const tab = useAppStore((state) => state.exportTab)
  const models = useAppStore((state) => state.models)
  const usageEvents = useAppStore((state) => state.usageEvents)
  const alertConfig = useAppStore((state) => state.alertConfig)
  const sessionBudget = useAppStore((state) => state.sessionBudget)
  const compareSelected = useAppStore((state) => state.compareSelected)
  const exportStamp = useAppStore((state) => state.exportStamp)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const setTab = useAppStore((state) => state.setExportTab)
  const setLiveMessage = useAppStore((state) => state.setLiveMessage)
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState(false)
  useEffect(() => { if (open) { setCopied(false); setImported(false) } }, [open])
  const report = useMemo(
    () => reportFromState({ models, usageEvents, alertConfig, sessionBudget, compareSelected }, exportStamp),
    [models, usageEvents, alertConfig, sessionBudget, compareSelected, exportStamp],
  )
  const json = useMemo(() => JSON.stringify(report, null, 2), [report])
  const csv = useMemo(() => csvFromEvents(usageEvents), [usageEvents])
  const preview = tab === 'json' ? json : csv
  const diff = useMemo(
    () => seedDiff({ models, usageEvents, alertConfig, sessionBudget }, seedSnapshot),
    [models, usageEvents, alertConfig, sessionBudget],
  )
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview)
    } catch {
      setLiveMessage('Clipboard unavailable in this browser')
      return
    }
    setCopied(true)
    setLiveMessage(`${tab === 'json' ? 'Session JSON' : 'Usage CSV'} export copied to clipboard`)
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
    setLiveMessage(`${tab === 'json' ? 'Session JSON' : 'Usage CSV'} download started`)
  }
  if (!mounted) return null
  return (
    <Modal
      open={open}
      passiveModal
      preventCloseOnClickOutside
      hasScrollingContent={false}
      modalHeading="Export routing session"
      modalLabel="Live session artifact"
      onRequestClose={() => setOverlay('exportOpen', false)}
      className="app-modal export-modal"
    >
      <div className="export-tabs" role="tablist" aria-label="Export format">
        <button type="button" role="tab" id="export-tab-json" aria-selected={tab === 'json'} aria-controls="export-preview" className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}>Session JSON</button>
        <button type="button" role="tab" id="export-tab-csv" aria-selected={tab === 'csv'} aria-controls="export-preview" className={tab === 'csv' ? 'active' : ''} onClick={() => setTab('csv')}>Usage CSV</button>
      </div>
      <div className="export-meta">
        <span>Compiled live from this session · exported {isoTime(exportStamp)}</span>
        <strong>{tab === 'json' ? `${report.catalog.length} models · ${report.total_requests} events` : `${usageEvents.length} data rows + header`}</strong>
      </div>
      <div className="export-diff" aria-label="Changes since seed">
        <span className="diff-label">Δ since seed</span>
        {diff.length
          ? diff.map((part) => <span className="diff-chip" key={part}>{part}</span>)
          : <span className="diff-none">Pristine seed session — no mutations yet.</span>}
      </div>
      <pre className="export-preview" id="export-preview" role="tabpanel" aria-labelledby={tab === 'json' ? 'export-tab-json' : 'export-tab-csv'} tabIndex="0">{preview}</pre>
      <div className="export-actions">
        <Button id="export-copy-button" size="sm" kind="secondary" renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
        <Button size="sm" kind="primary" renderIcon={Download} onClick={download}>Download</Button>
      </div>
      {(copied || imported) && (
        <div className="confirmation" role="status">
          <Checkmark size={16} aria-hidden="true" /> {copied ? 'Preview copied to clipboard.' : 'Session JSON imported — feed, pins, budget, and exports match the document.'}
        </div>
      )}
      <div className="import-divider"><span>Restore a report</span></div>
      <ImportForm onImported={() => { setImported(true); setCopied(false) }} />
    </Modal>
  )
}

const commands = [
  { label: 'Model catalog', detail: 'Jump to the marketplace table', type: 'destination', value: 'model-catalog', icon: DataBase, keys: 'g c' },
  { label: 'Cost sidebar', detail: 'Review spend, budget, and rollups', type: 'destination', value: 'cost-sidebar', icon: ChartPie, keys: 'g s' },
  { label: 'Event feed', detail: 'Jump to the live usage stream', type: 'destination', value: 'event-feed', icon: List, keys: 'g e' },
  { label: 'Alert settings', detail: 'Configure free-model alerts', type: 'destination', value: 'alert-settings-modal', icon: Notification },
  { label: 'Log usage', detail: 'Create a manual usage event', type: 'destination', value: 'log-usage-modal', icon: Add },
  { label: 'Export session', detail: 'Open the JSON and CSV artifacts', type: 'destination', value: 'export-panel', icon: Download, keys: 'g x' },
  { label: 'Start simulation', detail: 'Begin the live usage stream', type: 'action', value: 'start', icon: PlayFilledAlt },
  { label: 'Pause simulation', detail: 'Freeze the live usage stream', type: 'action', value: 'pause', icon: PauseFilled },
  { label: 'Refresh catalog', detail: 'Discover marketplace changes', type: 'action', value: 'refresh', icon: Renew },
  { label: 'Compare selection', detail: 'Open side-by-side model comparison', type: 'destination', value: 'comparison-modal', icon: Compare },
]

function CommandPalette() {
  const open = useAppStore((state) => state.commandOpen)
  const query = useAppStore((state) => state.commandQuery)
  const recentModels = useAppStore((state) => state.recentModels)
  const setQuery = useAppStore((state) => state.setCommandQuery)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const navigate = useAppStore((state) => state.navigateDestination)
  const highlight = useAppStore((state) => state.highlightCatalogModel)
  const setSimulation = useAppStore((state) => state.setSimulationRunning)
  const triggerRefresh = useAppStore((state) => state.triggerRefresh)
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => { if (open) { setQuery(''); setActiveIndex(0) } }, [open, setQuery])
  const matches = useMemo(() => commands.filter((command) => fuzzy(`${command.label} ${command.detail}`, query)), [query])
  useEffect(() => { setActiveIndex((index) => Math.min(index, Math.max(matches.length - 1, 0))) }, [matches.length])
  if (!mounted) return null
  const choose = (command) => {
    if (command.type === 'destination') {
      navigate(command.value)
      return
    }
    if (command.value === 'start') setSimulation(true)
    if (command.value === 'pause') setSimulation(false)
    if (command.value === 'refresh') triggerRefresh()
    setOverlay('commandOpen', false)
  }
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % Math.max(matches.length, 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index - 1 + Math.max(matches.length, 1)) % Math.max(matches.length, 1)) }
    if (event.key === 'Enter' && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]) }
  }
  return (
    <Modal
      open={open}
      passiveModal
      preventCloseOnClickOutside
      hasScrollingContent={false}
      modalHeading="Command palette"
      modalLabel="Navigate or run an action"
      onRequestClose={() => setOverlay('commandOpen', false)}
      selectorPrimaryFocus="#command-search"
      className="app-modal command-modal"
    >
      <div className="command-search-wrap">
        <SearchIcon size={18} aria-hidden="true" />
        <input
          id="command-search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
          onKeyDown={onKeyDown}
          placeholder="Search destinations and actions…"
          aria-label="Search commands"
          autoComplete="off"
        />
        <kbd>ESC</kbd>
      </div>
      {recentModels.length > 0 && (
        <div className="jump-list" aria-label="Recent models — jump back">
          <span className="jump-label">Recent</span>
          {recentModels.map((name) => (
            <button key={name} type="button" className="jump-chip" onClick={() => { highlight(name); setOverlay('commandOpen', false) }}>{name}</button>
          ))}
        </div>
      )}
      <div className="command-results" role="listbox" aria-label="Commands" id="command-results">
        {matches.map((command, index) => {
          const Icon = command.icon
          return (
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              key={command.label}
              className={index === activeIndex ? 'active' : ''}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(command)}
            >
              <span className="command-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="command-copy"><strong>{command.label}</strong><small>{command.detail}</small></span>
              {command.keys && <kbd className="command-keys">{command.keys}</kbd>}
            </button>
          )
        })}
        {!matches.length && (
          <div className="command-empty" role="option" aria-selected="false" aria-disabled="true">
            <SearchIcon size={26} aria-hidden="true" />
            <strong>No commands match “{query}”</strong>
            <span>Try “catalog”, “export”, “simulation”, or “alerts”.</span>
          </div>
        )}
      </div>
      <div className="command-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> select</span>
        <span><kbd>g</kbd> then <kbd>c</kbd><kbd>s</kbd><kbd>e</kbd><kbd>x</kbd> chords</span>
        <span><kbd>/</kbd> focus catalog search</span>
      </div>
    </Modal>
  )
}

function EventFeed({ events, running }) {
  return (
    <section className="event-panel" id="event-feed" aria-labelledby="event-feed-heading">
      <div className="panel-heading-row">
        <div><span className="section-eyebrow"><List size={13} /> Shared event stream</span><h2 id="event-feed-heading">Usage activity</h2></div>
        <div className={`stream-status ${running ? 'live' : ''}`}><span className="stream-dot" aria-hidden="true" />{running ? 'Live' : 'Paused'}</div>
      </div>
      {running && <div className="pending-event" aria-hidden="true"><InlineLoading description="Waiting for the next routed request…" /></div>}
      {!events.length ? (
        <div className="feed-empty">
          <List size={30} aria-hidden="true" />
          <strong>No usage events yet</strong>
          <span>Start the simulation from the toolbar or open Log usage to populate this shared stream.</span>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <article className="event-card feed-enter" key={event.id}>
              <div className="event-model-icon" aria-hidden="true">{event.model.slice(0, 1)}</div>
              <div className="event-copy">
                <div><strong>{event.request_label}</strong><span className="event-time">{isoTime(event.timestamp)}</span></div>
                <p>{event.model}</p>
                <small>{event.prompt_tokens.toLocaleString()} prompt · {event.completion_tokens.toLocaleString()} completion</small>
              </div>
              <div className="event-cost"><strong>{currency(event.cost, 4)}</strong><span>{event.source}</span></div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function InsightStrip({ visibleModels, refreshIndex }) {
  const highlight = useAppStore((state) => state.highlightCatalogModel)
  const active = visibleModels.filter((model) => model.lifecycle !== 'departing' && model.lifecycle !== 'collapsing')
  if (!active.length) return null
  const freeModels = active.filter((model) => model.pricing_tier === 'free')
  const paidModels = active.filter((model) => model.pricing_tier === 'paid')
  const bestFree = freeModels.reduce((best, model) => (!best || model.context_window > best.context_window ? model : best), null)
  const cheapestPaid = paidModels.reduce((best, model) => {
    const blended = model.input_cost_per_1k + model.output_cost_per_1k
    const bestBlended = best ? best.input_cost_per_1k + best.output_cost_per_1k : Infinity
    return blended < bestBlended ? model : best
  }, null)
  const fastest = active.reduce((best, model) => {
    const latency = latencyFor(model, refreshIndex)
    return !best || latency.ms < best.latency.ms ? { model, latency } : best
  }, null)
  return (
    <div className="insight-strip" aria-label="Routing insights for the current view">
      <span className="insight-label"><Idea size={14} aria-hidden="true" /> Routing insight</span>
      <div className="insight-items">
        {cheapestPaid && (
          <button type="button" className="insight-item" onClick={() => highlight(cheapestPaid.name)}>
            <span>Cheapest paid route in view</span>
            <strong>{cheapestPaid.name} · {currency((cheapestPaid.input_cost_per_1k + cheapestPaid.output_cost_per_1k) / 2, 4)}/1k blended</strong>
          </button>
        )}
        {bestFree && (
          <button type="button" className="insight-item" onClick={() => highlight(bestFree.name)}>
            <span>Best free context in view</span>
            <strong>{bestFree.name} · {compactNumber(bestFree.context_window)} tokens at $0.00</strong>
          </button>
        )}
        {fastest && (
          <span className="insight-item static">
            <span>Fastest simulated provider link</span>
            <strong>{fastest.model.provider} · {fastest.latency.ms} ms</strong>
          </span>
        )}
      </div>
    </div>
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
  const refreshIndex = useAppStore((state) => state.refreshIndex)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)
  const setProviderFilter = useAppStore((state) => state.setProviderFilter)
  const setPinnedOnly = useAppStore((state) => state.setPinnedOnly)
  const applySuggestion = useAppStore((state) => state.applySuggestion)
  const clearFilters = useAppStore((state) => state.clearFilters)
  const toggleCompare = useAppStore((state) => state.toggleCompare)
  const setCompareSelected = useAppStore((state) => state.setCompareSelected)
  const togglePin = useAppStore((state) => state.togglePin)
  const suggestions = ['Nimbus AI', 'Vertexa', 'Google', 'Meta', 'Mistral', 'Free']
  const hasActiveFilter = Boolean(searchQuery) || providerFilter !== 'All providers' || pinnedOnly || freeOnly
  const emptyReason = searchQuery
    ? `“${searchQuery}”`
    : providerFilter !== 'All providers'
      ? `provider “${providerFilter}”`
      : freeOnly ? 'the free filter' : pinnedOnly ? 'the pinned-only filter' : 'the active filters'
  const pinnedEmptySuffix = pinnedOnly && (searchQuery || providerFilter !== 'All providers' || freeOnly) ? ' within pinned models' : ''
  return (
    <section className="catalog-panel" id="model-catalog" aria-labelledby="catalog-heading">
      <div className="panel-heading-row catalog-title-row">
        <div><span className="section-eyebrow"><DataBase size={13} /> Marketplace discovery</span><h2 id="catalog-heading">Model catalog</h2></div>
        <div className="model-count" aria-live="polite"><strong>{visibleModels.length}</strong> of {models.length} models</div>
      </div>
      <div className="catalog-controls">
        <Search
          id="catalog-search"
          size="lg"
          labelText="Search models or providers"
          placeholder="Search models or providers"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onClear={() => setSearchQuery('')}
        />
        <Select id="provider-filter" labelText="Provider filter" hideLabel value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
          <SelectItem value="All providers" text="All providers" />
          {providers.map((provider) => <SelectItem key={provider} value={provider} text={provider} />)}
        </Select>
      </div>
      <div className="suggestion-scroller" role="group" aria-label="Suggested filters">
        <span className="suggestion-label">Explore</span>
        {suggestions.map((suggestion) => {
          const isActive = providerFilter === suggestion || (suggestion === 'Free' && searchQuery.toLowerCase() === 'free')
          return (
            <button className={`suggestion-chip ${isActive ? 'active' : ''}`} type="button" aria-pressed={isActive} key={suggestion} onClick={() => applySuggestion(suggestion)}>
              {suggestion === 'Free' && <StarFilled size={13} aria-hidden="true" />} {suggestion}
            </button>
          )
        })}
        <button className={`suggestion-chip pinned-chip ${pinnedOnly ? 'active' : ''}`} type="button" aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(!pinnedOnly)}>
          <PinFilled size={13} aria-hidden="true" /> Pinned only
        </button>
        {hasActiveFilter && (
          <button className="clear-chip" type="button" onClick={clearFilters}><Close size={13} aria-hidden="true" /> Clear filters</button>
        )}
      </div>
      <InsightStrip visibleModels={visibleModels} refreshIndex={refreshIndex} />
      <div className={`table-region ${refreshLoading ? 'is-loading' : ''}`}>
        {refreshLoading && <div className="table-loading"><InlineLoading description="Discovering marketplace changes…" /></div>}
        {visibleModels.length ? (
          <TableContainer className="catalog-table-container" stickyHeader>
            <Table size="md" useZebraStyles={false} className="catalog-table" aria-label="Model catalog">
              <TableHead>
                <TableRow>
                  <TableHeader className="select-col"><span className="sr-only">Compare selection</span></TableHeader>
                  <TableHeader>Model</TableHeader>
                  <TableHeader>Provider</TableHeader>
                  <TableHeader>Context</TableHeader>
                  <TableHeader>Input / 1k</TableHeader>
                  <TableHeader>Output / 1k</TableHeader>
                  <TableHeader>Access</TableHeader>
                  <TableHeader className="pin-col">Pin</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleModels.map((model) => {
                  const latency = latencyFor(model, refreshIndex)
                  const departing = model.lifecycle === 'departing' || model.lifecycle === 'collapsing'
                  return (
                    <TableRow
                      id={`catalog-row-${slug(model.name)}`}
                      key={model.name}
                      className={`catalog-row ${model.lifecycle === 'new' ? 'model-new' : ''} ${model.lifecycle === 'departing' ? 'model-departing' : ''} ${model.lifecycle === 'collapsing' ? 'model-collapsing' : ''} ${highlighted === model.name ? 'highlighted' : ''}`}
                    >
                      <TableCell className="select-col">
                        <span className="cell-clip">
                          <Checkbox
                            id={`compare-${model.id}`}
                            labelText={`Select ${model.name} for comparison`}
                            hideLabel
                            disabled={departing}
                            checked={selected.includes(model.name)}
                            onChange={(checked) => setCompareSelected(checked ? [...selected, model.name] : selected.filter((name) => name !== model.name))}
                          />
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="cell-clip model-name-cell">
                          <span className="name-icons" aria-hidden="true">
                            {model.pricing_tier === 'free' && <StarFilled className="free-star" size={15} />}
                            {model.pinned && <PinFilled className="pinned-mark" size={14} />}
                          </span>
                          <span className="name-copy">
                            <strong>{model.name}</strong>
                            {model.lifecycle === 'new' && <small>Newly discovered</small>}
                            {departing && <small>Leaving catalog</small>}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="cell-clip provider-cell">
                          <span className="provider-name">{model.provider}</span>
                          <span className={`latency-cue ${latency.band}`} title="Simulated provider latency"><i className="latency-dot" aria-hidden="true" />{latency.ms} ms</span>
                        </span>
                      </TableCell>
                      <TableCell><span className="cell-clip mono-num">{compactNumber(model.context_window)}</span></TableCell>
                      <TableCell><span className="cell-clip mono-num">{currency(model.input_cost_per_1k, 4)}</span></TableCell>
                      <TableCell><span className="cell-clip mono-num">{currency(model.output_cost_per_1k, 4)}</span></TableCell>
                      <TableCell><span className="cell-clip"><StatusBadge tier={model.pricing_tier} /></span></TableCell>
                      <TableCell className="pin-col">
                        <span className="cell-clip">
                          <button
                            type="button"
                            className={`pin-button ${model.pinned ? 'active' : ''}`}
                            aria-pressed={model.pinned}
                            disabled={departing}
                            aria-label={`${model.pinned ? 'Unpin' : 'Pin'} ${model.name}`}
                            onClick={() => togglePin(model.name)}
                          >
                            {model.pinned ? <PinFilled size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}
                          </button>
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="catalog-empty">
            <SearchIcon size={32} aria-hidden="true" />
            <strong>No models found</strong>
            <span>Nothing matched {emptyReason}{pinnedEmptySuffix}.</span>
            <Button size="sm" kind="tertiary" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}
      </div>
    </section>
  )
}

function App() {
  const state = useAppStore()
  const { models, usageEvents, searchQuery, providerFilter, pinnedOnly, freeOnly, sortBy, compareSelected, simulationRunning, sessionBudget, navTarget, toasts, liveMessage, highlightedModel } = state
  const providers = useMemo(() => [...new Set(models.filter((item) => item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing').map((item) => item.provider))].sort(), [models])
  const visibleModels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const filtered = models.filter((model) => {
      const queryMatch = !query || model.name.toLowerCase().includes(query) || model.provider.toLowerCase().includes(query) || (query === 'free' && model.pricing_tier === 'free')
      return queryMatch
        && (providerFilter === 'All providers' || model.provider === providerFilter)
        && (!pinnedOnly || model.pinned)
        && (!freeOnly || model.pricing_tier === 'free')
    })
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === 'provider') return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name)
      if (sortBy === 'context-window') return b.context_window - a.context_window
      if (sortBy === 'input-cost') return a.input_cost_per_1k - b.input_cost_per_1k
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [models, searchQuery, providerFilter, pinnedOnly, freeOnly, sortBy])
  const rollups = useMemo(() => deriveRollups(usageEvents), [usageEvents])
  const total = useMemo(() => sessionTotal(usageEvents), [usageEvents])
  const [chordHint, setChordHint] = useState(false)
  const chordTimer = useRef(null)
  const overBudget = total > sessionBudget

  useEffect(() => {
    if (!simulationRunning) return undefined
    const first = window.setTimeout(() => useAppStore.getState().addSimulatedUsage(), 900)
    const tick = window.setInterval(() => useAppStore.getState().addSimulatedUsage(), 3000)
    return () => { window.clearTimeout(first); window.clearInterval(tick) }
  }, [simulationRunning])

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      const typing = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        useAppStore.getState().setOverlay('commandOpen', !useAppStore.getState().commandOpen)
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      const store = useAppStore.getState()
      if (event.key === '/') {
        event.preventDefault()
        document.querySelector('#catalog-search input')?.focus()
        return
      }
      if (event.key === 'g') {
        setChordHint(true)
        window.clearTimeout(chordTimer.current)
        chordTimer.current = window.setTimeout(() => {
          chordTimer.current = null
          setChordHint(false)
        }, 950)
        return
      }
      if (chordTimer.current) {
        const chordMap = { c: 'model-catalog', s: 'cost-sidebar', e: 'event-feed', x: 'export-panel' }
        if (chordMap[event.key]) {
          event.preventDefault()
          store.navigateDestination(chordMap[event.key])
        }
        window.clearTimeout(chordTimer.current)
        chordTimer.current = null
        setChordHint(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.clearTimeout(chordTimer.current) }
  }, [])

  /* Announce over-budget transitions through the live region. */
  const previousOver = useRef(overBudget)
  useEffect(() => {
    if (overBudget && !previousOver.current) state.setLiveMessage('Session total exceeded the budget ceiling — over budget')
    if (!overBudget && previousOver.current) state.setLiveMessage('Session total is back under the budget ceiling')
    previousOver.current = overBudget
  }, [overBudget, state])

  useEffect(() => {
    if (!navTarget) return
    const surface = ['model-catalog', 'event-feed', 'cost-sidebar'].includes(navTarget.destination)
    if (!surface) return
    const targetId = navTarget.destination === 'cost-sidebar' && window.innerWidth <= 900
      ? 'mobile-cost-sidebar'
      : navTarget.destination
    window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [navTarget])

  useEffect(() => {
    if (!highlightedModel) return undefined
    const row = document.getElementById(`catalog-row-${slug(highlightedModel)}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = window.setTimeout(() => useAppStore.getState().clearHighlight(), 4200)
    return () => window.clearTimeout(timer)
  }, [highlightedModel])

  return (
    <Theme theme="g100">
      <div className="app-shell">
        <a className="skip-link" href="#model-catalog">Skip to model catalog</a>
        <header className="app-header">
          <div className="brand-block">
            <div className="brand-mark"><DataBase size={20} aria-hidden="true" /></div>
            <div className="brand-copy"><span className="brand-name">Routewatch</span><strong>Model marketplace monitor</strong></div>
          </div>
          <div className="header-state">
            <span className="status-dot" aria-hidden="true" />Marketplace online
            <button type="button" className="command-key-button" onClick={() => state.setOverlay('commandOpen', true)} aria-label="Open command palette">
              <SearchIcon size={15} aria-hidden="true" /><span>Commands</span><kbd>⌘K</kbd>
            </button>
          </div>
        </header>

        <div className="main-grid">
          <main className="workspace" id="workspace">
            <section className="ops-banner" aria-label="Session overview">
              <div className="ops-banner-copy">
                <span className="hero-kicker">Routing operations · Live session</span>
                <h1>Route every request.<br /><em>Watch every dollar.</em></h1>
                <p>Discover marketplace models, monitor simulated inference spend in real time, and keep the session under its budget ceiling.</p>
              </div>
              <div className="ops-metrics" role="group" aria-label="Live session metrics">
                <div className="ops-metric">
                  <span>Catalog</span>
                  <strong>{models.filter((item) => item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing').length}</strong>
                  <small>active models</small>
                </div>
                <div className="ops-metric">
                  <span>Free routes</span>
                  <strong>{models.filter((item) => item.pricing_tier === 'free' && item.lifecycle !== 'departing' && item.lifecycle !== 'collapsing').length}</strong>
                  <small>available now</small>
                </div>
                <div className="ops-metric">
                  <span>Session total</span>
                  <strong>{currency(total)}</strong>
                  <small>{rollups.reduce((sum, row) => sum + row.requests, 0)} requests</small>
                </div>
                <div className={`ops-metric ${overBudget ? 'metric-alert' : ''}`}>
                  <span>{overBudget ? 'Over budget' : 'Remaining'}</span>
                  <strong>{overBudget ? `−${currency(Math.abs(sessionBudget - total))}` : currency(sessionBudget - total)}</strong>
                  <small>of {currency(sessionBudget)} ceiling</small>
                </div>
              </div>
            </section>

            <nav className="action-toolbar" aria-label="Session actions">
              <div className="toolbar-primary">
                <ToolbarButton label={simulationRunning ? 'Pause simulation' : 'Start simulation'} icon={simulationRunning ? PauseFilled : PlayFilledAlt} active={simulationRunning} onClick={() => state.setSimulationRunning(!simulationRunning)} />
                <ToolbarButton label="Log usage" icon={Add} onClick={() => state.setOverlay('logOpen', true)} />
                <ToolbarButton label="Refresh" icon={Renew} disabled={state.refreshLoading} onClick={() => state.triggerRefresh()} />
                <ToolbarButton label={`Compare${compareSelected.length ? ` (${compareSelected.length})` : ''}`} icon={Compare} disabled={compareSelected.length < 2} onClick={() => state.setOverlay('compareOpen', true)} />
              </div>
              <div className="toolbar-secondary">
                <ToolbarButton label="Undo" icon={Undo} disabled={!state.undoStack.length} onClick={() => state.undo()} />
                <ToolbarButton label="Redo" icon={Redo} disabled={!state.redoStack.length} onClick={() => state.redo()} />
                <ToolbarButton label="Alerts" icon={Notification} active={state.alertConfig.alerts_enabled} onClick={() => state.setOverlay('alertOpen', true)} />
                <ToolbarButton label="Costs" icon={ChartPie} className="mobile-cost-button" onClick={() => state.setOverlay('mobileCostsOpen', true)} />
                <ToolbarButton label="Export" icon={Download} onClick={() => state.setOverlay('exportOpen', true)} />
              </div>
            </nav>

            <Catalog models={models} visibleModels={visibleModels} providers={providers} />
            <EventFeed events={usageEvents} running={simulationRunning} />
            <footer className="app-footer">
              <span><span className="status-dot" aria-hidden="true" /> All systems operational</span>
              <span>In-memory session · Reload to reset</span>
            </footer>
          </main>
          <CostSidebar rollups={rollups} total={total} />
        </div>

        <MobileCostDrawer rollups={rollups} total={total} />

        <AlertModal />
        <LogUsageModal />
        <ComparisonModal />
        <ExportPanel />
        <CommandPalette />

        <div className="toast-stack" aria-live="polite" role="status">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-card ${toast.leaving ? 'leaving' : ''}`}>
              <ToastNotification
                kind={toast.kind}
                title="Free route discovered"
                subtitle={toast.message}
                timeout={0}
                onCloseButtonClick={() => state.dismissToast(toast.id)}
              />
            </div>
          ))}
        </div>
        {toasts.map((toast) => (
          <AutoDismiss key={toast.id} toast={toast} />
        ))}
        <div className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</div>
        {chordHint && <div className="chord-hint" role="status"><kbd>g</kbd> then <kbd>c</kbd> catalog · <kbd>s</kbd> costs · <kbd>e</kbd> feed · <kbd>x</kbd> export</div>}
      </div>
    </Theme>
  )
}

function MobileCostDrawer({ rollups, total }) {
  const open = useAppStore((state) => state.mobileCostsOpen)
  const setOverlay = useAppStore((state) => state.setOverlay)
  const mounted = useOverlayPhase(open)
  useOpenerFocus(open)
  if (!mounted) return null
  return (
    <div className={`mobile-drawer-backdrop ${open ? 'open' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay('mobileCostsOpen', false) }}>
      <div className="mobile-cost-drawer" role="dialog" aria-label="Session cost tracker">
        <button type="button" className="drawer-close" onClick={() => setOverlay('mobileCostsOpen', false)} aria-label="Close cost sidebar"><Close size={18} aria-hidden="true" /></button>
        <CostSidebar rollups={rollups} total={total} id="mobile-cost-sidebar" />
      </div>
    </div>
  )
}

function AutoDismiss({ toast }) {
  const dismiss = useAppStore((state) => state.dismissToast)
  useEffect(() => {
    if (toast.leaving) return undefined
    const timer = window.setTimeout(() => dismiss(toast.id), 5200)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.leaving, dismiss])
  return null
}

export default App
