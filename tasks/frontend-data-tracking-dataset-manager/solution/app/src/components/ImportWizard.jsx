import React, { useEffect, useRef } from 'react'
import { Button, Checkbox, InlineNotification, Select, SelectItem, TextArea } from '@carbon/react'
import { ArrowLeft, ArrowRight, Checkmark, Close, DocumentImport, Upload } from '@carbon/icons-react'
import Papa from 'papaparse'
import { fieldError, normalizeRowInput } from '../domain'
import { newImportState, sampleCsvs, useStore } from '../store'

function parseCsv(text) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: 'greedy' })
  const headers = parsed.meta.fields?.filter(Boolean) || []
  const rows = parsed.data.filter((row) => headers.some((h) => String(row[h] ?? '').trim() !== ''))
  if (!headers.length || !rows.length) return { error: 'CSV source has no parseable rows' }
  return { headers, rows }
}

function diagnose(dataset, values) {
  const errors = {}
  dataset.schema.forEach((field) => { const error = fieldError(field, values[field.name], true); if (error) errors[field.name] = error })
  if (String(values.expectedOutput ?? '').length > 4000) errors.expectedOutput = 'expectedOutput must be at most 4000 characters'
  return errors
}

export function ImportWizard({ dataset }) {
  const state = useStore((s) => s.importState)
  const setUi = useStore((s) => s.setUi)
  const appendRows = useStore((s) => s.appendRows)
  const card = useRef(null)
  const returnFocus = useRef(null)
  useEffect(() => {
    if (!state.open) return
    returnFocus.current = document.activeElement
    card.current?.querySelector('button, input, textarea, select')?.focus()
    const key = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const nodes = [...card.current.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled)
        if (!nodes.length) return
        if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1).focus() }
        else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); returnFocus.current?.focus?.() }
  }, [state.open])
  const close = () => setUi({ importState: newImportState(false) })
  if (!state.open) return null
  const update = (patch) => setUi({ importState: { ...useStore.getState().importState, ...patch } })
  const load = (text) => {
    const result = parseCsv(text)
    if (result.error) { update({ sourceError: result.error }); return }
    const mapping = Object.fromEntries(result.headers.map((h) => {
      const field = dataset.schema.find((f) => f.name.toLowerCase() === h.toLowerCase())
      return [h, field?.name || (h.toLowerCase() === 'expectedoutput' ? 'expectedOutput' : 'ignore')]
    }))
    update({ sourceError: null, step: 'mapping', sourceText: text, headers: result.headers, rawRows: result.rows, mapping, diagnostic: [] })
  }
  const loadFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) { update({ sourceError: 'Source file must use the .csv extension' }); return }
    load(await file.text())
  }
  const toDiagnostics = () => {
    const diagnostic = state.rawRows.map((raw, index) => {
      const values = Object.fromEntries(dataset.schema.map((f) => [f.name, '']))
      let expectedOutput = ''
      state.headers.forEach((h) => { const dest = state.mapping[h]; if (dest === 'expectedOutput') expectedOutput = raw[h] ?? ''; else if (dest && dest !== 'ignore') values[dest] = raw[h] ?? '' })
      const cells = { ...values, expectedOutput }
      return { id: `incoming-${index}`, cells, errors: diagnose(dataset, cells), excluded: false }
    })
    update({ step: 'diagnostics', diagnostic })
  }
  const editDiagnostic = (rowId, field, value) => {
    const diagnostic = state.diagnostic.map((row) => row.id === rowId ? { ...row, cells: { ...row.cells, [field]: value }, errors: diagnose(dataset, { ...row.cells, [field]: value }) } : row)
    update({ diagnostic })
  }
  const toggleExcluded = (rowId) => update({ diagnostic: state.diagnostic.map((r) => r.id === rowId ? { ...r, excluded: !r.excluded } : r) })
  const included = state.diagnostic.filter((r) => !r.excluded)
  const issues = included.reduce((n, r) => n + Object.keys(r.errors).length, 0)
  const ready = included.filter((r) => !Object.keys(r.errors).length).length
  const hasMapping = Object.values(state.mapping).some((m) => m !== 'ignore')
  const commit = () => {
    if (state.committing || issues || !included.length) return
    update({ committing: true })
    const rows = included.map((r) => normalizeRowInput(dataset.schema, { values: Object.fromEntries(dataset.schema.map((f) => [f.name, r.cells[f.name]])), expectedOutput: r.cells.expectedOutput, verified: false }))
    close(); appendRows(rows)
  }
  const steps = ['Source', 'Mapping', 'Diagnostics']
  return <div className="modal-overlay" role="presentation">
    <section ref={card} className="modal-card max-w-5xl" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-200 bg-white p-5"><div><h2 id="import-title" className="text-xl font-semibold">Import CSV</h2><p className="mt-1 text-sm text-slate-600">Map and repair incoming rows before committing them to {dataset.name}.</p></div><Button hasIconOnly kind="ghost" size="sm" iconDescription="Close import wizard" renderIcon={Close} onClick={close}/></header>
      <div className="border-b border-slate-200 px-5 py-3"><ol className="grid grid-cols-3 gap-2">{steps.map((label, i) => { const activeIndex = state.step === 'source' ? 0 : state.step === 'mapping' ? 1 : 2; return <li key={label} className={`flex items-center gap-2 text-xs font-semibold ${i <= activeIndex ? 'text-blue-700' : 'text-slate-400'}`}><span className={`grid h-6 w-6 place-items-center rounded-full ${i < activeIndex ? 'bg-green-100 text-green-800' : i === activeIndex ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>{i < activeIndex ? <Checkmark size={14}/> : i + 1}</span>{label}</li>})}</ol></div>
      {state.step === 'source' && <div className="p-5">
        <div className="mb-4 flex border-b border-slate-200" role="tablist">{['samples','file','paste'].map((t) => <button key={t} role="tab" aria-selected={state.sourceTab === t} className={`border-b-2 px-4 py-2 text-sm font-semibold capitalize ${state.sourceTab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`} onClick={() => update({ sourceTab: t, sourceError: null })}>{t === 'samples' ? 'Sample fixtures' : t}</button>)}</div>
        {state.sourceTab === 'samples' && <div className="grid gap-3 sm:grid-cols-2">{sampleCsvs.map((sample) => <button key={sample.id} className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50" onClick={() => load(sample.text)}><DocumentImport size={24} className="text-blue-700"/><strong className="mt-3 block text-sm">{sample.name}</strong><span className="mt-1 block text-xs text-slate-500">{sample.text.split('\n').length - 1} rows · selectable fixture</span></button>)}</div>}
        {state.sourceTab === 'file' && <div className={`dropzone ${state.dragging ? 'dragging' : ''} grid min-h-52 place-items-center rounded-lg p-8 text-center`} onDragOver={(e) => { e.preventDefault(); update({ dragging: true }) }} onDragLeave={() => update({ dragging: false })} onDrop={(e) => { e.preventDefault(); update({ dragging: false }); loadFile(e.dataTransfer.files?.[0]) }}><div><Upload size={32} className="mx-auto text-blue-700"/><strong className="mt-3 block">Drop a .csv file here</strong><p className="mt-1 text-sm text-slate-500">or choose one from your device</p><label className="mt-4 inline-block cursor-pointer bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Choose CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(e) => loadFile(e.target.files?.[0])}/></label></div></div>}
        {state.sourceTab === 'paste' && <div><TextArea id="pasted-csv" rows={12} labelText="Paste raw CSV text" placeholder="prompt,score,category&#10;Example,8.5,Reasoning" value={state.paste} onChange={(e) => update({ paste: e.target.value })} invalid={Boolean(state.sourceError)} invalidText={state.sourceError}/><Button className="mt-3" size="sm" disabled={!state.paste.trim()} onClick={() => load(state.paste)}>Parse pasted CSV</Button></div>}
        {state.sourceError && state.sourceTab !== 'paste' && <InlineNotification className="mt-4" kind="error" lowContrast title={state.sourceError} hideCloseButton/>}
      </div>}
      {state.step === 'mapping' && <div className="p-5"><div className="mb-4"><h3 className="font-semibold">Map detected columns</h3><p className="text-sm text-slate-600">Matched schema headers are pre-assigned. Change any destination before continuing.</p></div><div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[620px] text-sm"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-3 text-left">CSV column</th><th className="p-3 text-left">First values</th><th className="p-3 text-left">Destination</th></tr></thead><tbody>{state.headers.map((h) => <tr key={h} className="border-t border-slate-200"><td className="p-3 font-semibold">{h}</td><td className="max-w-72 truncate p-3 text-slate-600">{state.rawRows.slice(0,3).map((r) => r[h]).join(' · ')}</td><td className="p-3"><select aria-label={`Map ${h}`} className="native-input" value={state.mapping[h]} onChange={(e) => update({ mapping: { ...state.mapping, [h]: e.target.value } })}><option value="ignore">Ignore</option>{dataset.schema.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}<option value="expectedOutput">Expected output</option></select></td></tr>)}</tbody></table></div>{!hasMapping && <p className="error-text" role="alert">Assign at least one CSV column to a schema field or expected output.</p>}<footer className="mt-5 flex justify-between"><Button kind="secondary" renderIcon={ArrowLeft} onClick={() => update({ step: 'source' })}>Back</Button><Button renderIcon={ArrowRight} disabled={!hasMapping} onClick={toDiagnostics}>Continue to diagnostics</Button></footer></div>}
      {state.step === 'diagnostics' && <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Review incoming rows</h3><p className="text-sm text-slate-600">Edit highlighted cells or exclude rows before commit.</p></div><div className="flex gap-2"><TagStat tone="green" text={`${ready} ready`}/><TagStat tone={issues ? 'red' : 'green'} text={`${issues} unresolved issue${issues === 1 ? '' : 's'}`}/><TagStat text={`${state.diagnostic.filter((r) => r.excluded).length} excluded`}/></div></div>
        <div className="mt-4 max-h-[55vh] overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[760px] text-xs"><thead className="sticky top-0 z-10 bg-slate-100"><tr><th className="p-2 text-left">Exclude</th>{dataset.schema.map((f) => <th key={f.name} className="p-2 text-left">{f.name}</th>)}<th className="p-2 text-left">Expected output</th></tr></thead><tbody>{state.diagnostic.map((row, i) => <tr key={row.id} className={`border-t border-slate-200 ${row.excluded ? 'opacity-50' : ''}`}><td className="p-2"><Checkbox id={`exclude-${i}`} hideLabel labelText={`Exclude incoming row ${i+1}`} checked={row.excluded} onChange={() => toggleExcluded(row.id)}/></td>{dataset.schema.map((field) => <td key={field.name} className={`min-w-40 p-2 align-top ${row.errors[field.name] ? 'bg-red-50' : ''}`}>{field.type === 'category' ? <select className={`h-9 w-full border px-2 ${row.errors[field.name] ? 'border-red-600' : 'border-slate-300'}`} value={row.cells[field.name]} onChange={(e) => editDiagnostic(row.id, field.name, e.target.value)}><option value={row.cells[field.name]}>{row.cells[field.name] || 'Choose…'}</option>{field.allowedValues.filter((v) => v !== row.cells[field.name]).map((v) => <option key={v}>{v}</option>)}</select> : <input className={`h-9 w-full border px-2 ${row.errors[field.name] ? 'border-red-600 bg-white' : 'border-slate-300'}`} value={row.cells[field.name]} onChange={(e) => editDiagnostic(row.id, field.name, e.target.value)}/>} {row.errors[field.name] && <p className="mt-1 max-w-48 text-[11px] leading-4 text-red-700">{row.errors[field.name]}</p>}</td>)}<td className={`min-w-48 p-2 align-top ${row.errors.expectedOutput ? 'bg-red-50' : ''}`}><input className="h-9 w-full border border-slate-300 px-2" value={row.cells.expectedOutput} onChange={(e) => editDiagnostic(row.id, 'expectedOutput', e.target.value)}/>{row.errors.expectedOutput && <p className="mt-1 text-red-700">{row.errors.expectedOutput}</p>}</td></tr>)}</tbody></table></div>
        <footer className="mt-5 flex justify-between"><Button kind="secondary" renderIcon={ArrowLeft} onClick={() => update({ step: 'mapping' })}>Back to mapping</Button><Button disabled={Boolean(issues) || !included.length || state.committing} onClick={commit}>{state.committing ? 'Committing…' : `Commit ${included.length} row${included.length === 1 ? '' : 's'}`}</Button></footer>
      </div>}
    </section>
  </div>
}

function TagStat({ text, tone = 'slate' }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === 'green' ? 'bg-green-100 text-green-800' : tone === 'red' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{text}</span>
}
