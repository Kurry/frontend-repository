import { z } from 'zod';

export const QuiltBlockStatus = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type QuiltBlockStatusType = z.infer<typeof QuiltBlockStatus>;

export const ProvenanceState = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);
export type ProvenanceStateType = z.infer<typeof ProvenanceState>;

export const QuiltBlock = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  status: QuiltBlockStatus,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  pieces: z.number().int().min(1, "Must have at least 1 piece").max(100, "Max 100 pieces"),
  provenanceState: ProvenanceState,
  lineageInfo: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type QuiltBlockType = z.infer<typeof QuiltBlock>;

export const SessionDerived = z.object({
  summary: z.string(),
  totalBlocks: z.number().int(),
  archivedCount: z.number().int(),
  quarantinedCount: z.number().int(),
});

export const SessionHistoryEvent = z.object({
  id: z.string().uuid(),
  type: z.string(),
  timestamp: z.string().datetime(),
  details: z.string(),
});

export const SessionArtifact = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string().datetime(),
  records: z.array(QuiltBlock),
  derived: SessionDerived,
  history: z.array(SessionHistoryEvent),
});
export type SessionArtifactType = z.infer<typeof SessionArtifact>;
