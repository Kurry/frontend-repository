export const REASONS = [
  'timing-sensitive',
  'environment-dependent',
  'ordering-dependent',
  'resource-quota',
  'locale-dependent',
  'filesystem-path',
  'parallelism',
] as const;

export const CONDITIONS = [
  'CPU quota',
  'terminal size',
  'hostname',
  'timezone',
  'temp-dir length',
  'parallel execution',
] as const;

export const VERDICTS = ['keep', 'flaky', 'fail'] as const;
export const RUN_COUNTS = [3, 5, 10] as const;

export type Reason = (typeof REASONS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Verdict = (typeof VERDICTS)[number];
export type RunResult = 'pass' | 'fail';
export type RunCount = (typeof RUN_COUNTS)[number];

export type Run = {
  index: number;
  result: RunResult;
  condition: Condition;
};

export type Test = {
  id: string;
  reason: Reason;
  runs: Run[];
  rerunAttempt: number;
};

export const AUDIT_TYPES = [
  'verdict-change',
  'reason-change',
  're-run-started',
  're-run-stopped',
  're-run-completed',
] as const;
export type AuditType = (typeof AUDIT_TYPES)[number];

export type AuditEvent = {
  id: string;
  type: AuditType;
  timestamp: string;
  testId: string;
  message: string;
};

export type Suite = {
  id: string;
  name: string;
  subtitle: string;
  tests: Test[];
  audit: AuditEvent[];
};

export type RerunSession = {
  suiteId: string;
  testId: string;
  runCount: RunCount;
  completed: Run[];
  status: 'running' | 'stopped' | 'completed';
  previousRuns: Run[];
  startedAt: string;
};

export type Toast = {
  id: number;
  tone: 'success' | 'danger' | 'neutral';
  message: string;
};

export function verdictFor(runs: Run[]): Verdict {
  const passCount = runs.filter((run) => run.result === 'pass').length;
  if (passCount === runs.length) return 'keep';
  if (passCount === 0) return 'fail';
  return 'flaky';
}

export function divergenceFor(runs: Run[]): number {
  const passCount = runs.filter((run) => run.result === 'pass').length;
  return Math.min(passCount, runs.length - passCount);
}

export function divergentIndexes(runs: Run[]): Set<number> {
  const passCount = runs.filter((run) => run.result === 'pass').length;
  const majority: RunResult = passCount >= runs.length - passCount ? 'pass' : 'fail';
  return new Set(runs.filter((run) => run.result !== majority).map((run) => run.index));
}
