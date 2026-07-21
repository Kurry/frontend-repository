import { z } from 'zod'
import { ASSETS, MODELS, PERSONAS, TECHNIQUES } from './data'

export const variableNamePattern = /^[A-Za-z0-9_]+$/

export const variableInsertSchema = z.object({
  name: z.string().min(1, 'Name is required. Use letters, digits, or underscores only.').max(64, 'Name must be 64 characters or fewer.').regex(variableNamePattern, 'Name may contain letters, digits, and underscores only.'),
})

export const techniqueSchema = z.enum(TECHNIQUES, {
  error: `Technique must be one of: ${TECHNIQUES.join(', ')}.`,
})

export const libraryPromptInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(80, 'Title must be 80 characters or fewer.'),
  technique: techniqueSchema,
})

export const libraryPromptSchema = z.object({
  title: z.string().trim().min(1).max(80),
  technique: techniqueSchema,
  promptText: z.string(),
  bindings: z.record(z.string().regex(variableNamePattern, 'Binding key must contain letters, digits, or underscores only.'), z.string()),
  attachments: z.array(z.string()).refine((ids) => ids.every((id) => ASSETS.some((asset) => asset.id === id)), 'Attachments must use seeded asset ids.'),
  personaId: z.string().nullable().optional().refine((id) => id == null || PERSONAS.some((persona) => persona.id === id), 'personaId must use a seeded persona id.'),
})

export const messageSchema = z.object({
  role: z.enum(['system', 'user'], { error: 'Messages role must be system or user.' }),
  content: z.string(),
})

export const runRequestSchema = z.object({
  model: z.string().refine((id) => MODELS.some((model) => model.id === id), 'Model must use a seeded model id.'),
  messages: z.array(messageSchema),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(4096),
})

export const promptPackageSchema = z.object({
  schemaVersion: z.literal('prompt-package-v1', { error: 'schemaVersion must be exactly prompt-package-v1.' }),
  model: z.string().refine((id) => MODELS.some((model) => model.id === id), 'Model must use a seeded model id.'),
  promptText: z.string(),
  messages: z.array(messageSchema).min(1, 'Messages must include a user message.'),
  bindings: z.record(z.string().regex(variableNamePattern, 'Bindings keys may contain letters, digits, and underscores only.'), z.string()),
  attachments: z.array(z.object({ id: z.string(), name: z.string() })).refine((items) => items.every((item) => ASSETS.some((asset) => asset.id === item.id && asset.name === item.name)), 'Attachments must match the seeded asset set.'),
  persona: z.object({ id: z.string(), name: z.string(), preface: z.string() }).nullable().optional(),
  technique: techniqueSchema.optional(),
  latestRun: z.object({
    status: z.enum(['complete', 'stopped']),
    model: z.string(),
    summary: z.string(),
    request: runRequestSchema,
  }).optional(),
}).superRefine((value, context) => {
  const expected = value.persona
    ? [{ role: 'system', content: value.persona.preface }, { role: 'user', content: value.promptText }]
    : [{ role: 'user', content: value.promptText }]
  if (JSON.stringify(value.messages) !== JSON.stringify(expected)) {
    context.addIssue({ code: 'custom', path: ['messages'], message: 'Messages must contain the persona system preface when present, followed by the promptText user message.' })
  }
})

export const importPasteSchema = z.object({
  json: z.string().min(1, 'Import JSON is required.'),
}).superRefine(({ json }, context) => {
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    context.addIssue({ code: 'custom', path: ['json'], message: `Import JSON parse error: ${error.message}. Paste valid JSON and try again.` })
    return
  }
  const result = promptPackageSchema.safeParse(parsed)
  if (!result.success) context.addIssue({ code: 'custom', path: ['json'], message: firstZodError(result.error) })
})

export function firstZodError(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'The package does not match the PromptPackage field contract.'
  const field = issue.path?.length ? issue.path.join('.') : 'package'
  return `${field}: ${issue.message}`
}
