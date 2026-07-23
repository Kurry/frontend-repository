import { create } from 'zustand'
import { clone, defaultDrafts, SEEDED_LIBRARY, techniqueIds } from './domain'

const neutralStatuses = Object.fromEntries(techniqueIds.map((id) => [id, 'neutral']))

export const useStudioStore = create((set, get) => ({
  activeTechnique: 'zero-shot',
  activeView: 'forms',
  drafts: clone(defaultDrafts),
  prompts: {},
  statuses: neutralStatuses,
  library: clone(SEEDED_LIBRARY),
  hydrationVersion: 0,
  saveModalOpen: false,
  assetPickerOpen: false,
  exportPanelOpen: false,
  importModalOpen: false,
  toast: null,
  sortOrder: 'manual',
  libraryQuery: '',
  libraryTechniqueFilter: 'all',
  theme: 'light',
  locale: 'en',
  density: 'comfortable',
  // Non-blocking coach starts open but never focus-traps the studio.
  hasSeenOnboarding: false,
  onboardingStep: 0,
  voiceListening: false,

  toggleSortOrder: () => set((state) => ({
    sortOrder: state.sortOrder === 'manual' ? 'asc' : state.sortOrder === 'asc' ? 'desc' : 'manual',
  })),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setLibraryQuery: (libraryQuery) => set({ libraryQuery }),
  setLibraryTechniqueFilter: (libraryTechniqueFilter) => set({ libraryTechniqueFilter }),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setDensity: (density) => set({ density }),
  setVoiceListening: (voiceListening) => set({ voiceListening }),
  selectTechnique: (technique) => {
    // Flush any in-flight draft writes before switching so rapid sidebar clicks retain text.
    set({ activeTechnique: technique, activeView: 'forms', assetPickerOpen: false })
  },
  setView: (activeView) => set({ activeView, assetPickerOpen: false }),
  setChrome: (patch) => set(patch),
  showToast: (kind, title, subtitle = '') => set({ toast: { id: Date.now(), kind, title, subtitle } }),
  clearToast: () => set({ toast: null }),

  updateDraft: (technique, fields, attachments = []) => {
    const current = get().drafts[technique]
    const nextDraft = { fields: clone(fields), attachments: clone(attachments) }
    if (JSON.stringify(current) === JSON.stringify(nextDraft)) return
    const baseline = defaultDrafts[technique]
    const hasInput = nextDraft.attachments.length > 0 || Object.entries(baseline.fields)
      .some(([name, value]) => JSON.stringify(nextDraft.fields[name]) !== JSON.stringify(value))
    set((state) => {
      return {
        drafts: { ...state.drafts, [technique]: nextDraft },
        prompts: hasInput ? state.prompts : { ...state.prompts, [technique]: undefined },
        statuses: { ...state.statuses, [technique]: hasInput ? 'in-progress' : 'neutral' },
      }
    })
  },

  generatePrompt: (technique, fields, attachments, promptText) => set((state) => ({
    drafts: { ...state.drafts, [technique]: { fields: clone(fields), attachments: clone(attachments || []) } },
    prompts: { ...state.prompts, [technique]: promptText },
    statuses: { ...state.statuses, [technique]: 'generated' },
  })),

  resetTechnique: (technique) => set((state) => ({
    drafts: { ...state.drafts, [technique]: clone(defaultDrafts[technique]) },
    prompts: { ...state.prompts, [technique]: undefined },
    statuses: { ...state.statuses, [technique]: 'neutral' },
    hydrationVersion: state.hydrationVersion + 1,
    assetPickerOpen: false,
  })),

  saveCurrent: (title) => {
    const state = get()
    if (!state.saveModalOpen) return null
    const technique = state.activeTechnique
    const draft = state.drafts[technique]
    const promptText = state.prompts[technique]
    if (!promptText) return null
    const record = {
      title: title.trim(),
      technique,
      fields: clone(draft.fields),
      promptText,
      ...(draft.attachments.length ? { attachments: clone(draft.attachments) } : {}),
    }
    set((current) => ({
      library: [...current.library, record],
      statuses: { ...current.statuses, [technique]: 'saved' },
      saveModalOpen: false,
    }))
    return record
  },

  openLibraryEntry: (index) => {
    const record = get().library[index]
    if (!record) return
    set((state) => ({
      activeTechnique: record.technique,
      activeView: 'forms',
      drafts: {
        ...state.drafts,
        [record.technique]: { fields: clone(record.fields), attachments: clone(record.attachments || []) },
      },
      prompts: { ...state.prompts, [record.technique]: record.promptText },
      statuses: { ...state.statuses, [record.technique]: 'saved' },
      hydrationVersion: state.hydrationVersion + 1,
      assetPickerOpen: false,
    }))
  },

  deleteLibraryEntry: (index) => set((state) => {
    if (!state.library[index]) return state
    const removed = state.library[index]
    const library = state.library.filter((_, itemIndex) => itemIndex !== index)
    const stillSaved = library.some((record) => record.technique === removed.technique)
    const nextStatus = stillSaved ? state.statuses[removed.technique] : (state.prompts[removed.technique] ? 'generated' : 'neutral')
    return {
      library,
      statuses: { ...state.statuses, [removed.technique]: nextStatus },
    }
  }),

  updateLibraryEntry: (index, patch) => set((state) => {
    if (!state.library[index]) return state
    const library = state.library.map((record, itemIndex) => (
      itemIndex === index ? { ...record, ...patch, fields: patch.fields ? clone(patch.fields) : record.fields } : record
    ))
    return { library }
  }),

  reorderLibrary: (fromIndex, toIndex) => set((state) => {
    if (
      !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)
      || fromIndex < 0 || toIndex < 0
      || fromIndex >= state.library.length || toIndex >= state.library.length
    ) return state
    const library = [...state.library]
    const [item] = library.splice(fromIndex, 1)
    library.splice(toIndex, 0, item)
    return { library, sortOrder: 'manual' }
  }),

  replaceLibrary: (records) => set({ library: clone(records) }),
}))

export const studioActions = () => useStudioStore.getState()
