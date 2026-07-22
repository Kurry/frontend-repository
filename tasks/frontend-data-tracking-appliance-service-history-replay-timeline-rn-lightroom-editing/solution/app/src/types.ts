export type ApplianceStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  type: 'creation' | 'service' | 'inspection' | 'modification';
  snapshot: Omit<ApplianceRecord, 'service_history' | 'timeline_checkpoint'>;
}

export interface ApplianceRecord {
  id: string;
  type: string;
  brand: string;
  model: string;
  serial_number: string;
  status: ApplianceStatus;
  service_history: TimelineEvent[];
  timeline_checkpoint?: string;
  metadata?: Record<string, any>;
}

export interface DerivedState {
  totalRecords: number;
  recordsByStatus: Record<ApplianceStatus, number>;
  activeFilter: ApplianceStatus | 'all';
  activeSelectionId: string | null;
  sortOrder: 'asc' | 'desc';
}

export interface HistoryAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'scrub';
  recordId: string;
  timestamp: string;
  previousState: ApplianceRecord | null;
  newState: ApplianceRecord | null;
}

export interface ArtifactSchema {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ApplianceRecord[];
  derived: DerivedState;
  history: HistoryAction[];
}
