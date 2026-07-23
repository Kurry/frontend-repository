import { create } from 'zustand';
import type { Plan } from './schema';
import { INITIAL_PLAN } from './fixtures';
import { calculateSchedule, routeClip } from './math';

export interface AppState {
  plan: Plan;
  historyStack: Plan[];
  undoStack: Plan[];
  setPlan: (plan: Plan) => void;
  updateClipStatus: (clipId: string, sourceId: string, targetId: string) => void;
  previewClip: (clipId: string, sourceId: string, targetId: string) => void;
  cancelClip: (clipId: string) => void;
  removeClip: (clipId: string) => void;
  restoreClip: (clipId: string) => void;
  previewRoute: (clipId: string, routeKind: string) => void;
  confirmRoute: (clipId: string) => void;
  startRehearsal: () => void;
  stepRehearsal: () => void;
  resetRehearsal: () => void;
  markRehearsal: () => void;
  forkBranch: (branchId: string) => void;
  compareBranches: (targetBranchId: string) => void;
  addComment: (comment: any) => void;
  resolveComment: (commentId: string) => void;
  reviewPlan: (note: string) => void;
  approvePlan: () => void;
  setSelection: (kind: 'clip' | 'task' | 'none', ids: string[], primaryId: string | null) => void;
  setViewport: (x: number, y: number, zoom: number) => void;
  setTimelineBrush: (startMinute: number, endMinute: number) => void;
  setCompareBrush: (startMinute: number, endMinute: number) => void;
  undoActorEvent: (actorId: string) => void;
  redoActorEvent: (actorId: string) => void;
  pushHistory: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  plan: INITIAL_PLAN,
  historyStack: [],
  undoStack: [],

  pushHistory: () => set((state) => ({
    historyStack: [...state.historyStack, JSON.parse(JSON.stringify(state.plan))],
    undoStack: []
  })),

  setPlan: (plan) => {
    get().pushHistory();
    set({ plan });
  },

  updateClipStatus: (clipId, sourceId, targetId) => {
    get().pushHistory();
    set((state) => {
      // Cycle detection
      const adj = new Map<string, string[]>();
      state.plan.tasks.forEach(t => adj.set(t.id, []));
      state.plan.clips.filter(c => c.status === 'committed').forEach(c => {
        if (c.sourceTaskId && c.targetTaskId) adj.get(c.sourceTaskId)!.push(c.targetTaskId);
      });
      adj.get(sourceId)!.push(targetId);

      const visited = new Set<string>();
      const recStack = new Set<string>();
      let hasCycle = false;

      const isCyclic = (node: string) => {
        if (!visited.has(node)) {
          visited.add(node);
          recStack.add(node);
          for (const next of adj.get(node) || []) {
            if (!visited.has(next) && isCyclic(next)) return true;
            else if (recStack.has(next)) return true;
          }
        }
        recStack.delete(node);
        return false;
      };

      for (const t of state.plan.tasks) {
        if (isCyclic(t.id)) hasCycle = true;
      }


      if (hasCycle) {
        // Leave it as preview state so the cycle sheet can render
        const clips = state.plan.clips.map(c => c.id === clipId ? { ...c, status: 'preview' as const, sourceTaskId: sourceId, targetTaskId: targetId } : c);
        return { plan: { ...state.plan, clips } };
      }


      const clips = state.plan.clips.map(c => {
        if (c.id === clipId) {
          const route = routeClip(sourceId, targetId, state.plan.tasks);
          return {
            ...c,
            status: 'committed' as const,
            sourceTaskId: sourceId,
            targetTaskId: targetId,
            routeKind: route?.kind || 'direct',
            routePoints: route?.points || []
          };
        }
        return c;
      });

      const { schedule, issues } = calculateSchedule(state.plan.tasks, clips, state.plan.planStart, state.plan.reviewGate);

      return {
        plan: {
          ...state.plan,
          clips,
          schedule,
          issues
        }
      };
    });
  },

  previewClip: (clipId, sourceId, targetId) => set((state) => {
    const clips = state.plan.clips.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          status: 'preview' as const,
          sourceTaskId: sourceId,
          targetTaskId: targetId
        };
      }
      return c;
    });
    return { plan: { ...state.plan, clips } };
  }),

  cancelClip: (clipId) => set((state) => {
    const clips = state.plan.clips.map(c => {
      if (c.id === clipId && c.status !== 'committed') {
        return {
          ...c,
          status: 'loose' as const,
          sourceTaskId: null,
          targetTaskId: null,
          routeKind: null,
          routePoints: null
        };
      }
      return c;
    });
    return { plan: { ...state.plan, clips } };
  }),

  removeClip: (clipId) => {
    get().pushHistory();
    set((state) => {
      const clips = state.plan.clips.filter(c => c.id !== clipId);
      const { schedule, issues } = calculateSchedule(state.plan.tasks, clips, state.plan.planStart, state.plan.reviewGate);
      return { plan: { ...state.plan, clips, schedule, issues } };
    });
  },

  restoreClip: (_clipId) => {
    get().pushHistory();
    // Simplified stub since we don't have an archive stack
  },

  previewRoute: (_clipId, _routeKind) => set((state) => state),

  confirmRoute: (_clipId) => {
    get().pushHistory();
  },

  startRehearsal: () => set((state) => ({
    plan: { ...state.plan, rehearsal: { ...state.plan.rehearsal, status: 'start', cursor: 0, events: [], mark: null } }
  })),

  stepRehearsal: () => set((state) => {
    const maxCursor = state.plan.schedule.intervals.length;
    const nextCursor = state.plan.rehearsal.cursor + 1;
    const isComplete = nextCursor >= maxCursor;
    return {
      plan: {
        ...state.plan,
        rehearsal: {
          ...state.plan.rehearsal,
          cursor: Math.min(nextCursor, maxCursor),
          status: isComplete ? 'complete' : 'start',
        }
      }
    };
  }),

  resetRehearsal: () => set((state) => ({
    plan: { ...state.plan, rehearsal: { ...state.plan.rehearsal, status: 'not-run', cursor: 0, events: [], mark: null } }
  })),

  markRehearsal: () => set((state) => ({
    plan: { ...state.plan, rehearsal: { ...state.plan.rehearsal, status: 'review', mark: 'VERIFIED-' + Date.now() } }
  })),

  forkBranch: (branchId) => {
    get().pushHistory();
    set((state) => ({
      plan: { ...state.plan, branchId }
    }));
  },

  compareBranches: (_targetBranchId) => set((state) => state),

  addComment: (comment) => {
    get().pushHistory();
    set((state) => ({
      plan: { ...state.plan, comments: [...state.plan.comments, comment] }
    }));
  },

  resolveComment: (_commentId) => {
    get().pushHistory();
  },

  reviewPlan: (_note) => {
    get().pushHistory();
  },

  approvePlan: () => {
    get().pushHistory();
    set((state) => ({
      plan: { ...state.plan, approval: { approvedAt: new Date().toISOString() } }
    }));
  },

  setSelection: (kind, ids, primaryId) => set((state) => ({
    plan: { ...state.plan, selection: { kind, ids, primaryId } }
  })),

  setViewport: (x, y, zoom) => set((state) => ({
    plan: { ...state.plan, viewport: { x, y, zoom } }
  })),

  setTimelineBrush: (startMinute, endMinute) => set((state) => ({
    plan: { ...state.plan, timelineBrush: { startMinute, endMinute } }
  })),

  setCompareBrush: (_startMinute, _endMinute) => set((state) => state),

  undoActorEvent: (_actorId) => set((state) => {
    if (state.historyStack.length === 0) return state;
    const prev = state.historyStack[state.historyStack.length - 1];
    return {
      plan: prev,
      historyStack: state.historyStack.slice(0, -1),
      undoStack: [JSON.parse(JSON.stringify(state.plan)), ...state.undoStack]
    };
  }),

  redoActorEvent: (_actorId) => set((state) => {
    if (state.undoStack.length === 0) return state;
    const next = state.undoStack[0];
    return {
      plan: next,
      historyStack: [...state.historyStack, JSON.parse(JSON.stringify(state.plan))],
      undoStack: state.undoStack.slice(1)
    };
  })
}));
