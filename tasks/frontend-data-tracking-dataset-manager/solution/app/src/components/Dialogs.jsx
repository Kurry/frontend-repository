import React, { useRef, useState } from 'react'
import { Add, Checkmark, TrashCan } from '@carbon/icons-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { attachSchema, datasetCreateSchema, dynamicRowSchema, normalizeRowInput } from '../domain'
import { evalSuites, useStore } from '../store'
import { Btn, Chk, ModalShell, SelectField, TextAreaField, TextField, cx } from '../ui'

export function DatasetDialog() {
  const setUi = useStore((s) => s.setUi)
  const createDataset = useStore((s) => s.createDataset)
  const { control, register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(datasetCreateSchema), mode: 'onChange', reValidateMode: 'onChange',
    defaultValues: { name: '', description: '', schema: [{ name: '', type: 'text', allowedValues: [] }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'schema' })
  const schemaValues = watch('schema')
  const submitLock = useRef(false)
  const submit = (data) => { if (submitLock.current) return; submitLock.current = true; createDataset({ ...data, name: data.name.trim(), description: (data.description || '').trim() }) }
  const attempt = handleSubmit(submit, () => {})
  return (
    <ModalShell title="New dataset" subtitle="Define the record contract used by every row mutation." onClose={() => setUi({ modal: null })} wide
      footer={<><Btn kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Btn><Btn type="submit" form="dataset-form" disabled={isSubmitting}>Create dataset</Btn></>}>
      <form id="dataset-form" onSubmit={attempt} noValidate>
        <div className="space-y-5 p-5">
          <TextField id="dataset-name" label="Dataset name" required placeholder="e.g. Release candidate prompts" error={errors.name?.message} {...register('name')} />
          <TextAreaField id="dataset-description" label="Description (optional)" placeholder="What is this dataset used to evaluate?" error={errors.description?.message} {...register('description')} />
          <section aria-labelledby="schema-editor-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 id="schema-editor-title" className="text-base font-bold t-primary">Schema fields</h3><p className="text-xs t-3">Names are unique and use letters, digits, or underscores only.</p></div>
              <Btn kind="outline" size="sm" icon={Add} onClick={() => append({ name: '', type: 'text', allowedValues: [] })}>Add field</Btn>
            </div>
            <div className="mt-3 space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="surface-2 hairline grid gap-3 rounded-lg p-3 md:grid-cols-[1fr_150px_1.4fr_40px]">
                  <TextField id={`schema-name-${i}`} label="Field name" required error={errors.schema?.[i]?.name?.message} placeholder="e.g. prompt" {...register(`schema.${i}.name`)} />
                  <SelectField id={`schema-type-${i}`} label="Type" {...register(`schema.${i}.type`)}>
                    <option value="text">text</option><option value="number">number</option><option value="category">category</option>
                  </SelectField>
                  {schemaValues?.[i]?.type === 'category' ? (
                    <Controller name={`schema.${i}.allowedValues`} control={control} render={({ field: f }) => (
                      <TextField id={`schema-values-${i}`} label="Allowed values (comma separated)" required placeholder="e.g. Low, Medium, High"
                        value={(f.value || []).join(', ')} onChange={(e) => f.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
                        error={typeof errors.schema?.[i]?.allowedValues?.message === 'string' ? errors.schema[i].allowedValues.message : errors.schema?.[i]?.allowedValues?.[0]?.message} />
                    )} />
                  ) : <div className="self-end pb-2 text-xs t-3">Allowed values: none for this type</div>}
                  <div className="self-end">
                    <Btn kind="danger-ghost" size="sm" icon={TrashCan} iconOnly aria-label={`Remove schema field ${i + 1}`} disabled={fields.length === 1} onClick={() => remove(i)} />
                  </div>
                </div>
              ))}
            </div>
            {typeof errors.schema?.message === 'string' && <p className="error-text" role="alert">{errors.schema.message}</p>}
          </section>
        </div>
      </form>
    </ModalShell>
  )
}

export function RowDialog({ dataset, mode, rowId }) {
  const setUi = useStore((s) => s.setUi)
  const addRow = useStore((s) => s.addRow), updateRow = useStore((s) => s.updateRow)
  const current = dataset.rows.find((r) => r.id === rowId)
  const defaults = current
    ? { values: { ...current.values }, expectedOutput: current.expectedOutput, verified: current.verified, split: current.split || '' }
    : { values: Object.fromEntries(dataset.schema.map((f) => [f.name, ''])), expectedOutput: '', verified: false, split: '' }
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(dynamicRowSchema(dataset.schema)), mode: 'onChange', defaultValues: defaults,
  })
  const lock = useRef(false)
  const submit = (data) => {
    if (lock.current) return; lock.current = true
    const normalized = normalizeRowInput(dataset.schema, data)
    if (mode === 'edit') updateRow(rowId, normalized); else addRow(normalized)
    setUi({ modal: null })
  }
  return (
    <ModalShell title={mode === 'edit' ? 'Edit row' : 'Add row'} subtitle={`Values are validated against ${dataset.name}’s record contract.`}
      onClose={() => setUi({ modal: null })}
      footer={<><Btn kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Btn><Btn type="submit" form="row-form" disabled={isSubmitting || lock.current}>{mode === 'edit' ? 'Save changes' : 'Add row'}</Btn></>}>
      <form id="row-form" onSubmit={handleSubmit(submit, () => {})} noValidate>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {dataset.schema.map((field) => (
            <div key={field.name} className={field.type === 'text' ? 'sm:col-span-2' : ''}>
              {field.type === 'category' ? (
                <SelectField id={`row-${field.name}`} label={`${field.name} (category)`} required error={errors.values?.[field.name]?.message} {...register(`values.${field.name}`)}>
                  <option value="">Choose a value</option>
                  {field.allowedValues.map((v) => <option key={v} value={v}>{v}</option>)}
                </SelectField>
              ) : (
                <TextField id={`row-${field.name}`} label={`${field.name} (${field.type})`} required inputMode={field.type === 'number' ? 'decimal' : undefined}
                  error={errors.values?.[field.name]?.message} placeholder={field.type === 'number' ? 'e.g. 8.5' : ''} {...register(`values.${field.name}`)} />
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <TextAreaField id="row-expected" label="Expected output" error={errors.expectedOutput?.message} hint="At most 4000 characters." {...register('expectedOutput')} />
          </div>
          <label className="chk">
            <input type="checkbox" {...register('verified')} />
            <span className="chk-box" aria-hidden="true"><Checkmark size={12} /></span>
            <span className="text-[13px] font-semibold t-2">Verified ground truth</span>
          </label>
          <SelectField id="row-split" label="Split (optional)" {...register('split')}>
            <option value="">Unassigned</option><option value="train">train</option><option value="validation">validation</option><option value="test">test</option>
          </SelectField>
        </div>
      </form>
    </ModalShell>
  )
}

export function ConfirmDialog({ title, detail, confirmLabel = 'Delete', onConfirm }) {
  const setUi = useStore((s) => s.setUi)
  return (
    <ModalShell title={title} subtitle={detail} onClose={() => setUi({ modal: null })}
      footer={<><Btn kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Btn><Btn kind="danger" onClick={onConfirm}>{confirmLabel}</Btn></>}>
      <p className="p-5 text-sm t-2">This operation changes the live dataset and every derived view. You can restore it with Undo (Ctrl+Z).</p>
    </ModalShell>
  )
}

export function AttachDialog({ dataset }) {
  const setUi = useStore((s) => s.setUi)
  const attachSuite = useStore((s) => s.attachSuite)
  const [suiteId, setSuiteId] = useState(dataset.attachedSuiteId || '')
  const submit = () => { attachSuite(suiteId); setUi({ modal: null }) }
  return (
    <ModalShell title="Use in eval suite" subtitle={`Attach this dataset to one of the ${evalSuites.length} seeded evaluation suites.`}
      onClose={() => setUi({ modal: null })}
      footer={<><Btn kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Btn><Btn disabled={!suiteId} onClick={submit}>Attach dataset</Btn></>}>
      <fieldset className="p-5">
        <legend className="field-label">Eval suite ({evalSuites.length} seeded)</legend>
        <div className="space-y-2" role="radiogroup" aria-label="Eval suite">
          {evalSuites.map((s) => (
            <label key={s.id} className={cx('flex cursor-pointer items-center gap-3 rounded-lg hairline p-3 transition hover:bg-[var(--surface-2)]', suiteId === s.id && 'border-[var(--brand)] bg-[var(--brand-soft)]')}>
              <input type="radio" name="suite" value={s.id} checked={suiteId === s.id} onChange={() => setSuiteId(s.id)} className="sr-only" aria-label={s.name} />
              <span className={cx('grid h-5 w-5 flex-none place-items-center rounded-full border-2', suiteId === s.id ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--border-strong)] bg-[var(--surface)]')}>
                {suiteId === s.id && <Checkmark size={12} />}
              </span>
              <span className="min-w-0"><strong className="block text-sm t-primary">{s.name}</strong><span className="text-xs t-3">{s.detail}</span></span>
            </label>
          ))}
        </div>
        {!suiteId && <p className="hint-text">Choose a suite to enable Attach.</p>}
      </fieldset>
    </ModalShell>
  )
}

export function MergeDialog({ dataset, group }) {
  const setUi = useStore((s) => s.setUi)
  const merge = useStore((s) => s.mergeDuplicate)
  const [survivor, setSurvivor] = useState(() => ({ values: { ...group.rows[0].values }, expectedOutput: group.rows[0].expectedOutput, verified: group.rows[0].verified, split: group.rows[0].split || '' }))
  const pick = (label, key, values, get, setFn) => (
    <div>
      <label className="field-label" htmlFor={`merge-${key}`}>{label}{values.length > 1 && <span className="tag tag-warn">{values.length} different</span>}</label>
      <select id={`merge-${key}`} className="input" value={JSON.stringify(get())} onChange={(e) => setFn(JSON.parse(e.target.value))}>
        {values.map((v) => <option key={JSON.stringify(v)} value={JSON.stringify(v)}>{v === '' ? 'Unassigned' : String(v)}</option>)}
      </select>
      {values.length === 1 && <p className="hint-text">All members agree.</p>}
    </div>
  )
  return (
    <ModalShell title={`Merge ${group.rows.length} duplicate rows`} subtitle="Pick the surviving value for each field where members differ. The merged row keeps the first member’s id." onClose={() => setUi({ modal: null })} wide
      footer={<><Btn kind="secondary" onClick={() => setUi({ modal: null })}>Cancel</Btn><Btn onClick={() => merge(group.id, survivor)}>Merge into one row</Btn></>}>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {dataset.schema.map((field) => {
          const choices = [...new Map(group.rows.map((r) => [JSON.stringify(r.values[field.name]), r.values[field.name]])).values()]
          return <div key={field.name}>{pick(`${field.name} (${field.type})`, field.name, choices, () => survivor.values[field.name], (v) => setSurvivor((s) => ({ ...s, values: { ...s.values, [field.name]: v } })))}</div>
        })}
        {pick('Expected output', 'expectedOutput', [...new Set(group.rows.map((r) => r.expectedOutput))], () => survivor.expectedOutput, (v) => setSurvivor((s) => ({ ...s, expectedOutput: v })))}
        {pick('Verified', 'verified', [...new Set(group.rows.map((r) => r.verified))], () => survivor.verified, (v) => setSurvivor((s) => ({ ...s, verified: v })))}
        {pick('Split', 'split', [...new Set(group.rows.map((r) => r.split || ''))], () => survivor.split, (v) => setSurvivor((s) => ({ ...s, split: v })))}
      </div>
    </ModalShell>
  )
}
