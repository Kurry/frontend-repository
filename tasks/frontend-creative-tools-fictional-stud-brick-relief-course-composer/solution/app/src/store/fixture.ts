import {
  ReliefModelRecord,
  PartDefinitionRecord,
  BrickRecord,
  GuideGroupRecord,
  GuideStepRecord
} from '../types';

export const BASE_FIXTURE_MODEL: ReliefModelRecord = {
  id: 'model-fictional-lantern',
  title: 'Fictional Lantern Relief',
  widthStuds: 12,
  depthStuds: 8,
  courseCount: 4,
  brickIds: ['brick-16', 'brick-17', 'brick-18', 'brick-23'], // simplifying for the demo flow
  paletteTokenIds: ['color-slate', 'color-clay'],
  fixtureRevisionId: 'rev-001',
  modelHash: 'geom-17c4a8' // initial hash before move
};

export const FIXTURE_PARTS: Record<string, PartDefinitionRecord> = {
  'part-slate-2x4-r1': {
    id: 'part-slate-2x4-r1',
    label: 'Slate 2x4 Brick',
    widthStuds: 4,
    depthStuds: 2,
    heightCourses: 1,
    allowedRotations: [0, 1, 2, 3],
    paletteTokenIds: ['color-slate'],
    revisionId: 'rev-001',
    partHash: 'part-hash-01'
  },
  'part-clay-2x2-r1': {
    id: 'part-clay-2x2-r1',
    label: 'Clay 2x2 Brick',
    widthStuds: 2,
    depthStuds: 2,
    heightCourses: 1,
    allowedRotations: [0, 1, 2, 3],
    paletteTokenIds: ['color-clay'],
    revisionId: 'rev-001',
    partHash: 'part-hash-02'
  },
  'part-support-2x4': {
    id: 'part-support-2x4',
    label: 'Base 2x4 Brick',
    widthStuds: 4,
    depthStuds: 2,
    heightCourses: 1,
    allowedRotations: [0, 1, 2, 3],
    paletteTokenIds: ['color-slate'],
    revisionId: 'rev-001',
    partHash: 'part-hash-03'
  }
};

export const INITIAL_BRICKS: Record<string, BrickRecord> = {
  // Course 1 support for brick-17. It occupies [4,7)x[3,5) which means x=4, w=3.
  // Let's use part-slate-2x4-r1 rotated or just define a base that covers [4,8)x[3,5) partially.
  // The PRD says: "Course 1 contains supporting occupancy at [4,7)x[3,5) beneath it (6 studs)".
  // We'll create a 3x2 base brick for simplicity just to match those 6 studs, or overlap.
  'brick-base-1': {
    id: 'brick-base-1',
    modelId: 'model-fictional-lantern',
    partDefinitionId: 'part-slate-2x4-r1',
    partRevisionId: 'rev-001',
    course: 1,
    x: 4, y: 3,
    rotationQuarterTurns: 0,
    paletteTokenId: 'color-slate',
    locked: true, actorId: 'system', eventId: 'evt-001', status: 'active'
  },
  // To make exactly 6 studs at [4,7)x[3,5), let's assume brick-base-1 is at x=3, y=3, w=4, d=2 -> [3,7)x[3,5).
  // Then brick-17 at x=4, w=4 -> [4,8). Intersection is [4,7)x[3,5) -> 3x2 = 6 studs. Perfect.

  'brick-16': {
    id: 'brick-16',
    modelId: 'model-fictional-lantern',
    partDefinitionId: 'part-clay-2x2-r1', // it occupies [2,4)x[3,5) which is 2x2.
    partRevisionId: 'rev-001',
    course: 2,
    x: 2, y: 3,
    rotationQuarterTurns: 0,
    paletteTokenId: 'color-clay',
    locked: true, actorId: 'system', eventId: 'evt-002', status: 'active'
  },
  'brick-17': {
    id: 'brick-17',
    modelId: 'model-fictional-lantern',
    partDefinitionId: 'part-slate-2x4-r1',
    partRevisionId: 'rev-001',
    course: 2,
    x: 4, y: 3,
    rotationQuarterTurns: 0, // 4x2 footprint -> [4,8)x[3,5)
    paletteTokenId: 'color-slate',
    locked: false, actorId: 'system', eventId: 'evt-003', status: 'active'
  },
  'brick-18': {
    id: 'brick-18',
    modelId: 'model-fictional-lantern',
    partDefinitionId: 'part-clay-2x2-r1', // PRD says [0,2)x[6,8)
    partRevisionId: 'rev-001',
    course: 2,
    x: 0, y: 6,
    rotationQuarterTurns: 0,
    paletteTokenId: 'color-clay',
    locked: false, actorId: 'system', eventId: 'evt-004', status: 'active'
  },
  'brick-23': {
    id: 'brick-23',
    modelId: 'model-fictional-lantern',
    partDefinitionId: 'part-clay-2x2-r1', // 2x2 on course 3
    partRevisionId: 'rev-001',
    course: 3,
    x: 4, y: 3,
    rotationQuarterTurns: 0, // footprint [4,6)x[3,5)
    paletteTokenId: 'color-clay',
    locked: false, actorId: 'system', eventId: 'evt-005', status: 'active'
  }
};

export const INITIAL_GROUPS: Record<string, GuideGroupRecord> = {
  'group-arch': {
    id: 'group-arch',
    label: 'Arch Subassembly',
    brickIds: ['brick-17', 'brick-18', 'brick-23'],
    kind: 'subassembly',
    ruleRevisionId: 'rev-001',
    status: 'active',
    groupHash: 'hash-group-arch-1'
  }
};

export const INITIAL_STEPS: Record<string, GuideStepRecord> = {
  'step-04-arch': {
    id: 'step-04-arch',
    order: 4,
    label: 'Build the arch',
    courseMin: 2,
    courseMax: 3,
    groupIds: ['group-arch'],
    brickIds: [], // managed by group
    predecessorStepIds: [],
    status: 'active',
    stepHash: 'hash-step-04-1'
  }
};
