import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { SoundLayer, SoundLayerStatus, TimelineCheckpoint, SoundscapeSceneSession } from '../types';

interface StoreState {
  records: SoundLayer[];
  selectedRecordId: string | null;
  history: {records: SoundLayer[], selectedRecordId: string | null}[]; // Stack of records states for undo
}

interface StoreContextType {
  state: StoreState;
  createRecord: (name: string, status: SoundLayerStatus) => void;
  updateRecord: (id: string, name: string, status: SoundLayerStatus) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  scrubTimeline: (recordId: string, checkpointId: string) => void;
  undo: () => void;
  exportSession: () => SoundscapeSceneSession;
  importSession: (session: SoundscapeSceneSession) => void;
  clearSession: () => void;
  canUndo: boolean;
  updateTimelineProperty: (checkpointId: string, status: SoundLayerStatus) => void;
  setTimelineContent: (checkpointId: string, description: string) => void;
  derivedSummary: SoundscapeSceneSession['derived'];
}

const initialState: StoreState = {
  records: [],
  selectedRecordId: null,
  history: []
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children, initialRecords = [] }: { children: ReactNode, initialRecords?: SoundLayer[] }) => {
  const [state, setState] = useState<StoreState>({
    records: initialRecords,
    selectedRecordId: null,
    history: []
  });

  const pushHistory = (currentRecords: SoundLayer[]) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, currentRecords]
    }));
  };

  const createRecord = useCallback((name: string, status: SoundLayerStatus) => {
    setState(prev => {
      const newRecord: SoundLayer = {
        id: crypto.randomUUID(),
        name,
        status,
        checkpoints: [
          { id: crypto.randomUUID(), timestamp: 0, status, description: 'Initial state' }
        ],
        currentCheckpointId: null
      };
      newRecord.currentCheckpointId = newRecord.checkpoints[0].id;

      const newRecords = [...prev.records, newRecord];
      return {
        ...prev,
        records: newRecords,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const updateRecord = useCallback((id: string, name: string, status: SoundLayerStatus) => {
    setState(prev => {
      const newRecords = prev.records.map(r => {
        if (r.id === id) {
          const newCheckpoint: TimelineCheckpoint = {
            id: crypto.randomUUID(),
            timestamp: r.checkpoints.length * 10, // Mock timestamp progression
            status,
            description: `Updated to ${status}`
          };
          return {
            ...r,
            name,
            status,
            checkpoints: [...r.checkpoints, newCheckpoint],
            currentCheckpointId: newCheckpoint.id
          };
        }
        return r;
      });
      return {
        ...prev,
        records: newRecords,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState(prev => {
      const newRecords = prev.records.filter(r => r.id !== id);
      return {
        ...prev,
        records: newRecords,
        selectedRecordId: prev.selectedRecordId === id ? null : prev.selectedRecordId,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const selectRecord = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedRecordId: id
    }));
  }, []);

  const scrubTimeline = useCallback((recordId: string, checkpointId: string) => {
    setState(prev => {
      const newRecords = prev.records.map(r => {
        if (r.id === recordId) {
          const checkpoint = r.checkpoints.find(c => c.id === checkpointId);
          if (checkpoint) {
            return {
              ...r,
              status: checkpoint.status,
              currentCheckpointId: checkpointId
            };
          }
        }
        return r;
      });
      return {
        ...prev,
        records: newRecords,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = [...prev.history];
      const prevState = newHistory.pop()!;

      return {
        ...prev,
        records: prevState.records,
        selectedRecordId: prevState.selectedRecordId,
        history: newHistory
      };
    });
  }, []);


  const updateTimelineProperty = useCallback((checkpointId: string, status: SoundLayerStatus) => {
    setState(prev => {
      const newRecords = prev.records.map(r => {
        const cpIndex = r.checkpoints.findIndex(c => c.id === checkpointId);
        if (cpIndex !== -1) {
          const newCheckpoints = [...r.checkpoints];
          newCheckpoints[cpIndex] = { ...newCheckpoints[cpIndex], status };

          let newStatus = r.status;
          if (r.currentCheckpointId === checkpointId) {
            newStatus = status;
          }

          return { ...r, status: newStatus, checkpoints: newCheckpoints };
        }
        return r;
      });
      return {
        ...prev,
        records: newRecords,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const setTimelineContent = useCallback((checkpointId: string, description: string) => {
    setState(prev => {
      const newRecords = prev.records.map(r => {
        const cpIndex = r.checkpoints.findIndex(c => c.id === checkpointId);
        if (cpIndex !== -1) {
          const newCheckpoints = [...r.checkpoints];
          newCheckpoints[cpIndex] = { ...newCheckpoints[cpIndex], description };
          return { ...r, checkpoints: newCheckpoints };
        }
        return r;
      });
      return {
        ...prev,
        records: newRecords,
        history: [...prev.history, {records: prev.records, selectedRecordId: prev.selectedRecordId}]
      };
    });
  }, []);

  const clearSession = useCallback(() => {
    setState({
      records: [],
      selectedRecordId: null,
      history: []
    });
  }, []);

  const importSession = useCallback((session: SoundscapeSceneSession) => {
    // Validate schema
    if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      return; // strict no-op
    }

    // Validate records

    const ids = new Set();
    const cpIds = new Set();
    for (const r of session.records) {
      if (!r.id || !r.name || !r.status || !Array.isArray(r.checkpoints) || !r.currentCheckpointId) {
        return; // strict no-op on invalid
      }
      if (ids.has(r.id)) return; // duplicate ID
      ids.add(r.id);

      for (const cp of r.checkpoints) {
        if (!cp.id || cp.timestamp == null || !cp.status) return;
        if (cpIds.has(cp.id)) return;
        cpIds.add(cp.id);
      }

      if (!r.checkpoints.find(c => c.id === r.currentCheckpointId)) return; // unknown reference
    }


    setState({
      records: session.records,
      selectedRecordId: session.selectedRecordId || null,
      history: session.history || []
    });
  }, []);

  const derivedSummary = {
    totalRecords: state.records.length,
    statusCounts: state.records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 } as Record<SoundLayerStatus, number>)
  };

  const exportSession = useCallback((): SoundscapeSceneSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      selectedRecordId: state.selectedRecordId,
      derived: derivedSummary,
      history: state.history
    };
  }, [state, derivedSummary]);

  return (
    <StoreContext.Provider value={{
      state,
      createRecord,
      updateRecord,
      deleteRecord,
      selectRecord,
      scrubTimeline,
      undo,
      exportSession,
      importSession,
      clearSession,
      updateTimelineProperty,
      setTimelineContent,
      canUndo: state.history.length > 0,
      derivedSummary
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
