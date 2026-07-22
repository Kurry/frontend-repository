import { useState, useMemo } from 'react';
import type { LessonBlock, ClassroomLessonArcPlannerSession, AppHistoryEvent } from './types';

export const useAppState = () => {
  const [records, setRecords] = useState<LessonBlock[]>([]);
  const [history, setHistory] = useState<AppHistoryEvent[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const derived = useMemo(() => {
    const totalDuration = records.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
    const readyCount = records.filter(r => r.status === 'ready').length;
    return {
      totalDuration,
      summary: `${records.length} blocks total (${totalDuration} min) - ${readyCount} ready`,
    };
  }, [records]);

  const addRecord = (record: LessonBlock) => {
    setRecords(prev => [...prev, record]);
    setHistory(prev => [...prev, {
      type: 'MUTATE_RECORD',
      recordId: record.id,
      timestamp: new Date().toISOString(),
      newState: record
    }]);
  };

  const updateRecord = (id: string, updates: Partial<LessonBlock>) => {
    setRecords(prev => {
      const existing = prev.find(r => r.id === id);
      if (!existing) return prev;
      return prev.map(r => r.id === id ? { ...r, ...updates } : r);
    });

    // For simplicity, we just store full history of changes
    const existing = records.find(r => r.id === id);
    if (existing) {
       setHistory(prev => [...prev, {
         type: 'MUTATE_RECORD',
         recordId: id,
         timestamp: new Date().toISOString(),
         previousState: existing,
         newState: updates
       }]);
    }
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const undo = () => {
    if (history.length === 0) return;

    // Find last mutation
    const mutations = [...history].filter(h => h.type === 'MUTATE_RECORD');
    if (mutations.length === 0) return;

    const lastMutation = mutations[mutations.length - 1];

    if (lastMutation.previousState && lastMutation.recordId) {
      // Revert update
      setRecords(prev => prev.map(r =>
        r.id === lastMutation.recordId ? { ...r, ...lastMutation.previousState } as LessonBlock : r
      ));
    } else if (!lastMutation.previousState && lastMutation.recordId) {
      // Revert add (delete it)
      setRecords(prev => prev.filter(r => r.id !== lastMutation.recordId));
    }

    // Remove last mutation from history and add undo event
    setHistory(prev => {
      const newHistory = [...prev];
      const mutationIndex = newHistory.lastIndexOf(lastMutation);
      if(mutationIndex !== -1) {
         newHistory.splice(mutationIndex, 1);
      }
      return [...newHistory, {
        type: 'UNDO',
        timestamp: new Date().toISOString(),
        recordId: lastMutation.recordId
      }];
    });
  };

  const exportSession = (): ClassroomLessonArcPlannerSession => {
    return {
      schemaVersion: 'lesson-arc-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };
  };

  const importSession = (session: any) => {
    if (session.schemaVersion !== 'lesson-arc-v1') {
      throw new Error("Invalid schema version");
    }
    if (!Array.isArray(session.records)) {
      throw new Error("Invalid records array");
    }
    // simple bounds check
    for(const r of session.records) {
       if(typeof r.duration !== 'number' || r.duration < 0) {
          throw new Error("Invalid numeric bounds in imported artifact");
       }
    }

    setRecords(session.records);
    setHistory(session.history || []);
    setSelectedRecordId(null);
  };

  const clearSession = () => {
    setRecords([]);
    setHistory([]);
    setSelectedRecordId(null);
  };

  return {
    records,
    derived,
    history,
    selectedRecordId,
    setSelectedRecordId,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    exportSession,
    importSession,
    clearSession,
    setRecords
  };
};
