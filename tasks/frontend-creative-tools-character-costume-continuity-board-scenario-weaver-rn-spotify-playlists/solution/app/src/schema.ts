import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type Status = z.infer<typeof StatusEnum>;

export const ScenarioStateEnum = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type ScenarioState = z.infer<typeof ScenarioStateEnum>;

export const RecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required").max(100),
  character: z.string().min(1, "Character is required").max(50),
  scene: z.number().int().min(1).max(999),
  status: StatusEnum,
  scenarioState: ScenarioStateEnum,
  branchParentId: z.string().nullable().optional(),
});

export type CostumeRecord = z.infer<typeof RecordSchema>;

export const DerivedSummarySchema = z.object({
  totalLooks: z.number().int(),
  readyCount: z.number().int(),
  scenesImpacted: z.array(z.number().int()),
});

export const HistoryEventSchema = z.object({
  action: z.string(),
  timestamp: z.string(),
  recordId: z.string().optional(),
});

export const ExportArtifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(RecordSchema),
  derived: DerivedSummarySchema,
  history: z.array(HistoryEventSchema),
});

export type ExportArtifact = z.infer<typeof ExportArtifactSchema>;
