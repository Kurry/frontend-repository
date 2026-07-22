import { create } from 'zustand'
import { z } from 'zod'

// Domain statuses: empty, draft, ready, changed, archived
export const StatusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived'])

export const RecordSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  status: StatusSchema,
  forecastValue: z.number().min(0).max(100),
  description: z.string()
})

// Generate 100+ seeded records for performance testing
const seedRecords = Array.from({ length: 110 }).map((_, i) => ({
  id: `node-${i}`,
  title: `Story Node ${i + 1}`,
  status: ['empty', 'draft', 'ready', 'changed', 'archived'][i % 5],
  forecastValue: Math.floor(Math.random() * 100),
  description: `Description for story node ${i + 1}`
}))

export const useStore = create((set, get) => ({
  records: seedRecords,
  history: [],
  selectedId: null,

  setSelectedId: (id) => set({ selectedId: id }),

  addRecord: (record) => set((state) => {
    const newRecords = [...state.records, record]
    return {
      records: newRecords,
      history: [...state.history, { type: 'ADD', record, previousState: state.records }]
    }
  }),

  updateRecord: (id, updates) => set((state) => {
    const previousRecords = [...state.records]
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    return {
      records: newRecords,
      history: [...state.history, { type: 'UPDATE', id, updates, previousState: previousRecords }]
    }
  }),

  deleteRecord: (id) => set((state) => {
    const previousRecords = [...state.records]
    const newRecords = state.records.filter(r => r.id !== id)
    return {
      records: newRecords,
      selectedId: state.selectedId === id ? null : state.selectedId,
      history: [...state.history, { type: 'DELETE', id, previousState: previousRecords }]
    }
  }),

  undoLastMutation: () => set((state) => {
    if (state.history.length === 0) return state

    const lastAction = state.history[state.history.length - 1]
    return {
      records: lastAction.previousState,
      history: state.history.slice(0, -1),
      // If we undo a delete of the currently selected, or an add, selection might need updating
      // We will leave selection as is unless it's no longer in records
      selectedId: lastAction.previousState.find(r => r.id === state.selectedId) ? state.selectedId : null
    }
  }),

  // Forecast Ribbon Specific: Mutate a record on the ribbon and compare
  adjustForecast: (id, newForecastValue) => set((state) => {
    const previousRecords = [...state.records]
    const record = state.records.find(r => r.id === id)
    if (!record) return state

    const newRecords = state.records.map(r =>
      r.id === id ? { ...r, forecastValue: newForecastValue, status: 'changed' } : r
    )

    return {
      records: newRecords,
      history: [...state.history, { type: 'FORECAST_ADJUST', id, previousState: previousRecords }]
    }
  }),

  // Overwrite state from import
  importState: (records, history) => set({ records, history, selectedId: null })
}))

// Derived summary for linked views
export const getDerivedSummary = (records) => {
  return records.reduce((acc, record) => {
    acc.total++
    acc[record.status] = (acc[record.status] || 0) + 1
    acc.averageForecast = acc.total === 0 ? 0 :
      ((acc.averageForecast * (acc.total - 1) + record.forecastValue) / acc.total)
    return acc
  }, { total: 0, averageForecast: 0 })
}
