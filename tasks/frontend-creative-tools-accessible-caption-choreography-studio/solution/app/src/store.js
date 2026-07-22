import { createStore } from 'react-hooks-global-state';

// Deterministic fixture data
const FIXTURE = {
  mediaDuration: 96000,
  frameRate: 24,
  shots: [
    { id: 'shot1', start: 0, end: 10000 },
    { id: 'shot2', start: 10000, end: 20000 },
    { id: 'shot3', start: 20000, end: 35000 },
    { id: 'shot4', start: 35000, end: 45000 },
    { id: 'shot5', start: 45000, end: 55000 },
    { id: 'shot6', start: 55000, end: 65000 },
    { id: 'shot7', start: 65000, end: 72000 },
    { id: 'shot8', start: 72000, end: 80000 },
    { id: 'shot9', start: 80000, end: 85000 },
    { id: 'shot10', start: 85000, end: 90000 },
    { id: 'shot11', start: 90000, end: 96000 },
  ],
  speakers: ['Speaker 1', 'Speaker 2', 'Speaker 3'],
  sounds: ['[Music playing]', '[Door creaks]', '[Wind howling]', '[Footsteps]', '[Explosion]'],
  tokens: Array.from({ length: 126 }).map((_, i) => ({
    id: `tok${i}`,
    text: `word${i}`,
    start: i * 750,
    confidence: i === 50 ? 0.4 : 0.95
  })),
};

const INITIAL_CUES = [
  {
    id: 'cue1',
    start: 1000,
    end: 4000,
    text: "word1 word2 word3",
    tokens: ['tok1', 'tok2', 'tok3'],
    speaker: 'Speaker 1',
    lane: 0,
    styling: {},
    findings: [],
    branches: [] // Wording branches
  },
  // Adding deliberate errors as per PRD
  {
    id: 'cue2',
    start: 9000,
    end: 11000, // Crosses shot2 boundary 10000
    text: "word12 word13",
    tokens: ['tok12', 'tok13'],
    speaker: 'Speaker 2',
    lane: 1,
    styling: {},
    findings: []
  },
  {
    id: 'cue3',
    start: 20000,
    end: 20200, // Duration 200ms < 500ms limit
    text: "word26",
    tokens: ['tok26'],
    speaker: 'Speaker 1',
    lane: 0,
    styling: {},
    findings: []
  },
  {
    id: 'cue4',
    start: 35000,
    end: 40000,
    text: "word46 word47 word48 word49 word50 word51 word52 word53 word54 word55 word56 word57 word58", // Reading speed check will flag this
    tokens: ['tok46', 'tok47', 'tok48', 'tok49', 'tok50', 'tok51', 'tok52', 'tok53', 'tok54', 'tok55', 'tok56', 'tok57', 'tok58'],
    speaker: 'Speaker 3',
    lane: 0,
    styling: {},
    findings: []
  },
  {
    id: 'cue5',
    start: 45000,
    end: 46000,
    text: "word60 word61",
    tokens: ['tok60', 'tok61'],
    speaker: 'Speaker 2',
    lane: 0, // This will overlap with another cue if placed here, but let's leave it as is for now
    styling: {},
    findings: []
  }
];

const initialState = {
  project: {
    schemaVersion: "caption-choreography/v1",
    fixtureHash: "deterministic-hash",
    mediaDuration: FIXTURE.mediaDuration,
    frameRate: FIXTURE.frameRate,
    tokens: FIXTURE.tokens,
    shots: FIXTURE.shots,
    speakers: FIXTURE.speakers,
    sounds: FIXTURE.sounds,
    cues: INITIAL_CUES,
    logicalClock: 0,
    playbackState: 'paused', // paused, playing
    playbackRate: 1, // 0.5, 1, 1.5
    validatorRuns: [],
    reviews: [],
    masterApproved: false,
    exportedAt: null,
    validationChecksum: null,
    currentChecksum: 'init'
  },
  ui: {
    selectedCueId: null,
    selectedTokenId: null,
    activeFinding: null,
    reducedMotion: false,
  }
};

const { setGlobalState, useGlobalState, getGlobalState } = createStore(initialState);

export { setGlobalState, useGlobalState, getGlobalState, FIXTURE };

export const generateChecksum = (cues) => {
  return JSON.stringify(cues.map(c => ({id: c.id, start: c.start, end: c.end, text: c.text, lane: c.lane, speaker: c.speaker})));
};

export const updateProjectState = (updater) => {
  const currentProject = getGlobalState('project');
  const newProject = typeof updater === 'function' ? updater(currentProject) : { ...currentProject, ...updater };

  // Re-calculate checksum if cues changed
  if (newProject.cues !== currentProject.cues) {
    newProject.currentChecksum = generateChecksum(newProject.cues);
    // If master is approved and checksum changes, master branch is created/approval is stale
    if (newProject.masterApproved && newProject.currentChecksum !== newProject.validationChecksum) {
       newProject.masterApproved = false; // "Rewinding before approval creates a master branch." (We just unapprove for now)
    }
  }

  setGlobalState('project', newProject);
};
export const updateUIState = (updater) => {
  const currentUI = getGlobalState('ui');
  const newUI = typeof updater === 'function' ? updater(currentUI) : { ...currentUI, ...updater };
  setGlobalState('ui', newUI);
};

export const updateCue = (id, updater) => {
  updateProjectState(project => {
    const newCues = project.cues.map(c => c.id === id ? { ...c, ...updater(c) } : c);
    return { ...project, cues: newCues };
  });
};
