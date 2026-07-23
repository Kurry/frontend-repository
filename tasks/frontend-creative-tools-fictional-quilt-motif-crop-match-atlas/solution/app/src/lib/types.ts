export type Transform = 'r0' | 'r90' | 'r180' | 'r270' | 'mirror-r0' | 'mirror-r90' | 'mirror-r180' | 'mirror-r270';

export interface StudyRecord {
  id: string;
  title: string;
  logicalWidth: number;
  logicalHeight: number;
  binaryRows: string[]; // logicalHeight strings of logicalWidth ASCII '0'|'1'
  paletteTokenIds: string[];
  sourceRevisionId: string;
  rasterHash: string;
  notes: string;
}

export interface CropRecord {
  id: string;
  studyId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  queryRows: string[]; // 8 strings of 8 '0'|'1' chars
  queryHash: string;
  sourceRevisionId: string;
  eventId: string;
  actorId: string;
}

export interface MotifRecord {
  id: string;
  title: string;
  family: string;
  canonicalRows: string[]; // 8 strings of 8 chars
  canonicalOrientation: Transform;
  paletteTokenIds: string[];
  catalogRevisionId: string;
  rasterHash: string;
  sourceIds: string[];
}

export interface MatchRecord {
  motifId: string;
  queryHash: string;
  candidateHash: string;
  bestTransform: Transform;
  distance: number;
  scoreNumerator: number;
  scoreDenominator: number;
  scoreDisplay: string;
  rank: number;
  mismatchCellIds: string[];
  rankSetHash: string;
  catalogRevision: string;

  // Accepted fields
  decisionId?: string;
  decisionStatus?: 'supported' | 'tentative' | 'rejected';
  rationale?: string;
  actorId?: string;
  logicalTime?: string;
  parentDecisionId?: string;
  parentCorrectionId?: string;
  approvalFreshness?: boolean;
}

export interface CorrectionRecord {
  id: string;
  motifId: string;
  correctedOrientation: Transform;
  catalogRevisionId: string;
  logicalTime: string;
}

export interface EventRecord {
  id: string;
  type: string; // crop, accept, correct, revalidate, undo, note, review, approve, reset
  timestamp: string;
  actorId: string;
  payload: any;
  parentId?: string;
}

export interface AnnotationRecord {
  id: string;
  targetId: string; // cell id or motif id or decision id
  targetRevision: string;
  text: string;
  actorId: string;
  timestamp: string;
  parentId?: string;
}
