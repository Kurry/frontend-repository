export type NodeId = 'APP-ROOT' | 'ABS-X' | 'ABS-INNER' | 'APP-INNER' | 'VAR-X' | 'VAR-INNER-Y' | 'VAR-ARG-Y' | string;
export type BinderId = 'BINDER-X' | 'BINDER-Y' | string;

export type NodeKind = 'Application' | 'Abstraction' | 'Variable';

export interface LambdaNode {
  id: NodeId;
  kind: NodeKind;
  parentId: NodeId | 'root' | null;
  parentSlot: 'function' | 'argument' | 'body' | 'root' | null;
  displayName?: string;
  binderId?: BinderId; // If kind=Abstraction, this is the binder it owns.
  active: boolean;
  lineageFromNodeId?: NodeId; // If created due to alpha/beta
  selected?: boolean;
}

export interface Binder {
  id: BinderId;
  name: string;
  abstractionNodeId: NodeId;
  active: boolean;
  note?: string;
}

export interface BindingArc {
  binderId: BinderId;
  binderName: string;
  abstractionNodeId: NodeId;
  referenceNodeId: NodeId;
  referenceName: string;
  lexicalDistance: number;
  status: 'active' | 'retired';
}

export type RevisionPhase = 'Draft' | 'Alpha' | 'Proof' | 'Invalid';

export interface ReplayFrame {
  frameIndex: number;
  stage: string;
  activeNamedForm: string;
  freeVariables: Record<string, number>;
  binderNames: string[];
  captureBinderIds: BinderId[];
  alphaMap: Record<string, string>;
  deBruijnForm: string;
  activeNodeIds: NodeId[];
}

export interface HistoryEvent {
  id: string;
  logicalTick: number;
  actor: string;
  kind: string;
  redexId?: NodeId;
  argumentId?: NodeId;
  binderId?: BinderId;
  targetId?: NodeId;
  freshName?: string;
  beforeChecksum: string;
  afterChecksum: string;
  parent: string;
  branch: string;
}

export interface Review {
  id: string;
  actor: string;
  verdict: 'inspect' | 'capture-avoiding-reduction-exact' | 'accepted-fictional';
  logicalTick: number;
  note?: string;
}
