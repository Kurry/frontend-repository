export type EventItem = {
  id: string;
  phaseId: string;
  weight: number;
  isAnchor: boolean;
};

export type DependencyEdge = {
  from: string; // ancestor
  to: string; // descendant
};

export type Summary = {
  id: string;
  anchorId: string;
  weight: number;
  replaces: string[]; // the anchor and its ancestors
};

export const PHASES = [
  { id: 'p1', name: 'Phase 1', min: 1000, max: 4000 },
  { id: 'p2', name: 'Phase 2', min: 1000, max: 4000 },
  { id: 'p3', name: 'Phase 3', min: 1000, max: 4000 },
  { id: 'p4', name: 'Phase 4', min: 1000, max: 4000 },
  { id: 'p5', name: 'Phase 5', min: 1000, max: 4000 },
  { id: 'p6', name: 'Phase 6', min: 1000, max: 4000 },
  { id: 'p7', name: 'Phase 7', min: 1500, max: 4500 },
  { id: 'p8', name: 'Phase 8', min: 1500, max: 4500 },
];

export const EVENTS: EventItem[] = [];
for (let p = 0; p < 8; p++) {
  for (let e = 0; e < 12; e++) {
    const idx = p * 12 + e;
    EVENTS.push({
      id: `e${idx}`,
      phaseId: PHASES[p].id,
      weight: 250,
      isAnchor: false,
    });
  }
}

export const ANCHORS = [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 95];
ANCHORS.forEach(idx => {
  EVENTS[idx].isAnchor = true;
});

export const DEPENDENCIES: DependencyEdge[] = [
  { from: 'e8', to: 'e11' },
  { from: 'e9', to: 'e11' },
  { from: 'e17', to: 'e19' },
  { from: 'e25', to: 'e27' },
  { from: 'e30', to: 'e35' },
  { from: 'e33', to: 'e35' },
  { from: 'e40', to: 'e43' },
  { from: 'e49', to: 'e51' },
  { from: 'e57', to: 'e59' },
  { from: 'e65', to: 'e67' },
  { from: 'e73', to: 'e75' },
  { from: 'e80', to: 'e83' },
  { from: 'e81', to: 'e83' },
  { from: 'e89', to: 'e91' },
  { from: 'e93', to: 'e95' },
];

export const SUMMARIES: Summary[] = ANCHORS.map(idx => {
  const eventId = `e${idx}`;
  const ancestors = DEPENDENCIES.filter(d => d.to === eventId).map(d => d.from);
  return {
    id: `s${idx}`,
    anchorId: eventId,
    weight: 250 + ancestors.length * 100, // less than raw (which would be 250 * (1 + ancestors.length))
    replaces: [...ancestors, eventId],
  };
});

export const FIXTURE = {
  id: 'fixture-v1',
  hash: 'deadbeef1234',
  phases: PHASES,
  events: EVENTS,
  dependencies: DEPENDENCIES,
  summaries: SUMMARIES,
};
