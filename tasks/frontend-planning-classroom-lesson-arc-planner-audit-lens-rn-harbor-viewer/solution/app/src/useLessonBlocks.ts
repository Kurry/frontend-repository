import { useState, useCallback, useMemo } from 'react';
import type {
  LessonBlock,


  ClassroomLessonArcPlannerSession
} from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();

export function useLessonBlocks() {
  const [records, setRecords] = useState<LessonBlock[]>([
    {
      id: '1',
      title: 'Introduction to Fractions',
      durationMins: 45,
      status: 'ready',
      auditState: 'idle',
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: '2',
      title: 'Adding with Common Denominators',
      durationMins: 60,
      status: 'draft',
      auditState: 'conflict',
      createdAt: now(),
      updatedAt: now()
    }
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<LessonBlock[][]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const derived = useMemo(() => {
    return {
      summary: {
        totalBlocks: records.filter(r => r.status !== 'archived').length,
        resolvedDiscrepancies: records.filter(r => r.auditState === 'resolved').length,
        totalDurationMins: records.reduce((acc, r) => acc + (r.status !== 'archived' ? r.durationMins : 0), 0)
      }
    };
  }, [records]);

  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev, [...records]]);
  }, [records]);

  const createRecord = useCallback((partial: Pick<LessonBlock, 'title' | 'durationMins'>) => {
    saveState();
    const newRecord: LessonBlock = {
      id: generateId(),
      title: partial.title,
      durationMins: partial.durationMins,
      status: 'draft',
      auditState: 'idle',
      createdAt: now(),
      updatedAt: now()
    };
    setRecords(prev => [...prev, newRecord]);
    setHistory(prev => [...prev, { action: 'create', timestamp: now(), recordId: newRecord.id }]);
    setErrorMsg(null);
  }, [saveState]);

  const updateRecord = useCallback((id: string, updates: Partial<LessonBlock>) => {
    saveState();
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, ...updates, updatedAt: now() };
      }
      return r;
    }));
    setHistory(prev => [...prev, { action: 'update', timestamp: now(), recordId: id }]);
    setErrorMsg(null);
  }, [saveState]);

  const attachEvidenceAndResolve = useCallback((id: string, evidenceId: string) => {
    saveState();
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        if (r.auditState === 'resolved') {
          setErrorMsg('Conflict: Already resolved');
          return r;
        }
        return {
          ...r,
          auditState: 'resolved',
          status: 'changed',
          evidenceId,
          updatedAt: now()
        };
      }
      return r;
    }));
    setHistory(prev => [...prev, { action: 'resolve_audit', timestamp: now(), recordId: id }]);
  }, [saveState]);

  const archiveRecord = useCallback((id: string) => {
    saveState();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'archived', updatedAt: now() } : r));
    setHistory(prev => [...prev, { action: 'archive', timestamp: now(), recordId: id }]);
  }, [saveState]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRecords(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      setHistory(prev => [...prev, { action: 'undo', timestamp: now() }]);
      setErrorMsg(null);
    }
  }, [undoStack]);

  const exportArtifact = useCallback((): ClassroomLessonArcPlannerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: now(),
      records,
      derived,
      history
    };
  }, [records, derived, history]);

  const importArtifact = useCallback((session: any) => {
    if (session?.schemaVersion !== 'v1' || !Array.isArray(session?.records)) {
      setErrorMsg('Malformed import: Invalid schema');
      return;
    }
    const valid = session.records.every((r: any) => r.id && r.title && r.status);
    if (!valid) {
      setErrorMsg('Malformed import: Invalid records bounds or schema');
      return;
    }

    // Check for duplicate IDs
    const ids = new Set(session.records.map((r: any) => r.id));
    if (ids.size !== session.records.length) {
       setErrorMsg('Malformed import: Duplicate IDs');
       return;
    }

    setRecords(session.records.map((r: any) => ({ ...r, updatedAt: now() })));
    setHistory(session.history || []);
    setUndoStack([]);
    setErrorMsg(null);
  }, []);

  const clearSession = useCallback(() => {
    setRecords([]);
    setHistory([]);
    setUndoStack([]);
    setErrorMsg(null);
  }, []);

  return {
    records,
    derived,
    history,
    errorMsg,
    createRecord,
    updateRecord,
    archiveRecord,
    attachEvidenceAndResolve,
    undo,
    exportArtifact,
    importArtifact,
    clearSession,
    setErrorMsg,
    canUndo: undoStack.length > 0
  };
}
