import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']);
export type Status = z.infer<typeof StatusEnum>;

export const ConstraintLaneEnum = z.enum(['unassigned', 'temperature', 'application', 'thickness', 'firing']);
export type ConstraintLane = z.infer<typeof ConstraintLaneEnum>;

export const RecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  baseGlaze: z.string().min(1, "Base glaze is required"),
  status: StatusEnum,
  lane: ConstraintLaneEnum,
  notes: z.string().optional(),
  temperature: z.number().min(1000).max(1300).optional(),
});
export type GlazeRecord = z.infer<typeof RecordSchema>;

export const DerivedSchema = z.object({
  summary: z.string(),
  totalCount: z.number(),
  conflictCount: z.number(),
});

export const HistoryEventSchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  recordId: z.string().optional(),
  details: z.string().optional(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('glaze-atlas-session-v1'),
  exportedAt: z.string(),
  records: z.array(RecordSchema),
  derived: DerivedSchema,
  history: z.array(HistoryEventSchema),
});
export type Session = z.infer<typeof SessionSchema>;
