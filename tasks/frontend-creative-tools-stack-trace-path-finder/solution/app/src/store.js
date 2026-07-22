import { create } from 'zustand';
import { fixtureGraph, RAW_TRACE_FIXTURE } from './fixture';
import { parseTrace, computePath } from './utils';

export const useStore = create((set, get) => ({
  rawTrace: RAW_TRACE_FIXTURE,
  frames: [],
  hypotheses: [],
  activeHypothesisId: null,
  graph: fixtureGraph,
  path: [],
  valid: true,
  contradictions: [],
  annotations: [],
  history: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selection: null,

  setRawTrace: (text) => {
    const frames = parseTrace(text);
    set({ rawTrace: text, frames });
    get().recomputePath();
  },

  updateFrame: (id, updates) => {
    set(state => {
      const newFrames = state.frames.map(f => f.id === id ? { ...f, ...updates } : f);
      return { frames: newFrames };
    });
    get().recomputePath();
  },

  reorderFrames: (fromIndex, toIndex) => {
    set(state => {
      const newFrames = [...state.frames];
      const [moved] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, moved);
      return { frames: newFrames };
    });
    get().recomputePath();
  },

  mapCandidate: (frameId, nodeId) => {
    set(state => {
      const newFrames = state.frames.map(f => f.id === frameId ? { ...f, mappedNode: nodeId, pinned: nodeId } : f);
      return { frames: newFrames };
    });
    get().recomputePath();
  },

  recomputePath: () => {
    const { frames, graph } = get();
    const { path, valid, contradictions } = computePath(frames, graph.edges);
    set({ path, valid, contradictions });
  },

  saveHypothesis: (name) => {
    set(state => {
      const hyp = {
        id: Date.now().toString(),
        name,
        frames: state.frames,
        path: state.path,
        valid: state.valid,
        contradictions: state.contradictions
      };
      const hypotheses = [...state.hypotheses, hyp];
      return { hypotheses, activeHypothesisId: hyp.id };
    });
  },

  loadHypothesis: (id) => {
    set(state => {
      const hyp = state.hypotheses.find(h => h.id === id);
      if (!hyp) return state;
      return {
        activeHypothesisId: id,
        frames: hyp.frames,
        path: hyp.path,
        valid: hyp.valid,
        contradictions: hyp.contradictions
      };
    });
  },

  deleteHypothesis: (id) => {
    set(state => ({
      hypotheses: state.hypotheses.filter(h => h.id !== id),
      activeHypothesisId: state.activeHypothesisId === id ? null : state.activeHypothesisId
    }));
  },

  importSession: (data) => {
    set(data);
    get().recomputePath();
  }
}));
