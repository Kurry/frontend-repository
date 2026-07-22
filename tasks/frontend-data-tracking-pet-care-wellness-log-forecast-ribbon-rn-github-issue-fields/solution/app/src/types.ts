export type EventStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface PetCareEvent {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  priority: 'low' | 'medium' | 'high';
  date: string; // ISO string
  projectedOutcome: string;
}

export interface DerivedState {
  summary: {
    totalEvents: number;
    completedEvents: number;
    upcomingEvents: number;
    archivedEvents: number;
  };
}

export interface PetCareWellnessLogSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: PetCareEvent[];
  derived: DerivedState;
  history: PetCareWellnessLogSession[];
}

export interface EditorState {
  selectedRecordId: string | null;
  ribbonProperty: 'status' | 'priority' | null;
}
