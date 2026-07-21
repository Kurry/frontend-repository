import React, { useMemo, useState } from 'react'
import { Checkmark, Copy, Download, Flag, Printer, Save, Search, TrashCan, Upload, CheckmarkOutline, GroupAccess } from '@carbon/icons-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { snapshotDiff, snapshotSchema, splitSchema, thresholdSchema } from '../domain'
import { useStore } from '../store'
import { Btn, Chk, EmptyState, PanelShell, SelectField, Tag, TextAreaField, TextField, cx } from '../ui'

export function ThresholdPanel({ dataset }) {
  const addThreshold = useStore((s) => s.addThreshold), deleteThreshold = useStore((s) => s.deleteThreshold)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(thresholdSchema), mode: 'onChange', defaultValues: { column: '', comparator: 'above', cap: '' } })
  const numeric = dataset.schema.filter((f) => f.type === 'number')
  const submit = (data) => { addThreshold({ column: data.column, comparator: data.comparator, cap: Number(data.cap) }); reset() }
  return (
    <PanelShell title="Threshold alerts" subtitle="Flag rows whose numeric values cross an active rule.">
      <form className="border-b bd p-5" onSubmit={handleSubmit(submit, () => {})} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField id="threshold-column" label="Numeric column" required error={errors.column?.message} {...register('column')}>
            <option value="">Choose column</option>
            {numeric.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </SelectField>
          <SelectField id="threshold-comparator" label="Comparator" required error={errors.comparator?.message} hint="above flags value > cap; below flags value < cap" {...register('comparator')}>
            <option value="above">above</option><option value="below">below</option>
          </SelectField>
          <div className="sm:col-span-2">
            <TextField id="threshold-cap" label="Cap" required inputMode="decimal" placeholder="e.g. 3" error={errors.cap?.message} {...register('cap')} />
          </div>
        </div>
        <Btn className="mt-4" type="submit" size="sm" icon={Flag}>Add threshold rule</Btn>
      </form>
      <div className="p-5">
        <h3 className="text-sm font-bold t-primary">Active rules · {dataset.thresholdRules.length}</h3>
        <div className="mt-3 space-y-2">
          {dataset.thresholdRules.length ? dataset.thresholdRules.map((r) => (
            <div key={r.id} className="reveal-item flex items-center justify-between rounded-lg hairline p-3 transition hover:bg-[var(--surface-2)]">
              <div className="flex items-center gap-2"><Flag size={16} style={{ color: 'var(--warn)' }} aria-hidden="true" /><span className="text-sm t-primary"><strong>{r.column}</strong> {r.comparator} {r.cap}</span></div>
              <Btn kind="danger-ghost" size="sm" icon={TrashCan} iconOnly aria-label={`Delete rule ${r.column} ${r.comparator} ${r.cap}`} onClick={() => deleteThreshold(r.id)} />
            </div>
          )) : <p className="rounded-lg surface-2 p-5 text-center text-sm t-3">No active threshold rules.</p>}
        </div>
      </div>
    </PanelShell>
  )
}

export function SplitPanel({ dataset }) {
  const applySplits = useStore((s) => s.applySplits)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(splitSchema), mode: 'onChange', defaultValues: dataset.splitPercentages })
  const values = watch()
  const total = Number(values.train || 0) + Number(values.validation || 0) + Number(values.test || 0)
  const rowsOf = (split) => dataset.rows.filter((r) => r.split === split)
  const attempt = handleSubmit((data) => applySplits({ train: Number(data.train), validation: Number(data.validation), test: Number(data.test) }), () => {})
  return (
    <PanelShell title="Split management" subtitle="Apply deterministic train / validation / test assignments to every row.">
      <form className="border-b bd p-5" onSubmit={attempt} noValidate>
        <div className="grid grid-cols-3 gap-3">
          {['train', 'validation', 'test'].map((s) => (
            <TextField key={s} id={`split-${s}`} label={`${s} %`} required type="number" min="0" max="100" error={errors[s]?.message} {...register(s)} />
          ))}
        </div>
        <p className={cx('mt-3 text-sm font-semibold', total === 100 ? 'text-[var(--ok)]' : 'text-[var(--danger)]')} role={total === 100 ? 'status' : 'alert'}>
          Percentages total: {total}%{total !== 100 && ' — must total exactly 100%'}
        </p>
        {errors.root && <p className="error-text" role="alert">{errors.root.message}</p>}
        <Btn className="mt-4" type="submit" size="sm">Apply split</Btn>
      </form>
      <div className="p-5">
        <h3 className="text-sm font-bold t-primary">Actual assigned distribution</h3>
        <div className="mt-3 flex h-6 overflow-hidden rounded-full surface-2 hairline" role="img" aria-label={`Split distribution: ${['train', 'validation', 'test'].map((s) => `${s} ${rowsOf(s).length}`).join(', ')}`}>
          {['train', 'validation', 'test'].map((s) => (
            <div key={s} className="h-full transition-all duration-500" title={`${s}: ${rowsOf(s).length} rows`}
              style={{ width: `${dataset.rows.length ? rowsOf(s).length / dataset.rows.length * 100 : 0}%`, background: s === 'train' ? 'var(--brand)' : s === 'validation' ? 'var(--violet)' : 'var(--ok)' }} />
          ))}
        </div>
        <p className="hint-text">Stratification below tracks verified / unverified counts per split and updates as rows change.</p>
        <div className="mt-3 space-y-2">
          {['train', 'validation', 'test'].map((s) => (
            <div key={s} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg hairline px-3 py-2 text-sm">
              <strong className="capitalize t-primary flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s === 'train' ? 'var(--brand)' : s === 'validation' ? 'var(--violet)' : 'var(--ok)' }} />{s}</strong>
              <span className="text-[var(--ok)] font-semibold">{rowsOf(s).filter((r) => r.verified).length} verified</span>
              <span className="t-3">{rowsOf(s).filter((r) => !r.verified).length} unverified</span>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

export function SnapshotPanel({ dataset }) {
  const saveSnapshot = useStore((s) => s.saveSnapshot)
  const selection = useStore((s) => s.snapshotSelection)
  const setUi = useStore((s) => s.setUi)
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({ resolver: zodResolver(snapshotSchema), mode: 'onChange', defaultValues: { name: '' } })
  const submit = ({ name }) => {
    if (dataset.snapshots.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) return setError('name', { message: 'Snapshot name must be unique for this dataset' })
    saveSnapshot(name.trim()); reset()
  }
  const toggle = (name) => setUi({ snapshotSelection: selection.includes(name) ? selection.filter((v) => v !== name) : selection.length < 2 ? [...selection, name] : [selection[1], name] })
  const chosen = selection.map((n) => dataset.snapshots.find((s) => s.name === n)).filter(Boolean).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const diff = useMemo(() => chosen.length === 2 ? snapshotDiff(chosen[0], chosen[1], dataset.schema) : [], [chosen, dataset.schema])
  const added = diff.filter((d) => d.status === 'added').length
  const removed = diff.filter((d) => d.status === 'removed').length
  const changed = diff.filter((d) => d.status === 'changed').length
  return (
    <PanelShell title="Snapshots & diff" subtitle="Capture the live rows, then compare any two snapshots row by row." wide>
      <form className="flex flex-wrap items-end gap-2 border-b bd p-5" onSubmit={handleSubmit(submit, () => {})} noValidate>
        <div className="min-w-[220px] flex-1">
          <TextField id="snapshot-name" label="Snapshot name" required placeholder="e.g. Before score cleanup" hint="1–80 characters, unique per dataset." error={errors.name?.message} {...register('name')} />
        </div>
        <Btn type="submit" size="sm" icon={Save}>Save snapshot</Btn>
      </form>
      <div className="grid gap-5 p-5 md:grid-cols-[240px_1fr]">
        <div>
          <h3 className="text-sm font-bold t-primary">Saved snapshots · {dataset.snapshots.length}</h3>
          <div className="mt-3 space-y-2">
            {dataset.snapshots.map((s) => (
              <div key={s.name} className={cx('rounded-lg hairline p-3 transition hover:bg-[var(--surface-2)]', selection.includes(s.name) && 'border-[var(--brand)] bg-[var(--brand-soft)]')}>
                <Chk label={<span><strong className="block text-sm t-primary">{s.name}</strong><span className="text-xs t-3">{s.rows.length} rows · {new Date(s.createdAt).toLocaleString()}</span></span>}
                  checked={selection.includes(s.name)} onChange={() => toggle(s.name)} />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold t-primary">Row-level diff {chosen.length === 2 && <span className="t-3 font-normal">· {added} added · {removed} removed · {changed} changed</span>}</h3>
          {chosen.length < 2 ? (
            <p className="mt-3 rounded-lg surface-2 p-5 text-sm t-3">Select two snapshots to compare. Added rows are green-tinted, removed rows red-tinted, and changed cells show old → new with the old value struck through.</p>
          ) : diff.length ? (
            <div className="mt-3 space-y-3 overflow-x-auto pb-1" style={{ minWidth: 0 }}>
              <div className="min-w-[440px] space-y-3">
                {diff.map((d, i) => (
                  <div key={d.id} className={cx('reveal-item rounded-lg hairline p-3', d.status === 'added' && 'diff-added', d.status === 'removed' && 'diff-removed', d.status === 'changed' && 'diff-changed')} style={{ animationDelay: `${Math.min(i, 12) * 55}ms` }}>
                    <Tag tone={d.status === 'added' ? 'green' : d.status === 'removed' ? 'red' : 'blue'}>{d.status}</Tag>
                    <span className="mono ml-2 text-xs t-3">{d.id}</span>
                    {d.changes?.map((c) => (
                      <div key={c.field} className="mt-2 grid grid-cols-[110px_1fr] gap-2 text-xs">
                        <strong className="t-2">{c.field}</strong>
                        <span className="min-w-0"><del className="diff-old">{String(c.oldVal)}</del><span className="mx-2 t-3" aria-hidden="true">→</span><ins className="diff-new">{String(c.newVal)}</ins></span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="mt-3 rounded-lg surface-2 p-5 text-sm text-[var(--ok)]">No row changes between these snapshots.</p>}
        </div>
      </div>
    </PanelShell>
  )
}

export function DuplicatePanel({ dataset }) {
  const scan = useStore((s) => s.duplicateScan)
  const run = useStore((s) => s.runDuplicateScan), dismiss = useStore((s) => s.dismissDuplicate)
  const setUi = useStore((s) => s.setUi)
  const labels = ['Scanning rows', 'Grouping matches', 'Done']
  const doneCount = scan.stages.filter((s) => s === 'complete').length
  const running = scan.status === 'running'
  return (
    <PanelShell title="Duplicate detection" subtitle="Find rows whose input field values are identical, then merge or dismiss each group." wide>
      <div className="border-b bd p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold t-primary">Scan progress · {running ? Math.round(((doneCount + 0.5) / 3) * 100) : scan.status === 'done' ? 100 : 0}%</div>
          <Btn size="sm" kind="outline" icon={Search} disabled={running} onClick={run}>{running ? 'Scanning…' : scan.status === 'done' ? 'Scan again' : 'Scan for duplicates'}</Btn>
        </div>
        <div className={cx('progress-track mt-4', running && 'shimmer-bar')}>
          <div className="progress-fill" style={{ width: `${running ? Math.max(14, (doneCount / 3) * 100) : scan.status === 'done' ? 100 : 0}%` }} />
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2" aria-live="polite">
          {labels.map((l, i) => (
            <li key={l} className={cx('stage-chip', scan.stages[i] === 'running' && 'stage-running', scan.stages[i] === 'complete' && 'stage-complete')}>
              <span className="block font-bold">{l}</span>
              <span className="stage-state flex items-center gap-1 capitalize">
                {scan.stages[i] === 'complete' && <Checkmark size={12} aria-hidden="true" />}
                {scan.stages[i]}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="p-5">
        <h3 className="text-sm font-bold t-primary">Duplicate groups · {scan.status === 'done' ? scan.groups.length : '…'}</h3>
        {scan.status === 'idle' && <p className="mt-4 rounded-lg surface-2 p-5 text-center text-sm t-3">Run the scan to inspect duplicate groups. Each stage advances from pending to running to complete.</p>}
        {running && <p className="mt-4 rounded-lg surface-2 p-5 text-center text-sm t-2" aria-live="polite">The scan is working through the dataset — stages advance above. You can keep using the app while it runs.</p>}
        {scan.status === 'done' && (scan.groups.length ? (
          <div className="mt-3 space-y-4">
            {scan.groups.map((g, i) => (
              <section key={g.id} className="reveal-item overflow-hidden rounded-lg hairline" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex flex-wrap items-center justify-between gap-2 surface-2 px-4 py-3">
                  <strong className="text-sm t-primary flex items-center gap-2"><GroupAccess size={16} aria-hidden="true" />Group {i + 1} · {g.rows.length} rows</strong>
                  <div className="flex gap-2">
                    <Btn size="sm" kind="ghost" onClick={() => { dismiss(g.id); useStore.getState().announce('Duplicate group dismissed') }}>Not duplicates</Btn>
                    <Btn size="sm" onClick={() => setUi({ modal: { type: 'merge', group: g } })}>Merge</Btn>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[520px] text-xs">
                    <thead><tr>{dataset.schema.map((f) => <th key={f.name} className="surface-3 p-2 text-left font-bold t-2">{f.name}</th>)}<th className="surface-3 p-2 text-left font-bold t-2">Expected output</th></tr></thead>
                    <tbody>{g.rows.map((r) => (
                      <tr key={r.id} className="border-t bd">{dataset.schema.map((f) => <td key={f.name} className="max-w-52 truncate p-2 t-primary" title={String(r.values[f.name])}>{String(r.values[f.name])}</td>)}<td className="max-w-52 truncate p-2 t-2" title={r.expectedOutput}>{r.expectedOutput}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState tone="ok" icon={CheckmarkOutline} title="No duplicate input groups found" body="Every row has distinct input field values. Nothing to merge." />
        ))}
      </div>
    </PanelShell>
  )
}

const importJsonSchema = z.object({ packageText: z.string().trim().min(1, 'Dataset Package JSON is required') })

export function ExportDrawer({ dataset }) {
  const tab = useStore((s) => s.exportTab)
  const setUi = useStore((s) => s.setUi)
  const getExport = useStore((s) => s.getExport)
  const importPackage = useStore((s) => s.importPackage)
  const notify = useStore((s) => s.notify)
  const output = getExport()
  const text = tab === 'csv' ? output.csv : output.json
  const [copied, setCopied] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({ resolver: zodResolver(importJsonSchema), defaultValues: { packageText: '' } })
  const copy = async () => {
    const label = tab === 'csv' ? 'Rows CSV' : 'Dataset Package JSON'
    try {
      if (tab === 'csv' && window.ClipboardItem) {
        const tableHtml = `<table><thead><tr>${output.csv.split('\n')[0].split(',').map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${output.csv.split('\n').slice(1).map((l) => `<tr>${l.split(',').map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([tableHtml], { type: 'text/html' }) })])
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch { await navigator.clipboard.writeText(text).catch(() => {}) }
    setCopied(true)
    notify(`${label} copied to clipboard`)
    setTimeout(() => setCopied(false), 1800)
  }
  const download = () => {
    const blob = new Blob([text], { type: tab === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = tab === 'csv' ? 'rows.csv' : 'dataset-package.json'; a.click()
    URL.revokeObjectURL(url)
    notify(`${tab === 'csv' ? 'rows.csv' : 'dataset-package.json'} download started`)
  }
  const print = () => window.print()
  const submitImport = ({ packageText }) => {
    const result = importPackage(packageText)
    if (result.error) return setError('packageText', { message: result.error })
    reset(); setImportOpen(false)
  }
  const file = async (event) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    const content = await chosen.text()
    const result = importPackage(content)
    if (result.error) { setImportOpen(true); setError('packageText', { message: result.error }); return }
    setImportOpen(false)
    event.target.value = ''
  }
  return (
    <PanelShell title="Export dataset package" subtitle="Live artifacts compiled from the selected dataset — session edits included." wide>
      <div className="sticky top-[73px] z-10 border-b bd surface px-5 pt-2">
        <div role="tablist" aria-label="Export formats" className="flex">
          <button role="tab" id="tab-csv" aria-selected={tab === 'csv'} aria-controls="export-panel" className="tab-btn" onClick={() => setUi({ exportTab: 'csv' })}>Rows CSV</button>
          <button role="tab" id="tab-json" aria-selected={tab === 'json'} aria-controls="export-panel" className="tab-btn" onClick={() => setUi({ exportTab: 'json' })}>Dataset Package JSON</button>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs t-3" aria-live="polite">{tab === 'csv' ? `${Math.max(0, output.csv.split('\n').length - 1)} visible rows · honors the unverified-only filter` : `schemaVersion dataset-manager.package/v1 · ${dataset.rows.length} rows · ${dataset.snapshots.length} snapshots · regenerated ${new Date(useStore.getState().exportGeneratedAt || Date.now()).toLocaleTimeString()}`}</p>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" kind="ghost" icon={copied ? Checkmark : Copy} onClick={copy} aria-live="polite">{copied ? 'Copied' : 'Copy'}</Btn>
            <Btn size="sm" kind="ghost" icon={Download} onClick={download}>Download</Btn>
            <Btn size="sm" kind="ghost" icon={Printer} onClick={print}>Print preview</Btn>
            <Btn size="sm" kind="outline" icon={Upload} onClick={() => setImportOpen((v) => !v)} aria-expanded={importOpen}>Import package</Btn>
          </div>
        </div>
        {importOpen && (
          <form className="step-enter mb-4 rounded-lg p-4 hairline" style={{ background: 'var(--brand-soft)', borderColor: 'var(--brand)' }} onSubmit={handleSubmit(submitImport, () => {})} noValidate>
            <TextAreaField id="package-json-input" rows={8} label="Paste Dataset Package JSON" required error={errors.packageText?.message} hint="Must conform to schemaVersion dataset-manager.package/v1. Invalid documents change nothing." {...register('packageText')} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Btn size="sm" type="submit">Import pasted package</Btn>
              <label className="flex cursor-pointer items-center gap-1 text-sm font-bold t-brand">Choose JSON file<input className="sr-only" type="file" accept=".json,application/json" onChange={file} /></label>
            </div>
          </form>
        )}
        <pre id="export-panel" role="tabpanel" aria-labelledby={tab === 'csv' ? 'tab-csv' : 'tab-json'} tabIndex={0} className="export-pre">{text}</pre>
      </div>
    </PanelShell>
  )
}
