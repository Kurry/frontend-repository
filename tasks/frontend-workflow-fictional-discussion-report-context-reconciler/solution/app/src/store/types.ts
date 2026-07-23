export type MessageStatus = "visible" | "tombstone";
export type RoleName = "target" | "root" | "parent" | "preceding-sibling" | "following-sibling" | "referenced";
export type ReportStatus = "open" | "merged" | "approved" | "queued" | "stale" | "closed";
export type DecisionValue = "guidance" | "no-action" | "archive" | "needs-context";
export type NoteState = "active" | "suspended" | "resolved" | "accepted";
export type QueueStatus = "draft" | "queued" | "sending" | "sent-simulated" | "retry-wait" | "stale" | "canceled";

export interface Message {
  id: string;
  threadId: string;
  sequence: number;
  parentId: string | null;
  authorId: string;
  createdAt: string;
  status: MessageStatus;
  text: string | null;
  textHash: string;
  referenceIds: string[];
  deletion: { eventId: string; reason: string; logicalTime: number } | null;
}

export interface RoleEvidence {
  role: RoleName;
  messageId: string;
  satisfied: boolean;
  source: "interval" | "pinned" | "promoted";
}

export interface ContextWindow {
  reportId: string;
  startSequence: number;
  endSequence: number;
  includedMessageIds: string[];
  pinnedMessageIds: string[];
  promotedRequiredIds: string[];
  requiredRoles: RoleEvidence[];
  completenessNumerator: number;
  completenessDenominator: number;
  revision: number;
}

export interface Report {
  id: string;
  threadId: string;
  targetMessageIds: string[];
  sourceReportIds: string[];
  contextWindow: ContextWindow | null;
  ruleIds: string[];
  decision: DecisionValue | null;
  rationale: string | null;
  citationMessageIds: string[];
  status: ReportStatus;
  mergedIntoId: string | null;
  revision: number;
}

export interface DuplicateCandidate {
  id: string;
  aReportId: string;
  bReportId: string;
  intersectionIds: string[];
  unionIds: string[];
  jaccardNumerator: number;
  jaccardDenominator: number;
  jaccardPercent: number;
  thresholdPercent: number;
  eligibility: "below" | "eligible" | "merged" | "declined";
  revision: number;
}

export interface Note {
  id: string;
  targetType: "report" | "message";
  targetId: string;
  actorId: string;
  text: string;
  logicalTime: number;
  state: NoteState;
}

export interface QueuePacket {
  id: string;
  reportId: string;
  reportRevision: number;
  approvalHash: string;
  enqueuedLogicalTime: number;
  status: QueueStatus;
  attemptCount: number;
  nextEligibleLogicalTime: number | null;
  lastEventId: string;
}

export interface TokenBucket {
  capacity: number;
  tokens: number;
  lastRefillLogicalTime: number;
  refillEverySeconds: number;
}

export interface AppState {
  workspaces: string[];
  activeWorkspaceId: string | null;
  threads: Message[];
  reports: Report[];
  notes: Note[];
  duplicateCandidates: DuplicateCandidate[];
  queue: QueuePacket[];
  tokenBucket: TokenBucket;
  logicalTime: number;

  // Actions
  updateContextWindow: (reportId: string, startSeq: number, endSeq: number, promotedRequiredIds: string[]) => void;
  advanceLogicalTime: (amount: number) => void;
  // add more as needed
}
