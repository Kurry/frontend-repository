import { z } from 'zod';

export const DOMAIN_STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived'];

export const GlazeTestRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional().default('Untitled'),
  status: z.enum(DOMAIN_STATUSES).default('draft'),
  folderId: z.string().nullable().optional().default(null),
  order: z.number().default(0),
  // Glaze recipe properties
  materials: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      amount: z.number().min(0).max(100),
    })
  ).default([]),
  firingTemp: z.number().min(0).max(3000).default(2000), // e.g. Cone 6 approx
  notes: z.string().optional().default(''),
  queued: z.boolean().default(false),
  scenarioState: z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']).default('idle'),
  originalId: z.string().nullable().optional().default(null), // For branched scenarios
});

export const CeramicGlazeTestAtlasSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(), // RFC3339
  records: z.array(GlazeTestRecordSchema),
  derived: z.object({
    summary: z.object({
      totalTests: z.number(),
      readyCount: z.number(),
      queuedCount: z.number(),
    }),
  }),
  history: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      timestamp: z.string().datetime(),
      description: z.string(),
    })
  ),
  folders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
    })
  ).default([]),
});
