import { create } from 'zustand';

const STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived'];

const generateSeededRecords = () => {
  const records = [];
  const baseDate = new Date('2024-01-01T10:00:00Z').getTime();

  for (let i = 1; i <= 100; i++) {
    const statusIdx = i % 5;
    const historyEvents = [];

    historyEvents.push({
      id: `ev-${i}-1`,
      timestamp: new Date(baseDate + i * 100000).toISOString(),
      checkpointIndex: 0,
      description: 'Initial creation',
      recordState: {
        title: `Service Record ${i}`,
        status: 'draft',
        mileage: i * 50,
        notes: 'Initial check'
      }
    });

    historyEvents.push({
      id: `ev-${i}-2`,
      timestamp: new Date(baseDate + i * 200000).toISOString(),
      checkpointIndex: 1,
      description: 'Updated parts',
      recordState: {
        title: `Service Record ${i}`,
        status: STATUSES[statusIdx],
        mileage: i * 50 + 20,
        notes: 'Replaced chain and checked brakes'
      }
    });

    if (i % 3 === 0) {
      historyEvents.push({
        id: `ev-${i}-3`,
        timestamp: new Date(baseDate + i * 300000).toISOString(),
        checkpointIndex: 2,
        description: 'Final review',
        recordState: {
          title: `Service Record ${i}`,
          status: 'ready',
          mileage: i * 50 + 20,
          notes: 'All good to go'
        }
      });
    }

    const currentState = historyEvents[historyEvents.length - 1].recordState;

    records.push({
      id: `rec-${i}`,
      ...currentState,
      timeline: historyEvents
    });
  }

  records.push({
    id: `rec-101-empty`,
    title: '',
    status: 'empty',
    mileage: 0,
    notes: '',
    timeline: [{
      id: 'ev-101-1',
      timestamp: new Date().toISOString(),
      checkpointIndex: 0,
      description: 'Empty record initialized',
      recordState: {
        title: '',
        status: 'empty',
        mileage: 0,
        notes: ''
      }
    }]
  });

  return records;
};

const initialRecords = generateSeededRecords();

const computeDerived = (records) => {
  const summary = {
    total: records.length,
    byStatus: {
      empty: 0,
      draft: 0,
      ready: 0,
      changed: 0,
      archived: 0
    }
  };
  records.forEach(r => {
    if (summary.byStatus[r.status] !== undefined) {
      summary.byStatus[r.status]++;
    }
  });
  return { summary };
};

export const useStore = create((set, get) => ({
  records: initialRecords,
  derived: computeDerived(initialRecords),
  history: [],
  selectedId: null,

  selectRecord: (id) => {
    get()._saveHistory();
    set({ selectedId: id });
  },

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const lastState = state.history[state.history.length - 1];
    return {
      records: lastState.records,
      derived: lastState.derived,
      selectedId: lastState.selectedId,
      history: state.history.slice(0, -1)
    };
  }),

  _saveHistory: () => {
    const { records, derived, history, selectedId } = get();
    set({
      history: [...history, {
        records: JSON.parse(JSON.stringify(records)),
        derived: JSON.parse(JSON.stringify(derived)),
        selectedId
      }]
    });
  },

  createRecord: (partial) => {
    get()._saveHistory();
    set((state) => {
      const newId = `rec-${Date.now()}`;
      const newRecord = {
        id: newId,
        title: partial.title || '',
        status: partial.status || 'draft',
        mileage: partial.mileage || 0,
        notes: partial.notes || '',
        timeline: [{
          id: `ev-${newId}-0`,
          timestamp: new Date().toISOString(),
          checkpointIndex: 0,
          description: 'Created',
          recordState: {
            title: partial.title || '',
            status: partial.status || 'draft',
            mileage: partial.mileage || 0,
            notes: partial.notes || ''
          }
        }]
      };
      const newRecords = [newRecord, ...state.records];
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        selectedId: newId
      };
    });
  },

  updateRecord: (id, partial) => {
    // Validation
    if (partial.mileage !== undefined && (partial.mileage < 0 || partial.mileage > 500000 || !Number.isInteger(partial.mileage))) {
      return { error: 'Mileage must be an integer between 0 and 500,000' };
    }
    if (partial.title !== undefined && partial.title.length > 100) {
      return { error: 'Title must be 100 characters or less' };
    }

    get()._saveHistory();
    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === id) {
          const updatedState = { ...r, ...partial };
          const stateToSave = {
            title: updatedState.title,
            status: updatedState.status,
            mileage: updatedState.mileage,
            notes: updatedState.notes
          };

          return {
            ...updatedState,
            timeline: [
              ...r.timeline,
              {
                id: `ev-${id}-${r.timeline.length}`,
                timestamp: new Date().toISOString(),
                checkpointIndex: r.timeline.length,
                description: 'User edit',
                recordState: stateToSave
              }
            ]
          };
        }
        return r;
      });
      return {
        records: newRecords,
        derived: computeDerived(newRecords)
      };
    });
    return { success: true };
  },

  deleteRecord: (id) => {
    get()._saveHistory();
    set((state) => {
      const newRecords = state.records.filter(r => r.id !== id);
      return {
        records: newRecords,
        derived: computeDerived(newRecords),
        selectedId: state.selectedId === id ? null : state.selectedId
      };
    });
  },

  scrubTimeline: (recordId, checkpointIndex) => {
    get()._saveHistory();
    set((state) => {
      const newRecords = state.records.map(r => {
        if (r.id === recordId) {
          const targetCheckpoint = r.timeline.find(t => t.checkpointIndex === checkpointIndex);
          if (!targetCheckpoint) return r;

          return {
            ...r,
            ...targetCheckpoint.recordState,
            timeline: [
              ...r.timeline,
              {
                id: `ev-${recordId}-${r.timeline.length}`,
                timestamp: new Date().toISOString(),
                checkpointIndex: r.timeline.length,
                description: `Restored to checkpoint ${checkpointIndex}`,
                recordState: { ...targetCheckpoint.recordState }
              }
            ]
          };
        }
        return r;
      });
      return {
        records: newRecords,
        derived: computeDerived(newRecords)
      };
    });
  },

  exportState: () => {
    const { records, derived, history, selectedId } = get();
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history,
      selectedId
    };
  },

  importState: (json) => {
    if (!json || json.schemaVersion !== 'v1' || !Array.isArray(json.records)) {
      return { error: 'Invalid document structure or schema version.' };
    }

    // Strict field-level validation and uniqueness checks
    const seenIds = new Set();
    const newRecords = [];

    for (let r of json.records) {
      if (!r.id || seenIds.has(r.id)) {
        return { error: `Duplicate or missing ID: ${r.id}` };
      }
      seenIds.add(r.id);

      if (!STATUSES.includes(r.status)) {
        return { error: `Invalid status "${r.status}" on record ${r.id}` };
      }

      if (typeof r.mileage !== 'number' || r.mileage < 0 || r.mileage > 500000 || !Number.isInteger(r.mileage)) {
         return { error: `Invalid mileage ${r.mileage} on record ${r.id}` };
      }

      if (typeof r.title !== 'string' || r.title.length > 100) {
        return { error: `Invalid or excessively long title on record ${r.id}` };
      }

      if (!Array.isArray(r.timeline)) {
        return { error: `Missing timeline array on record ${r.id}` };
      }

      newRecords.push({ ...r });
    }

    set({
      records: newRecords,
      derived: computeDerived(newRecords),
      history: json.history || [],
      selectedId: json.selectedId || null
    });

    return { success: true };
  }
}));
