import { z } from 'zod';

export const ColorStatusEnum = z.enum(['draft', 'ready', 'changed', 'archived']);
export type ColorStatus = z.infer<typeof ColorStatusEnum>;

export const ColorRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  status: ColorStatusEnum,
  lightness: z.number().min(0).max(100).optional(),
  hue: z.number().min(0).max(360).optional(),
  scenarioState: z.object({
    originalHex: z.string().optional(),
    isBranched: z.boolean().optional(),
  }).optional(),
});
export type ColorRecord = z.infer<typeof ColorRecordSchema>;

export const PaletteHarmonyMatrixSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(ColorRecordSchema),
  derived: z.object({
    totalCount: z.number(),
    readyCount: z.number(),
    archivedCount: z.number(),
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    recordId: z.string().optional(),
  })),
});
export type PaletteHarmonyMatrixSession = z.infer<typeof PaletteHarmonyMatrixSessionSchema>;
