import React, { useRef } from 'react'
import { ArrowLeft, ArrowRight, Checkmark, Close, DocumentImport, Upload, Restart } from '@carbon/icons-react'
import Papa from 'papaparse'
import { fieldError, normalizeRowInput } from '../domain'
import { newImportState, sampleCsvs, useStore } from '../store'
import { Btn, cx, useOverlayBehavior } from '../ui'

function parseCsv(text) {
  const parsed = Papa.parse(String(text).trim(), { header: true, skipEmptyLines: 'greedy' })
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
  const open = useStore((s) => s.importState.open)
  if (!open) return null
  return <WizardInner dataset={dataset} />
}

function WizardInner({ dataset }) {
  const state = useStore((s) => s.importState)
  const setUi = useStore((s) => s.setUi)
  const appendRows = useStore((s) => s.appendRows)
  const card = useRef(null)
  const commitLock = useRef(false)
  const close = () => { setUi({ importState: { ...useStore.getState().importState, open: false } }); }
  useOverlayBehavior(card, close)
  const restart = () => setUi({ importState: newImportState(true) })
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
  const hasMapping = state.mapping && Object.keys(state.mapping).length > 0 && Object.values(state.mapping).some((m) => m !== 'ignore')
  const commit = () => {
    const live = useStore.getState().importState
    if (commitLock.current || live.committing) return
    if (issues || !included.length) return
    commitLock.current = true
    update({ committing: true })
    const rows = included.map((r) => normalizeRowInput(dataset.schema, { values: Object.fromEntries(dataset.schema.map((f) => [f.name, r.cells[f.name]])), expectedOutput: r.cells.expectedOutput, verified: false }))
    appendRows(rows)
    useStore.getState().announce(`${rows.length} rows imported`)
    setUi({ importState: newImportState(false) })
  }
  const steps = ['Source', 'Mapping', 'Diagnostics']
  const activeIndex = state.step === 'source' ? 0 : state.step === 'mapping' ? 1 : 2
  return (
    <div className="modal-overlay no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <section ref={card} tabIndex={-1} className="modal-card !w-[min(920px,100%)]" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b bd surface px-5 py-4">
          <div className="min-w-0">
            <h2 id="import-title" className="text-xl font-bold t-primary">Import CSV</h2>
            <p className="mt-1 text-sm t-2">Map and repair incoming rows before committing them to {dataset.name}.</p>
          </div>
          <div className="flex gap-1">
            <Btn kind="ghost" size="sm" icon={Restart} iconOnly aria-label="Restart import from the beginning" title="Start over" onClick={restart} />
            <Btn kind="ghost" size="sm" icon={Close} iconOnly aria-label="Close import wizard" title="Close (Escape)" onClick={close} />
          </div>
        </header>
        <div className="border-b bd px-5 py-3">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((label, i) => (
              <li key={label} className={cx('flex items-center gap-2 text-xs font-bold', i <= activeIndex ? 't-brand' : 't-3')}>
                <span className={cx('grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] transition-colors', i < activeIndex ? 'bg-[var(--ok-soft)] text-[var(--ok)]' : i === activeIndex ? 'bg-[var(--brand)] text-white' : 'surface-3 t-3')}>
                  {i < activeIndex ? <Checkmark size={13} /> : i + 1}
                </span>{label}
              </li>
            ))}
          </ol>
        </div>
        {state.step === 'source' && (
          <div className="step-enter p-5">
            <div className="mb-4 flex border-b bd" role="tablist" aria-label="CSV source">
              {[['samples', 'Sample fixtures'], ['file', 'File / drop'], ['paste', 'Paste text']].map(([t, label]) => (
                <button key={t} role="tab" aria-selected={state.sourceTab === t} className="tab-btn" onClick={() => update({ sourceTab: t, sourceError: null })}>{label}</button>
              ))}
            </div>
            {state.sourceTab === 'samples' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {sampleCsvs.map((sample) => (
                  <button key={sample.id} type="button" className="rounded-lg hairline p-4 text-left transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]" onClick={() => load(sample.text)}>
                    <DocumentImport size={24} style={{ color: 'var(--brand)' }} aria-hidden="true" />
                    <strong className="mt-3 block text-sm t-primary">{sample.name}</strong>
                    <span className="mt-1 block text-xs t-3">{sample.text.split('\n').length - 1} rows · seeded fixture</span>
                  </button>
                ))}
              </div>
            )}
            {state.sourceTab === 'file' && (
              <div className={cx('dropzone grid min-h-52 place-items-center p-8 text-center', state.dragging && 'dragging')}
                onDragEnter={(e) => { e.preventDefault(); update({ dragging: true }) }}
                onDragOver={(e) => { e.preventDefault(); if (!state.dragging) update({ dragging: true }) }}
                onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) update({ dragging: false }) }}
                onDrop={(e) => { e.preventDefault(); update({ dragging: false }); loadFile(e.dataTransfer.files?.[0]) }}>
                <div>
                  <Upload size={32} className="mx-auto pointer-events-none" style={{ color: 'var(--brand)' }} aria-hidden="true" />
                  <strong className="mt-3 block t-primary pointer-events-none">Drop a .csv file here</strong>
                  <p className="mt-1 text-sm t-3 pointer-events-none">{state.dragging ? 'Release to load the file' : 'or choose one from your device'}</p>
                  <label className="btn btn-primary btn-sm mt-4 cursor-pointer relative z-10"><Upload size={14} aria-hidden="true" />Choose CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={(e) => loadFile(e.target.files?.[0])} /></label>
                </div>
              </div>
            )}
            {state.sourceTab === 'paste' && (
              <div>
                <label className="field-label" htmlFor="pasted-csv">Paste raw CSV text</label>
                <textarea id="pasted-csv" rows={10} className="input mono !text-xs" placeholder={'prompt,score,category\nExample,8.5,Reasoning'} value={state.paste} onChange={(e) => update({ paste: e.target.value })} aria-invalid={Boolean(state.sourceError)} aria-describedby={state.sourceError ? 'pasted-csv-error' : undefined} />
                {state.sourceError && <p className="error-text" id="pasted-csv-error" role="alert">{state.sourceError}</p>}
                <Btn className="mt-3" size="sm" disabled={!state.paste.trim()} onClick={() => load(state.paste)}>Parse pasted CSV</Btn>
              </div>
            )}
            {state.sourceError && state.sourceTab !== 'paste' && <p className="error-text mt-4" role="alert">{state.sourceError}</p>}
          </div>
        )}
        {state.step === 'mapping' && (
          <div className="step-enter p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold t-primary">Map detected columns</h3>
              <p className="text-sm t-2">Matched schema headers arrive pre-assigned. Change any destination before continuing.</p>
            </div>
            <div className="max-h-[52vh] overflow-auto rounded-lg hairline">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="sticky top-0 surface-3"><tr><th className="p-3 text-left text-xs font-bold uppercase t-2">CSV column</th><th className="p-3 text-left text-xs font-bold uppercase t-2">First values</th><th className="p-3 text-left text-xs font-bold uppercase t-2">Destination</th></tr></thead>
                <tbody>
                  {state.headers.map((h) => (
                    <tr key={h} className="border-t bd">
                      <td className="p-3 font-bold t-primary">{h}</td>
                      <td className="max-w-72 truncate p-3 t-3" title={state.rawRows.slice(0, 3).map((r) => r[h]).join(' · ')}>{state.rawRows.slice(0, 3).map((r) => r[h]).join(' · ')}</td>
                      <td className="p-3">
                        <label className="sr-only" htmlFor={`map-${h}`}>Map column {h}</label>
                        <select id={`map-${h}`} className="input !min-h-9" value={state.mapping[h]} onChange={(e) => update({ mapping: { ...state.mapping, [h]: e.target.value } })}>
                          <option value="ignore">Ignore</option>
                          {dataset.schema.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
                          <option value="expectedOutput">Expected output</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasMapping && <p className="error-text" role="alert">Assign at least one CSV column to a schema field or the expected output.</p>}
            <footer className="mt-5 flex justify-between">
              <Btn kind="secondary" icon={ArrowLeft} onClick={() => update({ step: 'source' })}>Back</Btn>
              <Btn icon={ArrowRight} disabled={!hasMapping} onClick={toDiagnostics}>Continue to diagnostics</Btn>
            </footer>
          </div>
        )}
        {state.step === 'diagnostics' && (
          <div className="step-enter p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold t-primary">Review incoming rows</h3>
                <p className="text-sm t-2">Edit highlighted cells in place or exclude rows before commit.</p>
              </div>
              <div className="flex flex-wrap gap-2" aria-live="polite">
                <Tag tone="green">{ready} ready</Tag>
                <Tag tone={issues ? 'red' : 'green'}>{issues} unresolved issue{issues === 1 ? '' : 's'}</Tag>
                <Tag tone="gray">{state.diagnostic.filter((r) => r.excluded).length} excluded</Tag>
              </div>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-auto rounded-lg hairline">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="sticky top-0 z-10 surface-3"><tr><th className="p-2 text-left font-bold uppercase t-2">Exclude</th>{dataset.schema.map((f) => <th key={f.name} className="p-2 text-left font-bold uppercase t-2">{f.name}</th>)}<th className="p-2 text-left font-bold uppercase t-2">Expected output</th></tr></thead>
                <tbody>
                  {state.diagnostic.map((row, i) => (
                    <tr key={row.id} className={cx('border-t bd transition-opacity', row.excluded && 'opacity-45')}>
                      <td className="p-2">
                        <label className="chk" title={row.excluded ? 'Excluded from commit' : 'Included'}>
                          <input type="checkbox" checked={row.excluded} onChange={() => toggleExcluded(row.id)} aria-label={`Exclude incoming row ${i + 1}`} />
                          <span className="chk-box" aria-hidden="true"><Checkmark size={11} /></span>
                        </label>
                      </td>
                      {dataset.schema.map((field) => (
                        <td key={field.name} className={cx('min-w-40 p-2 align-top', row.errors[field.name] && 'bg-[var(--danger-soft)]')}>
                          {field.type === 'category' ? (
                            <select className="input !min-h-9 !py-1 !text-xs" value={row.cells[field.name]} aria-label={`${field.name} for incoming row ${i + 1}`} aria-invalid={Boolean(row.errors[field.name])} aria-describedby={row.errors[field.name] ? `err-${row.id}-${field.name}` : undefined} onChange={(e) => editDiagnostic(row.id, field.name, e.target.value)}>
                              <option value={row.cells[field.name]}>{row.cells[field.name] || 'Choose…'}</option>
                              {field.allowedValues.filter((v) => v !== row.cells[field.name]).map((v) => <option key={v}>{v}</option>)}
                            </select>
                          ) : (
                            <input className="input !min-h-9 !py-1 !text-xs" value={row.cells[field.name]} aria-label={`${field.name} for incoming row ${i + 1}`} aria-invalid={Boolean(row.errors[field.name])} aria-describedby={row.errors[field.name] ? `err-${row.id}-${field.name}` : undefined} onChange={(e) => editDiagnostic(row.id, field.name, e.target.value)} />
                          )}
                          {row.errors[field.name] && <p id={`err-${row.id}-${field.name}`} className="error-text !mt-1 max-w-48" role="alert">{row.errors[field.name]}</p>}
                        </td>
                      ))}
                      <td className={cx('min-w-48 p-2 align-top', row.errors.expectedOutput && 'bg-[var(--danger-soft)]')}>
                        <input className="input !min-h-9 !py-1 !text-xs" value={row.cells.expectedOutput} aria-label={`Expected output for incoming row ${i + 1}`} aria-invalid={Boolean(row.errors.expectedOutput)} aria-describedby={row.errors.expectedOutput ? `err-${row.id}-expectedOutput` : undefined} onChange={(e) => editDiagnostic(row.id, 'expectedOutput', e.target.value)} />
                        {row.errors.expectedOutput && <p id={`err-${row.id}-expectedOutput`} className="error-text !mt-1" role="alert">{row.errors.expectedOutput}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="mt-5 flex justify-between">
              <Btn kind="secondary" icon={ArrowLeft} onClick={() => update({ step: 'mapping' })}>Back to mapping</Btn>
              <Btn disabled={Boolean(issues) || !included.length || state.committing} onClick={commit}>{state.committing ? 'Committing…' : `Commit ${included.length} row${included.length === 1 ? '' : 's'}`}</Btn>
            </footer>
          </div>
        )}
      </section>
    </div>
  )
}

function Tag({ tone, children }) {
  return <span className={cx('tag', `tag-${tone}`)}>{children}</span>
}
