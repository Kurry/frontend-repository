import { z } from 'zod';

export const DomainStateEnum = z.enum(['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved']);
export type DomainState = z.infer<typeof DomainStateEnum>;

export const ReadinessEnum = z.enum(['not_ready', 'ready_for_handoff', 'handoff_complete']);
export type Readiness = z.infer<typeof ReadinessEnum>;

export const PracticeSegmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  domainState: DomainStateEnum,
  owner: z.string().nullable(),
  readiness: ReadinessEnum,
});
export type PracticeSegment = z.infer<typeof PracticeSegmentSchema>;

export const DerivedStateSchema = z.object({
  totalSegments: z.number(),
  readyForHandoff: z.number(),
  handoffComplete: z.number(),
});
export type DerivedState = z.infer<typeof DerivedStateSchema>;

export const HistoryEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  timestamp: z.string(),
  details: z.any(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const SessionArtifactSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string(),
  records: z.array(PracticeSegmentSchema),
  derived: DerivedStateSchema,
  history: z.array(HistoryEventSchema),
});
export type SessionArtifact = z.infer<typeof SessionArtifactSchema>;
