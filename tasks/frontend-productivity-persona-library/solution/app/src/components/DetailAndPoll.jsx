import React, { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Modal, Tag } from '@carbon/react'
import { ChartRelationship, Trophy, UserMultiple } from '@carbon/icons-react'
import { TRAITS, useAppStore } from '../store'

const pretty = (value) => value.charAt(0).toUpperCase() + value.slice(1)
const displayValue = (value) => Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')

function DiffView({ older, newer }) {
  const changes = useMemo(() => {
    if (!older || !newer) return []
    const result = []
    const fields = ['name', 'role', 'tone', 'tags', 'constraints', 'goals', 'examples', 'activeVariant']
    fields.forEach((field) => {
      if (JSON.stringify(older.snapshot[field]) !== JSON.stringify(newer.snapshot[field])) result.push({ field, before: older.snapshot[field], after: newer.snapshot[field] })
    })
    TRAITS.forEach((trait) => {
      if (older.snapshot.traits?.[trait] !== newer.snapshot.traits?.[trait]) result.push({ field: `Trait: ${trait}`, before: older.snapshot.traits?.[trait], after: newer.snapshot.traits?.[trait] })
    })
    if (older.snapshot.promptBody !== newer.snapshot.promptBody) result.push({ field: 'promptBody', before: older.snapshot.promptBody, after: newer.snapshot.promptBody })
    return result
  }, [older, newer])
  if (!older || !newer) return <div className="diff-empty"><ChartRelationship /><p>Select exactly two iterations to compare.</p></div>
  return (
    <div className="diff-view">
      <div className="diff-heading"><span>{new Date(older.timestamp).toLocaleString()}</span><b>→</b><span>{new Date(newer.timestamp).toLocaleString()}</span></div>
      {changes.length ? changes.map((change) => change.field === 'promptBody' ? (
        <div className="diff-field prompt-diff" key={change.field}><h4>Prompt body</h4><pre className="removed">− {change.before.replace(/<[^>]*>/g, ' ')}</pre><pre className="added">+ {change.after.replace(/<[^>]*>/g, ' ')}</pre></div>
      ) : (
        <div className="diff-field" key={change.field}><h4>{pretty(change.field)}</h4><div><span className="before">{displayValue(change.before)}</span><b>→</b><span className="after">{displayValue(change.after)}</span></div></div>
      )) : <p className="no-changes">No field-level changes between these iterations.</p>}
    </div>
  )
}

function PollOverlay() {
  const poll = useAppStore((s) => s.poll)
  const persona = useAppStore((s) => s.personas.find((p) => p.id === poll.personaId))
  const addVote = useAppStore((s) => s.addVote)
  const finishPoll = useAppStore((s) => s.finishPoll)
  const closePoll = useAppStore((s) => s.closePoll)

  useEffect(() => {
    if (!poll.open || !poll.running || !persona) return undefined
    const ids = persona.iterations.map((iteration) => iteration.id)
    const latest = ids.at(-1)
    const previous = ids.at(-2)
    const picks = poll.round % 2 ? [latest, previous, latest] : [previous, latest, previous]
    const teammates = ['Avery', 'Jordan', 'Sam']
    const timers = picks.map((iterationId, index) => window.setTimeout(() => addVote({ teammate: teammates[index], iterationId, id: `${poll.round}-${index}` }), 650 + index * 720))
    timers.push(window.setTimeout(finishPoll, 650 + picks.length * 720))
    return () => timers.forEach(window.clearTimeout)
  }, [poll.open, poll.running, poll.round, poll.personaId])

  if (!persona) return null
  const counts = poll.votes.reduce((acc, vote) => ({ ...acc, [vote.iterationId]: (acc[vote.iterationId] || 0) + 1 }), {})
  return (
    <Modal open={poll.open} modalLabel="Iteration voting" modalHeading={`Poll · ${persona.name}`} passiveModal onRequestClose={closePoll} size="sm">
      <div className="poll-status"><span className={poll.running ? 'vote-pulse' : 'vote-complete'}><UserMultiple /></span><div><strong>{poll.running ? 'Teammates are voting…' : 'Poll closed'}</strong><p>{poll.running ? `${poll.votes.length} of 3 votes received` : 'The winning iteration is now promoted.'}</p></div></div>
      <div className="poll-options">
        {[...persona.iterations].reverse().map((iteration, index) => {
          const promoted = persona.promotedIteration === iteration.id
          return <div key={iteration.id} className={promoted ? 'poll-option winner' : 'poll-option'}><div><small>ITERATION {persona.iterations.length - index}</small><strong>{iteration.summary}</strong><span>{new Date(iteration.timestamp).toLocaleString()}</span></div><b>{counts[iteration.id] || 0}</b>{promoted && <Tag type="green" renderIcon={Trophy}>Promoted</Tag>}</div>
        })}
      </div>
      <div className="vote-arrivals" aria-live="polite">{poll.votes.map((vote) => <div key={vote.id}><span>{vote.teammate.charAt(0)}</span><p><strong>{vote.teammate}</strong> voted for iteration {persona.iterations.findIndex((x) => x.id === vote.iterationId) + 1}</p></div>)}</div>
    </Modal>
  )
}

export default function DetailAndPoll() {
  const detailId = useAppStore((s) => s.ui.detailId)
  const persona = useAppStore((s) => s.personas.find((p) => p.id === detailId))
  const setUI = useAppStore((s) => s.setUI)
  const startPoll = useAppStore((s) => s.startPoll)
  const pollMessage = useAppStore((s) => s.poll.message)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (persona) setSelected(persona.iterations.slice(-2).map((iteration) => iteration.id))
  }, [persona?.id, persona?.iterations.length])

  const selectedIterations = selected.map((id) => persona?.iterations.find((iteration) => iteration.id === id)).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  return (
    <>
      <Modal open={Boolean(persona)} modalLabel="Persona detail" modalHeading={persona?.name || 'Persona detail'} passiveModal onRequestClose={() => setUI({ detailId: null })} size="lg">
        {persona && <div className="detail-layout">
          <section className="iterations-panel"><div className="section-heading"><div><h3>Version history</h3><p>Newest first · select two iterations for a field-level diff.</p></div><Button size="sm" kind="tertiary" renderIcon={UserMultiple} onClick={() => startPoll(persona.id)}>Start poll</Button></div>
            {pollMessage && persona.iterations.length < 2 && <p className="inline-notice">{pollMessage}</p>}
            <div className="iteration-list">{[...persona.iterations].reverse().map((iteration, reverseIndex) => {
              const checked = selected.includes(iteration.id)
              const number = persona.iterations.length - reverseIndex
              return <div key={iteration.id} className={persona.promotedIteration === iteration.id ? 'iteration-row promoted-row' : 'iteration-row'}><Checkbox id={`iteration-${iteration.id}`} labelText={`Select iteration ${number}`} hideLabel checked={checked} onChange={() => setSelected((current) => checked ? current.filter((id) => id !== iteration.id) : current.length >= 2 ? [current[1], iteration.id] : [...current, iteration.id])} /><div><small>ITERATION {number}</small><strong>{iteration.summary}</strong><span>{new Date(iteration.timestamp).toLocaleString()}</span></div>{persona.promotedIteration === iteration.id && <Tag type="green">Promoted</Tag>}{iteration.id === persona.activeIteration && <Tag type="blue">Current</Tag>}</div>
            })}</div>
          </section>
          <section className="diff-panel"><div className="section-heading"><div><h3>Field-level diff</h3><p>Real values captured at each save.</p></div></div><DiffView older={selectedIterations[0]} newer={selectedIterations[1]} /></section>
        </div>}
      </Modal>
      <PollOverlay />
    </>
  )
}
