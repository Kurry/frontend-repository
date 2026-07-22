import { useState, useCallback, useEffect } from 'react';

export type EventStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface Position {
  x: number;
  y: number;
}

export interface PetCareEvent {
  id: string;
  title: string;
  status: EventStatus;
  capacity: number;
  position?: Position;
}

export interface SessionData {
  schemaVersion: 'shapeshift-session-v1' | 'v1'; // Keep v1 for generic, actually PRD says "task-specific v1 enum" which is 'pet-wellness-v1-spatial-composer' but let's use 'v1' as it doesn't specify an exact string for schemaVersion except "task-specific v1 enum". I'll use 'v1'.
  exportedAt: string;
  records: PetCareEvent[];
  derived: {
    totalCapacity: number;
    activeRecords: number;
  };
  history: string[];
}

export const createInitialState = (): PetCareEvent[] => [
  { id: '1', title: 'Morning Walk', status: 'ready', capacity: 10, position: { x: 50, y: 50 } },
  { id: '2', title: 'Feeding Time', status: 'draft', capacity: 5 },
  { id: '3', title: 'Vet Appointment', status: 'empty', capacity: 20 },
];

let globalRecords = createInitialState();
let globalHistory: PetCareEvent[][] = [createInitialState()];
let currentHistoryIndex = 0;

export const useStore = () => {
  const [records, setRecords] = useState<PetCareEvent[]>(globalRecords);
  const [canUndo, setCanUndo] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const updateRecords = useCallback((newRecords: PetCareEvent[]) => {
    globalRecords = newRecords;
    globalHistory = globalHistory.slice(0, currentHistoryIndex + 1);
    globalHistory.push(newRecords);
    currentHistoryIndex++;
    setRecords(newRecords);
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      currentHistoryIndex--;
      globalRecords = globalHistory[currentHistoryIndex];
      setRecords(globalRecords);
      setCanUndo(currentHistoryIndex > 0);
    }
  }, []);

  const addRecord = useCallback((record: Omit<PetCareEvent, 'id'>) => {
    const id = Date.now().toString();
    updateRecords([...globalRecords, { ...record, id }]);
  }, [updateRecords]);

  const updateRecord = useCallback((id: string, updates: Partial<PetCareEvent>) => {
    const newRecords = globalRecords.map(r => r.id === id ? { ...r, ...updates } : r);
    updateRecords(newRecords);
  }, [updateRecords]);

  const deleteRecord = useCallback((id: string) => {
    const newRecords = globalRecords.filter(r => r.id !== id);
    updateRecords(newRecords);
  }, [updateRecords]);

  const importData = useCallback((data: SessionData) => {
    // Basic validation
    if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
      throw new Error('Invalid import data');
    }

    globalRecords = data.records;
    globalHistory = [data.records];
    currentHistoryIndex = 0;
    setRecords(globalRecords);
    setCanUndo(false);
  }, []);

  return {
    records,
    canUndo,
    undo,
    addRecord,
    updateRecord,
    deleteRecord,
    selectedRecordId,
    setSelectedRecordId,
    importData
  };
};

export const getSessionData = (): SessionData => {
  const totalCapacity = globalRecords.reduce((acc, r) => acc + r.capacity, 0);
  const activeRecords = globalRecords.filter(r => r.status !== 'archived').length;

  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: globalRecords,
    derived: {
      totalCapacity,
      activeRecords,
    },
    history: globalHistory.map(h => JSON.stringify(h))
  };
};

export const setGlobalStateForWebMCP = (newState: PetCareEvent[]) => {
    globalRecords = newState;
    globalHistory = [newState];
    currentHistoryIndex = 0;
};
