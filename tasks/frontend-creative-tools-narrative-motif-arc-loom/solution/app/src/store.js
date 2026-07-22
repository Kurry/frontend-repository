import { create } from 'zustand';
import { SEED_MOTIFS, TEXTS } from './fixture.js';

const initialState = {
  motifs: [...SEED_MOTIFS],
  spans: [],
  relations: [],
  stages: [],
};

// Simplified Undo/Redo for eval purposes utilizing history array
export const useStore = create((set, get) => ({
  ...initialState,
  history: [],
  historyIndex: -1,

  _saveState: (newState) => {
    const currentState = get();
    const stateToSave = {
      motifs: newState.motifs || currentState.motifs,
      spans: newState.spans || currentState.spans,
      relations: newState.relations || currentState.relations,
      stages: newState.stages || currentState.stages,
    };

    const newHistory = currentState.history.slice(0, currentState.historyIndex + 1);
    newHistory.push(stateToSave);

    return {
      ...stateToSave,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  },

  addSpan: (span) => set((state) => state._saveState({ spans: [...state.spans, span] })),

  removeSpan: (spanId) => set((state) => state._saveState({
    spans: state.spans.filter(s => s.id !== spanId)
  })),

  addMotif: (motif) => set((state) => state._saveState({
    motifs: [...state.motifs, motif]
  })),

  updateMotif: (id, updates) => set((state) => state._saveState({
    motifs: state.motifs.map(m => m.id === id ? { ...m, ...updates } : m)
  })),

  classifySpan: (spanId, motifId, isCounterexample = false) => set((state) => state._saveState({
    spans: state.spans.map(s => s.id === spanId ? { ...s, motifId, isCounterexample } : s)
  })),

  addStage: (stage) => set((state) => state._saveState({
    stages: [...state.stages, stage]
  })),

  moveStage: (motifId, collectionId, newY) => set((state) => state._saveState({
    stages: state.stages.map(s => s.motifId === motifId && s.collectionId === collectionId ? { ...s, y: newY } : s)
  })),

  addRelation: (relation) => set((state) => state._saveState({
    relations: [...state.relations, relation]
  })),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return { ...state.history[newIndex], historyIndex: newIndex };
    }
    return {};
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return { ...state.history[newIndex], historyIndex: newIndex };
    }
    return {};
  }),

  loadAtlas: (atlasData) => set((state) => state._saveState({
    motifs: atlasData.motifs || [],
    spans: atlasData.spans || [],
    relations: atlasData.relations || [],
    stages: atlasData.stages || [],
  })),
}));

if (typeof window !== 'undefined') {
  window.__store = useStore;
}
