import { z } from 'zod'

export const STATUS_VALUES = ['draft', 'ready', 'changed', 'archived'] as const
export const QUERY_VALUES = ['all', 'needs-attention', 'ready', 'archived'] as const
export const SORT_VALUES = ['manual', 'aqi-asc', 'aqi-desc', 'observed-desc'] as const
export const HORIZON_VALUES = [6, 12, 24] as const

export type ReadingStatus = (typeof STATUS_VALUES)[number]
export type SavedQuery = (typeof QUERY_VALUES)[number]
export type SortMode = (typeof SORT_VALUES)[number]

export const ReadingSchema = z.object({
  id: z.string().regex(/^aq-[a-z0-9-]{3,28}$/, 'ID must match aq-[a-z0-9-] and be 6 to 31 characters.'),
  label: z.string().trim().min(2, 'Label must contain at least 2 characters.').max(64, 'Label must contain at most 64 characters.'),
  status: z.enum(STATUS_VALUES),
  aqi: z.number().int('AQI must be a whole number.').min(0, 'AQI must be at least 0.').max(500, 'AQI must be at most 500.'),
  observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Observed date must use YYYY-MM-DD.'),
  forecast: z.object({
    projectedAqi: z.number().int('Projected AQI must be a whole number.').min(0, 'Projected AQI must be at least 0.').max(500, 'Projected AQI must be at most 500.'),
    horizonHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
    confidence: z.number().min(0, 'Confidence must be at least 0.').max(1, 'Confidence must be at most 1.'),
  }).strict(),
  provenance: z.object({
    releaseVersion: z.string().regex(/^AQ-\d{4}\.\d{2}$/, 'Release version must match AQ-YYYY.MM.'),
    sourceIssue: z.string().regex(/^HAQ-\d{3,5}$/, 'Source issue must match HAQ- followed by 3 to 5 digits.'),
    duplicateOfId: z.string().nullable(),
  }).strict(),
}).strict()

export type AirReading = z.infer<typeof ReadingSchema>

export const ReadingInputSchema = ReadingSchema.omit({ id: true }).extend({
  id: ReadingSchema.shape.id.optional(),
}).strict()

export type ReadingInput = z.infer<typeof ReadingInputSchema>

export type DerivedSummary = {
  activeCount: number
  archivedCount: number
  currentAverage: number
  projectedAverage: number
  changedCount: number
  attentionCount: number
}

export type SessionSnapshot = {
  records: AirReading[]
  selectedId: string | null
  query: SavedQuery
  sort: SortMode
}

export type HistoryEvent = {
  id: string
  action: 'create' | 'update' | 'delete' | 'archive' | 'forecast' | 'merge'
  recordId: string
  occurredAt: string
  before: SessionSnapshot
  after: SessionSnapshot
}

export type Artifact = {
  schemaVersion: 'air-quality-v1'
  exportedAt: string
  records: AirReading[]
  derived: DerivedSummary
  history: HistoryEvent[]
  view: {
    selectedId: string | null
    query: SavedQuery
    sort: SortMode
  }
}

const SnapshotSchema: z.ZodType<SessionSnapshot> = z.object({
  records: z.array(ReadingSchema).max(250),
  selectedId: z.string().nullable(),
  query: z.enum(QUERY_VALUES),
  sort: z.enum(SORT_VALUES),
}).strict()

const HistoryEventSchema: z.ZodType<HistoryEvent> = z.object({
  id: z.string().regex(/^evt-\d{4}$/),
  action: z.enum(['create', 'update', 'delete', 'archive', 'forecast', 'merge']),
  recordId: z.string(),
  occurredAt: z.string().datetime({ offset: true }),
  before: SnapshotSchema,
  after: SnapshotSchema,
}).strict()

export const ArtifactSchema: z.ZodType<Artifact> = z.object({
  schemaVersion: z.literal('air-quality-v1'),
  exportedAt: z.string().datetime({ offset: true }),
  records: z.array(ReadingSchema).max(250),
  derived: z.object({
    activeCount: z.number().int().nonnegative(),
    archivedCount: z.number().int().nonnegative(),
    currentAverage: z.number().min(0).max(500),
    projectedAverage: z.number().min(0).max(500),
    changedCount: z.number().int().nonnegative(),
    attentionCount: z.number().int().nonnegative(),
  }).strict(),
  history: z.array(HistoryEventSchema).max(500),
  view: z.object({
    selectedId: z.string().nullable(),
    query: z.enum(QUERY_VALUES),
    sort: z.enum(SORT_VALUES),
  }).strict(),
}).strict()

export const round1 = (value: number) => Math.round(value * 10) / 10

export function deriveSummary(records: AirReading[]): DerivedSummary {
  const active = records.filter((record) => record.status !== 'archived')
  const average = (selector: (record: AirReading) => number) =>
    active.length ? round1(active.reduce((sum, record) => sum + selector(record), 0) / active.length) : 0

  return {
    activeCount: active.length,
    archivedCount: records.length - active.length,
    currentAverage: average((record) => record.aqi),
    projectedAverage: average((record) => record.forecast.projectedAqi),
    changedCount: active.filter((record) => record.status === 'changed').length,
    attentionCount: active.filter((record) => record.forecast.projectedAqi >= 101).length,
  }
}

export function stableArtifactJson(artifact: Artifact): string {
  return JSON.stringify({
    ...artifact,
    records: [...artifact.records],
    history: [...artifact.history],
  }, null, 2)
}

export function validateArtifact(input: unknown): { data?: Artifact; diagnostics: string[] } {
  const parsed = ArtifactSchema.safeParse(input)
  const diagnostics = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || 'document'}: ${issue.message}`)

  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : null
  const rawRecords = raw && Array.isArray(raw.records) ? raw.records : []
  const rawIds = new Set<string>()
  rawRecords.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return
    const record = entry as Record<string, unknown>
    if (typeof record.id === 'string') {
      if (rawIds.has(record.id)) diagnostics.push(`records.${index}.id: duplicate ID ${record.id}; choose a unique ID and retry.`)
      rawIds.add(record.id)
    }
  })
  rawRecords.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return
    const record = entry as Record<string, unknown>
    const provenance = record.provenance && typeof record.provenance === 'object' && !Array.isArray(record.provenance)
      ? record.provenance as Record<string, unknown>
      : null
    const duplicate = provenance?.duplicateOfId
    if (typeof duplicate === 'string' && duplicate === record.id) diagnostics.push(`records.${index}.provenance.duplicateOfId: a record cannot duplicate itself.`)
    if (typeof duplicate === 'string' && !rawIds.has(duplicate)) diagnostics.push(`records.${index}.provenance.duplicateOfId: dangling reference ${duplicate}; import its target or clear the field.`)
  })

  if (raw && raw.derived && typeof raw.derived === 'object' && !Array.isArray(raw.derived)) {
    const derived = raw.derived as Record<string, unknown>
    const rawSummary = {
      activeCount: rawRecords.filter((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).status !== 'archived').length,
      archivedCount: rawRecords.filter((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).status === 'archived').length,
      changedCount: rawRecords.filter((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).status === 'changed').length,
      attentionCount: rawRecords.filter((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
        const forecast = (entry as Record<string, unknown>).forecast
        return forecast && typeof forecast === 'object' && !Array.isArray(forecast) && Number((forecast as Record<string, unknown>).projectedAqi) >= 101
      }).length,
    }
    for (const [key, expected] of Object.entries(rawSummary)) {
      if (typeof derived[key] === 'number' && derived[key] !== expected) diagnostics.push(`derived.${key}: stale value ${derived[key]}; expected ${expected} from records.`)
    }
  }

  if (!parsed.success) return { diagnostics: [...new Set(diagnostics)] }

  const artifact = parsed.data
  const ids = artifact.records.map((record) => record.id)
  const seen = new Set<string>()
  ids.forEach((id, index) => {
    if (seen.has(id)) diagnostics.push(`records.${index}.id: duplicate ID ${id}; choose a unique ID and retry.`)
    seen.add(id)
  })

  artifact.records.forEach((record, index) => {
    const duplicate = record.provenance.duplicateOfId
    if (duplicate === record.id) diagnostics.push(`records.${index}.provenance.duplicateOfId: a record cannot duplicate itself.`)
    if (duplicate && !seen.has(duplicate)) diagnostics.push(`records.${index}.provenance.duplicateOfId: dangling reference ${duplicate}; import its target or clear the field.`)
    if (record.status === 'archived' && record.forecast.projectedAqi !== record.aqi) {
      diagnostics.push(`records.${index}.forecast.projectedAqi: archived records must project their current AQI (${record.aqi}).`)
    }
  })

  if (artifact.view.selectedId && !seen.has(artifact.view.selectedId)) {
    diagnostics.push(`view.selectedId: dangling reference ${artifact.view.selectedId}; select an imported record or null.`)
  }

  artifact.history.forEach((event, index) => {
    if (event.before.selectedId && !event.before.records.some((record) => record.id === event.before.selectedId)) {
      diagnostics.push(`history.${index}.before.selectedId: dangling selection ${event.before.selectedId}.`)
    }
    if (event.after.selectedId && !event.after.records.some((record) => record.id === event.after.selectedId)) {
      diagnostics.push(`history.${index}.after.selectedId: dangling selection ${event.after.selectedId}.`)
    }
  })

  const expected = deriveSummary(artifact.records)
  for (const key of Object.keys(expected) as (keyof DerivedSummary)[]) {
    if (artifact.derived[key] !== expected[key]) {
      diagnostics.push(`derived.${key}: stale value ${artifact.derived[key]}; expected ${expected[key]} from records.`)
    }
  }

  const uniqueDiagnostics = [...new Set(diagnostics)]
  return uniqueDiagnostics.length ? { diagnostics: uniqueDiagnostics } : { data: artifact, diagnostics: uniqueDiagnostics }
}

export function makeFixture(count = 120): AirReading[] {
  return Array.from({ length: count }, (_, index) => {
    const aqi = (index * 37) % 501
    const projectedAqi = Math.min(500, Math.max(0, aqi + ((index % 7) - 3) * 4))
    return {
      id: `aq-fixture-${String(index + 1).padStart(3, '0')}`,
      label: `Room ${String(index + 1).padStart(3, '0')}`,
      status: index % 11 === 0 ? 'archived' : index % 5 === 0 ? 'changed' : 'ready',
      aqi,
      observedOn: `2026-07-${String((index % 22) + 1).padStart(2, '0')}`,
      forecast: {
        projectedAqi: index % 11 === 0 ? aqi : projectedAqi,
        horizonHours: HORIZON_VALUES[index % HORIZON_VALUES.length],
        confidence: round1(0.5 + (index % 6) * 0.1),
      },
      provenance: {
        releaseVersion: 'AQ-2026.07',
        sourceIssue: `HAQ-${String(100 + index).padStart(3, '0')}`,
        duplicateOfId: null,
      },
    }
  })
}
