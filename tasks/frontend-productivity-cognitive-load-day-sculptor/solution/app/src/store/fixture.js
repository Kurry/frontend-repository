export const initialTasks = [
  { id: "t1", title: "Write proposal", duration: 4, load: 8, urgency: true, importance: true, deadline: 20, splittable: false, minChunk: 4, deps: [], children: [] },
  { id: "t2", title: "Review PRs", duration: 2, load: 4, urgency: true, importance: false, deadline: 16, splittable: true, minChunk: 1, deps: ["t1"], children: [] },
  { id: "t3", title: "Design system update", duration: 6, load: 6, urgency: false, importance: true, deadline: 40, splittable: true, minChunk: 2, deps: [], children: ["t3a", "t3b"] },
  { id: "t3a", title: "Color tokens", duration: 2, load: 5, urgency: false, importance: true, deadline: 40, splittable: true, minChunk: 1, deps: [], parent: "t3", leaf: true },
  { id: "t3b", title: "Typography", duration: 4, load: 7, urgency: false, importance: true, deadline: 40, splittable: true, minChunk: 2, deps: [], parent: "t3", leaf: true },
  { id: "t4", title: "1:1 with team", duration: 2, load: 3, urgency: true, importance: true, deadline: 24, splittable: false, minChunk: 2, deps: [], children: [] },
  { id: "t5", title: "Sprint planning", duration: 4, load: 5, urgency: false, importance: true, deadline: 32, splittable: false, minChunk: 4, deps: ["t4"], children: [] },
  { id: "t6", title: "Bug triage", duration: 2, load: 4, urgency: true, importance: false, deadline: 12, splittable: true, minChunk: 1, deps: [], children: [] },
  { id: "t7", title: "Client email", duration: 1, load: 2, urgency: true, importance: false, deadline: 10, splittable: false, minChunk: 1, deps: [], children: [] },
  { id: "t8", title: "Quarterly OKRs", duration: 8, load: 9, urgency: false, importance: true, deadline: 48, splittable: true, minChunk: 4, deps: [], children: [] },
  { id: "t9", title: "Deploy release", duration: 2, load: 7, urgency: true, importance: true, deadline: 36, splittable: false, minChunk: 2, deps: ["t2", "t6"], children: [] },
  { id: "t10", title: "Read tech blog", duration: 2, load: 2, urgency: false, importance: false, deadline: 48, splittable: true, minChunk: 1, deps: [], children: [] },
  { id: "t11", title: "Update docs", duration: 3, load: 4, urgency: false, importance: false, deadline: 48, splittable: true, minChunk: 1, deps: ["t9"], children: [] },
  { id: "t12", title: "Performance review", duration: 4, load: 8, urgency: true, importance: true, deadline: 28, splittable: false, minChunk: 4, deps: [], children: [] },
  { id: "t13", title: "Expense report", duration: 1, load: 1, urgency: true, importance: false, deadline: 16, splittable: false, minChunk: 1, deps: [], children: [] },
  { id: "t14", title: "Architecture RFC", duration: 6, load: 9, urgency: false, importance: true, deadline: 48, splittable: true, minChunk: 2, deps: [], children: [] },
  { id: "t15", title: "Clean desk", duration: 1, load: 1, urgency: false, importance: false, deadline: 48, splittable: false, minChunk: 1, deps: [], children: [] }
];

export const rolloverTasks = [
  { id: "r1", title: "Fix flaky test", duration: 2, load: 6 },
  { id: "r2", title: "Write weekly update", duration: 1, load: 3 }
];

export const appointments = [
  { id: "a1", title: "All Hands", start: 16, duration: 4 }, // 12:00 - 13:00 (15-min slots, 08:00 = slot 0, 12:00 = 16)
  { id: "a2", title: "Dentist", start: 32, duration: 4 } // 16:00 - 17:00
];

export const breaks = [
  { id: "b1", title: "Morning Break", start: 10, duration: 2 }, // 10:30 - 11:00
  { id: "b2", title: "Lunch", start: 20, duration: 4 }, // 13:00 - 14:00
  { id: "b3", title: "Afternoon Break", start: 38, duration: 2 } // 17:30 - 18:00
];

export const baseCapacityCurve = Array(48).fill(0).map((_, i) => {
  // Rough curve: peaks in morning, dips after lunch, minor peak, then drops
  if (i < 8) return 8;
  if (i < 16) return 9;
  if (i < 20) return 6;
  if (i < 24) return 4;
  if (i < 32) return 7;
  if (i < 40) return 5;
  return 3;
});

export const initialReducerState = {
  tasks: initialTasks,
  blocks: [], // { id, taskId, start, duration, locked, chunkIndex }
  rolloverTasks: rolloverTasks,
  appointments: appointments,
  breaks: breaks,
  baseCapacityCurve: baseCapacityCurve,
  propagationMode: true,
  viewMode: 'planning', // planning | focus | compare
  focusState: {
    activeBlockId: null,
    elapsedMinutes: 0,
    timerRunning: false,
    interruptions: [],
    completedBlocks: []
  },
  checkpoints: [],
  history: [],
  historyIndex: -1,
  dailyVelocity: 0,
  targetVelocity: 100, // fixture target
};
