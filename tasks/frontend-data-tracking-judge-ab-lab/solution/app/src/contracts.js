import { z } from 'zod'

export const SCORER_MODELS = ['Sable 4', 'Quartz Mini', 'Onyx Pro']
export const CAUSES = ['scorer-noise', 'rubric-change-effect', 'harness-change-effect']
export const DIMENSIONS = ['correctness', 'visual', 'motion', 'technical']

export const attributionInputSchema = z.object({
  cause: z.enum(CAUSES, { error: 'cause: choose scorer noise, rubric change effect, or harness change effect' }),
  note: z.string().max(200, 'note: use 200 characters or fewer').optional().catch(''),
})

export const attributionSchema = attributionInputSchema.extend({
  trialId: z.string().min(1, 'trialId: is required'),
  criterionId: z.string().min(1, 'criterionId: is required'),
  labelA: z.string().min(1, 'labelA: is required'),
  labelB: z.string().min(1, 'labelB: is required'),
}).refine((value) => value.labelA !== value.labelB, { path: ['labelB'], message: 'labelB: must differ from labelA' })

export const rescoreBaseSchema = z.object({
  labelName: z.string().trim().min(1, 'labelName: enter a non-empty label name'),
  scorerModel: z.enum(SCORER_MODELS, { error: 'scorerModel: choose a scorer model' }),
  configNote: z.string().max(120, 'configNote: use 120 characters or fewer').optional().catch(''),
})

export const createRescoreSchema = (labels) => rescoreBaseSchema.superRefine((value, ctx) => {
  if (labels.some((label) => label.name.toLowerCase() === value.labelName.toLowerCase())) {
    ctx.addIssue({ code: 'custom', path: ['labelName'], message: 'labelName: must be unique (case-insensitive)' })
  }
})

export const savedPairBaseSchema = z.object({
  name: z.string().trim().min(1, 'name: enter a pair name').max(40, 'name: use 40 characters or fewer'),
  labelA: z.string().min(1, 'labelA: choose a label'),
  labelB: z.string().min(1, 'labelB: choose a label'),
}).refine((value) => value.labelA !== value.labelB, { path: ['labelB'], message: 'labelB: must differ from labelA' })

export const createSavedPairSchema = (pairs, labelNames) => savedPairBaseSchema.superRefine((value, ctx) => {
  if (pairs.some((pair) => pair.name.toLowerCase() === value.name.toLowerCase())) {
    ctx.addIssue({ code: 'custom', path: ['name'], message: 'name: must be unique (case-insensitive)' })
  }
  if (!labelNames.includes(value.labelA)) ctx.addIssue({ code: 'custom', path: ['labelA'], message: 'labelA: must name an existing label' })
  if (!labelNames.includes(value.labelB)) ctx.addIssue({ code: 'custom', path: ['labelB'], message: 'labelB: must name an existing label' })
})

const criterionSchema = z.object({
  id: z.string().min(1),
  dimension: z.enum(DIMENSIONS),
  verdict: z.enum(['pass', 'fail']),
  reasoning: z.string().min(1),
})

const resultSchema = z.object({
  totalReward: z.number().min(0).max(1),
  pass: z.boolean(),
  dimensions: z.object({
    correctness: z.number().min(0).max(1),
    visual: z.number().min(0).max(1),
    motion: z.number().min(0).max(1),
    technical: z.number().min(0).max(1),
  }),
  scorerCost: z.number().nonnegative(),
  criteria: z.array(criterionSchema).length(16),
  toolCalls: z.number().int().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  scorerModel: z.enum(SCORER_MODELS).optional(),
})

const labelSchema = z.object({
  name: z.string().min(1),
  scorerModel: z.enum(SCORER_MODELS),
  configNote: z.string().max(120),
  meanReward: z.number().min(0).max(1),
  totalCost: z.number().nonnegative(),
})

const trialSchema = z.object({
  id: z.string().min(1),
  taskName: z.string().min(1),
  results: z.record(z.string(), resultSchema),
})

const compareSummarySchema = z.object({
  labelA: z.string().min(1),
  labelB: z.string().min(1),
  meanDelta: z.number(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  ties: z.number().int().nonnegative(),
  costA: z.number().nonnegative(),
  costB: z.number().nonnegative(),
  passRateA: z.number().min(0).max(1),
  passRateB: z.number().min(0).max(1),
}).refine((value) => value.labelA !== value.labelB, { path: ['labelB'], message: 'compareSummary.labelB: must differ from labelA' })

export const labResultsSchema = z.object({
  schemaVersion: z.literal('rescore-ab-lab-v1', { error: 'schemaVersion: must equal rescore-ab-lab-v1' }),
  labels: z.array(labelSchema),
  trials: z.array(trialSchema),
  attributions: z.array(attributionSchema),
  compareSummary: compareSummarySchema.nullable(),
  savedPairs: z.array(savedPairBaseSchema),
  generatedAt: z.iso.datetime({ message: 'generatedAt: must be an ISO-8601 datetime' }),
}).strict().superRefine((doc, ctx) => {
  const labels = new Set(doc.labels.map((label) => label.name))
  const trials = new Set(doc.trials.map((trial) => trial.id))
  doc.trials.forEach((trial, ti) => Object.entries(trial.results).forEach(([label, result]) => {
    if (!labels.has(label)) ctx.addIssue({ code: 'custom', path: ['trials', ti, 'results', label], message: `trials.results.${label}: must name an existing label` })
    if (result.pass !== (result.totalReward >= 0.7)) ctx.addIssue({ code: 'custom', path: ['trials', ti, 'results', label, 'pass'], message: 'pass: must equal totalReward >= 0.70' })
  }))
  doc.attributions.forEach((item, index) => {
    if (!trials.has(item.trialId)) ctx.addIssue({ code: 'custom', path: ['attributions', index, 'trialId'], message: 'attributions.trialId: must name an existing trial' })
    if (!labels.has(item.labelA)) ctx.addIssue({ code: 'custom', path: ['attributions', index, 'labelA'], message: 'attributions.labelA: must name an existing label' })
    if (!labels.has(item.labelB)) ctx.addIssue({ code: 'custom', path: ['attributions', index, 'labelB'], message: 'attributions.labelB: must name an existing label' })
  })
  const pairNames = new Set()
  doc.savedPairs.forEach((pair, index) => {
    const key = pair.name.toLowerCase()
    if (pairNames.has(key)) ctx.addIssue({ code: 'custom', path: ['savedPairs', index, 'name'], message: 'savedPairs.name: must be unique (case-insensitive)' })
    pairNames.add(key)
    if (!labels.has(pair.labelA)) ctx.addIssue({ code: 'custom', path: ['savedPairs', index, 'labelA'], message: 'savedPairs.labelA: must name an existing label' })
    if (!labels.has(pair.labelB)) ctx.addIssue({ code: 'custom', path: ['savedPairs', index, 'labelB'], message: 'savedPairs.labelB: must name an existing label' })
  })
  if (doc.compareSummary) {
    if (!labels.has(doc.compareSummary.labelA)) ctx.addIssue({ code: 'custom', path: ['compareSummary', 'labelA'], message: 'compareSummary.labelA: must name an existing label' })
    if (!labels.has(doc.compareSummary.labelB)) ctx.addIssue({ code: 'custom', path: ['compareSummary', 'labelB'], message: 'compareSummary.labelB: must name an existing label' })
  }
})

export const formatZodError = (error) => {
  const issue = error?.issues?.[0]
  if (!issue) return 'document: validation failed'
  return issue.message.includes(':') ? issue.message : `${issue.path.join('.') || 'document'}: ${issue.message}`
}
