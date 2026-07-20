import { z } from 'zod'

export const DOCUMENT_TYPES = ['CLAUDE.md', 'AGENTS.md', '.cursorrules', 'README'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const PATTERN_KEYS = ['claude-md', 'agents-md', 'cursorrules', 'readme'] as const
export type PatternKey = (typeof PATTERN_KEYS)[number]

export const repositoryPathSchema = z
  .string({ error: 'Path is required.' })
  .trim()
  .min(1, 'Path must not be empty or whitespace only.')
  .max(260, 'Path must be 260 characters or fewer.')

export const displayNameSchema = z
  .string()
  .trim()
  .max(80, 'Display name must be 80 characters or fewer.')
  .optional()
  .or(z.literal(''))

export const repositoryFormSchema = z.object({
  path: repositoryPathSchema,
  displayName: displayNameSchema,
})

export type RepositoryFormValues = z.input<typeof repositoryFormSchema>

export const findingSchema = z.object({
  severity: z.enum(['info', 'warning', 'error'], { error: 'Finding severity is invalid.' }),
  message: z.string().trim().min(1, 'Finding message must not be empty.'),
  line: z.number().int().positive('Finding line must be a positive integer.').optional(),
}).strict()

export const documentSchema = z.object({
  path: z.string().trim().min(1, 'Document path must not be empty.'),
  type: z.enum(DOCUMENT_TYPES, { error: 'Document type must be CLAUDE.md, AGENTS.md, .cursorrules, or README.' }),
  content: z.string({ error: 'Document content must be a string.' }),
  findings: z.array(findingSchema, { error: 'Document findings must be an array.' }),
}).strict()

export const patternsSchema = z.object({
  'claude-md': z.boolean(),
  'agents-md': z.boolean(),
  cursorrules: z.boolean(),
  readme: z.boolean(),
}).strict().refine((value) => Object.values(value).some(Boolean), {
  message: 'Patterns must have at least one enabled document pattern.',
  path: ['patterns'],
})

export const exportRepositorySchema = z.object({
  path: repositoryPathSchema,
  displayName: displayNameSchema,
  lastScanned: z.union([
    z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Last scanned must be an ISO-8601 timestamp.'),
    z.null(),
  ]).optional(),
  documentCount: z.number().int().nonnegative('Document count must be a non-negative integer.'),
  documents: z.array(documentSchema),
}).strict().superRefine((value, context) => {
  if (value.documentCount !== value.documents.length) {
    context.addIssue({
      code: 'custom',
      path: ['documentCount'],
      message: 'Document count must match the repository documents length.',
    })
  }
})

export const scanIndexSchema = z.object({
  schemaVersion: z.literal('repo-scan-index/v1', { error: 'schemaVersion must equal repo-scan-index/v1.' }),
  exportedAt: z.string().min(1, 'exportedAt is required.').refine(
    (value) => !Number.isNaN(Date.parse(value)),
    'exportedAt must be an ISO-8601 timestamp.',
  ),
  patterns: patternsSchema,
  repositories: z.array(exportRepositorySchema, { error: 'repositories must be an array.' }),
}).strict()

export type ScanIndexPayload = z.infer<typeof scanIndexSchema>

export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Scan index is invalid.'
  const field = issue.path.length ? issue.path.join('.') : 'scan index'
  return `${field}: ${issue.message}`
}

export const importFormSchema = z.object({
  payload: z.string().trim().min(1, 'Scan Index JSON is required.'),
}).superRefine(({ payload }, context) => {
  if (!payload.trim()) return
  try {
    const parsed: unknown = JSON.parse(payload)
    const result = scanIndexSchema.safeParse(parsed)
    if (!result.success) {
      const issue = result.error.issues[0]
      context.addIssue({
        code: 'custom',
        path: ['payload'],
        message: issue ? `${issue.path.join('.') || 'scan index'}: ${issue.message}` : 'Scan index is invalid.',
      })
    }
  } catch {
    context.addIssue({ code: 'custom', path: ['payload'], message: 'Scan Index JSON contains malformed JSON.' })
  }
})

export const patternFormSchema = z.object({ patterns: patternsSchema })
