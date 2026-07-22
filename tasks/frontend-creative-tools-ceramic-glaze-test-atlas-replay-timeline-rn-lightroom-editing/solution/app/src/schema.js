import { z } from "zod";

export const StatusEnum = z.enum(["draft", "ready", "changed", "archived"]);

export const HistoryEventSchema = z.object({
  timestamp: z.string(),
  status: StatusEnum,
  note: z.string().optional(),
});

export const GlazeTestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: StatusEnum,
  history: z.array(HistoryEventSchema),
});

export const DerivedSchema = z.object({
  totalTests: z.number(),
  readyTests: z.number(),
  latestChangedAt: z.string().nullable(),
});

export const SessionSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string(),
  records: z.array(GlazeTestSchema),
  derived: DerivedSchema,
  history: z.array(z.any()), // Global actions history for undo if needed, but per requirements we just need the schema shape
});
