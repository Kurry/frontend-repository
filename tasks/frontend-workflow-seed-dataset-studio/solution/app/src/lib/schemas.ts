import { z } from 'zod';

export const repositories = ['quartz-orm', 'copperline', 'lattice-db', 'brineworks', 'fernwheel', 'ashgrid'] as const;
export const statuses = ['draft', 'authored', 'rejected', 'harvest-pending'] as const;
export const rejectClasses = ['duplicate-report', 'insufficient-signal', 'environment-specific', 'ambiguous-report', 'trivial-fix'] as const;
export const failureModes = ['wrong-answer', 'no-runtime-evidence', 'missing-incomplete-info', 'off-target'] as const;
export const deferenceProfiles = ['premise-acceptance', 'happy-path-bias', 'boundary-violation'] as const;
export const negativeClasses = ['false-premise-acceptance', 'fabricated-symbol', 'wrong-subsystem'] as const;

const trimmed = (field: string, max: number) => z.string().trim().min(1, `${field} is required`).max(max, `${field} must be ${max} characters or fewer`);

export const RejectSeedSchema = z.object({
  rejectClass: z.enum(rejectClasses, { error: 'rejectClass is required' }),
  justification: z.string().trim().min(20, 'justification must be at least 20 characters')
}).strict();

export const PositiveCriterionSchema = z.object({
  id: z.string().regex(/^1\.\d+$/, 'id must match 1.x numbering'),
  name: trimmed('name', 80),
  weight: z.number().min(0.5, 'weight must be at least 0.5').max(5, 'weight must be at most 5'),
  description: trimmed('description', 2000)
}).strict();

export const NegativeCriterionSchema = z.object({
  id: z.string().regex(/^2\.\d+$/, 'id must match 2.x numbering'),
  name: trimmed('name', 80),
  class: z.enum(negativeClasses, { error: 'class is required' }),
  description: trimmed('description', 2000)
}).strict();

export const FoilUpsertSchema = z.object({
  answerText: trimmed('answerText', 4000),
  failureMode: z.enum(failureModes, { error: 'failureMode is required' }),
  expectsFailIds: z.array(z.string()).min(1, 'expectsFailIds must contain at least one criterion id'),
  correctnessCap: z.number().min(0, 'correctnessCap must be between 0 and 40').max(40, 'correctnessCap must be between 0 and 40')
}).strict();

export const HarvestPendingJustificationSchema = z.object({
  justification: z.string().trim().min(20, 'justification must be at least 20 characters')
}).strict();

export const GoldenAnswerSchema = z.object({
  status: z.enum(['present', 'harvest-pending']),
  value: z.string()
}).strict().superRefine((answer, context) => {
  if (!answer.value.trim()) context.addIssue({ code: 'custom', path: ['value'], message: 'value is required' });
  if (answer.status === 'harvest-pending' && answer.value.trim().length < 20) context.addIssue({ code: 'custom', path: ['value'], message: 'harvest-pending value must be at least 20 characters' });
});

export const PackageManifestSchema = z.object({
  schemaVersion: z.literal('seed-package-manifest-v1'),
  seedId: z.string().min(1),
  repository: z.enum(repositories),
  pinnedCommit: z.string().regex(/^[0-9a-f]{40}$/, 'pinnedCommit must be exactly 40 lowercase hexadecimal characters'),
  language: z.string().min(1),
  kind: z.enum(['issue', 'pr']),
  title: z.string().trim().min(1, 'title is required'),
  difficulty: z.enum(['hard', 'unset']),
  deferenceProfile: z.enum(deferenceProfiles),
  failureModel: z.enum(failureModes),
  questionText: z.string().trim().min(1, 'questionText is required'),
  checklist: z.array(z.boolean()).length(4).optional(),
  positiveCriteria: z.array(PositiveCriterionSchema),
  negativeCriteria: z.array(NegativeCriterionSchema),
  foils: z.array(FoilUpsertSchema),
  goldenAnswer: GoldenAnswerSchema
}).strict();

export const DatasetSnapshotSchema = z.object({
  schemaVersion: z.literal('dataset-snapshot-v1'),
  totalSeeds: z.number().int().nonnegative(),
  byStatus: z.object({
    draft: z.number().int().nonnegative(),
    authored: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    'harvest-pending': z.number().int().nonnegative()
  }).strict(),
  byLanguage: z.object({ TypeScript: z.number().int().nonnegative(), Go: z.number().int().nonnegative(), Rust: z.number().int().nonnegative(), Python: z.number().int().nonnegative(), Ruby: z.number().int().nonnegative(), Java: z.number().int().nonnegative() }).strict(),
  byRepository: z.object({ 'quartz-orm': z.number().int().nonnegative(), copperline: z.number().int().nonnegative(), 'lattice-db': z.number().int().nonnegative(), brineworks: z.number().int().nonnegative(), fernwheel: z.number().int().nonnegative(), ashgrid: z.number().int().nonnegative() }).strict(),
  rejectedByClass: z.object({
    'duplicate-report': z.number().int().nonnegative(),
    'insufficient-signal': z.number().int().nonnegative(),
    'environment-specific': z.number().int().nonnegative(),
    'ambiguous-report': z.number().int().nonnegative(),
    'trivial-fix': z.number().int().nonnegative()
  }).strict(),
  generatedAt: z.string().datetime({ offset: false }).regex(/Z$/, 'generatedAt must be an ISO-8601 datetime ending in Z')
}).strict();

export const DatasetStudioPackageSchema = z.object({
  schemaVersion: z.literal('seed-dataset-studio-v1'),
  studio: z.literal('Seed Dataset Studio'),
  packages: z.array(PackageManifestSchema),
  snapshot: DatasetSnapshotSchema,
  generatedAt: z.string().datetime({ offset: false }).regex(/Z$/, 'generatedAt must be an ISO-8601 datetime ending in Z')
}).strict();

export type RejectSeed = z.infer<typeof RejectSeedSchema>;
export type PositiveCriterion = z.infer<typeof PositiveCriterionSchema>;
export type NegativeCriterion = z.infer<typeof NegativeCriterionSchema>;
export type FoilUpsert = z.infer<typeof FoilUpsertSchema>;
export type PackageManifest = z.infer<typeof PackageManifestSchema>;
export type DatasetSnapshot = z.infer<typeof DatasetSnapshotSchema>;
export type DatasetStudioPackage = z.infer<typeof DatasetStudioPackageSchema>;
