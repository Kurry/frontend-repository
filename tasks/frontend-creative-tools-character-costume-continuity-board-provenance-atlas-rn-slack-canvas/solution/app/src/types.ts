import { z } from 'zod';

export const CostumeStatusSchema = z.enum(['draft', 'ready', 'changed', 'archived']);
export type CostumeStatus = z.infer<typeof CostumeStatusSchema>;

export const ProvenanceAtlasStateSchema = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type ProvenanceAtlasState = z.infer<typeof ProvenanceAtlasStateSchema>;

export const SourceEvidenceSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  date: z.string()
});
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;

export const CostumeRecordSchema = z.object({
  id: z.string(),
  character: z.string().min(1, "Character is required"),
  scene: z.string().min(1, "Scene is required"),
  description: z.string().min(1, "Description is required"),
  status: CostumeStatusSchema,
  provenanceAtlasState: ProvenanceAtlasStateSchema,
  sourceEvidence: z.array(SourceEvidenceSchema).optional(),
  quarantineReason: z.string().optional()
});
export type CostumeRecord = z.infer<typeof CostumeRecordSchema>;

export const ContinuitySessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime().optional(),
  records: z.array(CostumeRecordSchema),
  derived: z.object({
    summary: z.string(),
    totalRecords: z.number(),
    statusCounts: z.record(CostumeStatusSchema, z.number())
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    details: z.any()
  }))
});
export type ContinuitySession = z.infer<typeof ContinuitySessionSchema>;
