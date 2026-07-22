export type CommitmentClass = 'core' | 'exploration' | 'maintenance' | 'leisure';

export type TaskStatus = 'draft' | 'planned' | 'active' | 'paused' | 'waiting' | 'complete' | 'abandoned' | 'archived' | 'someday';

export interface ContextCard {
  id: string;
  revision: number;
  time: string;
  source: string;
  content: string;
  freshnessHorizonDays: number;
}

export interface Task {
  id: string;
  revision: number;
  outcome: string;
  nextAction: string;
  area: string;
  effort: number; // in hours or points
  deadline?: string;
  commitmentClass: CommitmentClass;
  owner: string;
  waitingParty?: string;
  completionEvidenceRule: string;
  status: TaskStatus;

  contextBindingIds: string[]; // references ContextCard.id

  // Triage state
  triageQueue?: string;
  triageRationale?: string;
  triageScheduledDate?: string;
}

export type EdgeType = 'blocks' | 'requires' | 'contributes' | 'duplicate-of' | 'waiting-on' | 'follow-up-after';

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
}

export interface PriorityAllocation {
  taskId: string;
  points: number;
}

export interface ArtifactChecksums {
  tasks: string;
  evidence: string;
  graph: string;
  allocations: string;
}

export interface BacklogDecisionLedger {
  schemaVersion: "backlog-decision-ledger/v1";
  fixture: string;
  hash: string;
  timezone: string;
  logicalClockDays: number;

  tasks: Task[];
  contextCards: ContextCard[];
  edges: Edge[];
  allocations: PriorityAllocation[];

  exportedAt: string;
}

// Logical decay formula input
export interface DecayInput {
  logicalClockDays: number;
  task: Task;
  contextCards: ContextCard[]; // specifically the bound ones
  edges: Edge[]; // edges related to this task
  priorityPoints: number;
}
