import { z } from 'zod'

export const modelValues = ['quartz-arbiter-2', 'sable-jury-9', 'cinder-panel-1']
export const aggregationValues = ['weighted-mean', 'required-pass', 'all-pass']

const trimmed = (label, max) => z.string({ required_error: `${label} is required` })
  .trim()
  .min(1, `${label} is required`)
  .max(max, `${label} must be ${max} characters or fewer`)

export const CriterionSchema = z.object({
  id: trimmed('ID', 64).regex(/^[a-z0-9-]+$/, 'ID must use lowercase letters, digits, and hyphens only'),
  name: trimmed('Name', 80),
  description: trimmed('Description', 2000),
  type: z.enum(['binary', 'likert'], { message: 'Type must be binary or likert' }),
  likertMin: z.number({ invalid_type_error: 'Likert min is required', required_error: 'Likert min is required' }).int('Likert min must be an integer').min(1, 'Likert min must be at least 1').max(10, 'Likert min must be 10 or less').nullish(),
  likertMax: z.number({ invalid_type_error: 'Likert max is required', required_error: 'Likert max is required' }).int('Likert max must be an integer').min(1, 'Likert max must be at least 1').max(10, 'Likert max must be 10 or less').nullish(),
  weight: z.number({ invalid_type_error: 'Weight is required' })
    .min(0.5, 'Weight must be between 0.5 and 5')
    .max(5, 'Weight must be between 0.5 and 5')
    .refine((value) => Number.isInteger(value * 2), 'Weight must use 0.5 steps'),
  importance: z.enum(['must-have', 'nice-to-have'], { message: 'Importance must be must-have or nice-to-have' }),
}).strict().superRefine((value, ctx) => {
  if (value.type === 'likert') {
    if (value.likertMin == null) ctx.addIssue({ code: 'custom', path: ['likertMin'], message: 'Likert min is required for a likert criterion' })
    if (value.likertMax == null) ctx.addIssue({ code: 'custom', path: ['likertMax'], message: 'Likert max is required for a likert criterion' })
    if (value.likertMin != null && value.likertMax != null && value.likertMin >= value.likertMax) {
      ctx.addIssue({ code: 'custom', path: ['likertMin'], message: 'Likert min must be lower than likert max' })
      ctx.addIssue({ code: 'custom', path: ['likertMax'], message: 'Likert max must be greater than likert min' })
    }
  } else if (value.likertMin != null || value.likertMax != null) {
    ctx.addIssue({ code: 'custom', path: ['likertMin'], message: 'Likert range must be empty for binary criteria' })
  }
})

export const SemverSchema = z.string().trim().regex(/^\d+\.\d+\.\d+$/, 'Version must use MAJOR.MINOR.PATCH')

const HistorySchema = z.object({
  id: z.string(),
  version: SemverSchema,
  timestamp: z.string(),
  summary: z.string(),
  diff: z.object({
    kind: z.enum(['added', 'removed', 'changed']),
    criterionId: z.string(),
    before: CriterionSchema.nullable(),
    after: CriterionSchema.nullable(),
  }),
}).passthrough()

export const RubricDocumentSchema = z.object({
  schemaVersion: z.literal('rubric-document-v1', { message: 'schemaVersion must be rubric-document-v1' }),
  name: trimmed('Name', 120),
  version: SemverSchema,
  arbiterModel: z.enum(modelValues, { message: `arbiterModel must be one of ${modelValues.join(', ')}` }),
  aggregationMode: z.enum(aggregationValues, { message: `aggregationMode must be one of ${aggregationValues.join(', ')}` }),
  criteria: z.array(CriterionSchema),
  history: z.array(HistorySchema).optional(),
}).superRefine((doc, ctx) => {
  const ids = new Set()
  doc.criteria.forEach((criterion, index) => {
    if (ids.has(criterion.id)) ctx.addIssue({ code: 'custom', path: ['criteria', index, 'id'], message: `ID ${criterion.id} is already in use` })
    ids.add(criterion.id)
  })
})

export const RubricPackageSchema = z.object({
  schemaVersion: z.literal('rubric-package-v1', { message: 'schemaVersion must be rubric-package-v1' }),
  library: z.literal('Rubric Studio', { message: 'library must be Rubric Studio' }),
  rubrics: z.array(RubricDocumentSchema),
  generatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)) && value.endsWith('Z'), 'generatedAt must be an ISO-8601 datetime ending in Z'),
})

export function formatZodError(error) {
  const first = error?.issues?.[0]
  if (!first) return 'Package is invalid'
  const field = first.path.length ? first.path.join('.') : 'package'
  return `${field}: ${first.message}`
}
