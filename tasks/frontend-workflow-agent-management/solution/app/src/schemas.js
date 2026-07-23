import { z } from 'zod'

export const AGENT_TYPES = ['aster', 'boreal', 'cinder']
export const EDITORS = ['codedeck', 'nimbus', 'quill', 'vector', 'none']
export const STATUSES = ['idle', 'running', 'paused', 'error', 'offline']
export const STEP_STATUSES = ['pending', 'running', 'complete', 'failed', 'retrying']

export const createAgentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(2, 'Name must be 2 to 40 characters').max(40, 'Name must be 2 to 40 characters'),
  agentType: z.enum(AGENT_TYPES, { message: 'Agent type is required' }),
  editorIntegration: z.enum(EDITORS, { message: 'Editor integration is required' }),
  accessKey: z.string().min(1, 'Access key is required').min(16, 'Access key must be 16 to 64 characters').max(64, 'Access key must be 16 to 64 characters').regex(/^[A-Za-z0-9_-]+$/, 'Access key may use only letters, digits, hyphens, and underscores'),
})

export function createUniqueAgentSchema(existingNames, currentName = '') {
  return createAgentSchema.superRefine((value, ctx) => {
    const normalized = value.name.trim().toLocaleLowerCase()
    const current = currentName.trim().toLocaleLowerCase()
    if (existingNames.some((name) => {
      const candidate = name.trim().toLocaleLowerCase()
      return candidate === normalized && candidate !== current
    })) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Name must be unique (ignoring letter case)' })
    }
  })
}

const timelineEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  kind: z.string().min(1),
  label: z.string().min(1),
  from: z.enum(STATUSES).optional(),
  to: z.enum(STATUSES).optional(),
  stepId: z.string().optional(),
})

const runStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(STEP_STATUSES),
  attempts: z.number().int().min(0),
  checkpoint: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  output: z.string().optional(),
})

export const exportRunSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['running', 'paused', 'failed', 'complete']),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  steps: z.array(runStepSchema).min(5),
  progressComplete: z.number().int().min(0),
  progressTotal: z.number().int().min(5),
  duration: z.number().int().min(0).optional(),
}).superRefine((run, ctx) => {
  if (run.progressTotal !== run.steps.length) ctx.addIssue({ code: 'custom', path: ['progressTotal'], message: 'Run progressTotal must match the step count' })
  const complete = run.steps.filter((step) => step.status === 'complete').length
  if (run.progressComplete !== complete) ctx.addIssue({ code: 'custom', path: ['progressComplete'], message: 'Run progressComplete must match completed steps' })
  if (run.status === 'complete' && !Number.isFinite(run.duration)) ctx.addIssue({ code: 'custom', path: ['duration'], message: 'Completed run duration is required' })
}).nullable()

export const fleetAgentSchema = createAgentSchema.extend({
  status: z.enum(STATUSES),
  lastSeen: z.string().datetime(),
  timeline: z.array(timelineEventSchema),
  run: exportRunSchema,
}).superRefine((agent, ctx) => {
  if (['running', 'paused', 'error'].includes(agent.status) && !agent.run) {
    ctx.addIssue({ code: 'custom', path: ['run'], message: `Run is required when agent status is ${agent.status}` })
  }
  const expected = { running: 'running', paused: 'paused', error: 'failed' }[agent.status]
  if (agent.run && expected && agent.run.status !== expected) {
    ctx.addIssue({ code: 'custom', path: ['run', 'status'], message: `Run status must be ${expected} when agent status is ${agent.status}` })
  }
})

export const fleetSnapshotSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  exportedAt: z.string().datetime('Exported-at must be an ISO-8601 timestamp'),
  rollup: z.object({
    idle: z.number().int().min(0),
    running: z.number().int().min(0),
    paused: z.number().int().min(0),
    error: z.number().int().min(0),
    offline: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  agents: z.array(fleetAgentSchema),
}).superRefine((snapshot, ctx) => {
  const seen = new Set()
  snapshot.agents.forEach((agent, index) => {
    const normalized = agent.name.trim().toLocaleLowerCase()
    if (seen.has(normalized)) {
      ctx.addIssue({ code: 'custom', path: ['agents', index, 'name'], message: `Duplicate agent name: ${agent.name}` })
    }
    seen.add(normalized)
  })
  const derived = { idle: 0, running: 0, paused: 0, error: 0, offline: 0, total: snapshot.agents.length }
  snapshot.agents.forEach((agent) => { derived[agent.status] += 1 })
  for (const key of ['idle', 'running', 'paused', 'error', 'offline', 'total']) {
    if (snapshot.rollup[key] !== derived[key]) {
      ctx.addIssue({ code: 'custom', path: ['rollup', key], message: `Rollup ${key} must match the agents array` })
    }
  }
})

export function parseFleetText(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch {
    return { success: false, error: 'Import JSON is malformed' }
  }
  const result = fleetSnapshotSchema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.length ? issue.path.join('.') : 'Import'
    return { success: false, error: `${field}: ${issue.message}` }
  }
  return { success: true, data: result.data }
}

export const importFormSchema = z.object({
  jsonText: z.string().min(1, 'Fleet JSON is required'),
}).superRefine((value, ctx) => {
  if (!value.jsonText) return
  const result = parseFleetText(value.jsonText)
  if (!result.success) ctx.addIssue({ code: 'custom', path: ['jsonText'], message: result.error })
})

export const statusFilterSchema = z.object({
  statuses: z.array(z.enum(STATUSES)),
})

export const timelineFilterSchema = z.object({
  kind: z.enum(['all', 'status', 'run', 'step', 'retry', 'checkpoint', 'error', 'manual']),
})
