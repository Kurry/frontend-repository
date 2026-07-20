import { z } from 'zod';
import { CONDITIONS, REASONS, RUN_COUNTS, VERDICTS, verdictFor } from './types';

export const reasonSchema = z.enum(REASONS, {
  error: `reason must be one of: ${REASONS.join(', ')}`,
});
export const conditionSchema = z.enum(CONDITIONS, {
  error: `condition must be one of: ${CONDITIONS.join(', ')}`,
});
export const verdictSchema = z.enum(VERDICTS, {
  error: 'verdict must be keep, flaky, or fail',
});
export const runResultSchema = z.enum(['pass', 'fail'], {
  error: 'result must be pass or fail',
});

export const runSchema = z.object({
  index: z.number().int().min(1).max(5),
  result: runResultSchema,
  condition: conditionSchema,
});

export const reasonUpdateSchema = z.object({
  testId: z.string().trim().min(1, 'testId must be a non-empty string'),
  reason: reasonSchema,
});

export const rerunRequestSchema = z.object({
  runCount: z.union(RUN_COUNTS.map((count) => z.literal(count)) as [z.ZodLiteral<3>, z.ZodLiteral<5>, z.ZodLiteral<10>], {
    error: 'runCount is required and must be 3, 5, or 10',
  }),
});

export const testRecordSchema = z
  .object({
    id: z.string().trim().min(1, 'tests.id must be a non-empty string'),
    verdict: verdictSchema,
    reason: reasonSchema,
    runs: z.array(runSchema).length(5, 'tests.runs must contain exactly 5 runs'),
  })
  .superRefine((test, ctx) => {
    const expected = [1, 2, 3, 4, 5];
    if (test.runs.some((run, index) => run.index !== expected[index])) {
      ctx.addIssue({ code: 'custom', path: ['runs'], message: 'tests.runs indexes must be 1 through 5 in order' });
    }
    if (verdictFor(test.runs) !== test.verdict) {
      ctx.addIssue({ code: 'custom', path: ['verdict'], message: 'verdict must agree with the five run results' });
    }
  });

export const reportSchema = z
  .object({
    schemaVersion: z.literal('flake-triage-report-v1', {
      error: 'schemaVersion must be flake-triage-report-v1',
    }),
    exportedAt: z.iso.datetime({ offset: false, error: 'exportedAt must be an ISO-8601 timestamp ending in Z' }),
    suiteId: z.string().trim().min(1, 'suiteId must be a non-empty string'),
    suiteName: z.string().trim().min(1, 'suiteName must be a non-empty string'),
    tests: z.array(testRecordSchema, { error: 'tests is required and must be an array' }),
    quarantine: z.object(
      {
        allFail: z.array(z.string().trim().min(1)),
        flaky: z.array(z.string().trim().min(1)),
      },
      { error: 'quarantine is required and must contain allFail and flaky arrays' },
    ),
  })
  .superRefine((report, ctx) => {
    if (!report.exportedAt.endsWith('Z')) {
      ctx.addIssue({ code: 'custom', path: ['exportedAt'], message: 'exportedAt must end in Z' });
    }
    const expectedAllFail = report.tests.filter((test) => test.verdict === 'fail').map((test) => test.id);
    const expectedFlaky = report.tests.filter((test) => test.verdict === 'flaky').map((test) => test.id);
    if (JSON.stringify(report.quarantine.allFail) !== JSON.stringify(expectedAllFail)) {
      ctx.addIssue({ code: 'custom', path: ['quarantine', 'allFail'], message: 'quarantine.allFail must match fail tests' });
    }
    if (JSON.stringify(report.quarantine.flaky) !== JSON.stringify(expectedFlaky)) {
      ctx.addIssue({ code: 'custom', path: ['quarantine', 'flaky'], message: 'quarantine.flaky must match flaky tests' });
    }
  });

export type TriageReport = z.infer<typeof reportSchema>;

export const importTextSchema = z.string().trim().min(1, 'Triage report JSON is required').superRefine((text, ctx) => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Triage report JSON is malformed' });
    return;
  }
  const result = reportSchema.safeParse(value);
  if (!result.success) {
    ctx.addIssue({
      code: 'custom',
      message: result.error.issues[0]?.message ?? 'Triage report JSON violates the field contract',
    });
  }
});
