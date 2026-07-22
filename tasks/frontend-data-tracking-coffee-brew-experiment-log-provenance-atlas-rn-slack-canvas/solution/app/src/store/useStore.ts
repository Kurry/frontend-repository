import { create } from 'zustand'

export type ExperimentStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived'

export interface Record {
  id: string
  title: string
  beanOrigin: string
  roastDate: string
  status: ExperimentStatus
  provenanceAtlasState?: {
    quarantined: boolean
    reason?: string
    tracedToSource: boolean
  }
}

export interface ArtifactSchema {
  schemaVersion: 'v1'
  exportedAt: string
  records: Record[]
  derived: {
    total: number
    quarantinedCount: number
    readyCount: number
  }
  history: Array<{ action: string; timestamp: string; payload: any }>
}

interface StoreState {
  records: Record[]
  history: Array<{ action: string; timestamp: string; payload: any }>
  pastStates: StoreState[]
  addRecord: (record: Omit<Record, 'id' | 'status'>) => void
  updateRecord: (id: string, updates: Partial<Record>) => void
  traceAndQuarantine: (id: string, reason: string) => void
  undo: () => void
  importArtifact: (artifact: string) => void
  exportArtifact: () => string
  setInitialRecords: (records: Record[]) => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const getDerived = (records: Record[]) => ({
  total: records.length,
  quarantinedCount: records.filter(r => r.provenanceAtlasState?.quarantined).length,
  readyCount: records.filter(r => r.status === 'ready').length
})

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  history: [],
  pastStates: [],

  setInitialRecords: (records) => set({ records, history: [], pastStates: [] }),

  addRecord: (recordData) => {
    const currentState = get()
    const newRecord: Record = { ...recordData, id: generateId(), status: 'draft' }
    const newRecords = [...currentState.records, newRecord]

    set({
      pastStates: [...currentState.pastStates, { ...currentState, pastStates: [] }],
      records: newRecords,
      history: [...currentState.history, { action: 'create', timestamp: new Date().toISOString(), payload: newRecord }]
    })
  },

  updateRecord: (id, updates) => {
    const currentState = get()
    const recordToUpdate = currentState.records.find(r => r.id === id)
    if (!recordToUpdate) return

    const updatedRecord = { ...recordToUpdate, ...updates }
    const newRecords = currentState.records.map(r => r.id === id ? updatedRecord : r)

    set({
      pastStates: [...currentState.pastStates, { ...currentState, pastStates: [] }],
      records: newRecords,
      history: [...currentState.history, { action: 'update', timestamp: new Date().toISOString(), payload: { id, updates } }]
    })
  },

  traceAndQuarantine: (id, reason) => {
    const currentState = get()
    const recordToUpdate = currentState.records.find(r => r.id === id)
    if (!recordToUpdate) return

    const updatedRecord: Record = {
      ...recordToUpdate,
      status: 'changed',
      provenanceAtlasState: {
        quarantined: true,
        reason,
        tracedToSource: true
      }
    }
    const newRecords = currentState.records.map(r => r.id === id ? updatedRecord : r)

    set({
      pastStates: [...currentState.pastStates, { ...currentState, pastStates: [] }],
      records: newRecords,
      history: [...currentState.history, { action: 'traceAndQuarantine', timestamp: new Date().toISOString(), payload: { id, reason } }]
    })
  },

  undo: () => {
    const currentState = get()
    if (currentState.pastStates.length === 0) return

    const previousState = currentState.pastStates[currentState.pastStates.length - 1]

    set({
      records: previousState.records,
      history: previousState.history,
      pastStates: currentState.pastStates.slice(0, -1)
    })
  },

  importArtifact: (artifactStr) => {
    try {
      const artifact = JSON.parse(artifactStr) as ArtifactSchema
      if (artifact.schemaVersion !== 'v1') return

      set({
        records: artifact.records || [],
        history: artifact.history || [],
        pastStates: []
      })
    } catch (e) {
      // no-op on invalid
    }
  },

  exportArtifact: () => {
    const state = get()
    const artifact: ArtifactSchema = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: getDerived(state.records),
      history: state.history
    }
    return JSON.stringify(artifact, null, 2)
  }
}))
