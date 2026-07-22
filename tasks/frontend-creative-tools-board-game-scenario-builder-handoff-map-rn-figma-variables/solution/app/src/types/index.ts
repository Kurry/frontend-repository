export type ScenarioStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface ScenarioRecord {
  id: string;
  title: string;
  description: string;
  status: ScenarioStatus;
  ownerId: string | null;
  difficulty: number; // 1-5
  duration: number; // minutes, max 300
}

export interface DerivedState {
  summary: {
    total: number;
    assigned: number;
    unassigned: number;
    ready: number;
    draft: number;
  }
}

export interface ArtifactState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ScenarioRecord[];
  derived: DerivedState;
  history: any[]; // simplify for now, maybe track undo actions
}

export interface HandoffOwner {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}
