export const statuses = ['draft', 'ready', 'changed', 'failed', 'recovery', 'resolved', 'archived'] as const;
export const plots = ['North Beds', 'South Beds', 'Orchard', 'Greenhouse'] as const;

export type DomainStatus = (typeof statuses)[number];
export type Plot = (typeof plots)[number];

export interface RecoveryBoardState {
  lane: 'queue' | 'recovery' | 'resolved';
  position: number;
  repairNote: string;
}

export interface WorkTaskRecord {
  id: string;
  title: string;
  description: string;
  status: DomainStatus;
  date: string;
  plot: Plot;
  volunteers: number;
  durationMinutes: number;
  order: number;
  recoveryBoardState: RecoveryBoardState;
}

export interface DerivedState {
  total: number;
  ready: number;
  failed: number;
  inRecovery: number;
  resolved: number;
  archived: number;
  volunteerHours: number;
}

export interface HistoryEvent {
  id: string;
  event: 'create' | 'update' | 'delete' | 'archive' | 'reorder' | 'move_to_recovery' | 'resolve_recovery' | 'undo' | 'import';
  recordId?: string;
  at: string;
  from?: string;
  to?: string;
}

export interface ArtifactFilters {
  status: DomainStatus | 'all';
  query: string;
}

export interface CommunityGardenWorkdayPlannerSession {
  schemaVersion: 'garden-workday-v1';
  exportedAt: string;
  records: WorkTaskRecord[];
  derived: DerivedState;
  history: HistoryEvent[];
  selectionId: string | null;
  filters: ArtifactFilters;
}

export interface Diagnostic {
  path: string;
  rejected: unknown;
  message: string;
  recovery: string;
}
