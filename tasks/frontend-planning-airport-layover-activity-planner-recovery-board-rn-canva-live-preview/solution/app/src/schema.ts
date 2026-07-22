import { z } from 'zod';

export const LayoverActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived', 'failed', 'conflict', 'resolved']),
  durationMinutes: z.number().min(5, "Duration must be at least 5 mins").max(720, "Duration must be at most 720 mins"),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  recoveryPathId: z.string().nullable().optional(),
  downstreamImpact: z.string().nullable().optional()
});

export const ArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(LayoverActivitySchema),
  derived: z.object({
    totalDuration: z.number(),
    readyCount: z.number(),
    failedCount: z.number(),
    resolvedCount: z.number()
  }),
  history: z.array(z.array(LayoverActivitySchema))
});

export type Artifact = z.infer<typeof ArtifactSchema>;
