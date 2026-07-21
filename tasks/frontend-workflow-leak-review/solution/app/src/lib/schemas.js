import { z } from 'zod';

export const verdictEnum = z.enum(['confirm-clean', 'confirm-leak'], {
  required_error: 'Verdict is required.',
  invalid_type_error: 'Verdict must be confirm-clean or confirm-leak.'
});

export const reviewStateEnum = z.enum([
  'unreviewed',
  'review-triggered',
  'confirmed-clean',
  'confirmed-leak'
]);

export const decisionSchema = z.object({
  verdict: verdictEnum,
  rationale: z.string({ required_error: 'Rationale is required.' })
    .trim()
    .min(20, 'Rationale must be at least 20 characters.')
    .max(2000, 'Rationale must be at most 2000 characters.')
}).strict();

const submissionSchema = z.object({
  id: z.string().trim().min(1, 'submissions.id must be a non-empty string.'),
  task: z.string().trim().min(1, 'submissions.task must be a non-empty string.'),
  submitter: z.string().trim().min(1, 'submissions.submitter must be a non-empty string.'),
  similarity: z.number().min(0, 'submissions.similarity must be at least 0.00.').max(1, 'submissions.similarity must be at most 1.00.'),
  reviewState: reviewStateEnum
}).strict();

const reportDecisionSchema = decisionSchema.extend({
  submissionId: z.string().trim().min(1, 'decisions.submissionId is required.'),
  decidedAt: z.string().datetime({ offset: true, message: 'decisions.decidedAt must be an ISO-8601 timestamp.' }),
  task: z.string().trim().min(1, 'decisions.task must be a non-empty string.'),
  submitter: z.string().trim().min(1, 'decisions.submitter must be a non-empty string.')
}).strict();

const mutationTestSchema = z.object({
  id: z.string().trim().min(1, 'mutationSuites.tests.id is required.'),
  name: z.string().trim().min(1, 'mutationSuites.tests.name is required.'),
  included: z.boolean({ invalid_type_error: 'mutationSuites.tests.included must be a boolean.' })
}).strict();

export const reportSchema = z.object({
  schemaVersion: z.literal('leak-review.report.v1', {
    invalid_type_error: 'schemaVersion must be leak-review.report.v1.'
  }),
  threshold: z.number({ invalid_type_error: 'threshold must be a number.' })
    .min(0.5, 'threshold must be at least 0.50.')
    .max(0.95, 'threshold must be at most 0.95.'),
  exportedAt: z.string().datetime({ offset: true, message: 'exportedAt must be an ISO-8601 timestamp.' }),
  rollup: z.object({
    reviewTriggered: z.number().int().nonnegative(),
    confirmedClean: z.number().int().nonnegative(),
    confirmedLeak: z.number().int().nonnegative(),
    meanSimilarity: z.number().min(0).max(1)
  }).strict(),
  submissions: z.array(submissionSchema).min(1, 'submissions must contain every queue row.'),
  decisions: z.array(reportDecisionSchema),
  mutationSuites: z.array(z.object({
    task: z.string().trim().min(1, 'mutationSuites.task must be a non-empty string.'),
    tests: z.array(mutationTestSchema)
  }).strict())
}).strict().superRefine((report, context) => {
  const submissionIds = new Set(report.submissions.map((submission) => submission.id));
  const decisionCounts = new Map();

  report.decisions.forEach((decision, index) => {
    if (!submissionIds.has(decision.submissionId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['decisions', index, 'submissionId'],
        message: 'decisions.submissionId must match a submissions[].id.'
      });
    }
    const submission = report.submissions.find((item) => item.id === decision.submissionId);
    if (submission && (decision.task !== submission.task || decision.submitter !== submission.submitter)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['decisions', index, 'task'],
        message: 'decisions.task and decisions.submitter must match the referenced submission.'
      });
    }
    decisionCounts.set(decision.submissionId, (decisionCounts.get(decision.submissionId) || 0) + 1);
  });

  report.submissions.forEach((submission, index) => {
    const matches = report.decisions.filter((decision) => decision.submissionId === submission.id);
    if (submission.reviewState === 'confirmed-clean' || submission.reviewState === 'confirmed-leak') {
      const expectedVerdict = submission.reviewState === 'confirmed-clean' ? 'confirm-clean' : 'confirm-leak';
      if (matches.length !== 1 || matches[0]?.verdict !== expectedVerdict) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['submissions', index, 'reviewState'],
          message: `submissions.reviewState ${submission.reviewState} requires exactly one matching ${expectedVerdict} decision.`
        });
      }
    } else if (matches.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['submissions', index, 'reviewState'],
        message: 'submissions.reviewState must be confirmed when a matching decision exists.'
      });
    }
  });

  const derivedRollup = {
    reviewTriggered: report.submissions.filter((item) => item.reviewState === 'review-triggered').length,
    confirmedClean: report.submissions.filter((item) => item.reviewState === 'confirmed-clean').length,
    confirmedLeak: report.submissions.filter((item) => item.reviewState === 'confirmed-leak').length,
    meanSimilarity: Number((report.submissions.reduce((sum, item) => sum + item.similarity, 0) / report.submissions.length).toFixed(2))
  };

  for (const key of Object.keys(derivedRollup)) {
    if (report.rollup[key] !== derivedRollup[key]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rollup', key],
        message: `rollup.${key} must match the value derived from submissions.`
      });
    }
  }
});

export const filterSchema = z.object({
  reviewState: z.enum(['all', 'unreviewed', 'review-triggered', 'confirmed-clean', 'confirmed-leak'])
});

export const auditFilterSchema = z.object({
  verdict: z.enum(['all', 'confirm-clean', 'confirm-leak'])
});

export const importFileSchema = z.object({
  documentFile: z.any().optional(),
  documentText: z.string().optional()
}).refine(
  (data) => (data.documentFile && data.documentFile.length === 1) || (typeof File !== 'undefined' && data.documentFile instanceof File) || (data.documentText && data.documentText.trim().length > 0),
  { message: 'Select a file or paste JSON payload.', path: ['documentFile'] }
);

export function formatSchemaError(error) {
  const issue = error?.issues?.[0];
  if (!issue) return 'Payload validation failed.';
  const path = issue.path?.length ? `${issue.path.join('.')}: ` : 'payload: ';
  return `${path}${issue.message}`;
}
