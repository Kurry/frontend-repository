import React, { useEffect, useRef, useState } from 'react'
import { Button, Checkbox, Select, SelectItem, TextArea, TextInput } from '@carbon/react'
import { Add, Close, TrashCan } from '@carbon/icons-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { attachSchema, datasetCreateSchema, dynamicRowSchema, normalizeRowInput } from '../domain'
import { evalSuites, useStore } from '../store'

function ModalShell({ title, subtitle, children, onClose, wide = false }) {
  const card = useRef(null)
  const returnFocus = useRef(document.activeElement)
  useEffect(() => {
    const focusable = card.current?.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])')
    focusable?.focus()
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const nodes = [...card.current.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled)
        if (!nodes.length) return
        const first = nodes[0], last = nodes.at(-1)
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); returnFocus.current?.focus?.() }
  }, [onClose])
  return <div className="modal-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section ref={card} className={`modal-card ${wide ? 'max-w-4xl' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5"><div><h2 id="dialog-title" className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}</div><Button hasIconOnly kind="ghost" size="sm" iconDescription="Close dialog" renderIcon={Close} onClick={onClose}/></header>
      {children}
    </section>
  </div>
}

export function DatasetDialog() {
  const setUi = useStore((s) => s.setUi)
  const createDataset = useStore((s) => s.createDataset)
  const { control, register, handleSubmit, watch, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(datasetCreateSchema), mode: 'onChange',
    defaultValues: { name: '', description: '', schema: [{ name: '', type: 'text', allowedValues: [] }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'schema' })
  const schemaValues = watch('schema')
  const submitLock = useRef(false)
  const submit = (data) => { if (submitLock.current) return; submitLock.current = true; createDataset({ ...data, name: data.name.trim(), description: data.description.trim() }) }
  return <ModalShell title="New dataset" subtitle="Define the record contract used by every row mutation." onClose={() => setUi({ modal: null })} wide>
    <form onSubmit={handleSubmit(submit)}>
      <div className="space-y-5 p-5">
        <TextInput id="dataset-name" labelText="Dataset name" placeholder="e.g. Release candidate prompts" invalid={Boolean(errors.name)} invalidText={errors.name?.message} {...register('name')}/>
        <TextArea id="dataset-description" labelText="Description (optional)" placeholder="What is this dataset used to evaluate?" invalid={Boolean(errors.description)} invalidText={errors.description?.message} {...register('description')}/>
        <section aria-labelledby="schema-editor-title"><div className="flex items-center justify-between"><div><h3 id="schema-editor-title" className="font-semibold">Schema fields</h3><p className="text-xs text-slate-600">Names are unique and use letters, digits, or underscores.</p></div><Button type="button" size="sm" kind="tertiary" renderIcon={Add} onClick={() => append({ name: '', type: 'text', allowedValues: [] })}>Add field</Button></div>
          <div className="mt-3 space-y-3">{fields.map((field, i) => <div key={field.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_160px_1.4fr_40px]">
            <TextInput id={`schema-name-${i}`} labelText="Field name" invalid={Boolean(errors.schema?.[i]?.name)} invalidText={errors.schema?.[i]?.name?.message} {...register(`schema.${i}.name`)}/>
            <Select id={`schema-type-${i}`} labelText="Type" {...register(`schema.${i}.type`)}><SelectItem value="text" text="Text"/><SelectItem value="number" text="Number"/><SelectItem value="category" text="Category"/></Select>
            {schemaValues?.[i]?.type === 'category' ? <Controller name={`schema.${i}.allowedValues`} control={control} render={({ field: f }) => <TextInput id={`schema-values-${i}`} labelText="Allowed values (comma separated)" value={(f.value || []).join(', ')} onChange={(e) => f.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} invalid={Boolean(errors.schema?.[i]?.allowedValues)} invalidText={errors.schema?.[i]?.allowedValues?.message}/>} /> : <div className="self-end pb-3 text-xs text-slate-500">Allowed values: none</div>}
            <Button type="button" hasIconOnly kind="danger--ghost" size="sm" iconDescription="Remove schema field" renderIcon={TrashCan} disabled={fields.length === 1} onClick={() => remove(i)}/>
          </div>)}</div>
          {typeof errors.schema?.message === 'string' && <p className="error-text" role="alert">{errors.schema.message}</p>}
        </section>
      </div>
      <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-4"><Button type="button" kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Button><Button type="submit" disabled={!isValid || isSubmitting}>Create dataset</Button></footer>
    </form>
  </ModalShell>
}

export function RowDialog({ dataset, mode, rowId }) {
  const setUi = useStore((s) => s.setUi)
  const addRow = useStore((s) => s.addRow), updateRow = useStore((s) => s.updateRow)
  const current = dataset.rows.find((r) => r.id === rowId)
  const defaults = current ? { values: current.values, expectedOutput: current.expectedOutput, verified: current.verified, split: current.split } : { values: Object.fromEntries(dataset.schema.map((f) => [f.name, ''])), expectedOutput: '', verified: false, split: undefined }
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm({ resolver: zodResolver(dynamicRowSchema(dataset.schema)), mode: 'onChange', defaultValues: defaults })
  const lock = useRef(false)
  const submit = (data) => {
    if (lock.current) return; lock.current = true
    const normalized = normalizeRowInput(dataset.schema, data)
    if (mode === 'edit') updateRow(rowId, normalized); else addRow(normalized)
    setUi({ modal: null })
  }
  return <ModalShell title={mode === 'edit' ? 'Edit row' : 'Add row'} subtitle={`Values are validated against ${dataset.name}’s schema.`} onClose={() => setUi({ modal: null })}>
    <form onSubmit={handleSubmit(submit)}>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {dataset.schema.map((field) => <div key={field.name} className={field.type === 'text' ? 'sm:col-span-2' : ''}>
          {field.type === 'category' ? <Select id={`row-${field.name}`} labelText={`${field.name} (${field.type})`} invalid={Boolean(errors.values?.[field.name])} invalidText={errors.values?.[field.name]?.message} {...register(`values.${field.name}`)}><SelectItem value="" text="Choose a value"/>{field.allowedValues.map((v) => <SelectItem key={v} value={v} text={v}/>)}</Select> : <TextInput id={`row-${field.name}`} type="text" inputMode={field.type === 'number' ? 'decimal' : undefined} labelText={`${field.name} (${field.type})`} invalid={Boolean(errors.values?.[field.name])} invalidText={errors.values?.[field.name]?.message} {...register(`values.${field.name}`)}/>} 
        </div>)}
        <div className="sm:col-span-2"><TextArea id="row-expected" labelText="Expected output" invalid={Boolean(errors.expectedOutput)} invalidText={errors.expectedOutput?.message} {...register('expectedOutput')}/></div>
        <Checkbox id="row-verified" labelText="Verified ground truth" {...register('verified')}/>
        <Select id="row-split" labelText="Split (optional)" {...register('split')}><SelectItem value="" text="Unassigned"/><SelectItem value="train" text="Train"/><SelectItem value="validation" text="Validation"/><SelectItem value="test" text="Test"/></Select>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button type="button" kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{mode === "edit" ? "Save changes" : "Add row"}</Button></footer>
    </form>
  </ModalShell>
}

export function ConfirmDialog({ title, detail, confirmLabel, onConfirm }) {
  const setUi = useStore((s) => s.setUi)
  return <ModalShell title={title} subtitle={detail} onClose={() => setUi({ modal: null })}>
    <div className="p-5 text-sm text-slate-700">This operation changes the live dataset and all derived views.</div>
    <footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Button><Button kind="danger" onClick={onConfirm}>{confirmLabel}</Button></footer>
  </ModalShell>
}

export function AttachDialog({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  const attachSuite = useStore((s) => s.attachSuite)
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({ resolver: zodResolver(attachSchema), mode: 'onChange', defaultValues: { suiteId: dataset.attachedSuiteId || '' } })
  const submit = ({ suiteId }) => { attachSuite(suiteId); setUi({ modal: null }) }
  return <ModalShell title="Use in eval suite" subtitle="Attach this dataset to a seeded evaluation suite." onClose={() => setUi({ modal: null })}>
    <form onSubmit={handleSubmit(submit)}><div className="p-5"><Select id="suite-select" labelText="Eval suite" invalid={Boolean(errors.suiteId)} invalidText={errors.suiteId?.message} {...register('suiteId')}><SelectItem value="" text="Choose a suite"/>{evalSuites.map((s) => <SelectItem key={s.id} value={s.id} text={s.name}/>)}</Select></div><footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button type="button" kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Button><Button type="submit" disabled={!isValid}>Attach dataset</Button></footer></form>
  </ModalShell>
}

export function MergeDialog({ dataset, group }) {
  const setUi = useStore((s) => s.setUi)
  const merge = useStore((s) => s.mergeDuplicate)
  const [survivor, setSurvivor] = useState(() => ({ values: { ...group.rows[0].values }, expectedOutput: group.rows[0].expectedOutput, verified: group.rows[0].verified, split: group.rows[0].split }))
  const choice = (label, key, values, read = (v) => v, write = (v) => v) => <div><label className="field-label" htmlFor={`merge-${key}`}>{label}</label><select id={`merge-${key}`} className="native-input" value={JSON.stringify(read(survivor[key]))} onChange={(e) => setSurvivor((s) => ({ ...s, [key]: write(JSON.parse(e.target.value)) }))}>{values.map((v) => <option key={JSON.stringify(v)} value={JSON.stringify(v)}>{String(v ?? 'Unassigned')}</option>)}</select>{values.length === 1 && <p className="mt-1 text-xs text-slate-500">All members agree.</p>}</div>
  return <ModalShell title={`Merge ${group.rows.length} duplicate rows`} subtitle="Pick the surviving value for fields where members differ." onClose={() => setUi({ modal: null })} wide>
    <div className="space-y-4 p-5">{dataset.schema.map((field) => {
      const choices = [...new Map(group.rows.map((r) => [JSON.stringify(r.values[field.name]), r.values[field.name]])).values()]
      return <div key={field.name}><label className="field-label" htmlFor={`merge-${field.name}`}>{field.name}</label><select id={`merge-${field.name}`} className="native-input" value={JSON.stringify(survivor.values[field.name])} onChange={(e) => setSurvivor((s) => ({ ...s, values: { ...s.values, [field.name]: JSON.parse(e.target.value) } }))}>{choices.map((v) => <option key={JSON.stringify(v)} value={JSON.stringify(v)}>{String(v)}</option>)}</select>{choices.length === 1 && <p className="mt-1 text-xs text-slate-500">All members agree.</p>}</div>
    })}{choice('Expected output', 'expectedOutput', [...new Set(group.rows.map((r) => r.expectedOutput))])}{choice('Verified', 'verified', [...new Set(group.rows.map((r) => r.verified))])}{choice('Split', 'split', [...new Set(group.rows.map((r) => r.split || ''))])}</div>
    <footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Button><Button onClick={() => merge(group.id, survivor)}>Merge into one row</Button></footer>
  </ModalShell>
}
