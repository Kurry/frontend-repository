import { z } from 'zod';
import { FIX_CATEGORIES, GATE_NAMES, GATE_STATUSES, HERO_STATES, RECOMMENDATIONS, REVIEWER_STEPS } from './types';

export const recommendationRequestSchema = z.object({
  recommendation: z.enum(RECOMMENDATIONS, { message: 'recommendation is required.' }),
  overrideJustification: z.string().trim().min(20, 'overrideJustification must contain at least 20 characters.').max(2000, 'overrideJustification must contain at most 2000 characters.').nullable(),
});

export const recommendationFormSchema = z.object({
  recommendation: z.enum(RECOMMENDATIONS, { message: 'recommendation is required.' }).nullable(),
  overrideEnabled: z.boolean(),
  overrideJustification: z.string().max(2000, 'overrideJustification must contain at most 2000 characters.'),
});

export const notesFormSchema = z.object({ notes: z.string().max(4000, 'stepNotes must contain at most 4000 characters.') });
export const filterFormSchema = z.object({
  heroState: z.enum(HERO_STATES).nullable(),
  gateName: z.enum(GATE_NAMES).nullable(),
  gateStatus: z.enum(GATE_STATUSES).nullable(),
});
export const diffFormSchema = z.object({ leftTrialId: z.string().min(1), rightTrialId: z.string().min(1) }).refine((data) => data.leftTrialId !== data.rightTrialId, { path: ['rightTrialId'], message: 'Choose two different trials.' });
export const importFormSchema = z.object({ packageText: z.string().min(1, 'packageText is required.') });

const gateExportSchema = z.object({
  name: z.enum(GATE_NAMES),
  status: z.enum(GATE_STATUSES),
  summary: z.string(),
  score: z.number().nullable(),
  validTrials: z.number().int().nonnegative(),
  totalTrials: z.number().int().nonnegative(),
});

const fixExportSchema = z.object({
  position: z.number().int().positive(),
  category: z.enum(FIX_CATEGORIES),
  title: z.string(),
  detail: z.string(),
  remediation: z.string(),
  resolved: z.boolean(),
});

const reviewerStepExportSchema = z.object({ name: z.enum(REVIEWER_STEPS), done: z.boolean(), notes: z.string() });
const timelineEventExportSchema = z.object({ id: z.string(), timestamp: z.string().datetime({ offset: true }), kind: z.string(), label: z.string() });

export const exportBundleSchema = z.object({
  slug: z.string().min(1),
  heroState: z.enum(HERO_STATES),
  recommendation: z.enum(RECOMMENDATIONS).nullable(),
  overrideJustification: z.string().nullable(),
  bundled: z.boolean(),
  stopEarlyFlags: z.array(z.string()),
  gates: z.array(gateExportSchema).length(6).refine((gates) => gates.every((gate, index) => gate.name === GATE_NAMES[index]), 'gates must use the fixed gate order.'),
  fixItems: z.array(fixExportSchema),
  reviewerSteps: z.array(reviewerStepExportSchema).length(5).refine((steps) => steps.every((step, index) => step.name === REVIEWER_STEPS[index]), 'reviewerSteps must use Resolve, Gate, Audit, Verdict, Bundle order.'),
  timeline: z.array(timelineEventExportSchema),
});

export const reviewPackageSchema = z.object({
  schemaVersion: z.literal('review-certification/v1'),
  exportedAt: z.string().datetime({ offset: true }).refine((value) => value.endsWith('Z'), 'exportedAt must be an ISO-8601 timestamp ending in Z.'),
  portfolioSummary: z.object({
    totalBundles: z.number().int(),
    readyCount: z.number().int(),
    notReadyCount: z.number().int(),
    atRiskCount: z.number().int(),
    stopEarlyCount: z.number().int(),
    sable4ValidityPercent: z.number(),
  }),
  bundles: z.array(exportBundleSchema),
});

export type ReviewPackage = z.infer<typeof reviewPackageSchema>;
