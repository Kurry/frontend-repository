import { useState, useCallback, useMemo } from 'react';
import type { LessonBlock, ClassroomLessonArcPlannerSession, ArtifactHistoryEvent } from './types';

export const useAppState = () => {
  const [records, setRecords] = useState<LessonBlock[]>([]);
  const [history, setHistory] = useState<ArtifactHistoryEvent[]>([]);
  const [undoStack, setUndoStack] = useState<{ records: LessonBlock[], history: ArtifactHistoryEvent[] }[]>([]);

  const derived = useMemo(() => {
    return {
      summary: {
        totalBlocks: records.length,
        quarantinedCount: records.filter(r => r.provenance.lineageStatus === 'quarantined').length,
        readyCount: records.filter(r => r.status === 'ready').length,
      }
    };
  }, [records]);

  const saveStateToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev, { records, history }]);
  }, [records, history]);

  const createBlock = useCallback((block: LessonBlock) => {
    saveStateToUndoStack();
    setRecords(prev => [...prev, block]);
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'create', recordId: block.id }]);
  }, [saveStateToUndoStack]);

  const updateBlock = useCallback((id: string, updates: Partial<LessonBlock>) => {
    saveStateToUndoStack();
    setRecords(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'update', recordId: id, details: Object.keys(updates) }]);
  }, [saveStateToUndoStack]);

  const deleteBlock = useCallback((id: string) => {
    saveStateToUndoStack();
    setRecords(prev => prev.filter(b => b.id !== id));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: 'delete', recordId: id }]);
  }, [saveStateToUndoStack]);

  const executeProvenanceAtlasMutation = useCallback((id: string, sourceEvidence: string) => {
    saveStateToUndoStack();
    setRecords(prev => prev.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: 'changed',
          provenance: {
            ...b.provenance,
            sourceEvidence,
            lineageStatus: 'quarantined'
          }
        };
      }
      return b;
    }));
    setHistory(prev => [...prev, {
      timestamp: new Date().toISOString(),
      action: 'provenance_atlas_mutation',
      recordId: id,
      details: { sourceEvidence, lineageStatus: 'quarantined', status: 'changed' }
    }]);
  }, [saveStateToUndoStack]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const prevState = newStack.pop();
      if (prevState) {
        setRecords(prevState.records);
        setHistory(prevState.history);
      }
      return newStack;
    });
  }, []);

  const exportState = useCallback((): ClassroomLessonArcPlannerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
  }, [records, derived, history]);

  const importState = useCallback((sessionData: any) => {
    if (sessionData && sessionData.schemaVersion === 'v1' && Array.isArray(sessionData.records)) {
      saveStateToUndoStack();

      const importedRecords = sessionData.records;

      setRecords(importedRecords);
      // Validate or rebuild derived (it's memoized anyway)

      setHistory(sessionData.history || []);
      return true;
    }
    return false;
  }, [saveStateToUndoStack]);

  const clearState = useCallback(() => {
    saveStateToUndoStack();
    setRecords([]);
    setHistory([]);
  }, [saveStateToUndoStack]);

  return {
    records,
    derived,
    history,
    createBlock,
    updateBlock,
    deleteBlock,
    executeProvenanceAtlasMutation,
    undo,
    canUndo: undoStack.length > 0,
    exportState,
    importState,
    clearState
  };
};
