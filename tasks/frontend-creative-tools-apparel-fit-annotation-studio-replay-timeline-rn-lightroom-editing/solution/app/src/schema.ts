import { z } from 'zod';

export const StatusEnum = z.enum(['draft', 'ready', 'changed', 'archived']);

export const ApparelFitAnnotationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required").max(100),
  status: StatusEnum,
  notes: z.string().max(500),
  measurementOffset: z.number().min(-20, "Offset cannot be less than -20").max(20, "Offset cannot be greater than 20"),
});

export type ApparelFitAnnotation = z.infer<typeof ApparelFitAnnotationSchema>;

export const TimelineEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string().datetime(),
  recordId: z.string(),
  state: ApparelFitAnnotationSchema, // The state of the record at this point in time
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const DerivedStateSchema = z.object({
  totalRecords: z.number(),
  statusCounts: z.record(StatusEnum, z.number()),
});

export type DerivedState = z.infer<typeof DerivedStateSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('fit-annotations-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(ApparelFitAnnotationSchema),
  derived: DerivedStateSchema,
  history: z.array(TimelineEventSchema),
}).refine(data => {
  // Check for unique IDs
  const ids = data.records.map(r => r.id);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
}, { message: "Duplicate record IDs found" });

export type Session = z.infer<typeof SessionSchema>;
