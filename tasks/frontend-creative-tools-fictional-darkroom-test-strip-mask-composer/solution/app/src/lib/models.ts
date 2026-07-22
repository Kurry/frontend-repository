import { z } from 'zod';

export const NegativeRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  logicalWidth: z.number().int().min(1),
  logicalHeight: z.number().int().min(1),
  densityRows: z.array(z.array(z.number().int().min(0).max(63))),
  sourceRevisionId: z.string(),
  rasterHash: z.string(),
  notes: z.string()
});
export type NegativeRecord = z.infer<typeof NegativeRecordSchema>;

export const StripRecordSchema = z.object({
  id: z.string(),
  negativeId: z.string(),
  paperProfileId: z.string(),
  widthMm: z.number().int().min(40).max(400),
  heightMm: z.number().int().min(20).max(200),
  columns: z.number().int(),
  rows: z.number().int(),
  zoneIds: z.array(z.string()),
  renderer: z.enum(['Canvas', 'SVG']),
  fixtureRevisionId: z.string()
});
export type StripRecord = z.infer<typeof StripRecordSchema>;

export const MaskGeometrySchema = z.object({
  xMm: z.number().int().min(0),
  yMm: z.number().int().min(0),
  widthMm: z.number().int().min(5).max(400),
  heightMm: z.number().int().min(5).max(400),
  rectangleHash: z.string()
});
export type MaskGeometry = z.infer<typeof MaskGeometrySchema>;

export const ExposurePassRecordSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  label: z.string(),
  durationDs: z.number().int().min(1).max(1200),
  mask: MaskGeometrySchema,
  calibrationSourceId: z.string(),
  calibrationRevisionId: z.string(),
  outputFactorMilli: z.number().int().min(500).max(1500),
  actorId: z.string(),
  eventId: z.string(),
  status: z.enum(['active', 'archived'])
});
export type ExposurePassRecord = z.infer<typeof ExposurePassRecordSchema>;

export const ZoneDecisionRecordSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  passSetHash: z.string(),
  calibrationSetHash: z.string(),
  metricsHash: z.string(),
  rationale: z.string().min(1).max(280),
  confidence: z.enum(['working', 'tentative', 'rejected']),
  sourceIds: z.array(z.string()),
  actorId: z.string(),
  logicalAt: z.string(),
  parentDecisionId: z.string().nullable(),
  correctionIds: z.array(z.string()),
  status: z.enum(['fresh', 'stale'])
});
export type ZoneDecisionRecord = z.infer<typeof ZoneDecisionRecordSchema>;

export const AnnotationRecordSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  targetType: z.enum(['pass', 'mask_edge', 'zone', 'cell', 'source', 'decision', 'correction', 'checkpoint']),
  revisionId: z.string(),
  text: z.string().min(1).max(1000),
  actorId: z.string(),
  logicalAt: z.string(),
  parentId: z.string().nullable()
});
export type AnnotationRecord = z.infer<typeof AnnotationRecordSchema>;

export const CheckpointRecordSchema = z.object({
  id: z.string(),
  label: z.string(),
  eventId: z.string(),
  logicalAt: z.string()
});
export type CheckpointRecord = z.infer<typeof CheckpointRecordSchema>;

export const ReviewRecordSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  blockers: z.array(z.string()),
  status: z.enum(['pending', 'passed']),
  logicalAt: z.string()
});
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;

export const ApprovalRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  passSetHash: z.string(),
  calibrationSetHash: z.string(),
  decisionId: z.string(),
  proofDigest: z.string(),
  actorId: z.string(),
  logicalAt: z.string(),
  status: z.enum(['approved', 'stale'])
});
export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;

export const HistoryEventSchema = z.object({
  id: z.string(),
  logicalAt: z.string(),
  actorId: z.string(),
  kind: z.enum([
    'pass_created', 'pass_updated', 'pass_deleted', 'pass_reordered', 'pass_archived',
    'decision_made', 'decision_rebased', 'decision_staled', 'correction_applied',
    'annotation_added', 'review_completed', 'recipe_approved', 'approval_staled',
    'view_filter_changed', 'checkpoint_created', 'project_imported', 'project_reset'
  ]),
  status: z.enum(['accepted', 'rejected', 'cancelled', 'stale', 'undone']),
  parentId: z.string().nullable(),
  branchId: z.string().nullable(),
  targetId: z.string().nullable(),
  revisionId: z.string().nullable(),
  patchBefore: z.any().nullable(),
  patchAfter: z.any().nullable(),
  reason: z.string().nullable(),
  stateHash: z.string()
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const CalibrationSourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  revisionId: z.string(),
  outputFactorMilli: z.number().int().min(500).max(1500)
});
export type CalibrationSource = z.infer<typeof CalibrationSourceSchema>;

export const PaperProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  bias: z.number().int().min(-64).max(64),
  responseCurve: z.array(z.number().int().min(0).max(255))
});
export type PaperProfile = z.infer<typeof PaperProfileSchema>;

export const DarkroomProjectSchema = z.object({
  schemaVersion: z.literal("darkroom-test-strip-packet/v1"),
  projectId: z.string(),
  fixtureRevisionId: z.string(),
  negative: NegativeRecordSchema,
  strip: StripRecordSchema,
  paperProfile: PaperProfileSchema,
  calibrationSources: z.array(CalibrationSourceSchema),
  passes: z.array(ExposurePassRecordSchema),
  decisions: z.array(ZoneDecisionRecordSchema),
  annotations: z.array(AnnotationRecordSchema),
  checkpoints: z.array(CheckpointRecordSchema),
  review: ReviewRecordSchema.nullable(),
  approval: ApprovalRecordSchema.nullable(),
  history: z.array(HistoryEventSchema),
  historyAnchorId: z.string(),
  viewState: z.any(),
  generatedAt: z.string()
});
export type DarkroomProject = z.infer<typeof DarkroomProjectSchema>;
