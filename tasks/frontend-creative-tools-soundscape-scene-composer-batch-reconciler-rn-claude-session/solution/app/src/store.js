import { create } from 'zustand'

export const useStore = create((set, get) => ({
  records: [
    { id: '1', name: 'Ambient Pad', status: 'ready', volume: 80, pan: 0, length: 120, selected: false },
    { id: '2', name: 'Rain Loop', status: 'ready', volume: 60, pan: -20, length: 60, selected: false },
    { id: '3', name: 'Thunder', status: 'draft', volume: 90, pan: 20, length: 15, selected: false },
    { id: '4', name: 'Wind Howl', status: 'changed', volume: 40, pan: 0, length: 180, selected: false },
  ],
  derived: {
    totalVolume: 0,
    averagePan: 0,
    itemCount: 0,
  },
  history: [],
  editingId: null,
  batchError: null,

  saveState: () => {
    const { records, derived } = get()
    set(state => ({
      history: [...state.history, { records: JSON.parse(JSON.stringify(records)), derived: JSON.parse(JSON.stringify(derived)) }]
    }))
  },

  undo: () => {
    const { history } = get()
    if (history.length > 0) {
      const lastState = history[history.length - 1]
      set({
        records: lastState.records,
        derived: lastState.derived,
        history: history.slice(0, -1),
        batchError: null
      })
    }
  },

  addRecord: () => {
    get().saveState()
    const newRecord = {
      id: Date.now().toString(),
      name: 'New Layer',
      status: 'empty',
      volume: 50,
      pan: 0,
      length: 60,
      selected: false
    }
    set(state => ({ records: [...state.records, newRecord], editingId: newRecord.id }))
  },

  updateRecord: (id, updates) => {
    get().saveState()
    set(state => ({
      records: state.records.map(r => r.id === id ? { ...r, ...updates, status: 'changed' } : r)
    }))
  },

  deleteRecord: (id) => {
    get().saveState()
    set(state => ({
      records: state.records.filter(r => r.id !== id)
    }))
  },

  toggleSelection: (id) => {
    set(state => ({
      records: state.records.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    }))
  },

  setEditingId: (id) => {
    set({ editingId: id })
  },

  reconcileBatch: () => {
    const { records } = get()
    const selected = records.filter(r => r.selected)

    if (selected.length === 0) {
      set({ batchError: 'No records selected for batch' })
      return
    }

    const invalid = selected.find(r => r.status === 'empty')
    if (invalid) {
      set({ batchError: 'Cannot reconcile empty records' })
      return
    }

    get().saveState()

    let sumVol = 0;
    let sumPan = 0;
    selected.forEach(r => {
      sumVol += Number(r.volume)
      sumPan += Number(r.pan)
    })

    set(state => ({
      batchError: null,
      derived: {
        totalVolume: sumVol,
        averagePan: sumPan / selected.length,
        itemCount: selected.length
      },
      records: state.records.map(r => r.selected ? { ...r, status: 'ready', selected: false } : r)
    }))
  },

  exportData: () => {
    const { records, derived, history } = get()
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'soundscape-scene-v1-batch-reconciler.json'
    a.click()
    URL.revokeObjectURL(url)
  },

  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
        throw new Error('Invalid schema')
      }
      // Simple validation
      const validRecords = data.records.every(r =>
        r.id && r.name && r.status && typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 100
      )
      if (!validRecords) throw new Error('Invalid record bounds')

      set({
        records: data.records,
        derived: data.derived || { totalVolume: 0, averagePan: 0, itemCount: 0 },
        history: data.history || [],
        batchError: null,
        editingId: null
      })
    } catch (e) {
      console.error("Import failed:", e)
      // no-op on invalid import
    }
  },

  clearSession: () => {
    get().saveState()
    set({
      records: [],
      derived: { totalVolume: 0, averagePan: 0, itemCount: 0 },
      history: [],
      editingId: null,
      batchError: null
    })
  }
}))
