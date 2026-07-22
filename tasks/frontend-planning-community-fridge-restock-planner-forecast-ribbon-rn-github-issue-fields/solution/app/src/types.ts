export type RecordStatus = "draft" | "ready" | "changed" | "archived";

export interface RestockTask {
  id: string;
  task: string;
  status: RecordStatus;
}

export interface DerivedState {
  summary: {
    total: number;
    draft: number;
    ready: number;
    changed: number;
    archived: number;
  }
}

export interface CommunityFridgeRestockPlannerSession {
  schemaVersion: "v1";
  exportedAt: string;
  records: RestockTask[];
  derived: DerivedState;
  history: any[]; // Or a simplified history representation for export
}

export interface State {
  records: RestockTask[];
  selectedRecordId: string | null;
  history: {
    records: RestockTask[];
    selectedRecordId: string | null;
  }[];

  // Actions
  createRecord: (task: string, status: RecordStatus) => RestockTask;
  updateRecord: (id: string, task: string, status: RecordStatus) => RestockTask;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  undo: () => void;
  importSession: (session: CommunityFridgeRestockPlannerSession) => void;
  exportSession: () => CommunityFridgeRestockPlannerSession;
}
