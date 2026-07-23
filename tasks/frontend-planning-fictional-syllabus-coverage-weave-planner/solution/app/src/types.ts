export type EnergyLevel = 'low' | 'medium' | 'high';
export type DomainId = 'DOM-1' | 'DOM-2' | 'DOM-3' | 'DOM-4';

export interface Domain {
  id: DomainId;
  name: string;
}

export interface Objective {
  id: string;
  title: string;
  domainId: DomainId;
  targetMinutes: number;
  weightBps: number;
  prerequisites: string[];
}

export interface Session {
  id: string;
  startIso: string;
  durationMinutes: number;
  energy: EnergyLevel;
  commitments?: { startOffset: number; duration: number; name: string }[];
}

export interface AllocationKnot {
  id: string;
  objectiveId: string;
  sessionId: string;
  minutes: number;
  order: number;
}

export interface PrerequisiteEdge {
  id: string;
  fromId: string;
  toId: string;
}

export interface AppEvent {
  id: string;
  type: string;
  actorId: string;
  scenarioId: string;
  timestamp: string;
  payload: any;
  hash: string;
}

export interface Note {
  id: string;
  knotId?: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  allocations: AllocationKnot[];
  events: AppEvent[];
}

export interface WorkspaceState {
  activeScenarioId: string;
  selectedEntityId: string | null;
  viewport: { x: number; y: number; zoom: number };
  brush: { startIso: string; endIso: string } | null;
  filters: any;
  inspectorTab: string;
  compareScenarioId: string | null;
  replayCursor: number | null;
  historyAnchor: string | null;
}

export interface StudyPlan {
  schema: string;
  fixtureId: string;
  timezone: string;
  logicalToday: string;
  examAt: string;
  objectives: Objective[];
  domains: Domain[];
  sessions: Session[];
  scenarios: Scenario[];
  prerequisites: PrerequisiteEdge[];
  annotations: Note[];
  rehearsal: any;
  approvals: any[];
  workspace: WorkspaceState;
  generatedAt: string;
}
