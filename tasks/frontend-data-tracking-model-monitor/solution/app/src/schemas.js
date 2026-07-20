import { z } from 'zod'

const namedMessage = (name, rule) => `${name} ${rule}`

export const modelSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  context_window: z.number().int().positive(),
  input_cost_per_1k: z.number().nonnegative(),
  output_cost_per_1k: z.number().nonnegative(),
  pricing_tier: z.enum(['free', 'paid']),
  pinned: z.boolean(),
})

export const usageEventSchema = z.object({
  timestamp: z.iso.datetime(),
  model: z.string().min(1),
  request_label: z.string().min(1).max(80),
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
})

export const alertSchema = z.object({
  alerts_enabled: z.boolean(),
  min_context_window: z.number({ error: namedMessage('Minimum context window', 'is required') })
    .int(namedMessage('Minimum context window', 'must be a whole number'))
    .nonnegative(namedMessage('Minimum context window', 'must be 0 or greater')),
})

export const budgetSchema = z.object({
  session_budget_usd: z.string().min(1, namedMessage('Session budget', 'is required'))
    .regex(/^\d+(?:\.\d{1,2})?$/, namedMessage('Session budget', 'must be a number with at most 2 decimal places'))
    .refine((value) => Number(value) > 0, namedMessage('Session budget', 'must be greater than 0'))
    .refine((value) => Number(value) <= 100000, namedMessage('Session budget', 'must be at most $100,000')),
})

export const makeUsageFormSchema = (catalogNames) => z.object({
  model: z.string().min(1, namedMessage('Model', 'is required'))
    .refine((value) => catalogNames.includes(value), namedMessage('Model', 'must exactly match the catalog')),
  request_label: z.string().trim().min(1, namedMessage('Request label', 'is required')).max(80, namedMessage('Request label', 'must be 80 characters or fewer')),
  prompt_tokens: z.number({ error: namedMessage('Prompt tokens', 'is required') })
    .int(namedMessage('Prompt tokens', 'must be a whole number'))
    .nonnegative(namedMessage('Prompt tokens', 'must be 0 or greater')),
  completion_tokens: z.number({ error: namedMessage('Completion tokens', 'is required') })
    .int(namedMessage('Completion tokens', 'must be a whole number'))
    .nonnegative(namedMessage('Completion tokens', 'must be 0 or greater')),
})

export const sessionReportSchema = z.object({
  schema_version: z.literal('routing-session-report-v1'),
  exported_at: z.iso.datetime(),
  catalog: z.array(modelSchema),
  usage_events: z.array(usageEventSchema),
  cost_rollups: z.array(z.object({
    model: z.string().min(1),
    requests: z.number().int().nonnegative(),
    subtotal: z.number().nonnegative(),
  })),
  session_total: z.number().nonnegative(),
  total_requests: z.number().int().nonnegative(),
  alert_config: alertSchema,
  session_budget_usd: z.number().positive().max(100000)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < Number.EPSILON * 100, 'Session budget must have at most 2 decimal places'),
  compare_selected: z.array(z.string()),
  pinned_models: z.array(z.string()),
})

export const importInputSchema = z.object({
  import_json: z.string().min(1, namedMessage('Import field', 'is required')).superRefine((value, ctx) => {
    try {
      const parsed = JSON.parse(value)
      const result = sessionReportSchema.safeParse(parsed)
      if (!result.success) {
        ctx.addIssue({ code: 'custom', message: `Import field is invalid: ${result.error.issues[0]?.path.join('.') || 'required report fields'}` })
      }
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Import field must contain valid Session JSON' })
    }
  }),
})
