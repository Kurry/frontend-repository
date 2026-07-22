import { create } from 'zustand';
import { loadFixtures } from './fixtures.js';
import { v4 as uuidv4 } from 'uuid';

export const useStore = create((set, get) => ({
  isLoaded: false,
  sources: [],
  forecasts: [],
  dependencies: [],
  evidenceBindings: [],
  ambiguousOutcomePacket: null,
  clockEvents: [],
  selectedForecastId: null,
  selectedVersion: null,
  reviews: [],
  counterfactuals: {},

  init: () => {
    const fixtures = loadFixtures();
    set({ ...fixtures, isLoaded: true });
  },

  setStoreState: (newState) => set((state) => ({ ...state, ...newState })),

  addForecast: (forecast) => set((state) => ({
    forecasts: [...state.forecasts, { ...forecast, id: uuidv4(), version: 1, history: [{ version: 1, probability: forecast.probability, timestamp: new Date().toISOString(), cause: 'initial commit' }] }]
  })),

  amendForecast: (id, updates, cause) => set((state) => {
    return {
      forecasts: state.forecasts.map(f => {
        if (f.id === id) {
          const nextVersion = f.version + 1;
          const updated = { ...f, ...updates, version: nextVersion };
          updated.history = [
            ...f.history,
            { version: nextVersion, probability: updates.probability || f.probability, timestamp: new Date().toISOString(), cause }
          ];
          return updated;
        }
        return f;
      })
    };
  }),

  selectForecast: (id, version = null) => set({
    selectedForecastId: id,
    selectedVersion: version
  }),

  bindEvidence: (forecastId, sourceId, type, weight, note) => set((state) => ({
    evidenceBindings: [...state.evidenceBindings, { id: uuidv4(), forecastId, sourceId, type, weight, note }]
  })),

  addDependency: (from, to, type, formula) => set((state) => ({
    dependencies: [...state.dependencies, { id: uuidv4(), from, to, type, formula }]
  })),

  adjudicateOutcome: (id, outcomeId, status, documentation) => set((state) => ({
    forecasts: state.forecasts.map(f => {
      if (f.id === id) {
        return { ...f, status, resolvedOutcomeId: outcomeId, adjudicationDocs: documentation };
      }
      return f;
    })
  })),

  addReview: (review) => set((state) => ({
    reviews: [...state.reviews, { ...review, id: uuidv4(), timestamp: new Date().toISOString() }]
  })),

  setCounterfactual: (id, prob) => set((state) => ({
    counterfactuals: { ...state.counterfactuals, [id]: prob }
  })),

  clearCounterfactual: (id) => set((state) => {
    const next = { ...state.counterfactuals };
    delete next[id];
    return { counterfactuals: next };
  })
}));

useStore.getState().init();
