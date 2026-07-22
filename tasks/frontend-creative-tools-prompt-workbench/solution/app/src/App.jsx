import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Button, Checkbox, ComposedModal, InlineNotification, ModalBody, ModalFooter, ModalHeader,
  Select, SelectItem, SelectItemGroup, Tag, TextInput, Tile,
} from '@carbon/react'
import {
  Add, ArrowDown, Attachment, Checkmark, CheckmarkOutline, ChevronDown, ChevronLeft, ChevronRight,
  Close, Code, Copy, DocumentExport, FolderOpen, Hourglass, Information, Launch, PauseOutline,
  PlayFilledAlt, PlayOutline, Redo, Save, Search, StopFilledAlt, TrashCan, Undo, Upload, UserAvatar,
} from '@carbon/icons-react'
import { PromptEditor } from './PromptEditor'
import { useDialogFocus } from './useDialogFocus'
import { ASSETS, MODELS, PERSONAS, SUGGESTIONS, TECHNIQUES, detectVariables, estimateCost, estimateTokens, modelById } from './data'
import { useWorkbench } from './store'
import { variableInsertSchema } from './schemas'
import { MOD_KEY, copyText, displayText, iconOnly, useModalEscapeReturn } from './uiUtils'

// Lazy: none of these render anything until their own `open` flag flips true
// (see the mount gate in App() below), so the chunk — and the react-hook-form
// + zod resolver wiring it pulls in — never loads on the cold-load path that
// the technical/cold_load_interactive_2s criterion measures.
const SaveModal = lazy(() => import('./Overlays').then((module) => ({ default: module.SaveModal })))
const ExportModal = lazy(() => import('./Overlays').then((module) => ({ default: module.ExportModal })))
const ImportModal = lazy(() => import('./Overlays').then((module) => ({ default: module.ImportModal })))
const CommandPalette = lazy(() => import('./Overlays').then((module) => ({ default: module.CommandPalette })))
function useMotionPreference() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced)
  }, [reduced])
  return [reduced, setReduced]
}

function AppHeader() {
  const activeView = useWorkbench((state) => state.activeView)
  const switchView = useWorkbench((state) => state.switchView)
  const setChrome = useWorkbench((state) => state.setChrome)
  const [reduced, setReduced] = useMotionPreference()
  return (
    <header className="app-header">
      <button className="brand" onClick={() => switchView('workbench')} aria-label="Prompt Studio home">
        <span className="brand-mark">P</span>
        <span><strong>Prompt Studio</strong><small>Authoring workbench</small></span>
      </button>
      <nav aria-label="Primary navigation" className="header-nav">
        <Button kind={activeView === 'workbench' ? 'primary' : 'ghost'} size="sm" onClick={() => switchView('workbench')}>Workbench</Button>
        <Button kind={activeView === 'library' ? 'primary' : 'ghost'} size="sm" onClick={() => switchView('library')}>Library</Button>
        <Button kind="ghost" size="sm" renderIcon={Upload} onClick={() => setChrome('importOpen', true)}>Import</Button>
      </nav>
      <button className="motion-toggle" aria-pressed={reduced} onClick={() => setReduced((value) => !value)} title="Applies instantly and mirrors prefers-reduced-motion">
        {reduced ? <PauseOutline size={16} /> : <PlayOutline size={16} />}<span>Motion {reduced ? 'off' : 'on'}</span>
      </button>
      <button className="shortcut-hint" onClick={() => setChrome('commandOpen', true)} aria-label="Open command palette">
        <Search size={16} /><span>Search commands</span><kbd>{MOD_KEY} K</kbd>
      </button>
    </header>
  )
}

function Toolbar({ editorRef, variableSelectionRef }) {
  const draft = useWorkbench((state) => state.draft)
  const selectedModelId = useWorkbench((state) => state.selectedModelId)
  const setModel = useWorkbench((state) => state.setModel)
  const activePersona = useWorkbench((state) => state.activePersona)
  const streamingRunId = useWorkbench((state) => state.streamingRunId)
  const undoStack = useWorkbench((state) => state.undoStack)
  const redoStack = useWorkbench((state) => state.redoStack)
  const startRun = useWorkbench((state) => state.startRun)
  const stopRun = useWorkbench((state) => state.stopRun)
  const undo = useWorkbench((state) => state.undo)
  const redo = useWorkbench((state) => state.redo)
  const setChrome = useWorkbench((state) => state.setChrome)
  const tokenCount = estimateTokens(draft, selectedModelId)
  const cost = estimateCost(draft, selectedModelId)

  const openVariable = () => {
    variableSelectionRef.current = editorRef.current?.selection() || { from: draft.length, to: draft.length }
    setChrome('variableOpen', true)
  }

  useEffect(() => {
    const shortcut = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'i') return
      event.preventDefault()
      openVariable()
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  })

  return (
    <div className="toolbar" aria-label="Prompt toolbar">
      <Select id="model-select" labelText="Model" hideLabel value={selectedModelId} onChange={(event) => setModel(event.target.value)} className="model-select" aria-label="Selected model">
        {[...new Set(MODELS.map((model) => model.provider))].map((provider) => (
          <SelectItemGroup key={provider} label={provider}>
            {MODELS.filter((model) => model.provider === provider).map((model) => <SelectItem key={model.id} value={model.id} text={model.name} />)}
          </SelectItemGroup>
        ))}
      </Select>
      <div className="metric" title={`Estimated for ${modelById(selectedModelId).name}`}><strong>{tokenCount.toLocaleString()}</strong><span>tokens</span></div>
      <div className="metric"><strong>${cost.toFixed(5)}</strong><span>estimate</span></div>
      <span className="toolbar-divider" />
      <Button size="sm" kind="tertiary" renderIcon={Add} onClick={openVariable}>Insert Variable</Button>
      <Button size="sm" kind={activePersona ? 'secondary' : 'tertiary'} renderIcon={UserAvatar} onClick={() => setChrome('personaOpen', true)}>Persona</Button>
      <Button size="sm" kind="tertiary" renderIcon={Save} onClick={() => setChrome('saveOpen', true)}>Save</Button>
      <Button size="sm" kind="tertiary" renderIcon={DocumentExport} onClick={() => setChrome('exportOpen', true)}>Export</Button>
      <Button size="sm" kind="ghost" renderIcon={Undo} onClick={undo} disabled={!undoStack.length} {...iconOnly('Undo')} />
      <Button size="sm" kind="ghost" renderIcon={Redo} onClick={redo} disabled={!redoStack.length} {...iconOnly('Redo')} />
      {streamingRunId
        ? <Button className="toolbar-run" size="sm" kind="danger" renderIcon={StopFilledAlt} onClick={stopRun}>Stop</Button>
        : <Button className="toolbar-run" size="sm" kind="primary" renderIcon={PlayFilledAlt} onClick={startRun} disabled={!draft.trim()}>Run</Button>}
    </div>
  )
}

function Coachmark() {
  const [dismissed, setDismissed] = useState(() => window.__coachmarkDismissed === true)
  if (dismissed) return null
  const dismiss = () => { window.__coachmarkDismissed = true; setDismissed(true) }
  return (
    <div className="coachmark" role="region" aria-label="Quick start guide">
      <Information size={18} />
      <ol>
        <li><span className="step-num">1</span><span>Insert a <strong>variable</strong> with {MOD_KEY}+I or Insert Variable.</span></li>
        <li><span className="step-num">2</span><span>Bind its value in the <strong>bindings</strong> panel.</span></li>
        <li><span className="step-num">3</span><span>Press <strong>Run</strong> to stream a response.</span></li>
      </ol>
      <Button size="sm" kind="ghost" onClick={dismiss}>Got it</Button>
    </div>
  )
}

function SuggestionRow({ editorRef }) {
  const setDraft = useWorkbench((state) => state.setDraft)
  return (
    <div className="suggestion-row" aria-label="Prompt suggestions">
      {SUGGESTIONS.map((suggestion) => (
        <button key={suggestion.label} className="suggestion-chip" onClick={() => { setDraft(suggestion.text); requestAnimationFrame(() => editorRef.current?.focus()) }}>
          <Launch size={14} /><span>{suggestion.label}</span>
        </button>
      ))}
    </div>
  )
}

function AttachmentBadges() {
  const ids = useWorkbench((state) => state.attachmentIds)
  const remove = useWorkbench((state) => state.removeAttachment)
  const setChrome = useWorkbench((state) => state.setChrome)
  const [leaving, setLeaving] = useState([])
  const removeWithExit = (id) => {
    if (leaving.includes(id)) return
    setLeaving((current) => [...current, id])
    window.setTimeout(() => {
      remove(id)
      setLeaving((current) => current.filter((item) => item !== id))
    }, 170)
  }
  return (
    <div className="attachment-strip">
      {ids.map((id) => {
        const asset = ASSETS.find((item) => item.id === id)
        if (!asset) return null
        return (
          <span className={`attachment-badge${leaving.includes(id) ? ' leaving' : ''}`} key={id} tabIndex={0}>
            <Attachment size={14} /><span>{asset.name}</span>
            <button className="attachment-remove" onClick={() => removeWithExit(id)} aria-label={`Remove ${asset.name}`}><Close size={14} /></button>
            <span className="attachment-preview" role="tooltip"><strong>{asset.name}</strong><small>{asset.type} attachment</small></span>
          </span>
        )
      })}
      <Button size="sm" kind="ghost" renderIcon={Add} onClick={() => setChrome('assetOpen', true)}>Add Asset</Button>
    </div>
  )
}

function PersonaChip() {
  const persona = useWorkbench((state) => state.activePersona)
  const clear = useWorkbench((state) => state.clearPersona)
  if (!persona) return null
  return (
    <div className="persona-chip">
      <UserAvatar size={16} /><span>Persona: <strong>{persona.name}</strong></span>
      <button aria-label={`Clear ${persona.name} persona`} onClick={clear}><Close size={14} /></button>
    </div>
  )
}

function VariablePanel() {
  const draft = useWorkbench((state) => state.draft)
  const bindings = useWorkbench((state) => state.bindings)
  const setBinding = useWorkbench((state) => state.setBinding)
  const variables = detectVariables(draft)
  return (
    <aside className="side-panel" aria-labelledby="variables-title">
      <div className="panel-heading">
        <div><p className="eyebrow">Live context</p><h2 id="variables-title">Variable Bindings</h2></div>
        <Tag type="cool-gray" size="sm">{variables.length}</Tag>
      </div>
      {variables.length ? (
        <div className="binding-list">
          {variables.map((name) => (
            <Tile key={name} className="binding-card">
              <div className="binding-meta"><code>{`{{${name}}}`}</code>{!bindings[name] && <Tag type="warm-gray" size="sm">Unbound</Tag>}</div>
              <TextInput id={`binding-${name}`} labelText={`${name} value`} value={bindings[name] || ''} placeholder={`Value for ${name}`} onChange={(event) => setBinding(name, event.target.value)} />
            </Tile>
          ))}
        </div>
      ) : (
        <div className="empty-state compact"><Code size={28} /><h3>No variables yet</h3><p>Wrap a name in double braces in the editor, or use Insert Variable, and it appears here for binding.</p></div>
      )}
      <LivePreview />
    </aside>
  )
}

function HighlightedPrompt({ text, bindings }) {
  const pieces = text.split(/(\{\{[A-Za-z0-9_]+\}\})/g)
  return pieces.map((piece, index) => {
    const match = piece.match(/^\{\{([A-Za-z0-9_]+)\}\}$/)
    if (!match) return <span key={index}>{piece}</span>
    const value = bindings[match[1]]
    return value
      ? <span key={index} className="resolved-value">{value}</span>
      : <mark key={index} className="unbound-value" title={`Unbound variable: ${match[1]}`}>{piece}<span className="sr-only"> unbound</span></mark>
  })
}

function LivePreview() {
  const draft = useWorkbench((state) => state.draft)
  const bindings = useWorkbench((state) => state.bindings)
  const persona = useWorkbench((state) => state.activePersona)
  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div className="panel-heading mini"><div><p className="eyebrow">Resolved instantly</p><h2 id="preview-title">Live Preview</h2></div><span className="live-dot">Live</span></div>
      <div className="preview-content" aria-live="polite">
        {persona && <div className="preface"><span>System · {persona.name}</span><p>{persona.preface}</p></div>}
        <div className="preview-body">
          {draft ? <HighlightedPrompt text={draft} bindings={bindings} /> : <span className="muted">Your resolved prompt will appear here.</span>}
        </div>
      </div>
    </section>
  )
}

function StepPanel({ run }) {
  const complete = run.steps.filter((step) => step.status === 'complete').length
  return (
    <div className="step-panel">
      <div className="step-rollup"><strong>Run Steps</strong><span>{complete} of {run.steps.length} complete</span></div>
      <div className="steps">
        {run.steps.map((step, index) => <div key={step.id} className={`step step-${step.status}`}><span className="step-index">{step.status === 'complete' ? <Checkmark size={13} /> : index + 1}</span><span><strong>{step.name}</strong><small>{step.output || step.status}</small></span><em>{step.status}</em></div>)}
      </div>
    </div>
  )
}

function RichResponse({ text }) {
  const [copied, setCopied] = useState('')
  const addToast = useWorkbench((state) => state.addToast)
  const parts = text.split(/```([A-Za-z0-9_+-]*)\n([\s\S]*?)```/g)
  const copyCode = async (code) => {
    await copyText(code)
    setCopied(code)
    addToast('Code copied to clipboard')
    window.setTimeout(() => setCopied(''), 1800)
  }
  return (
    <div className="response-prose">
      {parts.map((part, index) => {
        if (index % 3 === 0) return <span key={index} className="response-text">{part}</span>
        if (index % 3 === 1) return null
        const language = parts[index - 1] || 'text'
        return <div className="code-block" key={index}><div className="code-header"><span>{language}</span><button onClick={() => copyCode(part)}>{copied === part ? <CheckmarkOutline size={16} /> : <Copy size={16} />}{copied === part ? 'Copied' : 'Copy'}</button></div><pre><code>{part}</code></pre></div>
      })}
    </div>
  )
}

function Reasoning({ run }) {
  const toggle = useWorkbench((state) => state.toggleReasoning)
  const reasoning = run.variants[run.variantIndex]?.reasoning || ''
  return (
    <section className={`reasoning ${run.reasoningExpanded ? 'open' : ''}`}>
      <button className="reasoning-header" onClick={() => toggle(run.id)} aria-expanded={run.reasoningExpanded} aria-controls={`reasoning-${run.id}`}>
        <span className="reasoning-icon"><ChevronDown size={18} /></span>
        <span><strong>Reasoning</strong><small>{run.status === 'streaming' ? <><i className="active-pulse" /> Active while generating</> : `Completed in ${run.reasoningDuration || 1}s`}</small></span>
      </button>
      <div id={`reasoning-${run.id}`} className="reasoning-region" aria-hidden={!run.reasoningExpanded}><p>{reasoning}</p></div>
    </section>
  )
}

function ResponsePanel() {
  const runs = useWorkbench((state) => state.runs)
  const activeRunId = useWorkbench((state) => state.activeRunId)
  const followScroll = useWorkbench((state) => state.followScroll)
  const selectRun = useWorkbench((state) => state.selectRun)
  const setFollow = useWorkbench((state) => state.setFollowScroll)
  const setVariant = useWorkbench((state) => state.setVariant)
  const bodyRef = useRef(null)
  const pinningRef = useRef(false)
  const [stagger, setStagger] = useState(false)
  const [settled, setSettled] = useState(false)
  const prevStatusRef = useRef(null)
  const prevVariantRef = useRef(null)
  const run = runs.find((item) => item.id === activeRunId)

  useEffect(() => {
    if (followScroll && bodyRef.current) {
      pinningRef.current = true
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      requestAnimationFrame(() => { pinningRef.current = false })
    }
  }, [run?.accumulatedText, followScroll])

  // Settle cue: when a stream finishes, morph the status pill and sweep the response.
  useEffect(() => {
    const status = run?.status ?? null
    const was = prevStatusRef.current
    prevStatusRef.current = status
    if (was === 'streaming' && (status === 'complete' || status === 'stopped')) {
      setSettled(true)
      const timer = window.setTimeout(() => setSettled(false), 1200)
      return () => window.clearTimeout(timer)
    }
  }, [run?.status])

  // Coordinated stagger beat when flipping variants of a completed run.
  useEffect(() => {
    const key = run ? `${run.id}:${run.variantIndex}` : null
    const prev = prevVariantRef.current
    prevVariantRef.current = key
    if (!run || !prev || prev === key || run.status !== 'complete' || !prev.startsWith(`${run.id}:`)) return
    setStagger(true)
    const timer = window.setTimeout(() => setStagger(false), 520)
    return () => window.clearTimeout(timer)
  }, [run?.id, run?.variantIndex, run?.status])

  if (!runs.length) return <section className="response-empty"><div><span className="spark">✦</span><h2>Responses Appear Here</h2><p>Run your prompt to stream a response, inspect reasoning, and compare variants.</p></div></section>
  if (!run) return null
  const isStreaming = run.status === 'streaming'
  const displayed = isStreaming ? run.accumulatedText : (run.variants[run.variantIndex]?.response || run.accumulatedText)
  const statusLabel = isStreaming ? (run.accumulatedText ? 'Streaming' : 'Waiting') : run.status === 'complete' ? 'Complete' : 'Stopped'
  const handleScroll = () => {
    const element = bodyRef.current
    if (!element || !isStreaming || pinningRef.current) return
    setFollow(element.scrollHeight - element.scrollTop - element.clientHeight < 36)
  }
  const jump = () => { setFollow(true); requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }) }
  return (
    <section className="response-panel" aria-labelledby="response-title">
      <div className="response-topline">
        <div><p className="eyebrow">Generated output</p><h2 id="response-title">Response</h2></div>
        <div className="run-meta"><span className={`status status-${run.status}${settled ? ' morph' : ''}`}>{isStreaming && <i />}{statusLabel}</span><span>{run.modelName}</span><span>{new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
      </div>
      <div className="response-grid">
        <div className="run-history" aria-label="Run history">
          <h3>History <span>{runs.length}</span></h3>
          {runs.map((item) => <button key={item.id} className={item.id === run.id ? 'active' : ''} onClick={() => selectRun(item.id)}><span className={`history-dot ${item.status}`} /><span><strong>{item.modelName}</strong><small>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.status}</small></span></button>)}
        </div>
        <div className={`response-main${stagger ? ' staggering' : ''}`}>
          <StepPanel run={run} />
          <Reasoning run={run} />
          <div className="variant-row">
            <span>{run.status === 'complete' ? run.variants[run.variantIndex].label : 'Live draft'}</span>
            {run.status === 'complete' && <div><Button size="sm" kind="ghost" renderIcon={ChevronLeft} onClick={() => setVariant(run.id, run.variantIndex - 1)} disabled={run.variantIndex === 0} {...iconOnly('Previous variant')} /><strong>{run.variantIndex + 1} of {run.variants.length}</strong><Button size="sm" kind="ghost" renderIcon={ChevronRight} onClick={() => setVariant(run.id, run.variantIndex + 1)} disabled={run.variantIndex === run.variants.length - 1} {...iconOnly('Next variant')} /></div>}
          </div>
          <div key={`${run.id}-${run.variantIndex}`} className={`response-body variant-${run.variantIndex} variant-in${settled ? ' settled' : ''}`} ref={bodyRef} onScroll={handleScroll}>
            <RichResponse text={displayed} />
            {isStreaming && <span className="stream-cursor" aria-hidden="true" />}
          </div>
          {!followScroll && isStreaming && <Button className="jump-latest" size="sm" kind="secondary" renderIcon={ArrowDown} onClick={jump}>Jump to Latest</Button>}
        </div>
      </div>
    </section>
  )
}

function Workbench() {
  const draft = useWorkbench((state) => state.draft)
  const setDraft = useWorkbench((state) => state.setDraft)
  const streamingRunId = useWorkbench((state) => state.streamingRunId)
  const advanceRun = useWorkbench((state) => state.advanceRun)
  const addToast = useWorkbench((state) => state.addToast)
  const editorRef = useRef(null)
  const variableSelectionRef = useRef({ from: 0, to: 0 })

  useEffect(() => {
    if (!streamingRunId) return
    const timer = window.setInterval(() => advanceRun(streamingRunId), 48)
    return () => window.clearInterval(timer)
  }, [streamingRunId, advanceRun])

  const handlePastePlaceholders = useCallback((names) => {
    addToast(`Detected ${names.length} pasted placeholder${names.length > 1 ? 's' : ''}: ${names.join(', ')} — bind ${names.length > 1 ? 'their values' : 'its value'} in the panel`, 'info')
  }, [addToast])

  return (
    <main className="workbench">
      <div className="editor-stack">
        <section className="editor-shell" aria-labelledby="editor-title">
          <div className="section-intro"><div><p className="eyebrow">Draft</p><h1 id="editor-title">Prompt Editor</h1></div><p>Build, test, and package production-ready prompts.</p></div>
          <Toolbar editorRef={editorRef} variableSelectionRef={variableSelectionRef} />
          <Coachmark />
          <SuggestionRow editorRef={editorRef} />
          <div className="editor-meta-row"><PersonaChip /><AttachmentBadges /></div>
          <PromptEditor ref={editorRef} value={draft} onChange={setDraft} onPastePlaceholders={handlePastePlaceholders} />
        </section>
        <ResponsePanel />
      </div>
      <VariablePanel />
      <VariablePopover editorRef={editorRef} variableSelectionRef={variableSelectionRef} />
      <PersonaDrawer />
      <AssetPicker />
    </main>
  )
}

function VariablePopover({ editorRef, variableSelectionRef }) {
  const open = useWorkbench((state) => state.variableOpen)
  const setChrome = useWorkbench((state) => state.setChrome)
  const insert = useWorkbench((state) => state.insertVariable)
  const dialogRef = useRef(null)
  const close = useCallback(() => setChrome('variableOpen', false), [setChrome])
  useDialogFocus(open, dialogRef, close)
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(variableInsertSchema), mode: 'onChange', defaultValues: { name: '' } })
  useEffect(() => { if (open) reset({ name: '' }) }, [open, reset])
  if (!open) return null
  const confirm = ({ name }) => {
    const selection = variableSelectionRef.current
    insert(name, selection.from, selection.to)
    requestAnimationFrame(() => editorRef.current?.focus())
  }
  return (
    <div className="popover variable-popover" role="dialog" aria-modal="true" aria-labelledby="variable-popover-title" ref={dialogRef}>
      <div className="popover-arrow" />
      <div className="popover-head"><div><p className="eyebrow">Placeholder</p><h2 id="variable-popover-title">Insert Variable</h2></div><Button size="sm" kind="ghost" renderIcon={Close} onClick={close} {...iconOnly('Close variable popover')} /></div>
      <form onSubmit={handleSubmit(confirm)} noValidate>
        <TextInput id="variable-name" labelText="Name" placeholder="customer_name" invalid={!!errors.name} invalidText={errors.name?.message} aria-describedby={errors.name ? 'variable-name-error-msg variable-name-error' : undefined} {...register('name')} /><div id="variable-name-error" className="sr-only" aria-live="polite">{errors.name?.message}</div>
        <p className="helper">Letters, digits, and underscores; 1–64 characters.</p>
        <div className="popover-actions"><Button type="button" kind="secondary" size="sm" onClick={close}>Cancel</Button><Button type="submit" kind="primary" size="sm" disabled={!isValid}>Insert Variable</Button></div>
      </form>
    </div>
  )
}

function PersonaDrawer() {
  const open = useWorkbench((state) => state.personaOpen)
  const active = useWorkbench((state) => state.activePersona)
  const attach = useWorkbench((state) => state.attachPersona)
  const clear = useWorkbench((state) => state.clearPersona)
  const setChrome = useWorkbench((state) => state.setChrome)
  const drawerRef = useRef(null)
  const close = useCallback(() => setChrome('personaOpen', false), [setChrome])
  useDialogFocus(open, drawerRef, close)
  if (!open) return null
  return (
    <div className="drawer-layer"><button className="backdrop" aria-label="Close persona drawer" onClick={close} /><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="persona-title" ref={drawerRef}>
      <div className="drawer-header"><div><p className="eyebrow">System preface</p><h2 id="persona-title">Choose a Persona</h2></div><Button kind="ghost" size="sm" renderIcon={Close} onClick={close} {...iconOnly('Close persona drawer')} /></div>
      <p className="drawer-copy">Attach role and context above the prompt body. Choosing another persona replaces the current one.</p>
      <div className="persona-list">{PERSONAS.map((persona) => <button key={persona.id} className={active?.id === persona.id ? 'selected' : ''} onClick={() => attach(persona)}><span className="persona-avatar">{persona.name[0]}</span><span><strong>{persona.name}</strong><small>{persona.role}</small><p>{persona.preface}</p></span>{active?.id === persona.id && <Checkmark size={18} />}</button>)}</div>
      {active && <Button kind="danger--tertiary" onClick={() => { clear(); close() }}>Clear Persona</Button>}
    </aside></div>
  )
}

function AssetPicker() {
  const open = useWorkbench((state) => state.assetOpen)
  const ids = useWorkbench((state) => state.attachmentIds)
  const add = useWorkbench((state) => state.addAttachment)
  const setChrome = useWorkbench((state) => state.setChrome)
  const ref = useRef(null)
  const close = useCallback(() => setChrome('assetOpen', false), [setChrome])
  useDialogFocus(open, ref, close)
  if (!open) return null
  return <div className="picker-card" ref={ref} role="dialog" aria-modal="true" aria-labelledby="asset-picker-title"><div className="popover-head"><div><p className="eyebrow">Seeded assets</p><h2 id="asset-picker-title">Add Attachment</h2></div><Button size="sm" kind="ghost" renderIcon={Close} onClick={close} {...iconOnly('Close attachment picker')} /></div><div className="asset-list">{ASSETS.map((asset) => <button key={asset.id} disabled={ids.includes(asset.id)} onClick={() => add(asset.id)}><span className="asset-icon"><Attachment size={18} /></span><span><strong>{asset.name}</strong><small>{asset.type}</small></span>{ids.includes(asset.id) ? <Tag type="green" size="sm">Added</Tag> : <Add size={16} />}</button>)}</div></div>
}

function LibraryView() {
  const library = useWorkbench((state) => state.library)
  const filter = useWorkbench((state) => state.techniqueFilter)
  const selected = useWorkbench((state) => state.selectedLibraryIds)
  const setFilter = useWorkbench((state) => state.setTechniqueFilter)
  const toggle = useWorkbench((state) => state.toggleLibrarySelection)
  const load = useWorkbench((state) => state.loadLibrary)
  const remove = useWorkbench((state) => state.deleteLibrary)
  const switchView = useWorkbench((state) => state.switchView)
  const addToast = useWorkbench((state) => state.addToast)
  const [leaving, setLeaving] = useState([])
  const filtered = filter ? library.filter((item) => item.technique === filter) : library

  const removeWithExit = (id) => {
    if (leaving.includes(id)) return
    setLeaving((current) => [...current, id])
    window.setTimeout(() => {
      remove(id)
      setLeaving((current) => current.filter((item) => item !== id))
    }, 170)
  }

  const bulkExport = () => {
    const records = library.filter((item) => selected.includes(item.id)).map(({ id, ...record }) => record)
    const text = JSON.stringify(records, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'selected-library-prompts.json'
    anchor.click()
    URL.revokeObjectURL(url)
    addToast(`${records.length} library prompts exported`)
  }

  return (
    <main className="library-view">
      <div className="library-hero">
        <div><p className="eyebrow">Reusable prompts</p><h1>Prompt Library</h1><p>Open a saved prompt to restore its text, persona, bindings, and attachments.</p></div>
        <div className="library-actions"><Tag type="cool-gray">{library.length} prompts</Tag>{selected.length >= 2 && <Button renderIcon={DocumentExport} onClick={bulkExport}>Export Selected ({selected.length})</Button>}<Button renderIcon={Add} onClick={() => { switchView('workbench'); useWorkbench.getState().setChrome('saveOpen', true) }}>Create Prompt</Button></div>
      </div>
      <div className="library-filter">
        <Select id="technique-filter" labelText="Filter by technique" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <SelectItem value="" text="All techniques" />
          {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
        </Select>
      </div>
      {filtered.length ? <div className="library-list" aria-label="Saved prompts">{filtered.map((item) => (
        <Tile key={item.id} className={`library-row${leaving.includes(item.id) ? ' leaving' : ''}`}>
          <div className="library-check"><Checkbox id={`select-${item.id}`} labelText={`Select ${item.title}`} hideLabel checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /></div>
          <button className="library-open" onClick={() => load(item.id)}>
            <span><strong>{item.title}</strong><small>{displayText(item.promptText)}</small></span>
          </button>
          <Tag type="blue" size="sm">{item.technique}</Tag>
          <span className="attachment-count"><Attachment size={15} />{item.attachments.length}</span>
          <Button size="sm" kind="ghost" renderIcon={TrashCan} disabled={leaving.includes(item.id)} onClick={() => removeWithExit(item.id)} {...iconOnly(`Delete ${item.title}`)} />
        </Tile>
      ))}</div> : library.length === 0 ? (
        <div className="empty-state library-empty"><FolderOpen size={42} /><h2>Your Library Is Empty</h2><p>Saved prompt records will appear here with their techniques and attachments.</p><Button onClick={() => switchView('workbench')}>Return to Workbench</Button></div>
      ) : (
        <div className="empty-state library-empty"><Search size={42} /><h2>No Prompts Match</h2><p>No saved prompts use the “{filter}” technique.</p><Button kind="secondary" onClick={() => setFilter('')}>Clear Filter</Button></div>
      )}
    </main>
  )
}

function Toasts() {
  const toasts = useWorkbench((state) => state.toasts)
  const remove = useWorkbench((state) => state.removeToast)
  const live = useWorkbench((state) => state.liveMessage)
  return <><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div><div className="toast-stack">{toasts.map((toast) => <InlineNotification key={toast.id} className={toast.leaving ? 'leaving' : ''} kind={toast.kind === 'info' ? 'info' : toast.kind === 'warning' ? 'warning' : 'success'} title={toast.message} hideCloseButton={false} onCloseButtonClick={() => remove(toast.id)} lowContrast />)}</div></>
}

export function App() {
  const activeView = useWorkbench((state) => state.activeView)
  const saveOpen = useWorkbench((state) => state.saveOpen)
  const exportOpen = useWorkbench((state) => state.exportOpen)
  const importOpen = useWorkbench((state) => state.importOpen)
  const commandOpen = useWorkbench((state) => state.commandOpen)
  // The save/export/import modals and command palette live in a separate,
  // lazy-loaded chunk (./Overlays) — mount it the first time any of them is
  // opened, not on initial render, so cold load never pays for it.
  const [overlaysMounted, setOverlaysMounted] = useState(false)
  useEffect(() => {
    if (saveOpen || exportOpen || importOpen || commandOpen) setOverlaysMounted(true)
  }, [saveOpen, exportOpen, importOpen, commandOpen])
  useEffect(() => {
    const closeTransactionalModal = (event) => {
      if (event.key !== 'Escape') return
      const state = useWorkbench.getState()
      const key = state.importOpen ? 'importOpen' : state.exportOpen ? 'exportOpen' : state.saveOpen ? 'saveOpen' : null
      if (!key) return
      event.preventDefault()
      event.stopImmediatePropagation()
      state.setChrome(key, false)
    }
    document.addEventListener('keydown', closeTransactionalModal, true)
    return () => document.removeEventListener('keydown', closeTransactionalModal, true)
  }, [])
  useEffect(() => {
    // Cmd/Ctrl+K opens the command palette even before its lazy chunk has
    // ever mounted (the in-component listener in Overlays.jsx only exists
    // once mounted); this always-on listener just flips the store flag,
    // which triggers the mount effect above.
    const openPalette = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        useWorkbench.getState().setChrome('commandOpen', true)
      }
    }
    document.addEventListener('keydown', openPalette)
    return () => document.removeEventListener('keydown', openPalette)
  }, [])
  return (
    <div className="app-shell">
      <AppHeader />
      {activeView === 'workbench' ? <Workbench /> : <LibraryView />}
      {overlaysMounted && (
        <Suspense fallback={null}>
          <SaveModal />
          <ExportModal />
          <ImportModal />
          <CommandPalette />
        </Suspense>
      )}
      <Toasts />
    </div>
  )
}
