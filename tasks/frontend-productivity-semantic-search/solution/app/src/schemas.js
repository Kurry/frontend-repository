import { z } from 'zod'

export const DOCUMENT_TYPES = ['guide', 'reference', 'prompt', 'checklist', 'paper', 'note']
export const FILTER_KINDS = ['tag', 'type', 'before']

export const DocumentSchema = z.object({
  id: z.string().trim().min(1, 'id is required').optional(),
  title: z.string().trim().min(1, 'title is required').max(200, 'title must be 200 characters or fewer'),
  body: z.string().trim().min(20, 'body must contain at least 20 characters').max(20000, 'body must be 20,000 characters or fewer'),
  type: z.enum(DOCUMENT_TYPES, { error: 'type must be guide, reference, prompt, checklist, paper, or note' }),
  tags: z.array(z.string().trim().min(1, 'tags cannot be empty')).max(12, 'tags must contain 12 items or fewer').superRefine((tags, ctx) => {
    const values = tags.map((tag) => tag.toLowerCase())
    if (new Set(values).size !== values.length) ctx.addIssue({ code: 'custom', message: 'tags must not contain duplicates' })
  }),
})

export const FilterSchema = z.object({ kind: z.enum(FILTER_KINDS), value: z.string().trim().min(1) })

export const SavedSearchSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80, 'name must be 80 characters or fewer'),
  query: z.string(),
  filters: z.array(FilterSchema),
  threshold: z.number().min(0).max(1).refine((value) => Number.isInteger(value * 20), 'threshold must use 0.05 increments'),
})

export const SearchReportSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  request: z.object({ query: z.string(), filters: z.array(FilterSchema), threshold: z.number().min(0).max(1) }),
  results: z.array(z.object({
    id: z.string().min(1), title: z.string(), type: z.enum(DOCUMENT_TYPES), score: z.number().min(0).max(1),
    snippet: z.string(), highlights: z.array(z.string()), feedback: z.enum(['up', 'down', 'none']),
  })),
})

export const LibraryPackageSchema = z.object({
  schemaVersion: z.literal(1),
  library: z.literal('Semantic Search Library'),
  documents: z.array(DocumentSchema.extend({ id: z.string().trim().min(1, 'documents.id is required') })),
  savedSearches: z.array(SavedSearchSchema).superRefine((items, ctx) => {
    const names = items.map((item) => item.name.toLowerCase())
    if (new Set(names).size !== names.length) ctx.addIssue({ code: 'custom', message: 'savedSearches.name must be unique' })
  }),
  generatedAt: z.string().datetime(),
})
