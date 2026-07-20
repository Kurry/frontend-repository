import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, InlineNotification, Select, SelectItem, Tag, TextArea, TextInput } from '@carbon/react'
import { Checkmark, Close, Copy, Download, Edit, Flag, Save, TrashCan, Upload } from '@carbon/icons-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { snapshotDiff, snapshotSchema, splitSchema, thresholdSchema } from '../domain'
import { useStore } from '../store'

function PanelShell({ title, subtitle, children, wide = false }) {
  const setUi = useStore((s) => s.setUi)
  const sheet = useRef(null)
  const returnFocus = useRef(document.activeElement)
  useEffect(() => {
    sheet.current?.querySelector('button, input, select, textarea')?.focus()
    const key = (e) => {
      if (e.key === 'Escape') setUi({ panel: null })
      if (e.key === 'Tab') {
        const nodes = [...sheet.current.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled)
        if (!nodes.length) return
        if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1).focus() }
        else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); returnFocus.current?.focus?.() }
  }, [setUi])
  return <div className="panel-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setUi({ panel: null }) }}>
    <aside ref={sheet} className={`panel-sheet side-panel ${wide ? '!w-[min(760px,100vw)]' : ''}`} role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <header className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-200 bg-white p-5"><div><h2 id="panel-title" className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}</div><Button hasIconOnly kind="ghost" size="sm" iconDescription="Close panel" renderIcon={Close} onClick={() => setUi({ panel: null })}/></header>
      {children}
    </aside>
  </div>
}

export function ThresholdPanel({ dataset }) {
  const addThreshold = useStore((s) => s.addThreshold), deleteThreshold = useStore((s) => s.deleteThreshold)
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(thresholdSchema), mode: 'onChange', defaultValues: { column: '', comparator: 'above', cap: '' } })
  const numeric = dataset.schema.filter((f) => f.type === 'number')
  const submit = (data) => { addThreshold(data); reset() }
  return <PanelShell title="Threshold alerts" subtitle="Flag rows whose numeric values cross an active rule.">
    <form className="border-b border-slate-200 p-5" onSubmit={handleSubmit(submit)}><div className="grid gap-4 sm:grid-cols-2"><Select id="threshold-column" labelText="Numeric column" invalid={Boolean(errors.column)} invalidText={errors.column?.message} {...register('column')}><SelectItem value="" text="Choose column"/>{numeric.map((f) => <SelectItem key={f.name} value={f.name} text={f.name}/>)}</Select><Select id="threshold-comparator" labelText="Comparator" invalid={Boolean(errors.comparator)} invalidText={errors.comparator?.message} {...register('comparator')}><SelectItem value="above" text="Above"/><SelectItem value="below" text="Below"/></Select><div className="sm:col-span-2"><TextInput id="threshold-cap" type="text" inputMode="decimal" labelText="Cap" invalid={Boolean(errors.cap)} invalidText={errors.cap?.message} {...register('cap')}/></div></div><Button className="mt-4" type="submit" size="sm" disabled={!isValid}>Add threshold rule</Button></form>
    <div className="p-5"><h3 className="text-sm font-semibold">Active rules · {dataset.thresholdRules.length}</h3><div className="mt-3 space-y-2">{dataset.thresholdRules.length ? dataset.thresholdRules.map((r) => <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"><div className="flex items-center gap-2"><Flag size={16} className="text-amber-700"/><span className="text-sm"><strong>{r.column}</strong> {r.comparator} {r.cap}</span></div><Button hasIconOnly kind="danger--ghost" size="sm" iconDescription="Delete threshold rule" renderIcon={TrashCan} onClick={() => deleteThreshold(r.id)}/></div>) : <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No active threshold rules.</p>}</div></div>
  </PanelShell>
}

export function SplitPanel({ dataset }) {
  const applySplits = useStore((s) => s.applySplits)
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(splitSchema), mode: 'onChange', defaultValues: dataset.splitPercentages })
  const values = watch(), total = Number(values.train || 0) + Number(values.validation || 0) + Number(values.test || 0)
  const counts = Object.fromEntries(['train','validation','test'].map((split) => [split, dataset.rows.filter((r) => r.split === split)]))
  return <PanelShell title="Split management" subtitle="Apply deterministic train, validation, and test assignments.">
    <form className="border-b border-slate-200 p-5" onSubmit={handleSubmit(applySplits)}><div className="grid grid-cols-3 gap-3">{['train','validation','test'].map((s) => <TextInput key={s} id={`split-${s}`} type="number" min="0" max="100" labelText={`${s[0].toUpperCase()+s.slice(1)} %`} invalid={Boolean(errors[s])} invalidText={errors[s]?.message} {...register(s)}/>)}</div><p className={`mt-3 text-sm ${total === 100 ? 'text-green-700' : 'text-red-600'}`}>Percentages total: {total}% {total !== 100 && '— must total exactly 100%'}</p>{errors.root && <p className="error-text" role="alert">{errors.root.message}</p>}<Button className="mt-4" type="submit" size="sm" disabled={!isValid}>Apply split</Button></form>
    <div className="p-5"><h3 className="text-sm font-semibold">Actual assigned distribution</h3><div className="mt-3 flex h-5 overflow-hidden rounded-full bg-slate-200" aria-label="Split distribution">{['train','validation','test'].map((s) => <div key={s} className={s === 'train' ? 'bg-blue-600' : s === 'validation' ? 'bg-violet-600' : 'bg-teal-600'} style={{ width: `${dataset.rows.length ? counts[s].length / dataset.rows.length * 100 : 0}%` }} title={`${s}: ${counts[s].length}`}/>)}</div><div className="mt-4 space-y-2">{['train','validation','test'].map((s) => <div key={s} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"><strong className="capitalize">{s}</strong><span>{counts[s].filter((r) => r.verified).length} verified</span><span className="text-slate-500">{counts[s].filter((r) => !r.verified).length} unverified</span></div>)}</div></div>
  </PanelShell>
}

export function SnapshotPanel({ dataset }) {
  const saveSnapshot = useStore((s) => s.saveSnapshot)
  const selection = useStore((s) => s.snapshotSelection)
  const setUi = useStore((s) => s.setUi)
  const { register, handleSubmit, setError, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(snapshotSchema), mode: 'onChange', defaultValues: { name: '' } })
  const submit = ({ name }) => {
    if (dataset.snapshots.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) return setError('name', { message: 'Snapshot name must be unique for this dataset' })
    saveSnapshot(name.trim()); reset()
  }
  const toggle = (name) => setUi({ snapshotSelection: selection.includes(name) ? selection.filter((v) => v !== name) : selection.length < 2 ? [...selection, name] : [selection[1], name] })
  const chosen = selection.map((n) => dataset.snapshots.find((s) => s.name === n)).filter(Boolean).sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt))
  const diff = useMemo(() => chosen.length === 2 ? snapshotDiff(chosen[0], chosen[1], dataset.schema) : [], [chosen, dataset.schema])
  return <PanelShell title="Snapshots & diff" subtitle="Capture the live rows, then compare any two snapshots." wide>
    <form className="flex items-end gap-2 border-b border-slate-200 p-5" onSubmit={handleSubmit(submit)}><div className="flex-1"><TextInput id="snapshot-name" labelText="Snapshot name" placeholder="e.g. Before score cleanup" invalid={Boolean(errors.name)} invalidText={errors.name?.message} {...register('name')}/></div><Button type="submit" size="sm" renderIcon={Save} disabled={!isValid}>Save snapshot</Button></form>
    <div className="grid gap-5 p-5 md:grid-cols-[240px_1fr]"><div><h3 className="text-sm font-semibold">Saved snapshots · {dataset.snapshots.length}</h3><div className="mt-3 space-y-2">{dataset.snapshots.map((s) => <label key={s.name} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"><Checkbox id={`snapshot-${s.name}`} hideLabel labelText={`Select ${s.name}`} checked={selection.includes(s.name)} onChange={() => toggle(s.name)}/><span><strong className="block text-sm">{s.name}</strong><span className="text-xs text-slate-500">{s.rows.length} rows · {new Date(s.createdAt).toLocaleString()}</span></span></label>)}</div></div>
      <div><h3 className="text-sm font-semibold">Row-level diff</h3>{chosen.length < 2 ? <p className="mt-3 rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Select two snapshots to compare.</p> : diff.length ? <div className="mt-3 space-y-3">{diff.map((d) => <div key={d.id} className={`rounded-lg border p-3 ${d.status === 'added' ? 'border-green-300 bg-green-50' : d.status === 'removed' ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}><Tag type={d.status === 'added' ? 'green' : d.status === 'removed' ? 'red' : 'blue'}>{d.status}</Tag><span className="ml-2 font-mono text-xs">{d.id}</span>{d.changes?.map((c) => <div key={c.field} className="mt-2 grid grid-cols-[110px_1fr] gap-2 text-xs"><strong>{c.field}</strong><span><del className="text-red-700">{String(c.oldVal)}</del><span className="mx-2">→</span><ins className="text-green-800 no-underline">{String(c.newVal)}</ins></span></div>)}</div>)}</div> : <p className="mt-3 rounded-lg bg-green-50 p-5 text-sm text-green-800">No row changes between these snapshots.</p>}</div></div>
  </PanelShell>
}

export function DuplicatePanel({ dataset }) {
  const scan = useStore((s) => s.duplicateScan)
  const run = useStore((s) => s.runDuplicateScan), dismiss = useStore((s) => s.dismissDuplicate)
  const setUi = useStore((s) => s.setUi)
  const labels = ['Scanning rows', 'Grouping matches', 'Done']
  const doneCount = scan.stages.filter((s) => s === 'complete').length
  return <PanelShell title="Duplicate detection" subtitle="Find rows with identical input field values." wide>
    <div className="border-b border-slate-200 p-5"><div className="flex items-center justify-between"><div className="text-sm font-semibold">Scan progress · {Math.round(doneCount / 3 * 100)}%</div><Button size="sm" kind="tertiary" renderIcon={SearchIcon} disabled={scan.status === 'running'} onClick={run}>{scan.status === 'running' ? 'Scanning…' : 'Scan again'}</Button></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${scan.status === 'running' ? Math.max(12, doneCount / 3 * 100) : scan.status === 'done' ? 100 : 0}%` }}/></div><ol className="mt-4 grid grid-cols-3 gap-2">{labels.map((l,i) => <li key={l} className={`rounded-lg border p-3 text-xs ${scan.stages[i] === 'running' ? 'scan-running border-blue-500 bg-blue-50' : scan.stages[i] === 'complete' ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}><span className="block font-semibold">{l}</span><span className="capitalize text-slate-500">{scan.stages[i]}</span></li>)}</ol></div>
    <div className="p-5"><h3 className="text-sm font-semibold">Duplicate groups · {scan.groups.length}</h3>{scan.status !== 'done' ? <p className="mt-4 text-sm text-slate-500">The scan is working through the dataset.</p> : scan.groups.length ? <div className="mt-3 space-y-4">{scan.groups.map((g, i) => <section key={g.id} className="overflow-hidden rounded-lg border border-slate-200"><div className="flex items-center justify-between bg-slate-50 px-4 py-3"><strong className="text-sm">Group {i + 1} · {g.rows.length} rows</strong><div className="flex gap-2"><Button size="sm" kind="ghost" onClick={() => dismiss(g.id)}>Not duplicates</Button><Button size="sm" onClick={() => setUi({ modal: { type: 'merge', group: g } })}>Merge</Button></div></div><div className="overflow-auto"><table className="w-full text-xs"><thead><tr>{dataset.schema.map((f) => <th key={f.name} className="bg-slate-100 p-2 text-left">{f.name}</th>)}<th className="bg-slate-100 p-2 text-left">Expected output</th></tr></thead><tbody>{g.rows.map((r) => <tr key={r.id} className="border-t border-slate-200">{dataset.schema.map((f) => <td key={f.name} className="max-w-48 truncate p-2">{r.values[f.name]}</td>)}<td className="max-w-48 truncate p-2">{r.expectedOutput}</td></tr>)}</tbody></table></div></section>)}</div> : <p className="mt-4 rounded-lg bg-green-50 p-5 text-center text-sm text-green-800">No duplicate input groups found.</p>}</div>
  </PanelShell>
}

function SearchIcon(props) { return <Flag {...props}/> }

const importJsonSchema = z.object({ packageText: z.string().trim().min(1, 'Dataset Package JSON is required') })

export function ExportDrawer({ dataset }) {
  const tab = useStore((s) => s.exportTab)
  const setUi = useStore((s) => s.setUi)
  const getExport = useStore((s) => s.getExport)
  const importPackage = useStore((s) => s.importPackage)
  const output = getExport()
  const text = tab === 'csv' ? output.csv : output.json
  const [copied, setCopied] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(importJsonSchema), defaultValues: { packageText: '' } })
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); useStore.getState().notify(`${tab === 'csv' ? 'Rows CSV' : 'Dataset Package JSON'} copied`); setTimeout(() => setCopied(false), 1800) }
  const download = () => { const blob = new Blob([text], { type: tab === 'csv' ? 'text/csv' : 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = tab === 'csv' ? 'rows.csv' : 'dataset-package.json'; a.click(); URL.revokeObjectURL(url) }
  const submitImport = ({ packageText }) => { const result = importPackage(packageText); if (result.error) return setError('packageText', { message: result.error }); reset(); setImportOpen(false) }
  const file = async (event) => { const chosen = event.target.files?.[0]; if (!chosen) return; const content = await chosen.text(); const result = importPackage(content); if (result.error) { setImportOpen(true); setError('packageText', { message: result.error }); return } setImportOpen(false) }
  return <PanelShell title="Export dataset package" subtitle="Live artifacts compiled from the selected dataset." wide>
    <div className="sticky top-[85px] z-10 border-b border-slate-200 bg-white px-5 pt-4"><div role="tablist" aria-label="Export formats" className="flex"><button role="tab" aria-selected={tab === 'csv'} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'csv' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`} onClick={() => setUi({ exportTab: 'csv' })}>Rows CSV</button><button role="tab" aria-selected={tab === 'json'} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'json' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`} onClick={() => setUi({ exportTab: 'json' })}>Dataset Package JSON</button></div></div>
    <div className="p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{tab === 'csv' ? `${output.csv.split('\n').length - 1} visible rows` : `Schema v1 · ${dataset.rows.length} rows · ${dataset.snapshots.length} snapshots`}</p><div className="flex gap-2"><Button size="sm" kind="ghost" renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button><Button size="sm" kind="ghost" renderIcon={Download} onClick={download}>Download</Button><Button size="sm" kind="tertiary" renderIcon={Upload} onClick={() => setImportOpen((v) => !v)}>Import package</Button></div></div>
      {importOpen && <form className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4" onSubmit={handleSubmit(submitImport)}><TextArea id="package-json-input" rows={8} labelText="Paste Dataset Package JSON" invalid={Boolean(errors.packageText)} invalidText={errors.packageText?.message} {...register('packageText')}/><div className="mt-3 flex flex-wrap items-center gap-2"><Button size="sm" type="submit" disabled={isSubmitting}>Import pasted package</Button><label className="cursor-pointer text-sm font-semibold text-blue-700 underline">Choose JSON file<input className="sr-only" type="file" accept=".json,application/json" onChange={file}/></label></div></form>}
      <pre className="max-h-[calc(100vh-240px)] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100" role="tabpanel" tabIndex="0">{text}</pre>
    </div>
  </PanelShell>
}
