export type EntityId = string;

export interface ReliefModelRecord {
  id: EntityId;
  title: string;
  widthStuds: number;
  depthStuds: number;
  courseCount: number;
  brickIds: EntityId[];
  paletteTokenIds: EntityId[];
  fixtureRevisionId: string;
  modelHash: string;
}

export interface PartDefinitionRecord {
  id: EntityId;
  label: string;
  widthStuds: number;
  depthStuds: number;
  heightCourses: number;
  allowedRotations: number[]; // 0, 1, 2, 3 quarter-turns
  paletteTokenIds: EntityId[];
  revisionId: string;
  partHash: string;
}

export interface BrickRecord {
  id: EntityId;
  modelId: EntityId;
  partDefinitionId: EntityId;
  partRevisionId: string;
  course: number;
  x: number;
  y: number;
  rotationQuarterTurns: number;
  paletteTokenId: EntityId;
  locked: boolean;
  actorId: string;
  eventId: string;
  status: 'active' | 'archived';
}

export interface SupportEdgeRecord {
  id: EntityId;
  supporterBrickId: EntityId;
  supportedBrickId: EntityId;
  supportedStudIds: string[]; // semicolon-joined strings like "x,y"
  supportedStudCount: number;
  supportedFootprintCount: number;
  ratioNumerator: number;
  ratioDenominator: number;
  revisionId: string;
  edgeHash: string;
}

export interface GuideGroupRecord {
  id: EntityId;
  label: string;
  brickIds: EntityId[];
  kind: string;
  ruleRevisionId: string;
  status: string;
  groupHash: string;
}

export interface GuideStepRecord {
  id: EntityId;
  order: number;
  label: string;
  courseMin: number;
  courseMax: number;
  groupIds: EntityId[];
  brickIds: EntityId[];
  predecessorStepIds: EntityId[];
  status: string;
  stepHash: string;
}

export interface LayoutDecisionRecord {
  id: EntityId;
  modelId: EntityId;
  geometryHash: string;
  supportHash: string;
  guideHash: string;
  metricsHash: string;
  rationale: string;
  confidence: 'working' | 'tentative' | 'rejected';
  sourceIds: string;
  actorId: string;
  logicalAt: string;
  parentDecisionId: string | null;
  status: string;
}

export interface CheckpointRecord {
  id: EntityId;
  label: string;
  hash: string;
}

export interface HistoryEvent {
  id: string;
  occurredAt: string;
  actor: string;
  kind: string;
  status: string;
  parentBranchId: string;
  targetId: string;
  revisionId: string;
  patch: any;
  cancelReason: string | null;
  stateHash: string;
}
