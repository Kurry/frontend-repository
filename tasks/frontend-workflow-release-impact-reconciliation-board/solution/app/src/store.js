import { create } from 'zustand';
import { SEED_DATA } from './data.js';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const useStore = create((set, get) => ({
  releases: SEED_DATA.releases,
  entries: SEED_DATA.entries,
  surfaces: SEED_DATA.surfaces,
  impactLinks: [],
  rolloutEvents: [],
  duplicateMergeLog: [],
  savedViews: [],
  history: [],

  selectedEntryId: null,
  filters: { product: '', changeType: '', stage: '', risk: '' },
  setFilters: (filters) => set({ filters }),
  setSelectedEntryId: (id) => set({ selectedEntryId: id }),

  normalizeEntry: (id, updates) => {
    set((state) => {
      const newEntries = state.entries.map(e => e.id === id ? { ...e, ...updates, status: 'normalized' } : e);
      return { entries: newEntries, history: [...state.history, { action: 'normalizeEntry', id, updates }] };
    });
  },

  mergeDuplicate: (duplicateId, canonicalId) => {
    if (duplicateId === canonicalId) return;
    set((state) => {
      let current = canonicalId;
      while (current) {
        if (current === duplicateId) return state;
        const entry = state.entries.find(e => e.id === current);
        current = entry ? entry.canonicalEntryId : null;
      }
      const newEntries = state.entries.map(e =>
        e.id === duplicateId
          ? { ...e, status: 'merged', canonicalEntryId: canonicalId }
          : e
      );
      return {
        entries: newEntries,
        duplicateMergeLog: [...state.duplicateMergeLog, { duplicateId, canonicalId, timestamp: new Date().toISOString() }],
        history: [...state.history, { action: 'mergeDuplicate', duplicateId, canonicalId }]
      };
    });
  },

  rejectDuplicate: (duplicateId) => {
     set((state) => {
      const newEntries = state.entries.map(e =>
        e.id === duplicateId ? { ...e, status: 'normalized', canonicalEntryId: null } : e
      );
      return { entries: newEntries, history: [...state.history, { action: 'rejectDuplicate', duplicateId }] };
     });
  },

  mapImpact: (entryId, surfaceId, stage, canaryPercent = null) => {
    set((state) => {
      const newLinkId = generateId();
      const newLink = { id: newLinkId, entryId, surfaceId, graphPosition: { x: 0, y: 0 } };

      let newRolloutEvents = [...state.rolloutEvents];
      if (stage) {
        newRolloutEvents.push({ id: generateId(), entryId, surfaceId, stage, canaryPercent, timestamp: new Date().toISOString() });
      }

      const existingLinkIndex = state.impactLinks.findIndex(l => l.entryId === entryId && l.surfaceId === surfaceId);
      let newImpactLinks;
      if (existingLinkIndex >= 0) {
          newImpactLinks = [...state.impactLinks];
      } else {
          newImpactLinks = [...state.impactLinks, newLink];
      }

      return {
        impactLinks: newImpactLinks,
        rolloutEvents: newRolloutEvents,
        selectedEntryId: surfaceId ? surfaceId : state.selectedEntryId,
        history: [...state.history, { action: 'mapImpact', entryId, surfaceId, stage, canaryPercent }]
      };
    });
  },

  deleteImpactLink: (linkId) => {
     set((state) => {
         const newLinks = state.impactLinks.filter(l => l.id !== linkId);
         let newSelectedEntryId = state.selectedEntryId;
         if (newLinks.length === 0) {
             newSelectedEntryId = null;
         }
         return {
             impactLinks: newLinks,
             selectedEntryId: newSelectedEntryId,
             history: [...state.history, { action: 'deleteImpactLink', linkId }]
         };
     });
  },

  saveView: (name) => {
    set((state) => {
      const view = {
        id: generateId(),
        name,
        filters: { ...state.filters },
        resultEntryIds: state.entries.filter(e => e.status !== 'archived').map(e => e.id)
      };
      return { savedViews: [...state.savedViews, view] };
    });
  },

  exportData: () => {
    const state = get();
    const riskSummary = { high: 0, medium: 0, low: 0 };
    return {
      schemaVersion: 'release-impact-pack-v1',
      generatedAt: new Date().toISOString(),
      releases: state.releases,
      entries: state.entries,
      surfaces: state.surfaces,
      impactLinks: state.impactLinks,
      rolloutEvents: state.rolloutEvents,
      duplicateMergeLog: state.duplicateMergeLog,
      savedViews: state.savedViews,
      riskSummary,
      history: state.history
    };
  },

  importData: (data) => {
    if (data.schemaVersion !== 'release-impact-pack-v1') return;
    set({
      releases: data.releases || [],
      entries: data.entries || [],
      surfaces: data.surfaces || [],
      impactLinks: data.impactLinks || [],
      rolloutEvents: data.rolloutEvents || [],
      duplicateMergeLog: data.duplicateMergeLog || [],
      savedViews: data.savedViews || [],
      history: data.history || [],
      selectedEntryId: null,
      filters: { product: '', changeType: '', stage: '', risk: '' }
    });
  },

  clearSession: () => {
      set({
          impactLinks: [],
          rolloutEvents: [],
          duplicateMergeLog: [],
          savedViews: [],
          history: [],
          selectedEntryId: null,
          entries: SEED_DATA.entries.map(e => ({...e, status: 'unreviewed', canonicalEntryId: null}))
      });
  },

  undo: () => {
      set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const lastAction = newHistory.pop();

          let newState = { history: newHistory };
          if (lastAction.action === 'mapImpact') {
              newState.impactLinks = state.impactLinks.filter(l => !(l.entryId === lastAction.entryId && l.surfaceId === lastAction.surfaceId));
              newState.rolloutEvents = state.rolloutEvents.filter(e => !(e.entryId === lastAction.entryId && e.surfaceId === lastAction.surfaceId && e.stage === lastAction.stage));
          }
          return newState;
      });
  }
}));
