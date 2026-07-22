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

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const paletteSchema = z.object({
  name: z
    .string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' })
    .trim()
    .min(2, 'Name must be 2 to 80 characters')
    .max(80, 'Name must be 2 to 80 characters'),
  period: z.enum(PALETTE_PERIODS, {
    errorMap: () => ({ message: 'Period must be one of the named periods' }),
  }),
  swatches: z
    .array(z.string().regex(HEX_RE, 'Each swatch must be a #RRGGBB hex value'))
    .min(3, 'Swatches must contain 3 to 8 unique hex values')
    .max(8, 'Swatches must contain 3 to 8 unique hex values')
    .refine(
      (swatches) => new Set(swatches.map((s) => s.toLowerCase())).size === swatches.length,
      'Swatches must be unique — duplicate hex values are not allowed',
    ),
  favorite: z.boolean().optional().default(false),
}).strict();

export const palettePackageSchema = z.object({
  schemaVersion: z.literal(1, {
    errorMap: () => ({ message: 'schemaVersion must be exactly 1' }),
  }),
  library: z.literal('O&A Palette Library', {
    errorMap: () => ({ message: "library must be exactly 'O&A Palette Library'" }),
  }),
  palettes: z.array(paletteSchema),
  generatedAt: z.string().datetime({ message: 'generatedAt must be an ISO-8601 datetime' }),
}).strict();

export function buildPalettePackage(palettes) {
  return {
    schemaVersion: 1,
    library: 'O&A Palette Library',
    palettes: palettes.map(({ name, period, swatches, favorite = false }) => ({
      name,
      period,
      swatches: [...swatches],
      favorite,
    })),
    generatedAt: new Date().toISOString(),
  };
}

// SubscribeRequest: required email shaped local-part@domain with a dot in the domain.
export const subscribeSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Email must look like name@example.com'),
});

// CartAdd: paletteName must exactly match an existing user-manageable palette; quantity 1-5.
export function buildCartSchema(validNames) {
  return z.object({
    paletteName: z
      .string({ required_error: 'Palette name is required' })
      .trim()
      .min(1, 'Palette name is required')
      .refine((name) => validNames.includes(name), 'Palette name must exactly match a palette in the library'),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number from 1 to 5' })
      .int('Quantity must be a whole number from 1 to 5')
      .min(1, 'Quantity must be from 1 to 5')
      .max(5, 'Quantity must be from 1 to 5'),
  });
}
