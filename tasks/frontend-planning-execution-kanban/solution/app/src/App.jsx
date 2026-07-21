import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, MotionConfig } from 'motion/react'
import { compileJSON, compileMarkdown } from './exporters.js'
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
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { columns } from './data.js'
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

// Pointer drags prefer the droppable under the pointer (exact card
// targeting) with corner proximity as fallback for gaps and column edges.
// Keyboard drags keep dnd-kit's canonical one-position-per-keystroke
// sorting, which closestCorners provides.
let keyboardDragActive = false
const kanbanCollision = (args) => {
  if (keyboardDragActive) return closestCorners(args)
  const within = pointerWithin(args)
  return within.length ? within : closestCorners(args)
}

// ---------------------------------------------------------------------------
// Surface choreography: drawers and panels register here so a single
// capture-phase Escape handler always closes the topmost surface (before any
// library-internal bubble handlers), and focus traps only cycle within it.
// ---------------------------------------------------------------------------
const surfaceRegistry = new Map()
let surfaceSequence = 0
const registerSurface = (id, close) => {
  const sequence = ++surfaceSequence
  surfaceRegistry.set(id, { id, sequence, close })
  return () => {
    if (surfaceRegistry.get(id)?.sequence === sequence) surfaceRegistry.delete(id)
  }
}
const topSurface = () => {
  let best = null
  for (const entry of surfaceRegistry.values()) {
    if (!best || entry.sequence > best.sequence) best = entry
  }
  return best
}

// Delayed unmount so surfaces animate out: `rendered` stays true for exitMs
// after `open` goes false; `shown` drives the enter/exit transition classes.
function useSurface(open, exitMs = 260) {
  const [rendered, setRendered] = useState(open)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (open) {
      setRendered(true)
      let inner
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        if (inner) cancelAnimationFrame(inner)
      }
    }
    setShown(false)
    const timer = setTimeout(() => setRendered(false), exitMs)
    return () => clearTimeout(timer)
  }, [open, exitMs])
  return { rendered, shown }
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

// Tab-cycle focus trap for a custom dialog surface. Focus restoration to the
// opener is handled by the store (opener stack), so re-renders never yank
// focus while the surface is open.
function useSurfaceFocus(open, ref, surfaceId) {
  useEffect(() => {
    if (!open) return undefined
    const container = ref.current
    if (!container) return undefined
    const focusables = () => [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => element.getClientRects().length)
    const raf = requestAnimationFrame(() => focusables()[0]?.focus())
    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const top = topSurface()
      if (top && top.id !== surfaceId) return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, surfaceId])
}

// Click events fire after a pointer drag ends; this flag keeps the landing
// click from opening the card detail.
let suppressNextClick = false

function StatusTag({ status, compact = false }) {
  return (
    <Tag type={statusTagTypes[status]} size="sm" className={`status-tag status-${status}`}>
      {status === 'running' && <span className="active-dot" aria-hidden="true" />}
      {status}
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

function BoardCard({ card, prompt, people, selected, backoff, dropPosition, index, columnLength }) {
  const {
    setDetailId, setPromptPanelId, toggleSelection, moveCard, moveRelative, runCard, retryCard,
  } = useBoardStore()
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: card.id, data: { column: card.column } })
  const complete = card.tasks.filter((task) => task.status === 'complete').length
  const isBusy = card.status === 'running' || card.status === 'retrying'
  const boardTitle = card.title.length > 80 ? `${card.title.slice(0, 79).trimEnd()}…` : card.title
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 200ms ease' }
  const stop = (event) => event.stopPropagation()

  const openDetail = (event) => {
    if (suppressNextClick) {
      suppressNextClick = false
      return
    }
    if (event.target.closest('[data-no-card-open="true"]')) return
    setDetailId(card.id)
  }

  // Merge dnd-kit's keyboard sensor handler (from listeners) with card
    // activation: the sensor preventDefaults Space when it starts a keyboard
    // drag; Enter stays free to open the detail view.
  const onCardKeyDown = (event) => {
    const dragInFlight = isDragging || Boolean(document.querySelector('.card-tile.is-dragging'))
    listeners?.onKeyDown?.(event)
    if (event.defaultPrevented || dragInFlight) return
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault()
      setDetailId(card.id)
    }
  }

  return (
    <>
      {dropPosition === index && <div className="drop-placeholder" aria-hidden="true"><span>Drop card here</span></div>}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        data-card-id={card.id}
        className={`card-tile accent-${card.column} ${isDragging ? 'is-dragging' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`Open ${card.title}`}
        onClick={openDetail}
        onKeyDown={onCardKeyDown}
      >
        <div className="card-topline">
          <div
            className="selection-control"
            data-no-card-open="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              if (event.target.closest('input, label')) return
              toggleSelection(card.id)
            }}
            onKeyDown={stop}
          >
            <Checkbox
              id={`select-${card.id}`}
              labelText={`Select ${card.title}`}
              hideLabel
              checked={selected}
              onChange={() => toggleSelection(card.id)}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          <span className="drag-handle" aria-hidden="true">
            <DragVertical size={16} />
          </span>
          <div className="card-status"><StatusTag status={card.status} compact /></div>
          <div className="move-menu-wrap" data-no-card-open="true" onClick={stop} onKeyDown={stop}>
            <OverflowMenu size="sm" flipped iconDescription={`Move ${card.title}`} aria-label={`Move ${card.title}`}>
              {columns.map((column) => (
                <OverflowMenuItem
                  key={column.id}
                  itemText={`Move to ${column.name}`}
                  disabled={column.id === card.column}
                  onClick={() => moveCard(card.id, column.id, useBoardStore.getState().order[column.id].length)}
                />
              ))}
              <OverflowMenuItem itemText="Move up" disabled={index === 0} onClick={() => moveRelative(card.id, 'up')} />
              <OverflowMenuItem itemText="Move down" disabled={index >= columnLength - 1} onClick={() => moveRelative(card.id, 'down')} />
            </OverflowMenu>
          </div>
        </div>

        <h3 className="card-title" title={card.title}>{boardTitle}</h3>
        {card.description && <p className="card-description">{card.description}</p>}

        {prompt && (
          <button
            type="button"
            className="prompt-chip"
            data-no-card-open="true"
            onClick={(event) => { stop(event); setPromptPanelId(prompt.id) }}
            onKeyDown={stop}
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
          <span data-no-card-open="true" onClick={stop} onKeyDown={stop}>
            <Button
              size="sm"
              kind={card.status === 'failed' ? 'danger--tertiary' : 'tertiary'}
              renderIcon={card.status === 'failed' ? Renew : Play}
              disabled={isBusy}
              onClick={(event) => { stop(event); card.status === 'failed' ? retryCard(card.id) : runCard(card.id, card.status === 'complete') }}
            >
              {card.status === 'failed' ? 'Retry' : card.status === 'complete' ? 'Run again' : isBusy ? 'Running' : 'Run'}
            </Button>
          </span>
        </div>
      </motion.article>
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
    <section className={`board-column column-${column.id} ${breach ? 'wip-breach' : ''} ${isOver ? 'column-over' : ''}`} aria-labelledby={`column-title-${column.id}`}>
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

      <div className="column-list" ref={setNodeRef} data-column={column.id}>
        <SortableContext items={visibleIds} strategy={columnSortStrategy}>
          {visibleIds.map((cardId, index) => {
            const card = state.cards[cardId]
            return (
              <BoardCard
                key={cardId}
                card={card}
                index={index}
                columnLength={visibleIds.length}
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

function CreateCardModal({ column, shown }) {
  const state = useBoardStore()
  const schema = useMemo(
    () => createCardSchema(state.prompts.map((item) => item.id), state.assignees.map((item) => item.id)),
    [state.prompts, state.assignees],
  )
  const seed = state.createFormSeed
  const { register, handleSubmit, setError, clearErrors, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: seed?.title ?? '',
      description: seed?.description ?? '',
      attached_prompt: seed?.attached_prompt ?? '',
      assignee: seed?.assignee ?? '',
      column,
      position: 0,
    },
  })
  const close = () => state.setCreateColumn(null)
  const submitted = useRef(false)
  const title = watch('title') || ''

  useEffect(() => {
    if (!seed) return
    reset({
      title: seed.title ?? '',
      description: seed.description ?? '',
      attached_prompt: seed.attached_prompt ?? '',
      assignee: seed.assignee ?? '',
      column,
      position: 0,
    })
  }, [seed, column, reset])

  useEffect(() => {
    const external = state.createFormErrors || {}
    const keys = Object.keys(external).filter((key) => external[key])
    if (!keys.length) return
    keys.forEach((key) => setError(key, { type: 'manual', message: external[key] }))
  }, [state.createFormErrors, setError])

  const submit = handleSubmit((payload) => {
    if (submitted.current) return
    submitted.current = true
    state.setCreateFormErrors({})
    state.createCard(payload)
    state.setCreateColumn(null)
  }, (formErrors) => {
    const mapped = Object.fromEntries(
      Object.entries(formErrors).map(([key, value]) => [key, value?.message]).filter(([, message]) => message),
    )
    state.setCreateFormErrors(mapped)
    state.announce('Form contains validation errors.')
  })

  return (
    <ComposedModal open onClose={close} selectorPrimaryFocus="#create-title" preventCloseOnClickOutside size="sm" className={`modal-surface ${shown ? 'is-shown' : ''}`}>
      <ModalHeader label={columnNames[column]} title="Add a prompt execution card" closeModal={close} />
      <ModalBody hasForm>
        <form id="create-card-form" onSubmit={submit} className="modal-form" noValidate>
          <input type="hidden" {...register('column')} />
          <input type="hidden" {...register('position', { valueAsNumber: true })} />
          <TextInput
            id="create-title"
            labelText="Title"
            placeholder="What should this prompt execution accomplish?"
            invalid={Boolean(errors.title)}
            invalidText={errors.title?.message}
            {...register('title', { onChange: () => { clearErrors('title'); state.setCreateFormErrors({ ...state.createFormErrors, title: undefined }) } })}
          />
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
        <Button kind="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" form="create-card-form" disabled={isSubmitting}>Add Card</Button>
      </ModalFooter>
    </ComposedModal>
  )
}

function CreateCardModalHost() {
  const createColumn = useBoardStore((state) => state.createColumn)
  const createOpenToken = useBoardStore((state) => state.createOpenToken)
  const open = Boolean(createColumn)
  const { rendered, shown } = useSurface(open, 240)
  const [frozenColumn, setFrozenColumn] = useState(null)
  const [frozenToken, setFrozenToken] = useState(0)
  useEffect(() => {
    if (createColumn) {
      setFrozenColumn(createColumn)
      setFrozenToken(createOpenToken)
    }
  }, [createColumn, createOpenToken])
  if (!rendered || !frozenColumn) return null
  return <CreateCardModal key={`${frozenColumn}-${frozenToken}`} column={frozenColumn} shown={shown} />
}

function DetailEditForm({ card, onSave }) {
  const assignees = useBoardStore((state) => state.assignees)
  const schema = useMemo(() => detailCardSchema(assignees.map((item) => item.id)), [assignees])
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'all',
    defaultValues: { title: card.title, description: card.description, assignee: card.assignee || '' },
  })
  const submitted = useRef(false)
  const state = useBoardStore()
  const submit = handleSubmit((payload) => {
    if (submitted.current) return
    submitted.current = true
    onSave(payload)
  }, () => {
    state.announce('Form contains validation errors.')
  })
  return (
    <form id="detail-edit-form" onSubmit={submit} className="modal-form" noValidate>
      <TextInput id="detail-title" labelText="Title" invalid={Boolean(errors.title)} invalidText={errors.title?.message} {...register('title')} />
      <TextArea id="detail-description" labelText="Description" rows={4} invalid={Boolean(errors.description)} invalidText={errors.description?.message} {...register('description')} />
      <Select id="detail-assignee" labelText="Assignee" invalid={Boolean(errors.assignee)} invalidText={errors.assignee?.message} {...register('assignee')}>
        <SelectItem value="" text="Unassigned" />
        {assignees.map((person) => <SelectItem key={person.id} value={person.id} text={person.name} />)}
      </Select>
      <div className="sr-only" aria-live="assertive">{Object.values(errors).map((error) => error?.message).filter(Boolean).join(' ')}</div>
    </form>
  )
}

function CardDetailModal({ cardId, shown }) {
  const state = useBoardStore()
  const live = state.cards[cardId] || null
  const [frozen, setFrozen] = useState(live)
  useEffect(() => {
    if (live) setFrozen(live)
  }, [live])
  const card = live || frozen
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEffect(() => {
    setConfirmingDelete(false)
  }, [cardId])
  useEffect(() => {
    if (!confirmingDelete) return undefined
    const timer = setTimeout(() => setConfirmingDelete(false), 2600)
    return () => clearTimeout(timer)
  }, [confirmingDelete])

  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    mode: 'all',
    defaultValues: { comment: '' },
  })

  if (!card) return null
  const prompt = state.prompts.find((item) => item.id === card.attached_prompt)
  const complete = card.tasks.filter((task) => task.status === 'complete').length
  const isBusy = card.status === 'running' || card.status === 'retrying'
  const close = () => state.setDetailId(null)

  const submitComment = commentForm.handleSubmit(({ comment }) => {
    state.addComment(card.id, comment)
    commentForm.reset()
  }, () => {
    state.announce('Form contains validation errors.')
  })

  return (
    <ComposedModal open onClose={close} selectorPrimaryFocus="#detail-title" preventCloseOnClickOutside size="lg" className={`modal-surface ${shown ? 'is-shown' : ''}`}>
      <ModalHeader label={`${columnNames[card.column]} · ${complete} of ${card.tasks.length} complete`} title={card.title} closeModal={close} />
      <ModalBody className="detail-modal-body">
        <div className="detail-status-row">
          <StatusTag status={card.status} />
          <AssigneeAvatar assignee={card.assignee} people={state.assignees} withName />
        </div>
        <div className="detail-grid">
          <div className="detail-main">
            <DetailEditForm
              key={card.id}
              card={card}
              onSave={(payload) => {
                state.updateCard(card.id, payload)
                state.setDetailId(null)
              }}
            />

            <section className="detail-section">
              <div className="section-heading"><h3>Task checklist</h3><span>{complete} of {card.tasks.length}</span></div>
              <TaskList card={card} backoff={state.backoffs[card.id]} detailed />
            </section>
          </div>
          <aside className="detail-side">
            <section className="detail-section">
              <h3>Attached prompt</h3>
              {prompt ? (
                <button className="prompt-chip detail-prompt" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => state.setPromptPanelId(prompt.id)}><PromptSession size={16} />{prompt.title}</button>
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
                {/* preventDefault on mousedown: Carbon centers newly focused
                    nodes inside scrollable modal content, which would shift the
                    button out from under the pointer between down and up. */}
                <Button type="submit" size="sm" kind="tertiary" renderIcon={Chat} onMouseDown={(event) => event.preventDefault()}>Add comment</Button>
              </form>
            </section>
          </aside>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          kind="danger--tertiary"
          onClick={() => {
            if (!confirmingDelete) {
              setConfirmingDelete(true)
              return
            }
            state.deleteCard(card.id)
          }}
        >
          {confirmingDelete ? 'Confirm delete?' : 'Delete Card'}
        </Button>
        <Button kind="tertiary" renderIcon={card.status === 'failed' ? Renew : Play} disabled={isBusy} onClick={() => card.status === 'failed' ? state.retryCard(card.id) : state.runCard(card.id, card.status === 'complete')}>
          {card.status === 'failed' ? 'Retry' : card.status === 'complete' ? 'Run again' : isBusy ? 'Running' : 'Run'}
        </Button>
        <Button kind="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" form="detail-edit-form">Save</Button>
      </ModalFooter>
    </ComposedModal>
  )
}

function CardDetailModalHost() {
  const detailId = useBoardStore((state) => state.detailId)
  const open = Boolean(detailId)
  const { rendered, shown } = useSurface(open, 240)
  const [frozenId, setFrozenId] = useState(null)
  const [frozenToken, setFrozenToken] = useState(0)
  useEffect(() => {
    if (detailId) {
      setFrozenId(detailId)
      setFrozenToken(Date.now())
    }
  }, [detailId])
  if (!rendered || !frozenId) return null
  return <CardDetailModal key={`${frozenId}-${frozenToken}`} cardId={frozenId} shown={shown} />
}

function PromptPanel({ promptId, shown }) {
  const state = useBoardStore()
  const prompt = state.prompts.find((item) => item.id === promptId)
  const open = Boolean(state.promptPanelId)
  const close = () => state.setPromptPanelId(null)
  const panelRef = useRef(null)
  useSurfaceFocus(open, panelRef, 'prompt-panel')
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    if (!open) return undefined
    return registerSurface('prompt-panel', () => closeRef.current())
  }, [open])

  if (!prompt) return null
  return (
    <div className={`drawer-scrim ${shown ? 'is-shown' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside ref={panelRef} className={`side-panel prompt-panel ${shown ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="prompt-panel-title" onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
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

function PromptPanelHost() {
  const promptPanelId = useBoardStore((state) => state.promptPanelId)
  const open = Boolean(promptPanelId)
  const { rendered, shown } = useSurface(open, 240)
  const [frozenId, setFrozenId] = useState(null)
  useEffect(() => {
    if (promptPanelId) setFrozenId(promptPanelId)
  }, [promptPanelId])
  if (!rendered || !frozenId) return null
  return <PromptPanel promptId={frozenId} shown={shown} />
}

function ExportPreview({ text, format, onCopy, onDownload }) {
  return (
    <div className="export-preview-wrap">
      <div className="preview-actions">
        <span>{format === 'json' ? 'application/json' : 'text/markdown'}</span>
        <div>
          <Button size="sm" kind="ghost" renderIcon={Copy} data-export-copy onClick={(event) => onCopy(text, event.currentTarget)}>Copy</Button>
          <Button size="sm" kind="ghost" renderIcon={Download} onClick={() => onDownload(text, format)}>Download</Button>
        </div>
      </div>
      <pre className="export-preview" tabIndex={0} aria-label={`${format} export preview`}>{text}</pre>
    </div>
  )
}

function ExportDrawer({ shown }) {
  const state = useBoardStore()
  const open = state.exportOpen
  const close = () => state.setExportOpen(false)
  const drawerRef = useRef(null)
  useSurfaceFocus(open, drawerRef, 'export-drawer')
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    if (!open) return undefined
    return registerSurface('export-drawer', () => closeRef.current())
  }, [open])

  const importForm = useForm({
    resolver: zodResolver(importFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { import: state.importDraft },
  })

  const exportData = useMemo(() => {
    if (!open) return { json: '', markdown: '' }
    return {
      json: compileJSON(state),
      markdown: compileMarkdown(state),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state.board, state.cards, state.order, state.prompts, state.assignees, state.wipLimits])

  const selectedIndex = state.exportFormat === 'json' ? 0 : 1
  const importReg = importForm.register('import')

  const copy = async (text, control) => {
    control.dataset.copyStatus = 'pending'
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      control.dataset.copyStatus = 'success'
      state.notify('success', 'Copied', 'The exact visible preview is on your clipboard.')
      state.announce('Export copied to clipboard.')
    } catch {
      control.dataset.copyStatus = 'error'
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
    const imported = state.importBoard(payload)
    if (imported) {
      importForm.reset({ import: '' })
      state.setImportDraft('')
    }
  }, (errors) => {
    state.setImportError(errors.import?.message || 'Import field is invalid.')
    state.announce('Form contains validation errors.')
  })

  return (
    <div className={`drawer-scrim ${shown ? 'is-shown' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside ref={drawerRef} className={`side-panel export-drawer ${shown ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header className="drawer-header">
          <div><span className="eyebrow">Live board artifact</span><h2 id="export-title">Export &amp; import</h2></div>
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
              <TabPanel><ExportPreview text={exportData.json} format="json" onCopy={copy} onDownload={download} /></TabPanel>
              <TabPanel><ExportPreview text={exportData.markdown} format="markdown" onCopy={copy} onDownload={download} /></TabPanel>
            </TabPanels>
          </Tabs>
          <div className="import-divider" />
          <form className="import-form" onSubmit={submitImport}>
            <div className="section-heading"><div><h3>Import board JSON</h3><p>Paste a previously exported board payload.</p></div><Upload size={20} /></div>
            <TextArea
              id="import-board-json"
              labelText="Import"
              rows={4}
              placeholder="Paste board JSON here"
              invalid={Boolean(importForm.formState.errors.import || state.importError)}
              invalidText={importForm.formState.errors.import?.message || state.importError}
              {...importReg}
              onChange={(event) => { importReg.onChange(event); state.setImportDraft(event.target.value) }}
            />
            <div className="import-actions">
              <Button type="submit" size="sm" renderIcon={Upload}>Import Board</Button>
            </div>
            <div className="sr-only" aria-live="assertive">{importForm.formState.errors.import?.message || state.importError}</div>
          </form>
        </div>
      </aside>
    </div>
  )
}

function ExportDrawerHost() {
  const exportOpen = useBoardStore((state) => state.exportOpen)
  const { rendered, shown } = useSurface(exportOpen, 240)
  if (!rendered) return null
  return <ExportDrawer shown={shown} />
}

function BulkActionBar({ shown, count }) {
  const state = useBoardStore()
  return (
    <div className={`bulk-bar ${shown ? 'is-shown' : ''}`} role="region" aria-label="Bulk card actions">
      <div className="bulk-count"><strong>{count}</strong><span>selected</span></div>
      <div className="bulk-actions">
        {columns.map((column) => <Button key={column.id} size="sm" kind="ghost" onClick={() => state.bulkMove(column.id)}>Move to {column.name}</Button>)}
      </div>
      <Button hasIconOnly size="sm" kind="ghost" renderIcon={Close} iconDescription="Clear card selection" onClick={state.clearSelection} />
    </div>
  )
}

function BulkActionBarHost() {
  const count = useBoardStore((state) => state.selection.length)
  const open = count > 0
  const { rendered, shown } = useSurface(open, 200)
  const [frozenCount, setFrozenCount] = useState(0)
  useEffect(() => {
    if (count) setFrozenCount(count)
  }, [count])
  if (!rendered || !open && !frozenCount) return null
  return <BulkActionBar shown={shown} count={open ? count : frozenCount} />
}

function ToastHost() {
  const toast = useBoardStore((state) => state.toast)
  const clearToast = useBoardStore((state) => state.clearToast)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (!toast) {
      setLeaving(false)
      return undefined
    }
    setLeaving(false)
    const fade = setTimeout(() => setLeaving(true), 3300)
    const clear = setTimeout(() => clearToast(), 3650)
    return () => {
      clearTimeout(fade)
      clearTimeout(clear)
    }
  }, [toast, clearToast])
  if (!toast) return null
  return (
    <div className={`toast-stack ${leaving ? 'toast-leaving' : ''}`}>
      <ToastNotification
        key={toast.id}
        kind={toast.kind}
        title={toast.title}
        subtitle={toast.subtitle}
        timeout={0}
        onCloseButtonClick={clearToast}
        lowContrast
      />
    </div>
  )
}

function App() {
  const state = useBoardStore()
  const [activeId, setActiveId] = useState(null)
  const [dropHint, setDropHint] = useState(null)
  const dropHintRef = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter stays reserved for opening the card detail; Space drives
      // keyboard drag-and-drop.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  const visibleByColumn = useMemo(() => {
    const search = state.search.trim().toLocaleLowerCase()
    return Object.fromEntries(columns.map((column) => [column.id, state.order[column.id].filter((id) => {
      const card = state.cards[id]
      return card && (state.filterAssignee === 'all' || card.assignee === state.filterAssignee) && (!search || card.title.toLocaleLowerCase().includes(search))
    })]))
  }, [state.cards, state.order, state.filterAssignee, state.search])

  useEffect(() => registerWebMCP(), [])

  // Escape closes the topmost custom surface (prompt panel / export drawer)
  // before any library bubble-phase handler can act; Carbon modals handle
  // their own Escape natively and are not registered here.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      const top = topSurface()
      if (!top) return
      event.stopPropagation()
      event.preventDefault()
      top.close()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  useEffect(() => {
    const reset = () => { suppressNextClick = false }
    document.addEventListener('pointerdown', reset)
    return () => document.removeEventListener('pointerdown', reset)
  }, [])

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

  const taskStats = useMemo(() => {
    let total = 0
    let done = 0
    for (const id of Object.keys(state.cards)) {
      const card = state.cards[id]
      total += card.tasks.length
      done += card.tasks.filter((task) => task.status === 'complete').length
    }
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [state.cards])

  const breachCount = useMemo(() => columns.filter((column) => {
    const limit = state.wipLimits[column.id]
    return limit !== null && limit !== undefined && visibleByColumn[column.id].length > limit
  }).length, [visibleByColumn, state.wipLimits])

  const calculateDrop = (event) => {
    const activeCard = state.cards[event.active.id]
    if (!activeCard) return null

    let over = event.over
    if (over && String(over.id) === String(event.active.id)) over = null

    // When the pointer is not over a foreign droppable, resolve the column
    // under the pointer from the DOM so cross-column drops still land.
    let targetColumn = over?.data?.current?.column || (over ? over.id.toString().replace('column-', '') : null)
    if (!targetColumn || !state.order[targetColumn]) {
      const probeY = typeof event.activatorEvent?.clientY === 'number'
        ? event.activatorEvent.clientY + event.delta.y
        : event.active.rect.current.translated
          ? event.active.rect.current.translated.top + event.active.rect.current.translated.height / 2
          : null
      const probeX = typeof event.activatorEvent?.clientX === 'number'
        ? event.activatorEvent.clientX + event.delta.x
        : event.active.rect.current.translated
          ? event.active.rect.current.translated.left + event.active.rect.current.translated.width / 2
          : null
      if (probeX == null || probeY == null) return null
      const columnEl = document.elementsFromPoint(probeX, probeY).find((el) => el.closest?.('.board-column'))
      const section = columnEl?.closest?.('.board-column')
      targetColumn = section?.className?.match(/column-(backlog|in-progress|review|done)/)?.[1] || null
      if (!targetColumn || !state.order[targetColumn]) return null
      over = { id: `column-${targetColumn}`, data: { current: { column: targetColumn, isColumn: true } }, rect: section.getBoundingClientRect() }
    }

    const targetVisible = visibleByColumn[targetColumn].filter((id) => id !== event.active.id)

    const activeRect = event.active.rect.current.translated
    const probeY = activeRect
      ? activeRect.top + activeRect.height / 2
      : typeof event.activatorEvent?.clientY === 'number'
        ? event.activatorEvent.clientY + event.delta.y
        : null
    if (probeY == null) return { column: targetColumn, position: targetVisible.length }

    const listElement = document.querySelector(`.column-list[data-column="${targetColumn}"]`)
    const articles = listElement ? [...listElement.querySelectorAll('article.card-tile')] : []
    let position = 0
    for (const element of articles) {
      if (element.dataset.cardId === String(event.active.id)) continue
      const rect = element.getBoundingClientRect()
      if (probeY < rect.top + rect.height / 2) break
      position += 1
    }
    return { column: targetColumn, position }
  }
  const endDrag = (event) => {
    keyboardDragActive = false
    suppressNextClick = !(event.activatorEvent instanceof KeyboardEvent)
    // Prefer the live drop hint computed during drag-over; fall back to the
    // end-event geometry. Filtering out the active id as an "over" target
    // prevents no-op drops when the source tile still wins collision.
    let hint = dropHintRef.current
    if (!hint || (event.over && String(event.over.id) === String(event.active.id))) {
      const recalculated = calculateDrop({
        ...event,
        over: event.over && String(event.over.id) === String(event.active.id) ? null : event.over,
      })
      if (recalculated) hint = recalculated
    }
    if (!hint && event.over) hint = calculateDrop(event)
    if (hint) {
      const fullTarget = state.order[hint.column].filter((id) => id !== event.active.id)
      const visibleTarget = visibleByColumn[hint.column].filter((id) => id !== event.active.id)
      const nextVisibleId = visibleTarget[hint.position]
      const fullPosition = nextVisibleId ? fullTarget.indexOf(nextVisibleId) : fullTarget.length
      state.moveCard(event.active.id, hint.column, fullPosition)
    }
    dropHintRef.current = null
    setActiveId(null); setDropHint(null)
  }
  const cancelDrag = () => {
    keyboardDragActive = false
    suppressNextClick = true
    dropHintRef.current = null
    setActiveId(null); setDropHint(null)
  }

  const filtersActive = state.filterAssignee !== 'all' || state.search.trim() !== ''
  const activeCard = activeId ? state.cards[activeId] : null

  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <MotionConfig reducedMotion="user">
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

        <section className="board-stats" aria-label="Board activity">
          <span className="stat"><strong>{taskStats.pct}%</strong> of {taskStats.total} task items complete</span>
          <span className="stat"><strong>{state.runsCompleted}</strong> {state.runsCompleted === 1 ? 'run' : 'runs'} completed this session</span>
          <span className={`stat ${breachCount ? 'stat-warn' : 'stat-ok'}`}>
            {breachCount
              ? <><strong>{breachCount}</strong> {breachCount === 1 ? 'column' : 'columns'} over WIP limit</>
              : 'All columns within WIP limits'}
          </span>
        </section>

        <DndContext
          sensors={sensors}
          collisionDetection={kanbanCollision}
          autoScroll={false}
          onDragStart={({ active, activatorEvent }) => {
            keyboardDragActive = activatorEvent instanceof KeyboardEvent
            dropHintRef.current = null
            setActiveId(active.id)
          }}
          onDragOver={(event) => {
            const hint = calculateDrop(event)
            dropHintRef.current = hint
            setDropHint(hint)
          }}
          onDragCancel={cancelDrag}
          onDragEnd={endDrag}
        >
          <div className="board-scroller" aria-label="Execution kanban board">
            <div className="board-grid">
              {columns.map((column) => <BoardColumn key={column.id} column={column} visibleIds={visibleByColumn[column.id]} dropHint={activeId ? dropHint : null} />)}
            </div>
          </div>
          <DragOverlay dropAnimation={reduceMotion ? null : { duration: 200, easing: 'ease' }}>
            {activeCard ? <CardPreview card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      <BulkActionBarHost />
      <CreateCardModalHost />
      <CardDetailModalHost />
      <PromptPanelHost />
      <ExportDrawerHost />
      <ToastHost />

      <div className="announcement" aria-live="polite" aria-atomic="true">{state.announcement}</div>
    </div>
    </MotionConfig>
  )
}

export default App
