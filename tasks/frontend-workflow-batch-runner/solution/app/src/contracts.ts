import { z } from 'zod'

export const MODEL_IDS = ['atlas-40b', 'lyra-8b', 'quasar-mini', 'helix-2'] as const
export type ModelId = (typeof MODEL_IDS)[number]

export const MODELS: Array<{ id: ModelId; label: string; rate: number; note: string }> = [
  { id: 'atlas-40b', label: 'Atlas 40B', rate: 0.018, note: 'Deep reasoning' },
  { id: 'lyra-8b', label: 'Lyra 8B', rate: 0.006, note: 'Balanced throughput' },
  { id: 'quasar-mini', label: 'Quasar Mini', rate: 0.002, note: 'Low-latency extraction' },
  { id: 'helix-2', label: 'Helix 2', rate: 0.011, note: 'Structured generation' },
]

export const PROMPT_TEMPLATES = [
  { id: 'support-intent', name: 'Support intent classifier', text: 'Classify the support intent in: {{input}}' },
  { id: 'sentiment-brief', name: 'Sentiment brief', text: 'Return a concise sentiment label for: {{input}}' },
  { id: 'entity-extract', name: 'Entity extractor', text: 'Extract named entities as JSON from: {{input}}' },
  { id: 'quality-review', name: 'Quality reviewer', text: 'Review the response quality of: {{input}}' },
  { id: 'summary-one-line', name: 'One-line summary', text: 'Summarize in one line: {{input}}' },
  { id: 'risk-screen', name: 'Risk signal screen', text: 'Identify operational risks in: {{input}}' },
] as const

export const PROMPT_IDS = PROMPT_TEMPLATES.map((template) => template.id) as [string, ...string[]]
export const ITEM_STATUSES = ['pending', 'running', 'complete', 'failed', 'retrying', 'stopped'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const datasetRowSchema = z.object({
  input: z.string().trim().min(1, 'Dataset input is required for every row'),
  expected: z.string().optional(),
}).passthrough()

export const scheduleSchema = z.object({
  windowStart: z.iso.datetime({ message: 'Schedule windowStart must be an ISO-8601 time' }),
  windowEnd: z.iso.datetime({ message: 'Schedule windowEnd must be an ISO-8601 time' }),
}).superRefine((value, context) => {
  if (Date.parse(value.windowEnd) <= Date.parse(value.windowStart)) {
    context.addIssue({ code: 'custom', path: ['windowEnd'], message: 'Schedule windowEnd must be after windowStart' })
  }
})

export const createJobSchema = z.object({
  name: z.string().trim().min(1, 'Job name is required').max(80, 'Job name must be 80 characters or fewer'),
  promptTemplate: z.enum(PROMPT_IDS, { message: 'Prompt template must be one of the seeded templates' }),
  model: z.enum(MODEL_IDS, { message: 'Model must be atlas-40b, lyra-8b, quasar-mini, or helix-2' }),
  concurrency: z.coerce.number().int('Concurrency must be an integer').min(1, 'Concurrency must be at least 1').max(5, 'Concurrency must be at most 5'),
  dataset: z.array(datasetRowSchema).min(1, 'Dataset must contain at least one row'),
  schedule: scheduleSchema.nullable(),
})

export const reportItemSchema = z.object({
  index: z.number().int().nonnegative('Item index cannot be negative'),
  input: z.string(),
  output: z.string().nullable(),
  status: z.enum(ITEM_STATUSES, { message: 'Item status must be pending, running, complete, failed, retrying, or stopped' }),
  attempts: z.number().int().positive('Item attempts must be a positive integer'),
  latencyMs: z.number().nonnegative('Item latencyMs cannot be negative').nullable(),
  cost: z.number().nonnegative('Item cost cannot be negative'),
})

export const timelineEntrySchema = z.object({
  id: z.string().min(1, 'Timeline id is required'),
  timestamp: z.iso.datetime({ message: 'Timeline timestamp must be ISO-8601' }),
  status: z.enum(ITEM_STATUSES, { message: 'Timeline status is outside the allowed set' }),
  itemIndex: z.number().int().nonnegative('Timeline itemIndex cannot be negative'),
  label: z.string().min(1, 'Timeline label is required'),
})

export const rollupsSchema = z.object({
  completed: z.number().int().nonnegative('Rollups completed cannot be negative'),
  total: z.number().int().nonnegative('Rollups total cannot be negative'),
  failureRate: z.number().min(0, 'Rollups failureRate cannot be negative').max(100, 'Rollups failureRate cannot exceed 100'),
  estimatedRemainingMs: z.number().nonnegative('Rollups estimatedRemainingMs cannot be negative').nullable(),
  totalCost: z.number().nonnegative('Rollups totalCost cannot be negative'),
})

export const runReportSchema = z.object({
  schemaVersion: z.literal('batch-run-v1', { message: 'schemaVersion must equal batch-run-v1' }),
  exportedAt: z.iso.datetime({ message: 'exportedAt must be an ISO-8601 timestamp' }),
  job: createJobSchema,
  run: z.object({
    startedAt: z.iso.datetime({ message: 'run.startedAt must be an ISO-8601 timestamp' }),
    items: z.array(reportItemSchema),
    rollups: rollupsSchema,
    timeline: z.array(timelineEntrySchema),
  }),
})

export type DatasetRow = z.infer<typeof datasetRowSchema>
export type Schedule = z.infer<typeof scheduleSchema>
export type CreateJobPayload = z.infer<typeof createJobSchema>
export type RunReport = z.infer<typeof runReportSchema>

export const DATASET_SLICES: Array<{ id: string; name: string; description: string; rows: DatasetRow[] }> = [
  {
    id: 'support-gold',
    name: 'Support triage · 8 rows',
    description: 'Gold slice with expected outputs',
    rows: [
      { input: 'I was charged twice for my June subscription.', expected: 'billing_duplicate' },
      { input: 'The reset link expired before I could use it.', expected: 'account_access' },
      { input: 'Can I move my workspace to the enterprise plan?', expected: 'plan_change' },
      { input: 'Exports have been stuck at 92 percent since yesterday.', expected: 'technical_issue' },
      { input: 'Please delete every profile associated with my email.', expected: 'privacy_request' },
      { input: 'The invoice lists the wrong company address.', expected: 'billing_details' },
      { input: 'How do I add a second administrator?', expected: 'permissions' },
      { input: 'Our API token suddenly returns unauthorized.', expected: 'account_access' },
    ],
  },
  {
    id: 'feedback-live',
    name: 'Product feedback · 10 rows',
    description: 'Unlabeled customer feedback',
    rows: [
      { input: 'The new activity view makes audits much faster.' },
      { input: 'I cannot tell whether my batch is paused or still consuming credits.' },
      { input: 'Keyboard shortcuts would help our review team.' },
      { input: 'The mobile table is difficult to scan.' },
      { input: 'Scheduled exports saved our overnight workflow.' },
      { input: 'Please add a filter for retry count.' },
      { input: 'Model pricing should be visible before launch.' },
      { input: 'The comparison screen clearly showed the regression.' },
      { input: 'We need CSV import to preserve quoted commas.' },
      { input: 'The inspector is useful but should remember its width.' },
    ],
  },
  {
    id: 'risk-sample',
    name: 'Risk screening · 6 rows',
    description: 'Operational notes with expected severity',
    rows: [
      { input: 'Production database backups have not completed in 36 hours.', expected: 'high' },
      { input: 'A staging certificate expires next quarter.', expected: 'low' },
      { input: 'Three regions report elevated authentication latency.', expected: 'medium' },
      { input: 'No owner is assigned to the incident response rotation.', expected: 'high' },
      { input: 'Documentation screenshots use the previous navigation.', expected: 'low' },
      { input: 'Quarterly access review is six days overdue.', expected: 'medium' },
    ],
  },
]

export const modelRate = (model: ModelId) => MODELS.find((entry) => entry.id === model)?.rate ?? 0

export const formatMoney = (value: number) => `$${value.toFixed(5)}`

export function zodErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0]
  const path = issue.path.length ? `${issue.path.join('.')}: ` : ''
  return `${path}${issue.message}`
}
