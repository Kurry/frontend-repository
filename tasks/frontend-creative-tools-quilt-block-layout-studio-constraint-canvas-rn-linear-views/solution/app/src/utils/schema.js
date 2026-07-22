import { z } from 'zod';

export const blockStatuses = ['draft', 'ready', 'changed', 'conflict', 'resolved', 'archived'];

export const QuiltBlockSchema = z.object({
  id: z.string().min(1),
  status: z.enum(blockStatuses),
  blockName: z.string().min(1).max(50),
  size: z.number().int().min(1).max(100),
  conflict: z.boolean().optional(),
});

export const SessionSchema = z.object({
  schemaVersion: z.literal('quilt-layout-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(QuiltBlockSchema),
  derived: z.object({
    summary: z.string(),
    totalDrafts: z.number().int(),
    totalReady: z.number().int(),
    totalChanged: z.number().int(),
    totalConflicts: z.number().int(),
    totalResolved: z.number().int(),
    totalArchived: z.number().int(),
  }),
  history: z.array(z.any()), // basic tracking
});
