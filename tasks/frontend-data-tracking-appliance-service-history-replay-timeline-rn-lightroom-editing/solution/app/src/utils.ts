import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Zod schemas for artifact validation
export const TimelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  description: z.string(),
  type: z.enum(['creation', 'service', 'inspection', 'modification']),
  snapshot: z.any() // Simplified for now to break circular dependency in Zod
});

export const ApplianceRecordSchema = z.object({
  id: z.string(),
  type: z.string().min(1, "Type is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string(),
  serial_number: z.string(),
  status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
  service_history: z.array(TimelineEventSchema),
  timeline_checkpoint: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const DerivedStateSchema = z.object({
  totalRecords: z.number().min(0),
  recordsByStatus: z.record(z.number().min(0)),
  activeFilter: z.string(),
  activeSelectionId: z.string().nullable(),
  sortOrder: z.enum(['asc', 'desc'])
});

export const HistoryActionSchema = z.object({
  id: z.string(),
  type: z.enum(['create', 'update', 'delete', 'scrub']),
  recordId: z.string(),
  timestamp: z.string().datetime(),
  previousState: ApplianceRecordSchema.nullable(),
  newState: ApplianceRecordSchema.nullable()
});

export const ArtifactSchemaZod = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(ApplianceRecordSchema),
  derived: DerivedStateSchema,
  history: z.array(HistoryActionSchema)
});
