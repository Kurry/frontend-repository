import type { Condition, Reason, Run, RunResult, Suite, Test } from './types';
import { CONDITIONS, REASONS } from './types';

const names = [
  'loads cached user policy',
  'renders terminal snapshot',
  'applies workspace quota',
  'cleans isolated temp tree',
  'resolves service hostname',
  'normalizes local timestamp',
  'streams parallel workers',
  'persists command history',
  'retries interrupted upload',
  'orders generated fixtures',
  'scopes environment patch',
  'releases process handle',
];

const patterns: RunResult[][] = [
  ['pass', 'pass', 'pass', 'pass', 'pass'],
  ['fail', 'fail', 'fail', 'fail', 'fail'],
  ['pass', 'pass', 'fail', 'pass', 'pass'],
  ['fail', 'pass', 'fail', 'fail', 'fail'],
  ['pass', 'fail', 'pass', 'fail', 'pass'],
  ['pass', 'pass', 'pass', 'pass', 'pass'],
  ['fail', 'fail', 'fail', 'fail', 'fail'],
  ['pass', 'pass', 'pass', 'fail', 'pass'],
  ['fail', 'fail', 'pass', 'fail', 'fail'],
  ['pass', 'pass', 'pass', 'pass', 'pass'],
  ['pass', 'fail', 'pass', 'pass', 'pass'],
  ['fail', 'fail', 'fail', 'fail', 'fail'],
];

function runsFor(results: RunResult[], offset: number): Run[] {
  return results.map((result, index) => ({
    index: index + 1,
    result,
    condition: CONDITIONS[(index + offset) % CONDITIONS.length] as Condition,
  }));
}

function makeTests(prefix: string, offset: number): Test[] {
  return names.map((name, index) => ({
    id: `${prefix} › ${name}`,
    reason: REASONS[(index + offset) % REASONS.length] as Reason,
    runs: runsFor(patterns[(index + offset) % patterns.length], index + offset),
    rerunAttempt: 0,
  }));
}

export function seedSuites(): Suite[] {
  return [
    {
      id: 'suite-web-runtime',
      name: 'Web runtime · Chromium',
      subtitle: 'Generated PR #4821 · linux-x64',
      tests: makeTests('runtime', 0),
      audit: [],
    },
    {
      id: 'suite-cli-contracts',
      name: 'CLI contracts · Node 22',
      subtitle: 'Generated PR #4824 · ubuntu-latest',
      tests: makeTests('cli', 3),
      audit: [],
    },
    {
      id: 'suite-worker-pool',
      name: 'Worker pool · Parallel',
      subtitle: 'Generated PR #4829 · 8 executors',
      tests: makeTests('workers', 6),
      audit: [],
    },
  ];
}
