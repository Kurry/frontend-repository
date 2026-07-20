import { z } from 'zod'

const intField = (label) => z.string()
  .min(1, `${label} is required`)
  .regex(/^\d+$/, `${label} must be a whole number`)
  .refine((value) => Number(value) >= 1 && Number(value) <= 500, `${label} must be between 1 and 500`)
  .transform(Number)

export const repositoryIds = ['quartz-orm', 'copperline', 'fernweh-gateway', 'lattice-db']

export const createTaskSchema = z.object({
  repository: z.enum(repositoryIds, { message: 'Repository is required' }),
  pullRequestNumber: z.string()
    .min(1, 'Pull-request number is required')
    .regex(/^\d{1,6}$/, 'Pull-request number must be a positive integer of 1–6 digits')
    .refine((value) => Number(value) > 0, 'Pull-request number must be positive'),
  minFiles: intField('Minimum file bound'),
  maxFiles: intField('Maximum file bound'),
}).superRefine((data, ctx) => {
  if (typeof data.minFiles === 'number' && typeof data.maxFiles === 'number' && data.minFiles > data.maxFiles) {
    const message = 'Minimum file bound must not exceed maximum file bound'
    ctx.addIssue({ code: 'custom', path: ['minFiles'], message })
    ctx.addIssue({ code: 'custom', path: ['maxFiles'], message })
  }
})

const stageSchema = z.object({
  name: z.enum(['Fetch', 'Evaluate', 'Skeleton', 'Generate', 'Validate']),
  status: z.enum(['pending', 'running', 'complete', 'failed']),
  attemptCount: z.number().int().min(1),
})

export const taskManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  repository: z.enum(repositoryIds),
  pullRequestNumber: z.number().int().positive().max(999999),
  minFiles: z.number().int().min(1).max(500),
  maxFiles: z.number().int().min(1).max(500),
  checks: z.object({ skeleton: z.literal(true), validate: z.literal(true) }),
  stages: z.array(stageSchema).length(5),
  generatedAt: z.string().datetime({ offset: false }),
}).refine((data) => data.minFiles <= data.maxFiles, {
  message: 'minFiles must not exceed maxFiles',
  path: ['maxFiles'],
})
