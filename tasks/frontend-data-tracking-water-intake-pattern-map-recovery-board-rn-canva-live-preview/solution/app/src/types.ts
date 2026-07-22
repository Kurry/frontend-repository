export type EventStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived'

export interface IntakeEvent {
  id: string
  title: string
  amount: number
  status: EventStatus
}

export interface WaterIntakePatternMapSession {
  schemaVersion: 'hydration-pattern-v1'
  exportedAt: string
  records: IntakeEvent[]
  derived: {
    summary: string
  }
  history: IntakeEvent[][] // Store states for undo
}
