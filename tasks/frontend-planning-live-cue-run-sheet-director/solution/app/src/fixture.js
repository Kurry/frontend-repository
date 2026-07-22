export const INITIAL_RESOURCES = [
  { id: "r1", name: "Main Stage Projector", shared: false, capacity: 1 },
  { id: "r2", name: "House PA", shared: true, capacity: 5 },
  { id: "r3", name: "Spotlight L", shared: false, capacity: 1 },
  { id: "r4", name: "Spotlight R", shared: false, capacity: 1 },
  { id: "r5", name: "Mics A/B", shared: true, capacity: 2 },
  { id: "r6", name: "Video Switcher", shared: false, capacity: 1 },
  { id: "r7", name: "Smoke Machine", shared: false, capacity: 1 },
  { id: "r8", name: "Green Room", shared: true, capacity: 3 }
];

export const INITIAL_CREW = [
  { id: "c1", name: "Alice (Lead)" },
  { id: "c2", name: "Bob (Audio)" },
  { id: "c3", name: "Charlie (Video)" },
  { id: "c4", name: "Diana (Lights)" },
  { id: "c5", name: "Eve (Stage)" },
  { id: "c6", name: "Frank (Guest)" }
];

// Fictional 70-minute (4200 seconds) program with 24 cues
export const generateCues = () => {
  const cues = [];
  const lanes = ["stage", "audio", "lighting", "video", "guest"];

  for (let i = 1; i <= 24; i++) {
    cues.push({
      id: `cue-${i}`,
      name: `Cue ${i}`,
      lane: lanes[i % lanes.length],
      plannedStart: i * 150, // default spread
      duration: 30, // 30 seconds
      ownerId: `c${(i % 6) + 1}`,
      resourceIds: [`r${(i % 8) + 1}`],
      trigger: { type: i === 1 ? 'manual' : 'after', sourceCueId: i === 1 ? null : `cue-${i-1}`, offset: 10 },
      ready: false,
      isFixed: i % 8 === 0, // 3 fixed anchors
      isLocked: false,
      contingencyGroup: null
    });
  }

  // Set up branches
  cues[10].contingencyGroup = "A";
  cues[11].contingencyGroup = "A"; // 10 is primary, 11 is contingency
  cues[11].trigger = { type: 'manual' }; // requires branch activation
  cues[11].isContingency = true;

  cues[20].contingencyGroup = "B";
  cues[21].contingencyGroup = "B";
  cues[21].trigger = { type: 'manual' };
  cues[21].isContingency = true;

  return cues;
};

export const INITIAL_CUES = generateCues();
