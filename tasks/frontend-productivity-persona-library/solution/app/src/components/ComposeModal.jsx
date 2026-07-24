import React, { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, Select, SelectItem, Slider, TextInput, Tag } from '@carbon/react'
import { restoreFocus } from '../focus'
import { TRAITS, deepCopy, useAppStore } from '../store'
import { composeSchema } from '../schema'
import TraitRadar from './TraitRadar'

const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default function ComposeModal() {
  const open = useAppStore((s) => s.ui.composeOpen)
  const allPersonas = useAppStore((s) => s.personas)
  const personas = useMemo(() => allPersonas.filter((p) => !p.archived), [allPersonas])
  const setUI = useAppStore((s) => s.setUI)
  const createPersona = useAppStore((s) => s.createPersona)
  const { register, control, setValue, reset, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(composeSchema), mode: 'onChange',
    defaultValues: { sourceA: personas[0]?.id || '', sourceB: personas[1]?.id || '', weight: 50, name: personas[0] && personas[1] ? `${personas[0].name} + ${personas[1].name}` : '' },
  })
  const values = useWatch({ control })
  const first = personas.find((p) => p.id === values.sourceA)
  const second = personas.find((p) => p.id === values.sourceB)
  const traits = useMemo(() => Object.fromEntries(TRAITS.map((trait) => [trait, Math.round((first?.traits[trait] || 0) * (1 - Number(values.weight || 0) / 100) + (second?.traits[trait] || 0) * Number(values.weight || 0) / 100)])), [first, second, values.weight])
  const constraints = [...new Set([...(first?.constraints || []), ...(second?.constraints || [])])]
  const valid = composeSchema.safeParse(values).success

  useEffect(() => {
    if (!open) return
    const a = personas[0]
    const b = personas[1]
    reset({ sourceA: a?.id || '', sourceB: b?.id || '', weight: 50, name: a && b ? `${a.name} + ${b.name}` : '' })
  }, [open])

  useEffect(() => {
    if (first && second) setValue('name', `${first.name} + ${second.name}`, { shouldValidate: true })
  }, [values.sourceA, values.sourceB])

  const submit = handleSubmit((data) => {
    if (!first || !second) return
    const promptBody = `<h2>Blended perspective</h2><p>Combine the strengths of <strong>${first.name}</strong> and <strong>${second.name}</strong>. Reconcile their approaches into one coherent response.</p>`
    const examples = deepCopy([...(first.examples || []), ...(second.examples || [])].slice(0, 4))
    const variants = [
      { id: 'direct', label: 'Direct instruction', promptBody, examples },
      { id: 'few-shot', label: 'Few-shot', promptBody: `${promptBody}<p>Use the paired examples to calibrate the blend.</p>`, examples },
    ]
    createPersona({
      name: data.name.trim(), role: first.role, tone: Number(data.weight) >= 50 ? second.tone : first.tone,
      tags: [...new Set([...first.tags, ...second.tags])].slice(0, 12), constraints, goals: `Blend ${first.name} and ${second.name} into a balanced working persona.`,
      examples, promptBody, traits, variants, activeVariant: 'direct', activeIteration: null,
    }, { blended: true, blendSources: [first.id, second.id], weight: Number(data.weight) })
    setUI({ composeOpen: false })
    restoreFocus()
  })

  const requestClose = () => {
    setUI({ composeOpen: false })
    restoreFocus()
  }

  return (
    <Modal open={open} size="lg" modalLabel="Composition builder" modalHeading="Compose a Blended Persona" primaryButtonText="Save blend" secondaryButtonText="Cancel" primaryButtonDisabled={!valid} onRequestClose={requestClose} onRequestSubmit={submit}>
      <form className="compose-form" onSubmit={submit}>
        <div className="form-grid form-grid--2">
          <Select id="blend-source-a" labelText="First persona *" {...register('sourceA')} invalid={Boolean(errors.sourceA)} invalidText={errors.sourceA?.message}>{personas.map((p) => <SelectItem key={p.id} value={p.id} text={p.name} />)}</Select>
          <Select id="blend-source-b" labelText="Second persona *" {...register('sourceB')} invalid={Boolean(errors.sourceB)} invalidText={errors.sourceB?.message}>{personas.map((p) => <SelectItem key={p.id} value={p.id} text={p.name} />)}</Select>
        </div>
        <TextInput id="blend-name" labelText="Blend name *" {...register('name')} invalid={Boolean(errors.name)} invalidText={errors.name?.message} />
        <div className="blend-weight">
          <div className="trait-label-row"><label htmlFor="blend-weight">Blend weighting</label><strong>{Number(values.weight || 0)}% toward second persona</strong></div>
          <Slider id="blend-weight" labelText="" aria-label="Blend weight slider"  min={0} max={100} value={Number(values.weight || 0)} onChange={({ value }) => setValue('weight', Number(value), { shouldValidate: true })} />
          {errors.weight && <p className="field-error">Blend weight: {errors.weight.message}</p>}
        </div>
        <div className="blend-preview">
          <div><p className="eyebrow">DERIVED PREVIEW</p><h3>{values.name || 'Untitled blend'}</h3><p>At 0%, traits match {first?.name}; at 100%, they match {second?.name}.</p>
            <div className="blend-traits">{TRAITS.map((trait) => <div key={trait}><span>{pretty(trait)}</span><strong>{traits[trait]}</strong><i><b style={{ width: `${traits[trait]}%` }} /></i></div>)}</div>
          </div>
          <TraitRadar primary={traits} primaryName="Blend" />
        </div>
        <div className="merged-constraints"><h4>Merged constraints</h4><div className="chip-row">{constraints.map((constraint) => <Tag key={constraint} type="cool-gray">{constraint}</Tag>)}</div></div>
      </form>
    </Modal>
  )
}
