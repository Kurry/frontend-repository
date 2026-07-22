import { z } from 'zod';

export const DomainStateSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type DomainState = z.infer<typeof DomainStateSchema>;

export const DrillCheckpointSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: DomainStateSchema,
  description: z.string(),
  area: z.string(),
});
export type DrillCheckpoint = z.infer<typeof DrillCheckpointSchema>;

export const RecoveryStateSchema = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type RecoveryState = z.infer<typeof RecoveryStateSchema>;

export const SessionHistoryEventSchema = z.object({
  action: z.string(),
  timestamp: z.string(),
  recordId: z.string().optional(),
});
export type SessionHistoryEvent = z.infer<typeof SessionHistoryEventSchema>;

export const EmergencyDrillEvacuationPlannerSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(DrillCheckpointSchema),
  derived: z.object({
    summary: z.string(),
    totalDrafts: z.number().int().nonnegative(),
    totalReady: z.number().int().nonnegative(),
    totalArchived: z.number().int().nonnegative(),
  }),
  history: z.array(SessionHistoryEventSchema),
});

export type EmergencyDrillEvacuationPlannerSession = z.infer<typeof EmergencyDrillEvacuationPlannerSessionSchema>;
