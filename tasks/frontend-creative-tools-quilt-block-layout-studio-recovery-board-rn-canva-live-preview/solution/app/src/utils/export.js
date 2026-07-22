import { z } from 'zod';

const BlockSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: z.enum(['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']),
  dimensions: z.string().regex(/^\d+x\d+$/)
});

const ArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(BlockSchema),
  derived: z.object({
    total: z.number(),
    ready: z.number(),
    draft: z.number(),
    conflict: z.number(),
    archived: z.number()
  }),
  history: z.array(z.any())
});

export const exportState = (store) => {
  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: store.records,
    derived: store.derivedSummary,
    history: store.history
  };
};

export const validateImport = (data) => {
  return ArtifactSchema.safeParse(data);
};
