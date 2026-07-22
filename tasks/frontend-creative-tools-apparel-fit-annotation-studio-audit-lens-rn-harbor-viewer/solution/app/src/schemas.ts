import { z } from 'zod';

export const DomainStatusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type DomainStatus = z.infer<typeof DomainStatusSchema>;

export const AuditLensStateSchema = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type AuditLensState = z.infer<typeof AuditLensStateSchema>;

export const FitAnnotationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  status: DomainStatusSchema,
  measurement: z.number().min(0, "Measurement must be non-negative").max(1000, "Measurement exceeds max bounds"),
  evidenceAttached: z.boolean().default(false),
  auditLensState: AuditLensStateSchema.default('idle'),
  discrepancyResolved: z.boolean().default(false),
});

export type FitAnnotation = z.infer<typeof FitAnnotationSchema>;

export const DerivedSchema = z.object({
  summary: z.string(),
  totalRecords: z.number().int().nonnegative(),
  resolvedCount: z.number().int().nonnegative(),
});
export type DerivedState = z.infer<typeof DerivedSchema>;

export const HistoryEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  recordId: z.string().optional(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const ApparelFitAnnotationStudioSessionSchema = z.object({
  schemaVersion: z.literal('fit-annotations-v1'),
  exportedAt: z.string(), // RFC3339
  records: z.array(FitAnnotationSchema),
  derived: DerivedSchema,
  history: z.array(HistoryEventSchema),
});

export type ApparelFitAnnotationStudioSession = z.infer<typeof ApparelFitAnnotationStudioSessionSchema>;
