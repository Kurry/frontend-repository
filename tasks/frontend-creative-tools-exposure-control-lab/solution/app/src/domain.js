import { z } from 'zod'

export const apertureStops = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8]
export const shutterStops = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000]
export const isoStops = [50, 100, 200, 400, 800, 1600, 3200]
export const lookTags = ['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic']
export const lookChips = ['Punch', 'Matte', 'Golden', 'Mono']

// Approximate tone-curve style adjustments (highlights/shadows/whites/blacks) as
// brightness/contrast deltas that can be fed into a CSS/canvas filter chain.
// Shared by the live preview (LabPreview.vue) and the PNG export pipeline
// (canvas-render.js) so both render the develop-panel adjustments identically.
export function computeToneAdjustments(light) {
  const highlights = light?.highlights ?? 0
  const shadows = light?.shadows ?? 0
  const whites = light?.whites ?? 0
  const blacks = light?.blacks ?? 0

  const brightnessDelta =
    highlights * 0.15 + // recovering/boosting highlights nudges overall brightness
    shadows * 0.2 +     // lifting shadows brightens the image
    whites * 0.05 +
    blacks * 0.05

  const contrastDelta =
    whites * 0.2 -   // raising the white point increases contrast
    blacks * 0.2 -   // lifting blacks (positive) reduces contrast, crushing (negative) increases it
    highlights * 0.05 -
    shadows * 0.05

  return { brightnessDelta, contrastDelta }
}

// Approximate texture/clarity (local-contrast/sharpen style effects) as a
// contrast + saturation nudge, again shared between preview and PNG export.
export function computeTextureClarityAdjustments(effects) {
  const texture = effects?.texture ?? 0
  const clarity = effects?.clarity ?? 0

  const contrastDelta = texture * 0.1 + clarity * 0.15
  const saturateMult = Math.max(0, 1 + (texture + clarity) / 400)

  return { contrastDelta, saturateMult }
}

export const ExposurePresetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 chars or less'),
  aperture: z.number().refine(val => apertureStops.includes(val), 'Invalid aperture'),
  shutter: z.number().refine(val => shutterStops.includes(val), 'Invalid shutter'),
  iso: z.number().refine(val => isoStops.includes(val), 'Invalid ISO'),
  lookTag: z.enum(['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic']),
  favorite: z.boolean().default(false).optional()
})

export const DialSnapshotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name must be 40 chars or less'),
  aperture: z.number().refine(val => apertureStops.includes(val), 'Invalid aperture'),
  shutter: z.number().refine(val => shutterStops.includes(val), 'Invalid shutter'),
  iso: z.number().refine(val => isoStops.includes(val), 'Invalid ISO'),
  light: z.object({
    exposure: z.number().min(-100).max(100),
    contrast: z.number().min(-100).max(100),
    highlights: z.number().min(-100).max(100),
    shadows: z.number().min(-100).max(100),
    whites: z.number().min(-100).max(100),
    blacks: z.number().min(-100).max(100)
  }),
  effects: z.object({
    texture: z.number().min(-100).max(100),
    clarity: z.number().min(-100).max(100),
    vignette: z.number().min(0).max(100),
    grain: z.number().min(0).max(100)
  })
})

export const LabPackageSchema = z.object({
  schemaVersion: z.literal('exposure-control-lab.package.v1'),
  aperture: z.number().refine(val => apertureStops.includes(val)),
  shutter: z.number().refine(val => shutterStops.includes(val)),
  iso: z.number().refine(val => isoStops.includes(val)),
  ev: z.number(),
  light: z.object({
    exposure: z.number().min(-100).max(100),
    contrast: z.number().min(-100).max(100),
    highlights: z.number().min(-100).max(100),
    shadows: z.number().min(-100).max(100),
    whites: z.number().min(-100).max(100),
    blacks: z.number().min(-100).max(100)
  }),
  effects: z.object({
    texture: z.number().min(-100).max(100),
    clarity: z.number().min(-100).max(100),
    vignette: z.number().min(0).max(100),
    grain: z.number().min(0).max(100)
  }),
  look: z.enum(['Punch', 'Matte', 'Golden', 'Mono']).or(z.null()),
  presets: z.array(ExposurePresetSchema),
  snapshots: z.array(DialSnapshotSchema)
})
