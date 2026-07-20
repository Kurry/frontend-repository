import { z } from 'zod';

export const STAGE_NAMES = ['Source', 'Build', 'Test Generation', 'Hardening', 'Publish'] as const;
export const STATUSES = ['passed', 'rejected', 'running', 'pending'] as const;
export const AGGREGATION_MODES = ['required-pass', 'all-pass', 'weighted-mean'] as const;
export const SEVERITIES = ['S1', 'S2', 'S3'] as const;
export const NOTE_CATEGORIES = ['observation', 'waiver-request', 'follow-up'] as const;
export const TIMELINE_TYPES = ['re-run', 'rejection', 'certificate', 'note'] as const;

export type StageName = (typeof STAGE_NAMES)[number];
export type StageStatus = (typeof STATUSES)[number];
export type AggregationMode = (typeof AGGREGATION_MODES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type GateState = 'pass' | 'fail';
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];
export type TimelineType = (typeof TIMELINE_TYPES)[number];

export const gateNoteSchema = z.object({
  text: z.string({ required_error: 'text is required' })
    .trim()
    .min(1, 'text must contain 1 to 200 characters')
    .max(200, 'text must contain 1 to 200 characters'),
  category: z.enum(NOTE_CATEGORIES, {
    required_error: 'category is required',
    invalid_type_error: 'category must be observation, waiver-request, or follow-up'
  })
}).strict();

export const exportedGateNoteSchema = gateNoteSchema.extend({
  createdAt: z.string().datetime({ message: 'createdAt must be an ISO-8601 timestamp' }).optional()
}).strict();

const gateSchema = z.object({
  id: z.string().min(1, 'gate.id must be non-empty'),
  name: z.string().min(1, 'gate.name must be non-empty'),
  severity: z.enum(SEVERITIES, { message: 'gate.severity must be S1, S2, or S3' }),
  state: z.enum(['pass', 'fail'], { message: 'gate.state must be pass or fail' }),
  evidence: z.string(),
  notes: z.array(exportedGateNoteSchema)
}).strict();

const certificateSchema = z.object({
  fingerprint: z.string().min(1, 'certificate.fingerprint must be non-empty'),
  issuedAt: z.string().datetime({ message: 'certificate.issuedAt must be an ISO-8601 timestamp' })
}).strict();

const stageSchema = z.object({
  name: z.enum(STAGE_NAMES, { message: 'stage.name is invalid' }),
  status: z.enum(STATUSES, { message: 'stage.status must be passed, rejected, running, or pending' }),
  aggregationMode: z.enum(AGGREGATION_MODES, { message: 'stage.aggregationMode is invalid' }),
  scorePercent: z.number().min(0).max(100).nullable(),
  gates: z.array(gateSchema).min(6, 'stage.gates must contain 6 to 10 gates').max(10, 'stage.gates must contain 6 to 10 gates'),
  certificate: certificateSchema.nullable()
}).strict().superRefine((stage, ctx) => {
  if (stage.aggregationMode === 'weighted-mean' && stage.scorePercent === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scorePercent'], message: 'scorePercent must be numeric for weighted-mean' });
  }
  if (stage.aggregationMode !== 'weighted-mean' && stage.scorePercent !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scorePercent'], message: 'scorePercent must be null unless aggregationMode is weighted-mean' });
  }
  if (stage.status === 'passed' && stage.certificate === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['certificate'], message: 'certificate must be non-null when status is passed' });
  }
  if (stage.status !== 'passed' && stage.certificate !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['certificate'], message: 'certificate must be null when status is not passed' });
  }
});

const timelineSchema = z.object({
  type: z.enum(TIMELINE_TYPES, { message: 'timeline.type is invalid' }),
  timestamp: z.string().datetime({ message: 'timeline.timestamp must be an ISO-8601 timestamp' }),
  summary: z.string().min(1, 'timeline.summary must be non-empty')
}).strict();

export const acceptancePackageSchema = z.object({
  schemaVersion: z.literal('gate-console.acceptance-package.v1', {
    errorMap: () => ({ message: 'schemaVersion must equal gate-console.acceptance-package.v1' })
  }),
  exportedAt: z.string().datetime({ message: 'exportedAt must be an ISO-8601 timestamp' }),
  runId: z.string().min(1, 'runId must be non-empty'),
  submittedAt: z.string().datetime({ message: 'submittedAt must be an ISO-8601 timestamp' }),
  stages: z.array(stageSchema).length(5, 'stages must contain exactly 5 stage objects'),
  timeline: z.array(timelineSchema)
}).strict().superRefine((payload, ctx) => {
  STAGE_NAMES.forEach((name, index) => {
    if (payload.stages[index]?.name !== name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stages', index, 'name'],
        message: `stages.${index}.name must be ${name}`
      });
    }
  });
  const unique = new Set(payload.stages.map((stage) => stage.name));
  if (unique.size !== 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stages'], message: 'stages must not contain duplicate names' });
  }
});

export const importFormSchema = z.object({
  payload: z.string().min(1, 'payload is required').superRefine((value, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'payload is not valid JSON' });
      return;
    }
    const result = acceptancePackageSchema.safeParse(parsed);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.length ? issue.path.join('.') : 'payload';
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field}: ${issue.message}` });
    }
  })
});

export type GateNote = z.infer<typeof gateNoteSchema>;
export type AcceptancePackage = z.infer<typeof acceptancePackageSchema>;

export interface GateRecord {
  id: string;
  name: string;
  severity: Severity;
  state: GateState;
  evidence: string;
  description: string;
  notes: GateNote[];
}

export interface Certificate {
  fingerprint: string;
  issuedAt: string;
}

export interface StageRecord {
  name: StageName;
  status: StageStatus;
  aggregationMode: AggregationMode;
  gates: GateRecord[];
  certificate: Certificate | null;
}

export interface TimelineEntry {
  id: string;
  type: TimelineType;
  timestamp: string;
  summary: string;
}

export interface RunRecord {
  id: string;
  submittedAt: string;
  branch: string;
  commit: string;
  stages: StageRecord[];
  timeline: TimelineEntry[];
}

export interface GateDefinition {
  id: string;
  name: string;
  severity: Severity;
  description: string;
  stages: StageName[];
}

export function scoreFor(gates: Pick<GateRecord, 'severity' | 'state'>[]): number {
  const weight = { S1: 5, S2: 3, S3: 1 } as const;
  const total = gates.reduce((sum, gate) => sum + weight[gate.severity], 0);
  const earned = gates.reduce((sum, gate) => sum + (gate.state === 'pass' ? weight[gate.severity] : 0), 0);
  return total ? Math.round((earned / total) * 1000) / 10 : 0;
}

export function suitePasses(mode: AggregationMode, gates: Pick<GateRecord, 'severity' | 'state'>[]): boolean {
  if (gates.some((gate) => gate.severity === 'S1' && gate.state === 'fail')) return false;
  if (mode === 'all-pass') return gates.every((gate) => gate.state === 'pass');
  if (mode === 'required-pass') return gates.filter((gate) => gate.severity !== 'S3').every((gate) => gate.state === 'pass');
  return scoreFor(gates) >= 80;
}
