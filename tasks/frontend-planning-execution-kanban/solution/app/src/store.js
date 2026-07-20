import { create } from 'zustand'
import { columns, failurePlans, seededAssignees, seededCards, seededOrder, seededPrompts } from './data.js'
import { compileJSON, compileMarkdown } from './exporters.js'

const clone = (value) => structuredClone(value)
const uid = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const activeRuns = new Set()

const initialDomain = {
  board: { id: 'board-promptops', name: 'PromptOps Execution Board' },
  cards: Object.fromEntries(seededCards.map((card) => [card.id, clone(card)])),
  order: clone(seededOrder),
  prompts: clone(seededPrompts),
  assignees: clone(seededAssignees),
  wipLimits: Object.fromEntries(columns.map((column) => [column.id, column.wip_limit])),
}

const snapshot = (state) => clone({
  board: state.board,
  cards: state.cards,
  order: state.order,
  prompts: state.prompts,
  assignees: state.assignees,
  wipLimits: state.wipLimits,
})

const historyCommit = (state, domainPatch) => ({
  ...domainPatch,
  undoStack: [...state.undoStack.slice(-39), snapshot(state)],
  redoStack: [],
})

const updateCardRecord = (cards, cardId, updater) => {
  const card = cards[cardId]
  if (!card) return cards
  return { ...cards, [cardId]: updater(card) }
}

const initialExportSource = { ...initialDomain }

export const useBoardStore = create((set, get) => ({
  ...clone(initialDomain),
  filterAssignee: 'all',
  search: '',
  selection: [],
  undoStack: [],
  redoStack: [],
  backoffs: {},
  announcement: 'Board ready.',
  toast: null,
  createColumn: null,
  detailId: null,
  promptPanelId: null,
  exportOpen: false,
  exportFormat: 'json',
  exportDraft: {
    json: compileJSON(initialExportSource),
    markdown: compileMarkdown(initialExportSource),
  },
  importDraft: '',
  importError: '',

  setFilterAssignee: (filterAssignee) => set({ filterAssignee }),
  setSearch: (search) => set({ search }),
  clearFilters: () => set({ filterAssignee: 'all', search: '' }),
  setCreateColumn: (createColumn) => set({ createColumn }),
  setDetailId: (detailId) => set({ detailId }),
  setPromptPanelId: (promptPanelId) => set({ promptPanelId }),
  setExportOpen: (exportOpen) => set({ exportOpen, importError: exportOpen ? get().importError : '' }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setImportDraft: (importDraft) => set({ importDraft, importError: '' }),
  setImportError: (importError) => set({ importError }),
  clearToast: () => set({ toast: null }),
  notify: (kind, title, subtitle) => set({ toast: { id: uid('toast'), kind, title, subtitle } }),
  announce: (announcement) => set({ announcement }),

  syncExportDraft: () => {
    const state = get()
    set({ exportDraft: { json: compileJSON(state), markdown: compileMarkdown(state) } })
  },

  createCard: (payload) => {
    const state = get()
    const id = uid('card')
    const newCard = {
      id,
      title: payload.title.trim(),
      description: payload.description || '',
      column: payload.column,
      assignee: payload.assignee || null,
      attached_prompt: payload.attached_prompt || null,
      status: 'pending',
      tasks: ['Validate prompt inputs', 'Execute prompt run', 'Review generated output'].map((title, index) => ({
        id: `${id}-task-${index + 1}`, title, status: 'pending', attempts: 0,
      })),
      comments: [],
    }
    const nextOrder = clone(state.order)
    nextOrder[payload.column] = [id, ...nextOrder[payload.column]]
    set(historyCommit(state, { cards: { ...state.cards, [id]: newCard }, order: nextOrder }))
    get().notify('success', 'Card created', `${newCard.title} was added to ${columns.find((column) => column.id === payload.column)?.name}.`)
    get().announce(`Card ${newCard.title} created.`)
    return id
  },

  updateCard: (cardId, updates) => {
    const state = get()
    if (!state.cards[cardId]) return false
    const allowed = {
      title: updates.title?.trim() ?? state.cards[cardId].title,
      description: updates.description ?? state.cards[cardId].description,
      assignee: updates.assignee === '' ? null : (updates.assignee ?? state.cards[cardId].assignee),
      attached_prompt: updates.attached_prompt === '' ? null : (updates.attached_prompt ?? state.cards[cardId].attached_prompt),
    }
    const nextCards = updateCardRecord(state.cards, cardId, (card) => ({ ...card, ...allowed }))
    set(historyCommit(state, { cards: nextCards }))
    get().notify('success', 'Card saved', `${allowed.title} is up to date.`)
    return true
  },

  deleteCard: (cardId) => {
    const state = get()
    const card = state.cards[cardId]
    if (!card) return false
    const nextCards = { ...state.cards }
    delete nextCards[cardId]
    const nextOrder = Object.fromEntries(Object.entries(state.order).map(([column, ids]) => [column, ids.filter((id) => id !== cardId)]))
    set(historyCommit(state, { cards: nextCards, order: nextOrder, selection: state.selection.filter((id) => id !== cardId), detailId: null }))
    get().notify('success', 'Card deleted', `${card.title} was removed.`)
    return true
  },

  moveCard: (cardId, targetColumn, requestedPosition) => {
    const state = get()
    const card = state.cards[cardId]
    if (!card || !state.order[targetColumn]) return false
    const sourceColumn = card.column
    const sourceIndex = state.order[sourceColumn].indexOf(cardId)
    const targetWithout = state.order[targetColumn].filter((id) => id !== cardId)
    const position = Math.max(0, Math.min(requestedPosition, targetWithout.length))
    if (sourceColumn === targetColumn && sourceIndex === position) return false
    const nextOrder = clone(state.order)
    nextOrder[sourceColumn] = nextOrder[sourceColumn].filter((id) => id !== cardId)
    nextOrder[targetColumn] = targetWithout
    nextOrder[targetColumn].splice(position, 0, cardId)
    const nextCards = updateCardRecord(state.cards, cardId, (current) => ({ ...current, column: targetColumn }))
    set(historyCommit(state, { order: nextOrder, cards: nextCards }))
    const targetName = columns.find((column) => column.id === targetColumn)?.name
    get().announce(`${card.title} moved to ${targetName}, position ${position + 1}.`)
    return true
  },

  moveRelative: (cardId, direction) => {
    const state = get()
    const card = state.cards[cardId]
    if (!card) return false
    const index = state.order[card.column].indexOf(cardId)
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= state.order[card.column].length) return false
    return get().moveCard(cardId, card.column, nextIndex)
  },

  toggleSelection: (cardId) => set((state) => ({
    selection: state.selection.includes(cardId)
      ? state.selection.filter((id) => id !== cardId)
      : [...state.selection, cardId],
  })),
  clearSelection: () => set({ selection: [] }),

  bulkMove: (targetColumn) => {
    const state = get()
    if (!state.selection.length || !state.order[targetColumn]) return false
    const selected = state.selection.filter((id) => state.cards[id])
    const selectedSet = new Set(selected)
    const nextOrder = Object.fromEntries(Object.entries(state.order).map(([column, ids]) => [column, ids.filter((id) => !selectedSet.has(id))]))
    nextOrder[targetColumn] = [...nextOrder[targetColumn], ...selected]
    const nextCards = { ...state.cards }
    selected.forEach((id) => { nextCards[id] = { ...nextCards[id], column: targetColumn } })
    set(historyCommit(state, { order: nextOrder, cards: nextCards, selection: [] }))
    get().announce(`${selected.length} cards moved to ${columns.find((column) => column.id === targetColumn)?.name}.`)
    return true
  },

  addComment: (cardId, body) => {
    const state = get()
    if (!state.cards[cardId]) return false
    const comment = { id: uid('comment'), body: body.trim(), created_at: new Date().toISOString() }
    const cards = updateCardRecord(state.cards, cardId, (card) => ({ ...card, comments: [...card.comments, comment] }))
    set(historyCommit(state, { cards }))
    get().announce('Comment added.')
    return true
  },

  undo: () => {
    const state = get()
    const previous = state.undoStack.at(-1)
    if (!previous) return false
    set({
      ...clone(previous),
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, snapshot(state)],
      selection: [],
      announcement: 'Last board action undone.',
    })
    return true
  },

  redo: () => {
    const state = get()
    const next = state.redoStack.at(-1)
    if (!next) return false
    set({
      ...clone(next),
      undoStack: [...state.undoStack, snapshot(state)],
      redoStack: state.redoStack.slice(0, -1),
      selection: [],
      announcement: 'Board action redone.',
    })
    return true
  },

  importBoard: (payload) => {
    const state = get()
    const order = Object.fromEntries(payload.columns.map((column) => [column.id, [...column.card_ids]]))
    const cards = Object.fromEntries(payload.cards.map(({ position: _position, ...card }) => [card.id, clone(card)]))
    const wipLimits = Object.fromEntries(payload.columns.map((column) => [column.id, column.wip_limit]))
    set(historyCommit(state, {
      board: clone(payload.board), cards, order, prompts: clone(payload.prompts), assignees: clone(payload.assignees), wipLimits,
      selection: [], importError: '',
    }))
    get().notify('success', 'Board imported', `${payload.cards.length} cards restored from board JSON.`)
    get().announce('Board import completed successfully.')
    return true
  },

  runCard: async (cardId, forceRestart = false) => {
    if (activeRuns.has(cardId)) return false
    let card = get().cards[cardId]
    if (!card) return false
    activeRuns.add(cardId)

    if (forceRestart || card.status === 'complete') {
      set((state) => ({ cards: updateCardRecord(state.cards, cardId, (current) => ({
        ...current, status: 'pending', tasks: current.tasks.map((item) => ({ ...item, status: 'pending', attempts: 0, error: undefined })),
      })) }))
    }

    try {
      card = get().cards[cardId]
      let index = card.tasks.findIndex((item) => item.status !== 'complete')
      if (index < 0) index = 0
      while (index < get().cards[cardId].tasks.length) {
        const currentCard = get().cards[cardId]
        const currentTask = currentCard.tasks[index]
        if (currentTask.status === 'complete') { index += 1; continue }
        const attempt = currentTask.attempts + 1
        set((state) => ({
          cards: updateCardRecord(state.cards, cardId, (value) => ({
            ...value,
            status: 'running',
            tasks: value.tasks.map((item, taskIndex) => taskIndex === index ? { ...item, status: 'running', attempts: attempt, error: undefined } : item),
          })),
          announcement: `${currentTask.title} is running, attempt ${attempt}.`,
        }))
        await delay(700)

        const plan = failurePlans[cardId]
        if (plan?.taskId === currentTask.id && attempt <= plan.failAttempts) {
          for (let seconds = 2; seconds >= 1; seconds -= 1) {
            set((state) => ({
              cards: updateCardRecord(state.cards, cardId, (value) => ({ ...value, status: 'retrying', tasks: value.tasks.map((item, taskIndex) => taskIndex === index ? { ...item, status: 'retrying' } : item) })),
              backoffs: { ...state.backoffs, [cardId]: { taskId: currentTask.id, seconds, nextAttempt: attempt + 1, maxAttempts: plan.maxAttempts } },
              announcement: `Waiting ${seconds} seconds before retry ${attempt + 1} of ${plan.maxAttempts}.`,
            }))
            await delay(1000)
          }
          set((state) => {
            const backoffs = { ...state.backoffs }
            delete backoffs[cardId]
            return { backoffs }
          })
          continue
        }

        set((state) => ({
          cards: updateCardRecord(state.cards, cardId, (value) => ({
            ...value,
            status: 'running',
            tasks: value.tasks.map((item, taskIndex) => taskIndex === index ? { ...item, status: 'complete', error: undefined } : item),
          })),
          announcement: `${currentTask.title} completed.`,
        }))
        index += 1
        await delay(260)
      }
      set((state) => ({
        cards: updateCardRecord(state.cards, cardId, (value) => ({ ...value, status: 'complete' })),
        announcement: `${state.cards[cardId]?.title} completed all task items.`,
      }))
      get().notify('success', 'Execution complete', `${get().cards[cardId]?.title} completed successfully.`)
      return true
    } catch (error) {
      set((state) => ({
        cards: updateCardRecord(state.cards, cardId, (value) => ({ ...value, status: 'failed' })),
        announcement: `Execution failed: ${error.message}`,
      }))
      get().notify('error', 'Execution failed', 'Retry resumes from the failed task item.')
      return false
    } finally {
      activeRuns.delete(cardId)
    }
  },
  retryCard: (cardId) => get().runCard(cardId, false),
}))

export const getBoardState = () => useBoardStore.getState()

