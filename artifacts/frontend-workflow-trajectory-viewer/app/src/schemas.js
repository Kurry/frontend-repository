import { z } from 'zod'

export const stageValues = ['planning', 'tool-use', 'verification', 'recovery']
export const causeValues = ['wrong-tool', 'missing-context', 'hallucinated-path', 'timeout']
export const behaviorValues = ['loops', 'abandons', 'invents-files', 'ignores-errors']
export const impactValues = ['score-zero', 'partial-credit', 'flaky-pass', 'false-pass']

export const annotationSchema = z.object({
  note_text: z.string().trim().min(1, 'note_text must be a non-empty string').max(500, 'note_text must be at most 500 characters'),
  step_index: z.number().int('step_index must be an integer'),
})

export const failureReportSchema = z.object({
  stage: z.enum(stageValues, { message: 'stage must be selected' }),
  root_cause: z.enum(causeValues, { message: 'root_cause must be selected' }),
  behavior: z.enum(behaviorValues, { message: 'behavior must be selected' }),
  impact: z.enum(impactValues, { message: 'impact must be selected' }),
  evidence: z.string().trim().min(20, 'evidence must be at least 20 characters').max(2000, 'evidence must be at most 2000 characters'),
  implicated_steps: z.array(z.number().int()).min(1, 'implicated_steps must contain at least one step'),
})

export const reviewPackageSchema = z.object({
  schemaVersion: z.literal('trajectory-viewer.review-package.v1', { message: 'schemaVersion must equal trajectory-viewer.review-package.v1' }),
  exportedAt: z.iso.datetime({ message: 'exportedAt must be an ISO-8601 timestamp' }),
  trial_id: z.string().min(1, 'trial_id is required'),
  task_id: z.string().min(1, 'task_id is required'),
  model: z.string().min(1, 'model is required'),
  reward: z.number().min(0).max(1),
  outcome: z.enum(['pass', 'fail'], { message: 'outcome must be pass or fail' }),
  duration: z.string().min(1, 'duration is required'),
  step_count: z.number().int().positive(),
  annotations: z.array(annotationSchema),
  failure_report: failureReportSchema.nullable(),
})

export function validateStepIndices(indices, trial) {
  const valid = new Set(trial.steps.map((step) => step.index))
  return indices.every((index) => valid.has(Number(index)))
}
