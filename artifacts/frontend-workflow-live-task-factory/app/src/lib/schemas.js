import { z } from 'zod'

export const repoNameSchema = z.string().trim().regex(/^[^/\s]+\/[^/\s]+$/, 'Repository must use the owner/name shape with exactly one slash')
export const shaSchema = z.string().regex(/^[a-f0-9]{40}$/, 'base_sha must be 40-character lowercase hex')

export const fileSchema = z.object({
  filename: z.string().min(1),
  status: z.string().min(1),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
})

export const pullRequestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string(),
  merged_at: z.iso.datetime(),
  base: z.object({ sha: shaSchema }),
  files: z.array(fileSchema),
  linkedIssue: z.object({ number: z.number().int().positive(), title: z.string().min(1) }).nullable(),
})

export const addRepositorySchema = z.object({ repository: repoNameSchema })

export const rejectReasons = ['too-few-files', 'too-many-files', 'docs-only', 'no-linked-issue']
export const rejectActionSchema = z.object({ reason: z.enum(rejectReasons, { message: 'reason is required' }) })

export const githubConnectionSchema = z.object({
  githubToken: z.string().min(1, 'github-token is required'),
})

export const aiConnectionSchema = z.object({
  aiBaseUrl: z.url('ai-base-url must be a valid URL'),
  aiApiKey: z.string().min(1, 'ai-api-key is required'),
})

export const difficultySchema = z.enum(['easy', 'medium', 'hard'])

export const taskPackageSchema = z.object({
  schemaVersion: z.literal('live-task-package-v1', { message: 'schemaVersion must be live-task-package-v1' }),
  repo: repoNameSchema,
  pr_number: z.number().int().positive('pr_number must be a positive integer'),
  base_sha: shaSchema,
  language: z.string().trim().min(1, 'language is required'),
  difficulty: difficultySchema,
  source_file_count: z.number().int().min(3, 'source_file_count must be from 3 to 10').max(10, 'source_file_count must be from 3 to 10'),
  created_at: z.iso.datetime({ message: 'created_at must be an ISO 8601 date-time' }),
  instruction: z.string().trim().min(1, 'instruction is required'),
  task_config: z.string().trim().min(1, 'task_config is required'),
  patch_note: z.string().trim().min(1, 'patch_note is required'),
})

export const batchItemSchema = z.object({
  repo: repoNameSchema,
  pr_number: z.number().int().positive(),
  outcome: z.enum(['packaged', 'trivial', 'failed', 'skipped']),
})

export const batchReportSchema = z.object({
  total: z.number().int().nonnegative(),
  packaged: z.number().int().nonnegative(),
  trivial: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  items: z.array(batchItemSchema),
}).superRefine((report, ctx) => {
  const sum = report.packaged + report.trivial + report.failed + report.skipped
  if (sum !== report.total) ctx.addIssue({ code: 'custom', path: ['total'], message: 'outcome counts must sum to total' })
  if (report.items.length !== report.total) ctx.addIssue({ code: 'custom', path: ['items'], message: 'items length must equal total' })
})

export const chatCompletionsRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string() })),
  stream: z.literal(true),
})

export function importErrors(value) {
  const parsed = taskPackageSchema.safeParse(value)
  if (parsed.success) return { data: parsed.data, errors: [] }
  const errors = parsed.error.issues.map((issue) => ({
    field: issue.path.join('.') || 'bundle',
    message: issue.message,
  }))
  return { data: null, errors }
}
