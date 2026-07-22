export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';

export type AuditState = 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  status: RecordStatus;
  auditState: AuditState;
  evidence: string;
}

export interface HomeLibraryLendingLedgerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BookRecord[];
  derived: {
    summary: string;
  };
  history: any[];
}
