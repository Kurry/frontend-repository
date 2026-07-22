export type Variant = 'coral' | 'indigo' | 'mint' | 'amber';
export type Status = 'tray' | 'planned' | 'rehearsed' | 'dispensed-fictional' | 'archived';

export interface Point {
  x: number;
  y: number;
}

export interface Capsule {
  capsuleId: string;
  variant: Variant;
  trackId: string | null;
  bayIndex: number | null;
  trayX: number | null;
  trayY: number | null;
  lotId: string;
  patternId: string;
  sequenceOrdinal: number | null;
  actor: string;
  revision: number;
  status: Status;
}

export interface Track {
  trackId: string;
  cx: number;
  cy: number;
}

export interface Demand {
  vendOffset: number;
  variant: Variant;
}

export interface Event {
  eventId: string;
  type: string;
  actor: string;
  timestamp: string;
  capsuleId?: string;
  details: any;
}

export interface Branch {
  branchId: string;
  events: Event[];
}

export interface RehearsalEvent {
  capsuleId: string;
  trackId: string;
  vendOffset: number;
  expectedVariant: Variant;
  actualVariant: Variant | null;
  sourceBayIndex: number;
}

export interface Rehearsal {
  status: 'not-run' | 'ready' | 'load' | 'advance' | 'present' | 'verify' | 'mark';
  playhead: number;
  events: RehearsalEvent[];
  mark: 'verified' | null;
}

export interface Selection {
  kind: 'capsule' | 'bay' | 'none';
  ids: string[];
  primaryId: string | null;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface HistoryState {
  anchorEventId: string | null;
  currentEventId: string | null;
  events: Event[];
  branches: Branch[];
}

export interface Comment {
  commentId: string;
  text: string;
  actor: string;
  anchorId: string;
  resolved: boolean;
  timestamp: string;
}

export interface Issue {
  issueId: string;
  type: string;
  description: string;
  resolved: boolean;
  relatedOffset?: number;
}

export interface PlanState {
  schema: string;
  planId: string;
  revision: number;
  machine: { machineId: string; trackIds: string[] };
  tracks: Track[];
  bays: number[];
  capsules: Capsule[];
  demands: Demand[];
  profiles: any[];
  issues: Issue[];
  comments: Comment[];
  rehearsal: Rehearsal;
  selection: Selection;
  viewport: Viewport;
  history: HistoryState;
  approval: string | null;
  generatedAt: string | null;
  exportedAt: string | null;

  // App state
  scenarioId: 'Baseline' | 'Resolved';
  demandBrush: { start: number; end: number } | null;
}

export interface AppActions {
  insertCapsule: (capsuleId: string, trackId: string, bayIndex: number) => void;
  undo: () => void;
  redo: () => void;
  setSelection: (selection: Selection) => void;
  setViewport: (viewport: Viewport) => void;
  setDemandBrush: (start: number, end: number) => void;
  startRehearsal: () => void;
  stepRehearsal: () => void;
  resetRehearsal: () => void;
  markRehearsal: () => void;
  addComment: (comment: Comment) => void;
  resolveComment: (commentId: string) => void;
  loadState: (state: PlanState) => void;
}
