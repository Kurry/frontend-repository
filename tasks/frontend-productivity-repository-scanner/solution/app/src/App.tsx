import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import {
  Button,
  Checkbox,
  InlineLoading,
  InlineNotification,
  Modal,
  ProgressBar,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  Toggle,
} from '@carbon/react'
import {
  Add,
  ArrowLeft,
  CheckmarkFilled,
  ChevronDown,
  ChevronRight,
  Close,
  Copy,
  Document,
  Download,
  Edit,
  ErrorFilled,
  Export,
  Filter,
  Folder,
  ImportExport,
  Pause,
  Play,
  Redo,
  Renew,
  Search,
  SettingsAdjust,
  Time,
  TrashCan,
  Undo,
  WarningFilled,
} from '@carbon/icons-react'
import {
  DOCUMENT_TYPES,
  PATTERN_KEYS,
  importFormSchema,
  patternFormSchema,
  repositoryFormSchema,
  type DocumentType,
  type PatternKey,
  type RepositoryFormValues,
} from './schemas'
import {
  repositoryLabel,
  retryFailedStep,
  scanSelected,
  startScan,
  useAppStore,
  type Repository,
  type ScanDocument,
  type ScanRun,
  type StepStatus,
} from './store'

const statusKinds: Record<StepStatus, 'gray' | 'blue' | 'green' | 'red' | 'purple'> = {
  pending: 'gray',
  running: 'blue',
  complete: 'green',
  failed: 'red',
  retrying: 'purple',
}

const typeLabels: Record<DocumentType, string> = {
  'CLAUDE.md': 'CLAUDE.md',
  'AGENTS.md': 'AGENTS.md',
  '.cursorrules': '.cursorrules',
  README: 'README files',
}

const patternLabels: Record<PatternKey, { label: string; description: string }> = {
  'claude-md': { label: 'CLAUDE.md', description: 'Claude project guidance' },
  'agents-md': { label: 'AGENTS.md', description: 'Agent workspace instructions' },
  cursorrules: { label: '.cursorrules', description: 'Cursor editor rules' },
  readme: { label: 'README files', description: 'Repository documentation' },
}

function formatDate(value: string | null) {
  if (!value) return 'Not scanned yet'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function fileName(path: string) {
  return path.split(/[\\/]/).pop() || path
}

function useEscape(handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, handler])
}

function useModalFocusTrap(open: boolean, onClose: () => void, selector = '.cds--modal.is-visible .cds--modal-container') {
  const openerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) return undefined
    const rememberOpener = () => { openerRef.current = document.activeElement as HTMLElement }
    document.addEventListener('focusin', rememberOpener)
    return () => document.removeEventListener('focusin', rememberOpener)
  }, [open])
  useEffect(() => {
    if (!open) return undefined
    const active = document.activeElement as HTMLElement | null
    if (active && !active.closest('.cds--modal, [role="dialog"]')) openerRef.current = active
    let container: Element | null = null
    let attempts = 0
    const focusModal = () => {
      container = document.querySelector(selector)
      if (!container) {
        if (attempts < 20) {
          attempts += 1
          window.setTimeout(focusModal, 16)
        }
        return
      }
      const focusable = () => [
        ...container!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ]
      const pathInput = container.querySelector<HTMLElement>('#repository-path')
      ;(pathInput || focusable()[0])?.focus()
    }
    focusModal()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      container = container || document.querySelector(selector)
      if (!container) return
      const items = [
        ...container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      requestAnimationFrame(() => openerRef.current?.focus?.())
    }
  }, [open, onClose, selector])
}

function AddRepositoryModal() {
  const open = useAppStore((state) => state.ui.addOpen)
  const setUi = useAppStore((state) => state.setUi)
  const addRepository = useAppStore((state) => state.addRepository)
  const [submitError, setSubmitError] = useState('')
  const submitting = useRef(false)
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositoryFormSchema),
    mode: 'onChange',
    defaultValues: { path: '', displayName: '' },
  })
  const path = watch('path') || ''

  const close = () => {
    setUi('addOpen', false)
    submitting.current = false
    setSubmitError('')
    reset()
  }

  useModalFocusTrap(open, close)

  const submit = handleSubmit((values) => {
    if (submitting.current) return
    submitting.current = true
    const result = addRepository(values)
    if (!result.ok) {
      setSubmitError(result.error || 'Path is invalid.')
      submitting.current = false
      return
    }
    close()
  })

  return (
    <Modal
      open={open}
      modalHeading="Add repository"
      modalLabel="Repository scanner"
      primaryButtonText="Add repository"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!path.trim() || Boolean(errors.path || errors.displayName)}
      onRequestSubmit={submit}
      onRequestClose={close}
      preventCloseOnClickOutside
      size="sm"
    >
      <form autoComplete="off" onSubmit={submit} className="modal-form" noValidate>
        <p className="modal-intro">Track a local repository path. Files are simulated in this browser-only workspace.</p>
        <TextInput autoComplete="off"
          id="repository-path"
          labelText="Local path"
          placeholder="/workspace/my-project"
          invalid={!path.trim() || Boolean(errors.path)}
          invalidText={
            <span id="repository-path-error" aria-live="polite">
              {errors.path?.message || 'Path is required and cannot be whitespace only.'}
            </span>
          }
          aria-describedby="repository-path-error"
          {...register('path')}
        />
        <TextInput autoComplete="off"
          id="repository-display-name"
          labelText="Display name (optional)"
          helperText="Leave blank to use the path basename. Maximum 80 characters."
          invalid={Boolean(errors.displayName)}
          invalidText={
            <span id="repository-display-name-error" aria-live="polite">
              {errors.displayName?.message}
            </span>
          }
          aria-describedby="repository-display-name-error"
          {...register('displayName')}
        />
        {submitError && <InlineNotification kind="error" lowContrast title="Repository was not added" subtitle={submitError} hideCloseButton />}
      </form>
    </Modal>
  )
}

function RenameEditor({ repository, onClose }: { repository: Repository; onClose: () => void }) {
  const rename = useAppStore((state) => state.renameRepository)
  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{ displayName?: string }>({
    resolver: zodResolver(repositoryFormSchema.pick({ displayName: true })),
    mode: 'onChange',
    defaultValues: { displayName: repository.displayName || '' },
  })
  const value = watch('displayName')

  return (
    <form
      className="rename-editor"
      onSubmit={handleSubmit(({ displayName }) => {
        const result = rename(repository.id, displayName || '')
        if (!result.ok) setError(result.error || 'Display name is invalid.')
        else onClose()
      })}
    >
      <TextInput autoComplete="off"
        id={`rename-${repository.id}`}
        labelText="Display name"
        size="sm"
        invalid={Boolean(errors.displayName || error)}
        invalidText={errors.displayName?.message || error}
        {...register('displayName')}
      />
      <div className="rename-actions">
        <Button size="sm" type="submit" disabled={(value || '').length > 80}>Save name</Button>
        <Button size="sm" kind="ghost" type="button" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

function RepositoryRow({ repository, onRemove }: { repository: Repository; onRemove: (repository: Repository) => void }) {
  const selected = useAppStore((state) => state.selectedRepositoryIds.includes(repository.id))
  const toggleSelection = useAppStore((state) => state.toggleRepositorySelection)
  const run = useAppStore((state) => state.scanRuns[repository.id])
  const [renaming, setRenaming] = useState(false)
  const scanning = run?.status === 'running' || run?.status === 'paused'
  const failed = run?.status === 'failed'

  useEffect(() => {
    setRenaming(false)
  }, [repository.displayName, repository.path, repository.id])

  return (
    <motion.li
      id={`repository-${repository.id}`}
      tabIndex={-1}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -18, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`repository-row ${selected ? 'is-selected' : ''}`}
      aria-label={`${repositoryLabel(repository)} repository`}
    >
      <div className="repository-select">
        <Checkbox autoComplete="off"
          id={`select-${repository.id}`}
          labelText={`Select ${repositoryLabel(repository)}`}
          hideLabel
          checked={selected}
          onChange={() => toggleSelection(repository.id)}
        />
      </div>
      <div className="repository-main">
        {renaming ? (
          <RenameEditor repository={repository} onClose={() => setRenaming(false)} />
        ) : (
          <>
            <div className="repository-title-line">
              <Folder size={18} />
              <h3>{repositoryLabel(repository)}</h3>
              {repository.id === 'repo-2' && failed && <Tag size="sm" type="red">Failed</Tag>}
              {repository.id === 'repo-2' && !failed && scanning && <Tag size="sm" type="blue">Running</Tag>}
              {repository.id === 'repo-2' && !failed && !scanning && run?.status === 'complete' && <Tag size="sm" type="green">Complete</Tag>}
            </div>
            <p className="repository-path" title={repository.path}>{repository.path}</p>
            <div className="repository-meta">
              <span><Document size={14} /> {repository.documentCount} documents</span>
              <span><Time size={14} /> {formatDate(repository.lastScanned)}</span>
            </div>
          </>
        )}
      </div>
      <div className="repository-actions">
        {scanning ? (
          <InlineLoading description={run.status === 'paused' ? 'Paused' : 'Scanning'} status={run.status === 'paused' ? 'inactive' : 'active'} />
        ) : (
          <Button size="sm" kind="tertiary" renderIcon={Play} onClick={() => void startScan(repository.id)}>Scan now</Button>
        )}
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={Edit} iconDescription={`Rename ${repositoryLabel(repository)}`} onClick={() => setRenaming(true)} />
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={TrashCan} iconDescription={`Remove ${repositoryLabel(repository)}`} onClick={() => onRemove(repository)} />
      </div>
    </motion.li>
  )
}

function RepositoryList() {
  const repositories = useAppStore((state) => state.repositories)
  const selected = useAppStore((state) => state.selectedRepositoryIds)
  const selectAll = useAppStore((state) => state.selectAllRepositories)
  const clearSelection = useAppStore((state) => state.clearSelection)
  const setUi = useAppStore((state) => state.setUi)
  const removeRepository = useAppStore((state) => state.removeRepository)
  const [removeTarget, setRemoveTarget] = useState<Repository | null>(null)

  return (
    <section className="panel repository-panel" aria-labelledby="repositories-heading">
      <div className="panel-heading split-heading">
        <div>
          <p className="eyebrow">Tracked sources</p>
          <h2 id="repositories-heading">Repositories</h2>
        </div>
        <span className="count-pill">{repositories.length}</span>
      </div>
      {repositories.length > 0 && (
        <div className="list-toolbar">
          <span>{selected.length} selected</span>
          <Button size="sm" kind="ghost" onClick={selected.length === repositories.length ? clearSelection : selectAll}>
            {selected.length === repositories.length ? 'Clear selection' : 'Select all'}
          </Button>
        </div>
      )}
      {repositories.length ? (
        <ul className="repository-list" aria-label="Tracked repositories">
          <AnimatePresence initial={false}>
            {repositories.map((repository) => <RepositoryRow key={repository.id} repository={repository} onRemove={setRemoveTarget} />)}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="empty-state">
          <Folder size={32} />
          <h3>No repositories tracked</h3>
          <p>Add a local repository path to begin scanning prompt-engineering guidance.</p>
          <Button size="sm" renderIcon={Add} onClick={() => setUi('addOpen', true)}>Add repository</Button>
        </div>
      )}
      <Modal
        open={Boolean(removeTarget)}
        danger
        size="xs"
        modalHeading="Remove repository?"
        primaryButtonText="Remove repository"
        secondaryButtonText="Cancel"
        onRequestClose={() => setRemoveTarget(null)}
        onRequestSubmit={() => {
          if (removeTarget) removeRepository(removeTarget.id)
          setRemoveTarget(null)
        }}
      >
        <p>This removes <strong>{removeTarget ? repositoryLabel(removeTarget) : ''}</strong> and all its indexed documents. You can undo this action.</p>
      </Modal>
    </section>
  )
}

function PatternSettings() {
  const patterns = useAppStore((state) => state.patterns)
  const setPattern = useAppStore((state) => state.setPattern)
  const form = useForm<{ patterns: Record<PatternKey, boolean> }>({
    resolver: zodResolver(patternFormSchema),
    defaultValues: { patterns },
    mode: 'onChange',
  })
  const values = form.watch('patterns')

  useEffect(() => form.reset({ patterns }), [form, patterns])

  const change = (key: PatternKey, enabled: boolean) => {
    const next = { ...values, [key]: enabled }
    form.setValue(`patterns.${key}`, enabled, { shouldDirty: true, shouldValidate: true })
    if (!Object.values(next).some(Boolean)) {
      form.setError('root', { message: 'Patterns: at least one document pattern must remain enabled.' })
      form.setValue(`patterns.${key}`, patterns[key], { shouldDirty: false })
      return
    }
    form.clearErrors('root')
    const result = setPattern(key, enabled)
    if (!result.ok) form.setError('root', { message: result.error })
  }

  return (
    <section className="panel settings-panel" aria-labelledby="settings-heading">
      <div className="panel-heading compact-heading">
        <SettingsAdjust size={20} />
        <div>
          <p className="eyebrow">Future scans</p>
          <h2 id="settings-heading">Scan configuration</h2>
        </div>
      </div>
      <form autoComplete="off" className="pattern-grid" onSubmit={(event) => event.preventDefault()}>
        {PATTERN_KEYS.map((key) => (
          <div className="pattern-item" key={key}>
            <div>
              <strong>{patternLabels[key].label}</strong>
              <span>{patternLabels[key].description}</span>
            </div>
            <Toggle
              id={`pattern-${key}`}
              size="sm"
              labelText={`${patternLabels[key].label} enabled state`}
              labelA="Off"
              labelB="On"
              hideLabel
              toggled={Boolean(values?.[key])}
              onToggle={(enabled) => change(key, enabled)}
            />
          </div>
        ))}
      </form>
      {form.formState.errors.root?.message && (
        <InlineNotification kind="error" lowContrast hideCloseButton title="Pattern configuration invalid" subtitle={form.formState.errors.root.message} />
      )}
      <p className="settings-note">Disabled patterns are excluded the next time each repository is scanned.</p>
    </section>
  )
}

function StatusTag({ status }: { status: StepStatus }) {
  const Icon = status === 'complete' ? CheckmarkFilled : status === 'failed' ? ErrorFilled : status === 'running' ? InlineLoading : status === 'retrying' ? Renew : Time
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
      >
        <Tag size="sm" type={statusKinds[status]} className={`status-tag status-${status}`} renderIcon={Icon}>{status}</Tag>
      </motion.span>
    </AnimatePresence>
  )
}

function ScanPanel() {
  const activeScanId = useAppStore((state) => state.activeScanId)
  const run = useAppStore((state) => activeScanId ? state.scanRuns[activeScanId] : undefined)
  const repository = useAppStore((state) => state.repositories.find((item) => item.id === activeScanId))
  const pause = useAppStore((state) => state.pauseScan)
  const resume = useAppStore((state) => state.resumeScan)
  const selectedStep = useAppStore((state) => state.selectedTimelineStepId)
  const selectStep = useAppStore((state) => state.selectTimelineStep)
  const timelineFilters = useAppStore((state) => state.timelineFilters)
  const toggleTimelineFilter = useAppStore((state) => state.toggleTimelineFilter)
  const [, setClock] = useState(0)

  useEffect(() => {
    if (!run || run.status === 'complete') return
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [run])

  if (!run || !repository) return null
  const complete = run.steps.filter((step) => step.status === 'complete').length
  const failed = run.steps.filter((step) => step.status === 'failed').length
  const percent = run.steps.length ? Math.round((complete / run.steps.length) * 100) : 100
  const elapsed = Math.max(0, Math.floor(((run.completedAt ? new Date(run.completedAt).getTime() : Date.now()) - new Date(run.startedAt).getTime()) / 1000))
  const events = timelineFilters.length ? run.timeline.filter((event) => timelineFilters.includes(event.status)) : run.timeline

  return (
    <section id="scan-panel" className="panel scan-panel" aria-labelledby="scan-heading">
      <div className="panel-heading scan-heading">
        <div>
          <p className="eyebrow">Durable workflow</p>
          <h2 id="scan-heading">Scan run · {repositoryLabel(repository)}</h2>
        </div>
        <div className="scan-actions">
          {run.status === 'running' && <Button size="sm" kind="secondary" renderIcon={Pause} onClick={() => pause(repository.id)}>Pause</Button>}
          {run.status === 'paused' && <Button size="sm" renderIcon={Play} onClick={() => resume(repository.id)}>Resume</Button>}
          {(run.status === 'complete' || run.status === 'failed') && <Button size="sm" kind="tertiary" renderIcon={Renew} onClick={() => void startScan(repository.id)}>Restart</Button>}
        </div>
      </div>
      <ProgressBar
        label={`${complete} / ${run.steps.length} files scanned`}
        helperText={`${percent}% complete`}
        value={percent}
        max={100}
        status={run.status === 'failed' ? 'error' : run.status === 'complete' ? 'finished' : 'active'}
        className="scan-progress-bar"
      />
      <div className="rollups" aria-label="Scan rollups">
        <div><strong>{complete}/{run.steps.length}</strong><span>steps complete</span></div>
        <div><strong>{failed}</strong><span>failures</span></div>
        <div><strong>{elapsed}s</strong><span>elapsed</span></div>
        <div><strong className={`run-status ${run.status}`}>{run.status}</strong><span>workflow status</span></div>
      </div>
      <div className="scan-details-grid">
        <div>
          <h3 className="subheading">Document steps</h3>
          <ol className="step-list">
            {run.steps.map((step) => (
              <motion.li
                layout
                key={step.id}
                className={`step-row ${selectedStep === step.id ? 'is-highlighted' : ''}`}
                data-status={step.status}
              >
                <button className="step-select" onClick={() => selectStep(step.id)} aria-label={`Highlight ${step.name}`}>
                  {step.status === 'complete' ? <CheckmarkFilled size={18} /> : step.status === 'failed' ? <ErrorFilled size={18} /> : step.status === 'running' ? <InlineLoading status="active" /> : <Document size={18} />}
                </button>
                <div className="step-content">
                  <div className="step-title"><strong>{step.name}</strong><StatusTag status={step.status} /></div>
                  <span className="step-path">{step.document.path}</span>
                  {step.status === 'retrying' && (
                    <p className="retry-text" aria-live="polite">
                      Waiting {step.countdown}s before retry {Math.min(step.attempts + 1, 3)} of 3
                    </p>
                  )}
                  {step.output && <p className="step-output">{step.output} · completed {formatDate(step.completedAt || null)}</p>}
                  {step.error && (
                    <div className="step-error" role="alert" aria-live="assertive">
                      <span>{step.error}</span>
                      <Button size="sm" kind="danger--tertiary" renderIcon={Renew} onClick={() => void retryFailedStep(repository.id, step.id)}>Retry step</Button>
                    </div>
                  )}
                </div>
                <span className="attempt-count">{step.attempts ? `${step.attempts}/3` : '—'}</span>
              </motion.li>
            ))}
          </ol>
        </div>
        <div className="timeline-region">
          <div className="timeline-heading">
            <h3 className="subheading">Event timeline</h3>
            <span>{events.length} events</span>
          </div>
          <div className="timeline-filters" aria-label="Filter timeline by status">
            {(['pending', 'running', 'retrying', 'complete', 'failed'] as StepStatus[]).map((status) => (
              <Checkbox autoComplete="off"
                key={status}
                id={`timeline-${status}`}
                labelText={status}
                checked={timelineFilters.includes(status)}
                onChange={() => toggleTimelineFilter(status)}
              />
            ))}
          </div>
          <ol className="timeline-list" aria-live="polite">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.li key={event.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <button className={selectedStep === event.stepId ? 'is-highlighted' : ''} onClick={() => selectStep(event.stepId)}>
                    <StatusTag status={event.status} />
                    <span>{event.message}</span>
                    <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            {!events.length && <li className="timeline-empty">Step transitions will appear here.</li>}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Findings({ document }: { document: ScanDocument }) {
  const expanded = useAppStore((state) => Boolean(state.expandedFindings[document.id]))
  const toggle = useAppStore((state) => state.toggleFindings)
  return (
    <div className="findings-region">
      <button className="findings-toggle" aria-expanded={expanded} onClick={(event) => { event.stopPropagation(); toggle(document.id) }}>
        <ChevronRight size={16} className={expanded ? 'rotate' : ''} />
        {document.findings.length} finding{document.findings.length === 1 ? '' : 's'}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="findings-list"
          >
            {document.findings.map((finding, index) => (
              <li key={`${finding.message}-${index}`} className={`finding-${finding.severity}`}>
                {finding.severity === 'error' ? <ErrorFilled size={14} /> : finding.severity === 'warning' ? <WarningFilled size={14} /> : <CheckmarkFilled size={14} />}
                <span><strong>{finding.severity}</strong> {finding.message}{finding.line ? ` · line ${finding.line}` : ''}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function DocumentRow({ document }: { document: ScanDocument }) {
  const open = useAppStore((state) => state.openDocument)
  const repository = useAppStore((state) => state.repositories.find((item) => item.id === document.repositoryId))
  const preview = document.content.split('\n').slice(0, 3).join('\n')
  return (
    <li className="document-row">
      <button className="document-open" onClick={() => open(document.id)}>
        <Document size={18} />
        <span className="document-name-block">
          <strong>{fileName(document.path)}</strong>
          <small>{repository ? repositoryLabel(repository) : 'Repository'} · {document.path}</small>
        </span>
        <span className="preview-affordance">Preview</span>
      </button>
      <div className="document-preview" role="tooltip">
        <div><Document size={16} /><strong>{fileName(document.path)}</strong><Tag size="sm" type="blue">{document.type}</Tag></div>
        <pre>{preview}</pre>
      </div>
      <Findings document={document} />
    </li>
  )
}

function DocumentFilters() {
  const filters = useAppStore((state) => state.documentTypeFilters)
  const toggle = useAppStore((state) => state.toggleDocumentFilter)
  const clear = useAppStore((state) => state.clearDocumentFilters)
  return (
    <div className="document-filters">
      <div className="filter-label"><Filter size={16} /><span>Document type</span></div>
      <div className="filter-options">
        {DOCUMENT_TYPES.map((type) => (
          <Checkbox autoComplete="off" key={type} id={`filter-${type}`} labelText={typeLabels[type]} checked={filters.includes(type)} onChange={() => toggle(type)} />
        ))}
      </div>
      {filters.length > 0 && <Button size="sm" kind="ghost" onClick={clear}>Clear filters</Button>}
    </div>
  )
}

function DocumentTree() {
  const repositories = useAppStore((state) => state.repositories)
  const documentsByRepo = useAppStore((state) => state.documents)
  const filters = useAppStore((state) => state.documentTypeFilters)
  const expandedGroups = useAppStore((state) => state.expandedGroups)
  const toggleGroup = useAppStore((state) => state.toggleGroup)
  const allDocuments = useMemo(() => repositories.flatMap((repository) => documentsByRepo[repository.id] || []), [repositories, documentsByRepo])
  const visibleDocuments = filters.length ? allDocuments.filter((document) => filters.includes(document.type)) : allDocuments

  return (
    <section className="panel tree-panel" aria-labelledby="tree-heading">
      <div className="panel-heading split-heading">
        <div>
          <p className="eyebrow">Shared document index</p>
          <h2 id="tree-heading">Detected files</h2>
        </div>
        <span className="count-pill">{visibleDocuments.length}</span>
      </div>
      <DocumentFilters />
      {visibleDocuments.length ? (
        <div className="document-groups">
          {DOCUMENT_TYPES.map((type) => {
            const groupDocuments = visibleDocuments.filter((document) => document.type === type)
            if (!groupDocuments.length) return null
            const open = expandedGroups[type]
            return (
              <section key={type} className="document-group">
                <button className="group-heading" aria-expanded={open} onClick={() => toggleGroup(type)}>
                  <ChevronRight size={16} className={open ? 'rotate' : ''} />
                  <span>{typeLabels[type]}</span>
                  <span className="group-count">{groupDocuments.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="document-list"
                    >
                      {groupDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </section>
            )
          })}
        </div>
      ) : repositories.length === 0 ? (
        <div className="empty-state">
          <Document size={32} />
          <h3>No documents</h3>
          <p>Add a repository to begin viewing documents.</p>
        </div>
      ) : (
        <div className="empty-state">
          <Document size={32} />
          <h3>No documents match this view</h3>
          <p>Adjust document type filters or scan a repository with an enabled pattern.</p>
        </div>
      )}
    </section>
  )
}

function FileViewer() {
  const activeDocumentId = useAppStore((state) => state.activeDocumentId)
  const documentsByRepo = useAppStore((state) => state.documents)
  const showTree = useAppStore((state) => state.showTree)
  const document = Object.values(documentsByRepo).flat().find((item) => item.id === activeDocumentId)
  const [copied, setCopied] = useState(false)
  if (!document) return <DocumentTree />

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(document.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="panel viewer-panel" aria-labelledby="viewer-heading">
      <div className="viewer-toolbar">
        <Button size="sm" kind="ghost" renderIcon={ArrowLeft} onClick={showTree}>Back to document tree</Button>
        <Button size="sm" kind="tertiary" renderIcon={copied ? CheckmarkFilled : Copy} onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</Button>
        <span className="sr-only" role="status" aria-live="polite">{copied ? 'File content copied' : ''}</span>
      </div>
      <ActiveScanContext />
      <div className="panel-heading">
        <p className="eyebrow">Read-only file viewer · {document.type}</p>
        <h2 id="viewer-heading">{fileName(document.path)}</h2>
        <p className="viewer-path">{document.path}</p>
      </div>
      <div className="code-viewer" role="region" aria-label={`${fileName(document.path)} content`} tabIndex={0}>
        {document.content.split('\n').map((line, index) => (
          <div className="code-line" key={index}>
            <span className="line-number" aria-hidden="true">{index + 1}</span>
            <code>{line || ' '}</code>
          </div>
        ))}
      </div>
      <div className="viewer-findings">
        <h3>Scan findings</h3>
        <Findings document={document} />
      </div>
    </section>
  )
}

function ActiveScanContext() {
  const activeScanId = useAppStore((state) => state.activeScanId)
  const run = useAppStore((state) => activeScanId ? state.scanRuns[activeScanId] : undefined)
  const repository = useAppStore((state) => state.repositories.find((item) => item.id === activeScanId))
  const pause = useAppStore((state) => state.pauseScan)
  const resume = useAppStore((state) => state.resumeScan)
  if (!activeScanId || !run || !repository) return null
  const complete = run.steps.filter((step) => step.status === 'complete').length
  return (
    <div className="active-scan-context">
      <span className="sr-only" role="status" aria-live="polite">Active scan {repositoryLabel(repository)}, {complete} of {run.steps.length} files, {run.status}</span>
      <div>
        <strong>Active scan · {repositoryLabel(repository)}</strong>
        <span>{complete}/{run.steps.length} files · {run.status}</span>
      </div>
      <div>
        {run.status === 'running' && <Button size="sm" kind="secondary" renderIcon={Pause} onClick={() => pause(repository.id)}>Pause scan</Button>}
        {run.status === 'paused' && <Button size="sm" renderIcon={Play} onClick={() => resume(repository.id)}>Resume scan</Button>}
        <Button size="sm" kind="ghost" onClick={() => document.getElementById('scan-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View scan panel</Button>
      </div>
    </div>
  )
}

function ExportModal() {
  const open = useAppStore((state) => state.ui.exportOpen)
  const setUi = useAppStore((state) => state.setUi)
  const json = useAppStore((state) => state.artifactJson)
  const markdown = useAppStore((state) => state.artifactMarkdown)
  const [tab, setTab] = useState(0)
  const [confirmation, setConfirmation] = useState('')
  const activeText = tab === 0 ? json : markdown
  const format = tab === 0 ? 'Scan Index JSON' : 'Inventory Markdown'
  const close = () => setUi('exportOpen', false)

  useModalFocusTrap(open, close)
  useEscape(close, open)

  const confirm = (message: string) => {
    setConfirmation(message)
    window.setTimeout(() => setConfirmation(''), 1600)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(activeText)
      confirm(`${format} copied`)
    } catch {
      confirm(`${format} copy failed`)
    }
  }
  const download = () => {
    const blob = new Blob([activeText], { type: tab === 0 ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = tab === 0 ? 'repo-scan-index.json' : 'repo-inventory.md'
    anchor.click()
    URL.revokeObjectURL(url)
    confirm(`${format} downloaded`)
  }

  return (
    <Modal
      open={open}
      modalHeading="Export scan index"
      modalLabel="Live scan package"
      passiveModal
      hasScrollingContent
      size="lg"
      aria-modal="true"
      role="dialog"
      onRequestClose={close}
    >
      <div className="export-controls">
        <p>Artifacts regenerate from the shared repository index whenever repositories, findings, or patterns change.</p>
        <div className="export-actions">
          <Button size="sm" kind="secondary" renderIcon={Copy} onClick={() => void copy()}>Copy</Button>
          <Button size="sm" renderIcon={Download} onClick={download}>Download</Button>
        </div>
      </div>
      <div className="export-live" role="status" aria-live="polite">
        {confirmation && <InlineNotification kind="success" lowContrast hideCloseButton title={confirmation} />}
      </div>
      <Tabs selectedIndex={tab} onChange={({ selectedIndex }) => setTab(selectedIndex)}>
        <TabList aria-label="Export formats" contained>
          <Tab>Scan Index JSON</Tab>
          <Tab>Inventory Markdown</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><pre className="artifact-preview" aria-label="Scan Index JSON preview">{json}</pre></TabPanel>
          <TabPanel><pre className="artifact-preview markdown-preview" aria-label="Inventory Markdown preview">{markdown}</pre></TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  )
}

function ImportModal() {
  const open = useAppStore((state) => state.ui.importOpen)
  const setUi = useAppStore((state) => state.setUi)
  const importIndex = useAppStore((state) => state.importIndex)
  const fileInput = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState('')
  const { register, setValue, handleSubmit, reset, watch, formState: { errors } } = useForm<{ payload: string }>({
    resolver: zodResolver(importFormSchema),
    mode: 'onChange',
    defaultValues: { payload: '' },
  })
  const payload = watch('payload') || ''
  const close = () => {
    setUi('importOpen', false)
    reset()
    setFeedback('')
  }
  useModalFocusTrap(open, close)
  const submit = handleSubmit(({ payload: source }) => {
    let parsed: unknown
    try { parsed = JSON.parse(source) } catch { setFeedback('payload: Scan Index JSON contains malformed JSON.'); return }
    const result = importIndex(parsed)
    if (!result.ok) { setFeedback(result.error || 'Scan Index JSON is invalid.'); return }
    setFeedback('Import successful.')
    setTimeout(close, 1500)
  })
  return (
    <Modal
      open={open}
      modalHeading="Import scan index"
      modalLabel="Replace the current in-memory session"
      primaryButtonText="Import scan index"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!payload.trim() || Boolean(errors.payload)}
      onRequestSubmit={submit}
      onRequestClose={close}
      preventCloseOnClickOutside
      size="md"
    >
      <form autoComplete="off" className="modal-form" onSubmit={submit} noValidate>
        <div className="import-file-row">
          <p>Paste a complete <strong>repo-scan-index/v1</strong> payload or choose a JSON file.</p>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            autoComplete="off"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (file) setValue('payload', await file.text(), { shouldValidate: true, shouldDirty: true })
            }}
          />
          <Button type="button" size="sm" kind="tertiary" renderIcon={ImportExport} onClick={() => fileInput.current?.click()}>Choose JSON file</Button>
        </div>
        <TextArea
          id="import-payload"
          labelText="Scan Index JSON"
          rows={12}
          placeholder="Paste the exported JSON object here"
          invalid={Boolean(errors.payload || feedback)}
          invalidText={errors.payload?.message || feedback}
          aria-describedby="import-payload-error"
          {...register('payload', { onChange: () => setFeedback('') })}
        />
        <div id="import-payload-error" aria-live="assertive" className="import-live">{errors.payload?.message || feedback}</div>
      </form>
    </Modal>
  )
}

type PaletteAction = { id: string; label: string; hint: string; disabled?: boolean; run: () => void }

function CommandPalette() {
  const open = useAppStore((state) => state.ui.paletteOpen)
  const setUi = useAppStore((state) => state.setUi)
  const repositories = useAppStore((state) => state.repositories)
  const selectedCount = useAppStore((state) => state.selectedRepositoryIds.length)
  const undoCount = useAppStore((state) => state.undoStack.length)
  const redoCount = useAppStore((state) => state.redoStack.length)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) return undefined
    const rememberOpener = () => { openerRef.current = document.activeElement as HTMLElement }
    document.addEventListener('focusin', rememberOpener)
    return () => document.removeEventListener('focusin', rememberOpener)
  }, [open])

  const close = () => {
    setUi('paletteOpen', false)
    window.setTimeout(() => openerRef.current?.focus(), 0)
  }
  useEscape(close, open)

  useEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null
      if (active && !active.closest('.palette-backdrop, [role="dialog"]')) openerRef.current = active
      setQuery('')
      setHighlight(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const actions: PaletteAction[] = [
    { id: 'add', label: 'Add repository', hint: 'Open repository form · A', run: () => setUi('addOpen', true) },
    { id: 'scan', label: 'Scan selected', hint: `${selectedCount} repositories · S`, disabled: !selectedCount, run: () => void scanSelected() },
    { id: 'export', label: 'Export scan index', hint: 'JSON or Markdown · E', run: () => setUi('exportOpen', true) },
    { id: 'import', label: 'Import scan index', hint: 'Replace this session · I', run: () => setUi('importOpen', true) },
    { id: 'undo', label: 'Undo', hint: 'Restore previous mutation · ⌘Z', disabled: !undoCount, run: undo },
    { id: 'redo', label: 'Redo', hint: 'Reapply mutation · ⇧⌘Z', disabled: !redoCount, run: redo },
    ...repositories.map((repository) => ({
      id: `jump-${repository.id}`,
      label: `Jump to ${repositoryLabel(repository)}`,
      hint: repository.path,
      run: () => {
        const row = document.getElementById(`repository-${repository.id}`)
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        window.setTimeout(() => row?.focus(), 250)
      },
    })),
  ]
  const filtered = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()))
  const activate = (action: PaletteAction | undefined) => {
    if (!action || action.disabled) return
    close()
    window.setTimeout(action.run, 0)
  }

  if (!open) return null
  return (
    <motion.div className="palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.currentTarget === event.target) close() }}>
      <div role="none" tabIndex={0} onFocus={() => {
        const tabbable = Array.from(document.querySelectorAll('.command-palette button:not([disabled]), .command-palette input'))
        const last = tabbable[tabbable.length - 1]
        last?.focus()
      }} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        className="command-palette"
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setHighlight((value) => Math.min(value + 1, filtered.length - 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((value) => Math.max(value - 1, 0)) }
          if (event.key === 'Enter') { event.preventDefault(); activate(filtered[highlight]) }
          if (event.key === 'Tab') {
            const tabbable = Array.from(event.currentTarget.querySelectorAll('button:not([disabled]), input'))
            const first = tabbable[0] as HTMLElement
            const last = tabbable[tabbable.length - 1] as HTMLElement
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault()
              last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first?.focus()
            }
          }
        }}
      >
        <div className="palette-search">
          <Search size={20} />
          <input autoComplete="off" ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setHighlight(0) }} placeholder="Search commands or repositories" aria-label="Filter commands" />
          <kbd>Esc</kbd>
        </div>
        <h2 id="palette-title" className="sr-only">Command palette</h2>
        <div className="palette-section-label">Actions</div>
        <ul className="palette-list" role="listbox">
          {filtered.map((action, index) => (
            <li key={action.id}>
              <button
                role="option"
                aria-selected={highlight === index}
                disabled={action.disabled}
                className={highlight === index ? 'is-highlighted' : ''}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => activate(action)}
              >
                <span>{action.label}</span><small>{action.hint}</small>
              </button>
            </li>
          ))}
          {!filtered.length && <li className="palette-empty">No matching actions</li>}
        </ul>
      </motion.div>
      <div role="none" tabIndex={0} onFocus={() => inputRef.current?.focus()} />
    </motion.div>
  )
}

function FirstScanCoachmark() {
  const repositories = useAppStore((state) => state.repositories)
  const scanRuns = useAppStore((state) => state.scanRuns)
  const [dismissed, setDismissed] = useState(false)
  const hasActiveScan = Object.values(scanRuns).some((run) => run.status === 'running' || run.status === 'paused')
  if (dismissed || hasActiveScan || repositories.length === 0) return null
  return (
    <motion.div
      className="coachmark"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>First scan tip</strong>
        <p>Select a repository row and choose <em>Scan now</em> to index CLAUDE.md, AGENTS.md, .cursorrules, and README files.</p>
      </div>
      <Button size="sm" kind="ghost" renderIcon={Close} iconDescription="Dismiss coachmark" hasIconOnly onClick={() => setDismissed(true)} />
    </motion.div>
  )
}

function Toolbar() {
  const setUi = useAppStore((state) => state.setUi)
  const selectedCount = useAppStore((state) => state.selectedRepositoryIds.length)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const canUndo = useAppStore((state) => state.undoStack.length > 0)
  const canRedo = useAppStore((state) => state.redoStack.length > 0)
  const failureDemoRun = useAppStore((state) => state.scanRuns['repo-2'])
  const failureDemoRunning = failureDemoRun?.status === 'running' || failureDemoRun?.status === 'paused'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setUi('paletteOpen', true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setUi])

  return (
    <div className="toolbar" aria-label="Repository scanner actions">
      <div className="toolbar-primary">
        <Button size="sm" renderIcon={Add} onClick={() => setUi('addOpen', true)}>Add repository</Button>
        <Button size="sm" kind="secondary" renderIcon={Play} disabled={!selectedCount} onClick={() => void scanSelected()}>
          Scan selected{selectedCount ? ` (${selectedCount})` : ''}
        </Button>
        <Button size="sm" kind="danger--tertiary" renderIcon={WarningFilled} disabled={failureDemoRunning} onClick={() => void startScan('repo-2')}>
          Run failure demo
        </Button>
      </div>
      <div className="toolbar-secondary">
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={Undo} iconDescription="Undo" disabled={!canUndo} onClick={undo} />
        <Button hasIconOnly size="sm" kind="ghost" renderIcon={Redo} iconDescription="Redo" disabled={!canRedo} onClick={redo} />
        <Button size="sm" kind="ghost" renderIcon={ImportExport} onClick={() => setUi('importOpen', true)}>Import scan index</Button>
        <Button size="sm" kind="tertiary" renderIcon={Export} onClick={() => setUi('exportOpen', true)}>Export scan index</Button>
        <Button size="sm" kind="ghost" renderIcon={Search} onClick={() => setUi('paletteOpen', true)}>
          Command palette <kbd>⌘ K</kbd>
        </Button>
      </div>
    </div>
  )
}

export default function App() {
  const [isRM, setIsRM] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsRM(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsRM(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  return (
    <MotionConfig reducedMotion={isRM ? "always" : "never"}>
      <AppContent />
    </MotionConfig>
  )
}

function AppContent() {
  const activeView = useAppStore((state) => state.activeView)
  const repositories = useAppStore((state) => state.repositories)
  const documents = useAppStore((state) => state.documents)
  const ui = useAppStore((state) => state.ui)
  const overlayOpen = ui.addOpen || ui.exportOpen || ui.importOpen || ui.paletteOpen
  const totalDocuments = repositories.reduce((total, repository) => total + (documents[repository.id]?.length || 0), 0)
  const totalFindings = repositories.reduce((total, repository) => total + (documents[repository.id] || []).reduce((sum, document) => sum + document.findings.length, 0), 0)

  return (
    <div className="app-shell">
      <header className="app-header" aria-hidden={overlayOpen}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Search size={20} /></div>
          <div><span>Prompt Engineering Platform</span><strong>RepoScan Studio</strong></div>
        </div>
        <div className="session-indicator"><span className="status-dot" />In-memory session</div>
      </header>
      <main aria-hidden={overlayOpen}>
        <section className="hero">
          <div>
            <p className="eyebrow">Repository intelligence</p>
            <h1>Find the instructions shaping your agents.</h1>
            <p>Track local repositories, scan guidance files as durable workflows, and export a contract-valid index package.</p>
          </div>
          <div className="hero-stats" aria-label="Index overview">
            <div><strong>{repositories.length}</strong><span>repositories</span></div>
            <div><strong>{totalDocuments}</strong><span>documents</span></div>
            <div><strong>{totalFindings}</strong><span>findings</span></div>
          </div>
        </section>
        <FirstScanCoachmark />
        <Toolbar />
        <div className="workspace-grid">
          <div className="left-column">
            <RepositoryList />
            <PatternSettings />
          </div>
          <div className="right-column">
            {activeView === 'viewer' ? <FileViewer /> : <DocumentTree />}
          </div>
        </div>
        <ScanPanel />
      </main>
      <footer aria-hidden={overlayOpen}>
        <span>RepoScan Studio</span>
        <span>State remains in memory and resets on reload.</span>
      </footer>
      <AddRepositoryModal />
      <ExportModal />
      <ImportModal />
      <AnimatePresence><CommandPalette /></AnimatePresence>
    </div>
  )
}
