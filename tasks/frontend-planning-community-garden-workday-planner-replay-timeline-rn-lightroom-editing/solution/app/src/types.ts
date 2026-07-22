export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface WorkTask {
  id: string;
  title: string;
  status: RecordStatus;
  description: string;
  assignedTo?: string;
  estimatedHours?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface TimelineEvent {
  id: string;
  taskId: string;
  timestamp: string; // ISO string
  mutationType: 'create' | 'update' | 'archive' | 'restore';
  previousState: WorkTask | null;
  newState: WorkTask;
}

export interface SessionDerived {
  totalTasks: number;
  draftCount: number;
  readyCount: number;
  changedCount: number;
  archivedCount: number;
}

export interface SessionArtifact {
  schemaVersion: string;
  exportedAt: string;
  records: WorkTask[];
  derived: SessionDerived;
  history: TimelineEvent[];
}

export interface TimelineSelection {
  eventId: string;
}

export interface WebMCPSessionInfo {
  task: string;
  mode: string;
  version: string;
}
