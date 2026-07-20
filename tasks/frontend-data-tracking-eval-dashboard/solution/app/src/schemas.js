import { z } from 'zod';

export const suiteSchema = z.object({
  name: z.string().trim().min(1, 'Suite name is required').max(80, 'Suite name must be 80 characters or fewer'),
  promptIds: z.array(z.string()).min(1, 'Prompt selection requires at least one prompt'),
});

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const nightWindowSchema = z.object({
  startTime: z.string().min(1, 'Night start time is required').regex(timePattern, 'Night start time must use HH:MM'),
  endTime: z.string().min(1, 'Night end time is required').regex(timePattern, 'Night end time must use HH:MM'),
}).superRefine((value, ctx) => {
  if (timePattern.test(value.startTime) && timePattern.test(value.endTime) && value.endTime <= value.startTime) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Night end time must be after night start time' });
  }
});

export const scoringDimensionSchema = z.object({
  dimension: z.string().min(1),
  score: z.number().min(0).max(100),
});

export const evalResultSchema = z.object({
  promptTitle: z.string().min(1, 'Import promptTitle is required'),
  model: z.string().min(1, 'Import model is required'),
  score: z.number().min(0, 'Import score must be between 0 and 100').max(100, 'Import score must be between 0 and 100'),
  latencyMs: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  passFail: z.enum(['pass', 'fail']),
  promptText: z.string().min(1),
  response: z.string().min(1),
  scoringBreakdown: z.array(scoringDimensionSchema).min(1),
}).superRefine((value, ctx) => {
  const expected = value.score >= 70 ? 'pass' : 'fail';
  if (value.passFail !== expected) {
    ctx.addIssue({ code: 'custom', path: ['passFail'], message: `Import passFail must be ${expected} for score ${value.score}` });
  }
});

export const exportDocumentSchema = z.object({
  version: z.literal(1),
  suite: z.object({
    name: z.string(),
    promptCount: z.number().int().positive(),
    nightMode: z.boolean(),
  }),
  run: z.object({
    id: z.string().min(1),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
    averageScore: z.number().min(0).max(100),
    passCount: z.number().int().nonnegative(),
    failCount: z.number().int().nonnegative(),
    totalLatencyMs: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
    results: z.array(evalResultSchema),
  }),
});

export const importSchema = z.object({
  document: z.string().min(1, 'Import JSON is required'),
});
