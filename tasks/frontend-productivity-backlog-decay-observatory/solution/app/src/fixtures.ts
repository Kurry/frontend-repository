import type { Task, ContextCard, Edge, PriorityAllocation } from './types';

// Deterministic data generation helper


export const INITIAL_CONTEXT_CARDS: ContextCard[] = Array.from({ length: 42 }).map((_, i) => ({
  id: `ctx-${i + 1}`,
  revision: 1,
  time: `2024-01-01T12:00:00Z`,
  source: i % 2 === 0 ? 'email' : 'meeting',
  content: `Context evidence details for item ${i + 1}`,
  freshnessHorizonDays: 14 + (i % 7) * 2,
}));

export const INITIAL_TASKS: Task[] = Array.from({ length: 60 }).map((_, i) => {
  const commitmentClass = ['core', 'exploration', 'maintenance', 'leisure'][i % 4] as any;
  return {
    id: `task-${i + 1}`,
    revision: 1,
    outcome: `Outcome for task ${i + 1}`,
    nextAction: `Next action for task ${i + 1}`,
    area: `Area ${i % 6}`,
    effort: 1 + (i % 8), // 1 to 8
    deadline: i % 5 === 0 ? `2024-02-${(10 + i % 15).toString().padStart(2, '0')}T12:00:00Z` : undefined,
    commitmentClass,
    owner: 'user',
    waitingParty: i % 10 === 0 ? 'partner' : undefined,
    completionEvidenceRule: `Must provide PR link or screenshot for ${i + 1}`,
    status: i < 5 ? 'active' : (i < 15 ? 'planned' : (i > 50 ? 'archived' : 'draft')),
    contextBindingIds: [INITIAL_CONTEXT_CARDS[i % 42].id],
  };
});

// Create 35 dependency edges
export const INITIAL_EDGES: Edge[] = Array.from({ length: 35 }).map((_, i) => ({
  id: `edge-${i + 1}`,
  sourceId: INITIAL_TASKS[i].id,
  targetId: INITIAL_TASKS[i + 1].id,
  type: ['blocks', 'requires', 'contributes', 'duplicate-of', 'waiting-on', 'follow-up-after'][i % 6] as any,
}));

// Distribute exactly 100 points
export const INITIAL_ALLOCATIONS: PriorityAllocation[] = [
  ...INITIAL_TASKS.slice(0, 10).map((t) => ({ taskId: t.id, points: 5 })),
  ...INITIAL_TASKS.slice(10, 30).map((t) => ({ taskId: t.id, points: 2 })),
  ...INITIAL_TASKS.slice(30, 40).map((t) => ({ taskId: t.id, points: 1 })),
  // That sums to 50 + 40 + 10 = 100 points exactly.
];
