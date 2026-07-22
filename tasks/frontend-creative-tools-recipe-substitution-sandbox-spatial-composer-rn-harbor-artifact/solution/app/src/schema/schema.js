import { z } from 'zod';

export const domainStatuses = ['draft', 'ready', 'changed', 'archived'];

export const recordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  unit: z.string().min(1, "Unit is required"),
  status: z.enum(['draft', 'ready', 'changed', 'archived']),
  spatialComposerState: z.object({
    placed: z.boolean(),
    x: z.number(),
    y: z.number()
  }).optional()
});

export const recipeSubstitutionSandboxSessionSchema = z.object({
  schemaVersion: z.literal("recipe-substitution-v1"),
  exportedAt: z.string().datetime(), // RFC3339
  records: z.array(recordSchema),
  derived: z.object({
    summary: z.string()
  }),
  history: z.array(z.any())
});
