import React from 'react'
import { Select, SelectItem, SelectItemGroup, Tag } from '@carbon/react'
import { TRAITS, useAppStore } from '../store'
import TraitRadar from './TraitRadar'

const plainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)

function ProfileColumn({ persona, side }) {
  if (!persona) return <div className="compare-profile empty"><span>Slot {side + 1}</span><h3>Choose a persona</h3><p>Use the selector above or “Add to comparison” on any library card.</p></div>
  return (
    <div className={`compare-profile role-${persona.role.toLowerCase()}`}>
      <div className="compare-identity"><span>{persona.role}</span><h3>{persona.name}</h3><div className="badge-row"><Tag type="cool-gray">{persona.tone}</Tag>{persona.blended && <span className="special-badge blended">Blended</span>}{persona.promotedIteration && <span className="special-badge promoted">Promoted</span>}</div></div>
      <dl><div><dt>Tags</dt><dd><div className="chip-row">{persona.tags.map((tag) => <Tag key={tag} type="blue" size="sm">{tag}</Tag>)}</div></dd></div><div><dt>Goals</dt><dd>{persona.goals}</dd></div><div><dt>Constraints</dt><dd><ul>{persona.constraints.map((item) => <li key={item}>{item}</li>)}</ul></dd></div><div><dt>Prompt body</dt><dd><pre>{plainText(persona.promptBody)}</pre></dd></div></dl>
    </div>
  )
}

export default function CompareView() {
  const personas = useAppStore((s) => s.personas)
  const slots = useAppStore((s) => s.comparisonSlots)
  const setSlot = useAppStore((s) => s.setComparisonSlot)
  const first = personas.find((p) => p.id === slots[0])
  const second = personas.find((p) => p.id === slots[1])
  return (
    <main className="compare-view view-shell solo-view" id="main-content">
      <header className="view-heading"><div><p className="eyebrow">SIDE-BY-SIDE</p><h1>Compare personas</h1><p>Inspect identity, instructions, and trait deltas from the same live records.</p></div></header>
      <div className="compare-selectors panel">
        {[0, 1].map((index) => <Select key={index} id={`comparison-slot-${index}`} labelText={`Persona ${index + 1}`} value={slots[index] || ''} onChange={(e) => setSlot(index, e.target.value)}><SelectItem value="" text="Choose a persona" /><SelectItemGroup label="Personas">{personas.map((p) => <SelectItem key={p.id} value={p.id} text={p.name} />)}</SelectItemGroup></Select>)}
      </div>
      <div className="comparison-dashboard">
        <section className="trait-comparison panel">
          <div className="panel-heading"><div><p className="eyebrow">TRAIT MATRIX</p><h2>Profile overlay</h2></div></div>
          <TraitRadar primary={first?.traits} secondary={second?.traits} primaryName={first?.name || 'Persona 1'} secondaryName={second?.name || 'Persona 2'} />
          <div className="paired-traits">
            {TRAITS.map((trait) => {
              const a = first?.traits[trait]
              const b = second?.traits[trait]
              const delta = first && second ? b - a : 0
              return <div key={trait} className={Math.abs(delta) > 10 ? 'delta-active' : ''}><span>{pretty(trait)}</span><strong>{a ?? '—'}</strong><i>{first && second ? `${delta > 0 ? '+' : ''}${delta}` : '—'}</i><strong>{b ?? '—'}</strong></div>
            })}
          </div>
          <p className="delta-note">Highlighted rows differ by more than 10 points.</p>
        </section>
        <section className="profile-comparison panel"><ProfileColumn persona={first} side={0} /><ProfileColumn persona={second} side={1} /></section>
      </div>
    </main>
  )
}
