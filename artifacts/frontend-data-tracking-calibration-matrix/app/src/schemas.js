import { z } from 'zod'

export const classificationSchema = z.object({
  task: z.string().trim().min(1, 'task must be a non-empty string').max(80, 'task must be at most 80 characters'),
  classification: z.string().refine(
    (value) => ['capability-gap', 'spec-defect'].includes(value),
    'classification must be capability-gap or spec-defect',
  ),
  rationale: z.string().trim().min(15, 'rationale must be at least 15 characters').max(500, 'rationale must be at most 500 characters'),
}).strict()

const trialSchema = z.object({
  id: z.string(),
  reward: z.number(),
  runtime: z.number(),
  cost: z.number(),
}).strict()

const cellSchema = z.object({
  model: z.string(),
  harness: z.string(),
  mean: z.number(),
  trialCount: z.number().int().nonnegative(),
  trials: z.array(trialSchema),
}).strict()

const varianceRowSchema = z.object({
  task: z.string(),
  category: z.string(),
  means: z.record(z.number()),
  coefficientOfVariation: z.number(),
  stability: z.enum(['stable', 'divergent']),
  triage: classificationSchema.nullable(),
}).strict()

export const calibrationPackSchema = z.object({
  schemaVersion: z.literal(1, { errorMap: () => ({ message: 'schemaVersion must be 1' }) }),
  document: z.literal('meridian-calibration', { errorMap: () => ({ message: 'document must be meridian-calibration' }) }),
  sigmaThreshold: z.number(),
  models: z.array(z.string()),
  harnesses: z.array(z.string()),
  cells: z.array(cellSchema),
  varianceRows: z.array(varianceRowSchema),
  timeline: z.array(z.object({ timestamp: z.string(), model: z.string(), harness: z.string(), mean: z.number() }).strict()),
  baseline: z.object({ cells: z.array(z.object({ model: z.string(), harness: z.string(), mean: z.number() }).strict()) }).strict().nullable(),
  filters: z.object({ model: z.array(z.string()), harness: z.array(z.string()), taskCategory: z.array(z.string()) }).strict(),
  triage: z.array(classificationSchema),
}).strict()

export const triagePackSchema = z.object({
  schemaVersion: z.literal(1, { errorMap: () => ({ message: 'schemaVersion must be 1' }) }),
  document: z.literal('meridian-triage', { errorMap: () => ({ message: 'document must be meridian-triage' }) }),
  entries: z.array(classificationSchema),
}).strict()

export const importPackSchema = z.union([calibrationPackSchema, triagePackSchema])

export function zodIssueMessage(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'payload does not match a supported pack'
  const field = issue.path?.length ? issue.path.join('.') : 'payload'
  return `${field}: ${issue.message}`
}
