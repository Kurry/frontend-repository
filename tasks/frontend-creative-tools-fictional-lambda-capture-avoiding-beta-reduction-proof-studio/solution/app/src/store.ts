import { create } from 'zustand';
import { LambdaNode, Binder, RevisionPhase, ReplayFrame, HistoryEvent, Review, NodeId, BinderId } from './types';

export interface LambdaState {
  // Current view
  phase: RevisionPhase;
  nodes: Record<NodeId, LambdaNode>;
  binders: Record<BinderId, Binder>;
  frames: ReplayFrame[];
  history: HistoryEvent[];
  reviews: Review[];

  // Editor states
  dragTargetId: NodeId | null;
  dragOverScopeBinderId: BinderId | null;
  previewFreshName: string | null;
  reducedMotion: boolean;

  // Actions
  reset: () => void;
  simulateDragDetour: (redexId: NodeId, argumentId: NodeId, freshName: string, strategy: string) => void;
  setReducedMotion: (val: boolean) => void;
  setDragTarget: (id: NodeId | null) => void;
  setDragOverScope: (id: BinderId | null) => void;
  setPreviewFreshName: (name: string | null) => void;
  confirmBetaReduction: () => void;
  cancelBetaReduction: () => void;
  importState: (state: Partial<LambdaState>) => void;
}

export const initialNodes: Record<NodeId, LambdaNode> = {
  'APP-ROOT': { id: 'APP-ROOT', kind: 'Application', parentId: 'root', parentSlot: 'root', active: true },
  'ABS-X': { id: 'ABS-X', kind: 'Abstraction', parentId: 'APP-ROOT', parentSlot: 'function', displayName: 'λx', binderId: 'BINDER-X', active: true },
  'ABS-INNER': { id: 'ABS-INNER', kind: 'Abstraction', parentId: 'ABS-X', parentSlot: 'body', displayName: 'λy', binderId: 'BINDER-Y', active: true },
  'APP-INNER': { id: 'APP-INNER', kind: 'Application', parentId: 'ABS-INNER', parentSlot: 'body', active: true },
  'VAR-X': { id: 'VAR-X', kind: 'Variable', parentId: 'APP-INNER', parentSlot: 'function', displayName: 'x', active: true },
  'VAR-INNER-Y': { id: 'VAR-INNER-Y', kind: 'Variable', parentId: 'APP-INNER', parentSlot: 'argument', displayName: 'y', active: true },
  'VAR-ARG-Y': { id: 'VAR-ARG-Y', kind: 'Variable', parentId: 'APP-ROOT', parentSlot: 'argument', displayName: 'y', active: true },
};

export const initialBinders: Record<BinderId, Binder> = {
  'BINDER-X': { id: 'BINDER-X', name: 'x', abstractionNodeId: 'ABS-X', active: true },
  'BINDER-Y': { id: 'BINDER-Y', name: 'y', abstractionNodeId: 'ABS-INNER', active: true },
};

export const useLambdaStore = create<LambdaState>((set, get) => ({
  phase: 'Draft',
  nodes: structuredClone(initialNodes),
  binders: structuredClone(initialBinders),
  frames: [],
  history: [],
  reviews: [],

  dragTargetId: null,
  dragOverScopeBinderId: null,
  previewFreshName: null,
  reducedMotion: false,

  reset: () => set({
    phase: 'Draft',
    nodes: structuredClone(initialNodes),
    binders: structuredClone(initialBinders),
    dragTargetId: null,
    dragOverScopeBinderId: null,
    previewFreshName: null,
  }),

  simulateDragDetour: (redexId, argumentId, freshName, strategy) => {
    // handled by reducer
  },

  setReducedMotion: (val) => set({ reducedMotion: val }),
  setDragTarget: (id) => set({ dragTargetId: id }),
  setDragOverScope: (id) => set({ dragOverScopeBinderId: id }),
  setPreviewFreshName: (name) => set({ previewFreshName: name }),

  confirmBetaReduction: () => {
    // handled by reducer
  },

  cancelBetaReduction: () => {
    set({
      dragTargetId: null,
      dragOverScopeBinderId: null,
      previewFreshName: null,
    });
  },

  importState: (state) => set(state),
}));
