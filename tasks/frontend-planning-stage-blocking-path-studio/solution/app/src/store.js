import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const FIXTURE = {
  stage: { width: 12, height: 8, gridSize: 1 },
  entrances: [
    { id: 'e1', name: 'Upstage left', x: 0, y: 0, width: 2, height: 0.6 },
    { id: 'e2', name: 'Upstage right', x: 10, y: 0, width: 2, height: 0.6 },
    { id: 'e3', name: 'Downstage right', x: 10, y: 7.4, width: 2, height: 0.6 },
  ],
  obstacles: [
    { id: 'o1', name: 'Sofa', x: 4, y: 4, width: 2, height: 1 },
    { id: 'o2', name: 'Table', x: 7, y: 4, width: 1.5, height: 1.5 },
    { id: 'o3', name: 'Bookshelf', x: 0.4, y: 2.2, width: 0.5, height: 3 },
  ],
  actors: [
    { id: 'a1', name: 'Alice', radius: 0.28, color: '#ff6b57' },
    { id: 'a2', name: 'Bob', radius: 0.28, color: '#45a3ff' },
    { id: 'a3', name: 'Charlie', radius: 0.28, color: '#33c69f' },
    { id: 'a4', name: 'Diana', radius: 0.28, color: '#f4b942' },
    { id: 'a5', name: 'Eve', radius: 0.28, color: '#b48cff' },
  ],
  props: [
    { id: 'p1', name: 'Lantern', radius: 0.16, color: '#ffd166' },
    { id: 'p2', name: 'Letter', radius: 0.16, color: '#e9eef7' },
    { id: 'p3', name: 'Dagger', radius: 0.16, color: '#aab4c5' },
    { id: 'p4', name: 'Key', radius: 0.16, color: '#ff9f43' },
    { id: 'p5', name: 'Book', radius: 0.16, color: '#6cc5ff' },
    { id: 'p6', name: 'Ring', radius: 0.16, color: '#d3a8ff' },
  ],
  totalBeats: 48,
};

const initialBranch = () => {
  const waypoints = {};
  FIXTURE.actors.forEach((item, index) => {
    waypoints[`${item.id}-b1`] = { entityId: item.id, beat: 1, x: 1.7 + index * 2.1, y: 2.1 + (index % 2) * 1.4, facing: 90, type: 'walk', hold: false };
  });
  FIXTURE.props.forEach((item, index) => {
    waypoints[`${item.id}-b1`] = { entityId: item.id, beat: 1, x: 1.4 + index * 1.8, y: 6.6, facing: 0, type: 'place', hold: true, custodian: null };
  });
  return { waypoints, handoffs: [], continuityEvents: [], cueAnchors: [], dialogue: [] };
};

const initialScore = () => ({
  schemaVersion: 'stage-blocking-score/v1', activeBranch: 'main', branches: { main: initialBranch() },
  rehearsals: [], reviews: [], approval: null, exportedAt: null,
});

export const useStore = create(persist((set, get) => ({
  fixture: FIXTURE,
  score: initialScore(),
  currentBeat: 1,
  selectedEntity: 'a1',
  selectedWaypoint: 'a1-b1',
  activeTool: 'select',
  analysisFindings: [],
  feedbackMessage: '',
  sortDirection: 'asc',
  filter: 'all',
  sidebarOpen: true,
  theme: 'dark',
  density: 'comfortable',
  onboardingSeen: false,
  setBeat: (currentBeat) => set({ currentBeat }),
  selectEntity: (selectedEntity) => set({ selectedEntity }),
  selectWaypoint: (selectedWaypoint) => set({ selectedWaypoint }),
  setTool: (activeTool) => set({ activeTool }),
  setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),
  setAnalysisFindings: (analysisFindings) => set({ analysisFindings }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setFilter: (filter) => set({ filter }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => set({ theme }),
  setDensity: (density) => set({ density }),
  setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),
  addWaypoint: (data) => set((state) => {
    const branch = state.score.branches[state.score.activeBranch];
    const key = `${data.entityId}-b${data.beat}`;
    return { score: { ...state.score, approval: null, branches: { ...state.score.branches, [state.score.activeBranch]: { ...branch, waypoints: { ...branch.waypoints, [key]: data } } } }, selectedEntity: data.entityId, selectedWaypoint: key, currentBeat: data.beat };
  }),
  updateWaypoint: (key, data) => set((state) => {
    const branch = state.score.branches[state.score.activeBranch];
    if (!branch.waypoints[key]) return {};
    const updated = { ...branch.waypoints[key], ...data };
    const nextKey = data.beat && data.beat !== branch.waypoints[key].beat ? `${updated.entityId}-b${data.beat}` : key;
    const waypoints = { ...branch.waypoints };
    delete waypoints[key];
    waypoints[nextKey] = updated;
    return { score: { ...state.score, approval: null, branches: { ...state.score.branches, [state.score.activeBranch]: { ...branch, waypoints } } }, selectedWaypoint: nextKey, currentBeat: updated.beat };
  }),
  removeWaypoint: (key) => set((state) => {
    const branch = state.score.branches[state.score.activeBranch];
    const waypoints = { ...branch.waypoints };
    delete waypoints[key];
    const next = Object.keys(waypoints)[0] || null;
    return { score: { ...state.score, approval: null, branches: { ...state.score.branches, [state.score.activeBranch]: { ...branch, waypoints } } }, selectedWaypoint: next, selectedEntity: next ? waypoints[next].entityId : null };
  }),
  addHandoff: (data) => set((state) => {
    const branch = state.score.branches[state.score.activeBranch];
    return { score: { ...state.score, branches: { ...state.score.branches, [state.score.activeBranch]: { ...branch, handoffs: [...branch.handoffs, data] } } } };
  }),
  createBranch: (name, from) => set((state) => ({ score: { ...state.score, branches: { ...state.score.branches, [name]: structuredClone(state.score.branches[from || state.score.activeBranch]) }, activeBranch: name } })),
  checkoutBranch: (name) => set((state) => ({ score: { ...state.score, activeBranch: name } })),
  addRehearsalEvent: (event) => set((state) => ({ score: { ...state.score, rehearsals: [...state.score.rehearsals, event] } })),
  approveScore: () => set((state) => ({ score: { ...state.score, approval: { at: new Date().toISOString(), branch: state.score.activeBranch } } })),
  analyze: () => {
    const state = get();
    const points = Object.values(state.score.branches[state.score.activeBranch].waypoints).filter((w) => w.beat === state.currentBeat);
    const findings = [];
    points.forEach((a, index) => points.slice(index + 1).forEach((b) => {
      if (Math.hypot(a.x - b.x, a.y - b.y) < 0.65) findings.push(`Collision risk: ${a.entityId} and ${b.entityId} at beat ${state.currentBeat}`);
    }));
    if (!findings.length) findings.push(`Sightlines and access clear at beat ${state.currentBeat}`);
    set({ analysisFindings: findings });
    return findings;
  },
  exportState: () => JSON.stringify({ ...get().score, exportedAt: new Date().toISOString() }, null, 2),
  importState: (value) => {
    const parsed = JSON.parse(value);
    if (parsed.schemaVersion !== 'stage-blocking-score/v1' || !parsed.branches) throw new Error('Choose a valid Stage Blocking Score JSON file.');
    set({ score: parsed, selectedEntity: null, selectedWaypoint: null });
  },
  reset: () => set({ score: initialScore(), currentBeat: 1, selectedEntity: 'a1', selectedWaypoint: 'a1-b1', activeTool: 'select', analysisFindings: [], feedbackMessage: '', filter: 'all', sortDirection: 'asc' }),
}), {
  name: 'stage-blocking-storage',
  partialize: ({ score, activeTool, currentBeat, selectedEntity, selectedWaypoint, sortDirection, filter, sidebarOpen, theme, density, onboardingSeen }) => ({ score, activeTool, currentBeat, selectedEntity, selectedWaypoint, sortDirection, filter, sidebarOpen, theme, density, onboardingSeen }),
}));
