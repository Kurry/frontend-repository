import { z } from 'zod';

export const StatusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);

export const WasteEventRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: StatusSchema,
  weight: z.number().min(0),
  type: z.string(),
  ownerId: z.string().nullable().optional(),
  notes: z.string(),
});

export const DerivedStateSchema = z.object({
  summary: z.object({
    totalEvents: z.number().min(0),
    totalWeight: z.number().min(0),
    readyCount: z.number().min(0),
  }),
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  action: z.string(),
  previousState: z.array(WasteEventRecordSchema),
});

export const HouseholdWasteDiversionTrackerSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(WasteEventRecordSchema),
  derived: DerivedStateSchema,
  history: z.array(HistoryEntrySchema),
});
