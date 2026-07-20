import { z } from 'zod'

export const stepTypes = ['navigate', 'click', 'type', 'extract', 'wait', 'screenshot', 'assert_text']
export const typeLabels = {
  navigate: 'Navigate', click: 'Click', type: 'Type', extract: 'Extract', wait: 'Wait',
  screenshot: 'Screenshot', assert_text: 'Assert Text',
}

const selector = z.string().trim().min(1, 'Selector is required')
const variable = z.string().trim().min(1, 'Variable name is required').regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Variable name must start with a letter or underscore')

export const paramSchemas = {
  navigate: z.object({ url: z.url('URL must be a valid URL') }),
  click: z.object({ selector }),
  type: z.object({ selector, text: z.string().min(1, 'Text is required') }),
  extract: z.object({ selector, variable }),
  wait: z.object({ ms: z.coerce.number('Milliseconds must be numeric').int('Milliseconds must be a whole number').positive('Milliseconds must be a positive integer').max(60000, 'Milliseconds must be 60,000 or less') }),
  screenshot: z.object({}),
  assert_text: z.object({ selector, expected_text: z.string().min(1, 'Expected text is required') }),
}

export const stepSchema = z.object({
  id: z.string(), order: z.number().int().positive(), type: z.enum(stepTypes),
  params: z.record(z.string(), z.unknown()), disabled: z.boolean(), label: z.string(),
}).superRefine((step, ctx) => {
  const result = paramSchemas[step.type].safeParse(step.params)
  if (!result.success) result.error.issues.forEach(issue => ctx.addIssue({ ...issue, path: ['params', ...issue.path] }))
})

export const scheduleSchema = z.object({
  enabled: z.boolean(),
  time: z.string(),
  interval: z.enum(['hourly', 'daily', 'weekly']),
}).superRefine((schedule, ctx) => {
  if (schedule.enabled && !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time)) {
    ctx.addIssue({ code: 'custom', path: ['time'], message: 'Schedule time is required' })
  }
  if (schedule.enabled && !schedule.interval) {
    ctx.addIssue({ code: 'custom', path: ['interval'], message: 'Schedule interval is required' })
  }
})

export const newScriptSchema = z.object({
  name: z.string().trim().min(1, 'Script name is required'),
  target_url: z.url('Target URL must be a valid URL'),
  description: z.string().optional(),
})

export const scriptDefinitionSchema = z.object({
  script: z.object({
    id: z.string(), name: z.string().min(1), target_url: z.url(), version: z.number().int().positive(),
    schedule: scheduleSchema, steps: z.array(stepSchema),
  }),
})

export const runReportSchema = z.object({
  run: z.object({
    id: z.string(), trigger: z.enum(['manual', 'schedule']), start_time: z.string(), duration: z.number().nonnegative(),
    totals: z.object({ passed: z.number(), failed: z.number(), skipped: z.number(), retries: z.number() }),
    steps: z.array(z.object({
      order: z.number(), type: z.enum(stepTypes), status: z.enum(['pass', 'fail', 'skipped']), attempts: z.number(),
      error_reason: z.string().optional(), extracted_name: z.string().optional(), extracted_value: z.string().optional(),
    })),
  }),
})

export function emptyParams(type) {
  return { navigate: { url: '' }, click: { selector: '' }, type: { selector: '', text: '' }, extract: { selector: '', variable: '' }, wait: { ms: 1000 }, screenshot: {}, assert_text: { selector: '', expected_text: '' } }[type]
}

export function validateStep(step) {
  const parsed = paramSchemas[step.type].safeParse(step.params)
  if (parsed.success) return {}
  return Object.fromEntries(parsed.error.issues.map(i => [String(i.path[0] || 'field'), i.message]))
}
