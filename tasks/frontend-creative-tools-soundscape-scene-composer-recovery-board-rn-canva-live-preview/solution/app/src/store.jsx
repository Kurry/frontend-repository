import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const StoreContext = createContext(null);

export const generateId = () => crypto.randomUUID();

export const initialSession = {
  schemaVersion: "v1",
  exportedAt: new Date().toISOString(),
  records: [],
  derived: {
    summary: { totalLayers: 0, failedLayers: 0, totalDuration: 0, averageVolume: 0 }
  },
  history: []
};

// Seed with some initial data for testing edge cases and performance requirements
const generateSeedData = () => {
  const records = [];
  // add a few manual ones covering edge cases
  records.push({
    id: generateId(), name: "Intro Ambience", status: "ready", volume: 80, pan: 0, duration: 120, startTime: 0, tags: ["intro"], recoveryNotes: ""
  });
  records.push({
    id: generateId(), name: "Broken Beat", status: "failed", volume: 100, pan: -50, duration: 45, startTime: 10, tags: ["beat", "needs-sync"], recoveryNotes: "Sync drift detected during export."
  });
  records.push({
    id: generateId(), name: "Draft Vox", status: "draft", volume: 60, pan: 25, duration: 30, startTime: 15, tags: ["vox"], recoveryNotes: ""
  });

  // Fill the rest to reach 100+ for the performance check (AC-09)
  for(let i=0; i<98; i++) {
    records.push({
      id: generateId(),
      name: `Background Texture ${i}`,
      status: i % 10 === 0 ? "archived" : (i % 7 === 0 ? "changed" : "ready"),
      volume: 40 + (i % 20),
      pan: (i % 20) - 10,
      duration: 10 + i,
      startTime: i * 2,
      tags: ["bg"],
      recoveryNotes: ""
    })
  }
  return records;
}

const seededSession = {
  ...initialSession,
  records: generateSeedData(),
};

function calculateDerived(records) {
  const totalLayers = records.length;
  const failedLayers = records.filter(r => r.status === 'failed').length;
  const totalDuration = records.reduce((max, r) => Math.max(max, r.startTime + r.duration), 0);
  const avgVol = totalLayers > 0 ? records.reduce((sum, r) => sum + r.volume, 0) / totalLayers : 0;

  return {
    summary: {
      totalLayers,
      failedLayers,
      totalDuration,
      averageVolume: avgVol
    }
  };
}

export const StoreProvider = ({ children }) => {
  const [session, setSessionState] = useState(() => {
    const derived = calculateDerived(seededSession.records);
    return { ...seededSession, derived };
  });

  const [undoStack, setUndoStack] = useState([]);

  // Wrapper for updating session that calculates derived data and manages history
  const setSession = useCallback((newSessionUpdater, actionName, details) => {
    setSessionState(prev => {
      const nextSessionPart = typeof newSessionUpdater === 'function' ? newSessionUpdater(prev) : newSessionUpdater;

      const nextRecords = nextSessionPart.records || prev.records;
      const nextDerived = calculateDerived(nextRecords);

      const newSession = {
        ...prev,
        ...nextSessionPart,
        records: nextRecords,
        derived: nextDerived,
        history: [...prev.history, { action: actionName, timestamp: new Date().toISOString(), details }]
      };

      // Save state to undo stack before mutation
      setUndoStack(stack => [...stack, prev]);
      return newSession;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;
      const previousState = stack[stack.length - 1];
      setSessionState(previousState);
      return stack.slice(0, -1);
    });
  }, []);

  // API Methods
  const addRecord = useCallback((record) => {
    setSession(prev => ({
      records: [record, ...prev.records]
    }), 'add_record', { id: record.id });
  }, [setSession]);

  const updateRecord = useCallback((id, updates) => {
    setSession(prev => ({
      records: prev.records.map(r => r.id === id ? { ...r, ...updates } : r)
    }), 'update_record', { id, updates });
  }, [setSession]);

  const deleteRecord = useCallback((id) => {
    setSession(prev => ({
      records: prev.records.filter(r => r.id !== id)
    }), 'delete_record', { id });
  }, [setSession]);

  const clearSession = useCallback(() => {
    setSession({
      ...initialSession,
      exportedAt: new Date().toISOString()
    }, 'clear_session', {});
  }, [setSession]);

  const importSession = useCallback((importedData) => {
    // Validation is expected to be handled prior to calling this (or we could enforce it here)
    setSession({
      ...importedData,
      exportedAt: new Date().toISOString()
    }, 'import_session', { imported: true });
  }, [setSession]);

  const value = useMemo(() => ({
    session,
    addRecord,
    updateRecord,
    deleteRecord,
    clearSession,
    importSession,
    undo,
    canUndo: undoStack.length > 0,
    // WebMCP direct setter for arbitrary mutations
    setSessionDirect: setSessionState
  }), [session, addRecord, updateRecord, deleteRecord, clearSession, importSession, undo, undoStack.length]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => useContext(StoreContext);
