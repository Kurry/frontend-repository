import { z } from 'zod'
import { columnIds } from './data.js'

const columnSchema = z.enum(columnIds)
const statusSchema = z.enum(['pending', 'running', 'retrying', 'failed', 'complete'])
const taskStatusSchema = z.enum(['pending', 'running', 'complete', 'retrying', 'failed'])

export const createCardSchema = (promptIds, assigneeIds) => z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Title must be 120 characters or fewer.'),
  description: z.string().max(2000, 'Description must be 2000 characters or fewer.'),
  attached_prompt: z.union([z.literal(''), z.enum(promptIds)], { error: 'Attached prompt must be a seeded prompt.' })
    .transform((value) => value || null),
  assignee: z.union([z.literal(''), z.enum(assigneeIds)], { error: 'Assignee must be a seeded assignee.' })
    .transform((value) => value || null),
  column: columnSchema,
  position: z.number().int().nonnegative(),
})

export const detailCardSchema = (assigneeIds) => z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Title must be 120 characters or fewer.'),
  description: z.string().max(2000, 'Description must be 2000 characters or fewer.'),
  assignee: z.union([z.literal(''), z.enum(assigneeIds)], { error: 'Assignee must be a seeded assignee.' })
    .transform((value) => value || null),
})

export const commentSchema = z.object({
  comment: z.string().trim().min(1, 'Comment is required.').max(1000, 'Comment must be 1000 characters or fewer.'),
})

const promptSchema = z.object({ id: z.string().min(1), title: z.string().min(1), text: z.string() })
const assigneeSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), initials: z.string().min(1), color: z.string().min(1),
})
const exportedTaskSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), status: taskStatusSchema, attempts: z.number().int().nonnegative(),
})
const exportedCommentSchema = z.object({
  id: z.string().min(1), body: z.string().min(1), created_at: z.string().datetime({ offset: true }),
})
const exportedCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  column: columnSchema,
  position: z.number().int().nonnegative(),
  assignee: z.string().nullable(),
  attached_prompt: z.string().nullable(),
  status: statusSchema,
  tasks: z.array(exportedTaskSchema),
  comments: z.array(exportedCommentSchema),
})

export const boardImportSchema = z.object({
  board: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  columns: z.array(z.object({
    id: columnSchema, name: z.string().min(1), wip_limit: z.number().int().nonnegative().nullable(), card_ids: z.array(z.string()),
  })).length(4),
  cards: z.array(exportedCardSchema),
  prompts: z.array(promptSchema).min(1),
  assignees: z.array(assigneeSchema).min(1),
}).superRefine((payload, context) => {
  const columnSet = new Set(payload.columns.map((column) => column.id))
  if (columnSet.size !== 4 || columnIds.some((id) => !columnSet.has(id))) {
    context.addIssue({ code: 'custom', path: ['columns'], message: 'Import columns must contain the four board column ids exactly once.' })
  }
  const cardMap = new Map(payload.cards.map((card) => [card.id, card]))
  if (cardMap.size !== payload.cards.length) {
    context.addIssue({ code: 'custom', path: ['cards'], message: 'Import card ids must be unique.' })
  }
  const promptIds = new Set(payload.prompts.map((prompt) => prompt.id))
  const assigneeIds = new Set(payload.assignees.map((assignee) => assignee.id))
  const ordered = []
  payload.columns.forEach((column) => {
    column.card_ids.forEach((id, position) => {
      ordered.push(id)
      const card = cardMap.get(id)
      if (!card || card.column !== column.id || card.position !== position) {
        context.addIssue({ code: 'custom', path: ['columns'], message: `Import card order is inconsistent for ${id}.` })
      }
    })
  })
  if (new Set(ordered).size !== payload.cards.length || ordered.length !== payload.cards.length) {
    context.addIssue({ code: 'custom', path: ['columns'], message: 'Import must reference every card exactly once.' })
  }
  payload.cards.forEach((card, index) => {
    if (card.assignee && !assigneeIds.has(card.assignee)) {
      context.addIssue({ code: 'custom', path: ['cards', index, 'assignee'], message: 'Import assignee must exist in the assignee library.' })
    }
    if (card.attached_prompt && !promptIds.has(card.attached_prompt)) {
      context.addIssue({ code: 'custom', path: ['cards', index, 'attached_prompt'], message: 'Import attached_prompt must exist in the prompt library.' })
    }
  })
})

export const importFormSchema = z.object({
  import: z.string().min(1, 'Import field is required.'),
}).superRefine((value, context) => {
  let parsed
  try {
    parsed = JSON.parse(value.import)
  } catch {
    context.addIssue({ code: 'custom', path: ['import'], message: 'Import field must contain valid JSON.' })
    return
  }
  const result = boardImportSchema.safeParse(parsed)
  if (!result.success) {
    const detail = result.error.issues[0]?.message || 'payload does not match the board contract.'
    context.addIssue({ code: 'custom', path: ['import'], message: `Import field is invalid: ${detail}` })
  }
}).transform((value) => ({ import: boardImportSchema.parse(JSON.parse(value.import)) }))
