import { create } from 'zustand'
import { seedRecords } from './seed.js'

export const generateId = () => Math.random().toString(36).substring(2, 9)

const initialState = {
  records: seedRecords,
  derived: {
    summary: '105 total substitutions. 1 quarantined.',
  },
  history: [],
  selectedRecordId: null,
  filterStatus: 'all' // all, ready, draft, changed, empty, archived
}

export const updateDerived = (records) => {
  const quarantined = records.filter(r => r.quarantine).length
  return {
    summary: `${records.length} total substitution${records.length === 1 ? '' : 's'}. ${quarantined} quarantined.`
  }
}

export const useStore = create((set, get) => ({
  ...initialState,

  setFilterStatus: (status) => set({ filterStatus: status }),

  selectRecord: (id) => set({ selectedRecordId: id }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, { ...record, id: generateId(), quarantine: false }]
    const newHistory = [...state.history, { type: 'ADD', before: null, after: newRecords }]
    return {
      records: newRecords,
      history: newHistory,
      derived: updateDerived(newRecords)
    }
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r)
    const newHistory = [...state.history, { type: 'UPDATE', before: state.records, after: newRecords }]
    return {
      records: newRecords,
      history: newHistory,
      derived: updateDerived(newRecords)
    }
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id)
    const newHistory = [...state.history, { type: 'DELETE', before: state.records, after: newRecords }]
    return {
      records: newRecords,
      history: newHistory,
      derived: updateDerived(newRecords),
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId
    }
  }),

  archiveRecord: (id) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' } : r)
    const newHistory = [...state.history, { type: 'ARCHIVE', before: state.records, after: newRecords }]
    return {
      records: newRecords,
      history: newHistory,
      derived: updateDerived(newRecords)
    }
  }),

  traceAndQuarantine: (id) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, quarantine: true, status: 'changed' } : r)
    const newHistory = [...state.history, { type: 'QUARANTINE', before: state.records, after: newRecords }]
    return {
      records: newRecords,
      history: newHistory,
      derived: updateDerived(newRecords)
    }
  }),

  undoLastMutation: () => set((state) => {
    if (state.history.length === 0) return state;
    const lastAction = state.history[state.history.length - 1];
    if (lastAction.before === null) {
      const newRecords = lastAction.after.slice(0, -1)
      return {
        records: newRecords,
        history: state.history.slice(0, -1),
        derived: updateDerived(newRecords)
      }
    }
    return {
      records: lastAction.before,
      history: state.history.slice(0, -1),
      derived: updateDerived(lastAction.before)
    }
  }),

  exportSession: () => {
    const state = get()
    return JSON.stringify({
      schemaVersion: 'recipe-substitution-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    }, null, 2)
  },

  importSession: (sessionJson) => {
    try {
      const data = JSON.parse(sessionJson)
      if (data.schemaVersion !== 'recipe-substitution-v1') {
        throw new Error('Invalid schemaVersion')
      }
      if (!Array.isArray(data.records) || !data.derived || !Array.isArray(data.history)) {
        throw new Error('Malformed schema')
      }
      const hasDuplicateIds = new Set(data.records.map(r => r.id)).size !== data.records.length
      if (hasDuplicateIds) {
          throw new Error('Duplicate IDs found')
      }
      set({
        records: data.records,
        derived: data.derived,
        history: data.history,
        selectedRecordId: null,
        filterStatus: 'all'
      })
      return true
    } catch (e) {
      console.error('Import failed', e)
      return false
    }
  },

  clearSession: () => set({
      records: [],
      derived: { summary: '0 total substitutions. 0 quarantined.' },
      history: [],
      selectedRecordId: null
  })
}))
