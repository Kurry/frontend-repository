import type { State } from '../store'
import type { WaterIntakePatternMapSession } from '../types'

export function exportArtifact(state: State): string {
  const artifact: WaterIntakePatternMapSession = {
    schemaVersion: 'hydration-pattern-v1',
    exportedAt: new Date().toISOString(),
    records: state.records,
    history: state.history,
    derived: {
      summary: `${state.records.length} total events. Total volume: ${state.records.reduce((acc, curr) => acc + curr.amount, 0)}ml`
    }
  }
  return JSON.stringify(artifact, null, 2)
}

export function validateArtifact(jsonStr: string): WaterIntakePatternMapSession | null {
  try {
    const data = JSON.parse(jsonStr)

    if (data.schemaVersion !== 'hydration-pattern-v1') return null
    if (!Array.isArray(data.records)) return null
    if (!Array.isArray(data.history)) return null

    // Validate records
    const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived']
    const ids = new Set()

    for (const record of data.records) {
      if (typeof record.id !== 'string' || !record.id) return null
      if (typeof record.title !== 'string' || !record.title) return null
      if (typeof record.amount !== 'number' || record.amount < 0 || record.amount > 5000) return null
      if (!validStatuses.includes(record.status)) return null

      if (ids.has(record.id)) return null // Duplicate ID
      ids.add(record.id)
    }

    return data as WaterIntakePatternMapSession
  } catch (e) {
    return null
  }
}
