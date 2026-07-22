export type StationStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface Position {
  x: number;
  y: number;
}

export interface StationRecord {
  id: string;
  title: string;
  status: StationStatus;
  capacity: number;
  studentsAssigned: number;
  position?: Position;
}

export interface DerivedState {
  totalCapacity: number;
  totalStudentsAssigned: number;
  overallStatus: 'balanced' | 'over_capacity' | 'under_capacity';
  readyStationsCount: number;
}

export interface ClassroomRotationSchedulerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: StationRecord[];
  derived: DerivedState;
  history: StationRecord[][]; // Stack of records[] for undo
}
