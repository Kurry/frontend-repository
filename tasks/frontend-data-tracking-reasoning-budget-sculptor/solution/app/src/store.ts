import { create } from 'zustand';
import { FIXTURE } from './fixture';

export type Checkpoint = {
  name: string;
  allocations: Record<string, number>;
};

export type PolicyState = {
  schemaVersion: 'reasoning-budget-policy/v1';
  exportedAt?: string;
  totalCap: number;
  allocations: Record<string, number>;
  lockedPhases: Record<string, boolean>;
  pinnedEvents: Record<string, boolean>;
  fallbacks: Record<string, 'raw' | 'summary' | 'unacceptable'>;
  pressure: 'none' | 'context18k' | 'min-increase' | 'new-anchor';
  checkpoints: Checkpoint[];
  comparison: string | null;
  annotations: Record<string, string>;
};

export type StoreState = {
  policy: PolicyState;
  history: PolicyState[];
  historyIndex: number;
  brushRange: [number, number] | null;
};

export type StoreActions = {
  setAllocation: (phaseId: string, value: number, fromPhaseId?: string) => void;
  toggleLock: (phaseId: string) => void;
  togglePin: (eventId: string) => void;
  setFallback: (eventId: string, fallback: 'raw' | 'summary' | 'unacceptable') => void;
  setPressure: (pressure: StoreState['policy']['pressure']) => void;
  addCheckpoint: (name: string) => void;
  setComparison: (name: string | null) => void;
  setBrushRange: (range: [number, number] | null) => void;
  undo: () => void;
  redo: () => void;
  importPolicy: (policy: PolicyState) => void;
  exportPolicy: () => PolicyState;
};

const defaultAllocations: Record<string, number> = {};
let totalBase = 0;
FIXTURE.phases.forEach(p => {
  defaultAllocations[p.id] = 3000;
  totalBase += 3000;
});

const defaultPolicy: PolicyState = {
  schemaVersion: 'reasoning-budget-policy/v1',
  totalCap: 24000,
  allocations: defaultAllocations,
  lockedPhases: {},
  pinnedEvents: {},
  fallbacks: {},
  pressure: 'none',
  checkpoints: [],
  comparison: null,
  annotations: {},
};

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  policy: defaultPolicy,
  history: [defaultPolicy],
  historyIndex: 0,
  brushRange: null,

  setAllocation: (phaseId, value, fromPhaseId) => {
    set(state => {
      const p = { ...state.policy };
      let newAllocations = { ...p.allocations };
      const diff = value - newAllocations[phaseId];
      if (diff === 0) return state;

      const phase = FIXTURE.phases.find(x => x.id === phaseId);
      const min = state.policy.pressure === 'min-increase' ? phase!.min + 500 : phase!.min;
      const max = phase!.max;

      if (value < min || value > max) return state;

      if (fromPhaseId) {
         if (p.lockedPhases[fromPhaseId] || p.lockedPhases[phaseId]) return state;
         const fromPhase = FIXTURE.phases.find(x => x.id === fromPhaseId);
         const fromMin = state.policy.pressure === 'min-increase' ? fromPhase!.min + 500 : fromPhase!.min;
         const fromMax = fromPhase!.max;
         const newFromVal = newAllocations[fromPhaseId] - diff;
         if (newFromVal < fromMin || newFromVal > fromMax) return state;

         newAllocations[phaseId] = value;
         newAllocations[fromPhaseId] = newFromVal;
      } else {
        if (p.lockedPhases[phaseId]) return state;
        let unlockedPool = 0;
        let unlockedWeight = 0;
        for (const pid of Object.keys(newAllocations)) {
          if (!p.lockedPhases[pid] && pid !== phaseId) {
            unlockedPool += newAllocations[pid];
            unlockedWeight += 1;
          }
        }
        if (unlockedWeight === 0 || unlockedPool < diff) return state;

        newAllocations[phaseId] = value;
        const deductPerPhase = Math.floor(diff / unlockedWeight);
        let remainder = diff - deductPerPhase * unlockedWeight;

        for (const pid of Object.keys(newAllocations)) {
          if (!p.lockedPhases[pid] && pid !== phaseId) {
            let deduct = deductPerPhase;
            if (remainder > 0) {
              deduct += 1;
              remainder -= 1;
            } else if (remainder < 0) {
              deduct -= 1;
              remainder += 1;
            }
            newAllocations[pid] -= deduct;
          }
        }
      }

      p.allocations = newAllocations;
      const history = state.history.slice(0, state.historyIndex + 1);
      return {
        policy: p,
        history: [...history, p],
        historyIndex: history.length
      };
    });
  },
  toggleLock: (phaseId) => set(state => {
    const p = { ...state.policy, lockedPhases: { ...state.policy.lockedPhases } };
    p.lockedPhases[phaseId] = !p.lockedPhases[phaseId];
    const history = state.history.slice(0, state.historyIndex + 1);
    return { policy: p, history: [...history, p], historyIndex: history.length };
  }),
  togglePin: (eventId) => set(state => {
    const p = { ...state.policy, pinnedEvents: { ...state.policy.pinnedEvents } };
    p.pinnedEvents[eventId] = !p.pinnedEvents[eventId];
    const history = state.history.slice(0, state.historyIndex + 1);
    return { policy: p, history: [...history, p], historyIndex: history.length };
  }),
  setFallback: (eventId, fallback) => set(state => {
    const p = { ...state.policy, fallbacks: { ...state.policy.fallbacks } };
    p.fallbacks[eventId] = fallback;
    const history = state.history.slice(0, state.historyIndex + 1);
    return { policy: p, history: [...history, p], historyIndex: history.length };
  }),
  setPressure: (pressure) => set(state => {
    const p = { ...state.policy, pressure };
    if (pressure === 'context18k') p.totalCap = 18000;
    else p.totalCap = 24000;
    const history = state.history.slice(0, state.historyIndex + 1);
    return { policy: p, history: [...history, p], historyIndex: history.length };
  }),
  addCheckpoint: (name) => set(state => {
    const p = { ...state.policy, checkpoints: [...state.policy.checkpoints, { name, allocations: state.policy.allocations }] };
    const history = state.history.slice(0, state.historyIndex + 1);
    return { policy: p, history: [...history, p], historyIndex: history.length };
  }),
  setComparison: (name) => set(state => {
    const p = { ...state.policy, comparison: name };
    return { policy: p };
  }),
  setBrushRange: (range) => set({ brushRange: range }),
  undo: () => set(state => {
    if (state.historyIndex > 0) {
      return {
        historyIndex: state.historyIndex - 1,
        policy: state.history[state.historyIndex - 1]
      };
    }
    return state;
  }),
  redo: () => set(state => {
    if (state.historyIndex < state.history.length - 1) {
      return {
        historyIndex: state.historyIndex + 1,
        policy: state.history[state.historyIndex + 1]
      };
    }
    return state;
  }),
  importPolicy: (policy) => set({ policy, history: [policy], historyIndex: 0 }),
  exportPolicy: () => {
    const { policy } = get();
    return { ...policy, exportedAt: new Date().toISOString() };
  }
}));

export function useDerivedState(policy: PolicyState) {
  const events = FIXTURE.events.map(e => ({ ...e, state: 'truncated' as 'retained' | 'truncated' | 'pinned' | 'rescued' | 'impossible' }));
  const costs: Record<string, number> = {};
  FIXTURE.phases.forEach(p => costs[p.id] = 0);

  const required = new Set<string>();
  const activeSummaries = new Set<string>();

  for (const eventId of Object.keys(policy.pinnedEvents)) {
    if (policy.pinnedEvents[eventId]) {
      const fallback = policy.fallbacks[eventId];
      if (fallback === 'unacceptable') continue;

      if (fallback === 'summary') {
        const summary = FIXTURE.summaries.find(s => s.anchorId === eventId);
        if (summary) activeSummaries.add(summary.id);
      } else {
        required.add(eventId);
        let queue = [eventId];
        while(queue.length > 0) {
           const curr = queue.shift()!;
           const deps = FIXTURE.dependencies.filter(d => d.to === curr).map(d => d.from);
           deps.forEach(d => {
             if (!required.has(d)) {
               required.add(d);
               queue.push(d);
             }
           });
        }
      }
    }
  }

  for (const event of events) {
    if (activeSummaries.has(`s${event.id.slice(1)}`)) {
      event.state = 'retained';
      costs[event.phaseId] += event.weight;
      continue;
    }

    if (required.has(event.id)) {
      if (policy.pinnedEvents[event.id]) event.state = 'pinned';
      else event.state = 'rescued';
      costs[event.phaseId] += event.weight;
    } else {
      if (costs[event.phaseId] + event.weight <= policy.allocations[event.phaseId]) {
         event.state = 'retained';
         costs[event.phaseId] += event.weight;
      }
    }
  }

  FIXTURE.phases.forEach(p => {
    if (costs[p.id] > policy.allocations[p.id]) {
      events.filter(e => e.phaseId === p.id && (e.state === 'pinned' || e.state === 'rescued')).forEach(e => {
         e.state = 'impossible';
      });
    }
  });

  return { events, costs };
}
