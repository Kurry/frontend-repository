export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PracticeSegment {
  id: string;
  title: string;
  instrument: string;
  bpm: number;
  status: DomainStatus;
  auditEvidence?: string;
  auditConflict?: string;
}

export type AuditLensState = {
  selectedRecordId: string | null;
  mode: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
  pendingEvidence?: string;
};

export interface MusicPracticeLoopComposerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PracticeSegment[];
  derived: {
    totalRecords: number;
    readyCount: number;
    conflictCount: number;
  };
  history: any[]; // Assuming we just store some audit events here
}
