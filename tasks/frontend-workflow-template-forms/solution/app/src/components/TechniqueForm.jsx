import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  InlineLoading,
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

const requiredMark = <span className="required-mark" aria-hidden="true"> *</span>

function Label({ children, required = false }) {
  return <>{children}{required ? requiredMark : null}</>
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

function TextAreaField({ idPrefix, name, label, required, register, errors, watch, placeholder, rows = 5, showError }) {
  const error = errors[name]
  const value = watch(name)
  const [parent] = useAutoAnimate({ duration: 90 })
  const fieldId = `${idPrefix}-${name}`
  const countId = `${fieldId}-count`
  const visibleError = showError && error
  return (
    <div className="field-stack" ref={parent}>
      <TextArea
        labelText={<Label required={required}>{label}</Label>}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-required={required}
        invalid={Boolean(visibleError)}
        invalidText={visibleError?.message || ''}
        {...register(name)}
        id={fieldId}
      />
      <span id={countId}><CharacterCount value={value} /></span>
    </div>
  )
}

function TextField({ idPrefix, name, label, required, register, errors, placeholder, showError }) {
  const error = name.split('.').reduce((current, part) => current?.[part], errors)
  const [parent] = useAutoAnimate({ duration: 90 })
  const fieldId = `${idPrefix}-${name.replaceAll('.', '-')}`
  const visibleError = showError && error
  return (
    <div className="field-stack" ref={parent}>
      <TextInput
        labelText={<Label required={required}>{label}</Label>}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        invalid={Boolean(visibleError)}
        invalidText={visibleError?.message || ''}
        {...register(name)}
        id={fieldId}
      />
    </div>
  )
}

function SelectField({ idPrefix, name, label, options, register, errors, required = false, showError }) {
  const error = errors[name]
  const [parent] = useAutoAnimate({ duration: 90 })
  const fieldId = `${idPrefix}-${name}`
  const visibleError = showError && error
  return (
    <div className="field-stack" ref={parent}>
      <Select
        labelText={<Label required={required}>{label}</Label>}
        required={required}
        aria-required={required}
        invalid={Boolean(visibleError)}
        invalidText={visibleError?.message || ''}
        {...register(name)}
        id={fieldId}
      >
        {options.map(([val, text]) => <SelectItem key={val} value={val} text={text} />)}
      </Select>
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
  const generationTimerRef = useRef(null)
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
    formState: { errors, isValid, touchedFields, dirtyFields, isSubmitted },
  } = useForm({
    resolver: zodResolver(formSchemas[technique]),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaults,
    shouldUnregister: false,
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const revealErrors = submitAttempted || isSubmitted
  const showFieldError = (name) => {
    if (revealErrors) return true
    const path = name.split('.')
    let touched = touchedFields
    let dirty = dirtyFields
    for (const part of path) {
      touched = touched?.[part]
      dirty = dirty?.[part]
    }
    return Boolean(touched || dirty)
  }

  const examples = useFieldArray({ control, name: 'examples' })
  const reasoningSteps = useFieldArray({ control, name: 'reasoningSteps' })
  const successCriteria = useFieldArray({ control, name: 'successCriteria' })
  const constraints = useFieldArray({ control, name: 'constraints' })
  const values = watch()
  const [parent] = useAutoAnimate()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      if (generationTimerRef.current) window.clearTimeout(generationTimerRef.current)
      generationTimerRef.current = null
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setSubmitAttempted(false)
    reset({
      ...clone(draft.fields),
      ...(hasAttachments ? { attachments: clone(draft.attachments) } : {}),
    })
    requestAnimationFrame(() => { trigger() })
  }, [hydrationVersion, technique]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const subscription = watch((nextValues) => {
      if (!mountedRef.current) return
      if (generationTimerRef.current) {
        window.clearTimeout(generationTimerRef.current)
        generationTimerRef.current = null
        setGenerating(false)
      }
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
    if (generationTimerRef.current) window.clearTimeout(generationTimerRef.current)
    const submitted = clone(data)
    setGenerating(true)
    generationTimerRef.current = window.setTimeout(() => {
      generationTimerRef.current = null
      if (!mountedRef.current) return
      const clean = clone(submitted)
      const attachments = hasAttachments ? (clean.attachments || []) : []
      delete clean.attachments
      const promptText = assemblePrompt(technique, clean, attachments)
      generatePrompt(technique, clean, attachments, promptText)
      setAnnouncement(`${techniqueById[technique].name} prompt generated.`)
      setGenerating(false)
      requestAnimationFrame(() => document.getElementById('prompt-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }, 300)
  }

  function onInvalid() {
    setSubmitAttempted(true)
    setAnnouncement('Prompt not generated. Resolve the named fields and try again.')
  }

  useEffect(() => {
    if (!active) return undefined
    window.__templateFormApplyFields = (incoming) => {
      const fields = getValues()
      const mapping = {
        'task-description': 'taskDescription',
        'output-format': 'outputFormat',
        tone: 'tone',
        'example-input': 'exampleInput',
        'expected-output': 'expectedOutput',
        goal: 'goal',
        scratchpad: 'scratchpad',
        measurement: 'measurement',
        role: 'role',
        audience: 'audience',
      }
      for (const [contractName, value] of Object.entries(incoming || {})) {
        let path = mapping[contractName]
        if (contractName === 'reasoning-step') path = 'reasoningSteps.0.step'
        if (contractName === 'success-criterion') path = 'successCriteria.0.text'
        if (contractName === 'constraint-type') path = 'constraints.0.type'
        if (contractName === 'constraint-text') path = 'constraints.0.text'
        if (!path || (path.split('.')[0] !== 'reasoningSteps' && path.split('.')[0] !== 'successCriteria' && path.split('.')[0] !== 'constraints' && !(path in fields))) {
          return { ok: false, error: `${contractName} is not available for the active technique` }
        }
        const next = contractName === 'scratchpad' ? value === 'true' : value
        setValue(path, next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      }
      return { ok: true }
    }
    window.__templateFormVoiceTranscript = (transcript) => {
      const fields = getValues()
      const field = 'taskDescription' in fields ? 'taskDescription' : 'goal' in fields ? 'goal' : 'role' in fields ? 'role' : null
      if (!field) return false
      const next = field === 'role' ? transcript : `${fields[field] || ''} ${transcript}`.trim()
      setValue(field, next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      return true
    }
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
        if (generationTimerRef.current) {
          window.clearTimeout(generationTimerRef.current)
          generationTimerRef.current = null
          setGenerating(false)
        }
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
      if (window.__templateFormVoiceTranscript) delete window.__templateFormVoiceTranscript
      if (window.__templateFormApplyFields) delete window.__templateFormApplyFields
    }
  }, [active, getValues, resetTechnique, setChrome, setValue, technique, trigger])

  const arrayError = (name) => errors[name]?.root?.message || errors[name]?.message

  return (
    <form
      className={`technique-form ${active ? 'is-active' : 'is-inactive'}`}
      onSubmit={handleSubmit(onValid, onInvalid)}
      noValidate
    >
      <div className="sr-only" aria-live="polite">{announcement}</div>

      {technique === 'zero-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="Explain exactly what the model should accomplish…"  showError={showFieldError('taskDescription')} />
          </Section>
          <Section eyebrow="02 · Response" title="Shape the answer">
            <div className="field-grid">
              <SelectField idPrefix={technique} name="outputFormat" label="Output format" required register={register} errors={errors} options={[
                ['paragraph', 'Paragraph'], ['bullets', 'Bulleted list'], ['table', 'Table'], ['json', 'JSON'],
              ]}  showError={showFieldError('outputFormat')} />
              <SelectField idPrefix={technique} name="tone" label="Tone" required register={register} errors={errors} options={[
                ['clear', 'Clear'], ['professional', 'Professional'], ['friendly', 'Friendly'], ['persuasive', 'Persuasive'],
              ]}  showError={showFieldError('tone')} />
            </div>
          </Section>
        </>
      )}

      {technique === 'one-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model do?"  showError={showFieldError('taskDescription')} />
          </Section>
          <Section eyebrow="02 · Demonstration" title="Provide one ideal example">
            <div className="example-pair">
              <TextAreaField idPrefix={technique} name="exampleInput" label="Example input" required register={register} errors={errors} watch={watch} placeholder="A representative input…" rows={3}  showError={showFieldError('exampleInput')} />
              <TextAreaField idPrefix={technique} name="expectedOutput" label="Expected output" required register={register} errors={errors} watch={watch} placeholder="The ideal response…" rows={3}  showError={showFieldError('expectedOutput')} />
            </div>
          </Section>
        </>
      )}

      {technique === 'few-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What pattern should the model learn?"  showError={showFieldError('taskDescription')} />
          </Section>
          <Section eyebrow="02 · Demonstrations" title="Build an example set">
            <div className="dynamic-stack" ref={parent}>
              {examples.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Example" onRemove={() => { examples.remove(index); trigger('examples') }}>
                  <div className="field-grid">
                    <TextField idPrefix={technique} name={`examples.${index}.input`} label="Example input" required register={register} errors={errors} placeholder="Input or question" showError={showFieldError(`examples.${index}.input`)} />
                    <TextField idPrefix={technique} name={`examples.${index}.output`} label="Expected output" required register={register} errors={errors} placeholder="Ideal response" showError={showFieldError(`examples.${index}.output`)} />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={revealErrors && (examples.fields.length === 0 || Boolean(arrayError('examples')))}>
              {arrayError('examples') || 'At least one example is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => examples.append({ input: '', output: '' })}>Add example</Button>
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField active={active} idPrefix={technique} selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'chain-of-thought' && (
        <>
          <Section eyebrow="01 · Objective" title="Set the reasoning goal">
            <TextAreaField idPrefix={technique} name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="What conclusion or solution should be reached?"  showError={showFieldError('goal')} />
          </Section>
          <Section eyebrow="02 · Reasoning" title="Outline useful steps">
            <p className="section-help">Optional guidance. Blank steps are omitted from the assembled prompt.</p>
            <div className="dynamic-stack" ref={parent}>
              {reasoningSteps.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Reasoning step" onRemove={() => reasoningSteps.remove(index)}>
                  <TextField idPrefix={technique} name={`reasoningSteps.${index}.step`} label={`Step ${index + 1}`} register={register} errors={errors} placeholder="Describe a reasoning checkpoint" showError={showFieldError(`reasoningSteps.${index}.step`)} />
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
            <TextAreaField idPrefix={technique} name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="Describe the end state you want…"  showError={showFieldError('goal')} />
          </Section>
          <Section eyebrow="02 · Success" title="Make success measurable">
            <div className="dynamic-stack" ref={parent}>
              {successCriteria.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Success criterion" onRemove={() => successCriteria.remove(index)}>
                  <TextField idPrefix={technique} name={`successCriteria.${index}.text`} label={`Criterion ${index + 1}`} required register={register} errors={errors} placeholder="What must be true for this to succeed?" showError={showFieldError(`successCriteria.${index}.text`)} />
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={revealErrors && (successCriteria.fields.length === 0 || Boolean(arrayError('successCriteria')))}>
              {arrayError('successCriteria') || 'At least one success criterion is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Add {...props} aria-hidden="true" />} onClick={() => successCriteria.append({ text: '' })}>Add success criterion</Button>
            <SelectField idPrefix={technique} name="measurement" label="Measurement" required register={register} errors={errors} options={[
              ['qualitative', 'Qualitative review'], ['score', 'Numeric score'], ['percentage', 'Percentage'], ['pass-fail', 'Pass / fail'],
            ]}  showError={showFieldError('measurement')} />
          </Section>
        </>
      )}

      {technique === 'role-based' && (
        <>
          <Section eyebrow="01 · Perspective" title="Assign expertise">
            <div className="field-grid">
              <TextField idPrefix={technique} name="role" label="Role or persona" required register={register} errors={errors} placeholder="e.g. Senior product strategist"  showError={showFieldError('role')} />
              <TextField idPrefix={technique} name="audience" label="Audience" register={register} errors={errors} placeholder="e.g. Product leadership"  showError={showFieldError('audience')} />
            </div>
          </Section>
          <Section eyebrow="02 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should this expert accomplish?"  showError={showFieldError('taskDescription')} />
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField active={active} idPrefix={technique} selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'constraint-based' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField idPrefix={technique} name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model produce?"  showError={showFieldError('taskDescription')} />
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
                    <TextField idPrefix={technique} name={`constraints.${index}.text`} label="Constraint text" required register={register} errors={errors} placeholder="State the boundary precisely" showError={showFieldError(`constraints.${index}.text`)} />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={revealErrors && (constraints.fields.length === 0 || Boolean(arrayError('constraints')))}>
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
              if (generationTimerRef.current) {
                window.clearTimeout(generationTimerRef.current)
                generationTimerRef.current = null
                setGenerating(false)
              }
              setChrome({ assetPickerOpen: false })
              setSubmitAttempted(false)
              resetTechnique(technique)
            }}
          >
            Reset form
          </Button>
          <span className="submit-proxy">
            <Button
              type="submit"
              kind="primary"
              size="md"
              renderIcon={(props) => <ArrowRight {...props} aria-hidden="true" />}
              disabled={generating}
            >
              {generating ? <InlineLoading description="Generating..." /> : 'Generate prompt'}
            </Button>
          </span>
        </div>
      </div>
    </form>
  )
}
