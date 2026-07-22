import { create } from 'zustand';

export const fixtures = {
  sessions: Array.from({ length: 36 }).map((_, i) => ({
    id: `session-${i + 1}`,
    title: `Session ${i + 1}`,
    capacity: 50 + (i % 3) * 50, // 50, 100, 150
    duration: 60, // base 60 min
    speakerIds: [`speaker-${(i % 28) + 1}`],
    resourceIds: [`resource-${(i % 6) + 1}`],
    prereqIds: i > 0 && i % 4 === 0 ? [`session-${i}`] : [],
  })),
  speakers: Array.from({ length: 28 }).map((_, i) => ({ id: `speaker-${i + 1}`, name: `Speaker ${i + 1}` })),
  rooms: Array.from({ length: 8 }).map((_, i) => ({ id: `room-${i + 1}`, name: `Room ${i + 1}`, capacity: 100 + (i % 4) * 50 })), // 100, 150, 200, 250
  resources: Array.from({ length: 6 }).map((_, i) => ({ id: `resource-${i + 1}`, name: `AV Resource ${i + 1}` })),
  cohorts: Array.from({ length: 10 }).map((_, i) => ({ id: `cohort-${i + 1}`, name: `Cohort ${i + 1}`, size: 30 + (i * 10), interestIds: [`session-${(i % 36) + 1}`, `session-${((i + 1) % 36) + 1}`] })),
  breaks: [
    { id: 'break-1', title: 'Lunch', duration: 60 },
    { id: 'break-2', title: 'Coffee Break', duration: 30 },
  ],
};

export const useStore = create((set, get) => ({
  ...fixtures,
  placements: [], // { id: "placement-x", sessionId: "...", roomId: "...", startTime: "HH:mm", day: 1 }
  rehearsal: null, // { type: 'cancellation' | 'closure', targetId: "...", active: false }
  branchDAG: [],

  placeSession: (sessionId, roomId, day, startTime) => set(state => ({
    placements: [
      ...state.placements.filter(p => p.sessionId !== sessionId),
      { id: `p-${sessionId}-${Date.now()}`, sessionId, roomId, day, startTime }
    ]
  })),

  removePlacement: (sessionId) => set(state => ({
    placements: state.placements.filter(p => p.sessionId !== sessionId)
  })),

  updateBindings: (sessionId, speakerIds, resourceIds) => set(state => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, speakerIds, resourceIds } : s
    )
  })),

  resetState: () => set({ placements: [], rehearsal: null, branchDAG: [], sessions: fixtures.sessions }),
}));
