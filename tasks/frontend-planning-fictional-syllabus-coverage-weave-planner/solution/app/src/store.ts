import { create } from 'zustand';
import type { StudyPlan, Scenario, AppEvent, AllocationKnot } from './types';
import { initialStudyPlan } from './data';

interface State extends StudyPlan {
  setActiveScenario: (id: string) => void;
  selectEntity: (id: string | null) => void;
  setBrush: (brush: { startIso: string; endIso: string } | null) => void;
  moveAllocation: (knotId: string, toSessionId: string, toOrder: number, toOffsetMinutes: number, minutes: number, logicalAt: string) => void;
  undo: () => void;
  redo: () => void;
  forkScenario: (fromId: string, toId: string) => void;
  compareScenarios: (id: string | null) => void;
  startRehearsal: () => void;
  stepRehearsal: () => void;
  resetRehearsal: () => void;
  approvePlan: () => void;
  importState: (newState: StudyPlan) => void;
  resetSession: () => void;
}

export const useStore = create<State>((set, get) => ({
  ...initialStudyPlan,

  setActiveScenario: (id) => set((state) => ({ workspace: { ...state.workspace, activeScenarioId: id } })),
  selectEntity: (id) => set((state) => ({ workspace: { ...state.workspace, selectedEntityId: id } })),
  setBrush: (brush) => set((state) => ({ workspace: { ...state.workspace, brush } })),

  moveAllocation: (knotId, toSessionId, toOrder, toOffsetMinutes, minutes, logicalAt) => set((state) => {
    const activeScenario = state.scenarios.find(s => s.id === state.workspace.activeScenarioId);
    if (!activeScenario) return state;

    const knotIndex = activeScenario.allocations.findIndex(a => a.id === knotId);
    if (knotIndex === -1) return state;
    const knot = activeScenario.allocations[knotIndex];

    const newAllocations = [...activeScenario.allocations];
    newAllocations[knotIndex] = {
      ...knot,
      sessionId: toSessionId,
      order: toOrder,
      minutes,
    };

    const newEvent: AppEvent = {
      id: `EVT-${Date.now()}`,
      type: 'allocation.move',
      actorId: 'Sol', // mock
      scenarioId: activeScenario.id,
      timestamp: new Date().toISOString(),
      payload: { knotId, fromSessionId: knot.sessionId, toSessionId, toOrder, toOffsetMinutes, minutes, logicalAt },
      hash: 'newhash'
    };

    const newScenario = { ...activeScenario, allocations: newAllocations, events: [...activeScenario.events, newEvent] };
    const newScenarios = state.scenarios.map(s => s.id === activeScenario.id ? newScenario : s);

    return { scenarios: newScenarios };
  }),

  undo: () => set((state) => { return state; }),
  redo: () => set((state) => { return state; }),

  forkScenario: (fromId, toId) => set((state) => {
    const fromScenario = state.scenarios.find(s => s.id === fromId);
    if (!fromScenario) return state;
    const newScenario: Scenario = {
      ...fromScenario,
      id: toId,
      name: toId,
      allocations: JSON.parse(JSON.stringify(fromScenario.allocations))
    };
    return { scenarios: [...state.scenarios, newScenario], workspace: { ...state.workspace, activeScenarioId: toId } };
  }),

  compareScenarios: (id) => set((state) => ({ workspace: { ...state.workspace, compareScenarioId: id } })),

  startRehearsal: () => set((state) => ({ workspace: { ...state.workspace, replayCursor: 0 } })),
  stepRehearsal: () => set((state) => {
    const cursor = state.workspace.replayCursor;
    if (cursor === null) return state;
    return { workspace: { ...state.workspace, replayCursor: cursor + 1 } };
  }),
  resetRehearsal: () => set((state) => ({ workspace: { ...state.workspace, replayCursor: null } })),

  approvePlan: () => set((state) => ({ approvals: [...state.approvals, { id: 'APP-1', scenarioId: state.workspace.activeScenarioId, timestamp: new Date().toISOString() }] })),

  importState: (newState) => set(() => newState),
  resetSession: () => set(() => initialStudyPlan),
}));
