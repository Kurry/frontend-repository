import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Select,
  SelectItem,
  TextArea,
  TextInput,
  Toggle,
} from '@carbon/react'
import { Add, ArrowRight, Reset, TrashCan } from '@carbon/icons-react'
import { assemblePrompt, clone, formSchemas, techniqueById } from '../domain'
import { useStudioStore } from '../store'
import AttachmentsField from './AttachmentsField'

const requiredMark = <span className="required-mark" aria-hidden="true">*</span>

function Label({ children, required = false }) {
  return <>{children}{required && requiredMark}</>
}

function CharacterCount({ value }) {
  return <span className="character-count" aria-label={`${value?.length || 0} characters`}>{value?.length || 0} characters</span>
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="form-section">
      <div className="section-intro">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="section-fields">{children}</div>
    </section>
  )
}

const DynamicRow = memo(function DynamicRow({ index, title, onRemove, children }) {
  return (
    <div className="dynamic-row">
      <div className="dynamic-row__header">
        <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
        <strong>{title}</strong>
        <Button
          type="button"
          kind="ghost"
          size="sm"
          renderIcon={(props) => <TrashCan {...props} aria-hidden="true" />}
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
        >
          Remove
        </Button>
      </div>
      <div className="dynamic-row__body">{children}</div>
    </div>
  )
})

function TextAreaField({ idPrefix, name, label, required, register, errors, watch, placeholder, rows = 5 }) {
  const error = errors[name]
  const value = watch(name)
  const [parent] = useAutoAnimate()
  const fieldId = `${idPrefix}-${name}`
  const countId = `${fieldId}-count`
  const errorId = `${fieldId}-error`
  const describedBy = error ? `${countId} ${errorId}` : countId
  return (
    <div className="field-stack" ref={parent}>
      <TextArea
        labelText={<Label required={required}>{label}</Label>}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-required={required}
        invalid={Boolean(error)}
        invalidText={error?.message}
        {...register(name)}
        id={fieldId}
        aria-describedby={describedBy}
        aria-errormessage={error ? errorId : undefined}
      />
      <span id={countId}><CharacterCount value={value} /></span>
      {error?.message ? <span id={errorId} className="sr-only">{error.message}</span> : null}
    </div>
  )
}

function TextField({ idPrefix, name, label, required, register, errors, placeholder }) {
  const error = name.split('.').reduce((current, part) => current?.[part], errors)
  const [parent] = useAutoAnimate()
  const fieldId = `${idPrefix}-${name.replaceAll('.', '-')}`
  const errorId = `${fieldId}-error`
  return (
    <div className="field-stack" ref={parent}>
      <TextInput
        labelText={<Label required={required}>{label}</Label>}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        invalid={Boolean(error)}
        invalidText={error?.message}
        {...register(name)}
        id={fieldId}
        aria-describedby={error ? errorId : undefined}
        aria-errormessage={error ? errorId : undefined}
      />
      {error?.message ? <span id={errorId} className="sr-only">{error.message}</span> : null}
    </div>
  )
}

function SelectField({ idPrefix, name, label, options, register, errors, required = false }) {
  const error = errors[name]
  const [parent] = useAutoAnimate()
  const fieldId = `${idPrefix}-${name}`
  const errorId = `${fieldId}-error`
  return (
    <div className="field-stack" ref={parent}>
      <Select
        labelText={<Label required={required}>{label}</Label>}
        required={required}
        aria-required={required}
        invalid={Boolean(error)}
        invalidText={error?.message}
        {...register(name)}
        id={fieldId}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map(([val, text]) => <SelectItem key={val} value={val} text={text} />)}
      </Select>
      {error?.message ? <span id={errorId} className="sr-only">{error.message}</span> : null}
    </div>
  )
}

function ArrayMessage({ visible, children }) {
  if (!visible) return null
  return <p className="array-error" role="status">{children}</p>
}

export default function TechniqueForm({ technique, active }) {
  const draft = useStudioStore((state) => state.drafts[technique])
  const hydrationVersion = useStudioStore((state) => state.hydrationVersion)
  const updateDraft = useStudioStore((state) => state.updateDraft)
  const generatePrompt = useStudioStore((state) => state.generatePrompt)
  const resetTechnique = useStudioStore((state) => state.resetTechnique)
  const setChrome = useStudioStore((state) => state.setChrome)
  const [announcement, setAnnouncement] = useState('')
  const mountedRef = useRef(true)
  const hasAttachments = technique === 'few-shot' || technique === 'role-based'
  const defaults = useMemo(() => ({
    ...clone(draft.fields),
    ...(hasAttachments ? { attachments: clone(draft.attachments) } : {}),
  }), [draft, hasAttachments])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(formSchemas[technique]),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaults,
    shouldUnregister: false,
  })

  const examples = useFieldArray({ control, name: 'examples' })
  const reasoningSteps = useFieldArray({ control, name: 'reasoningSteps' })
  const successCriteria = useFieldArray({ control, name: 'successCriteria' })
  const constraints = useFieldArray({ control, name: 'constraints' })
  const values = watch()
  const [parent] = useAutoAnimate()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    reset({
      ...clone(draft.fields),
      ...(hasAttachments ? { attachments: clone(draft.attachments) } : {}),
    })
    requestAnimationFrame(() => trigger())
  }, [hydrationVersion, technique]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active) trigger()
  }, [active, trigger])

  useEffect(() => {
    const subscription = watch((nextValues) => {
      if (!mountedRef.current) return
      const next = clone(nextValues)
      const attachments = hasAttachments ? (next.attachments || []) : []
      delete next.attachments
      updateDraft(technique, next, attachments)
    })
    return () => {
      const latest = clone(getValues())
      const attachments = hasAttachments ? (latest.attachments || []) : []
      delete latest.attachments
      updateDraft(technique, latest, attachments)
      subscription.unsubscribe()
    }
  }, [getValues, hasAttachments, technique, updateDraft, watch])

  function onValid(data) {
    const clean = clone(data)
    const attachments = hasAttachments ? (clean.attachments || []) : []
    delete clean.attachments
    const promptText = assemblePrompt(technique, clean, attachments)
    generatePrompt(technique, clean, attachments, promptText)
    setAnnouncement(`${techniqueById[technique].name} prompt generated.`)
    requestAnimationFrame(() => document.getElementById('prompt-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  function onInvalid() {
    setAnnouncement('Prompt not generated. Resolve the named fields and try again.')
  }

  useEffect(() => {
    if (!active) return undefined
    window.__templateFormCommand = async (operation) => {
      if (operation === 'validate') {
        const valid = await trigger()
        setAnnouncement(valid ? 'Form is valid.' : 'Form has validation errors.')
        return { ok: true, valid }
      }
      if (operation === 'submit' || operation === 'advance') {
        const valid = await trigger()
        if (valid) onValid(getValues())
        else onInvalid()
        return { ok: true, valid, submitted: valid }
      }
      if (operation === 'reset') {
        resetTechnique(technique)
        return { ok: true, reset: true }
      }
      if (operation === 'cancel') {
        setChrome({ assetPickerOpen: false, saveModalOpen: false, importModalOpen: false })
        return { ok: true, cancelled: true }
      }
      if (operation === 'return') {
        useStudioStore.getState().setView('forms')
        return { ok: true, returned: true }
      }
      return { ok: false, unavailable: true }
    }
    return () => {
      if (window.__templateFormCommand) delete window.__templateFormCommand
    }
  }, [active, getValues, resetTechnique, setChrome, technique, trigger])

  const arrayError = (name) => errors[name]?.root?.message || errors[name]?.message

  return (
    <form
      className={`technique-form ${active ? 'is-active' : 'is-inactive'}`}
      onSubmit={handleSubmit(onValid, onInvalid)}
      noValidate
      hidden={!active}
      aria-hidden={!active}
      {...(!active ? { inert: '' } : {})}
    >
      <div className="sr-only" aria-live="polite">{announcement}</div>

      {technique === 'zero-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="Explain exactly what the model should accomplish…" />
          </Section>
          <Section eyebrow="02 · Response" title="Shape the answer">
            <div className="field-grid">
              <SelectField idPrefix={technique} name="outputFormat" label="Output format" required register={register} errors={errors} options={[
                ['paragraph', 'Paragraph'], ['bullets', 'Bulleted list'], ['table', 'Table'], ['json', 'JSON'],
              ]} />
              <SelectField idPrefix={technique} name="tone" label="Tone" required register={register} errors={errors} options={[
                ['clear', 'Clear'], ['professional', 'Professional'], ['friendly', 'Friendly'], ['persuasive', 'Persuasive'],
              ]} />
            </div>
          </Section>
        </>
      )}

      {technique === 'one-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model do?" />
          </Section>
          <Section eyebrow="02 · Demonstration" title="Provide one ideal example">
            <div className="example-pair">
              <TextAreaField idPrefix={technique} name="exampleInput" label="Example input" required register={register} errors={errors} watch={watch} placeholder="A representative input…" rows={3} />
              <TextAreaField idPrefix={technique} name="expectedOutput" label="Expected output" required register={register} errors={errors} watch={watch} placeholder="The ideal response…" rows={3} />
            </div>
          </Section>
        </>
      )}

      {technique === 'few-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What pattern should the model learn?" />
          </Section>
          <Section eyebrow="02 · Demonstrations" title="Build an example set">
            <div className="dynamic-stack" ref={parent}>
              {examples.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Example" onRemove={() => examples.remove(index)}>
                  <div className="field-grid">
                    <TextField idPrefix={technique} name={`examples.${index}.input`} label="Example input" required register={register} errors={errors} placeholder="Input or question" />
                    <TextField idPrefix={technique} name={`examples.${index}.output`} label="Expected output" required register={register} errors={errors} placeholder="Ideal response" />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={examples.fields.length === 0 || Boolean(arrayError('examples'))}>
              {arrayError('examples') || 'At least one example is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => examples.append({ input: '', output: '' })}>Add example</Button>
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField idPrefix={technique} selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'chain-of-thought' && (
        <>
          <Section eyebrow="01 · Objective" title="Set the reasoning goal">
            <TextAreaField idPrefix={technique} name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="What conclusion or solution should be reached?" />
          </Section>
          <Section eyebrow="02 · Reasoning" title="Outline useful steps">
            <p className="section-help">Optional guidance. Blank steps are omitted from the assembled prompt.</p>
            <div className="dynamic-stack" ref={parent}>
              {reasoningSteps.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Reasoning step" onRemove={() => reasoningSteps.remove(index)}>
                  <TextField idPrefix={technique} name={`reasoningSteps.${index}.step`} label={`Step ${index + 1}`} register={register} errors={errors} placeholder="Describe a reasoning checkpoint" />
                </DynamicRow>
              ))}
            </div>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => reasoningSteps.append({ step: '' })}>Add reasoning step</Button>
            <Controller
              name="scratchpad"
              control={control}
              render={({ field }) => (
                <div className="toggle-card">
                  <div><strong>Step-by-step instruction</strong><span>Ask the model to reason before giving its final answer.</span></div>
                  <Toggle id={`${technique}-scratchpad`} size="sm" labelText="Scratchpad" hideLabel labelA="Off" labelB="On" toggled={field.value} onToggle={field.onChange} />
                </div>
              )}
            />
          </Section>
        </>
      )}

      {technique === 'outcome-based' && (
        <>
          <Section eyebrow="01 · Objective" title="Define the desired outcome">
            <TextAreaField idPrefix={technique} name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="Describe the end state you want…" />
          </Section>
          <Section eyebrow="02 · Success" title="Make success measurable">
            <div className="dynamic-stack" ref={parent}>
              {successCriteria.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Success criterion" onRemove={() => successCriteria.remove(index)}>
                  <TextField idPrefix={technique} name={`successCriteria.${index}.text`} label={`Criterion ${index + 1}`} required register={register} errors={errors} placeholder="What must be true for this to succeed?" />
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={successCriteria.fields.length === 0 || Boolean(arrayError('successCriteria'))}>
              {arrayError('successCriteria') || 'At least one success criterion is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => successCriteria.append({ text: '' })}>Add success criterion</Button>
            <SelectField idPrefix={technique} name="measurement" label="Measurement" required register={register} errors={errors} options={[
              ['qualitative', 'Qualitative review'], ['score', 'Numeric score'], ['percentage', 'Percentage'], ['pass-fail', 'Pass / fail'],
            ]} />
          </Section>
        </>
      )}

      {technique === 'role-based' && (
        <>
          <Section eyebrow="01 · Perspective" title="Assign expertise">
            <div className="field-grid">
              <TextField idPrefix={technique} name="role" label="Role or persona" required register={register} errors={errors} placeholder="e.g. Senior product strategist" />
              <TextField idPrefix={technique} name="audience" label="Audience" register={register} errors={errors} placeholder="e.g. Product leadership" />
            </div>
          </Section>
          <Section eyebrow="02 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should this expert accomplish?" />
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField idPrefix={technique} selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'constraint-based' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model produce?" />
          </Section>
          <Section eyebrow="02 · Boundaries" title="Set explicit constraints">
            <div className="dynamic-stack" ref={parent}>
              {constraints.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Constraint" onRemove={() => constraints.remove(index)}>
                  <div className="constraint-grid">
                    <Select required aria-required labelText={<Label required>Constraint type</Label>} {...register(`constraints.${index}.type`)} id={`${technique}-constraints-${index}-type`}>
                      <SelectItem value="length" text="Length" />
                      <SelectItem value="format" text="Format" />
                      <SelectItem value="content" text="Content" />
                      <SelectItem value="style" text="Style" />
                      <SelectItem value="other" text="Other" />
                    </Select>
                    <TextField idPrefix={technique} name={`constraints.${index}.text`} label="Constraint text" required register={register} errors={errors} placeholder="State the boundary precisely" />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={constraints.fields.length === 0 || Boolean(arrayError('constraints'))}>
              {arrayError('constraints') || 'At least one constraint is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => constraints.append({ type: 'length', text: '' })}>Add constraint</Button>
          </Section>
        </>
      )}

      <div className="form-actions">
        <div className="validity-note" aria-live="polite">
          <span className={isValid ? 'validity-dot is-valid' : 'validity-dot'} />
          {isValid ? 'All required fields complete' : 'Complete the required fields to generate'}
        </div>
        <div className="action-buttons">
          <Button
            type="button"
            kind="ghost"
            size="md"
            renderIcon={(props) => <Reset {...props} aria-hidden="true" />}
            onClick={() => {
              setChrome({ assetPickerOpen: false })
              resetTechnique(technique)
            }}
          >
            Reset form
          </Button>
          <Button type="submit" kind="primary" size="md" renderIcon={(props) => <ArrowRight {...props} aria-hidden="true" />} disabled={!isValid}>
            Generate prompt
          </Button>
        </div>
      </div>
    </form>
  )
}
