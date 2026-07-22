import { z } from 'zod';

export const RecordStatusSchema = z.enum(['draft', 'ready', 'changed', 'archived']);
export type RecordStatus = z.infer<typeof RecordStatusSchema>;

export const BikeRecordSchema = z.object({
  id: z.string(),
  mileage: z.number().min(0),
  service_type: z.string().min(1),
  status: RecordStatusSchema,
});
export type BikeRecord = z.infer<typeof BikeRecordSchema>;

export const SpatialStateSchema = z.object({
  record_id: z.string(),
  x: z.number(),
  y: z.number(),
});
export type SpatialState = z.infer<typeof SpatialStateSchema>;

export const SessionArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(BikeRecordSchema),
  spatialState: z.array(SpatialStateSchema),
  derived: z.object({
    capacity_used: z.number(),
    capacity_total: z.number(),
  }),
  history: z.array(z.any()), // basic tracking
});
export type SessionArtifact = z.infer<typeof SessionArtifactSchema>;
