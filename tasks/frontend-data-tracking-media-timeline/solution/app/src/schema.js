import { z } from 'zod';

export const TimelineEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(["Milestone", "Invention", "Release", "Publication", "Broadcast"]),
  timestamp: z.string().datetime({ offset: true }).refine(v => v.endsWith('Z'), { message: "Must end with Z" }),
  mediaRefs: z.array(z.string().trim().min(1).max(64)).min(1).max(8),
  year: z.number().int().min(-4000).max(2100),
  place: z.string().trim().min(1),
  categories: z.array(z.string()).min(1),
  summary: z.string().trim().min(1),
  source: z.string().trim().min(1),
}).refine(data => {
  const d = new Date(data.timestamp);
  return !isNaN(d.getTime()) && d.getUTCFullYear() === data.year;
}, {
  message: "Year must match timestamp's UTC year",
  path: ["timestamp"]
});

export const TimelineJSONSchema = z.object({
  version: z.literal(1),
  document: z.literal("media-timeline"),
  window: z.object({
    fromYear: z.number(),
    toYear: z.number()
  }),
  enabledCategories: z.array(z.string()),
  eras: z.array(z.object({
    name: z.string(),
    fromYear: z.number(),
    toYear: z.number()
  })),
  events: z.array(TimelineEventSchema)
});
