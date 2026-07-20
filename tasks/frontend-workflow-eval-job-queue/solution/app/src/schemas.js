import { z } from 'zod'

export const DATASETS = ['orchard-qa', 'ledgerline-suite']
export const AGENTS = ['scouthand', 'forgeline']
export const MODELS = ['cobalt-4', 'meridian-xl', 'willow-mini']
export const STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled']
export const RATE_LIMITS = ['normal', 'throttled', 'paused']

const requiredChoice = (values, name) =>
  z.string().min(1, `${name} is required`).refine((value) => values.includes(value), {
    message: `${name} must be one of ${values.join(', ')}`,
  })

export const createJobSchema = z
  .object({
    dataset: requiredChoice(DATASETS, 'dataset'),
    agent: requiredChoice(AGENTS, 'agent'),
    model: requiredChoice(MODELS, 'model'),
    trialCount: z.coerce
      .number({ error: 'trialCount must be a number' })
      .int('trialCount must be a whole number')
      .min(1, 'trialCount must be at least 1')
      .max(10, 'trialCount must be at most 10'),
    sweepModel: z.union([z.literal(''), z.enum(MODELS)]).optional(),
  })
  .superRefine((value, context) => {
    if (value.sweepModel && value.sweepModel === value.model) {
      context.addIssue({
        code: 'custom',
        path: ['sweepModel'],
        message: 'sweepModel must differ from model',
      })
    }
  })

const trialSchema = z
  .object({
    id: z.string().min(1, 'trial id must be a non-empty string'),
    status: z.enum(STATUSES, { error: 'trial status is outside the allowed set' }),
    reward: z.number().nullable(),
    duration: z.number().nonnegative('trial duration cannot be negative').nullable(),
    retryCount: z.number().int().nonnegative('trial retryCount cannot be negative'),
    errorCategory: z.string().min(1).nullable(),
  })
  .superRefine((trial, context) => {
    if (trial.status === 'completed' && trial.reward === null) {
      context.addIssue({ code: 'custom', path: ['reward'], message: 'completed trial reward must be a number' })
    }
    if (trial.status === 'completed' && trial.duration === null) {
      context.addIssue({ code: 'custom', path: ['duration'], message: 'completed trial duration must be a number' })
    }
    if (trial.status !== 'completed' && (trial.reward !== null || trial.duration !== null)) {
      context.addIssue({ code: 'custom', path: ['reward'], message: 'unfinished trial reward and duration must be null' })
    }
    if (trial.status === 'failed' && !trial.errorCategory) {
      context.addIssue({ code: 'custom', path: ['errorCategory'], message: 'failed trial errorCategory is required' })
    }
    if (trial.status !== 'failed' && trial.errorCategory !== null) {
      context.addIssue({ code: 'custom', path: ['errorCategory'], message: 'non-failed trial errorCategory must be null' })
    }
  })

const jobSchema = z.object({
  id: z.string().min(1, 'job id must be a non-empty string'),
  dataset: z.enum(DATASETS, { error: 'job dataset is outside the allowed set' }),
  agent: z.enum(AGENTS, { error: 'job agent is outside the allowed set' }),
  model: z.enum(MODELS, { error: 'job model is outside the allowed set' }),
  trialCount: z.number().int().min(1, 'job trialCount must be at least 1').max(10, 'job trialCount must be at most 10'),
  status: z.enum(STATUSES, { error: 'job status is outside the allowed set' }),
  progressComplete: z.number().int().nonnegative('job progressComplete cannot be negative'),
  progressTotal: z.number().int().nonnegative('job progressTotal cannot be negative'),
  submittedAt: z.iso.datetime({ error: 'job submittedAt must be ISO-8601' }),
  trials: z.array(trialSchema),
})

const providerSchema = z.object({
  id: z.string().min(1, 'provider id must be a non-empty string'),
  name: z.string().min(1, 'provider name must be a non-empty string'),
  queueDepth: z.number().int().nonnegative('provider queueDepth cannot be negative'),
  inFlight: z.number().int().nonnegative('provider inFlight cannot be negative'),
  rateLimit: z.enum(RATE_LIMITS, { error: 'provider rateLimit is outside the allowed set' }),
})

const timelineSchema = z.object({
  id: z.string().min(1, 'timeline id must be a non-empty string'),
  timestamp: z.iso.datetime({ error: 'timeline timestamp must be ISO-8601' }),
  status: z.enum(STATUSES, { error: 'timeline status is outside the allowed set' }),
  kind: z.enum(['job', 'trial'], { error: 'timeline kind must be job or trial' }),
  label: z.string().min(1, 'timeline label must be a non-empty string'),
})

export const queueSnapshotSchema = z.object({
  schemaVersion: z.literal('eval-queue-v1', { error: 'schemaVersion must equal eval-queue-v1' }),
  exportedAt: z.iso.datetime({ error: 'exportedAt must be ISO-8601' }),
  jobs: z.array(jobSchema),
  providers: z.array(providerSchema),
  aggregates: z.object({
    meanRewardByModel: z.record(z.string(), z.number()),
    totalCost: z.number().nonnegative('aggregates totalCost cannot be negative'),
  }),
  timeline: z.array(timelineSchema),
})

export function firstZodError(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'Queue snapshot does not match the required contract'
  const field = issue.path?.length ? issue.path.join('.') : 'snapshot'
  return `${field}: ${issue.message}`
}
