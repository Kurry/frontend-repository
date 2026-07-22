import type { ProjectState, TrackType, RangeType, RangeState, EventType } from './types';

// Original 42-second project at 12 fps = 504 frames.
// 6 shots. 5 subjects, 9 props, 74 exposure cells, 17 cue markers, 3 takes,
// 2 missing frames, 1 duplicate capture id, 1 continuity mismatch.

const generateShots = () => {
  const shots = [];
  let currentFrame = 0;
  for (let i = 1; i <= 6; i++) {
    const duration = 84; // 84 * 6 = 504
    shots.push({
      id: `shot-${i}`,
      name: `Shot ${i}`,
      startFrame: currentFrame,
      endFrame: currentFrame + duration - 1
    });
    currentFrame += duration;
  }
  return shots;
};

const generateObjects = () => {
  const objects = [];
  for (let i = 1; i <= 5; i++) {
    objects.push({
      id: `subj-${i}`,
      name: `Subject ${i}`,
      type: 'subject' as const,
      transforms: {
        0: { x: 0, y: 0, rotation: 0, scale: 1, depth: 0, facing: 'front' as const, visibility: true }
      }
    });
  }
  for (let i = 1; i <= 9; i++) {
    objects.push({
      id: `prop-${i}`,
      name: `Prop ${i}`,
      type: 'prop' as const,
      transforms: {
        0: { x: 10, y: 10, rotation: 0, scale: 1, depth: 1, facing: 'front' as const, visibility: true }
      }
    });
  }
  return objects;
};

const generateRanges = () => {
  const ranges = [];
  let idCounter = 1;
  // Create 74 exposure cells spread across shots
  for (let s = 1; s <= 6; s++) {
    const shotStart = (s - 1) * 84;
    for (let c = 0; c < 12; c++) { // roughly 72 cells
      const start = shotStart + c * 7;
      const end = start + 6;
      ranges.push({
        id: `range-${idCounter++}`,
        trackId: `subj-1`,
        trackType: 'subject' as TrackType,
        shotId: `shot-${s}`,
        startFrame: start,
        endFrame: end,
        type: 'exposure' as RangeType,
        objectId: `subj-1`,
        takeId: 'take-1',
        state: 'planned' as RangeState
      });
    }
  }
  // Add a few more to reach exactly 74
  ranges.push({ id: `range-${idCounter++}`, trackId: 'prop-1', trackType: 'prop' as TrackType, shotId: 'shot-1', startFrame: 0, endFrame: 10, type: 'hold' as RangeType, objectId: 'prop-1', takeId: 'take-1', state: 'planned' as RangeState });
  ranges.push({ id: `range-${idCounter++}`, trackId: 'prop-2', trackType: 'prop' as TrackType, shotId: 'shot-2', startFrame: 84, endFrame: 90, type: 'blank' as RangeType, objectId: 'prop-2', takeId: 'take-1', state: 'planned' as RangeState });

  // Mark 2 ranges as missing
  ranges[5].state = 'missing' as RangeState;
  ranges[15].state = 'missing' as RangeState;
  return ranges;
};

const generateCues = () => {
  const cues = [];
  for (let i = 1; i <= 17; i++) {
    cues.push({
      id: `cue-${i}`,
      shotId: `shot-${Math.ceil(i/3)}`,
      frame: i * 25,
      type: i % 2 === 0 ? 'dialogue' as const : 'waveform' as const,
      content: `Cue ${i}`
    });
  }
  return cues;
};

export const defaultState: Omit<ProjectState, 'currentFrame' | 'activeTakeId' | 'onionSkinPrev' | 'onionSkinNext' | 'selectedRangeIds' | 'selectedObjectIds'> = {
  schemaVersion: '1.0.0',
  fixtureHash: 'fix-12345',
  frameRate: 12,
  logicalClock: 100,
  shots: generateShots(),
  ranges: generateRanges(),
  objects: generateObjects(),
  cues: generateCues(),
  continuityFacts: [
    {
      id: 'fact-1',
      objectId: 'prop-1',
      startFrame: 0,
      endFrame: 50,
      ownerId: 'subj-1',
      positionClass: 'hand',
      orientation: 'upright',
      damageState: 'pristine',
      poseTags: ['holding']
    },
    // The continuity mismatch
    {
      id: 'fact-2',
      objectId: 'prop-1',
      startFrame: 51,
      endFrame: 100,
      ownerId: 'subj-2',
      positionClass: 'pocket',
      orientation: 'inverted',
      damageState: 'scratched',
      poseTags: ['stowed']
    }
  ],
  takes: [
    { id: 'take-1', sourceTakeId: null, timestamp: 1000, name: 'Main Take' },
    { id: 'take-2', sourceTakeId: 'take-1', timestamp: 2000, name: 'Alt Angle' },
    { id: 'take-3', sourceTakeId: 'take-1', timestamp: 3000, name: 'Pickup' }
  ],
  captureEvents: [
    { id: 'evt-1', timestamp: 1500, type: 'capture' as EventType, frame: 5, takeId: 'take-1', hash: 'hash1' },
    { id: 'evt-2', timestamp: 1600, type: 'capture' as EventType, frame: 6, takeId: 'take-1', hash: 'hash2' },
    // 1 duplicate capture id as required
    { id: 'evt-2', timestamp: 1700, type: 'capture' as EventType, frame: 7, takeId: 'take-1', hash: 'hash3' },
  ],
  approvals: [
    { id: 'app-1', timestamp: 5000, cutRevision: 1, status: 'approved', hash: 'app-hash-1' }
  ]
};
