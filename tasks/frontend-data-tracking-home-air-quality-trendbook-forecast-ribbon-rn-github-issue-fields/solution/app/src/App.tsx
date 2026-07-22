import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowCounterClockwise,
  ArrowsMerge,
  CaretDown,
  ChartLineUp,
  CheckCircle,
  CloudArrowDown,
  CloudArrowUp,
  Copy,
  Database,
  DownloadSimple,
  FilePlus,
  Funnel,
  Gauge,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SlidersHorizontal,
  Trash,
  WarningCircle,
  Wind,
  X,
} from '@phosphor-icons/react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { saveAs } from 'file-saver'
import {
  HORIZON_VALUES,
  QUERY_VALUES,
  ReadingInputSchema,
  SORT_VALUES,
  deriveSummary,
  stableArtifactJson,
  validateArtifact,
  type AirReading,
  type ReadingInput,
  type SavedQuery,
  type SortMode,
} from './domain'
import { useAirStore, visibleRecords } from './store'

const EMPTY_FORM: ReadingInput = {
  label: '',
  status: 'draft',
  aqi: 0,
  observedOn: '2026-07-22',
  forecast: { projectedAqi: 0, horizonHours: 12, confidence: 0.8 },
  provenance: { releaseVersion: 'AQ-2026.07', sourceIssue: 'HAQ-100', duplicateOfId: null },
}

const queryLabels: Record<SavedQuery, string> = {
  all: 'All readings',
  'needs-attention': 'Needs attention',
  ready: 'Ready',
  archived: 'Archived',
}

const sortLabels: Record<SortMode, string> = {
  manual: 'Manual order',
  'aqi-asc': 'AQI low to high',
  'aqi-desc': 'AQI high to low',
  'observed-desc': 'Newest observed',
}

function statusTone(status: AirReading['status']) {
  return {
    draft: 'border-slate-300 bg-slate-100 text-slate-700',
    ready: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    changed: 'border-amber-300 bg-amber-50 text-amber-900',
    archived: 'border-slate-300 bg-slate-200 text-slate-600',
  }[status]
}

function aqiTone(value: number) {
  if (value <= 50) return 'text-emerald-700'
  if (value <= 100) return 'text-yellow-700'
  if (value <= 150) return 'text-orange-700'
  return 'text-rose-700'
}

function Metric({ label, value, detail, accent = false }: { label: string; value: string | number; detail: string; accent?: boolean }) {
  return (
    <div className={`metric-card ${accent ? 'border-cyan-300 bg-cyan-50/80' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  )
}

function ReadingDialog({
  open,
  record,
  records,
  onOpenChange,
}: {
  open: boolean
  record: AirReading | null
  records: AirReading[]
  onOpenChange: (open: boolean) => void
}) {
  const createRecord = useAirStore((state) => state.createRecord)
  const updateRecord = useAirStore((state) => state.updateRecord)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ReadingInput>({ resolver: zodResolver(ReadingInputSchema), mode: 'onChange', defaultValues: EMPTY_FORM })

  useEffect(() => {
    if (!open) return
    reset(record ? {
      label: record.label,
      status: record.status,
      aqi: record.aqi,
      observedOn: record.observedOn,
      forecast: { ...record.forecast },
      provenance: { ...record.provenance },
    } : EMPTY_FORM)
  }, [open, record, reset])

  const submit = handleSubmit((values) => {
    const result = record ? updateRecord(record.id, values) : createRecord(values)
    if (result.ok) onOpenChange(false)
  })

  const fieldError = (message?: string) => message ? <p className="field-error" role="alert">{message}</p> : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby="reading-form-description">
          <div className="dialog-heading">
            <div>
              <Dialog.Title>{record ? 'Edit air reading' : 'Create air reading'}</Dialog.Title>
              <Dialog.Description id="reading-form-description">Every field follows the exported air-quality-v1 request shape.</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close reading form"><X /></Dialog.Close>
          </div>
          <form onSubmit={submit} className="form-grid" noValidate>
            <label className="field field-wide">Reading label
              <input {...register('label')} placeholder="North bedroom" autoFocus />
              {fieldError(errors.label?.message)}
            </label>
            <label className="field">AQI
              <input type="number" min="0" max="500" step="1" {...register('aqi', { valueAsNumber: true })} />
              {fieldError(errors.aqi?.message)}
            </label>
            <label className="field">Observed date
              <input type="date" {...register('observedOn')} />
              {fieldError(errors.observedOn?.message)}
            </label>
            <label className="field">Status
              <select {...register('status')}>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="field">Projected AQI
              <input type="number" min="0" max="500" step="1" {...register('forecast.projectedAqi', { valueAsNumber: true })} />
              {fieldError(errors.forecast?.projectedAqi?.message)}
            </label>
            <label className="field">Forecast horizon
              <select {...register('forecast.horizonHours', { valueAsNumber: true })}>
                {HORIZON_VALUES.map((value) => <option key={value} value={value}>{value} hours</option>)}
              </select>
              {fieldError(errors.forecast?.horizonHours?.message)}
            </label>
            <label className="field">Confidence
              <input type="number" min="0" max="1" step="0.1" {...register('forecast.confidence', { valueAsNumber: true })} />
              {fieldError(errors.forecast?.confidence?.message)}
            </label>
            <label className="field">Release version
              <input {...register('provenance.releaseVersion')} placeholder="AQ-2026.07" />
              {fieldError(errors.provenance?.releaseVersion?.message)}
            </label>
            <label className="field">Source issue
              <input {...register('provenance.sourceIssue')} placeholder="HAQ-100" />
              {fieldError(errors.provenance?.sourceIssue?.message)}
            </label>
            <label className="field field-wide">Duplicate of
              <select {...register('provenance.duplicateOfId', { setValueAs: (value) => value || null })}>
                <option value="">Not a duplicate</option>
                {records.filter((candidate) => candidate.id !== record?.id).map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.id} — {candidate.label}</option>
                ))}
              </select>
            </label>
            <div className="dialog-actions field-wide">
              <Dialog.Close className="button secondary" type="button">Cancel</Dialog.Close>
              <button className="button primary" type="submit" disabled={!isValid || isSubmitting}>
                {record ? 'Save reading' : 'Create reading'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TransferDialog({
  mode,
  onClose,
}: {
  mode: 'import' | 'export' | null
  onClose: () => void
}) {
  const artifact = useAirStore((state) => state.artifact)
  const importArtifact = useAirStore((state) => state.importArtifact)
  const [payload, setPayload] = useState('')
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const exportText = useMemo(() => mode === 'export' ? stableArtifactJson(artifact()) : '', [artifact, mode])

  useEffect(() => {
    if (mode === 'import') {
      setPayload('')
      setDiagnostics([])
    }
    setCopied(false)
  }, [mode])

  const validateAndImport = () => {
    let raw: unknown
    try {
      raw = JSON.parse(payload)
    } catch (error) {
      setDiagnostics([`document: malformed JSON (${error instanceof Error ? error.message : String(error)}); fix the syntax and retry.`])
      return
    }
    const result = validateArtifact(raw)
    setDiagnostics(result.diagnostics)
    if (result.data) {
      importArtifact(result.data)
      onClose()
    }
  }

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportText)
    setCopied(true)
  }

  const downloadExport = () => {
    saveAs(new Blob([exportText], { type: 'application/json' }), 'air-quality-v1-forecast-ribbon.json')
  }

  return (
    <Dialog.Root open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content transfer-dialog">
          <div className="dialog-heading">
            <div>
              <Dialog.Title>{mode === 'export' ? 'Portable work artifact' : 'Import air-quality-v1 artifact'}</Dialog.Title>
              <Dialog.Description>
                {mode === 'export'
                  ? 'The preview is compiled live from records, derived state, history, and view context.'
                  : 'All records and fields validate before one atomic commit; every diagnostic is reported together.'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close artifact dialog"><X /></Dialog.Close>
          </div>
          {mode === 'export' ? (
            <>
              <pre className="artifact-preview" aria-label="Live artifact preview">{exportText}</pre>
              <div className="dialog-actions">
                <button className="button secondary" onClick={copyExport}><Copy /> {copied ? 'Copied artifact' : 'Copy JSON'}</button>
                <button className="button primary" onClick={downloadExport}><DownloadSimple /> Download JSON</button>
              </div>
            </>
          ) : (
            <>
              <label className="field">Artifact JSON
                <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={13} placeholder="Paste the complete air-quality-v1 JSON document" autoFocus />
              </label>
              {diagnostics.length > 0 && (
                <div className="diagnostics" role="alert" aria-live="assertive">
                  <strong>{diagnostics.length} import issue{diagnostics.length === 1 ? '' : 's'} — session state was not changed</strong>
                  <ul>{diagnostics.map((diagnostic) => <li key={diagnostic}>{diagnostic}</li>)}</ul>
                </div>
              )}
              <div className="dialog-actions">
                <Dialog.Close className="button secondary">Cancel import</Dialog.Close>
                <button className="button primary" onClick={validateAndImport} disabled={!payload.trim()}>Validate and import</button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function App() {
  const records = useAirStore((state) => state.records)
  const selectedId = useAirStore((state) => state.selectedId)
  const query = useAirStore((state) => state.query)
  const sort = useAirStore((state) => state.sort)
  const search = useAirStore((state) => state.search)
  const history = useAirStore((state) => state.history)
  const notice = useAirStore((state) => state.notice)
  const select = useAirStore((state) => state.select)
  const setQuery = useAirStore((state) => state.setQuery)
  const setSort = useAirStore((state) => state.setSort)
  const setSearch = useAirStore((state) => state.setSearch)
  const archiveRecord = useAirStore((state) => state.archiveRecord)
  const deleteRecord = useAirStore((state) => state.deleteRecord)
  const mergeDuplicate = useAirStore((state) => state.mergeDuplicate)
  const applyForecast = useAirStore((state) => state.applyForecast)
  const undo = useAirStore((state) => state.undo)
  const clear = useAirStore((state) => state.clear)
  const loadFixture = useAirStore((state) => state.loadFixture)
  const [readingDialog, setReadingDialog] = useState<'create' | 'edit' | null>(null)
  const [transferDialog, setTransferDialog] = useState<'import' | 'export' | null>(null)
  const [projection, setProjection] = useState(0)
  const [horizon, setHorizon] = useState<6 | 12 | 24>(12)
  const [forecastError, setForecastError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const commitLock = useRef(false)

  const selected = records.find((record) => record.id === selectedId) ?? null
  const derived = useMemo(() => deriveSummary(records), [records])
  const visible = useMemo(() => visibleRecords({ records, query, sort, search }), [records, query, sort, search])

  useEffect(() => {
    if (!selected) return
    setProjection(selected.forecast.projectedAqi)
    setHorizon(selected.forecast.horizonHours)
    setForecastError('')
  }, [selected])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo])

  useEffect(() => {
    const openTransfer = (event: Event) => {
      const mode = (event as CustomEvent<'import' | 'export'>).detail
      if (mode === 'import' || mode === 'export') setTransferDialog(mode)
    }
    window.addEventListener('airwise:transfer', openTransfer)
    return () => window.removeEventListener('airwise:transfer', openTransfer)
  }, [])

  const commitForecast = () => {
    if (!selected || commitLock.current) return
    commitLock.current = true
    const result = applyForecast(selected.id, projection, horizon)
    setForecastError(result.ok ? '' : result.message)
    requestAnimationFrame(() => { commitLock.current = false })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-workbench">Skip to workbench</a>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><Wind weight="duotone" /></span>
          <div><strong>Airwise Trendbook</strong><span>Forecast Ribbon · local evidence workspace</span></div>
        </div>
        <div className="topbar-actions">
          <button className="button ghost" onClick={() => setTransferDialog('import')}><CloudArrowUp /> Import</button>
          <button className="button primary" onClick={() => setTransferDialog('export')}><CloudArrowDown /> Export session</button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="left-rail" aria-label="Reading controls">
          <button className="button primary wide" onClick={() => setReadingDialog('create')}><Plus /> Create reading</button>
          <div className="rail-section">
            <p className="eyebrow"><MagnifyingGlass /> Find evidence</p>
            <label className="search-box">
              <span className="sr-only">Search readings</span>
              <MagnifyingGlass aria-hidden="true" />
              <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search label, ID, issue" />
              <kbd>⌘K</kbd>
            </label>
          </div>
          <div className="rail-section">
            <p className="eyebrow"><Funnel /> Saved queries</p>
            <nav className="query-list" aria-label="Saved reading queries">
              {QUERY_VALUES.map((value) => (
                <button key={value} className={query === value ? 'active' : ''} onClick={() => setQuery(value)}>
                  <span>{queryLabels[value]}</span>
                  <b>{value === 'all' ? records.length : value === 'needs-attention' ? derived.attentionCount : value === 'ready' ? records.filter((record) => record.status === 'ready').length : derived.archivedCount}</b>
                </button>
              ))}
            </nav>
          </div>
          <div className="rail-section">
            <label className="field">Sort records
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                {SORT_VALUES.map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
              </select>
            </label>
          </div>
          <div className="rail-section rail-footer">
            <button className="button ghost wide" disabled={!history.length} onClick={() => undo()}><ArrowCounterClockwise /> Undo last event <kbd>⌘Z</kbd></button>
            <button className="button ghost wide" onClick={loadFixture}><Database /> Load 120-record fixture</button>
            <button className="button danger-text wide" onClick={clear}><Trash /> Clear session</button>
          </div>
        </aside>

        <main id="main-workbench" className="main-workbench">
          <section className="hero-strip" aria-labelledby="workbench-title">
            <div>
              <p className="eyebrow">Home air quality / project evidence</p>
              <h1 id="workbench-title">Decide from one canonical forecast.</h1>
              <p>Select a reading, compare its current and projected AQI, then commit one traceable event across every linked surface.</p>
            </div>
            <div className="session-chip"><CheckCircle weight="fill" /> In-memory session · {history.length} events</div>
          </section>

          <section className="metrics" aria-label="Derived air quality summary">
            <Metric label="Active records" value={derived.activeCount} detail={`${derived.archivedCount} archived`} />
            <Metric label="Current average" value={`${derived.currentAverage} AQI`} detail="From active readings" />
            <Metric label="Projected average" value={`${derived.projectedAverage} AQI`} detail={`${derived.attentionCount} need attention`} accent />
            <Metric label="Canonical changes" value={derived.changedCount} detail="Forecast mutations" />
          </section>

          <section className="ribbon-card" aria-labelledby="forecast-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><ChartLineUp /> Signature interaction</p>
                <h2 id="forecast-title">Forecast Ribbon</h2>
              </div>
              {selected && <span className={`status-pill ${statusTone(selected.status)}`}>{selected.status}</span>}
            </div>
            {selected ? (
              <div className="ribbon-layout">
                <div className="ribbon-context">
                  <span>Selected evidence</span>
                  <strong>{selected.label}</strong>
                  <code>{selected.id}</code>
                  <p>{selected.provenance.sourceIssue} · {selected.provenance.releaseVersion}</p>
                </div>
                <div className="ribbon-track-wrap">
                  <div className="ribbon-values">
                    <span>Current <b className={aqiTone(selected.aqi)}>{selected.aqi}</b></span>
                    <span>Projected <b className={aqiTone(projection)}>{projection}</b></span>
                    <span>Delta <b>{projection - selected.aqi > 0 ? '+' : ''}{projection - selected.aqi}</b></span>
                  </div>
                  <div className="ribbon-track" style={{ '--forecast-position': `${projection / 5}%`, '--current-position': `${selected.aqi / 5}%` } as React.CSSProperties}>
                    <div className="band good" /><div className="band moderate" /><div className="band sensitive" /><div className="band unhealthy" />
                    <span className="current-marker" aria-hidden="true" />
                    <motion.span className="forecast-marker" animate={{ left: `${projection / 5}%` }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} aria-hidden="true" />
                  </div>
                  <input
                    className="ribbon-range"
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={projection}
                    onChange={(event) => setProjection(Number(event.target.value))}
                    aria-label="Projected AQI on forecast ribbon"
                  />
                  <div className="ribbon-controls">
                    <label className="field compact">Exact AQI
                      <input type="number" min="0" max="500" step="1" value={projection} onChange={(event) => setProjection(Number(event.target.value))} />
                    </label>
                    <label className="field compact">Horizon
                      <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value) as 6 | 12 | 24)}>
                        {HORIZON_VALUES.map((value) => <option key={value} value={value}>{value} hours</option>)}
                      </select>
                    </label>
                    <button className="button primary apply-forecast" onClick={commitForecast}><SlidersHorizontal /> Apply canonical forecast</button>
                  </div>
                  {forecastError && <p className="field-error" role="alert">{forecastError}</p>}
                  <p className="helper-copy">Pointer, arrow-key, and exact-value input all preview the same value. Apply creates one event; no-op and double activation create zero extras.</p>
                </div>
              </div>
            ) : (
              <div className="empty-ribbon"><Gauge weight="duotone" /><strong>Select a reading to open its forecast ribbon.</strong><span>The inspector and artifact preview will follow the same selection.</span></div>
            )}
          </section>

          <section className="record-card" aria-labelledby="records-title">
            <div className="section-heading">
              <div><p className="eyebrow">Typed issue fields</p><h2 id="records-title">Air readings</h2></div>
              <span className="result-count">{visible.length} visible / {records.length} total</span>
            </div>
            {visible.length ? (
              <div className="table-scroll" tabIndex={0} aria-label="Scrollable readings table">
                <table>
                  <thead><tr><th>Reading</th><th>AQI</th><th>Projection</th><th>Status</th><th>Release provenance</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {visible.map((record) => (
                        <motion.tr key={record.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} className={selectedId === record.id ? 'selected-row' : ''}>
                          <td><button className="row-select" onClick={() => select(record.id)}><strong>{record.label}</strong><span>{record.id} · {record.observedOn}</span></button></td>
                          <td><b className={aqiTone(record.aqi)}>{record.aqi}</b></td>
                          <td><span>{record.forecast.projectedAqi}</span><small>{record.forecast.horizonHours}h · {Math.round(record.forecast.confidence * 100)}%</small></td>
                          <td><span className={`status-pill ${statusTone(record.status)}`}>{record.status}</span></td>
                          <td><span>{record.provenance.sourceIssue}</span><small>{record.provenance.releaseVersion}{record.provenance.duplicateOfId ? ` · duplicate of ${record.provenance.duplicateOfId}` : ''}</small></td>
                          <td>
                            <div className="row-actions">
                              <button className="icon-button" onClick={() => { select(record.id); setReadingDialog('edit') }} aria-label={`Edit ${record.label}`} title="Edit reading"><PencilSimple /></button>
                              {record.provenance.duplicateOfId && <button className="icon-button" onClick={() => mergeDuplicate(record.id)} aria-label={`Merge duplicate ${record.label}`} title="Merge duplicate"><ArrowsMerge /></button>}
                              <button className="icon-button" onClick={() => archiveRecord(record.id)} disabled={record.status === 'archived'} aria-label={`Archive ${record.label}`} title="Archive reading"><CaretDown /></button>
                              <button className="icon-button danger" onClick={() => window.confirm(`Delete ${record.label}?`) && deleteRecord(record.id)} aria-label={`Delete ${record.label}`} title="Delete reading"><Trash /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FilePlus weight="duotone" />
                <strong>{records.length ? 'No readings match this query.' : 'No authored readings yet.'}</strong>
                <span>{records.length ? 'Clear search or switch to All readings.' : 'Create the first reading to begin a traceable session.'}</span>
                <button className="button secondary" onClick={() => records.length ? (setSearch(''), setQuery('all')) : setReadingDialog('create')}>{records.length ? 'Clear query' : 'Create first reading'}</button>
              </div>
            )}
          </section>
        </main>

        <aside className="inspector" aria-label="Linked reading inspector">
          <div className="section-heading compact-heading"><div><p className="eyebrow">Linked view</p><h2>Evidence inspector</h2></div></div>
          {selected ? (
            <div className="inspector-body">
              <div className="inspector-hero"><strong>{selected.label}</strong><code>{selected.id}</code></div>
              <dl>
                <div><dt>Current AQI</dt><dd>{selected.aqi}</dd></div>
                <div><dt>Projected AQI</dt><dd>{selected.forecast.projectedAqi}</dd></div>
                <div><dt>Horizon</dt><dd>{selected.forecast.horizonHours} hours</dd></div>
                <div><dt>Confidence</dt><dd>{Math.round(selected.forecast.confidence * 100)}%</dd></div>
                <div><dt>Saved query</dt><dd>{queryLabels[query]}</dd></div>
                <div><dt>History anchor</dt><dd>{history.at(-1)?.id ?? 'No event yet'}</dd></div>
              </dl>
              <div className="release-card"><span>Release provenance</span><strong>{selected.provenance.releaseVersion}</strong><p>{selected.provenance.sourceIssue}</p></div>
              <button className="button secondary wide" onClick={() => setReadingDialog('edit')}><PencilSimple /> Edit typed fields</button>
              {selected.provenance.duplicateOfId && <button className="button secondary wide" onClick={() => mergeDuplicate(selected.id)}><ArrowsMerge /> Merge into {selected.provenance.duplicateOfId}</button>}
            </div>
          ) : (
            <div className="inspector-empty"><WarningCircle weight="duotone" /><p>Select one row to inspect linked fields and provenance.</p></div>
          )}
          <div className="history-panel">
            <p className="eyebrow">Recent canonical events</p>
            {history.length ? <ol>{history.slice(-5).reverse().map((event) => <li key={event.id}><b>{event.id}</b><span>{event.action} · {event.recordId}</span></li>)}</ol> : <p>No authored event has been recorded.</p>}
          </div>
        </aside>
      </div>

      <div className="live-notice" role="status" aria-live="polite">{notice}</div>
      <ReadingDialog open={readingDialog !== null} record={readingDialog === 'edit' ? selected : null} records={records} onOpenChange={(open) => !open && setReadingDialog(null)} />
      <TransferDialog mode={transferDialog} onClose={() => setTransferDialog(null)} />
    </div>
  )
}
