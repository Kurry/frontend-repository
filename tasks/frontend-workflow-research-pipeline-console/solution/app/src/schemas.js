import { z } from 'zod';

export const JOB_TYPES = ['Data generation', 'Fine-tune', 'Evaluate'];
export const CLUSTERS = ['aurora', 'basalt', 'cinder'];
export const BENCHMARKS = ['Switchboard', 'Cartographer', 'Ledger'];

const baseShape = {
  jobType: z.enum(JOB_TYPES, { message: 'Job type is required' }),
  dataset: z.string().min(1, 'Dataset is required'),
  model: z.string().min(1, 'Model is required'),
  count: z.coerce.number().int('Count must be a whole number').min(1, 'Count must be between 1 and 50').max(50, 'Count must be between 1 and 50'),
  cluster: z.enum(CLUSTERS, { message: 'Cluster is required' }),
  benchmark: z.enum(BENCHMARKS).optional(),
  repetitions: z.coerce.number().int().min(1, 'Repetitions must be between 1 and 10').max(10, 'Repetitions must be between 1 and 10').optional(),
  autoEvaluate: z.boolean().optional(),
};

export const makeJobConfigSchema = (eligibleDatasets = [], eligibleCheckpoints = []) => z.object(baseShape).superRefine((value, ctx) => {
  if (value.jobType === 'Evaluate') {
    if (!value.benchmark) ctx.addIssue({ code: 'custom', path: ['benchmark'], message: 'Benchmark is required' });
    if (value.repetitions == null || Number.isNaN(value.repetitions)) ctx.addIssue({ code: 'custom', path: ['repetitions'], message: 'Repetitions is required' });
    if (value.model && !eligibleCheckpoints.includes(value.model)) ctx.addIssue({ code: 'custom', path: ['model'], message: 'Model must be a completed fine-tune checkpoint' });
  }
  if (value.jobType === 'Fine-tune' && value.dataset && !eligibleDatasets.includes(value.dataset)) {
    ctx.addIssue({ code: 'custom', path: ['dataset'], message: 'Dataset must come from completed data generation' });
  }
});

export function sanitizeJobConfig(raw, eligibleDatasets = [], eligibleCheckpoints = []) {
  const parsed = makeJobConfigSchema(eligibleDatasets, eligibleCheckpoints).parse(raw);
  const config = {
    jobType: parsed.jobType,
    dataset: parsed.dataset,
    model: parsed.model,
    count: parsed.count,
    cluster: parsed.cluster,
  };
  if (parsed.jobType === 'Evaluate') {
    config.benchmark = parsed.benchmark;
    config.repetitions = parsed.repetitions ?? 3;
  }
  if (parsed.jobType === 'Fine-tune') config.autoEvaluate = Boolean(parsed.autoEvaluate);
  return config;
}

export const exportedRunSchema = z.object({
  runId: z.string(),
  jobType: z.enum(JOB_TYPES),
  dataset: z.string().min(1),
  model: z.string().min(1),
  count: z.number().int().min(1).max(50),
  cluster: z.enum(CLUSTERS),
  benchmark: z.enum(BENCHMARKS).optional(),
  repetitions: z.number().int().min(1).max(10).optional(),
  autoEvaluate: z.boolean().optional(),
  phaseStatuses: z.tuple([
    z.object({ phase: z.literal('data'), status: z.string() }),
    z.object({ phase: z.literal('fineTune'), status: z.string() }),
    z.object({ phase: z.literal('evaluation'), status: z.string() }),
  ]),
});

export const exportSchema = z.object({
  schemaVersion: z.literal(1),
  runs: z.array(exportedRunSchema),
  generatedAt: z.string().datetime(),
});
