const MODELS = ['Larkspur-9', 'Quillon-2', 'Basalt-Mini']

const TASK_BLUEPRINTS = [
  {
    id: 'task-config-recovery',
    name: 'Config recovery',
    short: 'Repair a layered application configuration without changing its public contract.',
    instruction: `# Recover the deployment configuration\n\nThe service fails during startup after a partial configuration migration. Restore a valid layered configuration while preserving the existing public API.\n\n## Requirements\n\n- Keep all documented environment keys compatible.\n- Repair the schema and the production override.\n- Add a regression test for missing optional values.\n- Do not introduce network dependencies.`,
    config: { Runtime: 'Node 22', Budget: '18 min', Sandbox: 'Isolated', Evaluator: '12 assertions' },
    tests: ['loads the base configuration', 'merges production overrides', 'preserves optional defaults', 'rejects unknown secrets'],
    focus: 'configuration schema',
  },
  {
    id: 'task-ledger-audit',
    name: 'Ledger audit',
    short: 'Find and correct a rounding defect in a small transaction reconciliation tool.',
    instruction: `# Audit the reconciliation ledger\n\nA batch reconciliation command reports inconsistent totals for mixed-currency entries. Find the defect and make the smallest safe correction.\n\n## Acceptance criteria\n\n1. Decimal values retain exact cent precision.\n2. Reversed entries balance the original transaction.\n3. Existing CSV output columns remain unchanged.\n4. The complete audit suite passes.`,
    config: { Runtime: 'Python 3.13', Budget: '16 min', Sandbox: 'Isolated', Evaluator: '15 assertions' },
    tests: ['balances reversed entries', 'retains cent precision', 'keeps CSV column order', 'handles an empty ledger'],
    focus: 'rounding pipeline',
  },
  {
    id: 'task-cache-eviction',
    name: 'Cache eviction',
    short: 'Stabilize an LRU cache under concurrent reads and deterministic expiry.',
    instruction: `# Stabilize cache eviction\n\nThe in-memory cache intermittently evicts a recently used entry when expiry and reads overlap. Correct the ordering defect and document the invariant.\n\n## Constraints\n\n- Preserve the current cache constructor.\n- Avoid background threads.\n- Make expiry deterministic under the supplied clock.\n- Cover the reported interleaving with a focused test.`,
    config: { Runtime: 'Go 1.24', Budget: '20 min', Sandbox: 'Isolated', Evaluator: '14 assertions' },
    tests: ['refreshes recency on read', 'expires under supplied clock', 'preserves constructor API', 'handles concurrent lookup order'],
    focus: 'eviction ordering',
  },
]

const summaries = (focus) => [
  `Read the task and identify the ${focus} invariant`,
  'List the reference workspace files',
  'Inspect the primary implementation',
  'Trace the failing test expectation',
  'Run the focused regression test',
  'Compare observed and expected state',
  'Apply the smallest implementation patch',
  'Re-open the changed module',
  'Run the targeted test suite',
  'Inspect the generated results table',
  'Remove an obsolete compatibility file',
  'Capture the repaired workspace',
  'Run the complete verification suite',
  'Summarize the repair and residual risk',
]

const types = [
  'reasoning', 'tool-call', 'observation', 'reasoning', 'terminal', 'observation', 'tool-call',
  'observation', 'terminal', 'tool-call', 'tool-call', 'screenshot', 'terminal', 'reasoning',
]

function makeSteps(task, trialIndex, failed) {
  return summaries(task.focus).map((summary, i) => {
    const index = i + 1
    const isError = failed && index === 9
    const type = types[i]
    const toolName = type === 'tool-call' ? (index === 7 ? 'apply_patch' : index === 10 ? 'read_file' : index === 11 ? 'delete_file' : 'list_files') : undefined
    const terminal = type === 'terminal'
      ? index === 5
        ? `$ npm test -- --run focused\n\nFAIL focused regression\nExpected stable ordering, received stale ordering\n1 failed, 7 passed`
        : index === 9
          ? (isError ? `$ npm test -- --run targeted\n\nFAIL ordering.spec\nAssertionError: expected 4, received 3\nProcess exited with code 1` : `$ npm test -- --run targeted\n\nPASS ordering.spec\n9 tests passed in 1.42s`)
          : `$ npm run verify\n\nChecking types... done\nRunning 14 assertions... done\nAll checks passed in 3.08s`
      : ''
    return {
      index,
      type,
      summary,
      timestamp: `00:${String(index * 7 + trialIndex * 2).padStart(2, '0')}`,
      status: isError ? 'error' : index === 7 ? 'complete' : 'complete',
      message: index === 1
        ? `Established the evaluation boundary and the key ${task.focus} invariant before making changes.`
        : `${summary}. The agent recorded the result and used it to choose the next bounded action.`,
      reasoning: `I need to keep the change narrow and evidence-led. At step ${index}, I will verify the relevant assumption, preserve the existing interface, and avoid altering unrelated files.`,
      tool: toolName ? {
        name: toolName,
        status: isError ? 'error' : 'complete',
        input: toolName === 'apply_patch' ? 'src/engine.ts · bounded diff' : toolName === 'delete_file' ? 'docs/legacy-notes.md' : 'workspace scope',
        output: isError ? 'Command completed with a failing assertion; the workspace remains inspectable.' : 'Operation completed and the timeline index was updated.',
      } : null,
      observation: ['observation', 'terminal', 'screenshot'].includes(type)
        ? (isError ? 'The targeted suite still exposes the ordering defect on this trial.' : `The ${task.focus} evidence is consistent with the current hypothesis.`)
        : '',
      terminal,
      screenshot: type === 'screenshot' ? '/trial-capture.svg' : '',
    }
  })
}

const referenceFiles = (task) => [
  { path: 'README.md', type: 'markdown', content: `# ${task.name}\n\nReference workspace for the **${task.name.toLowerCase()}** benchmark.\n\n- deterministic evaluator\n- isolated dependencies\n- documented public interface` },
  { path: 'src/engine.ts', type: 'code', language: 'typescript', content: `export function reconcile(input: number[]) {\n  return input.reduce((total, value) => total + value, 0)\n}\n\nexport const invariant = '${task.focus}'\n` },
  { path: 'assets/reference-state.png', type: 'image', content: '/trial-capture.svg' },
  { path: 'data/expected.csv', type: 'table', content: 'case,status,value\nbaseline,pass,12\nedge,pass,7\nrecovery,pass,4' },
  { path: 'docs/legacy-notes.md', type: 'markdown', content: '# Legacy notes\n\nCompatibility guidance retained for the reference environment.' },
  { path: 'tests/engine.spec.ts', type: 'code', language: 'typescript', content: `import { invariant } from '../src/engine'\n\ntest('preserves the invariant', () => {\n  expect(invariant).toBeTruthy()\n})` },
]

const trialFiles = (task) => [
  { path: 'README.md', type: 'markdown', content: `# ${task.name}\n\nThe repair preserves the public contract and documents the **${task.focus}** invariant.`, change: 'Modified', step: 4 },
  { path: 'src/engine.ts', type: 'code', language: 'typescript', content: `type Entry = { value: number; touchedAt: number }\n\nexport function reconcile(entries: Entry[]) {\n  return entries\n    .sort((a, b) => a.touchedAt - b.touchedAt)\n    .reduce((sum, entry) => sum + entry.value, 0)\n}\n`, before: `export function reconcile(input: number[]) {\n  return input.reduce((total, value) => total + value, 0)\n}\n`, change: 'Added', step: 2 },
  { path: 'tests/engine.spec.ts', type: 'code', language: 'typescript', content: `import { reconcile } from '../src/engine'\n\ntest('keeps deterministic order', () => {\n  expect(reconcile([{ value: 4, touchedAt: 1 }])).toBe(4)\n})`, change: 'Modified', step: 7 },
  { path: 'assets/reference-state.png', type: 'image', content: '/trial-capture.svg' },
  { path: 'data/expected.csv', type: 'table', content: 'case,status,value\nbaseline,pass,12', change: 'Truncated', step: 10 },
  { path: 'docs/legacy-notes.md', type: 'markdown', content: '# Legacy notes\n\nThis file was removed by the agent.', change: 'Deleted', step: 11 },
  { path: 'artifacts/extremely-long-generated-verification-summary-for-reviewers.json', type: 'code', language: 'json', content: `{\n  "status": "pass",\n  "focus": "${task.focus}"\n}`, change: 'Added', step: 13 },
]

const rewardSets = [
  [0.92, 0.68, 0.41],
  [0.87, 0.74, 0.36],
  [0.95, 0.63, 0.29],
]

export const tasks = TASK_BLUEPRINTS.map((task, taskIndex) => ({
  ...task,
  referenceFiles: referenceFiles(task),
  trials: MODELS.map((model, trialIndex) => {
    const reward = rewardSets[taskIndex][trialIndex]
    const failed = trialIndex === 2
    return {
      id: `${task.id}-trial-${trialIndex + 1}`,
      taskId: task.id,
      model,
      reward,
      outcome: reward >= 0.6 ? 'pass' : 'fail',
      duration: `${8 + taskIndex * 2 + trialIndex}m ${12 + trialIndex * 9}s`,
      stepCount: 14,
      steps: makeSteps(task, trialIndex, failed),
      files: trialFiles(task),
    }
  }),
}))

export const taskById = (id) => tasks.find((task) => task.id === id)
export const trialById = (id) => tasks.flatMap((task) => task.trials).find((trial) => trial.id === id)

