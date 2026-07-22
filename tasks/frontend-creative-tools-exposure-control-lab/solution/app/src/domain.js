import { z } from 'zod'

export const apertureStops = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8]
export const shutterStops = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000]
export const isoStops = [50, 100, 200, 400, 800, 1600, 3200]
export const lookTags = ['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic']
export const lookChips = ['Punch', 'Matte', 'Golden', 'Mono']

export const APERTURE_LIST_TEXT = apertureStops.map(v => `f/${v}`).join(', ')
export const SHUTTER_LIST_TEXT = shutterStops.map(v => `1/${v}`).join(', ')
export const ISO_LIST_TEXT = isoStops.join(', ')
export const LOOKTAG_LIST_TEXT = lookTags.join(', ')

// Snap an arbitrary number to the nearest member of a stop list. Used by the
// WebMCP editor surface so automation can drive the dials with any numeric
// value while the UI keeps showing only valid discrete stops.
export function nearestStop(list, value) {
  let best = list[0]
  let bestDist = Math.abs(list[0] - value)
  for (const v of list) {
    const d = Math.abs(v - value)
    if (d < bestDist) {
      best = v
      bestDist = d
    }
  }
  return best
}

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

// Validation messages name the problem AND the fix so inline form errors and
// import failures tell the user exactly what to change.
export const ExposurePresetSchema = z.object({
  name: z.string()
    .min(1, 'Name is required. Enter a name of 1 to 40 characters.')
    .max(40, 'Name is longer than 40 characters. Shorten it to 40 or fewer.'),
  aperture: z.number({ invalid_type_error: `Aperture must be a number. Pick one of ${APERTURE_LIST_TEXT}.` })
    .refine(val => apertureStops.includes(val), val => ({ message: `Aperture ${val} is not a supported stop. Pick one of ${APERTURE_LIST_TEXT}.` })),
  shutter: z.number({ invalid_type_error: `Shutter must be a number. Pick one of ${SHUTTER_LIST_TEXT}.` })
    .refine(val => shutterStops.includes(val), val => ({ message: `Shutter ${val} is not a supported stop. Pick one of ${SHUTTER_LIST_TEXT}.` })),
  iso: z.number({ invalid_type_error: `ISO must be a number. Pick one of ${ISO_LIST_TEXT}.` })
    .refine(val => isoStops.includes(val), val => ({ message: `ISO ${val} is not a supported stop. Pick one of ${ISO_LIST_TEXT}.` })),
  lookTag: z.enum(['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic'], {
    errorMap: () => ({ message: `Look tag must be one of ${LOOKTAG_LIST_TEXT}.` })
  }),
  favorite: z.boolean().default(false).optional()
})

export const DialSnapshotSchema = z.object({
  name: z.string()
    .min(1, 'Name is required. Enter a name of 1 to 40 characters.')
    .max(40, 'Name is longer than 40 characters. Shorten it to 40 or fewer.'),
  aperture: z.number().refine(val => apertureStops.includes(val), val => ({ message: `Aperture ${val} is not a supported stop. Pick one of ${APERTURE_LIST_TEXT}.` })),
  shutter: z.number().refine(val => shutterStops.includes(val), val => ({ message: `Shutter ${val} is not a supported stop. Pick one of ${SHUTTER_LIST_TEXT}.` })),
  iso: z.number().refine(val => isoStops.includes(val), val => ({ message: `ISO ${val} is not a supported stop. Pick one of ${ISO_LIST_TEXT}.` })),
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
  schemaVersion: z.literal('exposure-control-lab.package.v1', {
    errorMap: () => ({ message: 'schemaVersion must be exactly "exposure-control-lab.package.v1". Re-export the package from the lab and import that file.' })
  }),
  aperture: z.number().refine(val => apertureStops.includes(val), val => ({ message: `aperture ${val} is not a supported stop. Use one of ${APERTURE_LIST_TEXT}.` })),
  shutter: z.number().refine(val => shutterStops.includes(val), val => ({ message: `shutter ${val} is not a supported stop. Use one of ${SHUTTER_LIST_TEXT}.` })),
  iso: z.number().refine(val => isoStops.includes(val), val => ({ message: `iso ${val} is not a supported stop. Use one of ${ISO_LIST_TEXT}.` })),
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
  look: z.enum(['Punch', 'Matte', 'Golden', 'Mono'], {
    errorMap: () => ({ message: 'look must be null or one of Punch, Matte, Golden, Mono.' })
  }).or(z.null()),
  presets: z.array(ExposurePresetSchema),
  snapshots: z.array(DialSnapshotSchema)
})
