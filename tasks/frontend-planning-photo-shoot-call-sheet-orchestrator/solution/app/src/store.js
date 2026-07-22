import { create } from 'zustand';

const SEED_LOCATIONS = [
  { id: 'loc-1', name: 'Market Entrance', polygon: [[0,0], [100,0], [100,100], [0,100]], zones: [] },
  { id: 'loc-2', name: 'Main Aisle', polygon: [[100,0], [200,0], [200,100], [100,100]], zones: [] },
  { id: 'loc-3', name: 'Vendor Stalls', polygon: [[0,100], [200,100], [200,200], [0,200]], zones: [] }
];

const SEED_PERSONAS = [
  { id: 'p-1', name: 'Alex', role: 'Photographer' },
  { id: 'p-2', name: 'Sam', role: 'Director' },
  { id: 'p-3', name: 'Jordan', role: 'Model' },
  { id: 'p-4', name: 'Casey', role: 'Model' },
  { id: 'p-5', name: 'Taylor', role: 'Stylist' },
  { id: 'p-6', name: 'Morgan', role: 'Gaffer' }
];

const SEED_RESOURCES = Array.from({ length: 18 }, (_, i) => ({
  id: `r-${i + 1}`,
  name: `Resource ${i + 1}`,
  type: i < 6 ? 'gear' : i < 12 ? 'wardrobe' : 'prop'
}));

const SEED_SHOTS = Array.from({ length: 24 }, (_, i) => ({
  id: `s-${i + 1}`,
  title: `Shot ${i + 1}`,
  locationId: SEED_LOCATIONS[i % 3].id,
  composition: 'Wide',
  talentIds: ['p-3'],
  wardrobeIds: ['r-7'],
  propIds: ['r-13'],
  gearIds: ['r-1'],
  lightingBand: 'morning',
  duration: 30, // minutes
  priority: 1,
  dependencies: [],
  status: 'required',
  scheduledTime: null, // start time in minutes from start of day (e.g. 0 = 8:00 AM)
  x: null,
  y: null,
  rotation: 0
}));

const SEED_RELEASES = Array.from({ length: 4 }, (_, i) => ({
  id: `rel-${i + 1}`,
  targetId: `p-${i + 3}`, // talent
  status: 'approved'
}));

const SEED_DISRUPTIONS = [
  { id: 'd-1', type: 'weather', description: 'Rain closure' },
  { id: 'd-2', type: 'absence', description: 'Absent talent', targetId: 'p-3' }
];

const initialState = {
  locations: SEED_LOCATIONS,
  personas: SEED_PERSONAS,
  resources: SEED_RESOURCES,
  shots: SEED_SHOTS,
  releases: SEED_RELEASES,
  disruptions: SEED_DISRUPTIONS,
  handoffs: [],
  branches: [],
  currentBranchId: 'main',
  activeDisruption: null,
};

export const useStore = create((set) => ({
  ...initialState,
  moveShot: (shotId, updates) => set((state) => ({
    shots: state.shots.map(s => s.id === shotId ? { ...s, ...updates } : s)
  })),
  scheduleShot: (shotId, time) => set((state) => ({
    shots: state.shots.map(s => s.id === shotId ? { ...s, scheduledTime: time, status: 'scheduled' } : s)
  })),
  approveRelease: (releaseId) => set((state) => ({
    releases: state.releases.map(r => r.id === releaseId ? { ...r, status: 'approved' } : r)
  })),
  staleRelease: (releaseId) => set((state) => ({
    releases: state.releases.map(r => r.id === releaseId ? { ...r, status: 'expired' } : r)
  })),
  addHandoff: (handoff) => set((state) => ({
    handoffs: [...state.handoffs, { id: `h-${Date.now()}`, ...handoff }]
  })),
  triggerDisruption: (disruptionId) => set((state) => ({
    activeDisruption: disruptionId
  })),
  branchSchedule: (branchName) => set((state) => ({
    branches: [...state.branches, { id: `b-${Date.now()}`, name: branchName, state: { ...state } }],
    currentBranchId: `b-${Date.now()}`
  })),
  resetState: () => set(initialState)
}));
