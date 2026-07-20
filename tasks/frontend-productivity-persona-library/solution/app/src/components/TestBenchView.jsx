import React, { useEffect, useRef, useState } from 'react'
import { Button, Select, SelectItem, Tag } from '@carbon/react'
import { ArrowDown, Close, Chemistry, Play, StopFilled, UserFollow } from '@carbon/icons-react'
import { SCENARIOS, generateResponse, useAppStore } from '../store'

function AttacherDrawer() {
  const open = useAppStore((s) => s.ui.attacherOpen)
  const personas = useAppStore((s) => s.personas)
  const setUI = useAppStore((s) => s.setUI)
  const setTestPersona = useAppStore((s) => s.setTestPersona)
  const closeRef = useRef(null)
  const drawerRef = useRef(null)
  const previousFocus = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    previousFocus.current = document.activeElement
    closeRef.current?.focus()
    const key = (e) => {
      if (e.key === 'Escape') setUI({ attacherOpen: false })
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = [...drawerRef.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((node) => !node.disabled)
        if (!focusable.length) return
        if (e.shiftKey && document.activeElement === focusable[0]) { e.preventDefault(); focusable.at(-1).focus() }
        else if (!e.shiftKey && document.activeElement === focusable.at(-1)) { e.preventDefault(); focusable[0].focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); previousFocus.current?.focus?.() }
  }, [open])
  if (!open) return null
  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setUI({ attacherOpen: false }) }}>
      <aside ref={drawerRef} className="side-drawer attacher-drawer" role="dialog" aria-modal="true" aria-labelledby="attacher-title">
        <header><div><p className="eyebrow">PERSONA ATTACHER</p><h2 id="attacher-title">Choose a persona</h2></div><Button ref={closeRef} kind="ghost" hasIconOnly renderIcon={Close} iconDescription="Close attacher" onClick={() => setUI({ attacherOpen: false })} /></header>
        <p>Choose with the keyboard, or drag an entry onto the highlighted slot.</p>
        <div className="attacher-list">
          {personas.map((persona) => (
            <button key={persona.id} draggable onDragStart={(event) => { event.dataTransfer.setData('text/persona-id', persona.id); event.dataTransfer.effectAllowed = 'copy'; document.body.classList.add('dragging-persona') }} onDragEnd={() => document.body.classList.remove('dragging-persona')} onClick={() => setTestPersona(persona.id)}>
              <span className={`role-dot ${persona.role.toLowerCase()}`} /><span><strong>{persona.name}</strong><small>{persona.role} · {persona.tone}</small></span><UserFollow />
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default function TestBenchView() {
  const personas = useAppStore((s) => s.personas)
  const bench = useAppStore((s) => s.testBench)
  const persona = personas.find((p) => p.id === bench.personaId)
  const scenario = SCENARIOS.find((s) => s.id === bench.scenarioId)
  const setUI = useAppStore((s) => s.setUI)
  const setTestPersona = useAppStore((s) => s.setTestPersona)
  const setScenario = useAppStore((s) => s.setScenario)
  const startRun = useAppStore((s) => s.startRun)
  const beginStreaming = useAppStore((s) => s.beginStreaming)
  const appendTranscript = useAppStore((s) => s.appendTranscript)
  const finishRun = useAppStore((s) => s.finishRun)
  const setFollow = useAppStore((s) => s.setFollow)
  const restoreRun = useAppStore((s) => s.restoreRun)
  const [dragOver, setDragOver] = useState(false)
  const transcriptRef = useRef(null)

  useEffect(() => {
    if (bench.status !== 'waiting') return undefined
    const timer = window.setTimeout(beginStreaming, 320)
    return () => window.clearTimeout(timer)
  }, [bench.status, beginStreaming])

  useEffect(() => {
    if (bench.status !== 'streaming') return undefined
    if (bench.transcript.length >= bench.target.length) { finishRun(false); return undefined }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chunkSize = reduced ? 18 : 4
    const timer = window.setTimeout(() => appendTranscript(bench.target.slice(bench.transcript.length, bench.transcript.length + chunkSize)), reduced ? 28 : 22)
    return () => window.clearTimeout(timer)
  }, [bench.status, bench.transcript, bench.target, appendTranscript, finishRun])

  useEffect(() => {
    if (bench.follow && transcriptRef.current) transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
  }, [bench.transcript, bench.follow])

  const run = () => {
    if (!persona || !scenario || ['waiting', 'streaming'].includes(bench.status)) return
    startRun(generateResponse(persona, scenario))
  }

  const statusLabel = bench.status === 'waiting' ? 'Waiting' : bench.status === 'streaming' ? 'Streaming' : bench.status === 'complete' ? 'Complete' : bench.status === 'stopped' ? 'Stopped' : 'Ready'

  return (
    <main className="testbench-view view-shell solo-view" id="main-content">
      <header className="view-heading"><div><p className="eyebrow">SIMULATION LAB</p><h1>Test Bench</h1><p>Run deterministic scenarios and see how a persona’s traits shape its response.</p></div><Tag type={bench.status === 'streaming' ? 'blue' : bench.status === 'complete' ? 'green' : 'cool-gray'} className="status-tag"><span className={bench.status === 'streaming' ? 'status-pulse' : ''} />{statusLabel}</Tag></header>
      <div className="bench-layout">
        <section className="bench-main panel">
          <div className="bench-controls">
            <div
              className={`persona-slot ${dragOver ? 'drop-active' : ''} ${persona ? 'filled' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData('text/persona-id'); if (id) setTestPersona(id) }}
            >
              <span className="slot-icon"><Chemistry /></span>
              {persona ? <div><small>ATTACHED PERSONA</small><strong>{persona.name}</strong><span>{persona.role} · formality {persona.traits.formality} · verbosity {persona.traits.verbosity}</span></div> : <div><small>PERSONA SLOT</small><strong>Drop or choose a persona</strong><span>The slot highlights while a persona is dragged over it.</span></div>}
              <Button size="sm" kind="tertiary" onClick={() => setUI({ attacherOpen: true })}>{persona ? 'Change' : 'Choose'}</Button>
            </div>
            <div className="scenario-control"><Select id="scenario-select" labelText="Scenario" value={bench.scenarioId} onChange={(e) => setScenario(e.target.value)}>{SCENARIOS.map((item) => <SelectItem key={item.id} value={item.id} text={item.name} />)}</Select><p>{scenario?.prompt}</p></div>
            {['waiting', 'streaming'].includes(bench.status) ? <Button kind="danger" renderIcon={StopFilled} onClick={() => finishRun(true)}>Stop</Button> : <Button renderIcon={Play} disabled={!persona} onClick={run}>Run scenario</Button>}
          </div>

          <div className="transcript-wrap">
            <div className="transcript-heading"><div><span>SIMULATED RESPONSE</span><strong>{persona?.name || 'No persona attached'}</strong></div><span>{bench.transcript.length} characters</span></div>
            <div
              className="transcript-pane"
              ref={transcriptRef}
              onScroll={(e) => { const node = e.currentTarget; const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 48; if (!atBottom && bench.status === 'streaming') setFollow(false) }}
            >
              {bench.transcript ? <p>{bench.transcript}<span className={bench.status === 'streaming' ? 'stream-caret' : ''} /></p> : <div className="transcript-empty"><Chemistry /><strong>Your transcript will appear here</strong><span>Choose a persona and run the selected scenario.</span></div>}
            </div>
            {!bench.follow && bench.status === 'streaming' && <Button className="jump-latest" size="sm" kind="tertiary" renderIcon={ArrowDown} onClick={() => { setFollow(true); transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' }) }}>Jump to latest</Button>}
          </div>
        </section>
        <aside className="run-history panel"><div className="panel-heading"><div><p className="eyebrow">RUN LOG</p><h2>History</h2></div><span>{bench.history.length}</span></div>{bench.history.length ? <div className="history-list">{bench.history.map((run) => <button key={run.id} onClick={() => restoreRun(run.id)}><strong>{run.personaName}</strong><span>{run.scenarioName}</span><small>{new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {run.length} chars {run.stopped ? '· stopped' : ''}</small></button>)}</div> : <div className="mini-empty"><p>No runs yet.</p><span>Completed and stopped runs appear here.</span></div>}</aside>
      </div>
      <AttacherDrawer />
    </main>
  )
}
