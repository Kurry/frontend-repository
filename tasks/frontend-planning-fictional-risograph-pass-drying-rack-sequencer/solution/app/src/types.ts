export type PosterRecord = {
  id: string;
  title: string;
  widthUnits: number;
  heightUnits: number;
  columns: number;
  rows: number;
  backgroundRgb: [number, number, number];
  passIds: string[];
  fixtureRevisionId: string;
  posterHash: string;
};

export type InkSourceRecord = {
  id: string;
  label: string;
  rgb: [number, number, number];
  alphaMilli: number;
  settleTicks: number;
  revisionId: string;
  sourceHash: string;
  status: 'active' | 'archived';
};

export type PrintPassRecord = {
  id: string;
  posterId: string;
  inkSourceId: string;
  inkRevisionId: string;
  order: number;
  mask: {
    x: number;
    y: number;
    width: number;
    height: number;
    maskHash: string;
  };
  printTicks: number;
  actorId: string;
  eventId: string;
  status: 'active' | 'locked' | 'archived';
};

export type ScheduleIntervalRecord = {
  id: string;
  passId: string;
  kind: 'print' | 'settle';
  startTick: number;
  endTick: number;
  predecessorId: string | null;
  revisionId: string;
  status: 'queued' | 'printing' | 'settle-held' | 'ready' | 'superseded' | 'rejected';
};

export type ProofDecisionRecord = {
  id: string;
  posterId: string;
  orderHash: string;
  cellProofHash: string;
  scheduleHash: string;
  metricsHash: string;
  rationale: string;
  confidence: 'working' | 'tentative' | 'rejected';
  sourceIds: string[];
  actorId: string;
  logicalAt: string;
  parentDecisionId: string | null;
  correctionIds: string[];
  status: 'active' | 'stale';
};

export type AnnotationRecord = {
  id: string;
  targetId: string;
  revisionId: string;
  note: string;
  actorId: string;
  logicalAt: string;
  replyToId: string | null;
};

export type CheckpointRecord = {
  id: string;
  label: string;
  eventAnchorId: string;
  logicalAt: string;
};

export type ReviewRecord = {
  id: string;
  targetId: string;
  status: 'pending' | 'resolved';
  actorId: string;
  logicalAt: string;
};

export type ApprovalRecord = {
  id: string;
  decisionId: string;
  scheduleHash: string;
  actorId: string;
  logicalAt: string;
  status: 'valid' | 'invalidated';
};

export type HistoryEvent = {
  id: string;
  logicalTick: number;
  occurredAt: string;
  actorId: string;
  kind: string;
  status: 'committed' | 'undone' | 'rejected';
  parentId: string | null;
  branchId: string;
  targetId: string;
  revisionId: string;
  patch: any;
  cancelReason: string | null;
  stateHash: string;
};

export type CellState = {
  cellId: string;
  row: number;
  col: number;
  coveringPassIds: string[];
  orderedContributorIds: string[];
  rgb: [number, number, number];
  selected: boolean;
};
