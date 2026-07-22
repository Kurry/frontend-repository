import { z } from "zod";

export const SoundLayerStatus = z.enum(["empty", "draft", "ready", "changed", "archived", "failed"]);

export const SoundLayerRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  status: SoundLayerStatus,
  volume: z.number().min(0).max(100),
  pan: z.number().min(-100).max(100),
  duration: z.number().min(0.1).max(3600),
  startTime: z.number().min(0).max(3600),
  // Additional domain-specific fields
  tags: z.array(z.string()).max(10),
  recoveryNotes: z.string().optional(),
});

export const ArtifactSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string().datetime(),
  records: z.array(SoundLayerRecordSchema),
  derived: z.object({
    summary: z.object({
      totalLayers: z.number(),
      failedLayers: z.number(),
      totalDuration: z.number(),
      averageVolume: z.number(),
    })
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string().datetime(),
    details: z.any()
  }))
});
