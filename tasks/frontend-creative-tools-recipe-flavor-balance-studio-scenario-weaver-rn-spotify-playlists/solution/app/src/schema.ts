import { z } from 'zod';

export const ComponentStatusEnum = z.enum(["draft", "ready", "changed", "archived"]);
export type ComponentStatus = z.infer<typeof ComponentStatusEnum>;

export const FlavorProfileSchema = z.object({
  sweetness: z.number().min(0).max(10),
  acidity: z.number().min(0).max(10),
  saltiness: z.number().min(0).max(10),
  bitterness: z.number().min(0).max(10),
  umami: z.number().min(0).max(10),
});
export type FlavorProfile = z.infer<typeof FlavorProfileSchema>;

export const FlavorComponentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: ComponentStatusEnum,
  branched_from: z.string().nullable().optional(),
  profile: FlavorProfileSchema,
  notes: z.string().optional(),
});
export type FlavorComponent = z.infer<typeof FlavorComponentSchema>;

export const RecipeFlavorBalanceStudioSessionSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string().datetime(),
  records: z.array(FlavorComponentSchema),
  derived: z.object({
    total_components: z.number(),
    average_profile: FlavorProfileSchema,
  }).optional(),
  history: z.array(z.any()).optional(),
});
export type RecipeFlavorBalanceStudioSession = z.infer<typeof RecipeFlavorBalanceStudioSessionSchema>;
