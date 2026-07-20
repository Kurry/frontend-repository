import { z } from 'zod';
import { FEATURES, MODELS, TEAMS } from './data';

const money = z.number().positive().refine((value) => Math.round(value * 100) === value * 100, 'Must have at most 2 decimal places');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must use YYYY-MM-DD');

export const budgetCapSchema = z.object({
  capUsd: money,
  note: z.string().max(200, 'note must be at most 200 characters').optional(),
});

export const dateRangeSchema = z.object({ from: isoDate, to: isoDate }).refine((v) => v.from <= v.to, {
  path: ['to'],
  message: 'date range: to must be on or after from',
});

export const teamCeilingSchema = z.object({ team: z.enum(TEAMS), ceilingUsd: money });

export const savedViewSchema = z.object({
  name: z.string().trim().min(2, 'name must be 2–60 characters').max(60, 'name must be 2–60 characters'),
  dimension: z.enum(['model', 'team', 'feature']),
  range: dateRangeSchema,
});

export const scheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  sections: z.array(z.enum(['totals', 'per-dimension-tables', 'anomalies'])).min(1, 'sections: select at least one').refine((v) => new Set(v).size === v.length, 'sections must not contain duplicates'),
});

export const recategorizeSchema = z.object({
  team: z.preprocess((value) => value === '' ? undefined : value, z.enum(TEAMS).optional()),
  feature: z.preprocess((value) => value === '' ? undefined : value, z.enum(FEATURES).optional()),
}).refine((v) => Boolean(v.team || v.feature), { path: ['team'], message: 'team or feature is required' });

export const usageEventSchema = z.object({
  timestamp: z.string().datetime({ offset: false }).refine((v) => v.endsWith('Z'), 'timestamp must end in Z'),
  model: z.enum(MODELS),
  feature: z.enum(FEATURES),
  team: z.enum(TEAMS),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative().refine((v) => Math.round(v * 1e6) === v * 1e6, 'cost must have at most 6 decimal places'),
  tag: z.string().max(40),
});

export const formulaValues = ['=SUM(cost)', '=AVG(cost)', '=COUNT()', '=SUM(prompt_tokens)', '=SUM(completion_tokens)'];
