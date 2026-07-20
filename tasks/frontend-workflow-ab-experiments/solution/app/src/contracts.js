import { z } from 'zod'

export const MODELS = ['Larkspur-2', 'Cobalt-Mini', 'Meridian-XL', 'Fernwave-1']
export const STATUSES = ['pending', 'running', 'paused', 'completed', 'decided', 'archived']
export const LETTERS = ['A', 'B', 'C', 'D']

export const variantSchema = z.object({
  title: z.string().trim().min(1, 'Variant title is required').max(40, 'Variant title must be 40 characters or fewer'),
  promptId: z.string().min(1, 'Variant prompt is required'),
  model: z.enum(MODELS, { error: 'Variant model must be Larkspur-2, Cobalt-Mini, Meridian-XL, or Fernwave-1' }),
  temperature: z.coerce.number().min(0, 'Variant temperature must be at least 0').max(2, 'Variant temperature must be at most 2'),
  trafficAllocation: z.coerce.number().min(0, 'Traffic allocation must be at least 0').max(100, 'Traffic allocation must be at most 100')
})

export const experimentSchema = z.object({
  name: z.string().trim().min(1, 'Experiment name is required').max(120, 'Experiment name must be 120 characters or fewer'),
  hypothesis: z.string().trim().min(1, 'Hypothesis is required').max(2000, 'Hypothesis must be 2,000 characters or fewer'),
  successMetric: z.string().min(1, 'Success metric is required'),
  minimumSampleSize: z.coerce.number().int('Minimum sample size must be an integer').min(1, 'Minimum sample size must be at least 1').max(500, 'Minimum sample size must be at most 500'),
  variants: z.array(variantSchema).min(2, 'At least 2 variants are required').max(4, 'No more than 4 variants are allowed')
}).superRefine((value, context) => {
  const total = value.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0)
  if (Math.abs(total - 100) > 0.001) context.addIssue({ code: 'custom', path: ['variants'], message: 'Traffic allocation must sum to exactly 100%' })
})

export const criterionSchema = z.object({
  name: z.string().trim().min(1, 'Criterion name is required').max(60, 'Criterion name must be 60 characters or fewer'),
  description: z.string().trim().min(1, 'Criterion description is required').max(400, 'Criterion description must be 400 characters or fewer'),
  passThreshold: z.coerce.number().int('Pass threshold must be an integer').min(0, 'Pass threshold must be at least 0').max(100, 'Pass threshold must be at most 100')
})

export const decisionSchema = z.object({
  choice: z.enum(['declare-winner', 'inconclusive', 'stop-early'], { error: 'Decision choice is required' }),
  winnerVariant: z.preprocess(value => value === '' ? null : value, z.enum(LETTERS).nullable().optional()),
  rationale: z.string().trim().min(1, 'Decision rationale is required').max(1000, 'Decision rationale must be 1,000 characters or fewer')
}).superRefine((value, context) => {
  if (value.choice === 'declare-winner' && !value.winnerVariant) context.addIssue({ code: 'custom', path: ['winnerVariant'], message: 'Winner variant is required when declaring a winner' })
  if (value.choice !== 'declare-winner' && value.winnerVariant) context.addIssue({ code: 'custom', path: ['winnerVariant'], message: 'Winner variant must be empty for this decision choice' })
})

const statisticsSchema = z.object({
  winner: z.string().min(1, 'statistics.winner is required'),
  winRate: z.number().min(0, 'statistics.winRate must be at least 0').max(1, 'statistics.winRate must be at most 1'),
  pValue: z.number().min(0, 'statistics.pValue must be at least 0').max(1, 'statistics.pValue must be at most 1'),
  confidenceInterval: z.tuple([z.number(), z.number()]),
  means: z.record(z.string(), z.number())
})

export const reportSchema = z.object({
  schemaVersion: z.literal('ab-experiment-report-v1', { error: 'schemaVersion must be ab-experiment-report-v1' }),
  experimentId: z.string().min(1, 'experimentId is required'),
  design: experimentSchema,
  status: z.enum(['completed', 'decided'], { error: 'status must be completed or decided' }),
  sampleCounts: z.record(z.string(), z.number().int().nonnegative()),
  statistics: statisticsSchema,
  decision: decisionSchema.nullable(),
  flaggedResponseIds: z.array(z.string(), { error: 'flaggedResponseIds must be an array' }),
  generatedAt: z.string().refine(value => !Number.isNaN(Date.parse(value)) && value.endsWith('Z'), 'generatedAt must be an ISO-8601 datetime ending in Z')
}).strict().superRefine((value, context) => {
  const letters = value.design.variants.map((_, index) => LETTERS[index])
  const sampleKeys = Object.keys(value.sampleCounts)
  const meanKeys = Object.keys(value.statistics.means)
  if (sampleKeys.length !== letters.length || sampleKeys.some(key => !letters.includes(key))) context.addIssue({ code: 'custom', path: ['sampleCounts'], message: 'sampleCounts keys must match the design variant letters' })
  if (meanKeys.length !== letters.length || meanKeys.some(key => !letters.includes(key))) context.addIssue({ code: 'custom', path: ['statistics', 'means'], message: 'statistics.means keys must match the design variant letters' })
  if (value.status === 'decided' && !value.decision) context.addIssue({ code: 'custom', path: ['decision'], message: 'decision is required when status is decided' })
  if (value.status === 'completed' && value.decision) context.addIssue({ code: 'custom', path: ['decision'], message: 'decision must be null when status is completed' })
  if (value.statistics.winner !== 'Tie' && !letters.includes(value.statistics.winner)) context.addIssue({ code: 'custom', path: ['statistics', 'winner'], message: 'statistics.winner must be a design variant letter or Tie' })
  if (value.decision?.choice === 'declare-winner' && !letters.includes(value.decision.winnerVariant)) context.addIssue({ code: 'custom', path: ['decision', 'winnerVariant'], message: 'decision.winnerVariant must name a design variant letter' })
})

export const zodErrorMessage = error => {
  const issue = error?.issues?.[0]
  if (!issue) return 'The payload is invalid'
  const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
  return `${path}${issue.message}`
}
