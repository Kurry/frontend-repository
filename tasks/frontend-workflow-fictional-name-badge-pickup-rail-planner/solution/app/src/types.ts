export type EntityId = string;

export interface Attendee {
  id: EntityId;
  displayName: string;
  familyNameKey: string;
  arrivalSequence: number;
  arrivalAt: string;
  symbol: string;
  badgeId: EntityId;
}

export type BadgeStatus = 'seeded-overflow' | 'filed' | 'picked-up-fictional' | 'archived';

export interface Badge {
  id: EntityId;
  status: BadgeStatus;
  hookId: EntityId | null;
  slotNumber: number | null;
  overflowOrdinal: number | null;
  backMark: string;
}

export interface Hook {
  id: EntityId;
  name: string;
  capacity: number;
}

export interface Arrival {
  sequence: number;
  arrivalId: EntityId;
  attendeeId: EntityId;
  badgeId: EntityId;
  arrivalAt: string;
  storedHookId: EntityId;
  canonicalHookId: EntityId;
  routeStepCount: number;
  redirected: number; // 0 or 1
  predictedCompleteAt: string;
}

export interface Issue {
  id: EntityId;
  status: 'open' | 'resolved';
  title: string;
  description: string;
  affectedIds: EntityId[];
}

export interface Comment {
  id: EntityId;
  text: string;
  actorId: string;
  logicalTime: string;
  anchors: EntityId[];
}

export interface Selection {
  kind: string;
  ids: EntityId[];
  primaryId: EntityId | null;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ArrivalBrush {
  startSequence: number;
  endSequence: number;
}

export type RehearsalStatus = 'not-run' | 'ready' | 'running' | 'verified';

export interface RehearsalEvent {
  id: EntityId;
  attendeeId: EntityId;
  step: string;
  timestamp: string;
}

export interface RehearsalState {
  status: RehearsalStatus;
  cursor: number;
  events: RehearsalEvent[];
  mark: string | null;
}

export interface HistoryEvent {
  id: EntityId;
  type: string;
  actorId: string;
  logicalTime: string;
  payload: any;
  parentId: EntityId | null;
}

export interface HistoryState {
  anchorEventId: EntityId;
  currentEventId: EntityId;
  events: HistoryEvent[];
  branches: ScenarioBranch[];
}

export interface ScenarioBranch {
  id: EntityId;
  name: string;
  headEventId: EntityId;
}

export interface ApprovalState {
  status: 'needs-work' | 'ready' | 'accepted-fictional';
  note: string;
}

export interface ProfileState {
  hookRows: any[];
  redirects: number;
  routeSteps: number;
  predictedCompletion: string;
}

export interface FictionalPlan {
  schema: string;
  planId: string;
  revision: number;
  attendees: Attendee[];
  badges: Badge[];
  hooks: Hook[];
  slots: any[]; // To match schema from PRD if needed, or derived
  arrivals: Arrival[];
  profile: ProfileState;
  issues: Issue[];
  comments: Comment[];
  selection: Selection;
  viewport: Viewport;
  arrivalBrush: ArrivalBrush | null;
  rehearsal: RehearsalState;
  history: HistoryState;
  approval: ApprovalState | null;
  generatedAt: string | null;
  exportedAt: string | null;
}

export interface AppState extends FictionalPlan {
  // Methods
  init: () => void;
  // mutations
  moveBadge: (badgeId: string, hookId: string, slotNumber: number) => void;
  previewBadgeMove: (badgeId: string, hookId: string, slotNumber: number) => void;
  cancelPreview: () => void;
  confirmPreview: () => void;
  setSelection: (sel: Selection) => void;
  setBrush: (brush: ArrivalBrush | null) => void;
  stepRehearsal: () => void;
  resetRehearsal: () => void;
  undoEvent: () => void;
  redoEvent: () => void;
  addComment: (text: string, anchors: string[]) => void;
  approvePlan: (status: 'needs-work'|'ready'|'accepted-fictional', note: string) => void;
  // UI ephemeral state
  dragPreview: any | null;
  loadPlan: (plan: FictionalPlan) => void;
}
