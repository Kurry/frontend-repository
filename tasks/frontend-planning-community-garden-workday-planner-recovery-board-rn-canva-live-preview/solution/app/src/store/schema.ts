import { z } from 'zod';
import { plots, statuses, type CommunityGardenWorkdayPlannerSession, type DerivedState, type Diagnostic, type WorkTaskRecord } from './types';

export const taskInputSchema = z.object({
  title: z.string().trim().min(3, 'Title must contain at least 3 characters.').max(80, 'Title must contain at most 80 characters.'),
  description: z.string().trim().max(240, 'Description must contain at most 240 characters.'),
  status: z.enum(statuses),
  date: z.string().regex(/^2026-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD in 2026.').refine((value) => value >= '2026-01-01' && value <= '2026-12-31', 'Date must be between 2026-01-01 and 2026-12-31.'),
  plot: z.enum(plots),
  volunteers: z.coerce.number().int('Volunteers must be a whole number.').min(1, 'Volunteers must be at least 1.').max(20, 'Volunteers must be at most 20.'),
  durationMinutes: z.coerce.number().int('Duration must be a whole number.').min(15, 'Duration must be at least 15 minutes.').max(240, 'Duration must be at most 240 minutes.').refine((value) => value % 15 === 0, 'Duration must use 15-minute increments.'),
}).superRefine((value, context) => {
  if (value.plot === 'Greenhouse' && value.volunteers > 8) {
    context.addIssue({ code: 'custom', path: ['volunteers'], message: 'Greenhouse tasks allow at most 8 volunteers; lower Volunteers to continue.' });
  }
});

export const repairSchema = z.object({
  repairNote: z.string().trim().min(10, 'Repair note must contain at least 10 characters.').max(180, 'Repair note must contain at most 180 characters.'),
});

const recoverySchema = z.object({
  lane: z.enum(['queue', 'recovery', 'resolved']),
  position: z.number().int().min(0).max(1000),
  repairNote: z.string().max(180),
});

const recordSchema = taskInputSchema.safeExtend({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/, 'ID must be 3 to 40 lowercase letters, numbers, or hyphens.'),
  order: z.number().int().min(0).max(1000),
  recoveryBoardState: recoverySchema,
});

const derivedSchema = z.object({
  total: z.number().int().min(0),
  ready: z.number().int().min(0),
  failed: z.number().int().min(0),
  inRecovery: z.number().int().min(0),
  resolved: z.number().int().min(0),
  archived: z.number().int().min(0),
  volunteerHours: z.number().min(0),
});

const historySchema = z.object({
  id: z.string().min(1).max(80),
  event: z.enum(['create', 'update', 'delete', 'archive', 'reorder', 'move_to_recovery', 'resolve_recovery', 'undo', 'import']),
  recordId: z.string().optional(),
  at: z.iso.datetime(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const artifactSchema = z.object({
  schemaVersion: z.literal('garden-workday-v1'),
  exportedAt: z.iso.datetime(),
  records: z.array(recordSchema).max(150),
  derived: derivedSchema,
  history: z.array(historySchema).max(500),
  selectionId: z.string().nullable(),
  filters: z.object({
    status: z.enum([...statuses, 'all']),
    query: z.string().max(80),
  }),
});

export function calculateDerived(records: WorkTaskRecord[]): DerivedState {
  const active = records.filter((record) => record.status !== 'archived');
  return {
    total: records.length,
    ready: records.filter((record) => record.status === 'ready').length,
    failed: records.filter((record) => record.status === 'failed').length,
    inRecovery: records.filter((record) => record.status === 'recovery').length,
    resolved: records.filter((record) => record.status === 'resolved').length,
    archived: records.filter((record) => record.status === 'archived').length,
    volunteerHours: Number((active.reduce((sum, record) => sum + record.volunteers * record.durationMinutes, 0) / 60).toFixed(2)),
  };
}

function diagnostic(path: string, rejected: unknown, message: string, recovery: string): Diagnostic {
  return { path, rejected, message, recovery };
}

export function validateArtifact(raw: unknown): { ok: true; session: CommunityGardenWorkdayPlannerSession } | { ok: false; diagnostics: Diagnostic[] } {
  const parsed = artifactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      diagnostics: parsed.error.issues.map((issue) => {
        const rejected = issue.path.reduce<unknown>((value, segment) => value && typeof value === 'object' && typeof segment !== 'symbol' ? (value as Record<string | number, unknown>)[segment] : undefined, raw);
        return diagnostic(issue.path.join('.') || 'artifact', rejected, issue.message, `Correct ${issue.path.join('.') || 'the artifact'} and import again.`);
      }),
    };
  }

  const session = parsed.data as CommunityGardenWorkdayPlannerSession;
  const diagnostics: Diagnostic[] = [];
  const ids = session.records.map((record) => record.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of [...new Set(duplicateIds)]) diagnostics.push(diagnostic('records[].id', id, `Duplicate record ID "${id}" is not allowed.`, 'Give every record a unique stable ID.'));

  const recordIds = new Set(ids);
  session.records.forEach((record, index) => {
    const expectedLane = record.status === 'recovery' ? 'recovery' : record.status === 'resolved' ? 'resolved' : 'queue';
    if (record.recoveryBoardState.lane !== expectedLane) {
      diagnostics.push(diagnostic(`records.${index}.recoveryBoardState.lane`, record.recoveryBoardState.lane, `Status "${record.status}" contradicts recovery lane "${record.recoveryBoardState.lane}".`, `Set lane to "${expectedLane}" or correct the status.`));
    }
    if (record.status === 'resolved' && record.recoveryBoardState.repairNote.length < 10) {
      diagnostics.push(diagnostic(`records.${index}.recoveryBoardState.repairNote`, record.recoveryBoardState.repairNote, 'Resolved records require a repair note of at least 10 characters.', 'Add the downstream repair evidence.'));
    }
  });

  session.history.forEach((event, index) => {
    if (event.recordId && !recordIds.has(event.recordId) && event.event !== 'delete') diagnostics.push(diagnostic(`history.${index}.recordId`, event.recordId, `History references unknown record "${event.recordId}".`, 'Remove the dangling event or restore its record.'));
  });
  if (session.selectionId && !recordIds.has(session.selectionId)) diagnostics.push(diagnostic('selectionId', session.selectionId, 'Selection references an unknown record.', 'Clear selectionId or choose an existing record ID.'));

  const actual = calculateDerived(session.records);
  if (JSON.stringify(actual) !== JSON.stringify(session.derived)) diagnostics.push(diagnostic('derived', session.derived, 'Derived summary is stale or contradicts records.', 'Regenerate derived from the records before importing.'));

  return diagnostics.length ? { ok: false, diagnostics } : { ok: true, session };
}
