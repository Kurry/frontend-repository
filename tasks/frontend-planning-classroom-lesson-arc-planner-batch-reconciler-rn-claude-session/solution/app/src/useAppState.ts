import { useState, useCallback, useMemo } from 'react';
import type { ClassroomLessonArcPlannerSession, LessonBlock, ActionHistory, DerivedState } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createInitialState = (): ClassroomLessonArcPlannerSession => ({
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', title: 'Introduction to Fractions', durationMinutes: 30, status: 'ready', order: 1 },
    { id: '2', title: 'Adding Fractions', durationMinutes: 45, status: 'draft', order: 2 },
    { id: '3', title: 'Subtracting Fractions', durationMinutes: 45, status: 'draft', order: 3 },
  ],
  derived: { summary: { totalBlocks: 3, totalDuration: 120, batchedBlocks: 0 } },
  history: [],
});

export function useAppState() {
  const [state, setState] = useState<ClassroomLessonArcPlannerSession>(createInitialState());

  const addHistory = (currentState: ClassroomLessonArcPlannerSession, action: string, previousState: any) => {
    return {
      action,
      timestamp: new Date().toISOString(),
      previousState: JSON.parse(JSON.stringify(previousState)),
    };
  };

  const computeDerivedState = (records: LessonBlock[]): DerivedState => {
    return {
      summary: {
        totalBlocks: records.length,
        totalDuration: records.reduce((sum, r) => sum + r.durationMinutes, 0),
        batchedBlocks: records.filter(r => r.batchId).length,
      }
    };
  };

  const createRecord = useCallback((record: Partial<LessonBlock>) => {
    setState(prev => {
      if (!record.title || typeof record.durationMinutes !== 'number' || record.durationMinutes < 1) {
        return prev;
      }
      const newRecord: LessonBlock = {
        id: generateId(),
        title: record.title,
        durationMinutes: record.durationMinutes,
        status: record.status || 'draft',
        order: prev.records.length + 1,
      };
      const newRecords = [...prev.records, newRecord];
      return {
        ...prev,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: [...prev.history, addHistory(prev, 'create_record', prev.records)]
      };
    });
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<LessonBlock>) => {
    setState(prev => {
      const index = prev.records.findIndex(r => r.id === id);
      if (index === -1) return prev;

      const updatedRecord = { ...prev.records[index], ...updates };
      if (!updatedRecord.title || typeof updatedRecord.durationMinutes !== 'number' || updatedRecord.durationMinutes < 1) {
        return prev;
      }

      const newRecords = [...prev.records];
      newRecords[index] = updatedRecord;

      return {
        ...prev,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: [...prev.history, addHistory(prev, 'update_record', prev.records)]
      };
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState(prev => {
      const newRecords = prev.records.filter(r => r.id !== id);
      return {
        ...prev,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: [...prev.history, addHistory(prev, 'delete_record', prev.records)]
      };
    });
  }, []);

  const batchReconcile = useCallback((selectedIds: string[]) => {
    setState(prev => {
      if (selectedIds.length === 0) return prev;
      const batchId = generateId();
      const newRecords = prev.records.map(record => {
        if (selectedIds.includes(record.id)) {
          return { ...record, batchId, status: 'changed' as const };
        }
        return record;
      });

      return {
        ...prev,
        records: newRecords,
        derived: computeDerivedState(newRecords),
        history: [...prev.history, addHistory(prev, 'batch_reconcile', prev.records)]
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const lastHistory = prev.history[prev.history.length - 1];
      const previousRecords = lastHistory.previousState as LessonBlock[];

      return {
        ...prev,
        records: previousRecords,
        derived: computeDerivedState(previousRecords),
        history: prev.history.slice(0, -1),
      };
    });
  }, []);

  const exportArtifact = useCallback(() => {
    return {
      ...state,
      exportedAt: new Date().toISOString()
    };
  }, [state]);

  const importArtifact = useCallback((artifact: any) => {
    setState(prev => {
      try {
        if (artifact.schemaVersion !== 'v1' || !Array.isArray(artifact.records)) {
          return prev;
        }

        // Field level validation
        const isValid = artifact.records.every((r: any) =>
          r.id && r.title && typeof r.durationMinutes === 'number' && r.durationMinutes >= 1
          && ['draft', 'ready', 'changed', 'archived'].includes(r.status)
        );

        if (!isValid) return prev;

        // Check unique IDs
        const ids = new Set(artifact.records.map((r: any) => r.id));
        if (ids.size !== artifact.records.length) return prev;

        return {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: artifact.records,
          derived: computeDerivedState(artifact.records),
          history: artifact.history || []
        };
      } catch (e) {
        return prev;
      }
    });
  }, []);

  const clearSession = useCallback(() => {
    setState({
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: [],
      derived: computeDerivedState([]),
      history: []
    });
  }, []);

  return {
    state,
    createRecord,
    updateRecord,
    deleteRecord,
    batchReconcile,
    undo,
    exportArtifact,
    importArtifact,
    clearSession,
  };
}
