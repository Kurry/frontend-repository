import { z } from 'zod';

export const TaskStatusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);

export const SpatialComposerStateSchema = z.object({
  placed: z.boolean(),
  x: z.number().optional(),
  y: z.number().optional(),
  zone: z.string().optional(),
});

export const WorkdayTaskSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  status: TaskStatusSchema,
  assignedCapacity: z.number().min(0, "Capacity must be at least 0").max(100, "Capacity max is 100"),
  'spatial-composerState': SpatialComposerStateSchema.optional(),
});

export type WorkdayTask = z.infer<typeof WorkdayTaskSchema>;

export const DerivedSummarySchema = z.object({
  totalCapacity: z.number(),
  placedCount: z.number(),
  unplacedCount: z.number(),
  rebalanced: z.boolean(),
});

export const HistoryEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string().datetime(),
  recordId: z.string().optional(),
  details: z.any().optional(),
});

export const CommunityGardenWorkdayPlannerSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(WorkdayTaskSchema),
  derived: DerivedSummarySchema,
  history: z.array(HistoryEventSchema),
});

export type CommunityGardenWorkdayPlannerSession = z.infer<typeof CommunityGardenWorkdayPlannerSessionSchema>;
