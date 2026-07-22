import { z } from 'zod';

export const IngredientStatusSchema = z.enum([
  'empty',
  'draft',
  'ready',
  'changed',
  'archived',
]);

export type IngredientStatus = z.infer<typeof IngredientStatusSchema>;

export const RecipeIngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  status: IngredientStatusSchema,
  substitute: z.string().max(100, 'Substitute is too long').optional(),
  substituteRatio: z.string().max(50, 'Ratio is too long').optional(),
  'scenario-weaverState': z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const SummarySchema = z.object({
  totalItems: z.number().int().nonnegative(),
  modifiedItems: z.number().int().nonnegative(),
});

export type Summary = z.infer<typeof SummarySchema>;

export const HistoryEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  timestamp: z.string(),
});

export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const RecipeSubstitutionSandboxSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(RecipeIngredientSchema),
  derived: z.object({
    summary: SummarySchema,
  }),
  history: z.array(HistoryEventSchema),
});

export type RecipeSubstitutionSandboxSession = z.infer<typeof RecipeSubstitutionSandboxSessionSchema>;

export const initialRecords: RecipeIngredient[] = [
  { id: '1', name: 'Flour', status: 'ready', substitute: 'Almond Flour', substituteRatio: '1:1', 'scenario-weaverState': 'idle' },
  { id: '2', name: 'Sugar', status: 'draft', substitute: '', substituteRatio: '', 'scenario-weaverState': 'idle' },
  { id: '3', name: 'Butter', status: 'empty', substitute: '', substituteRatio: '', 'scenario-weaverState': 'idle' },
  { id: '4', name: 'Milk', status: 'archived', substitute: 'Soy Milk', substituteRatio: '1:1', 'scenario-weaverState': 'conflict' },
];
