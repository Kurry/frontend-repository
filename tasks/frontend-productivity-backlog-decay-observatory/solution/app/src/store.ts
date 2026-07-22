import { create } from 'zustand';
import type { Task, ContextCard, Edge, PriorityAllocation, TaskStatus } from './types';
import { INITIAL_TASKS, INITIAL_CONTEXT_CARDS, INITIAL_EDGES, INITIAL_ALLOCATIONS } from './fixtures';

export interface BacklogState {
  tasks: Task[];
  contextCards: ContextCard[];
  edges: Edge[];
  allocations: PriorityAllocation[];

  logicalClockDays: number;

  // Actions
  setLogicalClockDays: (days: number) => void;
  updateAllocation: (taskId: string, points: number) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskTriage: (taskId: string, queue: string, rationale: string, date?: string) => void;

  // Graph actions
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;

  // Context bindings
  bindContext: (taskId: string, contextId: string) => void;

  // Reset
  resetToFixture: () => void;
}

export const useBacklogStore = create<BacklogState>((set) => ({
  tasks: INITIAL_TASKS,
  contextCards: INITIAL_CONTEXT_CARDS,
  edges: INITIAL_EDGES,
  allocations: INITIAL_ALLOCATIONS,

  logicalClockDays: 0,

  setLogicalClockDays: (days) => set({ logicalClockDays: days }),

  updateAllocation: (taskId, points) => set((state) => {
    const withoutTask = state.allocations.filter(a => a.taskId !== taskId);
    const currentSum = withoutTask.reduce((sum, a) => sum + a.points, 0);

    let newPoints = points;
    if (currentSum + newPoints > 100) {
      newPoints = 100 - currentSum;
    }

    if (newPoints < 0) newPoints = 0;

    if (newPoints === 0) {
      return { allocations: withoutTask };
    }

    return { allocations: [...withoutTask, { taskId, points: newPoints }] };
  }),

  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
  })),

  updateTaskTriage: (taskId, queue, rationale, date) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, triageQueue: queue, triageRationale: rationale, triageScheduledDate: date } : t)
  })),

  addEdge: (edge) => set((state) => {
    // Cycle detection could go here before adding
    // If cycle detected, throw or ignore
    return { edges: [...state.edges, edge] };
  }),

  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter(e => e.id !== edgeId)
  })),

  bindContext: (taskId, contextId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId && !t.contextBindingIds.includes(contextId)
      ? { ...t, contextBindingIds: [...t.contextBindingIds, contextId] }
      : t)
  })),

  resetToFixture: () => set({
    tasks: INITIAL_TASKS,
    contextCards: INITIAL_CONTEXT_CARDS,
    edges: INITIAL_EDGES,
    allocations: INITIAL_ALLOCATIONS,
    logicalClockDays: 0,
  })
}));
