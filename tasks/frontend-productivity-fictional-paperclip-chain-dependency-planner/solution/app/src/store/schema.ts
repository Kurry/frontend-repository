import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  durationMinutes: z.number().int().min(5).max(120),
  lane: z.enum(['main', 'parallel']),
  x: z.number(),
  y: z.number(),
  requiredPredecessorIds: z.array(z.string()).optional()
});
export type Task = z.infer<typeof TaskSchema>;

export const ClipSchema = z.object({
  id: z.string(),
  status: z.enum(['loose', 'preview', 'committed', 'archived']),
  sourceTaskId: z.string().nullable(),
  targetTaskId: z.string().nullable(),
  routeKind: z.enum(['direct', 'over', 'under']).nullable(),
  routePoints: z.array(z.object({ x: z.number(), y: z.number() })).nullable(),
  revision: z.number(),
  actorId: z.string(),
  trayCoordinate: z.object({ x: z.number(), y: z.number() }).nullable()
});
export type Clip = z.infer<typeof ClipSchema>;

export const ScheduleSchema = z.object({
  intervals: z.array(z.object({
    taskId: z.string(),
    start: z.string(), // ISO string
    finish: z.string(), // ISO string
    durationMinutes: z.number(),
    predecessorIds: z.array(z.string()),
    successorIds: z.array(z.string()),
    slackMinutes: z.number(),
    critical: z.boolean(),
    issueIds: z.array(z.string())
  })),
  criticalTaskIds: z.array(z.string()),
  finish: z.string().nullable(),
  reviewBufferMinutes: z.number()
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export const IssueSchema = z.object({
  id: z.string(),
  type: z.string(),
  taskId: z.string(),
  resolved: z.boolean()
});
export type Issue = z.infer<typeof IssueSchema>;

export const CommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  actorId: z.string(),
  anchorIds: z.array(z.string())
});
export type Comment = z.infer<typeof CommentSchema>;

export const PlanSchema = z.object({
  planId: z.string(),
  revision: z.number(),
  planStart: z.string(),
  reviewGate: z.string(),
  tasks: z.array(TaskSchema),
  clips: z.array(ClipSchema),
  schedule: ScheduleSchema,
  issues: z.array(IssueSchema),
  comments: z.array(CommentSchema),
  selection: z.object({
    kind: z.enum(['clip', 'task', 'none']),
    ids: z.array(z.string()),
    primaryId: z.string().nullable()
  }),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  timelineBrush: z.object({ startMinute: z.number(), endMinute: z.number() }).nullable(),
  rehearsal: z.object({
    status: z.enum(['not-run', 'ready', 'start', 'complete', 'release-successors', 'review']),
    cursor: z.number(),
    events: z.array(z.string()),
    mark: z.string().nullable()
  }),
  history: z.object({
    anchorEventId: z.string().nullable(),
    currentEventId: z.string().nullable(),
    events: z.array(z.any()), // Simplified for now
    branches: z.array(z.any())
  }),
  approval: z.any().nullable(),
  generatedAt: z.string().nullable(),
  exportedAt: z.string().nullable(),
  branchId: z.string().default('Baseline')
});
export type Plan = z.infer<typeof PlanSchema>;
