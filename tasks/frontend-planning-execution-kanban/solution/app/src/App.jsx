import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  ComposedModal,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  OverflowMenu,
  OverflowMenuItem,
  Search,
  Select,
  SelectItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  ToastNotification,
} from '@carbon/react'
import {
  Add,
  Chat,
  Checkmark,
  Close,
  Copy,
  Download,
  DragVertical,
  Error as ErrorIcon,
  Export as ExportIcon,
  Play,
  PromptSession,
  Redo as RedoIcon,
  Renew,
  Time,
  Undo as UndoIcon,
  Upload,
} from '@carbon/icons-react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { columns } from './data.js'
import { compileJSON, compileMarkdown } from './exporters.js'
import { commentSchema, createCardSchema, detailCardSchema, importFormSchema } from './schemas.js'
import { registerWebMCP } from './webmcp.js'
import { useBoardStore } from './store.js'

const statusTagTypes = {
  pending: 'gray',
  running: 'blue',
  retrying: 'gold',
  failed: 'red',
  complete: 'green',
}

const columnNames = Object.fromEntries(columns.map((column) => [column.id, column.name]))
const columnSortStrategy = (args) => args.activeIndex < 0 ? null : verticalListSortingStrategy(args)

function StatusTag({ status, compact = false }) {
  return (
    <Tag type={statusTagTypes[status]} size="sm" className={`status-tag status-${status}`}>
      {status === 'running' && <span className="active-dot" aria-hidden="true" />}
      {status}
      {!compact && status === 'retrying' ? '' : ''}
    </Tag>
  )
}

function AssigneeAvatar({ assignee, people, withName = false }) {
  const person = people.find((item) => item.id === assignee)
  if (!person) return withName ? <span className="unassigned">Unassigned</span> : null
  return (
    <span className="assignee-wrap" title={person.name}>
      <span className="avatar" style={{ '--avatar-color': person.color }} aria-hidden="true">{person.initials}</span>
      {withName && <span>{person.name}</span>}
    </span>
  )
}

function TaskStateIcon({ status }) {
  if (status === 'complete') return <Checkmark size={14} />
  if (status === 'running') return <InlineLoading className="task-spinner" />
  if (status === 'retrying') return <Time size={14} />
  if (status === 'failed') return <ErrorIcon size={14} />
  return <span className="pending-ring" />
}

function TaskList({ card, backoff, detailed = false }) {
  return (
    <div className={`task-list ${detailed ? 'task-list-detailed' : ''}`} aria-label="Task item checklist">
      {card.tasks.map((task) => (
        <div className={`task-row task-${task.status}`} key={task.id}>
          <span className="task-state-icon" aria-hidden="true"><TaskStateIcon status={task.status} /></span>
          <span className="task-copy">
            <span className="task-title">{task.title}</span>
            {(task.status === 'running' || task.status === 'retrying' || task.status === 'failed') && (
              <span className="task-attempt">attempt {task.attempts}</span>
            )}
            {task.status === 'retrying' && backoff?.taskId === task.id && (
              <span className="backoff-copy">waiting {backoff.seconds}s before retry {backoff.nextAttempt} of {backoff.maxAttempts}</span>
            )}
            {task.status === 'failed' && <span className="task-error">The execution step did not return a valid result.</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

function CardPreview({ card }) {
  return (
    <div className={`card-tile drag-overlay accent-${card.column}`}>
      <p className="card-title">{card.title}</p>
      <StatusTag status={card.status} compact />
    </div>
  )
}

function BoardCard({ card, prompt, people, selected, backoff, dropPosition, index }) {
  const {
    setDetailId, setPromptPanelId, toggleSelection, moveCard, moveRelative, runCard, retryCard,
  } = useBoardStore()
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id: card.id, data: { column: card.column } })
  const complete = card.tasks.filter((task) => task.status === 'complete').length
  const isBusy = card.status === 'running' || card.status === 'retrying'
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 200ms ease' }
  const stop = (event) => event.stopPropagation()

  const openDetail = (event) => {
    if (event.target.closest('[data-no-card-open="true"]')) return
    setDetailId(card.id)
  }

  return (
    <>
      {dropPosition === index && <div className="drop-placeholder" aria-hidden="true"><span>Drop card here</span></div>}
      <article
        ref={setNodeRef}
        style={style}
        className={`card-tile accent-${card.column} ${isDragging ? 'is-dragging' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`Open ${card.title}`}
        onClick={openDetail}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
            event.preventDefault(); setDetailId(card.id)
          }
        }}
      >
        <div className="card-topline">
          <div data-no-card-open="true" onClick={stop} className="selection-control">
            <Checkbox
              id={`select-${card.id}`}
              labelText={`Select ${card.title}`}
              hideLabel
              checked={selected}
              onChange={() => toggleSelection(card.id)}
            />
          </div>
          <button
            type="button"
            className="drag-handle"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            data-no-card-open="true"
            aria-label={`Drag ${card.title}`}
            onClick={stop}
          >
            <DragVertical size={16} />
          </button>
          <div className="card-status"><StatusTag status={card.status} compact /></div>
          <div data-no-card-open="true" onClick={stop} className="move-menu-wrap">
            <OverflowMenu size="sm" flipped iconDescription={`Move ${card.title}`} aria-label={`Move ${card.title}`}>
              {columns.map((column) => (
                <OverflowMenuItem
                  key={column.id}
                  itemText={`Move to ${column.name}`}
                  disabled={column.id === card.column}
                  onClick={() => moveCard(card.id, column.id, useBoardStore.getState().order[column.id].length)}
                />
              ))}
              <OverflowMenuItem itemText="Move up" onClick={() => moveRelative(card.id, 'up')} />
              <OverflowMenuItem itemText="Move down" onClick={() => moveRelative(card.id, 'down')} />
            </OverflowMenu>
          </div>
        </div>

        <h3 className="card-title" title={card.title}>{card.title}</h3>
        {card.description && <p className="card-description">{card.description}</p>}

        {prompt && (
          <button
            type="button"
            className="prompt-chip"
            data-no-card-open="true"
            onClick={(event) => { stop(event); setPromptPanelId(prompt.id) }}
          >
            <PromptSession size={14} />
            <span>{prompt.title}</span>
          </button>
        )}

        <TaskList card={card} backoff={backoff} />

        <div className="progress-wrap" aria-label={`${complete} of ${card.tasks.length} task items complete`}>
          <div className="progress-label"><span>Progress</span><strong>{complete} of {card.tasks.length}</strong></div>
          <div className="progress-track"><span style={{ width: `${card.tasks.length ? (complete / card.tasks.length) * 100 : 0}%` }} /></div>
        </div>

        <div className="card-footer">
          <div className="card-meta">
            <AssigneeAvatar assignee={card.assignee} people={people} />
            {card.comments.length > 0 && <span className="comment-count"><Chat size={14} />{card.comments.length}</span>}
          </div>
          <Button
            size="sm"
            kind={card.status === 'failed' ? 'danger--tertiary' : 'tertiary'}
            renderIcon={card.status === 'failed' ? Renew : Play}
            disabled={isBusy}
            data-no-card-open="true"
            onClick={(event) => { stop(event); card.status === 'failed' ? retryCard(card.id) : runCard(card.id, card.status === 'complete') }}
          >
            {card.status === 'failed' ? 'Retry' : card.status === 'complete' ? 'Run again' : isBusy ? 'Running' : 'Run'}
          </Button>
        </div>
      </article>
    </>
  )
}

function BoardColumn({ column, visibleIds, dropHint }) {
  const state = useBoardStore()
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { column: column.id, isColumn: true } })
  const limit = state.wipLimits[column.id]
  const breach = limit !== null && limit !== undefined && visibleIds.length > limit
  const filtersActive = state.filterAssignee !== 'all' || state.search.trim() !== ''
  const dropPosition = dropHint?.column === column.id ? dropHint.position : -1

  return (
    <section ref={setNodeRef} className={`board-column column-${column.id} ${breach ? 'wip-breach' : ''} ${isOver ? 'column-over' : ''}`} aria-labelledby={`column-title-${column.id}`}>
      <header className="column-header">
        <div>
          <div className="column-title-row">
            <h2 id={`column-title-${column.id}`}>{column.name}</h2>
            <span className="count-badge" aria-label={`${visibleIds.length} visible cards`}>{visibleIds.length}</span>
          </div>
          <div className="limit-row">
            {limit !== null && limit !== undefined && <span>WIP limit {limit}</span>}
            {breach && <span className="breach-label">Limit breached</span>}
          </div>
        </div>
        <Button
          hasIconOnly
          iconDescription={`Add Card to ${column.name}`}
          renderIcon={Add}
          kind="ghost"
          size="sm"
          onClick={() => state.setCreateColumn(column.id)}
        />
      </header>

      <div className="column-list" data-column={column.id}>
        <SortableContext items={visibleIds} strategy={columnSortStrategy}>
          {visibleIds.map((cardId, index) => {
            const card = state.cards[cardId]
            return (
              <BoardCard
                key={cardId}
                card={card}
                index={index}
                dropPosition={dropPosition}
                prompt={state.prompts.find((item) => item.id === card.attached_prompt)}
                people={state.assignees}
                selected={state.selection.includes(cardId)}
                backoff={state.backoffs[cardId]}
              />
            )
          })}
          {dropPosition === visibleIds.length && <div className="drop-placeholder drop-at-end" aria-hidden="true"><span>Drop card here</span></div>}
        </SortableContext>

        {!visibleIds.length && (
          <div className="empty-column">
            <div className="empty-icon"><Add size={20} /></div>
            <h3>{filtersActive ? 'No matching cards' : `No cards in ${column.name}`}</h3>
            <p>{filtersActive ? 'Adjust or clear the filters to see more work.' : 'Add the next prompt execution card here.'}</p>
            {filtersActive ? (
              <Button size="sm" kind="tertiary" onClick={state.clearFilters}>Clear filters</Button>
            ) : (
              <Button size="sm" kind="tertiary" renderIcon={Add} onClick={() => state.setCreateColumn(column.id)}>Add Card</Button>
            )}
          </div>
        )}
      </div>

      <div className="column-add-footer">
        <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => state.setCreateColumn(column.id)}>Add Card</Button>
      </div>
    </section>
  )
}

function CreateCardModal() {
  const state = useBoardStore()
  const target = state.createColumn
  const schema = useMemo(
    () => createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id)),
    [state.prompts, state.assignees],
  )
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { title: '', description: '', attached_prompt: '', assignee: '', column: target || 'backlog', position: 0 },
  })
  const submitLock = useRef(false)
  const title = watch('title') || ''
  useEffect(() => {
    if (target) {
      setValue('column', target)
      setValue('position', 0)
    }
  }, [target, setValue])
  // removed if (!target) return null

  const submit = handleSubmit((payload) => {
    if (submitLock.current) return
    submitLock.current = true
    state.createCard(payload)
    state.setCreateColumn(null)
  })

  return (
    <ComposedModal open={Boolean(target)} onClose={() => state.setCreateColumn(null)} selectorPrimaryFocus="#create-title" preventCloseOnClickOutside size="sm">
      <ModalHeader label={target ? columnNames[target] : ''} title="Add a prompt execution card" closeModal={() => state.setCreateColumn(null)} />
      {target && (
        <>
      <ModalBody hasForm>
        <form id="create-card-form" onSubmit={submit} className="modal-form" noValidate>
          <input type="hidden" {...register('column')} />
          <input type="hidden" {...register('position', { valueAsNumber: true })} />
          <TextInput id="create-title" labelText="Title" placeholder="What should this prompt execution accomplish?" invalid={Boolean(errors.title)} invalidText={errors.title?.message} {...register('title')} />
          <TextArea id="create-description" labelText="Description (optional)" placeholder="Add useful context, acceptance criteria, or evaluation notes." invalid={Boolean(errors.description)} invalidText={errors.description?.message} {...register('description')} />
          <Select id="create-prompt" labelText="Attached prompt (optional)" invalid={Boolean(errors.attached_prompt)} invalidText={errors.attached_prompt?.message} {...register('attached_prompt')}>
            <SelectItem value="" text="No attached prompt" />
            {state.prompts.map((prompt) => <SelectItem key={prompt.id} value={prompt.id} text={prompt.title} />)}
          </Select>
          <Select id="create-assignee" labelText="Assignee (optional)" invalid={Boolean(errors.assignee)} invalidText={errors.assignee?.message} {...register('assignee')}>
            <SelectItem value="" text="Unassigned" />
            {state.assignees.map((person) => <SelectItem key={person.id} value={person.id} text={person.name} />)}
          </Select>
          <div className="sr-only" aria-live="assertive">{Object.values(errors).map((error) => error?.message).filter(Boolean).join(' ')}</div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={() => state.setCreateColumn(null)}>Cancel</Button>
        <Button type="submit" form="create-card-form" disabled={!title.trim() || isSubmitting} onClick={submit}>Add Card</Button>
      </ModalFooter>
        </>
      )}
    </ComposedModal>
  )
}

function CardDetailModal() {
  const state = useBoardStore()
  const card = state.detailId ? state.cards[state.detailId] : null
  const schema = useMemo(() => detailCardSchema(state.assignees.map((item) => item.id)), [state.assignees])
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema), mode: 'onChange',
    values: card ? { title: card.title, description: card.description, assignee: card.assignee || '' } : { title: '', description: '', assignee: '' },
  })
  const commentForm = useForm({ resolver: zodResolver(commentSchema), defaultValues: { comment: '' } })
  // removed if (!card) return null
  const prompt = card ? state.prompts.find((item) => item.id === card.attached_prompt) : null
  const complete = card ? card.tasks.filter((task) => task.status === 'complete').length : 0
  const isBusy = card ? (card.status === 'running' || card.status === 'retrying') : false

  const save = handleSubmit((payload) => {
    state.updateCard(card.id, payload)
    state.setDetailId(null)
  })
  const submitComment = commentForm.handleSubmit(({ comment }) => {
    state.addComment(card.id, comment)
    commentForm.reset()
  })

  return (
    <ComposedModal open={Boolean(card)} onClose={() => state.setDetailId(null)} selectorPrimaryFocus="#detail-title" preventCloseOnClickOutside size="lg">
      <ModalHeader label={card ? `${columnNames[card.column]} · ${complete} of ${card.tasks.length} complete` : ''} title="Card detail" closeModal={() => state.setDetailId(null)} />
      {card && (
        <>
      <ModalBody className="detail-modal-body">
        <div className="detail-status-row">
          <StatusTag status={card.status} />
          <AssigneeAvatar assignee={card.assignee} people={state.assignees} withName />
        </div>
        <div className="detail-grid">
          <div className="detail-main">
            <form id="detail-edit-form" onSubmit={save} className="modal-form" noValidate>
              <TextInput id="detail-title" labelText="Title" invalid={Boolean(errors.title)} invalidText={errors.title?.message} {...register('title')} />
              <TextArea id="detail-description" labelText="Description" rows={4} invalid={Boolean(errors.description)} invalidText={errors.description?.message} {...register('description')} />
              <Select id="detail-assignee" labelText="Assignee" invalid={Boolean(errors.assignee)} invalidText={errors.assignee?.message} {...register('assignee')}>
                <SelectItem value="" text="Unassigned" />
                {state.assignees.map((person) => <SelectItem key={person.id} value={person.id} text={person.name} />)}
              </Select>
            </form>

            <section className="detail-section">
              <div className="section-heading"><h3>Task checklist</h3><span>{complete} of {card.tasks.length}</span></div>
              <TaskList card={card} backoff={state.backoffs[card.id]} detailed />
            </section>
          </div>
          <aside className="detail-side">
            <section className="detail-section">
              <h3>Attached prompt</h3>
              {prompt ? (
                <button className="prompt-chip detail-prompt" type="button" onClick={() => state.setPromptPanelId(prompt.id)}><PromptSession size={16} />{prompt.title}</button>
              ) : <p className="muted-copy">No prompt attached.</p>}
            </section>
            <section className="detail-section comments-section">
              <div className="section-heading"><h3>Comments</h3><span>{card.comments.length}</span></div>
              <div className="comment-thread">
                {!card.comments.length && <p className="muted-copy">No comments yet. Add the first execution note.</p>}
                {card.comments.map((comment) => (
                  <div className="comment" key={comment.id}>
                    <p>{comment.body}</p>
                    <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString()}</time>
                  </div>
                ))}
              </div>
              <form className="comment-form" onSubmit={submitComment}>
                <TextArea id="detail-comment" labelText="Add a comment" rows={2} invalid={Boolean(commentForm.formState.errors.comment)} invalidText={commentForm.formState.errors.comment?.message} {...commentForm.register('comment')} />
                <Button type="submit" size="sm" kind="tertiary" renderIcon={Chat}>Add comment</Button>
              </form>
            </section>
          </aside>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="danger--tertiary" onClick={() => {
          if (window.confirm(`Delete “${card.title}”? This can be restored with Undo.`)) state.deleteCard(card.id)
        }}>Delete Card</Button>
        <Button kind="tertiary" renderIcon={card.status === 'failed' ? Renew : Play} disabled={isBusy} onClick={() => card.status === 'failed' ? state.retryCard(card.id) : state.runCard(card.id, card.status === 'complete')}>
          {card.status === 'failed' ? 'Retry' : card.status === 'complete' ? 'Run again' : isBusy ? 'Running' : 'Run'}
        </Button>
        <Button kind="secondary" onClick={() => state.setDetailId(null)}>Cancel</Button>
        <Button type="submit" form="detail-edit-form" onClick={save}>Save</Button>
      </ModalFooter>
        </>
      )}
    </ComposedModal>
  )
}

function useFocusTrap(open, onClose) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const origin = document.activeElement
    const container = ref.current
    const focusable = () => container ? [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')] : []
    requestAnimationFrame(() => focusable()[0]?.focus())
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCloseRef.current?.(); return }
      if (event.key !== 'Tab') return
      const items = focusable(); if (!items.length) return
      const first = items[0]; const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown, { capture: true })
    return () => { document.removeEventListener('keydown', keydown, { capture: true }); origin?.focus?.() }
  }, [open])
  return ref
}

function PromptPanel() {
  const state = useBoardStore()
  const prompt = state.prompts.find((item) => item.id === state.promptPanelId)
  const close = () => state.setPromptPanelId(null)
  const panelRef = useFocusTrap(Boolean(prompt), close)
  if (!prompt) return null
  return (
    <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside ref={panelRef} className="side-panel prompt-panel" role="dialog" aria-modal="true" aria-labelledby="prompt-panel-title">
        <header className="drawer-header">
          <div><span className="eyebrow">Prompt library</span><h2 id="prompt-panel-title">{prompt.title}</h2></div>
          <Button hasIconOnly kind="ghost" renderIcon={Close} iconDescription="Close prompt panel" onClick={close} />
        </header>
        <div className="drawer-body">
          <div className="read-only-label">Full prompt text</div>
          <div className="prompt-text">{prompt.text}</div>
          <p className="read-only-note">Read-only · prompt id: {prompt.id}</p>
        </div>
      </aside>
    </div>
  )
}

function ExportPreview({ text, format, onCopy, onDownload }) {
  return (
    <div className="export-preview-wrap">
      <div className="preview-actions">
        <span>{format === 'json' ? 'application/json' : 'text/markdown'}</span>
        <div>
          <Button size="sm" kind="ghost" renderIcon={Copy} onClick={() => onCopy(text)}>Copy</Button>
          <Button size="sm" kind="ghost" renderIcon={Download} onClick={() => onDownload(text, format)}>Download</Button>
        </div>
      </div>
      <pre className="export-preview" tabIndex={0} aria-label={`${format} export preview`}>{text}</pre>
    </div>
  )
}

function ExportDrawer() {
  const state = useBoardStore()
  const close = () => state.setExportOpen(false)
  const drawerRef = useFocusTrap(state.exportOpen, close)
  const importForm = useForm({ resolver: zodResolver(importFormSchema), defaultValues: { import: state.importDraft } })
  const jsonText = useMemo(() => state.exportOpen ? compileJSON(state) : '', [state, state.exportOpen])
  const markdownText = useMemo(() => state.exportOpen ? compileMarkdown(state) : '', [state, state.exportOpen])
  if (!state.exportOpen) return null
  const selectedIndex = state.exportFormat === 'json' ? 0 : 1
  const importReg = importForm.register('import')

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      state.notify('success', 'Copied', 'The exact visible preview is on your clipboard.')
    } catch {
      state.notify('error', 'Copy unavailable', 'Select the preview text and copy it manually.')
    }
  }
  const download = (text, format) => {
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = format === 'json' ? 'promptops-board.json' : 'promptops-digest.md'; anchor.click()
    URL.revokeObjectURL(url)
  }
  const submitImport = importForm.handleSubmit(({ import: payload }) => {
    state.importBoard(payload)
  }, (errors) => state.setImportError(errors.import?.message || 'Import field is invalid.'))

  return (
    <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside ref={drawerRef} className="side-panel export-drawer" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header className="drawer-header">
          <div><span className="eyebrow">Live board artifact</span><h2 id="export-title">Export & import</h2></div>
          <Button hasIconOnly kind="ghost" renderIcon={Close} iconDescription="Close Export drawer" onClick={close} />
        </header>
        <div className="drawer-body export-body">
          <p className="drawer-intro">Previews regenerate from the current board whenever cards, tasks, or comments change.</p>
          <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex: index }) => state.setExportFormat(index === 0 ? 'json' : 'markdown')}>
            <TabList aria-label="Export formats" contained>
              <Tab>Board JSON</Tab>
              <Tab>Markdown digest</Tab>
            </TabList>
            <TabPanels>
              <TabPanel><ExportPreview text={jsonText} format="json" onCopy={copy} onDownload={download} /></TabPanel>
              <TabPanel><ExportPreview text={markdownText} format="markdown" onCopy={copy} onDownload={download} /></TabPanel>
            </TabPanels>
          </Tabs>
          <div className="import-divider" />
          <form className="import-form" onSubmit={submitImport}>
            <div className="section-heading"><div><h3>Import board JSON</h3><p>Paste a previously exported board payload.</p></div><Upload size={20} /></div>
            <TextArea
              id="import-board-json"
              labelText="Import"
              rows={6}
              placeholder="Paste board JSON here"
              invalid={Boolean(importForm.formState.errors.import || state.importError)}
              invalidText={importForm.formState.errors.import?.message || state.importError}
              {...importReg}
              onChange={(event) => { importReg.onChange(event); state.setImportDraft(event.target.value) }}
            />
            <Button type="submit" size="sm" renderIcon={Upload}>Import Board</Button>
            <div className="sr-only" aria-live="assertive">{importForm.formState.errors.import?.message || state.importError}</div>
          </form>
        </div>
      </aside>
    </div>
  )
}

function BulkActionBar() {
  const state = useBoardStore()
  if (!state.selection.length) return null
  return (
    <div className="bulk-bar" role="region" aria-label="Bulk card actions">
      <div className="bulk-count"><strong>{state.selection.length}</strong><span>selected</span></div>
      <div className="bulk-actions">
        {columns.map((column) => <Button key={column.id} size="sm" kind="ghost" onClick={() => state.bulkMove(column.id)}>Move to {column.name}</Button>)}
      </div>
      <Button hasIconOnly size="sm" kind="ghost" renderIcon={Close} iconDescription="Clear card selection" onClick={state.clearSelection} />
    </div>
  )
}

function App() {
  const state = useBoardStore()
  const [activeId, setActiveId] = useState(null)
  const [dropHint, setDropHint] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const visibleByColumn = useMemo(() => {
    const search = state.search.trim().toLocaleLowerCase()
    return Object.fromEntries(columns.map((column) => [column.id, state.order[column.id].filter((id) => {
      const card = state.cards[id]
      return card && (state.filterAssignee === 'all' || card.assignee === state.filterAssignee) && (!search || card.title.toLocaleLowerCase().includes(search))
    })]))
  }, [state.cards, state.order, state.filterAssignee, state.search])

  useEffect(() => registerWebMCP(), [])
  useEffect(() => {
    if (!state.toast) return undefined
    const timer = setTimeout(state.clearToast, 3800)
    return () => clearTimeout(timer)
  }, [state.toast])
  useEffect(() => {
    const keydown = (event) => {
      const mod = navigator.platform.toLowerCase().includes('mac') ? event.metaKey : event.ctrlKey
      if (!mod || event.key.toLowerCase() !== 'z') return
      const tag = event.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      event.preventDefault()
      if (event.shiftKey) state.redo(); else state.undo()
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [])

  const calculateDrop = (event) => {
    if (!event.over) return null
    const activeCard = state.cards[event.active.id]
    if (!activeCard) return null
    const targetColumn = event.over.data.current?.column || event.over.id.toString().replace('column-', '')
    if (!state.order[targetColumn]) return null
    const targetVisible = visibleByColumn[targetColumn].filter((id) => id !== event.active.id)
    if (event.over.data.current?.isColumn) return { column: targetColumn, position: targetVisible.length }
    const overIndex = targetVisible.indexOf(event.over.id)
    if (overIndex < 0) return { column: targetColumn, position: targetVisible.length }
    const translated = event.active.rect.current.translated
    const below = translated && event.over.rect && translated.top + translated.height / 2 > event.over.rect.top + event.over.rect.height / 2
    return { column: targetColumn, position: overIndex + (below ? 1 : 0) }
  }
  const endDrag = (event) => {
    const hint = calculateDrop(event) || dropHint
    if (hint) state.moveCard(event.active.id, hint.column, hint.position)
    setActiveId(null); setDropHint(null)
  }

  const filtersActive = state.filterAssignee !== 'all' || state.search !== ''
  const activeCard = activeId ? state.cards[activeId] : null

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark"><PromptSession size={22} /></div>
          <div><span className="eyebrow">AI prompt engineering workspace</span><h1>{state.board.name}</h1></div>
        </div>
        <div className="header-summary"><span>{Object.keys(state.cards).length} cards</span><span className="live-dot" />Live session</div>
      </header>

      <main className="main-content">
        <section className="board-toolbar" aria-label="Board toolbar">
          <div className="filter-group">
            <Select id="assignee-filter" labelText="Assignee" hideLabel value={state.filterAssignee} onChange={(event) => state.setFilterAssignee(event.target.value)}>
              <SelectItem value="all" text="All assignees" />
              {state.assignees.map((person) => <SelectItem key={person.id} value={person.id} text={person.name} />)}
            </Select>
            <Search id="board-search" size="lg" labelText="Search cards by title" placeholder="Search card titles" value={state.search} onChange={(event) => state.setSearch(event.target.value)} />
            <Button kind="ghost" size="md" disabled={!filtersActive} onClick={state.clearFilters}>Clear filters</Button>
          </div>
          <div className="toolbar-actions">
            <Button hasIconOnly kind="ghost" size="md" renderIcon={UndoIcon} iconDescription="Undo (Ctrl+Z)" disabled={!state.undoStack.length} onClick={state.undo} />
            <Button hasIconOnly kind="ghost" size="md" renderIcon={RedoIcon} iconDescription="Redo (Ctrl+Shift+Z)" disabled={!state.redoStack.length} onClick={state.redo} />
            <Button kind="tertiary" size="md" renderIcon={ExportIcon} onClick={() => state.setExportOpen(true)}>Export</Button>
          </div>
        </section>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          autoScroll={false}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragOver={(event) => setDropHint(calculateDrop(event))}
          onDragCancel={() => { setActiveId(null); setDropHint(null) }}
          onDragEnd={endDrag}
        >
          <div className="board-scroller" aria-label="Execution kanban board">
            <div className="board-grid">
              {columns.map((column) => <BoardColumn key={column.id} column={column} visibleIds={visibleByColumn[column.id]} dropHint={activeId ? dropHint : null} />)}
            </div>
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeCard ? <CardPreview card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      <BulkActionBar />
      <CreateCardModal />
      <CardDetailModal />
      <PromptPanel />
      <ExportDrawer />

      <div className="announcement" aria-live="polite" aria-atomic="true">{state.announcement}</div>
      {state.toast && (
        <div className="toast-stack">
          <ToastNotification
            key={state.toast.id}
            kind={state.toast.kind}
            title={state.toast.title}
            subtitle={state.toast.subtitle}
            timeout={0}
            onCloseButtonClick={state.clearToast}
            lowContrast
          />
        </div>
      )}
    </div>
  )
}

export default App
