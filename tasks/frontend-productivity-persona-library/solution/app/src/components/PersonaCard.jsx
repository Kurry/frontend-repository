import React from 'react'
import { Button, Checkbox, Tag } from '@carbon/react'
import { Copy, Edit, Chemistry, Information, Launch, Renew, Scale } from '@carbon/icons-react'
import { TRAITS, useAppStore } from '../store'

const plainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default function PersonaCard({ persona, index = 0 }) {
  const flipped = useAppStore((s) => s.flippedIds.includes(persona.id))
  const selected = useAppStore((s) => s.selectedIds.includes(persona.id))
  const toggleFlip = useAppStore((s) => s.toggleFlip)
  const toggleSelected = useAppStore((s) => s.toggleSelected)
  const openEditor = useAppStore((s) => s.openEditor)
  const clonePersona = useAppStore((s) => s.clonePersona)
  const openInTestBench = useAppStore((s) => s.openInTestBench)
  const addToComparison = useAppStore((s) => s.addToComparison)
  const openDetail = useAppStore((s) => s.openDetail)
  const toast = useAppStore((s) => s.toast)
  const variant = persona.variants.find((v) => v.id === persona.activeVariant)
  const prompt = plainText(persona.promptBody)

  const flip = (event) => {
    if (event.target.closest('button,input,a,[role="checkbox"]')) return
    toggleFlip(persona.id)
  }

  return (
    <article
      className={`card-shell role-${persona.role.toLowerCase()} ${persona.archived ? 'archived' : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      aria-label={`${persona.name}, ${persona.role}${persona.archived ? ', archived' : ''}`}
      tabIndex={0}
      onClick={!flipped ? flip : undefined}
      onKeyDown={(event) => {
        if (!flipped && (event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); toggleFlip(persona.id) }
      }}
    >
      <div className={`persona-card ${flipped ? 'is-flipped' : ''}`}>
        <div className="card-face card-front" aria-hidden={flipped}>
          <div className="card-select" onClick={(e) => e.stopPropagation()}>
            <Checkbox id={`select-${persona.id}`} labelText={`Select ${persona.name}`} hideLabel checked={selected} onChange={(_, data) => toggleSelected(persona.id, data?.checked)} />
          </div>
          <div className="card-kicker"><span className="role-label">{persona.role}</span><span>{variant?.label || persona.activeVariant}</span></div>
          <h3 title={persona.name}>{persona.name}</h3>
          <div className="badge-row">
            <Tag type="cool-gray" size="sm">{pretty(persona.tone)}</Tag>
            {persona.blended && <span className="special-badge blended">Blended</span>}
            {persona.promotedIteration && <span className="special-badge promoted">Promoted</span>}
            {persona.archived && <span className="special-badge archived-label">Archived</span>}
          </div>
          <div className="chip-row card-tags">{persona.tags.slice(0, 3).map((tag) => <Tag key={tag} type="blue" size="sm">{tag}</Tag>)}</div>
          <p className="prompt-preview">{prompt}</p>
          <div className="trait-summary" aria-label="Trait summary">
            {TRAITS.map((trait) => <span key={trait} title={`${pretty(trait)} ${persona.traits[trait]}`}><i style={{ width: `${persona.traits[trait]}%` }} />{trait.slice(0, 3)} {persona.traits[trait]}</span>)}
          </div>
          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Edit} tooltipAlignment="center" tooltipPosition="bottom" iconDescription={`Edit ${persona.name}`} onClick={() => openEditor(persona.id)} />
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Renew} tooltipAlignment="center" tooltipPosition="bottom" iconDescription={`Clone ${persona.name}`} onClick={() => clonePersona(persona.id)} />
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Information} tooltipAlignment="center" tooltipPosition="bottom" iconDescription={`Details for ${persona.name}`} onClick={() => openDetail(persona.id)} />
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Chemistry} tooltipAlignment="center" tooltipPosition="bottom" iconDescription={`Open ${persona.name} in Test Bench`} onClick={() => openInTestBench(persona.id)} />
            <Button kind="ghost" size="sm" hasIconOnly renderIcon={Scale} tooltipAlignment="center" tooltipPosition="bottom" iconDescription={`Add ${persona.name} to comparison`} onClick={() => addToComparison(persona.id)} />
          </div>
        </div>
        <div
          className="card-face card-back"
          aria-hidden={!flipped}
          onClick={flipped ? flip : undefined}
          onKeyDown={(event) => {
            if (flipped && (event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); toggleFlip(persona.id) }
          }}
          tabIndex={flipped ? 0 : -1}
        >
          <div className="card-back-heading"><div><span>System prompt</span><strong>{persona.name}</strong></div><Button kind="ghost" size="sm" hasIconOnly renderIcon={Copy} tooltipAlignment="center" tooltipPosition="bottom" iconDescription="Copy system prompt" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(prompt); toast('System prompt copied') }} /></div>
          <pre>{prompt}</pre>
          <p>Click the card or press Enter to flip back.</p>
          <Button kind="tertiary" size="sm" renderIcon={Launch} onClick={(e) => { e.stopPropagation(); openEditor(persona.id) }}>Edit prompt</Button>
        </div>
      </div>
    </article>
  )
}
