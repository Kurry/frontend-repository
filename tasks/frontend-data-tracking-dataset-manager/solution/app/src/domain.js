import { z } from 'zod'

export const FIELD_TYPES = ['text', 'number', 'category']
export const SPLITS = ['train', 'validation', 'test']

export const schemaFieldSchema = z.object({
  name: z.string().trim().min(1, 'Field name is required').max(40, 'Field name must be at most 40 characters').regex(/^[A-Za-z0-9_]+$/, 'Field name may contain only letters, digits, and underscores'),
  type: z.enum(FIELD_TYPES, { error: 'Field type must be text, number, or category' }),
  allowedValues: z.array(z.string().trim().min(1, 'Allowed values cannot be empty').max(40, 'Allowed values must be at most 40 characters')),
}).superRefine((field, ctx) => {
  const normalized = field.allowedValues.map((v) => v.toLowerCase())
  if (field.type === 'category' && field.allowedValues.length === 0) ctx.addIssue({ code: 'custom', path: ['allowedValues'], message: `${field.name || 'Category field'} allowed values must include at least one value` })
  if (field.type !== 'category' && field.allowedValues.length > 0) ctx.addIssue({ code: 'custom', path: ['allowedValues'], message: `${field.name || 'Field'} allowed values must be empty unless type is category` })
  if (new Set(normalized).size !== normalized.length) ctx.addIssue({ code: 'custom', path: ['allowedValues'], message: `${field.name || 'Category field'} allowed values must be unique` })
})

export const datasetCreateSchema = z.object({
  name: z.string().trim().min(1, 'Dataset name is required').max(80, 'Dataset name must be at most 80 characters'),
  description: z.string().max(500, 'Dataset description must be at most 500 characters'),
  schema: z.array(schemaFieldSchema).min(1, 'Schema must contain at least one field'),
}).superRefine((data, ctx) => {
  const seen = new Set()
  data.schema.forEach((field, i) => {
    const key = field.name.toLowerCase()
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: ['schema', i, 'name'], message: `Field name “${field.name}” must be unique` })
    seen.add(key)
  })
})

export const thresholdSchema = z.object({
  column: z.string().min(1, 'Threshold column is required'),
  comparator: z.enum(['above', 'below'], { error: 'Threshold comparator must be above or below' }),
  cap: z.preprocess((value) => value === '' || value == null ? Number.NaN : value, z.coerce.number({ error: 'Threshold cap must be a finite number' }).finite('Threshold cap must be a finite number')),
})

export const splitSchema = z.object({
  train: z.coerce.number().int('Train percentage must be an integer').min(0).max(100),
  validation: z.coerce.number().int('Validation percentage must be an integer').min(0).max(100),
  test: z.coerce.number().int('Test percentage must be an integer').min(0).max(100),
}).refine((v) => v.train + v.validation + v.test === 100, { path: ['root'], message: 'Split percentages must total exactly 100' })

export const snapshotSchema = z.object({ name: z.string().trim().min(1, 'Snapshot name is required').max(80, 'Snapshot name must be at most 80 characters') })
export const attachSchema = z.object({ suiteId: z.string().min(1, 'Eval suite is required') })

export function dynamicRowSchema(fields) {
  const shape = {}
  for (const field of fields) {
    if (field.type === 'text') shape[field.name] = z.string().max(2000, `${field.name} must be at most 2000 characters`)
    if (field.type === 'number') shape[field.name] = z.preprocess((value) => value === '' || value == null ? Number.NaN : value, z.coerce.number({ error: `${field.name} must be a finite number` }).finite(`${field.name} must be a finite number`))
    if (field.type === 'category') shape[field.name] = z.string().refine((v) => field.allowedValues.includes(v), `${field.name} must be one of: ${field.allowedValues.join(', ')}`)
  }
  return z.object({
    values: z.object(shape).strict('Row values must contain exactly the schema field names'),
    expectedOutput: z.string().max(4000, 'Expected output must be at most 4000 characters'),
    verified: z.boolean(),
    split: z.preprocess((value) => value === '' ? undefined : value, z.enum(SPLITS).optional()),
  })
}

export function normalizeRowInput(fields, data) {
  const values = {}
  for (const field of fields) {
    const raw = data.values?.[field.name] ?? ''
    values[field.name] = field.type === 'number' && raw !== '' ? Number(raw) : raw
  }
  return { values, expectedOutput: data.expectedOutput ?? '', verified: Boolean(data.verified), ...(data.split ? { split: data.split } : {}) }
}

export function validateRow(fields, data) {
  const normalized = normalizeRowInput(fields, data)
  const result = dynamicRowSchema(fields).safeParse(normalized)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message])), issues: result.error.issues }
}

export function fieldError(field, raw, required = true) {
  if (raw === '' || raw == null) return required || field.type !== 'text' ? `${field.name} is required` : null
  if (field.type === 'number' && !Number.isFinite(Number(raw))) return `${field.name} must be a finite number`
  if (field.type === 'category' && !field.allowedValues.includes(String(raw))) return `${field.name} must be one of: ${field.allowedValues.join(', ')}`
  if (field.type === 'text' && String(raw).length > 2000) return `${field.name} must be at most 2000 characters`
  return null
}

export function parseFormula(input, dataset) {
  const match = input.trim().match(/^=(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-Za-z0-9_]+)(?:,\s*(\d+):(\d+))?\)$/i)
  if (!match) {
    const named = input.trim().match(/^=([A-Za-z]+)\(/)
    if (named && !['SUM','AVERAGE','MIN','MAX','COUNT'].includes(named[1].toUpperCase())) return { error: `Unknown formula function “${named[1]}”` }
    return { error: 'Formula must use SUM, AVERAGE, MIN, MAX, or COUNT, for example =SUM(score, 1:100)' }
  }
  const [, fnRaw, column, startRaw, endRaw] = match
  const field = dataset.schema.find((f) => f.name.toLowerCase() === column.toLowerCase())
  if (!field) return { error: `Unknown formula column “${column}”` }
  if (field.type !== 'number') return { error: `Column “${field.name}” has type ${field.type}; numeric formulas require a number column` }
  const start = startRaw ? Math.max(0, Number(startRaw) - 1) : 0
  const end = endRaw ? Number(endRaw) : dataset.rows.length
  const values = dataset.rows.slice(start, end).map((r) => r.values[field.name]).filter(Number.isFinite)
  const fn = fnRaw.toUpperCase()
  if (fn === 'COUNT') return { value: values.length }
  if (!values.length) return { value: 0 }
  if (fn === 'SUM') return { value: values.reduce((a, b) => a + b, 0) }
  if (fn === 'AVERAGE') return { value: values.reduce((a, b) => a + b, 0) / values.length }
  if (fn === 'MIN') return { value: Math.min(...values) }
  return { value: Math.max(...values) }
}

export function flaggedFields(row, dataset) {
  return dataset.thresholdRules.filter((rule) => {
    const value = row.values[rule.column]
    return rule.comparator === 'above' ? value > rule.cap : value < rule.cap
  }).map((r) => r.column)
}

export function computeStats(dataset) {
  const flaggedCount = dataset.rows.filter((r) => flaggedFields(r, dataset).length).length
  const numericSummaries = dataset.schema.filter((f) => f.type === 'number').map((field) => {
    const vals = dataset.rows.map((r) => r.values[field.name]).filter(Number.isFinite)
    return { field: field.name, min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 }
  })
  return {
    totalRows: dataset.rows.length,
    verifiedCount: dataset.rows.filter((r) => r.verified).length,
    flaggedCount,
    numericSummaries,
    splitDistribution: Object.fromEntries(SPLITS.map((s) => [s, dataset.rows.filter((r) => r.split === s).length])),
    snapshotCount: dataset.snapshots.length,
  }
}

export function makePackage(dataset) {
  return {
    schemaVersion: 'dataset-manager.package/v1',
    generatedAt: new Date().toISOString(),
    dataset: {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description ?? '',
      createdAt: dataset.createdAt,
      schema: dataset.schema,
      rows: dataset.rows.map(({ id: _id, ...r }) => r),
      thresholdRules: dataset.thresholdRules.map(({ column, comparator, cap }) => ({ column, comparator, cap })),
      snapshots: dataset.snapshots.map((s) => ({ ...s, rows: s.rows.map(({ id: _id, ...r }) => r) })),
      splitPercentages: dataset.splitPercentages,
      attachedSuiteId: dataset.attachedSuiteId ?? null,
    },
    stats: computeStats(dataset),
  }
}

function csvEscape(value) {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function rowsCsv(dataset, rows) {
  const headers = [...dataset.schema.map((f) => f.name), 'expectedOutput', 'verified', 'split']
  return [headers.join(','), ...rows.map((row) => [...dataset.schema.map((f) => row.values[f.name]), row.expectedOutput, row.verified, row.split ?? ''].map(csvEscape).join(','))].join('\n')
}

export function validatePackage(input) {
  if (!input || typeof input !== 'object') return { error: 'Package must be a JSON object' }
  if (input.schemaVersion !== 'dataset-manager.package/v1') return { error: 'schemaVersion must be exactly dataset-manager.package/v1' }
  if (typeof input.generatedAt !== 'string' || Number.isNaN(Date.parse(input.generatedAt))) return { error: 'generatedAt must be an ISO-8601 datetime' }
  if (!input.dataset) return { error: 'dataset is required' }
  if (!input.stats) return { error: 'stats is required' }
  const base = datasetCreateSchema.safeParse({ name: input.dataset.name, description: input.dataset.description, schema: input.dataset.schema })
  if (!base.success) return { error: `dataset.${base.error.issues[0].path.join('.')}: ${base.error.issues[0].message}` }
  if (!input.dataset.id) return { error: 'dataset.id is required' }
  if (Number.isNaN(Date.parse(input.dataset.createdAt))) return { error: 'dataset.createdAt must be an ISO-8601 datetime' }
  const rows = input.dataset.rows
  if (!Array.isArray(rows)) return { error: 'dataset.rows must be an array' }
  for (let i = 0; i < rows.length; i++) {
    const check = validateRow(input.dataset.schema, rows[i])
    if (!check.success) return { error: `dataset.rows[${i}].${check.issues[0].path.join('.')}: ${check.issues[0].message}` }
  }
  const split = splitSchema.safeParse(input.dataset.splitPercentages)
  if (!split.success) return { error: `dataset.splitPercentages: ${split.error.issues[0].message}` }
  if (!Array.isArray(input.dataset.thresholdRules)) return { error: 'dataset.thresholdRules must be an array' }
  const numeric = new Set(input.dataset.schema.filter((f) => f.type === 'number').map((f) => f.name))
  for (const rule of input.dataset.thresholdRules) {
    const check = thresholdSchema.safeParse(rule)
    if (!check.success || !numeric.has(rule.column)) return { error: 'dataset.thresholdRules.column must name an existing numeric schema field' }
  }
  if (!Array.isArray(input.dataset.snapshots)) return { error: 'dataset.snapshots must be an array' }
  const snapshotNames = new Set()
  for (let i = 0; i < input.dataset.snapshots.length; i++) {
    const snapshot = input.dataset.snapshots[i]
    if (!snapshot || typeof snapshot.name !== 'string' || !snapshot.name.trim() || snapshot.name.trim().length > 80) return { error: `dataset.snapshots[${i}].name must be a non-empty string of at most 80 characters` }
    if (snapshotNames.has(snapshot.name.toLowerCase())) return { error: `dataset.snapshots[${i}].name must be unique` }
    snapshotNames.add(snapshot.name.toLowerCase())
    if (typeof snapshot.createdAt !== 'string' || Number.isNaN(Date.parse(snapshot.createdAt))) return { error: `dataset.snapshots[${i}].createdAt must be an ISO-8601 datetime` }
    if (!Array.isArray(snapshot.rows)) return { error: `dataset.snapshots[${i}].rows must be an array` }
    for (let j = 0; j < snapshot.rows.length; j++) {
      const check = validateRow(input.dataset.schema, snapshot.rows[j])
      if (!check.success) return { error: `dataset.snapshots[${i}].rows[${j}]: ${check.issues[0].message}` }
    }
  }
  if (input.dataset.attachedSuiteId !== null && typeof input.dataset.attachedSuiteId !== 'string') return { error: 'dataset.attachedSuiteId must be a string or null' }
  if (input.stats.totalRows !== rows.length) return { error: 'stats.totalRows must equal dataset.rows.length' }
  if (input.stats.verifiedCount !== rows.filter((r) => r.verified).length) return { error: 'stats.verifiedCount must equal the verified row count' }
  if (input.stats.snapshotCount !== input.dataset.snapshots.length) return { error: 'stats.snapshotCount must equal dataset.snapshots.length' }
  if (!Number.isInteger(input.stats.totalRows) || input.stats.totalRows < 0) return { error: 'stats.totalRows must be a non-negative integer' }
  if (!Number.isInteger(input.stats.verifiedCount) || input.stats.verifiedCount < 0) return { error: 'stats.verifiedCount must be a non-negative integer' }
  if (!Number.isInteger(input.stats.flaggedCount) || input.stats.flaggedCount < 0) return { error: 'stats.flaggedCount must be a non-negative integer' }
  if (!Number.isInteger(input.stats.snapshotCount) || input.stats.snapshotCount < 0) return { error: 'stats.snapshotCount must be a non-negative integer' }
  if (!Array.isArray(input.stats.numericSummaries)) return { error: 'stats.numericSummaries must be an array' }
  if (!input.stats.splitDistribution || typeof input.stats.splitDistribution !== 'object') return { error: 'stats.splitDistribution is required' }
  const computed = computeStats({ ...input.dataset, rows, thresholdRules: input.dataset.thresholdRules, snapshots: input.dataset.snapshots })
  if (input.stats.flaggedCount !== computed.flaggedCount) return { error: 'stats.flaggedCount must equal the count of rows breaching threshold rules' }
  for (const splitName of SPLITS) if (input.stats.splitDistribution[splitName] !== computed.splitDistribution[splitName]) return { error: `stats.splitDistribution.${splitName} must equal the dataset row count for that split` }
  for (const summary of computed.numericSummaries) {
    const incoming = input.stats.numericSummaries.find((s) => s?.field === summary.field)
    if (!incoming) return { error: `stats.numericSummaries must include numeric field ${summary.field}` }
    for (const metric of ['min','max','mean']) if (!Number.isFinite(incoming[metric]) || Math.abs(incoming[metric] - summary[metric]) > 1e-9) return { error: `stats.numericSummaries.${summary.field}.${metric} must match the dataset rows` }
  }
  return { data: input }
}

export function findDuplicateGroups(dataset, dismissed = []) {
  const groups = new Map()
  for (const row of dataset.rows) {
    const key = JSON.stringify(dataset.schema.map((f) => row.values[f.name]))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return [...groups.values()].filter((rows) => rows.length > 1).map((rows) => ({ id: rows.map((r) => r.id).sort().join(':'), rows })).filter((g) => !dismissed.includes(g.id))
}

export function snapshotDiff(older, newer, schema) {
  if (!older || !newer) return []
  const a = new Map(older.rows.map((r) => [r.id, r]))
  const b = new Map(newer.rows.map((r) => [r.id, r]))
  const ids = new Set([...a.keys(), ...b.keys()])
  return [...ids].flatMap((id) => {
    if (!a.has(id)) return [{ id, status: 'added', newer: b.get(id) }]
    if (!b.has(id)) return [{ id, status: 'removed', older: a.get(id) }]
    const oldRow = a.get(id), newRow = b.get(id)
    const changes = [...schema.map((f) => f.name), 'expectedOutput', 'verified', 'split'].flatMap((field) => {
      const oldVal = oldRow.values?.[field] ?? oldRow[field] ?? ''
      const newVal = newRow.values?.[field] ?? newRow[field] ?? ''
      return oldVal !== newVal ? [{ field, oldVal, newVal }] : []
    })
    return changes.length ? [{ id, status: 'changed', changes }] : []
  })
}
