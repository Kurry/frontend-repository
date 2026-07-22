export type Winding = 'clockwise' | 'counterclockwise';
export type Relation = 'gap' | 'tangent' | 'overlap';
export type CoilStatus = 'active' | 'archived';

export interface CurveSampleRecord {
  id: string;
  coilId: string;
  sampleIndex: number;
  directionIndex: number;
  radiusNumerator: number;
  radiusDenominator: number;
  xFixed: number;
  yFixed: number;
  xUnit: number; // for SVG display (xFixed / 1000)
  yUnit: number;
  revisionId: string;
  sampleHash: string;
}

export interface CoilRecord {
  id: string;
  projectId: string;
  stripTokenId: string;
  stripRevisionId: string;
  centerX: number;
  centerY: number;
  innerRadius: number;
  releaseRadius: number;
  turnCount: number;
  phaseIndex: number;
  winding: Winding;
  locked: boolean;
  motifId: string | null;
  assemblyStepId: string | null;
  actorId: string;
  eventId: string;
  status: CoilStatus;
  coilHash: string;
}

export interface ContactEdgeRecord {
  id: string;
  coilAId: string;
  coilBId: string;
  distanceSquared: number;
  radiusSumSquared: number;
  relation: Relation;
  contactX: number;
  contactY: number;
  revisionId: string;
  edgeHash: string;
}

export interface MotifRecord {
  id: string;
  label: string;
  coilIds: string[];
  requiredRelation: string;
  componentCount: number;
  blockerIds: string[];
  revisionId: string;
  motifHash: string;
}

export interface AssemblyStepRecord {
  id: string;
  order: number;
  label: string;
  coilIds: string[];
  contactPrerequisiteIds: string[];
  predecessorStepIds: string[];
  status: 'pending' | 'ready';
  stepHash: string;
}

export interface LayoutDecisionRecord {
  id: string;
  parentDecisionId: string | null;
  status: 'working' | 'tentative' | 'rejected';
  rationale: string;
  confidence: string;
  sourceIds: string[];
  curveHash: string;
  contactHash: string;
  motifHash: string;
  metricsHash: string;
  revisionId: string;
  isStale: boolean;
}

export interface AnnotationRecord {
  id: string;
  targetId: string; // coil, sample, contact, etc.
  targetType: 'coil' | 'sample' | 'contact' | 'motif' | 'step' | 'decision' | 'checkpoint';
  text: string;
  revisionId: string;
}

export interface EventRecord {
  id: string;
  occurredAt: string;
  actorId: string;
  kind: string;
  status: 'committed' | 'undone';
  parentId: string | null;
  branchId: string;
  targetId: string;
  revisionId: string;
  patch: any;
  stateHash: string;
}

export interface StripTokenRecord {
  id: string;
  label: string;
  widthUnits: number;
  allocatedLengthUnits: number;
  patternTokenId: string;
  appearanceTokenId: string;
  revisionId: string;
  tokenHash: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  boardWidthUnits: number;
  boardHeightUnits: number;
  gridStepUnits: number;
  coilIds: string[];
  motifIds: string[];
  assemblyStepIds: string[];
  fixtureRevisionId: string;
  projectHash: string;
}
