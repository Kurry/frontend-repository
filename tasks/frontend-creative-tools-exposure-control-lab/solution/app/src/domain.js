import { z } from 'zod'

export const apertureStops = [22, 16, 11, 8, 5.6, 4, 2.8, 1.8]
export const shutterStops = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000]
export const isoStops = [50, 100, 200, 400, 800, 1600, 3200]
export const lookTags = ['soft', 'crisp', 'grainy', 'night', 'daylight', 'cinematic']
export const lookChips = ['Punch', 'Matte', 'Golden', 'Mono']

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
