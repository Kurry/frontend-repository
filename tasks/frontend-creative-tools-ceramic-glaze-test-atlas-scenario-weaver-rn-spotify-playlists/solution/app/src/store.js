import { create } from 'zustand';
import { CeramicGlazeTestAtlasSessionSchema } from './schema';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState = {
  records: [],
  folders: [],
  history: [],
  selectedRecords: [], // array of IDs
  pastStates: [],
  futureStates: [],
  activeScenarioRecordId: null, // ID of record being branched
};

function computeDerivedState(records) {
  return {
    summary: {
      totalTests: records.length,
      readyCount: records.filter((r) => r.status === 'ready').length,
      queuedCount: records.filter((r) => r.queued).length,
    },
  };
}

export const useStore = create((set, get) => ({
  ...initialState,
  derived: computeDerivedState(initialState.records),

  // Action Helpers
  _saveHistory: (type, description) => {
    set((state) => ({
      history: [
        ...state.history,
        {
          id: generateId(),
          type,
          timestamp: new Date().toISOString(),
          description,
        },
      ].slice(-50), // keep last 50
    }));
  },

  _saveStateForUndo: () => {
    const { records, folders, selectedRecords, history, pastStates } = get();
    set({
      pastStates: [...pastStates, { records, folders, selectedRecords, history }].slice(-20),
      futureStates: [], // Clear future on new action
    });
  },

  // Actions
  addFolder: (name) => {
    get()._saveStateForUndo();
    const newFolder = { id: generateId(), name, order: get().folders.length };
    set((state) => ({ folders: [...state.folders, newFolder] }));
    get()._saveHistory('CREATE_FOLDER', `Created folder ${name}`);
  },

  addRecord: (recordData) => {
    get()._saveStateForUndo();
    const newRecord = {
      id: generateId(),
      name: 'Untitled',
      status: 'draft',
      folderId: null,
      order: get().records.length,
      materials: [],
      firingTemp: 2000,
      notes: '',
      queued: false,
      scenarioState: 'idle',
      originalId: null,
      ...recordData,
    };

    set((state) => {
      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        derived: computeDerivedState(newRecords),
      };
    });
    get()._saveHistory('CREATE_RECORD', `Created record ${newRecord.name}`);
  },

  updateRecord: (id, updates) => {
    get()._saveStateForUndo();
    set((state) => {
      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        records: newRecords,
        derived: computeDerivedState(newRecords),
      };
    });
    get()._saveHistory('UPDATE_RECORD', `Updated record ${id}`);
  },

  deleteRecords: (ids) => {
    get()._saveStateForUndo();
    set((state) => {
      const newRecords = state.records.filter((r) => !ids.includes(r.id));
      const newSelected = state.selectedRecords.filter(id => !ids.includes(id));
      return {
        records: newRecords,
        selectedRecords: newSelected,
        derived: computeDerivedState(newRecords),
        activeScenarioRecordId: state.activeScenarioRecordId && ids.includes(state.activeScenarioRecordId) ? null : state.activeScenarioRecordId
      };
    });
    get()._saveHistory('DELETE_RECORDS', `Deleted records`);
  },

  toggleSelection: (id) => {
    set((state) => ({
      selectedRecords: state.selectedRecords.includes(id)
        ? state.selectedRecords.filter((selectedId) => selectedId !== id)
        : [...state.selectedRecords, id],
    }));
  },

  setSelection: (ids) => {
    set({ selectedRecords: ids });
  },

  reorderRecords: (newOrderIds) => {
     get()._saveStateForUndo();
     set(state => {
       const newRecords = [...state.records];
       // update orders based on array index
       const orderedRecords = newOrderIds.map((id, index) => {
          const rec = newRecords.find(r => r.id === id);
          return { ...rec, order: index };
       });
       // Add back any records that weren't in the newOrderIds just in case, at the end
       const remaining = newRecords.filter(r => !newOrderIds.includes(r.id)).map((r, i) => ({...r, order: orderedRecords.length + i}));
       const allRecords = [...orderedRecords, ...remaining];

       return {
         records: allRecords,
       }
     });
     get()._saveHistory('REORDER', 'Reordered records');
  },

  queueRecords: (ids, queueState = true) => {
    get()._saveStateForUndo();
    set((state) => {
      const newRecords = state.records.map((r) =>
        ids.includes(r.id) ? { ...r, queued: queueState } : r
      );
      return {
        records: newRecords,
        derived: computeDerivedState(newRecords),
      };
    });
    get()._saveHistory('QUEUE_RECORDS', `Set queued=${queueState} for ${ids.length} records`);
  },

  // Scenario Weaver
  branchToScenario: (id) => {
    get()._saveStateForUndo();

    set((state) => {
      const originalRecord = state.records.find((r) => r.id === id);
      if (!originalRecord) return state;

      const newRecord = {
        ...originalRecord,
        id: generateId(),
        name: `${originalRecord.name} (Scenario)`,
        status: 'draft',
        scenarioState: 'changed',
        originalId: originalRecord.id,
        order: state.records.length,
      };

      const newRecords = [...state.records, newRecord];
      return {
        records: newRecords,
        derived: computeDerivedState(newRecords),
        activeScenarioRecordId: newRecord.id, // focus the new scenario
        selectedRecords: [newRecord.id]
      };
    });
    get()._saveHistory('BRANCH_SCENARIO', `Branched ${id} into a scenario`);
  },

  setActiveScenarioRecordId: (id) => {
    set({ activeScenarioRecordId: id });
  },

  resolveScenario: (scenarioId, resolution) => {
    // resolution = 'keep' or 'merge'
    get()._saveStateForUndo();
    set(state => {
        const scenario = state.records.find(r => r.id === scenarioId);
        if(!scenario) return state;

        let newRecords;
        if (resolution === 'keep') {
            newRecords = state.records.map(r => r.id === scenarioId ? { ...r, scenarioState: 'resolved', status: 'ready' } : r);
        } else if (resolution === 'merge') {
            // override original with scenario
            newRecords = state.records.map(r => {
                if (r.id === scenario.originalId) {
                    return { ...scenario, id: r.id, scenarioState: 'idle', name: scenario.name, originalId: null };
                }
                return r;
            }).filter(r => r.id !== scenarioId); // drop the scenario copy
        }

        return {
            records: newRecords,
            derived: computeDerivedState(newRecords),
            activeScenarioRecordId: null,
            selectedRecords: state.selectedRecords.filter(id => id !== scenarioId)
        }
    });
    get()._saveHistory('RESOLVE_SCENARIO', `Resolved scenario ${scenarioId} via ${resolution}`);
  },

  // Undo
  undo: () => {
    set((state) => {
      if (state.pastStates.length === 0) return state;
      const previous = state.pastStates[state.pastStates.length - 1];
      const newPast = state.pastStates.slice(0, -1);

      return {
        ...previous,
        derived: computeDerivedState(previous.records),
        pastStates: newPast,
        futureStates: [{ records: state.records, folders: state.folders, selectedRecords: state.selectedRecords, history: state.history }, ...state.futureStates],
      };
    });
  },

  // Export / Import
  exportSession: () => {
    const { records, folders, derived, history } = get();
    const session = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      folders,
      derived,
      history,
    };
    return session;
  },

  importSession: (sessionData) => {
    try {
      const validData = CeramicGlazeTestAtlasSessionSchema.parse(sessionData);
      set({
        records: validData.records,
        folders: validData.folders,
        history: validData.history,
        derived: computeDerivedState(validData.records),
        pastStates: [],
        futureStates: [],
        selectedRecords: [],
        activeScenarioRecordId: null,
      });
      get()._saveHistory('IMPORT_SESSION', 'Imported session data');
      return { success: true };
    } catch (error) {
      console.error("Import validation failed:", error);
      return { success: false, error };
    }
  },

  clearSession: () => {
      set({
          records: [],
          folders: [],
          history: [],
          derived: computeDerivedState([]),
          pastStates: [],
          futureStates: [],
          selectedRecords: [],
          activeScenarioRecordId: null
      })
  },

  setInitialState: (records, folders) => {
      set({
          records,
          folders,
          derived: computeDerivedState(records)
      });
  }

}));
