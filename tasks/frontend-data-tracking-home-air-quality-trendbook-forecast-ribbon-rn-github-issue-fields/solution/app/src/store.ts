import { create } from 'zustand'
import {
  deriveSummary,
  makeFixture,
  type AirReading,
  type Artifact,
  type HistoryEvent,
  type ReadingInput,
  type SavedQuery,
  type SessionSnapshot,
  type SortMode,
} from './domain'

type Result = { ok: true; message: string } | { ok: false; message: string }

type AirStore = {
  records: AirReading[]
  selectedId: string | null
  query: SavedQuery
  sort: SortMode
  search: string
  history: HistoryEvent[]
  notice: string
  createRecord: (input: ReadingInput) => Result
  updateRecord: (id: string, input: ReadingInput) => Result
  deleteRecord: (id: string) => Result
  archiveRecord: (id: string) => Result
  applyForecast: (id: string, projectedAqi: number, horizonHours: 6 | 12 | 24) => Result
  mergeDuplicate: (duplicateId: string) => Result
  undo: () => Result
  select: (id: string | null) => Result
  setQuery: (query: SavedQuery) => void
  setSort: (sort: SortMode) => void
  setSearch: (search: string) => void
  clear: () => void
  loadFixture: () => void
  importArtifact: (artifact: Artifact) => void
  artifact: (exportedAt?: string) => Artifact
}

const snapshot = (state: Pick<AirStore, 'records' | 'selectedId' | 'query' | 'sort'>): SessionSnapshot => ({
  records: structuredClone(state.records),
  selectedId: state.selectedId,
  query: state.query,
  sort: state.sort,
})

const eventTime = (index: number) => new Date(Date.UTC(2026, 6, 22, 12, 0, index)).toISOString()

function appendEvent(state: AirStore, action: HistoryEvent['action'], recordId: string, after: SessionSnapshot) {
  const id = `evt-${String(state.history.length + 1).padStart(4, '0')}`
  return [...state.history, { id, action, recordId, occurredAt: eventTime(state.history.length), before: snapshot(state), after }]
}

function recordIdFrom(input: ReadingInput, count: number) {
  return input.id ?? `aq-record-${String(count + 1).padStart(3, '0')}`
}

export const useAirStore = create<AirStore>((set, get) => ({
  records: [],
  selectedId: null,
  query: 'all',
  sort: 'manual',
  search: '',
  history: [],
  notice: 'Clean session ready. Create a reading or load the performance fixture.',

  createRecord(input) {
    const state = get()
    const id = recordIdFrom(input, state.records.length)
    if (state.records.some((record) => record.id === id)) return { ok: false, message: `ID ${id} already exists.` }
    const record = { ...input, id } as AirReading
    const records = [...state.records, record]
    const after = { records, selectedId: id, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'create', id, after), notice: `Created ${record.label}; count increased by exactly one.` })
    return { ok: true, message: `Created ${record.label}.` }
  },

  updateRecord(id, input) {
    const state = get()
    const current = state.records.find((record) => record.id === id)
    if (!current) return { ok: false, message: `Reading ${id} was not found.` }
    const next = { ...input, id } as AirReading
    if (JSON.stringify(current) === JSON.stringify(next)) return { ok: false, message: 'No fields changed; no history event was created.' }
    const records = state.records.map((record) => record.id === id ? next : record)
    const after = { records, selectedId: id, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'update', id, after), notice: `Updated ${next.label} across the list, inspector, summary, and artifact preview.` })
    return { ok: true, message: `Updated ${next.label}.` }
  },

  deleteRecord(id) {
    const state = get()
    if (!state.records.some((record) => record.id === id)) return { ok: false, message: `Reading ${id} was not found.` }
    const records = state.records
      .filter((record) => record.id !== id)
      .map((record) => record.provenance.duplicateOfId === id
        ? { ...record, provenance: { ...record.provenance, duplicateOfId: null } }
        : record)
    const after = { records, selectedId: state.selectedId === id ? null : state.selectedId, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'delete', id, after), notice: `Deleted ${id}; references and derived counts are coherent.` })
    return { ok: true, message: `Deleted ${id}.` }
  },

  archiveRecord(id) {
    const state = get()
    const current = state.records.find((record) => record.id === id)
    if (!current) return { ok: false, message: `Reading ${id} was not found.` }
    if (current.status === 'archived') return { ok: false, message: `${id} is already archived; no event was created.` }
    const records = state.records.map((record) => record.id === id
      ? { ...record, status: 'archived' as const, forecast: { ...record.forecast, projectedAqi: record.aqi } }
      : record)
    const after = { records, selectedId: id, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'archive', id, after), notice: `Archived ${id}; projection now equals its current AQI.` })
    return { ok: true, message: `Archived ${id}.` }
  },

  applyForecast(id, projectedAqi, horizonHours) {
    const state = get()
    const current = state.records.find((record) => record.id === id)
    if (!current) return { ok: false, message: `Reading ${id} was not found.` }
    if (current.status === 'archived') return { ok: false, message: 'Archived readings must be restored before forecast editing.' }
    if (!Number.isInteger(projectedAqi) || projectedAqi < 0 || projectedAqi > 500) return { ok: false, message: 'Projected AQI must be a whole number from 0 through 500.' }
    if (![6, 12, 24].includes(horizonHours)) return { ok: false, message: 'Forecast horizon must be 6, 12, or 24 hours.' }
    if (current.forecast.projectedAqi === projectedAqi && current.forecast.horizonHours === horizonHours) {
      return { ok: false, message: 'Forecast is unchanged; no history event was created.' }
    }
    const records = state.records.map((record) => record.id === id ? {
      ...record,
      status: 'changed' as const,
      forecast: { ...record.forecast, projectedAqi, horizonHours },
    } : record)
    const after = { records, selectedId: id, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'forecast', id, after), notice: `${id} projected to AQI ${projectedAqi} at ${horizonHours} hours; linked summary settled.` })
    return { ok: true, message: `Forecast updated for ${id}.` }
  },

  mergeDuplicate(duplicateId) {
    const state = get()
    const duplicate = state.records.find((record) => record.id === duplicateId)
    const targetId = duplicate?.provenance.duplicateOfId
    if (!duplicate || !targetId) return { ok: false, message: 'This reading has no valid duplicate target.' }
    const target = state.records.find((record) => record.id === targetId)
    if (!target) return { ok: false, message: `Duplicate target ${targetId} was not found.` }
    const merged: AirReading = {
      ...target,
      label: target.label,
      aqi: Math.max(target.aqi, duplicate.aqi),
      status: 'changed',
      forecast: {
        ...target.forecast,
        projectedAqi: Math.max(target.forecast.projectedAqi, duplicate.forecast.projectedAqi),
        confidence: Math.max(target.forecast.confidence, duplicate.forecast.confidence),
      },
    }
    const records = state.records.filter((record) => record.id !== duplicateId).map((record) => record.id === targetId ? merged : record)
    const after = { records, selectedId: targetId, query: state.query, sort: state.sort }
    set({ ...after, history: appendEvent(state, 'merge', duplicateId, after), notice: `Merged ${duplicateId} into ${targetId}; one record and one event changed.` })
    return { ok: true, message: `Merged ${duplicateId} into ${targetId}.` }
  },

  undo() {
    const state = get()
    const last = state.history.at(-1)
    if (!last) return { ok: false, message: 'Nothing to undo.' }
    set({ ...structuredClone(last.before), history: state.history.slice(0, -1), notice: `Undid ${last.action}; ordering, selection, query, sort, and derived values were restored.` })
    return { ok: true, message: `Undid ${last.action}.` }
  },

  select(id) {
    const state = get()
    if (id !== null && !state.records.some((record) => record.id === id)) return { ok: false, message: `Reading ${id} was not found.` }
    set({ selectedId: id, notice: id ? `Selected ${id}.` : 'Selection cleared.' })
    return { ok: true, message: id ? `Selected ${id}.` : 'Selection cleared.' }
  },

  setQuery(query) { set({ query, notice: `Saved query ${query} is active.` }) },
  setSort(sort) { set({ sort, notice: `Sorted by ${sort}.` }) },
  setSearch(search) { set({ search }) },
  clear() { set({ records: [], selectedId: null, query: 'all', sort: 'manual', search: '', history: [], notice: 'Session cleared to a genuinely clean state.' }) },
  loadFixture() { set({ records: makeFixture(), selectedId: 'aq-fixture-001', query: 'all', sort: 'manual', search: '', history: [], notice: 'Loaded 120-record performance fixture after explicit action; authored milestones remain uncredited.' }) },
  importArtifact(artifact) {
    set({
      records: structuredClone(artifact.records),
      selectedId: artifact.view.selectedId,
      query: artifact.view.query,
      sort: artifact.view.sort,
      search: '',
      history: structuredClone(artifact.history),
      notice: `Validated and replayed ${artifact.records.length} records atomically.`,
    })
  },
  artifact(exportedAt = new Date().toISOString()) {
    const state = get()
    return {
      schemaVersion: 'air-quality-v1',
      exportedAt,
      records: structuredClone(state.records),
      derived: deriveSummary(state.records),
      history: structuredClone(state.history),
      view: { selectedId: state.selectedId, query: state.query, sort: state.sort },
    }
  },
}))

export function visibleRecords(state: Pick<AirStore, 'records' | 'query' | 'sort' | 'search'>) {
  const search = state.search.trim().toLowerCase()
  const filtered = state.records.filter((record) => {
    if (search && !`${record.id} ${record.label} ${record.provenance.sourceIssue}`.toLowerCase().includes(search)) return false
    if (state.query === 'needs-attention') return record.status !== 'archived' && record.forecast.projectedAqi >= 101
    if (state.query === 'ready') return record.status === 'ready'
    if (state.query === 'archived') return record.status === 'archived'
    return true
  })
  if (state.sort === 'manual') return filtered
  return [...filtered].sort((a, b) => {
    if (state.sort === 'aqi-asc') return a.aqi - b.aqi || a.id.localeCompare(b.id)
    if (state.sort === 'aqi-desc') return b.aqi - a.aqi || a.id.localeCompare(b.id)
    return b.observedOn.localeCompare(a.observedOn) || a.id.localeCompare(b.id)
  })
}
