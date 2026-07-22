// Modal / palette chrome that is never part of the first paint: the workbench
// heading and toolbar render before any of this opens. Splitting it into its
// own chunk (lazy-loaded from App.jsx) keeps react-hook-form + zod resolver
// wiring, and the command palette's fuzzy-search machinery, out of the
// synchronous cold-load path.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Button, Checkbox, ComposedModal, ModalBody, ModalFooter, ModalHeader,
  Select, SelectItem, TextArea, TextInput,
} from '@carbon/react'
import { ArrowDown, CheckmarkOutline, Copy, Search, Upload } from '@carbon/icons-react'
import { useDialogFocus } from './useDialogFocus'
import { MODELS, PERSONAS, TECHNIQUES, detectVariables, estimateCost, estimateTokens, modelById } from './data'
import { compileMarkdown, compilePackage, useWorkbench } from './store'
import { importPasteSchema, libraryPromptInputSchema } from './schemas'
import { MOD_KEY, copyText, useModalEscapeReturn } from './uiUtils'

export function SaveModal() {
  const open = useWorkbench((state) => state.saveOpen)
  const draft = useWorkbench((state) => state.draft)
  const bindings = useWorkbench((state) => state.bindings)
  const attachments = useWorkbench((state) => state.attachmentIds)
  const persona = useWorkbench((state) => state.activePersona)
  const save = useWorkbench((state) => state.saveLibrary)
  const setChrome = useWorkbench((state) => state.setChrome)
  const [allowEmpty, setAllowEmpty] = useState(false)
  const savingRef = useRef(false)
  const { register, handleSubmit, reset, setError, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(libraryPromptInputSchema), mode: 'onChange', defaultValues: { title: '', technique: '' } })
  useEffect(() => { if (open) { reset({ title: '', technique: '' }); setAllowEmpty(false); savingRef.current = false } }, [open, reset])
  const close = () => setChrome('saveOpen', false)
  useModalEscapeReturn(open, close)
  const techniqueValue = watch('technique')
  const techniqueMessage = errors.technique?.message || (!techniqueValue ? `Technique is required. Choose exactly one of: ${TECHNIQUES.join(', ')}.` : '')
  const submit = (values) => {
    if (savingRef.current) return
    savingRef.current = true
    const record = save({ ...values, title: values.title.trim(), promptText: draft, bindings: { ...bindings }, attachments: [...attachments], personaId: persona?.id || null })
    if (!record) {
      savingRef.current = false
      setError('title', { type: 'duplicate', message: 'Title must be unique among existing library prompts.' }, { shouldFocus: true })
    }
  }
  return (
    <ComposedModal open={open} onClose={close} onKeyDown={(event) => { if (event.key === 'Escape') close() }} size="sm" preventCloseOnClickOutside>
      <ModalHeader title="Save to Library" label="LibraryPrompt create" closeModal={close} />
      <ModalBody>
        <p className="modal-copy">Create a reusable prompt record from the current workbench state.</p>
        <form id="save-library-form" onSubmit={handleSubmit(submit)} className="modal-form" noValidate>
          <TextInput id="save-title" labelText="Title" placeholder="Quarterly launch brief" invalid={!!errors.title} invalidText={errors.title?.message} aria-describedby={errors.title ? 'save-title-error-msg save-title-error' : undefined} {...register('title')} /><div id="save-title-error" className="field-alert" role="alert" aria-live="assertive">{errors.title?.message}</div>
          <Select id="save-technique" labelText="Technique" invalid={!!techniqueMessage} invalidText={techniqueMessage} aria-describedby={techniqueMessage ? 'save-technique-error-msg save-technique-error' : undefined} {...register('technique')}>
            <SelectItem value="" text="Choose a technique" />
            {TECHNIQUES.map((technique) => <SelectItem key={technique} value={technique} text={technique} />)}
          </Select>
          <div id="save-technique-error" className="sr-only" aria-live="polite">{techniqueMessage}</div>
          {!draft && <Checkbox id="allow-empty" labelText="Save this intentionally empty draft" checked={allowEmpty} onChange={(_, data) => setAllowEmpty(data.checked)} />}
          <div className="payload-summary"><span><strong>{detectVariables(draft).length}</strong> variables</span><span><strong>{attachments.length}</strong> attachments</span><span><strong>{persona ? 1 : 0}</strong> persona</span></div>
        </form>
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={close}>Cancel</Button><Button type="submit" form="save-library-form" disabled={!isValid || (!draft && !allowEmpty)}>Save</Button></ModalFooter>
    </ComposedModal>
  )
}

export function ExportModal() {
  const open = useWorkbench((state) => state.exportOpen)
  const format = useWorkbench((state) => state.exportFormat)
  const setChrome = useWorkbench((state) => state.setChrome)
  const addToast = useWorkbench((state) => state.addToast)
  useWorkbench()
  useModalEscapeReturn(open, () => setChrome('exportOpen', false))
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (open) setCopied(false) }, [open])
  const pkg = compilePackage()
  const preview = format === 'markdown' ? compileMarkdown() : JSON.stringify(pkg, null, 2)
  const tokens = estimateTokens(pkg.promptText, pkg.model)
  const summaryLine = `prompt-package-v1 · ${modelById(pkg.model).name} · ${tokens} tokens · ${detectVariables(pkg.promptText).length} variables · ${pkg.attachments.length} attachments`
  const copy = async () => {
    await copyText(preview)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    addToast(`${format === 'markdown' ? 'Markdown' : 'JSON'} copied to clipboard`)
  }
  const copySummary = async () => {
    await copyText(summaryLine)
    addToast('Package summary copied to clipboard')
  }
  const download = () => {
    const blob = new Blob([preview], { type: format === 'markdown' ? 'text/markdown' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `prompt-package.${format === 'markdown' ? 'md' : 'json'}`
    anchor.click()
    URL.revokeObjectURL(url)
    addToast(`${format === 'markdown' ? 'Markdown' : 'JSON'} downloaded`)
  }
  return (
    <ComposedModal open={open} onClose={() => setChrome('exportOpen', false)} onKeyDown={(event) => { if (event.key === 'Escape') setChrome('exportOpen', false) }} size="lg" preventCloseOnClickOutside>
      <ModalHeader title="Export Prompt Package" label="Live-compiled session" closeModal={() => setChrome('exportOpen', false)} />
      <ModalBody className="export-body">
        <div className="package-summary">
          <button className="sum-chip" onClick={copySummary} title="Copy this one-line package summary"><strong>{summaryLine.split('·')[0].trim()}</strong>{summaryLine.split('·').slice(1).map((piece) => <span key={piece}>{piece.trim()}</span>)}</button>
          <span className="sum-chip"><strong>{estimateCost(pkg.promptText, pkg.model).toFixed(5)}</strong>&nbsp;est. cost</span>
        </div>
        <div className="format-tabs" role="tablist" aria-label="Export format">
          <button role="tab" aria-selected={format === 'markdown'} onClick={() => setChrome('exportFormat', 'markdown')}>Markdown document</button>
          <button role="tab" aria-selected={format === 'json'} onClick={() => setChrome('exportFormat', 'json')}>JSON package</button>
        </div>
        <pre className="export-preview" tabIndex={0} aria-label={`${format} preview`}><code>{preview}</code></pre>
      </ModalBody>
      <ModalFooter><Button kind="secondary" renderIcon={copied ? CheckmarkOutline : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button><Button renderIcon={ArrowDown} onClick={download}>Download {format === 'markdown' ? 'Markdown' : 'JSON'}</Button></ModalFooter>
    </ComposedModal>
  )
}

export function ImportModal() {
  const open = useWorkbench((state) => state.importOpen)
  const setChrome = useWorkbench((state) => state.setChrome)
  const hydrate = useWorkbench((state) => state.importPackage)
  const addToast = useWorkbench((state) => state.addToast)
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(importPasteSchema), mode: 'onChange', defaultValues: { json: '' } })
  const text = watch('json')
  useEffect(() => { if (open) reset({ json: '' }) }, [open, reset])
  const close = () => setChrome('importOpen', false)
  useModalEscapeReturn(open, close)
  const submit = ({ json }) => {
    hydrate(JSON.parse(json))
    addToast('Prompt package imported successfully')
  }
  const loadFile = async (event) => {
    const file = event.target.files?.[0]
    if (file) setValue('json', await file.text(), { shouldValidate: true, shouldDirty: true })
  }
  return (
    <ComposedModal open={open} onClose={close} onKeyDown={(event) => { if (event.key === 'Escape') close() }} size="sm" preventCloseOnClickOutside>
      <ModalHeader title="Import JSON Package" label="PromptPackage v1" closeModal={close} />
      <ModalBody>
        <form id="import-form" onSubmit={handleSubmit(submit)} className="modal-form" noValidate>
          <Controller name="json" control={control} render={({ field }) => <><TextArea {...field} id="import-json" labelText="JSON package" rows={12} invalid={!!errors.json} invalidText={errors.json?.message} aria-describedby={errors.json ? 'import-json-error-msg import-json-error' : undefined} placeholder={'{\n  "schemaVersion": "prompt-package-v1",\n  ...\n}'} /><div id="import-json-error" className="sr-only" aria-live="polite">{errors.json?.message}</div></>} />
          <label className="file-input"><Upload size={16} /><span>Load JSON file</span><input type="file" accept="application/json,.json" onChange={loadFile} /></label>
          <p className="helper">Import validates schemaVersion, messages, model, bindings, attachments, persona, and technique before changing the workbench.</p>
        </form>
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={close}>Cancel</Button><Button type="submit" form="import-form" disabled={!text.trim()}>Import</Button></ModalFooter>
    </ComposedModal>
  )
}

export function CommandPalette() {
  const open = useWorkbench((state) => state.commandOpen)
  const query = useWorkbench((state) => state.commandQuery)
  const library = useWorkbench((state) => state.library)
  const setModel = useWorkbench((state) => state.setModel)
  const load = useWorkbench((state) => state.loadLibrary)
  const attach = useWorkbench((state) => state.attachPersona)
  const switchView = useWorkbench((state) => state.switchView)
  const setChrome = useWorkbench((state) => state.setChrome)
  const paletteRef = useRef(null)
  const [index, setIndex] = useState(0)
  const close = useCallback(() => { setChrome('commandOpen', false); setChrome('commandQuery', '') }, [setChrome])
  useDialogFocus(open, paletteRef, close)
  useEffect(() => {
    const key = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setChrome('commandOpen', true) }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [setChrome])
  const actions = useMemo(() => [
    { id: 'export', type: 'Action', label: 'Export Package', run: () => setChrome('exportOpen', true) },
    { id: 'save', type: 'Action', label: 'Save to Library', run: () => setChrome('saveOpen', true) },
    { id: 'library', type: 'Action', label: 'Switch to Library', run: () => switchView('library') },
    { id: 'workbench', type: 'Action', label: 'Switch to Workbench', run: () => switchView('workbench') },
  ], [setChrome, switchView])
  const all = useMemo(() => [
    ...actions,
    ...MODELS.map((model) => ({ id: model.id, type: 'Model', label: model.name, meta: model.provider, run: () => setModel(model.id) })),
    ...library.map((item) => ({ id: item.id, type: 'Library', label: item.title, meta: item.technique, run: () => load(item.id) })),
    ...PERSONAS.map((persona) => ({ id: persona.id, type: 'Persona', label: persona.name, meta: persona.role, run: () => attach(persona) })),
  ], [actions, attach, library, load, setModel])
  const score = (item, value) => {
    const needle = value.toLowerCase().replace(/\s/g, '')
    const haystack = `${item.label}${item.type}${item.meta || ''}`.toLowerCase().replace(/\s/g, '')
    let cursor = 0
    for (const char of needle) { cursor = haystack.indexOf(char, cursor); if (cursor < 0) return false; cursor += 1 }
    return true
  }
  const results = query.trim() ? all.filter((item) => score(item, query)).slice(0, 12) : actions
  useEffect(() => setIndex(0), [query])
  if (!open) return null
  const choose = (item) => { item.run(); close() }
  const keyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setIndex((value) => Math.min(results.length - 1, value + 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setIndex((value) => Math.max(0, value - 1)) }
    if (event.key === 'Enter' && results[index]) { event.preventDefault(); choose(results[index]) }
  }
  return <div className="palette-layer"><button className="backdrop" aria-label="Close command palette" onClick={close} /><section className="command-palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" ref={paletteRef} onKeyDown={keyDown}><h2 id="palette-title" className="sr-only">Command palette</h2><div className="palette-search"><Search size={20} /><input aria-label="Search models, prompts, personas, and actions" value={query} onChange={(event) => setChrome('commandQuery', event.target.value)} placeholder="Search models, prompts, personas, and actions…" /><kbd>Esc</kbd></div><div className="palette-results" role="listbox">{results.length ? results.map((item, itemIndex) => <button key={`${item.type}-${item.id}`} role="option" aria-selected={index === itemIndex} className={index === itemIndex ? 'selected' : ''} onMouseEnter={() => setIndex(itemIndex)} onClick={() => choose(item)}><span className={`result-icon type-${item.type.toLowerCase()}`}>{item.type === 'Model' ? 'M' : item.type === 'Library' ? 'L' : item.type === 'Persona' ? 'P' : '⌘'}</span><span><strong>{item.label}</strong><small>{item.meta || item.type}</small></span><em>{item.type}</em></button>) : <div className="palette-empty"><Search size={28} /><strong>Nothing matched “{query}”</strong><span>Try a model, prompt title, persona, or action.</span></div>}</div><footer><span>↑↓ Navigate</span><span>↵ Select</span><span>{MOD_KEY} I Insert Variable</span><span>Esc Close</span></footer></section></div>
}
