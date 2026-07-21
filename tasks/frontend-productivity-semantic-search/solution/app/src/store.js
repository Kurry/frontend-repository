import { create } from 'zustand'
import { seedDocuments, topicFor } from './seed'
import { LibraryPackageSchema } from './schemas'

const clean = (value) => value.toLowerCase().replace(/[^a-z0-9-\s]/g, ' ')
const terms = (value) => clean(value).split(/\s+/).filter((term) => term.length > 1)
const round = (value) => Math.max(0, Math.min(1, Math.round(value * 100) / 100))
const now = () => new Date().toISOString()
const queryKey = (query, filters) => `${query.toLowerCase()}|${filters.map((f) => `${f.kind}:${f.value.toLowerCase()}`).sort().join('|')}`

export function parseQuery(raw, documents) {
  const parsed = []
  const invalid = []
  const tokenPattern = /\b(tag|type|before):([^\s]+)/gi
  let match
  while ((match = tokenPattern.exec(raw))) {
    const kind = match[1].toLowerCase()
    const value = match[2]
    const known = kind === 'tag'
      ? documents.some((doc) => doc.tags.some((tag) => tag.toLowerCase() === value.toLowerCase()))
      : kind === 'type'
        ? ['guide', 'reference', 'prompt', 'checklist', 'paper', 'note'].includes(value.toLowerCase())
        : /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
    if (known) parsed.push({ kind, value: kind === 'type' ? value.toLowerCase() : value })
    else invalid.push({ kind, value })
  }
  return {
    query: raw.replace(tokenPattern, ' ').replace(/\s+/g, ' ').trim(),
    filters: parsed,
    invalid,
  }
}

function filterDocuments(documents, filters) {
  return documents.filter((doc) => filters.every((filter) => {
    if (filter.kind === 'tag') return doc.tags.some((tag) => tag.toLowerCase() === filter.value.toLowerCase())
    if (filter.kind === 'type') return doc.type === filter.value.toLowerCase()
    if (filter.kind === 'before') return new Date(doc.createdAt || 0) < new Date(`${filter.value}T00:00:00Z`)
    return true
  }))
}

function contributionData(query, doc, corpus) {
  const queryTerms = [...new Set(terms(query))]
  if (!queryTerms.length) return [{ term: 'all documents', value: 0.35 }]
  const bodyTerms = terms(`${doc.title} ${doc.title} ${doc.tags.join(' ')} ${doc.body}`)
  const counts = new Map()
  bodyTerms.forEach((term) => counts.set(term, (counts.get(term) || 0) + 1))
  return queryTerms.map((term) => {
    const exact = counts.get(term) || 0
    const related = exact ? 0 : bodyTerms.filter((word) => term.length >= 4 && word.includes(term)).length
    const docsWithTerm = corpus.filter((item) => clean(`${item.title} ${item.tags.join(' ')} ${item.body}`).includes(term)).length
    const idf = Math.log((corpus.length + 1) / (docsWithTerm + 1)) + 1
    const titleBoost = clean(`${doc.title} ${doc.tags.join(' ')}`).includes(term) ? 1.35 : 1
    return { term, value: (exact + related * 0.35) * idf * titleBoost }
  }).filter((item) => item.value > 0)
}

export function rankDocuments({ documents, indexedIds, query, filters, feedback = {}, threshold = 0 }) {
  const indexed = documents.filter((doc) => indexedIds.includes(doc.id))
  const corpus = filterDocuments(indexed, filters)
  const queryTerms = [...new Set(terms(query))]
  let ranked = corpus.map((doc) => {
    const contributions = contributionData(query, doc, indexed)
    const raw = contributions.reduce((sum, item) => sum + item.value, 0)
    const coverage = queryTerms.length ? contributions.length / queryTerms.length : 1
    const semantic = queryTerms.length ? Math.min(0.94, 0.06 + Math.log1p(raw) * 0.14 * coverage + coverage * 0.12) : 0.35
    const mark = feedback[doc.id] || 'none'
    const adjustment = mark === 'up' ? 0.28 : mark === 'down' ? -0.28 : 0
    const score = round(semantic + adjustment)
    const highlight = contributions.sort((a, b) => b.value - a.value)[0]?.term || queryTerms[0] || doc.tags[0]
    const sentences = doc.body.match(/[^.!?]+[.!?]+/g) || [doc.body]
    const excerptSentence = sentences.find((sentence) => clean(sentence).includes(clean(highlight))) || sentences[0]
    const snippet = `${excerptSentence.trim()} ${sentences[Math.min(sentences.indexOf(excerptSentence) + 1, sentences.length - 1)]?.trim() || ''}`.trim()
    const maxContribution = Math.max(...contributions.map((item) => item.value), 1)
    return {
      ...doc, score, baseScore: round(semantic), feedback: mark, adjustment,
      highlights: contributions.map((item) => item.term), highlight,
      contributions: contributions.map((item) => ({ ...item, normalized: item.value / maxContribution })), snippet,
    }
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  const semanticMatches = ranked.filter((item) => item.baseScore >= 0.2)
  let mode = 'semantic'
  if (queryTerms.length && semanticMatches.length === 0) {
    mode = 'keyword'
    ranked = ranked.filter((item) => queryTerms.some((term) => clean(`${item.title} ${item.body} ${item.tags.join(' ')}`).includes(term)))
      .map((item) => ({ ...item, score: round(Math.max(item.score, 0.2)) }))
  }
  return { mode, items: ranked.filter((item) => item.score >= threshold) }
}

const initialDocs = seedDocuments()
const initialIndexed = initialDocs.map((doc) => doc.id)
let indexTimeout = null
let indexInterval = null
let toastTimer = null

const clearIndexTimers = () => {
  if (indexTimeout) clearTimeout(indexTimeout)
  if (indexInterval) clearInterval(indexInterval)
  indexTimeout = null
  indexInterval = null
}

const snapshot = (state) => ({
  documents: state.documents,
  indexedIds: state.indexedIds,
  savedSearches: state.savedSearches,
  feedbackByQuery: state.feedbackByQuery,
})

export const useAppStore = create((set, get) => ({
  documents: initialDocs,
  indexedIds: initialIndexed,
  activeRaw: '', activeQuery: '', filters: [], invalidFilters: [], threshold: 0.2,
  hasSearched: false, history: [], savedSearches: [], feedbackByQuery: {}, disclosures: {},
  grouped: false, collapsedGroups: {}, selectedResult: -1,
  detailId: null, breadcrumbs: [], railView: 'history', railOpen: false,
  selectedHistory: [], selectedDocuments: [], compareLeft: '', compareRight: '',
  paletteOpen: false, paletteQuery: '', paletteIndex: 0,
  exportOpen: false, exportTab: 'report', exportGeneratedAt: now(), importOpen: false,
  saveOpen: false, addOpen: false, toast: null,
  undoStack: [], redoStack: [],
  indexBuiltAt: now(), indexRun: null, timelineFilter: 'all', liveMessage: '',

  getVisible: () => {
    const state = get()
    const feedback = state.feedbackByQuery[queryKey(state.activeQuery, state.filters)] || {}
    return rankDocuments({ documents: state.documents, indexedIds: state.indexedIds, query: state.activeQuery, filters: state.filters, threshold: state.threshold, feedback })
  },
  getStats: () => {
    const state = get()
    const built = state.documents.filter((doc) => state.indexedIds.includes(doc.id))
    return {
      total: state.documents.length,
      stale: state.documents.filter((doc) => !state.indexedIds.includes(doc.id)).length,
      distinctTerms: new Set(built.flatMap((doc) => terms(`${doc.title} ${doc.body} ${doc.tags.join(' ')}`))).size,
    }
  },
  pushUndo: (label) => set((state) => ({ undoStack: [...state.undoStack, { label, data: snapshot(state) }], redoStack: [] })),
  notify: (message, kind = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { message, kind } })
    toastTimer = setTimeout(() => set({ toast: null }), 3200)
  },
  setRaw: (activeRaw) => set({ activeRaw }),
  runQuery: (raw = get().activeRaw, options = {}) => {
    const state = get()
    const parsed = options.parsed || parseQuery(raw, state.documents)
    const threshold = options.threshold ?? state.threshold
    const next = {
      activeRaw: raw, activeQuery: parsed.query, filters: parsed.filters, invalidFilters: parsed.invalid,
      threshold, hasSearched: true, selectedResult: -1,
    }
    const feedback = state.feedbackByQuery[queryKey(parsed.query, parsed.filters)] || {}
    const visible = rankDocuments({ documents: state.documents, indexedIds: state.indexedIds, query: parsed.query, filters: parsed.filters, threshold, feedback })
    next.liveMessage = `${visible.items.length} results`
    if (options.record !== false) {
      next.history = [{ id: `history-${Date.now()}-${Math.random().toString(16).slice(2)}`, raw, query: parsed.query, filters: parsed.filters, threshold, count: visible.items.length, timestamp: now() }, ...state.history]
    }
    set(next)
  },
  rerunCaptured: (item) => {
    const raw = `${item.query} ${item.filters.map((f) => `${f.kind}:${f.value}`).join(' ')}`.trim()
    get().runQuery(raw, { parsed: { query: item.query, filters: item.filters, invalid: [] }, threshold: item.threshold })
  },
  setThreshold: (value) => {
    const count = rankDocuments({
      documents: get().documents,
      indexedIds: get().indexedIds,
      query: get().activeQuery,
      filters: get().filters,
      threshold: Number(value),
      feedback: get().feedbackByQuery[queryKey(get().activeQuery, get().filters)] || {},
    }).items.length
    set({ threshold: Number(value), exportGeneratedAt: now(), liveMessage: `Threshold ${Number(value).toFixed(2)} · ${count} results` })
  },
  removeFilter: (index) => {
    const state = get()
    const filters = state.filters.filter((_, i) => i !== index)
    const raw = `${state.activeQuery} ${filters.map((f) => `${f.kind}:${f.value}`).join(' ')}`.trim()
    get().runQuery(raw, { parsed: { query: state.activeQuery, filters, invalid: [] }, threshold: state.threshold, record: false })
    set({ liveMessage: `${get().getVisible().items.length} results` })
  },
  clearNarrowing: () => {
    const state = get()
    get().runQuery(state.activeQuery, { parsed: { query: state.activeQuery, filters: [], invalid: [] }, threshold: 0, record: false })
  },
  setFeedback: (id, mark) => {
    get().pushUndo(`Feedback ${mark}`)
    const state = get(); const key = queryKey(state.activeQuery, state.filters)
    const apply = () => set({ feedbackByQuery: { ...state.feedbackByQuery, [key]: { ...(state.feedbackByQuery[key] || {}), [id]: mark } }, exportGeneratedAt: now() })
    if (typeof document !== 'undefined' && document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply)
    else apply()
  },
  resetFeedback: () => {
    const state = get(); const key = queryKey(state.activeQuery, state.filters)
    if (!state.feedbackByQuery[key]) return
    get().pushUndo('Reset feedback')
    set({ feedbackByQuery: { ...state.feedbackByQuery, [key]: {} }, exportGeneratedAt: now() })
  },
  toggleDisclosure: (id) => set((state) => ({ disclosures: { ...state.disclosures, [id]: !state.disclosures[id] } })),
  setGrouped: (grouped) => set({ grouped }),
  toggleGroup: (name) => set((state) => ({ collapsedGroups: { ...state.collapsedGroups, [name]: !state.collapsedGroups[name] } })),
  openDetail: (id, push = true) => set((state) => ({ detailId: id, breadcrumbs: push && state.detailId && state.detailId !== id ? [...state.breadcrumbs, state.detailId] : push && !state.detailId ? [] : state.breadcrumbs, railOpen: false })),
  closeDetail: () => set({ detailId: null, breadcrumbs: [] }),
  goBreadcrumb: (index) => set((state) => ({ detailId: state.breadcrumbs[index], breadcrumbs: state.breadcrumbs.slice(0, index) })),
  setRailView: (railView) => set({ railView, railOpen: true }),
  saveSearch: (payload) => {
    get().pushUndo('Save search')
    set((state) => ({ savedSearches: [...state.savedSearches, payload], saveOpen: false, exportGeneratedAt: now() }))
    get().notify(`Saved “${payload.name}”`)
  },
  deleteSaved: (name) => {
    get().pushUndo('Delete saved search')
    set((state) => ({ savedSearches: state.savedSearches.filter((item) => item.name !== name), exportGeneratedAt: now() }))
    get().notify('Saved search deleted')
  },
  toggleHistory: (id) => set((state) => ({ selectedHistory: state.selectedHistory.includes(id) ? state.selectedHistory.filter((x) => x !== id) : [...state.selectedHistory, id] })),
  deleteSelectedHistory: () => {
    const count = get().selectedHistory.length
    set((state) => ({ history: state.history.filter((item) => !state.selectedHistory.includes(item.id)), selectedHistory: [] }))
    get().notify(`Deleted ${count} histor${count === 1 ? 'y entry' : 'y entries'}`)
  },
  toggleDocument: (id) => set((state) => ({ selectedDocuments: state.selectedDocuments.includes(id) ? state.selectedDocuments.filter((x) => x !== id) : [...state.selectedDocuments, id] })),
  addDocument: (payload) => {
    get().pushUndo('Add document')
    const id = payload.id || `doc-${Date.now()}`
    const doc = { ...payload, id, topic: payload.tags[0] || 'Other', createdAt: now() }
    set((state) => ({ documents: [...state.documents, doc], addOpen: false, exportGeneratedAt: now() }))
    get().notify(`Added “${doc.title}” — index required`)
  },
  updateDocument: (id, payload) => {
    const current = get().documents.find((doc) => doc.id === id)
    if (!current) return false
    get().pushUndo('Update document')
    set((state) => ({
      documents: state.documents.map((doc) => doc.id === id ? { ...doc, ...payload, id, topic: payload.tags?.[0] || doc.topic } : doc),
      indexedIds: state.indexedIds.filter((indexedId) => indexedId !== id),
      exportGeneratedAt: now(),
    }))
    get().notify(`Updated “${payload.title || current.title}” — index required`)
    return true
  },
  deleteDocuments: (ids) => {
    get().pushUndo(ids.length > 1 ? `Delete ${ids.length} documents` : 'Delete document')
    set((state) => ({ documents: state.documents.filter((doc) => !ids.includes(doc.id)), indexedIds: state.indexedIds.filter((id) => !ids.includes(id)), selectedDocuments: [], detailId: ids.includes(state.detailId) ? null : state.detailId, exportGeneratedAt: now() }))
    get().notify(`${ids.length} document${ids.length === 1 ? '' : 's'} deleted`)
  },
  markStale: (ids) => set((state) => ({ indexedIds: state.indexedIds.filter((id) => !ids.includes(id)), selectedDocuments: [] })),
  undo: () => {
    const state = get(); const entry = state.undoStack.at(-1); if (!entry) return
    set({ ...entry.data, undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, { label: entry.label, data: snapshot(state) }], exportGeneratedAt: now() })
    get().notify(`Undid: ${entry.label}`)
  },
  redo: () => {
    const state = get(); const entry = state.redoStack.at(-1); if (!entry) return
    set({ ...entry.data, redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, { label: entry.label, data: snapshot(state) }], exportGeneratedAt: now() })
    get().notify(`Redid: ${entry.label}`)
  },
  openExport: (tab = 'report') => set({ exportOpen: true, exportTab: tab, exportGeneratedAt: now() }),
  getReport: () => {
    const state = get(); const visible = state.getVisible()
    return {
      schemaVersion: 1, generatedAt: state.exportGeneratedAt,
      request: { query: state.activeQuery, filters: state.filters, threshold: state.threshold },
      results: visible.items.map((item) => ({ id: item.id, title: item.title, type: item.type, score: Number(item.score.toFixed(2)), snippet: item.snippet, highlights: item.highlights, feedback: item.feedback })),
    }
  },
  getPackage: () => {
    const state = get()
    return {
      schemaVersion: 1, library: 'Semantic Search Library',
      documents: state.documents.map(({ id, title, body, type, tags }) => ({ id, title, body, type, tags })),
      savedSearches: state.savedSearches,
      generatedAt: state.exportGeneratedAt,
    }
  },
  importPackage: (input) => {
    let parsed
    try { parsed = JSON.parse(input) } catch { return { ok: false, error: 'package is invalid JSON' } }
    const checked = LibraryPackageSchema.safeParse(parsed)
    if (!checked.success) {
      const issue = checked.error.issues[0]
      return { ok: false, error: `${issue.path.join('.') || 'package'}: ${issue.message}` }
    }
    get().pushUndo('Import library package')
    const documents = checked.data.documents.map((doc) => ({ ...doc, topic: doc.tags[0] || 'Other', createdAt: now() }))
    set({ documents, indexedIds: [], savedSearches: checked.data.savedSearches, importOpen: false, selectedDocuments: [], hasSearched: false, activeRaw: '', activeQuery: '', filters: [], history: [], exportGeneratedAt: now() })
    get().notify(`Imported ${documents.length} documents — index required`)
    return { ok: true }
  },
  setPalette: (open) => set({ paletteOpen: open, paletteQuery: '', paletteIndex: 0 }),
  startIndex: () => {
    if (get().indexRun?.status === 'running' || get().indexRun?.status === 'paused') return
    const documents = get().documents
    const startedAt = Date.now()
    const steps = documents.map((doc) => ({ id: doc.id, title: doc.title, status: 'pending', attempts: 0, startedAt: null, completedAt: null, error: null }))
    set({ indexRun: { status: 'running', steps, current: 0, startedAt, elapsed: 0, events: [{ id: `event-${Date.now()}`, time: now(), status: 'running', text: 'Index run started' }] }, liveMessage: 'Indexing started' })
    get().advanceIndex()
  },
  advanceIndex: () => {
    clearIndexTimers()
    const state = get(); const run = state.indexRun
    if (!run || run.status !== 'running') return
    const nextIndex = run.steps.findIndex((step) => step.status !== 'complete')
    if (nextIndex < 0) {
      set((s) => ({
        indexedIds: s.documents.map((doc) => doc.id),
        indexBuiltAt: now(),
        indexRun: {
          ...s.indexRun,
          status: 'complete',
          current: s.indexRun.steps.length,
          elapsed: Date.now() - s.indexRun.startedAt,
          events: [...s.indexRun.events, { id: `event-${Date.now()}`, time: now(), status: 'complete', text: 'Index run completed' }],
        },
        liveMessage: `Indexed ${s.documents.length} documents`,
      }))
      get().notify(`Indexed ${get().documents.length} documents`)
      return
    }
    const step = run.steps[nextIndex]
    if (step.status === 'failed') return
    const attempts = step.attempts + 1
    const runningSteps = run.steps.map((item, i) => i === nextIndex ? { ...item, status: 'running', attempts, startedAt: item.startedAt || now() } : item)
    set({ indexRun: { ...run, current: nextIndex, steps: runningSteps, elapsed: Date.now() - run.startedAt, events: [...run.events, { id: `event-${Date.now()}-${nextIndex}`, time: now(), status: 'running', text: `${step.title} · attempt ${attempts}` }] } })
    indexTimeout = setTimeout(() => {
      const latest = get(); if (latest.indexRun?.status !== 'running') return
      const numericId = Number(step.id.replace(/\D/g, '').slice(-3) || 0)
      const autoRetries = numericId > 0 && numericId % 94 === 0 ? 2 : numericId > 0 && numericId % 47 === 0 ? 1 : 0
      const needsManualRetry = numericId > 0 && numericId % 94 === 0 && attempts === 3 && !step.manualRetryUsed
      if (autoRetries > 0 && attempts <= autoRetries) {
        const wait = 2
        set((s) => ({
          indexRun: {
            ...s.indexRun,
            steps: s.indexRun.steps.map((item, i) => i === nextIndex ? { ...item, status: 'retrying', retryIn: wait, error: 'Transient tokenizer timeout' } : item),
            events: [...s.indexRun.events, { id: `event-${Date.now()}`, time: now(), status: 'retrying', text: `${step.title} · waiting before retry ${attempts + 1} of 3` }],
          },
          liveMessage: `${step.title} retrying in ${wait}s`,
        }))
        let remaining = wait
        indexInterval = setInterval(() => {
          remaining -= 1
          if (remaining <= 0) {
            clearIndexTimers()
            get().advanceIndex()
          } else {
            set((s) => ({
              indexRun: { ...s.indexRun, steps: s.indexRun.steps.map((item, i) => i === nextIndex ? { ...item, retryIn: remaining } : item) },
              liveMessage: `${step.title} retrying in ${remaining}s`,
            }))
          }
        }, 1000)
        return
      }
      if (needsManualRetry) {
        set((s) => ({
          indexRun: {
            ...s.indexRun,
            status: 'failed',
            steps: s.indexRun.steps.map((item, i) => i === nextIndex ? { ...item, status: 'failed', error: 'Tokenizer timeout after 3 attempts' } : item),
            events: [...s.indexRun.events, { id: `event-${Date.now()}`, time: now(), status: 'failed', text: `${step.title} failed after 3 attempts` }],
          },
          liveMessage: `${step.title} failed — use Retry to continue`,
        }))
        return
      }
      set((s) => ({
        indexedIds: [...new Set([...s.indexedIds, step.id])],
        indexRun: {
          ...s.indexRun,
          steps: s.indexRun.steps.map((item, i) => i === nextIndex ? { ...item, status: 'complete', completedAt: now(), error: null, retryIn: null } : item),
          events: [...s.indexRun.events, { id: `event-${Date.now()}`, time: now(), status: 'complete', text: `${step.title} indexed` }],
        },
      }))
      get().advanceIndex()
    }, 28 + Math.floor(Math.random() * 34))
  },
  pauseIndex: () => {
    if (get().indexRun?.status === 'running') {
      clearIndexTimers()
      set((s) => ({ indexRun: { ...s.indexRun, status: 'paused' } }))
    }
  },
  resumeIndex: () => {
    if (['paused', 'failed'].includes(get().indexRun?.status)) {
      set((s) => ({
        indexRun: {
          ...s.indexRun,
          status: 'running',
          steps: s.indexRun.steps.map((step, i) => step.status === 'failed'
            ? { ...step, status: 'pending', error: null, manualRetryUsed: true, retryIn: null }
            : step),
        },
      }))
      get().advanceIndex()
    }
  },
  retryStep: () => get().resumeIndex(),
}))

export const selectTopicGroups = (items) => items.reduce((groups, item) => {
  const topic = topicFor(item)
  if (!groups[topic]) groups[topic] = []
  groups[topic].push(item)
  return groups
}, {})

export function stringifyArtifact(value) {
  return JSON.stringify(value, null, 2).replace(/("score":\s*)(\d+(?:\.\d+)?)/g, (_, prefix, score) => `${prefix}${Number(score).toFixed(2)}`)
}
