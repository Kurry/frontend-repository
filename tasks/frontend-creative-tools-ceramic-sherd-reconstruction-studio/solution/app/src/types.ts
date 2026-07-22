export type Point = { x: number; y: number };

export type Transform = { txMm: number; tyMm: number; rotationDeg: number };

export type Sherd = {
  id: string; // e.g., "SH-01"
  localPolygon: Point[];
  edges: string[];
  zones: string[];
  transform: Transform;
  rimClass: "none" | "rim" | "base";
  scanHash: string;
};

export type Edge = {
  id: string; // e.g., "E-01a"
  sherdId: string;
  localPolyline: Point[];
  startIndex: number;
  endIndex: number;
  edgeClass: "fracture" | "rim" | "base" | "surface";
};

export type Candidate = {
  id: string;
  edgeAId: string;
  edgeBId: string;
  status: "unreviewed" | "accepted" | "rejected";
  confidence: "tentative" | "supported" | "rejected";
  metrics: {
    endpointResidualMm: number;
    meanResidualMm: number;
    tangentMismatchDeg: number;
    lengthRatio: number;
  };
  rationale: string;
  noteIds: string[];
  revisionId: string;
};

export type Note = {
  id: string;
  targetType: "sherd" | "edge" | "candidate" | "match" | "diagnostic" | "profile-band" | "branch";
  targetId: string;
  authorId: "reviewer-ina" | "reviewer-sol";
  logicalTime: number;
  text: string;
  resolved: boolean;
};

export type Revision = {
  id: string;
  parentIds: string[];
  eventIds: string[];
  stateHash: string;
  artifactHash: string;
  proofStatus: "draft" | "proofed" | "stale";
};

export type Event = {
  id: string;
  logicalTime: number;
  actorId: string;
  operation: string;
  targetIds: string[];
  beforeHash: string;
  afterHash: string;
  capture: "immediate" | "transaction";
};

export type State = {
  sherds: Record<string, Sherd>;
  edges: Record<string, Edge>;
  candidates: Record<string, Candidate>;
  notes: Record<string, Note>;
  revisions: Record<string, Revision>;
  events: Record<string, Event>;
  currentRevisionId: string;
  logicalClock: number;
  lateFragmentRevealed: boolean;
  selection: string[];
  viewport: { x: number; y: number; zoom: number };
  branches: string[];
};
