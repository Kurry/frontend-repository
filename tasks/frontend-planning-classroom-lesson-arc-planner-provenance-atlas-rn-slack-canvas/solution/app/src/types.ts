export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface LessonBlock {
  id: string;
  title: string;
  content: string;
  status: DomainStatus;
  provenance: {
    sourceEvidence: string;
    lineageStatus: 'clean' | 'quarantined';
  };
}

export interface ArtifactDerived {
  summary: {
    totalBlocks: number;
    quarantinedCount: number;
    readyCount: number;
  };
}

export interface ArtifactHistoryEvent {
  timestamp: string;
  action: string;
  recordId?: string;
  details?: any;
}

export interface ClassroomLessonArcPlannerSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: LessonBlock[];
  derived: ArtifactDerived;
  history: ArtifactHistoryEvent[];
}
