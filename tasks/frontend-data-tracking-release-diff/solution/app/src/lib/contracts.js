import { z } from 'zod'

export const SPLIT_TAGS = ['auric-holdout', 'basalt-train', 'cinder-public']
export const TIMELINE_KINDS = ['release-cut', 'rank-stability-failed', 'rotation-advance', 'import']
export const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export const cutReleaseSchema = z.object({
  name: z.string({ required_error: 'Version name is required.' })
    .min(1, 'Version name is required.')
    .regex(SEMVER_RE, 'Version name must use MAJOR.MINOR.PATCH without leading zeros.'),
  notes: z.string().max(500, 'Notes must be 500 characters or fewer.'),
})

export const taskManifestSchema = z.object({
  slug: z.string().min(2, 'Task slug must be at least 2 characters.').max(64, 'Task slug must be 64 characters or fewer.').regex(/^[a-z0-9-]+$/, 'Task slug must contain lowercase letters, digits, and hyphens only.'),
  contentDigest: z.string().regex(/^[a-f0-9]{64}$/, 'Task contentDigest must be exactly 64 lowercase hexadecimal characters.'),
  title: z.string().min(1, 'Task title is required.').max(120, 'Task title must be 120 characters or fewer.'),
  splitTags: z.array(z.enum(SPLIT_TAGS)).min(1, 'Task splitTags must contain at least one allowed split.').superRefine((tags, ctx) => {
    if (new Set(tags).size !== tags.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Task splitTags must be unique.' })
  }),
}).strict()

const isoUtc = z.string().refine((value) => value.endsWith('Z') && !Number.isNaN(Date.parse(value)), 'Timestamp must be an ISO-8601 value ending with Z.')

export const releaseVersionSchema = z.object({
  name: z.string().regex(SEMVER_RE, 'Version name must use MAJOR.MINOR.PATCH without leading zeros.'),
  cutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Version cutDate must use YYYY-MM-DD.'),
  sealed: z.boolean(),
  notes: z.string().max(500, 'Version notes must be 500 characters or fewer.'),
  taskCount: z.number().int().nonnegative(),
  tasks: z.array(taskManifestSchema),
}).strict().superRefine((version, ctx) => {
  if (version.taskCount !== version.tasks.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taskCount'], message: 'Version taskCount must equal tasks.length.' })
  }
})

const historyEntrySchema = z.object({
  cycle: z.number().int().positive(),
  subsets: z.array(z.string().min(1, 'Rotation subset names cannot be empty.')).min(1, 'Rotation history subsets cannot be empty.'),
}).strict()

export const rotationSchema = z.object({
  cycle: z.number().int().positive(),
  activeSubsets: z.array(z.string().min(1, 'Rotation active subset names cannot be empty.')).min(1, 'Rotation activeSubsets cannot be empty.'),
  history: z.array(historyEntrySchema),
}).strict().superRefine((rotation, ctx) => {
  for (let start = 0; start <= rotation.history.length - 3; start += 1) {
    const window = rotation.history.slice(start, start + 3).flatMap((entry) => entry.subsets)
    if (new Set(window).size !== window.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['history', start], message: 'Rotation history must not repeat a subset within any 3-cycle window.' })
      return
    }
  }
})

export const timelineEventSchema = z.object({
  at: isoUtc,
  kind: z.enum(TIMELINE_KINDS, { errorMap: () => ({ message: `Timeline kind must be one of ${TIMELINE_KINDS.join(', ')}.` }) }),
  description: z.string().min(1, 'Timeline description cannot be empty.'),
}).strict()

export const releasePackSchema = z.object({
  schemaVersion: z.literal('larkspur-release-pack/v1', { errorMap: () => ({ message: 'schemaVersion must be exactly larkspur-release-pack/v1.' }) }),
  generatedAt: isoUtc,
  versions: z.array(releaseVersionSchema).min(1, 'Versions must contain at least one version.'),
  rotation: rotationSchema,
  timeline: z.array(timelineEventSchema),
}).strict().superRefine((pack, ctx) => {
  const names = pack.versions.map((version) => version.name.toLowerCase())
  if (new Set(names).size !== names.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['versions'], message: 'Version names must be unique.' })
})

export function describeZodError(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'Release pack JSON is invalid.'
  const field = issue.path?.length ? issue.path.join('.') : 'document'
  return `${field}: ${issue.message}`
}

export function validatePackText(raw) {
  let document
  try {
    document = JSON.parse(raw)
  } catch {
    return { success: false, message: 'Release pack JSON: document must contain valid JSON.' }
  }
  const result = releasePackSchema.safeParse(document)
  if (!result.success) return { success: false, message: `Release pack JSON field ${describeZodError(result.error)}` }
  return { success: true, data: result.data }
}

export function compareSemver(a, b) {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return right[index] - left[index]
  }
  return 0
}
