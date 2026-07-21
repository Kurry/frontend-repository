import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button, DismissibleTag, Modal, Select, SelectItem, Slider, TextArea, TextInput } from '@carbon/react'
import { Add, Close, ListBulleted, TextBold, TextItalic } from '@carbon/icons-react'
import { restoreFocus } from '../focus'
import { ROLES, TONES, TRAITS, useAppStore } from '../store'
import { editorDefaults, personaSchema } from '../schema'
import TraitRadar from './TraitRadar'

const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)

function RichEditor({ value, onChange, onReady }) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Write the system prompt…' })],
    content: value,
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML()),
    editorProps: {
      attributes: { class: 'prompt-editor', 'aria-label': 'System prompt body' },
      handleKeyDown: (view, event) => {
        if (event.key === 'Escape') {
          // Allow Modal to handle Escape by triggering close manually or letting it bubble
          // In Carbon Modal, usually Escape on any element inside closes it.
          // If TipTap stops propagation, it breaks. Returning false lets TipTap ignore it, bubbling it up.
          return false;
        }
        return false;
      }
    },
  })

  useEffect(() => { if (editor && onReady) onReady(editor) }, [editor, onReady])

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return (
    <div className="rich-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Prompt formatting">
        <Button type="button" size="sm" kind={editor?.isActive('bold') ? 'tertiary' : 'ghost'} hasIconOnly iconDescription="Bold" renderIcon={TextBold} onClick={() => editor?.chain().focus().toggleBold().run()} />
        <Button type="button" size="sm" kind={editor?.isActive('italic') ? 'tertiary' : 'ghost'} hasIconOnly iconDescription="Italic" renderIcon={TextItalic} onClick={() => editor?.chain().focus().toggleItalic().run()} />
        <Button type="button" size="sm" kind={editor?.isActive('heading', { level: 2 }) ? 'tertiary' : 'ghost'} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
        <Button type="button" size="sm" kind={editor?.isActive('bulletList') ? 'tertiary' : 'ghost'} hasIconOnly iconDescription="Bulleted list" renderIcon={ListBulleted} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default function PersonaEditor() {
  const { editorOpen, editorId } = useAppStore((s) => s.ui)
  const persona = useAppStore((s) => s.personas.find((p) => p.id === editorId))
  const closeEditor = useAppStore((s) => s.closeEditor)
  const createPersona = useAppStore((s) => s.createPersona)
  const updatePersona = useAppStore((s) => s.updatePersona)
  const [tagDraft, setTagDraft] = useState('')
  const [variantIndex, setVariantIndex] = useState(0)
  const [traitDrafts, setTraitDrafts] = useState({})
  const [traitInputErrors, setTraitInputErrors] = useState({})
  const editorRef = useRef(null)
  const saving = useRef(false)
  const defaults = useMemo(() => editorDefaults(persona), [persona, editorOpen])
  const {
    control, register, setValue, getValues, reset, handleSubmit, trigger,
    formState: { errors, isValid },
  } = useForm({ resolver: zodResolver(personaSchema), defaultValues: defaults, mode: 'onChange' })
  const constraints = useFieldArray({ control, name: 'constraints' })
  const examples = useFieldArray({ control, name: 'examples' })
  const values = useWatch({ control })

  useEffect(() => {
    if (!editorOpen) return
    reset(defaults)
    const index = Math.max(0, defaults.variants.findIndex((v) => v.id === defaults.activeVariant))
    setVariantIndex(index)
    setTagDraft('')
    setTraitDrafts({})
    setTraitInputErrors({})
  }, [editorOpen, defaults, reset])

  const syncActiveVariant = () => {
    const current = getValues()
    const variants = [...current.variants]
    variants[variantIndex] = {
      ...variants[variantIndex],
      promptBody: current.promptBody,
      examples: current.examples,
    }
    setValue('variants', variants, { shouldValidate: true })
    return { ...current, variants }
  }

  const changeVariant = (nextIndex) => {
    const current = syncActiveVariant()
    const target = current.variants[nextIndex]
    setVariantIndex(nextIndex)
    setValue('activeVariant', target.id, { shouldValidate: true })
    setValue('promptBody', target.promptBody, { shouldValidate: true })
    setValue('examples', target.examples, { shouldValidate: true })
    examples.replace(target.examples)
    editorRef.current?.commands.setContent(target.promptBody)
  }

  const addTag = () => {
    const tag = tagDraft.trim()
    const tags = getValues('tags') || []
    if (tag && !tags.includes(tag) && tags.length < 12) setValue('tags', [...tags, tag], { shouldValidate: true, shouldDirty: true })
    setTagDraft('')
  }

  const save = handleSubmit((submitted) => {
    if (saving.current) return
    saving.current = true
    const active = submitted.variants.findIndex((v) => v.id === submitted.activeVariant)
    submitted.variants[active] = { ...submitted.variants[active], promptBody: submitted.promptBody, examples: submitted.examples }
    if (persona) updatePersona(persona.id, submitted)
    else createPersona(submitted)
    closeEditor()
    restoreFocus()
    window.setTimeout(() => { saving.current = false }, 300)
  }, () => { saving.current = false })

  const requestClose = () => {
    closeEditor()
    restoreFocus()
  }
  const tags = values?.tags || []
  const traits = values?.traits || {}

  return (
    <Modal
      open={editorOpen}
      modalHeading={persona ? `Edit ${persona.name}` : 'Create a new persona'}
      modalLabel="Persona editor"
      primaryButtonText={persona ? 'Save changes' : 'Create persona'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={saving.current || Object.keys(traitInputErrors).length > 0}
      onRequestSubmit={() => {
        syncActiveVariant()
        trigger().then((ok) => {
          if (ok) save()
          else {
            const firstError = document.querySelector('.persona-form [aria-invalid="true"], .persona-form .error')
            if (firstError) firstError.focus()
          }
        })
      }}
      onRequestClose={requestClose}
      size="lg"
      selectorPrimaryFocus="#persona-name"
      className="persona-editor-modal"
    >
      <form className="persona-form" onSubmit={save} noValidate>
        <div className="form-grid form-grid--3">
          <TextInput id="persona-name" labelText="Name *" placeholder="e.g. Research partner" {...register('name')} invalid={Boolean(errors.name)} invalidText={errors.name?.message} />
          <Select id="persona-role" labelText="Role category *" {...register('role')} invalid={Boolean(errors.role)} invalidText={errors.role?.message}>
            {ROLES.map((role) => <SelectItem key={role} value={role} text={role} />)}
          </Select>
          <Select id="persona-tone" labelText="Tone *" {...register('tone')} invalid={Boolean(errors.tone)} invalidText={errors.tone?.message}>
            {TONES.map((tone) => <SelectItem key={tone} value={tone} text={pretty(tone)} />)}
          </Select>
        </div>

        <section className="form-section">
          <div className="section-heading"><div><h3>Prompt technique</h3><p>Shared identity fields stay in sync across variants.</p></div></div>
          <div className="variant-tabs" role="tablist" aria-label="Prompt technique variants">
            {(values?.variants || []).map((variant, index) => (
              <button key={variant.id} type="button" role="tab" aria-selected={variantIndex === index} className={variantIndex === index ? 'variant-tab active' : 'variant-tab'} onClick={() => changeVariant(index)}>{variant.label}</button>
            ))}
          </div>
          <label className="field-label" id="prompt-label">System prompt body *</label>
          <RichEditor
            value={values?.promptBody || ''}
            onReady={(editor) => { editorRef.current = editor }}
            onChange={(html) => {
              setValue('promptBody', html, { shouldValidate: true, shouldDirty: true })
              setValue(`variants.${variantIndex}.promptBody`, html, { shouldValidate: true })
            }}
          />
          {errors.promptBody && <p className="field-error" role="alert">Prompt body: {errors.promptBody.message}</p>}
        </section>

        <section className="form-section">
          <div className="section-heading"><div><h3>Tags</h3><p>One to twelve discoverable labels.</p></div></div>
          <div className="tag-editor">
            <TextInput id="tag-draft" labelText="Add tag" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
            <Button type="button" kind="tertiary" size="md" renderIcon={Add} onClick={addTag}>Add</Button>
          </div>
          <div className="chip-row">{tags.map((tag) => <DismissibleTag key={tag} type="cool-gray" text={tag} onClose={() => setValue('tags', tags.filter((x) => x !== tag), { shouldValidate: true })} />)}</div>
          {errors.tags && <p className="field-error" role="alert">Tags: {errors.tags.message}</p>}
        </section>

        <section className="form-section">
          <div className="section-heading"><div><h3>Goals & constraints</h3><p>Define the outcome and hard limits.</p></div></div>
          <TextArea id="persona-goals" labelText="Goals *" rows={3} {...register('goals')} invalid={Boolean(errors.goals)} invalidText={errors.goals?.message} />
          <div className="repeat-list">
            {constraints.fields.map((field, index) => (
              <div className="repeat-row" key={field.id}>
                <TextInput id={`constraint-${index}`} labelText={`Constraint ${index + 1}`} {...register(`constraints.${index}`)} invalid={Boolean(errors.constraints?.[index])} invalidText={errors.constraints?.[index]?.message} />
                <Button type="button" kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription={`Remove constraint ${index + 1}`} onClick={() => constraints.remove(index)} />
              </div>
            ))}
            <Button type="button" kind="ghost" size="sm" renderIcon={Add} onClick={() => constraints.append('')}>Add constraint</Button>
            {errors.constraints?.root && <p className="field-error">Constraints: {errors.constraints.root.message}</p>}
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading"><div><h3>Example exchanges</h3><p>Examples belong to the selected technique variant.</p></div></div>
          <div className="repeat-list">
            {examples.fields.map((field, index) => (
              <div className="example-pair" key={field.id}>
                <TextArea id={`example-user-${index}`} labelText={`User message ${index + 1}`} rows={2} {...register(`examples.${index}.user`)} invalid={Boolean(errors.examples?.[index]?.user)} invalidText={errors.examples?.[index]?.user?.message} />
                <TextArea id={`example-reply-${index}`} labelText={`Persona reply ${index + 1}`} rows={2} {...register(`examples.${index}.reply`)} invalid={Boolean(errors.examples?.[index]?.reply)} invalidText={errors.examples?.[index]?.reply?.message} />
                <Button type="button" kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription={`Remove exchange ${index + 1}`} onClick={() => examples.remove(index)} />
              </div>
            ))}
            <Button type="button" kind="ghost" size="sm" renderIcon={Add} onClick={() => examples.append({ user: '', reply: '' })}>Add exchange</Button>
          </div>
        </section>

        <section className="form-section traits-section">
          <div className="section-heading"><div><h3>Trait matrix</h3><p>Move a slider or type an exact value from 0 to 100.</p></div></div>
          <div className="traits-layout">
            <div className="trait-controls">
              {TRAITS.map((trait) => {
                const error = errors.traits?.[trait]
                const inputError = traitInputErrors[trait]
                const parsedValue = Number(traits?.[trait] ?? 0)
                const value = Number.isFinite(parsedValue) ? parsedValue : 0
                const displayValue = traitDrafts[trait] ?? traits?.[trait] ?? ''
                return (
                  <div className="trait-control" key={trait}>
                    <div className="trait-label-row"><label htmlFor={`trait-${trait}`} id={`trait-${trait}-label`}>{pretty(trait)}</label><input id={`trait-${trait}-number`} aria-describedby={(inputError || error) ? `trait-${trait}-error` : undefined} aria-labelledby={`trait-${trait}-label`} aria-label={`${pretty(trait)} numeric value`} className={error || inputError ? 'trait-number error' : 'trait-number'} aria-invalid={Boolean(error || inputError)} type="text" inputMode="numeric" value={displayValue} onChange={(e) => {
                      const raw = e.target.value
                      setTraitDrafts((current) => ({ ...current, [trait]: raw }))
                      let message = ''
                      if (!/^-?\d+(\.\d+)?$/.test(raw.trim())) message = `${trait} must be numeric`
                      else if (!Number.isInteger(Number(raw))) message = `${trait} must be a whole number`
                      else if (Number(raw) < 0 || Number(raw) > 100) message = `${trait} must be between 0 and 100`
                      setTraitInputErrors((current) => { const next = { ...current }; if (message) next[trait] = message; else delete next[trait]; return next })
                      if (!message) setValue(`traits.${trait}`, Number(raw), { shouldValidate: true, shouldDirty: true })
                    }} /></div>
                    <Slider id={`trait-${trait}`} labelText={pretty(trait)} aria-labelledby={`trait-${trait}-label`} aria-describedby={(inputError || error) ? `trait-${trait}-error` : undefined} hideTextInput min={0} max={100} step={1} value={value} onChange={({ value: next }) => {
                      setTraitDrafts((current) => ({ ...current, [trait]: String(next) }))
                      setTraitInputErrors((current) => { const updated = { ...current }; delete updated[trait]; return updated })
                      setValue(`traits.${trait}`, Number(next), { shouldValidate: true, shouldDirty: true })
                    }} />
                    {(inputError || error) && <p id={`trait-${trait}-error`} className="field-error" role="alert">{pretty(trait)}: {inputError || error.message}</p>}
                  </div>
                )
              })}
            </div>
            <TraitRadar primary={traits} />
          </div>
        </section>
      </form>
    </Modal>
  )
}
