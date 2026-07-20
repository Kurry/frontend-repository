import * as v from 'valibot';

export const PaletteSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty('Please enter your name.')),
  artist: v.pipe(v.string(), v.nonEmpty('Please enter the artist.')),
  period: v.pipe(
    v.string(),
    v.nonEmpty('Please select a period.'),
    v.picklist([
      "Abstract + Geometric", "Americana", "Baroque to Neoclassical",
      "Expressionism", "Fauvism", "Impressionism", "Medieval",
      "Modern", "Old Masters", "Post-Impressionism",
      "Primitive + Folk", "Realism", "Romanticism", "Symbolism", "Tonalism"
    ], 'Invalid period.')
  ),
  swatches: v.pipe(
    v.array(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex code.'))),
    v.minLength(3, 'At least 3 swatches required.'),
    v.maxLength(12, 'At most 12 swatches allowed.')
  ),
  favorite: v.boolean(),
  tags: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  archived: v.optional(v.boolean())
});

export type PaletteForm = v.InferInput<typeof PaletteSchema>;

export const ArchiveImportSchema = v.object({
  version: v.literal('palette-archive.v1'),
  palettes: v.array(v.object({
    id: v.string(),
    name: v.string(),
    artist: v.string(),
    period: v.string(),
    swatches: v.array(v.string()),
    favorite: v.boolean(),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    archived: v.optional(v.boolean())
  }))
});
