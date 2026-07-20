import { z } from 'zod';

export const PALETTE_PERIODS = [
  'Baroque to Neoclassical',
  'Expressionism',
  'Fauvism',
  'Old Masters',
  'Post-Impressionism',
  'Realism',
  'Romanticism',
  'Symbolism',
  'Tonalism',
];

export const paletteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  period: z.enum(PALETTE_PERIODS),
  swatches: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3).max(8).refine(
    swatches => new Set(swatches.map(swatch => swatch.toLowerCase())).size === swatches.length,
    'swatches must be unique'
  ),
  favorite: z.boolean().optional().default(false),
}).strict();

export const palettePackageSchema = z.object({
  schemaVersion: z.literal(1),
  library: z.literal('O&A Palette Library'),
  palettes: z.array(paletteSchema),
  generatedAt: z.string().datetime(),
}).strict();

export function buildPalettePackage(palettes) {
  return {
    schemaVersion: 1,
    library: 'O&A Palette Library',
    palettes: palettes.map(({ name, period, swatches, favorite = false }) => ({ name, period, swatches: [...swatches], favorite })),
    generatedAt: new Date().toISOString(),
  };
}
