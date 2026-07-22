import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);

export const QuiltBlockRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 chars'),
  owner: z.string().min(1, 'Owner is required'),
  readiness: z.number().min(0, 'Readiness min 0').max(100, 'Readiness max 100'),
  status: StatusEnum,
});

export const DerivedStateSchema = z.object({
  summary: z.record(z.string(), z.number()),
});

export const QuiltBlockSessionSchema = z.object({
  schemaVersion: z.literal('quilt-layout-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(QuiltBlockRecordSchema),
  derived: DerivedStateSchema,
  history: z.array(z.any()), // basic tracking
});
