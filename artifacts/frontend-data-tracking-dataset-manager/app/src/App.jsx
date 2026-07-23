import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Add, ArrowLeft, ArrowRight, CaretDown, CaretSort, CaretUp, ChartRelationship, Checkmark, Close, DataBase,
  Edit, Events, Export, Flag, FolderOpen, Help, Information, Menu, Moon, Redo, Save, Search, Settings,
  Sun, TrashCan, Undo, Upload, UserMultiple,
} from '@carbon/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { computeStats, fieldError, flaggedFields } from './domain'
import { evalSuites, newImportState, useStore } from './store'
import { AttachDialog, ConfirmDialog, DatasetDialog, MergeDialog, RowDialog } from './components/Dialogs'
import { DuplicatePanel, ExportDrawer, SnapshotPanel, SplitPanel, ThresholdPanel } from './components/Panels'
import { ImportWizard } from './components/ImportWizard'
import { Btn, Chk, EmptyState, Switch, Tag, cx, useAnimatedNumber, useOverlayBehavior } from './ui'

/* ---------------- Sidebar ---------------- */
function Sidebar() {
  const datasets = useStore((s) => s.datasets)
  const selectedId = useStore((s) => s.selectedId)
  const open = useStore((s) => s.sidebarOpen)
  const selectDataset = useStore((s) => s.selectDataset)
  const setUi = useStore((s) => s.setUi)
  const totalRows = datasets.reduce((n, d) => n + d.rows.length, 0)
  const animatedRows = useAnimatedNumber(totalRows)
  const estimatedKb = Math.round(totalRows * 1.8)
  const capacity = 5000
  return (
    <>
      {open && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-60 bg-black/40 min-[769px]:hidden no-print" style={{ zIndex: 64 }} onClick={() => setUi({ sidebarOpen: false })} />}
      <aside className={cx('sidebar', open && 'open')} aria-label="Datasets sidebar">
        <div className="border-b p-5" style={{ borderColor: 'var(--sidebar-3)' }}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-lg" style={{ background: 'var(--brand)' }}><DataBase size={22} color="#fff" /></span>
            <div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight text-white">Dataset Workbench</h1><p className="mt-0.5 text-[11px] uppercase tracking-[.14em]" style={{ color: 'var(--sidebar-text)' }}>Evaluation data ops</p></div>
          </div>
          <Btn className="mt-5 w-full" size="sm" icon={Add} onClick={() => setUi({ modal: { type: 'dataset' } })}>New dataset</Btn>
        </div>
        <nav className="py-3" aria-label="Dataset collection" id="sidebar-nav">
          <div className="mb-1 px-5 text-[11px] font-bold uppercase tracking-[.14em]" style={{ color: 'var(--sidebar-text)' }}>Datasets · {datasets.length}</div>
          {datasets.map((d) => (
            <button key={d.id} type="button" className={cx('sidebar-entry', d.id === selectedId && 'selected')} onClick={() => selectDataset(d.id)} aria-current={d.id === selectedId ? 'page' : undefined}>
              <span className="block truncate text-sm font-bold">{d.name}</span>
              <span className="mt-1 flex items-center justify-between text-xs" style={{ color: 'var(--sidebar-text)' }}>
                <span>{d.rows.length.toLocaleString()} rows</span><span>{new Date(d.createdAt).toLocaleDateString()}</span>
              </span>
            </button>
          ))}
        </nav>
        <section className="mx-4 mt-3 rounded-xl p-4" style={{ background: 'var(--sidebar-2)', border: '1px solid var(--sidebar-3)' }} aria-labelledby="capacity-title">
          <div className="flex items-center justify-between"><h2 id="capacity-title" className="text-sm font-bold text-white">Workspace capacity</h2><span className="mono text-xs" style={{ color: 'var(--sidebar-text)' }}>{animatedRows.toLocaleString()} / {capacity.toLocaleString()}</span></div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--sidebar-3)' }}>
            <div className="gauge-fill h-full rounded-full" style={{ width: `${Math.min(100, totalRows / capacity * 100)}%`, background: 'linear-gradient(90deg, #4f8bff, #7aa7ff)' }} />
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--sidebar-text)' }}>~{estimatedKb.toLocaleString()} KB of 9 MB mock capacity</p>
          <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--sidebar-3)' }}>
            {datasets.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate" style={{ color: 'var(--sidebar-text)' }}>{d.name}</span>
                <span className="mono flex-none text-white">{d.rows.length} · ~{Math.round(d.rows.length * 1.8)} KB</span>
              </div>
            ))}
          </div>
        </section>
        <p className="px-5 py-5 text-[11px] leading-4" style={{ color: 'var(--sidebar-text)' }}>In-memory session · reload restores seeded state</p>
      </aside>
    </>
  )
}

/* ---------------- Dataset header ---------------- */
function DatasetHeader({ dataset, stats }) {
  const setUi = useStore((s) => s.setUi)
  const attachSuite = useStore((s) => s.attachSuite)
  const suite = evalSuites.find((s) => s.id === dataset.attachedSuiteId)
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b bd surface px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-bold t-primary">{dataset.name}</h2>
          <Tag tone="blue">{dataset.rows.length.toLocaleString()} rows</Tag>
          <Tag tone="green" icon={Checkmark}>{stats.verifiedCount} verified</Tag>
          <Tag tone="warn" icon={Flag}>{stats.flaggedCount} flagged</Tag>
        </div>
        <p className="mt-1 max-w-3xl text-sm t-2">{dataset.description || 'No description provided.'}</p>
        {suite && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
            <UserMultiple size={13} aria-hidden="true" />{suite.name}
            <button type="button" className="rounded-full p-0.5 transition hover:bg-black/10" aria-label={`Detach from ${suite.name}`} onClick={() => attachSuite(null)}><Close size={12} /></button>
          </span>
        )}
      </div>
      <Btn size="sm" kind="outline" icon={UserMultiple} onClick={() => setUi({ modal: { type: 'attach' } })}>Use in eval suite</Btn>
    </div>
  )
}

/* ---------------- Formula bar ---------------- */
function FormulaBar() {
  const formulaInput = useStore((s) => s.formulaInput)
  const formulaResult = useStore((s) => s.formulaResult)
  const setUi = useStore((s) => s.setUi)
  const evaluate = useStore((s) => s.evaluateFormula)
  const datasets = useStore((s) => s.datasets), selectedId = useStore((s) => s.selectedId)
  const dataset = datasets.find((d) => d.id === selectedId)
  useEffect(() => { if (formulaInput) evaluate(formulaInput) }, [dataset?.rows, formulaInput, evaluate]) // eslint-disable-line react-hooks/exhaustive-deps
  const numeric = dataset?.schema.filter((f) => f.type === 'number').map((f) => f.name) || []
  return (
    <div id="fx-bar" className="flex min-w-[280px] flex-1 items-center gap-2">
      <label htmlFor="formula" className="mono shrink-0 text-sm font-bold t-brand">ƒx</label>
      <input id="formula" list="formula-suggestions" className="input mono !min-h-8 !py-1 !text-xs flex-1" value={formulaInput}
        aria-invalid={Boolean(formulaResult?.error)} aria-describedby={formulaResult?.error ? 'formula-status' : 'formula-hint'}
        onChange={(e) => setUi({ formulaInput: e.target.value, formulaResult: null })}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); evaluate() } }}
        placeholder="=AVERAGE(score) or =SUM(score, 1:100)" />
      <datalist id="formula-suggestions">
        {numeric.map((c) => <option key={`sum-${c}`} value={`=SUM(${c})`} />)}
        {numeric.map((c) => <option key={`avg-${c}`} value={`=AVERAGE(${c})`} />)}
        {numeric.map((c) => <option key={`min-${c}`} value={`=MIN(${c})`} />)}
        {numeric.map((c) => <option key={`max-${c}`} value={`=MAX(${c})`} />)}
        {numeric.map((c) => <option key={`cnt-${c}`} value={`=COUNT(${c})`} />)}
        {numeric.map((c) => <option key={`rng-${c}`} value={`=SUM(${c}, 1:100)`} />)}
      </datalist>
      <Btn size="sm" kind="ghost" onClick={() => evaluate()}>Run</Btn>
      <span id="formula-status" className={cx('max-w-[300px] truncate text-xs font-bold', formulaResult?.error ? 'text-[var(--danger)]' : 'mono t-brand')} role={formulaResult?.error ? 'alert' : 'status'} title={formulaResult?.error || ''}>
        {formulaResult ? (formulaResult.error || `= ${Number(formulaResult.value.toFixed?.(4) ?? formulaResult.value).toLocaleString()}`) : ''}
      </span>
      <span id="formula-hint" className="sr-only">Supports SUM, AVERAGE, MIN, MAX, COUNT over a numeric column with an optional row range like 1:100.</span>
    </div>
  )
}

/* ---------------- Toolbar ---------------- */
function Toolbar({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  const pivotMode = useStore((s) => s.pivotMode)
  const unverifiedOnly = useStore((s) => s.unverifiedOnly)
  const history = useStore((s) => s.history)
  const future = useStore((s) => s.future)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const sidebarDesktopOpen = useStore((s) => s.sidebarDesktopOpen)
  const undo = useStore((s) => s.undo), redo = useStore((s) => s.redo)
  const openImport = () => {
    const cur = useStore.getState().importState
    setUi({ importState: cur.step === 'source' && !cur.sourceText ? newImportState(true) : { ...cur, open: true } })
  }
  return (
    <div className="topbar no-print">
      <div id="toolbar-actions" className="flex flex-wrap items-center gap-1 px-3 py-2 sm:px-5" role="toolbar" aria-label="Dataset actions">
        <Btn size="sm" kind="ghost" icon={Menu} aria-label={sidebarOpen || sidebarDesktopOpen ? 'Close sidebar' : 'Open sidebar'} aria-expanded={sidebarOpen || sidebarDesktopOpen} title="Toggle sidebar"
          onClick={() => window.matchMedia('(max-width: 768px)').matches ? setUi({ sidebarOpen: !sidebarOpen }) : setUi({ sidebarDesktopOpen: !sidebarDesktopOpen })} />
        <Btn size="sm" icon={Add} onClick={() => setUi({ modal: { type: 'row', mode: 'add' } })}>Add row</Btn>
        <Btn size="sm" kind="ghost" icon={Upload} onClick={openImport}>Import CSV</Btn>
        <Btn size="sm" kind="ghost" icon={Export} onClick={() => setUi({ panel: 'export', exportGeneratedAt: Date.now() })}>Export package</Btn>
        <span className="divider-v mx-1 hidden sm:block" aria-hidden="true" />
        <Btn size="sm" kind={pivotMode ? 'secondary' : 'ghost'} icon={ChartRelationship} aria-pressed={pivotMode} onClick={() => setUi({ pivotMode: !pivotMode })}>{pivotMode ? 'Grid view' : 'Pivot view'}</Btn>
        <Btn size="sm" kind="ghost" icon={Events} onClick={() => setUi({ panel: 'duplicates' })}>Find duplicates</Btn>
        <Btn size="sm" kind="ghost" icon={Flag} onClick={() => setUi({ panel: 'thresholds' })}>Manage thresholds</Btn>
        <Btn size="sm" kind="ghost" onClick={() => setUi({ panel: 'splits' })}>Assign splits</Btn>
        <Btn size="sm" kind="ghost" icon={Save} onClick={() => setUi({ panel: 'snapshots' })}>Compare snapshots</Btn>
        <span className="divider-v mx-1 hidden sm:block" aria-hidden="true" />
        <Btn size="sm" kind="ghost" icon={Undo} iconOnly aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)" disabled={!history.length} onClick={undo} />
        <Btn size="sm" kind="ghost" icon={Redo} iconOnly aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)" disabled={!future.length} onClick={redo} />
        <span className="flex-1" />
        <Btn size="sm" kind="ghost" icon={settings.theme === 'dark' ? Sun : Moon} iconOnly aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`} title="Theme" onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} />
        <Btn size="sm" kind="ghost" icon={Settings} iconOnly aria-label="Workspace preferences" title="Preferences" onClick={() => setUi({ settingsOpen: true })} />
        <Btn size="sm" kind="ghost" icon={Help} iconOnly aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" onClick={() => setUi({ shortcutsOpen: true })} />
        <Btn id="btn-palette" size="sm" kind="ghost" icon={Search} aria-label="Open command palette (Ctrl+K)" title="Command palette (Ctrl+K)" onClick={() => setUi({ paletteOpen: true })} />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t bd px-4 py-2 sm:px-6" style={{ borderColor: 'var(--border)' }}>
        <FormulaBar />
        <Switch id="unverified-filter" label="Show unverified only" checked={unverifiedOnly} onChange={(checked) => setUi({ unverifiedOnly: checked, selectedRows: [] })} />
      </div>
    </div>
  )
}

/* ---------------- Inline cell editor ---------------- */
function InlineEditor({ row, field, schemaField, onDone }) {
  const inline = useStore((s) => s.inlineEdit)
  const setUi = useStore((s) => s.setUi)
  const updateCell = useStore((s) => s.updateCell)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select?.() }, [])
  const commit = () => {
    let value = inline.value
    let error
    if (field === 'expectedOutput') { if (String(value).length > 4000) error = 'expectedOutput must be at most 4000 characters' }
    else if (schemaField) { error = fieldError(schemaField, value, false); if (!error && schemaField.type === 'number') value = Number(value) }
    if (error) { setUi({ inlineEdit: { ...inline, error } }); return }
    updateCell(row.id, field, value)
    setUi({ inlineEdit: null }); onDone?.()
  }
  const cancel = () => { setUi({ inlineEdit: null }); onDone?.() }
  const errId = `inline-err-${row.id}-${field}`
  const shared = {
    ref, className: 'input !min-h-8 !py-0 !text-xs', value: inline.value, 'aria-label': `Edit ${field}`,
    'aria-invalid': Boolean(inline.error), 'aria-describedby': inline.error ? errId : undefined,
    onChange: (e) => setUi({ inlineEdit: { ...inline, value: e.target.value, error: null } }),
    onKeyDown: (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit() }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel() }
    },
    onBlur: () => { if (useStore.getState().inlineEdit) cancel() },
  }
  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      {schemaField?.type === 'category'
        ? <select {...shared}>{schemaField.allowedValues.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        : <input {...shared} />}
      {inline.error && <span id={errId} className="absolute left-0 top-full z-30 mt-1 block w-72 rounded-md p-2 text-xs font-semibold text-white shadow-lg" style={{ background: 'var(--danger)' }} role="alert">{inline.error}</span>}
    </div>
  )
}

/* ---------------- Virtualized grid ---------------- */
function VirtualGrid({ dataset, visibleRows }) {
  const parentRef = useRef(null)
  const setUi = useStore((s) => s.setUi)
  const inline = useStore((s) => s.inlineEdit)
  const selectedRows = useStore((s) => s.selectedRows)
  const toggleSelected = useStore((s) => s.toggleSelected)
  const selectAll = useStore((s) => s.selectAll)
  const updateCell = useStore((s) => s.updateCell)
  const recentRows = useStore((s) => s.recentRows)
  const sort = useStore((s) => s.sort)
  const settings = useStore((s) => s.settings)
  const virtualizer = useVirtualizer({ count: visibleRows.length, getScrollElement: () => parentRef.current, estimateSize: () => settings.density === 'compact' ? 32 : 42, overscan: 50 })
  useEffect(() => {
    if (recentRows.ids.length && visibleRows.some((r) => recentRows.ids.includes(r.id))) virtualizer.scrollToIndex(visibleRows.length - 1, { align: 'end' })
  }, [recentRows.ids]) // eslint-disable-line react-hooks/exhaustive-deps
  const schemaCols = dataset.schema.filter((f) => !settings.hiddenColumns.includes(f.name))
  const template = `46px 34px ${schemaCols.map((f) => (f.type === 'text' ? '280px' : f.type === 'number' ? '110px' : '150px')).join(' ')} 240px 104px 116px 96px`
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedRows.includes(r.id))
  const openEditor = (row, field) => {
    const value = field === 'expectedOutput' ? row.expectedOutput : row.values[field]
    setUi({ inlineEdit: { rowId: row.id, field, value, error: null } })
  }
  const cycleSort = (field) => {
    const next = sort.field !== field ? { field, dir: 'asc' } : sort.dir === 'asc' ? { field, dir: 'desc' } : { field: null, dir: null }
    setUi({ sort: next })
  }
  const SortHeader = ({ field, label, numeric }) => (
    <button type="button" className="sort-btn" onClick={() => cycleSort(field)} aria-label={`Sort by ${label}`}
      aria-sort={sort.field === field ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      title={`Sort by ${label}`}>
      {label}{sort.field === field ? (sort.dir === 'asc' ? <CaretUp size={11} /> : <CaretDown size={11} />) : <CaretSort size={11} className="opacity-40" />}
    </button>
  )
  if (!dataset.rows.length) {
    return <EmptyState icon={FolderOpen} title={`${dataset.name} has no rows`} body="Add a row manually or import a CSV batch to get started."
      actions={<><Btn size="sm" icon={Add} onClick={() => setUi({ modal: { type: 'row', mode: 'add' } })}>Add row</Btn><Btn size="sm" kind="outline" icon={Upload} onClick={() => setUi({ importState: newImportState(true) })}>Import CSV</Btn></>} />
  }
  if (!visibleRows.length) {
    return <EmptyState icon={Search} title="All rows are verified" body="The unverified-only filter has no matching rows right now."
      actions={<Btn size="sm" kind="outline" onClick={() => setUi({ unverifiedOnly: false })}>Clear filter</Btn>} />
  }
  return (
    <div ref={parentRef} className="grid-scroll" role="grid" aria-label={`${dataset.name} rows`} aria-rowcount={visibleRows.length}
      style={{ paddingBottom: selectedRows.length ? 148 : 0 }}>
      <div style={{ height: virtualizer.getTotalSize() + 42, minWidth: `calc(${schemaCols.length * 150 + 726}px)` }}>
        <div className="grid-head grid h-[42px] w-max text-xs" style={{ gridTemplateColumns: template, minWidth: '100%' }} role="row">
          <div className="cell cell-head"><Chk label="Select all visible rows" hideLabel checked={allVisibleSelected} indeterminate={selectedRows.length > 0 && !allVisibleSelected} onChange={(checked) => selectAll(visibleRows.map((r) => r.id), checked)} /></div>
          <div className="cell cell-head" aria-label="Flagged status"><Flag size={13} /></div>
          {schemaCols.map((field) => (
            <div key={field.name} className={cx('cell cell-head', field.type === 'number' && 'cell-num')}>
              <SortHeader field={field.name} label={field.name} numeric={field.type === 'number'} />
              <span className="text-[9px] font-semibold normal-case t-3">{field.type}</span>
            </div>
          ))}
          <div className="cell cell-head">Expected output</div>
          <div className="cell cell-head">Verified</div>
          <div className="cell cell-head">Split</div>
          <div className="cell cell-head">Actions</div>
        </div>
        {virtualizer.getVirtualItems().map((v) => {
          const row = visibleRows[v.index]
          const flagged = flaggedFields(row, dataset)
          const recentIndex = recentRows.ids.indexOf(row.id)
          const animClass = recentIndex >= 0 ? (recentRows.type === 'import' ? 'animate-row-batch' : 'animate-row-add') : ''
          return (
            <div key={row.id} className={cx('data-row grid', animClass, selectedRows.includes(row.id) && 'row-selected')}
              style={{ gridTemplateColumns: template, transform: `translateY(${v.start + 42}px)`, animationDelay: recentRows.type === 'import' && recentIndex >= 0 ? `${Math.floor(recentIndex / 10) * 100}ms` : undefined }}
              role="row" aria-rowindex={v.index + 2} aria-selected={selectedRows.includes(row.id)}>
              <div className="cell"><Chk label={`Select row ${v.index + 1}`} hideLabel checked={selectedRows.includes(row.id)} onChange={() => toggleSelected(row.id)} /></div>
              <div className="cell justify-center">{flagged.length ? <Flag size={15} style={{ color: 'var(--warn)' }} aria-label="Row flagged by threshold rule" /> : null}</div>
              {schemaCols.map((field) => (
                <div key={field.name} tabIndex={0}
                  className={cx('cell relative', field.type === 'number' && 'cell-num', flagged.includes(field.name) && 'flagged-cell')}
                  title={String(row.values[field.name])}
                  onDoubleClick={(e) => { e.stopPropagation(); openEditor(row, field.name) }}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === 'F2') && e.target === e.currentTarget) { e.preventDefault(); openEditor(row, field.name) } }}
                  role="gridcell" aria-label={`${field.name}: ${row.values[field.name]}${flagged.includes(field.name) ? ' (flagged)' : ''}`}>
                  {inline?.rowId === row.id && inline?.field === field.name
                    ? <InlineEditor row={row} field={field.name} schemaField={field} />
                    : <span className="cell-text">{String(row.values[field.name])}</span>}
                </div>
              ))}
              <div tabIndex={0} className="cell relative" title={row.expectedOutput} onDoubleClick={(e) => { e.stopPropagation(); openEditor(row, 'expectedOutput') }}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === 'F2') && e.target === e.currentTarget) { e.preventDefault(); openEditor(row, 'expectedOutput') } }}
                role="gridcell" aria-label={`Expected output: ${row.expectedOutput}`}>
                {inline?.rowId === row.id && inline?.field === 'expectedOutput' ? <InlineEditor row={row} field="expectedOutput" /> : <span className="cell-text">{row.expectedOutput}</span>}
              </div>
              <div className="cell" role="gridcell">
                <button type="button" className="flex min-h-9 items-center gap-1.5 rounded px-1.5 text-xs font-bold transition hover:bg-[var(--surface-3)]"
                  onClick={() => updateCell(row.id, 'verified', !row.verified)}
                  aria-label={`${row.verified ? 'Mark unverified' : 'Mark verified'} row ${v.index + 1}`} aria-pressed={row.verified}>
                  {row.verified
                    ? <><Checkmark key="on" size={15} className="animate-tick" style={{ color: 'var(--ok)' }} />Yes</>
                    : <><span aria-hidden="true" className="grid w-[15px] place-items-center t-3">—</span>No</>}
                </button>
              </div>
              <div className="cell" role="gridcell">
                <Tag tone={row.split === 'train' ? 'blue' : row.split === 'validation' ? 'violet' : row.split === 'test' ? 'green' : 'gray'}>{row.split || '—'}</Tag>
              </div>
              <div className="cell gap-1" role="gridcell">
                <Btn kind="ghost" size="sm" icon={Edit} iconOnly aria-label={`Edit row ${v.index + 1}`} onClick={() => setUi({ modal: { type: 'row', mode: 'edit', rowId: row.id } })} />
                <Btn kind="danger-ghost" size="sm" icon={TrashCan} iconOnly aria-label={`Delete row ${v.index + 1}`} onClick={() => setUi({ modal: { type: 'delete', ids: [row.id] } })} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Pivot view ---------------- */
function PivotView({ dataset, rows }) {
  const pivot = useStore((s) => s.pivot)
  const setUi = useStore((s) => s.setUi)
  const [dragOver, setDragOver] = useState(null)
  const setBucket = (bucket, field) => {
    if (!field || !dataset.schema.some((f) => f.name === field)) return
    const next = structuredClone(pivot)
    if (bucket === 'value') next.value = field
    else if (!next[bucket].includes(field)) next[bucket].push(field)
    setUi({ pivot: next })
  }
  const remove = (bucket, field) => { const next = structuredClone(pivot); if (bucket === 'value') next.value = null; else next[bucket] = next[bucket].filter((v) => v !== field); setUi({ pivot: next }) }
  const summary = useMemo(() => {
    if (!pivot.rows.length) return []
    const groups = new Map()
    rows.forEach((row) => {
      const key = pivot.rows.map((f) => row.values[f]).join(' → ')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(row)
    })
    return [...groups].map(([key, group]) => {
      const nums = pivot.value ? group.map((r) => r.values[pivot.value]).filter(Number.isFinite) : []
      let value = group.length
      if (pivot.aggregation === 'sum') value = nums.reduce((a, b) => a + b, 0)
      if (pivot.aggregation === 'average') value = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      return { key, value, count: group.length }
    })
  }, [rows, pivot])
  const bucket = (label, key, hint) => (
    <div className={cx('pivot-bucket', dragOver === key && 'drag-over')}
      onDragOver={(e) => { e.preventDefault(); setDragOver(key) }} onDragLeave={() => setDragOver(null)}
      onDrop={(e) => { e.preventDefault(); setDragOver(null); setBucket(key, e.dataTransfer.getData('field')) }}>
      <div className="mb-1 text-xs font-bold uppercase tracking-wide t-3">{label}</div>
      <div className="flex min-h-8 flex-wrap gap-2">
        {(key === 'value' ? (pivot.value ? [pivot.value] : []) : pivot[key]).map((f) => (
          <span key={f} className="tag tag-blue !text-xs">{f}
            <button type="button" className="rounded-full p-0.5 transition hover:bg-black/10" aria-label={`Remove ${f} from ${label}`} onClick={() => remove(key, f)}><Close size={10} /></button>
          </span>
        ))}
      </div>
      <p className="mt-1 text-[11px] t-3">{hint}</p>
    </div>
  )
  return (
    <div className="p-4 sm:p-6">
      <div className="card rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold t-primary">Pivot builder</h3>
            <p className="text-sm t-2">Drag schema fields into buckets (or click a chip to add it to Rows). Summaries recompute from live rows immediately.</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold t-2">Aggregation
            <select className="input !min-h-8 !w-auto !py-1 !text-xs" value={pivot.aggregation} aria-label="Pivot aggregation" onChange={(e) => setUi({ pivot: { ...pivot, aggregation: e.target.value } })}>
              <option>count</option><option>sum</option><option>average</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Schema field chips">
          {dataset.schema.map((f) => (
            <button key={f.name} type="button" draggable className="pivot-chip"
              onDragStart={(e) => e.dataTransfer.setData('field', f.name)}
              onClick={() => setBucket('rows', f.name)}
              title={`Drag into a bucket, or click to add ${f.name} to Rows`}>
              {f.name} · {f.type}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {bucket('Rows', 'rows', 'Group summaries by these fields (two chips nest).')}
          {bucket('Columns', 'columns', 'Secondary facet recorded with the layout.')}
          {bucket('Values', 'value', 'Numeric field aggregated by the selected function.')}
        </div>
        <div className="mt-5 overflow-auto rounded-lg hairline">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="surface-3"><tr><th className="p-3 text-left text-xs font-bold uppercase t-2">{pivot.rows.join(' → ') || 'Group'}</th><th className="p-3 text-right text-xs font-bold uppercase t-2">{pivot.aggregation}{pivot.value ? `(${pivot.value})` : ''}</th><th className="p-3 text-right text-xs font-bold uppercase t-2">Rows</th></tr></thead>
            <tbody>
              {summary.length ? summary.map((r, i) => (
                <tr key={r.key} className="reveal-item border-t bd transition hover:bg-[var(--surface-2)]" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                  <td className="p-3 t-primary">{r.key}</td>
                  <td className="mono p-3 text-right t-brand font-bold">{Number(r.value.toFixed?.(3) ?? r.value).toLocaleString()}</td>
                  <td className="mono p-3 text-right t-2">{r.count}</td>
                </tr>
              )) : <tr><td colSpan={3} className="p-8 text-center t-3">Drop at least one field into Rows to build the pivot.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bulk tray ---------------- */
function BulkTray() {
  const selectedRows = useStore((s) => s.selectedRows)
  const bulk = useStore((s) => s.bulk)
  const setUi = useStore((s) => s.setUi)
  const [split, setSplit] = useState('train')
  if (!selectedRows.length) return null
  return (
    <div className="bulk-zone no-print">
      <div className="bulk-tray" role="toolbar" aria-label="Bulk actions">
        <span className="whitespace-nowrap px-2 text-sm font-bold">{selectedRows.length} selected</span>
        <Btn size="sm" kind="ghost" icon={Checkmark} onClick={() => bulk('verified', true)}>Mark verified</Btn>
        <Btn size="sm" kind="ghost" onClick={() => bulk('verified', false)}>Mark unverified</Btn>
        <label className="sr-only" htmlFor="bulk-split">Bulk split assignment</label>
        <select id="bulk-split" className="input !min-h-8 !w-auto !py-1 !text-xs" style={{ background: 'var(--sidebar-2)', color: '#fff', borderColor: 'var(--sidebar-3)' }} value={split} onChange={(e) => setSplit(e.target.value)}>
          <option>train</option><option>validation</option><option>test</option>
        </select>
        <Btn size="sm" kind="ghost" onClick={() => bulk('split', split)}>Assign split</Btn>
        <Btn size="sm" kind="danger" icon={TrashCan} onClick={() => setUi({ modal: { type: 'delete', ids: selectedRows } })}>Delete</Btn>
        <Btn size="sm" kind="ghost" icon={Close} iconOnly aria-label="Clear selection" onClick={() => setUi({ selectedRows: [] })} />
      </div>
    </div>
  )
}

/* ---------------- Command palette ---------------- */
const PALETTE_ACTIONS = [
  { id: 'add-row', label: 'Add row', hint: 'A', icon: Add },
  { id: 'import-csv', label: 'Import CSV…', hint: 'I', icon: Upload },
  { id: 'export', label: 'Export dataset package…', hint: 'E', icon: Export },
  { id: 'new-dataset', label: 'New dataset…', icon: DataBase },
  { id: 'pivot', label: 'Toggle pivot view', hint: 'P', icon: ChartRelationship },
  { id: 'duplicates', label: 'Open duplicate detection', icon: Events },
  { id: 'thresholds', label: 'Open threshold alerts', icon: Flag },
  { id: 'splits', label: 'Open split management', icon: ChartRelationship },
  { id: 'snapshots', label: 'Open snapshots & diff', icon: Save },
  { id: 'unverified', label: 'Toggle Show unverified only', hint: 'U', icon: Search },
  { id: 'undo', label: 'Undo last change', hint: 'Ctrl+Z', icon: Undo },
  { id: 'redo', label: 'Redo', hint: 'Ctrl+Shift+Z', icon: Redo },
  { id: 'theme', label: 'Toggle light / dark theme', icon: Moon },
  { id: 'density', label: 'Toggle grid density', icon: Settings },
  { id: 'tour', label: 'Restart guided tour', icon: Information },
  { id: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', icon: Help },
]

function runPaletteAction(id) {
  const s = useStore.getState()
  const close = { paletteOpen: false }
  if (id === 'add-row') s.setUi({ ...close, modal: { type: 'row', mode: 'add' } })
  else if (id === 'import-csv') { const cur = s.importState; s.setUi({ ...close, importState: cur.step === 'source' && !cur.sourceText ? newImportState(true) : { ...cur, open: true } }) }
  else if (id === 'export') s.setUi({ ...close, panel: 'export', exportGeneratedAt: Date.now() })
  else if (id === 'new-dataset') s.setUi({ ...close, modal: { type: 'dataset' } })
  else if (id === 'pivot') s.setUi({ ...close, pivotMode: !s.pivotMode })
  else if (id === 'duplicates' || id === 'thresholds' || id === 'splits' || id === 'snapshots') s.setUi({ ...close, panel: id })
  else if (id === 'unverified') s.setUi({ ...close, unverifiedOnly: !s.unverifiedOnly, selectedRows: [] })
  else if (id === 'undo') { s.undo(); s.setUi(close) }
  else if (id === 'redo') { s.redo(); s.setUi(close) }
  else if (id === 'theme') { s.setSettings({ theme: s.settings.theme === 'dark' ? 'light' : 'dark' }); s.setUi(close) }
  else if (id === 'density') { s.setSettings({ density: s.settings.density === 'compact' ? 'comfortable' : 'compact' }); s.setUi(close) }
  else if (id === 'tour') s.setUi({ ...close, tour: { active: true, step: 0, seen: true } })
  else if (id === 'shortcuts') s.setUi({ ...close, shortcutsOpen: true })
}

function CommandPalette() {
  const setUi = useStore((s) => s.setUi)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  useOverlayBehavior(ref, () => setUi({ paletteOpen: false }))
  const items = PALETTE_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
  const run = (id) => runPaletteAction(id)
  return (
    <div className="modal-overlay no-print" style={{ alignItems: 'start', paddingTop: '12vh' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setUi({ paletteOpen: false }) }}>
      <section ref={ref} tabIndex={-1} className="modal-card !w-[min(520px,100%)]" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-2 border-b bd px-4 py-3">
          <Search size={16} className="t-3" aria-hidden="true" />
          <input autoFocus className="input !border-0 !bg-transparent !shadow-none !min-h-8 !px-1" placeholder="Type a command…" value={query} aria-label="Command palette search"
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
              else if (e.key === 'Enter' && items[active]) { e.preventDefault(); run(items[active].id) }
            }} />
          <kbd>Esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-auto p-2" role="listbox" aria-label="Commands">
          {items.map((a, i) => (
            <button key={a.id} type="button" role="option" aria-selected={i === active} className={cx('palette-item', i === active && 'active')} onMouseEnter={() => setActive(i)} onClick={() => run(a.id)}>
              <a.icon size={15} className="t-3" aria-hidden="true" /><span className="flex-1">{a.label}</span>{a.hint && <kbd>{a.hint}</kbd>}
            </button>
          ))}
          {!items.length && <p className="p-4 text-center text-sm t-3">No matching commands.</p>}
        </div>
      </section>
    </div>
  )
}

/* ---------------- Shortcuts overlay ---------------- */
const SHORTCUTS = [
  ['Ctrl + Z', 'Undo the last change'], ['Ctrl + Shift + Z', 'Redo'], ['Ctrl + K', 'Command palette'],
  ['?', 'This shortcut list'], ['Enter', 'Edit the focused grid cell in place'], ['F2', 'Edit the focused grid cell'],
  ['Esc', 'Cancel inline edit / close the top overlay'], ['Double-click', 'Open the inline cell editor'],
]
function ShortcutsOverlay() {
  const setUi = useStore((s) => s.setUi)
  const ref = useRef(null)
  useOverlayBehavior(ref, () => setUi({ shortcutsOpen: false }))
  return (
    <div className="modal-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) setUi({ shortcutsOpen: false }) }}>
      <section ref={ref} tabIndex={-1} className="modal-card !w-[min(460px,100%)]" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <header className="flex items-center justify-between border-b bd px-5 py-4"><h2 className="text-lg font-bold t-primary">Keyboard shortcuts</h2><Btn kind="ghost" size="sm" icon={Close} iconOnly aria-label="Close shortcuts" onClick={() => setUi({ shortcutsOpen: false })} /></header>
        <div className="space-y-2 p-5">
          {SHORTCUTS.map(([keys, what]) => <div key={keys} className="flex items-center justify-between gap-3 text-sm"><span className="t-2">{what}</span><kbd>{keys}</kbd></div>)}
        </div>
      </section>
    </div>
  )
}

/* ---------------- Preferences popover ---------------- */
function PreferencesModal({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const ref = useRef(null)
  useOverlayBehavior(ref, () => setUi({ settingsOpen: false }))
  const toggleColumn = (name) => setSettings({ hiddenColumns: settings.hiddenColumns.includes(name) ? settings.hiddenColumns.filter((c) => c !== name) : [...settings.hiddenColumns, name] })
  return (
    <div className="modal-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) setUi({ settingsOpen: false }) }}>
      <section ref={ref} tabIndex={-1} className="modal-card !w-[min(440px,100%)]" role="dialog" aria-modal="true" aria-label="Workspace preferences">
        <header className="flex items-center justify-between border-b bd px-5 py-4"><h2 className="text-lg font-bold t-primary">Workspace preferences</h2><Btn kind="ghost" size="sm" icon={Close} iconOnly aria-label="Close preferences" onClick={() => setUi({ settingsOpen: false })} /></header>
        <div className="space-y-6 p-5">
          <fieldset>
            <legend className="field-label">Theme</legend>
            <div className="grid grid-cols-2 gap-2">
              {[['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([value, label, Icon]) => (
                <button key={value} type="button" className={cx('btn btn-outline justify-start', settings.theme === value && 'border-[var(--brand)] bg-[var(--brand-soft)] t-brand')} aria-pressed={settings.theme === value} onClick={() => setSettings({ theme: value })}><Icon size={15} />{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Grid density</legend>
            <div className="grid grid-cols-2 gap-2">
              {[['comfortable', 'Comfortable · 42px rows'], ['compact', 'Compact · 32px rows']].map(([value, label]) => (
                <button key={value} type="button" className={cx('btn btn-outline justify-start !whitespace-normal !text-left', settings.density === value && 'border-[var(--brand)] bg-[var(--brand-soft)] t-brand')} aria-pressed={settings.density === value} onClick={() => setSettings({ density: value })}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Visible columns — {dataset.name}</legend>
            <div className="space-y-2">
              {dataset.schema.map((f) => (
                <Chk key={f.name} label={`${f.name} (${f.type})`} checked={!settings.hiddenColumns.includes(f.name)} onChange={() => toggleColumn(f.name)} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Motion</legend>
            <Switch id="reduce-motion-setting" label="Reduce animations" checked={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
          </fieldset>
        </div>
      </section>
    </div>
  )
}

/* ---------------- Guided tour ---------------- */
const TOUR_STEPS = [
  { target: '#sidebar-nav', title: 'Dataset collection', body: 'Switch between seeded datasets here. Each entry shows a live row count, and the capacity gauge below tracks the whole workspace.' },
  { target: '#main-grid-region', title: 'The data grid', body: 'Virtualized rows with one column per schema field plus expected output, verified, and split. Double-click or press Enter on a focused cell to edit it in place.' },
  { target: '#toolbar-actions', title: 'Operations toolbar', body: 'Import CSV, Export the live package, build pivots, and open the duplicates, thresholds, splits, and snapshots panels.' },
  { target: '#fx-bar', title: 'Formula bar', body: 'Evaluate =SUM, =AVERAGE, =MIN, =MAX, =COUNT over a numeric column. Results recompute live as cells change.' },
  { target: '#btn-palette', title: 'Command palette', body: 'Press Ctrl+K any time for quick access to every action, plus theme and density preferences.' },
]
function Tour() {
  const tour = useStore((s) => s.tour)
  const setUi = useStore((s) => s.setUi)
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!tour.active) return
    const measure = () => {
      const el = document.querySelector(TOUR_STEPS[tour.step]?.target)
      if (el) { const r = el.getBoundingClientRect(); setRect({ top: Math.max(4, r.top - 6), left: Math.max(4, r.left - 6), width: Math.min(r.width + 12, window.innerWidth - 8), height: r.height + 12 }) }
      else setRect(null)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [tour.active, tour.step])
  if (!tour.active) return null
  const step = TOUR_STEPS[tour.step]
  const finish = () => setUi({ tour: { active: false, step: 0, seen: true } })
  return (
    <div className="no-print" aria-live="polite">
      {rect && <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true" />}
      <div className="tour-card" style={{ right: 14, bottom: 14 }} role="dialog" aria-label={`Tour step ${tour.step + 1} of ${TOUR_STEPS.length}: ${step.title}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="tag tag-blue">Tour {tour.step + 1}/{TOUR_STEPS.length}</span>
          <button type="button" className="t-3 transition hover:text-[var(--text)]" aria-label="Dismiss tour" onClick={finish}><Close size={14} /></button>
        </div>
        <h3 className="mt-2 text-sm font-bold t-primary">{step.title}</h3>
        <p className="mt-1 text-xs leading-5 t-2">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" className="text-xs font-bold t-3 transition hover:text-[var(--text)]" onClick={finish}>Skip tour</button>
          <div className="flex gap-2">
            {tour.step > 0 && <Btn size="sm" kind="secondary" onClick={() => setUi({ tour: { ...tour, step: tour.step - 1 } })}>Back</Btn>}
            <Btn size="sm" onClick={() => (tour.step === TOUR_STEPS.length - 1 ? finish() : setUi({ tour: { ...tour, step: tour.step + 1 } }))}>{tour.step === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Routers ---------------- */
function PanelRouter({ dataset }) {
  const panel = useStore((s) => s.panel)
  if (panel === 'thresholds') return <ThresholdPanel dataset={dataset} />
  if (panel === 'splits') return <SplitPanel dataset={dataset} />
  if (panel === 'snapshots') return <SnapshotPanel dataset={dataset} />
  if (panel === 'duplicates') return <DuplicatePanel dataset={dataset} />
  if (panel === 'export') return <ExportDrawer dataset={dataset} />
  return null
}

function ModalRouter({ dataset }) {
  const modal = useStore((s) => s.modal)
  if (!modal) return null
  if (modal.type === 'dataset') return <DatasetDialog />
  if (modal.type === 'row') return <RowDialog dataset={dataset} mode={modal.mode} rowId={modal.rowId} />
  if (modal.type === 'delete') return <ConfirmDialog title={`Delete ${modal.ids.length} row${modal.ids.length === 1 ? '' : 's'}?`} detail="Rows are removed from the grid and every derived surface." onConfirm={() => { useStore.getState().deleteRows(modal.ids); useStore.getState().setUi({ modal: null }) }} />
  if (modal.type === 'attach') return <AttachDialog dataset={dataset} />
  if (modal.type === 'merge') return <MergeDialog dataset={dataset} group={modal.group} />
  return null
}

/* ---------------- App ---------------- */
export default function App() {
  const datasets = useStore((s) => s.datasets)
  const selectedId = useStore((s) => s.selectedId)
  const unverifiedOnly = useStore((s) => s.unverifiedOnly)
  const pivotMode = useStore((s) => s.pivotMode)
  const toast = useStore((s) => s.toast)
  const liveMessage = useStore((s) => s.liveMessage)
  const setUi = useStore((s) => s.setUi)
  const settings = useStore((s) => s.settings)
  const sort = useStore((s) => s.sort)
  const paletteOpen = useStore((s) => s.paletteOpen)
  const shortcutsOpen = useStore((s) => s.shortcutsOpen)
  const settingsOpen = useStore((s) => s.settingsOpen)
  const sidebarDesktopOpen = useStore((s) => s.sidebarDesktopOpen)
  const undo = useStore((s) => s.undo), redo = useStore((s) => s.redo)
  const dataset = datasets.find((d) => d.id === selectedId) || datasets[0]
  const stats = useMemo(() => computeStats(dataset), [dataset])
  const visibleRows = useMemo(() => {
    const filtered = unverifiedOnly ? dataset.rows.filter((r) => !r.verified) : dataset.rows
    if (!sort.field) return filtered
    const dir = sort.dir === 'asc' ? 1 : -1
    const field = sort.field
    return [...filtered].sort((a, b) => {
      const av = field === 'expectedOutput' ? a.expectedOutput : a.values?.[field]
      const bv = field === 'expectedOutput' ? b.expectedOutput : b.values?.[field]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [dataset.rows, unverifiedOnly, sort])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
  }, [settings.theme, settings.reduceMotion])

  useEffect(() => {
    const t = setTimeout(() => { if (!useStore.getState().tour.seen) setUi({ tour: { active: true, step: 0, seen: true } }) }, 900)
    return () => clearTimeout(t)
  }, [setUi])

  useEffect(() => {
    const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !isTyping(e.target)) { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setUi({ paletteOpen: !useStore.getState().paletteOpen }) }
      else if (e.key === '?' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setUi({ shortcutsOpen: !useStore.getState().shortcutsOpen }) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, setUi])

  return (
    <div className={cx('app-shell', !sidebarDesktopOpen && 'sidebar-closed')}>
      <Sidebar />
      <main className="main-area">
        <DatasetHeader dataset={dataset} stats={stats} />
        <Toolbar dataset={dataset} />
        {pivotMode
          ? <PivotView dataset={dataset} rows={visibleRows} />
          : (
            <div id="main-grid-region" className={cx('m-0 border-b bd sm:m-4 sm:rounded-xl sm:border sm:shadow-sm', settings.density === 'compact' && 'density-compact')} style={{ borderColor: 'var(--border)' }}>
              <VirtualGrid dataset={dataset} visibleRows={visibleRows} />
            </div>
          )}
      </main>
      <BulkTray />
      <PanelRouter dataset={dataset} />
      <ModalRouter dataset={dataset} />
      <ImportWizard dataset={dataset} />
      {paletteOpen && <CommandPalette />}
      {shortcutsOpen && <ShortcutsOverlay />}
      {settingsOpen && <PreferencesModal dataset={dataset} />}
      <Tour />
      <div className="toast-region no-print" aria-live="polite">
        {toast && (
          <div className={cx('toast', toast.kind === 'info' && 'toast-info', toast.kind === 'error' && 'toast-error', toast.leaving && 'toast-out')} role="status">
            {toast.kind === 'error' ? <Close size={16} style={{ color: 'var(--danger)', flex: 'none', marginTop: 1 }} /> : <Checkmark size={16} style={{ color: 'var(--ok)', flex: 'none', marginTop: 1 }} />}
            <span className="flex-1 font-semibold">{toast.message}</span>
            <button type="button" className="t-3 transition hover:text-[var(--text)]" aria-label="Dismiss notification" onClick={() => setUi({ toast: null })}><Close size={13} /></button>
          </div>
        )}
      </div>
      <div className="sr-only" aria-live="assertive">{liveMessage}</div>
      <div className="sr-only" aria-live="assertive">{toast?.message}</div>
      <PrintSheet dataset={dataset} />
    </div>
  )
}

function PrintSheet({ dataset }) {
  const exportTab = useStore((s) => s.exportTab)
  const panel = useStore((s) => s.panel)
  const output = useMemo(() => { const s = useStore.getState(); return s.getExport() }, [dataset, exportTab, panel]) // eslint-disable-line react-hooks/exhaustive-deps
  const text = exportTab === 'csv' ? output.csv : output.json
  return (
    <div id="print-sheet">
      <h1>Dataset Workbench — {dataset.name}</h1>
      <h2>{exportTab === 'csv' ? 'Rows CSV export' : 'Dataset Package JSON export'} (schemaVersion dataset-manager.package/v1)</h2>
      <pre>{text}</pre>
    </div>
  )
}
