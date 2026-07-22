import { useState, useCallback, useMemo } from 'react';
import type {
  CommunityGardenWorkdayPlannerSession,
  WorkTask,
  DomainStatus,
  HistoryEvent,
  DerivedState
} from './types';

// Seed deterministic collection for performance (at least 100 records)
const initialRecords: WorkTask[] = Array.from({ length: 105 }, (_, i) => {
  const id = `task-${i + 1}`;
  let status: DomainStatus = 'draft';
  if (i < 5) status = 'empty';
  else if (i < 20) status = 'ready';
  else if (i < 30) status = 'changed';
  else if (i < 40) status = 'archived';

  return {
    id,
    title: `Task ${i + 1} - ${i % 2 === 0 ? 'Planting' : 'Weeding'}`,
    description: `Description for task ${i + 1}`,
    status,
    area: ['North', 'South', 'East', 'West', 'Greenhouse'][i % 5],
    handoffOwner: i % 3 === 0 ? `Owner ${i % 3}` : undefined,
    requiredDate: `2025-0${(i % 9) + 1}-15T00:00:00Z`
  };
});

function computeDerivedState(records: WorkTask[]): DerivedState {
  const byStatus: Record<DomainStatus, number> = {
    empty: 0,
    draft: 0,
    ready: 0,
    changed: 0,
    archived: 0,
  };
  records.forEach((r) => {
    if (byStatus[r.status] !== undefined) {
      byStatus[r.status]++;
    }
  });
  return {
    summary: {
      total: records.length,
      byStatus,
    },
  };
}

export function useAppStore() {
  const [records, setRecords] = useState<WorkTask[]>(initialRecords);
  const [history, setHistory] = useState<HistoryEvent[]>([{ action: 'Init', timestamp: new Date().toISOString() }]);
  // Track changes explicitly for precise delta undo if needed, but for simplicity we keep state snapshots
  const [undoStack, setUndoStack] = useState<{records: WorkTask[], history: HistoryEvent[]}[]>([]);

  const derived = useMemo(() => computeDerivedState(records), [records]);

  const addHistory = useCallback((action: string, recordId?: string) => {
    setHistory((prev) => [...prev, { action, timestamp: new Date().toISOString(), recordId }]);
  }, []);

  const saveStateForUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, { records, history }]);
  }, [records, history]);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const previousState = newStack.pop()!;
      setRecords(previousState.records);
      setHistory([...previousState.history, { action: 'Undo', timestamp: new Date().toISOString() }]);
      return newStack;
    });
  }, []);

  const addRecord = useCallback((task: Omit<WorkTask, 'id'>) => {
    saveStateForUndo();
    const newRecord: WorkTask = { ...task, id: `task-${Date.now()}` };
    setRecords((prev) => [...prev, newRecord]);
    addHistory('Create', newRecord.id);
  }, [addHistory, saveStateForUndo]);

  const updateRecord = useCallback((id: string, updates: Partial<WorkTask>) => {
    saveStateForUndo();
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    addHistory('Update', id);
  }, [addHistory, saveStateForUndo]);

  const deleteRecord = useCallback((id: string) => {
    saveStateForUndo();
    setRecords((prev) => prev.filter((r) => r.id !== id));
    addHistory('Delete', id);
  }, [addHistory, saveStateForUndo]);

  const archiveRecord = useCallback((id: string) => {
    updateRecord(id, { status: 'archived' });
  }, [updateRecord]);

  // Handoff Map signature mutation: connect a selected record to a handoff owner and update readiness
  const assignHandoff = useCallback((id: string, owner: string) => {
    saveStateForUndo();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          // Explicit state mutation based on action
          const newStatus = r.status === 'empty' || r.status === 'draft' ? 'ready' : 'changed';
          return { ...r, handoffOwner: owner, status: newStatus };
        }
        return r;
      })
    );
    addHistory('AssignHandoff', id);
  }, [addHistory, saveStateForUndo]);

  const exportArtifact = useCallback((): CommunityGardenWorkdayPlannerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history,
    };
  }, [records, derived, history]);

  const importArtifact = useCallback((artifact: any): boolean => {
    // Field-level validation
    if (artifact?.schemaVersion !== 'v1') return false;
    if (!Array.isArray(artifact.records)) return false;

    // Check required fields for all records
    const isValid = artifact.records.every((r: any) => {
      const validStatus = ['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status);
      const validStrings = typeof r.id === 'string' && typeof r.title === 'string' && typeof r.description === 'string';

      let validDate = true;
      if (r.requiredDate) {
        const d = new Date(r.requiredDate);
        validDate = !isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030;
      }

      return validStrings && validStatus && validDate;
    });

    if (!isValid) return false;

    // Reject duplicate IDs
    const ids = new Set();
    for (const r of artifact.records) {
      if (ids.has(r.id)) return false;
      ids.add(r.id);
    }

    setRecords(artifact.records);
    setHistory([...(artifact.history || []), { action: 'Import', timestamp: new Date().toISOString() }]);
    setUndoStack([]); // Clear undo on import
    return true;
  }, []);

  const clearSession = useCallback(() => {
      setRecords([]);
      setHistory([{ action: 'Clear', timestamp: new Date().toISOString() }]);
      setUndoStack([]);
  }, []);

  return {
    records,
    derived,
    history,
    addRecord,
    updateRecord,
    deleteRecord,
    archiveRecord,
    assignHandoff,
    undo,
    canUndo: undoStack.length > 0,
    exportArtifact,
    importArtifact,
    clearSession,
  };
}
