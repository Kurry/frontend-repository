import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type Status = z.infer<typeof StatusEnum>;

export const LineageStateEnum = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type LineageState = z.infer<typeof LineageStateEnum>;

export const RecordSchema = z.object({
  id: z.string(),
  status: StatusEnum,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  quantity: z.number().int().min(0, 'Must be positive').max(10000, 'Too large'),
  source: z.string().min(1, 'Source is required').max(100, 'Source too long'),
  lineageState: LineageStateEnum.optional().default('idle'),
});
export type RestockRecord = z.infer<typeof RecordSchema>;

export const ArtifactSchema = z.object({
  schemaVersion: z.literal('fridge-restock-v1'),
  exportedAt: z.string(),
  records: z.array(RecordSchema),
  derived: z.object({
    summary: z.string(),
    totalQuantity: z.number(),
  }),
  history: z.array(z.any()),
});
export type Artifact = z.infer<typeof ArtifactSchema>;
