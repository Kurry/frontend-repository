import { useEffect, useMemo, useState } from 'react'
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

function DynamicRow({ index, title, onRemove, children }) {
  return (
    <div className="dynamic-row">
      <div className="dynamic-row__header">
        <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
        <strong>{title}</strong>
        <Button
          type="button"
          kind="ghost"
          size="sm"
          renderIcon={TrashCan}
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
        >
          Remove
        </Button>
      </div>
      <div className="dynamic-row__body">{children}</div>
    </div>
  )
}

function TextAreaField({ name, label, required, register, errors, watch, placeholder, rows = 5 }) {
  const error = errors[name]
  const value = watch(name)
  return (
    <div className="field-stack">
      <TextArea
        id={name}
        labelText={<Label required={required}>{label}</Label>}
        placeholder={placeholder}
        rows={rows}
        invalid={Boolean(error)}
        invalidText={error?.message}
        aria-describedby={`${name}-count`}
        {...register(name)}
      />
      <span id={`${name}-count`}><CharacterCount value={value} /></span>
    </div>
  )
}

function TextField({ name, label, required, register, errors, placeholder }) {
  const error = name.split('.').reduce((current, part) => current?.[part], errors)
  return (
    <TextInput
      id={name.replaceAll('.', '-')}
      labelText={<Label required={required}>{label}</Label>}
      placeholder={placeholder}
      invalid={Boolean(error)}
      invalidText={error?.message}
      {...register(name)}
    />
  )
}

function SelectField({ name, label, options, register, errors, required = false }) {
  const error = errors[name]
  return (
    <Select
      id={name}
      labelText={<Label required={required}>{label}</Label>}
      invalid={Boolean(error)}
      invalidText={error?.message}
      {...register(name)}
    >
      {options.map(([value, text]) => <SelectItem key={value} value={value} text={text} />)}
    </Select>
  )
}

function ArrayMessage({ visible, children }) {
  if (!visible) return null
  return <p className="array-error" role="status">{children}</p>
}

export default function TechniqueForm({ technique }) {
  const draft = useStudioStore((state) => state.drafts[technique])
  const updateDraft = useStudioStore((state) => state.updateDraft)
  const generatePrompt = useStudioStore((state) => state.generatePrompt)
  const resetTechnique = useStudioStore((state) => state.resetTechnique)
  const setChrome = useStudioStore((state) => state.setChrome)
  const [announcement, setAnnouncement] = useState('')
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
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(formSchemas[technique]),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  })

  const examples = useFieldArray({ control, name: 'examples' })
  const reasoningSteps = useFieldArray({ control, name: 'reasoningSteps' })
  const successCriteria = useFieldArray({ control, name: 'successCriteria' })
  const constraints = useFieldArray({ control, name: 'constraints' })
  const values = watch()

  useEffect(() => {
    trigger()
  }, [trigger])

  useEffect(() => {
    const subscription = watch((nextValues) => {
      const next = clone(nextValues)
      const attachments = hasAttachments ? (next.attachments || []) : []
      delete next.attachments
      updateDraft(technique, next, attachments)
    })
    return () => subscription.unsubscribe()
  }, [hasAttachments, technique, updateDraft, watch])

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
    window.__templateFormCommand = async (operation) => {
      if (operation === 'validate') {
        const valid = await trigger()
        setAnnouncement(valid ? 'Form is valid.' : 'Form has validation errors.')
        return { valid }
      }
      if (operation === 'submit' || operation === 'advance') {
        const valid = await trigger()
        if (valid) onValid(getValues())
        else onInvalid()
        return { valid, submitted: valid }
      }
      if (operation === 'reset') {
        resetTechnique(technique)
        return { reset: true }
      }
      if (operation === 'cancel') {
        setChrome({ assetPickerOpen: false, saveModalOpen: false, importModalOpen: false })
        return { cancelled: true }
      }
      if (operation === 'return') {
        useStudioStore.getState().setView('forms')
        return { returned: true }
      }
      return { unavailable: true }
    }
    return () => {
      delete window.__templateFormCommand
    }
  }, [getValues, resetTechnique, setChrome, technique, trigger])

  const arrayError = (name) => errors[name]?.root?.message || errors[name]?.message

  return (
    <form className="technique-form" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
      <div className="sr-only" aria-live="polite">{announcement}</div>

      {technique === 'zero-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="Explain exactly what the model should accomplish…" />
          </Section>
          <Section eyebrow="02 · Response" title="Shape the answer">
            <div className="field-grid">
              <SelectField name="outputFormat" label="Output format" required register={register} errors={errors} options={[
                ['paragraph', 'Paragraph'], ['bullets', 'Bulleted list'], ['table', 'Table'], ['json', 'JSON'],
              ]} />
              <SelectField name="tone" label="Tone" required register={register} errors={errors} options={[
                ['clear', 'Clear'], ['professional', 'Professional'], ['friendly', 'Friendly'], ['persuasive', 'Persuasive'],
              ]} />
            </div>
          </Section>
        </>
      )}

      {technique === 'one-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model do?" />
          </Section>
          <Section eyebrow="02 · Demonstration" title="Provide one ideal example">
            <div className="example-pair">
              <TextAreaField name="exampleInput" label="Example input" required register={register} errors={errors} watch={watch} placeholder="A representative input…" rows={3} />
              <TextAreaField name="expectedOutput" label="Expected output" required register={register} errors={errors} watch={watch} placeholder="The ideal response…" rows={3} />
            </div>
          </Section>
        </>
      )}

      {technique === 'few-shot' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What pattern should the model learn?" />
          </Section>
          <Section eyebrow="02 · Demonstrations" title="Build an example set">
            <div className="dynamic-stack">
              {examples.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Example" onRemove={() => examples.remove(index)}>
                  <div className="field-grid">
                    <TextField name={`examples.${index}.input`} label="Example input" required register={register} errors={errors} placeholder="Input or question" />
                    <TextField name={`examples.${index}.output`} label="Expected output" required register={register} errors={errors} placeholder="Ideal response" />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={examples.fields.length === 0 || Boolean(arrayError('examples'))}>
              {arrayError('examples') || 'At least one example is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={Add} onClick={() => examples.append({ input: '', output: '' })}>Add example</Button>
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'chain-of-thought' && (
        <>
          <Section eyebrow="01 · Objective" title="Set the reasoning goal">
            <TextAreaField name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="What conclusion or solution should be reached?" />
          </Section>
          <Section eyebrow="02 · Reasoning" title="Outline useful steps">
            <p className="section-help">Optional guidance. Blank steps are omitted from the assembled prompt.</p>
            <div className="dynamic-stack">
              {reasoningSteps.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Reasoning step" onRemove={() => reasoningSteps.remove(index)}>
                  <TextField name={`reasoningSteps.${index}.step`} label={`Step ${index + 1}`} register={register} errors={errors} placeholder="Describe a reasoning checkpoint" />
                </DynamicRow>
              ))}
            </div>
            <Button type="button" kind="tertiary" size="sm" renderIcon={Add} onClick={() => reasoningSteps.append({ step: '' })}>Add reasoning step</Button>
            <Controller
              name="scratchpad"
              control={control}
              render={({ field }) => (
                <div className="toggle-card">
                  <div><strong>Step-by-step instruction</strong><span>Ask the model to reason before giving its final answer.</span></div>
                  <Toggle id="scratchpad" size="sm" labelText="Scratchpad" hideLabel labelA="Off" labelB="On" toggled={field.value} onToggle={field.onChange} />
                </div>
              )}
            />
          </Section>
        </>
      )}

      {technique === 'outcome-based' && (
        <>
          <Section eyebrow="01 · Objective" title="Define the desired outcome">
            <TextAreaField name="goal" label="Goal" required register={register} errors={errors} watch={watch} placeholder="Describe the end state you want…" />
          </Section>
          <Section eyebrow="02 · Success" title="Make success measurable">
            <div className="dynamic-stack">
              {successCriteria.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Success criterion" onRemove={() => successCriteria.remove(index)}>
                  <TextField name={`successCriteria.${index}.text`} label={`Criterion ${index + 1}`} required register={register} errors={errors} placeholder="What must be true for this to succeed?" />
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={successCriteria.fields.length === 0 || Boolean(arrayError('successCriteria'))}>
              {arrayError('successCriteria') || 'At least one success criterion is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={Add} onClick={() => successCriteria.append({ text: '' })}>Add success criterion</Button>
            <SelectField name="measurement" label="Measurement" required register={register} errors={errors} options={[
              ['qualitative', 'Qualitative review'], ['score', 'Numeric score'], ['percentage', 'Percentage'], ['pass-fail', 'Pass / fail'],
            ]} />
          </Section>
        </>
      )}

      {technique === 'role-based' && (
        <>
          <Section eyebrow="01 · Perspective" title="Assign expertise">
            <div className="field-grid">
              <TextField name="role" label="Role or persona" required register={register} errors={errors} placeholder="e.g. Senior product strategist" />
              <TextField name="audience" label="Audience" register={register} errors={errors} placeholder="e.g. Product leadership" />
            </div>
          </Section>
          <Section eyebrow="02 · Instruction" title="Describe the task">
            <TextAreaField name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should this expert accomplish?" />
          </Section>
          <Section eyebrow="03 · Context" title="Add source material">
            <AttachmentsField selected={values.attachments || []} onChange={(next) => setValue('attachments', next, { shouldDirty: true, shouldValidate: true })} />
          </Section>
        </>
      )}

      {technique === 'constraint-based' && (
        <>
          <Section eyebrow="01 · Instruction" title="Describe the task">
            <TextAreaField name="taskDescription" label="Task description" required register={register} errors={errors} watch={watch} placeholder="What should the model produce?" />
          </Section>
          <Section eyebrow="02 · Boundaries" title="Set explicit constraints">
            <div className="dynamic-stack">
              {constraints.fields.map((field, index) => (
                <DynamicRow key={field.id} index={index} title="Constraint" onRemove={() => constraints.remove(index)}>
                  <div className="constraint-grid">
                    <Select id={`constraints-${index}-type`} labelText={<Label required>Constraint type</Label>} {...register(`constraints.${index}.type`)}>
                      <SelectItem value="length" text="Length" />
                      <SelectItem value="format" text="Format" />
                      <SelectItem value="content" text="Content" />
                      <SelectItem value="style" text="Style" />
                      <SelectItem value="other" text="Other" />
                    </Select>
                    <TextField name={`constraints.${index}.text`} label="Constraint text" required register={register} errors={errors} placeholder="State the boundary precisely" />
                  </div>
                </DynamicRow>
              ))}
            </div>
            <ArrayMessage visible={constraints.fields.length === 0 || Boolean(arrayError('constraints'))}>
              {arrayError('constraints') || 'At least one constraint is required.'}
            </ArrayMessage>
            <Button type="button" kind="tertiary" size="sm" renderIcon={Add} onClick={() => constraints.append({ type: 'length', text: '' })}>Add constraint</Button>
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
            renderIcon={Reset}
            onClick={() => {
              setChrome({ assetPickerOpen: false })
              resetTechnique(technique)
            }}
          >
            Reset
          </Button>
          <Button type="submit" kind="primary" size="md" renderIcon={ArrowRight} disabled={!isValid}>
            Generate prompt
          </Button>
        </div>
      </div>
    </form>
  )
}
