import { z } from 'zod';

const statusSchema = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
const scenarioStateSchema = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);

export const brewExperimentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  status: statusSchema,
  scenarioState: scenarioStateSchema,

  bean: z.string(),
  roastDate: z.string().min(1, 'Roast date is required'),
  grindSetting: z.string(),
  waterTemp: z.number().min(0, 'Temperature must be positive').max(150, 'Temperature must be realistic'),
  dose: z.number().min(0, 'Dose must be positive'),
  yield: z.number().min(0, 'Yield must be positive'),
  time: z.number().min(0, 'Time must be positive'),
  notes: z.string(),

  derived: z.object({
    ratio: z.string(),
    extractionEstimate: z.string()
  })
});

export const artifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(brewExperimentSchema),
  derived: z.object({
    summary: z.string(),
    totalExperiments: z.number(),
    scenarioChanges: z.number()
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string()
  }))
});
