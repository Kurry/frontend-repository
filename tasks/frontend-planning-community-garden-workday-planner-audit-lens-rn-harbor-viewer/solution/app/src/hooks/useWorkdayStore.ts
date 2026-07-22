import { useState, useCallback } from 'react';
import type {
  WorkRecord,
  RecordStatus,
  CommunityGardenWorkdayPlannerSession,
  HistoryEvent
} from '../types';

const INITIAL_RECORDS: WorkRecord[] = [
  { id: '1', title: 'Prepare compost beds', description: 'Turn and water the north beds', status: 'draft', auditLensState: 'idle', evidence: null, order: 0 },
  { id: '2', title: 'Harvest summer squash', description: 'Box and weigh for distribution', status: 'ready', auditLensState: 'idle', evidence: null, order: 1 },
  { id: '3', title: 'Repair irrigation leak', description: 'Zone C manifold is leaking', status: 'changed', auditLensState: 'conflict', evidence: null, order: 2 },
];

export function useWorkdayStore() {
  const [records, setRecords] = useState<WorkRecord[]>(INITIAL_RECORDS);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [pastStates, setPastStates] = useState<{ records: WorkRecord[], history: HistoryEvent[] }[]>([]);

  const pushState = useCallback((newRecords: WorkRecord[], newHistory: HistoryEvent[]) => {
    setPastStates(prev => [...prev, { records, history: historyEvents }]);
    setRecords(newRecords);
    setHistoryEvents(newHistory);
  }, [records, historyEvents]);

  const undo = useCallback(() => {
    if (pastStates.length === 0) return;
    const previous = pastStates[pastStates.length - 1];
    setRecords(previous.records);
    setHistoryEvents(previous.history);
    setPastStates(prev => prev.slice(0, -1));
  }, [pastStates]);

  const addRecord = useCallback((title: string) => {
    const newRecord: WorkRecord = {
      id: Date.now().toString(),
      title,
      description: '',
      status: 'draft',
      auditLensState: 'idle',
      evidence: null,
      order: records.length,
    };
    const newHistory = [...historyEvents, { action: 'create', timestamp: new Date().toISOString(), recordId: newRecord.id }];
    pushState([...records, newRecord], newHistory);
  }, [records, historyEvents, pushState]);

  const updateRecordStatus = useCallback((id: string, status: RecordStatus) => {
    const newRecords = records.map(r => r.id === id ? { ...r, status } : r);
    const newHistory = [...historyEvents, { action: `update_status_${status}`, timestamp: new Date().toISOString(), recordId: id }];
    pushState(newRecords, newHistory);
  }, [records, historyEvents, pushState]);

  const deleteRecord = useCallback((id: string) => {
    const newRecords = records.filter(r => r.id !== id);
    const newHistory = [...historyEvents, { action: 'delete', timestamp: new Date().toISOString(), recordId: id }];
    pushState(newRecords, newHistory);
  }, [records, historyEvents, pushState]);

  const attachEvidenceAndResolve = useCallback((id: string, evidence: string) => {
    const newRecords = records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          evidence,
          auditLensState: 'resolved' as const,
          status: 'ready' as const, // Resolving discrepancy marks it ready
        };
      }
      return r;
    });
    const newHistory = [...historyEvents, { action: 'resolve_audit', timestamp: new Date().toISOString(), recordId: id }];
    pushState(newRecords, newHistory);
  }, [records, historyEvents, pushState]);

  const derivedSummary = {
    totalTasks: records.length,
    resolvedDiscrepancies: records.filter(r => r.auditLensState === 'resolved').length
  };

  const getSessionJSON = useCallback((): CommunityGardenWorkdayPlannerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: derivedSummary,
      history: historyEvents,
    };
  }, [records, historyEvents, derivedSummary]);

  const loadSessionJSON = useCallback((session: CommunityGardenWorkdayPlannerSession) => {
    if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
      console.warn("Invalid session schema");
      return;
    }
    pushState(session.records, session.history || []);
  }, [pushState]);

  const clearSession = useCallback(() => {
    pushState([], []);
  }, [pushState]);

  return {
    records,
    derivedSummary,
    addRecord,
    updateRecordStatus,
    deleteRecord,
    attachEvidenceAndResolve,
    undo,
    getSessionJSON,
    loadSessionJSON,
    clearSession
  };
}
