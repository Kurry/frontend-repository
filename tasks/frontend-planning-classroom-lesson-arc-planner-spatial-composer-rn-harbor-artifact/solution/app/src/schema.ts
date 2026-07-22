import { z } from 'zod';

export const DOMAIN_STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived'] as const;

export const RecordSchema = z.object({
  id: z.string().trim().min(1, 'ID is required'),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
  status: z.enum(DOMAIN_STATUSES),
});

export type LessonRecord = z.infer<typeof RecordSchema>;

export const SpatialComposerZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxCapacity: z.number().int(),
  recordIds: z.array(z.string()),
});

export type SpatialComposerZone = z.infer<typeof SpatialComposerZoneSchema>;

export const DerivedSchema = z.object({
  summary: z.string(),
  totalAssignedCapacity: z.number().int(),
  composerActive: z.boolean(),
});

export type DerivedState = z.infer<typeof DerivedSchema>;

export const HistoryItemSchema = z.object({
  type: z.string(),
  snapshot: z.any(),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('shapeshift-session-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(RecordSchema),
  derived: DerivedSchema,
  history: z.array(HistoryItemSchema),
  zones: z.array(SpatialComposerZoneSchema),
});

export type SessionState = z.infer<typeof SessionSchema>;
