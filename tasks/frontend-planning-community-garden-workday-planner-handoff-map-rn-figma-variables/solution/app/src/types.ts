export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  status: DomainStatus;
  handoffOwner?: string;
  requiredDate?: string; // RFC3339 or YYYY-MM-DD
  area?: string;
}

export interface DerivedState {
  summary: {
    total: number;
    byStatus: Record<DomainStatus, number>;
  };
}

export interface HistoryEvent {
  action: string;
  timestamp: string;
  recordId?: string;
}

export interface CommunityGardenWorkdayPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string; // RFC3339
  records: WorkTask[];
  derived: DerivedState;
  history: HistoryEvent[];
}
