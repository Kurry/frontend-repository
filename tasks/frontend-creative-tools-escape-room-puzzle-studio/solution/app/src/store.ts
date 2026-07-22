import { create } from 'zustand';

export type Prop = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
};

export type Node = {
  id: string;
  type: 'action' | 'clue' | 'fact' | 'item' | 'lock';
  label: string;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
};

export type PlaytestEvent = {
  id: string;
  actionId: string;
  timestamp: number;
};

type State = {
  props: Prop[];
  nodes: Node[];
  edges: Edge[];
  events: PlaytestEvent[];
  addProp: (p: Prop) => void;
  updateProp: (id: string, updates: Partial<Prop>) => void;
  removeProp: (id: string) => void;
  addNode: (n: Node) => void;
  removeNode: (id: string) => void;
  addEdge: (e: Edge) => void;
  removeEdge: (id: string) => void;
  addEvent: (e: PlaytestEvent) => void;
  importState: (s: any) => void;
};

export const useStore = create<State>((set) => ({
  props: [],
  nodes: [],
  edges: [],
  events: [],
  addProp: (p) => set((state) => ({ props: [...state.props, p] })),
  updateProp: (id, updates) => set((state) => ({ props: state.props.map(p => p.id === id ? { ...p, ...updates } : p) })),
  removeProp: (id) => set((state) => ({ props: state.props.filter(p => p.id !== id) })),
  addNode: (n) => set((state) => ({ nodes: [...state.nodes, n] })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter(n => n.id !== id) })),
  addEdge: (e) => set((state) => ({ edges: [...state.edges, e] })),
  removeEdge: (id) => set((state) => ({ edges: state.edges.filter(e => e.id !== id) })),
  addEvent: (e) => set((state) => ({ events: [...state.events, e] })),
  importState: (s) => set(() => ({ ...s }))
}));
