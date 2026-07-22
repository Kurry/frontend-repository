export type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface CameraRecord {
  id: string;
  name: string;
  tag: string;
  status: RecordStatus;
  cells: number; // representation of evidence
  position?: number;
  angle?: number;
  auditLensState?: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

export interface StoryboardCameraPathEditorSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: CameraRecord[];
  derived: {
    summary: {
      totalRecords: number;
      readyRecords: number;
      archivedRecords: number;
      conflicts: number;
    }
  };
  history: AuditEvent[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  recordId?: string;
  details: string;
}
