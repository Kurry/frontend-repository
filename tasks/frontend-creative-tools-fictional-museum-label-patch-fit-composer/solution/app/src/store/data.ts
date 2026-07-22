// Define the data models for the application
export interface FormatMetrics {
  id: string;
  name: string;
  box: { width: number; height: number };
  padding: number;
  font: { size: number; lineHeight: number };
  maxLines: number;
  widowMinWords: number;
}

export const FORMATS: Record<string, FormatMetrics> = {
  wall: {
    id: 'wall',
    name: 'Wall',
    box: { width: 420, height: 240 },
    padding: 24,
    font: { size: 18, lineHeight: 26 },
    maxLines: 8,
    widowMinWords: 3
  },
  rail: {
    id: 'rail',
    name: 'Rail',
    box: { width: 300, height: 230 },
    padding: 18,
    font: { size: 15, lineHeight: 21 },
    maxLines: 10,
    widowMinWords: 3
  },
  mobile: {
    id: 'mobile',
    name: 'Mobile',
    box: { width: 320, height: 480 },
    padding: 20,
    font: { size: 17, lineHeight: 25 },
    maxLines: 15,
    widowMinWords: 2
  }
};

export interface Token {
  id: string;
  value: string;
}

export interface Revision {
  id: string;
  tokens: Token[];
  hash: string;
}

export interface Patch {
  id: string;
  baseRevisionId: string;
  range: [number, number]; // Half-open [start, end)
  originalText: string;
  replacementText: string;
  editorId: string;
  rationale: string;
  sourceIds: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'stale';
  expectedBaseHash: string;
}

export interface Comment {
  id: string;
  parentId: string | null;
  actorId: string;
  logicalTime: string;
  status: 'active' | 'resolved';
  isBlocking: boolean;
  targetType: 'patch' | 'source' | 'glossary' | 'diagnostic' | 'revision';
  targetId: string;
  text: string;
}

export interface Source {
  id: string;
  title: string;
  contributor: string;
  dateToken: string;
  locator: string;
  type: string;
  note: string;
}

export interface GlossaryTerm {
  id: string;
  phrase: string;
}

export interface Event {
  id: string;
  logicalTime: string;
  actorId: string;
  type: string;
  labelId: string;
  baseRevisionId: string;
  resultRevisionId: string | null;
  patchId: string | null;
  range: [number, number] | null;
  beforeHash: string | null;
  afterHash: string | null;
  resolution: string | null;
  parentEventIds: string[];
  payload: any;
}
