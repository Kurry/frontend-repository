export type TaskStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee?: string;
  dueDate?: string; // YYYY-MM-DD
  budget?: number;
  dependencies: string[]; // Array of task IDs
  provenanceEvidence?: string;
  provenanceStatus?: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

export interface DerivedState {
  totalTasks: number;
  draftTasks: number;
  readyTasks: number;
  changedTasks: number;
  archivedTasks: number;
  totalBudget: number;
  summary: string;
}

export interface HistoryEvent {
  timestamp: string;
  taskId: string;
  action: 'create' | 'update' | 'archive' | 'quarantine';
  previousState?: any;
  newState?: any;
}

export interface CommunityGardenWorkdayPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string; // RFC3339
  records: WorkTask[];
  derived: DerivedState;
  history: HistoryEvent[];
}
