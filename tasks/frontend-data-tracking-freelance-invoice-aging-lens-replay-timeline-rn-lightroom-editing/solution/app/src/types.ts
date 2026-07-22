export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface RecordState {
  id: string;
  status: RecordStatus;
  title: string;
  amount: number;
  dueDate: string;
  client: string;
}

export interface SessionRecord {
  id: string;
  history: RecordState[];
  currentIndex: number;
}

export interface DerivedSummary {
  totalAmount: number;
  readyCount: number;
  draftCount: number;
  archivedCount: number;
}

export interface FreelanceInvoiceAgingLensSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: SessionRecord[];
  derived: DerivedSummary;
}
