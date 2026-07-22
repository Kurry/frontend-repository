import type { InkSourceRecord, PrintPassRecord, PosterRecord, HistoryEvent } from './types';

export const F_INK_SOURCES: InkSourceRecord[] = [
  { id: 'ink-amber-r1', label: 'Amber', rgb: [232, 171, 44], alphaMilli: 800, settleTicks: 20, revisionId: 'rev-amb-1', sourceHash: 'hash-amb-1', status: 'active' },
  { id: 'ink-magenta-r1', label: 'Magenta', rgb: [201, 44, 126], alphaMilli: 750, settleTicks: 15, revisionId: 'rev-mag-1', sourceHash: 'hash-mag-1', status: 'active' },
  { id: 'ink-charcoal-r1', label: 'Charcoal', rgb: [42, 48, 56], alphaMilli: 900, settleTicks: 25, revisionId: 'rev-cha-1', sourceHash: 'hash-cha-1', status: 'active' },
  { id: 'ink-cobalt-r2', label: 'Cobalt', rgb: [31, 92, 187], alphaMilli: 850, settleTicks: 20, revisionId: 'rev-cob-2', sourceHash: 'hash-cob-2', status: 'active' }, // Settle ticks will be corrected to 30
];

export const F_POSTER: PosterRecord = {
  id: 'poster-lantern-steps',
  title: 'Lantern Steps Proof',
  widthUnits: 400,
  heightUnits: 300,
  columns: 40,
  rows: 30,
  backgroundRgb: [255, 255, 255],
  passIds: ['pass-amber', 'pass-magenta', 'pass-charcoal', 'pass-cobalt'],
  fixtureRevisionId: 'fix-rev-1',
  posterHash: 'poster-hash-1'
};

export const F_PASSES: PrintPassRecord[] = [
  { id: 'pass-amber', posterId: 'poster-lantern-steps', inkSourceId: 'ink-amber-r1', inkRevisionId: 'rev-amb-1', order: 1, mask: { x: 0, y: 0, width: 400, height: 300, maskHash: 'mh-amb' }, printTicks: 10, actorId: 'mara', eventId: 'evt-initial', status: 'active' },
  { id: 'pass-magenta', posterId: 'poster-lantern-steps', inkSourceId: 'ink-magenta-r1', inkRevisionId: 'rev-mag-1', order: 2, mask: { x: 0, y: 100, width: 400, height: 100, maskHash: 'mh-mag' }, printTicks: 10, actorId: 'mara', eventId: 'evt-initial', status: 'active' },
  { id: 'pass-charcoal', posterId: 'poster-lantern-steps', inkSourceId: 'ink-charcoal-r1', inkRevisionId: 'rev-cha-1', order: 3, mask: { x: 200, y: 0, width: 200, height: 300, maskHash: 'mh-cha' }, printTicks: 10, actorId: 'mara', eventId: 'evt-initial', status: 'active' },
  { id: 'pass-cobalt', posterId: 'poster-lantern-steps', inkSourceId: 'ink-cobalt-r2', inkRevisionId: 'rev-cob-2', order: 4, mask: { x: 100, y: 50, width: 200, height: 200, maskHash: 'mh-cob' }, printTicks: 10, actorId: 'mara', eventId: 'evt-initial', status: 'active' },
];

export const F_EVENTS: HistoryEvent[] = [
  { id: 'evt-initial', logicalTick: 0, occurredAt: '2042-04-01T10:00:00Z', actorId: 'mara', kind: 'create-fixture', status: 'committed', parentId: null, branchId: 'main', targetId: 'poster-lantern-steps', revisionId: 'rev-1', patch: {}, cancelReason: null, stateHash: 'hash-initial' }
];
