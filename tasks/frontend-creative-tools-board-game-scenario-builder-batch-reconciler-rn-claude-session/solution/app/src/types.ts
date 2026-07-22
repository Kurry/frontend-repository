import { z } from 'zod';

export const ScenarioCardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').default(''),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
  difficulty: z.number().min(1, 'Difficulty must be at least 1').max(10, 'Difficulty cannot exceed 10'),
});

export type ScenarioCard = z.infer<typeof ScenarioCardSchema>;

export const BoardGameScenarioBuilderSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(ScenarioCardSchema),
  derived: z.record(z.string(), z.any()),
  history: z.array(z.any()),
});

export type BoardGameScenarioBuilderSession = z.infer<typeof BoardGameScenarioBuilderSessionSchema>;
