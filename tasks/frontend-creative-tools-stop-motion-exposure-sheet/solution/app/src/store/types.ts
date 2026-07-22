export type TrackType = 'subject' | 'prop' | 'camera' | 'lighting' | 'dialogue' | 'audio';
export type RangeType = 'exposure' | 'hold' | 'blank' | 'replacement';
export type RangeState = 'planned' | 'captured' | 'missing' | 'invalid';
export type EventType = 'capture' | 'retake' | 'mark-missing' | 'invalidate' | 'restore';

export interface Shot {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
}

export interface ExposureRange {
  id: string;
  trackId: string; // e.g. "subject-1", "prop-2"
  trackType: TrackType;
  shotId: string;
  startFrame: number;
  endFrame: number;
  type: RangeType;
  objectId?: string;
  cueId?: string;
  takeId: string;
  state: RangeState;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  depth: number;
  facing: 'left' | 'right' | 'front' | 'back';
  visibility: boolean;
}

export interface StagedObject {
  id: string;
  name: string;
  type: 'subject' | 'prop';
  // Transforms keyed by frame number
  transforms: Record<number, Transform>;
}

export interface Cue {
  id: string;
  shotId: string;
  frame: number;
  type: 'dialogue' | 'waveform';
  content: string;
}

export interface ContinuityFact {
  id: string;
  objectId: string;
  startFrame: number;
  endFrame: number;
  ownerId?: string;
  positionClass: string;
  orientation: string;
  damageState: string;
  poseTags: string[];
}

export interface Take {
  id: string;
  sourceTakeId: string | null;
  timestamp: number;
  name: string;
}

export interface CaptureEvent {
  id: string;
  timestamp: number;
  type: EventType;
  frame: number;
  takeId: string;
  hash?: string;
}

export interface Approval {
  id: string;
  timestamp: number;
  cutRevision: number;
  status: 'approved' | 'stale';
  hash: string;
}

export interface ProjectState {
  schemaVersion: string;
  fixtureHash: string;
  frameRate: number;
  logicalClock: number;
  shots: Shot[];
  ranges: ExposureRange[];
  objects: StagedObject[];
  cues: Cue[];
  continuityFacts: ContinuityFact[];
  takes: Take[];
  captureEvents: CaptureEvent[];
  approvals: Approval[];

  // App view state
  currentFrame: number;
  activeTakeId: string;
  onionSkinPrev: number;
  onionSkinNext: number;
  selectedRangeIds: string[];
  selectedObjectIds: string[];
}
