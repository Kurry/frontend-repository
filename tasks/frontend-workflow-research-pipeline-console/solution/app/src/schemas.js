import { z } from 'zod';

export const JOB_TYPES = ['Data generation', 'Fine-tune', 'Evaluate'];
export const CLUSTERS = ['aurora', 'basalt', 'cinder'];
export const BENCHMARKS = ['Switchboard', 'Cartographer', 'Ledger'];

const baseShape = {
  jobType: z.enum(JOB_TYPES, { message: 'Job type is missing. Select a job type.' }),
  dataset: z.string().min(1, 'Dataset is missing. Select a dataset.'),
  model: z.string().min(1, 'Model is missing. Select a model.'),
  count: z.coerce.number().int('Count is invalid. Enter a whole number.').min(1, 'Count is invalid. Enter a whole number between 1 and 50.').max(50, 'Count is invalid. Enter a whole number between 1 and 50.'),
  cluster: z.enum(CLUSTERS, { message: 'Cluster is missing. Select a cluster.' }),
  benchmark: z.enum(BENCHMARKS).optional(),
  repetitions: z.coerce.number().int().min(1, 'Repetitions is invalid. Enter a whole number between 1 and 10.').max(10, 'Repetitions is invalid. Enter a whole number between 1 and 10.').optional(),
  autoEvaluate: z.boolean().optional(),
};

export const makeJobConfigSchema = (eligibleDatasets = [], eligibleCheckpoints = []) => z.object(baseShape).superRefine((value, ctx) => {
  if (value.jobType === 'Evaluate') {
    if (!value.benchmark) ctx.addIssue({ code: 'custom', path: ['benchmark'], message: 'Benchmark is missing. Select a benchmark.' });
    if (value.repetitions == null || Number.isNaN(value.repetitions)) ctx.addIssue({ code: 'custom', path: ['repetitions'], message: 'Repetition count is missing. Enter a repetition count.' });
    if (value.model && !eligibleCheckpoints.includes(value.model)) ctx.addIssue({ code: 'custom', path: ['model'], message: 'Model is ineligible. Select a checkpoint from a completed fine-tuning phase.' });
    if ('autoEvaluate' in value && value.autoEvaluate !== undefined) ctx.addIssue({ code: 'custom', path: ['autoEvaluate'], message: 'autoEvaluate must be absent for Evaluate' });
  }
  if (value.jobType === 'Fine-tune') {
    if (value.dataset && !eligibleDatasets.includes(value.dataset)) {
      ctx.addIssue({ code: 'custom', path: ['dataset'], message: 'Dataset is ineligible. Select a dataset from a completed data generation phase.' });
    }
    if ('benchmark' in value && value.benchmark !== undefined) ctx.addIssue({ code: 'custom', path: ['benchmark'], message: 'benchmark must be absent' });
    if ('repetitions' in value && value.repetitions !== undefined) ctx.addIssue({ code: 'custom', path: ['repetitions'], message: 'repetitions must be absent' });
  }
  if (value.jobType === 'Data generation') {
    if ('benchmark' in value && value.benchmark !== undefined) ctx.addIssue({ code: 'custom', path: ['benchmark'], message: 'benchmark must be absent' });
    if ('repetitions' in value && value.repetitions !== undefined) ctx.addIssue({ code: 'custom', path: ['repetitions'], message: 'repetitions must be absent' });
    if ('autoEvaluate' in value && value.autoEvaluate !== undefined) ctx.addIssue({ code: 'custom', path: ['autoEvaluate'], message: 'autoEvaluate must be absent' });
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

export const exportedRunSchema = z.discriminatedUnion('jobType', [
  z.object({
    runId: z.string(),
    jobType: z.literal('Data generation'),
    dataset: z.string().min(1),
    model: z.string().min(1),
    count: z.number().int().min(1).max(50),
    cluster: z.enum(CLUSTERS),
    phaseStatuses: z.tuple([
      z.object({ phase: z.literal('data'), status: z.string() }),
      z.object({ phase: z.literal('fineTune'), status: z.string() }),
      z.object({ phase: z.literal('evaluation'), status: z.string() }),
    ]),
  }).strict(),
  z.object({
    runId: z.string(),
    jobType: z.literal('Fine-tune'),
    dataset: z.string().min(1),
    model: z.string().min(1),
    count: z.number().int().min(1).max(50),
    cluster: z.enum(CLUSTERS),
    autoEvaluate: z.boolean().optional(),
    phaseStatuses: z.tuple([
      z.object({ phase: z.literal('data'), status: z.string() }),
      z.object({ phase: z.literal('fineTune'), status: z.string() }),
      z.object({ phase: z.literal('evaluation'), status: z.string() }),
    ]),
  }).strict(),
  z.object({
    runId: z.string(),
    jobType: z.literal('Evaluate'),
    dataset: z.string().min(1),
    model: z.string().min(1),
    count: z.number().int().min(1).max(50),
    cluster: z.enum(CLUSTERS),
    benchmark: z.enum(BENCHMARKS),
    repetitions: z.number().int().min(1).max(10),
    phaseStatuses: z.tuple([
      z.object({ phase: z.literal('data'), status: z.string() }),
      z.object({ phase: z.literal('fineTune'), status: z.string() }),
      z.object({ phase: z.literal('evaluation'), status: z.string() }),
    ]),
  }).strict(),
]);

export const exportSchema = z.object({
  schemaVersion: z.literal(1),
  runs: z.array(exportedRunSchema),
  generatedAt: z.string().datetime(),
});
