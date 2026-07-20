import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, InlineNotification, Tag, Toggle } from '@carbon/react'
import {
  Add, ArrowLeft, ArrowRight, ChartRelationship, Checkmark, Close, DataBase,
  DocumentExport, Edit, Flag, FolderOpen, Menu, Reset, Save, Search, TrashCan,
  Upload, UserMultiple, WarningAlt, WatsonHealthStackedScrolling_1,
} from '@carbon/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { computeStats, fieldError, flaggedFields } from './domain'
import { evalSuites, newImportState, useStore } from './store'
import { AttachDialog, ConfirmDialog, DatasetDialog, MergeDialog, RowDialog } from './components/Dialogs'
import { DuplicatePanel, ExportDrawer, SnapshotPanel, SplitPanel, ThresholdPanel } from './components/Panels'
import { ImportWizard } from './components/ImportWizard'

const cx = (...parts) => parts.filter(Boolean).join(' ')

function Sidebar({ dataset }) {
  const datasets = useStore((s) => s.datasets)
  const selectedId = useStore((s) => s.selectedId)
  const open = useStore((s) => s.sidebarOpen)
  const selectDataset = useStore((s) => s.selectDataset)
  const setUi = useStore((s) => s.setUi)
  const totalRows = datasets.reduce((n, d) => n + d.rows.length, 0)
  const estimatedKb = Math.round(totalRows * 1.8)
  const capacity = 5000
  return <>
    {open && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={() => setUi({ sidebarOpen: false })} />}
    <aside className={cx('sidebar', open && 'open')} aria-label="Datasets sidebar">
      <div className="border-b border-slate-700 p-5">
        <div className="flex items-center gap-3"><DataBase size={24} className="text-blue-300"/><div><h1 className="text-xl font-semibold tracking-tight">Dataset Workbench</h1><p className="mt-1 text-xs text-slate-300">Evaluation data operations</p></div></div>
        <Button className="mt-5 w-full" size="sm" renderIcon={Add} onClick={() => setUi({ modal: { type: 'dataset' } })}>New dataset</Button>
      </div>
      <nav className="py-3" aria-label="Dataset collection">
        <div className="mb-2 px-5 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">Datasets · {datasets.length}</div>
        {datasets.map((d) => <button key={d.id} className={cx('sidebar-entry px-5 py-3', d.id === selectedId && 'selected')} onClick={() => selectDataset(d.id)} aria-current={d.id === selectedId ? 'page' : undefined}>
          <span className="block truncate text-sm font-semibold">{d.name}</span>
          <span className="mt-1 flex items-center justify-between text-xs text-slate-300"><span>{d.rows.length.toLocaleString()} rows</span><span>{new Date(d.createdAt).toLocaleDateString()}</span></span>
        </button>)}
      </nav>
      <section className="mx-4 mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4" aria-labelledby="capacity-title">
        <div className="flex items-center justify-between"><h2 id="capacity-title" className="text-sm font-semibold">Workspace capacity</h2><span className="text-xs text-slate-300">{totalRows.toLocaleString()} / {capacity.toLocaleString()}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700"><div className="capacity-fill h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, totalRows / capacity * 100)}%` }}/></div>
        <p className="mt-2 text-xs text-slate-300">~{estimatedKb.toLocaleString()} KB of 9 MB mock capacity</p>
        <div className="mt-4 space-y-2 border-t border-slate-700 pt-3">
          {datasets.map((d) => <div key={d.id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate text-slate-300">{d.name}</span><span className="shrink-0">{d.rows.length} · ~{Math.round(d.rows.length * 1.8)} KB</span></div>)}
        </div>
      </section>
      <p className="px-5 py-5 text-[11px] leading-4 text-slate-400">In-memory session · reload restores seeded state</p>
    </aside>
  </>
}

function DatasetHeader({ dataset, stats }) {
  const setUi = useStore((s) => s.setUi)
  const attachSuite = useStore((s) => s.attachSuite)
  const suite = evalSuites.find((s) => s.id === dataset.attachedSuiteId)
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-white px-4 py-4 sm:px-6">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold text-slate-950">{dataset.name}</h2><Tag type="blue">{dataset.rows.length.toLocaleString()} rows</Tag><Tag type="green">{stats.verifiedCount} verified</Tag>{stats.flaggedCount > 0 && <Tag type="warm-gray" renderIcon={Flag}>{stats.flaggedCount} flagged</Tag>}</div>
      <p className="mt-1 max-w-3xl text-sm text-muted">{dataset.description || 'No description provided.'}</p>
      {suite && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900"><UserMultiple size={14}/>{suite.name}<button aria-label={`Detach ${suite.name}`} onClick={() => attachSuite(null)}><Close size={14}/></button></div>}
    </div>
    <Button size="sm" kind="tertiary" renderIcon={UserMultiple} onClick={() => setUi({ modal: { type: 'attach' } })}>Use in eval suite</Button>
  </div>
}

function FormulaBar({ dataset }) {
  const formulaInput = useStore((s) => s.formulaInput)
  const formulaResult = useStore((s) => s.formulaResult)
  const setUi = useStore((s) => s.setUi)
  const evaluate = useStore((s) => s.evaluateFormula)
  useEffect(() => { if (formulaInput) evaluate(formulaInput) }, [dataset.rows, formulaInput, evaluate])
  return <div className="flex min-w-[350px] flex-1 items-center gap-2">
    <label htmlFor="formula" className="shrink-0 text-xs font-semibold text-slate-600">ƒx</label>
    <input id="formula" aria-invalid={Boolean(formulaResult?.error)} className="h-8 min-w-0 flex-1 border border-slate-300 bg-slate-50 px-3 font-mono text-xs focus:border-blue-600" value={formulaInput} onChange={(e) => setUi({ formulaInput: e.target.value, formulaResult: null })} onKeyDown={(e) => { if (e.key === 'Enter') evaluate() }} placeholder="=AVERAGE(score)" />
    <Button size="sm" kind="ghost" onClick={() => evaluate()}>Run</Button>
    {formulaResult && <span className={cx('max-w-[280px] text-xs', formulaResult.error ? 'text-red-600' : 'font-mono font-semibold text-blue-700')} role={formulaResult.error ? 'alert' : 'status'}>{formulaResult.error || Number(formulaResult.value.toFixed?.(4) ?? formulaResult.value).toLocaleString()}</span>}
  </div>
}

function Toolbar({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  const pivotMode = useStore((s) => s.pivotMode)
  const unverifiedOnly = useStore((s) => s.unverifiedOnly)
  const history = useStore((s) => s.history)
  const future = useStore((s) => s.future)
  const undo = useStore((s) => s.undo), redo = useStore((s) => s.redo)
  return <div className="topbar">
    <div className="toolbar-scroll flex items-center gap-1 px-3 py-2 sm:px-5">
      <Button size="sm" kind="primary" renderIcon={Add} onClick={() => setUi({ modal: { type: 'row', mode: 'add' } })}>Add row</Button>
      <Button size="sm" kind="ghost" renderIcon={Upload} onClick={() => setUi({ importState: newImportState(true) })}>Import CSV</Button>
      <Button size="sm" kind="ghost" renderIcon={DocumentExport} onClick={() => setUi({ panel: 'export', exportGeneratedAt: Date.now() })}>Export</Button>
      <span className="mx-1 h-6 w-px bg-slate-200" />
      <Button size="sm" kind={pivotMode ? 'secondary' : 'ghost'} renderIcon={ChartRelationship} onClick={() => setUi({ pivotMode: !pivotMode })}>{pivotMode ? 'Grid view' : 'Pivot view'}</Button>
      <Button size="sm" kind="ghost" renderIcon={Search} onClick={() => { setUi({ panel: 'duplicates' }); useStore.getState().runDuplicateScan() }}>Duplicates</Button>
      <Button size="sm" kind="ghost" onClick={() => setUi({ panel: 'thresholds' })}>Thresholds</Button>
      <Button size="sm" kind="ghost" onClick={() => setUi({ panel: 'splits' })}>Splits</Button>
      <Button size="sm" kind="ghost" renderIcon={Save} onClick={() => setUi({ panel: 'snapshots' })}>Snapshots</Button>
      <span className="mx-1 h-6 w-px bg-slate-200" />
      <Button hasIconOnly iconDescription="Undo" size="sm" kind="ghost" renderIcon={ArrowLeft} disabled={!history.length} onClick={undo}/>
      <Button hasIconOnly iconDescription="Redo" size="sm" kind="ghost" renderIcon={ArrowRight} disabled={!future.length} onClick={redo}/>
    </div>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-2 sm:px-6">
      <FormulaBar dataset={dataset}/>
      <Toggle id="unverified-filter" size="sm" labelText="Show unverified only" labelA="All rows" labelB="Unverified" toggled={unverifiedOnly} onToggle={(checked) => setUi({ unverifiedOnly: checked, selectedRows: [] })}/>
    </div>
  </div>
}

function InlineEditor({ row, field, schemaField }) {
  const inline = useStore((s) => s.inlineEdit)
  const setUi = useStore((s) => s.setUi)
  const updateCell = useStore((s) => s.updateCell)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select?.() }, [])
  const commit = () => {
    let value = inline.value
    let error
    if (field === 'expectedOutput' && String(value).length > 4000) error = 'expectedOutput must be at most 4000 characters'
    else if (schemaField) { error = fieldError(schemaField, value, false); if (!error && schemaField.type === 'number') value = Number(value) }
    if (error) return setUi({ inlineEdit: { ...inline, error } })
    updateCell(row.id, field, value); setUi({ inlineEdit: null })
  }
  const props = { ref, className: 'h-8 w-full border border-blue-600 bg-white px-2 text-xs', value: inline.value, 'aria-invalid': Boolean(inline.error), onChange: (e) => setUi({ inlineEdit: { ...inline, value: e.target.value, error: null } }), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') setUi({ inlineEdit: null }) } }
  return <div className="w-full">{schemaField?.type === 'category' ? <select {...props}>{schemaField.allowedValues.map((v) => <option key={v}>{v}</option>)}</select> : <input {...props}/>} {inline.error && <span className="absolute z-30 mt-1 block w-64 bg-red-700 p-2 text-xs text-white" role="alert">{inline.error}</span>}</div>
}

function VirtualGrid({ dataset, visibleRows }) {
  const parentRef = useRef(null)
  const setUi = useStore((s) => s.setUi)
  const inline = useStore((s) => s.inlineEdit)
  const selectedRows = useStore((s) => s.selectedRows)
  const toggleSelected = useStore((s) => s.toggleSelected)
  const selectAll = useStore((s) => s.selectAll)
  const updateCell = useStore((s) => s.updateCell)
  const recentRows = useStore((s) => s.recentRows)
  const virtualizer = useVirtualizer({ count: visibleRows.length, getScrollElement: () => parentRef.current, estimateSize: () => 42, overscan: 10 })
  useEffect(() => { if (recentRows.ids.length && visibleRows.some((r) => recentRows.ids.includes(r.id))) virtualizer.scrollToIndex(visibleRows.length - 1, { align: 'end' }) }, [recentRows.ids, visibleRows.length])
  const template = `42px 30px ${dataset.schema.map(() => '190px').join(' ')} 240px 90px 105px 145px`
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedRows.includes(r.id))
  const openEditor = (row, field) => {
    const value = field === 'expectedOutput' ? row.expectedOutput : row.values[field]
    setUi({ inlineEdit: { rowId: row.id, field, value, error: null } })
  }
  if (!dataset.rows.length) return <EmptyRows dataset={dataset}/>
  if (!visibleRows.length) return <div className="grid min-h-[360px] place-items-center bg-white p-8 text-center"><div><WatsonHealthStackedScrolling_1 size={36} className="mx-auto text-slate-400"/><h3 className="mt-3 font-semibold">All rows are verified</h3><p className="mt-1 text-sm text-muted">The unverified-only filter has no matching rows.</p><Button className="mt-4" size="sm" kind="tertiary" onClick={() => setUi({ unverifiedOnly: false })}>Clear filter</Button></div></div>
  return <div ref={parentRef} className="grid-scroll" role="grid" aria-label={`${dataset.name} rows`} aria-rowcount={visibleRows.length}>
    <div style={{ height: virtualizer.getTotalSize() + 42, minWidth: `calc(${dataset.schema.length * 190 + 652}px)` }}>
      <div className="grid-head grid h-[42px] w-max min-w-full text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ gridTemplateColumns: template }} role="row">
        <div className="cell"><Checkbox id="select-all-visible" hideLabel labelText="Select all visible rows" checked={allVisibleSelected} indeterminate={selectedRows.length > 0 && !allVisibleSelected} onChange={(_, data) => selectAll(visibleRows.map((r) => r.id), data.checked)}/></div>
        <div className="cell" aria-label="Flagged status"><Flag size={14}/></div>
        {dataset.schema.map((field) => <div key={field.name} className={cx('cell', field.type === 'number' && 'justify-end')}>{field.name}<span className="ml-1 text-[9px] font-normal text-slate-500">{field.type}</span></div>)}
        <div className="cell">Expected output</div><div className="cell">Verified</div><div className="cell">Split</div><div className="cell">Actions</div>
      </div>
      {virtualizer.getVirtualItems().map((v) => {
        const row = visibleRows[v.index]
        const flagged = flaggedFields(row, dataset)
        const recentIndex = recentRows.ids.indexOf(row.id)
        return <div key={row.id} className={cx('data-row grid', recentIndex >= 0 && 'animate-add')} style={{ gridTemplateColumns: template, transform: `translateY(${v.start + 42}px)`, animationDelay: recentRows.type === 'import' && recentIndex >= 0 ? `${Math.floor(recentIndex / 10) * 100}ms` : undefined }} role="row" aria-rowindex={v.index + 2}>
          <div className="cell"><Checkbox id={`select-${row.id}`} hideLabel labelText={`Select row ${v.index + 1}`} checked={selectedRows.includes(row.id)} onChange={() => toggleSelected(row.id)}/></div>
          <div className="cell justify-center">{flagged.length ? <Flag size={16} className="text-amber-700" aria-label="Row flagged"/> : null}</div>
          {dataset.schema.map((field) => <div key={field.name} tabIndex={0} className={cx('cell relative', field.type === 'number' && 'justify-end tabular-nums', flagged.includes(field.name) && 'flagged-cell')} title={String(row.values[field.name])} onDoubleClick={() => openEditor(row, field.name)} onKeyDown={(e) => { if (e.key === 'Enter') openEditor(row, field.name) }} role="gridcell" aria-label={`${field.name}: ${row.values[field.name]}`}>
            {inline?.rowId === row.id && inline?.field === field.name ? <InlineEditor row={row} field={field.name} schemaField={field}/> : <span className="cell-text">{row.values[field.name]}</span>}
          </div>)}
          <div tabIndex={0} className="cell relative" title={row.expectedOutput} onDoubleClick={() => openEditor(row, 'expectedOutput')} onKeyDown={(e) => { if (e.key === 'Enter') openEditor(row, 'expectedOutput') }} role="gridcell">{inline?.rowId === row.id && inline?.field === 'expectedOutput' ? <InlineEditor row={row} field="expectedOutput"/> : <span className="cell-text">{row.expectedOutput}</span>}</div>
          <div className="cell"><button className="flex items-center gap-1 text-xs font-semibold" onClick={() => updateCell(row.id, 'verified', !row.verified)} aria-label={`${row.verified ? 'Mark unverified' : 'Mark verified'} row ${v.index + 1}`}>{row.verified ? <><Checkmark size={16} className="text-green-700"/>Yes</> : <><span className="text-slate-500">—</span>No</>}</button></div>
          <div className="cell"><Tag size="sm" type={row.split === 'train' ? 'blue' : row.split === 'validation' ? 'purple' : row.split === 'test' ? 'teal' : 'gray'}>{row.split || '—'}</Tag></div>
          <div className="cell gap-1"><Button hasIconOnly iconDescription="Edit row" size="sm" kind="ghost" renderIcon={Edit} onClick={() => setUi({ modal: { type: 'row', mode: 'edit', rowId: row.id } })}/><Button hasIconOnly iconDescription="Delete row" size="sm" kind="danger--ghost" renderIcon={TrashCan} onClick={() => setUi({ modal: { type: 'delete', ids: [row.id] } })}/></div>
        </div>
      })}
    </div>
  </div>
}

function EmptyRows({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  return <div className="grid min-h-[420px] place-items-center bg-white p-8 text-center"><div><FolderOpen size={40} className="mx-auto text-slate-400"/><h3 className="mt-4 text-lg font-semibold">{dataset.name} has no rows</h3><p className="mt-1 text-sm text-muted">Add a row manually or import a CSV batch.</p><div className="mt-5 flex justify-center gap-2"><Button size="sm" renderIcon={Add} onClick={() => setUi({ modal: { type: 'row', mode: 'add' } })}>Add row</Button><Button size="sm" kind="tertiary" renderIcon={Upload} onClick={() => setUi({ importState: newImportState(true) })}>Import CSV</Button></div></div></div>
}

function PivotView({ dataset, rows }) {
  const pivot = useStore((s) => s.pivot)
  const setUi = useStore((s) => s.setUi)
  const setBucket = (bucket, field) => {
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
      if (pivot.aggregation === 'sum') value = nums.reduce((a,b) => a+b, 0)
      if (pivot.aggregation === 'average') value = nums.length ? nums.reduce((a,b) => a+b,0)/nums.length : 0
      return { key, value, count: group.length }
    })
  }, [rows, pivot])
  const bucket = (label, key) => <div className="min-h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => setBucket(key, e.dataTransfer.getData('field'))}><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="flex flex-wrap gap-2">{(key === 'value' ? (pivot.value ? [pivot.value] : []) : pivot[key]).map((f) => <Tag key={f} filter onClose={() => remove(key, f)}>{f}</Tag>)}</div></div>
  return <div className="p-4 sm:p-6">
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Pivot builder</h3><p className="text-sm text-muted">Drag schema fields into buckets. Summaries update from live rows.</p></div><label className="text-xs font-semibold">Aggregation <select className="ml-2 border border-slate-300 p-2" value={pivot.aggregation} onChange={(e) => setUi({ pivot: { ...pivot, aggregation: e.target.value } })}><option>count</option><option>sum</option><option>average</option></select></label></div>
      <div className="mt-4 flex flex-wrap gap-2">{dataset.schema.map((f) => <button key={f.name} draggable onDragStart={(e) => e.dataTransfer.setData('field', f.name)} onClick={() => setBucket('rows', f.name)} className="cursor-grab rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900">{f.name} · {f.type}</button>)}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">{bucket('Rows', 'rows')}{bucket('Columns', 'columns')}{bucket('Values', 'value')}</div>
      <div className="mt-5 overflow-auto rounded-lg border border-line"><table className="w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-3 text-left">{pivot.rows.join(' → ') || 'Group'}</th><th className="p-3 text-right">{pivot.aggregation}{pivot.value ? `(${pivot.value})` : ''}</th><th className="p-3 text-right">Rows</th></tr></thead><tbody>{summary.length ? summary.map((r) => <tr key={r.key} className="border-t border-line hover:bg-blue-50"><td className="p-3">{r.key}</td><td className="p-3 text-right font-mono">{Number(r.value.toFixed?.(3) ?? r.value)}</td><td className="p-3 text-right">{r.count}</td></tr>) : <tr><td colSpan="3" className="p-8 text-center text-muted">Drop at least one field into Rows to build the pivot.</td></tr>}</tbody></table></div>
    </div>
  </div>
}

function BulkTray() {
  const selectedRows = useStore((s) => s.selectedRows)
  const bulk = useStore((s) => s.bulk)
  const setUi = useStore((s) => s.setUi)
  const [split, setSplit] = useState('train')
  if (!selectedRows.length) return null
  return <div className="bulk-tray fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-lg bg-slate-950 p-2 text-white shadow-2xl"><span className="whitespace-nowrap px-3 text-sm font-semibold">{selectedRows.length} selected</span><Button size="sm" kind="ghost" onClick={() => bulk('verified', true)}>Mark verified</Button><Button size="sm" kind="ghost" onClick={() => bulk('verified', false)}>Mark unverified</Button><select className="h-8 bg-slate-800 px-2 text-xs" value={split} onChange={(e) => setSplit(e.target.value)} aria-label="Bulk split"><option>train</option><option>validation</option><option>test</option></select><Button size="sm" kind="ghost" onClick={() => bulk('split', split)}>Assign split</Button><Button size="sm" kind="danger" onClick={() => setUi({ modal: { type: 'delete', ids: selectedRows } })}>Delete</Button></div>
}

function PanelRouter({ dataset }) {
  const panel = useStore((s) => s.panel)
  if (panel === 'thresholds') return <ThresholdPanel dataset={dataset}/>
  if (panel === 'splits') return <SplitPanel dataset={dataset}/>
  if (panel === 'snapshots') return <SnapshotPanel dataset={dataset}/>
  if (panel === 'duplicates') return <DuplicatePanel dataset={dataset}/>
  if (panel === 'export') return <ExportDrawer dataset={dataset}/>
  return null
}

function ModalRouter({ dataset }) {
  const modal = useStore((s) => s.modal)
  if (!modal) return null
  if (modal.type === 'dataset') return <DatasetDialog/>
  if (modal.type === 'row') return <RowDialog dataset={dataset} mode={modal.mode} rowId={modal.rowId}/>
  if (modal.type === 'delete') return <ConfirmDialog title={`Delete ${modal.ids.length} row${modal.ids.length === 1 ? '' : 's'}?`} detail="This change can be undone from the toolbar." confirmLabel="Delete" onConfirm={() => { useStore.getState().deleteRows(modal.ids); useStore.getState().setUi({ modal: null }) }}/>
  if (modal.type === 'attach') return <AttachDialog dataset={dataset}/>
  if (modal.type === 'merge') return <MergeDialog dataset={dataset} group={modal.group}/>
  return null
}

export default function App() {
  const datasets = useStore((s) => s.datasets)
  const selectedId = useStore((s) => s.selectedId)
  const unverifiedOnly = useStore((s) => s.unverifiedOnly)
  const pivotMode = useStore((s) => s.pivotMode)
  const toast = useStore((s) => s.toast)
  const setUi = useStore((s) => s.setUi)
  const undo = useStore((s) => s.undo), redo = useStore((s) => s.redo)
  const dataset = datasets.find((d) => d.id === selectedId) || datasets[0]
  const stats = useMemo(() => computeStats(dataset), [dataset])
  const visibleRows = useMemo(() => unverifiedOnly ? dataset.rows.filter((r) => !r.verified) : dataset.rows, [dataset.rows, unverifiedOnly])
  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() } }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])
  return <div className="app-shell">
    <Sidebar dataset={dataset}/>
    <main className="main-area">
      <div className="flex items-center gap-2 border-b border-line bg-slate-950 px-3 py-2 text-white md:hidden"><Button hasIconOnly size="sm" kind="ghost" iconDescription="Open datasets" renderIcon={Menu} onClick={() => setUi({ sidebarOpen: true })}/><span className="truncate text-sm font-semibold">{dataset.name}</span></div>
      <DatasetHeader dataset={dataset} stats={stats}/>
      <Toolbar dataset={dataset}/>
      {pivotMode ? <PivotView dataset={dataset} rows={visibleRows}/> : <div className="m-0 border-b border-line sm:m-4 sm:rounded-lg sm:border sm:shadow-sm"><VirtualGrid dataset={dataset} visibleRows={visibleRows}/></div>}
    </main>
    <BulkTray/>
    <PanelRouter dataset={dataset}/>
    <ModalRouter dataset={dataset}/>
    <ImportWizard dataset={dataset}/>
    <div className="fixed right-4 top-4 z-[100] w-[min(390px,calc(100vw-32px))]" aria-live="polite">{toast && <InlineNotification className="toast" kind={toast.kind === 'info' ? 'info' : toast.kind === 'error' ? 'error' : 'success'} title={toast.message} hideCloseButton={false} onCloseButtonClick={() => setUi({ toast: null })}/>}</div>
    <div className="sr-only" aria-live="assertive">{toast?.message}</div>
  </div>
}
