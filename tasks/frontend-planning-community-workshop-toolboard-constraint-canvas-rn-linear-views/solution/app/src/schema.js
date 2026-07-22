import { z } from 'zod';

export const SCHEMA_VERSION = 'workshop-toolboard-v1';

export const STATUS_ENUM = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export const LANE_ENUM = z.enum(['backlog', 'in-progress', 'review', 'done']);

export const StationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  status: STATUS_ENUM,
  lane: LANE_ENUM,
  assignee: z.string().optional(),
  capacity: z.number().int().min(1).max(10).optional(),
});

export const DerivedSchema = z.object({
  summary: z.string(),
  totalStations: z.number().int(),
  activeLanes: z.record(LANE_ENUM, z.number().int()),
});

export const HistoryEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  action: z.string(),
  details: z.any(),
});

export const CommunityWorkshopToolboardSessionSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  records: z.array(StationSchema),
  derived: DerivedSchema,
  history: z.array(HistoryEventSchema),
});

export const validateSession = (data) => {
  return CommunityWorkshopToolboardSessionSchema.safeParse(data);
};
