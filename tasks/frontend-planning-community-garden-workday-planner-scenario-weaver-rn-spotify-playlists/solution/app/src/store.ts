import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TaskStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  status: TaskStatus;
  scenarioWeaverState?: {
    baseRecordId?: string;
    branchedRecordId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DerivedState {
  summary: {
    totalEstimatedHours: number;
    totalTasks: number;
    scenarioChanges: number;
  };
}

export interface SessionHistoryEntry {
  action: string;
  timestamp: string;
  previousRecords: TaskRecord[];
  previousSelectedId: string | null;
}

export interface CommunityGardenWorkdayPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: TaskRecord[];
  derived: DerivedState;
  history: SessionHistoryEntry[];
}

export interface AppState {
  records: TaskRecord[];
  historyStack: SessionHistoryEntry[];
  derived: DerivedState;
  selectedTaskId: string | null;
}

export interface StoreContextType {
  state: AppState;
  createRecord: (record: Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TaskStatus }) => void;
  updateRecord: (id: string, updates: Partial<TaskRecord>) => void;
  deleteRecord: (id: string) => void;
  branchRecord: (id: string) => void;
  undo: () => void;
  exportSession: () => CommunityGardenWorkdayPlannerSession;
  importSession: (session: any) => void;
  setSelectedTask: (id: string | null) => void;
  clearSession: () => void;
}

export const StoreContext = createContext<StoreContextType | null>(null);

const calculateDerived = (records: TaskRecord[]): DerivedState => {
  return {
    summary: {
      totalTasks: records.length,
      totalEstimatedHours: records.reduce((sum, r) => sum + r.estimatedHours, 0),
      scenarioChanges: records.filter(r => r.scenarioWeaverState?.baseRecordId || r.scenarioWeaverState?.branchedRecordId).length,
    }
  };
};

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const seedRecords = (): TaskRecord[] => {
  const records: TaskRecord[] = [];
  for (let i = 0; i < 110; i++) {
    records.push({
      id: uuidv4(),
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      estimatedHours: Math.floor(Math.random() * 8) + 1,
      status: ['empty', 'draft', 'ready', 'changed', 'archived'][Math.floor(Math.random() * 5)] as TaskStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return records;
};

export const useStoreProvider = () => {
  const [state, setState] = useState<AppState>({
    records: seedRecords(),
    historyStack: [],
    derived: { summary: { totalEstimatedHours: 0, totalTasks: 0, scenarioChanges: 0 } },
    selectedTaskId: null,
  });

  useEffect(() => {
    setState(s => ({ ...s, derived: calculateDerived(s.records) }));
  }, [state.records]);

  const createRecord = useCallback((record: Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TaskStatus }) => {
    const newRecord: TaskRecord = {
      ...record,
      id: uuidv4(),
      status: record.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(s => {
      const newRecords = [...s.records, newRecord];
      return {
        ...s,
        records: newRecords,
        historyStack: [...s.historyStack, { action: 'create', timestamp: new Date().toISOString(), previousRecords: s.records, previousSelectedId: s.selectedTaskId }]
      };
    });
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<TaskRecord>) => {
    setState(s => {
      const newRecords = s.records.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      return {
        ...s,
        records: newRecords,
        historyStack: [...s.historyStack, { action: 'update', timestamp: new Date().toISOString(), previousRecords: s.records, previousSelectedId: s.selectedTaskId }]
      };
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState(s => {
      const newRecords = s.records.filter(r => r.id !== id);
      return {
        ...s,
        records: newRecords,
        selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        historyStack: [...s.historyStack, { action: 'delete', timestamp: new Date().toISOString(), previousRecords: s.records, previousSelectedId: s.selectedTaskId }]
      };
    });
  }, []);

  const branchRecord = useCallback((id: string) => {
    setState(s => {
      const baseRecord = s.records.find(r => r.id === id);
      if (!baseRecord) return s;

      const branchedId = uuidv4();

      const newBaseRecord = {
        ...baseRecord,
        scenarioWeaverState: {
          branchedRecordId: branchedId
        }
      };

      const newBranchedRecord: TaskRecord = {
        ...baseRecord,
        id: branchedId,
        status: 'draft', // or changed
        scenarioWeaverState: {
          baseRecordId: id
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newRecords = s.records.map(r => r.id === id ? newBaseRecord : r).concat(newBranchedRecord);

      return {
        ...s,
        records: newRecords,
        selectedTaskId: id, // Keep selection on base, or move to branch
        historyStack: [...s.historyStack, { action: 'branch', timestamp: new Date().toISOString(), previousRecords: s.records, previousSelectedId: s.selectedTaskId }]
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(s => {
      if (s.historyStack.length === 0) return s;
      const lastState = s.historyStack[s.historyStack.length - 1];
      const newHistory = s.historyStack.slice(0, -1);
      return {
        ...s,
        records: lastState.previousRecords,
        selectedTaskId: lastState.previousSelectedId,
        historyStack: newHistory,
      };
    });
  }, []);

  const exportSession = useCallback((): CommunityGardenWorkdayPlannerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.historyStack,
    };
  }, [state]);

  const importSession = useCallback((session: any) => {
    if (!session) return;
    if (session.schemaVersion !== 'v1') return;
    if (!Array.isArray(session.records)) return;

    // Field-level validation
    const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
    const seenIds = new Set<string>();

    const isValidRecord = (r: any): r is TaskRecord => {
        if (!r || typeof r !== 'object') return false;
        if (typeof r.id !== 'string' || !r.id) return false;
        if (seenIds.has(r.id)) return false; // Duplicate ID
        seenIds.add(r.id);

        if (typeof r.title !== 'string' || typeof r.description !== 'string') return false;
        if (typeof r.estimatedHours !== 'number' || r.estimatedHours <= 0 || r.estimatedHours > 24) return false;
        if (!validStatuses.includes(r.status)) return false;
        if (typeof r.createdAt !== 'string' || typeof r.updatedAt !== 'string') return false;

        // validate scenario state if present
        if (r.scenarioWeaverState) {
           if (typeof r.scenarioWeaverState !== 'object') return false;
           // references will be validated later
        }

        return true;
    };

    const validRecords = session.records.every(isValidRecord);
    if (!validRecords) return; // Reject whole import if any record invalid

    // Validate references
    const hasValidRefs = session.records.every((r: TaskRecord) => {
        if (r.scenarioWeaverState?.baseRecordId && !seenIds.has(r.scenarioWeaverState.baseRecordId)) return false;
        if (r.scenarioWeaverState?.branchedRecordId && !seenIds.has(r.scenarioWeaverState.branchedRecordId)) return false;
        return true;
    });

    if (!hasValidRefs) return;

    // Validate history
    let validHistory: SessionHistoryEntry[] = [];
    if (Array.isArray(session.history)) {
        const isHistoryValid = session.history.every((h: any) => {
            return h && typeof h === 'object' && typeof h.action === 'string' && typeof h.timestamp === 'string' && Array.isArray(h.previousRecords);
        });
        if (isHistoryValid) {
            validHistory = session.history;
        }
    }


    setState(s => ({
      ...s,
      records: session.records,
      historyStack: validHistory,
      selectedTaskId: null, // Clear selection on import
    }));
  }, []);

  const setSelectedTask = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedTaskId: id }));
  }, []);

  const clearSession = useCallback(() => {
    setState(s => ({ ...s, records: [], historyStack: [], selectedTaskId: null }));
  }, []);

  return {
    state,
    createRecord,
    updateRecord,
    deleteRecord,
    branchRecord,
    undo,
    exportSession,
    importSession,
    setSelectedTask,
    clearSession,
  };
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
