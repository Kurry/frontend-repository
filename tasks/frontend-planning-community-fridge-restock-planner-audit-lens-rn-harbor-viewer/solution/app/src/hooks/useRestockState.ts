import { useState, useCallback } from 'react';

export type TaskStatus = 'DRAFT' | 'READY' | 'CHANGED' | 'ARCHIVED';

export interface AuditLensState {
  status: 'RESOLVED' | 'CONFLICT';
  evidenceUrl: string;
  notes?: string;
  resolvedAt?: string;
}

export interface RestockTask {
  id: string;
  title: string;
  location?: string;
  quantity: number;
  maxLimit: number;
  dependentRecordId?: string;
  status: TaskStatus;
  auditLensState?: AuditLensState;
  createdAt: string;
  updatedAt: string;
}

export interface RestockSessionState {
  schemaVersion: 'v1';
  exportedAt?: string;
  records: RestockTask[];
  derived: {
    totalCount: number;
    resolvedCount: number;
    totalQuantity: number;
  };
  history: string[]; // history of serialized states for undo
  currentAuditRecordId: string | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const getInitialState = (): RestockSessionState => ({
  schemaVersion: 'v1',
  records: [],
  derived: {
    totalCount: 0,
    resolvedCount: 0,
    totalQuantity: 0
  },
  history: [],
  currentAuditRecordId: null
});

function calculateDerived(records: RestockTask[]) {
  return {
    totalCount: records.length,
    resolvedCount: records.filter(r => r.auditLensState?.status === 'RESOLVED').length,
    totalQuantity: records.reduce((acc, curr) => acc + curr.quantity, 0)
  };
}

export function useRestockState(initial?: RestockSessionState) {
  const [state, setState] = useState<RestockSessionState>(initial || getInitialState());

  const saveToHistory = (currentState: RestockSessionState) => {
    const serialized = JSON.stringify({
      records: currentState.records,
      currentAuditRecordId: currentState.currentAuditRecordId
    });
    return [...currentState.history.slice(-49), serialized];
  };

  const validateTask = (task: Partial<RestockTask>, allRecords: RestockTask[], isUpdate = false): string | null => {
    if (!task.title?.trim()) return "Title is required.";
    if (task.quantity === undefined || task.quantity < 0) return "Quantity must be >= 0.";
    if (task.maxLimit === undefined || task.maxLimit < 1) return "Max Limit must be >= 1.";
    if (task.quantity > task.maxLimit) return "Quantity cannot exceed Max Limit.";

    if (task.dependentRecordId) {
      const exists = allRecords.some(r => r.id === task.dependentRecordId && (!isUpdate || r.id !== task.id));
      if (!exists) return "Dependent record not found.";
    }
    return null;
  };

  const addTask = useCallback((task: Omit<RestockTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    let error: string | null = null;
    setState(prev => {
      const err = validateTask(task, prev.records);
      if (err) {
        error = err;
        return prev;
      }
      const newTask: RestockTask = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const newRecords = [...prev.records, newTask];
      return {
        ...prev,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: saveToHistory(prev)
      };
    });
    if (error) throw new Error(error);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<RestockTask>) => {
    let error: string | null = null;
    setState(prev => {
      const recordToUpdate = prev.records.find(r => r.id === id);
      if (!recordToUpdate) {
        error = "Record not found";
        return prev;
      }

      const updatedTask = { ...recordToUpdate, ...updates };
      const err = validateTask(updatedTask, prev.records, true);
      if (err) {
        error = err;
        return prev;
      }

      // Check conflict if dependent record changed state
      if (updates.status && updates.status === 'READY' && updatedTask.dependentRecordId) {
        const dep = prev.records.find(r => r.id === updatedTask.dependentRecordId);
        if (dep && dep.status !== 'READY') {
          error = "Conflict: Dependent record is not ready.";
          return prev;
        }
      }

      const newRecords = prev.records.map(record =>
        record.id === id ? { ...updatedTask, updatedAt: new Date().toISOString() } : record
      );
      return {
        ...prev,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: saveToHistory(prev)
      };
    });
    if (error) throw new Error(error);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => {
      const newRecords = prev.records.filter(r => r.id !== id);
      return {
        ...prev,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: saveToHistory(prev),
        currentAuditRecordId: prev.currentAuditRecordId === id ? null : prev.currentAuditRecordId
      };
    });
  }, []);

  const setAuditRecordId = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      currentAuditRecordId: id,
      history: saveToHistory(prev)
    }));
  }, []);

  const resolveAuditDiscrepancy = useCallback((id: string, evidenceUrl: string, notes: string) => {
    setState(prev => {
      const record = prev.records.find(r => r.id === id);
      if (!record) return prev;

      let auditLensState: AuditLensState = {
        status: 'RESOLVED',
        evidenceUrl,
        notes,
        resolvedAt: new Date().toISOString()
      };

      // Conflict logic: trying to resolve an audit when dependent record isn't resolved
      if (record.dependentRecordId) {
        const dep = prev.records.find(r => r.id === record.dependentRecordId);
        if (dep && dep.auditLensState?.status !== 'RESOLVED') {
          auditLensState.status = 'CONFLICT';
        }
      }

      const newRecords = prev.records.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: auditLensState.status === 'RESOLVED' ? 'READY' : r.status,
            auditLensState,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });

      return {
        ...prev,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: saveToHistory(prev)
      };
    });
  }, []);

  const undoLastAction = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = [...prev.history];
      const lastStateStr = newHistory.pop();
      if (!lastStateStr) return prev;

      const lastState = JSON.parse(lastStateStr);
      return {
        ...prev,
        records: lastState.records,
        currentAuditRecordId: lastState.currentAuditRecordId,
        derived: calculateDerived(lastState.records),
        history: newHistory
      };
    });
  }, []);

  const exportArtifact = useCallback(() => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  }, [state]);

  const validateImport = (data: any): boolean => {
    if (!data || data.schemaVersion !== 'v1') return false;
    if (!Array.isArray(data.records)) return false;

    const validStatuses = ['DRAFT', 'READY', 'CHANGED', 'ARCHIVED'];
    const ids = new Set<string>();

    for (const record of data.records) {
      if (!record.id || !record.title || !validStatuses.includes(record.status)) return false;
      if (record.quantity === undefined || record.quantity < 0) return false;
      if (record.maxLimit === undefined || record.maxLimit < 1) return false;
      if (record.quantity > record.maxLimit) return false;
      if (ids.has(record.id)) return false;
      ids.add(record.id);
    }

    // Validate cross refs
    for (const record of data.records) {
      if (record.dependentRecordId && !ids.has(record.dependentRecordId)) return false;
    }

    return true;
  };

  const importArtifact = useCallback((data: any) => {
    if (validateImport(data)) {
      setState({
        schemaVersion: 'v1',
        exportedAt: new Date().toISOString(),
        records: data.records,
        derived: calculateDerived(data.records),
        history: data.history || [],
        currentAuditRecordId: null
      });
      return true;
    }
    return false;
  }, []);

  const clearState = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    state,
    addTask,
    updateTask,
    deleteTask,
    setAuditRecordId,
    resolveAuditDiscrepancy,
    undoLastAction,
    exportArtifact,
    importArtifact,
    clearState
  };
}
